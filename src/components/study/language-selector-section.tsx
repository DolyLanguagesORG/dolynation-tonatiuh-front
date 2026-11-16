"use client";

import { ChoiceChip, Eyebrow } from "@/components/ui";
import { getDictionary, type Locale } from "@/i18n";
import { DEFAULT_LANGUAGES, type TargetLanguageCode } from "@/lib";

export interface LanguageSelectorSectionProps {
  title: string;
  locale: Locale;
  selectedLanguage: TargetLanguageCode;
  activePlanLanguages: readonly TargetLanguageCode[] | null;
  onSelect: (language: TargetLanguageCode) => void;
}

/**
 * Sección 01 de parámetros de estudio: selector del idioma meta restringido por plan.
 */
export function LanguageSelectorSection({
  title,
  locale,
  selectedLanguage,
  activePlanLanguages,
  onSelect,
}: LanguageSelectorSectionProps) {
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
        className="flex flex-wrap gap-2 sm:gap-2.5"
      >
        {DEFAULT_LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang.id;
          const isAllowed =
            !activePlanLanguages || activePlanLanguages.includes(lang.id);
          const label = t.languages[lang.id];

          return (
            <ChoiceChip
              key={lang.id}
              selectionRole="radio"
              selected={isSelected}
              disabled={!isAllowed}
              codePrefix={`[${lang.id.toUpperCase()}]`}
              title={!isAllowed ? t.study.languageNotActiveInPlan : undefined}
              onClick={() => {
                if (isAllowed) {
                  onSelect(lang.id);
                }
              }}
            >
              {label}
            </ChoiceChip>
          );
        })}
      </div>

      {activePlanLanguages && (
        <p className="text-[11px] text-muted">
          {t.study.enabledLanguagesPrefix}{" "}
          <span className="font-mono font-semibold text-ink uppercase">
            {activePlanLanguages.join(", ")}
          </span>
        </p>
      )}
    </fieldset>
  );
}
