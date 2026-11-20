import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import ModuleNotice from "../components/ModuleNotice.jsx";

export default function ProtectedModule({ title, description, requiredRole }) {
  const { configured, session, profile, loading } = useAuth();

  if (!configured) {
    return (
      <ModuleNotice
        description="Для защищённого доступа нужно настроить Supabase и выполнить миграцию базы данных."
        title={title}
      />
    );
  }
  if (loading) return <div className="loading-panel">Проверяем права доступа…</div>;
  if (!session) {
    return (
      <section className="access-panel">
        <p className="eyebrow">ТРЕБУЕТСЯ ВХОД</p>
        <h1>{title}</h1>
        <p>Войдите в аккаунт, чтобы продолжить.</p>
        <Link className="button button-primary" to="/auth">Войти</Link>
      </section>
    );
  }
  if (!profile || profile.status !== "approved" || (requiredRole && profile.role !== requiredRole)) {
    return (
      <section className="access-panel">
        <p className="eyebrow">ДОСТУП ОГРАНИЧЕН</p>
        <h1>{title}</h1>
        <p>
          {profile?.status === "pending"
            ? "Заявка преподавателя ожидает одобрения администратора."
            : "У вашего аккаунта нет доступа к этому разделу."}
        </p>
        <Link className="button button-secondary" to="/profile">Открыть профиль</Link>
      </section>
    );
  }

  return <ModuleNotice description={description} title={title} />;
}
