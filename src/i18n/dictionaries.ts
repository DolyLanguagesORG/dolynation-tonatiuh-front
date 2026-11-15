import en from "@/i18n/locales/en.json";
import es from "@/i18n/locales/es.json";
import fr from "@/i18n/locales/fr.json";
import it from "@/i18n/locales/it.json";
import {
  DEFAULT_UI_LOCALE,
  type Locale,
  resolveUiLocale,
} from "@/i18n/locales";

export type { Locale };

export type Dictionary = typeof es;

/**
 * Mapa centralizado de diccionarios UI cargados desde `src/i18n/locales/*.json`.
 */
export const dictionaries: Record<Locale, Dictionary> = {
  es,
  en,
  fr,
  it,
};

/**
 * Devuelve el diccionario correspondiente al idioma de interfaz indicado,
 * con fallback seguro al idioma por defecto.
 */
export function getDictionary(locale: Locale | string): Dictionary {
  return dictionaries[resolveUiLocale(locale, DEFAULT_UI_LOCALE)];
}
