"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import {
  ApiClientError,
  type ExplanationEntryType,
  type GlossaryEntryDto,
  getSpeechLocale,
  readingsService,
  type TargetLanguageCode,
} from "@/lib";

export type GlossaryEntryTypeFilter = "all" | ExplanationEntryType;
export type GlossaryLanguageFilter = "all" | TargetLanguageCode;
export type GlossaryScopeFilter = "saved" | "all";

/**
 * Hook de datos, filtros y acciones para la vista `/glossary`.
 */
export function useGlossary() {
  const { locale } = useLocale();
  const { user, isAuthenticated } = useAuth();

  const [entries, setEntries] = useState<GlossaryEntryDto[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [scopeFilter, setScopeFilter] = useState<GlossaryScopeFilter>("saved");
  const [typeFilter, setTypeFilter] = useState<GlossaryEntryTypeFilter>("all");
  const [languageFilter, setLanguageFilter] =
    useState<GlossaryLanguageFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchKey = isAuthenticated ? `${user?.id ?? "me"}-glossary` : null;
  const isLoading = Boolean(fetchKey && loadedKey !== fetchKey);

  useEffect(() => {
    if (!fetchKey) return;
    let cancelled = false;

    readingsService
      .getGlossary()
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        setEntries(rows);
        // Si el usuario aún no ha marcado favoritos pero ya tiene consultas,
        // mostrar todas inicialmente para que descubra sus ayudas recientes.
        if (rows.length > 0 && !rows.some((item) => item.isSaved)) {
          setScopeFilter("all");
        }
        setErrorMessage(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setEntries([]);
        setErrorMessage(
          err instanceof ApiClientError
            ? err.getUserMessage(locale)
            : locale === "es"
              ? "No fue posible cargar tu glosario."
              : "Could not load your glossary.",
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
  }, [fetchKey, locale]);

  const counts = useMemo(() => {
    const scoped =
      scopeFilter === "saved" ? entries.filter((e) => e.isSaved) : entries;
    return {
      totalEntries: entries.length,
      savedCount: entries.filter((e) => e.isSaved).length,
      scopedTotal: scoped.length,
      scopedWords: scoped.filter((e) => e.entryType === "word").length,
      scopedPhrases: scoped.filter((e) => e.entryType === "phrase").length,
    };
  }, [entries, scopeFilter]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((entry) => {
      if (scopeFilter === "saved" && !entry.isSaved) return false;
      if (typeFilter !== "all" && entry.entryType !== typeFilter) return false;
      if (languageFilter !== "all" && entry.language !== languageFilter)
        return false;
      if (!q) return true;
      return (
        entry.word.toLowerCase().includes(q) ||
        entry.explanation.toLowerCase().includes(q) ||
        (entry.literalMeaning?.toLowerCase().includes(q) ?? false) ||
        (entry.context?.toLowerCase().includes(q) ?? false) ||
        entry.readingTitle.toLowerCase().includes(q)
      );
    });
  }, [entries, languageFilter, scopeFilter, searchQuery, typeFilter]);

  const toggleSave = useCallback(
    async (entry: GlossaryEntryDto) => {
      if (togglingId !== null) return;
      setTogglingId(entry.id);
      setErrorMessage(null);

      try {
        const res = await readingsService.toggleGlossarySave(entry.id, {
          isSaved: !entry.isSaved,
        });
        const updated = res.data;
        setEntries((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof ApiClientError
            ? err.getUserMessage(locale)
            : locale === "es"
              ? "No se pudo actualizar esta entrada del glosario."
              : "Could not update this glossary entry.",
        );
      } finally {
        setTogglingId(null);
      }
    },
    [locale, togglingId],
  );

  const pronounceText = useCallback(
    (textToSpeak: string, language: TargetLanguageCode) => {
      if (
        typeof window === "undefined" ||
        !("speechSynthesis" in window) ||
        !textToSpeak.trim()
      ) {
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = getSpeechLocale(language);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setScopeFilter("all");
    setTypeFilter("all");
    setLanguageFilter("all");
    setSearchQuery("");
  }, []);

  const hasActiveFilters =
    typeFilter !== "all" ||
    languageFilter !== "all" ||
    searchQuery.trim().length > 0;

  return {
    isLoading,
    errorMessage,
    togglingId,
    counts,
    filteredEntries,
    scopeFilter,
    typeFilter,
    languageFilter,
    searchQuery,
    hasActiveFilters,
    setScopeFilter,
    setTypeFilter,
    setLanguageFilter,
    setSearchQuery,
    resetFilters,
    toggleSave,
    pronounceText,
  };
}
