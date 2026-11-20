import type { Metadata } from "next";

import { ReadingDetailView } from "@/app/readings/[id]/_components/reading-detail-view";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.nav.myReadings,
    description: t.readings.historySubtitle,
    robots: NOINDEX_ROBOTS,
  };
}

interface ReadingDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Ruta `/readings/[id]`: Server Component que resuelve el parámetro `id`
 * y delega la interfaz interactiva a `ReadingDetailView`.
 */
export default async function ReadingDetailPage({
  params,
}: ReadingDetailPageProps) {
  const { id } = await params;
  return <ReadingDetailView readingId={id} />;
}
