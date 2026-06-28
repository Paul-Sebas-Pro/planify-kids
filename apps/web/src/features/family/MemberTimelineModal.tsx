import { useQuery } from "@tanstack/react-query";
import type { FamilyMember, TimelineEvent } from "@planify-kids/types";
import { membersApi } from "@/services/api";

const EVENT_CONFIG: Record<
  TimelineEvent["type"],
  { icon: string; label: string; pointsColor: string }
> = {
  TASK_COMPLETED: { icon: "✅", label: "Tâche terminée", pointsColor: "text-emerald-600" },
  BADGE_EARNED: { icon: "🏅", label: "Badge obtenu", pointsColor: "text-purple-600" },
  REWARD_CLAIMED: { icon: "🎁", label: "Récompense", pointsColor: "text-red-500" },
};

function EventRow({ event }: { event: TimelineEvent }) {
  const cfg = EVENT_CONFIG[event.type];
  const date = new Date(event.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className="text-xl leading-none mt-0.5">
        {event.icon ?? cfg.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {cfg.label}
        </p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">
          {event.title}
        </p>
        {event.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{event.description}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        {event.points !== null && (
          <p className={`text-sm font-bold ${cfg.pointsColor}`}>
            {event.points > 0 ? `+${event.points}` : event.points} pts
          </p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{date}</p>
      </div>
    </div>
  );
}

export function MemberTimelineModal({
  member,
  onClose,
}: {
  member: FamilyMember;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["timeline", member.id],
    queryFn: () => membersApi.timeline(member.id).then((r) => r.data),
  });

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            {member.avatar && <span className="text-2xl">{member.avatar}</span>}
            <div>
              <h2 className="font-title font-bold text-gray-800">{member.name}</h2>
              <p className="text-xs text-gray-400">Historique des accomplissements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {isLoading && (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse py-2">
                  <div className="w-6 h-6 bg-gray-100 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                  <div className="w-12 h-4 bg-gray-100 rounded shrink-0" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && (!data || data.length === 0) && (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm font-semibold text-gray-600">Aucun accomplissement encore</p>
              <p className="text-xs text-gray-400 mt-1">Les tâches terminées, badges et récompenses apparaîtront ici.</p>
            </div>
          )}

          {!isLoading && data && data.length > 0 && (
            <div>
              {data.map((event, i) => (
                <EventRow key={i} event={event} />
              ))}
            </div>
          )}
        </div>

        <div className="px-5 pb-4 pt-3 border-t border-gray-50 shrink-0">
          <p className="text-xs text-gray-400 text-center">
            {data ? `${data.length} événement${data.length > 1 ? "s" : ""}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
