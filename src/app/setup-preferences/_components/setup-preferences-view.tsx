"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RegisterStepper } from "@/app/register/_components/register-stepper";
import { AuthShell } from "@/components/auth";
import {
  Alert,
  Badge,
  Button,
  ChoiceChip,
  Container,
  Eyebrow,
  Icon,
  Input,
  SkeletonCard,
  Text,
} from "@/components/ui";
import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import {
  ApiClientError,
  type CatalogItem,
  DEFAULT_CATEGORIES,
  DEFAULT_LANGUAGES,
  MIN_USER_CATEGORIES,
  type TargetLanguageCode,
} from "@/lib";

/**
 * Vista `/setup-preferences`:
 * - Paso 4 posterior a la selección de plan.
 * - Idiomas según plan (`dolly`: 1, `dolly_plus`: 1–2, `dolly_pro`: omitido, ya activos los 4).
 * - Mínimo 3 categorías obligatorias para guardar, con opción "Cancelar" para explorar primero.
 */
export function SetupPreferencesView() {
  const router = useRouter();
  const { locale, t } = useLocale();
  const {
    isLoading,
    accessPhase,
    isAuthenticated,
    user,
    subscription,
    languagesSettings,
    categoriesSettings,
    onboarding,
    savePreferences,
  } = useAuth();

  const [draftLanguages, setDraftLanguages] = useState<
    TargetLanguageCode[] | null
  >(null);
  const [draftCategories, setDraftCategories] = useState<string[] | null>(null);
  const [customCategories, setCustomCategories] = useState<CatalogItem[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading || accessPhase !== "ready") {
    return (
      <Container size="none" className="w-full max-w-4xl px-0">
        <SkeletonCard
          lines={6}
          label={
            locale === "es"
              ? "Cargando preferencias de estudio"
              : "Loading study preferences"
          }
        />
      </Container>
    );
  }

  const tier = user?.subscriptionTier ?? onboarding.subscriptionPlan ?? "dolly";
  const isProTier = tier === "dolly_pro";
  const s4 = t.auth.stepper.step4Languages;
  const sp = t.auth.stepper.step4Preferences;

  const maxLanguages =
    subscription?.plan?.maxLanguages ??
    subscription?.usage.languagesLimit ??
    languagesSettings?.maxLanguages ??
    (tier === "dolly" ? 1 : tier === "dolly_plus" ? 2 : 4);

  const maxCategories =
    subscription?.plan !== undefined
      ? (subscription.plan?.maxCategories ?? null)
      : tier === "dolly"
        ? 5
        : tier === "dolly_plus"
          ? 15
          : null;

  const savedLanguages = languagesSettings?.selected ?? [];
  const effectiveLanguages = draftLanguages ?? savedLanguages;
  const savedCategories = categoriesSettings?.selected ?? [];
  const effectiveCategories = draftCategories ?? savedCategories;

  const canChangeLanguages =
    !isProTier &&
    (savedLanguages.length === 0 ||
      Boolean(languagesSettings?.canChangeFree) ||
      (languagesSettings?.languageChangeCredits ?? 0) > 0);

  // Construimos catálogo unificado: catálogo del servidor + predeterminados + propios.
  const baseCatalog =
    categoriesSettings?.catalog && categoriesSettings.catalog.length > 0
      ? categoriesSettings.catalog
      : DEFAULT_CATEGORIES.map((item) => ({ id: item.id, name: item.name }));

  const catalogMap = new Map<string, CatalogItem>();
  for (const item of baseCatalog) {
    const localized = DEFAULT_CATEGORIES.find((def) => def.id === item.id);
    catalogMap.set(item.id.toLowerCase(), {
      id: item.id,
      name: localized
        ? locale === "es"
          ? localized.nameEs ?? item.name
          : localized.nameEn ?? item.name
        : item.name,
    });
  }
  for (const item of [...customCategories, ...effectiveCategories.map((id) => ({ id, name: id }))]) {
    const key = item.id.toLowerCase();
    if (!catalogMap.has(key)) {
      catalogMap.set(key, item);
    }
  }
  const unifiedCategories = Array.from(catalogMap.values());

  const handleToggleLanguage = (code: TargetLanguageCode): void => {
    if (!canChangeLanguages) return;
    setFormError(null);

    if (effectiveLanguages.includes(code)) {
      if (effectiveLanguages.length === 1) {
        setFormError(s4.atLeastOneAlert);
        return;
      }
      setDraftLanguages(effectiveLanguages.filter((item) => item !== code));
      return;
    }

    if (maxLanguages === 1) {
      setDraftLanguages([code]);
      return;
    }

    if (effectiveLanguages.length >= maxLanguages) {
      setFormError(s4.limitReachedAlert);
      return;
    }

    setDraftLanguages([...effectiveLanguages, code]);
  };

  const handleToggleCategory = (categoryId: string): void => {
    setFormError(null);
    const exists = effectiveCategories.some(
      (item) => item.toLowerCase() === categoryId.toLowerCase(),
    );

    if (exists) {
      setDraftCategories(
        effectiveCategories.filter(
          (item) => item.toLowerCase() !== categoryId.toLowerCase(),
        ),
      );
      return;
    }

    if (maxCategories !== null && effectiveCategories.length >= maxCategories) {
      setFormError(
        `${sp.categoriesMaxAlertPrefix} ${maxCategories} ${
          locale === "es" ? "categorías." : "categories."
        }`,
      );
      return;
    }

    setDraftCategories([...effectiveCategories, categoryId]);
  };

  const handleAddCustomCategory = (): void => {
    const cleanName = customInput.trim();
    if (cleanName.length < 2 || cleanName.length > 50) {
      setCustomError(
        locale === "es"
          ? "La categoría debe tener entre 2 y 50 caracteres."
          : "Category name must be between 2 and 50 characters.",
      );
      return;
    }

    const existingItem = unifiedCategories.find(
      (item) =>
        item.id.toLowerCase() === cleanName.toLowerCase() ||
        item.name.toLowerCase() === cleanName.toLowerCase(),
    );

    if (existingItem) {
      const alreadySelected = effectiveCategories.some(
        (id) => id.toLowerCase() === existingItem.id.toLowerCase(),
      );
      if (!alreadySelected) {
        if (
          maxCategories !== null &&
          effectiveCategories.length >= maxCategories
        ) {
          setCustomError(
            `${sp.categoriesMaxAlertPrefix} ${maxCategories} ${
              locale === "es" ? "categorías." : "categories."
            }`,
          );
          return;
        }
        setDraftCategories([...effectiveCategories, existingItem.id]);
      }
      setCustomInput("");
      setCustomError(null);
      return;
    }

    if (maxCategories !== null && effectiveCategories.length >= maxCategories) {
      setCustomError(
        `${sp.categoriesMaxAlertPrefix} ${maxCategories} ${
          locale === "es" ? "categorías." : "categories."
        }`,
      );
      return;
    }

    setCustomCategories((prev) => [
      ...prev,
      { id: cleanName, name: cleanName },
    ]);
    setDraftCategories([...effectiveCategories, cleanName]);
    setCustomInput("");
    setCustomError(null);
    setFormError(null);
  };

  const handleSave = async (): Promise<void> => {
    if (isSaving) return;
    setFormError(null);

    if (!isProTier && effectiveLanguages.length === 0) {
      setFormError(s4.atLeastOneAlert);
      return;
    }

    if (effectiveCategories.length < MIN_USER_CATEGORIES) {
      setFormError(sp.categoriesMinAlert);
      return;
    }

    setIsSaving(true);
    try {
      await savePreferences({
        ...(canChangeLanguages ? { languages: effectiveLanguages } : {}),
        categories: effectiveCategories,
      });
      router.replace("/");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFormError(error.getUserMessage(locale));
      } else {
        setFormError(
          locale === "es"
            ? "No fue posible guardar tus preferencias. Inténtalo de nuevo."
            : "Could not save your preferences. Please try again.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const hasMinCategories = effectiveCategories.length >= MIN_USER_CATEGORIES;
  const tierLabel =
    tier === "dolly_pro"
      ? "Dolly Pro"
      : tier === "dolly_plus"
        ? "Dolly Plus"
        : "Dolly";

  return (
    <AuthShell
      title={sp.title}
      subtitle={sp.subtitle}
      maxWidthClass="max-w-4xl"
      topSlot={
        <div className="flex flex-col gap-3">
          <RegisterStepper
            activeStep={4}
            isAuthenticated={isAuthenticated}
            onboarding={onboarding}
            stepsLabels={t.auth.stepper.steps}
          />
          <div className="flex items-center justify-between gap-2 px-1">
            <Badge variant="outline">
              {locale === "es" ? "PASO 04 / 04" : "STEP 04 / 04"}
            </Badge>
            <Badge variant="secondary">Plan: {tierLabel}</Badge>
          </div>
        </div>
      }
      copyrightText={t.auth.register.copyrightNotice}
    >
      <div className="flex flex-col gap-7">
        {formError && (
          <Alert
            variant="error"
            title={
              locale === "es"
                ? "Configuración incompleta"
                : "Incomplete preferences"
            }
            onDismiss={() => setFormError(null)}
          >
            {formError}
          </Alert>
        )}

        {/* Sección 01: Idiomas según el plan activo */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow tone="muted">{sp.languagesSectionTitle}</Eyebrow>
            {!isProTier && (
              <span className="font-mono text-xs font-semibold text-heading">
                {effectiveLanguages.length} / {maxLanguages}{" "}
                {s4.selectedCountText}
              </span>
            )}
          </div>

          {isProTier ? (
            <Alert variant="success" title={sp.proLanguagesTitle}>
              {sp.proLanguagesDesc}
            </Alert>
          ) : (
            <>
              <Text variant="small" tone="muted">
                {tier === "dolly" ? s4.capacityDoly : s4.capacityDolyPlus}
              </Text>

              {!canChangeLanguages && (
                <Alert variant="info" title={tierLabel}>
                  {sp.languagesLockedNotice}
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {DEFAULT_LANGUAGES.map((lang) => {
                  const isSelected = effectiveLanguages.includes(lang.id);
                  return (
                    <ChoiceChip
                      key={lang.id}
                      selected={isSelected}
                      codePrefix={`[${lang.id.toUpperCase()}]`}
                      indicator="plus-check"
                      disabled={!canChangeLanguages || isSaving}
                      onClick={() => handleToggleLanguage(lang.id)}
                      className="min-h-12 justify-between px-3"
                    >
                      {locale === "es" ? lang.nameEs : lang.nameEn}
                    </ChoiceChip>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Sección 02: Mínimo 3 categorías temáticas */}
        <section className="flex flex-col gap-3 border-t border-default pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow tone="muted">{sp.categoriesSectionTitle}</Eyebrow>
            <div className="flex items-center gap-2">
              <Badge variant={hasMinCategories ? "success" : "warning"}>
                {hasMinCategories
                  ? sp.categoriesMinBadgeReady
                  : sp.categoriesMinBadgeMissing}
              </Badge>
              <span className="font-mono text-xs font-semibold text-heading">
                {sp.categoriesCounterPrefix} {effectiveCategories.length}/
                {MIN_USER_CATEGORIES}
                {maxCategories !== null ? ` (máx. ${maxCategories})` : ""}
              </span>
            </div>
          </div>

          <Text variant="small" tone="muted">
            {sp.categoriesSubtitle}
          </Text>

          <div className="flex flex-wrap gap-2">
            {unifiedCategories.map((cat) => {
              const isSelected = effectiveCategories.some(
                (id) => id.toLowerCase() === cat.id.toLowerCase(),
              );
              return (
                <ChoiceChip
                  key={cat.id}
                  selected={isSelected}
                  indicator="plus-check"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => handleToggleCategory(cat.id)}
                >
                  {cat.name}
                </ChoiceChip>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 rounded-base border border-default-medium bg-neutral-secondary-soft p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  type="text"
                  label={sp.addCustomLabel}
                  placeholder={sp.addCustomPlaceholder}
                  value={customInput}
                  error={customError ?? undefined}
                  onChange={(event) => {
                    setCustomInput(event.target.value);
                    setCustomError(null);
                  }}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isSaving}
                onClick={handleAddCustomCategory}
              >
                {sp.addCustomButton}
              </Button>
            </div>
          </div>
        </section>

        {/* Acciones finales: Guardar o Cancelar para explorar primero */}
        <div className="flex flex-col gap-3 border-t border-default pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={isSaving}
              onClick={() => router.replace("/")}
            >
              {sp.cancelButton}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="lg"
              isLoading={isSaving}
              onClick={handleSave}
              rightIcon={<Icon name="arrow-right" size="md" />}
              className="normal-case tracking-normal"
            >
              {sp.saveButton}
            </Button>
          </div>

          <Text variant="caption" tone="muted">
            {sp.cancelHint}
          </Text>
        </div>
      </div>
    </AuthShell>
  );
}
