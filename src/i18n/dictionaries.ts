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
    glossary: string;
    createAiText: string;
    profileAndProgress: string;
    studentRole: string;
    signIn: string;
    createAccount: string;
    signOut: string;
    signingOut: string;
  };
  footer: {
    brandNotice: string;
    systemStandard: string;
    termsOfUse: string;
    privacyPolicy: string;
    technicalSupport: string;
  };
  auth: {
    topSignIn: string;
    topCreateAccount: string;
    oauthUnavailableTitle: string;
    oauthUnavailableMessage: string;
    passwordRecoveryNoticeTitle: string;
    passwordRecoveryNoticeMessage: string;
    login: {
      title: string;
      subtitle: string;
      googleButton: string;
      divider: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      forgotPasswordLink: string;
      showPasswordAria: string;
      hidePasswordAria: string;
      rememberDeviceLabel: string;
      submitButton: string;
      submittingButton: string;
      noAccountPrompt: string;
      registerLink: string;
      academicTerms: string;
      privacyPolicy: string;
      technicalSupport: string;
      errorBannerTitle: string;
      validationEmailRequired: string;
      validationEmailInvalid: string;
      validationPasswordRequired: string;
    };
    register: {
      title: string;
      subtitle: string;
      googleButton: string;
      divider: string;
      firstNameLabel: string;
      firstNamePlaceholder: string;
      lastNameLabel: string;
      lastNamePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      showPasswordText: string;
      hidePasswordText: string;
      passwordRequirementHint: string;
      passwordStrengthIncomplete: string;
      passwordStrengthAcceptable: string;
      passwordStrengthOptimal: string;
      targetLanguageLabel: string;
      targetLanguageModifiable: string;
      targetLanguages: {
        en: string;
        fr: string;
        es: string;
        it: string;
      };
      termsPrefix: string;
      termsServiceLink: string;
      termsMiddle: string;
      termsEthicsLink: string;
      submitButton: string;
      submittingButton: string;
      hasAccountPrompt: string;
      loginLink: string;
      copyrightNotice: string;
      errorBannerTitle: string;
      validationFirstNameRequired: string;
      validationFirstNameMaxLength: string;
      validationEmailRequired: string;
      validationEmailInvalid: string;
      validationPasswordMinLength: string;
      validationTermsRequired: string;
    };
    stepper: {
      steps: {
        step1: string;
        step2: string;
        step3: string;
        step4: string;
      };
      step2VerifyEmail: {
        title: string;
        subtitle: string;
        pendingBadge: string;
        verifyingBadge: string;
        verifiedBadge: string;
        errorBadge: string;
        sentNotice: string;
        instruction: string;
        verifyingNotice: string;
        tokenInvalidMessage: string;
        emailInputLabel: string;
        emailInputPlaceholder: string;
        resendEmailRequired: string;
        confirmButton: string;
        confirmingButton: string;
        resendButton: string;
        resendingButton: string;
        resendCooldownPrefix: string;
        confirmedSuccessAlert: string;
        resendSuccessAlert: string;
        nextStepButton: string;
        useAnotherAccountButton: string;
      };
      step3Plan: {
        title: string;
        subtitle: string;
        currentSelection: string;
        submitButton: string;
        selectPlanRequired: string;
      };
      step4Languages: {
        title: string;
        subtitle: string;
        capacityDoly: string;
        capacityDolyPlus: string;
        capacityDolyPro: string;
        selectedCountText: string;
        limitReachedAlert: string;
        atLeastOneAlert: string;
        changePlanLink: string;
        selectAllButton: string;
        clearButton: string;
        submitButton: string;
      };
      step4Preferences: {
        title: string;
        subtitle: string;
        languagesSectionTitle: string;
        languagesLockedNotice: string;
        proLanguagesTitle: string;
        proLanguagesDesc: string;
        categoriesSectionTitle: string;
        categoriesSubtitle: string;
        categoriesCounterPrefix: string;
        categoriesMinBadgeMissing: string;
        categoriesMinBadgeReady: string;
        categoriesMinAlert: string;
        categoriesMaxAlertPrefix: string;
        addCustomLabel: string;
        addCustomPlaceholder: string;
        addCustomButton: string;
        saveButton: string;
        cancelButton: string;
        cancelHint: string;
      };
      gate: {
        badge: string;
        title: string;
        subtitle: string;
        description: string;
        cta: string;
        planSummaryTitle: string;
      };
    };
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
    preferencesSetupBadge: string;
    preferencesSetupTitle: string;
    preferencesSetupBody: string;
    preferencesSetupCta: string;
    generationBlockedCta: string;
  };
  study: {
    pageBadge: string;
    pageTitle: string;
    pageSubtitle: string;
    formTitle: string;
    step1Language: string;
    step2Category: string;
    step3Difficulty: string;
    step4Length: string;
    addCategoryPrompt: string;
    addCategoryPlaceholder: string;
    addCategoryButton: string;
    customCategoryBadge: string;
    estimatedTimePrefix: string;
    estimatedMinutes: string;
    savePreferencesButton: string;
    generateButton: string;
    savingNotice: string;
    savedSuccessNotice: string;
    generationReadyNotice: string;
    errorRequiredLanguage: string;
    errorRequiredCategory: string;
    errorRequiredDifficulty: string;
    errorRequiredLength: string;
    emptyCategoriesNotice: string;
    loadingParametersNotice: string;
    generationBlockedTitle: string;
    generationBlockedCategories: string;
    generationBlockedLanguages: string;
    goToPreferencesButton: string;
  };
  profile: {
    eyebrow: string;
    editProfileButton: string;
    saveProfileButton: string;
    cancelEditButton: string;
    fullNameLabel: string;
    memberSincePrefix: string;
    verifiedLevelPrefix: string;
    stats: {
      totalReadings: string;
      totalReadingsUnit: string;
      passedReadings: string;
      passedReadingsUnit: string;
      activeVocabulary: string;
      activeVocabularyUnit: string;
      globalAccuracy: string;
      globalAccuracyUnit: string;
    };
    streakSectionTitle: string;
    streakSubtitle: string;
    dailyGoalLabel: string;
    activityGridTitle: string;
    legendCompleted: string;
    legendRest: string;
    preferencesTitle: string;
    activeLanguagesTitle: string;
    favoriteCategoriesTitle: string;
    selectedCountSuffix: string;
    reorderHint: string;
    movePriorityButton: string;
    savingPreferences: string;
    savedProfileNotice: string;
    savedPreferencesNotice: string;
    minCategoriesNotice: string;
    addCustomCategoryPrompt: string;
    addCustomCategoryPlaceholder: string;
    addCustomCategoryButton: string;
  };
  readings: {
    historyTitle: string;
    historySubtitle: string;
    statusAll: string;
    statusPending: string;
    statusCompleted: string;
    allLanguagesFilter: string;
    allDifficultiesFilter: string;
    searchPlaceholder: string;
    columns: {
      title: string;
      language: string;
      difficulty: string;
      score: string;
      date: string;
      action: string;
    };
    detailAction: string;
    rereadAction: string;
    startReadingAction: string;
    evaluateAction: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyAction: string;
    backToReadings: string;
    estimatedReadUnit: string;
    readingStatusDone: string;
    readingStatusPending: string;
    backToConfigButton: string;
    continueEvaluationButton: string;
    detectedVocabularyTitle: string;
    consultedTermsTitle: string;
    termsSuffix: string;
    aiContextTitle: string;
    suggestedTranslationLabel: string;
    literalMeaningLabel: string;
    meaningInTextLabel: string;
    wordBreakdownTitle: string;
    wordBreakdownNoteLabel: string;
    otherWaysTitle: string;
    otherContextsTitle: string;
    selectionActionLabel: string;
    entryTypeWord: string;
    entryTypePhrase: string;
    cachedBadge: string;
    refreshAnalysisButton: string;
    pronounceButton: string;
    detailedExplanationButton: string;
    saveTermButton: string;
    savedTermButton: string;
    clickWordHint: string;
    loadingContextNotice: string;
    eval: {
      backToReading: string;
      activeSessionBadge: string;
      eyebrow: string;
      title: string;
      readingPrefix: string;
      criteriaTitle: string;
      goalMinWords: string;
      criteriaDescription: string;
      openResponseTitle: string;
      localSavedBadge: string;
      saveDraftButton: string;
      draftSavedNotice: string;
      textareaLabel: string;
      textareaPlaceholder: string;
      minWordsSuffix: string;
      charactersSuffix: string;
      submitButton: string;
      submittingButton: string;
      aiDisclaimer: string;
      minWordsError: string;
      dimensionsTitle: string;
      dimensions: readonly { title: string; description: string }[];
    };
    result: {
      completedBadge: string;
      subtitle: string;
      globalIndexLabel: string;
      passedBadge: string;
      reviewBadge: string;
      breakdownTitle: string;
      dimensionsCount: string;
      strengthsTitle: string;
      improvementsTitle: string;
      integrationSuggestionLabel: string;
      submittedSummaryTitle: string;
      assimilatedTermsTitle: string;
      generateNewButton: string;
      viewCompletedButton: string;
      homeButton: string;
      sessionFooterStandard: string;
    };
  };
  glossary: {
    eyebrow: string;
    title: string;
    subtitle: string;
    tabAll: string;
    tabWords: string;
    tabPhrases: string;
    filterSavedOnly: string;
    filterAllConsultations: string;
    allLanguagesFilter: string;
    searchPlaceholder: string;
    statsTotal: string;
    statsWords: string;
    statsPhrases: string;
    statsSaved: string;
    entryTypeWord: string;
    entryTypePhrase: string;
    savedBadge: string;
    literalLabel: string;
    readingContextLabel: string;
    breakdownLabel: string;
    alternativesLabel: string;
    otherContextsLabel: string;
    sourceReadingLabel: string;
    openReadingButton: string;
    addToGlossaryButton: string;
    removeFromGlossaryButton: string;
    pronounceButton: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyAction: string;
  };
  designSystem: {
    eyebrow: string;
    title: string;
    subtitle: string;
    navLabel: string;
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
      streakLabel: "Racha: 0 días",
    },
    nav: {
      primaryAriaLabel: "Principal",
      newReadingCta: "NUEVA LECTURA",
      home: "Inicio",
      myReadings: "Mis Lecturas",
      glossary: "Glosario",
      createAiText: "Crear Texto IA",
      profileAndProgress: "Perfil y Progreso",
      studentRole: "ESTUDIANTE ACTIVA",
      signIn: "Iniciar sesión",
      createAccount: "Crear cuenta",
      signOut: "Cerrar sesión",
      signingOut: "Cerrando...",
    },
    footer: {
      brandNotice: "DOLYNATION EDITORIAL • PLATAFORMA LINGÜÍSTICA",
      systemStandard: "SISTEMA DE CALIFICACIÓN NORMALIZADO (CEFR / ACTFL)",
      termsOfUse: "TÉRMINOS DE USO",
      privacyPolicy: "PRIVACIDAD",
      technicalSupport: "SOPORTE TÉCNICO",
    },
    auth: {
      topSignIn: "Iniciar sesión",
      topCreateAccount: "Crear cuenta",
      oauthUnavailableTitle: "Autenticación con Google programada",
      oauthUnavailableMessage:
        "El inicio de sesión con proveedores OAuth externos está fuera del alcance de este sprint. Utiliza tu correo electrónico y contraseña.",
      passwordRecoveryNoticeTitle: "Recuperación de contraseña",
      passwordRecoveryNoticeMessage:
        "El flujo de restablecimiento de contraseña por correo electrónico se habilitará en un sprint posterior. Contacta a soporte académico si requieres asistencia.",
      login: {
        title: "Reanudar DolySesion",
        subtitle:
          "Ingresa tus credenciales académicas para sincronizar tu racha activa y lecturas en curso.",
        googleButton: "Continuar con cuenta de Google",
        divider: "O CON CORREO ELECTRÓNICO",
        emailLabel: "Correo electrónico institucional o personal",
        emailPlaceholder: "correo@ejemplo.com",
        passwordLabel: "Contraseña",
        forgotPasswordLink: "¿Olvidaste tu contraseña?",
        showPasswordAria: "Mostrar contraseña",
        hidePasswordAria: "Ocultar contraseña",
        rememberDeviceLabel: "Mantener sesión activa en este dispositivo",
        submitButton: "Iniciar sesión en DolyNation",
        submittingButton: "Verificando credenciales...",
        noAccountPrompt: "¿Aún no tienes una cuenta de estudiante?",
        registerLink: "Regístrate aquí",
        academicTerms: "TÉRMINOS ACADÉMICOS",
        privacyPolicy: "POLÍTICA DE PRIVACIDAD",
        technicalSupport: "SOPORTE TÉCNICO",
        errorBannerTitle: "No se pudo iniciar sesión",
        validationEmailRequired: "Ingresa tu correo electrónico.",
        validationEmailInvalid:
          "Ingresa una dirección de correo electrónico válida.",
        validationPasswordRequired: "Ingresa tu contraseña.",
      },
      register: {
        title: "Crear DolyCuenta",
        subtitle:
          "Comienza a leer textos adaptados por inteligencia artificial según tu nivel lingüístico y objetivos.",
        googleButton: "Registrarse con cuenta de Google",
        divider: "O COMPLETA TU REGISTRO",
        firstNameLabel: "Nombre",
        firstNamePlaceholder: "María",
        lastNameLabel: "Apellidos",
        lastNamePlaceholder: "González",
        emailLabel: "Correo electrónico",
        emailPlaceholder: "estudiante@universidad.edu",
        passwordLabel: "Contraseña de acceso",
        showPasswordText: "MOSTRAR",
        hidePasswordText: "OCULTAR",
        passwordRequirementHint:
          "Mínimo 8 caracteres, al menos un número y símbolo.",
        passwordStrengthIncomplete: "INCOMPLETO",
        passwordStrengthAcceptable: "ACEPTABLE",
        passwordStrengthOptimal: "ÓPTIMO",
        targetLanguageLabel: "Idioma meta de estudio preferente",
        targetLanguageModifiable: "MODIFICABLE EN CUALQUIER MOMENTO",
        targetLanguages: {
          en: "Inglés",
          fr: "Francés",
          es: "Español",
          it: "Italiano",
        },
        termsPrefix: "Acepto los ",
        termsServiceLink: "Términos de Servicio",
        termsMiddle: " y la ",
        termsEthicsLink:
          "Política de Procesamiento Ético de Datos Lingüísticos",
        submitButton: "Crear cuenta y comenzar",
        submittingButton: "Creando cuenta académica...",
        hasAccountPrompt: "¿Ya tienes una cuenta activa?",
        loginLink: "Inicia sesión aquí",
        copyrightNotice:
          "COPYRIGHT DOLYNATION · VERSIÓN ACADÉMICA 2024 · REGISTRO VERIFICADO",
        errorBannerTitle: "No se pudo completar el registro",
        validationFirstNameRequired:
          "Ingresa tu nombre para crear tu expediente académico.",
        validationFirstNameMaxLength:
          "El nombre completo no debe exceder 255 caracteres.",
        validationEmailRequired: "Ingresa tu correo electrónico.",
        validationEmailInvalid:
          "Ingresa una dirección de correo electrónico válida.",
        validationPasswordMinLength:
          "La contraseña debe tener al menos 8 caracteres.",
        validationTermsRequired:
          "Debes aceptar los Términos de Servicio y la Política de Datos para registrarte.",
      },
      stepper: {
        steps: {
          step1: "Datos",
          step2: "Verificar",
          step3: "Plan",
          step4: "Preferencias",
        },
        step2VerifyEmail: {
          title: "Verificación de Correo Electrónico",
          subtitle:
            "Tu cuenta ha sido creada. Enviamos un enlace de confirmación firmado a:",
          pendingBadge: "VALIDACIÓN PENDIENTE",
          verifyingBadge: "VALIDANDO ENLACE",
          verifiedBadge: "CORREO VALIDADO",
          errorBadge: "ENLACE INVÁLIDO",
          sentNotice:
            "Revisa tu bandeja de entrada (y la carpeta de spam) y haz clic en el botón del correo para activar tu cuenta.",
          instruction:
            "Por seguridad, debes confirmar tu correo electrónico mediante el enlace firmado enviado antes de elegir un plan y acceder a la plataforma.",
          verifyingNotice:
            "Validando tu enlace firmado y activando tu sesión segura...",
          tokenInvalidMessage:
            "El enlace de verificación es inválido o ya expiró. Solicita un nuevo correo de confirmación.",
          emailInputLabel: "Correo de la cuenta",
          emailInputPlaceholder: "estudiante@universidad.edu",
          resendEmailRequired:
            "Ingresa tu correo electrónico para reenviar el enlace de confirmación.",
          confirmButton: "Confirmar correo electrónico ✓",
          confirmingButton: "Confirmando correo...",
          resendButton: "Reenviar correo de verificación",
          resendingButton: "Reenviando...",
          resendCooldownPrefix: "Reenviar disponible en",
          confirmedSuccessAlert:
            "¡Correo verificado con éxito! Redirigiendo a la selección de plan...",
          resendSuccessAlert:
            "Se ha enviado un nuevo enlace firmado de confirmación a tu correo.",
          nextStepButton: "Continuar a selección de plan →",
          useAnotherAccountButton:
            "¿Correo incorrecto? Usar otra cuenta o iniciar sesión",
        },
        step3Plan: {
          title: "Selecciona tu Plan de Suscripción",
          subtitle:
            "Elige tu nivel de membresía académica para continuar y configurar tu cuenta.",
          currentSelection: "PLAN SELECCIONADO",
          submitButton: "Confirmar plan y configurar preferencias →",
          selectPlanRequired: "Por favor selecciona un plan para continuar.",
        },
        step4Languages: {
          title: "Idiomas Meta de Estudio",
          subtitle: "Selecciona los idiomas que deseas aprender según tu suscripción activa.",
          capacityDoly: "Plan Dolly: puedes seleccionar 1 idioma meta.",
          capacityDolyPlus: "Plan Dolly Plus: puedes seleccionar hasta 2 idiomas simultáneos.",
          capacityDolyPro: "Plan Dolly Pro: acceso completo a los 4 idiomas disponibles.",
          selectedCountText: "seleccionado(s)",
          limitReachedAlert:
            "Has alcanzado el límite de idiomas de tu suscripción actual. Para aprender más idiomas simultáneamente, actualiza a un plan superior.",
          atLeastOneAlert: "Debes seleccionar al menos 1 idioma para continuar.",
          changePlanLink: "Cambiar plan de suscripción",
          selectAllButton: "Seleccionar todos",
          clearButton: "Limpiar selección",
          submitButton: "Finalizar registro y comenzar a leer →",
        },
        step4Preferences: {
          title: "Configura tus Preferencias de Estudio",
          subtitle:
            "Ajusta tus idiomas y registra al menos 3 categorías temáticas para poder generar lecturas personalizadas.",
          languagesSectionTitle: "01. IDIOMAS DE ESTUDIO SEGÚN TU PLAN",
          languagesLockedNotice:
            "Tu selección de idioma ya está activa en este periodo. Puedes completar o ajustar tus categorías.",
          proLanguagesTitle: "Todos los idiomas desbloqueados automáticamente (Dolly Pro)",
          proLanguagesDesc:
            "Tu suscripción Dolly Pro incluye Español, Inglés, Francés e Italiano listos para practicar. Solo falta registrar tus categorías temáticas.",
          categoriesSectionTitle: "02. CATEGORÍAS TEMÁTICAS (MÍNIMO 3)",
          categoriesSubtitle:
            "Selecciona al menos 3 intereses o agrega los tuyos para habilitar el generador de lecturas con IA.",
          categoriesCounterPrefix: "Mínimo requerido:",
          categoriesMinBadgeMissing: "Faltan categorías para generar lecturas",
          categoriesMinBadgeReady: "Mínimo completo",
          categoriesMinAlert:
            "Debes seleccionar o registrar al menos 3 categorías para guardar y generar lecturas.",
          categoriesMaxAlertPrefix: "Tu plan actual permite hasta",
          addCustomLabel: "Agregar categoría personalizada",
          addCustomPlaceholder: "Ej. Neurociencia, Astronomía, Bioética...",
          addCustomButton: "+ Agregar",
          saveButton: "Guardar preferencias y comenzar →",
          cancelButton: "Cancelar y explorar después",
          cancelHint:
            "Si cancelas ahora podrás navegar por la plataforma, pero no podrás generar lecturas hasta registrar tus idiomas y al menos 3 categorías.",
        },
        gate: {
          badge: "SUSCRIPCIÓN REQUERIDA",
          title: "Selecciona tu plan para desbloquear DolyNation",
          subtitle:
            "Tu cuenta ya está autenticada, pero necesitas seleccionar tu plan de suscripción para acceder a las lecturas y herramientas de la plataforma.",
          description:
            "Como estudiante registrado, elige una de nuestras modalidades de estudio para iniciar tu sesión de lectura contextual.",
          cta: "Seleccionar plan de suscripción →",
          planSummaryTitle: "Planes disponibles:",
        },
      },
    },
    home: {
      welcomeHeading: "Bienvenido de vuelta.",
      welcomeSubtitle:
        "¿Listo para tu sesión de lectura contextual y rigurosa de hoy?",
      streakTitle: "RACHA DE CONSISTENCIA",
      streakDaysSuffix: "días consecutivos",
      streakDailyGoal:
        "Objetivo diario: 20 minutos de análisis contextual cumplido hoy.",
      weeklyLogTitle: "REGISTRO SEMANAL (ÚLTIMOS 7 DÍAS)",
      weekDays: ["L", "M", "X", "J", "V", "S", "D"],
      syntacticRetention: "PRECISIÓN PROMEDIO: —",
      acquiredVocabulary: "TÉRMINOS CONSULTADOS: 0",
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
      preferencesSetupBadge: "CONFIGURACIÓN PENDIENTE",
      preferencesSetupTitle: "Completa tus categorías e idiomas para generar lecturas",
      preferencesSetupBody:
        "Ya cuentas con un plan activo y puedes explorar la plataforma, pero necesitas al menos 3 categorías temáticas (y tus idiomas según tu plan) para generar nuevas lecturas con IA.",
      preferencesSetupCta: "Configurar preferencias (mín. 3 categorías) →",
      generationBlockedCta: "Completa mínimo 3 categorías para generar →",
    },
    study: {
      pageBadge: "LECTURAS CON IA • CONFIGURACIÓN DE ESTUDIO",
      pageTitle: "Configuración y Parámetros de Estudio",
      pageSubtitle:
        "Personaliza el idioma meta, los dominios temáticos de tu interés, el nivel de complejidad CEFR y la extensión del texto antes de iniciar la lectura.",
      formTitle: "GENERAR LECTURA",
      step1Language: "01. IDIOMA META",
      step2Category: "02. DOMINIO TEMÁTICO",
      step3Difficulty: "03. NIVEL DE COMPLEJIDAD LINGÜÍSTICA",
      step4Length: "04. LONGITUD DEL TEXTO",
      addCategoryPrompt: "Añadir tema personalizado",
      addCategoryPlaceholder: "Ej. Neurociencia, Astronomía, Ciberseguridad...",
      addCategoryButton: "+ AÑADIR",
      customCategoryBadge: "PROPIO",
      estimatedTimePrefix: "Tiempo de análisis aproximado: ",
      estimatedMinutes: " minutos",
      savePreferencesButton: "Guardar preferencias",
      generateButton: "GENERAR Y COMENZAR LECTURA",
      savingNotice: "Guardando preferencias...",
      savedSuccessNotice:
        "Preferencias de estudio guardadas y sincronizadas exitosamente.",
      generationReadyNotice:
        "Parámetros de estudio configurados. La invocación del generador IA (front#7) y el visor (front#6) están listos para recibir estos parámetros.",
      errorRequiredLanguage: "Selecciona un idioma meta de aprendizaje.",
      errorRequiredCategory:
        "Selecciona al menos una categoría o temática de estudio.",
      errorRequiredDifficulty:
        "Selecciona un nivel de complejidad lingüística.",
      errorRequiredLength: "Selecciona la longitud deseada del texto.",
      emptyCategoriesNotice: "No hay categorías disponibles en este momento.",
      loadingParametersNotice: "Cargando opciones y preferencias de estudio...",
      generationBlockedTitle: "Generación bloqueada por preferencias incompletas",
      generationBlockedCategories:
        "Debes registrar al menos 3 categorías favoritas en tu cuenta antes de generar nuevas lecturas.",
      generationBlockedLanguages:
        "Debes seleccionar al menos un idioma meta de estudio para tu plan antes de generar lecturas.",
      goToPreferencesButton: "Ir a configurar preferencias →",
    },
    profile: {
      eyebrow: "[EXPEDIENTE ACADÉMICO] / PERFIL & RENDIMIENTO",
      editProfileButton: "EDITAR PERFIL",
      saveProfileButton: "Guardar cambios",
      cancelEditButton: "Cancelar",
      fullNameLabel: "Nombre completo del estudiante",
      memberSincePrefix: "MIEMBRO DESDE:",
      verifiedLevelPrefix: "PLAN ACTIVO:",
      stats: {
        totalReadings: "LECTURAS TOTALES",
        totalReadingsUnit: "textos",
        passedReadings: "LECTURAS APROBADAS",
        passedReadingsUnit: "aprobadas",
        activeVocabulary: "VOCABULARIO ACTIVO",
        activeVocabularyUnit: "términos",
        globalAccuracy: "PRECISIÓN GLOBAL",
        globalAccuracyUnit: "promedio",
      },
      streakSectionTitle: "Racha de Aprendizaje y Constancia",
      streakSubtitle:
        "Actividad sostenida de sesiones de lectura y evaluación contextual en el ciclo actual.",
      dailyGoalLabel: "Objetivo de lectura diaria",
      activityGridTitle: "REGISTRO DE ACTIVIDAD (ÚLTIMAS 4 SEMANAS)",
      legendCompleted: "Completada",
      legendRest: "Descanso",
      preferencesTitle: "Preferencias de Aprendizaje e Intereses",
      activeLanguagesTitle: "IDIOMAS DE PRÁCTICA ACTIVA",
      favoriteCategoriesTitle: "CATEGORÍAS DE INTERÉS FAVORITAS",
      selectedCountSuffix: "seleccionadas",
      reorderHint: "Los textos generados por IA priorizarán estas áreas.",
      movePriorityButton: "Priorizar",
      savingPreferences: "Sincronizando preferencias...",
      savedProfileNotice: "Perfil actualizado correctamente.",
      savedPreferencesNotice: "Preferencias de estudio sincronizadas.",
      minCategoriesNotice:
        "Se requieren mínimo 3 categorías seleccionadas para generar lecturas.",
      addCustomCategoryPrompt: "Agregar categoría propia",
      addCustomCategoryPlaceholder: "Ej. Filosofía, Genética...",
      addCustomCategoryButton: "+ Agregar",
    },
    readings: {
      historyTitle: "Historial de Lecturas",
      historySubtitle:
        "Consulta tus lecturas en curso, textos evaluados, puntuaciones CEFR y retroalimentación.",
      statusAll: "TODAS",
      statusPending: "PENDIENTES",
      statusCompleted: "COMPLETADAS",
      allLanguagesFilter: "TODOS LOS IDIOMAS",
      allDifficultiesFilter: "TODAS LAS DIFICULTADES",
      searchPlaceholder: "Buscar por título o temática...",
      columns: {
        title: "TÍTULO DE LA LECTURA",
        language: "IDIOMA",
        difficulty: "DIFICULTAD",
        score: "COMPRENSIÓN",
        date: "FECHA",
        action: "ACCIÓN",
      },
      detailAction: "DETALLE",
      rereadAction: "RELEER",
      startReadingAction: "LEER",
      evaluateAction: "EVALUAR",
      emptyTitle: "Aún no tienes lecturas registradas con estos filtros",
      emptyDescription:
        "Genera una nueva lectura adaptada por IA o ajusta los filtros de idioma y dificultad.",
      emptyAction: "Crear nueva lectura IA",
      backToReadings: "VOLVER A LECTURAS",
      estimatedReadUnit: "MIN DE LECTURA",
      readingStatusDone: "Lectura evaluada y completada",
      readingStatusPending: "Texto listo para evaluación de comprensión",
      backToConfigButton: "Volver a la configuración",
      continueEvaluationButton: "CONTINUAR CON LA EVALUACIÓN",
      detectedVocabularyTitle: "VOCABULARIO DETECTADO EN ESTA LECTURA",
      consultedTermsTitle: "AYUDAS Y TÉRMINOS CONSULTADOS EN ESTA LECTURA",
      termsSuffix: "Términos clave",
      aiContextTitle: "AYUDA & EXPLICACIÓN • IA",
      suggestedTranslationLabel: "Explicación contextual:",
      literalMeaningLabel: "Sentido literal",
      meaningInTextLabel: "Qué significa en esta lectura",
      wordBreakdownTitle: "Desglose palabra por palabra",
      wordBreakdownNoteLabel: "Función:",
      otherWaysTitle: "Otras formas de decirlo",
      otherContextsTitle: "Otros contextos de uso",
      selectionActionLabel: "Pedir ayuda / Explicar",
      entryTypeWord: "PALABRA",
      entryTypePhrase: "ORACIÓN · EXPRESIÓN",
      cachedBadge: "EN CACHÉ",
      refreshAnalysisButton: "Regenerar ayuda",
      pronounceButton: "Pronunciar",
      detailedExplanationButton: "Profundizar con Tutor IA",
      saveTermButton: "Guardar en glosario",
      savedTermButton: "Guardado en glosario",
      clickWordHint:
        "Haz clic en una palabra o selecciona una frase u oración para ver su desglose y explicación contextual.",
      loadingContextNotice:
        "Generando explicación en el idioma de la lectura...",
      eval: {
        backToReading: "Volver o consultar texto original",
        activeSessionBadge: "• SESIÓN ACTIVA",
        eyebrow: "MÓDULO DE RETENCIÓN",
        title: "Evaluación de Comprensión Contextual",
        readingPrefix: "Lectura:",
        criteriaTitle: "CRITERIOS DE RESPUESTA",
        goalMinWords: "Objetivo: Mínimo 100 palabras",
        criteriaDescription:
          "Redacta un resumen o explicación con tus propias palabras sobre las ideas centrales del texto que acabas de leer. Se evaluará tu comprensión global, uso del léxico contextual y coherencia sintáctica.",
        openResponseTitle: "RESPUESTA ABIERTA",
        localSavedBadge: "Guardado local activo",
        saveDraftButton: "Guardar borrador",
        draftSavedNotice: "Borrador guardado localmente",
        textareaLabel: "Resumen de comprensión",
        textareaPlaceholder:
          "Redacta con tus propias palabras las ideas principales y el argumento central del texto...",
        minWordsSuffix: "/ 100 palabras mín.",
        charactersSuffix: "caracteres",
        submitButton: "Enviar resumen para evaluación por IA",
        submittingButton: "Evaluando comprensión con IA...",
        aiDisclaimer:
          "Tu respuesta será analizada de forma contextual por el modelo de IA de DolyNation.",
        minWordsError:
          "Escribe un resumen más desarrollado (al menos 15 palabras) para obtener una evaluación precisa.",
        dimensionsTitle: "DIMENSIONES DE CALIFICACIÓN CONTEXTUAL",
        dimensions: [
          {
            title: "1. Retención Temática",
            description:
              "Identificación de premisas primarias del autor y síntesis de argumentos centrales.",
          },
          {
            title: "2. Léxico Contextual",
            description:
              "Uso preciso de terminología técnica sin pérdida de coherencia semántica.",
          },
          {
            title: "3. Claridad Sintáctica",
            description:
              "Estructuras oracionales bien ensambladas con transiciones discursivas naturales.",
          },
        ],
      },
      result: {
        completedBadge: "• EVALUACIÓN COMPLETADA",
        subtitle: "Retroalimentación sintética generada a partir de tu resumen presentado.",
        globalIndexLabel: "ÍNDICE GLOBAL DE ASIMILACIÓN",
        passedBadge: "NIVEL DE COMPRENSIÓN: APROBADO",
        reviewBadge: "NIVEL DE COMPRENSIÓN: EN REFUERZO",
        breakdownTitle: "Análisis Desglosado del Desempeño",
        dimensionsCount: "EVALUACIÓN CONTEXTUAL",
        strengthsTitle: "OBSERVACIÓN GENERAL DE LA IA",
        improvementsTitle: "TU RESPUESTA PRESENTADA & REFINAMIENTO",
        integrationSuggestionLabel: "SÍNTESIS EVALUADA:",
        submittedSummaryTitle: "Resumen enviado en la evaluación",
        assimilatedTermsTitle: "TÉRMINOS CLAVE ASIMILADOS",
        generateNewButton: "Generar nueva lectura",
        viewCompletedButton: "Ver mis lecturas completadas",
        homeButton: "Inicio",
        sessionFooterStandard: "SISTEMA DE CALIFICACIÓN NORMALIZADO (CEFR / ACTFL)",
      },
    },
    glossary: {
      eyebrow: "[REPOSITORIO LÉXICO] / GLOSARIO PERSONAL",
      title: "Glosario y Ayudas Contextuales",
      subtitle:
        "Repasa palabras, frases y expresiones explicadas a partir de tus lecturas, con su desglose literal, sentido contextual, alternativas y otros usos.",
      tabAll: "TODO",
      tabWords: "PALABRAS",
      tabPhrases: "ORACIONES Y EXPRESIONES",
      filterSavedOnly: "SOLO GUARDADOS",
      filterAllConsultations: "TODAS LAS CONSULTAS",
      allLanguagesFilter: "TODOS LOS IDIOMAS",
      searchPlaceholder: "Buscar palabra, expresión o contexto...",
      statsTotal: "ENTRADAS",
      statsWords: "PALABRAS",
      statsPhrases: "ORACIONES",
      statsSaved: "GUARDADOS",
      entryTypeWord: "PALABRA",
      entryTypePhrase: "ORACIÓN · EXPRESIÓN",
      savedBadge: "GUARDADO",
      literalLabel: "Sentido literal",
      readingContextLabel: "Explicación en la lectura",
      breakdownLabel: "Desglose palabra por palabra",
      alternativesLabel: "Otras formas de decirlo",
      otherContextsLabel: "Otros contextos de uso",
      sourceReadingLabel: "Lectura de origen:",
      openReadingButton: "Abrir lectura",
      addToGlossaryButton: "Guardar en glosario",
      removeFromGlossaryButton: "Quitar de guardados",
      pronounceButton: "Pronunciar",
      emptyTitle: "Aún no tienes entradas en tu glosario con estos filtros",
      emptyDescription:
        "Abre cualquier lectura, haz clic en una palabra o selecciona una oración para pedir ayuda y guárdala en tu glosario.",
      emptyAction: "Ir a mis lecturas",
    },
    designSystem: {
      eyebrow: "[ARQUITECTURA UI] / BIBLIOTECA ESTANDARIZADA",
      title: "Sistema de Diseño y Componentes Base",
      subtitle:
        "Catálogo oficial de primitivos en Blanco y Negro basados en Flowbite React, Lucide Icons y los tokens editoriales de DolyNation.",
      navLabel: "SISTEMA UI",
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
      streakLabel: "Streak: 0 days",
    },
    nav: {
      primaryAriaLabel: "Primary",
      newReadingCta: "NEW READING",
      home: "Home",
      myReadings: "My Readings",
      glossary: "Glossary",
      createAiText: "Create AI Text",
      profileAndProgress: "Profile & Progress",
      studentRole: "ACTIVE STUDENT",
      signIn: "Sign in",
      createAccount: "Create account",
      signOut: "Sign out",
      signingOut: "Signing out...",
    },
    footer: {
      brandNotice: "DOLYNATION EDITORIAL • LINGUISTIC PLATFORM",
      systemStandard: "STANDARDIZED GRADING SYSTEM (CEFR / ACTFL)",
      termsOfUse: "TERMS OF USE",
      privacyPolicy: "PRIVACY",
      technicalSupport: "TECHNICAL SUPPORT",
    },
    auth: {
      topSignIn: "Sign in",
      topCreateAccount: "Create account",
      oauthUnavailableTitle: "Google authentication scheduled",
      oauthUnavailableMessage:
        "External OAuth provider sign-in is out of scope for this sprint. Please sign in with your email and password.",
      passwordRecoveryNoticeTitle: "Password recovery",
      passwordRecoveryNoticeMessage:
        "Email password reset will be enabled in an upcoming sprint. Contact academic support if you need assistance.",
      login: {
        title: "Resume DolySession",
        subtitle:
          "Enter your academic credentials to sync your active streak and ongoing readings.",
        googleButton: "Continue with Google account",
        divider: "OR WITH EMAIL ADDRESS",
        emailLabel: "Institutional or personal email address",
        emailPlaceholder: "email@example.com",
        passwordLabel: "Password",
        forgotPasswordLink: "Forgot your password?",
        showPasswordAria: "Show password",
        hidePasswordAria: "Hide password",
        rememberDeviceLabel: "Keep session active on this device",
        submitButton: "Sign in to DolyNation",
        submittingButton: "Verifying credentials...",
        noAccountPrompt: "Don't have a student account yet?",
        registerLink: "Register here",
        academicTerms: "ACADEMIC TERMS",
        privacyPolicy: "PRIVACY POLICY",
        technicalSupport: "TECHNICAL SUPPORT",
        errorBannerTitle: "Could not sign in",
        validationEmailRequired: "Please enter your email address.",
        validationEmailInvalid: "Please enter a valid email address.",
        validationPasswordRequired: "Please enter your password.",
      },
      register: {
        title: "Create DolyAccount",
        subtitle:
          "Start reading texts adapted by artificial intelligence to your linguistic level and goals.",
        googleButton: "Register with Google account",
        divider: "OR COMPLETE YOUR REGISTRATION",
        firstNameLabel: "First name",
        firstNamePlaceholder: "Maria",
        lastNameLabel: "Last name",
        lastNamePlaceholder: "Gonzalez",
        emailLabel: "Email address",
        emailPlaceholder: "student@university.edu",
        passwordLabel: "Access password",
        showPasswordText: "SHOW",
        hidePasswordText: "HIDE",
        passwordRequirementHint:
          "Minimum 8 characters, at least one number and symbol.",
        passwordStrengthIncomplete: "INCOMPLETE",
        passwordStrengthAcceptable: "ACCEPTABLE",
        passwordStrengthOptimal: "OPTIMAL",
        targetLanguageLabel: "Preferred target study language",
        targetLanguageModifiable: "MODIFIABLE AT ANY TIME",
        targetLanguages: {
          en: "English",
          fr: "French",
          es: "Spanish",
          it: "Italian",
        },
        termsPrefix: "I accept the ",
        termsServiceLink: "Terms of Service",
        termsMiddle: " and the ",
        termsEthicsLink: "Ethical Linguistic Data Processing Policy",
        submitButton: "Create account and start",
        submittingButton: "Creating academic account...",
        hasAccountPrompt: "Already have an active account?",
        loginLink: "Sign in here",
        copyrightNotice:
          "COPYRIGHT DOLYNATION · ACADEMIC EDITION 2024 · VERIFIED REGISTRATION",
        errorBannerTitle: "Could not complete registration",
        validationFirstNameRequired:
          "Please enter your first name to create your academic record.",
        validationFirstNameMaxLength:
          "Full name must not exceed 255 characters.",
        validationEmailRequired: "Please enter your email address.",
        validationEmailInvalid: "Please enter a valid email address.",
        validationPasswordMinLength:
          "Password must be at least 8 characters long.",
        validationTermsRequired:
          "You must accept the Terms of Service and Data Policy to register.",
      },
      stepper: {
        steps: {
          step1: "Details",
          step2: "Verify",
          step3: "Plan",
          step4: "Preferences",
        },
        step2VerifyEmail: {
          title: "Email Verification",
          subtitle:
            "Your academic account has been created. We have sent a signed confirmation link to:",
          pendingBadge: "VERIFICATION PENDING",
          verifyingBadge: "VERIFYING LINK",
          verifiedBadge: "EMAIL VERIFIED",
          errorBadge: "INVALID LINK",
          sentNotice:
            "Please check your inbox (and spam folder) and click the confirmation button inside the email.",
          instruction:
            "For security, you must confirm your email via the signed link before selecting a subscription plan and accessing the platform.",
          verifyingNotice:
            "Validating your signed confirmation link and activating your secure session...",
          tokenInvalidMessage:
            "This verification link is invalid or has expired. Request a new confirmation email below.",
          emailInputLabel: "Account email",
          emailInputPlaceholder: "student@university.edu",
          resendEmailRequired:
            "Enter your email address to resend the confirmation link.",
          confirmButton: "Confirm email address ✓",
          confirmingButton: "Confirming...",
          resendButton: "Resend verification email",
          resendingButton: "Resending...",
          resendCooldownPrefix: "Resend available in",
          confirmedSuccessAlert:
            "Email verified successfully! Redirecting to plan selection...",
          resendSuccessAlert:
            "A new signed verification link has been sent to your email address.",
          nextStepButton: "Continue to plan selection →",
          useAnotherAccountButton:
            "Wrong email? Use another account or sign in",
        },
        step3Plan: {
          title: "Select Your Subscription Plan",
          subtitle:
            "Choose your academic membership tier to continue and configure your study account.",
          currentSelection: "SELECTED PLAN",
          submitButton: "Confirm plan & configure preferences →",
          selectPlanRequired: "Please select a plan to continue.",
        },
        step4Languages: {
          title: "Target Study Languages",
          subtitle: "Choose the languages you want to study based on your active plan.",
          capacityDoly: "Dolly Plan: you can select 1 target language.",
          capacityDolyPlus: "Dolly Plus: you can select up to 2 simultaneous languages.",
          capacityDolyPro: "Dolly Pro: full access to all 4 available languages.",
          selectedCountText: "selected",
          limitReachedAlert:
            "You have reached the language limit for your plan. Upgrade your plan to learn more languages simultaneously.",
          atLeastOneAlert: "Please select at least 1 language to continue.",
          changePlanLink: "Change subscription plan",
          selectAllButton: "Select all",
          clearButton: "Clear selection",
          submitButton: "Finish registration & start reading →",
        },
        step4Preferences: {
          title: "Configure Your Study Preferences",
          subtitle:
            "Select your target languages and at least 3 thematic categories to enable personalized reading generation.",
          languagesSectionTitle: "01. STUDY LANGUAGES FOR YOUR PLAN",
          languagesLockedNotice:
            "Your language selection is already active for this cycle. You can finish or update your categories below.",
          proLanguagesTitle: "All languages unlocked automatically (Dolly Pro)",
          proLanguagesDesc:
            "Your Dolly Pro plan already includes Spanish, English, French, and Italian ready to practice. You only need to pick your categories.",
          categoriesSectionTitle: "02. THEMATIC CATEGORIES (MINIMUM 3)",
          categoriesSubtitle:
            "Choose at least 3 interests or add your own custom topics to unlock the AI reading generator.",
          categoriesCounterPrefix: "Minimum required:",
          categoriesMinBadgeMissing: "More categories needed to generate readings",
          categoriesMinBadgeReady: "Minimum reached",
          categoriesMinAlert:
            "You must select or add at least 3 categories to save and generate readings.",
          categoriesMaxAlertPrefix: "Your current plan allows up to",
          addCustomLabel: "Add custom category",
          addCustomPlaceholder: "E.g. Neuroscience, Astronomy, Bioethics...",
          addCustomButton: "+ Add",
          saveButton: "Save preferences & start reading →",
          cancelButton: "Cancel & explore later",
          cancelHint:
            "If you cancel now you can browse the platform, but reading generation remains locked until you configure languages and at least 3 categories.",
        },
        gate: {
          badge: "SUBSCRIPTION REQUIRED",
          title: "Select your plan to unlock DolyNation",
          subtitle:
            "Your account is authenticated, but you need to select a subscription plan before accessing readings and platform tools.",
          description:
            "As a registered student, select a plan below to start your contextual reading session.",
          cta: "Select subscription plan →",
          planSummaryTitle: "Available plans:",
        },
      },
    },
    home: {
      welcomeHeading: "Welcome back.",
      welcomeSubtitle:
        "Ready for your rigorous contextual reading session today?",
      streakTitle: "CONSISTENCY STREAK",
      streakDaysSuffix: "consecutive days",
      streakDailyGoal:
        "Daily goal: 20 minutes of contextual analysis completed today.",
      weeklyLogTitle: "WEEKLY LOG (LAST 7 DAYS)",
      weekDays: ["M", "T", "W", "T", "F", "S", "S"],
      syntacticRetention: "AVERAGE ACCURACY: —",
      acquiredVocabulary: "LOOKED-UP TERMS: 0",
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
      preferencesSetupBadge: "SETUP PENDING",
      preferencesSetupTitle: "Complete your categories and languages to generate readings",
      preferencesSetupBody:
        "Your subscription is active and you can browse the platform, but you need at least 3 thematic categories (and languages for your plan) before generating new AI readings.",
      preferencesSetupCta: "Configure preferences (min. 3 categories) →",
      generationBlockedCta: "Add at least 3 categories to generate →",
    },
    study: {
      pageBadge: "AI READINGS • STUDY CONFIGURATION",
      pageTitle: "Study Configuration & Parameters",
      pageSubtitle:
        "Customize target language, thematic domains, CEFR complexity tier, and text length prior to reading generation.",
      formTitle: "GENERATE READING",
      step1Language: "01. TARGET LANGUAGE",
      step2Category: "02. THEMATIC DOMAIN",
      step3Difficulty: "03. LINGUISTIC COMPLEXITY LEVEL",
      step4Length: "04. TEXT LENGTH",
      addCategoryPrompt: "Add custom topic",
      addCategoryPlaceholder: "E.g. Neuroscience, Astronomy, Cybersecurity...",
      addCategoryButton: "+ ADD",
      customCategoryBadge: "CUSTOM",
      estimatedTimePrefix: "Estimated analysis time: ",
      estimatedMinutes: " minutes",
      savePreferencesButton: "Save preferences",
      generateButton: "GENERATE & START READING",
      savingNotice: "Saving preferences...",
      savedSuccessNotice:
        "Study preferences saved and synced successfully.",
      generationReadyNotice:
        "Study parameters configured. AI generation (front#7) and reader viewer (front#6) are ready to consume these parameters.",
      errorRequiredLanguage: "Please select a target language.",
      errorRequiredCategory:
        "Please select at least one study domain or topic.",
      errorRequiredDifficulty:
        "Please select a linguistic complexity level.",
      errorRequiredLength: "Please select a text length option.",
      emptyCategoriesNotice: "No categories currently available.",
      loadingParametersNotice: "Loading options and study preferences...",
      generationBlockedTitle: "Reading generation locked until setup is complete",
      generationBlockedCategories:
        "You must register at least 3 favorite categories in your account before generating new readings.",
      generationBlockedLanguages:
        "You must select at least one study language for your plan before generating readings.",
      goToPreferencesButton: "Go to setup preferences →",
    },
    profile: {
      eyebrow: "[ACADEMIC RECORD] / PROFILE & PERFORMANCE",
      editProfileButton: "EDIT PROFILE",
      saveProfileButton: "Save changes",
      cancelEditButton: "Cancel",
      fullNameLabel: "Student full name",
      memberSincePrefix: "MEMBER SINCE:",
      verifiedLevelPrefix: "ACTIVE PLAN:",
      stats: {
        totalReadings: "TOTAL READINGS",
        totalReadingsUnit: "texts",
        passedReadings: "PASSED READINGS",
        passedReadingsUnit: "passed",
        activeVocabulary: "ACTIVE VOCABULARY",
        activeVocabularyUnit: "terms",
        globalAccuracy: "GLOBAL ACCURACY",
        globalAccuracyUnit: "average",
      },
      streakSectionTitle: "Learning Streak & Consistency",
      streakSubtitle:
        "Sustained reading and contextual comprehension sessions across the current cycle.",
      dailyGoalLabel: "Daily reading goal",
      activityGridTitle: "ACTIVITY LOG (LAST 4 WEEKS)",
      legendCompleted: "Completed",
      legendRest: "Rest",
      preferencesTitle: "Learning Preferences & Interests",
      activeLanguagesTitle: "ACTIVE PRACTICE LANGUAGES",
      favoriteCategoriesTitle: "FAVORITE INTEREST CATEGORIES",
      selectedCountSuffix: "selected",
      reorderHint: "AI-generated texts will prioritize these topics.",
      movePriorityButton: "Prioritize",
      savingPreferences: "Syncing preferences...",
      savedProfileNotice: "Profile updated successfully.",
      savedPreferencesNotice: "Study preferences synced.",
      minCategoriesNotice:
        "A minimum of 3 selected categories is required to generate readings.",
      addCustomCategoryPrompt: "Add custom category",
      addCustomCategoryPlaceholder: "E.g. Philosophy, Genetics...",
      addCustomCategoryButton: "+ Add",
    },
    readings: {
      historyTitle: "Reading History",
      historySubtitle:
        "Review your ongoing readings, evaluated texts, CEFR scores, and AI feedback.",
      statusAll: "ALL",
      statusPending: "PENDING",
      statusCompleted: "COMPLETED",
      allLanguagesFilter: "ALL LANGUAGES",
      allDifficultiesFilter: "ALL DIFFICULTIES",
      searchPlaceholder: "Search by title or topic...",
      columns: {
        title: "READING TITLE",
        language: "LANGUAGE",
        difficulty: "DIFFICULTY",
        score: "COMPREHENSION",
        date: "DATE",
        action: "ACTION",
      },
      detailAction: "DETAIL",
      rereadAction: "REREAD",
      startReadingAction: "READ",
      evaluateAction: "EVALUATE",
      emptyTitle: "No readings match these filters yet",
      emptyDescription:
        "Generate a new AI-tailored reading or clear your language and difficulty filters.",
      emptyAction: "Create new AI reading",
      backToReadings: "BACK TO READINGS",
      estimatedReadUnit: "MIN READ",
      readingStatusDone: "Reading evaluated and completed",
      readingStatusPending: "Text ready for comprehension evaluation",
      backToConfigButton: "Back to configuration",
      continueEvaluationButton: "CONTINUE TO EVALUATION",
      detectedVocabularyTitle: "DETECTED VOCABULARY IN THIS READING",
      consultedTermsTitle: "CONSULTED HELP & KEY TERMS IN THIS READING",
      termsSuffix: "Key Terms",
      aiContextTitle: "CONTEXTUAL HELP • AI",
      suggestedTranslationLabel: "Contextual explanation:",
      literalMeaningLabel: "Literal sense",
      meaningInTextLabel: "Meaning in this reading",
      wordBreakdownTitle: "Word-by-word breakdown",
      wordBreakdownNoteLabel: "Role:",
      otherWaysTitle: "Other ways to say it",
      otherContextsTitle: "Used in other contexts",
      selectionActionLabel: "Ask help / Explain",
      entryTypeWord: "WORD",
      entryTypePhrase: "PHRASE · SENTENCE",
      cachedBadge: "CACHED",
      refreshAnalysisButton: "Regenerate help",
      pronounceButton: "Pronounce",
      detailedExplanationButton: "Deepen with AI Tutor",
      saveTermButton: "Save to glossary",
      savedTermButton: "Saved in glossary",
      clickWordHint:
        "Click any word or highlight a phrase or sentence to inspect its word-by-word breakdown and contextual explanation.",
      loadingContextNotice:
        "Generating contextual help in the reading language...",
      eval: {
        backToReading: "Back to original reading text",
        activeSessionBadge: "• ACTIVE SESSION",
        eyebrow: "RETENTION MODULE",
        title: "Contextual Comprehension Evaluation",
        readingPrefix: "Reading:",
        criteriaTitle: "RESPONSE CRITERIA",
        goalMinWords: "Target: Minimum 100 words",
        criteriaDescription:
          "Write a summary or explanation in your own words covering the central ideas of the reading. Global comprehension, contextual vocabulary usage, and syntactic coherence will be evaluated.",
        openResponseTitle: "OPEN RESPONSE",
        localSavedBadge: "Local autosave active",
        saveDraftButton: "Save draft",
        draftSavedNotice: "Draft saved locally",
        textareaLabel: "Comprehension summary",
        textareaPlaceholder:
          "Write in your own words the main ideas and central argument of the text...",
        minWordsSuffix: "/ 100 words min.",
        charactersSuffix: "characters",
        submitButton: "Submit summary for AI evaluation",
        submittingButton: "Evaluating comprehension with AI...",
        aiDisclaimer:
          "Your response will be analyzed contextually by the DolyNation AI model.",
        minWordsError:
          "Write a slightly longer summary (at least 15 words) to receive an accurate evaluation.",
        dimensionsTitle: "CONTEXTUAL GRADING DIMENSIONS",
        dimensions: [
          {
            title: "1. Thematic Retention",
            description:
              "Identification of the author's primary premises and synthesis of central arguments.",
          },
          {
            title: "2. Contextual Lexicon",
            description:
              "Accurate use of domain terminology without losing semantic coherence.",
          },
          {
            title: "3. Syntactic Clarity",
            description:
              "Well-structured sentences connected with natural discourse transitions.",
          },
        ],
      },
      result: {
        completedBadge: "• EVALUATION COMPLETED",
        subtitle: "Synthetic feedback generated from your submitted summary.",
        globalIndexLabel: "GLOBAL ASSIMILATION INDEX",
        passedBadge: "COMPREHENSION LEVEL: PASSED",
        reviewBadge: "COMPREHENSION LEVEL: NEEDS REVIEW",
        breakdownTitle: "Performance Breakdown Analysis",
        dimensionsCount: "CONTEXTUAL EVALUATION",
        strengthsTitle: "GENERAL AI FEEDBACK",
        improvementsTitle: "YOUR SUBMITTED SUMMARY & REFINEMENT",
        integrationSuggestionLabel: "EVALUATED SUMMARY:",
        submittedSummaryTitle: "Summary submitted for evaluation",
        assimilatedTermsTitle: "ASSIMILATED KEY TERMS",
        generateNewButton: "Generate new reading",
        viewCompletedButton: "View completed readings",
        homeButton: "Home",
        sessionFooterStandard: "STANDARDIZED GRADING SYSTEM (CEFR / ACTFL)",
      },
    },
    glossary: {
      eyebrow: "[LEXICAL REPOSITORY] / PERSONAL GLOSSARY",
      title: "Glossary & Contextual Help",
      subtitle:
        "Review words, phrases, and expressions explained from your readings, complete with literal breakdowns, contextual meaning, alternatives, and other usage scenarios.",
      tabAll: "ALL",
      tabWords: "WORDS",
      tabPhrases: "PHRASES & SENTENCES",
      filterSavedOnly: "SAVED ONLY",
      filterAllConsultations: "ALL CONSULTATIONS",
      allLanguagesFilter: "ALL LANGUAGES",
      searchPlaceholder: "Search word, expression, or context...",
      statsTotal: "ENTRIES",
      statsWords: "WORDS",
      statsPhrases: "PHRASES",
      statsSaved: "SAVED",
      entryTypeWord: "WORD",
      entryTypePhrase: "PHRASE · SENTENCE",
      savedBadge: "SAVED",
      literalLabel: "Literal sense",
      readingContextLabel: "Meaning in reading",
      breakdownLabel: "Word-by-word breakdown",
      alternativesLabel: "Other ways to say it",
      otherContextsLabel: "Used in other contexts",
      sourceReadingLabel: "Source reading:",
      openReadingButton: "Open reading",
      addToGlossaryButton: "Save to glossary",
      removeFromGlossaryButton: "Remove from saved",
      pronounceButton: "Pronounce",
      emptyTitle: "No glossary entries match these filters yet",
      emptyDescription:
        "Open any reading, click a word or highlight a sentence to ask for contextual help, and bookmark it to your glossary.",
      emptyAction: "Go to my readings",
    },
    designSystem: {
      eyebrow: "[UI ARCHITECTURE] / STANDARDIZED LIBRARY",
      title: "Design System & Base Components",
      subtitle:
        "Official Black & White component catalog built on Flowbite React, Lucide Icons, and DolyNation editorial tokens.",
      navLabel: "UI SYSTEM",
    },
  },
};

export function getDictionary(locale: Locale = "es"): Dictionary {
  return dictionaries[locale];
}
