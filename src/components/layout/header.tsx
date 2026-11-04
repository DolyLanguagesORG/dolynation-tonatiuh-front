"use client";

import Link from "next/link";

import { useLocale } from "@/i18n";

export interface HeaderProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

/**
 * Barra superior del shell editorial DolyNation.
 * Incluye marca, selector de edición lingüística (`[ESPAÑOL] ACADÉMICO`),
 * indicador de racha activa y accesos rápidos.
 */
export function Header({
  isMobileMenuOpen,
  onToggleMobileMenu,
}: HeaderProps) {
  const { locale, t, toggleLocale } = useLocale();

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
            <span className="whitespace-nowrap">{t.meta.streakLabel}</span>
          </div>

          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-border sm:inline-block"
          />

          <a
            href="#ultimas-lecturas"
            aria-label={t.meta.savedAnnotations}
            className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-xs text-muted transition-colors enabled:hover:bg-surface-subtle enabled:hover:text-ink"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          </a>

          <a
            href="#sistema-base"
            aria-label={t.meta.settings}
            className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-xs text-muted transition-colors enabled:hover:bg-surface-subtle enabled:hover:text-ink"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
