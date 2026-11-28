"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { useTurnstile } from "@/components/security";
import { useAuth } from "@/context";
import { type ToastAction, useToast } from "@/context/toast-context";
import { useNavigationGuard } from "@/hooks";
import { formatMessage, useLocale } from "@/i18n";
import {
  ApiClientError,
  canonicalCategoryKey,
  type CatalogCategory,
  DEFAULT_DIFFICULTIES,
  DEFAULT_SIZES,
  type DifficultyOption,
  ErrorCode,
  isAbortError,
  MAX_CATEGORY_LENGTH,
  MIN_CATEGORY_LENGTH,
  MIN_USER_CATEGORIES,
  type ReadingDifficulty,
  type ReadingSize,
  type ReadingSizeOption,
  resolveErrorMessage,
  settingsService,
  studyClient,
  type StudyParameters,
  subscriptionsService,
  type SubscriptionUsage,
  type TargetLanguageCode,
  validateCategoryInput,
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
        : [];

  const lookupMap = new Map<string, CatalogCategory>();
  for (const item of catalogList) {
    lookupMap.set(item.id.toLowerCase(), { ...item });
  }
  for (const optCat of optionsCategories ?? []) {
    if (!lookupMap.has(optCat.id.toLowerCase())) {
      lookupMap.set(optCat.id.toLowerCase(), {
        id: optCat.id,
        name: optCat.name,
        isCustom: optCat.isCustom,
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
  const toast = useToast();
  const { info: showInfoToast } = toast;
  const captcha = useTurnstile("reading_generate");
  const {
    user,
    subscription,
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
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<ReadingDifficulty>("medium");
  const [selectedSize, setSelectedSize] = useState<ReadingSize>("medium");

  const [categories, setCategories] = useState<CatalogCategory[]>(() =>
    user
      ? resolveConfiguredCategories(categoriesSettings?.selected ?? [], [])
      : [],
  );
  const [catalogLookup, setCatalogLookup] = useState<CatalogCategory[]>([]);
  const [difficulties, setDifficulties] = useState<DifficultyOption[]>([
    ...DEFAULT_DIFFICULTIES,
  ]);
  const [sizes, setSizes] = useState<ReadingSizeOption[]>([...DEFAULT_SIZES]);
  const [subscriptionUsage, setSubscriptionUsage] =
    useState<SubscriptionUsage | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryError, setCustomCategoryError] = useState<string | null>(
    null,
  );

  const generationAbortControllerRef = useRef<AbortController | null>(null);
  const generationCancelledRef = useRef(false);

  const abortActiveGeneration = useCallback(() => {
    const controller = generationAbortControllerRef.current;
    if (!controller) {
      return;
    }
    generationCancelledRef.current = true;
    generationAbortControllerRef.current = null;
    controller.abort();
  }, []);

  const handleConfirmCancelGeneration = useCallback(() => {
    abortActiveGeneration();
    showInfoToast(t.navigationGuard.generationCancelledToast);
  }, [
    abortActiveGeneration,
    showInfoToast,
    t.navigationGuard.generationCancelledToast,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.addEventListener("pagehide", abortActiveGeneration);
    return () => {
      window.removeEventListener("pagehide", abortActiveGeneration);
      abortActiveGeneration();
    };
  }, [abortActiveGeneration]);

  const { allowNextNavigation } = useNavigationGuard({
    active: isSubmitting,
    message: t.navigationGuard.generationInProgressMessage,
    onConfirmLeave: handleConfirmCancelGeneration,
  });

  const resolveErrorAction = (code?: string): ToastAction | undefined => {
    if (code === ErrorCode.READING_PENDING_LIMIT_REACHED) {
      return {
        label: t.study.viewPendingReadings,
        href: "/readings",
      };
    }
    if (
      code === ErrorCode.READING_DAILY_LIMIT_REACHED ||
      code === ErrorCode.SUBSCRIPTION_CATEGORY_LIMIT_EXCEEDED ||
      code === ErrorCode.SUBSCRIPTION_LANGUAGE_LIMIT_EXCEEDED
    ) {
      return {
        label: t.study.viewPlanAndUsage,
        href: "/profile#subscription",
      };
    }
    return undefined;
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
        toast.warning(t.study.generationBlockedCategories, {
          title: t.study.generationBlockedTitle,
        });
        return;
      }

      if (!alreadySelected) {
        await settingsService.updateCategories({ categories: mergedCategories });
      }
      await studyClient.saveStudyPreferences(currentParams, user?.id);
      await refreshPreferences();
      toast.success(t.study.savedSuccessNotice, {
        title: t.study.preferencesSavedTitle,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        const msg = error.getUserMessage(locale);
        toast.error(msg, {
          title: t.study.couldNotSaveTitle,
          action: resolveErrorAction(error.code),
        });
      } else {
        toast.error(t.study.preferencesSavedError, {
          title: t.study.couldNotSaveTitle,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCustomCategory = async (): Promise<void> => {
    if (isSubmittingCustom) return;

    const validation = validateCategoryInput(customCategoryName);
    if (!validation.ok) {
      const errorMsg =
        validation.reason === "required"
          ? t.categoryValidation.requiredError
          : validation.reason === "length"
            ? formatMessage(t.categoryValidation.lengthError, {
                min: MIN_CATEGORY_LENGTH,
                max: MAX_CATEGORY_LENGTH,
              })
            : t.categoryValidation.formatError;
      setCustomCategoryError(errorMsg);
      toast.warning(errorMsg);
      return;
    }

    const cleanName = validation.cleaned;

    const duplicate = categories.find(
      (cat) =>
        canonicalCategoryKey(cat.id) === validation.canonicalKey ||
        canonicalCategoryKey(cat.name) === validation.canonicalKey,
    );

    if (duplicate) {
      setSelectedCategory(duplicate.id);
      setCustomCategoryName("");
      setIsAddingCustom(false);
      setCustomCategoryError(null);
      return;
    }

    setIsSubmittingCustom(true);
    setCustomCategoryError(null);

    try {
      const savedSelected =
        categoriesSettings?.selected && categoriesSettings.selected.length > 0
          ? categoriesSettings.selected
          : (await settingsService.getCategories()).data.selected;

      const maxCategories =
        subscription?.plan?.maxCategories ??
        subscription?.usage?.categoriesLimit ??
        subscriptionUsage?.categoriesLimit ??
        null;

      const alreadyInSaved = savedSelected.some(
        (cat) => canonicalCategoryKey(cat) === validation.canonicalKey,
      );
      if (
        !alreadyInSaved &&
        maxCategories !== null &&
        savedSelected.length >= maxCategories
      ) {
        const limitMsg = formatMessage(t.categoryValidation.maxLimitError, {
          max: maxCategories,
        });
        setCustomCategoryError(limitMsg);
        toast.warning(limitMsg);
        return;
      }

      const mergedCategories = alreadyInSaved
        ? savedSelected
        : [...savedSelected, cleanName];

      if (mergedCategories.length < MIN_USER_CATEGORIES) {
        setCustomCategoryError(t.study.generationBlockedCategories);
        toast.warning(t.study.generationBlockedCategories, {
          title: t.study.generationBlockedTitle,
          action: {
            label: t.study.goToPreferencesButton,
            href: "/setup-preferences",
          },
        });
        return;
      }

      const updated = await settingsService.updateCategories({
        categories: mergedCategories,
      });

      const mergedLookup = buildCategoryCatalogLookup(
        updated.data.catalog,
        catalogLookup,
      );
      setCatalogLookup(mergedLookup);
      const nextCategories = resolveConfiguredCategories(
        updated.data.selected,
        mergedLookup,
      );
      setCategories(nextCategories);

      const persistedMatch =
        nextCategories.find(
          (cat) =>
            canonicalCategoryKey(cat.id) === validation.canonicalKey ||
            canonicalCategoryKey(cat.name) === validation.canonicalKey,
        ) ?? nextCategories[nextCategories.length - 1];

      if (persistedMatch) {
        setSelectedCategory(persistedMatch.id);
      }

      await refreshPreferences();
      setCustomCategoryName("");
      setIsAddingCustom(false);
      setCustomCategoryError(null);
      toast.success(t.study.savedSuccessNotice, {
        title: t.study.preferencesSavedTitle,
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        const msg = error.getUserMessage(locale);
        setCustomCategoryError(msg);
        toast.error(msg, {
          title: t.study.couldNotSaveTitle,
          action: resolveErrorAction(error.code),
        });
      } else {
        setCustomCategoryError(t.study.preferencesSavedError);
        toast.error(t.study.preferencesSavedError, {
          title: t.study.couldNotSaveTitle,
        });
      }
    } finally {
      setIsSubmittingCustom(false);
    }
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

    if (isPreferencesBlocked) {
      toast.warning(
        missingCategoriesForGeneration
          ? t.study.generationBlockedCategories
          : t.study.generationBlockedLanguages,
        {
          title: t.study.generationBlockedTitle,
          action: {
            label: t.study.goToPreferencesButton,
            href: "/setup-preferences",
          },
        },
      );
      return;
    }

    if (!selectedLanguage) {
      toast.warning(t.study.errorRequiredLanguage, {
        title: t.study.missingParameterTitle,
      });
      return;
    }
    if (!selectedCategory) {
      toast.warning(t.study.errorRequiredCategory, {
        title: t.study.missingParameterTitle,
      });
      return;
    }
    if (!selectedDifficulty) {
      toast.warning(t.study.errorRequiredDifficulty, {
        title: t.study.missingParameterTitle,
      });
      return;
    }
    if (!selectedSize) {
      toast.warning(t.study.errorRequiredLength, {
        title: t.study.missingParameterTitle,
      });
      return;
    }

    const finalParams: StudyParameters = {
      language: effectiveLanguage,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      size: selectedSize,
    };

    setIsSubmitting(true);
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
        await generateAndOpen(finalParams);
      }
    } catch (error) {
      reportGenerationError(error, finalParams);
    } finally {
      captcha.reset();
      setIsSubmitting(false);
    }
  };

  const generateAndOpen = async (params: StudyParameters): Promise<void> => {
    abortActiveGeneration();
    const controller = new AbortController();
    generationAbortControllerRef.current = controller;
    generationCancelledRef.current = false;

    try {
      const captchaToken = await captcha.execute("reading_generate");
      if (controller.signal.aborted) {
        return;
      }
      const generated = await studyClient.generateReading(params, {
        ...(captchaToken ? { captchaToken } : {}),
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        return;
      }
      const readyMsg = formatMessage(t.study.readingGeneratedSuccess, {
        title: generated.title,
      });
      toast.success(readyMsg, {
        title: t.study.sessionReadyTitle,
      });
      allowNextNavigation();
      router.push(`/readings/${generated.id}`);
    } finally {
      if (generationAbortControllerRef.current === controller) {
        generationAbortControllerRef.current = null;
      }
    }
  };

  const reportGenerationError = (
    error: unknown,
    params: StudyParameters,
  ): void => {
    if (isAbortError(error) || generationCancelledRef.current) {
      return;
    }
    if (!(error instanceof ApiClientError)) {
      toast.error(t.study.generateFailedError, {
        title: t.study.generateFailedTitle,
      });
      return;
    }

    // El backend cancela la generación cuando vence su plazo o el cliente deja de
    // esperar: no se crea la lectura ni se descuenta cuota, así que se puede reintentar.
    const timedOut =
      error.code === ErrorCode.AI_GENERATION_TIMEOUT ||
      error.code === ErrorCode.REQUEST_TIMEOUT;
    if (timedOut) {
      toast.error(resolveErrorMessage(ErrorCode.AI_GENERATION_TIMEOUT, locale), {
        title: t.study.generateFailedTitle,
        action: {
          label: t.study.retryGeneration,
          onClick: () => {
            void retryGeneration(params);
          },
        },
      });
      return;
    }

    toast.error(error.getUserMessage(locale), {
      title: t.study.generateFailedTitle,
      action: resolveErrorAction(error.code),
    });
  };

  const retryGeneration = async (params: StudyParameters): Promise<void> => {
    setIsSubmitting(true);
    try {
      await generateAndOpen(params);
    } catch (error) {
      reportGenerationError(error, params);
    } finally {
      captcha.reset();
      setIsSubmitting(false);
    }
  };

  return {
    locale,
    t,
    captchaContainerRef: captcha.containerRef,
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
    isSubmittingCustom,
    customCategoryName,
    setCustomCategoryName,
    customCategoryError,
    setCustomCategoryError,
    handleAddCustomCategory,
    cancelCustomCategory,
    estimatedTime,
    handleSavePreferences,
    handleSubmit,
  };
}
