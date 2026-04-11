import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import type { TaskTemplate, Frequency } from "@planify-kids/types";
import { tasksApi } from "@/services/api";

interface TaskFormValues {
  name: string;
  description: string;
  difficulty: number;
  duration: number;
  points: number;
  frequency: Frequency;
  isMandatory: boolean;
  isActive: boolean;
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Facile",
  2: "Moyen",
  3: "Difficile",
};
const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Quotidienne",
  weekly: "Hebdomadaire",
  monthly: "Mensuelle",
};

export function TasksPage() {
  const qc = useQueryClient();
  const [showAll, setShowAll] = useState(false);
  const [editTarget, setEditTarget] = useState<TaskTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", showAll],
    queryFn: () => tasksApi.list(showAll),
  });

  const tasks = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setShowForm(false);
      reset();
    },
    onError: (err: Error) => setApiError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<TaskFormValues> }) =>
      tasksApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setEditTarget(null);
      setShowForm(false);
      reset();
    },
    onError: (err: Error) => setApiError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (err: Error) => setApiError(err.message),
  });

  const { register, handleSubmit, reset } = useForm<TaskFormValues>({
    defaultValues: {
      difficulty: 1,
      frequency: "daily",
      isMandatory: false,
      isActive: true,
    },
  });

  function openCreate() {
    reset({
      difficulty: 1,
      frequency: "daily",
      isMandatory: false,
      isActive: true,
    });
    setEditTarget(null);
    setApiError(null);
    setShowForm(true);
  }

  function openEdit(t: TaskTemplate) {
    reset({
      name: t.name,
      description: t.description ?? "",
      difficulty: t.difficulty,
      duration: t.duration,
      points: t.points,
      frequency: t.frequency,
      isMandatory: t.isMandatory,
      isActive: t.isActive,
    });
    setEditTarget(t);
    setApiError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
    reset();
  }

  function onSubmit(values: TaskFormValues) {
    setApiError(null);
    const body = {
      name: values.name,
      description: values.description || undefined,
      difficulty: Number(values.difficulty),
      duration: Number(values.duration),
      points: Number(values.points),
      frequency: values.frequency,
      isMandatory: values.isMandatory,
      ...(editTarget ? { isActive: values.isActive } : {}),
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, body });
    } else {
      createMutation.mutate(body);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-title font-bold text-gray-800">Tâches</h2>
        <button
          onClick={openCreate}
          className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-(--radius-button) hover:bg-primary/90 transition-colors"
        >
          Nouvelle tâche
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-500 mb-6 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => setShowAll(e.target.checked)}
          className="accent-primary"
        />
        Afficher les tâches inactives
      </label>

      {apiError && (
        <p className="text-danger text-sm bg-red-50 rounded-xl px-4 py-2.5 mb-4">
          {apiError}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Chargement...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-gray-400">Aucune tâche pour l'instant.</p>
      ) : (
        <div className="grid gap-3">
          {tasks.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-card p-4 shadow-sm flex items-start gap-4 ${
                !t.isActive ? "opacity-50" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{t.name}</p>
                  {t.isMandatory && (
                    <span className="text-xs bg-accent/10 text-accent font-medium px-2 py-0.5 rounded-full">
                      Obligatoire
                    </span>
                  )}
                  {!t.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-400 font-medium px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                {t.description && (
                  <p className="text-xs text-gray-400 mb-2 truncate">
                    {t.description}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {DIFFICULTY_LABELS[t.difficulty] ?? t.difficulty} &middot;{" "}
                  {t.duration} min &middot; {t.points} pts &middot;{" "}
                  {FREQUENCY_LABELS[t.frequency]}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(t)}
                  className="text-xs text-secondary hover:underline"
                >
                  Modifier
                </button>
                <button
                  onClick={() => deleteMutation.mutate(t.id)}
                  className="text-xs text-danger hover:underline"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-card p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-title font-bold text-lg mb-4">
              {editTarget ? "Modifier la tâche" : "Nouvelle tâche"}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  {...register("name", { required: true })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Difficulté
                  </label>
                  <select
                    {...register("difficulty")}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value={1}>Facile</option>
                    <option value={2}>Moyen</option>
                    <option value={3}>Difficile</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Fréquence
                  </label>
                  <select
                    {...register("frequency")}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="daily">Quotidienne</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuelle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Durée (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={480}
                    {...register("duration", { required: true, min: 1 })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    {...register("points", { required: true, min: 1 })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register("isMandatory")}
                    className="accent-primary"
                  />
                  Obligatoire
                </label>

                {editTarget && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register("isActive")}
                      className="accent-primary"
                    />
                    Active
                  </label>
                )}
              </div>

              {apiError && <p className="text-danger text-xs">{apiError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 border border-gray-200 text-sm font-semibold py-2 rounded-(--radius-button) hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-primary text-white text-sm font-semibold py-2 rounded-(--radius-button) hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
