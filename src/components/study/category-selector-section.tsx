"use client";

import { Button, ChoiceChip, Eyebrow, Input, Text } from "@/components/ui";
import { getDictionary, type Locale, resolveBilingualText } from "@/i18n";
import { type CatalogCategory } from "@/lib";

export interface CategorySelectorSectionProps {
  title: string;
  locale: Locale;
  categories: readonly CatalogCategory[];
  selectedCategory: string;
  addCategoryPrompt: string;
  addCategoryPlaceholder: string;
  addCategoryButton: string;
  emptyNotice: string;
  isAddingCustom: boolean;
  isSubmittingCustom?: boolean;
  customCategoryName: string;
  customCategoryError: string | null;
  onStartAddCustom: () => void;
  onCancelAddCustom: () => void;
  onCustomNameChange: (value: string) => void;
  onConfirmAddCustom: () => void | Promise<void>;
  onSelectCategory: (categoryId: string) => void;
}

/**
 * Sección 02 de parámetros de estudio: selector de dominio temático y temáticas propias.
 */
export function CategorySelectorSection({
  title,
  locale,
  categories,
  selectedCategory,
  addCategoryPrompt,
  addCategoryPlaceholder,
  addCategoryButton,
  emptyNotice,
  isAddingCustom,
  isSubmittingCustom = false,
  customCategoryName,
  customCategoryError,
  onStartAddCustom,
  onCancelAddCustom,
  onCustomNameChange,
  onConfirmAddCustom,
  onSelectCategory,
}: CategorySelectorSectionProps) {
  const t = getDictionary(locale);

  return (
    <fieldset className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <legend>
          <Eyebrow tone="muted" as="span">
            {title}
          </Eyebrow>
        </legend>

        {!isAddingCustom && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onStartAddCustom}
            className="h-auto min-h-0 px-0 py-0 text-[11px] font-bold tracking-wider text-muted uppercase underline underline-offset-2 hover:bg-transparent hover:text-ink"
          >
            {addCategoryPrompt}
          </Button>
        )}
      </div>

      {isAddingCustom && (
        <div className="flex flex-col gap-2 rounded-base border border-default-medium bg-neutral-secondary-soft p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                type="text"
                label={addCategoryPrompt}
                placeholder={addCategoryPlaceholder}
                value={customCategoryName}
                disabled={isSubmittingCustom}
                error={customCategoryError ?? undefined}
                onChange={(event) => onCustomNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void onConfirmAddCustom();
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isSubmittingCustom}
                onClick={() => {
                  void onConfirmAddCustom();
                }}
              >
                {addCategoryButton}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmittingCustom}
                onClick={onCancelAddCustom}
              >
                {t.study.cancelButton}
              </Button>
            </div>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <Text variant="small" tone="muted">
          {emptyNotice}
        </Text>
      ) : (
        <div
          role="radiogroup"
          aria-label={title}
          className="flex flex-wrap gap-2"
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const displayName = resolveBilingualText(
              { es: cat.nameEs, en: cat.nameEn, fallback: cat.name },
              locale,
            );

            return (
              <ChoiceChip
                key={cat.id}
                selectionRole="radio"
                selected={isSelected}
                onClick={() => onSelectCategory(cat.id)}
              >
                {displayName}
              </ChoiceChip>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
