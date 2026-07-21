import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { authApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";

interface FormValues {
  familyName: string;
  parentName: string;
  email: string;
  password: string;
}

const stepKeys = [
  "auth.register.steps.1",
  "auth.register.steps.2",
  "auth.register.steps.3",
];

export function RegisterPage() {
  const { t } = useTranslation();
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
        err instanceof Error ? err.message : t("auth.register.genericError"),
      );
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left pane */}
      <div className="w-150 bg-primary flex flex-col justify-between px-14 py-16 shrink-0">
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
            {t("auth.register.pitchTitle1")}
            <br />
            {t("auth.register.pitchTitle2")}
            <br />
            {t("auth.register.pitchTitle3")}
          </h2>
          <p className="font-body text-base text-white/80 leading-relaxed">
            {t("auth.register.pitchDescription")}
          </p>
          <div className="bg-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <span className="font-body text-xs font-bold text-white/60 uppercase tracking-wider">
              {t("auth.register.howItWorks")}
            </span>
            {stepKeys.map((stepKey, i) => (
              <div key={stepKey} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <span className="font-score text-sm font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <span className="font-body text-sm font-semibold text-white">
                  {t(stepKey)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-8">
          {(
            [
              ["stat1Value", "stat1Label"],
              ["stat2Value", "stat2Label"],
              ["stat3Value", "stat3Label"],
            ] as const
          ).map(([valKey, labelKey]) => (
            <div key={labelKey} className="flex flex-col gap-0.5">
              <span className="font-score text-2xl font-extrabold text-white">
                {t(`auth.register.${valKey}`)}
              </span>
              <span className="font-body text-xs text-white/60">
                {t(`auth.register.${labelKey}`)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right pane */}
      <div className="flex-1 bg-white flex items-center justify-center px-16 py-12">
        <div className="w-full max-w-110 bg-white rounded-card shadow-2xl p-10 flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="font-title text-3xl font-bold text-gray-900">
              {t("auth.register.title")}
            </h1>
            <p className="font-body text-sm text-gray-500 leading-relaxed">
              {t("auth.register.subtitle")}
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {t("auth.register.familyNameLabel")}
              </label>
              <input
                type="text"
                placeholder={t("auth.register.familyNamePlaceholder")}
                {...register("familyName", {
                  required: t("auth.register.familyNameRequired"),
                })}
                className="w-full bg-background border border-gray-200 rounded-xl px-4 h-11.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-gray-400"
              />
              {errors.familyName && (
                <p className="text-danger text-xs mt-1">
                  {errors.familyName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {t("auth.register.parentNameLabel")}
              </label>
              <input
                type="text"
                placeholder={t("auth.register.parentNamePlaceholder")}
                {...register("parentName", {
                  required: t("auth.register.parentNameRequired"),
                })}
                className="w-full bg-background border border-gray-200 rounded-xl px-4 h-11.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-gray-400"
              />
              {errors.parentName && (
                <p className="text-danger text-xs mt-1">
                  {errors.parentName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {t("auth.register.emailLabel")}
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder={t("auth.register.emailPlaceholder")}
                {...register("email", {
                  required: t("auth.register.emailRequired"),
                })}
                className="w-full bg-background border border-gray-200 rounded-xl px-4 h-11.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-gray-400"
              />
              {errors.email && (
                <p className="text-danger text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {t("auth.register.passwordLabel")}
              </label>
              <input
                type="password"
                autoComplete="new-password"
                placeholder={t("auth.register.passwordPlaceholder")}
                {...register("password", {
                  required: t("auth.register.passwordRequired"),
                  minLength: {
                    value: 8,
                    message: t("auth.register.passwordMinLength"),
                  },
                })}
                className="w-full bg-background border border-gray-200 rounded-xl px-4 h-11.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-gray-400"
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
              className="w-full h-13 bg-primary text-white font-body text-base font-bold rounded-button hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20 mt-2"
            >
              {isSubmitting
                ? t("auth.register.submitting")
                : t("auth.register.submit")}
            </button>
          </form>

          <p className="text-center font-body text-sm text-gray-500">
            {t("auth.register.hasAccount")}{" "}
            <Link
              to="/login"
              className="text-primary font-bold hover:underline"
            >
              {t("auth.register.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
