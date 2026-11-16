"use client";

import Link from "next/link";
import { useState } from "react";

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
  IconButton,
  Pagination,
  Text,
} from "@/components/ui";
import {
  type Dictionary,
  formatMessage,
  getReadingFlowDictionary,
  type Locale,
  type ReadingFlowDictionary,
  resolveReadingLanguage,
} from "@/i18n";
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
  deletingId: number | null;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onDeleteReading: (readingId: number) => Promise<boolean>;
}

function buildReadingRowPresentation(
  reading: ReadingDto,
  fallbackLocale: Locale,
) {
  const cardLanguage = resolveReadingLanguage(reading.language, fallbackLocale);
  const cardDict = getReadingFlowDictionary(cardLanguage);
  const diffMeta = getDifficultyMeta(reading.difficulty, cardLanguage);
  const estMinutes = estimateReadingMinutes(reading.wordCount, reading.content);
  const isEvaluated = typeof reading.score === "number";
  const categoryLabel = (
    reading.category ?? cardDict.readingCard.defaultCategory
  ).toUpperCase();

  return {
    cardLanguage,
    cardDict,
    diffMeta,
    estMinutes,
    isEvaluated,
    categoryLabel,
  };
}

interface ReadingActionControlsProps {
  reading: ReadingDto;
  cardDict: ReadingFlowDictionary;
  isEvaluated: boolean;
  confirmingDeleteId: number | null;
  deletingId: number | null;
  onRequestConfirmDelete: (readingId: number | null) => void;
  onConfirmDelete: (readingId: number) => void;
}

function ReadingActionControls({
  reading,
  cardDict,
  isEvaluated,
  confirmingDeleteId,
  deletingId,
  onRequestConfirmDelete,
  onConfirmDelete,
}: ReadingActionControlsProps) {
  const isConfirming = confirmingDeleteId === reading.id;
  const isDeleting = deletingId === reading.id;

  if (isConfirming) {
    return (
      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="danger"
          size="xs"
          isLoading={isDeleting}
          disabled={deletingId !== null && !isDeleting}
          leftIcon={<Icon name="trash" size="xs" />}
          onClick={() => onConfirmDelete(reading.id)}
        >
          {cardDict.readingCard.confirmDeleteButton}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={isDeleting}
          onClick={() => onRequestConfirmDelete(null)}
        >
          {cardDict.readingCard.cancelDeleteButton}
        </Button>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center justify-end gap-2">
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
          ? cardDict.readings.detailAction
          : cardDict.readings.evaluateAction}
      </ActionLink>
      <ActionLink
        href={`/readings/${reading.id}`}
        variant="primary"
        size="xs"
        rightIcon={<Icon name="arrow-right" size="xs" />}
      >
        {reading.status === "completed"
          ? cardDict.readings.rereadAction
          : cardDict.readings.startReadingAction}
      </ActionLink>
      <IconButton
        type="button"
        icon="trash"
        iconSize="xs"
        variant="outline"
        size="sm"
        disabled={deletingId !== null}
        aria-label={`${cardDict.readingCard.deleteReadingLabel}: ${reading.title}`}
        title={cardDict.readingCard.deleteReadingLabel}
        onClick={() => onRequestConfirmDelete(reading.id)}
      />
    </div>
  );
}

/**
 * Renderiza el historial de lecturas en tabla editorial para escritorio (`DataTable`)
 * y tarjetas compactas en móvil, con acciones contextuales, eliminación y paginación.
 */
