"use client";

import { ChoiceCard, Eyebrow } from "@/components/ui";
import { type Locale } from "@/i18n";
import { type ReadingSize, type ReadingSizeOption } from "@/lib";

export interface SizeSelectorSectionProps {
  title: string;
  locale?: Locale;
  sizes: readonly ReadingSizeOption[];
  selectedSize: ReadingSize;
  onSelect: (size: ReadingSize) => void;
}

const SIZE_LABELS: Record<ReadingSize, { es: string; en: string }> = {
  short: { es: "Corto", en: "Short" },
  medium: { es: "Medio", en: "Medium" },
  long: { es: "Largo", en: "Long" },
};

function formatLocalizedWordRange(wordRange: string, locale: Locale): string {
  if (locale === "es") {
    return wordRange.replace(/\bwords\b/gi, "palabras");
  }
  return wordRange.replace(/\bpalabras\b/gi, "words");
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
            SIZE_LABELS[sizeOption.id]?.[locale] ?? sizeOption.label;
          const localizedRange = formatLocalizedWordRange(
            sizeOption.wordRange,
            locale,
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
