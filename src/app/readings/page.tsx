import type { Metadata } from "next";

import { ReadingsHistoryView } from "@/app/readings/_components/readings-history-view";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.readings.historyTitle,
    description: t.readings.historySubtitle,
    robots: NOINDEX_ROBOTS,
  };
}

/**
 * Ruta `/readings`: Server Component que delega la lógica interactiva a `ReadingsHistoryView`.
 */
export default function ReadingsHistoryPage() {
  return <ReadingsHistoryView />;
}
