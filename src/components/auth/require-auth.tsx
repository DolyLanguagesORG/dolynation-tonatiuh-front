"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Container, SkeletonCard } from "@/components/ui";
import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import { ROUTE_SELECT_PLAN, ROUTE_VERIFY_EMAIL } from "@/lib";

export interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Protector de vistas privadas (`/profile`, `/generate`, `/readings`, `/glossary`, `/setup-preferences`).
 *
 * Coordina el estado de sesión y las fases obligatorias previas (correo no verificado o
 * cuenta sin plan de suscripción). Ya con plan seleccionado, permite navegar libremente.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLocale();
  const { accessPhase, isAuthenticated } = useAuth();

  useEffect(() => {
    if (accessPhase === "loading") {
      return;
    }
    if (accessPhase === "unverified_email") {
      router.replace(ROUTE_VERIFY_EMAIL);
      return;
    }
    if (accessPhase === "plan_required") {
      router.replace(ROUTE_SELECT_PLAN);
      return;
    }
    if (!isAuthenticated) {
      const target = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${target}`);
    }
  }, [accessPhase, isAuthenticated, pathname, router]);

  if (accessPhase !== "ready" || !isAuthenticated) {
    return (
      <Container size="lg" className="py-10">
        <SkeletonCard
          lines={4}
          label={
            locale === "es"
              ? "Verificando acceso de tu sesión..."
              : "Verifying session access..."
          }
        />
      </Container>
    );
  }

  return <>{children}</>;
}
