import { ArrowLeft, ArrowRight, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../services/supabase.js";

export default function AuthPage() {
  const { configured } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", institution: "", email: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
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
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: form.fullName.trim(), institution: form.institution.trim() },
          },
        });
        if (authError) throw authError;
        setMessage("Заявка отправлена. Подтвердите электронную почту; преподавательский доступ появится после одобрения администратора.");
      } else if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (resetError) throw resetError;
        setMessage("Если адрес зарегистрирован, на него придёт письмо для восстановления пароля.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: form.email,
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

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="back-link" to="/"><ArrowLeft size={16} /> На главную</Link>
        <div className="auth-mark"><ShieldCheck size={23} /></div>
        <p className="eyebrow">ECONOMY AI</p>
        <h1>{mode === "register" ? "Заявка преподавателя" : mode === "reset" ? "Восстановление пароля" : "С возвращением"}</h1>
        <p className="auth-subtitle">
          {mode === "register"
            ? "После подтверждения почты аккаунт будет ожидать одобрения администратора."
            : mode === "reset"
              ? "Укажите электронную почту, связанную с аккаунтом."
              : "Войдите в аккаунт преподавателя или администратора."}
        </p>

        {!configured && (
          <div className="config-warning" role="status">
            Supabase пока не настроен. Форма станет рабочей после добавления URL и публичного ключа проекта в `.env`.
          </div>
        )}
        {error && <div className="form-alert error" role="alert">{error}</div>}
        {message && <div className="form-alert success" role="status">{message}</div>}

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>ФИО<input autoComplete="name" name="fullName" onChange={update} required value={form.fullName} /></label>
              <label>Учебное заведение<input autoComplete="organization" name="institution" onChange={update} required value={form.institution} /></label>
            </>
          )}
          <label>Электронная почта
            <span className="input-with-icon"><Mail size={16} /><input autoComplete="email" name="email" onChange={update} required type="email" value={form.email} /></span>
          </label>
          {mode !== "reset" && (
            <label>Пароль
              <span className="input-with-icon"><KeyRound size={16} /><input autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={8} name="password" onChange={update} required type="password" value={form.password} /></span>
            </label>
          )}
          {mode === "register" && (
            <label>Повторите пароль<input autoComplete="new-password" minLength={8} name="confirmPassword" onChange={update} required type="password" value={form.confirmPassword} /></label>
          )}
          <button className="button button-primary auth-submit" disabled={busy || !configured} type="submit">
            {busy ? "Подождите…" : mode === "register" ? "Отправить заявку" : mode === "reset" ? "Отправить ссылку" : "Войти"}
            {!busy && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="auth-switches">
          {mode === "login" && <button onClick={() => { setError(""); setMessage(""); setMode("reset"); }} type="button">Забыли пароль?</button>}
          {mode !== "register" && <button onClick={() => { setError(""); setMessage(""); setMode("register"); }} type="button">Регистрация преподавателя</button>}
          {mode !== "login" && <button onClick={() => { setError(""); setMessage(""); setMode("login"); }} type="button">Назад ко входу</button>}
        </div>
        <p className="auth-privacy">Роль администратора нельзя получить через эту форму.</p>
      </section>
    </main>
  );
}
