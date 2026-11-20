import { Bell, Menu, Search, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Header({ onMenuClick }) {
  const { profile, session } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function searchTests(event) {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/tests?q=${encodeURIComponent(value)}` : "/tests");
  }

  return (
    <header className="topbar">
      <button
        aria-label="Открыть меню"
        className="icon-button mobile-menu"
        onClick={onMenuClick}
        type="button"
      >
        <Menu size={20} />
      </button>
      <form className="search-shell" onSubmit={searchTests} role="search">
        <Search aria-hidden="true" size={17} />
        <input
          aria-label="Поиск по каталогу тестов"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по платформе"
          value={query}
        />
        <button aria-label="Найти" className="search-submit" type="submit">Найти</button>
      </form>
      <div className="topbar-actions">
        <span className="system-status">
          <span className="status-dot" />
          {session ? "Вы вошли" : "Открытый каталог"}
        </span>
        <button aria-label="Уведомления пока недоступны" className="icon-button" disabled title="Уведомления пока не подключены" type="button">
          <Bell size={18} />
        </button>
        <Link className="profile-chip" to="/profile">
          <span className="avatar">{profile?.full_name?.slice(0, 1) || <UserRound size={16} />}</span>
          <span className="profile-name">{profile?.full_name || "Войти"}</span>
        </Link>
      </div>
    </header>
  );
}
