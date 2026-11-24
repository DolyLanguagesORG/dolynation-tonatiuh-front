import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterFlow } from "@/app/register/_components/register-flow";
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
    path: "/register",
    title: t.auth.topCreateAccount,
    description: t.auth.register.subtitle,
  });
}

/**
 * Ruta `/register` como Server Component ligero que delega al flujo modular de 4 pasos.
 */
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Container size="md" className="w-full max-w-3xl">
          <LocalizedSkeletonCard lines={6} labelKey="loadingRegister" />
        </Container>
      }
    >
      <RegisterFlow />
    </Suspense>
  );
}
