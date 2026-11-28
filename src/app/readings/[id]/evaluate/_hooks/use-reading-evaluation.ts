"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context";
import { useNavigationGuard } from "@/hooks";
import {
  formatMessage,
  getReadingFlowDictionary,
  resolveReadingLanguage,
  useLocale,
} from "@/i18n";
import {
  ApiClientError,
  countWords,
  extractSalientVocabulary,
  isAbortError,
  type ReadingDto,
  readingsService,
} from "@/lib";

const EVAL_DRAFT_PREFIX = "doly-eval-draft-";
export const MIN_SUBMIT_WORDS = 15;
export const TARGET_WORDS = 100;
export const MAX_SUBMIT_WORDS = 500;
export const MIN_SUMMARY_CHARS = 20;
export const MAX_SUMMARY_CHARS = 5000;

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
  const { locale, t } = useLocale();
  const auth = useAuth();
  const user = auth.user;
  const isAuthenticated = auth.isAuthenticated;
  const reloadAccountState = auth.reloadAccountState;

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
  const isOverWordLimit = wordCount > MAX_SUBMIT_WORDS;
  const isOverCharLimit = charCount > MAX_SUMMARY_CHARS;
  const wordProgress = useMemo(
    () => Math.min(100, Math.round((wordCount / TARGET_WORDS) * 100)),
    [wordCount],
  );

  const isAlreadyEvaluated = Boolean(
    reading && (reading.status === "completed" || reading.score !== null),
  );
  const hasUnsentDraft = !isAlreadyEvaluated && responseText.trim().length > 0;

  const evaluationAbortControllerRef = useRef<AbortController | null>(null);
  const evaluationCancelledRef = useRef(false);

  const abortActiveEvaluation = useCallback(() => {
    const controller = evaluationAbortControllerRef.current;
    if (!controller) {
      return;
    }
    evaluationCancelledRef.current = true;
    evaluationAbortControllerRef.current = null;
    controller.abort();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.addEventListener("pagehide", abortActiveEvaluation);
    return () => {
      window.removeEventListener("pagehide", abortActiveEvaluation);
      abortActiveEvaluation();
    };
  }, [abortActiveEvaluation]);

  const { allowNextNavigation } = useNavigationGuard({
    active: !isAlreadyEvaluated && (isSubmitting || hasUnsentDraft),
    message: isSubmitting
      ? t.navigationGuard.evaluationInProgressMessage
      : t.navigationGuard.evaluationUnsentMessage,
    onConfirmLeave: abortActiveEvaluation,
  });

  useEffect(() => {
    if (!isValidId || !isAlreadyEvaluated) return;
    removeDraft(readingId);
    allowNextNavigation();
    router.replace(`/readings/${readingId}/result`);
  }, [allowNextNavigation, isAlreadyEvaluated, isValidId, readingId, router]);

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
      const next = `${responseText}${separator}${term} `;
      if (next.length > MAX_SUMMARY_CHARS) {
        return;
      }
      updateResponseText(next);
    },
    [responseText, updateResponseText],
  );

  const saveDraftNow = useCallback(() => {
    if (!isValidId) return;
    writeDraft(readingId, responseText);
    setDraftNotice(flowT.readings.eval.draftSavedNotice);
  }, [flowT.readings.eval.draftSavedNotice, isValidId, readingId, responseText]);

  const handleSubmit = useCallback(async () => {
    if (!isValidId || isSubmitting || isAlreadyEvaluated) return;

    const trimmed = responseText.trim();
    const submittedWords = countWords(trimmed);
    if (
      submittedWords < MIN_SUBMIT_WORDS ||
      trimmed.length < MIN_SUMMARY_CHARS
    ) {
      setValidationError(flowT.readings.eval.minWordsError);
      return;
    }

    if (submittedWords > MAX_SUBMIT_WORDS) {
      setValidationError(
        formatMessage(flowT.readings.eval.maxWordsError, {
          max: MAX_SUBMIT_WORDS,
        }),
      );
      return;
    }

    if (trimmed.length > MAX_SUMMARY_CHARS) {
      setValidationError(
        formatMessage(flowT.readings.eval.maxCharsError, {
          max: MAX_SUMMARY_CHARS,
        }),
      );
      return;
    }

    setValidationError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    abortActiveEvaluation();
    const controller = new AbortController();
    evaluationAbortControllerRef.current = controller;
    evaluationCancelledRef.current = false;

    try {
      await readingsService.evaluate(
        readingId,
        { userResponse: trimmed },
        { signal: controller.signal },
      );
      if (controller.signal.aborted) {
        return;
      }
      removeDraft(readingId);
      await reloadAccountState?.().catch(() => undefined);
      allowNextNavigation();
      router.replace(`/readings/${readingId}/result`);
    } catch (err: unknown) {
      if (
        isAbortError(err) ||
        evaluationCancelledRef.current ||
        controller.signal.aborted
      ) {
        setIsSubmitting(false);
        return;
      }
      setSubmitError(
        err instanceof ApiClientError
          ? err.getUserMessage(readingLanguage)
          : flowT.readings.errors.submitEvaluationFailed,
      );
      setIsSubmitting(false);
    } finally {
      if (evaluationAbortControllerRef.current === controller) {
        evaluationAbortControllerRef.current = null;
      }
    }
  }, [
    abortActiveEvaluation,
    allowNextNavigation,
    flowT.readings.errors.submitEvaluationFailed,
    flowT.readings.eval.maxCharsError,
    flowT.readings.eval.maxWordsError,
    flowT.readings.eval.minWordsError,
    isAlreadyEvaluated,
    isSubmitting,
    isValidId,
    readingId,
    readingLanguage,
    reloadAccountState,
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
    isAlreadyEvaluated,
    isOverWordLimit,
    isOverCharLimit,
    minWords: MIN_SUBMIT_WORDS,
    maxWords: MAX_SUBMIT_WORDS,
    maxChars: MAX_SUMMARY_CHARS,
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
