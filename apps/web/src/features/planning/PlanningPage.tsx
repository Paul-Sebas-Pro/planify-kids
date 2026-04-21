import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import type { ScheduleDetail, TaskExchange } from "@planify-kids/types";
import { planningApi, exchangesApi } from "@/services/planning.api";
import { membersApi } from "@/services/api";

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

const DIFFICULTY_DOTS = (d: number) => "●".repeat(d) + "○".repeat(3 - d);

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
  } = useForm<GenerateFormValues>();

  function onGenerate(values: GenerateFormValues) {
    setApiError(null);
    generateMutation.mutate(values);
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

  const itemsByDate = detail
    ? detail.items.reduce<Record<string, typeof detail.items>>((acc, item) => {
        const day = item.date.slice(0, 10);
        if (!acc[day]) acc[day] = [];
        acc[day]!.push(item);
        return acc;
      }, {})
    : {};

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
            <p className="text-sm text-gray-400">Chargement...</p>
          ) : schedules.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun planning.</p>
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

              <div className="space-y-4">
                {Object.entries(itemsByDate).map(([day, items]) => (
                  <div key={day}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      {formatDateLong(day)}
                    </p>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="space-y-2">
                          <div
                            className={`bg-white rounded-card p-3 shadow-sm flex items-center gap-3 ${
                              item.status === "COMPLETED" ? "opacity-60" : ""
                            }`}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{
                                backgroundColor: item.member.color ?? "#9e9e9e",
                              }}
                            >
                              {item.member.name[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {item.task.name}
                                </p>
                                {pendingItemIds.has(item.id) && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full shrink-0">
                                    Échange en cours
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">
                                {item.member.name} &middot; {item.task.points}{" "}
                                pts &middot;{" "}
                                <span className="font-mono text-[10px]">
                                  {DIFFICULTY_DOTS(item.task.difficulty)}
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {item.status === "PENDING" &&
                                !pendingItemIds.has(item.id) &&
                                children.length > 1 && (
                                  <button
                                    onClick={() =>
                                      openExchange(
                                        item.id,
                                        item.assignedToMemberId,
                                      )
                                    }
                                    className="text-xs text-indigo-500 hover:text-indigo-700"
                                  >
                                    Échanger
                                  </button>
                                )}
                              <select
                                value={item.status}
                                onChange={(e) =>
                                  updateItemMutation.mutate({
                                    itemId: item.id,
                                    status: e.target.value as
                                      | "PENDING"
                                      | "COMPLETED"
                                      | "SKIPPED",
                                  })
                                }
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/40"
                              >
                                {Object.entries(STATUS_LABELS).map(
                                  ([val, label]) => (
                                    <option key={val} value={val}>
                                      {label}
                                    </option>
                                  ),
                                )}
                              </select>
                            </div>
                          </div>

                          {/* Formulaire inline d'échange */}
                          {exchangeItemId === item.id && (
                            <div className="ml-11 bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3">
                              <p className="text-xs text-indigo-700 font-medium shrink-0">
                                Échanger avec
                              </p>
                              <select
                                value={exchangeToId}
                                onChange={(e) =>
                                  setExchangeToId(e.target.value)
                                }
                                className="flex-1 text-xs border border-indigo-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
                              >
                                <option value="">Choisir un enfant</option>
                                {children
                                  .filter((c) => c.id !== exchangeFromId)
                                  .map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                              </select>
                              <button
                                onClick={submitExchange}
                                disabled={
                                  !exchangeToId || proposeMutation.isPending
                                }
                                className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg"
                              >
                                Proposer
                              </button>
                              <button
                                onClick={() => setExchangeItemId(null)}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                Annuler
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
                              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg"
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
                              className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg"
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

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
