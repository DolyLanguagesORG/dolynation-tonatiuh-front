import type { Metadata } from "next";

import { InfoPageView } from "@/components/legal/info-page-view";

export const metadata: Metadata = {
  title: "Soporte Académico y Técnico",
  description:
    "Guía rápida de recuperación de acceso, verificación de correo y reglas del sistema.",
};

export default function SupportPage() {
  return <InfoPageView kind="support" />;
}
