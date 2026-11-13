"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { RouteAccessGuard } from "@/components/auth";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/context";
import { useDisclosure } from "@/hooks";
import { useLocale } from "@/i18n";
import { routeAccessService } from "@/lib";

export interface AppShellProps {
  children: ReactNode;
  designSystemEnabled?: boolean;
}

/**
 * Marco global persistente de DolyNation.
 *
 * En rutas de autenticación/onboarding (o cuando el usuario sigue bloqueado esperando
 * confirmación de correo o selección de plan) adapta el shell al diseño sin sidebar
 * y ejecuta `RouteAccessGuard` sobre toda navegación.
 */
export function AppShell({
  children,
  designSystemEnabled = true,
}: AppShellProps) {
  const pathname = usePathname();
  const { isOpen, close, toggle } = useDisclosure();
  const { t } = useLocale();
  const { accessPhase } = useAuth();

  const isAuthRoute = routeAccessService.isMinimalShellRoute(
    pathname,
    accessPhase,
  );
  const isHeaderlessAuthRoute = routeAccessService.isHeaderlessAuthRoute(
    pathname,
    accessPhase,
  );
  const isDesignSystemRoute = pathname === "/design-system";
  const isInformationalRoute =
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/support";

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground">
      <a
        href="#main-heading"
        className="visually-hidden fixed top-2 left-2 z-50 rounded-xs bg-ink px-4 py-2 text-xs font-bold tracking-wider text-ink-contrast uppercase shadow-md"
      >
        {t.meta.skipToContent}
      </a>

      {!isHeaderlessAuthRoute && (
        <Header
          isMobileMenuOpen={isOpen}
          onToggleMobileMenu={toggle}
          isAuthRoute={isAuthRoute}
        />
      )}

      {isAuthRoute ? (
        isDesignSystemRoute || isInformationalRoute ? (
          <div className="flex min-w-0 flex-1 flex-col">
            <main id="main-content" className="flex-1 py-6 sm:py-8 lg:py-10">
              <RouteAccessGuard>{children}</RouteAccessGuard>
            </main>
            {isInformationalRoute && (
              <Footer designSystemEnabled={designSystemEnabled} />
            )}
          </div>
        ) : (
          <main
            id="main-content"
            className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12"
          >
            <RouteAccessGuard>{children}</RouteAccessGuard>
          </main>
        )
      ) : (
        <div className="flex min-w-0 flex-1">
          <Sidebar isOpen={isOpen} onClose={close} />

          <div className="flex min-w-0 flex-1 flex-col">
            <main id="main-content" className="flex-1 py-6 sm:py-8 lg:py-10">
              <RouteAccessGuard>{children}</RouteAccessGuard>
            </main>
            <Footer designSystemEnabled={designSystemEnabled} />
          </div>
        </div>
      )}
    </div>
  );
}
