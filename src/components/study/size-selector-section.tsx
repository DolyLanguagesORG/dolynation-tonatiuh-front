"use client";

import { ChoiceCard, Eyebrow } from "@/components/ui";
import { type ReadingSize, type ReadingSizeOption } from "@/lib";

export interface SizeSelectorSectionProps {
  title: string;
  sizes: readonly ReadingSizeOption[];
  selectedSize: ReadingSize;
  onSelect: (size: ReadingSize) => void;
}

/**
 * Sección 04 de parámetros de estudio: selector de longitud del texto.
 */
export function SizeSelectorSection({
  title,
  sizes,
  selectedSize,
  onSelect,
}: SizeSelectorSectionProps) {
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
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {sizes.map((sizeOption) => (
          <ChoiceCard
            key={sizeOption.id}
            selected={selectedSize === sizeOption.id}
            emphasis="filled"
            showSelectionIndicator={false}
            title={sizeOption.label}
            meta={sizeOption.readingTime}
            description={sizeOption.wordRange}
            onClick={() => onSelect(sizeOption.id)}
          />
        ))}
      </div>
    </fieldset>
  );
}
