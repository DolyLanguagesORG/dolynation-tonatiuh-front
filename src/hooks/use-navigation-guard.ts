"use client";

import { useCallback, useContext, useEffect, useId, useRef } from "react";

import { NavigationGuardContext } from "@/context/navigation-guard-context";

export interface UseNavigationGuardOptions {
  /** Activa el bloqueo preventivo ante recargas, cierre o navegación hacia atrás/enlaces. */
  active: boolean;
  /** Mensaje explicativo mostrado al usuario cuando intenta abandonar el flujo activo. */
  message: string;
  /** Título opcional del diálogo de confirmación. */
  title?: string;
}

export interface UseNavigationGuardReturn {
  /** Permite la siguiente navegación programática (`router.replace`, `push` o redirect) sin interceptarla. */
  allowNextNavigation: () => void;
}

/**
 * Registra un candado preventivo de navegación mientras `active` sea `true`.
 * Si se renderiza fuera de `<NavigationGuardProvider>` (por ejemplo en pruebas unitarias
 * aisladas), aplica al menos el listener local de `beforeunload` sin lanzar errores.
 */
export function useNavigationGuard({
  active,
  message,
  title,
}: UseNavigationGuardOptions): UseNavigationGuardReturn {
  const guardId = useId();
  const context = useContext(NavigationGuardContext);
  const localBypassRef = useRef(false);

  const registerGuard = context?.registerGuard;
  const unregisterGuard = context?.unregisterGuard;
  const contextAllowNext = context?.allowNextNavigation;

  useEffect(() => {
    if (!registerGuard || !unregisterGuard) {
      return;
    }

    if (!active) {
      unregisterGuard(guardId);
      return;
    }

    registerGuard({ id: guardId, message, title });
    return () => {
      unregisterGuard(guardId);
    };
  }, [active, guardId, message, registerGuard, title, unregisterGuard]);

  useEffect(() => {
    if (context || typeof window === "undefined" || !active) {
      localBypassRef.current = false;
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (localBypassRef.current) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [active, context]);

  const allowNextNavigation = useCallback(() => {
    if (contextAllowNext) {
      contextAllowNext();
      return;
    }
    localBypassRef.current = true;
  }, [contextAllowNext]);

  return { allowNextNavigation };
}
