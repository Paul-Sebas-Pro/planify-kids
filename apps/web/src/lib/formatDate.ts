import { usePreferencesStore } from "@/store/preferences.store";

const LOCALE_MAP = { fr: "fr-FR", en: "en-US" } as const;

export function formatDate(date: Date, opts?: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString(
    LOCALE_MAP[usePreferencesStore.getState().language],
    opts,
  );
}

export function formatDateTime(date: Date, opts?: Intl.DateTimeFormatOptions) {
  return date.toLocaleString(
    LOCALE_MAP[usePreferencesStore.getState().language],
    opts,
  );
}
