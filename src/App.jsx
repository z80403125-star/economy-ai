import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import Header from "./components/Header.jsx";
import ModuleNotice from "./components/ModuleNotice.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Assistant from "./pages/Assistant.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ProtectedModule from "./pages/ProtectedModule.jsx";
import TestCatalog from "./pages/TestCatalog.jsx";

const publicModules = {
  "/lectures": ["Библиотека лекций", "Библиотека станет доступна после добавления проверенных материалов."],
  "/generator": ["Генератор тестов", "Генерация будет включена после настройки серверного ИИ и сохранения в Supabase."],
  "/statistics": ["Статистика", "Здесь появятся показатели только по сохранённым попыткам. Пока результатов нет."],
  "/support": ["Поддержка", "Канал поддержки будет опубликован после настройки контактов платформы."],
  "/settings": ["Настройки", "Персональные настройки аккаунта появятся после подключения профилей."],
};

function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { error } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar onClose={() => setMenuOpen(false)} open={menuOpen} />
      <div className="app-main">
        <Header onMenuClick={() => setMenuOpen(true)} />
        {error && <div className="global-error" role="alert">{error}</div>}
        <main className="content">
          <Routes>
            <Route element={<Dashboard />} path="/" />
            <Route element={<TestCatalog />} path="/tests" />
            <Route element={<Assistant />} path="/assistant" />
            <Route element={<AuthPage />} path="/auth" />
            <Route element={<ProfilePage />} path="/profile" />
            <Route
              element={<ProtectedModule description="Раздел преподавателя будет подключён после настройки назначений и ученических попыток." requiredRole="teacher" title="Кабинет преподавателя" />}
              path="/teacher"
            />
            <Route
              element={<ProtectedModule description="Панель администратора требует настроенной роли admin в базе данных." requiredRole="admin" title="Панель администратора" />}
              path="/admin"
            />
            {Object.entries(publicModules).map(([path, [title, description]]) => (
              <Route
                element={<ModuleNotice description={description} title={title} />}
                key={path}
                path={path}
              />
            ))}
            <Route element={<Navigate replace to="/" />} path="*" />
          </Routes>
        </main>
        <footer className="app-footer">
          <span>ECONOMY AI</span><span>Учимся понимать экономику</span>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppLayout /></AuthProvider>;
}
