import { ArrowUpRight, Check, Copy, FileQuestion, Play } from "lucide-react";
import { useState } from "react";

export default function TestCard({ test, questionCount }) {
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const shareUrl = new URL(test.url, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setMessage("Ссылка скопирована.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setMessage("Не удалось скопировать ссылку. Скопируйте её из адресной строки теста.");
    }
  }

  return (
    <article className="test-card">
      <div className="test-card-top">
        <div className="test-icon"><FileQuestion size={20} /></div>
        <span className="category-pill">{test.category}</span>
      </div>
      <h3>{test.title}</h3>
      <p className="test-description">{test.description}</p>
      <div className="test-meta">
        <span><FileQuestion size={15} />{questionCount.status === "ready" ? `${questionCount.count} вопросов` : questionCount.status === "error" ? "Не удалось определить" : "Считаем вопросы…"}</span>
        <span className="meta-separator" />
        <span>3 варианта ответа</span>
      </div>
      {questionCount.status === "error" && (
        <p className="inline-error" role="status">{questionCount.message}</p>
      )}
      <div className="test-card-actions">
        <a
          className="button button-primary button-small"
          href={test.url}
          rel="noreferrer"
          target="_blank"
        >
          <Play size={15} fill="currentColor" /> Открыть тест <ArrowUpRight size={15} />
        </a>
        <button
          aria-label={`Скопировать ссылку: ${test.title}`}
          className={`button button-secondary button-small copy-button${copied ? " copied" : ""}`}
          onClick={copyLink}
          type="button"
        >
          {copied ? <Check size={16} /> : <Copy size={15} />}
          <span>{copied ? "Скопировано" : "Скопировать"}</span>
        </button>
      </div>
      {message && <span aria-live="polite" className="sr-only">{message}</span>}
    </article>
  );
}
