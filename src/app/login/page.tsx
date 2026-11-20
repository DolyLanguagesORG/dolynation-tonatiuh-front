import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginView } from "@/app/login/_components/login-view";
import { Container, LocalizedSkeletonCard } from "@/components/ui";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { buildPublicPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return buildPublicPageMetadata({
    dict: t,
    locale,
    path: "/login",
    title: t.auth.topSignIn,
    description: t.meta.siteDescription,
    shareTitle: t.meta.siteTitle,
    shareDescription: t.meta.siteDescription,
  });
}

/**
 * Ruta `/login` como Server Component ligero con carga diferida del formulario cliente.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Container size="sm" className="w-full max-w-[460px] px-0">
          <LocalizedSkeletonCard lines={4} labelKey="loadingLogin" />
        </Container>
      }
    >
      <LoginView />
    </Suspense>
  );
}
