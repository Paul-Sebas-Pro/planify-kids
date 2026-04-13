import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Reward, RewardClaim } from "@planify-kids/types";
import { rewardsApi } from "@/services/rewards.api";

interface RewardFormValues {
  name: string;
  icon: string;
  pointsCost: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvée",
  REJECTED: "Refusée",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-600 bg-yellow-50",
  APPROVED: "text-green-600 bg-green-50",
  REJECTED: "text-red-600 bg-red-50",
};

export function RewardsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: rewardsData, isLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: () => rewardsApi.list(),
  });

  const { data: claimsData } = useQuery({
    queryKey: ["reward-claims"],
    queryFn: () => rewardsApi.listClaims(),
  });

  const rewards: Reward[] = rewardsData?.data ?? [];
  const claims: RewardClaim[] = claimsData?.data ?? [];
  const pendingClaims = claims.filter((c) => c.status === "PENDING");

  const { register, handleSubmit, reset, setValue } = useForm<RewardFormValues>();

  const createMutation = useMutation({
    mutationFn: (data: RewardFormValues) =>
      rewardsApi.create({ ...data, pointsCost: Number(data.pointsCost) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards"] });
      setShowForm(false);
      reset();
      setApiError(null);
    },
    onError: (err: Error) => setApiError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: RewardFormValues) =>
      rewardsApi.update(editing!.id, { ...data, pointsCost: Number(data.pointsCost) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards"] });
      setEditing(null);
      setShowForm(false);
      reset();
      setApiError(null);
    },
    onError: (err: Error) => setApiError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rewardsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rewards"] }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ claimId, status }: { claimId: string; status: "APPROVED" | "REJECTED" }) =>
      rewardsApi.reviewClaim(claimId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reward-claims"] });
    },
  });

  function openCreate() {
    setEditing(null);
    reset({ name: "", icon: "", pointsCost: 0 });
    setShowForm(true);
  }

  function openEdit(reward: Reward) {
    setEditing(reward);
    setValue("name", reward.name);
    setValue("icon", reward.icon);
    setValue("pointsCost", reward.pointsCost);
    setShowForm(true);
  }

  function onSubmit(data: RewardFormValues) {
    setApiError(null);
    if (editing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  if (isLoading) {
    return <p className="p-6 text-gray-500">Chargement...</p>;
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Récompenses</h1>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Nouvelle récompense
        </button>
      </div>

      {apiError && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{apiError}</p>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editing ? "Modifier la récompense" : "Nouvelle récompense"}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                {...register("name", { required: true })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="ex. Sortie cinéma"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icone</label>
                <input
                  {...register("icon", { required: true })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="ex. 🎬"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cout (points)</label>
                <input
                  type="number"
                  min={1}
                  {...register("pointsCost", { required: true, min: 1 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {editing ? "Enregistrer" : "Créer"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); reset(); }}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => (
          <div key={reward.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{reward.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{reward.name}</p>
                  <p className="text-sm text-indigo-600 font-medium">{reward.pointsCost} pts</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(reward)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  Modifier
                </button>
                <button
                  onClick={() => deleteMutation.mutate(reward.id)}
                  className="text-red-400 hover:text-red-600 text-sm"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
        {rewards.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-8">
            Aucune récompense. Commencez par en créer une.
          </p>
        )}
      </div>

      {claims.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Demandes{" "}
            {pendingClaims.length > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-700 text-sm font-medium px-2 py-0.5 rounded-full">
                {pendingClaims.length} en attente
              </span>
            )}
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {claims.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{claim.reward.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{claim.reward.name}</p>
                    <p className="text-sm text-gray-500">
                      {claim.member.name} · {claim.reward.pointsCost} pts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[claim.status] ?? ""}`}
                  >
                    {STATUS_LABELS[claim.status] ?? claim.status}
                  </span>
                  {claim.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => reviewMutation.mutate({ claimId: claim.id, status: "APPROVED" })}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => reviewMutation.mutate({ claimId: claim.id, status: "REJECTED" })}
                        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs px-3 py-1.5 rounded-lg"
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
