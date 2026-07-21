import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TaskTemplate, Frequency } from "@planify-kids/types";
import { tasksApi } from "@/services/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonList } from "@/components/shared/Skeleton";
import { IconPicker } from "@/components/shared/IconPicker";

interface TaskFormValues {
  name: string;
  description: string;
  icon: string;
  difficulty: number;
  duration: number;
  points: number;
  frequency: Frequency;
  isMandatory: boolean;
  isActive: boolean;
}

const TASK_ICONS = [
  "🧹", "🧺", "🍽️", "🛏️", "🐕", "📚",
  "🌱", "🧽", "🚮", "🧼", "🍳", "👕",
];

const DIFFICULTY_KEYS: Record<number, string> = {
  1: "common.difficulty.easy",
  2: "common.difficulty.medium",
  3: "common.difficulty.hard",
};
const FREQUENCY_KEYS: Record<Frequency, string> = {
  daily: "common.frequency.daily",
  weekly: "common.frequency.weekly",
  monthly: "common.frequency.monthly",
};

export function TasksPage() {
  const { t } = useTranslation();
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

  const { register, handleSubmit, reset, watch, setValue } = useForm<TaskFormValues>({
    defaultValues: {
      icon: TASK_ICONS[0],
      difficulty: 1,
      frequency: "daily",
      isMandatory: false,
      isActive: true,
    },
  });

  const selectedIcon = watch("icon");

  function openCreate() {
    reset({
      icon: TASK_ICONS[0],
      difficulty: 1,
      frequency: "daily",
      isMandatory: false,
      isActive: true,
    });
    setEditTarget(null);
    setApiError(null);
    setShowForm(true);
  }

  function openEdit(task: TaskTemplate) {
    reset({
      name: task.name,
      description: task.description ?? "",
      icon: task.icon || TASK_ICONS[0],
      difficulty: task.difficulty,
      duration: task.duration,
      points: task.points,
      frequency: task.frequency,
      isMandatory: task.isMandatory,
      isActive: task.isActive,
    });
    setEditTarget(task);
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
      icon: values.icon,
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
        <h2 className="text-2xl font-title font-bold text-gray-800">{t("tasksPage.title")}</h2>
        <button
          onClick={openCreate}
          className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-(--radius-button) hover:bg-primary/90 transition-colors"
        >
          {t("tasksPage.newTask")}
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-500 mb-6 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => setShowAll(e.target.checked)}
          className="accent-primary"
        />
        {t("tasksPage.showInactive")}
      </label>

      {apiError && (
        <p className="text-danger text-sm bg-red-50 rounded-xl px-4 py-2.5 mb-4">
          {apiError}
        </p>
      )}

      {isLoading ? (
        <SkeletonList count={4} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="✅"
          title={t("tasksPage.emptyTitle")}
          description={t("tasksPage.emptyDescription")}
          action={{ label: t("tasksPage.emptyAction"), onClick: openCreate }}
        />
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-card p-4 shadow-sm flex items-start gap-4 ${
                !task.isActive ? "opacity-50" : ""
              }`}
            >
              <span className="text-2xl shrink-0">{task.icon || "🧹"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{task.name}</p>
                  {task.isMandatory && (
                    <span className="text-xs bg-accent/10 text-accent font-medium px-2 py-0.5 rounded-full">
                      {t("common.mandatory")}
                    </span>
                  )}
                  {!task.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-400 font-medium px-2 py-0.5 rounded-full">
                      {t("common.inactive")}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-gray-400 mb-2 truncate">
                    {task.description}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {(() => {
                    const difficultyKey = DIFFICULTY_KEYS[task.difficulty];
                    return difficultyKey ? t(difficultyKey) : task.difficulty;
                  })()} &middot;{" "}
                  {task.duration} min &middot; {task.points} pts &middot;{" "}
                  {t(FREQUENCY_KEYS[task.frequency])}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(task)}
                  className="text-xs text-secondary hover:underline"
                >
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(task.id)}
                  className="text-xs text-danger hover:underline"
                >
                  {t("common.delete")}
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
              {editTarget ? t("tasksPage.editTaskTitle") : t("tasksPage.newTaskTitle")}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("tasksPage.nameLabel")}
                </label>
                <input
                  type="text"
                  {...register("name", { required: true })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("tasksPage.descriptionLabel")}
                </label>
                <textarea
                  {...register("description")}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("tasksPage.iconLabel")}
                </label>
                <IconPicker
                  value={selectedIcon}
                  onChange={(icon) => setValue("icon", icon)}
                  options={TASK_ICONS}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("tasksPage.difficultyLabel")}
                  </label>
                  <select
                    {...register("difficulty")}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value={1}>{t("common.difficulty.easy")}</option>
                    <option value={2}>{t("common.difficulty.medium")}</option>
                    <option value={3}>{t("common.difficulty.hard")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("tasksPage.frequencyLabel")}
                  </label>
                  <select
                    {...register("frequency")}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="daily">{t("common.frequency.daily")}</option>
                    <option value="weekly">{t("common.frequency.weekly")}</option>
                    <option value="monthly">{t("common.frequency.monthly")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t("tasksPage.durationLabel")}
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
                    {t("tasksPage.pointsLabel")}
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
                  {t("common.mandatory")}
                </label>

                {editTarget && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      {...register("isActive")}
                      className="accent-primary"
                    />
                    {t("common.active")}
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
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-primary text-white text-sm font-semibold py-2 rounded-(--radius-button) hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
