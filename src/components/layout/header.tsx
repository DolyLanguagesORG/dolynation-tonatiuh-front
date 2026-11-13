"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ActionLink, Button, Icon, IconButton } from "@/components/ui";
import { useAuth } from "@/context";
import { useLocale } from "@/i18n";

export interface HeaderProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  /**
   * Cuando es `true`, renderiza la barra superior minimalista de las vistas
   * de autenticación y onboarding (`/login`, `/register`, `/verify-email`,
   * `/select-plan`, `/setup-preferences`).
   */
  isAuthRoute?: boolean;
}

function LocaleEditionButton() {
  const { locale, t, toggleLocale } = useLocale();

  return (
    <Button
      variant="secondary"
      size="xs"
      onClick={toggleLocale}
      aria-label={
        locale === "es"
          ? "Cambiar idioma de la interfaz a inglés (actual: Español Académico)"
          : "Switch interface language to Spanish (current: English Academic)"
      }
      className="min-h-7 bg-surface-subtle/60 px-2.5 py-1 text-[10px] tracking-wider text-muted sm:text-[11px]"
    >
      {t.meta.editionBadge}
    </Button>
  );
}

/**
 * Barra superior del shell editorial DolyNation.
 * Soporta tanto el modo de aplicación (con menú móvil, racha y cierre de sesión)
 * como el modo minimalista para autenticación y vistas bloqueadas de onboarding.
 */
export function Header({
  isMobileMenuOpen,
  onToggleMobileMenu,
  isAuthRoute = false,
}: HeaderProps) {
  const pathname = usePathname();
  const { locale, t } = useLocale();
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

  const streakCount = user?.currentStreak ?? 0;
  const dynamicStreakLabel =
    locale === "es"
      ? `Racha: ${streakCount} días`
      : `Streak: ${streakCount} days`;

  if (isAuthRoute) {
    const isUnverifiedLock = accessPhase === "unverified_email";
    const isPlanLock = accessPhase === "plan_required";
    const isIsolatedShowcase = pathname === "/design-system";
    const hideBrandLink = isUnverifiedLock || isIsolatedShowcase;
    const brandHref = isPlanLock ? "/select-plan" : "/";

    return (
      <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          {hideBrandLink ? (
            <span className="font-serif text-lg font-bold tracking-tight text-ink sm:text-xl">
              DolyNation
            </span>
          ) : (
            <Link
              href={brandHref}
              className="font-serif text-lg font-bold tracking-tight text-ink sm:text-xl"
            >
              DolyNation
            </Link>
          )}

          <span aria-hidden="true" className="h-4 w-px bg-border-strong" />

          <LocaleEditionButton />
        </div>

        {isIsolatedShowcase ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold tracking-wider text-muted uppercase">
              UI KIT
            </span>
          </div>
        ) : isUnverifiedLock ? (
          <div className="flex items-center gap-2" />
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
            aria-label={
              locale === "es" ? "Acceso a cuenta" : "Account access"
            }
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

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center border-b border-border bg-surface">
      {/* Bloque izquierdo alineado con el ancho del sidebar en escritorio */}
      <div className="flex h-full items-center gap-2 px-4 lg:w-60 lg:shrink-0 lg:justify-end lg:border-r lg:border-border lg:px-5">
        <IconButton
          icon={isMobileMenuOpen ? "close" : "menu"}
          variant="secondary"
          size="md"
          iconSize="lg"
          onClick={onToggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-controls="doly-sidebar-drawer"
          aria-label={isMobileMenuOpen ? t.meta.closeMenu : t.meta.openMenu}
          className="lg:hidden"
        />

        <Link
          href="/"
          className="font-serif text-lg font-bold tracking-tight text-ink sm:text-xl"
        >
          DolyNation
        </Link>
      </div>

      {/* Barra de contexto y utilidades */}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        <LocaleEditionButton />

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-base border border-border-strong bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
            <Icon name="flame" size="sm" />
            <span className="whitespace-nowrap tabular-nums">
              {dynamicStreakLabel}
            </span>
          </div>

          {isAuthenticated && (
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

          {isAuthenticated ? (
            <Button
              variant="secondary"
              size="xs"
              isLoading={isLoggingOut}
              onClick={handleLogout}
              className="normal-case tracking-normal"
            >
              {isLoggingOut ? t.nav.signingOut : t.nav.signOut}
            </Button>
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
