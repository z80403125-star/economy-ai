import { LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../services/supabase.js";

export default function ProfilePage() {
  const { configured, session, profile, loading, error } = useAuth();
  const [logoutError, setLogoutError] = useState("");

  async function signOut() {
    if (!supabase) return;
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setLogoutError("");
    } catch {
      setLogoutError("Не удалось выйти из аккаунта. Попробуйте ещё раз.");
    }
  }

  if (!configured) {
    return (
      <div className="page-stack">
        <PageTitle title="Личный кабинет" subtitle="Профиль и доступ к функциям платформы." />
        <div className="config-warning">Чтобы включить аккаунты, сначала подключите проект Supabase в настройках окружения.</div>
        <Link className="button button-secondary" to="/auth">Перейти ко входу</Link>
      </div>
    );
  }
  if (loading) return <div className="loading-panel">Проверяем аккаунт…</div>;
  if (!session) {
    return (
      <div className="page-stack">
        <PageTitle title="Личный кабинет" subtitle="Войдите, чтобы просмотреть профиль." />
        <Link className="button button-primary" to="/auth">Войти в аккаунт</Link>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageTitle title="Личный кабинет" subtitle="Данные профиля загружаются из Supabase." />
      {error && <div className="form-alert error" role="alert">{error}</div>}
      <section className="profile-card">
        <div className="profile-large-avatar"><UserRound size={25} /></div>
        <div className="profile-details">
          <p className="eyebrow">ПРОФИЛЬ</p>
          <h2>{profile?.full_name || "Имя не указано"}</h2>
          <p><Mail size={15} />{session.user.email}</p>
          <p><ShieldCheck size={15} />{statusLabel(profile?.role, profile?.status)}</p>
          {profile?.institution && <p>{profile.institution}</p>}
        </div>
        <button className="button button-secondary" onClick={signOut} type="button"><LogOut size={16} /> Выйти</button>
      </section>
      {logoutError && <div className="form-alert error" role="alert">{logoutError}</div>}
      {profile?.status === "pending" && (
        <div className="config-warning" role="status">Заявка на преподавательский доступ ожидает одобрения администратора.</div>
      )}
      {!profile && <div className="form-alert error" role="alert">Профиль не найден. Обратитесь к администратору платформы.</div>}
    </div>
  );
}

function PageTitle({ title, subtitle }) {
  return <section className="page-heading"><p className="eyebrow">АККАУНТ</p><h1>{title}</h1><p>{subtitle}</p></section>;
}

function statusLabel(role, status) {
  if (role === "admin") return "Администратор";
  if (role === "teacher" && status === "approved") return "Преподаватель · доступ подтверждён";
  if (role === "teacher" && status === "pending") return "Преподаватель · ожидает одобрения";
  if (status === "blocked") return "Аккаунт заблокирован";
  return "Ученик";
}
