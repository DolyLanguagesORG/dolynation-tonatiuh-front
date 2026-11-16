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
          eyebrow={t.readings.historyEyebrow}
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
          <Alert variant="error" title={t.readings.loadHistoryErrorTitle}>
            {history.errorMessage}
          </Alert>
        )}

        {history.deleteError && (
          <Alert
            variant="error"
            title={t.readings.deleteErrorTitle}
            onDismiss={() => history.setDeleteError(null)}
          >
            {history.deleteError}
          </Alert>
        )}

        {history.deleteNotice && (
          <Alert
            variant="success"
            title={t.readings.syncCompletedTitle}
            onDismiss={() => history.setDeleteNotice(null)}
          >
            {history.deleteNotice}
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
          <SkeletonCard lines={5} label={t.readings.loadingHistory} />
        ) : (
          <ReadingsHistoryTable
            t={t}
            locale={locale}
            readings={history.paginatedReadings}
            totalFilteredCount={history.filteredCount}
            currentPage={history.currentPage}
            totalPages={history.totalPages}
            hasActiveFilters={history.hasActiveFilters}
            deletingId={history.deletingId}
            onPageChange={history.setCurrentPage}
            onResetFilters={history.resetFilters}
            onDeleteReading={history.handleDeleteReading}
          />
        )}
      </Container>
    </RequireAuth>
  );
}
