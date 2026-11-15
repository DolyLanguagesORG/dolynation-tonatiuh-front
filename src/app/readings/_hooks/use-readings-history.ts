"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import {
  ApiClientError,
  type ReadingDifficulty,
  type ReadingDto,
  readingsService,
  type TargetLanguageCode,
} from "@/lib";

export type ReadingStatusFilter = "all" | "pending" | "completed";
export type ReadingLanguageFilter = "all" | TargetLanguageCode;
export type ReadingDifficultyFilter = "all" | ReadingDifficulty;

const PAGE_SIZE = 5;

/**
 * Hook de estado, filtrado y paginación para el historial de lecturas (`/readings`).
 */
export function useReadingsHistory() {
  const { locale } = useLocale();
  const { user, isAuthenticated } = useAuth();

  const [allReadings, setAllReadings] = useState<ReadingDto[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  const [statusFilter, setStatusFilterState] =
    useState<ReadingStatusFilter>("all");
  const [languageFilter, setLanguageFilterState] =
    useState<ReadingLanguageFilter>("all");
  const [difficultyFilter, setDifficultyFilterState] =
    useState<ReadingDifficultyFilter>("all");
  const [searchQuery, setSearchQueryState] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchKey = isAuthenticated ? `${user?.id ?? "me"}-${locale}` : null;
  const isLoading = Boolean(fetchKey && loadedKey !== fetchKey);

  useEffect(() => {
    if (!fetchKey) return;

    let cancelled = false;

    Promise.allSettled([
      readingsService.listCompleted(),
      readingsService.listPending(),
    ])
      .then(([completedRes, pendingRes]) => {
        if (cancelled) return;

        const completedList =
          completedRes.status === "fulfilled"
            ? (completedRes.value.data ?? [])
            : [];
        const pendingList =
          pendingRes.status === "fulfilled"
            ? (pendingRes.value.data ?? [])
            : [];

        const deduped = new Map<number, ReadingDto>();
        for (const item of [...pendingList, ...completedList]) {
          deduped.set(item.id, item);
        }

        const merged = Array.from(deduped.values()).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setAllReadings(merged);

        if (
          completedRes.status === "rejected" &&
          pendingRes.status === "rejected"
        ) {
          const reason = completedRes.reason;
          setErrorMessage(
            reason instanceof ApiClientError
              ? reason.getUserMessage(locale)
              : locale === "es"
                ? "No pudimos cargar tu historial de lecturas en este momento."
                : "Could not load your reading history right now.",
          );
        } else {
          setErrorMessage(null);
        }
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
    let pending = 0;
    let completed = 0;
    for (const item of allReadings) {
      if (item.status === "completed") completed += 1;
      else pending += 1;
    }
    return {
      all: allReadings.length,
      pending,
      completed,
    };
  }, [allReadings]);

  const filteredReadings = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return allReadings.filter((reading) => {
      if (statusFilter !== "all" && reading.status !== statusFilter) {
        return false;
      }
      if (languageFilter !== "all" && reading.language !== languageFilter) {
        return false;
      }
      if (
        difficultyFilter !== "all" &&
        (reading.difficulty ?? "medium") !== difficultyFilter
      ) {
        return false;
      }
      if (normalizedSearch) {
        const haystack = [
          reading.title,
          reading.description,
          reading.category ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }
      return true;
    });
  }, [
    allReadings,
    difficultyFilter,
    languageFilter,
    searchQuery,
    statusFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredReadings.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedReadings = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredReadings.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredReadings, safeCurrentPage]);

  const setStatusFilter = (value: ReadingStatusFilter) => {
    setStatusFilterState(value);
    setCurrentPage(1);
  };

  const setLanguageFilter = (value: ReadingLanguageFilter) => {
    setLanguageFilterState(value);
    setCurrentPage(1);
  };

  const setDifficultyFilter = (value: ReadingDifficultyFilter) => {
    setDifficultyFilterState(value);
    setCurrentPage(1);
  };

  const setSearchQuery = (value: string) => {
    setSearchQueryState(value);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setStatusFilterState("all");
    setLanguageFilterState("all");
    setDifficultyFilterState("all");
    setSearchQueryState("");
    setCurrentPage(1);
  };

  const handleDeleteReading = async (readingId: number): Promise<boolean> => {
    if (deletingId !== null) return false;

    setDeletingId(readingId);
    setDeleteError(null);
    setDeleteNotice(null);
    try {
      await readingsService.remove(readingId);
      setAllReadings((prev) => prev.filter((item) => item.id !== readingId));
      setDeleteNotice(
        locale === "es"
          ? "Lectura eliminada correctamente."
          : "Reading deleted successfully.",
      );
      return true;
    } catch (error) {
      setDeleteError(
        error instanceof ApiClientError
          ? error.getUserMessage(locale)
          : locale === "es"
            ? "No fue posible eliminar la lectura."
            : "Could not delete the reading.",
      );
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    languageFilter !== "all" ||
    difficultyFilter !== "all" ||
    searchQuery.trim().length > 0;

  return {
    isLoading,
    errorMessage,
    deletingId,
    deleteError,
    setDeleteError,
    deleteNotice,
    setDeleteNotice,
    counts,
    filteredCount: filteredReadings.length,
    paginatedReadings,
    statusFilter,
    languageFilter,
    difficultyFilter,
    searchQuery,
    currentPage: safeCurrentPage,
    totalPages,
    hasActiveFilters,
    setStatusFilter,
    setLanguageFilter,
    setDifficultyFilter,
    setSearchQuery,
    setCurrentPage,
    resetFilters,
    handleDeleteReading,
  };
}
