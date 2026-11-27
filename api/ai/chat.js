import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 6000;
const RATE_LIMIT_PER_MINUTE = 15;

export default async function handler(request, response) {
  const origin = request.headers.origin;
  const allowedOrigin = process.env.AI_ALLOWED_ORIGIN || "https://z80403125-star.github.io";
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (
    origin &&
    (origin === allowedOrigin ||
      origin === "http://localhost:5173" ||
      origin === "http://127.0.0.1:5173")
  ) {
    response.setHeader("Access-Control-Allow-Origin", origin);
  }
  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Поддерживается только POST-запрос." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !supabaseUrl || !serviceRoleKey) {
    return response.status(503).json({
      error: "ИИ-помощник не настроен: администратору нужно добавить серверные параметры.",
    });
  }

  let requestBody = request.body;
  if (typeof requestBody === "string") {
    try {
      requestBody = JSON.parse(requestBody);
    } catch {
      return response.status(400).json({ error: "Некорректный JSON-запрос." });
    }
  }
  const messages = requestBody?.messages;
  const action = requestBody?.action;
  const topic = typeof requestBody?.topic === "string" ? requestBody.topic.trim() : "";
  const count = Number(requestBody?.count);
  const difficulty = typeof requestBody?.difficulty === "string"
    ? requestBody.difficulty.trim()
    : "Средний";

  if (action === "generate_test") {
    if (topic.length < 2 || topic.length > 200 || !Number.isInteger(count) || count < 3 || count > 20) {
      return response.status(400).json({ error: "Укажите тему и от 3 до 20 вопросов." });
    }
  } else if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    messages.some(
      (message) =>
        !message ||
        !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" ||
        message.content.trim().length === 0 ||
        message.content.length > MAX_MESSAGE_LENGTH,
    )
  ) {
    return response.status(400).json({ error: "Проверьте сообщения и попробуйте ещё раз." });
  }

  const authorization = request.headers.authorization || "";
  const accessToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!accessToken) {
    return response.status(401).json({ error: "Войдите в аккаунт, чтобы пользоваться ИИ-помощником." });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await adminClient.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return response.status(401).json({ error: "Сеанс завершён. Войдите в аккаунт снова." });
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role, status")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError) {
    console.error("AI profile lookup failed", profileError.message);
    return response.status(503).json({ error: "Не удалось проверить доступ к ИИ-помощнику." });
  }
  if (!profile || profile.status !== "approved") {
    return response.status(403).json({ error: "ИИ-помощник доступен только одобренным аккаунтам." });
  }
  if (action === "generate_test" && !["teacher", "admin"].includes(profile.role)) {
    return response.status(403).json({ error: "Генератор тестов доступен только одобренным преподавателям." });
  }

  const rateLimitUrl = process.env.UPSTASH_REDIS_REST_URL;
  const rateLimitToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!rateLimitUrl || !rateLimitToken) {
    return response.status(503).json({
      error: "ИИ-помощник не включён: администратору нужно настроить ограничение запросов.",
    });
  }

  try {
    const userKey = createHash("sha256").update(userData.user.id).digest("hex");
    const rateLimitResponse = await fetch(`${rateLimitUrl.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${rateLimitToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", `economy-ai:assistant:${userKey}`],
        ["EXPIRE", `economy-ai:assistant:${userKey}`, 60],
      ]),
    });
    if (!rateLimitResponse.ok) {
      console.error("AI rate limit service failed", rateLimitResponse.status);
      return response.status(503).json({ error: "Не удалось проверить ограничение запросов." });
    }

    const rateLimitResult = await rateLimitResponse.json();
    const requestCount = Number(rateLimitResult?.[0]?.result);
    if (
      !Array.isArray(rateLimitResult) ||
      rateLimitResult[0]?.error ||
      rateLimitResult[1]?.error ||
      !Number.isInteger(requestCount) ||
      requestCount < 1
    ) {
      console.error("AI rate limit service returned an invalid response");
      return response.status(503).json({ error: "Не удалось проверить ограничение запросов." });
    }
    if (requestCount > RATE_LIMIT_PER_MINUTE) {
      return response.status(429).json({ error: "Слишком много запросов. Попробуйте через минуту." });
    }
  } catch (error) {
    console.error("AI rate limit request failed", error.message);
    return response.status(503).json({ error: "Не удалось проверить ограничение запросов." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: action === "generate_test"
          ? [
              {
                role: "system",
                content:
                  "Ты — составитель учебных тестов по экономике. Создай строго валидный JSON без Markdown и пояснений вне JSON. Формат: {\"title\":\"...\",\"questions\":[{\"prompt\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"correctIndex\":0,\"explanation\":\"...\"}]}. Количество вариантов — 4, правильный индекс от 0 до 3. Вопросы должны быть однозначными и фактически корректными.",
              },
              {
                role: "user",
                content: `Составь тест на тему «${topic}». Количество вопросов: ${count}. Сложность: ${difficulty}. Ответы и объяснения дай на русском языке.`,
              },
            ]
          : [
              {
                role: "system",
                content:
                  "Ты — универсальный учебный помощник по экономике и смежным темам. Отвечай на русском языке ясно и по существу. Для сложных вопросов объясняй пошагово, отделяй факты от предположений и не выдавай готовые решения теста до завершения попытки.",
              },
              ...messages.map(({ role, content }) => ({ role, content: content.trim() })),
            ],
        temperature: 0.4,
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const providerBody = await upstream.json().catch(() => null);
      console.error("AI provider request failed", {
        status: upstream.status,
        code: providerBody?.error?.code,
      });
      return response.status(502).json({
        error: "Сервис ИИ временно не ответил. Попробуйте позже.",
      });
    }

    const result = await upstream.json();
    const content = result.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) {
      console.error("AI provider returned an empty response");
      return response.status(502).json({ error: "Сервис ИИ вернул пустой ответ." });
    }

    return response.status(200).json({ content });
  } catch (error) {
    console.error("AI request failed", error.name === "AbortError" ? "timeout" : error.message);
    return response.status(error.name === "AbortError" ? 504 : 502).json({
      error:
        error.name === "AbortError"
          ? "Сервис ИИ не ответил вовремя. Попробуйте ещё раз."
          : "Не удалось связаться с сервисом ИИ.",
    });
  } finally {
    clearTimeout(timeout);
  }
}
