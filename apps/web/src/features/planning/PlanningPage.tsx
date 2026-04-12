import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import type { ScheduleDetail } from "@planify-kids/types";
import { planningApi } from "@/services/planning.api";

interface GenerateFormValues {
  startDate: string;
  endDate: string;
}

const STATUS_LABELS = {
  PENDING: "En attente",
  COMPLETED: "Fait",
  SKIPPED: "Ignoré",
} as const;

const DIFFICULTY_DOTS = (d: number) => "●".repeat(d) + "○".repeat(3 - d);

export function PlanningPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: listData, isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: () => planningApi.list(),
  });

  const { data: detailData } = useQuery({
    queryKey: ["schedule", selectedId],
    queryFn: () => planningApi.get(selectedId!),
    enabled: selectedId !== null,
  });

  const schedules = listData?.data ?? [];
  const detail: ScheduleDetail | undefined = detailData?.data;

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
    mutationFn: ({ itemId, status }: { itemId: string; status: "PENDING" | "COMPLETED" | "SKIPPED" }) =>
      planningApi.updateItem(itemId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule", selectedId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: planningApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      setSelectedId(null);
    },
  });

  const { register, handleSubmit, reset: resetForm } = useForm<GenerateFormValues>();

  function onGenerate(values: GenerateFormValues) {
    setApiError(null);
    generateMutation.mutate(values);
  }

  // Groupe les items par date pour l'affichage
  const itemsByDate = detail
    ? detail.items.reduce<Record<string, typeof detail.items>>(
        (acc, item) => {
          const day = item.date.slice(0, 10);
          if (!acc[day]) acc[day] = [];
          acc[day]!.push(item);
          return acc;
        },
        {},
      )
    : {};

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-title font-bold text-gray-800">Planning</h2>
        <button
          onClick={() => { setShowGenerate(true); setApiError(null); }}
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
        <div className="flex-1 min-w-0">
          {!selectedId && (
            <p className="text-sm text-gray-400 mt-4">
              Sélectionnez un planning ou générez-en un nouveau.
            </p>
          )}

          {detail && (
            <>
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
                        <div
                          key={item.id}
                          className={`bg-white rounded-card p-3 shadow-sm flex items-center gap-3 ${
                            item.status === "COMPLETED" ? "opacity-60" : ""
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: item.member.color ?? "#9e9e9e" }}
                          >
                            {item.member.name[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.task.name}</p>
                            <p className="text-xs text-gray-400">
                              {item.member.name} &middot; {item.task.points} pts &middot;{" "}
                              <span className="font-mono text-[10px]">
                                {DIFFICULTY_DOTS(item.task.difficulty)}
                              </span>
                            </p>
                          </div>
                          <select
                            value={item.status}
                            onChange={(e) =>
                              updateItemMutation.mutate({
                                itemId: item.id,
                                status: e.target.value as "PENDING" | "COMPLETED" | "SKIPPED",
                              })
                            }
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/40"
                          >
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modale de génération */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-card p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-title font-bold text-lg mb-4">Générer un planning</h3>

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

              {apiError && (
                <p className="text-danger text-xs">{apiError}</p>
              )}

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
