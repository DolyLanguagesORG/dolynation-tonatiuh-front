import type { Metadata } from "next";

import { DesignSystemView } from "@/app/design-system/_components/design-system-view";

export const metadata: Metadata = {
  title: "Sistema de Diseño UI | DolyNation",
  description:
    "Catálogo oficial de primitivos estandarizados en Blanco y Negro basados en Flowbite React y Lucide Icons.",
};

/**
 * Ruta `/design-system`: catálogo público e interactivo de la biblioteca `@/components/ui`.
 */
export default function DesignSystemPage() {
  return <DesignSystemView />;
}
