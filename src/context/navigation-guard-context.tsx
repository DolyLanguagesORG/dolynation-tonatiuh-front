"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button, Heading, Icon, Text } from "@/components/ui";
import { useLocale } from "@/i18n";

export interface NavigationGuardEntry {
  id: string;
  title?: string;
  message: string;
  onConfirmLeave?: () => void;
}

export interface NavigationGuardContextValue {
  hasActiveGuard: boolean;
  registerGuard: (entry: NavigationGuardEntry) => void;
  unregisterGuard: (id: string) => void;
  allowNextNavigation: () => void;
}

type PendingNavigation =
  | { kind: "href"; href: string; fromPathname: string }
  | { kind: "back"; fromPathname: string }
  | null;

type HistoryGuardRole = "sentinel" | "active";

interface HistoryGuardState {
  __dolyNavGuard?: HistoryGuardRole;
  __dolyNavDepth?: number;
  [key: string]: unknown;
}

function buildGuardHistoryState(
  baseState: unknown,
  role?: HistoryGuardRole,
  depth?: number,
): HistoryGuardState {
  const source =
    baseState && typeof baseState === "object"
      ? { ...(baseState as Record<string, unknown>) }
      : {};
  if (role) {
    source.__dolyNavGuard = role;
    if (typeof depth === "number") {
      source.__dolyNavDepth = depth;
    } else {
      delete source.__dolyNavDepth;
    }
  } else {
    delete source.__dolyNavGuard;
    delete source.__dolyNavDepth;
  }
  return source as HistoryGuardState;
}

export const NavigationGuardContext =
  createContext<NavigationGuardContextValue | null>(null);

