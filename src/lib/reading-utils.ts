import { type ReadingDifficulty, type TargetLanguageCode } from "@/lib/api-contracts";

const LANGUAGE_LABELS: Record<
  TargetLanguageCode,
  Record<TargetLanguageCode, string>
> = {
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
  fr: {
    es: "[ES] ESPAGNOL",
    en: "[EN] ANGLAIS",
    fr: "[FR] FRANÇAIS",
    it: "[IT] ITALIEN",
  },
  it: {
    es: "[ES] SPAGNOLO",
    en: "[EN] INGLESE",
    fr: "[FR] FRANCESE",
    it: "[IT] ITALIANO",
  },
};

const DATE_LOCALES: Record<TargetLanguageCode, string> = {
  es: "es-MX",
  en: "en-US",
  fr: "fr-FR",
  it: "it-IT",
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
    fr: string;
    it: string;
    cefrBadge: string;
    badgeVariant: "primary" | "secondary";
  }
> = {
  easy: {
    es: "FÁCIL",
    en: "EASY",
    fr: "FACILE",
    it: "FACILE",
    cefrBadge: "A1–A2",
    badgeVariant: "secondary",
  },
  medium: {
    es: "MEDIO",
    en: "MEDIUM",
    fr: "MOYEN",
    it: "MEDIO",
    cefrBadge: "B1–B2",
    badgeVariant: "primary",
  },
  hard: {
    es: "DIFÍCIL",
    en: "HARD",
    fr: "DIFFICILE",
    it: "DIFFICILE",
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
 * Formatea el código y nombre del idioma meta según el idioma de presentación activo.
 */
export function formatReadingLanguageBadge(
  language: TargetLanguageCode,
  displayLanguage: TargetLanguageCode,
): string {
  return (
    LANGUAGE_LABELS[displayLanguage]?.[language] ?? `[${language.toUpperCase()}]`
  );
}

/**
 * Devuelve la etiqueta localizada, nivel CEFR y variante visual para una dificultad.
 */
export function getDifficultyMeta(
  difficulty: ReadingDifficulty | null | undefined,
  displayLanguage: TargetLanguageCode,
): {
  label: string;
  cefrBadge: string;
  badgeVariant: "primary" | "secondary";
} {
  const key: ReadingDifficulty = difficulty ?? "medium";
  const item = DIFFICULTY_META[key];
  return {
    label: item[displayLanguage] ?? item.en,
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
 * Mapea un `TargetLanguageCode` al locale BCP-47 para formateo de fechas editoriales.
 */
export function getDateLocale(language: TargetLanguageCode): string {
  return DATE_LOCALES[language] ?? "en-US";
}

/**
 * Formatea una fecha ISO de lectura en formato editorial corto.
 */
export function formatReadingDate(
  isoDate: string | null | undefined,
  displayLanguage: TargetLanguageCode,
): string {
  if (!isoDate) return "—";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "—";

  const dateLocale = getDateLocale(displayLanguage);
  return new Intl.DateTimeFormat(dateLocale, {
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
 * Normaliza una selección libre (frase u oración completa) preservando puntuación
 * interna y apóstrofos mientras recorta comillas o delimitadores externos sobrantes.
 */
export function cleanLookupSelection(rawSelection: string): string {
  const collapsed = rawSelection.replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  const stripped = collapsed
    .replace(/^[\s"'«»“”‘’()[\]{},;:.]+|[\s"'«»“”‘’()[\]{},;:.]+$/g, "")
    .trim();
  if (!stripped) return "";
  return stripped.includes(" ") ? stripped : cleanLookupWord(stripped);
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

/** Longitud máxima aceptada por el backend (`CreateExplanationDto.word`) en caracteres. */
export const MAX_LOOKUP_SELECTION_CHARS = 500;

/**
 * Rango contiguo de tokens seleccionados dentro de un único párrafo de lectura.
 */
export interface ParagraphTokenSpan {
  paragraphIndex: number;
  startTokenIndex: number;
  endTokenIndex: number;
}

/**
 * Divide un párrafo en tokens alternando palabras/signos y secuencias de espacios.
 */
export function tokenizeReadingParagraph(paragraph: string): string[] {
  return paragraph.split(/(\s+)/);
}

/**
 * Calcula el siguiente rango contiguo dentro de un párrafo al hacer clic en un token:
 * - Si no hay selección o cambia de párrafo, inicia en el token clicado.
 * - Si solo ese mismo token estaba seleccionado, limpia la selección (`null`).
 * - Si el clic está antes o después del rango actual del mismo párrafo, lo extiende.
 * - Si el clic cae dentro de un rango multipalabra existente, enfoca ese único token.
 */
export function computeNextTokenSpan(
  current: ParagraphTokenSpan | null,
  paragraphIndex: number,
  tokenIndex: number,
): ParagraphTokenSpan | null {
  if (!current || current.paragraphIndex !== paragraphIndex) {
    return {
      paragraphIndex,
      startTokenIndex: tokenIndex,
      endTokenIndex: tokenIndex,
    };
  }

  if (
    current.startTokenIndex === current.endTokenIndex &&
    current.startTokenIndex === tokenIndex
  ) {
    return null;
  }

  if (tokenIndex < current.startTokenIndex) {
    return {
      paragraphIndex,
      startTokenIndex: tokenIndex,
      endTokenIndex: current.endTokenIndex,
    };
  }

  if (tokenIndex > current.endTokenIndex) {
    return {
      paragraphIndex,
      startTokenIndex: current.startTokenIndex,
      endTokenIndex: tokenIndex,
    };
  }

  return {
    paragraphIndex,
    startTokenIndex: tokenIndex,
    endTokenIndex: tokenIndex,
  };
}

/**
 * Obtiene y limpia el texto correspondiente a un rango contiguo de tokens en un párrafo.
 */
export function resolveSpanSelectionText(
  paragraphs: readonly string[],
  span: ParagraphTokenSpan,
): string {
  const paragraph = paragraphs[span.paragraphIndex];
  if (!paragraph) return "";
  const tokens = tokenizeReadingParagraph(paragraph);
  const start = Math.max(0, span.startTokenIndex);
  const end = Math.min(tokens.length - 1, span.endTokenIndex);
  if (start > end) return "";
  const raw = tokens.slice(start, end + 1).join("");
  return start === end ? cleanLookupWord(raw) : cleanLookupSelection(raw);
}

/**
 * Localiza el primer rango contiguo de tokens que coincide con un término o frase consultada.
 */
export function findTokenSpanInParagraphs(
  paragraphs: readonly string[],
  targetSelection: string,
): ParagraphTokenSpan | null {
  const normalizedTarget = cleanLookupSelection(targetSelection)
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (!normalizedTarget) return null;

  const isSingleWord = !normalizedTarget.includes(" ");

  for (let pIndex = 0; pIndex < paragraphs.length; pIndex += 1) {
    const tokens = tokenizeReadingParagraph(paragraphs[pIndex]);

    if (isSingleWord) {
      for (let tIndex = 0; tIndex < tokens.length; tIndex += 1) {
        if (cleanLookupWord(tokens[tIndex]).toLowerCase() === normalizedTarget) {
          return {
            paragraphIndex: pIndex,
            startTokenIndex: tIndex,
            endTokenIndex: tIndex,
          };
        }
      }
      continue;
    }

    const clickableIndices: number[] = [];
    for (let tIndex = 0; tIndex < tokens.length; tIndex += 1) {
      if (!/^\s+$/.test(tokens[tIndex]) && cleanLookupWord(tokens[tIndex])) {
        clickableIndices.push(tIndex);
      }
    }

    for (let i = 0; i < clickableIndices.length; i += 1) {
      const startTokenIndex = clickableIndices[i];
      for (let j = i; j < clickableIndices.length; j += 1) {
        const endTokenIndex = clickableIndices[j];
        const candidate = cleanLookupSelection(
          tokens.slice(startTokenIndex, endTokenIndex + 1).join(""),
        )
          .replace(/\s+/g, " ")
          .toLowerCase();
        if (candidate === normalizedTarget) {
          return {
            paragraphIndex: pIndex,
            startTokenIndex,
            endTokenIndex,
          };
        }
        if (candidate.length > normalizedTarget.length + 12) {
          break;
        }
      }
    }
  }

  return null;
}

/**
 * Mapea un `TargetLanguageCode` al locale BCP-47 para síntesis de voz del navegador.
 */
export function getSpeechLocale(language: TargetLanguageCode): string {
  return SPEECH_LOCALES[language] ?? "en-US";
}
