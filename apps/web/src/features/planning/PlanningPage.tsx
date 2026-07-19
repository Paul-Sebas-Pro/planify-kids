import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import type { ScheduleDetail, ScheduleItemDetail, TaskExchange } from "@planify-kids/types";
import { SLOT_LABELS } from "@planify-kids/types";
import { planningApi, exchangesApi } from "@/services/planning.api";
import { membersApi } from "@/services/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonList } from "@/components/shared/Skeleton";

interface GenerateFormValues {
  startDate: string;
  endDate: string;
}

const STATUS_LABELS = {
  PENDING: "En attente",
  COMPLETED: "Fait",
  SKIPPED: "Ignoré",
} as const;

const EXCHANGE_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
};

const EXCHANGE_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-600 bg-yellow-50",
  ACCEPTED: "text-green-600 bg-green-50",
  REFUSED: "text-red-600 bg-red-50",
};


export function PlanningPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // itemId en cours de proposition d'échange
  const [exchangeItemId, setExchangeItemId] = useState<string | null>(null);
  const [exchangeFromId, setExchangeFromId] = useState<string>("");
  const [exchangeToId, setExchangeToId] = useState<string>("");

  const { data: listData, isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: () => planningApi.list(),
  });

  const { data: detailData } = useQuery({
    queryKey: ["schedule", selectedId],
    queryFn: () => planningApi.get(selectedId!),
    enabled: selectedId !== null,
  });

  const { data: exchangesData } = useQuery({
    queryKey: ["exchanges"],
    queryFn: () => exchangesApi.list(),
  });

  const { data: membersData } = useQuery({
    queryKey: ["members"],
    queryFn: () => membersApi.list(),
  });

  const schedules = listData?.data ?? [];
  const detail: ScheduleDetail | undefined = detailData?.data;
  const exchanges: TaskExchange[] = exchangesData?.data ?? [];
  const pendingExchanges = exchanges.filter((e) => e.status === "PENDING");
  const children = (membersData?.data ?? []).filter((m) => m.role === "CHILD");

  // Set des itemIds avec un échange PENDING (pour afficher le badge)
  const pendingItemIds = new Set(pendingExchanges.map((e) => e.scheduleItemId));

  const generateMutation = useMutation({
    mutationFn: planningApi.generate,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      setSelectedId(res.data.id);
      setShowGenerate(false);
      resetForm();
    },
    onError: (err: Error) => setApiError(err.message),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({
      itemId,
      status,
    }: {
      itemId: string;
      status: "PENDING" | "COMPLETED" | "SKIPPED";
    }) => planningApi.updateItem(itemId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule", selectedId] });
      qc.invalidateQueries({ queryKey: ["family-stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: planningApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      setSelectedId(null);
    },
  });

  const proposeMutation = useMutation({
    mutationFn: exchangesApi.propose,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exchanges"] });
      setExchangeItemId(null);
      setExchangeToId("");
    },
    onError: (err: Error) => setApiError(err.message),
  });

  const respondMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACCEPTED" | "REFUSED";
    }) => exchangesApi.respond(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exchanges"] });
      qc.invalidateQueries({ queryKey: ["schedule", selectedId] });
    },
  });

  const {
    register,
    handleSubmit,
    reset: resetForm,
    setValue,
  } = useForm<GenerateFormValues>();

  function onGenerate(values: GenerateFormValues) {
    setApiError(null);
    generateMutation.mutate(values);
  }

  function fillCurrentWeek() {
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dow + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    setValue("startDate", monday.toISOString().slice(0, 10));
    setValue("endDate", sunday.toISOString().slice(0, 10));
  }

  function openExchange(itemId: string, currentMemberId: string) {
    setExchangeItemId(itemId);
    setExchangeFromId(currentMemberId);
    setExchangeToId("");
    setApiError(null);
  }

  function submitExchange() {
    if (!exchangeItemId || !exchangeToId) return;
    proposeMutation.mutate({
      scheduleItemId: exchangeItemId,
      fromMemberId: exchangeFromId,
      toMemberId: exchangeToId,
    });
  }


  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-title font-bold text-gray-800">
          Planning
        </h2>
        <button
          onClick={() => {
            setShowGenerate(true);
            setApiError(null);
          }}
          className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-(--radius-button) hover:bg-primary/90 transition-colors"
        >
          Générer un planning
        </button>
      </div>

      <div className="flex gap-6">
        {/* Liste des plannings */}
        <aside className="w-56 shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Plannings
          </p>
          {isLoading ? (
            <SkeletonList count={3} />
          ) : schedules.length === 0 ? (
            <EmptyState
              icon="📅"
              title="Aucun planning"
              description="Générez un planning pour commencer."
            />
          ) : (
            <ul className="space-y-2">
              {schedules.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setSelectedId(s.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                      selectedId === s.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <p className="font-medium truncate">
                      {formatDate(s.startDate)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(s.endDate)} &middot; {s._count.items} tâches
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Détail du planning sélectionné */}
        <div className="flex-1 min-w-0 space-y-6">
          {!selectedId && (
            <p className="text-sm text-gray-400 mt-4">
              Sélectionnez un planning ou générez-en un nouveau.
            </p>
          )}

          {detail && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {formatDate(detail.startDate)} au {formatDate(detail.endDate)}
                  <span className="ml-2 text-gray-400">
                    ({detail.items.length} tâches)
                  </span>
                </p>
                <button
                  onClick={() => deleteMutation.mutate(detail.id)}
                  className="text-xs text-danger hover:underline"
                >
                  Supprimer
                </button>
              </div>

              <WeekCalendar
                detail={detail}
                pendingItemIds={pendingItemIds}
                exchangeItemId={exchangeItemId}
                exchangeFromId={exchangeFromId}
                exchangeToId={exchangeToId}
                childMembers={children}
                isUpdating={updateItemMutation.isPending}
                isProposing={proposeMutation.isPending}
                onUpdateItem={(itemId, status) =>
                  updateItemMutation.mutate({ itemId, status })
                }
                onOpenExchange={openExchange}
                onSetExchangeTo={setExchangeToId}
                onSubmitExchange={submitExchange}
                onCancelExchange={() => setExchangeItemId(null)}
              />
            </div>
          )}

          {/* Section échanges */}
          {exchanges.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Échanges
                {pendingExchanges.length > 0 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {pendingExchanges.length} en attente
                  </span>
                )}
              </h3>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {exchanges.map((ex) => {
                  const fromMember = children.find(
                    (c) => c.id === ex.fromMemberId,
                  );
                  const toMember = children.find((c) => c.id === ex.toMemberId);
                  return (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {ex.scheduleItem.task.icon && (
                            <span className="mr-1">
                              {ex.scheduleItem.task.icon}
                            </span>
                          )}
                          {ex.scheduleItem.task.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fromMember?.name ?? ex.fromMemberId} &rarr;{" "}
                          {toMember?.name ?? ex.toMemberId} &middot;{" "}
                          {formatDate(ex.scheduleItem.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${EXCHANGE_STATUS_COLORS[ex.status] ?? ""}`}
                        >
                          {EXCHANGE_STATUS_LABELS[ex.status] ?? ex.status}
                        </span>
                        {ex.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                respondMutation.mutate({
                                  id: ex.id,
                                  status: "ACCEPTED",
                                })
                              }
                              className="text-xs bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Accepter
                            </button>
                            <button
                              onClick={() =>
                                respondMutation.mutate({
                                  id: ex.id,
                                  status: "REFUSED",
                                })
                              }
                              className="text-xs bg-danger/10 hover:bg-danger/20 text-danger px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Refuser
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modale de génération */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-card p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-title font-bold text-lg mb-4">
              Générer un planning
            </h3>

            <form onSubmit={handleSubmit(onGenerate)} className="space-y-4">
              <button
                type="button"
                onClick={fillCurrentWeek}
                className="w-full text-xs text-primary border border-primary/30 rounded-xl py-1.5 hover:bg-primary/5 transition-colors"
              >
                📅 Semaine courante
              </button>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  {...register("startDate", { required: true })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  {...register("endDate", { required: true })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {apiError && <p className="text-danger text-xs">{apiError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerate(false)}
                  className="flex-1 border border-gray-200 text-sm font-semibold py-2 rounded-(--radius-button) hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="flex-1 bg-primary text-white text-sm font-semibold py-2 rounded-(--radius-button) hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {generateMutation.isPending ? "Génération..." : "Générer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

// ── WeekCalendar ─────────────────────────────────────────────────────────────

const STATUS_BG: Record<string, string> = {
  PENDING: "bg-white border border-gray-200",
  COMPLETED: "bg-primary/10 border border-primary/20",
  SKIPPED: "bg-danger/10 border border-danger/20",
};

const STATUS_CHIP: Record<string, string> = {
  PENDING: "text-gray-500 bg-gray-100",
  COMPLETED: "text-primary bg-primary/10",
  SKIPPED: "text-danger bg-danger/10",
};

const STATUS_NEXT: Record<string, "PENDING" | "COMPLETED" | "SKIPPED"> = {
  PENDING: "COMPLETED",
  COMPLETED: "SKIPPED",
  SKIPPED: "PENDING",
};

function getDaysInRange(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end && days.length < 7) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function WeekCalendar({
  detail,
  pendingItemIds,
  exchangeItemId,
  exchangeFromId,
  exchangeToId,
  childMembers,
  isUpdating,
  isProposing,
  onUpdateItem,
  onOpenExchange,
  onSetExchangeTo,
  onSubmitExchange,
  onCancelExchange,
}: {
  detail: ScheduleDetail;
  pendingItemIds: Set<string>;
  exchangeItemId: string | null;
  exchangeFromId: string;
  exchangeToId: string;
  childMembers: { id: string; name: string; color?: string | null }[];
  isUpdating: boolean;
  isProposing: boolean;
  onUpdateItem: (itemId: string, status: "PENDING" | "COMPLETED" | "SKIPPED") => void;
  onOpenExchange: (itemId: string, memberId: string) => void;
  onSetExchangeTo: (id: string) => void;
  onSubmitExchange: () => void;
  onCancelExchange: () => void;
}) {
  const days = getDaysInRange(detail.startDate, detail.endDate);
  const cols = days.length;

  const byDay = detail.items.reduce<Record<string, ScheduleItemDetail[]>>(
    (acc, item) => {
      const d = item.date.slice(0, 10);
      (acc[d] ??= []).push(item);
      return acc;
    },
    {},
  );

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-2 min-w-180"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {/* En-têtes jours */}
        {days.map((d) => (
          <div key={d} className="text-center pb-1 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {new Date(d).toLocaleDateString("fr-FR", { weekday: "short" })}
            </p>
            <p className="text-sm font-bold text-gray-700">
              {new Date(d).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        ))}

        {/* Colonnes tâches */}
        {days.map((d) => (
          <div key={d} className="space-y-2 pt-1">
            {(byDay[d] ?? []).map((item) => (
              <div key={item.id} className="space-y-1">
                <div
                  className={`rounded-xl p-2 shadow-sm text-xs ${STATUS_BG[item.status] ?? "bg-white border border-gray-200"}`}
                >
                  {/* Membre + créneau */}
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full shrink-0 mt-0.5"
                        style={{
                          backgroundColor: item.member.color ?? "#9e9e9e",
                        }}
                      />
                      <span className="font-medium line-clamp-2 text-gray-700">
                        {item.member.name}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                      {SLOT_LABELS[item.slot]}
                    </span>
                  </div>

                  {/* Tâche */}
                  <p className="line-clamp-2 text-gray-800 font-medium leading-snug">
                    {item.task.icon} {item.task.name}
                  </p>

                  {/* Footer : pts + statut cliquable */}
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-gray-400">{item.task.points} pts</span>
                    <button
                      disabled={isUpdating}
                      onClick={() =>
                        onUpdateItem(
                          item.id,
                          STATUS_NEXT[item.status] ?? "PENDING",
                        )
                      }
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition-opacity hover:opacity-70 disabled:opacity-40 ${STATUS_CHIP[item.status] ?? ""}`}
                    >
                      {STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] ??
                        item.status}
                    </button>
                  </div>

                  {/* Badge échange en cours */}
                  {pendingItemIds.has(item.id) && (
                    <p className="mt-1 text-[10px] text-yellow-600 font-medium">
                      ↔ Échange en cours
                    </p>
                  )}

                  {/* Bouton échanger */}
                  {item.status === "PENDING" &&
                    !pendingItemIds.has(item.id) &&
                    childMembers.length > 1 && (
                      <button
                        onClick={() =>
                          onOpenExchange(item.id, item.assignedToMemberId)
                        }
                        className="mt-1 text-[10px] text-secondary hover:text-secondary/80"
                      >
                        Échanger →
                      </button>
                    )}
                </div>

                {/* Formulaire inline échange */}
                {exchangeItemId === item.id && (
                  <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-2 space-y-1.5">
                    <p className="text-[10px] text-secondary font-semibold">
                      Échanger avec
                    </p>
                    <select
                      value={exchangeToId}
                      onChange={(e) => onSetExchangeTo(e.target.value)}
                      className="w-full text-xs border border-secondary/30 rounded-lg px-2 py-1 bg-white focus:outline-none"
                    >
                      <option value="">Choisir…</option>
                      {childMembers
                        .filter((c) => c.id !== exchangeFromId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={onSubmitExchange}
                        disabled={!exchangeToId || isProposing}
                        className="flex-1 text-[10px] bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white py-1 rounded-lg transition-colors"
                      >
                        Proposer
                      </button>
                      <button
                        onClick={onCancelExchange}
                        className="text-[10px] text-gray-400 hover:text-gray-600 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
