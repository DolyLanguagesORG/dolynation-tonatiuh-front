import type { Metadata } from "next";

import { GlossaryView } from "@/app/glossary/_components/glossary-view";

export const metadata: Metadata = {
  title: "Glosario Personal | DolyNation",
  description:
    "Consulta palabras, frases y expresiones guardadas desde tus lecturas con su desglose literal, explicación contextual, alternativas y otros usos.",
};

/**
 * Ruta `/glossary`: Server Component que delega la vista interactiva a `GlossaryView`.
 */
export default function GlossaryPage() {
  return <GlossaryView />;
}
