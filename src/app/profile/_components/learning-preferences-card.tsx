"use client";

import { useEffect, useId, useState } from "react";

import {
  ActionLink,
  Alert,
  Badge,
  Button,
  Card,
  ChoiceChip,
  Eyebrow,
  Heading,
  Icon,
  IconButton,
  Input,
  Text,
  Textarea,
} from "@/components/ui";
import { type Dictionary, formatMessage, type Locale } from "@/i18n";
import {
  type AccessRequestItem,
  DEFAULT_LANGUAGES,
  getDateLocale,
  type LanguagesSettings,
  MAX_CATEGORY_LENGTH,
  MIN_USER_CATEGORIES,
  type SubscriptionTier,
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
  activeTier?: SubscriptionTier | null;
  languageUnlockPriceLabel?: string | null;
  activeLanguages: readonly ActiveLanguageItem[];
  languagesSettings: LanguagesSettings | null;
  categories: readonly { id: string; name: string }[];
  selectedCategoryIds: readonly string[];
  isSaving: boolean;
  isUnlockingLanguage: boolean;
  accessRequestsEnabled?: boolean;
  pendingLanguageUnlockRequest?: AccessRequestItem | null;
  latestRejectedLanguageUnlockRequest?: AccessRequestItem | null;
  isCancellingRequest?: boolean;
  onPromoteLanguage: (code: TargetLanguageCode) => void;
  onUpdateLanguages: (languages: TargetLanguageCode[]) => Promise<boolean>;
  onUnlockLanguageChange: (message?: string) => Promise<boolean>;
  onCancelAccessRequest?: (requestId: number) => Promise<boolean>;
  onRefreshAccessRequests?: () => Promise<void>;
  onToggleCategory: (categoryId: string) => void;
  onAddCustomCategory?: (name: string) => Promise<boolean>;
  onDeleteCategory?: (categoryId: string) => Promise<boolean> | void;
  customCategoryError?: string | null;
  onClearCustomCategoryError?: () => void;
}

/**
 * Determina si una nueva selección de idiomas reemplazaría o quitaría un idioma
 * activo previo, o promovería un idioma inactivo tras un downgrade, lo cual requiere
 * cambio gratuito disponible (`canChangeFree`) o consumir 1 crédito (`languageChangeCredits`).
 */
export function doesLanguageChangeRequireCreditOrLock(params: {
  tier: SubscriptionTier | null | undefined;
  canChangeFree: boolean;
  savedSelection: readonly TargetLanguageCode[];
  activeCodes: readonly TargetLanguageCode[];
  nextSelection: readonly TargetLanguageCode[];
  maxLanguages: number;
}): boolean {
  if (params.tier === "dolly_pro" || params.canChangeFree) {
    return false;
  }

  if (params.savedSelection.length === 0) {
    return false;
  }

  const nextActive = params.nextSelection.slice(0, params.maxLanguages);

  // Si cualquier idioma activo actual deja de estar en el bloque activo, o si algún
  // idioma guardado previo fue eliminado, el cambio reemplaza/promueve y requiere crédito.
  const droppedActive = params.activeCodes.some(
    (code) => !nextActive.includes(code),
  );
  if (droppedActive) {
    return true;
  }

  const droppedSaved = params.savedSelection.some(
    (code) => !params.nextSelection.includes(code),
  );
  if (droppedSaved) {
    return true;
  }

  return false;
}

/**
 * Panel de preferencias activas, gestión/desbloqueo de idiomas e intereses temáticos en `/profile`.
 */
