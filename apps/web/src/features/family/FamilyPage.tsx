import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import type { FamilyMember, Role } from "@planify-kids/types";
import { membersApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonList } from "@/components/shared/Skeleton";
import { MemberTimelineModal } from "./MemberTimelineModal";

interface MemberFormValues {
  name: string;
  role: Role;
  color: string;
  avatar: string;
  birthDate: string;
}

const COLORS = [
  "#FF9800",
  "#2196F3",
  "#9C27B0",
  "#4CAF50",
  "#F44336",
  "#00BCD4",
];

const AVATARS = ["🦊", "🐼", "🦁", "🐸", "🐧", "🦄", "🐻", "🐯"];

export function FamilyPage() {
  const qc = useQueryClient();
  const { member: currentMember } = useAuthStore();
  const [editTarget, setEditTarget] = useState<FamilyMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pinTarget, setPinTarget] = useState<FamilyMember | null>(null);
  const [timelineTarget, setTimelineTarget] = useState<FamilyMember | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => membersApi.list(),
  });

  const members = data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: membersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      setShowForm(false);
      reset();
    },
    onError: (err: Error) => setApiError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<MemberFormValues>;
    }) => membersApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      setShowForm(false);
      setEditTarget(null);
      reset();
    },
    onError: (err: Error) => setApiError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: membersApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
    onError: (err: Error) => setApiError(err.message),
  });

  const { register, handleSubmit, reset, setValue, watch } =
    useForm<MemberFormValues>({
      defaultValues: { role: "CHILD", color: COLORS[0], avatar: "" },
    });

  const selectedColor = watch("color");
  const selectedAvatar = watch("avatar");

  function openCreate() {
    reset({ role: "CHILD", color: COLORS[0] ?? "#FF9800", avatar: "" });
    setEditTarget(null);
    setApiError(null);
    setShowForm(true);
  }

  function openEdit(m: FamilyMember) {
    reset({
      name: m.name,
      role: m.role,
      color: m.color ?? COLORS[0] ?? "#FF9800",
      avatar: m.avatar ?? "",
      // L'API renvoie birthDate en ISO datetime complet (ex "2015-06-01T00:00:00.000Z"),
      // mais <input type="date"> et le schéma Zod (z.iso.date()) attendent du
      // YYYY-MM-DD. Sans ce slice, le champ s'affiche vide (le navigateur rejette
      // le format et vide le champ) MAIS react-hook-form soumet quand même la
      // valeur brute mise en cache par reset() → 400 systématique dès qu'un
      // membre a une date de naissance, quel que soit le champ modifié.
      birthDate: m.birthDate ? m.birthDate.slice(0, 10) : "",
    });
    setEditTarget(m);
    setApiError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
    reset();
  }

  function onSubmit(values: MemberFormValues) {
    setApiError(null);
    const body = {
      name: values.name,
      role: values.role,
      color: values.color || undefined,
      avatar: values.avatar || undefined,
      birthDate: values.birthDate || undefined,
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
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-title font-bold text-gray-800">Famille</h2>
        <button
          onClick={openCreate}
          className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-(--radius-button) hover:bg-primary/90 transition-colors"
        >
          Ajouter un membre
        </button>
      </div>

      {apiError && (
        <p className="text-danger text-sm bg-red-50 rounded-xl px-4 py-2.5 mb-4">
          {apiError}
        </p>
      )}

      {isLoading ? (
        <SkeletonList count={3} />
      ) : members.length === 0 ? (
        <EmptyState
          icon="👨‍👩‍👧"
          title="Aucun membre"
          description="Ajoutez les membres de votre famille pour leur assigner des tâches."
          action={{ label: "Ajouter un membre", onClick: openCreate }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-card p-4 shadow-sm flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: m.color ?? "#9e9e9e" }}
              >
                {m.avatar ? (
                  <span className="text-lg">{m.avatar}</span>
                ) : (
                  m.name[0]?.toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{m.name}</p>
                <p className="text-xs text-gray-400">
                  {m.role === "PARENT" ? "Parent" : "Enfant"} &middot;{" "}
                  {m.points} pts
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0 items-end">
                <button
                  onClick={() => openEdit(m)}
                  className="text-xs text-secondary hover:underline"
                >
                  Modifier
                </button>
                {m.role === "CHILD" && (
                  <>
                    <button
                      onClick={() => setPinTarget(m)}
                      className="text-xs text-gray-400 hover:underline"
                    >
                      PIN
                    </button>
                    <button
                      onClick={() => setTimelineTarget(m)}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Historique
                    </button>
                  </>
                )}
                {m.id !== currentMember?.id && (
                  <button
                    onClick={() => deleteMutation.mutate(m.id)}
                    className="text-xs text-danger hover:underline"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-card p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-title font-bold text-lg mb-4">
              {editTarget ? "Modifier le membre" : "Nouveau membre"}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  Rôle
                </label>
                <select
                  {...register("role")}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="CHILD">Enfant</option>
                  <option value="PARENT">Parent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Avatar
                </label>
                <div className="flex gap-2 flex-wrap">
                  {AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() =>
                        setValue(
                          "avatar",
                          selectedAvatar === emoji ? "" : emoji,
                        )
                      }
                      className="w-9 h-9 rounded-xl text-xl flex items-center justify-center border-2 transition-all"
                      style={{
                        borderColor:
                          selectedAvatar === emoji ? "#6C63FF" : "transparent",
                        backgroundColor:
                          selectedAvatar === emoji ? "#ede9fe" : "#f8f8f8",
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Couleur
                </label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue("color", c)}
                      className="w-7 h-7 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: c,
                        borderColor:
                          selectedColor === c ? "#111" : "transparent",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Date de naissance
                </label>
                <input
                  type="date"
                  {...register("birthDate")}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
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

      {pinTarget && (
        <PinModal
          member={pinTarget}
          onClose={() => setPinTarget(null)}
          onSuccess={() => {
            setPinTarget(null);
          }}
        />
      )}

      {timelineTarget && (
        <MemberTimelineModal
          member={timelineTarget}
          onClose={() => setTimelineTarget(null)}
        />
      )}
    </div>
  );
}

function PinModal({
  member,
  onClose,
  onSuccess,
}: {
  member: FamilyMember;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (p: string) => membersApi.updatePin(member.id, p),
    onSuccess,
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4}$/.test(pin)) {
      setError("Le PIN doit être exactement 4 chiffres");
      return;
    }
    mutation.mutate(pin);
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-card p-6 w-full max-w-xs shadow-xl">
        <h3 className="font-title font-bold text-lg mb-1">Modifier le PIN</h3>
        <p className="text-sm text-gray-400 mb-4">{member.name}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nouveau PIN (4 chiffres)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {error && <p className="text-danger text-xs">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-sm font-semibold py-2 rounded-(--radius-button) hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-primary text-white text-sm font-semibold py-2 rounded-(--radius-button) hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
