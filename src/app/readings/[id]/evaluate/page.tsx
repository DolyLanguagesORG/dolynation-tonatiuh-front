import type { Metadata } from "next";

import { EvaluationView } from "@/app/readings/[id]/evaluate/_components/evaluation-view";
import { getDictionary } from "@/i18n";
import { getServerLocale } from "@/i18n/server-locale";
import { NOINDEX_ROBOTS } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  return {
    title: t.readings.eval.title,
    description: t.readings.eval.criteriaDescription,
    robots: NOINDEX_ROBOTS,
  };
}

interface EvaluateReadingPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Ruta `/readings/[id]/evaluate`: Server Component que delega la evaluación interactiva a `EvaluationView`.
 */
export default async function EvaluateReadingPage({
  params,
}: EvaluateReadingPageProps) {
  const { id } = await params;
  return <EvaluationView readingId={id} />;
}
