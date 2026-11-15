import type { Metadata } from "next";

import { ReadingsHistoryView } from "@/app/readings/_components/readings-history-view";

export const metadata: Metadata = {
  title: "Historial de Lecturas | DolyNation",
  description:
    "Consulta tus lecturas generadas, evaluaciones pendientes, calificaciones CEFR y retroalimentación de IA.",
};

/**
 * Ruta `/readings`: Server Component que delega la lógica interactiva a `ReadingsHistoryView`.
 */
export default function ReadingsHistoryPage() {
  return <ReadingsHistoryView />;
}
