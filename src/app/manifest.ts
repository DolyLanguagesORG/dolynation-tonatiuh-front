import type { MetadataRoute } from "next";

import { dictionaries } from "@/i18n/dictionaries";
import { SITE_NAME } from "@/lib/seo";

/**
 * Manifiesto Web App (`/manifest.webmanifest`) para instalación, accesos directos
 * en escritorio/móvil y marcadores enriquecidos.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: dictionaries.es.meta.siteTitle,
    short_name: SITE_NAME,
    description: dictionaries.es.meta.siteDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#0a0a0a",
    lang: "es",
    categories: ["education", "books"],
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
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
