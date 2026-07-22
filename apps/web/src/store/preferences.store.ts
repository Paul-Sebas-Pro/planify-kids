import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "fr" | "en";

interface PreferencesState {
  language: Language;
  hasExplicitChoice: boolean;
  setLanguage: (language: Language) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: "fr",
      hasExplicitChoice: false,
      setLanguage: (language) => set({ language, hasExplicitChoice: true }),
    }),
    { name: "preferences-store" },
  ),
);
