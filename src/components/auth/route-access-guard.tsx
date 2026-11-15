"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

import { Container, SkeletonCard } from "@/components/ui";
import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import {
  type AccountAccessPhase,
  ROUTE_VERIFY_EMAIL,
  routeAccessService,
} from "@/lib";

export interface RouteAccessGuardProps {
  children: ReactNode;
}

function InnerRouteAccessGuard({
  pathname,
  accessPhase,
  hasVerifyToken,
  children,
}: {
  pathname: string;
  accessPhase: AccountAccessPhase;
  hasVerifyToken: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const { locale } = useLocale();

  const decision = routeAccessService.evaluate({
    pathname,
    phase: accessPhase,
    hasVerifyToken,
  });

  useEffect(() => {
    if (!decision.allowed && decision.redirectTo) {
      const target =
        decision.reason === "authentication_required" && pathname !== "/"
          ? `${decision.redirectTo}?redirect=${encodeURIComponent(pathname)}`
          : decision.redirectTo;
      router.replace(target);
    }
  }, [decision.allowed, decision.reason, decision.redirectTo, pathname, router]);

  if (!decision.allowed) {
    const label =
      decision.reason === "email_verification_required"
        ? locale === "es"
          ? "Redirigiendo a confirmación de correo..."
          : "Redirecting to email verification..."
        : decision.reason === "subscription_plan_required"
          ? locale === "es"
            ? "Redirigiendo a selección de plan..."
            : "Redirecting to plan selection..."
          : locale === "es"
            ? "Verificando acceso de cuenta..."
            : "Checking account access...";

    return (
      <Container size="md" className="py-10">
        <SkeletonCard lines={4} label={label} />
      </Container>
    );
  }

  return <>{children}</>;
}

function VerifyTokenRouteGuard({
  pathname,
  accessPhase,
  children,
}: {
  pathname: string;
  accessPhase: AccountAccessPhase;
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const hasVerifyToken = Boolean(searchParams.get("token")?.trim());

  return (
    <InnerRouteAccessGuard
      pathname={pathname}
      accessPhase={accessPhase}
      hasVerifyToken={hasVerifyToken}
    >
      {children}
    </InnerRouteAccessGuard>
  );
}

/**
 * Guard global de navegación que aplica `routeAccessService` sobre cada ruta de la app.
 *
 * Bloquea cualquier interacción o vista fuera de la fase actual del usuario:
 * - Correo sin confirmar (`unverified_email`) -> solo `/verify-email`.
 * - Correo confirmado sin plan (`plan_required`) -> solo las rutas declaradas en
 *   `ROUTES_ALLOWED_WITHOUT_PLAN` (`/select-plan` por defecto).
 */
export function RouteAccessGuard({ children }: RouteAccessGuardProps) {
  const pathname = usePathname();
  const { accessPhase } = useAuth();

  if (pathname === ROUTE_VERIFY_EMAIL) {
    return (
      <Suspense
        fallback={
          <Container size="md" className="py-10">
            <SkeletonCard lines={4} label="Cargando verificación..." />
          </Container>
        }
      >
        <VerifyTokenRouteGuard pathname={pathname} accessPhase={accessPhase}>
          {children}
        </VerifyTokenRouteGuard>
      </Suspense>
    );
  }

  return (
    <InnerRouteAccessGuard
      pathname={pathname}
      accessPhase={accessPhase}
      hasVerifyToken={false}
    >
      {children}
    </InnerRouteAccessGuard>
  );
}
