import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { familyApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";

interface FamilyFormValues {
  name: string;
}

export function SettingsPage() {
  const { family, setFamily } = useAuthStore();
  const [saved, setSaved] = useState(false);

  const { data: familyQuery } = useQuery({
    queryKey: ["family"],
    queryFn: familyApi.get,
  });
  const familyCode = familyQuery?.data.code ?? family?.code;

  const { register, handleSubmit, formState: { isDirty } } = useForm<FamilyFormValues>({
    defaultValues: { name: family?.name ?? "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FamilyFormValues) => familyApi.update(values.name),
    onSuccess: (res) => {
      setFamily(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-title font-bold text-gray-800 mb-8">
        Paramètres
      </h2>

      <div className="max-w-sm space-y-6">
        <div className="bg-white rounded-card shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Code famille
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            À saisir sur la tablette pour la connexion enfant.
          </p>
          <p className="text-2xl font-title font-bold tracking-widest text-primary">
            {familyCode ?? "—"}
          </p>
        </div>

        <div className="bg-white rounded-card shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Famille
          </h3>

          <form
            onSubmit={handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nom de la famille
              </label>
              <input
                type="text"
                {...register("name", { required: true, maxLength: 80 })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {mutation.isError && (
              <p className="text-danger text-xs">
                {(mutation.error as Error).message}
              </p>
            )}

            <button
              type="submit"
              disabled={!isDirty || mutation.isPending}
              className="w-full bg-primary text-white text-sm font-semibold py-2 rounded-(--radius-button) hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {mutation.isPending
                ? "Enregistrement..."
                : saved
                  ? "Enregistré ✓"
                  : "Enregistrer"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
