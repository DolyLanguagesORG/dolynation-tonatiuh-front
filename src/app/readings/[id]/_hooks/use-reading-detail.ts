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
  type GlossaryEntryDto,
  getSpeechLocale,
  type ReadingDto,
  readingsService,
} from "@/lib";
import {
  getOfflineReading,
  saveOfflineReading,
} from "@/lib/offline";

export type ReadingDrawerTab = "explanation" | "glossary";

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
  // La lectura se ha servido desde la COPIA LOCAL: no hay red.
  const [isOffline, setIsOffline] = useState(false);

  const [fontScale, setFontScale] = useState<0 | 1 | 2>(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<ReadingDrawerTab>("glossary");
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
        const explanations = Array.isArray(explanationsRes?.data)
          ? explanationsRes.data
          : [];
        setReading(readingRes.data ?? null);
        setConsultedEntries(explanations);
        setErrorMessage(null);
        setIsOffline(false);

        // Se guarda la COPIA LOCAL: sin ella, esta lectura no se podria
        // leer sin red. La copia es de esta persona (el filtro por usuario
        // esta en el almacen).
        if (readingRes.data) {
          void saveOfflineReading({
            reading: readingRes.data,
            explanations,
            userId: user?.id ?? "me",
          });
        }
      })
      .catch(async (err: unknown) => {
        if (cancelled) return;

        // Sin red: si esta lectura esta guardada en el dispositivo, se
        // sirve la copia local. Es el caso de uso de la PWA: "la genere con
        // red y luego me quedo sin internet".
        const esFalloDeRed =
          err instanceof ApiClientError &&
          (err.status === 0 || err.code === "NETWORK_ERROR");
        if (esFalloDeRed) {
          const local = await getOfflineReading(
            readingId,
            user?.id ?? "me",
          );
          if (!cancelled && local) {
            setReading(local.reading);
            setConsultedEntries(local.explanations);
            setErrorMessage(null);
            setIsOffline(true);
            return;
          }
        }

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
  }, [fetchKey, locale, readingId, user?.id]);

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

      setIsDrawerOpen(true);
      setDrawerTab("explanation");
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
      setIsDrawerOpen(true);
      setDrawerTab("explanation");
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
      const res = await readingsService.deepExplain(reading.id, {
        word: selectedWord,
        context: selectedContext ?? undefined,
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

  const openGlossaryDrawer = useCallback(
    (preferredTab?: ReadingDrawerTab) => {
      setIsDrawerOpen(true);
      setDrawerTab(preferredTab ?? (selectedWord ? "explanation" : "glossary"));
    },
    [selectedWord],
  );

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    clearSelection();
  }, [clearSelection]);

  const toggleGlossaryEntrySave = useCallback(
    async (entryId: number, targetState: boolean) => {
      if (isSavingGlossary) return;

      setIsSavingGlossary(true);
      setExplainError(null);

      try {
        const res = await readingsService.toggleGlossarySave(entryId, {
          isSaved: targetState,
        });
        const updated = res.data;
        setActiveExplanation((prev) =>
          prev && prev.id === updated.id
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
    },
    [flowT.readings.errors.glossaryUpdateFailed, isSavingGlossary, readingLanguage],
  );

  const toggleSaveCurrent = useCallback(async () => {
    const explanationId = activeExplanation?.id;
    if (!explanationId) return;
    await toggleGlossaryEntrySave(explanationId, !activeExplanation.isSaved);
  }, [activeExplanation, toggleGlossaryEntrySave]);

  const toggleSaveEntry = useCallback(
    async (entry: GlossaryEntryDto) => {
      await toggleGlossaryEntrySave(entry.id, !entry.isSaved);
    },
    [toggleGlossaryEntrySave],
  );

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
    // La lectura se esta mostrando desde la copia local del dispositivo.
    isOffline,
    flowT,
    paragraphs,
    consultedEntries,
    errorMessage,
    fontScale,
    decreaseFontScale,
    increaseFontScale,
    isDrawerOpen,
    drawerTab,
    setDrawerTab,
    openGlossaryDrawer,
    closeDrawer,
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
    toggleSaveEntry,
    pronounceText,
  };
}
