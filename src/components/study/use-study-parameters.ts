"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import {
  ApiClientError,
  type CatalogCategory,
  DEFAULT_CATEGORIES,
  DEFAULT_DIFFICULTIES,
  DEFAULT_SIZES,
  type DifficultyOption,
  MIN_USER_CATEGORIES,
  type ReadingDifficulty,
  type ReadingSize,
  type ReadingSizeOption,
  settingsService,
  studyClient,
  type StudyParameters,
  subscriptionsService,
  type SubscriptionUsage,
  type TargetLanguageCode,
} from "@/lib";

function buildCategoryCatalogLookup(
  catCatalog: readonly CatalogCategory[] | undefined,
  optionsCategories: readonly CatalogCategory[] | undefined,
): CatalogCategory[] {
  const catalogList =
    catCatalog && catCatalog.length > 0
      ? catCatalog
      : optionsCategories && optionsCategories.length > 0
        ? optionsCategories
        : [...DEFAULT_CATEGORIES];

  const lookupMap = new Map<string, CatalogCategory>();
  for (const item of catalogList) {
    const def = DEFAULT_CATEGORIES.find((d) => d.id === item.id);
    lookupMap.set(item.id.toLowerCase(), {
      ...item,
      ...(def ? { nameEs: def.nameEs, nameEn: def.nameEn } : {}),
    });
  }
  for (const optCat of optionsCategories ?? []) {
    if (!lookupMap.has(optCat.id.toLowerCase())) {
      const def = DEFAULT_CATEGORIES.find((d) => d.id === optCat.id);
      lookupMap.set(optCat.id.toLowerCase(), {
        id: optCat.id,
        name: optCat.name,
        isCustom: optCat.isCustom,
        ...(def ? { nameEs: def.nameEs, nameEn: def.nameEn } : {}),
      });
    }
  }
  return Array.from(lookupMap.values());
}

function resolveConfiguredCategories(
  selectedIds: readonly string[],
  catalogLookup: readonly CatalogCategory[],
): CatalogCategory[] {
  const lookupMap = new Map<string, CatalogCategory>();
  for (const item of catalogLookup) {
    lookupMap.set(item.id.toLowerCase(), item);
  }
  const seen = new Set<string>();
  const resolved: CatalogCategory[] = [];
  for (const rawId of selectedIds) {
    const normalized = rawId.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    const matched = lookupMap.get(normalized);
    resolved.push(
      matched ?? {
        id: rawId.trim(),
        name: rawId.trim(),
        isCustom: true,
      },
    );
  }
  return resolved;
}

/**
 * Hook que gestiona la carga, validación, guardado y generación de lecturas
 * para el módulo de configuración de estudio.
 */
