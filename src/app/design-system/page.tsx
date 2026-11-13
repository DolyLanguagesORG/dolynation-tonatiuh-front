import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DesignSystemView } from "@/app/design-system/_components/design-system-view";
import { isDesignSystemEnabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sistema de Diseño UI | DolyNation",
  description:
    "Catálogo oficial de primitivos estandarizados en Blanco y Negro basados en Flowbite React y Lucide Icons.",
};

/**
 * Ruta `/design-system`: catálogo público e interactivo de la biblioteca `@/components/ui`
 * controlado por la bandera de servidor `ENABLE_DESIGN_SYSTEM`.
 */
export default function DesignSystemPage() {
  if (!isDesignSystemEnabled()) {
    notFound();
  }

  return <DesignSystemView />;
}
