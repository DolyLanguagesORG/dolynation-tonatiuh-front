import type { Metadata } from "next";
import { Suspense } from "react";

import { VerifyEmailView } from "@/app/verify-email/_components/verify-email-view";
import { Container, SkeletonCard } from "@/components/ui";

export const metadata: Metadata = {
  title: "Confirmar correo electrónico",
  description:
    "Confirma tu dirección de correo académico para continuar con la selección de plan en DolyNation.",
};

/**
 * Ruta `/verify-email` dedicada al paso 2 del onboarding y validación de enlace firmado.
 */
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <Container size="md" className="w-full max-w-3xl">
          <SkeletonCard lines={5} label="Verificando correo electrónico" />
        </Container>
      }
    >
      <VerifyEmailView />
    </Suspense>
  );
}
