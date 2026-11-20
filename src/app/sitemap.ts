import type { MetadataRoute } from "next";

import { getRequestSiteUrl } from "@/lib/server/site-url";

export const dynamic = "force-dynamic";

/**
 * Mapa del sitio XML (`/sitemap.xml`) con las rutas públicas indexables.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = await getRequestSiteUrl();
  const lastModified = new Date();

  const publicRoutes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/login", changeFrequency: "weekly", priority: 1 },
    { path: "/register", changeFrequency: "monthly", priority: 0.9 },
    { path: "/support", changeFrequency: "monthly", priority: 0.7 },
    { path: "/terms", changeFrequency: "monthly", priority: 0.5 },
    { path: "/privacy", changeFrequency: "monthly", priority: 0.5 },
  ];

  return publicRoutes.map((route) => ({
    url: new URL(route.path, siteUrl).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
