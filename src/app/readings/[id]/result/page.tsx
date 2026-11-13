import type { Metadata } from "next";

import { EvaluationResultView } from "@/app/readings/[id]/result/_components/evaluation-result-view";

export const metadata: Metadata = {
  title: "Resultado de Evaluación | DolyNation",
  description:
    "Consulta tu índice de comprensión CEFR, retroalimentación de IA y vocabulario contextual asimilado.",
};

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
