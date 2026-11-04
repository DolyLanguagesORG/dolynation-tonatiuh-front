export type Locale = "es" | "en";

export interface Dictionary {
  meta: {
    editionBadge: string;
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    savedAnnotations: string;
    settings: string;
    streakLabel: string;
  };
  nav: {
    primaryAriaLabel: string;
    newReadingCta: string;
    home: string;
    myReadings: string;
    createAiText: string;
    profileAndProgress: string;
    studentRole: string;
  };
  footer: {
    brandNotice: string;
    systemStandard: string;
    termsOfUse: string;
    privacyPolicy: string;
    technicalSupport: string;
  };
  home: {
    welcomeHeading: string;
    welcomeSubtitle: string;
    streakTitle: string;
    streakDaysSuffix: string;
    streakDailyGoal: string;
    weeklyLogTitle: string;
    weekDays: readonly [string, string, string, string, string, string, string];
    syntacticRetention: string;
    acquiredVocabulary: string;
    wordsUnit: string;
    generateSectionTitle: string;
    stepTargetLanguage: string;
    stepThematicDomain: string;
    stepComplexityLevel: string;
    estimatedTime: string;
    generateButton: string;
    recentReadingsTitle: string;
    recordsCount: string;
    fullHistoryLink: string;
    searchReadingsLabel: string;
    searchReadingsPlaceholder: string;
    searchReadingsHint: string;
    feedbackButton: string;
    rereadButton: string;
    uiKitTitle: string;
    uiKitSubtitle: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  es: {
    meta: {
      editionBadge: "[ESPAÑOL] ACADÉMICO",
      skipToContent: "Saltar al contenido principal",
      openMenu: "Abrir menú de navegación",
      closeMenu: "Cerrar menú de navegación",
      savedAnnotations: "Anotaciones y glosario guardados",
      settings: "Preferencias de lectura y cuenta",
      streakLabel: "Racha: 14 días",
    },
    nav: {
      primaryAriaLabel: "Principal",
      newReadingCta: "NUEVA LECTURA",
      home: "Inicio",
      myReadings: "Mis Lecturas",
      createAiText: "Crear Texto IA",
      profileAndProgress: "Perfil y Progreso",
      studentRole: "ESTUDIANTE ACTIVA",
    },
    footer: {
      brandNotice: "DOLYNATION EDITORIAL • PLATAFORMA LINGÜÍSTICA",
      systemStandard: "SISTEMA DE CALIFICACIÓN NORMALIZADO (CEFR / ACTFL)",
      termsOfUse: "TÉRMINOS DE USO",
      privacyPolicy: "PRIVACIDAD",
      technicalSupport: "SOPORTE TÉCNICO",
    },
    home: {
      welcomeHeading: "Bienvenido de vuelta, Elena.",
      welcomeSubtitle:
        "¿Listo para tu sesión de lectura contextual y rigurosa de hoy?",
      streakTitle: "RACHA DE CONSISTENCIA",
      streakDaysSuffix: "días consecutivos",
      streakDailyGoal:
        "Objetivo diario: 20 minutos de análisis contextual cumplido hoy.",
      weeklyLogTitle: "REGISTRO SEMANAL (ÚLTIMOS 7 DÍAS)",
      weekDays: ["L", "M", "X", "J", "V", "S", "D"],
      syntacticRetention: "RETENCIÓN SINTÁCTICA: 94.2%",
      acquiredVocabulary: "VOCABULARIO ADQUIRIDO: +38 PALABRAS",
      wordsUnit: "palabras",
      generateSectionTitle: "GENERAR LECTURA",
      stepTargetLanguage: "01. IDIOMA META",
      stepThematicDomain: "02. DOMINIO TEMÁTICO",
      stepComplexityLevel: "03. NIVEL DE COMPLEJIDAD LINGÜÍSTICA",
      estimatedTime: "Tiempo de análisis aproximado: 6–8 minutos",
      generateButton: "GENERAR Y COMENZAR LECTURA",
      recentReadingsTitle: "ÚLTIMAS LECTURAS REALIZADAS",
      recordsCount: "(3 REGISTROS)",
      fullHistoryLink: "HISTORIAL COMPLETO",
      searchReadingsLabel: "Filtrar lecturas recientes por título o idioma",
      searchReadingsPlaceholder: "Ej. Cloud Systems, Francés, Cognición...",
      searchReadingsHint:
        "Busca por título, idioma meta o nivel CEFR dentro de tu historial reciente.",
      feedbackButton: "FEEDBACK",
      rereadButton: "RELEER",
      uiKitTitle: "SISTEMA BASE DE COMPONENTES & ESTADO DEL CLIENTE HTTP",
      uiKitSubtitle:
        "Verificación interactiva de tokens editoriales, estados accesibles (foco, error, deshabilitado) y cliente API.",
    },
  },
  en: {
    meta: {
      editionBadge: "[ENGLISH] ACADEMIC",
      skipToContent: "Skip to main content",
      openMenu: "Open navigation menu",
      closeMenu: "Close navigation menu",
      savedAnnotations: "Saved annotations and glossary",
      settings: "Reading and account preferences",
      streakLabel: "Streak: 14 days",
    },
    nav: {
      primaryAriaLabel: "Primary",
      newReadingCta: "NEW READING",
      home: "Home",
      myReadings: "My Readings",
      createAiText: "Create AI Text",
      profileAndProgress: "Profile & Progress",
      studentRole: "ACTIVE STUDENT",
    },
    footer: {
      brandNotice: "DOLYNATION EDITORIAL • LINGUISTIC PLATFORM",
      systemStandard: "STANDARDIZED GRADING SYSTEM (CEFR / ACTFL)",
      termsOfUse: "TERMS OF USE",
      privacyPolicy: "PRIVACY",
      technicalSupport: "TECHNICAL SUPPORT",
    },
    home: {
      welcomeHeading: "Welcome back, Elena.",
      welcomeSubtitle:
        "Ready for your rigorous contextual reading session today?",
      streakTitle: "CONSISTENCY STREAK",
      streakDaysSuffix: "consecutive days",
      streakDailyGoal:
        "Daily goal: 20 minutes of contextual analysis completed today.",
      weeklyLogTitle: "WEEKLY LOG (LAST 7 DAYS)",
      weekDays: ["M", "T", "W", "T", "F", "S", "S"],
      syntacticRetention: "SYNTACTIC RETENTION: 94.2%",
      acquiredVocabulary: "ACQUIRED VOCABULARY: +38 WORDS",
      wordsUnit: "words",
      generateSectionTitle: "GENERATE READING",
      stepTargetLanguage: "01. TARGET LANGUAGE",
      stepThematicDomain: "02. THEMATIC DOMAIN",
      stepComplexityLevel: "03. LINGUISTIC COMPLEXITY LEVEL",
      estimatedTime: "Estimated analysis time: 6–8 minutes",
      generateButton: "GENERATE & START READING",
      recentReadingsTitle: "RECENT COMPLETED READINGS",
      recordsCount: "(3 RECORDS)",
      fullHistoryLink: "FULL HISTORY",
      searchReadingsLabel: "Filter recent readings by title or language",
      searchReadingsPlaceholder: "E.g. Cloud Systems, French, Cognition...",
      searchReadingsHint:
        "Filter by title, target language, or CEFR level across your recent history.",
      feedbackButton: "FEEDBACK",
      rereadButton: "REREAD",
      uiKitTitle: "BASE COMPONENT SYSTEM & HTTP CLIENT STATUS",
      uiKitSubtitle:
        "Interactive verification of editorial tokens, accessible states (focus, error, disabled), and API client.",
    },
  },
};

export function getDictionary(locale: Locale = "es"): Dictionary {
  return dictionaries[locale];
}
