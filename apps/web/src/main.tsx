import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Providers } from "./app/providers";
import { AppRoutes } from "./app/routes";
import "./styles/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Element #root introuvable");

createRoot(root).render(
  <StrictMode>
    <Providers>
      <AppRoutes />
    </Providers>
  </StrictMode>,
);
