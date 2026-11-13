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
  type AccountAccessPhase,
  ApiClientError,
  authService,
  type AuthUser,
  type CategoriesSettings,
  ErrorCode,
  type LanguagesSettings,
  type LoginInput,
  MIN_USER_CATEGORIES,
  registerAuthLifecycleHandlers,
  type RegisterInput,
  settingsService,
  subscriptionsService,
  type SubscriptionTier,
  type TargetLanguageCode,
  type UserSubscriptionResponse,
  type VerifyEmailResponse,
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
  selectedCategories: string[];
  hasConfiguredLanguages: boolean;
  hasConfiguredCategories: boolean;
  canGenerateReadings: boolean;
  isOnboardingComplete: boolean;
}

export type RegisterWithPreferencesInput = RegisterInput;

export interface RegisterResult {
  user: AuthUser;
  needsEmailVerification: boolean;
}

export interface SavePreferencesInput {
  languages?: TargetLanguageCode[];
  categories: string[];
}

export interface AuthContextValue {
  user: AuthUser | null;
  subscription: UserSubscriptionResponse | null;
  languagesSettings: LanguagesSettings | null;
  categoriesSettings: CategoriesSettings | null;
  status: AuthStatus;
  accessPhase: AccountAccessPhase;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingVerificationEmail: string | null;
  onboarding: OnboardingState;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterWithPreferencesInput) => Promise<RegisterResult>;
  verifyEmailWithToken: (token: string) => Promise<VerifyEmailResponse>;
  resendVerificationEmail: (email?: string) => Promise<void>;
  clearPendingVerification: () => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  reloadAccountState: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
  selectPlan: (plan: SubscriptionPlanId) => Promise<UserSubscriptionResponse>;
  selectLanguages: (
    languages: TargetLanguageCode[],
  ) => Promise<LanguagesSettings>;
  savePreferences: (input: SavePreferencesInput) => Promise<void>;
  updateOnboardingState: (partial: Partial<OnboardingState>) => void;
}

const SESSION_FLAG_COOKIE_NAME = "doly_session";
const USER_SNAPSHOT_STORAGE_KEY = "doly_user_snapshot";
const PENDING_VERIFICATION_STORAGE_KEY = "doly.pending_verification_email";

const EMPTY_ONBOARDING: OnboardingState = {
  emailVerified: false,
  hasSelectedPlan: false,
  subscriptionPlan: null,
  selectedLanguages: [],
  selectedCategories: [],
  hasConfiguredLanguages: false,
  hasConfiguredCategories: false,
  canGenerateReadings: false,
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
 * nombre/correo durante el paso de selección de plan (ningún token JWT).
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

/**
 * Guarda o limpia el correo pendiente de confirmar en `localStorage` (nunca tokens)
 * para sincronizar el bloqueo de verificación entre pestañas del mismo navegador.
 */
function savePendingVerificationEmail(email: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!email || !email.trim()) {
      window.localStorage.removeItem(PENDING_VERIFICATION_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      PENDING_VERIFICATION_STORAGE_KEY,
      email.trim().toLowerCase(),
    );
  } catch {
    // Sin impacto funcional si localStorage no está disponible.
  }
}

function loadPendingVerificationEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(PENDING_VERIFICATION_STORAGE_KEY);
    return value && value.trim().length > 0 ? value.trim() : null;
  } catch {
    return null;
  }
}

