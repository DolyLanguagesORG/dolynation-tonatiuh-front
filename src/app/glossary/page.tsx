import type { Metadata } from "next";

import { GlossaryView } from "@/app/glossary/_components/glossary-view";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.glossary.title,
    description: t.glossary.subtitle,
    robots: NOINDEX_ROBOTS,
  };
}

/**
 * Ruta `/glossary`: Server Component que delega la vista interactiva a `GlossaryView`.
 */
export default function GlossaryPage() {
  return <GlossaryView />;
}
