"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ActionLink, Button, Icon, IconButton } from "@/components/ui";
import { UserMenuDropdown } from "@/components/layout/user-menu-dropdown";
import { useAuth } from "@/context";
import { formatMessage, useLocale } from "@/i18n";
import { LocaleSelector } from "@/components/layout/locale-selector";

export interface HeaderProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  /** Visibilidad de la barra lateral en escritorio (`lg+`). */
  isDesktopSidebarOpen?: boolean;
  /** Alterna mostrar u ocultar la barra lateral en escritorio (`lg+`). */
  onToggleDesktopSidebar?: () => void;
  /**
   * Cuando es `true`, renderiza la barra superior minimalista de las vistas
   * de autenticación y onboarding (`/login`, `/register`, `/verify-email`,
   * `/select-plan`, `/setup-preferences`).
   */
  isAuthRoute?: boolean;
}

/**
 * Barra superior del shell editorial DolyNation.
 * Soporta tanto el modo de aplicación (con menú móvil, racha y cierre de sesión)
 * como el modo minimalista para autenticación y vistas bloqueadas de onboarding.
 */
export function Header({
  isMobileMenuOpen,
  onToggleMobileMenu,
  isDesktopSidebarOpen = true,
  onToggleDesktopSidebar,
  isAuthRoute = false,
}: HeaderProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { user, accessPhase, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isLoadingAuth = accessPhase === "loading";
  const isAdminSession =
    accessPhase === "admin" || user?.role === "admin";
  const streakCount = user?.currentStreak ?? 0;
  const dynamicStreakLabel = formatMessage(t.meta.streakTemplate, {
    count: streakCount,
    unit: streakCount === 1 ? t.meta.daySingular : t.meta.dayPlural,
  });

  if (isAuthRoute) {
    const isUnverifiedLock = accessPhase === "unverified_email";
    const isPlanLock = accessPhase === "plan_required";
    const isIsolatedShowcase = pathname === "/design-system";
    const hideBrandLink = isUnverifiedLock || isIsolatedShowcase;
    const brandHref = isPlanLock
      ? "/select-plan"
      : isAdminSession
        ? "/admin"
        : "/";

    return (
      <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-border bg-surface px-3 sm:px-8 lg:px-12">
        <div className="flex items-center gap-2 sm:gap-3">
          {hideBrandLink ? (
            <span className="font-serif text-base font-bold tracking-tight text-ink sm:text-xl">
              DolyNation
            </span>
          ) : (
            <Link
              href={brandHref}
              className="font-serif text-base font-bold tracking-tight text-ink sm:text-xl"
            >
              DolyNation
            </Link>
          )}

          <span aria-hidden="true" className="h-4 w-px bg-border-strong" />

          <LocaleSelector />
        </div>

        {isIsolatedShowcase ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">
              UI KIT
            </span>
          </div>
        ) : isUnverifiedLock ? (
          <div className="flex items-center gap-2" />
        ) : isLoadingAuth ? (
          <div
            data-testid="header-auth-skeleton"
            aria-hidden="true"
            className="h-7 w-28 animate-pulse rounded-base border border-default bg-neutral-secondary-soft"
          />
        ) : isAuthenticated ? (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="xs"
              isLoading={isLoggingOut}
              onClick={handleLogout}
              className="normal-case tracking-normal"
            >
              {isLoggingOut ? t.nav.signingOut : t.nav.signOut}
            </Button>
          </div>
        ) : (
          <nav
            aria-label={t.meta.accountAccessAria}
            className="flex items-center gap-3 sm:gap-5"
          >
            <Link
              href="/login"
              aria-current={pathname === "/login" ? "page" : undefined}
              className={`text-xs font-semibold transition-colors ${
                pathname === "/login"
                  ? "text-ink underline underline-offset-4"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t.auth.topSignIn}
            </Link>

            <ActionLink
              href="/register"
              variant="primary"
              size="xs"
              aria-current={pathname === "/register" ? "page" : undefined}
              className="normal-case tracking-normal"
            >
              {t.auth.topCreateAccount}
            </ActionLink>
          </nav>
        )}
      </header>
    );
  }

  const desktopSidebarToggleLabel = isDesktopSidebarOpen
    ? t.meta.hideSidebarAria
    : t.meta.showSidebarAria;

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center border-b border-border bg-surface">
      {/* Bloque izquierdo alineado con el ancho del sidebar en escritorio */}
      <div
        data-testid="header-brand-slot"
        className={`flex h-full shrink-0 items-center gap-1.5 px-2.5 transition-colors sm:gap-2 sm:px-4 lg:w-48 lg:justify-between lg:border-r lg:px-3.5 ${
          isDesktopSidebarOpen ? "lg:border-border" : "lg:border-transparent"
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <IconButton
            icon={isMobileMenuOpen ? "close" : "menu"}
            variant="secondary"
            size="sm"
            iconSize="md"
            onClick={onToggleMobileMenu}
            aria-expanded={isMobileMenuOpen}
            aria-controls="doly-sidebar-drawer"
            aria-label={isMobileMenuOpen ? t.meta.closeMenu : t.meta.openMenu}
            className="lg:hidden sm:h-9 sm:w-9"
          />

          <Link
            href={isAdminSession ? "/admin" : "/"}
            className="font-serif text-base font-bold tracking-tight text-ink sm:text-xl"
          >
            DolyNation
          </Link>
        </div>

        {onToggleDesktopSidebar && (
          <span className="hidden lg:inline-flex">
            <IconButton
              icon={isDesktopSidebarOpen ? "panel-left-close" : "panel-left-open"}
              variant="ghost"
              size="xs"
              iconSize="sm"
              onClick={onToggleDesktopSidebar}
              aria-expanded={isDesktopSidebarOpen}
              aria-controls="doly-sidebar-desktop"
              aria-label={desktopSidebarToggleLabel}
              title={desktopSidebarToggleLabel}
              className="hidden text-muted hover:text-heading lg:inline-flex"
            />
          </span>
        )}
      </div>

      {/* Barra de contexto y utilidades */}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-1.5 px-2 sm:gap-2 sm:px-6 lg:px-8">
        <LocaleSelector />

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          {isLoadingAuth ? (
            <div
              data-testid="header-streak-skeleton"
              aria-hidden="true"
              className="h-7 w-24 animate-pulse rounded-base border border-border bg-neutral-secondary-soft sm:w-28"
            />
          ) : isAdminSession ? (
            <div className="inline-flex min-w-0 items-center gap-1 rounded-base border border-border-strong bg-surface px-2 py-1 text-[11px] font-semibold text-ink sm:gap-1.5 sm:px-2.5 sm:text-xs">
              <Icon name="shield" size="sm" className="shrink-0" />
              <span className="whitespace-nowrap">{t.nav.adminRole}</span>
            </div>
          ) : (
            <div className="inline-flex min-w-0 items-center gap-1 rounded-base border border-border-strong bg-surface px-2 py-1 text-[11px] font-semibold text-ink sm:gap-1.5 sm:px-2.5 sm:text-xs">
              <Icon name="flame" size="sm" className="shrink-0" />
              <span className="whitespace-nowrap tabular-nums">
                {dynamicStreakLabel}
              </span>
            </div>
          )}

          {isAuthenticated && !isAdminSession && (
            <div className="hidden items-center gap-1 sm:flex">
              <ActionLink
                href="/glossary"
                variant="ghost"
                size="xs"
                aria-label={t.meta.savedAnnotations}
                title={t.meta.savedAnnotations}
                className="px-2"
              >
                <Icon name="bookmark" size="md" />
              </ActionLink>
              <ActionLink
                href="/profile"
                variant="ghost"
                size="xs"
                aria-label={t.meta.settings}
                title={t.meta.settings}
                className="px-2"
              >
                <Icon name="settings" size="md" />
              </ActionLink>
            </div>
          )}

          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-border sm:inline-block"
          />

          {isLoadingAuth ? (
            <div
              data-testid="header-auth-skeleton"
              aria-hidden="true"
              className="h-8 w-24 animate-pulse rounded-base border border-default bg-neutral-secondary-soft sm:h-10 sm:w-44"
            />
          ) : isAuthenticated ? (
            <UserMenuDropdown pathname={pathname} />
          ) : (
            <div className="flex items-center gap-2">
              <ActionLink
                href="/login"
                variant="secondary"
                size="xs"
                className="normal-case tracking-normal"
              >
                {t.nav.signIn}
              </ActionLink>
              <ActionLink
                href="/register"
                variant="primary"
                size="xs"
                className="hidden normal-case tracking-normal sm:inline-flex"
              >
                {t.nav.createAccount}
              </ActionLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
