"use client";

import { useState } from "react";

import {
  ActionLink,
  Badge,
  Button,
  Card,
  ChoiceChip,
  Eyebrow,
  Heading,
  Icon,
  Input,
  Text,
} from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";
import {
  DEFAULT_LANGUAGES,
  type LanguagesSettings,
  MIN_USER_CATEGORIES,
  type TargetLanguageCode,
} from "@/lib";

export interface ActiveLanguageItem {
  code: TargetLanguageCode;
  name: string;
  isPrimary: boolean;
}

export interface LearningPreferencesCardProps {
  t: Dictionary;
  locale: Locale;
  activeLanguages: readonly ActiveLanguageItem[];
  languagesSettings: LanguagesSettings | null;
  categories: readonly { id: string; name: string }[];
  selectedCategoryIds: readonly string[];
  isSaving: boolean;
  isUnlockingLanguage: boolean;
  onPromoteLanguage: (code: TargetLanguageCode) => void;
  onUpdateLanguages: (languages: TargetLanguageCode[]) => Promise<boolean>;
  onUnlockLanguageChange: () => Promise<boolean>;
  onToggleCategory: (categoryId: string) => void;
  onAddCustomCategory?: (name: string) => Promise<boolean>;
}

/**
 * Panel de preferencias activas, gestión/desbloqueo de idiomas e intereses temáticos en `/profile`.
 */
