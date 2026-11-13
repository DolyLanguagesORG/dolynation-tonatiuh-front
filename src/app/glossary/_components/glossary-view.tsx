"use client";

import { GlossaryEntryCard } from "@/app/glossary/_components/glossary-entry-card";
import { GlossaryFiltersBar } from "@/app/glossary/_components/glossary-filters-bar";
import { useGlossary } from "@/app/glossary/_hooks/use-glossary";
import { RequireAuth } from "@/components/auth";
import {
  ActionLink,
  Alert,
  Button,
  Container,
  EmptyState,
  Eyebrow,
  Icon,
  PageHeader,
  SkeletonCard,
  StatCard,
} from "@/components/ui";
import { useLocale } from "@/i18n";

/**
 * Vista principal del Glosario Personal (`/glossary`): organiza palabras y oraciones/expresiones
 * consultadas en las lecturas con filtrado por tipo, idioma y búsqueda.
 */
export function GlossaryView() {
  const { locale, t } = useLocale();
  const glossary = useGlossary();

  const wordEntries = glossary.filteredEntries.filter(
    (entry) => entry.entryType === "word",
  );
  const phraseEntries = glossary.filteredEntries.filter(
    (entry) => entry.entryType === "phrase",
  );
  const showGroupedSections =
    glossary.typeFilter === "all" &&
    wordEntries.length > 0 &&
    phraseEntries.length > 0;

  return (
    <RequireAuth>
      <Container size="xl" className="flex flex-col gap-8">
        <PageHeader
          eyebrow={t.glossary.eyebrow}
          title={t.glossary.title}
          subtitle={t.glossary.subtitle}
          actions={
            <ActionLink
              href="/readings"
              variant="secondary"
              size="md"
              leftIcon={<Icon name="book-open" size="sm" />}
            >
              {t.nav.myReadings}
            </ActionLink>
          }
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label={t.glossary.statsTotal}
            value={glossary.counts.scopedTotal}
          />
          <StatCard
            label={t.glossary.statsWords}
            value={glossary.counts.scopedWords}
          />
          <StatCard
            label={t.glossary.statsPhrases}
            value={glossary.counts.scopedPhrases}
          />
          <StatCard
            label={t.glossary.statsSaved}
            value={glossary.counts.savedCount}
          />
        </div>

        {glossary.errorMessage && (
          <Alert
            variant="error"
            title={
              locale === "es"
                ? "Error al consultar glosario"
                : "Failed to load glossary"
            }
          >
            {glossary.errorMessage}
          </Alert>
        )}

        <GlossaryFiltersBar
          t={t}
          locale={locale}
          counts={glossary.counts}
          scopeFilter={glossary.scopeFilter}
          typeFilter={glossary.typeFilter}
          languageFilter={glossary.languageFilter}
          searchQuery={glossary.searchQuery}
          onScopeChange={glossary.setScopeFilter}
          onTypeChange={glossary.setTypeFilter}
          onLanguageChange={glossary.setLanguageFilter}
          onSearchChange={glossary.setSearchQuery}
        />

        {glossary.isLoading ? (
          <SkeletonCard
            lines={5}
            label={
              locale === "es" ? "Cargando glosario personal" : "Loading glossary"
            }
          />
        ) : glossary.filteredEntries.length === 0 ? (
          <EmptyState
            icon="bookmark"
            title={t.glossary.emptyTitle}
            description={t.glossary.emptyDescription}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {glossary.hasActiveFilters && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={glossary.resetFilters}
                  >
                    {locale === "es" ? "Limpiar filtros" : "Clear filters"}
                  </Button>
                )}
                <ActionLink
                  href="/readings"
                  variant="primary"
                  size="sm"
                  leftIcon={<Icon name="book-open" size="sm" />}
                >
                  {t.glossary.emptyAction}
                </ActionLink>
              </div>
            }
          />
        ) : showGroupedSections ? (
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <Eyebrow tone="muted">
                  {t.glossary.tabPhrases} ({phraseEntries.length})
                </Eyebrow>
              </div>
              <div className="flex flex-col gap-4">
                {phraseEntries.map((entry) => (
                  <GlossaryEntryCard
                    key={entry.id}
                    t={t}
                    locale={locale}
                    entry={entry}
                    isToggling={glossary.togglingId === entry.id}
                    onToggleSave={(item) => void glossary.toggleSave(item)}
                    onPronounce={glossary.pronounceText}
                  />
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <Eyebrow tone="muted">
                  {t.glossary.tabWords} ({wordEntries.length})
                </Eyebrow>
              </div>
              <div className="flex flex-col gap-4">
                {wordEntries.map((entry) => (
                  <GlossaryEntryCard
                    key={entry.id}
                    t={t}
                    locale={locale}
                    entry={entry}
                    isToggling={glossary.togglingId === entry.id}
                    onToggleSave={(item) => void glossary.toggleSave(item)}
                    onPronounce={glossary.pronounceText}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {glossary.filteredEntries.map((entry) => (
              <GlossaryEntryCard
                key={entry.id}
                t={t}
                locale={locale}
                entry={entry}
                isToggling={glossary.togglingId === entry.id}
                onToggleSave={(item) => void glossary.toggleSave(item)}
                onPronounce={glossary.pronounceText}
              />
            ))}
          </div>
        )}
      </Container>
    </RequireAuth>
  );
}
