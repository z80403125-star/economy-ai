import { createClient } from "@supabase/supabase-js";

function isAllowedOrigin(origin) {
  return Boolean(origin) && (
    origin === (process.env.AI_ALLOWED_ORIGIN || "https://z80403125-star.github.io") ||
    origin === "http://localhost:5173" ||
    origin === "http://127.0.0.1:5173"
  );
}

export default async function handler(request, response) {
  const origin = request.headers.origin;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (isAllowedOrigin(origin)) response.setHeader("Access-Control-Allow-Origin", origin);

  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Поддерживается только POST-запрос." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return response.status(503).json({ error: "Сброс пароля не настроен на сервере." });
  }

  let body = request.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return response.status(400).json({ error: "Некорректный запрос." });
    }
  }

  const userId = typeof body?.userId === "string" ? body.userId : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId) ||
    password.length < 8 ||
    password.length > 128
  ) {
    return response.status(400).json({ error: "Укажите аккаунт и пароль длиной от 8 до 128 символов." });
  }

  const accessToken = (request.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!accessToken) return response.status(401).json({ error: "Войдите как администратор." });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: requesterData, error: requesterError } = await adminClient.auth.getUser(accessToken);
    if (requesterError || !requesterData.user) {
      return response.status(401).json({ error: "Сеанс завершён. Войдите снова." });
    }

    const { data: requesterProfile, error: requesterProfileError } = await adminClient
      .from("profiles")
      .select("role, status")
      .eq("id", requesterData.user.id)
      .maybeSingle();
    if (requesterProfileError) {
      console.error("Password reset admin lookup failed", requesterProfileError.message);
      return response.status(503).json({ error: "Не удалось проверить права администратора." });
    }
    if (requesterProfile?.role !== "admin" || requesterProfile.status !== "approved") {
      return response.status(403).json({ error: "Сброс паролей доступен только одобренному администратору." });
    }

    const { data: targetProfile, error: targetError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (targetError) {
      console.error("Password reset target lookup failed", targetError.message);
      return response.status(503).json({ error: "Не удалось найти аккаунт." });
    }
    if (!targetProfile) return response.status(404).json({ error: "Аккаунт не найден." });

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, { password });
    if (updateError) {
      console.error("Admin password reset failed", updateError.message);
      return response.status(400).json({ error: "Supabase не принял пароль. Используйте пароль длиной не менее 8 символов." });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Admin password reset failed", error.message);
    return response.status(503).json({ error: "Не удалось сбросить пароль. Попробуйте позже." });
  }
}
