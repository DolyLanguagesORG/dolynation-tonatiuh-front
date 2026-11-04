import Link from "next/link";

import { Badge, Button, Card, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container size="md" className="py-12">
      <Card padding="lg" className="flex flex-col items-start gap-5">
        <Badge variant="primary">[ERROR 404] ARCHIVO NO LOCALIZADO</Badge>

        <div className="flex flex-col gap-2">
          <h1
            id="main-heading"
            tabIndex={-1}
            className="font-serif text-3xl font-semibold text-ink sm:text-4xl"
          >
            Expediente o lectura no encontrada
          </h1>
          <p className="font-serif text-base leading-relaxed text-muted italic">
            La ruta solicitada no existe en el catálogo editorial de DolyNation
            o ha sido trasladada.
          </p>
        </div>

        <Link href="/">
          <Button variant="primary" tabIndex={-1}>
            Volver al inicio académico
          </Button>
        </Link>
      </Card>
    </Container>
  );
}
