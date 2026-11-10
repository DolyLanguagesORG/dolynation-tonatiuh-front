"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useLocale } from "@/i18n";

export interface AppShellProps {
  children: ReactNode;
}

const AUTH_ROUTES = new Set(["/login", "/register"]);

/**
 * Shell responsivo principal de DolyNation.
 * En rutas autenticadas/generales integra `Header`, `Sidebar`, `<main>` y `Footer`.
 * En `/login` y `/register` adapta el shell al diseño centrado sin barra lateral
 * de los wireframes de autenticación.
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { isOpen, close, toggle } = useDisclosure();
  const { t } = useLocale();

  const isAuthRoute = AUTH_ROUTES.has(pathname);

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
        isAuthRoute={isAuthRoute}
      />

      {isAuthRoute ? (
        <main
          id="main-content"
          className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12"
        >
          {children}
        </main>
      ) : (
        <div className="flex min-w-0 flex-1">
          <Sidebar isOpen={isOpen} onClose={close} />

          <div className="flex min-w-0 flex-1 flex-col">
            <main id="main-content" className="flex-1 py-6 sm:py-8 lg:py-10">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      )}
    </div>
  );
}
