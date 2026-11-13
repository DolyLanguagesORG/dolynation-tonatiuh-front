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
  type ReadingDifficulty,
  type ReadingSize,
  type ReadingSizeOption,
  settingsService,
  studyClient,
  type StudyParameters,
  type TargetLanguageCode,
} from "@/lib";

/**
 * Hook que gestiona la carga, validación, guardado y generación de lecturas
 * para el módulo de configuración de estudio.
 */
export function useStudyParameters(
  onGenerate?: (parameters: StudyParameters) => void,
) {
  const router = useRouter();
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

  const [selectedLanguage, setSelectedLanguage] =
    useState<TargetLanguageCode>("en");
  const [selectedCategory, setSelectedCategory] = useState<string>("technology");
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<ReadingDifficulty>("medium");
  const [selectedSize, setSelectedSize] = useState<ReadingSize>("medium");

  const [categories, setCategories] = useState<CatalogCategory[]>([
    ...DEFAULT_CATEGORIES,
  ]);
  const [difficulties] = useState<DifficultyOption[]>([
    ...DEFAULT_DIFFICULTIES,
  ]);
  const [sizes] = useState<ReadingSizeOption[]>([...DEFAULT_SIZES]);

  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryError, setCustomCategoryError] = useState<string | null>(
    null,
  );

  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

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
            ? `Lectura generada con éxito: "${generated.title}". Abriendo visor...`
            : `Reading generated successfully: "${generated.title}". Opening reader...`,
        );
        router.push(`/readings/${generated.id}`);
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

  return {
    locale,
    t,
    activePlanLanguages,
    isLoading,
    isSaving,
    isSubmitting,
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
    setValidationError,
    saveNotice,
    setSaveNotice,
    generationNotice,
    setGenerationNotice,
    handleSavePreferences,
    handleSubmit,
  };
}
