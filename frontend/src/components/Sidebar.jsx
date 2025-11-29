import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaHome, FaFolderOpen, FaHardHat, FaUsers, FaUserTie, FaMoneyBillWave } from "react-icons/fa";

function SideItem({ to, icon: Icon, label, active }) {
  return (
    <Link to={to} className={`sidebar-link ${active ? "sidebar-link--active" : ""}`}>
      <Icon className="sidebar-link__icon" aria-hidden />
      <span className="sidebar-link__text">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  // ✅ استخدام مسار ثابت للشعار من public folder
  // Vite يقوم تلقائياً بتقديم الملفات من public folder على المسار الجذر
  const logoUrl = "/logo.png";

  const items = [
    { to: "/", label: t("sidebar_home"), icon: FaHome },
    { to: "/projects", label: t("sidebar_projects"), icon: FaFolderOpen },
    { to: "/payments", label: t("sidebar_payments"), icon: FaMoneyBillWave },
    { to: "/owners", label: t("sidebar_owners"), icon: FaUsers },
    { to: "/consultants", label: t("sidebar_consultants"), icon: FaUserTie },
    { to: "/contractors", label: t("sidebar_contractors"), icon: FaHardHat },
  ];

  return (
    <aside className="sidebar">
      {/* Logo Section */}
      <div className="sidebar-logo-section">
        <div className="sidebar-logo-container">
          <div className="sidebar-logo-wrapper">
            <img 
              src={logoUrl} 
              alt="Company Logo" 
              className="sidebar-logo"
              loading="eager"
              crossOrigin="anonymous"
              onError={(e) => {
                // إذا فشل التحميل، نحاول تحميله بدون timestamp
                if (e.target.src.includes("?v=")) {
                  e.target.src = "/logo.png";
                } else {
                  // إذا فشل مرة أخرى، نعرض placeholder
                  console.warn("Failed to load logo from /logo.png");
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="sidebar-nav">
        {items.map(({ to, label, icon }) => (
          <SideItem
            key={to}
            to={to}
            label={label}
            icon={icon}
            active={pathname === to || pathname.startsWith(to + "/")}
          />
        ))}
      </nav>
    </aside>
  );
}
