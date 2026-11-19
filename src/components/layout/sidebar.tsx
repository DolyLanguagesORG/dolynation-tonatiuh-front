"use client";

import {
  Sidebar as FlowbiteSidebar,
  SidebarItemGroup,
  SidebarItems,
} from "flowbite-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getUserAccountSummary } from "@/components/layout/user-display";
import {
  ActionLink,
  dolyFlowbiteTheme,
  Icon,
  IconButton,
  type IconName,
} from "@/components/ui";
import { useAuth } from "@/context";
import { useLocale } from "@/i18n";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Controla la visibilidad de la barra lateral en escritorio (`lg+`). */
  isDesktopOpen?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  isActive: boolean;
  icon: IconName;
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { accessPhase, user } = useAuth();
  const isAdminSession =
    accessPhase === "admin" || user?.role === "admin";

  const navItems: NavItem[] = isAdminSession
    ? [
        {
          id: "admin",
          label: t.nav.adminDashboard,
          href: "/admin",
          isActive: pathname.startsWith("/admin"),
          icon: "user",
        },
      ]
    : [
        {
          id: "home",
          label: t.nav.home,
          href: "/",
          isActive: pathname === "/",
          icon: "home",
        },
        {
          id: "readings",
          label: t.nav.myReadings,
          href: "/readings",
          isActive:
            pathname.startsWith("/readings") || pathname.startsWith("/history"),
          icon: "book-open",
        },
        {
          id: "glossary",
          label: t.nav.glossary,
          href: "/glossary",
          isActive: pathname.startsWith("/glossary"),
          icon: "bookmark",
        },
      ];

  return (
    <FlowbiteSidebar
      aria-label={t.nav.primaryAriaLabel}
      theme={dolyFlowbiteTheme.sidebar}
      applyTheme={{
        root: { base: "replace", inner: "replace" },
        itemGroup: { base: "replace" },
      }}
    >
      <div className="flex flex-col gap-2.5 p-2.5">
        {!isAdminSession && (
          <ActionLink
            href="/generate"
            variant="primary"
            size="sm"
            fullWidth
            onClick={onItemClick}
            leftIcon={<Icon name="sparkles" size="sm" />}
            className="whitespace-nowrap px-2.5 text-[11px] tracking-wide"
          >
            {t.nav.newReadingCta}
          </ActionLink>
        )}

        <SidebarItems>
          <SidebarItemGroup>
            {navItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  aria-current={item.isActive ? "page" : undefined}
                  className={[
                    "flex min-h-9 items-center gap-2.5 whitespace-nowrap rounded-base border-l-[3px] px-2.5 py-1.5 text-[13px] transition-colors",
                    item.isActive
                      ? "border-brand bg-neutral-secondary-medium font-semibold text-heading"
                      : "border-transparent font-medium text-body hover:bg-neutral-secondary-medium hover:text-heading",
                  ].join(" ")}
                >
                  <Icon name={item.icon} size="sm" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </SidebarItemGroup>
        </SidebarItems>
      </div>
    </FlowbiteSidebar>
  );
}

function MobileDrawerAccountSection({
  onClose,
}: {
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { user, accessPhase, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const isAdminSession =
    accessPhase === "admin" || user?.role === "admin";
  const { displayName, email, initials, isVerified } = getUserAccountSummary(
    user,
    isAdminSession ? t.nav.adminRole : t.nav.studentRole,
  );
  const isProfileActive = pathname.startsWith("/profile");
  const isAdminActive = pathname.startsWith("/admin");

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      onClose();
    }
  };

  return (
    <div className="mt-auto shrink-0 border-t border-default bg-neutral-primary-soft p-3">
      <div className="flex items-center gap-2.5 rounded-base border border-default bg-surface px-3 py-2.5">
        <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-default bg-neutral-secondary-soft text-[11px] font-semibold tracking-tight text-heading">
          {initials}
          {isVerified && (
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border border-surface bg-brand"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="truncate text-xs font-semibold leading-tight text-heading">
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
            <p className="mt-0.5 truncate font-mono text-[10px] leading-tight text-muted">
              {email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-1">
        {isAdminSession ? (
          <Link
            href="/admin"
            onClick={onClose}
            aria-current={isAdminActive ? "page" : undefined}
            className={[
              "flex min-h-9 items-center gap-2.5 rounded-base px-2.5 py-1.5 text-[13px] transition-colors",
              isAdminActive
                ? "bg-neutral-secondary-medium font-semibold text-heading"
                : "font-medium text-heading hover:bg-neutral-secondary-medium",
            ].join(" ")}
          >
            <Icon
              name="shield"
              size="sm"
              aria-hidden="true"
              className="shrink-0 text-muted"
            />
            <span>{t.nav.adminDashboard}</span>
          </Link>
        ) : (
          <Link
            href="/profile"
            onClick={onClose}
            aria-current={isProfileActive ? "page" : undefined}
            className={[
              "flex min-h-9 items-center gap-2.5 rounded-base px-2.5 py-1.5 text-[13px] transition-colors",
              isProfileActive
                ? "bg-neutral-secondary-medium font-semibold text-heading"
                : "font-medium text-heading hover:bg-neutral-secondary-medium",
            ].join(" ")}
          >
            <Icon
              name="user"
              size="sm"
              aria-hidden="true"
              className="shrink-0 text-muted"
            />
            <span>{t.nav.profileAndProgress}</span>
          </Link>
        )}

        <button
          type="button"
          disabled={isLoggingOut}
          onClick={handleLogout}
          className="flex min-h-9 w-full items-center gap-2.5 rounded-base px-2.5 py-1.5 text-left text-[13px] font-medium text-status-error transition-colors hover:bg-neutral-secondary-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon
            name={isLoggingOut ? "loader" : "log-out"}
            size="sm"
            aria-hidden="true"
            className={isLoggingOut ? "shrink-0 animate-spin" : "shrink-0"}
          />
          <span>{isLoggingOut ? t.nav.signingOut : t.nav.signOut}</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Barra lateral de navegación compacta y colapsable en escritorio (`lg:w-48`)
 * y drawer accesible en móvil/tablet usando `FlowbiteSidebar` en Blanco y Negro.
 */
export function Sidebar({
  isOpen,
  onClose,
  isDesktopOpen = true,
}: SidebarProps) {
  const { t } = useLocale();
  const { accessPhase, user } = useAuth();
  const isAdminSession =
    accessPhase === "admin" || user?.role === "admin";

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {isDesktopOpen && (
        <div
          id="doly-sidebar-desktop"
          className="hidden lg:sticky lg:top-14 lg:flex lg:h-[calc(100dvh-3.5rem)] lg:w-48 lg:shrink-0 lg:flex-col lg:border-r lg:border-default lg:bg-neutral-primary-soft"
        >
          <SidebarContent />
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            aria-hidden="true"
            onClick={onClose}
            className="fixed inset-0 bg-brand/40 backdrop-blur-[1px]"
          />
          <div
            id="doly-sidebar-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t.nav.primaryAriaLabel}
            className="relative z-10 flex h-dvh w-72 max-w-[85vw] flex-col border-r border-default bg-surface shadow-xl"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-default bg-surface px-4">
              <Link
                href={isAdminSession ? "/admin" : "/"}
                onClick={onClose}
                className="font-serif text-lg font-bold tracking-tight text-ink"
              >
                DolyNation
              </Link>
              <IconButton
                icon="close"
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label={t.meta.closeMenu}
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <SidebarContent onItemClick={onClose} />
            </div>

            <MobileDrawerAccountSection onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
}
