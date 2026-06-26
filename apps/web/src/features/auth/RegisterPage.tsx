import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";

interface FormValues {
  familyName: string;
  parentName: string;
  email: string;
  password: string;
}

const steps = [
  "Créez votre compte famille",
  "Ajoutez vos enfants",
  "Lancez le planning ✓",
];

export function RegisterPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const res = await authApi.register(values);
      setAuth({
        token: res.data.tokens.accessToken,
        user: res.data.user,
        family: res.data.family,
        member: res.data.member,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la création du compte",
      );
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left pane */}
      <div className="w-[600px] bg-primary flex flex-col justify-between px-14 py-16 shrink-0">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-white inline-block" />
            <Link
              to="/"
              className="font-title text-2xl font-bold text-white hover:text-white/80 transition-colors"
            >
              Planify Kids
            </Link>
          </div>
          <h2 className="font-title text-[42px] font-bold text-white leading-[1.1]">
            Votre famille.
            <br />
            Vos règles.
            <br />
            Votre rythme.
          </h2>
          <p className="font-body text-base text-white/80 leading-relaxed">
            Créez votre espace famille en 2 minutes. Ajoutez vos enfants,
            personnalisez les tâches et lancez la première semaine.
          </p>
          <div className="bg-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <span className="font-body text-xs font-bold text-white/60 uppercase tracking-wider">
              Comment ça marche
            </span>
            {steps.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <span className="font-score text-sm font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <span className="font-body text-sm font-semibold text-white">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-8">
          {(
            [
              ["Gratuit", "Pour démarrer"],
              ["5 min", "Config. initiale"],
              ["Illimité", "Tâches & enfants"],
            ] as const
          ).map(([val, label]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="font-score text-2xl font-extrabold text-white">
                {val}
              </span>
              <span className="font-body text-xs text-white/60">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right pane */}
      <div className="flex-1 bg-white flex items-center justify-center px-16 py-12">
        <div className="w-full max-w-[440px] bg-white rounded-[20px] shadow-2xl p-10 flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="font-title text-3xl font-bold text-gray-900">
              Créer votre famille
            </h1>
            <p className="font-body text-sm text-gray-500 leading-relaxed">
              Quelques infos pour démarrer. Vous pourrez tout modifier ensuite.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Nom de votre famille
              </label>
              <input
                type="text"
                placeholder="ex : Famille Dupont"
                {...register("familyName", { required: "Nom de famille requis" })}
                className="w-full bg-background border border-gray-200 rounded-xl px-4 h-[46px] text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-gray-400"
              />
              {errors.familyName && (
                <p className="text-danger text-xs mt-1">
                  {errors.familyName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Votre prénom
              </label>
              <input
                type="text"
                placeholder="ex : Marie"
                {...register("parentName", { required: "Prénom requis" })}
                className="w-full bg-background border border-gray-200 rounded-xl px-4 h-[46px] text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-gray-400"
              />
              {errors.parentName && (
                <p className="text-danger text-xs mt-1">
                  {errors.parentName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Adresse e-mail
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="parent@exemple.com"
                {...register("email", { required: "Email requis" })}
                className="w-full bg-background border border-gray-200 rounded-xl px-4 h-[46px] text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-gray-400"
              />
              {errors.email && (
                <p className="text-danger text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="8 caractères minimum"
                {...register("password", {
                  required: "Mot de passe requis",
                  minLength: { value: 8, message: "8 caractères minimum" },
                })}
                className="w-full bg-background border border-gray-200 rounded-xl px-4 h-[46px] text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-gray-400"
              />
              {errors.password && (
                <p className="text-danger text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <p className="text-danger text-sm bg-red-50 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[52px] bg-primary text-white font-body text-base font-bold rounded-button hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20 mt-2"
            >
              {isSubmitting ? "Création..." : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center font-body text-sm text-gray-500">
            Déjà un compte ?{" "}
            <Link
              to="/login"
              className="text-primary font-bold hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
