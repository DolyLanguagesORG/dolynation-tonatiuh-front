import type { Metadata } from "next";

import { InfoPageView } from "@/components/legal/info-page-view";

export const metadata: Metadata = {
  title: "Términos Académicos de Uso",
  description:
    "Condiciones de cuenta, planes de suscripción y uso educativo de DolyNation.",
};

export default function TermsPage() {
  return <InfoPageView kind="terms" />;
}
