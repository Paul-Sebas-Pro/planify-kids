import { BrowserRouter, Routes, Route, Navigate } from "react-router";

// Pages (à créer au fil du développement)
// import { LoginPage } from "@/features/auth/LoginPage";
// import { DashboardPage } from "@/features/dashboard/DashboardPage";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Temporaire — sera remplacé par les vraies pages */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<div>Login (à implémenter)</div>} />
        <Route path="/dashboard" element={<div>Dashboard (à implémenter)</div>} />
        <Route path="*" element={<div>404</div>} />
      </Routes>
    </BrowserRouter>
  );
}
