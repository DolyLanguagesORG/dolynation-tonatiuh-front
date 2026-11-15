import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginView } from "@/app/login/_components/login-view";
import { Container, SkeletonCard } from "@/components/ui";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description:
    "Accede a tu expediente académico de DolyNation para sincronizar racha, lecturas y evaluaciones.",
};

/**
 * Ruta `/login` como Server Component ligero con carga diferida del formulario cliente.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Container size="sm" className="w-full max-w-[460px] px-0">
          <SkeletonCard lines={4} label="Cargando inicio de sesión" />
        </Container>
      }
    >
      <LoginView />
    </Suspense>
  );
}
