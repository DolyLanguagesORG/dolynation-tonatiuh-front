"use client";

import { Button, ChoiceChip, Eyebrow, Input, Text } from "@/components/ui";
import { type Locale } from "@/i18n";
import { type CatalogCategory } from "@/lib";

export interface CategorySelectorSectionProps {
  title: string;
  locale: Locale;
  categories: readonly CatalogCategory[];
  selectedCategory: string;
  customCategoryBadge: string;
  addCategoryPrompt: string;
  addCategoryPlaceholder: string;
  addCategoryButton: string;
  emptyNotice: string;
  isAddingCustom: boolean;
  customCategoryName: string;
  customCategoryError: string | null;
  onStartAddCustom: () => void;
  onCancelAddCustom: () => void;
  onCustomNameChange: (value: string) => void;
  onConfirmAddCustom: () => void;
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
  customCategoryBadge,
  addCategoryPrompt,
  addCategoryPlaceholder,
  addCategoryButton,
  emptyNotice,
  isAddingCustom,
  customCategoryName,
  customCategoryError,
  onStartAddCustom,
  onCancelAddCustom,
  onCustomNameChange,
  onConfirmAddCustom,
  onSelectCategory,
}: CategorySelectorSectionProps) {
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
                error={customCategoryError ?? undefined}
                onChange={(event) => onCustomNameChange(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onConfirmAddCustom}
              >
                {addCategoryButton}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancelAddCustom}
              >
                {locale === "es" ? "Cancelar" : "Cancel"}
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
            const displayName =
              locale === "es"
                ? (cat.nameEs ?? cat.name)
                : (cat.nameEn ?? cat.name);

            return (
              <ChoiceChip
                key={cat.id}
                selectionRole="radio"
                selected={isSelected}
                onClick={() => onSelectCategory(cat.id)}
              >
                <span className="inline-flex items-center gap-2">
                  <span>{displayName}</span>
                  {cat.isCustom && (
                    <span
                      className={`rounded-xxs px-1 font-mono text-[9px] ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-neutral-secondary-medium text-muted"
                      }`}
                    >
                      {customCategoryBadge}
                    </span>
                  )}
                </span>
              </ChoiceChip>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
