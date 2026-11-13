"use client";

import Link from "next/link";

import {
  ActionLink,
  Badge,
  Button,
  Card,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeadCell,
  DataTableRow,
  EmptyState,
  Heading,
  Icon,
  Pagination,
  Text,
} from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";
import {
  estimateReadingMinutes,
  formatReadingDate,
  formatReadingLanguageBadge,
  getDifficultyMeta,
  type ReadingDto,
} from "@/lib";

export interface ReadingsHistoryTableProps {
  t: Dictionary;
  locale: Locale;
  readings: readonly ReadingDto[];
  totalFilteredCount: number;
  currentPage: number;
  totalPages: number;
  hasActiveFilters: boolean;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
}

/**
 * Renderiza el historial de lecturas en tabla editorial para escritorio (`DataTable`)
 * y tarjetas compactas en móvil, con acciones contextuales y paginación.
 */
export function ReadingsHistoryTable({
  t,
  locale,
  readings,
  totalFilteredCount,
  currentPage,
  totalPages,
  hasActiveFilters,
  onPageChange,
  onResetFilters,
}: ReadingsHistoryTableProps) {
  if (readings.length === 0) {
    return (
      <EmptyState
        icon="book-open"
        title={t.readings.emptyTitle}
        description={t.readings.emptyDescription}
        actions={
          <>
            <ActionLink
              href="/generate"
              variant="primary"
              size="md"
              leftIcon={<Icon name="sparkles" size="sm" />}
            >
              {t.readings.emptyAction}
            </ActionLink>
            {hasActiveFilters && (
              <Button variant="secondary" size="md" onClick={onResetFilters}>
                {locale === "es" ? "Restablecer filtros" : "Reset filters"}
              </Button>
            )}
          </>
        }
      />
    );
  }

  const summaryText =
    locale === "es"
      ? `Mostrando ${readings.length} de ${totalFilteredCount} lecturas`
      : `Showing ${readings.length} of ${totalFilteredCount} readings`;

  return (
    <div className="flex flex-col gap-4">
      <Card padding="none" className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <DataTable>
            <DataTableHead>
              <DataTableRow>
                <DataTableHeadCell>{t.readings.columns.title}</DataTableHeadCell>
                <DataTableHeadCell>
                  {t.readings.columns.language}
                </DataTableHeadCell>
                <DataTableHeadCell>
                  {t.readings.columns.difficulty}
                </DataTableHeadCell>
                <DataTableHeadCell>{t.readings.columns.score}</DataTableHeadCell>
                <DataTableHeadCell>{t.readings.columns.date}</DataTableHeadCell>
                <DataTableHeadCell className="text-right">
                  {t.readings.columns.action}
                </DataTableHeadCell>
              </DataTableRow>
            </DataTableHead>

            <DataTableBody>
              {readings.map((reading) => {
                const diffMeta = getDifficultyMeta(reading.difficulty, locale);
                const estMinutes = estimateReadingMinutes(
                  reading.wordCount,
                  reading.content,
                );
                const isEvaluated = typeof reading.score === "number";

                return (
                  <DataTableRow key={reading.id}>
                    <DataTableCell className="max-w-xs whitespace-normal">
                      <Link
                        href={`/readings/${reading.id}`}
                        className="font-serif text-base font-bold text-heading underline-offset-4 hover:underline"
                      >
                        {reading.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-[11px] text-muted uppercase">
                        {(reading.category ?? "GENERAL").toUpperCase()} •{" "}
                        {estMinutes} {t.readings.estimatedReadUnit}
                      </p>
                    </DataTableCell>

                    <DataTableCell>
                      <Badge variant="secondary">
                        {formatReadingLanguageBadge(reading.language, locale)}
                      </Badge>
                    </DataTableCell>

                    <DataTableCell>
                      <Badge variant={diffMeta.badgeVariant}>
                        {diffMeta.label} • {diffMeta.cefrBadge}
                      </Badge>
                    </DataTableCell>

                    <DataTableCell>
                      {isEvaluated ? (
                        <Badge variant={reading.passed ? "success" : "warning"}>
                          {reading.score}/100
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {locale === "es" ? "PENDIENTE" : "PENDING"}
                        </Badge>
                      )}
                    </DataTableCell>

                    <DataTableCell className="font-mono text-xs text-muted">
                      {formatReadingDate(reading.createdAt, locale)}
                    </DataTableCell>

                    <DataTableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <ActionLink
                          href={
                            isEvaluated
                              ? `/readings/${reading.id}/result`
                              : `/readings/${reading.id}/evaluate`
                          }
                          variant="secondary"
                          size="xs"
                        >
                          {isEvaluated
                            ? t.readings.detailAction
                            : t.readings.evaluateAction}
                        </ActionLink>
                        <ActionLink
                          href={`/readings/${reading.id}`}
                          variant="primary"
                          size="xs"
                          rightIcon={<Icon name="arrow-right" size="xs" />}
                        >
                          {reading.status === "completed"
                            ? t.readings.rereadAction
                            : t.readings.startReadingAction}
                        </ActionLink>
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        </div>
      </Card>

      <div className="flex flex-col gap-3 md:hidden">
        {readings.map((reading) => {
          const diffMeta = getDifficultyMeta(reading.difficulty, locale);
          const isEvaluated = typeof reading.score === "number";

          return (
            <Card key={reading.id} padding="md" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">
                    {formatReadingLanguageBadge(reading.language, locale)}
                  </Badge>
                  <Badge variant={diffMeta.badgeVariant}>
                    {diffMeta.cefrBadge}
                  </Badge>
                </div>

                {isEvaluated ? (
                  <Badge variant={reading.passed ? "success" : "warning"}>
                    {reading.score}/100
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    {locale === "es" ? "PENDIENTE" : "PENDING"}
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Heading as="h3" variant="subsection">
                  {reading.title}
                </Heading>
                <Text variant="caption" tone="muted" className="font-mono uppercase">
                  {formatReadingDate(reading.createdAt, locale)} •{" "}
                  {(reading.category ?? "GENERAL").toUpperCase()}
                </Text>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-default pt-3">
                <ActionLink
                  href={
                    isEvaluated
                      ? `/readings/${reading.id}/result`
                      : `/readings/${reading.id}/evaluate`
                  }
                  variant="secondary"
                  size="xs"
                >
                  {isEvaluated
                    ? t.readings.detailAction
                    : t.readings.evaluateAction}
                </ActionLink>
                <ActionLink
                  href={`/readings/${reading.id}`}
                  variant="primary"
                  size="xs"
                  rightIcon={<Icon name="arrow-right" size="xs" />}
                >
                  {reading.status === "completed"
                    ? t.readings.rereadAction
                    : t.readings.startReadingAction}
                </ActionLink>
              </div>
            </Card>
          );
        })}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalFilteredCount}
        visibleItemsCount={readings.length}
        onPageChange={onPageChange}
        previousLabel={locale === "es" ? "ANTERIOR" : "PREVIOUS"}
        nextLabel={locale === "es" ? "SIGUIENTE" : "NEXT"}
        summaryText={summaryText}
      />
    </div>
  );
}
