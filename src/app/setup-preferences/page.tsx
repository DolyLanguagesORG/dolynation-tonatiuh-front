import type { Metadata } from "next";

import { SetupPreferencesView } from "@/app/setup-preferences/_components/setup-preferences-view";

export const metadata: Metadata = {
  title: "Configurar preferencias de estudio",
  description:
    "Configura tus idiomas de estudio y al menos 3 categorías temáticas en DolyNation.",
};

/**
 * Ruta `/setup-preferences` posterior a la selección de plan.
 */
export default function SetupPreferencesPage() {
  return <SetupPreferencesView />;
}
