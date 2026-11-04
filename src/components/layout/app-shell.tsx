"use client";

import { type ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useLocale } from "@/i18n";

export interface AppShellProps {
  children: ReactNode;
}

/**
 * Shell responsivo principal de DolyNation.
 * Integra enlace de salto accesible, `Header`, `Sidebar`, región `<main>` y `Footer`.
 */
export function AppShell({ children }: AppShellProps) {
  const { isOpen, close, toggle } = useDisclosure();
  const { t } = useLocale();

  return (
    <div className="flex min-h-dvh w-full flex-col bg-background text-foreground">
      <a
        href="#main-heading"
        className="visually-hidden fixed top-2 left-2 z-50 rounded-xs bg-ink px-4 py-2 text-xs font-bold tracking-wider text-ink-contrast uppercase shadow-md"
      >
        {t.meta.skipToContent}
      </a>

      <Header
        isMobileMenuOpen={isOpen}
        onToggleMobileMenu={toggle}
      />

      <div className="flex min-w-0 flex-1">
        <Sidebar isOpen={isOpen} onClose={close} />

        <div className="flex min-w-0 flex-1 flex-col">
          <main id="main-content" className="flex-1 py-6 sm:py-8 lg:py-10">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
