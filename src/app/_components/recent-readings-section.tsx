"use client";

import Link from "next/link";

import { type HomeReadingItem } from "@/app/_hooks/use-home-dashboard";
import {
  ActionLink,
  Badge,
  Card,
  EmptyState,
  Heading,
  Icon,
  IconButton,
  Input,
  SkeletonCard,
  Text,
} from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";

export interface RecentReadingsSectionProps {
  t: Dictionary;
  locale: Locale;
  isAuthenticated: boolean;
  isLoadingData: boolean;
  searchQuery: string;
  searchError?: string;
  totalCount: number;
  readings: readonly HomeReadingItem[];
  onSearchChange: (value: string) => void;
}

/**
 * Listado filtrable de lecturas recientes en el panel principal (`01-inicio.png`).
 */
export function RecentReadingsSection({
  t,
  locale,
  isAuthenticated,
  isLoadingData,
  searchQuery,
  searchError,
  totalCount,
  readings,
  onSearchChange,
}: RecentReadingsSectionProps) {
  const countBadge =
    isAuthenticated
      ? `(${totalCount})`
      : t.home.recordsCount;

  return (
    <section id="ultimas-lecturas" className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xs font-bold tracking-wider text-ink uppercase">
            {t.home.recentReadingsTitle}
          </h2>
          <span className="font-mono text-xs font-semibold text-muted">
            {countBadge}
          </span>
        </div>

        <Link
          href="/readings"
          className="inline-flex items-center gap-1 text-xs font-bold tracking-wider text-ink uppercase transition-colors hover:text-muted"
        >
          <span>{t.home.fullHistoryLink}</span>
          <Icon name="arrow-right" size="xs" />
        </Link>
      </div>

      <Input
        type="search"
        label={t.home.searchReadingsLabel}
        hint={t.home.searchReadingsHint}
        placeholder={t.home.searchReadingsPlaceholder}
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        error={searchError}
        rightElement={
          searchQuery ? (
            <IconButton
              icon="close"
              size="xs"
              variant="ghost"
              onClick={() => onSearchChange("")}
              aria-label={locale === "es" ? "Limpiar filtro" : "Clear filter"}
            />
          ) : undefined
        }
      />

      {isLoadingData ? (
        <SkeletonCard lines={3} label="Cargando lecturas recientes" />
      ) : readings.length === 0 ? (
        <EmptyState
          icon="book-open"
          title={
            searchQuery.trim()
              ? locale === "es"
                ? "Sin coincidencias en tus lecturas"
                : "No readings match your filter"
              : t.readings.emptyTitle
          }
          description={t.readings.emptyDescription}
          actions={
            <ActionLink
              href="/generate"
              variant="primary"
              size="md"
              leftIcon={<Icon name="sparkles" size="sm" />}
            >
              {t.readings.emptyAction}
            </ActionLink>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {readings.map((reading) => (
            <Card
              key={reading.id}
              as="article"
              padding="lg"
              className="flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{reading.languageLabel}</Badge>
                  <Badge variant={reading.difficultyVariant}>
                    {reading.difficultyLabel}
                  </Badge>
                  <span className="text-xs text-muted">
                    • {reading.timestampLabel}
                  </span>
                </div>

                <span className="text-[11px] font-bold tracking-wider text-ink uppercase">
                  {reading.statusLabel}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <Heading as="h3" variant="section" lang={reading.languageCode}>
                  {reading.title}
                </Heading>
                <Text
                  variant="editorial"
                  tone="muted"
                  lang={reading.languageCode}
                  className="sm:text-base"
                >
                  {reading.excerpt}
                </Text>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">
                  {reading.durationLabel} • {reading.metaLabel}
                </p>

                <div className="flex items-center gap-2">
                  <ActionLink
                    href={reading.feedbackHref}
                    variant="secondary"
                    size="sm"
                  >
                    {reading.hasScore
                      ? t.home.feedbackButton
                      : t.readings.evaluateAction}
                  </ActionLink>
                  <ActionLink
                    href={reading.detailHref}
                    variant="primary"
                    size="sm"
                    rightIcon={<Icon name="play" size="xs" />}
                  >
                    {reading.isCompleted
                      ? t.home.rereadButton
                      : t.readings.startReadingAction}
                  </ActionLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
