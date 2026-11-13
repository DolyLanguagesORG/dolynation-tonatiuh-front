import {
  type CategoriesSettings,
  type LanguagesSettings,
  type ReadingDifficulty,
  type ReadingDto,
  type ReadingOptionsResponse,
  type ReadingSize,
  type ReadingSizeOption,
  type ReadingSubcategory,
  type TargetLanguageCode,
} from "@/lib/api-contracts";
import { readingsService } from "@/lib/services/readings-service";
import { settingsService } from "@/lib/services/settings-service";

export type {
  CategoriesSettings,
  LanguagesSettings,
  ReadingDifficulty,
  ReadingDto,
  ReadingOptionsResponse,
  ReadingSize,
  ReadingSizeOption,
  ReadingSubcategory,
  TargetLanguageCode,
};

export interface CatalogCategory {
  id: string;
  name: string;
  nameEs?: string;
  nameEn?: string;
  subcategories?: ReadingSubcategory[];
  isCustom?: boolean;
}

export interface LanguageOption {
  id: TargetLanguageCode;
  nameEs: string;
  nameEn: string;
}

export interface DifficultyOption {
  id: ReadingDifficulty;
  title: string;
  cefr: string;
  description: string;
  titleEs?: string;
  titleEn?: string;
  descriptionEs?: string;
  descriptionEn?: string;
}

export interface StudyParameters {
  language: TargetLanguageCode;
  category: string;
  difficulty: ReadingDifficulty;
  size: ReadingSize;
}

export const DEFAULT_LANGUAGES: readonly LanguageOption[] = [
  { id: "en", nameEs: "Inglés", nameEn: "English" },
  { id: "fr", nameEs: "Francés", nameEn: "French" },
  { id: "it", nameEs: "Italiano", nameEn: "Italian" },
  { id: "es", nameEs: "Español", nameEn: "Spanish" },
];

export const DEFAULT_CATEGORIES: readonly CatalogCategory[] = [
  {
    id: "technology",
    name: "Technology",
    nameEs: "Tecnología",
    nameEn: "Technology",
  },
  {
    id: "history",
    name: "History",
    nameEs: "Historia",
    nameEn: "History",
  },
  {
    id: "education",
    name: "Education",
    nameEs: "Educación",
    nameEn: "Education",
  },
  {
    id: "programming",
    name: "Programming",
    nameEs: "Programación",
    nameEn: "Programming",
  },
  {
    id: "culture",
    name: "Culture",
    nameEs: "Cultura",
    nameEn: "Culture",
  },
  {
    id: "pop_culture",
    name: "Pop Culture",
    nameEs: "Cultura Pop",
    nameEn: "Pop Culture",
  },
];

export const DEFAULT_DIFFICULTIES: readonly DifficultyOption[] = [
  {
    id: "easy",
    title: "Básico",
    titleEs: "Básico",
    titleEn: "Beginner",
    cefr: "A1 – A2",
    description: "Oraciones directas y vocabulario esencial de uso diario.",
    descriptionEs: "Oraciones directas y vocabulario esencial de uso diario.",
    descriptionEn: "Direct sentences and essential everyday vocabulary.",
  },
  {
    id: "medium",
    title: "Intermedio",
    titleEs: "Intermedio",
    titleEn: "Intermediate",
    cefr: "B1 – B2",
    description:
      "Lectura editorial con matices argumentativos e idiomáticos.",
    descriptionEs:
      "Lectura editorial con matices argumentativos e idiomáticos.",
    descriptionEn: "Editorial reading with idiomatic and argumentative nuance.",
  },
  {
    id: "hard",
    title: "Avanzado",
    titleEs: "Avanzado",
    titleEn: "Advanced",
    cefr: "C1 – C2",
    description:
      "Ensayos densos, terminología especializada y sintaxis compleja.",
    descriptionEs:
      "Ensayos densos, terminología especializada y sintaxis compleja.",
    descriptionEn:
      "Dense essays, specialized terminology, and complex syntax.",
  },
];

export const DEFAULT_SIZES: readonly ReadingSizeOption[] = [
  {
    id: "short",
    label: "Corto",
    wordRange: "120 – 200 palabras",
    readingTime: "~2 min",
  },
  {
    id: "medium",
    label: "Medio",
    wordRange: "250 – 400 palabras",
    readingTime: "~4 min",
  },
  {
    id: "long",
    label: "Largo",
    wordRange: "450 – 700 palabras",
    readingTime: "~7 min",
  },
];

export const DEFAULT_STUDY_PARAMETERS: StudyParameters = {
  language: "en",
  category: "technology",
  difficulty: "medium",
  size: "medium",
};

