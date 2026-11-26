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

interface HistoryGuardState {
  __dolyNavGuard?: boolean;
  [key: string]: unknown;
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
          existing.title === entry.title
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

  // Gestión de sentinel en history + limpieza cuando el guard deja de estar activo.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const wasActive = prevHasGuardRef.current;
    prevHasGuardRef.current = hasActiveGuard;

    if (hasActiveGuard) {
      const currentHref = window.location.href;
      guardedUrlRef.current = currentHref;
      const currentState = (window.history.state ?? {}) as HistoryGuardState;
      if (!currentState.__dolyNavGuard) {
        try {
          window.history.pushState(
            { ...currentState, __dolyNavGuard: true },
            "",
            currentHref,
          );
        } catch {
          // Ignorar si el navegador restringe pushState en el contexto actual.
        }
      }
      return;
    }

    if (wasActive && !hasActiveGuard) {
      const currentState = (window.history.state ?? {}) as HistoryGuardState;
      const sameUrl =
        guardedUrlRef.current !== null &&
        window.location.href === guardedUrlRef.current;
      guardedUrlRef.current = null;

      if (sameUrl && currentState.__dolyNavGuard && !bypassRef.current) {
        bypassRef.current = true;
        clearBypassTimer();
        const resetBypass = () => {
          bypassRef.current = false;
          clearBypassTimer();
        };
        window.addEventListener("popstate", resetBypass, { once: true });
        bypassTimerRef.current = window.setTimeout(() => {
          window.removeEventListener("popstate", resetBypass);
          bypassRef.current = false;
          bypassTimerRef.current = null;
        }, 300);
        try {
          window.history.back();
        } catch {
          window.removeEventListener("popstate", resetBypass);
          resetBypass();
        }
      }
    }
  }, [clearBypassTimer, hasActiveGuard]);

  // Interceptación de beforeunload, clics internos y popstate mientras haya guard activo.
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

    const handlePopState = (event: PopStateEvent): void => {
      if (bypassRef.current) {
        bypassRef.current = false;
        return;
      }
      const nextState = (event.state ?? {}) as HistoryGuardState;
      if (nextState.__dolyNavGuard) {
        return;
      }

      const restoreUrl = guardedUrlRef.current ?? window.location.href;
      try {
        window.history.pushState(
          { ...nextState, __dolyNavGuard: true },
          "",
          restoreUrl,
        );
      } catch {
        // Ignorar errores de pushState en entornos restringidos.
      }
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
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [hasActiveGuard]);

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
  }, []);

  const handleConfirmLeave = useCallback(() => {
    const currentPending = effectivePendingNavigation;
    setPendingNavigation(null);
    if (!currentPending) {
      return;
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
      if (currentState.__dolyNavGuard) {
        window.history.go(-2);
      } else {
        window.history.back();
      }
    }
  }, [allowNextNavigation, effectivePendingNavigation, router]);

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
        className="m-auto w-[min(100%-2rem,28rem)] rounded-base border border-default bg-neutral-primary-soft p-0 text-heading shadow-xl"
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
