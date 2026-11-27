import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,23}$/;

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
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rateLimitUrl = process.env.UPSTASH_REDIS_REST_URL;
  const rateLimitToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !rateLimitUrl || !rateLimitToken) {
    return response.status(503).json({ error: "Сервис входа не настроен. Обратитесь к администратору." });
  }

  let body = request.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return response.status(400).json({ error: "Некорректный запрос." });
    }
  }

  const login = typeof body?.login === "string" ? body.login.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const isLegacyEmail = login.includes("@");
  if (
    (!isLegacyEmail && !USERNAME_PATTERN.test(login)) ||
    !password ||
    password.length > 128
  ) {
    return response.status(400).json({ error: "Проверьте логин и пароль." });
  }

  try {
    const clientIp = String(request.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
    const ipHash = createHash("sha256").update(clientIp).digest("hex");
    const loginHash = createHash("sha256").update(login).digest("hex");
    const rateLimitResponse = await fetch(`${rateLimitUrl.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${rateLimitToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", `economy-ai:login:ip:${ipHash}`],
        ["EXPIRE", `economy-ai:login:ip:${ipHash}`, 60],
        ["INCR", `economy-ai:login:name:${loginHash}`],
        ["EXPIRE", `economy-ai:login:name:${loginHash}`, 60],
      ]),
    });
    if (!rateLimitResponse.ok) {
      console.error("Login rate limit service failed", rateLimitResponse.status);
      return response.status(503).json({ error: "Сервис входа временно недоступен." });
    }

    const rateResults = await rateLimitResponse.json();
    const ipCount = Number(rateResults?.[0]?.result);
    const loginCount = Number(rateResults?.[2]?.result);
    if (
      !Array.isArray(rateResults) ||
      rateResults.some((result) => result?.error) ||
      !Number.isInteger(ipCount) ||
      !Number.isInteger(loginCount)
    ) {
      console.error("Login rate limit service returned an invalid response");
      return response.status(503).json({ error: "Сервис входа временно недоступен." });
    }
    if (ipCount > 30 || loginCount > 8) {
      return response.status(429).json({ error: "Слишком много попыток. Попробуйте через минуту." });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let authEmail = isLegacyEmail ? login : `unknown@accounts.economy-ai.invalid`;
    let accountFound = isLegacyEmail;
    if (!isLegacyEmail) {
      const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("id")
        .eq("username", login)
        .maybeSingle();
      if (profileError) {
        console.error("Username lookup failed", profileError.message);
        return response.status(503).json({ error: "Не удалось выполнить вход. Попробуйте позже." });
      }

      if (profile) {
        const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(profile.id);
        if (userError) {
          console.error("Auth user lookup failed", userError.message);
          return response.status(503).json({ error: "Не удалось выполнить вход. Попробуйте позже." });
        }
        if (userData.user?.email) {
          authEmail = userData.user.email;
          accountFound = true;
        }
      }
    }

    const { data, error: authError } = await authClient.auth.signInWithPassword({
      email: authEmail,
      password,
    });
    if (authError || !accountFound || !data.session) {
      return response.status(401).json({ error: "Неверный логин или пароль." });
    }

    return response.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (error) {
    console.error("Username login failed", error.message);
    return response.status(503).json({ error: "Не удалось выполнить вход. Попробуйте позже." });
  }
}
