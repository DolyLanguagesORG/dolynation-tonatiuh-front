"use client";

import { Badge, Card, ChoiceChip, Eyebrow, Text } from "@/components/ui";
import { type Dictionary } from "@/i18n";

export interface EvaluationCriteriaCardProps {
  t: Dictionary;
  suggestedTerms: readonly string[];
  onInsertTerm: (term: string) => void;
}

/**
 * Tarjeta superior con criterios de respuesta y términos sugeridos clicables
 * para incorporar en el resumen (`07-respuesta-de-comprension.png`).
 */
export function EvaluationCriteriaCard({
  t,
  suggestedTerms,
  onInsertTerm,
}: EvaluationCriteriaCardProps) {
  return (
    <Card variant="subtle" padding="md" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow tone="muted">{t.readings.eval.criteriaTitle}</Eyebrow>
        <Badge variant="outline">{t.readings.eval.goalMinWords}</Badge>
      </div>

      <Text variant="body" tone="body" className="leading-relaxed">
        {t.readings.eval.criteriaDescription}
      </Text>

      {suggestedTerms.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {suggestedTerms.map((term) => (
            <ChoiceChip
              key={term}
              size="sm"
              indicator="plus-check"
              onClick={() => onInsertTerm(term)}
            >
              #{term}
            </ChoiceChip>
          ))}
        </div>
      )}
    </Card>
  );
}