function clearBrowserSessionHints(options?: {
  preservePendingEmail?: boolean;
}): void {
  saveUserSnapshot(null);
  if (!options?.preservePendingEmail) {
    savePendingVerificationEmail(null);
  }
  if (typeof document !== "undefined") {
    document.cookie = `${SESSION_FLAG_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

function buildOnboardingState(params: {
  emailVerified: boolean;
  tier: SubscriptionPlanId | null;
  selectedLanguages: TargetLanguageCode[];
  selectedCategories: string[];
}): OnboardingState {
  const hasSelectedPlan = Boolean(params.tier);
  const hasConfiguredLanguages =
    params.tier === "dolly_pro" || params.selectedLanguages.length >= 1;
  const hasConfiguredCategories =
    params.selectedCategories.length >= MIN_USER_CATEGORIES;
  const canGenerateReadings =
    hasSelectedPlan && hasConfiguredLanguages && hasConfiguredCategories;

  return {
    emailVerified: params.emailVerified,
    hasSelectedPlan,
    subscriptionPlan: params.tier,
    selectedLanguages: params.selectedLanguages,
    selectedCategories: params.selectedCategories,
    hasConfiguredLanguages,
    hasConfiguredCategories,
    canGenerateReadings,
    isOnboardingComplete: canGenerateReadings,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] =
    useState<UserSubscriptionResponse | null>(null);
  const [languagesSettings, setLanguagesSettings] =
    useState<LanguagesSettings | null>(null);
  const [categoriesSettings, setCategoriesSettings] =
    useState<CategoriesSettings | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmailState] = useState<
    string | null
  >(null);
  const [onboarding, setOnboarding] =
    useState<OnboardingState>(EMPTY_ONBOARDING);

  const isBootstrappedRef = useRef(false);
  const isUnloadingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const markUnloading = (): void => {
      isUnloadingRef.current = true;
    };
    const clearUnloading = (): void => {
      isUnloadingRef.current = false;
    };
    window.addEventListener("beforeunload", markUnloading);
    window.addEventListener("pagehide", markUnloading);
    window.addEventListener("pageshow", clearUnloading);
    return () => {
      window.removeEventListener("beforeunload", markUnloading);
      window.removeEventListener("pagehide", markUnloading);
      window.removeEventListener("pageshow", clearUnloading);
    };
  }, []);

  const updatePendingVerificationEmail = useCallback(
    (email: string | null): void => {
      savePendingVerificationEmail(email);
      setPendingVerificationEmailState(
        email && email.trim().length > 0 ? email.trim().toLowerCase() : null,
      );
    },
    [],
  );

  const clearSessionState = useCallback(
    (options?: { preservePendingEmail?: boolean }): void => {
      clearBrowserSessionHints(options);
      setUser(null);
      setSubscription(null);
      setLanguagesSettings(null);
      setCategoriesSettings(null);
      setSubscriptionRequired(false);
      if (!options?.preservePendingEmail) {
        setPendingVerificationEmailState(null);
      }
      setOnboarding(EMPTY_ONBOARDING);
      setStatus("unauthenticated");
    },
    [],
  );

  /**
   * Sincroniza suscripción, idiomas y categorías actuales cuando ya hay plan activo.
   */
  const syncSubscribedAccountSettings = useCallback(
    async (authenticatedUser: AuthUser): Promise<void> => {
      const [subResult, langResult, catResult] = await Promise.allSettled([
        subscriptionsService.getCurrentSubscription(),
        settingsService.getLanguages(),
        settingsService.getCategories(),
      ]);

      const nextSubscription =
        subResult.status === "fulfilled" ? subResult.value.data : null;
      const nextLanguages =
        langResult.status === "fulfilled" ? langResult.value.data : null;
      const nextCategories =
        catResult.status === "fulfilled" ? catResult.value.data : null;

      setSubscription(nextSubscription);
      setLanguagesSettings(nextLanguages);
      setCategoriesSettings(nextCategories);

      const resolvedTier =
        nextSubscription?.tier ?? authenticatedUser.subscriptionTier ?? null;
      const selectedLanguages = nextLanguages?.selected ?? [];
      const selectedCategories = nextCategories?.selected ?? [];

      setOnboarding(
        buildOnboardingState({
          emailVerified: Boolean(authenticatedUser.emailVerifiedAt),
          tier: resolvedTier,
          selectedLanguages,
          selectedCategories,
        }),
      );
    },
    [],
  );

  const applyAuthenticatedUser = useCallback(
    async (authenticatedUser: AuthUser): Promise<void> => {
      updatePendingVerificationEmail(null);
      setUser(authenticatedUser);
      saveUserSnapshot(authenticatedUser);
      setStatus("authenticated");

      if (authenticatedUser.subscriptionTier) {
        setSubscriptionRequired(false);
        await syncSubscribedAccountSettings(authenticatedUser);
        return;
      }

      setSubscription(null);
      setLanguagesSettings(null);
      setCategoriesSettings(null);
      setSubscriptionRequired(true);
      setOnboarding(
        buildOnboardingState({
          emailVerified: true,
          tier: null,
          selectedLanguages: [],
          selectedCategories: [],
        }),
      );
    },
    [syncSubscribedAccountSettings, updatePendingVerificationEmail],
  );

  const reloadAccountState = useCallback(async (): Promise<void> => {
    try {
      const meResponse = await authService.me();
      await applyAuthenticatedUser(meResponse.data);
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.code === ErrorCode.AUTH_EMAIL_NOT_VERIFIED
      ) {
        const snapshot = loadUserSnapshot();
        const fallbackEmail = snapshot?.email ?? user?.email ?? null;
        clearSessionState({ preservePendingEmail: true });
        if (fallbackEmail) {
          updatePendingVerificationEmail(fallbackEmail);
        }
        return;
      }

      if (
        error instanceof ApiClientError &&
        error.code === ErrorCode.SUBSCRIPTION_REQUIRED
      ) {
        // JWT válido + correo confirmado, pero el backend bloquea hasta seleccionar plan.
        const snapshot = loadUserSnapshot();
        const resolvedUser = snapshot
          ? { ...snapshot, subscriptionTier: null }
          : user
            ? { ...user, subscriptionTier: null }
            : null;
        updatePendingVerificationEmail(null);
        setUser(resolvedUser);
        setSubscription(null);
        setLanguagesSettings(null);
        setCategoriesSettings(null);
        setSubscriptionRequired(true);
        setStatus("authenticated");
        setOnboarding(
          buildOnboardingState({
            emailVerified: true,
            tier: null,
            selectedLanguages: [],
            selectedCategories: [],
          }),
        );
        return;
      }

      if (isUnloadingRef.current) {
        return;
      }

      if (
        error instanceof ApiClientError &&
        error.code === ErrorCode.NETWORK_ERROR
      ) {
        // Nunca borramos `doly_session` ante un abort de navegación o fallo de red.
        const snapshot = loadUserSnapshot();
        if (snapshot) {
          setUser(snapshot);
          setSubscriptionRequired(!snapshot.subscriptionTier);
          setStatus("authenticated");
        }
        return;
      }

      if (error instanceof ApiClientError && error.isUnauthorized) {
        const storedPending = loadPendingVerificationEmail();
        clearSessionState({ preservePendingEmail: Boolean(storedPending) });
        if (storedPending) {
          setPendingVerificationEmailState(storedPending);
        }
        return;
      }

      const storedPending = loadPendingVerificationEmail();
      clearSessionState({ preservePendingEmail: Boolean(storedPending) });
      if (storedPending) {
        setPendingVerificationEmailState(storedPending);
      }
    }
  }, [
    applyAuthenticatedUser,
    clearSessionState,
    updatePendingVerificationEmail,
    user,
  ]);

  const refreshPreferences = useCallback(async (): Promise<void> => {
    if (!user?.subscriptionTier) {
      return;
    }
    await syncSubscribedAccountSettings(user);
  }, [syncSubscribedAccountSettings, user]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authService.refresh();
      return Boolean(response.data?.authenticated);
    } catch (error) {
      if (
        isUnloadingRef.current ||
        (error instanceof ApiClientError &&
          error.code === ErrorCode.NETWORK_ERROR)
      ) {
        return false;
      }
      const storedPending = loadPendingVerificationEmail();
      clearSessionState({ preservePendingEmail: Boolean(storedPending) });
      return false;
    }
  }, [clearSessionState]);

  useEffect(() => {
    registerAuthLifecycleHandlers({
      onRefresh: refreshSession,
      onUnauthorized: () => clearSessionState({ preservePendingEmail: false }),
    });

    return () => {
      registerAuthLifecycleHandlers({
        onRefresh: null,
        onUnauthorized: null,
      });
    };
  }, [refreshSession, clearSessionState]);

  // Sincronización entre pestañas cuando el usuario confirma o cancela la espera del correo.
  useEffect(() => {
    const handleStorage = (event: StorageEvent): void => {
      if (event.key !== PENDING_VERIFICATION_STORAGE_KEY) {
        return;
      }
      const nextEmail = event.newValue ? event.newValue.trim() : null;
      setPendingVerificationEmailState(nextEmail);
      if (!nextEmail && hasSessionCookieFlag()) {
        void reloadAccountState();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [reloadAccountState]);

  // Hidratación inicial desde cookies `HttpOnly` + estado de verificación pendiente.
  useEffect(() => {
    if (isBootstrappedRef.current) return;
    isBootstrappedRef.current = true;

    const bootstrapSession = async (): Promise<void> => {
      const pendingEmail = loadPendingVerificationEmail();
      if (pendingEmail) {
        setPendingVerificationEmailState(pendingEmail);
      }

      if (!hasSessionCookieFlag()) {
        clearSessionState({ preservePendingEmail: Boolean(pendingEmail) });
        return;
      }

      try {
        await reloadAccountState();
      } catch {
        clearSessionState({ preservePendingEmail: Boolean(pendingEmail) });
      }
    };

    void bootstrapSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (input: LoginInput): Promise<AuthUser> => {
      const normalizedEmail = input.email.trim();
      try {
        const response = await authService.login({
          email: normalizedEmail,
          password: input.password,
        });

        const loggedUser = response.data.user;
        await applyAuthenticatedUser(loggedUser);
        return loggedUser;
      } catch (error) {
        if (
          error instanceof ApiClientError &&
          error.code === ErrorCode.AUTH_EMAIL_NOT_VERIFIED
        ) {
          updatePendingVerificationEmail(normalizedEmail);
        }
        throw error;
      }
    },
    [applyAuthenticatedUser, updatePendingVerificationEmail],
  );

  const register = useCallback(
    async (input: RegisterWithPreferencesInput): Promise<RegisterResult> => {
      const response = await authService.register({
        email: input.email.trim(),
        password: input.password,
        fullName: input.fullName.trim(),
        ...(input.locale ? { locale: input.locale } : {}),
      });

      const createdUser = response.data.user;
      const needsEmailVerification =
        Boolean(response.data.emailVerificationRequired) ||
        !response.data.authenticated;

      if (needsEmailVerification) {
        clearSessionState({ preservePendingEmail: false });
        updatePendingVerificationEmail(createdUser.email);
        return {
          user: createdUser,
          needsEmailVerification: true,
        };
      }

      await applyAuthenticatedUser(createdUser);
      return {
        user: createdUser,
        needsEmailVerification: false,
      };
    },
    [applyAuthenticatedUser, clearSessionState, updatePendingVerificationEmail],
  );

  const verifyEmailWithToken = useCallback(
    async (token: string): Promise<VerifyEmailResponse> => {
      const response = await authService.verifyEmail({ token });
      const payload = response.data;
      await applyAuthenticatedUser(payload.user);
      return payload;
    },
    [applyAuthenticatedUser],
  );

  const resendVerificationEmail = useCallback(
    async (email?: string): Promise<void> => {
      const target =
        email?.trim() || pendingVerificationEmail || user?.email || "";
      if (!target) {
        return;
      }
      await authService.resendVerification({ email: target });
    },
    [pendingVerificationEmail, user?.email],
  );

  const clearPendingVerification = useCallback((): void => {
    clearSessionState({ preservePendingEmail: false });
  }, [clearSessionState]);

  const selectPlan = useCallback(
    async (plan: SubscriptionPlanId): Promise<UserSubscriptionResponse> => {
      const response = await subscriptionsService.selectSubscription({
        tier: plan,
      });
      const updatedSubscription = response.data;
      setSubscription(updatedSubscription);
      setSubscriptionRequired(false);

      const snapshot = loadUserSnapshot();
      const baseUser = user ?? snapshot;
      if (baseUser) {
        const nextUser: AuthUser = {
          ...baseUser,
          subscriptionTier: updatedSubscription.tier,
        };
        setUser(nextUser);
        saveUserSnapshot(nextUser);
        await syncSubscribedAccountSettings(nextUser);
      } else {
        await reloadAccountState();
      }

      return updatedSubscription;
    },
    [reloadAccountState, syncSubscribedAccountSettings, user],
  );

  const selectLanguages = useCallback(
    async (languages: TargetLanguageCode[]): Promise<LanguagesSettings> => {
      const response = await settingsService.updateLanguages({ languages });
      const updatedLanguages = response.data;
      setLanguagesSettings(updatedLanguages);

      setOnboarding((prev) =>
        buildOnboardingState({
          emailVerified: true,
          tier: prev.subscriptionPlan,
          selectedLanguages: updatedLanguages.selected,
          selectedCategories: prev.selectedCategories,
        }),
      );

      return updatedLanguages;
    },
    [],
  );

  const savePreferences = useCallback(
    async (input: SavePreferencesInput): Promise<void> => {
      const tier = user?.subscriptionTier ?? onboarding.subscriptionPlan;
      const savedLanguages = languagesSettings?.selected ?? [];
      let nextLanguages = savedLanguages;

      const requestedLanguages = input.languages ?? [];
      const languagesChanged =
        requestedLanguages.length > 0 &&
        (requestedLanguages.length !== savedLanguages.length ||
          requestedLanguages.some((code, index) => code !== savedLanguages[index]));

      if (tier !== "dolly_pro" && languagesChanged) {
        const langRes = await settingsService.updateLanguages({
          languages: requestedLanguages,
        });
        setLanguagesSettings(langRes.data);
        nextLanguages = langRes.data.selected;
      }

      const catRes = await settingsService.updateCategories({
        categories: input.categories,
      });
      setCategoriesSettings(catRes.data);

      setOnboarding(
        buildOnboardingState({
          emailVerified: true,
          tier: tier ?? null,
          selectedLanguages: nextLanguages,
          selectedCategories: catRes.data.selected,
        }),
      );
    },
    [languagesSettings?.selected, onboarding.subscriptionPlan, user?.subscriptionTier],
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
      clearSessionState({ preservePendingEmail: false });
    }
  }, [clearSessionState]);

  const logoutAll = useCallback(async (): Promise<void> => {
    try {
      await authService.logoutAll();
    } catch {
      // Mismo criterio de limpieza segura ante fallos de red.
    } finally {
      clearSessionState({ preservePendingEmail: false });
    }
  }, [clearSessionState]);

  const isAuthenticated = status === "authenticated";

  const accessPhase = useMemo<AccountAccessPhase>(() => {
    if (status === "loading") {
      return "loading";
    }
    if (pendingVerificationEmail) {
      return "unverified_email";
    }
    if (status === "authenticated") {
      if (subscriptionRequired || !user?.subscriptionTier) {
        return "plan_required";
      }
      return "ready";
    }
    return "unauthenticated";
  }, [pendingVerificationEmail, status, subscriptionRequired, user?.subscriptionTier]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      subscription,
      languagesSettings,
      categoriesSettings,
      status,
      accessPhase,
      isAuthenticated,
      isLoading: status === "loading",
      pendingVerificationEmail,
      onboarding,
      login,
      register,
      verifyEmailWithToken,
      resendVerificationEmail,
      clearPendingVerification,
      logout,
      logoutAll,
      refreshSession,
      reloadAccountState,
      refreshPreferences,
      selectPlan,
      selectLanguages,
      savePreferences,
      updateOnboardingState,
    }),
    [
      user,
      subscription,
      languagesSettings,
      categoriesSettings,
      status,
      accessPhase,
      isAuthenticated,
      pendingVerificationEmail,
      onboarding,
      login,
      register,
      verifyEmailWithToken,
      resendVerificationEmail,
      clearPendingVerification,
      logout,
      logoutAll,
      refreshSession,
      reloadAccountState,
      refreshPreferences,
      selectPlan,
      selectLanguages,
      savePreferences,
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
