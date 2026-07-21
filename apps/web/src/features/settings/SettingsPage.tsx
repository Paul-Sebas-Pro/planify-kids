import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CALENDAR_ZONE_LABELS, type CalendarZone } from "@planify-kids/types";
import { familyApi } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { usePreferencesStore, type Language } from "@/store/preferences.store";
import i18n from "@/i18n/config";

interface FamilyFormValues {
  name: string;
}

export function SettingsPage() {
  const { t } = useTranslation();
  const { family, setFamily } = useAuthStore();
  const { language, setLanguage } = usePreferencesStore();
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [zoneSaved, setZoneSaved] = useState(false);

  function handleSetLanguage(lang: Language) {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  }

  const { data: familyQuery } = useQuery({
    queryKey: ["family"],
    queryFn: familyApi.get,
  });
  const familyCode = familyQuery?.data.code ?? family?.code;
  const schoolZone = familyQuery?.data.schoolZone ?? null;

  const { register, handleSubmit, formState: { isDirty } } = useForm<FamilyFormValues>({
    defaultValues: { name: family?.name ?? "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FamilyFormValues) => familyApi.update({ name: values.name }),
    onSuccess: (res) => {
      setFamily(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const zoneMutation = useMutation({
    mutationFn: (zone: CalendarZone | null) => familyApi.update({ schoolZone: zone }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["family"] });
      setZoneSaved(true);
      setTimeout(() => setZoneSaved(false), 2500);
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-title font-bold text-gray-800 mb-8">
        {t("settings.title")}
      </h2>

      <div className="max-w-sm space-y-6">
        <div className="bg-white rounded-card shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {t("settings.familyCode.title")}
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            {t("settings.familyCode.hint")}
          </p>
          <p className="text-2xl font-title font-bold tracking-widest text-primary">
            {familyCode ?? "—"}
          </p>
        </div>

        <div className="bg-white rounded-card shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {t("settings.family.title")}
          </h3>

          <form
            onSubmit={handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t("settings.family.nameLabel")}
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
                ? t("settings.family.saving")
                : saved
                  ? t("settings.family.saved")
                  : t("settings.family.save")}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-card shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {t("settings.schoolZone.title")}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {t("settings.schoolZone.hint")}
          </p>

          <select
            value={schoolZone ?? ""}
            onChange={(e) =>
              zoneMutation.mutate(
                e.target.value === "" ? null : (e.target.value as CalendarZone),
              )
            }
            disabled={zoneMutation.isPending}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
          >
            <option value="">{t("settings.schoolZone.none")}</option>
            {Object.entries(CALENDAR_ZONE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {zoneMutation.isError && (
            <p className="text-danger text-xs mt-2">
              {(zoneMutation.error as Error).message}
            </p>
          )}
          {zoneSaved && (
            <p className="text-primary text-xs mt-2">
              {t("settings.family.saved")}
            </p>
          )}
        </div>

        <div className="bg-white rounded-card shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {t("settings.language.title")}
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSetLanguage("fr")}
              className={`flex-1 text-sm font-semibold py-2 rounded-(--radius-button) transition-colors ${
                language === "fr"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t("settings.language.fr")}
            </button>
            <button
              type="button"
              onClick={() => handleSetLanguage("en")}
              className={`flex-1 text-sm font-semibold py-2 rounded-(--radius-button) transition-colors ${
                language === "en"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t("settings.language.en")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
