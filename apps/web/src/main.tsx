import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { Providers } from "./app/providers";
import { AppRoutes } from "./app/routes";
import { initSentry } from "./config/sentry";
import "./i18n/config";
import "./styles/globals.css";

initSentry();

const root = document.getElementById("root");
if (!root) throw new Error("Element #root introuvable");

createRoot(root).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <p className="text-2xl mb-2">😵</p>
            <p className="text-gray-700 font-semibold">Une erreur inattendue s'est produite.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Recharger la page
            </button>
          </div>
        </div>
      }
    >
      <Providers>
        <AppRoutes />
      </Providers>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
