import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { FamilyChallenge, CreateChallengeDto } from "@planify-kids/types";
import { challengesApi } from "@/services/challenges.api";
import { formatDate } from "@/lib/formatDate";

function statusKey(status: FamilyChallenge["status"]) {
  if (status === "COMPLETED") return { key: "challengesPage.statusCompleted", cls: "bg-emerald-100 text-emerald-700" };
  if (status === "FAILED") return { key: "challengesPage.statusFailed", cls: "bg-red-100 text-red-700" };
  return { key: "challengesPage.statusActive", cls: "bg-blue-100 text-blue-700" };
}

function ProgressBar({ current, target }: { current: number; target: number }) {
  const { t } = useTranslation();
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{t("challengesPage.pointsEarned", { count: current })}</span>
        <span>{t("challengesPage.targetPoints", { count: target })}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{t("challengesPage.percentReached", { percent: pct })}</p>
    </div>
  );
}

function ChallengeCard({
  challenge,
  onFail,
}: {
  challenge: FamilyChallenge;
  onFail: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { key, cls } = statusKey(challenge.status);
  const start = formatDate(new Date(challenge.startDate));
  const end = formatDate(new Date(challenge.endDate));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-title font-semibold text-gray-800 text-base">
              {challenge.title}
            </h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
              {t(key)}
            </span>
          </div>
          {challenge.description && (
            <p className="text-sm text-gray-500 mt-1">{challenge.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {start} → {end} · {t("challengesPage.bonusSummary", { count: challenge.bonusPoints })}
          </p>
        </div>
        {challenge.status === "ACTIVE" && (
          <button
            onClick={() => onFail(challenge.id)}
            className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0"
          >
            {t("challengesPage.abandon")}
          </button>
        )}
      </div>
      <ProgressBar current={0} target={challenge.targetPoints} />
    </div>
  );
}

export function ChallengesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => challengesApi.list().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<CreateChallengeDto>();

  const createMutation = useMutation({
    mutationFn: (body: CreateChallengeDto) => challengesApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["challenges"] });
      setShowForm(false);
      reset();
    },
  });

  const failMutation = useMutation({
    mutationFn: (id: string) => challengesApi.markFailed(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["challenges"] }),
  });

  const active = data?.filter((c) => c.status === "ACTIVE") ?? [];
  const past = data?.filter((c) => c.status !== "ACTIVE") ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-title text-2xl font-bold text-gray-800">
            {t("challengesPage.title")}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t("challengesPage.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors"
        >
          {t("challengesPage.new")}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4"
        >
          <h2 className="font-title font-semibold text-gray-700">{t("challengesPage.newChallengeTitle")}</h2>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t("challengesPage.titleLabel")}</label>
            <input
              {...register("title", { required: true })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder={t("challengesPage.titlePlaceholder")}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{t("challengesPage.titleRequired")}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t("challengesPage.descriptionLabel")}</label>
            <input
              {...register("description")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("challengesPage.targetLabel")}</label>
              <input
                type="number"
                {...register("targetPoints", { required: true, valueAsNumber: true, min: 1 })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("challengesPage.bonusLabel")}</label>
              <input
                type="number"
                {...register("bonusPoints", { required: true, valueAsNumber: true, min: 1 })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("challengesPage.startLabel")}</label>
              <input
                type="date"
                {...register("startDate", { required: true })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("challengesPage.endLabel")}</label>
              <input
                type="date"
                {...register("endDate", { required: true })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>

          {createMutation.error && (
            <p className="text-sm text-red-500">
              {(createMutation.error as Error).message}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-emerald-500 text-white text-sm font-semibold py-2 rounded-xl hover:bg-emerald-600 disabled:opacity-60 transition-colors"
            >
              {createMutation.isPending ? t("challengesPage.creating") : t("challengesPage.createChallenge")}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); reset(); }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-2 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && active.length === 0 && !showForm && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-title text-lg font-semibold text-gray-700">{t("challengesPage.emptyTitle")}</p>
          <p className="text-sm text-gray-500 mt-1">{t("challengesPage.emptyDescription")}</p>
        </div>
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("challengesPage.active")}</h2>
          {active.map((c) => (
            <ChallengeCard key={c.id} challenge={c} onFail={(id) => failMutation.mutate(id)} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t("challengesPage.history")}</h2>
          {past.map((c) => (
            <ChallengeCard key={c.id} challenge={c} onFail={() => {}} />
          ))}
        </section>
      )}
    </div>
  );
}
