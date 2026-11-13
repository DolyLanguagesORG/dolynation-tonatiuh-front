"use client";

import {
  ActionLink,
  Badge,
  Button,
  Card,
  ChoiceChip,
  Eyebrow,
  Heading,
  Icon,
  Text,
} from "@/components/ui";
import { type Dictionary } from "@/i18n";
import { type TargetLanguageCode } from "@/lib";

export interface ActiveLanguageItem {
  code: TargetLanguageCode;
  name: string;
  isPrimary: boolean;
}

export interface LearningPreferencesCardProps {
  t: Dictionary;
  activeLanguages: readonly ActiveLanguageItem[];
  categories: readonly { id: string; name: string }[];
  selectedCategoryIds: readonly string[];
  isSaving: boolean;
  onPromoteLanguage: (code: TargetLanguageCode) => void;
  onToggleCategory: (categoryId: string) => void;
}

/**
 * Panel de preferencias activas e intereses temáticos en Perfil (`04-perfil-y-progreso.png`).
 */
export function LearningPreferencesCard({
  t,
  activeLanguages,
  categories,
  selectedCategoryIds,
  isSaving,
  onPromoteLanguage,
  onToggleCategory,
}: LearningPreferencesCardProps) {
  return (
    <Card padding="lg" as="section" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="sliders" size="md" className="text-heading" />
          <Heading as="h2" variant="subsection">
            {t.profile.preferencesTitle}
          </Heading>
        </div>

        <ActionLink
          href="/generate"
          variant="ghost"
          size="xs"
          leftIcon={<Icon name="pencil" size="xs" />}
        >
          {t.nav.createAiText}
        </ActionLink>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-3 lg:col-span-6">
          <Eyebrow tone="muted" className="text-[10px]">
            {t.profile.activeLanguagesTitle}
          </Eyebrow>

          <div className="flex flex-col gap-2.5">
            {activeLanguages.map((lang) => (
              <div
                key={lang.code}
                className="flex items-center justify-between gap-3 rounded-base border border-default bg-neutral-primary-soft p-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xxs font-mono text-xs font-bold uppercase",
                      lang.isPrimary
                        ? "bg-brand text-white"
                        : "border border-default-medium bg-neutral-secondary-medium text-heading",
                    ].join(" ")}
                  >
                    {lang.code.toUpperCase()}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-heading">
                      {lang.name}
                    </span>
                    <span className="font-mono text-[10px] text-muted uppercase">
                      {lang.isPrimary ? "PRIMARIO • ACTIVO" : "SECUNDARIO • ACTIVO"}
                    </span>
                  </div>
                </div>

                {lang.isPrimary ? (
                  <Badge variant="primary">ACTIVO</Badge>
                ) : (
                  <Button
                    variant="secondary"
                    size="xs"
                    disabled={isSaving}
                    leftIcon={<Icon name="arrow-up-down" size="xs" />}
                    onClick={() => onPromoteLanguage(lang.code)}
                  >
                    {t.profile.movePriorityButton}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:col-span-6">
          <div className="flex items-center justify-between gap-2">
            <Eyebrow tone="muted" className="text-[10px]">
              {t.profile.favoriteCategoriesTitle}
            </Eyebrow>
            <Text variant="caption" tone="muted" className="font-mono">
              {selectedCategoryIds.length} {t.profile.selectedCountSuffix}
            </Text>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <ChoiceChip
                key={cat.id}
                selected={selectedCategoryIds.includes(cat.id)}
                indicator="plus-check"
                size="sm"
                disabled={isSaving}
                onClick={() => onToggleCategory(cat.id)}
              >
                {cat.name}
              </ChoiceChip>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-default pt-3">
            <Text variant="caption" tone="muted">
              {t.profile.reorderHint}
            </Text>
            {isSaving && (
              <Text variant="caption" tone="muted" className="font-mono">
                {t.profile.savingPreferences}
              </Text>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
