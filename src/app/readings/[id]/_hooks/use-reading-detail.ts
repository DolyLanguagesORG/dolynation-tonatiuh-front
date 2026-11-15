"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context";
import {
  getReadingFlowDictionary,
  resolveReadingLanguage,
  useLocale,
} from "@/i18n";
import {
  ApiClientError,
  cleanLookupSelection,
  type ExplanationResultDto,
  extractSalientVocabulary,
  type GlossaryEntryDto,
  getSpeechLocale,
  iaService,
  type ReadingDto,
  readingsService,
  type TargetLanguageCode,
} from "@/lib";

const TARGET_LANGUAGE_NAMES: Record<TargetLanguageCode, string> = {
  es: "Spanish",
  en: "English",
  fr: "French",
  it: "Italian",
};

function toExplanationResult(
  entry: GlossaryEntryDto,
  reading: ReadingDto,
): ExplanationResultDto {
  return {
    id: entry.id,
    word: entry.word,
    entryType: entry.entryType,
    language: entry.language,
    difficulty: entry.difficulty,
    literalMeaning: entry.literalMeaning,
    explanation: entry.explanation,
    wordBreakdown: entry.wordBreakdown,
    otherWaysToSay: entry.otherWaysToSay,
    otherContexts: entry.otherContexts,
    isSaved: entry.isSaved,
    cached: true,
    reading,
  };
}

