import { ArrowLeft, ArrowRight, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../services/supabase.js";

export default function AuthPage() {
  const { configured } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("recovery") === "1" ? "update" : "login");
  const [form, setForm] = useState({ fullName: "", institution: "", email: "", password: "", confirmPassword: "" });
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
        const { error: authError } = await supabase.auth.signUp({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          options: {
            emailRedirectTo: "https://z80403125-star.github.io/economy-ai/auth-callback.html",
            data: {
              full_name: form.fullName.trim(),
              institution: form.institution.trim(),
            },
          },
        });
        if (authError) throw authError;
        setMessage("Заявка отправлена. Подтвердите электронную почту; преподавательский доступ появится после одобрения администратора.");
      } else if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email.trim().toLowerCase(), {
          redirectTo: "https://z80403125-star.github.io/economy-ai/auth-callback.html",
        });
        if (resetError) throw resetError;
        setMessage("Если адрес зарегистрирован, на него придёт письмо для восстановления пароля.");
      } else if (mode === "update") {
        if (form.password !== form.confirmPassword) throw new Error("Пароли не совпадают.");
        const { error: updateError } = await supabase.auth.updateUser({ password: form.password });
        if (updateError) throw updateError;
        setMode("success");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
        if (authError) throw authError;
        navigate("/");
      }
    } catch (submitError) {
      setError(submitError.message || "Не удалось выполнить запрос. Попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  const isRecovery = mode === "update";
  const title = mode === "register"
    ? "Заявка преподавателя"
    : mode === "reset"
      ? "Восстановление пароля"
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
            ? "Укажите электронную почту и данные профиля. Заявку одобрит администратор."
            : mode === "reset"
              ? "Укажите электронную почту, связанную с аккаунтом."
            : isRecovery
              ? "Придумайте новый пароль длиной не менее 8 символов."
              : mode === "success"
                ? "Новый пароль сохранён. Теперь можно перейти в аккаунт."
                : "Войдите по электронной почте и паролю."}
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
            {mode !== "update" && (
              <label>Электронная почта
                <span className="input-with-icon">
                  <Mail size={16} />
                  <input
                    autoComplete="email"
                    name="email"
                    onChange={update}
                    required
                    type="email"
                    value={form.email}
                  />
                </span>
              </label>
            )}
            {mode !== "update" && mode !== "reset" && (
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
              {busy ? "Подождите…" : mode === "register" ? "Отправить заявку" : mode === "reset" ? "Отправить ссылку" : isRecovery ? "Сохранить пароль" : "Войти"}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>
        )}

        <div className="auth-switches">
          {mode === "login" && <button onClick={() => { setError(""); setMessage(""); setMode("reset"); }} type="button">Забыли пароль?</button>}
          {(mode === "login" || mode === "register" || mode === "reset") && (
            <button onClick={() => { setError(""); setMessage(""); setMode(mode === "login" ? "register" : "login"); }} type="button">
              {mode === "login" ? "Регистрация преподавателя" : "Назад ко входу"}
            </button>
          )}
          {isRecovery && <button onClick={() => { setError(""); setMessage(""); setMode("login"); }} type="button">Назад ко входу</button>}
        </div>
        <p className="auth-privacy">Роль администратора нельзя получить через эту форму.</p>
      </section>
    </main>
  );
}
