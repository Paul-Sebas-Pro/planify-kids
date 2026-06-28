import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuthStore } from "@/store/auth.store";
import { NotificationBell } from "./NotificationBell";
import { useServerEvents } from "@/hooks/useServerEvents";

const navItems = [
  { to: "/dashboard", label: "Tableau de bord", icon: "📊" },
  { to: "/family", label: "Famille", icon: "👨‍👩‍👧" },
  { to: "/tasks", label: "Tâches", icon: "✅" },
  { to: "/planning", label: "Planning", icon: "📅" },
  { to: "/rewards", label: "Récompenses", icon: "🏆" },
  { to: "/report", label: "Rapport", icon: "📈" },
  { to: "/challenges", label: "Challenges", icon: "🏆" },
  { to: "/settings", label: "Paramètres", icon: "⚙️" },
];

export function AppLayout() {
  const { family, member, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useServerEvents();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const sidebar = (
    <aside className="w-56 bg-[#1A1A2E] flex flex-col py-6 px-4 h-full">
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
            onClick={() => setSidebarOpen(false)}
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
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop — toujours visible */}
      <div className="hidden md:flex shrink-0">{sidebar}</div>

      {/* Sidebar mobile — drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex md:hidden">
            {sidebar}
          </div>
        </>
      )}

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-gray-100 bg-white shrink-0">
          <button
            className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
