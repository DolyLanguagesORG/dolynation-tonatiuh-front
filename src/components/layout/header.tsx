"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/context";
import { useLocale } from "@/i18n";

export interface HeaderProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  /**
   * Cuando es `true`, renderiza la barra superior minimalista de las vistas
   * de autenticación (`/login` y `/register`) según los wireframes.
   */
  isAuthRoute?: boolean;
}

/**
 * Barra superior del shell editorial DolyNation.
 * Soporta tanto el modo de aplicación (con menú móvil, racha y cierre de sesión)
 * como el modo de autenticación (`/login` y `/register`) fiel a los wireframes.
 */
export function Header({
  isMobileMenuOpen,
  onToggleMobileMenu,
  isAuthRoute = false,
}: HeaderProps) {
  const pathname = usePathname();
  const { locale, t, toggleLocale } = useLocale();
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const streakCount = user?.currentStreak ?? 14;
  const dynamicStreakLabel =
    locale === "es"
      ? `Racha: ${streakCount} días`
      : `Streak: ${streakCount} days`;

  if (isAuthRoute) {
    return (
      <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-serif text-lg font-bold tracking-tight text-ink sm:text-xl"
          >
            DolyNation
          </Link>

          <span aria-hidden="true" className="h-4 w-px bg-border-strong" />

          <button
            type="button"
            onClick={toggleLocale}
            aria-label={
              locale === "es"
                ? "Cambiar idioma de la interfaz a inglés (actual: Español Académico)"
                : "Switch interface language to Spanish (current: English Academic)"
            }
            className="inline-flex min-h-7 items-center rounded-xs border border-border-strong bg-surface-subtle/60 px-2.5 py-1 text-[10px] font-bold tracking-wider text-muted uppercase transition-colors enabled:hover:border-ink enabled:hover:text-ink sm:text-[11px]"
          >
            {t.meta.editionBadge}
          </button>
        </div>

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

          <Link
            href="/register"
            aria-current={pathname === "/register" ? "page" : undefined}
            className="inline-flex min-h-9 items-center justify-center rounded-xs border border-brand bg-brand px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            {t.auth.topCreateAccount}
          </Link>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center border-b border-border bg-surface">
      {/* Bloque izquierdo alineado con el ancho del sidebar en escritorio */}
      <div className="flex h-full items-center gap-2 px-4 lg:w-60 lg:shrink-0 lg:justify-end lg:border-r lg:border-border lg:px-5">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-controls="doly-sidebar-drawer"
          aria-label={
            isMobileMenuOpen ? t.meta.closeMenu : t.meta.openMenu
          }
          className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xs border border-border text-ink transition-colors enabled:hover:bg-surface-subtle lg:hidden"
        >
          {isMobileMenuOpen ? (
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>

        <Link
          href="/"
          className="font-serif text-lg font-bold tracking-tight text-ink sm:text-xl"
        >
          DolyNation
        </Link>
      </div>

      {/* Barra de contexto y utilidades */}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={toggleLocale}
          aria-label={
            locale === "es"
              ? "Cambiar idioma de la interfaz a inglés (actual: Español Académico)"
              : "Switch interface language to Spanish (current: English Academic)"
          }
          className="inline-flex min-h-7 items-center rounded-xs border border-border-strong bg-surface-subtle/60 px-2.5 py-1 text-[10px] font-bold tracking-wider text-muted uppercase transition-colors enabled:hover:border-ink enabled:hover:text-ink sm:text-[11px]"
        >
          {t.meta.editionBadge}
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-xs border border-border-strong bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-ink"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M13.5 4.938a7 7 0 11-9.006 1.737c.202-.257.59-.218.793.039.278.352.594.672.943.954.332.269.786-.049.773-.476a5.977 5.977 0 01.572-2.759 6.026 6.026 0 012.486-2.665c.247-.14.55-.016.677.238A6.967 6.967 0 0013.5 4.938zM14 12a4 4 0 01-4 4c-1.913 0-3.52-1.398-3.91-3.182-.093-.429.44-.643.814-.413a4.043 4.043 0 001.601.564c.303.038.531-.24.51-.544a5.975 5.975 0 011.315-4.192.447.447 0 01.431-.16A4.001 4.001 0 0114 12z"
                clipRule="evenodd"
              />
            </svg>
            <span className="whitespace-nowrap">{dynamicStreakLabel}</span>
          </div>

          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-border sm:inline-block"
          />

          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex min-h-8 items-center justify-center rounded-xs border border-border-strong bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-ink transition-colors enabled:hover:border-ink enabled:hover:bg-brand enabled:hover:text-white disabled:opacity-50"
            >
              {isLoggingOut ? t.nav.signingOut : t.nav.signOut}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex min-h-8 items-center justify-center rounded-xs border border-border-strong bg-surface px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-surface-subtle"
              >
                {t.nav.signIn}
              </Link>
              <Link
                href="/register"
                className="hidden min-h-8 items-center justify-center rounded-xs border border-brand bg-brand px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-brand-strong sm:inline-flex"
              >
                {t.nav.createAccount}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
