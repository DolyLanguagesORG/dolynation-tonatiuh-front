"use client";

import {
  type GlossaryEntryTypeFilter,
  type GlossaryLanguageFilter,
  type GlossaryScopeFilter,
} from "@/app/glossary/_hooks/use-glossary";
import {
  Card,
  ChoiceChip,
  IconButton,
  Input,
  Select,
} from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";

export interface GlossaryFiltersBarProps {
  t: Dictionary;
  locale: Locale;
  counts: {
    totalEntries: number;
    savedCount: number;
    scopedTotal: number;
    scopedWords: number;
    scopedPhrases: number;
  };
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
 * clasificación (palabras vs oraciones/expresiones), idioma y búsqueda textual.
 */
export function GlossaryFiltersBar({
  t,
  locale,
  counts,
  scopeFilter,
  typeFilter,
  languageFilter,
  searchQuery,
  onScopeChange,
  onTypeChange,
  onLanguageChange,
  onSearchChange,
}: GlossaryFiltersBarProps) {
  const languageOptions = [
    { value: "all", label: t.glossary.allLanguagesFilter },
    { value: "es", label: locale === "es" ? "[ES] ESPAÑOL" : "[ES] SPANISH" },
    { value: "en", label: locale === "es" ? "[EN] INGLÉS" : "[EN] ENGLISH" },
    { value: "fr", label: locale === "es" ? "[FR] FRANCÉS" : "[FR] FRENCH" },
    { value: "it", label: locale === "es" ? "[IT] ITALIANO" : "[IT] ITALIAN" },
  ];

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

        <Select
          sizing="sm"
          aria-label={t.readings.columns.language}
          value={languageFilter}
          options={languageOptions}
          onChange={(event) =>
            onLanguageChange(event.target.value as GlossaryLanguageFilter)
          }
        />
      </div>

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
              aria-label={
                locale === "es" ? "Limpiar búsqueda" : "Clear search"
              }
              onClick={() => onSearchChange("")}
            />
          ) : undefined
        }
      />
    </Card>
  );
}
