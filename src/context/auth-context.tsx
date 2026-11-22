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

import { useToast } from "@/context/toast-context";
import { getDictionary, resolveUiLocale } from "@/i18n";
import {
  type AccessRequestItem,
  accessRequestsService,
  type AccountAccessPhase,
  ApiClientError,
  type AuthSessionStatus,
  authService,
  type AuthUser,
  type CategoriesSettings,
  type CreateAccessRequestInput,
  ErrorCode,
  type InitialAuthState,
  type LanguagesSettings,
  type LoginInput,
  MIN_USER_CATEGORIES,
  type MyAccessRequestsResponse,
  registerAuthLifecycleHandlers,
  type RegisterInput,
  settingsService,
  subscriptionsService,
  type SubscriptionTier,
  type TargetLanguageCode,
  type UserSubscriptionResponse,
  type VerifyEmailResponse,
} from "@/lib";

export type AuthStatus = AuthSessionStatus;
export type { InitialAuthState };

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

export interface AuthSecurityOptions {
  captchaToken?: string | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  subscription: UserSubscriptionResponse | null;
  languagesSettings: LanguagesSettings | null;
  categoriesSettings: CategoriesSettings | null;
  accessRequests: MyAccessRequestsResponse | null;
  accessRequestsEnabled: boolean;
  status: AuthStatus;
  accessPhase: AccountAccessPhase;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingVerificationEmail: string | null;
  onboarding: OnboardingState;
  login: (
    input: LoginInput,
    options?: AuthSecurityOptions,
  ) => Promise<AuthUser>;
  register: (
    input: RegisterWithPreferencesInput,
    options?: AuthSecurityOptions,
  ) => Promise<RegisterResult>;
  verifyEmailWithToken: (token: string) => Promise<VerifyEmailResponse>;
  resendVerificationEmail: (
    email?: string,
    options?: AuthSecurityOptions,
  ) => Promise<void>;
  clearPendingVerification: () => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  reloadAccountState: () => Promise<void>;
  refreshPreferences: () => Promise<void>;
  refreshAccessRequests: () => Promise<void>;
  submitAccessRequest: (
    input: CreateAccessRequestInput,
    options?: AuthSecurityOptions,
  ) => Promise<AccessRequestItem>;
  cancelAccessRequest: (id: number) => Promise<AccessRequestItem>;
  selectPlan: (
    plan: SubscriptionPlanId,
    options?: AuthSecurityOptions,
  ) => Promise<UserSubscriptionResponse>;
  selectLanguages: (
    languages: TargetLanguageCode[],
  ) => Promise<LanguagesSettings>;
  savePreferences: (input: SavePreferencesInput) => Promise<void>;
  updateOnboardingState: (partial: Partial<OnboardingState>) => void;
}

const SESSION_FLAG_COOKIE_NAME = "doly_session";
const USER_SNAPSHOT_STORAGE_KEY = "doly_user_snapshot";
const PENDING_VERIFICATION_STORAGE_KEY = "doly.pending_verification_email";
const ACCESS_REQUEST_POLL_INTERVAL_MS = 15_000;

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

function buildInitialOnboardingState(
  initialAuth?: InitialAuthState,
): OnboardingState {
  if (!initialAuth || initialAuth.status !== "authenticated") {
    return EMPTY_ONBOARDING;
  }

  if (initialAuth.user?.role === "admin") {
    return EMPTY_ONBOARDING;
  }

  if (initialAuth.subscriptionRequired || !initialAuth.user?.subscriptionTier) {
    return buildOnboardingState({
      emailVerified: true,
      tier: null,
      selectedLanguages: [],
      selectedCategories: [],
    });
  }

  return buildOnboardingState({
    emailVerified: Boolean(initialAuth.user.emailVerifiedAt),
    tier:
      initialAuth.subscription?.tier ??
      initialAuth.user.subscriptionTier ??
      null,
    selectedLanguages: initialAuth.languagesSettings?.selected ?? [],
    selectedCategories: initialAuth.categoriesSettings?.selected ?? [],
  });
}

