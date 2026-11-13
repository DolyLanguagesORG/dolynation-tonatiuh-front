import type { Metadata } from "next";

import { InfoPageView } from "@/components/legal/info-page-view";

export const metadata: Metadata = {
  title: "Política de Privacidad y Ética de Datos",
  description:
    "Manejo seguro de sesiones HttpOnly, historial de lecturas y control de cuenta.",
};

export default function PrivacyPage() {
  return <InfoPageView kind="privacy" />;
}
