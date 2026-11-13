"use client";

import { type FormEvent, useEffect, useState } from "react";

import { Alert, Badge, Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import {
  ApiClientError,
  DEFAULT_CATEGORIES,
  DEFAULT_DIFFICULTIES,
  DEFAULT_LANGUAGES,
  DEFAULT_SIZES,
  settingsService,
  studyClient,
  type CatalogCategory,
  type DifficultyOption,
  type ReadingDifficulty,
  type ReadingSize,
  type ReadingSizeOption,
  type StudyParameters,
  type TargetLanguageCode,
} from "@/lib";

export interface StudyParametersFormProps {
  /**
   * Identificador del contenedor (por ejemplo para anclajes `#generar-lectura`).
   */
  id?: string;
  /**
   * Variante visual: 'standalone' (página dedicada /generate) o 'embedded' (dentro de la página de inicio).
   */
  variant?: "standalone" | "embedded";
  /**
   * Callback opcional disparado cuando el usuario hace submit para generar la lectura.
   */
  onGenerate?: (parameters: StudyParameters) => void;
}

export function StudyParametersForm({
  id = "generar-lectura",
  variant = "standalone",
  onGenerate,
}: StudyParametersFormProps) {
  const { locale, t } = useLocale();
  const { user, languagesSettings } = useAuth();

  const activePlanLanguages: readonly TargetLanguageCode[] | null =
    languagesSettings?.active && languagesSettings.active.length > 0
      ? languagesSettings.active
      : languagesSettings?.selected && languagesSettings.selected.length > 0
        ? languagesSettings.selected
        : null;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parámetros seleccionados
  const [selectedLanguage, setSelectedLanguage] =
    useState<TargetLanguageCode>("en");
  const [selectedCategory, setSelectedCategory] = useState<string>("technology");
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<ReadingDifficulty>("medium");
  const [selectedSize, setSelectedSize] = useState<ReadingSize>("medium");

  // Catálogos
  const [categories, setCategories] =
    useState<CatalogCategory[]>([...DEFAULT_CATEGORIES]);
  const [difficulties] =
    useState<DifficultyOption[]>([...DEFAULT_DIFFICULTIES]);
  const [sizes] = useState<ReadingSizeOption[]>([...DEFAULT_SIZES]);

  // Entrada para categoría personalizada
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryError, setCustomCategoryError] = useState<string | null>(
    null,
  );

  // Avisos y errores
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  // Carga inicial de preferencias y catálogos
  useEffect(() => {
    let isMounted = true;

    async function loadParameters(): Promise<void> {
      try {
        const [prefs, catSettings] = await Promise.all([
          studyClient.getStudyPreferences(user?.id),
          studyClient.getCategoriesSettings(),
        ]);

        if (!isMounted) return;

        setSelectedLanguage(prefs.language);
        setSelectedDifficulty(prefs.difficulty);
        setSelectedSize(prefs.size);

        if (catSettings.catalog && catSettings.catalog.length > 0) {
          setCategories(catSettings.catalog);
        }

        if (prefs.category) {
          setSelectedCategory(prefs.category);
        }
      } catch {
        // En caso de fallo de red, los valores predeterminados ya están listos
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadParameters();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const effectiveLanguage: TargetLanguageCode =
    activePlanLanguages &&
    activePlanLanguages.length > 0 &&
    !activePlanLanguages.includes(selectedLanguage)
      ? activePlanLanguages[0]
      : selectedLanguage;

  const estimatedTime = studyClient.calculateEstimatedTime(
    selectedSize,
    selectedDifficulty,
  );

  // Manejo de guardar preferencias sin generar
  const handleSavePreferences = async (): Promise<void> => {
    setIsSaving(true);
    setValidationError(null);
    setGenerationNotice(null);
    setSaveNotice(null);
    try {
      const currentParams: StudyParameters = {
        language: effectiveLanguage,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        size: selectedSize,
      };

      const existingCategories = await settingsService.getCategories();
      const mergedCategories = Array.from(
        new Set([...existingCategories.data.selected, selectedCategory]),
      );
      await settingsService.updateCategories({ categories: mergedCategories });
      await studyClient.saveStudyPreferences(currentParams, user?.id);
      setSaveNotice(t.study.savedSuccessNotice);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setValidationError(error.getUserMessage(locale));
      } else {
        setValidationError(
          locale === "es"
            ? "No se pudieron sincronizar las preferencias con el servidor."
            : "Could not sync preferences with server.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Manejo de agregar categoría personalizada
  const handleAddCustomCategory = (e: React.FormEvent): void => {
    e.preventDefault();
    const cleanName = customCategoryName.trim();
    if (!cleanName) {
      setCustomCategoryError(
        locale === "es"
          ? "Ingresa un nombre para la temática."
          : "Enter a name for the topic.",
      );
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 50) {
      setCustomCategoryError(
        locale === "es"
          ? "La categoría debe tener entre 2 y 50 caracteres."
          : "Category name must be between 2 and 50 characters.",
      );
      return;
    }

    const duplicate = categories.find(
      (cat) =>
        cat.id.toLowerCase() === cleanName.toLowerCase() ||
        cat.name.toLowerCase() === cleanName.toLowerCase(),
    );

    if (duplicate) {
      setSelectedCategory(duplicate.id);
      setCustomCategoryName("");
      setIsAddingCustom(false);
      setCustomCategoryError(null);
      return;
    }

    const newCategory: CatalogCategory = {
      id: cleanName,
      name: cleanName,
      isCustom: true,
    };

    setCategories((prev) => [newCategory, ...prev]);
    setSelectedCategory(cleanName);
    setCustomCategoryName("");
    setIsAddingCustom(false);
    setCustomCategoryError(null);
  };

  // Envío del formulario de generación
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setValidationError(null);
    setSaveNotice(null);

    if (!selectedLanguage) {
      setValidationError(t.study.errorRequiredLanguage);
      return;
    }
    if (!selectedCategory) {
      setValidationError(t.study.errorRequiredCategory);
      return;
    }
    if (!selectedDifficulty) {
      setValidationError(t.study.errorRequiredDifficulty);
      return;
    }
    if (!selectedSize) {
      setValidationError(t.study.errorRequiredLength);
      return;
    }

    const finalParams: StudyParameters = {
      language: effectiveLanguage,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      size: selectedSize,
    };

    setIsSubmitting(true);
    setGenerationNotice(null);
    try {
      await studyClient.saveStudyPreferences(finalParams, user?.id);

      if (onGenerate) {
        onGenerate(finalParams);
      } else {
        const generated = await studyClient.generateReading(finalParams);
        setGenerationNotice(
          locale === "es"
            ? `Lectura generada con éxito: "${generated.title}". Estado: ${generated.status}.`
            : `Reading generated successfully: "${generated.title}". Status: ${generated.status}.`,
        );
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        setValidationError(error.getUserMessage(locale));
      } else {
        setValidationError(
          locale === "es"
            ? "Ocurrió un error al preparar la generación de la lectura."
            : "An error occurred while generating the reading.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card id={id} padding="lg" as="section" className="w-full border-border bg-surface">
        <div className="flex flex-col gap-6 animate-pulse" role="status" aria-live="polite">
          <div className="h-6 w-48 rounded-xs bg-neutral-secondary-medium" />
          <div className="h-10 w-full rounded-xs bg-neutral-secondary-medium" />
          <div className="h-16 w-full rounded-xs bg-neutral-secondary-medium" />
          <div className="h-28 w-full rounded-xs bg-neutral-secondary-medium" />
          <p className="text-xs text-muted font-medium">
            {t.study.loadingParametersNotice}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      id={id}
      padding="lg"
      as="section"
      className={`w-full border-default bg-surface ${
        variant === "standalone" ? "shadow-xs sm:p-8" : ""
      }`}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-labelledby="study-parameters-heading"
        className="flex flex-col gap-8"
      >
        {/* Cabecera del formulario editorial */}
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 items-center justify-center rounded-xs bg-ink text-xs font-bold text-ink-contrast"
            >
              ☷
            </span>
            <h2
              id="study-parameters-heading"
              className="font-mono text-xs font-bold tracking-wider text-ink uppercase sm:text-sm"
            >
              {t.study.formTitle}
            </h2>
          </div>

          <Badge variant="outline">
            {effectiveLanguage.toUpperCase()} • {selectedDifficulty.toUpperCase()}
          </Badge>
        </div>

        {/* Alertas dinámicas */}
        {validationError && (
          <Alert
            variant="error"
            title={locale === "es" ? "Parámetro incompleto" : "Missing parameter"}
            onDismiss={() => setValidationError(null)}
          >
            {validationError}
          </Alert>
        )}

        {saveNotice && (
          <Alert
            variant="success"
            title={locale === "es" ? "Preferencias guardadas" : "Preferences saved"}
            onDismiss={() => setSaveNotice(null)}
          >
            {saveNotice}
          </Alert>
        )}

        {generationNotice && (
          <Alert
            variant="info"
            title={locale === "es" ? "Sesión de estudio configurada" : "Study session ready"}
            code="STUDY_READY"
            onDismiss={() => setGenerationNotice(null)}
          >
            {generationNotice}
          </Alert>
        )}

        {/* ======================================================== */}
        {/* 01. IDIOMA META */}
        {/* ======================================================== */}
        <fieldset className="flex flex-col gap-3">
          <legend className="text-[11px] font-bold tracking-wider text-muted uppercase">
            {t.study.step1Language}
          </legend>

          <div
            role="radiogroup"
            aria-label={t.study.step1Language}
            className="flex flex-wrap gap-2 sm:gap-2.5"
          >
            {DEFAULT_LANGUAGES.map((lang) => {
              const isSelected = effectiveLanguage === lang.id;
              const isAllowed =
                !activePlanLanguages || activePlanLanguages.includes(lang.id);
              const label = locale === "es" ? lang.nameEs : lang.nameEn;

              return (
                <button
                  key={lang.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={!isAllowed}
                  title={
                    !isAllowed
                      ? locale === "es"
                        ? "Idioma no activo en tu plan actual"
                        : "Language not active in your current plan"
                      : undefined
                  }
                  onClick={() => {
                    if (!isAllowed) return;
                    setSelectedLanguage(lang.id);
                    setValidationError(null);
                  }}
                  className={[
                    "min-h-9 rounded-xs border px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all sm:text-xs",
                    !isAllowed
                      ? "cursor-not-allowed border-border bg-neutral-secondary-soft text-subtle opacity-50"
                      : isSelected
                        ? "border-brand bg-brand text-white shadow-xs ring-1 ring-brand"
                        : "border-border-strong bg-surface text-heading hover:border-brand hover:bg-neutral-secondary-medium",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {activePlanLanguages && (
            <p className="text-[11px] text-muted">
              {locale === "es"
                ? "Idiomas habilitados según tu suscripción actual:"
                : "Languages enabled by your active plan:"}{" "}
              <span className="font-mono font-semibold text-ink uppercase">
                {activePlanLanguages.join(", ")}
              </span>
            </p>
          )}
        </fieldset>

        {/* ======================================================== */}
        {/* 02. DOMINIO TEMÁTICO */}
        {/* ======================================================== */}
        <fieldset className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className="text-[11px] font-bold tracking-wider text-muted uppercase">
              {t.study.step2Category}
            </legend>

            {!isAddingCustom && (
              <button
                type="button"
                onClick={() => setIsAddingCustom(true)}
                className="text-[11px] font-bold tracking-wider text-muted uppercase underline underline-offset-2 hover:text-ink"
              >
                {t.study.addCategoryPrompt}
              </button>
            )}
          </div>

          {/* Formulario desplegable para categoría propia */}
          {isAddingCustom && (
            <div className="flex flex-col gap-2 rounded-xs border border-border-strong bg-neutral-secondary-soft p-3">
              <span className="text-[10px] font-bold tracking-wider text-muted uppercase">
                {t.study.addCategoryPrompt}
              </span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Input
                    type="text"
                    label={t.study.addCategoryPrompt}
                    placeholder={t.study.addCategoryPlaceholder}
                    value={customCategoryName}
                    error={customCategoryError ?? undefined}
                    onChange={(e) => {
                      setCustomCategoryName(e.target.value);
                      setCustomCategoryError(null);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddCustomCategory}
                  >
                    {t.study.addCategoryButton}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingCustom(false);
                      setCustomCategoryName("");
                      setCustomCategoryError(null);
                    }}
                  >
                    {locale === "es" ? "Cancelar" : "Cancel"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Píldoras de temáticas */}
          {categories.length === 0 ? (
            <p className="text-xs text-muted">{t.study.emptyCategoriesNotice}</p>
          ) : (
            <div
              role="radiogroup"
              aria-label={t.study.step2Category}
              className="flex flex-wrap gap-2"
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const displayName =
                  locale === "es"
                    ? (cat.nameEs ?? cat.name)
                    : (cat.nameEn ?? cat.name);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setValidationError(null);
                    }}
                    className={[
                      "flex min-h-9 items-center gap-2 rounded-xs border px-3.5 py-1.5 text-xs font-bold tracking-wider uppercase transition-all",
                      isSelected
                        ? "border-brand bg-brand text-white shadow-xs ring-1 ring-brand"
                        : "border-border-strong bg-surface text-heading hover:border-brand hover:bg-neutral-secondary-medium",
                    ].join(" ")}
                  >
                    <span>{displayName}</span>
                    {cat.isCustom && (
                      <span
                        className={`text-[9px] font-mono px-1 rounded-[2px] ${
                          isSelected ? "bg-white/20 text-white" : "bg-neutral-secondary-medium text-muted"
                        }`}
                      >
                        {t.study.customCategoryBadge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>

        {/* ======================================================== */}
        {/* 03. NIVEL DE COMPLEJIDAD LINGÜÍSTICA */}
        {/* ======================================================== */}
        <fieldset className="flex flex-col gap-3">
          <legend className="text-[11px] font-bold tracking-wider text-muted uppercase">
            {t.study.step3Difficulty}
          </legend>

          <div
            role="radiogroup"
            aria-label={t.study.step3Difficulty}
            className="grid grid-cols-1 gap-3.5 md:grid-cols-3"
          >
            {difficulties.map((level) => {
              const isSelected = selectedDifficulty === level.id;

              return (
                <button
                  key={level.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setSelectedDifficulty(level.id);
                    setValidationError(null);
                  }}
                  className={[
                    "flex flex-col justify-between gap-3.5 rounded-xs border p-4 text-left transition-all sm:p-5",
                    isSelected
                      ? "border-brand bg-brand text-white shadow-xs ring-1 ring-brand"
                      : "border-border-strong bg-surface text-heading hover:border-brand hover:bg-neutral-secondary-medium",
                  ].join(" ")}
                >
                  <div className="flex w-full items-center justify-between gap-2 text-xs font-bold tracking-wider uppercase">
                    <span className={isSelected ? "text-white" : "text-ink"}>
                      {level.title}
                    </span>
                    <span
                      className={`font-mono text-[11px] ${
                        isSelected ? "text-white/80" : "text-muted"
                      }`}
                    >
                      {level.cefr}
                    </span>
                  </div>

                  <p
                    className={`text-xs leading-relaxed ${
                      isSelected ? "text-white/90" : "text-muted"
                    }`}
                  >
                    {level.description}
                  </p>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* ======================================================== */}
        {/* 04. LONGITUD DEL TEXTO */}
        {/* ======================================================== */}
        <fieldset className="flex flex-col gap-3">
          <legend className="text-[11px] font-bold tracking-wider text-muted uppercase">
            {t.study.step4Length}
          </legend>

          <div
            role="radiogroup"
            aria-label={t.study.step4Length}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {sizes.map((sizeOption) => {
              const isSelected = selectedSize === sizeOption.id;

              return (
                <button
                  key={sizeOption.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setSelectedSize(sizeOption.id);
                    setValidationError(null);
                  }}
                  className={[
                    "flex flex-col gap-1.5 rounded-xs border p-3.5 text-left transition-all",
                    isSelected
                      ? "border-brand bg-brand text-white shadow-xs ring-1 ring-brand"
                      : "border-border-strong bg-surface text-heading hover:border-brand hover:bg-neutral-secondary-medium",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold tracking-wider uppercase">
                      {sizeOption.label}
                    </span>
                    <span
                      className={`font-mono text-[10px] ${
                        isSelected ? "text-white/80" : "text-muted"
                      }`}
                    >
                      {sizeOption.readingTime}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] ${
                      isSelected ? "text-white/90" : "text-muted"
                    }`}
                  >
                    {sizeOption.wordRange}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* ======================================================== */}
        {/* BARRA DE ACCIÓN Y TIEMPO ESTIMADO */}
        {/* ======================================================== */}
        <div className="flex flex-col justify-between gap-4 border-t border-border pt-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <svg
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-ink"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              {t.study.estimatedTimePrefix}
              <strong className="font-mono font-bold text-ink">
                {estimatedTime}
              </strong>
              {t.study.estimatedMinutes}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              isLoading={isSaving}
              onClick={handleSavePreferences}
            >
              {t.study.savePreferencesButton}
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              leftIcon={<span aria-hidden="true">⚡</span>}
              className="normal-case tracking-normal"
            >
              {t.study.generateButton}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
