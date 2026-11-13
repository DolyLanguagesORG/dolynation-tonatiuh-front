"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import {
  ApiClientError,
  countWords,
  extractSalientVocabulary,
  type ReadingDto,
  readingsService,
} from "@/lib";

/**
 * Hook de datos y métricas derivadas para la vista de Resultado (`/readings/[id]/result`).
 */
export function useEvaluationResult(rawId: string) {
  const { locale } = useLocale();
  const { user, isAuthenticated } = useAuth();

  const readingId = Number(rawId);
  const isValidId = Number.isInteger(readingId) && readingId > 0;

  const [reading, setReading] = useState<ReadingDto | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchKey =
    isAuthenticated && isValidId
      ? `${user?.id ?? "me"}-result-${readingId}`
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
        setErrorMessage(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setReading(null);
        setErrorMessage(
          err instanceof ApiClientError
            ? err.getUserMessage(locale)
            : locale === "es"
              ? "No pudimos recuperar los resultados de esta evaluación."
              : "Could not load evaluation results.",
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

  const metrics = useMemo(() => {
    if (!reading) {
      return {
        isEvaluated: false,
        score: 0,
        passed: false,
        responseWordCount: 0,
        responseTargetPct: 0,
        keyTerms: [] as { term: string; usedInResponse: boolean }[],
        matchedCount: 0,
        lexicalCoveragePct: 0,
      };
    }

    const isEvaluated = typeof reading.score === "number";
    const score = reading.score ?? 0;
    const passed = Boolean(reading.passed);
    const userResponse = reading.userResponse ?? "";
    const normalizedResponse = userResponse.toLowerCase();
    const responseWordCount = countWords(userResponse);
    const responseTargetPct = Math.min(
      100,
      Math.round((responseWordCount / 100) * 100),
    );

    const extracted = extractSalientVocabulary(reading.content, 6);
    const keyTerms = extracted.map((term) => ({
      term,
      usedInResponse: normalizedResponse.includes(term.toLowerCase()),
    }));

    const matchedCount = keyTerms.filter((t) => t.usedInResponse).length;
    const lexicalCoveragePct =
      keyTerms.length > 0
        ? Math.round((matchedCount / keyTerms.length) * 100)
        : 0;

    return {
      isEvaluated,
      score,
      passed,
      responseWordCount,
      responseTargetPct,
      keyTerms,
      matchedCount,
      lexicalCoveragePct,
    };
  }, [reading]);

  return {
    readingId,
    isValidId,
    isLoading,
    reading,
    errorMessage,
    ...metrics,
  };
}
