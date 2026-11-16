/**
 * Registro central de idiomas de interfaz (UI locales) y utilidades de formato.
 *
 * Para agregar un nuevo idioma a la aplicación:
 * 1. Añade su código ISO-639-1 a `SUPPORTED_UI_LOCALES` y su descriptor en `UI_LOCALE_CATALOG`.
 * 2. Crea `src/i18n/locales/<codigo>.json` con todas las llaves del esquema `Dictionary`.
 * 3. Crea los archivos Markdown legales `src/i18n/content/{terms,privacy,support}/<codigo>.md`.
 * 4. Registra el JSON en `src/i18n/dictionaries.ts`.
 */

export const SUPPORTED_UI_LOCALES = ["es", "en", "fr", "it"] as const;

export type Locale = (typeof SUPPORTED_UI_LOCALES)[number];

export const DEFAULT_UI_LOCALE: Locale = "es";

export const UI_LOCALE_COOKIE_NAME = "doly_ui_locale";

export interface UiLocaleDescriptor {
  readonly code: Locale;
  readonly badge: string;
  readonly nativeLabel: string;
  readonly bcp47: string;
}

export const UI_LOCALE_CATALOG: Record<Locale, UiLocaleDescriptor> = {
  es: {
    code: "es",
    badge: "ES",
    nativeLabel: "Español",
    bcp47: "es-MX",
  },
  en: {
    code: "en",
    badge: "EN",
    nativeLabel: "English",
    bcp47: "en-US",
  },
  fr: {
    code: "fr",
    badge: "FR",
    nativeLabel: "Français",
    bcp47: "fr-FR",
  },
  it: {
    code: "it",
    badge: "IT",
    nativeLabel: "Italiano",
    bcp47: "it-IT",
  },
};

export const UI_LOCALE_LIST: readonly UiLocaleDescriptor[] =
  SUPPORTED_UI_LOCALES.map((code) => UI_LOCALE_CATALOG[code]);

/**
 * Comprueba si un valor arbitrario corresponde a un idioma de interfaz soportado.
 */
export function isUiLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_UI_LOCALES as readonly string[]).includes(value)
  );
}

/**
 * Normaliza un valor crudo (cookie, perfil o parámetro) a un idioma UI válido.
 */
export function resolveUiLocale(
  value: string | null | undefined,
  fallback: Locale = DEFAULT_UI_LOCALE,
): Locale {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (isUiLocale(normalized)) {
    return normalized;
  }
  const base = normalized.split(/[-_]/)[0];
  return isUiLocale(base) ? base : fallback;
}

/**
 * Avanza cíclicamente al siguiente idioma soportado.
 */
export function getNextUiLocale(current: Locale): Locale {
  const index = SUPPORTED_UI_LOCALES.indexOf(current);
  if (index === -1) return DEFAULT_UI_LOCALE;
  return SUPPORTED_UI_LOCALES[(index + 1) % SUPPORTED_UI_LOCALES.length];
}

/**
 * Interpola variables `{nombre}` dentro de una plantilla de texto centralizada.
 */
export function formatMessage(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key)
      ? String(values[key])
      : match,
  );
}

/**
 * Selecciona la variante apropiada de un campo bilingüe proveniente del backend
 * (`nameEs`/`nameEn`) cuando la API aún no provee todos los idiomas UI.
 */
export function resolveBilingualText(
  fields: { readonly es?: string; readonly en?: string; readonly fallback: string },
  locale: Locale,
): string {
  if (locale === "es") {
    return fields.es ?? fields.fallback;
  }
  return fields.en ?? fields.fallback;
}

/**
 * Selecciona una plantilla singular o plural según `count` e interpola `{count}` y valores extra.
 */
export function formatCountMessage(
  singularTemplate: string,
  pluralTemplate: string,
  count: number,
  values: Readonly<Record<string, string | number>> = {},
): string {
  const template = count === 1 ? singularTemplate : pluralTemplate;
  return formatMessage(template, { count, ...values });
}