export function LearningPreferencesCard({
  t,
  locale,
  activeLanguages,
  languagesSettings,
  categories,
  selectedCategoryIds,
  isSaving,
  isUnlockingLanguage,
  onPromoteLanguage,
  onUpdateLanguages,
  onUnlockLanguageChange,
  onToggleCategory,
  onAddCustomCategory,
}: LearningPreferencesCardProps) {
  const [customName, setCustomName] = useState("");
  const [draftLanguages, setDraftLanguages] = useState<
    TargetLanguageCode[] | null
  >(null);
  const [confirmingUnlock, setConfirmingUnlock] = useState(false);

  const isMissingMinCategories =
    selectedCategoryIds.length < MIN_USER_CATEGORIES;

  const savedSelection: TargetLanguageCode[] =
    languagesSettings?.selected && languagesSettings.selected.length > 0
      ? languagesSettings.selected
      : activeLanguages.map((item) => item.code);

  const effectiveSelection = draftLanguages ?? savedSelection;
  const maxLanguages = languagesSettings?.maxLanguages ?? 1;
  const remainingOpenSlots = Math.max(0, maxLanguages - savedSelection.length);
  const hasOpenLanguageSlot = maxLanguages > 1 && remainingOpenSlots > 0;
  const canChangeFree = languagesSettings?.canChangeFree ?? true;
  const credits = languagesSettings?.languageChangeCredits ?? 0;
  const nextFreeChangeLabel = languagesSettings?.nextFreeChangeAt
    ? new Date(languagesSettings.nextFreeChangeAt).toLocaleDateString(
        locale === "es" ? "es-MX" : "en-US",
        { day: "numeric", month: "short", year: "numeric" },
      )
    : null;

  const isLanguagesDirty =
    draftLanguages !== null &&
    (draftLanguages.length !== savedSelection.length ||
      draftLanguages.some((code, index) => savedSelection[index] !== code));

  const languageCatalog =
    languagesSettings?.catalog && languagesSettings.catalog.length > 0
      ? languagesSettings.catalog.map((item) => {
          const meta = DEFAULT_LANGUAGES.find((lang) => lang.id === item.id);
          return {
            id: item.id,
            name: meta
              ? locale === "es"
                ? meta.nameEs
                : meta.nameEn
              : item.name,
          };
        })
      : DEFAULT_LANGUAGES.map((lang) => ({
          id: lang.id,
          name: locale === "es" ? lang.nameEs : lang.nameEn,
        }));

  const handleToggleLanguage = (code: TargetLanguageCode): void => {
    const base = draftLanguages ?? [...savedSelection];
    if (maxLanguages === 1) {
      setDraftLanguages([code]);
      return;
    }

    if (base.includes(code)) {
      setDraftLanguages(base.filter((item) => item !== code));
      return;
    }

    if (base.length >= maxLanguages) {
      return;
    }

    setDraftLanguages([...base, code]);
  };

  const handleSaveLanguages = async (): Promise<void> => {
    if (!draftLanguages || draftLanguages.length === 0) return;
    const ok = await onUpdateLanguages(draftLanguages);
    if (ok) {
      setDraftLanguages(null);
    }
  };

  const handleConfirmUnlock = async (): Promise<void> => {
    const ok = await onUnlockLanguageChange();
    if (ok) {
      setConfirmingUnlock(false);
    }
  };

  const handleAddCustom = async (): Promise<void> => {
    if (!onAddCustomCategory || !customName.trim()) return;
    const ok = await onAddCustomCategory(customName);
    if (ok) {
      setCustomName("");
    }
  };

  return (
    <Card padding="lg" as="section" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="sliders" size="md" className="text-heading" />
          <Heading as="h2" variant="subsection">
            {t.profile.preferencesTitle}
          </Heading>
        </div>

        {isMissingMinCategories || activeLanguages.length === 0 ? (
          <ActionLink
            href="/setup-preferences"
            variant="ghost"
            size="xs"
            leftIcon={<Icon name="sliders" size="xs" />}
          >
            {t.home.preferencesSetupCta}
          </ActionLink>
        ) : (
          <ActionLink
            href="/generate"
            variant="ghost"
            size="xs"
            leftIcon={<Icon name="pencil" size="xs" />}
          >
            {t.nav.createAiText}
          </ActionLink>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow tone="muted" className="text-[10px]">
              {t.profile.activeLanguagesTitle}
            </Eyebrow>
            <Badge variant="outline">
              {activeLanguages.length}/{maxLanguages}{" "}
              {locale === "es" ? "CUPOS ACTIVOS" : "ACTIVE SLOTS"}
            </Badge>
          </div>

          {activeLanguages.length === 0 ? (
            <div className="flex flex-col gap-2 rounded-base border border-default bg-neutral-primary-soft p-4">
              <Text variant="small" tone="muted">
                {t.study.generationBlockedLanguages}
              </Text>
              <div>
                <ActionLink
                  href="/setup-preferences"
                  variant="secondary"
                  size="xs"
                >
                  {t.study.goToPreferencesButton}
                </ActionLink>
              </div>
            </div>
          ) : (
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
                        {lang.isPrimary
                          ? locale === "es"
                            ? "PRIMARIO • ACTIVO"
                            : "PRIMARY • ACTIVE"
                          : locale === "es"
                            ? "SECUNDARIO • ACTIVO"
                            : "SECONDARY • ACTIVE"}
                      </span>
                    </div>
                  </div>

                  {lang.isPrimary ? (
                    <Badge variant="primary">
                      {locale === "es" ? "ACTIVO" : "ACTIVE"}
                    </Badge>
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
          )}

          {languagesSettings && (
            <div className="flex flex-col gap-3 rounded-base border border-default bg-neutral-primary-soft p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Icon
                    name={
                      canChangeFree || credits > 0 || hasOpenLanguageSlot
                        ? "unlock"
                        : "lock"
                    }
                    size="xs"
                    className="text-heading"
                  />
                  <span className="font-mono text-[11px] font-bold tracking-wider text-heading uppercase">
                    {locale === "es"
                      ? "Configurar idiomas objetivo"
                      : "Configure target languages"}
                  </span>
                </div>

                {canChangeFree ? (
                  <Badge variant="secondary">
                    {locale === "es" ? "CAMBIO LIBRE" : "FREE CHANGE"}
                  </Badge>
                ) : credits > 0 ? (
                  <Badge variant="primary">
                    {credits}{" "}
                    {locale === "es"
                      ? credits === 1
                        ? "CRÉDITO DISPONIBLE"
                        : "CRÉDITOS DISPONIBLES"
                      : credits === 1
                        ? "CREDIT READY"
                        : "CREDITS READY"}
                  </Badge>
                ) : hasOpenLanguageSlot ? (
                  <Badge variant="secondary">
                    {remainingOpenSlots}{" "}
                    {locale === "es"
                      ? remainingOpenSlots === 1
                        ? "CUPO LIBRE"
                        : "CUPOS LIBRES"
                      : remainingOpenSlots === 1
                        ? "OPEN SLOT"
                        : "OPEN SLOTS"}
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    {locale === "es" ? "BLOQUEADO ANUAL" : "ANNUAL LOCK"}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {languageCatalog.map((lang) => {
                  const isSelected = effectiveSelection.includes(lang.id);
                  const reachedCap =
                    maxLanguages > 1 &&
                    !isSelected &&
                    effectiveSelection.length >= maxLanguages;

                  return (
                    <ChoiceChip
                      key={lang.id}
                      selected={isSelected}
                      indicator={maxLanguages === 1 ? "check" : "plus-check"}
                      size="sm"
                      disabled={isSaving || reachedCap}
                      onClick={() => handleToggleLanguage(lang.id)}
                    >
                      {lang.name}
                    </ChoiceChip>
                  );
                })}
              </div>

              {isLanguagesDirty && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="xs"
                    disabled={isSaving || effectiveSelection.length === 0}
                    isLoading={isSaving}
                    onClick={() => {
                      void handleSaveLanguages();
                    }}
                  >
                    {locale === "es" ? "Guardar idiomas" : "Save languages"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={isSaving}
                    onClick={() => setDraftLanguages(null)}
                  >
                    {locale === "es" ? "Restablecer" : "Reset"}
                  </Button>
                </div>
              )}

              {!canChangeFree && credits === 0 && (
                <div className="flex flex-col gap-2.5 border-t border-default pt-2.5">
                  <Text variant="caption" tone="muted">
                    {hasOpenLanguageSlot
                      ? locale === "es"
                        ? `Puedes agregar ${remainingOpenSlots} idioma${remainingOpenSlots === 1 ? "" : "s"} adicional${remainingOpenSlots === 1 ? "" : "es"} gratis sin esperar ni usar créditos. Reemplazar un idioma ya guardado requiere esperar al ${nextFreeChangeLabel ?? "próximo ciclo anual"} o usar +1 crédito.`
                        : `You can add ${remainingOpenSlots} more language${remainingOpenSlots === 1 ? "" : "s"} for free without cooldown or credits. Replacing an already-saved language waits until ${nextFreeChangeLabel ?? "the next annual cycle"} or uses +1 credit.`
                      : nextFreeChangeLabel
                        ? locale === "es"
                          ? `Próximo cambio gratuito el ${nextFreeChangeLabel}. Puedes desbloquear un cambio anticipado acreditando +1 uso.`
                          : `Next free change available on ${nextFreeChangeLabel}. You can unlock an immediate change (+1 credit).`
                        : locale === "es"
                          ? "Tu selección actual tiene bloqueo anual activo."
                          : "Your current language selection is under the annual cooldown."}
                  </Text>

                  <div className="flex flex-wrap items-center gap-2">
                    {!confirmingUnlock ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        disabled={isUnlockingLanguage}
                        leftIcon={<Icon name="unlock" size="xs" />}
                        onClick={() => setConfirmingUnlock(true)}
                      >
                        {locale === "es"
                          ? "Desbloquear cambio de idioma"
                          : "Unlock language change"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="primary"
                          size="xs"
                          isLoading={isUnlockingLanguage}
                          leftIcon={<Icon name="check" size="xs" />}
                          onClick={() => {
                            void handleConfirmUnlock();
                          }}
                        >
                          {locale === "es"
                            ? "Confirmar (+1 crédito)"
                            : "Confirm (+1 credit)"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          disabled={isUnlockingLanguage}
                          onClick={() => setConfirmingUnlock(false)}
                        >
                          {locale === "es" ? "Cancelar" : "Cancel"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow tone="muted" className="text-[10px]">
              {t.profile.favoriteCategoriesTitle}
            </Eyebrow>
            <div className="flex items-center gap-2">
              {isMissingMinCategories && (
                <Badge variant="warning">
                  mín. {selectedCategoryIds.length}/{MIN_USER_CATEGORIES}
                </Badge>
              )}
              <Text variant="caption" tone="muted" className="font-mono">
                {selectedCategoryIds.length} {t.profile.selectedCountSuffix}
              </Text>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <ChoiceChip
                key={cat.id}
                selected={selectedCategoryIds.some(
                  (id) => id.toLowerCase() === cat.id.toLowerCase(),
                )}
                indicator="plus-check"
                size="sm"
                disabled={isSaving}
                onClick={() => onToggleCategory(cat.id)}
              >
                {cat.name}
              </ChoiceChip>
            ))}
          </div>

          {onAddCustomCategory && (
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  type="text"
                  label={t.profile.addCustomCategoryPrompt}
                  placeholder={t.profile.addCustomCategoryPlaceholder}
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isSaving}
                onClick={() => {
                  void handleAddCustom();
                }}
              >
                {t.profile.addCustomCategoryButton}
              </Button>
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-default pt-3">
            <Text variant="caption" tone="muted">
              {isMissingMinCategories
                ? t.profile.minCategoriesNotice
                : t.profile.reorderHint}
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
