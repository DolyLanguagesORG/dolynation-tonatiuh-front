"use client";

import { ChoiceCard, Eyebrow } from "@/components/ui";
import { getDictionary, type Locale, resolveBilingualText } from "@/i18n";
import { type DifficultyOption, type ReadingDifficulty } from "@/lib";

export interface DifficultySelectorSectionProps {
  title: string;
  locale?: Locale;
  difficulties: readonly DifficultyOption[];
  selectedDifficulty: ReadingDifficulty;
  onSelect: (difficulty: ReadingDifficulty) => void;
}

/**
 * Sección 03 de parámetros de estudio: selector de nivel de complejidad lingüística.
 */
export function DifficultySelectorSection({
  title,
  locale = "es",
  difficulties,
  selectedDifficulty,
  onSelect,
}: DifficultySelectorSectionProps) {
  const t = getDictionary(locale);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend>
        <Eyebrow tone="muted" as="span">
          {title}
        </Eyebrow>
      </legend>

      <div
        role="radiogroup"
        aria-label={title}
        className="grid grid-cols-1 gap-3.5 md:grid-cols-3"
      >
        {difficulties.map((level) => {
          const localizedCopy = t.study.difficulties[level.id];
          const localizedTitle =
            localizedCopy?.label ??
            resolveBilingualText(
              { es: level.titleEs, en: level.titleEn, fallback: level.title },
              locale,
            );
          const localizedDescription =
            localizedCopy?.description ??
            resolveBilingualText(
              {
                es: level.descriptionEs,
                en: level.descriptionEn,
                fallback: level.description,
              },
              locale,
            );

          return (
            <ChoiceCard
              key={level.id}
              selected={selectedDifficulty === level.id}
              emphasis="filled"
              showSelectionIndicator={false}
              title={localizedTitle}
              description={localizedDescription}
              onClick={() => onSelect(level.id)}
              className="sm:p-5"
            />
          );
        })}
      </div>
    </fieldset>
  );
}
