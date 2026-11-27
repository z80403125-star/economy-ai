import { RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../services/supabase.js";

export default function AdminPanel() {
  const { session } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [resetTarget, setResetTarget] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [passwordResetBusy, setPasswordResetBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("id, full_name, institution, role, status, created_at")
        .order("created_at", { ascending: false });

      if (queryError) {
        setError(`Не удалось загрузить аккаунты: ${queryError.message}`);
      } else {
        setProfiles(data || []);
      }
    } catch (queryError) {
      setError(`Не удалось загрузить аккаунты: ${queryError.message || "ошибка соединения."}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  async function changeStatus(profile, status) {
    setBusyId(profile.id);
    setError("");
    setNotice("");

    try {
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", profile.id)
        .select("id")
        .maybeSingle();

      if (updateError) {
        setError(`Не удалось изменить статус аккаунта: ${updateError.message}`);
      } else if (!updatedProfile) {
        setError("Статус не изменён: аккаунт не найден или нет прав на изменение.");
      } else {
        setProfiles((current) => current.map((item) => (
          item.id === profile.id ? { ...item, status } : item
        )));
        setNotice(`Статус аккаунта «${profile.full_name}» изменён.`);
      }
    } catch (updateError) {
      setError(`Не удалось изменить статус аккаунта: ${updateError.message || "ошибка соединения."}`);
    } finally {
      setBusyId("");
    }
  }

  async function resetAccountPassword(profile, event) {
    event.preventDefault();
    if (temporaryPassword.length < 8 || temporaryPassword.length > 128) {
      setError("Временный пароль должен содержать от 8 до 128 символов.");
      return;
    }

    setPasswordResetBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        import.meta.env.VITE_ADMIN_RESET_API_URL || "/api/admin/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: profile.id, password: temporaryPassword }),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Не удалось изменить пароль.");

      setNotice(`Пароль для «${profile.full_name}» изменён. Передайте временный пароль пользователю по безопасному каналу.`);
      setResetTarget("");
    } catch (resetError) {
      setError(resetError.message || "Не удалось изменить пароль.");
    } finally {
      setPasswordResetBusy(false);
    }
  }

  const pendingCount = profiles.filter((item) => item.status === "pending").length;
  const approvedCount = profiles.filter((item) => item.status === "approved").length;
  const blockedCount = profiles.filter((item) => item.status === "blocked").length;

  return (
    <div className="page-stack">
      <section className="page-heading">
        <p className="eyebrow">УПРАВЛЕНИЕ ПЛАТФОРМОЙ</p>
        <h1>Панель администратора</h1>
        <p>Просматривайте аккаунты и управляйте статусом доступа. Роли администратора назначаются только владельцем проекта в Supabase.</p>
      </section>

      <section aria-label="Сводка аккаунтов" className="admin-stats">
        <SummaryCard label="Всего аккаунтов" value={profiles.length} />
        <SummaryCard label="Ожидают одобрения" value={pendingCount} />
        <SummaryCard label="С доступом" value={approvedCount} />
        <SummaryCard label="Заблокировано" value={blockedCount} />
      </section>

      <section className="admin-accounts">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ПОЛЬЗОВАТЕЛИ</p>
            <h2>Аккаунты платформы</h2>
          </div>
          <button
            className="button button-secondary button-small"
            disabled={loading}
            onClick={loadProfiles}
            type="button"
          >
            <RefreshCw size={14} />
            Обновить
          </button>
        </div>

        {error && <div className="form-alert error" role="alert">{error}</div>}
        {notice && <div className="form-alert success" role="status">{notice}</div>}
        {loading ? (
          <div className="loading-panel">Загружаем аккаунты…</div>
        ) : profiles.length === 0 && !error ? (
          <div className="empty-state">
            <UsersRound size={25} />
            <h2>Аккаунтов пока нет</h2>
            <p>Зарегистрированные пользователи появятся здесь.</p>
          </div>
        ) : (
          <div className="admin-account-list">
            {profiles.map((profile) => {
              const isCurrentUser = profile.id === session?.user?.id;
              const isBusy = busyId === profile.id;
              return (
                <article className="admin-account" key={profile.id}>
                  <div className="admin-account-identity">
                    <span className="admin-account-icon"><ShieldCheck size={18} /></span>
                    <div>
                      <h3>{profile.full_name}</h3>
                      <p className="admin-account-username">ID: {profile.id.slice(0, 8)}</p>
                      <p>{profile.institution || "Учебное заведение не указано"}</p>
                      <span className="admin-account-meta">
                        {roleLabel(profile.role)} · {statusLabel(profile.status)}
                        {isCurrentUser ? " · Ваш аккаунт" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="admin-account-actions">
                    {profile.status === "pending" && profile.role === "teacher" && (
                      <button
                        className="button button-primary button-small"
                        disabled={isBusy}
                        onClick={() => changeStatus(profile, "approved")}
                        type="button"
                      >
                        {isBusy ? "Сохраняем…" : "Одобрить"}
                      </button>
                    )}
                    {profile.status === "blocked" && !isCurrentUser && (
                      <button
                        className="button button-secondary button-small"
                        disabled={isBusy}
                        onClick={() => changeStatus(profile, "approved")}
                        type="button"
                      >
                        {isBusy ? "Сохраняем…" : "Восстановить"}
                      </button>
                    )}
                    {profile.status !== "blocked" && !isCurrentUser && (
                      <button
                        className="button button-danger button-small"
                        disabled={isBusy}
                        onClick={() => changeStatus(profile, "blocked")}
                        type="button"
                      >
                        {isBusy ? "Сохраняем…" : "Заблокировать"}
                      </button>
                    )}
                    {!isCurrentUser && (
                      <button
                        className="button button-secondary button-small"
                        onClick={() => {
                          setResetTarget(resetTarget === profile.id ? "" : profile.id);
                          setTemporaryPassword("");
                          setError("");
                          setNotice("");
                        }}
                        type="button"
                      >
                        Сбросить пароль
                      </button>
                    )}
                  </div>
                  {resetTarget === profile.id && (
                    <form
                      className="admin-account-password"
                      onSubmit={(event) => resetAccountPassword(profile, event)}
                    >
                      <label>
                        Временный пароль
                        <input
                          autoComplete="new-password"
                          maxLength={128}
                          minLength={8}
                          onChange={(event) => setTemporaryPassword(event.target.value)}
                          required
                          type="password"
                          value={temporaryPassword}
                        />
                      </label>
                      <button className="button button-primary button-small" disabled={passwordResetBusy} type="submit">
                        {passwordResetBusy ? "Сохраняем…" : "Назначить пароль"}
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <article className="admin-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function roleLabel(role) {
  if (role === "admin") return "Администратор";
  if (role === "teacher") return "Преподаватель";
  return "Ученик";
}

function statusLabel(status) {
  if (status === "pending") return "Ожидает одобрения";
  if (status === "blocked") return "Заблокирован";
  return "Активен";
}
