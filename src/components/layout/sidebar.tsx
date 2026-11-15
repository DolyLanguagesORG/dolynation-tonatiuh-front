"use client";

import {
  Sidebar as FlowbiteSidebar,
  SidebarItemGroup,
  SidebarItems,
} from "flowbite-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  ActionLink,
  dolyFlowbiteTheme,
  Icon,
  type IconName,
} from "@/components/ui";
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
            className="relative z-50 mt-14 flex h-[calc(100dvh-3.5rem)] w-56 max-w-[82vw] flex-col border-r border-default bg-neutral-primary-soft shadow-lg"
          >
            <SidebarContent onItemClick={onClose} />
          </div>
        </div>
      )}
    </>
  );
}
