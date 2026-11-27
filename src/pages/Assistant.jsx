import { Bot, Send, Sparkles, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { callAi } from "../services/aiClient.js";

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const { session, profile, configured, loading } = useAuth();

  async function sendMessage(event) {
    event.preventDefault();
    const text = prompt.trim();
    if (!text || busy) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    if (nextMessages.length > 20) {
      setError("В одном диалоге можно отправить не более 20 сообщений. Начните новый диалог.");
      return;
    }
    setMessages(nextMessages);
    setPrompt("");
    setError("");
    setBusy(true);

    try {
      if (!configured) throw new Error("Для ИИ-помощника необходимо настроить Supabase.");
      if (loading) throw new Error("Проверяем доступ к аккаунту. Повторите запрос через секунду.");
      if (!session) throw new Error("Войдите в аккаунт, чтобы пользоваться ИИ-помощником.");
      if (!profile || profile.status !== "approved") {
        throw new Error("ИИ-помощник доступен только для одобренных аккаунтов.");
      }

      const answer = await callAi({
        accessToken: session.access_token,
        messages: nextMessages,
      });
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch (requestError) {
      setError(requestError.message || "Не удалось получить ответ ИИ.");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">УЧЕБНЫЙ ИНСТРУМЕНТ</p>
        <h1>ИИ-помощник</h1>
        <p>Задайте вопрос по экономике, учёбе или практическим задачам. Ответы формируются ИИ-сервисом.</p>
      </section>
      <section aria-label="Чат с ИИ-помощником" className="assistant-panel">
        <div className="assistant-heading">
          <div className="assistant-avatar"><Bot size={20} /></div>
          <div><strong>Помощник ECONOMY AI</strong><span>Учебные объяснения простыми словами</span></div>
          <span className="assistant-secure"><Sparkles size={14} /> Серверный ИИ</span>
          {messages.length > 0 && (
            <button className="new-chat-button" onClick={() => { setMessages([]); setError(""); }} type="button">
              Новый диалог
            </button>
          )}
        </div>
        <div aria-live="polite" className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <span className="chat-empty-icon"><Sparkles size={21} /></span>
              <h2>С чего начнём?</h2>
              <p>Спросите, например, чем выручка отличается от прибыли или как работает спрос.</p>
            </div>
          )}
          {messages.map((message, index) => (
            <article className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
              <span className="message-avatar">{message.role === "assistant" ? <Bot size={15} /> : <UserRound size={15} />}</span>
              <p>{message.content}</p>
            </article>
          ))}
          {busy && <p className="assistant-wait">Подготавливаем ответ…</p>}
        </div>
        {error && <div className="form-alert error assistant-error" role="alert">{error}</div>}
        <form className="chat-form" onSubmit={sendMessage}>
          <label className="sr-only" htmlFor="assistant-prompt">Ваш вопрос</label>
          <textarea
            id="assistant-prompt"
            maxLength={6000}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Напишите вопрос по экономике…"
            ref={inputRef}
            rows={2}
            value={prompt}
          />
          <button aria-label="Отправить вопрос" className="send-button" disabled={busy || !prompt.trim()} type="submit">
            <Send size={17} />
          </button>
          <span className="chat-hint">Ввод — отправить · Shift + ввод — новая строка</span>
        </form>
      </section>
    </div>
  );
}
