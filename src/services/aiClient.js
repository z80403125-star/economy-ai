const DEFAULT_AI_URL = "/api/ai/chat";

export async function callAi({ accessToken, messages, action, topic, count, difficulty }) {
  const apiUrl = import.meta.env.VITE_AI_API_URL || DEFAULT_AI_URL;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ messages, action, topic, count, difficulty }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || "Не удалось получить ответ ИИ.");
  }
  if (typeof body?.content !== "string" || !body.content.trim()) {
    throw new Error("Сервис ИИ вернул пустой ответ.");
  }
  return body.content.trim();
}
