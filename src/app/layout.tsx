import { ThemeProvider } from "flowbite-react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";

import { SerwistProvider } from "@serwist/turbopack/react";
import { OfflineSync } from "@/components/pwa/use-offline-sync";
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

/**
 * El `viewport` va aparte del `metadata` en Next 16: el color de la barra
 * del navegador en movil es el de la marca (`--background` de globals.css).
 */
export const viewport: Viewport = {
  themeColor: "#fafafa",
};

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
        {/* El provider de Serwist registra el service worker: lo que hace
            que la app arranque sin servidor (y se pueda leer y responder
            sin red).

            En DESARROLLO no se registra, a proposito: el service worker
            intercepta las peticiones y las pruebas de extremo a extremo
            usan un backend simulado (las intercepta el navegador, no el
            service worker), asi que con el service worker activo las
            pruebas dejarian de ver sus datos. Ademas, cachear el codigo
            que se esta editando hace que el navegador no vea los
            cambios.

            `reloadOnOnline={false}`: Serwist recarga la pagina sola cuando
            vuelve la red (es su comportamiento por defecto), pero aqui la
            app **ya** se encarga de eso (sincroniza la cola de lo hecho
            sin conexion). Recargar en ese momento, ademas de perder el
            sitio donde estaba la persona, **cortaba la sincronizacion a
            medias**. */}
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV === "development"}
          reloadOnOnline={false}
        >
          <ThemeProvider theme={dolyFlowbiteTheme}>
          <LocaleProvider initialLocale={initialLocale}>
            <ToastProvider>
              <AuthProvider initialAuth={initialAuth}>
                {/* Sincroniza lo que se hizo sin conexion en cuanto vuelve la
                    red (responder una lectura, guardar una palabra). */}
                <OfflineSync />
                <AppShell designSystemEnabled={designSystemEnabled}>
                  {children}
                </AppShell>
              </AuthProvider>
              <ToastViewport />
            </ToastProvider>
          </LocaleProvider>
        </ThemeProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
