import { httpClient } from "@/lib/http-client";

export type TargetLanguageCode = "en" | "fr" | "es" | "it";
export type ReadingDifficulty = "easy" | "medium" | "hard";
export type ReadingSize = "short" | "medium" | "long";

export interface CatalogCategory {
  id: string;
  name: string;
  subcategories?: string[];
  isCustom?: boolean;
}

export interface ReadingSizeOption {
  id: ReadingSize;
  label: string;
  wordRange: string;
  readingTime: string;
}

export interface DifficultyOption {
  id: ReadingDifficulty;
  title: string;
  cefr: string;
  description: string;
}

export interface StudyParameters {
  language: TargetLanguageCode;
  category: string;
  difficulty: ReadingDifficulty;
  size: ReadingSize;
}

export interface ReadingDto {
  id: number;
  userId: number;
  title: string;
  description: string;
  content: string;
  category: string | null;
  difficulty: ReadingDifficulty | null;
  wordCount: number | null;
  status: "pending" | "completed";
  score: number | null;
  feedback: string | null;
  userResponse: string | null;
  passed: boolean | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface LanguagesSettingsResponse {
  catalog: { id: string; name: string }[];
  selected: string;
}

export interface CategoriesSettingsResponse {
  catalog: CatalogCategory[];
  selected: string[];
}

export interface ReadingOptionsResponse {
  categories: CatalogCategory[];
  difficulties: ReadingDifficulty[];
  sizes: ReadingSizeOption[];
  cefrLevels: string[];
}

export const DEFAULT_LANGUAGES: readonly {
  id: TargetLanguageCode;
  nameEs: string;
  nameEn: string;
}[] = [
  { id: "en", nameEs: "INGLÉS", nameEn: "ENGLISH" },
  { id: "fr", nameEs: "FRANCÉS", nameEn: "FRENCH" },
  { id: "es", nameEs: "ESPAÑOL", nameEn: "SPANISH" },
  { id: "it", nameEs: "ITALIANO", nameEn: "ITALIAN" },
];

export const DEFAULT_CATEGORIES: readonly CatalogCategory[] = [
  {
    id: "technology",
    name: "Tecnología & Ciencia",
    subcategories: ["Inteligencia Artificial", "Biotecnología", "Exploración Espacial"],
  },
  {
    id: "history",
    name: "Historia & Civilización",
    subcategories: ["Historia Antigua", "Revolución Industrial", "Siglo XX"],
  },
  {
    id: "programming",
    name: "Programación & Software",
    subcategories: ["Arquitectura Web", "Sistemas Distribuidos", "Seguridad"],
  },
  {
    id: "education",
    name: "Educación & Pedagogía",
    subcategories: ["Metodologías Activas", "Neurolingüística", "Políticas Educativas"],
  },
  {
    id: "culture",
    name: "Arte & Cultura",
    subcategories: ["Historia del Arte", "Cinematografía", "Música"],
  },
  {
    id: "pop_culture",
    name: "Cultura Popular",
    subcategories: ["Tendencias Digitales", "Narrativa Transmedia", "Videojuegos"],
  },
  {
    id: "literature",
    name: "Literatura Clásica",
    subcategories: ["Novela del Siglo XIX", "Poesía Romántica", "Teatro Clásico"],
  },
  {
    id: "news",
    name: "Noticias Globales",
    subcategories: ["Geopolítica", "Economía Mundial", "Medio Ambiente"],
  },
  {
    id: "philosophy",
    name: "Filosofía",
    subcategories: ["Ética Contemporánea", "Epistemología", "Filosofía Política"],
  },
  {
    id: "business",
    name: "Negocios & Startups",
    subcategories: ["Finanzas", "Emprendimiento", "Estrategia"],
  },
];

export const DEFAULT_DIFFICULTIES: readonly DifficultyOption[] = [
  {
    id: "easy",
    title: "NIVEL BAJO",
    cefr: "[A1–A2]",
    description: "Estructuras básicas, presentes simples, léxico directo de alta frecuencia.",
  },
  {
    id: "medium",
    title: "NIVEL MEDIO",
    cefr: "[B1–B2]",
    description: "Tiempos compuestos, conectores argumentativos y modismos técnicos.",
  },
  {
    id: "hard",
    title: "NIVEL ALTO",
    cefr: "[C1–C2]",
    description: "Subjuntivo complejo, oraciones subordinadas, vocabulario ensayístico abstracto.",
  },
];

export const DEFAULT_SIZES: readonly ReadingSizeOption[] = [
  {
    id: "short",
    label: "CORTO",
    wordRange: "80–150 palabras",
    readingTime: "~2–3 min",
  },
  {
    id: "medium",
    label: "MEDIO",
    wordRange: "250–400 palabras",
    readingTime: "~5–7 min",
  },
  {
    id: "long",
    label: "LARGO",
    wordRange: "500–800 palabras",
    readingTime: "~8–12 min",
  },
];

const PREFERENCES_STORAGE_KEY_PREFIX = "doly_study_preferences";

/**
 * Cliente para opciones de generación y configuración de estudio (`back#8`, `back#10`).
 * Incluye sincronización remota con endpoints `/api/v1/settings/*` y `/api/v1/readings/options`
 * y fallback resiliente con persistencia local por usuario para desarrollo y modo sin conexión.
 */
export const studyClient = {
  /**
   * Obtiene la configuración de idioma preferente (`GET /api/v1/settings/languages`).
   */
  async getLanguagesSettings(): Promise<LanguagesSettingsResponse> {
    try {
      const response = await httpClient.get<LanguagesSettingsResponse>(
        "/settings/languages",
      );
      if (response.data?.catalog && response.data.selected) {
        return response.data;
      }
    } catch {
      // Degrada a catálogo predeterminado si el endpoint aún no está montado en backend
    }

    return {
      catalog: DEFAULT_LANGUAGES.map((lang) => ({
        id: lang.id,
        name: lang.nameEs,
      })),
      selected: "en",
    };
  },

  /**
   * Actualiza el idioma de estudio en backend (`PUT /api/v1/settings/languages`).
   */
  async updateLanguageSettings(
    language: TargetLanguageCode,
  ): Promise<LanguagesSettingsResponse> {
    try {
      const response = await httpClient.put<LanguagesSettingsResponse>(
        "/settings/languages",
        { language },
      );
      if (response.data) {
        return response.data;
      }
    } catch {
      // Manejo degradado
    }

    return {
      catalog: DEFAULT_LANGUAGES.map((lang) => ({
        id: lang.id,
        name: lang.nameEs,
      })),
      selected: language,
    };
  },

  /**
   * Obtiene las categorías de interés del estudiante (`GET /api/v1/settings/categories`).
   */
  async getCategoriesSettings(): Promise<CategoriesSettingsResponse> {
    try {
      const response = await httpClient.get<CategoriesSettingsResponse>(
        "/settings/categories",
      );
      if (response.data?.catalog && response.data.selected) {
        return response.data;
      }
    } catch {
      // Degrada a catálogo predeterminado si el endpoint aún no está montado
    }

    return {
      catalog: [...DEFAULT_CATEGORIES],
      selected: ["technology"],
    };
  },

  /**
   * Actualiza las categorías seleccionadas en backend (`PUT /api/v1/settings/categories`).
   */
  async updateCategoriesSettings(
    categories: string[],
  ): Promise<CategoriesSettingsResponse> {
    try {
      const response = await httpClient.put<CategoriesSettingsResponse>(
        "/settings/categories",
        { categories },
      );
      if (response.data) {
        return response.data;
      }
    } catch {
      // Manejo degradado
    }

    return {
      catalog: [...DEFAULT_CATEGORIES],
      selected: categories,
    };
  },

  /**
   * Carga opciones globales de lectura (`GET /api/v1/readings/options`).
   */
  async getReadingOptions(): Promise<ReadingOptionsResponse> {
    try {
      const response = await httpClient.get<ReadingOptionsResponse>(
        "/readings/options",
      );
      if (response.data?.difficulties && response.data.sizes) {
        return response.data;
      }
    } catch {
      // Degrada a opciones canónicas
    }

    return {
      categories: [...DEFAULT_CATEGORIES],
      difficulties: ["easy", "medium", "hard"],
      sizes: [...DEFAULT_SIZES],
      cefrLevels: ["A1", "A2", "B1", "B2", "C1", "C2"],
    };
  },

  /**
   * Carga de forma consolidada los parámetros de estudio del estudiante.
   * Prioriza la memoria local del usuario y se sincroniza con los endpoints de settings.
   */
  async getStudyPreferences(
    userId?: string | number,
  ): Promise<StudyParameters> {
    const storageKey = userId
      ? `${PREFERENCES_STORAGE_KEY_PREFIX}_${userId}`
      : `${PREFERENCES_STORAGE_KEY_PREFIX}_guest`;

    let localPrefs: Partial<StudyParameters> | null = null;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          localPrefs = JSON.parse(stored) as Partial<StudyParameters>;
        }
      } catch {
        // Ignora fallos de lectura de localStorage
      }
    }

    // Consulta remota en paralelo sin bloquear la UI
    try {
      const [langRes, catRes] = await Promise.all([
        this.getLanguagesSettings(),
        this.getCategoriesSettings(),
      ]);

      const resolvedLanguage = (localPrefs?.language ||
        (langRes.selected as TargetLanguageCode) ||
        "en") as TargetLanguageCode;

      const resolvedCategory =
        localPrefs?.category ||
        (catRes.selected && catRes.selected[0]) ||
        "technology";

      const resolvedDifficulty = localPrefs?.difficulty || "medium";
      const resolvedSize = localPrefs?.size || "medium";

      const consolidated: StudyParameters = {
        language: resolvedLanguage,
        category: resolvedCategory,
        difficulty: resolvedDifficulty,
        size: resolvedSize,
      };

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(consolidated));
        } catch {
          // Ignora fallos de escritura en almacenamiento
        }
      }

      return consolidated;
    } catch {
      return {
        language: (localPrefs?.language || "en") as TargetLanguageCode,
        category: localPrefs?.category || "technology",
        difficulty: localPrefs?.difficulty || "medium",
        size: localPrefs?.size || "medium",
      };
    }
  },

  /**
   * Persiste la configuración del estudio tanto en backend como en almacenamiento local.
   */
  async saveStudyPreferences(
    parameters: StudyParameters,
    userId?: string | number,
  ): Promise<StudyParameters> {
    const storageKey = userId
      ? `${PREFERENCES_STORAGE_KEY_PREFIX}_${userId}`
      : `${PREFERENCES_STORAGE_KEY_PREFIX}_guest`;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(parameters));
      } catch {
        // Ignora errores locales
      }
    }

    // Guarda en backend si hay sesión
    await Promise.allSettled([
      this.updateLanguageSettings(parameters.language),
      this.updateCategoriesSettings([parameters.category]),
    ]);

    return parameters;
  },

  /**
   * Calcula el tiempo aproximado de análisis y lectura en minutos con base en la dificultad y longitud.
   */
  calculateEstimatedTime(
    difficulty: ReadingDifficulty,
    size: ReadingSize,
  ): string {
    if (size === "short") {
      return difficulty === "easy"
        ? "2–3"
        : difficulty === "medium"
          ? "3–4"
          : "4–5";
    }

    if (size === "long") {
      return difficulty === "easy"
        ? "7–9"
        : difficulty === "medium"
          ? "9–12"
          : "12–15";
    }

    // size === 'medium'
    return difficulty === "easy"
      ? "4–6"
      : difficulty === "medium"
        ? "6–8"
        : "8–10";
  },

  /**
   * Genera una nueva lectura adaptada mediante IA conectando a `POST /api/v1/readings`.
   */
  async generateReading(parameters: StudyParameters): Promise<ReadingDto> {
    const validCategories = [
      "technology",
      "history",
      "education",
      "programming",
      "culture",
      "pop_culture",
    ];

    const categoryPayload = validCategories.includes(parameters.category)
      ? parameters.category
      : "technology";

    const payload = {
      category: categoryPayload,
      difficulty: parameters.difficulty,
      size: parameters.size,
    };

    const response = await httpClient.post<ReadingDto>("/readings", payload);
    if (!response.data) {
      throw new Error("No se recibieron datos de la lectura generada.");
    }
    return response.data;
  },
};
