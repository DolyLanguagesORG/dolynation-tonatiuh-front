"use client";

import {
  type ReadingDifficultyFilter,
  type ReadingLanguageFilter,
  type ReadingStatusFilter,
} from "@/app/readings/_hooks/use-readings-history";
import {
  Card,
  ChoiceChip,
  IconButton,
  Input,
  Select,
} from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";
import { formatReadingLanguageBadge, getDifficultyMeta } from "@/lib";

export interface ReadingsFiltersBarProps {
  t: Dictionary;
  locale: Locale;
  counts: {
    all: number;
    pending: number;
    completed: number;
  };
  statusFilter: ReadingStatusFilter;
  languageFilter: ReadingLanguageFilter;
  difficultyFilter: ReadingDifficultyFilter;
  searchQuery: string;
  onStatusChange: (status: ReadingStatusFilter) => void;
  onLanguageChange: (language: ReadingLanguageFilter) => void;
  onDifficultyChange: (difficulty: ReadingDifficultyFilter) => void;
  onSearchChange: (value: string) => void;
}

/**
 * Barra modular de filtros para el historial de lecturas (`TODAS / PENDIENTES / COMPLETADAS`,
 * selector de idioma, selector de dificultad y búsqueda).
 */
export function ReadingsFiltersBar({
  t,
  locale,
  counts,
  statusFilter,
  languageFilter,
  difficultyFilter,
  searchQuery,
  onStatusChange,
  onLanguageChange,
  onDifficultyChange,
  onSearchChange,
}: ReadingsFiltersBarProps) {
  const statusOptions: {
    key: ReadingStatusFilter;
    label: string;
    count: number;
  }[] = [
    { key: "all", label: t.readings.statusAll, count: counts.all },
    { key: "pending", label: t.readings.statusPending, count: counts.pending },
    {
      key: "completed",
      label: t.readings.statusCompleted,
      count: counts.completed,
    },
  ];

  const languageOptions = [
    { value: "all", label: t.readings.allLanguagesFilter },
    { value: "en", label: formatReadingLanguageBadge("en", locale) },
    { value: "es", label: formatReadingLanguageBadge("es", locale) },
    { value: "fr", label: formatReadingLanguageBadge("fr", locale) },
    { value: "it", label: formatReadingLanguageBadge("it", locale) },
  ];

  const difficultyOptions = [
    { value: "all", label: t.readings.allDifficultiesFilter },
    { value: "easy", label: getDifficultyMeta("easy", locale).label },
    { value: "medium", label: getDifficultyMeta("medium", locale).label },
    { value: "hard", label: getDifficultyMeta("hard", locale).label },
  ];

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="radiogroup"
          aria-label={t.readings.historyTitle}
          className="flex flex-wrap items-center gap-2"
        >
          {statusOptions.map((option) => (
            <ChoiceChip
              key={option.key}
              size="sm"
              selectionRole="radio"
              selected={statusFilter === option.key}
              onClick={() => onStatusChange(option.key)}
            >
              {option.label} ({option.count})
            </ChoiceChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            sizing="sm"
            aria-label={t.readings.columns.language}
            value={languageFilter}
            options={languageOptions}
            onChange={(event) =>
              onLanguageChange(event.target.value as ReadingLanguageFilter)
            }
          />
          <Select
            sizing="sm"
            aria-label={t.readings.columns.difficulty}
            value={difficultyFilter}
            options={difficultyOptions}
            onChange={(event) =>
              onDifficultyChange(event.target.value as ReadingDifficultyFilter)
            }
          />
        </div>
      </div>

      <Input
        type="search"
        label={t.home.searchReadingsLabel}
        placeholder={t.readings.searchPlaceholder}
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        rightElement={
          searchQuery ? (
            <IconButton
              icon="close"
              size="xs"
              variant="ghost"
              aria-label={t.readings.clearSearchAria}
              onClick={() => onSearchChange("")}
            />
          ) : undefined
        }
      />
    </Card>
  );
}
