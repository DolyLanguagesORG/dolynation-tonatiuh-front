"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  dictionaries,
  type Dictionary,
  type Locale,
} from "@/i18n/dictionaries";
import {
  DEFAULT_UI_LOCALE,
  getNextUiLocale,
  UI_LOCALE_COOKIE_NAME,
  UI_LOCALE_LIST,
} from "@/i18n/locales";

interface LocaleContextValue {
  locale: Locale;
  t: Dictionary;
  locales: typeof UI_LOCALE_LIST;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export interface LocaleProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

function persistLocalePreference(next: Locale): void {
  if (typeof document !== "undefined") {
    document.cookie = `${UI_LOCALE_COOKIE_NAME}=${next}; Path=/; SameSite=Lax; Max-Age=31536000`;
    document.documentElement.lang = next;
  }
}

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_UI_LOCALE,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocalePreference(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => {
      const next = getNextUiLocale(current);
      persistLocalePreference(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: dictionaries[locale],
      locales: UI_LOCALE_LIST,
      setLocale,
      toggleLocale,
    }),
    [locale, setLocale, toggleLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale debe usarse dentro de un <LocaleProvider>.");
  }
  return context;
}
