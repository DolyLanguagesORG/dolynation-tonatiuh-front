"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  authClient,
  type AuthSessionPayload,
  type AuthUser,
  clearAuthTokens,
  getRefreshToken,
  type LoginInput,
  registerAuthLifecycleHandlers,
  type RegisterInput,
  setAuthTokens,
} from "@/lib";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type SubscriptionPlanId = "doly" | "doly_plus" | "doly_vip";

export interface OnboardingState {
  emailVerified: boolean;
  subscriptionPlan: SubscriptionPlanId | null;
  selectedLanguages: string[];
  isOnboardingComplete: boolean;
  hasSelectedPlan: boolean;
}

export interface RegisterWithPreferencesInput extends RegisterInput {
  preferredLanguage?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  preferredLanguage: string;
  onboarding: OnboardingState;
  setPreferredLanguage: (lang: string) => void;
  verifyEmailMock: () => void;
  selectPlanMock: (plan: SubscriptionPlanId) => void;
  selectLanguagesMock: (languages: string[]) => void;
  resetOnboardingMock: () => void;
  login: (input: LoginInput) => Promise<AuthSessionPayload>;
  register: (
    input: RegisterWithPreferencesInput,
  ) => Promise<AuthSessionPayload>;
  refreshSession: () => Promise<string | null>;
  logout: (options?: { redirectTo?: string }) => Promise<void>;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_AUTH_PATHS = new Set(["/login", "/register"]);

const ONBOARDING_STORAGE_PREFIX = "doly_onboarding_";

function getStorageKey(email: string): string {
  return `${ONBOARDING_STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

function loadStoredOnboarding(email?: string | null): OnboardingState | null {
  if (typeof window === "undefined" || !email) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(getStorageKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    const plan = parsed.subscriptionPlan ?? null;
    return {
      emailVerified: Boolean(parsed.emailVerified),
      subscriptionPlan: plan,
      selectedLanguages: Array.isArray(parsed.selectedLanguages)
        ? parsed.selectedLanguages
        : [],
      isOnboardingComplete: Boolean(parsed.isOnboardingComplete),
      hasSelectedPlan: Boolean(plan),
    };
  } catch {
    return null;
  }
}

function saveStoredOnboarding(email: string, state: OnboardingState): void {
  if (typeof window === "undefined" || !email) {
    return;
  }
  try {
    window.localStorage.setItem(getStorageKey(email), JSON.stringify(state));
  } catch {
    // Manejo de restricciones en almacenamiento local o modo incógnito
  }
}

const DEFAULT_COMPLETED_ONBOARDING: OnboardingState = {
  emailVerified: true,
  subscriptionPlan: "doly_plus",
  selectedLanguages: ["en"],
  isOnboardingComplete: true,
  hasSelectedPlan: true,
};

const DEFAULT_FRESH_ONBOARDING: OnboardingState = {
  emailVerified: false,
  subscriptionPlan: null,
  selectedLanguages: [],
  isOnboardingComplete: false,
  hasSelectedPlan: false,
};

/**
 * Valida que una ruta de redirección post-login sea interna al mismo origen
 * (evita vulnerabilidades Open Redirect).
 */
export function sanitizeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/",
): string {
  if (!candidate) {
    return fallback;
  }

  const trimmed = candidate.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    PUBLIC_AUTH_PATHS.has(trimmed.split("?")[0] ?? "")
  ) {
    return fallback;
  }

  return trimmed;
}

function hasSessionFlagCookie(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie
    .split(";")
    .some((cookie) => cookie.trim().startsWith("doly_session=1"));
}

/**
 * Proveedor de estado de sesión de DolyNation.
 *
 * - Conserva el `accessToken` exclusivamente en memoria/contexto (jamás en `localStorage`).
 * - Conecta el interceptor de `401` del `httpClient` para ejecutar `POST /auth/refresh`
 *   una sola vez y, si falla, limpiar la sesión y redirigir a `/login`.
 * - Gestiona el estado de onboarding del stepper (validación de correo, selección de plan y selección de idiomas).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [preferredLanguage, setPreferredLanguage] = useState<string>("en");
  const [onboarding, setOnboarding] = useState<OnboardingState>(
    DEFAULT_COMPLETED_ONBOARDING,
  );

  const clearSession = useCallback((): void => {
    clearAuthTokens();
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
    setOnboarding(DEFAULT_COMPLETED_ONBOARDING);
  }, []);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    try {
      const refreshResponse = await authClient.refresh();
      const newAccessToken = refreshResponse.data?.accessToken ?? null;
      const newRefreshToken = refreshResponse.data?.refreshToken ?? null;

      if (!newAccessToken) {
        clearSession();
        return null;
      }

      setAuthTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
      setAccessToken(newAccessToken);

      try {
        const meResponse = await authClient.me(newAccessToken);
        if (meResponse.data) {
          const profile = meResponse.data;
          setUser(profile);
          const savedOnboarding = loadStoredOnboarding(profile.email);
          if (savedOnboarding) {
            setOnboarding(savedOnboarding);
            if (savedOnboarding.selectedLanguages[0]) {
              setPreferredLanguage(savedOnboarding.selectedLanguages[0]);
            }
          } else {
            setOnboarding(DEFAULT_COMPLETED_ONBOARDING);
          }
        }
      } catch {
        // En caso de fallo transitorio en /auth/me se conserva el token en memoria
      }

      setStatus("authenticated");
      return newAccessToken;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession]);

  const handleUnauthorizedRedirect = useCallback((): void => {
    clearSession();
    if (!PUBLIC_AUTH_PATHS.has(pathname)) {
      const nextParam =
        pathname && pathname !== "/"
          ? `?redirect=${encodeURIComponent(pathname)}`
          : "";
      router.replace(`/login${nextParam}`);
    }
  }, [clearSession, pathname, router]);

  useEffect(() => {
    registerAuthLifecycleHandlers({
      onRefresh: refreshSession,
      onUnauthorized: handleUnauthorizedRedirect,
    });

    return () => {
      registerAuthLifecycleHandlers({
        onRefresh: null,
        onUnauthorized: null,
      });
    };
  }, [refreshSession, handleUnauthorizedRedirect]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async (): Promise<void> => {
      if (!hasSessionFlagCookie() && !getRefreshToken()) {
        if (isMounted) {
          setStatus("unauthenticated");
        }
        return;
      }

      await refreshSession();
    };

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [refreshSession]);

  const login = useCallback(
    async (input: LoginInput): Promise<AuthSessionPayload> => {
      const response = await authClient.login(input);
      const session = response.data;

      setAuthTokens({
        accessToken: session.tokens.accessToken,
        refreshToken: session.tokens.refreshToken,
      });
      setAccessToken(session.tokens.accessToken);
      setUser(session.user);
      setStatus("authenticated");

      const existingOnboarding = loadStoredOnboarding(session.user.email);
      if (existingOnboarding) {
        setOnboarding(existingOnboarding);
        if (existingOnboarding.selectedLanguages[0]) {
          setPreferredLanguage(existingOnboarding.selectedLanguages[0]);
        }
      } else {
        setOnboarding(DEFAULT_COMPLETED_ONBOARDING);
        saveStoredOnboarding(session.user.email, DEFAULT_COMPLETED_ONBOARDING);
      }

      return session;
    },
    [],
  );

  const register = useCallback(
    async (
      input: RegisterWithPreferencesInput,
    ): Promise<AuthSessionPayload> => {
      const response = await authClient.register({
        email: input.email,
        password: input.password,
        fullName: input.fullName,
      });
      const session = response.data;

      setAuthTokens({
        accessToken: session.tokens.accessToken,
        refreshToken: session.tokens.refreshToken,
      });
      setAccessToken(session.tokens.accessToken);
      setUser(session.user);
      setStatus("authenticated");

      // Para un nuevo registro, se inicializa el stepper con correo sin verificar y sin plan seleccionado
      const freshOnboarding: OnboardingState = {
        ...DEFAULT_FRESH_ONBOARDING,
        selectedLanguages: input.preferredLanguage
          ? [input.preferredLanguage]
          : [],
      };
      setOnboarding(freshOnboarding);
      saveStoredOnboarding(session.user.email, freshOnboarding);

      return session;
    },
    [],
  );

  const verifyEmailMock = useCallback((): void => {
    setOnboarding((prev) => {
      const next: OnboardingState = {
        ...prev,
        emailVerified: true,
      };
      if (user?.email) {
        saveStoredOnboarding(user.email, next);
      }
      return next;
    });
  }, [user]);

  const selectPlanMock = useCallback(
    (plan: SubscriptionPlanId): void => {
      setOnboarding((prev) => {
        let adjustedLanguages = [...prev.selectedLanguages];
        if (plan === "doly" && adjustedLanguages.length > 1) {
          adjustedLanguages = adjustedLanguages.slice(0, 1);
        } else if (plan === "doly_plus" && adjustedLanguages.length > 2) {
          adjustedLanguages = adjustedLanguages.slice(0, 2);
        }

        const next: OnboardingState = {
          ...prev,
          subscriptionPlan: plan,
          hasSelectedPlan: true,
          selectedLanguages: adjustedLanguages,
        };
        if (user?.email) {
          saveStoredOnboarding(user.email, next);
        }
        return next;
      });
    },
    [user],
  );

  const selectLanguagesMock = useCallback(
    (languages: string[]): void => {
      setOnboarding((prev) => {
        const next: OnboardingState = {
          ...prev,
          selectedLanguages: languages,
          isOnboardingComplete: true,
        };
        if (languages[0]) {
          setPreferredLanguage(languages[0]);
        }
        if (user?.email) {
          saveStoredOnboarding(user.email, next);
        }
        return next;
      });
    },
    [user],
  );

  const resetOnboardingMock = useCallback((): void => {
    if (user?.email) {
      saveStoredOnboarding(user.email, DEFAULT_FRESH_ONBOARDING);
    }
    setOnboarding(DEFAULT_FRESH_ONBOARDING);
  }, [user]);

  const logout = useCallback(
    async (options?: { redirectTo?: string }): Promise<void> => {
      try {
        await authClient.logout(accessToken);
      } catch {
        // En caso de error de red se garantiza la limpieza del estado local
      } finally {
        clearSession();
        const target = sanitizeRedirectPath(
          options?.redirectTo,
          "/login",
        );
        router.replace(target === "/" ? "/login" : target);
      }
    },
    [accessToken, clearSession, router],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      status,
      isAuthenticated: status === "authenticated" && Boolean(accessToken),
      preferredLanguage,
      onboarding,
      setPreferredLanguage,
      verifyEmailMock,
      selectPlanMock,
      selectLanguagesMock,
      resetOnboardingMock,
      login,
      register,
      refreshSession,
      logout,
      clearSession,
    }),
    [
      user,
      accessToken,
      status,
      preferredLanguage,
      onboarding,
      verifyEmailMock,
      selectPlanMock,
      selectLanguagesMock,
      resetOnboardingMock,
      login,
      register,
      refreshSession,
      logout,
      clearSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder al estado de sesión, acciones de autenticación y flujo de onboarding.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de un <AuthProvider>.");
  }
  return context;
}