export function LearningPreferencesCard({
  t,
  locale,
  activeTier = null,
  languageUnlockPriceLabel = null,
  activeLanguages,
  languagesSettings,
  categories,
  selectedCategoryIds,
  isSaving,
  isUnlockingLanguage,
  accessRequestsEnabled = false,
  pendingLanguageUnlockRequest = null,
  latestRejectedLanguageUnlockRequest = null,
  isCancellingRequest = false,
  onPromoteLanguage,
  onUpdateLanguages,
  onUnlockLanguageChange,
  onCancelAccessRequest,
  onRefreshAccessRequests,
  onToggleCategory,
  onAddCustomCategory,
  onDeleteCategory,
  customCategoryError = null,
  onClearCustomCategoryError,
}: LearningPreferencesCardProps) {
  const [customName, setCustomName] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [draftLanguages, setDraftLanguages] = useState<
    TargetLanguageCode[] | null
  >(null);
  const [confirmingUnlock, setConfirmingUnlock] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState("");
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);

  const lockedTitleId = useId();
  const consumeTitleId = useId();

  const isMissingMinCategories =
    selectedCategoryIds.length < MIN_USER_CATEGORIES;

  const isProTier =
    activeTier === "dolly_pro" || (languagesSettings?.maxLanguages ?? 0) >= 4;

  const savedSelection: TargetLanguageCode[] =
    languagesSettings?.selected && languagesSettings.selected.length > 0
      ? languagesSettings.selected
      : activeLanguages.map((item) => item.code);

  const activeCodes: TargetLanguageCode[] =
    languagesSettings?.active && languagesSettings.active.length > 0
      ? languagesSettings.active
      : activeLanguages.map((item) => item.code);

  const effectiveSelection = draftLanguages ?? savedSelection;
  const maxLanguages = languagesSettings?.maxLanguages ?? 1;
  const remainingOpenSlots = Math.max(0, maxLanguages - savedSelection.length);
  const hasOpenLanguageSlot = maxLanguages > 1 && remainingOpenSlots > 0;
  const canChangeFree = isProTier || (languagesSettings?.canChangeFree ?? true);
  const credits = isProTier ? 0 : (languagesSettings?.languageChangeCredits ?? 0);

  const nextFreeChangeDate = languagesSettings?.nextFreeChangeAt
    ? new Date(languagesSettings.nextFreeChangeAt)
    : null;
  const lastLanguageChangeDate = languagesSettings?.lastLanguageChangeAt
    ? new Date(languagesSettings.lastLanguageChangeAt)
    : null;
  const nextFreeChangeLabel = nextFreeChangeDate
    ? nextFreeChangeDate.toLocaleDateString(getDateLocale(locale), {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  const daysRemaining = nextFreeChangeDate
    ? Math.max(
        1,
        lastLanguageChangeDate
          ? Math.ceil(
              (nextFreeChangeDate.getTime() - lastLanguageChangeDate.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 365,
      )
    : null;

  const isLanguagesDirty =
    draftLanguages !== null &&
    (draftLanguages.length !== savedSelection.length ||
      draftLanguages.some((code, index) => savedSelection[index] !== code));

  const languageCatalog =
    languagesSettings?.catalog && languagesSettings.catalog.length > 0
      ? languagesSettings.catalog.map((item) => ({
          id: item.id,
          name: t.languages[item.id] ?? item.name,
        }))
      : DEFAULT_LANGUAGES.map((lang) => ({
          id: lang.id,
          name: t.languages[lang.id],
        }));

  useEffect(() => {
    if (!showLockedModal && !showConsumeModal) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && !isSaving && !isUnlockingLanguage) {
        setShowLockedModal(false);
        setShowConsumeModal(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, isUnlockingLanguage, showConsumeModal, showLockedModal]);

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

  const executeLanguageSave = async (): Promise<void> => {
    if (!draftLanguages || draftLanguages.length === 0) return;
    const ok = await onUpdateLanguages(draftLanguages);
    if (ok) {
      setDraftLanguages(null);
      setShowConsumeModal(false);
      setShowLockedModal(false);
    }
  };

  const handleSaveLanguagesClick = async (): Promise<void> => {
    if (!draftLanguages || draftLanguages.length === 0) return;

    const requiresCreditOrLock = doesLanguageChangeRequireCreditOrLock({
      tier: activeTier,
      canChangeFree,
      savedSelection,
      activeCodes,
      nextSelection: draftLanguages,
      maxLanguages,
    });

    if (requiresCreditOrLock) {
      if (credits === 0) {
        setShowLockedModal(true);
        return;
      }
      setShowConsumeModal(true);
      return;
    }

    await executeLanguageSave();
  };

  const handleConfirmUnlock = async (): Promise<void> => {
    const ok = await onUnlockLanguageChange(
      accessRequestsEnabled ? unlockMessage : undefined,
    );
    if (ok) {
      setConfirmingUnlock(false);
      setShowLockedModal(false);
      setUnlockMessage("");
    }
  };

  const handleAddCustom = async (): Promise<void> => {
    if (!onAddCustomCategory || isAddingCustom || isSaving) return;
    setIsAddingCustom(true);
    try {
      const ok = await onAddCustomCategory(customName);
      if (ok) {
        setCustomName("");
      }
    } finally {
      setIsAddingCustom(false);
    }
  };

  const lm = t.billing.languageModals;
  const buyCreditButtonText = languageUnlockPriceLabel
    ? formatMessage(lm.buyCreditButton, { price: languageUnlockPriceLabel })
    : lm.buyCreditButtonFallback;

  return (
    <Card
      id="preferences"
      padding="lg"
      as="section"
      className="flex flex-col gap-6"
    >
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
              {t.profile.activeSlotsLabel}
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
                          ? t.profile.primaryActiveLabel
                          : t.profile.secondaryActiveLabel}
                      </span>
                    </div>
                  </div>

                  {lang.isPrimary ? (
                    <Badge variant="primary">{t.profile.activeBadge}</Badge>
                  ) : (
                    <Button
                      variant="secondary"
                      size="xs"
                      disabled={isSaving}
                      leftIcon={<Icon name="arrow-up-down" size="xs" />}
                      onClick={() => {
                        void onPromoteLanguage(lang.code);
                      }}
                    >
                      {t.profile.movePriorityButton}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {languagesSettings && !isProTier && (
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
                    {t.profile.configureTargetLanguagesTitle}
                  </span>
                </div>

                {canChangeFree ? (
                  <Badge variant="secondary">
                    {t.profile.freeChangeBadge}
                  </Badge>
                ) : credits > 0 ? (
                  <Badge variant="primary">
                    {credits}{" "}
                    {credits === 1
                      ? t.profile.creditReadySingular
                      : t.profile.creditsReadyPlural}
                  </Badge>
                ) : hasOpenLanguageSlot ? (
                  <Badge variant="secondary">
                    {remainingOpenSlots}{" "}
                    {remainingOpenSlots === 1
                      ? t.profile.openSlotSingular
                      : t.profile.openSlotsPlural}
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    {t.profile.annualLockBadge}
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
                      void handleSaveLanguagesClick();
                    }}
                  >
                    {t.profile.saveLanguagesButton}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={isSaving}
                    onClick={() => setDraftLanguages(null)}
                  >
                    {t.profile.resetButton}
                  </Button>
                </div>
              )}

              {!canChangeFree && credits === 0 && (
                <div className="flex flex-col gap-2.5 border-t border-default pt-2.5">
                  <Text variant="caption" tone="muted">
                    {hasOpenLanguageSlot
                      ? formatMessage(t.profile.unlockOpenSlotsHint, {
                          slotsText:
                            remainingOpenSlots === 1
                              ? t.profile.openSlotCountSingular
                              : formatMessage(t.profile.openSlotCountPlural, {
                                  count: remainingOpenSlots,
                                }),
                          date:
                            nextFreeChangeLabel ?? t.profile.nextCycleFallback,
                        })
                      : nextFreeChangeLabel
                        ? formatMessage(t.profile.nextFreeChangeHint, {
                            date: nextFreeChangeLabel,
                          })
                        : t.profile.annualLockHint}
                  </Text>

                  {accessRequestsEnabled ? (
                    pendingLanguageUnlockRequest ? (
                      <div className="flex flex-col gap-2.5 rounded-base border border-default bg-surface p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Icon name="clock" size="xs" className="text-heading" />
                            <span className="text-xs font-bold text-heading">
                              {t.profile.pendingLanguageUnlockTitle}
                            </span>
                          </div>
                          <Badge variant="warning">
                            {t.accessRequests.status.pending}
                          </Badge>
                        </div>

                        <Text variant="caption" tone="muted">
                          {t.profile.pendingLanguageUnlockDesc}
                        </Text>

                        {pendingLanguageUnlockRequest.userMessage && (
                          <Text variant="caption" className="italic text-body">
                            “{pendingLanguageUnlockRequest.userMessage}”
                          </Text>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          {onRefreshAccessRequests && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="xs"
                              isLoading={isRefreshingStatus}
                              leftIcon={<Icon name="refresh" size="xs" />}
                              onClick={() => {
                                if (isRefreshingStatus) return;
                                setIsRefreshingStatus(true);
                                void onRefreshAccessRequests().finally(() => {
                                  setIsRefreshingStatus(false);
                                });
                              }}
                            >
                              {t.auth.stepper.step3Plan.refreshStatusButton}
                            </Button>
                          )}
                          {onCancelAccessRequest && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              isLoading={isCancellingRequest}
                              onClick={() => {
                                void onCancelAccessRequest(
                                  pendingLanguageUnlockRequest.id,
                                );
                              }}
                            >
                              {t.auth.stepper.step3Plan.cancelRequestButton}
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {latestRejectedLanguageUnlockRequest?.rejectionReason && (
                          <Alert variant="warning">
                            {formatMessage(
                              t.profile.rejectedLanguageUnlockNotice,
                              {
                                reason:
                                  latestRejectedLanguageUnlockRequest.rejectionReason,
                              },
                            )}
                          </Alert>
                        )}

                        {!confirmingUnlock ? (
                          <div>
                            <Button
                              type="button"
                              variant="secondary"
                              size="xs"
                              disabled={isUnlockingLanguage}
                              leftIcon={<Icon name="unlock" size="xs" />}
                              onClick={() => setConfirmingUnlock(true)}
                            >
                              {t.profile.requestLanguageUnlockButton}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2.5 rounded-base border border-default bg-surface p-3">
                            <Textarea
                              label={t.profile.languageUnlockMessageLabel}
                              placeholder={
                                t.profile.languageUnlockMessagePlaceholder
                              }
                              maxLength={1000}
                              rows={2}
                              value={unlockMessage}
                              onChange={(event) =>
                                setUnlockMessage(event.target.value)
                              }
                            />
                            <div className="flex flex-wrap items-center gap-2">
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
                                {t.profile.submitLanguageUnlockButton}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                disabled={isUnlockingLanguage}
                                onClick={() => {
                                  setConfirmingUnlock(false);
                                  setUnlockMessage("");
                                }}
                              >
                                {t.profile.cancelButton}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
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
                          {languageUnlockPriceLabel
                            ? `${t.profile.unlockLanguageChangeButton} (${languageUnlockPriceLabel})`
                            : t.profile.unlockLanguageChangeButton}
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
                            {t.profile.confirmCreditButton}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            disabled={isUnlockingLanguage}
                            onClick={() => setConfirmingUnlock(false)}
                          >
                            {t.profile.cancelButton}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
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
                  {formatMessage(t.profile.minRequiredBadge, {
                    count: selectedCategoryIds.length,
                    min: MIN_USER_CATEGORIES,
                  })}
                </Badge>
              )}
              <Text variant="caption" tone="muted" className="font-mono">
                {selectedCategoryIds.length} {t.profile.selectedCountSuffix}
              </Text>
            </div>
          </div>

          {categories.length === 0 ? (
            <Text variant="caption" tone="muted">
              {t.profile.minCategoriesNotice}
            </Text>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategoryIds.some(
                  (id) => id.toLowerCase() === cat.id.toLowerCase(),
                );
                if (!onDeleteCategory) {
                  return (
                    <ChoiceChip
                      key={cat.id}
                      selected={isSelected}
                      indicator="plus-check"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => onToggleCategory(cat.id)}
                    >
                      {cat.name}
                    </ChoiceChip>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className={[
                      "inline-flex items-stretch overflow-hidden rounded-base border transition-colors",
                      isSelected
                        ? "border-brand bg-brand text-white"
                        : "border-default-medium bg-neutral-primary-soft text-heading hover:border-brand",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      disabled={isSaving}
                      onClick={() => onToggleCategory(cat.id)}
                      className="inline-flex min-h-8 items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wider uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <span>{cat.name}</span>
                      <Icon name={isSelected ? "check" : "plus"} size="xs" />
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      aria-label={formatMessage(
                        t.profile.hooks.deleteCategoryAriaLabel,
                        { name: cat.name },
                      )}
                      title={t.profile.hooks.deleteCategoryTitle}
                      onClick={() => {
                        void onDeleteCategory(cat.id);
                      }}
                      className={[
                        "inline-flex min-h-8 items-center justify-center border-l px-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-45",
                        isSelected
                          ? "border-white/25 text-white/80 hover:bg-white/15 hover:text-white"
                          : "border-default-medium text-muted hover:bg-neutral-secondary-soft hover:text-heading",
                      ].join(" ")}
                    >
                      <Icon name="close" size="xs" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {onDeleteCategory && categories.length > 0 && (
            <Text variant="caption" tone="muted">
              {t.profile.hooks.categoriesHelpHint}
            </Text>
          )}

          {onAddCustomCategory && (
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  type="text"
                  label={t.profile.addCustomCategoryPrompt}
                  placeholder={t.profile.addCustomCategoryPlaceholder}
                  maxLength={MAX_CATEGORY_LENGTH}
                  value={customName}
                  error={customCategoryError ?? undefined}
                  disabled={isSaving || isAddingCustom}
                  onChange={(event) => {
                    setCustomName(event.target.value);
                    onClearCustomCategoryError?.();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleAddCustom();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isSaving}
                isLoading={isAddingCustom}
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

      {/* Modal A: Candado anual activo y 0 créditos (!canChangeFree && credits === 0) */}
      {showLockedModal && !isProTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            aria-hidden="true"
            onClick={() => {
              if (!isUnlockingLanguage) {
                setShowLockedModal(false);
              }
            }}
            className="fixed inset-0 bg-brand/45 backdrop-blur-[1px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={lockedTitleId}
            className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-base border border-default bg-surface shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-default bg-neutral-primary-soft px-5 py-4">
              <div className="flex flex-col gap-1">
                <Eyebrow tone="muted" className="text-[10px]">
                  {lm.lockedEyebrow}
                </Eyebrow>
                <Heading id={lockedTitleId} as="h2" variant="subsection">
                  {lm.lockedTitle}
                </Heading>
              </div>

              <IconButton
                icon="close"
                variant="ghost"
                size="sm"
                aria-label={t.billing.checkout.closeAria}
                disabled={isUnlockingLanguage}
                onClick={() => setShowLockedModal(false)}
              />
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto p-5">
              <Text variant="small" tone="muted">
                {nextFreeChangeLabel && daysRemaining !== null
                  ? formatMessage(lm.lockedDescriptionWithDate, {
                      date: nextFreeChangeLabel,
                      days: daysRemaining,
                    })
                  : lm.lockedDescriptionFallback}
              </Text>

              <div className="flex flex-col gap-2 rounded-base border border-strong bg-neutral-primary-soft p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-heading">
                    {lm.unitCreditTitle}
                  </span>
                  <Badge variant="outline">{lm.unitCreditBadge}</Badge>
                </div>
                <Text variant="caption" tone="muted">
                  {lm.unitCreditDescription}
                </Text>
              </div>

              {accessRequestsEnabled && (
                <Textarea
                  label={t.profile.languageUnlockMessageLabel}
                  placeholder={t.profile.languageUnlockMessagePlaceholder}
                  maxLength={1000}
                  rows={2}
                  value={unlockMessage}
                  onChange={(event) => setUnlockMessage(event.target.value)}
                />
              )}

              <div className="flex flex-col gap-2.5 border-t border-default pt-4">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  fullWidth
                  isLoading={isUnlockingLanguage}
                  leftIcon={<Icon name="unlock" size="xs" />}
                  onClick={() => {
                    void handleConfirmUnlock();
                  }}
                >
                  {accessRequestsEnabled
                    ? t.profile.submitLanguageUnlockButton
                    : buyCreditButtonText}
                </Button>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <ActionLink
                    href="#subscription"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowLockedModal(false)}
                  >
                    {lm.upgradePlanButton}
                  </ActionLink>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isUnlockingLanguage}
                    onClick={() => setShowLockedModal(false)}
                  >
                    {lm.cancelButton}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal B: Confirmación de consumo cuando SÍ tiene créditos (!canChangeFree && credits > 0) */}
      {showConsumeModal && !isProTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            aria-hidden="true"
            onClick={() => {
              if (!isSaving) {
                setShowConsumeModal(false);
              }
            }}
            className="fixed inset-0 bg-brand/45 backdrop-blur-[1px]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={consumeTitleId}
            className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-base border border-default bg-surface shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-default bg-neutral-primary-soft px-5 py-4">
              <div className="flex flex-col gap-1">
                <Eyebrow tone="muted" className="text-[10px]">
                  {lm.consumeEyebrow}
                </Eyebrow>
                <Heading id={consumeTitleId} as="h2" variant="subsection">
                  {lm.consumeTitle}
                </Heading>
              </div>

              <IconButton
                icon="close"
                variant="ghost"
                size="sm"
                aria-label={t.billing.checkout.closeAria}
                disabled={isSaving}
                onClick={() => setShowConsumeModal(false)}
              />
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto p-5">
              <Text variant="small" tone="muted">
                {lm.consumeDescription}
              </Text>

              <div className="grid grid-cols-2 gap-3 rounded-base border border-strong bg-neutral-primary-soft p-3.5">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] font-bold tracking-wider text-muted uppercase">
                    {lm.creditsCurrentLabel}
                  </span>
                  <span className="font-mono text-lg font-bold text-heading tabular-nums">
                    {credits}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] font-bold tracking-wider text-muted uppercase">
                    {lm.creditsRemainingLabel}
                  </span>
                  <span className="font-mono text-lg font-bold text-heading tabular-nums">
                    {Math.max(0, credits - 1)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-default pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={isSaving}
                  onClick={() => setShowConsumeModal(false)}
                >
                  {lm.cancelButton}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  leftIcon={<Icon name="check" size="xs" />}
                  onClick={() => {
                    void executeLanguageSave();
                  }}
                >
                  {lm.confirmConsumeButton}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
