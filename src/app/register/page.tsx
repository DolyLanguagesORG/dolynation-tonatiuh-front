import type { Metadata } from "next";
import { Suspense } from "react";

import { RegisterFlow } from "@/app/register/_components/register-flow";
import { Container, SkeletonCard } from "@/components/ui";

export const metadata: Metadata = {
  title: "Crear cuenta y onboarding",
  description:
    "Crea tu expediente estudiantil en DolyNation, elige tu plan e idiomas meta de estudio.",
};

/**
 * Ruta `/register` como Server Component ligero que delega al flujo modular de 4 pasos.
 */
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Container size="md" className="w-full max-w-3xl">
          <SkeletonCard lines={6} label="Cargando registro académico" />
        </Container>
      }
    >
      <RegisterFlow />
    </Suspense>
  );
}
