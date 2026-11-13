import { Container, Skeleton, SkeletonCard } from "@/components/ui";

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
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>

        <SkeletonCard lines={3} label="Cargando contenido académico" />
      </div>
    </Container>
  );
}
