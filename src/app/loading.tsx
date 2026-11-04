import { Card, Container } from "@/components/ui";

/**
 * Indicador de carga global del App Router.
 */
export default function Loading() {
  return (
    <Container size="lg" className="py-6">
      <div
        role="status"
        aria-label="Cargando contenido académico"
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <div className="h-9 w-72 max-w-full animate-pulse rounded-xs bg-surface-muted" />
          <div className="h-5 w-96 max-w-full animate-pulse rounded-xs bg-surface-subtle" />
        </div>

        <Card variant="subtle" padding="lg">
          <div className="flex flex-col gap-3">
            <div className="h-4 w-44 animate-pulse rounded-xs bg-surface-muted" />
            <div className="h-10 w-64 max-w-full animate-pulse rounded-xs bg-surface-muted" />
            <div className="h-4 w-full animate-pulse rounded-xs bg-surface-muted/70" />
          </div>
        </Card>
      </div>
    </Container>
  );
}
