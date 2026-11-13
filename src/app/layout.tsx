import { ThemeProvider } from "flowbite-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";

import { AppShell } from "@/components/layout";
import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";
import { AuthProvider } from "@/context";
import { LocaleProvider, type Locale } from "@/i18n";
import { isDesignSystemEnabled } from "@/lib/feature-flags";

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

export const metadata: Metadata = {
  title: {
    default: "DolyNation — Plataforma Lingüística & Lectura Contextual",
    template: "%s | DolyNation Editorial",
  },
  description:
    "Plataforma académica de adquisición lingüística mediante lectura contextual asistida por inteligencia artificial y evaluación CEFR.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("doly_ui_locale")?.value;
  const initialLocale: Locale = rawLocale === "en" ? "en" : "es";
  const designSystemEnabled = isDesignSystemEnabled();

  return (
    <html
      lang={initialLocale}
      className={`${geistSans.variable} ${geistMono.variable} ${editorialSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-secondary-soft text-heading font-sans">
        <ThemeProvider theme={dolyFlowbiteTheme}>
          <LocaleProvider initialLocale={initialLocale}>
            <AuthProvider>
              <AppShell designSystemEnabled={designSystemEnabled}>
                {children}
              </AppShell>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
