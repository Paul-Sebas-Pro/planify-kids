import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { Reward, RewardClaim } from "@planify-kids/types";
import { rewardsApi } from "@/services/rewards.api";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonList } from "@/components/shared/Skeleton";
import { IconPicker } from "@/components/shared/IconPicker";

interface RewardFormValues {
  name: string;
  icon: string;
  pointsCost: number;
}

const REWARD_ICONS = [
  "🎁", "🍦", "🎮", "🍫", "🎬", "🎡",
  "🍕", "🧸", "🎨", "🚲", "🏊", "🎢",
];

const STATUS_KEYS: Record<string, string> = {
  PENDING: "rewardsPage.statusPending",
  APPROVED: "rewardsPage.statusApproved",
  REJECTED: "rewardsPage.statusRejected",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-accent bg-accent/10",
  APPROVED: "text-primary bg-primary/10",
  REJECTED: "text-danger bg-danger/10",
};

export function RewardsPage() {
  const { t } = useTranslation();
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

  const { register, handleSubmit, reset, setValue, watch } = useForm<RewardFormValues>();
  const selectedIcon = watch("icon");

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
      rewardsApi.update(editing!.id, {
        ...data,
        pointsCost: Number(data.pointsCost),
      }),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards"] });
      setApiError(null);
    },
    onError: (err: Error) => setApiError(err.message),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      claimId,
      status,
    }: {
      claimId: string;
      status: "APPROVED" | "REJECTED";
    }) => rewardsApi.reviewClaim(claimId, { status }),
    onSuccess: () => {
      setApiError(null);
      qc.invalidateQueries({ queryKey: ["reward-claims"] });
    },
    // Refus serveur (solde insuffisant, demande déjà traitée ailleurs) : le
    // montrer au parent et rafraîchir la liste plutôt que d'échouer en silence.
    onError: (err: Error) => {
      setApiError(err.message);
      qc.invalidateQueries({ queryKey: ["reward-claims"] });
    },
  });

  function openCreate() {
    setEditing(null);
    reset({ name: "", icon: REWARD_ICONS[0], pointsCost: 0 });
    setApiError(null);
    setShowForm(true);
  }

  function openEdit(reward: Reward) {
    setEditing(reward);
    setValue("name", reward.name);
    setValue("icon", reward.icon);
    setValue("pointsCost", reward.pointsCost);
    setApiError(null);
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
    return <SkeletonList count={3} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-title font-bold text-gray-800">
          {t("rewardsPage.title")}
        </h2>
        <button
          onClick={openCreate}
          className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-button transition-colors"
        >
          {t("rewardsPage.newReward")}
        </button>
      </div>

      {apiError && (
        <p className="text-sm text-danger bg-danger/10 px-4 py-2.5 rounded-xl">
          {apiError}
        </p>
      )}

      {showForm && (
        <div className="bg-white rounded-card shadow-sm p-6">
          <h3 className="font-title text-lg font-bold text-gray-900 mb-4">
            {editing ? t("rewardsPage.editRewardTitle") : t("rewardsPage.newRewardTitle")}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t("rewardsPage.nameLabel")}
              </label>
              <input
                {...register("name", { required: true })}
                placeholder={t("rewardsPage.namePlaceholder")}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("rewardsPage.iconLabel")}
              </label>
              <IconPicker
                value={selectedIcon}
                onChange={(icon) => setValue("icon", icon)}
                options={REWARD_ICONS}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t("rewardsPage.costLabel")}
              </label>
              <input
                type="number"
                min={1}
                {...register("pointsCost", { required: true, min: 1 })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-4 py-2 rounded-button text-sm font-semibold transition-colors"
              >
                {editing ? t("common.save") : t("rewardsPage.create")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  reset();
                }}
                className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-button text-sm transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => (
          <div
            key={reward.id}
            className="bg-white rounded-card shadow-sm p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{reward.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{reward.name}</p>
                  <p className="font-score text-sm font-semibold text-accent">
                    {reward.pointsCost} pts
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(reward)}
                  className="text-xs text-secondary hover:underline"
                >
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(reward.id)}
                  className="text-xs text-danger hover:underline"
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        ))}
        {rewards.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon="🎁"
              title={t("rewardsPage.emptyTitle")}
              description={t("rewardsPage.emptyDescription")}
              action={{ label: t("rewardsPage.emptyAction"), onClick: openCreate }}
            />
          </div>
        )}
      </div>

      {claims.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t("rewardsPage.claimsTitle")}
            {pendingClaims.length > 0 && (
              <span className="ml-2 bg-accent/10 text-accent text-xs font-medium px-2 py-0.5 rounded-full">
                {t("rewardsPage.pendingCount", { count: pendingClaims.length })}
              </span>
            )}
          </h3>
          <div className="bg-white rounded-card shadow-sm divide-y divide-gray-100">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{claim.reward.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {claim.reward.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {claim.member.name} &middot; {claim.reward.pointsCost} pts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[claim.status] ?? ""}`}
                  >
                    {(() => {
                      const statusKey = STATUS_KEYS[claim.status];
                      return statusKey ? t(statusKey) : claim.status;
                    })()}
                  </span>
                  {claim.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          reviewMutation.mutate({
                            claimId: claim.id,
                            status: "APPROVED",
                          })
                        }
                        className="bg-primary hover:bg-primary/90 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {t("rewardsPage.approve")}
                      </button>
                      <button
                        onClick={() =>
                          reviewMutation.mutate({
                            claimId: claim.id,
                            status: "REJECTED",
                          })
                        }
                        className="bg-danger/10 hover:bg-danger/20 text-danger text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {t("rewardsPage.reject")}
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
