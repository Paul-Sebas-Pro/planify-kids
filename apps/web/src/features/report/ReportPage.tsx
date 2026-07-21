import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { ChildReport } from "@planify-kids/types";
import { reportApi } from "@/services/report.api";

interface ReportFormValues {
  startDate: string;
  endDate: string;
}

function getCurrentWeek(): { startDate: string; endDate: string } {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    startDate: monday.toISOString().slice(0, 10),
    endDate: sunday.toISOString().slice(0, 10),
  };
}

export function ReportPage() {
  const { t } = useTranslation();
  const { startDate: defaultStart, endDate: defaultEnd } = getCurrentWeek();

  const { register, handleSubmit, setValue, watch } =
    useForm<ReportFormValues>({
      defaultValues: { startDate: defaultStart, endDate: defaultEnd },
    });

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["report", startDate, endDate],
    queryFn: () => reportApi.get(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });

  const report = data?.data;

  function fillCurrentWeek() {
    const { startDate: s, endDate: e } = getCurrentWeek();
    setValue("startDate", s);
    setValue("endDate", e);
  }

  function onSubmit(values: ReportFormValues) {
    void refetch();
    void values;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-title text-2xl font-bold text-gray-900 mb-6">
        {t("reportPage.title")}
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-wrap items-end gap-3 mb-8 p-4 bg-white rounded-card border border-gray-100 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{t("reportPage.startLabel")}</label>
          <input
            type="date"
            {...register("startDate")}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{t("reportPage.endLabel")}</label>
          <input
            type="date"
            {...register("endDate")}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="button"
          onClick={fillCurrentWeek}
          className="px-3 py-2 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          📅 {t("reportPage.currentWeek")}
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
        >
          {t("reportPage.generate")}
        </button>
      </form>

      {isLoading && (
        <p className="text-gray-400 text-sm">{t("reportPage.loading")}</p>
      )}

      {report && (
        <>
          <p className="text-sm text-gray-400 mb-4">
            {report.startDate} → {report.endDate}
          </p>
          <div className="bg-white rounded-card border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-medium text-gray-500">{t("reportPage.colChild")}</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center">{t("reportPage.colTasksDone")}</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center">{t("reportPage.colTasksSkipped")}</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center">{t("reportPage.colPoints")}</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center">{t("reportPage.colBadges")}</th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-center">{t("reportPage.colRewards")}</th>
                </tr>
              </thead>
              <tbody>
                {report.children.map((child: ChildReport, i) => (
                  <tr
                    key={child.memberId}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {child.avatar && (
                          <span className="text-lg">{child.avatar}</span>
                        )}
                        <span
                          className="font-medium"
                          style={{ color: child.color ?? undefined }}
                        >
                          {child.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center text-emerald-600 font-medium">
                      {child.tasksCompleted}
                    </td>
                    <td className="px-5 py-3 text-center text-gray-400">
                      {child.tasksSkipped}
                    </td>
                    <td className="px-5 py-3 text-center font-semibold text-primary">
                      {child.pointsEarned}
                    </td>
                    <td className="px-5 py-3 text-center text-yellow-500 font-medium">
                      {child.badgesEarned}
                    </td>
                    <td className="px-5 py-3 text-center text-purple-600 font-medium">
                      {child.rewardsApproved}
                    </td>
                  </tr>
                ))}
                {report.children.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-gray-400">
                      {t("reportPage.noChildren")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