export function ReadingsHistoryTable({
  t,
  locale,
  readings,
  totalFilteredCount,
  currentPage,
  totalPages,
  hasActiveFilters,
  deletingId,
  onPageChange,
  onResetFilters,
  onDeleteReading,
}: ReadingsHistoryTableProps) {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(
    null,
  );

  const handleConfirmDelete = async (readingId: number): Promise<void> => {
    const ok = await onDeleteReading(readingId);
    if (ok) {
      setConfirmingDeleteId(null);
    }
  };
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
                {t.readings.resetFiltersButton}
              </Button>
            )}
          </>
        }
      />
    );
  }

  const summaryText = formatMessage(t.readings.showingSummary, {
    visible: readings.length,
    total: totalFilteredCount,
  });

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
                const {
                  cardLanguage,
                  cardDict,
                  diffMeta,
                  estMinutes,
                  isEvaluated,
                  categoryLabel,
                } = buildReadingRowPresentation(reading, locale);

                return (
                  <DataTableRow key={reading.id} lang={cardLanguage}>
                    <DataTableCell className="max-w-xs whitespace-normal">
                      <Link
                        href={`/readings/${reading.id}`}
                        className="font-serif text-base font-bold text-heading underline-offset-4 hover:underline"
                      >
                        {reading.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-[11px] text-muted uppercase">
                        {categoryLabel} • {estMinutes}{" "}
                        {cardDict.readings.estimatedReadUnit}
                      </p>
                    </DataTableCell>

                    <DataTableCell>
                      <Badge variant="secondary">
                        {formatReadingLanguageBadge(cardLanguage, cardLanguage)}
                      </Badge>
                    </DataTableCell>

                    <DataTableCell>
                      <Badge variant={diffMeta.badgeVariant}>
                        {diffMeta.label}
                      </Badge>
                    </DataTableCell>

                    <DataTableCell>
                      {isEvaluated ? (
                        <Badge variant={reading.passed ? "success" : "warning"}>
                          {reading.score}/100
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {cardDict.readings.result.pendingBadge}
                        </Badge>
                      )}
                    </DataTableCell>

                    <DataTableCell className="font-mono text-xs text-muted">
                      {formatReadingDate(reading.createdAt, cardLanguage)}
                    </DataTableCell>

                    <DataTableCell className="text-right">
                      <ReadingActionControls
                        reading={reading}
                        cardDict={cardDict}
                        isEvaluated={isEvaluated}
                        confirmingDeleteId={confirmingDeleteId}
                        deletingId={deletingId}
                        onRequestConfirmDelete={setConfirmingDeleteId}
                        onConfirmDelete={(id) => {
                          void handleConfirmDelete(id);
                        }}
                      />
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
          const {
            cardLanguage,
            cardDict,
            diffMeta,
            isEvaluated,
            categoryLabel,
          } = buildReadingRowPresentation(reading, locale);

          return (
            <Card
              key={reading.id}
              as="article"
              lang={cardLanguage}
              padding="md"
              className="flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">
                    {formatReadingLanguageBadge(cardLanguage, cardLanguage)}
                  </Badge>
                  <Badge variant={diffMeta.badgeVariant}>
                    {diffMeta.label}
                  </Badge>
                </div>

                {isEvaluated ? (
                  <Badge variant={reading.passed ? "success" : "warning"}>
                    {reading.score}/100
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    {cardDict.readings.result.pendingBadge}
                  </Badge>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Heading as="h3" variant="subsection">
                  {reading.title}
                </Heading>
                <Text variant="caption" tone="muted" className="font-mono uppercase">
                  {formatReadingDate(reading.createdAt, cardLanguage)} •{" "}
                  {categoryLabel}
                </Text>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-default pt-3">
                <ReadingActionControls
                  reading={reading}
                  cardDict={cardDict}
                  isEvaluated={isEvaluated}
                  confirmingDeleteId={confirmingDeleteId}
                  deletingId={deletingId}
                  onRequestConfirmDelete={setConfirmingDeleteId}
                  onConfirmDelete={(id) => {
                    void handleConfirmDelete(id);
                  }}
                />
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
        previousLabel={t.meta.paginationPrevious}
        nextLabel={t.meta.paginationNext}
        ariaLabel={t.meta.paginationAriaLabel}
        summaryText={summaryText}
      />
    </div>
  );
}
