import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CalendarEntry, ScheduleDetail, ScheduleItemDetail, TaskExchange } from "@planify-kids/types";
import { SLOT_LABELS } from "@planify-kids/types";
import { planningApi, exchangesApi } from "@/services/planning.api";
import { membersApi } from "@/services/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonList } from "@/components/shared/Skeleton";
import { formatDate } from "@/lib/formatDate";

interface GenerateFormValues {
  startDate: string;
  endDate: string;
}

const STATUS_KEYS = {
  PENDING: "common.pending",
  COMPLETED: "common.completed",
  SKIPPED: "common.skipped",
} as const;

const EXCHANGE_STATUS_KEYS: Record<string, string> = {
  PENDING: "common.pending",
  ACCEPTED: "common.accepted",
  REFUSED: "common.refused",
};

const EXCHANGE_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-600 bg-yellow-50",
  ACCEPTED: "text-green-600 bg-green-50",
  REFUSED: "text-red-600 bg-red-50",
};


export function PlanningPage() {
  const { t } = useTranslation();
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

  const scheduleRange = detailData?.data;

  const { data: calendarData } = useQuery({
    queryKey: ["planning-calendar", scheduleRange?.startDate, scheduleRange?.endDate],
    queryFn: () =>
      planningApi.calendar(scheduleRange!.startDate, scheduleRange!.endDate),
    enabled: !!scheduleRange,
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

  // Jours fériés/vacances de la semaine affichée, indexés par date (YYYY-MM-DD)
  const calendarByDay = new Map<string, CalendarEntry>(
    (calendarData?.data ?? []).map((e) => [e.date, e]),
  );

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
          {t("planningPage.title")}
        </h2>
        <button
          onClick={() => {
            setShowGenerate(true);
            setApiError(null);
          }}
          className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-(--radius-button) hover:bg-primary/90 transition-colors"
        >
          {t("planningPage.generate")}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Liste des plannings */}
        <aside className="w-56 shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {t("planningPage.schedulesLabel")}
          </p>
          {isLoading ? (
            <SkeletonList count={3} />
          ) : schedules.length === 0 ? (
            <EmptyState
              icon="📅"
              title={t("planningPage.emptyTitle")}
              description={t("planningPage.emptyDescription")}
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
                      {formatScheduleDate(s.startDate)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatScheduleDate(s.endDate)} &middot; {t("planningPage.tasksCount", { count: s._count.items })}
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
              {t("planningPage.selectPrompt")}
            </p>
          )}

          {detail && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {formatScheduleDate(detail.startDate)} au {formatScheduleDate(detail.endDate)}
                  <span className="ml-2 text-gray-400">
                    ({t("planningPage.tasksCount", { count: detail.items.length })})
                  </span>
                </p>
                <button
                  onClick={() => deleteMutation.mutate(detail.id)}
                  className="text-xs text-danger hover:underline"
                >
                  {t("common.delete")}
                </button>
              </div>

              <WeekCalendar
                detail={detail}
                calendarByDay={calendarByDay}
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
                {t("planningPage.exchangesTitle")}
                {pendingExchanges.length > 0 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    {t("planningPage.pendingCount", { count: pendingExchanges.length })}
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
                          {formatScheduleDate(ex.scheduleItem.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${EXCHANGE_STATUS_COLORS[ex.status] ?? ""}`}
                        >
                          {(() => {
                            const key = EXCHANGE_STATUS_KEYS[ex.status];
                            return key ? t(key) : ex.status;
                          })()}
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
                              {t("planningPage.accept")}
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
                              {t("planningPage.refuse")}
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
              {t("planningPage.generate")}
            </h3>

            <form onSubmit={handleSubmit(onGenerate)} className="space-y-4">
              <button
                type="button"
                onClick={fillCurrentWeek}
                className="w-full text-xs text-primary border border-primary/30 rounded-xl py-1.5 hover:bg-primary/5 transition-colors"
              >
                📅 {t("planningPage.currentWeek")}
              </button>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("planningPage.startDateLabel")}
                </label>
                <input
                  type="date"
                  {...register("startDate", { required: true })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("planningPage.endDateLabel")}
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
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="flex-1 bg-primary text-white text-sm font-semibold py-2 rounded-(--radius-button) hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {generateMutation.isPending ? t("planningPage.generating") : t("planningPage.generateSubmit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatScheduleDate(iso: string): string {
  return formatDate(new Date(iso), { day: "numeric", month: "short" });
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

// Cap de sécurité (pas de limite métier à 7 jours — un planning généré
// manuellement peut couvrir une plage plus large ; on évite juste un rendu
// dégénéré si une plage aberrante est saisie).
const MAX_CALENDAR_DAYS = 31;

function getDaysInRange(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end && days.length < MAX_CALENDAR_DAYS) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

const CALENDAR_BADGE: Record<CalendarEntry["type"], string> = {
  HOLIDAY: "🎉",
  VACATION: "🏖️",
};

const CALENDAR_TINT: Record<CalendarEntry["type"], string> = {
  HOLIDAY: "bg-amber-50",
  VACATION: "bg-blue-50",
};

function WeekCalendar({
  detail,
  calendarByDay,
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
  calendarByDay: Map<string, CalendarEntry>;
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
  const { t } = useTranslation();
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
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {/* En-têtes jours */}
        {days.map((d) => {
          const calendarEntry = calendarByDay.get(d);
          return (
            <div
              key={d}
              title={calendarEntry?.label ?? undefined}
              className={`text-center pb-1 border-b border-gray-100 rounded-t-lg ${
                calendarEntry ? CALENDAR_TINT[calendarEntry.type] : ""
              }`}
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {formatDate(new Date(d), { weekday: "short" })}
              </p>
              <p className="text-sm font-bold text-gray-700">
                {formatDate(new Date(d), { day: "numeric", month: "short" })}
              </p>
              {calendarEntry && (
                <p className="text-[10px] mt-0.5">
                  {CALENDAR_BADGE[calendarEntry.type]}
                </p>
              )}
            </div>
          );
        })}

        {/* Colonnes tâches */}
        {days.map((d) => {
          const calendarEntry = calendarByDay.get(d);
          return (
          <div
            key={d}
            className={`space-y-2 pt-1 rounded-b-lg ${
              calendarEntry ? CALENDAR_TINT[calendarEntry.type] : ""
            }`}
          >
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
                      {STATUS_KEYS[item.status as keyof typeof STATUS_KEYS]
                        ? t(STATUS_KEYS[item.status as keyof typeof STATUS_KEYS])
                        : item.status}
                    </button>
                  </div>

                  {/* Badge échange en cours */}
                  {pendingItemIds.has(item.id) && (
                    <p className="mt-1 text-[10px] text-yellow-600 font-medium">
                      ↔ {t("planningPage.exchangeInProgress")}
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
                        {t("planningPage.exchangeCta")}
                      </button>
                    )}
                </div>

                {/* Formulaire inline échange */}
                {exchangeItemId === item.id && (
                  <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-2 space-y-1.5">
                    <p className="text-[10px] text-secondary font-semibold">
                      {t("planningPage.exchangeWith")}
                    </p>
                    <select
                      value={exchangeToId}
                      onChange={(e) => onSetExchangeTo(e.target.value)}
                      className="w-full text-xs border border-secondary/30 rounded-lg px-2 py-1 bg-white focus:outline-none"
                    >
                      <option value="">{t("planningPage.choose")}</option>
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
                        {t("planningPage.propose")}
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
          );
        })}
      </div>
    </div>
  );
}
