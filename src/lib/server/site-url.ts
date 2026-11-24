import "server-only";

import { headers } from "next/headers";

import { resolveSiteUrlFromValues } from "@/lib/seo";

/**
 * Resuelve la URL pública del sitio para la petición SSR actual o retorna el
 * respaldo estático durante prerenderizados sin contexto HTTP.
 */
export async function getRequestSiteUrl(): Promise<URL> {
  const envSiteUrl =
    process.env.SITE_URL ??
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL;

  if (envSiteUrl?.trim()) {
    return resolveSiteUrlFromValues({ envSiteUrl });
  }

  try {
    const headerStore = await headers();
    return resolveSiteUrlFromValues({
      forwardedHost: headerStore.get("x-forwarded-host"),
      host: headerStore.get("host"),
      forwardedProto: headerStore.get("x-forwarded-proto"),
    });
  } catch {
    return resolveSiteUrlFromValues({});
  }
}
