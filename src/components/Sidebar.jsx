import {
  Activity,
  BookOpen,
  Bot,
  ChevronLeft,
  CircleHelp,
  FilePlus2,
  Home,
  LogOut,
  Settings,
  Shield,
  UserRound,
  UsersRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../services/supabase.js";

const mainLinks = [
  { to: "/", label: "Главная", icon: Home, end: true },
  { to: "/lectures", label: "Библиотека лекций", icon: BookOpen },
  { to: "/tests", label: "Каталог тестов", icon: Activity },
  { to: "/assistant", label: "ИИ-помощник", icon: Bot },
  { to: "/generator", label: "Генератор тестов", icon: FilePlus2 },
  { to: "/statistics", label: "Статистика", icon: Activity },
];

export default function Sidebar({ open, onClose }) {
  const { profile, session } = useAuth();
  const [logoutError, setLogoutError] = useState("");

  async function signOut() {
    if (!supabase) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setLogoutError("");
      onClose();
    } catch {
      setLogoutError("Не удалось выйти. Попробуйте ещё раз.");
    }
  }

  return (
    <>
      <button
        aria-label="Закрыть меню"
        className={`sidebar-scrim ${open ? "is-visible" : ""}`}
        onClick={onClose}
        type="button"
      />
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">E</div>
          <div className="brand-name">
            ECONOMY <span>AI</span>
            <small>ПЛАТФОРМА ОБУЧЕНИЯ</small>
          </div>
          <button
            aria-label="Свернуть меню"
            className="icon-button sidebar-collapse"
            onClick={onClose}
            type="button"
          >
            <ChevronLeft size={17} />
          </button>
        </div>

        <div className="nav-caption">ОБУЧЕНИЕ</div>
        <nav aria-label="Главное меню" className="nav-list">
          {mainLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              end={end}
              key={to}
              onClick={onClose}
              to={to}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nav-caption nav-caption-spaced">КАБИНЕТ</div>
        <nav aria-label="Кабинет" className="nav-list">
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            onClick={onClose}
            to="/profile"
          >
            <UserRound aria-hidden="true" size={18} strokeWidth={1.8} />
            <span>Личный кабинет</span>
          </NavLink>
          {profile?.role === "teacher" && profile.status === "approved" && (
            <NavLink
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              onClick={onClose}
              to="/teacher"
            >
              <UsersRound aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>Кабинет преподавателя</span>
            </NavLink>
          )}
          {profile?.role === "admin" && (
            <NavLink
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
              onClick={onClose}
              to="/admin"
            >
              <Shield aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>Администрирование</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            onClick={onClose}
            to="/support"
          >
            <CircleHelp aria-hidden="true" size={18} strokeWidth={1.8} />
            <span>Поддержка</span>
          </NavLink>
          <NavLink
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            onClick={onClose}
            to="/settings"
          >
            <Settings aria-hidden="true" size={18} strokeWidth={1.8} />
            <span>Настройки</span>
          </NavLink>
          {session && (
            <button className="nav-link sidebar-logout" onClick={signOut} type="button">
              <LogOut aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>Выйти из аккаунта</span>
            </button>
          )}
          {logoutError && <p className="sidebar-error" role="alert">{logoutError}</p>}
          <div className="sidebar-note">
            <span className="status-dot" />
            Каталог подготовлен
          </div>
        </div>
      </aside>
    </>
  );
}
