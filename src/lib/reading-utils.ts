import { type Locale } from "@/i18n";
import { type ReadingDifficulty, type TargetLanguageCode } from "@/lib/api-contracts";

const LANGUAGE_LABELS: Record<Locale, Record<TargetLanguageCode, string>> = {
  es: {
    es: "[ES] ESPAÑOL",
    en: "[EN] INGLÉS",
    fr: "[FR] FRANCÉS",
    it: "[IT] ITALIANO",
  },
  en: {
    es: "[ES] SPANISH",
    en: "[EN] ENGLISH",
    fr: "[FR] FRENCH",
    it: "[IT] ITALIAN",
  },
};

const SPEECH_LOCALES: Record<TargetLanguageCode, string> = {
  es: "es-ES",
  en: "en-US",
  fr: "fr-FR",
  it: "it-IT",
};

const DIFFICULTY_META: Record<
  ReadingDifficulty,
  {
    es: string;
    en: string;
    cefrBadge: string;
    badgeVariant: "primary" | "secondary";
  }
> = {
  easy: {
    es: "BÁSICO",
    en: "EASY",
    cefrBadge: "A1–A2",
    badgeVariant: "secondary",
  },
  medium: {
    es: "MEDIO",
    en: "MEDIUM",
    cefrBadge: "B1–B2",
    badgeVariant: "primary",
  },
  hard: {
    es: "AVANZADO",
    en: "ADVANCED",
    cefrBadge: "C1–C2",
    badgeVariant: "primary",
  },
};

const MULTILINGUAL_STOPWORDS = new Set([
  // Español
  "aunque",
  "como",
  "cuando",
  "donde",
  "durante",
  "entonces",
  "entre",
  "estaba",
  "estado",
  "estas",
  "estos",
  "fueron",
  "hacia",
  "hasta",
  "mientras",
  "mismo",
  "mucho",
  "nosotros",
  "nuestro",
  "para",
  "pero",
  "porque",
  "puede",
  "pueden",
  "quien",
  "sobre",
  "tambien",
  "también",
  "tener",
  "tiene",
  "tienen",
  "todas",
  "todos",
  "través",
  // English
  "about",
  "above",
  "after",
  "again",
  "against",
  "among",
  "another",
  "around",
  "because",
  "before",
  "between",
  "could",
  "during",
  "every",
  "first",
  "found",
  "having",
  "other",
  "should",
  "since",
  "still",
  "their",
  "there",
  "these",
  "thing",
  "think",
  "those",
  "through",
  "under",
  "where",
  "which",
  "while",
  "would",
  // Français & Italiano
  "apres",
  "après",
  "aussi",
  "autre",
  "avec",
  "comme",
  "dans",
  "depuis",
  "encore",
  "entre",
  "était",
  "faire",
  "mais",
  "même",
  "notre",
  "parce",
  "pendant",
  "plusieurs",
  "pour",
  "quand",
  "sans",
  "serait",
  "sous",
  "toute",
  "toutes",
  "anche",
  "avere",
  "come",
  "dalla",
  "delle",
  "dello",
  "dopo",
  "essere",
  "molto",
  "nella",
  "nelle",
  "perche",
  "perché",
  "questo",
  "questa",
  "quindi",
  "sempre",
  "sono",
  "stato",
]);

/**
 * Formatea el código y nombre del idioma meta según el locale activo.
 */
export function formatReadingLanguageBadge(
  language: TargetLanguageCode,
  locale: Locale,
): string {
  return LANGUAGE_LABELS[locale][language] ?? `[${language.toUpperCase()}]`;
}

/**
 * Devuelve la etiqueta localizada, nivel CEFR y variante visual para una dificultad.
 */
export function getDifficultyMeta(
  difficulty: ReadingDifficulty | null | undefined,
  locale: Locale,
): {
  label: string;
  cefrBadge: string;
  badgeVariant: "primary" | "secondary";
} {
  const key: ReadingDifficulty = difficulty ?? "medium";
  const item = DIFFICULTY_META[key];
  return {
    label: item[locale],
    cefrBadge: item.cefrBadge,
    badgeVariant: item.badgeVariant,
  };
}

/**
 * Cuenta palabras válidas de un texto libre usando separación por espacios.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Calcula minutos estimados de lectura académica (~160 palabras/minuto).
 */
export function estimateReadingMinutes(
  wordCount: number | null | undefined,
  content?: string | null,
): number {
  const effectiveWords =
    typeof wordCount === "number" && wordCount > 0
      ? wordCount
      : countWords(content ?? "");
  return Math.max(1, Math.round(effectiveWords / 160));
}

/**
 * Formatea una fecha ISO de lectura en formato editorial corto.
 */
export function formatReadingDate(
  isoDate: string | null | undefined,
  locale: Locale,
): string {
  if (!isoDate) return "—";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(parsed)
    .toUpperCase();
}

/**
 * Limpia puntuación periférica de una palabra seleccionada para enviarla a IA.
 */
export function cleanLookupWord(token: string): string {
  return token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").trim();
}

/**
 * Extrae términos léxicos representativos del contenido de una lectura.
 */
export function extractSalientVocabulary(
  content: string,
  limit = 6,
): string[] {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const rawToken of content.split(/\s+/)) {
    const cleaned = cleanLookupWord(rawToken);
    if (cleaned.length < 6) continue;
    const normalized = cleaned.toLowerCase();
    if (MULTILINGUAL_STOPWORDS.has(normalized) || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    results.push(cleaned);
    if (results.length >= limit) break;
  }

  return results;
}

/**
 * Mapea un `TargetLanguageCode` al locale BCP-47 para síntesis de voz del navegador.
 */
export function getSpeechLocale(language: TargetLanguageCode): string {
  return SPEECH_LOCALES[language] ?? "en-US";
}
