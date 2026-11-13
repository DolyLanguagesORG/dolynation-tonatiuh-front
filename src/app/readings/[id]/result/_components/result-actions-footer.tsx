import { ActionLink, Divider, Icon, Text } from "@/components/ui";
import { type Dictionary } from "@/i18n";

export interface ResultActionsFooterProps {
  t: Dictionary;
  readingId: number;
}

/**
 * Barra final de acciones post-evaluación (`08-resultado-de-evaluacion.png`).
 */
export function ResultActionsFooter({
  t,
  readingId,
}: ResultActionsFooterProps) {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <Divider />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <ActionLink href="/" variant="ghost" size="sm">
            {t.readings.result.homeButton}
          </ActionLink>
          <ActionLink href={`/readings/${readingId}`} variant="secondary" size="sm">
            {t.readings.rereadAction}
          </ActionLink>
          <ActionLink href="/readings" variant="secondary" size="sm">
            {t.readings.result.viewCompletedButton}
          </ActionLink>
        </div>

        <ActionLink
          href="/generate"
          variant="primary"
          size="lg"
          rightIcon={<Icon name="arrow-right" size="sm" />}
        >
          {t.readings.result.generateNewButton}
        </ActionLink>
      </div>

      <Text
        variant="caption"
        tone="muted"
        className="font-mono tracking-wider uppercase"
      >
        {t.readings.result.sessionFooterStandard}
      </Text>
    </div>
  );
}
