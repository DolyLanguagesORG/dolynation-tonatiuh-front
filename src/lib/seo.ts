import type { Metadata } from "next";

import { type Dictionary, type Locale } from "@/i18n";

export const SITE_NAME = "DolyNation";
export const DEFAULT_SITE_URL = "https://play.dolynation.app";
export const OG_IMAGE_PATH = "/images/og-dolynation.png";
export const ORGANIZATION_LOGO_PATH = "/icons/icon-512.png";
export const OG_IMAGE_DIMENSIONS = {
  width: 1200,
  height: 630,
} as const;

export const OPEN_GRAPH_LOCALE_BY_UI_LOCALE: Record<Locale, string> = {
  es: "es_MX",
  en: "en_US",
  fr: "fr_FR",
  it: "it_IT",
};

export const NOINDEX_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

const VALID_HOST_PATTERN = /^[a-zA-Z0-9.-]+(?::\d{1,5})?$/;

/**
 * Normaliza una URL absoluta HTTP/HTTPS opcional para usarla como `metadataBase`.
 */
export function normalizeSiteUrl(raw: string | undefined | null): URL | null {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return new URL(parsed.origin);
  } catch {
    return null;
  }
}

export interface ResolveSiteUrlInput {
  envSiteUrl?: string | null;
  forwardedHost?: string | null;
  host?: string | null;
  forwardedProto?: string | null;
}

/**
 * Resuelve la URL base pública del sitio sin acoplarla a un dominio fijo:
 * prioriza variable de entorno explícita, luego cabeceras de proxy (`Host` /
 * `X-Forwarded-Host`), y finalmente el dominio reservado por defecto.
 */
export function resolveSiteUrlFromValues({
  envSiteUrl,
  forwardedHost,
  host,
  forwardedProto,
}: ResolveSiteUrlInput): URL {
  const fromEnv = normalizeSiteUrl(envSiteUrl);
  if (fromEnv) {
    return fromEnv;
  }

  const rawHost = (forwardedHost ?? host ?? "")
    .split(",")[0]
    ?.trim();

  if (rawHost && VALID_HOST_PATTERN.test(rawHost)) {
    const rawProto = (forwardedProto ?? "")
      .split(",")[0]
      ?.trim()
      .toLowerCase();
    const isLocalHost =
      rawHost.startsWith("localhost") ||
      rawHost.startsWith("127.0.0.1") ||
      rawHost.startsWith("[::1]");
    const protocol =
      rawProto === "http" || rawProto === "https"
        ? rawProto
        : isLocalHost
          ? "http"
          : "https";

    try {
      return new URL(`${protocol}://${rawHost}`);
    } catch {
      // Continúa al respaldo por defecto si la URL combinada resulta inválida.
    }
  }

  return new URL(DEFAULT_SITE_URL);
}

function getAlternateOgLocales(locale: Locale): string[] {
  return Object.entries(OPEN_GRAPH_LOCALE_BY_UI_LOCALE)
    .filter(([code]) => code !== locale)
    .map(([, ogLocale]) => ogLocale);
}

/**
 * Construye los metadatos raíz globales (SEO, Open Graph, Twitter Cards,
 * PWA manifest e indexación) compartidos por todas las rutas.
 */
export function buildRootMetadata(
  dict: Dictionary,
  locale: Locale,
  siteUrl: URL,
): Metadata {
  const ogImage = {
    url: OG_IMAGE_PATH,
    width: OG_IMAGE_DIMENSIONS.width,
    height: OG_IMAGE_DIMENSIONS.height,
    type: "image/png",
    alt: dict.meta.ogImageAlt,
  };

  return {
    metadataBase: siteUrl,
    applicationName: SITE_NAME,
    title: {
      default: dict.meta.siteTitle,
      template: `%s | ${SITE_NAME}`,
    },
    description: dict.meta.siteDescription,
    keywords: [...dict.meta.seoKeywords],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "education",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: SITE_NAME,
      statusBarStyle: "default",
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
      url: "/",
      locale: OPEN_GRAPH_LOCALE_BY_UI_LOCALE[locale],
      alternateLocale: getAlternateOgLocales(locale),
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
      images: [
        {
          url: OG_IMAGE_PATH,
          width: OG_IMAGE_DIMENSIONS.width,
          height: OG_IMAGE_DIMENSIONS.height,
          alt: dict.meta.ogImageAlt,
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export interface PublicPageMetadataInput {
  dict: Dictionary;
  locale: Locale;
  path: string;
  title: string;
  description: string;
  shareTitle?: string;
  shareDescription?: string;
}

/**
 * Construye metadatos completos para páginas públicas indexables preservando
 * las imágenes Open Graph / Twitter heredadas y definiendo URL canónica propia.
 */
export function buildPublicPageMetadata({
  dict,
  locale,
  path,
  title,
  description,
  shareTitle,
  shareDescription,
}: PublicPageMetadataInput): Metadata {
  const ogTitle = shareTitle ?? `${title} | ${SITE_NAME}`;
  const ogDescription = shareDescription ?? description;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: ogTitle,
      description: ogDescription,
      url: path,
      locale: OPEN_GRAPH_LOCALE_BY_UI_LOCALE[locale],
      alternateLocale: getAlternateOgLocales(locale),
      images: [
        {
          url: OG_IMAGE_PATH,
          width: OG_IMAGE_DIMENSIONS.width,
          height: OG_IMAGE_DIMENSIONS.height,
          type: "image/png",
          alt: dict.meta.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: OG_IMAGE_PATH,
          width: OG_IMAGE_DIMENSIONS.width,
          height: OG_IMAGE_DIMENSIONS.height,
          alt: dict.meta.ogImageAlt,
        },
      ],
    },
  };
}

/**
 * Construye datos estructurados JSON-LD (`Organization` + `WebApplication`)
 * para enriquecer la presencia en motores de búsqueda.
 */
export function buildSiteStructuredData(
  dict: Dictionary,
  locale: Locale,
  siteUrl: URL,
) {
  const origin = siteUrl.origin;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: SITE_NAME,
        url: origin,
        logo: new URL(ORGANIZATION_LOGO_PATH, origin).toString(),
      },
      {
        "@type": "WebApplication",
        "@id": `${origin}/#webapp`,
        name: SITE_NAME,
        url: origin,
        description: dict.meta.siteDescription,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        inLanguage: ["es", "en", "fr", "it"],
        isAccessibleForFree: true,
        image: new URL(OG_IMAGE_PATH, origin).toString(),
        publisher: {
          "@id": `${origin}/#organization`,
        },
        potentialAction: {
          "@type": "ReadAction",
          target: new URL("/login", origin).toString(),
        },
        about: {
          "@type": "Thing",
          name: locale === "es" ? "Aprendizaje de idiomas" : "Language acquisition",
        },
      },
    ],
  };
}
