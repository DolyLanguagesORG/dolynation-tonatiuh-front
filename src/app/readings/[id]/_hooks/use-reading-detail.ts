"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import {
  ApiClientError,
  cleanLookupWord,
  extractSalientVocabulary,
  getSpeechLocale,
  iaService,
  type ReadingDto,
  readingsService,
} from "@/lib";

const SAVED_TERMS_PREFIX = "doly-saved-terms-";

function readSavedTermsFromStorage(readingId: number): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${SAVED_TERMS_PREFIX}${readingId}`);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeSavedTermsToStorage(readingId: number, terms: readonly string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${SAVED_TERMS_PREFIX}${readingId}`,
      JSON.stringify(terms),
    );
  } catch {
    // Ignorar errores de cuota en almacenamiento local.
  }
}

/**
 * Hook de datos e interactividad contextual para la vista de Lectura (`/readings/[id]`).
 */
export function useReadingDetail(rawId: string) {
  const { locale } = useLocale();
  const { user, isAuthenticated } = useAuth();

  const readingId = Number(rawId);
  const isValidId = Number.isInteger(readingId) && readingId > 0;

  const [reading, setReading] = useState<ReadingDto | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [fontScale, setFontScale] = useState<0 | 1 | 2>(1);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [deepExplanation, setDeepExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isDeepExplaining, setIsDeepExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [savedTerms, setSavedTerms] = useState<string[]>([]);

  const fetchKey =
    isAuthenticated && isValidId
      ? `${user?.id ?? "me"}-reading-${readingId}`
      : null;
  const isLoading = Boolean(fetchKey && loadedKey !== fetchKey);

  useEffect(() => {
    if (!fetchKey) return;

    let cancelled = false;

    readingsService
      .getById(readingId)
      .then((res) => {
        if (cancelled) return;
        setReading(res.data ?? null);
        setSavedTerms(readSavedTermsFromStorage(readingId));
        setErrorMessage(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setReading(null);
        setErrorMessage(
          err instanceof ApiClientError
            ? err.getUserMessage(locale)
            : locale === "es"
              ? "No fue posible cargar esta lectura."
              : "Could not load this reading.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoadedKey(fetchKey);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchKey, locale, readingId]);

  const vocabularyTerms = useMemo(
    () => (reading ? extractSalientVocabulary(reading.content, 6) : []),
    [reading],
  );

  const paragraphs = useMemo(() => {
    if (!reading?.content) return [];
    return reading.content
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);
  }, [reading]);

  const selectWord = useCallback(
    async (rawToken: string, sentenceContext?: string) => {
      const cleaned = cleanLookupWord(rawToken);
      if (!cleaned || !isValidId) return;

      setSelectedWord(cleaned);
      setSelectedContext(sentenceContext?.trim() || null);
      setAiExplanation(null);
      setDeepExplanation(null);
      setExplainError(null);
      setIsExplaining(true);

      try {
        const res = await readingsService.explain(readingId, {
          word: cleaned,
          context: sentenceContext?.trim() || undefined,
        });
        setAiExplanation(res.data.explanation);
        if (res.data.reading) {
          setReading(res.data.reading);
        }
      } catch (err: unknown) {
        setExplainError(
          err instanceof ApiClientError
            ? err.getUserMessage(locale)
            : locale === "es"
              ? "No se pudo consultar el análisis contextual en este momento."
              : "Could not retrieve contextual explanation right now.",
        );
      } finally {
        setIsExplaining(false);
      }
    },
    [isValidId, locale, readingId],
  );

  const requestDetailedExplanation = useCallback(async () => {
    if (!selectedWord || !reading) return;
    setIsDeepExplaining(true);
    setExplainError(null);

    try {
      const promptLanguage = locale === "es" ? "Spanish" : "English";
      const res = await iaService.chat({
        systemPrompt: `You are an academic linguistics tutor at DolyNation. Answer concisely in ${promptLanguage} (max 3 short sentences) focusing on grammatical function, nuance, and one practical example.`,
        messages: [
          {
            role: "user",
            content: `Explain the term "${selectedWord}" in a ${reading.language} reading titled "${reading.title}". Sentence context: "${selectedContext ?? selectedWord}".`,
          },
        ],
      });
      setDeepExplanation(res.data.text);
    } catch (err: unknown) {
      setExplainError(
        err instanceof ApiClientError
          ? err.getUserMessage(locale)
          : locale === "es"
            ? "No se pudo ampliar la explicación con el tutor IA."
            : "Could not load detailed tutor explanation.",
      );
    } finally {
      setIsDeepExplaining(false);
    }
  }, [locale, reading, selectedContext, selectedWord]);

  const clearSelection = useCallback(() => {
    setSelectedWord(null);
    setSelectedContext(null);
    setAiExplanation(null);
    setDeepExplanation(null);
    setExplainError(null);
  }, []);

  const toggleSaveTerm = useCallback(
    (term: string) => {
      if (!isValidId) return;
      const normalized = term.toLowerCase();
      setSavedTerms((prev) => {
        const exists = prev.some((item) => item.toLowerCase() === normalized);
        const next = exists
          ? prev.filter((item) => item.toLowerCase() !== normalized)
          : [...prev, term];
        writeSavedTermsToStorage(readingId, next);
        return next;
      });
    },
    [isValidId, readingId],
  );

  const pronounceText = useCallback(
    (textToSpeak: string) => {
      if (
        typeof window === "undefined" ||
        !("speechSynthesis" in window) ||
        !reading
      ) {
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = getSpeechLocale(reading.language);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    },
    [reading],
  );

  const decreaseFontScale = () =>
    setFontScale((prev) => (prev > 0 ? ((prev - 1) as 0 | 1 | 2) : prev));
  const increaseFontScale = () =>
    setFontScale((prev) => (prev < 2 ? ((prev + 1) as 0 | 1 | 2) : prev));

  return {
    readingId,
    isValidId,
    isLoading,
    reading,
    paragraphs,
    vocabularyTerms,
    errorMessage,
    fontScale,
    decreaseFontScale,
    increaseFontScale,
    selectedWord,
    selectedContext,
    aiExplanation,
    deepExplanation,
    isExplaining,
    isDeepExplaining,
    explainError,
    savedTerms,
    selectWord,
    requestDetailedExplanation,
    clearSelection,
    toggleSaveTerm,
    pronounceText,
  };
}
