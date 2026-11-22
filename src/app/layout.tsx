import { ThemeProvider } from "flowbite-react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";

import { AppShell } from "@/components/layout";
import { ToastViewport } from "@/components/ui";
import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";
import { AuthProvider, ToastProvider } from "@/context";
import { getDictionary, LocaleProvider } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { isDesignSystemEnabled } from "@/lib/feature-flags";
import { getServerInitialAuthState } from "@/lib/server";

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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return {
    title: {
      default: dict.meta.siteTitle,
      template: "%s | DolyNation Editorial",
    },
    description: dict.meta.siteDescription,
    // El manifest de la PWA (`src/app/manifest.ts`). Next lo sirve solo si
    // se declara en el metadata.
    manifest: "/manifest.webmanifest",
    // iOS no lee el manifest: necesita su propio icono y su modo
    // "standalone" declarados aqui.
    appleWebApp: {
      capable: true,
      title: dict.meta.appShortName,
      statusBarStyle: "default",
    },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon-180.png", sizes: "180x180" }],
    },
    // El color de la barra del navegador en movil: el de la marca
    // (`--background` de globals.css).
    themeColor: "#fafafa",
    other: {
      "mobile-web-app-capable": "yes",
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [initialLocale, initialAuth] = await Promise.all([
    getServerLocale(),
    getServerInitialAuthState(),
  ]);
  const designSystemEnabled = isDesignSystemEnabled();

  return (
    <html
      lang={initialLocale}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${editorialSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-secondary-soft text-heading font-sans">
        <ThemeProvider theme={dolyFlowbiteTheme}>
          <LocaleProvider initialLocale={initialLocale}>
            <ToastProvider>
              <AuthProvider initialAuth={initialAuth}>
                <AppShell designSystemEnabled={designSystemEnabled}>
                  {children}
                </AppShell>
              </AuthProvider>
              <ToastViewport />
            </ToastProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
