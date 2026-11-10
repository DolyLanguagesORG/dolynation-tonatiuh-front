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
        verifiedBadge: string;
        sentNotice: string;
        instruction: string;
        confirmButton: string;
        confirmingButton: string;
        resendButton: string;
        resendingButton: string;
        confirmedSuccessAlert: string;
        resendSuccessAlert: string;
        nextStepButton: string;
      };
      step3Plan: {
        title: string;
        subtitle: string;
        currentSelection: string;
        planDolyName: string;
        planDolyBadge: string;
        planDolyPrice: string;
        planDolyPeriod: string;
        planDolyDesc: string;
        planDolyFeature1: string;
        planDolyFeature2: string;
        planDolyFeature3: string;
        planDolyPlusName: string;
        planDolyPlusBadge: string;
        planDolyPlusPrice: string;
        planDolyPlusPeriod: string;
        planDolyPlusDesc: string;
        planDolyPlusFeature1: string;
        planDolyPlusFeature2: string;
        planDolyPlusFeature3: string;
        planDolyPlusFeature4: string;
        planDolyVipName: string;
        planDolyVipBadge: string;
        planDolyVipPrice: string;
        planDolyVipPeriod: string;
        planDolyVipDesc: string;
        planDolyVipFeature1: string;
        planDolyVipFeature2: string;
        planDolyVipFeature3: string;
        planDolyVipFeature4: string;
        submitButton: string;
        selectPlanRequired: string;
      };
      step4Languages: {
        title: string;
        subtitle: string;
        capacityDoly: string;
        capacityDolyPlus: string;
        capacityDolyVip: string;
        selectedCountText: string;
        limitReachedAlert: string;
        atLeastOneAlert: string;
        changePlanLink: string;
        selectAllButton: string;
        clearButton: string;
        submitButton: string;
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
        firstNamePlaceholder: "Elena",
        lastNameLabel: "Apellidos",
        lastNamePlaceholder: "Rostova",
        emailLabel: "Correo electrónico",
        emailPlaceholder: "elena.rostova@universidad.edu",
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
          step4: "Idiomas",
        },
        step2VerifyEmail: {
          title: "Verificación de Correo Electrónico",
          subtitle:
            "Tu cuenta ha sido creada exitosamente. Hemos enviado un correo con instrucciones de activación a:",
          pendingBadge: "VALIDACIÓN PENDIENTE",
          verifiedBadge: "CORREO VALIDADO",
          sentNotice: "Revisa tu bandeja de entrada y la carpeta de spam.",
          instruction:
            "Para activar tu sesión y continuar al plan de estudio, haz clic en el botón de confirmación:",
          confirmButton: "Confirmar correo electrónico ✓",
          confirmingButton: "Confirmando correo...",
          resendButton: "Reenviar correo de verificación",
          resendingButton: "Reenviando...",
          confirmedSuccessAlert:
            "¡Correo verificado con éxito! Redirigiendo a la selección de plan...",
          resendSuccessAlert:
            "Se ha enviado un nuevo enlace de confirmación a tu dirección de correo.",
          nextStepButton: "Continuar a selección de plan →",
        },
        step3Plan: {
          title: "Selecciona tu Plan de Suscripción",
          subtitle:
            "Elige el nivel de membresía académica para desbloquear tus lecturas contextuales.",
          currentSelection: "PLAN SELECCIONADO",
          planDolyName: "Doly",
          planDolyBadge: "PLAN BÁSICO",
          planDolyPrice: "Gratis",
          planDolyPeriod: "Acceso esencial",
          planDolyDesc: "Ideal para iniciar el hábito de lectura diaria con 1 idioma meta.",
          planDolyFeature1: "1 idioma de estudio a la vez",
          planDolyFeature2: "Lecturas contextuales adaptadas por nivel CEFR",
          planDolyFeature3: "Registro de racha y evaluaciones de comprensión",
          planDolyPlusName: "Doly Plus",
          planDolyPlusBadge: "RECOMENDADO · INTERMEDIO",
          planDolyPlusPrice: "$9.99",
          planDolyPlusPeriod: "/ mes · Facturación mensual",
          planDolyPlusDesc: "Para estudiantes activos que buscan bilingüismo con análisis profundo.",
          planDolyPlusFeature1: "Hasta 2 idiomas de estudio simultáneos",
          planDolyPlusFeature2: "Generación ilimitada de textos y explicaciones",
          planDolyPlusFeature3: "Análisis de retención sintáctica y feedback CEFR en tiempo real",
          planDolyPlusFeature4: "Acceso a modo literatura y tecnología",
          planDolyVipName: "Doly VIP",
          planDolyVipBadge: "ACCESO TOTAL · MÁXIMO",
          planDolyVipPrice: "$19.99",
          planDolyVipPeriod: "/ mes · Membresía completa",
          planDolyVipDesc: "Acceso total sin límites a todos los idiomas y tutoría IA avanzada.",
          planDolyVipFeature1: "Todos los idiomas disponibles (acceso ilimitado)",
          planDolyVipFeature2: "Ensayos complejos C1–C2 y vocabulario especializado",
          planDolyVipFeature3: "Tutoría conversacional IA y métricas avanzadas de fluidez",
          planDolyVipFeature4: "Soporte académico prioritario y exportación de fichas",
          submitButton: "Confirmar plan y elegir idiomas →",
          selectPlanRequired: "Por favor selecciona un plan para continuar.",
        },
        step4Languages: {
          title: "Idiomas Meta de Estudio",
          subtitle: "Selecciona los idiomas que deseas aprender según tu suscripción activa.",
          capacityDoly: "Plan Doly: puedes seleccionar 1 idioma meta.",
          capacityDolyPlus: "Plan Doly Plus: puedes seleccionar hasta 2 idiomas simultáneos.",
          capacityDolyVip: "Plan Doly VIP: acceso ilimitado a todos los idiomas.",
          selectedCountText: "seleccionado(s)",
          limitReachedAlert:
            "Has alcanzado el límite de idiomas de tu suscripción actual. Para aprender más idiomas simultáneamente, actualiza a un plan superior.",
          atLeastOneAlert: "Debes seleccionar al menos 1 idioma para continuar.",
          changePlanLink: "Cambiar plan de suscripción",
          selectAllButton: "Seleccionar todos",
          clearButton: "Limpiar selección",
          submitButton: "Finalizar registro y comenzar a leer →",
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
        firstNamePlaceholder: "Elena",
        lastNameLabel: "Last name",
        lastNamePlaceholder: "Rostova",
        emailLabel: "Email address",
        emailPlaceholder: "elena.rostova@university.edu",
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
          step4: "Languages",
        },
        step2VerifyEmail: {
          title: "Email Verification",
          subtitle:
            "Your academic account was successfully created. We have sent verification details to:",
          pendingBadge: "VERIFICATION PENDING",
          verifiedBadge: "EMAIL VERIFIED",
          sentNotice: "Please check your inbox and spam folder.",
          instruction:
            "To confirm your account and continue to plan selection, click the confirmation button below:",
          confirmButton: "Confirm email address ✓",
          confirmingButton: "Confirming...",
          resendButton: "Resend verification email",
          resendingButton: "Resending...",
          confirmedSuccessAlert:
            "Email verified successfully! Advancing to subscription plan...",
          resendSuccessAlert:
            "A new verification link has been sent to your email address.",
          nextStepButton: "Continue to plan selection →",
        },
        step3Plan: {
          title: "Select Your Subscription Plan",
          subtitle:
            "Choose your academic membership tier to unlock your contextual reading experience.",
          currentSelection: "SELECTED PLAN",
          planDolyName: "Doly",
          planDolyBadge: "BASIC PLAN",
          planDolyPrice: "Free",
          planDolyPeriod: "Essential academic access",
          planDolyDesc: "Perfect for starting daily reading habits with 1 target language.",
          planDolyFeature1: "1 study language at a time",
          planDolyFeature2: "CEFR-adapted AI contextual readings",
          planDolyFeature3: "Reading streak log and comprehension checks",
          planDolyPlusName: "Doly Plus",
          planDolyPlusBadge: "RECOMMENDED · MID TIER",
          planDolyPlusPrice: "$9.99",
          planDolyPlusPeriod: "/ month · Billed monthly",
          planDolyPlusDesc: "For active learners pursuing bilingualism with in-depth analysis.",
          planDolyPlusFeature1: "Up to 2 simultaneous study languages",
          planDolyPlusFeature2: "Unlimited contextual readings and explanations",
          planDolyPlusFeature3: "Syntactic retention metrics and real-time CEFR feedback",
          planDolyPlusFeature4: "Full access to literature and tech domains",
          planDolyVipName: "Doly VIP",
          planDolyVipBadge: "ALL ACCESS · MAXIMUM TIER",
          planDolyVipPrice: "$19.99",
          planDolyVipPeriod: "/ month · Full membership",
          planDolyVipDesc: "Unlimited multilingual access and advanced AI tutoring.",
          planDolyVipFeature1: "All available languages (unlimited access)",
          planDolyVipFeature2: "Complex C1–C2 essays and specialized lexicon",
          planDolyVipFeature3: "Conversational AI tutoring and real-time fluency tracking",
          planDolyVipFeature4: "Priority support and study deck export",
          submitButton: "Confirm plan & choose languages →",
          selectPlanRequired: "Please select a plan to continue.",
        },
        step4Languages: {
          title: "Target Study Languages",
          subtitle: "Choose the languages you want to study based on your active plan.",
          capacityDoly: "Doly Plan: you can select 1 target language.",
          capacityDolyPlus: "Doly Plus: you can select up to 2 simultaneous languages.",
          capacityDolyVip: "Doly VIP: unlimited access to all languages.",
          selectedCountText: "selected",
          limitReachedAlert:
            "You have reached the language limit for your plan. Upgrade your plan to learn more languages simultaneously.",
          atLeastOneAlert: "Please select at least 1 language to continue.",
          changePlanLink: "Change subscription plan",
          selectAllButton: "Select all",
          clearButton: "Clear selection",
          submitButton: "Finish registration & start reading →",
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
