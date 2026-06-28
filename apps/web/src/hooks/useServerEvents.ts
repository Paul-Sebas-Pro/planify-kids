import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useServerEvents() {
  const qc = useQueryClient();

  useEffect(() => {
    const source = new EventSource("/api/events");

    source.addEventListener("task_completed", (e) => {
      const data = JSON.parse(e.data) as {
        memberName: string;
        taskName: string;
        points: number;
      };
      qc.invalidateQueries({ queryKey: ["planning"] });
      qc.invalidateQueries({ queryKey: ["family-stats"] });
      // Toast natif — pas de dépendance externe
      const msg = `✅ ${data.memberName} a terminé « ${data.taskName} » (+${data.points} pts)`;
      showToast(msg, "success");
    });

    source.addEventListener("claim_submitted", (e) => {
      const data = JSON.parse(e.data) as {
        memberName: string;
        rewardName: string;
        pointsCost: number;
      };
      qc.invalidateQueries({ queryKey: ["rewards-claims"] });
      const msg = `🎁 ${data.memberName} réclame « ${data.rewardName} »`;
      showToast(msg, "info");
    });

    source.addEventListener("challenge_completed", (e) => {
      const data = JSON.parse(e.data) as {
        title: string;
        bonusPoints: number;
        totalPoints: number;
      };
      qc.invalidateQueries({ queryKey: ["challenges"] });
      qc.invalidateQueries({ queryKey: ["family-stats"] });
      const msg = `🏆 Challenge « ${data.title} » réussi ! +${data.bonusPoints} pts bonus pour tous`;
      showToast(msg, "success");
    });

    source.onerror = () => {
      // Le navigateur reconnecte automatiquement — pas d'action requise
    };

    return () => source.close();
  }, [qc]);
}

// Toast léger sans dépendance
function showToast(message: string, type: "success" | "info") {
  const el = document.createElement("div");
  el.textContent = message;
  el.style.cssText = [
    "position:fixed",
    "bottom:24px",
    "right:24px",
    "z-index:9999",
    "padding:12px 16px",
    "border-radius:12px",
    "font-size:14px",
    "font-family:Nunito,sans-serif",
    "font-weight:600",
    "color:#fff",
    "max-width:340px",
    "box-shadow:0 4px 16px rgba(0,0,0,0.15)",
    "transition:opacity 0.3s",
    type === "success" ? "background:#4CAF50" : "background:#2196F3",
  ].join(";");

  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 4000);
}
