import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordView } from "@/app/reset-password/_components/reset-password-view";
import { Container, LocalizedSkeletonCard } from "@/components/ui";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.auth.resetPassword.title,
    description: t.auth.resetPassword.subtitle,
  };
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Container size="sm" className="py-10">
          <LocalizedSkeletonCard lines={4} labelKey="loadingResetPassword" />
        </Container>
      }
    >
      <ResetPasswordView />
    </Suspense>
  );
}
