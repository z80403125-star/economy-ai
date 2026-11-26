import { ArrowRight, BookOpen, FileQuestion, GraduationCap, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { testCatalog } from "../data/testCatalog.js";

const categoryLinks = [
  { title: "Рыночная экономика", icon: "↗", color: "blue" },
  { title: "Собственность", icon: "◇", color: "violet" },
  { title: "Доходы и прибыль", icon: "₽", color: "green" },
  { title: "Производство", icon: "▦", color: "amber" },
];

export default function Dashboard() {
  return (
    <div className="page-stack">
      <section className="welcome-panel">
        <div className="welcome-copy">
          <span className="welcome-tag"><Sparkles size={14} /> ПРОСТРАНСТВО ДЛЯ ОБУЧЕНИЯ</span>
          <h1>Экономика становится<br /><span>понятнее.</span></h1>
          <p>Тесты и учебные материалы по экономике — в одном удобном месте.</p>
          <Link className="button button-light" to="/tests">
            Открыть каталог тестов <ArrowRight size={16} />
          </Link>
        </div>
        <div aria-hidden="true" className="welcome-visual">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="visual-card visual-main">
            <div className="visual-card-head"><span>РЫНОК</span><span className="visual-live">●</span></div>
            <div className="chart-bars"><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="chart-caption"><span>Спрос</span><span>Время</span></div>
          </div>
          <div className="visual-card visual-note"><span className="visual-note-icon">✓</span><span>Знания<br /><b>в действии</b></span></div>
          <span className="visual-dot dot-a" /><span className="visual-dot dot-b" />
        </div>
      </section>

      <section aria-label="Статистика" className="stats-grid">
        <StatCard icon={FileQuestion} label="Тестов в каталоге" value={String(testCatalog.length)} note="Проверено по содержимому" tone="blue" />
        <StatCard icon={BookOpen} label="Лекций" value="—" note="Подключение не настроено" tone="violet" />
        <StatCard icon={GraduationCap} label="Учеников" value="—" note="Нет данных Supabase" tone="green" />
        <StatCard icon={Sparkles} label="Средний результат" value="—" note="Нет сохранённых попыток" tone="amber" />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">НАВИГАЦИЯ</p><h2>Продолжить обучение</h2></div>
          <Link className="text-link" to="/tests">Все тесты <ArrowRight size={15} /></Link>
        </div>
        <div className="quick-grid">
          <QuickCard icon={FileQuestion} title="Каталог тестов" text="Выберите тему и проверьте знания." to="/tests" tone="blue" />
          <QuickCard icon={BookOpen} title="Библиотека лекций" text="Материалы появятся после подключения библиотеки." to="/lectures" tone="violet" />
          <QuickCard icon={Sparkles} title="ИИ-помощник" text="Задавайте вопросы по экономике прямо сейчас." to="/assistant" tone="green" />
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">ТЕМЫ</p><h2>Основные категории</h2></div>
        </div>
        <div className="category-grid">
          {categoryLinks.map((category) => (
            <Link className="category-card" key={category.title} to={`/tests?category=${encodeURIComponent(category.title)}`}>
              <span className={`category-icon tone-${category.color}`}>{category.icon}</span>
              <span>{category.title}</span>
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, note, tone }) {
  return (
    <article className="stat-card">
      <span className={`stat-icon tone-${tone}`}><Icon size={18} /></span>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-note">{note}</span>
    </article>
  );
}

function QuickCard({ icon: Icon, title, text, to, tone }) {
  return (
    <Link className="quick-card" to={to}>
      <span className={`quick-icon tone-${tone}`}><Icon size={19} /></span>
      <span className="quick-title">{title}</span>
      <span className="quick-text">{text}</span>
      <ArrowRight aria-hidden="true" className="quick-arrow" size={16} />
    </Link>
  );
}
