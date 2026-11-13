import type { BrowserContext, Page, Route } from "@playwright/test";

export type SubscriptionTier = "dolly" | "dolly_plus" | "dolly_pro";
export type TargetLanguageCode = "es" | "en" | "fr" | "it";

export interface MockUserState {
  id: number;
  email: string;
  fullName: string | null;
  subscriptionTier: SubscriptionTier | null;
  currentStreak: number;
  lastStreakDate: string | null;
  emailVerifiedAt: string | null;
  locale: "es" | "en";
  createdAt: string;
}

export interface MockReading {
  id: number;
  userId: number;
  title: string;
  description: string;
  content: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  language: TargetLanguageCode;
  wordCount: number;
  status: "pending" | "completed";
  score: number | null;
  feedback: string | null;
  userResponse: string | null;
  passed: boolean | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface MockGlossaryEntry {
  id: number;
  readingId: number;
  readingTitle: string;
  word: string;
  normalizedWord: string;
  entryType: "word" | "phrase";
  language: TargetLanguageCode;
  difficulty: "easy" | "medium" | "hard";
  context: string | null;
  literalMeaning: string | null;
  explanation: string;
  wordBreakdown: {
    token: string;
    lemma: string;
    partOfSpeech: string;
    literalDefinition: string;
  }[];
  otherWaysToSay: { expression: string; note: string }[];
  otherContexts: { contextLabel: string; explanation: string; example: string }[];
  isSaved: boolean;
  savedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MockBackendConfig {
  emailVerificationRequired?: boolean;
  validVerificationToken?: string;
  validResetToken?: string;
  categoryDailyLimit?: number;
  initialAuthenticated?: boolean;
  initialUser?: Partial<MockUserState>;
  initialSelectedLanguages?: TargetLanguageCode[];
  initialSelectedCategories?: string[];
  initialLastLanguageChangeAt?: string | null;
  initialLanguageChangeCredits?: number;
  initialReadings?: MockReading[];
  initialReadingsCreatedToday?: number;
  initialCategoriesEvaluatedToday?: string[];
}

export const PLAN_CATALOG = [
  {
    id: "dolly",
    name: "Dolly",
    description:
      "Plan inicial enfocado en un idioma con hasta 10 lecturas nuevas al día.",
    maxCategories: 10,
    maxLanguages: 1,
    allowedLanguages: ["es", "en", "fr", "it"] as TargetLanguageCode[],
    dailyReadingsLimit: 10,
    dailyQuestionsLimit: 30,
  },
  {
    id: "dolly_plus",
    name: "Dolly Plus",
    description:
      "Plan intermedio para practicar hasta 2 idiomas simultáneos y 20 lecturas al día.",
    maxCategories: 25,
    maxLanguages: 2,
    allowedLanguages: ["es", "en", "fr", "it"] as TargetLanguageCode[],
    dailyReadingsLimit: 20,
    dailyQuestionsLimit: 80,
  },
  {
    id: "dolly_pro",
    name: "Dolly Pro",
    description:
      "Acceso total sin límites diarios ni restricciones de idioma o categorías.",
    maxCategories: null,
    maxLanguages: 4,
    allowedLanguages: ["es", "en", "fr", "it"] as TargetLanguageCode[],
    dailyReadingsLimit: null,
    dailyQuestionsLimit: null,
  },
] as const;

const PREDEFINED_CATEGORIES = [
  { id: "technology", name: "Tecnología" },
  { id: "history", name: "Historia" },
  { id: "education", name: "Educación" },
  { id: "programming", name: "Programación" },
  { id: "culture", name: "Cultura" },
  { id: "pop_culture", name: "Cultura Pop" },
];

const LANGUAGE_CATALOG: { id: TargetLanguageCode; name: string }[] = [
  { id: "es", name: "Español" },
  { id: "en", name: "Inglés" },
  { id: "fr", name: "Francés" },
  { id: "it", name: "Italiano" },
];

const BLOCKED_CATEGORY_PATTERNS = [
  /ignore\s+previous/i,
  /system\s+prompt/i,
  /porn/i,
  /nsfw/i,
  /fuck/i,
  /shit/i,
  /^(?:asdf|qwer|zxcv|([a-z])\1{4,}|[bcdfghjklmnpqrstvwxyz]{7,})$/i,
];

function jsonResponse(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(body),
  });
}

