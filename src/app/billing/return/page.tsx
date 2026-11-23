import type { Metadata } from "next";
import { Suspense } from "react";

import { BillingReturnView } from "@/app/billing/return/_components/billing-return-view";
import { Container, LocalizedSkeletonCard } from "@/components/ui";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.billing.returnPage.syncingTitle,
    description: t.billing.returnPage.syncingSubtitle,
  };
}

/**
 * Ruta `/billing/return` a la que Stripe redirige tras completar 3DS, OXXO, SPEI o Checkout.
 */
export default function BillingReturnPage() {
  return (
    <Suspense
      fallback={
        <Container size="md" className="w-full max-w-2xl">
          <LocalizedSkeletonCard lines={4} labelKey="loadingDefault" />
        </Container>
      }
    >
      <BillingReturnView />
    </Suspense>
  );
}
