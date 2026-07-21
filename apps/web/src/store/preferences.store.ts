import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "fr" | "en";

interface PreferencesState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: "fr",
      setLanguage: (language) => set({ language }),
    }),
    { name: "preferences-store" },
  ),
);