function errorResponse(
  route: Route,
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return jsonResponse(route, status, {
    message,
    data: null,
    error: { code, message, ...(details ? { details } : {}) },
  });
}

function okResponse(route: Route, data: unknown, status = 200) {
  return jsonResponse(route, status, {
    message: "OK",
    data,
    error: null,
  });
}

export interface MockBackendHandle {
  state: {
    user: MockUserState | null;
    sessionActive: boolean;
    selectedLanguages: TargetLanguageCode[];
    selectedCategories: string[];
    lastLanguageChangeAt: string | null;
    languageChangeCredits: number;
    readings: MockReading[];
    readingsCreatedToday: number;
    categoriesEvaluatedToday: string[];
    explanations: MockGlossaryEntry[];
    requests: { method: string; path: string; body: unknown }[];
  };
  setSessionCookie: (active: boolean) => Promise<void>;
}

/**
 * Instala un simulador stateful completo de `/api/v1/*` sobre `page` y `context`,
 * manteniendo sincronizada la cookie `doly_session` para que `middleware.ts`,
 * `RouteAccessGuard`, `RequireAuth` y `AuthProvider` se comporten como en producción.
 */
export async function attachMockBackend(
  page: Page,
  context: BrowserContext,
  baseURL: string,
  config: MockBackendConfig = {},
): Promise<MockBackendHandle> {
  const emailVerificationRequired = config.emailVerificationRequired ?? true;
  const validVerificationToken =
    config.validVerificationToken ?? "valid-verify-token";
  const validResetToken = config.validResetToken ?? "valid-reset-token";
  const categoryDailyLimit = config.categoryDailyLimit ?? 20;

  const defaultUser: MockUserState = {
    id: 101,
    email: "student@example.com",
    fullName: "Ada Lovelace",
    subscriptionTier: null,
    currentStreak: 3,
    lastStreakDate: "2026-11-13",
    emailVerifiedAt: "2026-11-13T00:00:00.000Z",
    locale: "es",
    createdAt: "2026-11-01T00:00:00.000Z",
    ...config.initialUser,
  };

  let nextReadingId =
    Math.max(100, ...(config.initialReadings ?? []).map((r) => r.id)) + 1;
  let nextExplanationId = 500;

  const state: MockBackendHandle["state"] = {
    user: config.initialAuthenticated ? defaultUser : null,
    sessionActive: Boolean(config.initialAuthenticated),
    selectedLanguages: [...(config.initialSelectedLanguages ?? [])],
    selectedCategories: [...(config.initialSelectedCategories ?? [])],
    lastLanguageChangeAt: config.initialLastLanguageChangeAt ?? null,
    languageChangeCredits: config.initialLanguageChangeCredits ?? 0,
    readings: [...(config.initialReadings ?? [])],
    readingsCreatedToday: config.initialReadingsCreatedToday ?? 0,
    categoriesEvaluatedToday: [...(config.initialCategoriesEvaluatedToday ?? [])],
    explanations: [],
    requests: [],
  };

  const urlObj = new URL(baseURL);

  const setSessionCookie = async (active: boolean) => {
    state.sessionActive = active;
    if (active) {
      await context.addCookies([
        {
          name: "doly_session",
          value: "1",
          domain: urlObj.hostname,
          path: "/",
          httpOnly: false,
          sameSite: "Lax",
        },
      ]);
    } else {
      await context.clearCookies({ name: "doly_session" });
    }
  };

  if (config.initialAuthenticated) {
    await setSessionCookie(true);
  } else {
    await setSessionCookie(false);
  }

  const getActivePlan = () =>
    PLAN_CATALOG.find((p) => p.id === state.user?.subscriptionTier) ?? null;

  const buildLanguagesDto = () => {
    const plan = getActivePlan();
    const maxLanguages = plan?.maxLanguages ?? 1;
    const isUnlimited = plan?.id === "dolly_pro";
    const active = isUnlimited
      ? (["es", "en", "fr", "it"] as TargetLanguageCode[])
      : state.selectedLanguages.slice(0, maxLanguages);
    const now = Date.now();
    const lastMs = state.lastLanguageChangeAt
      ? new Date(state.lastLanguageChangeAt).getTime()
      : null;
    const canChangeFree =
      isUnlimited ||
      lastMs === null ||
      now - lastMs >= 365 * 24 * 60 * 60 * 1000;
    const nextFreeChangeAt =
      !canChangeFree && lastMs !== null
        ? new Date(lastMs + 365 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    return {
      catalog: LANGUAGE_CATALOG,
      selected: [...state.selectedLanguages],
      active,
      maxLanguages,
      canChangeFree,
      nextFreeChangeAt,
      lastLanguageChangeAt: state.lastLanguageChangeAt,
      languageChangeCredits: state.languageChangeCredits,
    };
  };

  const buildSubscriptionDto = () => {
    const plan = getActivePlan();
    return {
      hasSubscription: Boolean(plan),
      tier: plan?.id ?? null,
      plan,
      usage: {
        categoriesCount: state.selectedCategories.length,
        categoriesLimit: plan?.maxCategories ?? null,
        languagesCount: state.selectedLanguages.length,
        languagesLimit: plan?.maxLanguages ?? null,
        readingsCreatedToday: state.readingsCreatedToday,
        readingsLimit: plan?.dailyReadingsLimit ?? null,
        readingsRemainingToday:
          plan?.dailyReadingsLimit == null
            ? null
            : Math.max(0, plan.dailyReadingsLimit - state.readingsCreatedToday),
        questionsAskedToday: 0,
        questionsLimit: plan?.dailyQuestionsLimit ?? null,
        questionsRemainingToday: plan?.dailyQuestionsLimit ?? null,
      },
    };
  };

  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const method = req.method().toUpperCase();
    const reqUrl = new URL(req.url());
    const apiPath = reqUrl.pathname.replace(/^\/api\/v1/, "");

    let parsedBody: unknown = null;
    try {
      const text = req.postData();
      if (text) parsedBody = JSON.parse(text);
    } catch {
      parsedBody = req.postData();
    }
    state.requests.push({ method, path: apiPath, body: parsedBody });

    if (apiPath === "/subscriptions/plans" && method === "GET") {
      return okResponse(route, [...PLAN_CATALOG]);
    }

    if (apiPath === "/auth/register" && method === "POST") {
      const body = (parsedBody ?? {}) as {
        email?: string;
        fullName?: string;
        firstName?: string;
        lastName?: string;
        locale?: "es" | "en";
      };
      const resolvedFullName =
        body.fullName?.trim() ||
        [body.firstName, body.lastName].filter(Boolean).join(" ").trim() ||
        "Nuevo Estudiante";
      state.user = {
        ...defaultUser,
        id: 201,
        email: body.email ?? "new@example.com",
        fullName: resolvedFullName,
        subscriptionTier: null,
        emailVerifiedAt: emailVerificationRequired
          ? null
          : "2026-11-13T00:00:00.000Z",
        locale: body.locale ?? "es",
      };
      state.selectedLanguages = [];
      state.selectedCategories = [];
      await setSessionCookie(!emailVerificationRequired);

      return okResponse(
        route,
        {
          user: state.user,
          authenticated: !emailVerificationRequired,
          emailVerificationRequired,
        },
        201,
      );
    }

    if (apiPath === "/auth/login" && method === "POST") {
      if (!state.user) {
        return errorResponse(
          route,
          401,
          "AUTH_INVALID_CREDENTIALS",
          "Invalid credentials",
        );
      }
      if (emailVerificationRequired && !state.user.emailVerifiedAt) {
        return errorResponse(
          route,
          403,
          "AUTH_EMAIL_NOT_VERIFIED",
          "Debes confirmar tu correo antes de iniciar sesión.",
        );
      }
      await setSessionCookie(true);
      return okResponse(route, {
        user: state.user,
        authenticated: true,
        expiresIn: 300,
      });
    }

    if (apiPath === "/auth/verify-email" && method === "POST") {
      const body = (parsedBody ?? {}) as { token?: string };
      if (!body.token || body.token !== validVerificationToken) {
        return errorResponse(
          route,
          400,
          "AUTH_EMAIL_TOKEN_INVALID",
          "Token de verificación inválido o expirado.",
        );
      }
      state.user = {
        ...(state.user ?? defaultUser),
        emailVerifiedAt: "2026-11-13T01:00:00.000Z",
      };
      await setSessionCookie(true);
      return okResponse(route, {
        emailVerified: true,
        user: state.user,
        authenticated: true,
        expiresIn: 300,
      });
    }

    if (apiPath === "/auth/resend-verification" && method === "POST") {
      return okResponse(route, { emailSent: true });
    }

    if (apiPath === "/auth/forgot-password" && method === "POST") {
      return okResponse(route, { emailSent: true });
    }

    if (apiPath === "/auth/reset-password" && method === "POST") {
      const body = (parsedBody ?? {}) as { token?: string };
      if (!body.token || body.token !== validResetToken) {
        return errorResponse(
          route,
          400,
          "AUTH_EMAIL_TOKEN_INVALID",
          "Enlace inválido o expirado.",
        );
      }
      await setSessionCookie(false);
      return okResponse(route, { passwordUpdated: true });
    }

    if (apiPath === "/auth/refresh" && method === "POST") {
      if (!state.sessionActive) {
        await setSessionCookie(false);
        return errorResponse(
          route,
          401,
          "AUTH_TOKEN_INVALID",
          "Refresh token revoked",
        );
      }
      return okResponse(route, { authenticated: true, expiresIn: 300 });
    }

    if (apiPath === "/auth/logout" && method === "POST") {
      await setSessionCookie(false);
      return okResponse(route, null);
    }

    if (apiPath === "/auth/logout-all" && method === "POST") {
      await setSessionCookie(false);
      return okResponse(route, null);
    }

    if (!state.sessionActive || !state.user) {
      return errorResponse(
        route,
        401,
        "AUTH_UNAUTHORIZED",
        "Authentication required",
      );
    }

    if (apiPath === "/auth/me" && method === "GET") {
      return okResponse(route, state.user);
    }

    if (apiPath === "/user/profile" && method === "GET") {
      return okResponse(route, {
        ...state.user,
        selectedLanguages: [...state.selectedLanguages],
      });
    }

    if (apiPath === "/user/profile" && method === "PATCH") {
      const body = (parsedBody ?? {}) as { fullName?: string };
      state.user = {
        ...state.user,
        fullName: body.fullName ?? state.user.fullName,
      };
      return okResponse(route, {
        ...state.user,
        selectedLanguages: [...state.selectedLanguages],
      });
    }

    if (apiPath === "/user/streak" && method === "GET") {
      const daysParam = Number(reqUrl.searchParams.get("days") ?? "7");
      const windowLength =
        Number.isFinite(daysParam) && daysParam > 0
          ? Math.min(365, Math.floor(daysParam))
          : 7;
      const activeStreak = Math.max(
        0,
        Math.min(windowLength, state.user?.currentStreak ?? 0),
      );
      const days = Array.from({ length: windowLength }, (_, idx) =>
        idx >= windowLength - activeStreak ? 1 : 0,
      );
      return okResponse(route, { days, count: days.length });
    }

    if (apiPath === "/user/subscription" && method === "GET") {
      return okResponse(route, buildSubscriptionDto());
    }

    if (apiPath === "/user/subscription" && method === "POST") {
      const body = (parsedBody ?? {}) as { tier?: SubscriptionTier };
      if (!body.tier || !PLAN_CATALOG.some((p) => p.id === body.tier)) {
        return errorResponse(route, 400, "VALIDATION_ERROR", "Invalid plan");
      }
      state.user = { ...state.user, subscriptionTier: body.tier };
      return okResponse(route, buildSubscriptionDto());
    }

    // All endpoints below require active subscription (T1)
    const activePlan = getActivePlan();
    if (!activePlan) {
      return errorResponse(
        route,
        403,
        "SUBSCRIPTION_REQUIRED",
        "Debes seleccionar un plan antes de usar la plataforma.",
      );
    }

    if (apiPath === "/settings/languages" && method === "GET") {
      return okResponse(route, buildLanguagesDto());
    }

    if (apiPath === "/settings/languages" && method === "PUT") {
      const body = (parsedBody ?? {}) as { languages?: TargetLanguageCode[] };
      const requested = Array.from(new Set(body.languages ?? []));
      if (requested.length === 0) {
        return errorResponse(
          route,
          400,
          "VALIDATION_ERROR",
          "Select at least one language",
        );
      }
      if (requested.length > activePlan.maxLanguages) {
        return errorResponse(
          route,
          400,
          "SUBSCRIPTION_LANGUAGE_LIMIT_EXCEEDED",
          `Plan ${activePlan.name} allows at most ${activePlan.maxLanguages} language(s).`,
        );
      }

      const saved = state.selectedLanguages;
      const nowIso = new Date().toISOString();

      if (saved.length === 0) {
        state.selectedLanguages = requested;
        state.lastLanguageChangeAt = nowIso;
        return okResponse(route, buildLanguagesDto());
      }

      const isUnlimited = activePlan.id === "dolly_pro";
      const removedAnySaved = saved.some((code) => !requested.includes(code));

      if (isUnlimited || !removedAnySaved) {
        state.selectedLanguages = requested;
        if (isUnlimited) {
          state.lastLanguageChangeAt = nowIso;
        }
        return okResponse(route, buildLanguagesDto());
      }

      const dto = buildLanguagesDto();
      if (!dto.canChangeFree && state.languageChangeCredits <= 0) {
        return errorResponse(
          route,
          403,
          "LANGUAGE_CHANGE_LOCKED",
          "Language change requires waiting 365 days or spending 1 unlock credit.",
        );
      }

      if (!dto.canChangeFree) {
        state.languageChangeCredits = Math.max(
          0,
          state.languageChangeCredits - 1,
        );
      }
      state.selectedLanguages = requested;
      state.lastLanguageChangeAt = nowIso;
      return okResponse(route, buildLanguagesDto());
    }

    if (apiPath === "/settings/languages/reorder" && method === "PUT") {
      const body = (parsedBody ?? {}) as { languages?: TargetLanguageCode[] };
      const requested = body.languages ?? [];
      const activeBefore = state.selectedLanguages.slice(
        0,
        activePlan.maxLanguages,
      );
      const activeAfter = requested.slice(0, activePlan.maxLanguages);
      const introducesNewActive = activeAfter.some(
        (lang) => !activeBefore.includes(lang),
      );

      if (introducesNewActive) {
        const dto = buildLanguagesDto();
        if (!dto.canChangeFree && state.languageChangeCredits <= 0) {
          return errorResponse(
            route,
            403,
            "LANGUAGE_CHANGE_LOCKED",
            "Promoting a locked language requires an unlock credit.",
          );
        }
        if (!dto.canChangeFree) {
          state.languageChangeCredits = Math.max(
            0,
            state.languageChangeCredits - 1,
          );
        }
        state.lastLanguageChangeAt = new Date().toISOString();
      }

      state.selectedLanguages = requested;
      return okResponse(route, buildLanguagesDto());
    }

    if (apiPath === "/settings/languages/unlock-change" && method === "POST") {
      state.languageChangeCredits += 1;
      return okResponse(route, buildLanguagesDto());
    }

    if (apiPath === "/settings/categories" && method === "GET") {
      return okResponse(route, {
        catalog: PREDEFINED_CATEGORIES,
        selected: [...state.selectedCategories],
      });
    }

    if (apiPath === "/settings/categories" && method === "PUT") {
      const body = (parsedBody ?? {}) as { categories?: string[] };
      const requested = (body.categories ?? []).map((c) => c.trim()).filter(Boolean);
      if (requested.length < 3) {
        return errorResponse(
          route,
          400,
          "VALIDATION_ERROR",
          "Minimum 3 categories required.",
        );
      }

      const predefinedIds = new Set(PREDEFINED_CATEGORIES.map((c) => c.id));
      for (const category of requested) {
        if (predefinedIds.has(category)) continue;
        if (
          BLOCKED_CATEGORY_PATTERNS.some((pattern) => pattern.test(category))
        ) {
          return errorResponse(
            route,
            400,
            "CATEGORY_MODERATION_REJECTED",
            "La categoría fue rechazada por moderación de contenido.",
          );
        }
        const normalized = category.toLowerCase();
        if (!state.categoriesEvaluatedToday.includes(normalized)) {
          if (state.categoriesEvaluatedToday.length >= categoryDailyLimit) {
            return errorResponse(
              route,
              429,
              "CATEGORY_DAILY_LIMIT_REACHED",
              "Alcanzaste el límite diario de categorías personalizadas.",
            );
          }
          state.categoriesEvaluatedToday.push(normalized);
        }
      }

      state.selectedCategories = requested;
      return okResponse(route, {
        catalog: PREDEFINED_CATEGORIES,
        selected: [...state.selectedCategories],
      });
    }

    if (apiPath === "/readings/options" && method === "GET") {
      const dynamicCats = state.selectedCategories
        .filter((c) => !PREDEFINED_CATEGORIES.some((p) => p.id === c))
        .map((c) => ({ id: c, name: c, subcategories: [], isCustom: true }));
      return okResponse(route, {
        categories: [
          ...dynamicCats,
          ...PREDEFINED_CATEGORIES.map((c) => ({ ...c, subcategories: [] })),
        ],
        difficulties: ["easy", "medium", "hard"],
        sizes: [
          {
            id: "short",
            label: "Corto",
            wordRange: "150–250 palabras",
            readingTime: "~2 min",
          },
          {
            id: "medium",
            label: "Medio",
            wordRange: "300–450 palabras",
            readingTime: "~4 min",
          },
          {
            id: "long",
            label: "Largo",
            wordRange: "500–750 palabras",
            readingTime: "~7 min",
          },
        ],
        cefrLevels: ["A1", "A2", "B1", "B2", "C1", "C2"],
      });
    }

    if (apiPath === "/readings" && method === "POST") {
      const body = (parsedBody ?? {}) as {
        language?: TargetLanguageCode;
        category?: string;
        difficulty?: "easy" | "medium" | "hard";
      };

      const langsDto = buildLanguagesDto();
      if (activePlan.id !== "dolly_pro" && state.selectedLanguages.length === 0) {
        return errorResponse(
          route,
          403,
          "LANGUAGE_NOT_SELECTED",
          "You must select at least one language first.",
        );
      }

      const targetLang = body.language ?? "en";
      if (!langsDto.active.includes(targetLang)) {
        return errorResponse(
          route,
          403,
          "SUBSCRIPTION_LANGUAGE_NOT_ALLOWED",
          "Selected language is not active on your current plan.",
        );
      }

      const pendingCount = state.readings.filter(
        (r) => !r.deletedAt && r.status === "pending",
      ).length;
      if (pendingCount >= 3) {
        return errorResponse(
          route,
          400,
          "READING_PENDING_LIMIT_REACHED",
          "Max 3 pending readings reached.",
        );
      }

      if (
        activePlan.dailyReadingsLimit !== null &&
        state.readingsCreatedToday >= activePlan.dailyReadingsLimit
      ) {
        return errorResponse(
          route,
          429,
          "READING_DAILY_LIMIT_REACHED",
          "Daily reading quota exhausted.",
        );
      }

      state.readingsCreatedToday += 1;
      const id = nextReadingId++;
      const created: MockReading = {
        id,
        userId: state.user.id,
        title: `Academic Study (${targetLang.toUpperCase()} #${id})`,
        description: `Reading about ${body.category ?? "technology"}`,
        content: `Exploration of ${body.category ?? "technology"} written for ${targetLang.toUpperCase()} learners at ${body.difficulty ?? "medium"} level. Comprehension requires synthesizing main principles clearly.`,
        category: body.category ?? "technology",
        difficulty: body.difficulty ?? "medium",
        language: targetLang,
        wordCount: 180,
        status: "pending",
        score: null,
        feedback: null,
        userResponse: null,
        passed: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
      };
      state.readings.unshift(created);
      return okResponse(route, created, 201);
    }

    if (apiPath === "/readings" && method === "GET") {
      const statusFilter = reqUrl.searchParams.get("status");
      const activeReadings = state.readings.filter((r) => !r.deletedAt);
      const filtered = statusFilter
        ? activeReadings.filter((r) => r.status === statusFilter)
        : activeReadings;
      return okResponse(route, filtered);
    }

    if (apiPath === "/readings/pending" && method === "GET") {
      return okResponse(
        route,
        state.readings.filter((r) => !r.deletedAt && r.status === "pending"),
      );
    }

    if (apiPath === "/readings/completed" && method === "GET") {
      return okResponse(
        route,
        state.readings.filter((r) => !r.deletedAt && r.status === "completed"),
      );
    }

    if (apiPath === "/readings/glossary" && method === "GET") {
      return okResponse(route, [...state.explanations]);
    }

    const readingExplainMatch = /^\/readings\/(\d+)\/explanations$/.exec(apiPath);
    if (readingExplainMatch) {
      const readingId = Number(readingExplainMatch[1]);
      if (method === "GET") {
        return okResponse(
          route,
          state.explanations.filter((e) => e.readingId === readingId),
        );
      }
      if (method === "POST") {
        const body = (parsedBody ?? {}) as { word?: string; context?: string };
        const reading =
          state.readings.find((r) => r.id === readingId) ?? state.readings[0];
        const word = body.word ?? "comprehension";
        const expId = nextExplanationId++;
        const entry: MockGlossaryEntry = {
          id: expId,
          readingId,
          readingTitle: reading?.title ?? `Reading #${readingId}`,
          word,
          normalizedWord: word.toLowerCase(),
          entryType: word.includes(" ") ? "phrase" : "word",
          language: reading?.language ?? "en",
          difficulty: reading?.difficulty ?? "medium",
          context: body.context ?? null,
          literalMeaning: `Significado de ${word}`,
          explanation: `Explicación contextual académica de "${word}".`,
          wordBreakdown: [],
          otherWaysToSay: [],
          otherContexts: [],
          isSaved: false,
          savedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.explanations.unshift(entry);
        return okResponse(route, {
          ...entry,
          cached: false,
          reading,
        });
      }
    }

    const glossarySaveMatch =
      /^\/readings\/explanations\/(\d+)\/glossary$/.exec(apiPath);
    if (glossarySaveMatch && method === "PATCH") {
      const expId = Number(glossarySaveMatch[1]);
      const body = (parsedBody ?? {}) as { isSaved?: boolean };
      const target = state.explanations.find((e) => e.id === expId);
      if (!target) {
        return errorResponse(route, 404, "RESOURCE_NOT_FOUND", "Not found");
      }
      target.isSaved = Boolean(body.isSaved);
      target.savedAt = target.isSaved ? new Date().toISOString() : null;
      return okResponse(route, target);
    }

    const readingEvalMatch = /^\/readings\/(\d+)\/evaluate$/.exec(apiPath);
    if (readingEvalMatch && method === "POST") {
      const readingId = Number(readingEvalMatch[1]);
      const body = (parsedBody ?? {}) as { userResponse?: string };
      const reading = state.readings.find((r) => r.id === readingId);
      if (!reading) {
        return errorResponse(route, 404, "RESOURCE_NOT_FOUND", "Not found");
      }
      reading.status = "completed";
      reading.score = 90;
      reading.passed = true;
      reading.feedback = "Excelente comprensión estructural del texto.";
      reading.userResponse = body.userResponse ?? "";
      reading.updatedAt = new Date().toISOString();
      return okResponse(route, {
        score: reading.score,
        passed: true,
        feedback: reading.feedback,
        userResponse: reading.userResponse,
        reading,
      });
    }

    const readingIdMatch = /^\/readings\/(\d+)$/.exec(apiPath);
    if (readingIdMatch) {
      const readingId = Number(readingIdMatch[1]);
      const reading = state.readings.find(
        (r) => r.id === readingId && !r.deletedAt,
      );
      if (!reading) {
        return errorResponse(route, 404, "RESOURCE_NOT_FOUND", "Not found");
      }
      if (method === "GET") {
        return okResponse(route, reading);
      }
      if (method === "DELETE") {
        reading.deletedAt = new Date().toISOString();
        return okResponse(route, null);
      }
    }

    if (apiPath === "/history/summary" && method === "GET") {
      const active = state.readings.filter((r) => !r.deletedAt);
      const completed = active.filter((r) => r.status === "completed");
      return okResponse(route, {
        readings: {
          total: active.length,
          pending: active.filter((r) => r.status === "pending").length,
          completed: completed.length,
          passed: completed.filter((r) => r.passed).length,
          averageScore: completed.length > 0 ? 90 : null,
        },
        recentScores: completed.map((r) => ({
          readingId: r.id,
          title: r.title,
          score: r.score,
          passed: r.passed,
          evaluatedAt: r.updatedAt,
        })),
        wordsLookedUp: state.explanations.length,
      });
    }

    if (apiPath === "/ia/chat" && method === "POST") {
      return okResponse(route, {
        text: "Respuesta académica simulada del tutor DolyNation.",
      });
    }

    return errorResponse(
      route,
      404,
      "RESOURCE_NOT_FOUND",
      `Unmocked route: ${method} ${apiPath}`,
    );
  });

  return { state, setSessionCookie };
}