function toGlossaryEntry(
  result: ExplanationResultDto,
  contextSentence: string | null,
): GlossaryEntryDto | null {
  if (typeof result.id !== "number") return null;
  const now = new Date().toISOString();
  const normalizedWord = result.word.trim().replace(/\s+/g, " ").toLowerCase();
  return {
    id: result.id,
    readingId: result.reading.id,
    readingTitle: result.reading.title,
    readingAvailable: result.reading.deletedAt === null,
    word: result.word,
    normalizedWord,
    entryType: result.entryType,
    language: result.language,
    difficulty: result.difficulty,
    context: contextSentence,
    literalMeaning: result.literalMeaning,
    explanation: result.explanation,
    wordBreakdown: result.wordBreakdown,
    otherWaysToSay: result.otherWaysToSay,
    otherContexts: result.otherContexts,
    isSaved: result.isSaved,
    savedAt: result.isSaved ? now : null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Hook de datos e interactividad contextual para la vista de Lectura (`/readings/[id]`).
 * Conecta selección de palabras/oraciones, caché por lectura y glosario persistente en PostgreSQL.
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
  const [activeExplanation, setActiveExplanation] =
    useState<ExplanationResultDto | null>(null);
  const [consultedEntries, setConsultedEntries] = useState<GlossaryEntryDto[]>(
    [],
  );
  const [deepExplanation, setDeepExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [isSavingGlossary, setIsSavingGlossary] = useState(false);
  const [isDeepExplaining, setIsDeepExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const readingLanguage = resolveReadingLanguage(reading?.language, locale);
  const flowT = useMemo(
    () => getReadingFlowDictionary(readingLanguage),
    [readingLanguage],
  );

  const fetchKey =
    isAuthenticated && isValidId
      ? `${user?.id ?? "me"}-reading-${readingId}`
      : null;
  const isLoading = Boolean(fetchKey && loadedKey !== fetchKey);

  useEffect(() => {
    if (!fetchKey) return;

    let cancelled = false;

    Promise.all([
      readingsService.getById(readingId),
      readingsService.listExplanations(readingId).catch(() => null),
    ])
      .then(([readingRes, explanationsRes]) => {
        if (cancelled) return;
        setReading(readingRes.data ?? null);
        setConsultedEntries(
          Array.isArray(explanationsRes?.data) ? explanationsRes.data : [],
        );
        setErrorMessage(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setReading(null);
        setConsultedEntries([]);
        setErrorMessage(
          err instanceof ApiClientError
            ? err.getUserMessage(locale)
            : getReadingFlowDictionary(locale).readings.errors.loadReadingFailed,
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

  const savedTerms = useMemo(
    () =>
      consultedEntries
        .filter((entry) => entry.isSaved)
        .map((entry) => entry.word),
    [consultedEntries],
  );

  const selectWord = useCallback(
    async (
      rawSelection: string,
      sentenceContext?: string,
      forceRefresh = false,
    ) => {
      const cleaned = cleanLookupSelection(rawSelection);
      if (!cleaned || !isValidId) return;

      const normalized = cleaned.replace(/\s+/g, " ").toLowerCase();
      const trimmedContext = sentenceContext?.trim() || null;

      setSelectedWord(cleaned);
      setSelectedContext(trimmedContext);
      setDeepExplanation(null);
      setExplainError(null);

      if (!forceRefresh && reading) {
        const cachedLocal = consultedEntries.find(
          (entry) => entry.normalizedWord === normalized,
        );
        if (cachedLocal) {
          if (!trimmedContext && cachedLocal.context) {
            setSelectedContext(cachedLocal.context);
          }
          setActiveExplanation(toExplanationResult(cachedLocal, reading));
          setIsExplaining(false);
          return;
        }
      }

      setActiveExplanation(null);
      setIsExplaining(true);

      try {
        const res = await readingsService.explain(readingId, {
          word: cleaned,
          context: trimmedContext || undefined,
          forceRefresh: forceRefresh || undefined,
        });
        const payload = res.data;
        setActiveExplanation(payload);
        if (payload.reading) {
          setReading(payload.reading);
        }
        const entry = toGlossaryEntry(payload, trimmedContext);
        if (entry) {
          setConsultedEntries((prev) => {
            const withoutSame = prev.filter(
              (item) => item.normalizedWord !== entry.normalizedWord,
            );
            return [entry, ...withoutSame];
          });
        }
      } catch (err: unknown) {
        setExplainError(
          err instanceof ApiClientError
            ? err.getUserMessage(readingLanguage)
            : flowT.readings.errors.explainFailed,
        );
      } finally {
        setIsExplaining(false);
      }
    },
    [
      consultedEntries,
      flowT.readings.errors.explainFailed,
      isValidId,
      reading,
      readingId,
      readingLanguage,
    ],
  );

  const openCachedEntry = useCallback(
    (entry: GlossaryEntryDto) => {
      if (!reading) return;
      setSelectedWord(entry.word);
      setSelectedContext(entry.context);
      setDeepExplanation(null);
      setExplainError(null);
      setIsExplaining(false);
      setActiveExplanation(toExplanationResult(entry, reading));
    },
    [reading],
  );

  const refreshSelection = useCallback(() => {
    if (!selectedWord) return;
    void selectWord(selectedWord, selectedContext ?? undefined, true);
  }, [selectWord, selectedContext, selectedWord]);

  const requestDetailedExplanation = useCallback(async () => {
    if (!selectedWord || !reading) return;
    setIsDeepExplaining(true);
    setExplainError(null);

    try {
      const targetLangName =
        TARGET_LANGUAGE_NAMES[reading.language] ?? "English";
      const res = await iaService.chat({
        systemPrompt: `You are a ${targetLangName} language coach for DolyNation learners (target level: ${reading.difficulty}). Write strictly in natural ${targetLangName} (never mix or translate into another language). Provide 2-3 clear sentences deepening the pragmatic nuance, grammar role, and a natural everyday example.`,
        messages: [
          {
            role: "user",
            content: `Deepen the explanation of "${selectedWord}" in the ${targetLangName} reading "${reading.title}". Excerpt: "${selectedContext ?? selectedWord}".`,
          },
        ],
      });
      setDeepExplanation(res.data.text);
    } catch (err: unknown) {
      setExplainError(
        err instanceof ApiClientError
          ? err.getUserMessage(readingLanguage)
          : flowT.readings.errors.deepExplainFailed,
      );
    } finally {
      setIsDeepExplaining(false);
    }
  }, [
    flowT.readings.errors.deepExplainFailed,
    reading,
    readingLanguage,
    selectedContext,
    selectedWord,
  ]);

  const clearSelection = useCallback(() => {
    setSelectedWord(null);
    setSelectedContext(null);
    setActiveExplanation(null);
    setDeepExplanation(null);
    setExplainError(null);
  }, []);

  const toggleSaveCurrent = useCallback(async () => {
    const explanationId = activeExplanation?.id;
    if (!explanationId || isSavingGlossary) return;

    const targetState = !activeExplanation.isSaved;
    setIsSavingGlossary(true);
    setExplainError(null);

    try {
      const res = await readingsService.toggleGlossarySave(explanationId, {
        isSaved: targetState,
      });
      const updated = res.data;
      setActiveExplanation((prev) =>
        prev
          ? {
              ...prev,
              isSaved: updated.isSaved,
            }
          : prev,
      );
      setConsultedEntries((prev) => {
        const exists = prev.some((item) => item.id === updated.id);
        if (!exists) return [updated, ...prev];
        return prev.map((item) => (item.id === updated.id ? updated : item));
      });
    } catch (err: unknown) {
      setExplainError(
        err instanceof ApiClientError
          ? err.getUserMessage(readingLanguage)
          : flowT.readings.errors.glossaryUpdateFailed,
      );
    } finally {
      setIsSavingGlossary(false);
    }
  }, [
    activeExplanation,
    flowT.readings.errors.glossaryUpdateFailed,
    isSavingGlossary,
    readingLanguage,
  ]);

  const pronounceText = useCallback(
    (textToSpeak: string) => {
      if (
        typeof window === "undefined" ||
        !("speechSynthesis" in window) ||
        !reading ||
        !textToSpeak.trim()
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
    readingLanguage,
    flowT,
    paragraphs,
    vocabularyTerms,
    consultedEntries,
    errorMessage,
    fontScale,
    decreaseFontScale,
    increaseFontScale,
    selectedWord,
    selectedContext,
    activeExplanation,
    deepExplanation,
    isExplaining,
    isSavingGlossary,
    isDeepExplaining,
    explainError,
    savedTerms,
    selectWord,
    openCachedEntry,
    refreshSelection,
    requestDetailedExplanation,
    clearSelection,
    toggleSaveCurrent,
    pronounceText,
  };
}
