"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Container, SkeletonCard } from "@/components/ui";
import { useAuth } from "@/context";
import { useLocale } from "@/i18n";
import { ROUTE_ADMIN, ROUTE_SELECT_PLAN, ROUTE_VERIFY_EMAIL } from "@/lib";

export interface RequireAdminProps {
  children: ReactNode;
}

/**
 * Protector exclusivo para el panel administrativo (`/admin`).
 *
 * Aísla el rol `admin` del flujo estudiantil: solo permite el paso cuando
 * la sesión autenticada corresponde a `user.role === "admin"`.
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
  const { accessPhase, isAuthenticated, user } = useAuth();

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
      const target = pathname
        ? `?redirect=${encodeURIComponent(pathname)}`
        : `?redirect=${encodeURIComponent(ROUTE_ADMIN)}`;
      router.replace(`/login${target}`);
      return;
    }
    if (accessPhase === "ready" || user?.role !== "admin") {
      router.replace("/");
    }
  }, [accessPhase, isAuthenticated, pathname, router, user?.role]);

  if (accessPhase !== "admin" || !isAuthenticated || user?.role !== "admin") {
    return (
      <Container size="lg" className="py-10">
        <SkeletonCard lines={4} label={t.guards.validatingSession} />
      </Container>
    );
  }

  return <>{children}</>;
}
