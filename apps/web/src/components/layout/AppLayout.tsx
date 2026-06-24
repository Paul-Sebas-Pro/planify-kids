import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuthStore } from "@/store/auth.store";
import { NotificationBell } from "./NotificationBell";

const navItems = [
  { to: "/dashboard", label: "Tableau de bord" },
  { to: "/family", label: "Famille" },
  { to: "/tasks", label: "Tâches" },
  { to: "/planning", label: "Planning" },
  { to: "/rewards", label: "Récompenses" },
  { to: "/settings", label: "Paramètres" },
];

export function AppLayout() {
  const { family, member, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col py-6 px-4 shrink-0">
        <p className="font-title text-primary font-bold text-xl mb-1">
          Planify Kids
        </p>
        {family && (
          <p className="text-xs text-gray-400 mb-8 truncate">{family.name}</p>
        )}

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 pt-4 mt-4">
          {member && (
            <p className="text-xs text-gray-500 mb-3 truncate">{member.name}</p>
          )}
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-danger transition-colors"
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
