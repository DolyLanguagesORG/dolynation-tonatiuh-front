import type { MetadataRoute } from "next";

import { getRequestSiteUrl } from "@/lib/server/site-url";

export const dynamic = "force-dynamic";

/**
 * Directivas dinámicas de rastreo (`/robots.txt`) resueltas contra el origen actual.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getRequestSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/register",
          "/terms",
          "/privacy",
          "/support",
          "/images/",
          "/icons/",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/profile",
          "/generate",
          "/readings/",
          "/glossary",
          "/select-plan",
          "/setup-preferences",
          "/verify-email",
          "/reset-password",
          "/forgot-password",
          "/design-system",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
