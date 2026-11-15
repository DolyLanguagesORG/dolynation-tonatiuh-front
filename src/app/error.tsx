"use client";

import { useEffect } from "react";

import {
  Alert,
  Button,
  Card,
  Container,
  Eyebrow,
  Heading,
  Icon,
} from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DolyNation Error Boundary]:", error);
  }, [error]);

  return (
    <Container size="md" className="py-10">
      <Card padding="lg" className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Eyebrow tone="muted">[EXCEPCIÓN DE APLICACIÓN]</Eyebrow>
          <Heading as="h1" variant="title" mainHeading>
            No fue posible procesar esta vista académica
          </Heading>
        </div>

        <Alert
          variant="error"
          title="Interrupción inesperada en la sesión"
          code={error.digest ?? "UI_RUNTIME_ERROR"}
        >
          Ocurrió un inconveniente al renderizar el módulo actual. Puedes
          reintentar la carga sin perder tu progreso sincronizado.
        </Alert>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            leftIcon={<Icon name="arrow-left" size="sm" />}
            onClick={() => reset()}
          >
            Reintentar carga
          </Button>
        </div>
      </Card>
    </Container>
  );
}
