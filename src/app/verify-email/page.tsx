import type { Metadata } from "next";
import { Suspense } from "react";

import { VerifyEmailView } from "@/app/verify-email/_components/verify-email-view";
import { Container, LocalizedSkeletonCard } from "@/components/ui";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.auth.stepper.step2VerifyEmail.title,
    description: t.auth.stepper.step2VerifyEmail.instruction,
    robots: NOINDEX_ROBOTS,
  };
}

/**
 * Ruta `/verify-email` dedicada al paso 2 del onboarding y validación de enlace firmado.
 */
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Container size="md" className="w-full max-w-3xl">
          <LocalizedSkeletonCard lines={5} labelKey="loadingVerifyEmail" />
        </Container>
      }
    >
      <VerifyEmailView />
    </Suspense>
  );
}
