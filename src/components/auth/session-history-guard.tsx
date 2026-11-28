"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import {
  LOGGED_OUT_BARRIER_STORAGE_KEY,
  OAUTH_RETURN_HINT_COOKIE_NAME,
  OAUTH_SESSION_PROVIDER_STORAGE_KEY,
  useAuth,
  useNavigationGuardContext,
} from "@/context";
import { useToast } from "@/context/toast-context";
import { formatMessage, useLocale } from "@/i18n";

const OAUTH_SELECT_PLAN_GUARD_STORAGE_KEY = "doly.select_plan_oauth_guard";
const TOAST_COOLDOWN_MS = 2_500;

type SessionGuardMode = "onboarding" | "auth" | "logged_out";
type SessionGuardRole = "floor" | "active";

interface SessionGuardHistoryState {
  __dolySessionGuard?: SessionGuardRole;
  __dolySessionMode?: SessionGuardMode;
  __dolyOAuthSelectPlanGuard?: unknown;
  [key: string]: unknown;
}

function buildSessionGuardState(
  baseState: unknown,
  role: SessionGuardRole,
  mode: SessionGuardMode,
): SessionGuardHistoryState {
  const source =
    baseState && typeof baseState === "object"
      ? { ...(baseState as Record<string, unknown>) }
      : {};
  source.__dolySessionGuard = role;
  source.__dolySessionMode = mode;
  return source as SessionGuardHistoryState;
}

function hasStickyUserActivation(): boolean {
  if (typeof navigator === "undefined" || !navigator.userActivation) {
    return true;
  }
  return (
    navigator.userActivation.isActive ||
    navigator.userActivation.hasBeenActive
  );
}

function formatOAuthProviderLabel(rawProvider: string): string {
  const normalized = rawProvider.trim().toLowerCase();
  if (normalized === "google") {
    return "Google";
  }
  if (normalized === "microsoft") {
    return "Microsoft";
  }
  if (!normalized) {
    return "OAuth";
  }
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}

