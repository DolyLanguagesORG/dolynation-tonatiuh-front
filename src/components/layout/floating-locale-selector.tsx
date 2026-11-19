"use client";

import { LocaleSelector } from "@/components/layout/locale-selector";

/**
 * Selector de idioma de interfaz anclado a la esquina superior derecha de la
 * pantalla, **fuera** de la tarjeta y del formulario.
 *
 * Es el mismo control del dashboard (`LocaleSelector`), con el anclaje
 * responsive (`right-4/top-4` en movil, `sm:right-6/sm:top-6` en tablet,
 * `lg:right-8/lg:top-8` en escritorio) para que nunca se salga de la pantalla
 * ni tape el contenido en ningun breakpoint.
 */
export function FloatingLocaleSelector() {
  return (
    <div className="fixed right-4 top-4 z-40 sm:right-6 sm:top-6 lg:right-8 lg:top-8">
      <LocaleSelector />
    </div>
  );
}