export function AuthProvider({
  children,
  initialAuth,
}: {
  children: ReactNode;
  initialAuth?: InitialAuthState;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialAuth?.user ?? null);
  const [subscription, setSubscription] =
    useState<UserSubscriptionResponse | null>(
      initialAuth?.subscription ?? null,
    );
  const [languagesSettings, setLanguagesSettings] =
    useState<LanguagesSettings | null>(
      initialAuth?.languagesSettings ?? null,
    );
  const [categoriesSettings, setCategoriesSettings] =
    useState<CategoriesSettings | null>(
      initialAuth?.categoriesSettings ?? null,
    );
  const [accessRequestsState, setAccessRequestsState] =
    useState<MyAccessRequestsResponse | null>(
      initialAuth?.accessRequests ?? null,
    );
  const [status, setStatus] = useState<AuthStatus>(
    initialAuth?.status ?? "loading",
  );
  const [subscriptionRequired, setSubscriptionRequired] = useState<boolean>(
    initialAuth?.subscriptionRequired ?? false,
  );
  const [pendingVerificationEmail, setPendingVerificationEmailState] = useState<
    string | null
  >(null);
  const [onboarding, setOnboarding] = useState<OnboardingState>(() =>
    buildInitialOnboardingState(initialAuth),
  );

  const toast = useToast();
  const isBootstrappedRef = useRef(false);
  const isUnloadingRef = useRef(false);
  const authTransitionEpochRef = useRef(0);
  const lastVisibilitySyncRef = useRef(0);
  const isRefreshingRequestsRef = useRef(false);
  const pendingRequestIdsRef = useRef<{
    subscriptionId: number | null;
    languageUnlockId: number | null;
  }>({
    subscriptionId:
      initialAuth?.accessRequests?.pendingSubscriptionRequest?.id ?? null,
    languageUnlockId:
      initialAuth?.accessRequests?.pendingLanguageUnlockRequest?.id ?? null,
  });
  const toastRef = useRef(toast);
  const userLocaleRef = useRef<string | undefined>(initialAuth?.user?.locale);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    userLocaleRef.current = user?.locale;
  }, [user?.locale]);

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
      authTransitionEpochRef.current += 1;
      clearBrowserSessionHints(options);
      pendingRequestIdsRef.current = {
        subscriptionId: null,
        languageUnlockId: null,
      };
      setUser(null);
      setSubscription(null);
      setLanguagesSettings(null);
      setCategoriesSettings(null);
      setAccessRequestsState(null);
      setSubscriptionRequired(false);
      if (!options?.preservePendingEmail) {
        setPendingVerificationEmailState(null);
      }
      setOnboarding(EMPTY_ONBOARDING);
      setStatus("unauthenticated");
    },
    [],
  );

  const resolveRequestToastDict = useCallback(() => {
    const rawLocale =
      userLocaleRef.current ??
      (typeof document !== "undefined" ? document.documentElement.lang : "es");
    return getDictionary(resolveUiLocale(rawLocale));
  }, []);

  /**
   * Actualiza `accessRequestsState` y detecta si una solicitud pendiente previa fue
   * aprobada o rechazada para avisar al usuario y sincronizar la cuenta completa.
   */
  const commitAccessRequestsSnapshot = useCallback(
    (nextRequests: MyAccessRequestsResponse | null): { needsAccountReload: boolean } => {
      const prevSubId = pendingRequestIdsRef.current.subscriptionId;
      const prevLangId = pendingRequestIdsRef.current.languageUnlockId;

      const nextSubId = nextRequests?.pendingSubscriptionRequest?.id ?? null;
      const nextLangId = nextRequests?.pendingLanguageUnlockRequest?.id ?? null;

      pendingRequestIdsRef.current = {
        subscriptionId: nextSubId,
        languageUnlockId: nextLangId,
      };

      setAccessRequestsState(nextRequests);

      if (!nextRequests) {
        return { needsAccountReload: false };
      }

      let needsAccountReload = false;
      const dict = resolveRequestToastDict();

      if (prevSubId !== null && nextSubId !== prevSubId) {
        const resolvedSub = nextRequests.requests.find(
          (item) => item.id === prevSubId,
        );
        if (resolvedSub?.status === "approved") {
          needsAccountReload = true;
          toastRef.current.success(dict.profile.hooks.planRequestApprovedToast);
        } else if (resolvedSub?.status === "rejected") {
          toastRef.current.warning(dict.profile.hooks.planRequestRejectedToast);
        }
      }

      if (prevLangId !== null && nextLangId !== prevLangId) {
        const resolvedLang = nextRequests.requests.find(
          (item) => item.id === prevLangId,
        );
        if (resolvedLang?.status === "approved") {
          needsAccountReload = true;
          toastRef.current.success(
            dict.profile.hooks.unlockRequestApprovedToast,
          );
        } else if (resolvedLang?.status === "rejected") {
          toastRef.current.warning(
            dict.profile.hooks.unlockRequestRejectedToast,
          );
        }
      }

      return { needsAccountReload };
    },
    [resolveRequestToastDict],
  );

  /**
   * Recupera suscripción, idiomas y categorías actuales sin publicar estado parcial
   * hasta completar el lote completo.
   */
  const fetchSubscribedAccountSettings = useCallback(
    async (authenticatedUser: AuthUser) => {
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

      const resolvedTier =
        nextSubscription?.tier ?? authenticatedUser.subscriptionTier ?? null;
      const selectedLanguages = nextLanguages?.selected ?? [];
      const selectedCategories = nextCategories?.selected ?? [];

      return {
        nextSubscription,
        nextLanguages,
        nextCategories,
        nextOnboarding: buildOnboardingState({
          emailVerified: Boolean(authenticatedUser.emailVerifiedAt),
          tier: resolvedTier,
          selectedLanguages,
          selectedCategories,
        }),
      };
    },
    [],
  );

  const applySubscribedAccountSettings = useCallback(
    (settingsSnapshot: {
      nextSubscription: UserSubscriptionResponse | null;
      nextLanguages: LanguagesSettings | null;
      nextCategories: CategoriesSettings | null;
      nextOnboarding: OnboardingState;
    }): void => {
      setSubscription(settingsSnapshot.nextSubscription);
      setLanguagesSettings(settingsSnapshot.nextLanguages);
      setCategoriesSettings(settingsSnapshot.nextCategories);
      setOnboarding(settingsSnapshot.nextOnboarding);
    },
    [],
  );

  /**
   * Sincroniza suscripción, idiomas y categorías actuales cuando ya hay plan activo.
   */
  const syncSubscribedAccountSettings = useCallback(
    async (authenticatedUser: AuthUser): Promise<void> => {
      const transitionEpoch = authTransitionEpochRef.current;
      const settingsSnapshot =
        await fetchSubscribedAccountSettings(authenticatedUser);
      if (authTransitionEpochRef.current !== transitionEpoch) {
        return;
      }
      applySubscribedAccountSettings(settingsSnapshot);
    },
    [applySubscribedAccountSettings, fetchSubscribedAccountSettings],
  );

  const fetchStudentAccessRequests = useCallback(async (): Promise<
    MyAccessRequestsResponse | null
  > => {
    try {
      const response = await accessRequestsService.getMyRequests();
      return response.data;
    } catch {
      // Compatibilidad con mocks heredados que aún no stubbean `/access-requests/me`.
      return null;
    }
  }, []);

  const applyAuthenticatedUser = useCallback(
    async (authenticatedUser: AuthUser): Promise<void> => {
      const transitionEpoch = ++authTransitionEpochRef.current;

      if (authenticatedUser.role === "admin") {
        // Las cuentas admin están aisladas: nunca cargan datos ni solicitudes estudiantiles.
        updatePendingVerificationEmail(null);
        saveUserSnapshot(authenticatedUser);
        setSubscription(null);
        setLanguagesSettings(null);
        setCategoriesSettings(null);
        commitAccessRequestsSnapshot(null);
        setOnboarding(EMPTY_ONBOARDING);
        setUser(authenticatedUser);
        setSubscriptionRequired(false);
        setStatus("authenticated");
        return;
      }

      if (authenticatedUser.subscriptionTier) {
        // Publicamos usuario, estado `authenticated` y onboarding completo en el mismo
        // commit tras resolver suscripción/idiomas/categorías para evitar destellos de gates en `/`.
        const [settingsSnapshot, requestsSnapshot] = await Promise.all([
          fetchSubscribedAccountSettings(authenticatedUser),
          fetchStudentAccessRequests(),
        ]);
        if (authTransitionEpochRef.current !== transitionEpoch) {
          return;
        }
        updatePendingVerificationEmail(null);
        saveUserSnapshot(authenticatedUser);
        applySubscribedAccountSettings(settingsSnapshot);
        commitAccessRequestsSnapshot(requestsSnapshot);
        setUser(authenticatedUser);
        setSubscriptionRequired(false);
        setStatus("authenticated");
        return;
      }

      const requestsSnapshot = await fetchStudentAccessRequests();
      if (authTransitionEpochRef.current !== transitionEpoch) {
        return;
      }
      updatePendingVerificationEmail(null);
      saveUserSnapshot(authenticatedUser);
      setSubscription(null);
      setLanguagesSettings(null);
      setCategoriesSettings(null);
      commitAccessRequestsSnapshot(requestsSnapshot);
      setOnboarding(
        buildOnboardingState({
          emailVerified: true,
          tier: null,
          selectedLanguages: [],
          selectedCategories: [],
        }),
      );
      setUser(authenticatedUser);
      setSubscriptionRequired(true);
      setStatus("authenticated");
    },
    [
      applySubscribedAccountSettings,
      commitAccessRequestsSnapshot,
      fetchStudentAccessRequests,
      fetchSubscribedAccountSettings,
      updatePendingVerificationEmail,
    ],
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
        const requestsSnapshot = await fetchStudentAccessRequests();
        updatePendingVerificationEmail(null);
        setUser(resolvedUser);
        setSubscription(null);
        setLanguagesSettings(null);
        setCategoriesSettings(null);
        commitAccessRequestsSnapshot(requestsSnapshot);
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

      if (error instanceof ApiClientError && error.isConnectivityError) {
        // Nunca borramos `doly_session` ante un abort de navegación o fallo de red.
        const snapshot = loadUserSnapshot();
        if (snapshot) {
          setOnboarding(
            buildOnboardingState({
              emailVerified: Boolean(snapshot.emailVerifiedAt),
              tier: snapshot.subscriptionTier ?? null,
              selectedLanguages: [],
              selectedCategories: [],
            }),
          );
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
    commitAccessRequestsSnapshot,
    fetchStudentAccessRequests,
    updatePendingVerificationEmail,
    user,
  ]);

  const reloadAccountStateRef = useRef(reloadAccountState);
  useEffect(() => {
    reloadAccountStateRef.current = reloadAccountState;
  }, [reloadAccountState]);

  const refreshAccessRequests = useCallback(async (): Promise<void> => {
    if (user?.role === "admin") {
      commitAccessRequestsSnapshot(null);
      return;
    }
    if (isRefreshingRequestsRef.current) {
      return;
    }
    isRefreshingRequestsRef.current = true;
    try {
      const requestsSnapshot = await fetchStudentAccessRequests();
      if (requestsSnapshot !== null) {
        const { needsAccountReload } =
          commitAccessRequestsSnapshot(requestsSnapshot);
        if (needsAccountReload) {
          await reloadAccountStateRef.current();
        }
      }
    } finally {
      isRefreshingRequestsRef.current = false;
    }
  }, [commitAccessRequestsSnapshot, fetchStudentAccessRequests, user?.role]);

  const submitAccessRequest = useCallback(
    async (
      input: CreateAccessRequestInput,
      options?: AuthSecurityOptions,
    ): Promise<AccessRequestItem> => {
      const response = options?.captchaToken
        ? await accessRequestsService.createRequest(input, {
            captchaToken: options.captchaToken,
          })
        : await accessRequestsService.createRequest(input);
      await refreshAccessRequests();
      return response.data;
    },
    [refreshAccessRequests],
  );

  const cancelAccessRequest = useCallback(
    async (id: number): Promise<AccessRequestItem> => {
      const response = await accessRequestsService.cancelRequest(id);
      if (pendingRequestIdsRef.current.subscriptionId === id) {
        pendingRequestIdsRef.current.subscriptionId = null;
      }
      if (pendingRequestIdsRef.current.languageUnlockId === id) {
        pendingRequestIdsRef.current.languageUnlockId = null;
      }
      await refreshAccessRequests();
      return response.data;
    },
    [refreshAccessRequests],
  );

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
        (error instanceof ApiClientError && error.isConnectivityError)
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

  // Al volver a enfocar la pestaña, resincroniza solicitudes y posible aprobación del plan/idioma.
  useEffect(() => {
    if (status !== "authenticated" || user?.role === "admin") {
      return;
    }

    const handleVisibilityOrFocus = (): void => {
      if (document.visibilityState === "hidden") {
        return;
      }
      const now = Date.now();
      if (now - lastVisibilitySyncRef.current < 5_000) {
        return;
      }
      lastVisibilitySyncRef.current = now;

      if (
        subscriptionRequired ||
        !user?.subscriptionTier ||
        Boolean(accessRequestsState?.pendingSubscriptionRequest) ||
        Boolean(accessRequestsState?.pendingLanguageUnlockRequest)
      ) {
        void reloadAccountState();
      } else {
        void refreshAccessRequests();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    return () => {
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [
    accessRequestsState?.pendingLanguageUnlockRequest,
    accessRequestsState?.pendingSubscriptionRequest,
    refreshAccessRequests,
    reloadAccountState,
    status,
    subscriptionRequired,
    user?.role,
    user?.subscriptionTier,
  ]);

  // Polling condicional ligero: solo consulta `/access-requests/me` cada 15s mientras el
  // cliente tenga una solicitud pendiente y la pestaña esté visible.
  const hasPendingAccessRequest = Boolean(
    accessRequestsState?.enabled &&
      (accessRequestsState?.pendingSubscriptionRequest ||
        accessRequestsState?.pendingLanguageUnlockRequest),
  );

  useEffect(() => {
    if (
      status !== "authenticated" ||
      user?.role === "admin" ||
      !hasPendingAccessRequest
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void refreshAccessRequests();
    }, ACCESS_REQUEST_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasPendingAccessRequest, refreshAccessRequests, status, user?.role]);

  // Hidratación inicial desde cookies `HttpOnly` + estado de verificación pendiente.
  useEffect(() => {
    if (isBootstrappedRef.current) return;
    isBootstrappedRef.current = true;

    const bootstrapSession = async (): Promise<void> => {
      if (initialAuth?.status === "authenticated") {
        updatePendingVerificationEmail(null);
        if (initialAuth.user) {
          saveUserSnapshot(initialAuth.user);
          if (
            initialAuth.user.role !== "admin" &&
            initialAuth.user.subscriptionTier &&
            (!initialAuth.subscription ||
              !initialAuth.languagesSettings ||
              !initialAuth.categoriesSettings)
          ) {
            await syncSubscribedAccountSettings(initialAuth.user);
          }
        } else if (initialAuth.subscriptionRequired) {
          const snapshot = loadUserSnapshot();
          if (snapshot) {
            setUser({ ...snapshot, subscriptionTier: null });
          }
        }
        return;
      }

      const pendingEmail = loadPendingVerificationEmail();
      if (pendingEmail) {
        setPendingVerificationEmailState(pendingEmail);
      }

      if (initialAuth?.status === "unauthenticated") {
        if (hasSessionCookieFlag()) {
          try {
            await reloadAccountState();
          } catch {
            clearSessionState({ preservePendingEmail: Boolean(pendingEmail) });
          }
        }
        return;
      }

      if (!initialAuth && !hasSessionCookieFlag()) {
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
    async (
      input: LoginInput,
      options?: AuthSecurityOptions,
    ): Promise<AuthUser> => {
      const normalizedEmail = input.email.trim();
      const payload = {
        email: normalizedEmail,
        password: input.password,
      };
      try {
        const response = options?.captchaToken
          ? await authService.login(payload, {
              captchaToken: options.captchaToken,
            })
          : await authService.login(payload);

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
    async (
      input: RegisterWithPreferencesInput,
      options?: AuthSecurityOptions,
    ): Promise<RegisterResult> => {
      const payload = {
        email: input.email.trim(),
        password: input.password,
        fullName: input.fullName.trim(),
        ...(input.locale ? { locale: input.locale } : {}),
      };
      const response = options?.captchaToken
        ? await authService.register(payload, {
            captchaToken: options.captchaToken,
          })
        : await authService.register(payload);

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
    async (email?: string, options?: AuthSecurityOptions): Promise<void> => {
      const target =
        email?.trim() || pendingVerificationEmail || user?.email || "";
      if (!target) {
        return;
      }
      if (options?.captchaToken) {
        await authService.resendVerification(
          { email: target },
          { captchaToken: options.captchaToken },
        );
      } else {
        await authService.resendVerification({ email: target });
      }
    },
    [pendingVerificationEmail, user?.email],
  );

  const clearPendingVerification = useCallback((): void => {
    clearSessionState({ preservePendingEmail: false });
  }, [clearSessionState]);

  const selectPlan = useCallback(
    async (
      plan: SubscriptionPlanId,
      options?: AuthSecurityOptions,
    ): Promise<UserSubscriptionResponse> => {
      const transitionEpoch = ++authTransitionEpochRef.current;
      const response = options?.captchaToken
        ? await subscriptionsService.selectSubscription(
            { tier: plan },
            { captchaToken: options.captchaToken },
          )
        : await subscriptionsService.selectSubscription({
            tier: plan,
          });
      const updatedSubscription = response.data;

      const snapshot = loadUserSnapshot();
      const baseUser = user ?? snapshot;
      if (baseUser) {
        const nextUser: AuthUser = {
          ...baseUser,
          subscriptionTier: updatedSubscription.tier,
        };
        const settingsSnapshot =
          await fetchSubscribedAccountSettings(nextUser);
        if (authTransitionEpochRef.current !== transitionEpoch) {
          return updatedSubscription;
        }
        saveUserSnapshot(nextUser);
        applySubscribedAccountSettings({
          ...settingsSnapshot,
          nextSubscription:
            settingsSnapshot.nextSubscription ?? updatedSubscription,
        });
        setUser(nextUser);
        setSubscriptionRequired(false);
      } else {
        setSubscription(updatedSubscription);
        setSubscriptionRequired(false);
        await reloadAccountState();
      }

      return updatedSubscription;
    },
    [
      applySubscribedAccountSettings,
      fetchSubscribedAccountSettings,
      reloadAccountState,
      user,
    ],
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
      if (user?.role === "admin") {
        return "admin";
      }
      if (subscriptionRequired || !user?.subscriptionTier) {
        return "plan_required";
      }
      return "ready";
    }
    return "unauthenticated";
  }, [
    pendingVerificationEmail,
    status,
    subscriptionRequired,
    user?.role,
    user?.subscriptionTier,
  ]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      subscription,
      languagesSettings,
      categoriesSettings,
      accessRequests: accessRequestsState,
      accessRequestsEnabled: accessRequestsState?.enabled ?? false,
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
      refreshAccessRequests,
      submitAccessRequest,
      cancelAccessRequest,
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
      accessRequestsState,
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
      refreshAccessRequests,
      submitAccessRequest,
      cancelAccessRequest,
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
