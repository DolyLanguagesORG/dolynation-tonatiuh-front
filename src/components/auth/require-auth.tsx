"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { Container } from "@/components/ui";
import { useAuth } from "@/context";

export interface RequireAuthProps {
  children: ReactNode;
  /**
   * Contenido opcional mostrado mientras se resuelve la sesión inicial.
   */
  fallback?: ReactNode;
}

/**
 * Guardia de protección de rutas privadas en el cliente.
 * - Si la sesión se resuelve como `unauthenticated`, redirige a `/login?redirect=<ruta>`.
 * - Si el usuario está autenticado pero no ha seleccionado un plan de suscripción,
 *   lo redirige al paso de selección de plan en `/register?step=3` impidiendo explorar el sistema.
 */
export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { status, isAuthenticated, onboarding } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      const nextParam =
        pathname && pathname !== "/"
          ? `?redirect=${encodeURIComponent(pathname)}`
          : "";
      router.replace(`/login${nextParam}`);
      return;
    }

    if (isAuthenticated && !onboarding.hasSelectedPlan) {
      router.replace("/register?step=3");
      return;
    }

    if (
      isAuthenticated &&
      onboarding.hasSelectedPlan &&
      !onboarding.isOnboardingComplete
    ) {
      router.replace("/register?step=4");
    }
  }, [status, isAuthenticated, onboarding, pathname, router]);

  if (
    status === "loading" ||
    !isAuthenticated ||
    !onboarding.hasSelectedPlan ||
    !onboarding.isOnboardingComplete
  ) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Container
        size="md"
        role="status"
        aria-live="polite"
        className="flex flex-col gap-4 py-12"
      >
        <div className="h-6 w-48 animate-pulse rounded-xs bg-surface-muted" />
        <div className="h-32 w-full animate-pulse rounded-xs border border-border bg-surface" />
      </Container>
    );
  }

  return <>{children}</>;
}
