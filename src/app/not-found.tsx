import {
  ActionLink,
  Badge,
  Card,
  Container,
  Heading,
  Icon,
  Text,
} from "@/components/ui";

export default function NotFound() {
  return (
    <Container size="md" className="py-12">
      <Card padding="lg" className="flex flex-col items-start gap-5">
        <Badge variant="primary">[ERROR 404] ARCHIVO NO LOCALIZADO</Badge>

        <div className="flex flex-col gap-2">
          <Heading as="h1" variant="display" mainHeading>
            Expediente o lectura no encontrada
          </Heading>
          <Text variant="editorial" tone="muted" className="italic">
            La ruta solicitada no existe en el catálogo editorial de DolyNation
            o ha sido trasladada.
          </Text>
        </div>

        <ActionLink
          href="/"
          variant="primary"
          size="md"
          leftIcon={<Icon name="arrow-left" size="sm" />}
        >
          Volver al inicio académico
        </ActionLink>
      </Card>
    </Container>
  );
}
