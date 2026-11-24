"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

import {
  Container,
  LocalizedSkeletonCard,
  SkeletonCard,
} from "@/components/ui";
import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import {
  type AccountAccessPhase,
  consumePendingInviteRedirect,
  normalizeRoutePath,
  peekPendingInviteRedirect,
  ROUTE_SELECT_PLAN,
  ROUTE_SETUP_PREFERENCES,
  ROUTE_VERIFY_EMAIL,
  routeAccessService,
} from "@/lib";

export interface RouteAccessGuardProps {
  children: ReactNode;
}

function InnerRouteAccessGuard({
  pathname,
  accessPhase,
  canGenerateReadings,
  hasVerifyToken,
  children,
}: {
  pathname: string;
  accessPhase: AccountAccessPhase;
  canGenerateReadings: boolean;
  hasVerifyToken: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const { t } = useLocale();

  const decision = routeAccessService.evaluate({
    pathname,
    phase: accessPhase,
    hasVerifyToken,
  });

  useEffect(() => {
    if (!decision.allowed && decision.redirectTo) {
      const normalized = normalizeRoutePath(pathname);
      const target =
        decision.reason === "authentication_required" && pathname !== "/"
          ? `${decision.redirectTo}?redirect=${encodeURIComponent(pathname)}`
          : decision.reason === "already_authenticated" &&
              normalized === ROUTE_SELECT_PLAN &&
              !canGenerateReadings
            ? ROUTE_SETUP_PREFERENCES
            : decision.reason === "already_authenticated" &&
                peekPendingInviteRedirect()
              ? (consumePendingInviteRedirect() ?? decision.redirectTo)
              : decision.redirectTo;
      router.replace(target);
    }
  }, [
    canGenerateReadings,
    decision.allowed,
    decision.reason,
    decision.redirectTo,
    pathname,
    router,
  ]);

  if (!decision.allowed) {
    const label =
      decision.reason === "email_verification_required" ||
      decision.reason === "subscription_plan_required"
        ? t.guards.preparingStep
        : t.guards.validatingSession;

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
  canGenerateReadings,
  children,
}: {
  pathname: string;
  accessPhase: AccountAccessPhase;
  canGenerateReadings: boolean;
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const hasVerifyToken = Boolean(searchParams.get("token")?.trim());

  return (
    <InnerRouteAccessGuard
      pathname={pathname}
      accessPhase={accessPhase}
      canGenerateReadings={canGenerateReadings}
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
  const { accessPhase, onboarding } = useAuth();
  const canGenerateReadings = onboarding?.canGenerateReadings ?? true;

  if (pathname === ROUTE_VERIFY_EMAIL) {
    return (
      <Suspense
        fallback={
          <Container size="md" className="py-10">
            <LocalizedSkeletonCard lines={4} labelKey="loadingVerification" />
          </Container>
        }
      >
        <VerifyTokenRouteGuard
          pathname={pathname}
          accessPhase={accessPhase}
          canGenerateReadings={canGenerateReadings}
        >
          {children}
        </VerifyTokenRouteGuard>
      </Suspense>
    );
  }

  return (
    <InnerRouteAccessGuard
      pathname={pathname}
      accessPhase={accessPhase}
      canGenerateReadings={canGenerateReadings}
      hasVerifyToken={false}
    >
      {children}
    </InnerRouteAccessGuard>
  );
}
