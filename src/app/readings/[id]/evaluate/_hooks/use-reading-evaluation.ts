"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context";
import {
  getReadingFlowDictionary,
  resolveReadingLanguage,
  useLocale,
} from "@/i18n";
import {
  ApiClientError,
  countWords,
  extractSalientVocabulary,
  type ReadingDto,
  readingsService,
} from "@/lib";

const EVAL_DRAFT_PREFIX = "doly-eval-draft-";
const MIN_SUBMIT_WORDS = 15;
const TARGET_WORDS = 100;

function readDraft(readingId: number): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(`${EVAL_DRAFT_PREFIX}${readingId}`);
  } catch {
    return null;
  }
}

function writeDraft(readingId: number, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${EVAL_DRAFT_PREFIX}${readingId}`, value);
  } catch {
    // Ignorar errores de cuota.
  }
}

function removeDraft(readingId: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${EVAL_DRAFT_PREFIX}${readingId}`);
  } catch {
    // Ignorar errores al limpiar almacenamiento.
  }
}

/**
 * Hook de sesión, autoguardado local y envío a evaluación IA (`/readings/[id]/evaluate`).
 */
export function useReadingEvaluation(rawId: string) {
  const router = useRouter();
  const { locale } = useLocale();
  const { user, isAuthenticated } = useAuth();

  const readingId = Number(rawId);
  const isValidId = Number.isInteger(readingId) && readingId > 0;

  const [reading, setReading] = useState<ReadingDto | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const readingLanguage = resolveReadingLanguage(reading?.language, locale);
  const flowT = useMemo(
    () => getReadingFlowDictionary(readingLanguage),
    [readingLanguage],
  );

  const [responseText, setResponseText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchKey =
    isAuthenticated && isValidId
      ? `${user?.id ?? "me"}-eval-${readingId}`
      : null;
  const isLoading = Boolean(fetchKey && loadedKey !== fetchKey);

  useEffect(() => {
    if (!fetchKey) return;

    let cancelled = false;

    readingsService
      .getById(readingId)
      .then((res) => {
        if (cancelled) return;
        const item = res.data ?? null;
        setReading(item);
        const savedDraft = readDraft(readingId);
        if (savedDraft !== null && savedDraft.length > 0) {
          setResponseText(savedDraft);
        } else if (item?.userResponse) {
          setResponseText(item.userResponse);
        }
        setLoadError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setReading(null);
        setLoadError(
          err instanceof ApiClientError
            ? err.getUserMessage(locale)
            : getReadingFlowDictionary(locale).readings.errors
                .loadEvaluationFailed,
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

  const wordCount = useMemo(() => countWords(responseText), [responseText]);
  const charCount = responseText.length;
  const wordProgress = useMemo(
    () => Math.min(100, Math.round((wordCount / TARGET_WORDS) * 100)),
    [wordCount],
  );

  const suggestedTerms = useMemo(
    () => (reading ? extractSalientVocabulary(reading.content, 5) : []),
    [reading],
  );

  const updateResponseText = useCallback(
    (value: string) => {
      setResponseText(value);
      setValidationError(null);
      setDraftNotice(null);
      if (isValidId) {
        writeDraft(readingId, value);
      }
    },
    [isValidId, readingId],
  );

  const insertSuggestedTerm = useCallback(
    (term: string) => {
      const separator =
        responseText.length === 0 || /\s$/.test(responseText) ? "" : " ";
      updateResponseText(`${responseText}${separator}${term} `);
    },
    [responseText, updateResponseText],
  );

  const saveDraftNow = useCallback(() => {
    if (!isValidId) return;
    writeDraft(readingId, responseText);
    setDraftNotice(flowT.readings.eval.draftSavedNotice);
  }, [flowT.readings.eval.draftSavedNotice, isValidId, readingId, responseText]);

  const handleSubmit = useCallback(async () => {
    if (!isValidId || isSubmitting) return;

    const trimmed = responseText.trim();
    if (countWords(trimmed) < MIN_SUBMIT_WORDS) {
      setValidationError(flowT.readings.eval.minWordsError);
      return;
    }

    setValidationError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await readingsService.evaluate(readingId, { userResponse: trimmed });
      removeDraft(readingId);
      router.push(`/readings/${readingId}/result`);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof ApiClientError
          ? err.getUserMessage(readingLanguage)
          : flowT.readings.errors.submitEvaluationFailed,
      );
      setIsSubmitting(false);
    }
  }, [
    flowT.readings.errors.submitEvaluationFailed,
    flowT.readings.eval.minWordsError,
    isSubmitting,
    isValidId,
    readingId,
    readingLanguage,
    responseText,
    router,
  ]);

  return {
    readingId,
    isValidId,
    isLoading,
    reading,
    readingLanguage,
    flowT,
    loadError,
    responseText,
    wordCount,
    charCount,
    wordProgress,
    suggestedTerms,
    validationError,
    submitError,
    draftNotice,
    isSubmitting,
    updateResponseText,
    insertSuggestedTerm,
    saveDraftNow,
    handleSubmit,
  };
}
