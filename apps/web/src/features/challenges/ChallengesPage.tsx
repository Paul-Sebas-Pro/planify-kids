import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { FamilyChallenge, CreateChallengeDto } from "@planify-kids/types";
import { challengesApi } from "@/services/challenges.api";

function statusLabel(status: FamilyChallenge["status"]) {
  if (status === "COMPLETED") return { text: "Terminé ✅", cls: "bg-emerald-100 text-emerald-700" };
  if (status === "FAILED") return { text: "Échoué ❌", cls: "bg-red-100 text-red-700" };
  return { text: "En cours", cls: "bg-blue-100 text-blue-700" };
}

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{current} pts gagnés</span>
        <span>objectif {target} pts</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{pct}% atteint</p>
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
  const { text, cls } = statusLabel(challenge.status);
  const start = new Date(challenge.startDate).toLocaleDateString("fr-FR");
  const end = new Date(challenge.endDate).toLocaleDateString("fr-FR");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-title font-semibold text-gray-800 text-base">
              {challenge.title}
            </h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
              {text}
            </span>
          </div>
          {challenge.description && (
            <p className="text-sm text-gray-500 mt-1">{challenge.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {start} → {end} · bonus {challenge.bonusPoints} pts
          </p>
        </div>
        {challenge.status === "ACTIVE" && (
          <button
            onClick={() => onFail(challenge.id)}
            className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0"
          >
            Abandonner
          </button>
        )}
      </div>
      <ProgressBar current={0} target={challenge.targetPoints} />
    </div>
  );
}

export function ChallengesPage() {
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
            Challenges famille
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Objectifs collectifs avec bonus automatique
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-emerald-600 transition-colors"
        >
          + Nouveau
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4"
        >
          <h2 className="font-title font-semibold text-gray-700">Nouveau challenge</h2>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Titre</label>
            <input
              {...register("title", { required: true })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="100 pts cette semaine !"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">Champ requis</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description (optionnelle)</label>
            <input
              {...register("description")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Objectif (pts)</label>
              <input
                type="number"
                {...register("targetPoints", { required: true, valueAsNumber: true, min: 1 })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bonus (pts)</label>
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Début</label>
              <input
                type="date"
                {...register("startDate", { required: true })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fin</label>
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
              {createMutation.isPending ? "Création..." : "Créer le challenge"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); reset(); }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Annuler
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
          <p className="font-title text-lg font-semibold text-gray-700">Aucun challenge actif</p>
          <p className="text-sm text-gray-500 mt-1">Créez un objectif collectif pour motiver la famille !</p>
        </div>
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">En cours</h2>
          {active.map((c) => (
            <ChallengeCard key={c.id} challenge={c} onFail={(id) => failMutation.mutate(id)} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Historique</h2>
          {past.map((c) => (
            <ChallengeCard key={c.id} challenge={c} onFail={() => {}} />
          ))}
        </section>
      )}
    </div>
  );
}
