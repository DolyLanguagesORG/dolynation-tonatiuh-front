"use client";

import { ChoiceCard, Eyebrow } from "@/components/ui";
import { getDictionary, type Locale } from "@/i18n";
import { type ReadingSize, type ReadingSizeOption } from "@/lib";

export interface SizeSelectorSectionProps {
  title: string;
  locale?: Locale;
  sizes: readonly ReadingSizeOption[];
  selectedSize: ReadingSize;
  onSelect: (size: ReadingSize) => void;
}

/**
 * Sección 04 de parámetros de estudio: selector de longitud del texto.
 */
export function SizeSelectorSection({
  title,
  locale = "es",
  sizes,
  selectedSize,
  onSelect,
}: SizeSelectorSectionProps) {
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
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {sizes.map((sizeOption) => {
          const localizedLabel =
            t.study.sizeOptions[sizeOption.id]?.label ?? sizeOption.label;
          const localizedRange = sizeOption.wordRange.replace(
            /\b(palabras|words|mots|parole)\b/gi,
            t.study.wordsUnit,
          );

          return (
            <ChoiceCard
              key={sizeOption.id}
              selected={selectedSize === sizeOption.id}
              emphasis="filled"
              showSelectionIndicator={false}
              title={localizedLabel}
              meta={sizeOption.readingTime}
              description={localizedRange}
              onClick={() => onSelect(sizeOption.id)}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
