"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  ApiClientError,
  authService,
  type AuthUser,
  ErrorCode,
  type LanguagesSettings,
  type LoginInput,
  registerAuthLifecycleHandlers,
  type RegisterInput,
  settingsService,
  subscriptionsService,
  type SubscriptionTier,
  type TargetLanguageCode,
  type UserSubscriptionResponse,
} from "@/lib";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Niveles oficiales de suscripción del backend (`dolynation-atl-back`).
 */
export type SubscriptionPlanId = SubscriptionTier;

export interface OnboardingState {
  emailVerified: boolean;
  hasSelectedPlan: boolean;
  subscriptionPlan: SubscriptionPlanId | null;
  selectedLanguages: TargetLanguageCode[];
  isOnboardingComplete: boolean;
}

export type RegisterWithPreferencesInput = RegisterInput;

export interface AuthContextValue {
  user: AuthUser | null;
  subscription: UserSubscriptionResponse | null;
  languagesSettings: LanguagesSettings | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboarding: OnboardingState;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterWithPreferencesInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  reloadAccountState: () => Promise<void>;
  confirmEmailVerification: () => void;
  selectPlan: (plan: SubscriptionPlanId) => Promise<UserSubscriptionResponse>;
  selectLanguages: (
    languages: TargetLanguageCode[],
  ) => Promise<LanguagesSettings>;
  updateOnboardingState: (partial: Partial<OnboardingState>) => void;
}

const SESSION_FLAG_COOKIE_NAME = "doly_session";
const USER_SNAPSHOT_STORAGE_KEY = "doly_user_snapshot";
const EMAIL_VERIFIED_STORAGE_KEY = "doly_email_verified_hint";

const EMPTY_ONBOARDING: OnboardingState = {
  emailVerified: false,
  hasSelectedPlan: false,
  subscriptionPlan: null,
  selectedLanguages: [],
  isOnboardingComplete: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Valida que la ruta de redirección sea interna para prevenir open redirects.
 */
export function sanitizeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/",
): string {
  if (!candidate || typeof candidate !== "string") {
    return fallback;
  }

  const trimmed = candidate.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.origin !== "http://localhost") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

function hasSessionCookieFlag(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie
    .split(";")
    .some((entry) => entry.trim().startsWith(`${SESSION_FLAG_COOKIE_NAME}=1`));
}

/**
 * Persiste únicamente datos públicos de vista en `sessionStorage` para preservar el
 * nombre/correo durante el flujo `/register` previo a elegir plan (ningún token JWT).
 */
function saveUserSnapshot(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      window.sessionStorage.removeItem(USER_SNAPSHOT_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(
      USER_SNAPSHOT_STORAGE_KEY,
      JSON.stringify(user),
    );
  } catch {
    // Sin impacto funcional si sessionStorage no está disponible.
  }
}

