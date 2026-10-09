import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { usePreferencesStore, type Language } from "@/store/preferences.store";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

function detectBrowserLanguage(): Language {
  const code = navigator.language?.split("-")[0];
  return code === "en" ? "en" : "fr";
}

const { language, hasExplicitChoice } = usePreferencesStore.getState();
const initialLanguage = hasExplicitChoice ? language : detectBrowserLanguage();
if (!hasExplicitChoice && initialLanguage !== language) {
  usePreferencesStore.setState({ language: initialLanguage });
}

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

// `<html lang>` suit la langue active (index.html démarre en "fr") : sinon
// les lecteurs d'écran lisent l'interface anglaise avec une prononciation
// française et le navigateur propose de « traduire depuis le français ».
// Le `lang` du manifest PWA reste "fr" : il décrit la langue de son propre
// texte (nom, description), figé au build.
document.documentElement.lang = initialLanguage;
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