function isPointerOutsideDialog(
  dialog: HTMLDialogElement,
  clientX: number,
  clientY: number,
): boolean {
  const rect = dialog.getBoundingClientRect();
  return (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  );
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

/**
 * Proveedor global de protección de navegación (similar a Google Forms):
 * - Advierte al usuario si intenta recargar/cerrar pestaña (`beforeunload`).
 * - Intercepta clics en enlaces internos y retroceso/avance (`popstate`) con
 *   un diálogo editorial para confirmar o permanecer en el flujo crítico activo.
 */
export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale();

  const [guards, setGuards] = useState<NavigationGuardEntry[]>([]);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation>(null);

  const bypassRef = useRef(false);
  const bypassTimerRef = useRef<number | null>(null);
  const guardedUrlRef = useRef<string | null>(null);
  const guardedStateRef = useRef<HistoryGuardState | null>(null);
  const needsGestureRearmRef = useRef(false);
  const activeDepthRef = useRef(0);
  const prevHasGuardRef = useRef(false);
  const pathnameRef = useRef(pathname);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const stayButtonRef = useRef<HTMLButtonElement>(null);
  const startedOutsideRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  const activeGuard =
    guards.length > 0 ? guards[guards.length - 1] ?? null : null;
  const hasActiveGuard = activeGuard !== null;

  const clearBypassTimer = useCallback(() => {
    if (bypassTimerRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(bypassTimerRef.current);
      bypassTimerRef.current = null;
    }
  }, []);

  const allowNextNavigation = useCallback(() => {
    bypassRef.current = true;
    clearBypassTimer();
    if (typeof window !== "undefined") {
      bypassTimerRef.current = window.setTimeout(() => {
        bypassRef.current = false;
        bypassTimerRef.current = null;
      }, 1500);
    }
  }, [clearBypassTimer]);

  const registerGuard = useCallback((entry: NavigationGuardEntry) => {
    setGuards((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === entry.id);
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        if (
          existing &&
          existing.message === entry.message &&
          existing.title === entry.title &&
          existing.onConfirmLeave === entry.onConfirmLeave
        ) {
          return prev;
        }
        const next = [...prev];
        next[existingIndex] = entry;
        return next;
      }
      return [...prev, entry];
    });
  }, []);

  const unregisterGuard = useCallback((id: string) => {
    setGuards((prev) => {
      if (!prev.some((item) => item.id === id)) {
        return prev;
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  // Sincroniza pathname actual en ref para evitar re-adjuntar listeners en cada render.
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    return () => {
      clearBypassTimer();
    };
  }, [clearBypassTimer]);

  const armGuardSentinel = useCallback(
    (targetUrl?: string, fromUserGesture = false) => {
      if (typeof window === "undefined" || bypassRef.current) {
        return;
      }

      const url = targetUrl ?? guardedUrlRef.current ?? window.location.href;
      guardedUrlRef.current = url;
      const currentState = (window.history.state ?? {}) as HistoryGuardState;
      const hasUserActivation = fromUserGesture || hasStickyUserActivation();

      if (currentState.__dolyNavGuard === "active") {
        if (!guardedStateRef.current) {
          guardedStateRef.current = buildGuardHistoryState(currentState);
        }
        const currentDepth =
          typeof currentState.__dolyNavDepth === "number" &&
          currentState.__dolyNavDepth >= 1
            ? currentState.__dolyNavDepth
            : 1;
        activeDepthRef.current = currentDepth;
        if (hasUserActivation && needsGestureRearmRef.current) {
          try {
            window.history.pushState(
              buildGuardHistoryState(
                guardedStateRef.current,
                "active",
                currentDepth + 1,
              ),
              "",
              url,
            );
            activeDepthRef.current = currentDepth + 1;
            needsGestureRearmRef.current = false;
          } catch {
            // Ignorar si el navegador restringe pushState en el contexto actual.
          }
        }
        return;
      }

      const baseState = buildGuardHistoryState(currentState);
      guardedStateRef.current = baseState;

      try {
        if (currentState.__dolyNavGuard !== "sentinel") {
          window.history.replaceState(
            buildGuardHistoryState(baseState, "sentinel", 0),
            "",
            url,
          );
        }
        window.history.pushState(
          buildGuardHistoryState(baseState, "active", 1),
          "",
          url,
        );
        activeDepthRef.current = 1;
        needsGestureRearmRef.current = !hasUserActivation;
      } catch {
        // Ignorar si el navegador restringe pushState en el contexto actual.
      }
    },
    [],
  );

  // Gestión de sentinel en history + limpieza cuando el guard deja de estar activo.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const wasActive = prevHasGuardRef.current;
    prevHasGuardRef.current = hasActiveGuard;

    if (hasActiveGuard) {
      armGuardSentinel(window.location.href);
      return;
    }

    if (wasActive && !hasActiveGuard) {
      const currentState = (window.history.state ?? {}) as HistoryGuardState;
      const sameUrl =
        guardedUrlRef.current !== null &&
        window.location.href === guardedUrlRef.current;
      guardedUrlRef.current = null;
      guardedStateRef.current = null;
      needsGestureRearmRef.current = false;
      activeDepthRef.current = 0;

      if (
        sameUrl &&
        (currentState.__dolyNavGuard === "active" ||
          currentState.__dolyNavGuard === "sentinel") &&
        !bypassRef.current
      ) {
        if (currentState.__dolyNavGuard === "sentinel") {
          try {
            window.history.replaceState(
              buildGuardHistoryState(currentState),
              "",
              window.location.href,
            );
          } catch {
            // Ignorar errores de replaceState.
          }
          return;
        }

        const depth =
          typeof currentState.__dolyNavDepth === "number" &&
          currentState.__dolyNavDepth >= 1
            ? currentState.__dolyNavDepth
            : 1;
        bypassRef.current = true;
        clearBypassTimer();
        const resetBypassAndStripSentinel = () => {
          bypassRef.current = false;
          clearBypassTimer();
          try {
            window.history.replaceState(
              buildGuardHistoryState(window.history.state),
              "",
              window.location.href,
            );
          } catch {
            // Ignorar errores de replaceState.
          }
        };
        window.addEventListener("popstate", resetBypassAndStripSentinel, {
          once: true,
        });
        bypassTimerRef.current = window.setTimeout(() => {
          window.removeEventListener("popstate", resetBypassAndStripSentinel);
          bypassRef.current = false;
          bypassTimerRef.current = null;
        }, 300);
        try {
          window.history.go(-depth);
        } catch {
          window.removeEventListener("popstate", resetBypassAndStripSentinel);
          bypassRef.current = false;
          clearBypassTimer();
        }
      }
    }
  }, [armGuardSentinel, clearBypassTimer, hasActiveGuard]);

  // Interceptación de beforeunload, clics internos, popstate y re-armado con gesto.
  useEffect(() => {
    if (typeof window === "undefined" || !hasActiveGuard) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (bypassRef.current) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    const handleUserGestureRearm = (): void => {
      if (bypassRef.current) {
        return;
      }
      const currentState = (window.history.state ?? {}) as HistoryGuardState;
      if (
        currentState.__dolyNavGuard !== "active" ||
        needsGestureRearmRef.current
      ) {
        armGuardSentinel(
          guardedUrlRef.current ?? window.location.href,
          true,
        );
      }
    };

    const handlePopState = (event: PopStateEvent): void => {
      if (bypassRef.current) {
        bypassRef.current = false;
        return;
      }
      const nextState = (event.state ?? {}) as HistoryGuardState;
      const nextDepth =
        typeof nextState.__dolyNavDepth === "number"
          ? nextState.__dolyNavDepth
          : 0;
      if (
        nextState.__dolyNavGuard === "active" &&
        nextDepth === activeDepthRef.current
      ) {
        return;
      }

      event.stopImmediatePropagation?.();

      const restoreUrl = guardedUrlRef.current ?? window.location.href;
      const baseState =
        guardedStateRef.current ?? buildGuardHistoryState(nextState);
      try {
        if (nextState.__dolyNavGuard === "sentinel") {
          window.history.pushState(
            buildGuardHistoryState(baseState, "active", 1),
            "",
            restoreUrl,
          );
          activeDepthRef.current = 1;
        } else if (nextState.__dolyNavGuard === "active") {
          const restoredDepth = nextDepth + 1;
          window.history.pushState(
            buildGuardHistoryState(baseState, "active", restoredDepth),
            "",
            restoreUrl,
          );
          activeDepthRef.current = restoredDepth;
        } else {
          window.history.pushState(
            buildGuardHistoryState(baseState, "sentinel", 0),
            "",
            restoreUrl,
          );
          window.history.pushState(
            buildGuardHistoryState(baseState, "active", 1),
            "",
            restoreUrl,
          );
          activeDepthRef.current = 1;
        }
      } catch {
        // Ignorar errores de pushState en entornos restringidos.
      }
      needsGestureRearmRef.current = !hasStickyUserActivation();
      setPendingNavigation({ kind: "back", fromPathname: pathnameRef.current });
    };

    const handleDocumentClick = (event: MouseEvent): void => {
      if (
        bypassRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }

      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const rawHref = anchor.getAttribute("href");
      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:")
      ) {
        return;
      }

      let resolvedUrl: URL;
      try {
        resolvedUrl = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (resolvedUrl.origin !== window.location.origin) {
        return;
      }

      const currentUrl = new URL(window.location.href);
      if (
        resolvedUrl.pathname === currentUrl.pathname &&
        resolvedUrl.search === currentUrl.search
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setPendingNavigation({
        kind: "href",
        href: `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`,
        fromPathname: pathnameRef.current,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState, true);
    window.addEventListener("pointerdown", handleUserGestureRearm, {
      capture: true,
      passive: true,
    });
    window.addEventListener("keydown", handleUserGestureRearm, {
      capture: true,
      passive: true,
    });
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState, true);
      window.removeEventListener("pointerdown", handleUserGestureRearm, true);
      window.removeEventListener("keydown", handleUserGestureRearm, true);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [armGuardSentinel, hasActiveGuard]);

  const effectivePendingNavigation =
    pendingNavigation &&
    pendingNavigation.fromPathname === pathname &&
    activeGuard !== null
      ? pendingNavigation
      : null;

  const isDialogOpen = effectivePendingNavigation !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    dialog.setAttribute("closedby", "any");

    if (isDialogOpen) {
      if (typeof dialog.showModal === "function") {
        if (!dialog.open) {
          dialog.showModal();
        }
      } else {
        dialog.setAttribute("open", "");
      }
      stayButtonRef.current?.focus();
      return;
    }

    if (typeof dialog.close === "function") {
      if (dialog.open) {
        dialog.close();
      }
    } else {
      dialog.removeAttribute("open");
    }
  }, [isDialogOpen]);

  const handleStay = useCallback(() => {
    setPendingNavigation(null);
    armGuardSentinel(undefined, true);
  }, [armGuardSentinel]);

  const handleConfirmLeave = useCallback(() => {
    const currentPending = effectivePendingNavigation;
    setPendingNavigation(null);
    if (!currentPending) {
      return;
    }

    for (const guard of [...guards].reverse()) {
      guard.onConfirmLeave?.();
    }

    allowNextNavigation();

    const currentState = (
      typeof window !== "undefined" ? window.history.state ?? {} : {}
    ) as HistoryGuardState;

    if (currentPending.kind === "href") {
      if (currentState.__dolyNavGuard) {
        router.replace(currentPending.href);
      } else {
        router.push(currentPending.href);
      }
      return;
    }

    if (typeof window !== "undefined") {
      if (currentState.__dolyNavGuard === "active") {
        const depth =
          typeof currentState.__dolyNavDepth === "number" &&
          currentState.__dolyNavDepth >= 1
            ? currentState.__dolyNavDepth
            : 1;
        window.history.go(-(depth + 1));
      } else {
        window.history.back();
      }
    }
  }, [allowNextNavigation, effectivePendingNavigation, guards, router]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) {
      startedOutsideRef.current = false;
      return;
    }
    startedOutsideRef.current = isPointerOutsideDialog(
      dialog,
      event.clientX,
      event.clientY,
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) {
      startedOutsideRef.current = false;
      return;
    }
    const supportsNativeClosedBy = "closedBy" in HTMLDialogElement.prototype;
    if (
      !supportsNativeClosedBy &&
      startedOutsideRef.current &&
      isPointerOutsideDialog(dialog, event.clientX, event.clientY)
    ) {
      startedOutsideRef.current = false;
      handleStay();
      return;
    }
    startedOutsideRef.current = false;
  };

  const value = useMemo<NavigationGuardContextValue>(
    () => ({
      hasActiveGuard,
      registerGuard,
      unregisterGuard,
      allowNextNavigation,
    }),
    [allowNextNavigation, hasActiveGuard, registerGuard, unregisterGuard],
  );

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => {
          event.preventDefault();
          handleStay();
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="m-auto w-[min(100%-2rem,28rem)] rounded-base border border-default bg-neutral-primary-soft p-0 text-heading shadow-xl backdrop:bg-brand/40 backdrop:backdrop-blur-[1px]"
      >
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-base border border-default-medium bg-neutral-secondary-soft text-heading"
            >
              <Icon name="alert-triangle" size="sm" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Heading id={titleId} as="h2" variant="subsection">
                {activeGuard?.title ?? t.navigationGuard.title}
              </Heading>
              <Text id={descriptionId} variant="small" tone="body">
                {activeGuard?.message ?? ""}
              </Text>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-default pt-4">
            <Button
              ref={stayButtonRef}
              type="button"
              variant="primary"
              size="sm"
              autoFocus
              onClick={handleStay}
            >
              {t.navigationGuard.stayButton}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleConfirmLeave}
            >
              {t.navigationGuard.leaveButton}
            </Button>
          </div>
        </div>
      </dialog>
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuardContext(): NavigationGuardContextValue | null {
  return useContext(NavigationGuardContext);
}
