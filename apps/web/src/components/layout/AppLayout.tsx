import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuthStore } from "@/store/auth.store";
import { NotificationBell } from "./NotificationBell";

const navItems = [
  { to: "/dashboard", label: "Tableau de bord", icon: "📊" },
  { to: "/family", label: "Famille", icon: "👨‍👩‍👧" },
  { to: "/tasks", label: "Tâches", icon: "✅" },
  { to: "/planning", label: "Planning", icon: "📅" },
  { to: "/rewards", label: "Récompenses", icon: "🏆" },
  { to: "/report", label: "Rapport", icon: "📈" },
  { to: "/settings", label: "Paramètres", icon: "⚙️" },
];

export function AppLayout() {
  const { family, member, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 bg-[#1A1A2E] flex flex-col py-6 px-4 shrink-0">
        <p className="font-title text-white font-bold text-xl mb-1">
          Planify Kids
        </p>
        {family && (
          <p className="text-xs text-white/50 mb-8 truncate">{family.name}</p>
        )}

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-body font-medium transition-colors flex items-center gap-2.5 ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-4 mt-4">
          {member && (
            <p className="text-xs text-white/50 mb-3 truncate">{member.name}</p>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-end items-center px-8 py-3 border-b border-gray-100 bg-white shrink-0">
          <NotificationBell />
        </header>
        <div className="flex-1 p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
