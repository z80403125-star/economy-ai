import { Bot, Send, Sparkles, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Assistant() {
  const { configured, session, profile, loading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

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
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Не удалось получить ответ.");
      if (typeof result.content !== "string" || !result.content.trim()) {
        throw new Error("Сервис ИИ вернул пустой ответ.");
      }
      setMessages((current) => [...current, { role: "assistant", content: result.content }]);
    } catch (requestError) {
      setError(requestError.message || "Не удалось связаться с ИИ-помощником.");
      inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <section className="access-panel">
        <p className="eyebrow">НАСТРОЙКА ИИ</p>
        <h1>ИИ-помощник</h1>
        <p>Сначала настройте Supabase Auth и серверные параметры ИИ и ограничения запросов.</p>
      </section>
    );
  }
  if (loading) return <div className="loading-panel">Проверяем доступ…</div>;
  if (!session) {
    return (
      <section className="access-panel">
        <p className="eyebrow">ТРЕБУЕТСЯ ВХОД</p>
        <h1>ИИ-помощник</h1>
        <p>Войдите в подтверждённый аккаунт преподавателя, чтобы открыть помощника.</p>
        <Link className="button button-primary" to="/auth">Войти</Link>
      </section>
    );
  }
  if (!profile || profile.status !== "approved" || !["teacher", "admin"].includes(profile.role)) {
    return (
      <section className="access-panel">
        <p className="eyebrow">ДОСТУП ОГРАНИЧЕН</p>
        <h1>ИИ-помощник</h1>
        <p>Раздел доступен только одобренным преподавателям.</p>
        <Link className="button button-secondary" to="/profile">Проверить профиль</Link>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">УЧЕБНЫЙ ИНСТРУМЕНТ</p>
        <h1>ИИ-помощник</h1>
        <p>Задайте вопрос по экономике. Ответы формируются сервером; секретный ключ не передаётся в браузер.</p>
      </section>
      <section aria-label="Чат с ИИ-помощником" className="assistant-panel">
        <div className="assistant-heading">
          <div className="assistant-avatar"><Bot size={20} /></div>
          <div><strong>Помощник ECONOMY AI</strong><span>Учебные объяснения простыми словами</span></div>
          <span className="assistant-secure"><Sparkles size={14} /> Серверный запрос</span>
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
