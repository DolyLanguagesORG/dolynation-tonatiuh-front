import { Badge, Card, Divider, Eyebrow, Icon, Text } from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";

export interface ResultAnalysisSectionsProps {
  t: Dictionary;
  locale: Locale;
  feedback: string | null;
  userResponse: string | null;
  passed: boolean;
  keyTerms: readonly { term: string; usedInResponse: boolean }[];
}

/**
 * Bloques de retroalimentación IA, transcripción de la síntesis enviada y
 * términos clave asimilados (`08-resultado-de-evaluacion.png`).
 */
export function ResultAnalysisSections({
  t,
  locale,
  feedback,
  userResponse,
  passed,
  keyTerms,
}: ResultAnalysisSectionsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padding="lg" className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Icon
              name={passed ? "check-circle" : "info"}
              size="sm"
              className={passed ? "text-fg-success" : "text-heading"}
            />
            <Eyebrow tone="muted">{t.readings.result.strengthsTitle}</Eyebrow>
          </div>

          <Divider />

          <Text variant="body" tone="heading" className="leading-relaxed">
            {feedback?.trim() ||
              (locale === "es"
                ? "Evaluación registrada por el sistema sin comentarios adicionales."
                : "Evaluation recorded by the system without additional comments.")}
          </Text>
        </Card>

        <Card padding="lg" className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Icon name="file-text" size="sm" />
            <Eyebrow tone="muted">{t.readings.result.improvementsTitle}</Eyebrow>
          </div>

          <Divider />

          <Text variant="caption" tone="muted" className="font-bold uppercase">
            {t.readings.result.integrationSuggestionLabel}
          </Text>

          <blockquote className="border-l-2 border-brand bg-neutral-secondary-soft px-4 py-3 font-serif text-base leading-relaxed text-heading italic">
            {userResponse?.trim() ||
              (locale === "es"
                ? "Sin texto de resumen disponible."
                : "No submitted summary text available.")}
          </blockquote>
        </Card>
      </div>

      {keyTerms.length > 0 && (
        <Card variant="subtle" padding="md" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow tone="muted">
              {t.readings.result.assimilatedTermsTitle}
            </Eyebrow>
            <Text variant="caption" tone="muted" className="font-mono">
              {keyTerms.length} {t.readings.termsSuffix}
            </Text>
          </div>

          <div className="flex flex-wrap gap-2">
            {keyTerms.map((item) => (
              <Badge
                key={item.term}
                variant={item.usedInResponse ? "success" : "outline"}
              >
                {item.term}
                {item.usedInResponse ? " ✓" : ""}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
