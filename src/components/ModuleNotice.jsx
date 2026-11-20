import { ArrowRight, CircleHelp } from "lucide-react";
import { Link } from "react-router-dom";

export default function ModuleNotice({ title, description }) {
  return (
    <section className="module-notice">
      <div className="notice-icon"><CircleHelp size={22} /></div>
      <p className="eyebrow">РАЗДЕЛ В РАЗРАБОТКЕ</p>
      <h1>{title}</h1>
      <p className="notice-copy">{description}</p>
      <p className="notice-footnote">
        Этот раздел пока не подключён к базе данных. Здесь не показываются демонстрационные или вымышленные сведения.
      </p>
      <Link className="button button-primary" to="/tests">
        Перейти в каталог тестов <ArrowRight size={16} />
      </Link>
    </section>
  );
}
