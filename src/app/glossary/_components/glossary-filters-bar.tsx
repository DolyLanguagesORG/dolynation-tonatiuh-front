"use client";

import { type GlossaryLanguagePlanContext } from "@/app/glossary/_hooks/glossary-language-filter";
import {
  type GlossaryEntryTypeFilter,
  type GlossaryLanguageFilter,
  type GlossaryScopeFilter,
} from "@/app/glossary/_hooks/use-glossary";
import {
  Badge,
  Card,
  ChoiceChip,
  IconButton,
  Input,
  Text,
} from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";
import { formatReadingLanguageBadge } from "@/lib";

export interface GlossaryFiltersBarProps {
  t: Dictionary;
  locale: Locale;
  counts: {
    totalEntries: number;
    savedCount: number;
    allLanguagesScopedTotal: number;
    scopedTotal: number;
    scopedWords: number;
    scopedPhrases: number;
  };
  languagePlan: GlossaryLanguagePlanContext;
  scopeFilter: GlossaryScopeFilter;
  typeFilter: GlossaryEntryTypeFilter;
  languageFilter: GlossaryLanguageFilter;
  searchQuery: string;
  onScopeChange: (scope: GlossaryScopeFilter) => void;
  onTypeChange: (type: GlossaryEntryTypeFilter) => void;
  onLanguageChange: (language: GlossaryLanguageFilter) => void;
  onSearchChange: (value: string) => void;
}

/**
 * Barra modular de filtros del glosario: alcance (guardados vs historial),
 * filtro rápido de idiomas adaptado al plan de suscripción, clasificación
 * (palabras vs oraciones/expresiones) y búsqueda textual.
 */
export function GlossaryFiltersBar({
  t,
  locale,
  counts,
  languagePlan,
  scopeFilter,
  typeFilter,
  languageFilter,
  searchQuery,
  onScopeChange,
  onTypeChange,
  onLanguageChange,
  onSearchChange,
}: GlossaryFiltersBarProps) {
  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="radiogroup"
          aria-label={t.glossary.title}
          className="flex flex-wrap items-center gap-2"
        >
          <ChoiceChip
            size="sm"
            selectionRole="radio"
            selected={scopeFilter === "saved"}
            onClick={() => onScopeChange("saved")}
          >
            {t.glossary.filterSavedOnly} ({counts.savedCount})
          </ChoiceChip>
          <ChoiceChip
            size="sm"
            selectionRole="radio"
            selected={scopeFilter === "all"}
            onClick={() => onScopeChange("all")}
          >
            {t.glossary.filterAllConsultations} ({counts.totalEntries})
          </ChoiceChip>
        </div>

        {!languagePlan.showQuickFilter && languagePlan.singlePlanLanguage && (
          <Badge variant="outline" className="font-mono uppercase">
            {t.glossary.singleLanguagePlanHint}:{" "}
            {formatReadingLanguageBadge(
              languagePlan.singlePlanLanguage.language,
              locale,
            )}{" "}
            ({languagePlan.singlePlanLanguage.count})
          </Badge>
        )}
      </div>

      {languagePlan.showQuickFilter && (
        <div className="flex flex-col gap-2 border-t border-default pt-3">
          <div
            role="radiogroup"
            aria-label={t.glossary.languageFilterAriaLabel}
            className="flex flex-wrap items-center gap-2"
          >
            <ChoiceChip
              size="sm"
              selectionRole="radio"
              selected={languageFilter === "all"}
              onClick={() => onLanguageChange("all")}
            >
              {t.glossary.allLanguagesFilter} ({counts.allLanguagesScopedTotal})
            </ChoiceChip>
            {languagePlan.options.map((option) => (
              <ChoiceChip
                key={option.language}
                size="sm"
                selectionRole="radio"
                selected={languageFilter === option.language}
                onClick={() => onLanguageChange(option.language)}
              >
                {formatReadingLanguageBadge(option.language, locale)} (
                {option.count})
                {option.isHistorical
                  ? ` · ${t.glossary.historicalLanguageTag}`
                  : ""}
              </ChoiceChip>
            ))}
          </div>

          {languagePlan.hasHistoricalLanguages && (
            <Text variant="caption" tone="muted">
              {t.glossary.historicalLanguagesHint}
            </Text>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-3">
        <div
          role="tablist"
          aria-label={t.glossary.title}
          className="flex flex-wrap items-center gap-2"
        >
          <ChoiceChip
            size="sm"
            selectionRole="radio"
            selected={typeFilter === "all"}
            onClick={() => onTypeChange("all")}
          >
            {t.glossary.tabAll} ({counts.scopedTotal})
          </ChoiceChip>
          <ChoiceChip
            size="sm"
            selectionRole="radio"
            selected={typeFilter === "word"}
            onClick={() => onTypeChange("word")}
          >
            {t.glossary.tabWords} ({counts.scopedWords})
          </ChoiceChip>
          <ChoiceChip
            size="sm"
            selectionRole="radio"
            selected={typeFilter === "phrase"}
            onClick={() => onTypeChange("phrase")}
          >
            {t.glossary.tabPhrases} ({counts.scopedPhrases})
          </ChoiceChip>
        </div>
      </div>

      <Input
        type="search"
        label={t.glossary.searchPlaceholder}
        placeholder={t.glossary.searchPlaceholder}
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        rightElement={
          searchQuery ? (
            <IconButton
              icon="close"
              size="xs"
              variant="ghost"
              aria-label={t.glossary.clearSearchAria}
              onClick={() => onSearchChange("")}
            />
          ) : undefined
        }
      />
    </Card>
  );
}
