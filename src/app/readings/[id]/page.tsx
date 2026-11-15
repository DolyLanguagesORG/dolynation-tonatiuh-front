import type { Metadata } from "next";

import { ReadingDetailView } from "@/app/readings/[id]/_components/reading-detail-view";

export const metadata: Metadata = {
  title: "Lectura Contextual | DolyNation",
  description:
    "Lector editorial interactivo con análisis contextual de vocabulario por IA y preparación para evaluación.",
};

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
