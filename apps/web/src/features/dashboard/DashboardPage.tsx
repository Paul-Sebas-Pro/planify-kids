import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { familyApi, tasksApi } from "@/services/api";
import { logsApi } from "@/services/logs.api";
import { PointsChart } from "./PointsChart";
import type { ChildStats } from "@planify-kids/types";

export function DashboardPage() {
  const { family } = useAuthStore();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["family-stats"],
    queryFn: () => familyApi.stats(),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksApi.list(),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["logs"],
    queryFn: () => logsApi.list({ limit: 100 }),
  });

  const stats = statsData?.data;
  const tasks = tasksData?.data ?? [];

  return (
    <div>
      <h2 className="text-2xl font-title font-bold text-gray-800 mb-1">
        Tableau de bord
      </h2>
      {family && (
        <p className="text-sm text-gray-400 mb-8">Famille {family.name}</p>
      )}

      <div className="grid grid-cols-3 gap-4 mb-10">
        <StatCard label="Tâches actives" value={tasks.length} />
        <StatCard
          label="Points famille"
          value={stats?.summary.totalPoints ?? 0}
        />
        <StatCard
          label="Badges gagnés"
          value={stats?.summary.totalBadges ?? 0}
        />
      </div>

      {!statsLoading && stats && stats.children.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Classement
          </h3>
          <div className="space-y-3">
            {stats.children.map((child, index) => (
              <ChildRankCard key={child.id} child={child} rank={index + 1} />
            ))}
          </div>
        </section>
      )}

      {!statsLoading && stats?.children.length === 0 && (
        <p className="text-sm text-gray-400">
          Ajoutez des enfants pour voir le classement.
        </p>
      )}

      {stats && stats.children.length > 0 && (
        <section className="mt-8">
          <PointsChart events={logs} children={stats.children} />
        </section>
      )}
    </div>
  );
}

function ChildRankCard({ child, rank }: { child: ChildStats; rank: number }) {
  const RANK_STYLE: Record<number, string> = {
    1: "text-yellow-500",
    2: "text-gray-400",
    3: "text-amber-600",
  };

  const badgesPreview = child.badges.slice(0, 5);
  const extraBadges = child.badges.length - badgesPreview.length;

  return (
    <div className="bg-white rounded-card shadow-sm px-5 py-4 flex items-center gap-4">
      <span
        className={`text-xl font-bold w-7 text-center shrink-0 ${RANK_STYLE[rank] ?? "text-gray-300"}`}
      >
        {rank}
      </span>

      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ backgroundColor: child.color ?? "#9e9e9e" }}
      >
        {child.name[0]?.toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 truncate">
          {child.name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {child._count.assignments} tâche
          {child._count.assignments !== 1 ? "s" : ""} complétée
          {child._count.assignments !== 1 ? "s" : ""}
        </p>
        {child.badges.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {badgesPreview.map((mb, i) => (
              <span key={i} className="text-base" title={mb.badge.name}>
                {mb.badge.icon}
              </span>
            ))}
            {extraBadges > 0 && (
              <span className="text-xs text-gray-400">+{extraBadges}</span>
            )}
          </div>
        )}
      </div>

      <div className="text-right shrink-0">
        <p className="text-2xl font-bold font-score text-primary">
          {child.points}
        </p>
        <p className="text-xs text-gray-400">pts</p>
      </div>
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