export function useStudyParameters(
  onGenerate?: (parameters: StudyParameters) => void,
) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const {
    user,
    languagesSettings,
    categoriesSettings,
    onboarding,
    refreshPreferences,
  } = useAuth();

  const activePlanLanguages: readonly TargetLanguageCode[] | null = (() => {
    if (!languagesSettings) {
      return null;
    }
    if (languagesSettings.active.length > 0) {
      return languagesSettings.active;
    }
    if (languagesSettings.selected.length > 0) {
      return languagesSettings.selected;
    }
    return user?.subscriptionTier === "dolly_pro" ? null : [];
  })();

  const isPreferencesBlocked = Boolean(user && !onboarding.canGenerateReadings);
  const missingLanguagesForGeneration = Boolean(
    user && !onboarding.hasConfiguredLanguages,
  );
  const missingCategoriesForGeneration = Boolean(
    user && !onboarding.hasConfiguredCategories,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedLanguage, setSelectedLanguage] =
    useState<TargetLanguageCode>("en");
  const [selectedCategory, setSelectedCategory] = useState<string>("technology");
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<ReadingDifficulty>("medium");
  const [selectedSize, setSelectedSize] = useState<ReadingSize>("medium");

  const [categories, setCategories] = useState<CatalogCategory[]>(() =>
    user
      ? resolveConfiguredCategories(
          categoriesSettings?.selected ?? [],
          DEFAULT_CATEGORIES,
        )
      : [...DEFAULT_CATEGORIES],
  );
  const [catalogLookup, setCatalogLookup] = useState<CatalogCategory[]>([
    ...DEFAULT_CATEGORIES,
  ]);
  const [difficulties, setDifficulties] = useState<DifficultyOption[]>([
    ...DEFAULT_DIFFICULTIES,
  ]);
  const [sizes, setSizes] = useState<ReadingSizeOption[]>([...DEFAULT_SIZES]);
  const [subscriptionUsage, setSubscriptionUsage] =
    useState<SubscriptionUsage | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryError, setCustomCategoryError] = useState<string | null>(
    null,
  );

  const [validationError, setRawValidationError] = useState<string | null>(
    null,
  );
  const [validationErrorCode, setValidationErrorCode] = useState<string | null>(
    null,
  );
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  const setValidationError = (message: string | null): void => {
    setRawValidationError(message);
    if (message === null) {
      setValidationErrorCode(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadParameters(): Promise<void> {
      try {
        const [prefsRes, catSettingsRes, readingOptionsRes, subRes] =
          await Promise.allSettled([
            studyClient.getStudyPreferences(user?.id),
            studyClient.getCategoriesSettings(),
            studyClient.getReadingOptions(),
            user
              ? subscriptionsService.getCurrentSubscription()
              : Promise.resolve(null),
          ]);

        if (!isMounted) return;

        const prefs =
          prefsRes.status === "fulfilled" ? prefsRes.value : null;
        const catSettings =
          catSettingsRes.status === "fulfilled" ? catSettingsRes.value : null;
        const readingOptions =
          readingOptionsRes.status === "fulfilled"
            ? readingOptionsRes.value
            : null;
        const subData =
          subRes.status === "fulfilled" && subRes.value
            ? subRes.value.data
            : null;

        if (prefs) {
          setSelectedLanguage(prefs.language);
          setSelectedDifficulty(prefs.difficulty);
          setSelectedSize(prefs.size);
        }

        if (subData) {
          setSubscriptionUsage(subData.usage);
          setPlanName(subData.plan?.name ?? null);
        }

        if (readingOptions?.difficulties?.length) {
          const mappedDiffs: DifficultyOption[] =
            readingOptions.difficulties.map((id) => {
              const existing = DEFAULT_DIFFICULTIES.find((d) => d.id === id);
              if (existing) return existing;
              return {
                id,
                title: id,
                titleEs: id,
                titleEn: id,
                cefr: "",
                description: id,
              };
            });
          setDifficulties(mappedDiffs);
        }

        if (readingOptions?.sizes?.length) {
          setSizes(readingOptions.sizes);
        }

        const lookupList = buildCategoryCatalogLookup(
          catSettings?.catalog,
          readingOptions?.categories,
        );
        setCatalogLookup(lookupList);

        const configuredList = user
          ? resolveConfiguredCategories(
              catSettings?.selected ?? [],
              lookupList,
            )
          : lookupList;
        setCategories(configuredList);

        if (configuredList.length === 0) {
          setSelectedCategory("");
        } else if (
          prefs?.category &&
          configuredList.some(
            (cat) => cat.id.toLowerCase() === prefs.category.toLowerCase(),
          )
        ) {
          const matched = configuredList.find(
            (cat) => cat.id.toLowerCase() === prefs.category.toLowerCase(),
          );
          setSelectedCategory(matched ? matched.id : configuredList[0].id);
        } else {
          setSelectedCategory(configuredList[0].id);
        }
      } catch {
        // Conservamos los valores predeterminados si falla la red
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
  }, [user]);

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
      const alreadySelected = existingCategories.data.selected.some(
        (cat) => cat.toLowerCase() === selectedCategory.trim().toLowerCase(),
      );
      const mergedCategories = alreadySelected
        ? existingCategories.data.selected
        : [...existingCategories.data.selected, selectedCategory];

      if (mergedCategories.length < MIN_USER_CATEGORIES) {
        await studyClient.saveStudyPreferences(currentParams, user?.id);
        setValidationError(t.study.generationBlockedCategories);
        return;
      }

      if (!alreadySelected) {
        await settingsService.updateCategories({ categories: mergedCategories });
      }
      await studyClient.saveStudyPreferences(currentParams, user?.id);
      await refreshPreferences();
      setSaveNotice(t.study.savedSuccessNotice);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setValidationErrorCode(error.code);
        setValidationError(error.getUserMessage(locale));
      } else {
        setValidationErrorCode(null);
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

  const handleAddCustomCategory = (): void => {
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

    // Si coincide con una categoría del catálogo aún no configurada, se agrega a la biblioteca
    // de la cuenta (se persiste al generar, respetando el límite del plan en el backend).
    const catalogMatch = catalogLookup.find(
      (cat) =>
        cat.id.toLowerCase() === cleanName.toLowerCase() ||
        cat.name.toLowerCase() === cleanName.toLowerCase(),
    );

    const newCategory: CatalogCategory = catalogMatch ?? {
      id: cleanName,
      name: cleanName,
      isCustom: true,
    };

    setCategories((prev) => [newCategory, ...prev]);
    setSelectedCategory(newCategory.id);
    setCustomCategoryName("");
    setIsAddingCustom(false);
    setCustomCategoryError(null);
  };

  const cancelCustomCategory = (): void => {
    setIsAddingCustom(false);
    setCustomCategoryName("");
    setCustomCategoryError(null);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setValidationError(null);
    setSaveNotice(null);

    if (isPreferencesBlocked) {
      setValidationError(
        missingCategoriesForGeneration
          ? t.study.generationBlockedCategories
          : t.study.generationBlockedLanguages,
      );
      return;
    }

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
      const savedList = categoriesSettings?.selected ?? [];
      const alreadySaved = savedList.some(
        (c) => c.toLowerCase() === selectedCategory.trim().toLowerCase(),
      );
      if (user && !alreadySaved && savedList.length >= MIN_USER_CATEGORIES) {
        await settingsService.updateCategories({
          categories: [...savedList, selectedCategory],
        });
        await refreshPreferences();
      }

      await studyClient.saveStudyPreferences(finalParams, user?.id);

      if (onGenerate) {
        onGenerate(finalParams);
      } else {
        const generated = await studyClient.generateReading(finalParams);
        setGenerationNotice(
          locale === "es"
            ? `Lectura generada con éxito: "${generated.title}". Abriendo visor...`
            : `Reading generated successfully: "${generated.title}". Opening reader...`,
        );
        router.push(`/readings/${generated.id}`);
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        setValidationErrorCode(error.code);
        setValidationError(error.getUserMessage(locale));
      } else {
        setValidationErrorCode(null);
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

  return {
    locale,
    t,
    activePlanLanguages,
    isPreferencesBlocked,
    missingLanguagesForGeneration,
    missingCategoriesForGeneration,
    isLoading,
    isSaving,
    isSubmitting,
    subscriptionUsage,
    planName,
    effectiveLanguage,
    setSelectedLanguage,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedSize,
    setSelectedSize,
    categories,
    difficulties,
    sizes,
    isAddingCustom,
    setIsAddingCustom,
    customCategoryName,
    setCustomCategoryName,
    customCategoryError,
    setCustomCategoryError,
    handleAddCustomCategory,
    cancelCustomCategory,
    estimatedTime,
    validationError,
    validationErrorCode,
    setValidationError,
    saveNotice,
    setSaveNotice,
    generationNotice,
    setGenerationNotice,
    handleSavePreferences,
    handleSubmit,
  };
}
