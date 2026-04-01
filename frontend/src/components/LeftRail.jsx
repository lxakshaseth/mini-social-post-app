import { CheckCircle2, Compass, House, LayoutGrid } from "lucide-react";
import { heroHighlights, navigationItems } from "../utils";

const iconMap = {
  Home: House,
  Social: LayoutGrid,
  Discover: Compass,
};

function LeftRail({ activeNav, onNavClick }) {
  return (
    <aside className="left-rail">
      <div className="brand-card card">
        <div className="brand-mark">TP</div>
        <div>
          <p className="eyebrow">Desktop Web Build</p>
          <h2>TaskPlanet Social Desk</h2>
        </div>
      </div>

      <nav className="side-nav card">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.label];

          return (
            <button
              key={item.label}
              type="button"
              className={`nav-item ${activeNav === item.label ? "active" : ""}`}
              onClick={() => onNavClick(item.label)}
            >
              <span className="nav-icon">
                <Icon size={18} />
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.detail}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <section className="left-info card">
        <p className="eyebrow">What is built</p>
        <ul className="feature-list">
          {heroHighlights.map((item) => (
            <li key={item}>
              <CheckCircle2 size={16} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

export default LeftRail;