function loadUserSnapshot(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(USER_SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    return parsed && typeof parsed.email === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function saveEmailVerifiedHint(email: string, verified: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const normalized = email.trim().toLowerCase();
    if (!verified) {
      window.sessionStorage.removeItem(EMAIL_VERIFIED_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(EMAIL_VERIFIED_STORAGE_KEY, normalized);
  } catch {
    // Sin impacto funcional si sessionStorage no está disponible.
  }
}

function isEmailVerifiedInSession(email?: string | null): boolean {
  if (typeof window === "undefined" || !email) return false;
  try {
    return (
      window.sessionStorage.getItem(EMAIL_VERIFIED_STORAGE_KEY) ===
      email.trim().toLowerCase()
    );
  } catch {
    return false;
  }
}

function clearBrowserSessionHints(): void {
  saveUserSnapshot(null);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(EMAIL_VERIFIED_STORAGE_KEY);
    } catch {
      // Ignorado intencionalmente.
    }
  }
  if (typeof document !== "undefined") {
    document.cookie = `${SESSION_FLAG_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] =
    useState<UserSubscriptionResponse | null>(null);
  const [languagesSettings, setLanguagesSettings] =
    useState<LanguagesSettings | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [onboarding, setOnboarding] =
    useState<OnboardingState>(EMPTY_ONBOARDING);

  const isBootstrappedRef = useRef(false);

  const clearSessionState = useCallback((): void => {
    clearBrowserSessionHints();
    setUser(null);
    setSubscription(null);
    setLanguagesSettings(null);
    setOnboarding(EMPTY_ONBOARDING);
    setStatus("unauthenticated");
  }, []);

  /**
   * Carga suscripción e idiomas actuales cuando el usuario ya cuenta con un plan activo.
   */
  const syncSubscriptionAndLanguages = useCallback(
    async (
      authenticatedUser: AuthUser,
      options?: { assumeEmailVerified?: boolean },
    ): Promise<void> => {
      const [subResult, langResult] = await Promise.allSettled([
        subscriptionsService.getCurrentSubscription(),
        settingsService.getLanguages(),
      ]);

      const nextSubscription =
        subResult.status === "fulfilled" ? subResult.value.data : null;
      const nextLanguages =
        langResult.status === "fulfilled" ? langResult.value.data : null;

      setSubscription(nextSubscription);
      setLanguagesSettings(nextLanguages);

      const resolvedTier =
        nextSubscription?.tier ?? authenticatedUser.subscriptionTier ?? null;
      const selectedLanguages = nextLanguages?.selected ?? [];
      const hasSelectedPlan = Boolean(resolvedTier);
      const emailVerified =
        hasSelectedPlan ||
        Boolean(options?.assumeEmailVerified) ||
        isEmailVerifiedInSession(authenticatedUser.email);

      setOnboarding({
        emailVerified,
        hasSelectedPlan,
        subscriptionPlan: resolvedTier,
        selectedLanguages,
        isOnboardingComplete: hasSelectedPlan && selectedLanguages.length > 0,
      });
    },
    [],
  );

  const applyAuthenticatedUser = useCallback(
    async (
      authenticatedUser: AuthUser,
      options?: { isNewRegistration?: boolean },
    ): Promise<void> => {
      setUser(authenticatedUser);
      saveUserSnapshot(authenticatedUser);
      setStatus("authenticated");

      if (authenticatedUser.subscriptionTier) {
        await syncSubscriptionAndLanguages(authenticatedUser, {
          assumeEmailVerified: !options?.isNewRegistration,
        });
        return;
      }

      setSubscription(null);
      setLanguagesSettings(null);

      const emailVerified = options?.isNewRegistration
        ? false
        : isEmailVerifiedInSession(authenticatedUser.email);

      setOnboarding({
        emailVerified,
        hasSelectedPlan: false,
        subscriptionPlan: null,
        selectedLanguages: [],
        isOnboardingComplete: false,
      });
    },
    [syncSubscriptionAndLanguages],
  );

  const reloadAccountState = useCallback(async (): Promise<void> => {
    try {
      const meResponse = await authService.me();
      await applyAuthenticatedUser(meResponse.data);
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.code === ErrorCode.SUBSCRIPTION_REQUIRED
      ) {
        // Sesión autenticada pero aún sin plan en el Paso 3 del registro.
        const snapshot = loadUserSnapshot();
        const email = snapshot?.email ?? user?.email ?? null;
        setUser(snapshot ? { ...snapshot, subscriptionTier: null } : user);
        setSubscription(null);
        setLanguagesSettings(null);
        setStatus("authenticated");
        setOnboarding({
          emailVerified: isEmailVerifiedInSession(email),
          hasSelectedPlan: false,
          subscriptionPlan: null,
          selectedLanguages: [],
          isOnboardingComplete: false,
        });
        return;
      }

      if (error instanceof ApiClientError && error.isUnauthorized) {
        clearSessionState();
        return;
      }

      throw error;
    }
  }, [applyAuthenticatedUser, clearSessionState, user]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authService.refresh();
      return Boolean(response.data?.authenticated);
    } catch {
      clearSessionState();
      return false;
    }
  }, [clearSessionState]);

  useEffect(() => {
    registerAuthLifecycleHandlers({
      onRefresh: refreshSession,
      onUnauthorized: clearSessionState,
    });

    return () => {
      registerAuthLifecycleHandlers({
        onRefresh: null,
        onUnauthorized: null,
      });
    };
  }, [refreshSession, clearSessionState]);

  // Hidratación inicial de sesión desde cookies `HttpOnly` a través del proxy BFF
  useEffect(() => {
    if (isBootstrappedRef.current) return;
    isBootstrappedRef.current = true;

    const bootstrapSession = async (): Promise<void> => {
      if (!hasSessionCookieFlag()) {
        clearSessionState();
        return;
      }

      try {
        await reloadAccountState();
      } catch {
        clearSessionState();
      }
    };

    void bootstrapSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (input: LoginInput): Promise<AuthUser> => {
      const response = await authService.login({
        email: input.email.trim(),
        password: input.password,
      });

      const loggedUser = response.data.user;
      if (!loggedUser.subscriptionTier) {
        // Usuario existente que vuelve antes de finalizar plan: conserva su acceso directo a planes
        saveEmailVerifiedHint(loggedUser.email, true);
      }

      await applyAuthenticatedUser(loggedUser);
      return loggedUser;
    },
    [applyAuthenticatedUser],
  );

  const register = useCallback(
    async (input: RegisterWithPreferencesInput): Promise<AuthUser> => {
      const response = await authService.register({
        email: input.email.trim(),
        password: input.password,
        fullName: input.fullName.trim(),
      });

      const createdUser = response.data.user;
      saveEmailVerifiedHint(createdUser.email, false);
      await applyAuthenticatedUser(createdUser, { isNewRegistration: true });
      return createdUser;
    },
    [applyAuthenticatedUser],
  );

  const confirmEmailVerification = useCallback((): void => {
    if (user?.email) {
      saveEmailVerifiedHint(user.email, true);
    }
    setOnboarding((prev) => ({
      ...prev,
      emailVerified: true,
    }));
  }, [user]);

  const selectPlan = useCallback(
    async (plan: SubscriptionPlanId): Promise<UserSubscriptionResponse> => {
      const response = await subscriptionsService.selectSubscription({
        tier: plan,
      });
      const updatedSubscription = response.data;
      setSubscription(updatedSubscription);

      const updatedUser = user
        ? { ...user, subscriptionTier: updatedSubscription.tier }
        : null;
      if (updatedUser) {
        setUser(updatedUser);
        saveUserSnapshot(updatedUser);
        saveEmailVerifiedHint(updatedUser.email, true);
      }

      let selectedLanguages = onboarding.selectedLanguages;
      try {
        const langResponse = await settingsService.getLanguages();
        setLanguagesSettings(langResponse.data);
        selectedLanguages = langResponse.data.selected;
      } catch {
        // Si aún no hay idiomas elegidos, el Paso 4 completará la configuración.
      }

      const hasPlan = Boolean(updatedSubscription.tier);
      setOnboarding((prev) => ({
        ...prev,
        emailVerified: true,
        hasSelectedPlan: hasPlan,
        subscriptionPlan: updatedSubscription.tier,
        selectedLanguages,
        isOnboardingComplete: hasPlan && selectedLanguages.length > 0,
      }));

      return updatedSubscription;
    },
    [onboarding.selectedLanguages, user],
  );

  const selectLanguages = useCallback(
    async (languages: TargetLanguageCode[]): Promise<LanguagesSettings> => {
      const response = await settingsService.updateLanguages({ languages });
      const updatedLanguages = response.data;
      setLanguagesSettings(updatedLanguages);

      setOnboarding((prev) => ({
        ...prev,
        emailVerified: true,
        hasSelectedPlan: true,
        selectedLanguages: updatedLanguages.selected,
        isOnboardingComplete: updatedLanguages.selected.length > 0,
      }));

      return updatedLanguages;
    },
    [],
  );

  const updateOnboardingState = useCallback(
    (partial: Partial<OnboardingState>): void => {
      setOnboarding((prev) => ({
        ...prev,
        ...partial,
      }));
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
      // Aunque falle la red, limpiamos el estado local inmediatamente.
    } finally {
      clearSessionState();
    }
  }, [clearSessionState]);

  const logoutAll = useCallback(async (): Promise<void> => {
    try {
      await authService.logoutAll();
    } catch {
      // Mismo criterio de limpieza segura ante fallos de red.
    } finally {
      clearSessionState();
    }
  }, [clearSessionState]);

  const isAuthenticated = status === "authenticated";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      subscription,
      languagesSettings,
      status,
      isAuthenticated,
      isLoading: status === "loading",
      onboarding,
      login,
      register,
      logout,
      logoutAll,
      refreshSession,
      reloadAccountState,
      confirmEmailVerification,
      selectPlan,
      selectLanguages,
      updateOnboardingState,
    }),
    [
      user,
      subscription,
      languagesSettings,
      status,
      isAuthenticated,
      onboarding,
      login,
      register,
      logout,
      logoutAll,
      refreshSession,
      reloadAccountState,
      confirmEmailVerification,
      selectPlan,
      selectLanguages,
      updateOnboardingState,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe utilizarse dentro de un <AuthProvider>.");
  }
  return ctx;
}
