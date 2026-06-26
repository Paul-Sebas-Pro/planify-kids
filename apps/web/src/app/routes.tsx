import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useAuthStore } from "@/store/auth.store";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { FamilyPage } from "@/features/family/FamilyPage";
import { TasksPage } from "@/features/tasks/TasksPage";
import { PlanningPage } from "@/features/planning/PlanningPage";
import { RewardsPage } from "@/features/rewards/RewardsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { ReportPage } from "@/features/report/ReportPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/report" element={<ReportPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