const STORAGE_PREFIX = "doly_study_prefs_";

function getPrefsStorageKey(userId?: number | string | null): string {
  return `${STORAGE_PREFIX}${userId ?? "guest"}`;
}

function readLocalStudyPreferences(
  userId?: number | string | null,
): StudyParameters | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getPrefsStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudyParameters>;
    return {
      language: parsed.language ?? DEFAULT_STUDY_PARAMETERS.language,
      category: parsed.category ?? DEFAULT_STUDY_PARAMETERS.category,
      difficulty: parsed.difficulty ?? DEFAULT_STUDY_PARAMETERS.difficulty,
      size: parsed.size ?? DEFAULT_STUDY_PARAMETERS.size,
    };
  } catch {
    return null;
  }
}

function writeLocalStudyPreferences(
  params: StudyParameters,
  userId?: number | string | null,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getPrefsStorageKey(userId),
      JSON.stringify(params),
    );
  } catch {
    // Ignoramos errores de cuota del navegador; no contienen información sensible.
  }
}

/**
 * Cliente de apoyo para la configuración de parámetros de estudio.
 * Orquesta llamadas tipadas a `settingsService` y `readingsService` vía BFF (`/api/v1/*`)
 * sin sobrescribir `PUT /settings/languages` al elegir el idioma de una lectura puntual.
 */
export const studyClient = {
  async getReadingOptions(): Promise<ReadingOptionsResponse> {
    const response = await readingsService.getOptions();
    return response.data;
  },

  async getCategoriesSettings(): Promise<CategoriesSettings> {
    const response = await settingsService.getCategories();
    return response.data;
  },

  async updateCategoriesSettings(
    categories: string[],
  ): Promise<CategoriesSettings> {
    const response = await settingsService.updateCategories({ categories });
    return response.data;
  },

  async getLanguageSettings(): Promise<LanguagesSettings> {
    const response = await settingsService.getLanguages();
    return response.data;
  },

  async updateLanguageSettings(
    languages: TargetLanguageCode[],
  ): Promise<LanguagesSettings> {
    const response = await settingsService.updateLanguages({ languages });
    return response.data;
  },

  async reorderLanguageSettings(
    languages: TargetLanguageCode[],
  ): Promise<LanguagesSettings> {
    const response = await settingsService.reorderLanguages({ languages });
    return response.data;
  },

  async unlockLanguageChange(): Promise<LanguagesSettings> {
    const response = await settingsService.unlockLanguageChange();
    return response.data;
  },

  /**
   * Obtiene las preferencias iniciales combinando selección local reciente y las
   * preferencias persistidas en el backend (`/settings/languages`, `/settings/categories`).
   */
  async getStudyPreferences(
    userId?: number | string | null,
  ): Promise<StudyParameters> {
    const localPrefs = readLocalStudyPreferences(userId);
    const resolved: StudyParameters = {
      ...(localPrefs ?? DEFAULT_STUDY_PARAMETERS),
    };

    const [languagesResult, categoriesResult] = await Promise.allSettled([
      settingsService.getLanguages(),
      settingsService.getCategories(),
    ]);

    if (languagesResult.status === "fulfilled") {
      const { active, selected } = languagesResult.value.data;
      const available = active.length > 0 ? active : selected;
      if (available.length > 0 && !available.includes(resolved.language)) {
        resolved.language = available[0];
      }
    }

    if (categoriesResult.status === "fulfilled") {
      const { selected } = categoriesResult.value.data;
      if (!localPrefs?.category && selected.length > 0) {
        resolved.category = selected[0];
      }
    }

    return resolved;
  },

  /**
   * Persiste localmente la combinación actual de estudio sin mutar los idiomas bloqueados
   * del plan en `PUT /settings/languages`.
   */
  async saveStudyPreferences(
    params: StudyParameters,
    userId?: number | string | null,
  ): Promise<StudyParameters> {
    writeLocalStudyPreferences(params, userId);
    return params;
  },

  /**
   * Invoca `POST /readings` con timeout extendido (`AI_TIMEOUT_MS = 110 s`).
   */
  async generateReading(params: StudyParameters): Promise<ReadingDto> {
    const response = await readingsService.generate({
      category: params.category,
      language: params.language,
      difficulty: params.difficulty,
      size: params.size,
    });
    return response.data;
  },

  calculateEstimatedTime(
    size: ReadingSize,
    difficulty: ReadingDifficulty,
  ): number {
    const baseMinutes = size === "short" ? 2 : size === "medium" ? 4 : 7;
    const bonus = difficulty === "hard" ? 2 : difficulty === "medium" ? 1 : 0;
    return baseMinutes + bonus;
  },
};
