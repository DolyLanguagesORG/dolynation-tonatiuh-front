"use client";

import { useEffect, useRef } from "react";

import { type AccountAccessPhase } from "@/lib";

export const OAUTH_BACK_GUARD_STORAGE_KEY = "doly.select_plan_oauth_guard";
export const OAUTH_QUERY_PARAM = "oauth";
export const OAUTH_HISTORY_STATE_KEY = "__dolyOAuthSelectPlanGuard";

type HistoryGuardRole = "sentinel" | "active";

export interface UseOAuthBackGuardOptions {
  accessPhase: AccountAccessPhase;
  onBackIntercepted: () => void;
}

function readStoredOAuthProvider(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(OAUTH_BACK_GUARD_STORAGE_KEY);
    return raw?.trim() || null;
  } catch {
    return null;
  }
}

function persistOAuthProvider(provider: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(OAUTH_BACK_GUARD_STORAGE_KEY, provider);
  } catch {
    // Sin impacto funcional si sessionStorage está deshabilitado.
  }
}

/**
 * Elimina el marcador de sesión usado para detectar retornos post-OAuth en `/select-plan`.
 */
export function clearOAuthBackGuardMarker(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.removeItem(OAUTH_BACK_GUARD_STORAGE_KEY);
  } catch {
    // Sin impacto funcional si sessionStorage está deshabilitado.
  }
}

function buildCleanSelectPlanUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.delete(OAUTH_QUERY_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

function readHistoryGuardRole(state: unknown): HistoryGuardRole | null {
  if (typeof state !== "object" || state === null) {
    return null;
  }
  const role = (state as Record<string, unknown>)[OAUTH_HISTORY_STATE_KEY];
  return role === "sentinel" || role === "active" ? role : null;
}

function mergeHistoryState(
  currentState: unknown,
  role: HistoryGuardRole,
): Record<string, unknown> {
  if (typeof currentState === "object" && currentState !== null) {
    return {
      ...(currentState as Record<string, unknown>),
      [OAUTH_HISTORY_STATE_KEY]: role,
    };
  }
  return { [OAUTH_HISTORY_STATE_KEY]: role };
}

/**
 * Protege el historial del navegador en `/select-plan` cuando el usuario llega desde
 * un callback OAuth externo, evitando que el botón «Atrás» reenvíe GET a un endpoint
 * POST-only de Microsoft Entra ID (`AADSTS900561`).
 */
export function useOAuthBackGuard({
  accessPhase,
  onBackIntercepted,
}: UseOAuthBackGuardOptions): void {
  const onBackInterceptedRef = useRef(onBackIntercepted);
  const rearmedRef = useRef(false);

  useEffect(() => {
    onBackInterceptedRef.current = onBackIntercepted;
  }, [onBackIntercepted]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (
      accessPhase === "ready" ||
      accessPhase === "unauthenticated" ||
      accessPhase === "admin"
    ) {
      clearOAuthBackGuardMarker();
      return;
    }

    if (accessPhase !== "loading" && accessPhase !== "plan_required") {
      return;
    }

    const oauthParam =
      new URLSearchParams(window.location.search)
        .get(OAUTH_QUERY_PARAM)
        ?.trim() ?? "";
    const provider = oauthParam || readStoredOAuthProvider();
    if (!provider) {
      return;
    }

    if (oauthParam) {
      persistOAuthProvider(oauthParam);
    }

    const cleanUrl = buildCleanSelectPlanUrl();
    const currentRole = readHistoryGuardRole(window.history.state);

    if (currentRole !== "active") {
      window.history.replaceState(
        mergeHistoryState(window.history.state, "sentinel"),
        "",
        cleanUrl,
      );
      window.history.pushState(
        mergeHistoryState(window.history.state, "active"),
        "",
        cleanUrl,
      );
    } else if (oauthParam) {
      window.history.replaceState(
        mergeHistoryState(window.history.state, "active"),
        "",
        cleanUrl,
      );
    }

    const handlePopState = (event: PopStateEvent): void => {
      if (readHistoryGuardRole(event.state) !== "sentinel") {
        return;
      }
      window.history.pushState(
        mergeHistoryState(event.state, "active"),
        "",
        buildCleanSelectPlanUrl(),
      );
      onBackInterceptedRef.current();
    };

    // Re-armamos una vez tras la primera interacción real para mitigar la
    // heurística History Manipulation Intervention en Chromium cuando el
    // documento aún no contaba con activación de usuario.
    const handleFirstUserActivation = (): void => {
      if (rearmedRef.current) {
        return;
      }
      rearmedRef.current = true;
      window.removeEventListener("pointerdown", handleFirstUserActivation, {
        capture: true,
      });
      window.removeEventListener("keydown", handleFirstUserActivation, {
        capture: true,
      });

      const latestCleanUrl = buildCleanSelectPlanUrl();
      window.history.replaceState(
        mergeHistoryState(window.history.state, "sentinel"),
        "",
        latestCleanUrl,
      );
      window.history.pushState(
        mergeHistoryState(window.history.state, "active"),
        "",
        latestCleanUrl,
      );
    };

    window.addEventListener("popstate", handlePopState);
    if (!rearmedRef.current) {
      window.addEventListener("pointerdown", handleFirstUserActivation, {
        capture: true,
        passive: true,
      });
      window.addEventListener("keydown", handleFirstUserActivation, {
        capture: true,
        passive: true,
      });
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pointerdown", handleFirstUserActivation, {
        capture: true,
      });
      window.removeEventListener("keydown", handleFirstUserActivation, {
        capture: true,
      });
    };
  }, [accessPhase]);
}
