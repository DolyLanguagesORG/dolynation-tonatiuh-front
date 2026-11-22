import type { MetadataRoute } from "next";

import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";

/**
 * Manifest de la aplicación (PWA).
 *
 * Es lo que hace que la app sea **instalable**: sin este fichero, el
 * navegador no ofrece "Añadir a la pantalla de inicio" y no hay icono, ni
 * nombre, ni colores propios.
 *
 * La **instalabilidad** es solo la primera parte: lo que hace que la app
 * funcione SIN red es el service worker y la capa de datos local (IndexedDB).
 * Ese trabajo va en fases posteriores; este fichero es la base.
 *
 * Los iconos están en `public/icons/` y los genera el favicon de la marca
 * (monocromo editorial: tinta negra sobre `#fafafa`).
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return {
    name: dict.meta.siteTitle,
    short_name: dict.meta.appShortName,
    description: dict.meta.siteDescription,
    // La app arranca en la raíz; `scope` le dice al navegador qué rutas
    // pertenecen a la app (para el botón "abrir en la app").
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    // Los colores de la marca: `--background` y `--ink` de globals.css.
    background_color: "#fafafa",
    theme_color: "#fafafa",
    lang: locale,
    dir: "ltr",
    categories: ["education", "books", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // El "maskable" es el que Android recorta: el icono tiene que
        // dejar libre la zona central segura (el 80% del centro).
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