function consumeOAuthProviderCookie(): void {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const cookieEntries = document.cookie.split(";");
  let rawValue: string | null = null;

  for (const entry of cookieEntries) {
    const trimmed = entry.trim();
    const prefix = `${OAUTH_RETURN_HINT_COOKIE_NAME}=`;
    if (trimmed.startsWith(prefix)) {
      rawValue = trimmed.slice(prefix.length);
      break;
    }
  }

  if (!rawValue) {
    return;
  }

  let decoded = rawValue;
  try {
    decoded = decodeURIComponent(rawValue);
  } catch {
    // Mantener el valor original si falla el decodificado.
  }

  try {
    window.sessionStorage.setItem(
      OAUTH_SESSION_PROVIDER_STORAGE_KEY,
      formatOAuthProviderLabel(decoded),
    );
  } catch {
    // Ignorar restricciones de sessionStorage.
  }

  document.cookie = `${OAUTH_RETURN_HINT_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function readStoredOAuthProvider(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.sessionStorage.getItem(OAUTH_SESSION_PROVIDER_STORAGE_KEY);
  } catch {
    return null;
  }
}

function hasOAuthSelectPlanGuard(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const state = window.history.state as SessionGuardHistoryState | null;
  if (state?.__dolyOAuthSelectPlanGuard) {
    return true;
  }
  try {
    return (
      window.sessionStorage.getItem(OAUTH_SELECT_PLAN_GUARD_STORAGE_KEY) !==
      null
    );
  } catch {
    return false;
  }
}

function hasLoggedOutBarrier(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.sessionStorage.getItem(LOGGED_OUT_BARRIER_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Guardia global del historial de sesión (`popstate`):
 * - Evita retroceder desde una sesión autenticada al formulario `/login` o al callback OAuth externo.
 * - Impide regresar tras cerrar sesión desde `/login` a pantallas privadas en caché.
 * - Refuerza la permanencia en pasos obligatorios de onboarding (`/verify-email`, `/select-plan`)
 *   cediendo automáticamente el paso a `NavigationGuardProvider` y al guardia OAuth de `#199`.
 */
export function SessionHistoryGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, accessPhase } = useAuth();
  const { t } = useLocale();
  const { info: showInfoToast } = useToast();
  const navigationGuard = useNavigationGuardContext();

  const hasActiveNavGuard = Boolean(navigationGuard?.hasActiveGuard);
  const hasActiveNavGuardRef = useRef(hasActiveNavGuard);
  const authFloorArmedRef = useRef(false);
  const authFloorUrlRef = useRef<string | null>(null);
  const needsGestureRearmRef = useRef(false);
  const lastToastAtRef = useRef(0);
  const navMessagesRef = useRef(t.navigationGuard);

  useEffect(() => {
    hasActiveNavGuardRef.current = hasActiveNavGuard;
  }, [hasActiveNavGuard]);

  useEffect(() => {
    navMessagesRef.current = t.navigationGuard;
  }, [t.navigationGuard]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (isAuthenticated) {
      try {
        window.sessionStorage.removeItem(LOGGED_OUT_BARRIER_STORAGE_KEY);
      } catch {
        // Ignorar restricciones de sessionStorage.
      }
      consumeOAuthProviderCookie();
      return;
    }

    if (!isLoading) {
      authFloorArmedRef.current = false;
      authFloorUrlRef.current = null;
      needsGestureRearmRef.current = false;
    }
  }, [isAuthenticated, isLoading]);

  const notifyThrottled = useCallback(
    (message: string) => {
      const now = Date.now();
      if (now - lastToastAtRef.current < TOAST_COOLDOWN_MS) {
        return;
      }
      lastToastAtRef.current = now;
      showInfoToast(message);
    },
    [showInfoToast],
  );

  let activeMode: SessionGuardMode | null = null;
  if (!isLoading && accessPhase !== "loading") {
    if (
      (accessPhase === "unverified_email" && pathname === "/verify-email") ||
      (accessPhase === "plan_required" && pathname === "/select-plan")
    ) {
      activeMode = "onboarding";
    } else if (
      isAuthenticated &&
      (accessPhase === "ready" || accessPhase === "admin") &&
      pathname !== "/login" &&
      pathname !== "/register"
    ) {
      activeMode = "auth";
    } else if (
      !isAuthenticated &&
      accessPhase === "unauthenticated" &&
      pathname === "/login"
    ) {
      activeMode = "logged_out";
    }
  }

  useEffect(() => {
    if (typeof window === "undefined" || !activeMode || hasActiveNavGuard) {
      return;
    }

    if (
      activeMode === "onboarding" &&
      pathname === "/select-plan" &&
      hasOAuthSelectPlanGuard()
    ) {
      return;
    }

    if (activeMode === "logged_out" && !hasLoggedOutBarrier()) {
      return;
    }

    const guardedUrl =
      activeMode === "auth"
        ? (authFloorUrlRef.current ?? window.location.href)
        : window.location.href;

    const armSessionPair = (targetUrl: string, fromUserGesture: boolean) => {
      if (hasActiveNavGuardRef.current) {
        return;
      }
      const currentState = (window.history.state ?? {}) as SessionGuardHistoryState;
      const hasGesture = fromUserGesture || hasStickyUserActivation();

      if (
        currentState.__dolySessionGuard === "active" &&
        currentState.__dolySessionMode === activeMode
      ) {
        if (hasGesture && needsGestureRearmRef.current) {
          try {
            window.history.pushState(
              buildSessionGuardState(currentState, "active", activeMode),
              "",
              targetUrl,
            );
            needsGestureRearmRef.current = false;
          } catch {
            // Ignorar si el navegador restringe history API.
          }
        }
        return;
      }

      try {
        if (
          currentState.__dolySessionGuard !== "floor" ||
          currentState.__dolySessionMode !== activeMode
        ) {
          window.history.replaceState(
            buildSessionGuardState(currentState, "floor", activeMode),
            "",
            targetUrl,
          );
        }
        window.history.pushState(
          buildSessionGuardState(currentState, "active", activeMode),
          "",
          targetUrl,
        );
        needsGestureRearmRef.current = !hasGesture;
      } catch {
        // Ignorar si el navegador restringe history API.
      }
    };

    if (activeMode === "auth") {
      if (!authFloorArmedRef.current) {
        authFloorUrlRef.current = guardedUrl;
        authFloorArmedRef.current = true;
        armSessionPair(guardedUrl, false);
      }
    } else {
      armSessionPair(guardedUrl, false);
    }

    const handleUserGestureRearm = (): void => {
      if (hasActiveNavGuardRef.current) {
        return;
      }
      if (
        activeMode === "onboarding" &&
        pathname === "/select-plan" &&
        hasOAuthSelectPlanGuard()
      ) {
        return;
      }
      if (activeMode === "logged_out" && !hasLoggedOutBarrier()) {
        return;
      }
      if (activeMode === "auth") {
        const floorUrl = authFloorUrlRef.current;
        if (!floorUrl || window.location.href !== floorUrl) {
          return;
        }
      }

      const currentState = (window.history.state ?? {}) as SessionGuardHistoryState;
      if (
        currentState.__dolySessionGuard !== "active" ||
        currentState.__dolySessionMode !== activeMode ||
        needsGestureRearmRef.current
      ) {
        armSessionPair(
          activeMode === "auth"
            ? (authFloorUrlRef.current ?? window.location.href)
            : window.location.href,
          true,
        );
      }
    };

    const handlePopState = (event: PopStateEvent): void => {
      if (hasActiveNavGuardRef.current) {
        return;
      }

      const nextState = (event.state ?? {}) as SessionGuardHistoryState;
      const messages = navMessagesRef.current;

      if (activeMode === "auth") {
        if (
          nextState.__dolySessionGuard !== "floor" ||
          nextState.__dolySessionMode !== "auth"
        ) {
          return;
        }

        event.stopImmediatePropagation?.();
        const restoreUrl = authFloorUrlRef.current ?? window.location.href;
        try {
          window.history.pushState(
            buildSessionGuardState(nextState, "active", "auth"),
            "",
            restoreUrl,
          );
        } catch {
          // Ignorar si el navegador restringe pushState.
        }
        needsGestureRearmRef.current = !hasStickyUserActivation();

        const oauthProvider = readStoredOAuthProvider();
        notifyThrottled(
          oauthProvider
            ? formatMessage(messages.oauthSessionFloorNotice, {
                provider: oauthProvider,
              })
            : messages.sessionFloorNotice,
        );
        return;
      }

      if (activeMode === "onboarding") {
        if (pathname === "/select-plan" && hasOAuthSelectPlanGuard()) {
          return;
        }
        if (
          nextState.__dolySessionGuard === "active" &&
          nextState.__dolySessionMode === "onboarding"
        ) {
          return;
        }

        event.stopImmediatePropagation?.();
        try {
          window.history.pushState(
            buildSessionGuardState(nextState, "active", "onboarding"),
            "",
            guardedUrl,
          );
        } catch {
          // Ignorar si el navegador restringe pushState.
        }
        needsGestureRearmRef.current = !hasStickyUserActivation();
        notifyThrottled(messages.onboardingStepBackNotice);
        return;
      }

      if (activeMode === "logged_out") {
        if (!hasLoggedOutBarrier()) {
          return;
        }
        if (
          nextState.__dolySessionGuard === "active" &&
          nextState.__dolySessionMode === "logged_out"
        ) {
          return;
        }

        event.stopImmediatePropagation?.();
        const loginUrl =
          window.location.pathname === "/login"
            ? window.location.href
            : new URL("/login", window.location.origin).toString();
        try {
          window.history.pushState(
            buildSessionGuardState(nextState, "active", "logged_out"),
            "",
            loginUrl,
          );
        } catch {
          // Ignorar si el navegador restringe pushState.
        }
        needsGestureRearmRef.current = !hasStickyUserActivation();
        if (window.location.pathname !== "/login") {
          router.replace("/login");
        }
        notifyThrottled(messages.loggedOutBackNotice);
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pointerdown", handleUserGestureRearm, {
      capture: true,
      passive: true,
    });
    window.addEventListener("keydown", handleUserGestureRearm, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pointerdown", handleUserGestureRearm, true);
      window.removeEventListener("keydown", handleUserGestureRearm, true);
    };
  }, [activeMode, hasActiveNavGuard, notifyThrottled, pathname, router]);

  return null;
}
