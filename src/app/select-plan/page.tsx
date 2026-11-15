import type { Metadata } from "next";

import { SelectPlanView } from "@/app/select-plan/_components/select-plan-view";

export const metadata: Metadata = {
  title: "Seleccionar plan de suscripción",
  description:
    "Elige entre Dolly, Dolly Plus o Dolly Pro para desbloquear tu experiencia en DolyNation.",
};

/**
 * Ruta `/select-plan` obligatoria tras confirmar el correo electrónico.
 */
export default function SelectPlanPage() {
  return <SelectPlanView />;
}
