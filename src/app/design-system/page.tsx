import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DesignSystemView } from "@/app/design-system/_components/design-system-view";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { isDesignSystemEnabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.designSystem.title,
    description: t.designSystem.subtitle,
  };
}

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
