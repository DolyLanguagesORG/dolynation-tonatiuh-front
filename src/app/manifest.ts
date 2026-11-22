import type { MetadataRoute } from "next";

import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";

/**
 * El manifest de la aplicación (PWA).
 *
 * Es lo que hace que la app sea **instalable**: sin este fichero, el
 * navegador no ofrece "Añadir a la pantalla de inicio" y no hay icono, ni
 * nombre, ni colores propios.
 *
 * La **instalabilidad** es solo la primera parte: lo que hace que la app
 * funcione SIN red es el service worker y la capa de datos local
 * (IndexedDB). Ese trabajo va en fases posteriores; este fichero es la base.
 *
 * Los iconos están en `public/icons/` y los genera el favicon de la marca
 * (monocromo editorial: tinta negra sobre `#fafafa`).
 */

/** Los datos del manifest, ya resueltos (para poder probarlos sin servidor). */
export interface ManifestParams {
  name: string;
  shortName: string;
  description: string;
  locale: string;
}

/**
 * Construye el manifest.
 *
 * Va separada del export por defecto (que necesita leer el idioma de las
 * cookies) para que se pueda **probar**: los tests comprueban que el
 * manifest tiene lo que Android y iOS exigen para instalar la app.
 */
export function buildManifest(params: ManifestParams): MetadataRoute.Manifest {
  return {
    name: params.name,
    short_name: params.shortName,
    description: params.description,
    // La app arranca en la raíz; `scope` le dice al navegador qué rutas
    // pertenecen a la app (para el botón "abrir en la app").
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    // Los colores de la marca: `--background` y `--ink` de globals.css.
    background_color: "#fafafa",
    theme_color: "#fafafa",
    lang: params.locale,
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

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return buildManifest({
    name: dict.meta.siteTitle,
    shortName: dict.meta.appShortName,
    description: dict.meta.siteDescription,
    locale,
  });
}
