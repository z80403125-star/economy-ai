import { ArrowLeft, ArrowRight, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../services/supabase.js";

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,23}$/;

function authEmailForUsername(username) {
  return `${username}@accounts.economy-ai.invalid`;
}

export default function AuthPage() {
  const { configured } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("recovery") === "1" ? "update" : "login");
  const [form, setForm] = useState({ fullName: "", institution: "", login: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState(
    searchParams.get("verified") === "1" ? "Электронная почта подтверждена. Теперь можно войти в аккаунт." : "",
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!supabase) {
      setError("Сначала подключите Supabase: заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "register") {
        if (form.password !== form.confirmPassword) throw new Error("Пароли не совпадают.");
        const username = form.login.trim().toLowerCase();
        if (!USERNAME_PATTERN.test(username)) {
          throw new Error("Логин: от 3 до 24 символов — латинские буквы, цифры, _ или -.");
        }

        const { data, error: authError } = await supabase.auth.signUp({
          email: authEmailForUsername(username),
          password: form.password,
          options: {
            data: {
              username,
              full_name: form.fullName.trim(),
              institution: form.institution.trim(),
            },
          },
        });
        if (authError) throw authError;
        if (!data.session) {
          throw new Error("Supabase ожидает подтверждение почты. Отключите подтверждение email в настройках Auth, чтобы включить вход по логину.");
        }
        setMessage(`Аккаунт создан. Ваш логин: ${username}. Доступ преподавателя появится после одобрения администратором.`);
      } else if (mode === "update") {
        if (form.password !== form.confirmPassword) throw new Error("Пароли не совпадают.");
        const { error: updateError } = await supabase.auth.updateUser({ password: form.password });
        if (updateError) throw updateError;
        setMode("success");
      } else {
        const login = form.login.trim().toLowerCase();
        const response = await fetch(import.meta.env.VITE_AUTH_API_URL || "/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            login,
            password: form.password,
          }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || "Не удалось войти. Проверьте логин и пароль.");
        if (!result?.access_token || !result?.refresh_token) {
          throw new Error("Сервис входа вернул некорректный сеанс. Обратитесь к администратору.");
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.access_token,
          refresh_token: result.refresh_token,
        });
        if (sessionError) throw sessionError;
        navigate("/");
      }
    } catch (submitError) {
      const message = submitError.message || "Не удалось выполнить запрос. Попробуйте ещё раз.";
      setError(
        mode === "register" && /already registered|already exists|duplicate key|unique constraint/i.test(message)
          ? "Этот логин уже занят. Выберите другой."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  const isRecovery = mode === "update";
  const title = mode === "register"
    ? "Заявка преподавателя"
    : isRecovery
      ? "Новый пароль"
      : mode === "success"
        ? "Пароль изменён"
        : "С возвращением";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="back-link" to="/"><ArrowLeft size={16} /> На главную</Link>
        <div className="auth-mark"><ShieldCheck size={23} /></div>
        <p className="eyebrow">ECONOMY AI</p>
        <h1>{title}</h1>
        <p className="auth-subtitle">
          {mode === "register"
            ? "Укажите логин и данные профиля. Почта и телефон не нужны; заявку одобрит администратор."
            : isRecovery
              ? "Придумайте новый пароль длиной не менее 8 символов."
              : mode === "success"
                ? "Новый пароль сохранён. Теперь можно перейти в аккаунт."
                : "Войдите по логину и паролю. Старые аккаунты пока могут входить по прежней почте."}
        </p>

        {!configured && (
          <div className="config-warning" role="status">
            Supabase пока не настроен. Форма станет рабочей после добавления URL и публичного ключа проекта в `.env`.
          </div>
        )}
        {error && <div className="form-alert error" role="alert">{error}</div>}
        {message && <div className="form-alert success" role="status">{message}</div>}

        {mode === "success" ? (
          <Link className="button button-primary auth-submit" to="/profile">Перейти в аккаунт <ArrowRight size={16} /></Link>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && (
              <>
                <label>ФИО<input autoComplete="name" name="fullName" onChange={update} required value={form.fullName} /></label>
                <label>Учебное заведение<input autoComplete="organization" name="institution" onChange={update} required value={form.institution} /></label>
              </>
            )}
            {!isRecovery && (
              <label>Логин
                <span className="input-with-icon">
                  <UserRound size={16} />
                  <input
                    autoComplete="username"
                    maxLength={mode === "register" ? 24 : 254}
                    minLength={mode === "register" ? 3 : undefined}
                    name="login"
                    onChange={update}
                    required
                    value={form.login}
                  />
                </span>
                {mode === "register" && <small className="auth-field-hint">3–24 символа: латинские буквы, цифры, _ или -</small>}
              </label>
            )}
            {!isRecovery && (
              <label>Пароль
                <span className="input-with-icon"><KeyRound size={16} /><input autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={8} name="password" onChange={update} required type="password" value={form.password} /></span>
              </label>
            )}
            {isRecovery && (
              <label>Новый пароль
                <span className="input-with-icon"><KeyRound size={16} /><input autoComplete="new-password" minLength={8} name="password" onChange={update} required type="password" value={form.password} /></span>
              </label>
            )}
            {(mode === "register" || isRecovery) && (
              <label>Повторите пароль<input autoComplete="new-password" minLength={8} name="confirmPassword" onChange={update} required type="password" value={form.confirmPassword} /></label>
            )}
            <button className="button button-primary auth-submit" disabled={busy || !configured} type="submit">
              {busy ? "Подождите…" : mode === "register" ? "Создать заявку" : isRecovery ? "Сохранить пароль" : "Войти"}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        <div className="auth-switches">
          {mode === "login" && <span>Забыли пароль? Попросите администратора задать временный пароль.</span>}
          {(mode === "login" || mode === "register") && (
            <button onClick={() => { setError(""); setMessage(""); setMode(mode === "login" ? "register" : "login"); }} type="button">
              {mode === "login" ? "Регистрация преподавателя" : "Уже есть аккаунт? Войти"}
            </button>
          )}
          {isRecovery && <button onClick={() => { setError(""); setMessage(""); setMode("login"); }} type="button">Назад ко входу</button>}
        </div>
        <p className="auth-privacy">Роль администратора нельзя получить через эту форму.</p>
      </section>
    </main>
  );
}
