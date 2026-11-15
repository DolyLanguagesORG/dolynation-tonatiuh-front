"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { Icon } from "@/components/ui";
import { useAuth } from "@/context";
import { useLocale } from "@/i18n";

function getUserInitials(nameOrEmail: string): string {
  const clean = nameOrEmail.trim();
  if (!clean) {
    return "ER";
  }
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * Tarjeta desplegable del usuario autenticado en la esquina superior derecha del header.
 * Agrupa identidad del estudiante y acciones rápidas de Perfil y Cierre de sesión.
 */
export function UserMenuDropdown({ pathname }: { pathname: string }) {
  const { locale, t } = useLocale();
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!isAuthenticated) {
    return null;
  }

  const displayName =
    user?.fullName?.trim() || user?.email || t.nav.studentRole;
  const email = user?.email ?? "";
  const initials = getUserInitials(displayName);
  const isVerified = Boolean(user?.emailVerifiedAt);
  const isProfileActive = pathname.startsWith("/profile");

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={
          locale === "es"
            ? `Menú de cuenta de ${displayName}`
            : `Account menu for ${displayName}`
        }
        className="flex h-10 max-w-56 items-center gap-2 rounded-base border border-default bg-neutral-primary-soft px-2 py-1 text-left transition-colors hover:border-strong hover:bg-neutral-secondary-soft focus:outline-none focus:ring-2 focus:ring-brand/20 sm:max-w-72 sm:gap-2.5 sm:px-2.5"
      >
        <div className="relative flex size-7 shrink-0 items-center justify-center rounded-full border border-default bg-surface text-[11px] font-semibold tracking-tight text-heading">
          {initials}
          {isVerified && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border border-neutral-primary-soft bg-brand"
            />
          )}
        </div>

        <div className="hidden min-w-0 flex-1 flex-col sm:flex">
          <div className="flex items-center gap-1">
            <span className="truncate text-xs font-semibold leading-tight text-heading">
              {displayName}
            </span>
            {isVerified && (
              <Icon
                name="badge-check"
                size="xs"
                aria-label={
                  locale === "es" ? "Cuenta verificada" : "Verified account"
                }
                className="shrink-0 text-heading"
              />
            )}
          </div>
          {email && (
            <span className="truncate font-mono text-[10px] leading-tight text-muted">
              {email}
            </span>
          )}
        </div>

        <Icon
          name="chevron-down"
          size="xs"
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={locale === "es" ? "Opciones de cuenta" : "Account options"}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-base border border-default bg-surface shadow-lg"
        >
          <div className="border-b border-default bg-neutral-primary-soft px-3.5 py-2.5">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-semibold text-heading">
                {displayName}
              </p>
              {isVerified && (
                <Icon
                  name="badge-check"
                  size="xs"
                  aria-hidden="true"
                  className="shrink-0 text-heading"
                />
              )}
            </div>
            {email && (
              <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                {email}
              </p>
            )}
          </div>

          <div className="p-1.5">
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              aria-current={isProfileActive ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-base px-2.5 py-2 text-xs font-medium transition-colors ${
                isProfileActive
                  ? "bg-neutral-secondary-medium font-semibold text-heading"
                  : "text-heading hover:bg-neutral-secondary-soft"
              }`}
            >
              <Icon
                name="user"
                size="sm"
                aria-hidden="true"
                className="text-muted"
              />
              <span>{t.nav.profileAndProgress}</span>
            </Link>

            <div role="separator" className="my-1.5 border-t border-default" />

            <button
              type="button"
              role="menuitem"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-base px-2.5 py-2 text-left text-xs font-medium text-status-error transition-colors hover:bg-neutral-secondary-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon
                name={isLoggingOut ? "loader" : "log-out"}
                size="sm"
                aria-hidden="true"
                className={isLoggingOut ? "animate-spin" : ""}
              />
              <span>{isLoggingOut ? t.nav.signingOut : t.nav.signOut}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
