import { Card, Eyebrow, Heading, Text } from "@/components/ui";
import { type Dictionary } from "@/i18n";

export interface EvaluationRubricGridProps {
  t: Dictionary;
}

/**
 * Rejilla de tres dimensiones evaluadas por el modelo IA de DolyNation
 * (`07-respuesta-de-comprension.png`).
 */
export function EvaluationRubricGrid({ t }: EvaluationRubricGridProps) {
  return (
    <section className="flex flex-col gap-3">
      <Eyebrow tone="muted">{t.readings.eval.dimensionsTitle}</Eyebrow>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {t.readings.eval.dimensions.map((dimension) => (
          <Card
            key={dimension.title}
            variant="subtle"
            padding="md"
            className="flex flex-col gap-2"
          >
            <Heading as="h2" variant="subsection">
              {dimension.title}
            </Heading>
            <Text variant="small" tone="body">
              {dimension.description}
            </Text>
          </Card>
        ))}
      </div>
    </section>
  );
}
