import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FilePlus2, Sparkles } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";
import { callAi } from "../services/aiClient.js";

function parseTestJson(content) {
  const clean = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(clean);
  if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("ИИ вернул тест в неожиданном формате.");
  }

  return parsed.questions.map((question, index) => ({
    prompt: String(question.prompt || "").trim(),
    options: Array.isArray(question.options) ? question.options.map((option) => String(option).trim()) : [],
    correctIndex: Number.isInteger(question.correctIndex)
      ? question.correctIndex
      : Number(question.correct_index),
    explanation: String(question.explanation || "").trim(),
  })).filter((question, index, questions) =>
    question.prompt &&
    question.options.length >= 2 &&
    question.correctIndex >= 0 &&
    question.correctIndex < question.options.length &&
    questions.findIndex((item) => item.prompt === question.prompt) === index
  );
}

export default function TestGenerator() {
  const { configured, session, profile, loading } = useAuth();
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("Средний");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([]);

  const validAccess = useMemo(
    () => profile?.status === "approved" && ["teacher", "admin"].includes(profile.role),
    [profile],
  );

  async function generate(event) {
    event.preventDefault();
    const normalizedTopic = topic.trim();
    if (!normalizedTopic || normalizedTopic.length < 2) {
      setError("Укажите тему теста.");
      return;
    }
    if (!configured) {
      setError("Для генерации нужно настроить Supabase.");
      return;
    }
    if (!session) {
      setError("Войдите в аккаунт для генерации теста.");
      return;
    }
    if (!validAccess) {
      setError("Генератор тестов доступен одобренным преподавателям и администраторам.");
      return;
    }

    setBusy(true);
    setError("");
    setQuestions([]);
    setTitle("");

    try {
      const content = await callAi({
        accessToken: session.access_token,
        action: "generate_test",
        topic: normalizedTopic,
        count: Number(count),
        difficulty,
      });
      const clean = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(clean);
      const generatedQuestions = parseTestJson(content);
      if (generatedQuestions.length === 0) throw new Error("ИИ не создал подходящие вопросы.");
      setTitle(String(parsed.title || `Тест: ${normalizedTopic}`).trim());
      setQuestions(generatedQuestions);
    } catch (requestError) {
      setError(requestError instanceof SyntaxError
        ? "ИИ вернул ответ не в формате теста. Попробуйте сформулировать тему точнее."
        : requestError.message || "Не удалось создать тест.");
    } finally {
      setBusy(false);
    }
  }

  function copyTest() {
    const text = `${title}\n\n${questions.map((question, index) =>
      `${index + 1}. ${question.prompt}\n${question.options.map((option, optionIndex) =>
        `${String.fromCharCode(65 + optionIndex)}. ${option}`).join("\n")}\nПравильный ответ: ${String.fromCharCode(65 + question.correctIndex)}\nОбъяснение: ${question.explanation}`
    ).join("\n\n")}`;
    navigator.clipboard?.writeText(text);
  }

  if (!configured) {
    return (
      <section className="access-panel">
        <p className="eyebrow">НАСТРОЙКА</p>
        <h1>Генератор тестов</h1>
        <p>Для защищённой генерации нужно настроить Supabase и серверный ИИ.</p>
      </section>
    );
  }
  if (loading) return <div className="loading-panel">Проверяем права доступа…</div>;
  if (!session) {
    return (
      <section className="access-panel">
        <p className="eyebrow">ТРЕБУЕТСЯ ВХОД</p>
        <h1>Генератор тестов</h1>
        <p>Войдите в аккаунт, чтобы создать тест с помощью ИИ.</p>
        <Link className="button button-primary" to="/auth">Войти</Link>
      </section>
    );
  }
  if (!validAccess) {
    return (
      <section className="access-panel">
        <p className="eyebrow">ДОСТУП ОГРАНИЧЕН</p>
        <h1>Генератор тестов</h1>
        <p>
          {profile?.status === "pending"
            ? "Заявка преподавателя ожидает одобрения администратора."
            : "Генератор доступен одобренным преподавателям и администраторам."}
        </p>
        <Link className="button button-secondary" to="/profile">Открыть профиль</Link>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">ИИ-СОЗДАНИЕ ТЕСТОВ</p>
        <h1>Генератор тестов</h1>
        <p>Создайте вопросы с вариантами ответов и пояснениями по выбранной теме.</p>
      </section>

      <form className="generator-form" onSubmit={generate}>
        <label>
          Тема теста
          <input
            maxLength={200}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Например: спрос и предложение"
            value={topic}
          />
        </label>
        <label>
          Количество вопросов
          <input
            max="20"
            min="3"
            onChange={(event) => setCount(event.target.value)}
            type="number"
            value={count}
          />
        </label>
        <label>
          Сложность
          <select onChange={(event) => setDifficulty(event.target.value)} value={difficulty}>
            <option>Лёгкая</option>
            <option>Средняя</option>
            <option>Повышенная</option>
          </select>
        </label>
        <button className="button button-primary" disabled={busy} type="submit">
          <Sparkles size={16} /> {busy ? "Создаём тест…" : "Сгенерировать тест"}
        </button>
      </form>

      {error && <div className="form-alert error" role="alert">{error}</div>}

      {questions.length > 0 && (
        <section className="generator-result">
          <div className="generator-result-heading">
            <div>
              <p className="eyebrow">РЕЗУЛЬТАТ</p>
              <h2><FilePlus2 size={18} /> {title}</h2>
            </div>
            <button className="button button-secondary" onClick={copyTest} type="button">Копировать текст</button>
          </div>
          {questions.map((question, index) => (
            <article className="generated-question" key={`${question.prompt}-${index}`}>
              <h3>{index + 1}. {question.prompt}</h3>
              <ol type="A">
                {question.options.map((option, optionIndex) => (
                  <li className={optionIndex === question.correctIndex ? "correct-option" : ""} key={optionIndex}>
                    {option}
                  </li>
                ))}
              </ol>
              {question.explanation && <p><strong>Объяснение:</strong> {question.explanation}</p>}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
