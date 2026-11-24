import type { Metadata } from "next";

import { EvaluationResultView } from "@/app/readings/[id]/result/_components/evaluation-result-view";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.readings.result.breakdownTitle,
    description: t.readings.result.subtitle,
    robots: NOINDEX_ROBOTS,
  };
}

interface ReadingResultPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Ruta `/readings/[id]/result`: Server Component que delega la presentación
 * de resultados de comprensión a `EvaluationResultView`.
 */
export default async function ReadingResultPage({
  params,
}: ReadingResultPageProps) {
  const { id } = await params;
  return <EvaluationResultView readingId={id} />;
}
