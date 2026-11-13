import type { Metadata } from "next";

import { EvaluationView } from "@/app/readings/[id]/evaluate/_components/evaluation-view";

export const metadata: Metadata = {
  title: "Evaluación de Comprensión | DolyNation",
  description:
    "Redacta tu resumen contextual y recibe evaluación inteligente sobre retención temática, léxico y claridad.",
};

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
