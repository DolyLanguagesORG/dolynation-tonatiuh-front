"use client";

import {
  Sidebar as FlowbiteSidebar,
  SidebarItemGroup,
  SidebarItems,
} from "flowbite-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  ActionLink,
  Button,
  dolyFlowbiteTheme,
  Icon,
  type IconName,
} from "@/components/ui";
import { useAuth } from "@/context";
import { useLocale } from "@/i18n";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  isActive: boolean;
  icon: IconName;
}

function getInitials(nameOrEmail: string): string {
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

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName =
    user?.fullName?.trim() || user?.email || t.nav.studentRole;
  const initials = getInitials(displayName);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      onItemClick?.();
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems: NavItem[] = [
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
      isActive: pathname.startsWith("/readings") || pathname.startsWith("/history"),
      icon: "book-open",
    },
    {
      id: "glossary",
      label: t.nav.glossary,
      href: "/glossary",
      isActive: pathname.startsWith("/glossary"),
      icon: "bookmark",
    },
    {
      id: "create-ai",
      label: t.nav.createAiText,
      href: "/generate",
      isActive: pathname === "/generate",
      icon: "plus-circle",
    },
    {
      id: "profile",
      label: t.nav.profileAndProgress,
      href: "/profile",
      isActive: pathname.startsWith("/profile"),
      icon: "user",
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
      <div className="flex flex-col gap-3 p-3.5">
        <ActionLink
          href="/generate"
          variant="primary"
          size="md"
          fullWidth
          onClick={onItemClick}
          leftIcon={<Icon name="sparkles" size="md" />}
        >
          {t.nav.newReadingCta}
        </ActionLink>

        <SidebarItems>
          <SidebarItemGroup>
            {navItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  aria-current={item.isActive ? "page" : undefined}
                  className={[
                    "flex min-h-10 items-center gap-3 rounded-base border-l-[3px] px-3 py-2 text-sm transition-colors",
                    item.isActive
                      ? "border-brand bg-neutral-secondary-medium font-semibold text-heading"
                      : "border-transparent font-medium text-body hover:bg-neutral-secondary-medium hover:text-heading",
                  ].join(" ")}
                >
                  <Icon name={item.icon} size="md" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </SidebarItemGroup>
        </SidebarItems>
      </div>

      {/* Ficha inferior del estudiante activo */}
      <div className="flex flex-col gap-3 border-t border-default bg-neutral-primary-soft p-3.5">
        <Link
          href="/profile"
          onClick={onItemClick}
          className="flex items-center justify-between gap-2.5 rounded-base p-1 transition-colors hover:bg-neutral-secondary-soft"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              aria-hidden="true"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand bg-neutral-secondary-medium font-serif text-sm font-bold text-heading"
            >
              {initials}
              <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-neutral-primary-soft bg-brand" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-heading">
                {displayName}
              </p>
              <p className="truncate text-[10px] font-medium tracking-wider text-body uppercase">
                {user?.email ?? t.nav.studentRole}
              </p>
            </div>
          </div>

          <span
            aria-hidden="true"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-heading"
          >
            <Icon name="badge-check" size="md" />
          </span>
        </Link>

        {isAuthenticated && (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            isLoading={isLoggingOut}
            leftIcon={<Icon name="log-out" size="sm" />}
            onClick={handleLogout}
          >
            {isLoggingOut ? t.nav.signingOut : t.nav.signOut}
          </Button>
        )}
      </div>
    </FlowbiteSidebar>
  );
}

/**
 * Barra lateral de navegación persistente en escritorio (`lg:w-60`)
 * y drawer accesible en móvil/tablet usando `FlowbiteSidebar` en Blanco y Negro.
 */
export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useLocale();

  return (
    <>
      <div className="hidden lg:sticky lg:top-14 lg:flex lg:h-[calc(100dvh-3.5rem)] lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-default lg:bg-neutral-primary-soft">
        <SidebarContent />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
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
            className="relative z-50 mt-14 flex h-[calc(100dvh-3.5rem)] w-64 max-w-[82vw] flex-col border-r border-default bg-neutral-primary-soft shadow-lg"
          >
            <SidebarContent onItemClick={onClose} />
          </div>
        </div>
      )}
    </>
  );
}
