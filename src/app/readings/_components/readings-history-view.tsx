"use client";

import { ReadingsFiltersBar } from "@/app/readings/_components/readings-filters-bar";
import { ReadingsHistoryTable } from "@/app/readings/_components/readings-history-table";
import { useReadingsHistory } from "@/app/readings/_hooks/use-readings-history";
import { RequireAuth } from "@/components/auth";
import {
  ActionLink,
  Alert,
  Container,
  Icon,
  PageHeader,
  SkeletonCard,
} from "@/components/ui";
import { useLocale } from "@/i18n";

/**
 * Vista principal modular del Historial de Lecturas (`/readings` - Figma #09).
 */
export function ReadingsHistoryView() {
  const { locale, t } = useLocale();
  const history = useReadingsHistory();

  return (
    <RequireAuth>
      <Container size="xl" className="flex flex-col gap-8">
        <PageHeader
          eyebrow={
            locale === "es"
              ? "[ARCHIVO ACADÉMICO] / HISTORIAL"
              : "[ACADEMIC ARCHIVE] / HISTORY"
          }
          title={t.readings.historyTitle}
          subtitle={t.readings.historySubtitle}
          actions={
            <ActionLink
              href="/generate"
              variant="primary"
              size="md"
              leftIcon={<Icon name="sparkles" size="sm" />}
            >
              {t.nav.newReadingCta}
            </ActionLink>
          }
        />

        {history.errorMessage && (
          <Alert
            variant="error"
            title={
              locale === "es"
                ? "Error al cargar historial"
                : "Failed to load history"
            }
          >
            {history.errorMessage}
          </Alert>
        )}

        <ReadingsFiltersBar
          t={t}
          locale={locale}
          counts={history.counts}
          statusFilter={history.statusFilter}
          languageFilter={history.languageFilter}
          difficultyFilter={history.difficultyFilter}
          searchQuery={history.searchQuery}
          onStatusChange={history.setStatusFilter}
          onLanguageChange={history.setLanguageFilter}
          onDifficultyChange={history.setDifficultyFilter}
          onSearchChange={history.setSearchQuery}
        />

        {history.isLoading ? (
          <SkeletonCard
            lines={5}
            label={
              locale === "es"
                ? "Cargando historial de lecturas"
                : "Loading reading history"
            }
          />
        ) : (
          <ReadingsHistoryTable
            t={t}
            locale={locale}
            readings={history.paginatedReadings}
            totalFilteredCount={history.filteredCount}
            currentPage={history.currentPage}
            totalPages={history.totalPages}
            hasActiveFilters={history.hasActiveFilters}
            onPageChange={history.setCurrentPage}
            onResetFilters={history.resetFilters}
          />
        )}
      </Container>
    </RequireAuth>
  );
}
