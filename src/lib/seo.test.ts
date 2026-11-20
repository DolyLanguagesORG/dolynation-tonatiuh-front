import { describe, expect, it } from "@jest/globals";

import manifest from "@/app/manifest";
import { dictionaries } from "@/i18n/dictionaries";
import {
  buildPublicPageMetadata,
  buildRootMetadata,
  buildSiteStructuredData,
  DEFAULT_SITE_URL,
  OG_IMAGE_PATH,
  resolveSiteUrlFromValues,
  SITE_NAME,
} from "@/lib/seo";

describe("SEO & social metadata helpers", () => {
  it("resolves metadataBase from env, proxy headers, localhost, or safe default", () => {
    expect(
      resolveSiteUrlFromValues({
        envSiteUrl: "https://app.dolynation.com/some/path",
        host: "ignored.example.com",
      }).toString(),
    ).toBe("https://app.dolynation.com/");

    expect(
      resolveSiteUrlFromValues({
        forwardedHost: "devweb.yacaterkos.tech, internal.proxy",
        forwardedProto: "https, http",
      }).toString(),
    ).toBe("https://devweb.yacaterkos.tech/");

    expect(
      resolveSiteUrlFromValues({
        host: "localhost:57012",
      }).toString(),
    ).toBe("http://localhost:57012/");

    expect(
      resolveSiteUrlFromValues({
        host: "invalid host/inject",
      }).toString(),
    ).toBe(`${DEFAULT_SITE_URL}/`);
  });

  it("builds complete root metadata with Open Graph, Twitter, manifest, and robots", () => {
    const siteUrl = new URL("https://devweb.yacaterkos.tech");
    const metadata = buildRootMetadata(dictionaries.es, "es", siteUrl);

    expect(metadata.metadataBase?.toString()).toBe(
      "https://devweb.yacaterkos.tech/",
    );
    expect(metadata.applicationName).toBe(SITE_NAME);
    expect(metadata.manifest).toBe("/manifest.webmanifest");
    expect(metadata.appleWebApp).toEqual({
      capable: true,
      title: SITE_NAME,
      statusBarStyle: "default",
    });
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      siteName: SITE_NAME,
      title: dictionaries.es.meta.siteTitle,
      description: dictionaries.es.meta.siteDescription,
      locale: "es_MX",
      images: [
        expect.objectContaining({
          url: OG_IMAGE_PATH,
          width: 1200,
          height: 630,
          type: "image/png",
        }),
      ],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: dictionaries.es.meta.siteTitle,
      description: dictionaries.es.meta.siteDescription,
      images: [
        expect.objectContaining({
          url: OG_IMAGE_PATH,
          width: 1200,
          height: 630,
        }),
      ],
    });
    expect(metadata.robots).toMatchObject({
      index: true,
      follow: true,
    });
  });

  it("preserves social images and canonical links for public pages", () => {
    const meta = buildPublicPageMetadata({
      dict: dictionaries.es,
      locale: "es",
      path: "/login",
      title: "Iniciar sesión",
      description: dictionaries.es.meta.siteDescription,
      shareTitle: dictionaries.es.meta.siteTitle,
      shareDescription: dictionaries.es.meta.siteDescription,
    });

    expect(meta.alternates?.canonical).toBe("/login");
    expect(meta.openGraph).toMatchObject({
      title: dictionaries.es.meta.siteTitle,
      url: "/login",
      images: [expect.objectContaining({ url: OG_IMAGE_PATH })],
    });
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      title: dictionaries.es.meta.siteTitle,
      images: [expect.objectContaining({ url: OG_IMAGE_PATH })],
    });
  });

  it("builds JSON-LD structured data and PWA manifest icons", () => {
    const siteUrl = new URL("https://stagingweb.yacaterkos.tech");
    const jsonLd = buildSiteStructuredData(dictionaries.es, "es", siteUrl);
    const graph = jsonLd["@graph"];

    expect(graph[0]).toMatchObject({
      "@type": "Organization",
      name: SITE_NAME,
      logo: "https://stagingweb.yacaterkos.tech/icons/icon-512.png",
    });
    expect(graph[1]).toMatchObject({
      "@type": "WebApplication",
      name: SITE_NAME,
      image: "https://stagingweb.yacaterkos.tech/images/og-dolynation.png",
      inLanguage: ["es", "en", "fr", "it"],
    });

    const webManifest = manifest();
    expect(webManifest.short_name).toBe(SITE_NAME);
    expect(webManifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icons/icon-192.png", sizes: "192x192" }),
        expect.objectContaining({ src: "/icons/icon-512.png", sizes: "512x512" }),
        expect.objectContaining({
          src: "/icons/icon-maskable-512.png",
          purpose: "maskable",
        }),
      ]),
    );
  });
});
