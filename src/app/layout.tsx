import { ThemeProvider } from "flowbite-react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";

import { SessionHistoryGuard } from "@/components/auth";
import { AppShell } from "@/components/layout";
import { ToastViewport } from "@/components/ui";
import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";
import {
  AuthProvider,
  NavigationGuardProvider,
  ToastProvider,
} from "@/context";
import { getDictionary, LocaleProvider } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { isDesignSystemEnabled } from "@/lib/feature-flags";
import { buildRootMetadata, buildSiteStructuredData } from "@/lib/seo";
import { getServerInitialAuthState } from "@/lib/server";
import { getRequestSiteUrl } from "@/lib/server/site-url";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const editorialSerif = Newsreader({
  variable: "--font-editorial-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "light",
};

export async function generateMetadata(): Promise<Metadata> {
  const [locale, siteUrl] = await Promise.all([
    getServerLocale(),
    getRequestSiteUrl(),
  ]);
  const dict = getDictionary(locale);

  return buildRootMetadata(dict, locale, siteUrl);
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [initialLocale, initialAuth, siteUrl] = await Promise.all([
    getServerLocale(),
    getServerInitialAuthState(),
    getRequestSiteUrl(),
  ]);
  const designSystemEnabled = isDesignSystemEnabled();
  const dict = getDictionary(initialLocale);
  const structuredDataJson = JSON.stringify(
    buildSiteStructuredData(dict, initialLocale, siteUrl),
  ).replace(/</g, "\\u003c");

  return (
    <html
      lang={initialLocale}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${editorialSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-secondary-soft text-heading font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredDataJson }}
        />
        <ThemeProvider theme={dolyFlowbiteTheme}>
          <LocaleProvider initialLocale={initialLocale}>
            <ToastProvider>
              <AuthProvider initialAuth={initialAuth}>
                <NavigationGuardProvider>
                  <SessionHistoryGuard />
                  <AppShell designSystemEnabled={designSystemEnabled}>
                    {children}
                  </AppShell>
                </NavigationGuardProvider>
              </AuthProvider>
              <ToastViewport />
            </ToastProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
