import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { membersApi, tasksApi } from "@/services/api";

export function DashboardPage() {
  const { family } = useAuthStore();

  const { data: membersData } = useQuery({
    queryKey: ["members"],
    queryFn: () => membersApi.list(),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksApi.list(),
  });

  const members = membersData?.data ?? [];
  const tasks = tasksData?.data ?? [];
  const children = members.filter((m) => m.role === "CHILD");

  return (
    <div>
      <h2 className="text-2xl font-title font-bold text-gray-800 mb-1">
        Tableau de bord
      </h2>
      {family && (
        <p className="text-sm text-gray-400 mb-8">Famille {family.name}</p>
      )}

      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard label="Enfants" value={children.length} />
        <StatCard label="Tâches actives" value={tasks.length} />
        <StatCard
          label="Points total"
          value={children.reduce((sum, m) => sum + m.points, 0)}
        />
      </div>

      {children.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Enfants
          </h3>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-white rounded-card p-4 shadow-sm flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: child.color ?? "#9e9e9e" }}
                >
                  {child.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{child.name}</p>
                  <p className="text-xs text-gray-400 font-score">
                    {child.points} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-card p-5 shadow-sm">
      <p className="text-3xl font-bold font-score text-primary">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
