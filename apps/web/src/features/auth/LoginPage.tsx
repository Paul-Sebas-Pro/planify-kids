import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";

interface FormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      const res = await authApi.login(values);
      setAuth({
        token: res.data.tokens.accessToken,
        user: res.data.user,
        family: res.data.family,
        member: res.data.member,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-white rounded-card shadow-lg">
        <h1 className="text-3xl font-bold font-title text-primary mb-2 text-center">
          Planify Kids
        </h1>
        <p className="text-center text-gray-500 mb-8 text-sm">Espace parent</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              {...register("email", { required: "Email requis" })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {errors.email && (
              <p className="text-danger text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              autoComplete="current-password"
              {...register("password", { required: "Mot de passe requis" })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
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
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-(--radius-button) hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
