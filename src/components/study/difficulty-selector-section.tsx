"use client";

import { ChoiceCard, Eyebrow } from "@/components/ui";
import { type DifficultyOption, type ReadingDifficulty } from "@/lib";

export interface DifficultySelectorSectionProps {
  title: string;
  difficulties: readonly DifficultyOption[];
  selectedDifficulty: ReadingDifficulty;
  onSelect: (difficulty: ReadingDifficulty) => void;
}

/**
 * Sección 03 de parámetros de estudio: selector de nivel de complejidad lingüística.
 */
export function DifficultySelectorSection({
  title,
  difficulties,
  selectedDifficulty,
  onSelect,
}: DifficultySelectorSectionProps) {
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
        {difficulties.map((level) => (
          <ChoiceCard
            key={level.id}
            selected={selectedDifficulty === level.id}
            emphasis="filled"
            showSelectionIndicator={false}
            title={level.title}
            meta={level.cefr}
            description={level.description}
            onClick={() => onSelect(level.id)}
            className="sm:p-5"
          />
        ))}
      </div>
    </fieldset>
  );
}
