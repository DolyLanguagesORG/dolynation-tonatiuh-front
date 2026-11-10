"use client";

import {
  Sidebar as FlowbiteSidebar,
  SidebarItemGroup,
  SidebarItems,
} from "flowbite-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";
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
  icon: ReactNode;
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

  const displayName = user?.fullName?.trim() || user?.email || "Elena Rostova";
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
      icon: (
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5.5v-6h-5v6H4a1 1 0 01-1-1v-9.5z"
          />
        </svg>
      ),
    },
    {
      id: "readings",
      label: t.nav.myReadings,
      href: "/#ultimas-lecturas",
      isActive: pathname.startsWith("/readings"),
      icon: (
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      ),
    },
    {
      id: "create-ai",
      label: t.nav.createAiText,
      href: "/#generar-lectura",
      isActive: false,
      icon: (
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="12" r="9" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v8m-4-4h8"
          />
        </svg>
      ),
    },
    {
      id: "profile",
      label: t.nav.profileAndProgress,
      href: "/#sistema-base",
      isActive: pathname.startsWith("/profile"),
      icon: (
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="12" cy="8.5" r="3.25" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.5 19.25a5.5 5.5 0 0111 0"
          />
          <circle cx="12" cy="12" r="9" />
        </svg>
      ),
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
        <a
          href="#generar-lectura"
          onClick={onItemClick}
          className="block w-full"
        >
          <Button
            variant="primary"
            size="md"
            fullWidth
            tabIndex={-1}
            leftIcon={
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 2a.75.75 0 01.67.415l1.482 2.963 2.963 1.482a.75.75 0 010 1.34l-2.963 1.482-1.482 2.963a.75.75 0 01-1.34 0L7.848 9.682 4.885 8.2a.75.75 0 010-1.34l2.963-1.482L9.33 2.415A.75.75 0 0110 2zM4.5 13a.5.5 0 01.447.276l.724 1.448 1.448.724a.5.5 0 010 .894l-1.448.724-.724 1.448a.5.5 0 01-.894 0l-.724-1.448-1.448-.724a.5.5 0 010-.894l1.448-.724.724-1.448A.5.5 0 014.5 13z" />
              </svg>
            }
          >
            {t.nav.newReadingCta}
          </Button>
        </a>

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
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </SidebarItemGroup>
        </SidebarItems>
      </div>

      {/* Ficha inferior del estudiante activo (estrictamente blanco y negro según wireframe) */}
      <div className="flex flex-col gap-3 border-t border-default bg-neutral-primary-soft p-3.5">
        <div className="flex items-center justify-between gap-2.5">
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
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
              />
            </svg>
          </span>
        </div>

        {isAuthenticated ? (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            isLoading={isLoggingOut}
            onClick={handleLogout}
          >
            {isLoggingOut ? t.nav.signingOut : t.nav.signOut}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href="/login"
              onClick={onItemClick}
              className="inline-flex min-h-8 items-center justify-center rounded-xs border border-default-medium bg-neutral-primary-soft px-2 py-1 text-[11px] font-bold tracking-wider text-heading uppercase transition-colors hover:border-brand hover:bg-neutral-secondary-medium"
            >
              {t.nav.signIn}
            </Link>
            <Link
              href="/register"
              onClick={onItemClick}
              className="inline-flex min-h-8 items-center justify-center rounded-xs border border-brand bg-brand px-2 py-1 text-[11px] font-bold tracking-wider text-white uppercase transition-colors hover:bg-brand-strong"
            >
              {t.nav.createAccount}
            </Link>
          </div>
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
      {/* Sidebar fijo en escritorio */}
      <div className="hidden lg:sticky lg:top-14 lg:flex lg:h-[calc(100dvh-3.5rem)] lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-default lg:bg-neutral-primary-soft">
        <SidebarContent />
      </div>

      {/* Drawer móvil/tablet */}
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
