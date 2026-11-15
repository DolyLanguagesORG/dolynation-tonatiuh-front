import { ActionLink, Divider, Icon } from "@/components/ui";
import { type ReadingFlowDictionary } from "@/i18n";

export interface ResultActionsFooterProps {
  t: ReadingFlowDictionary;
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
    </div>
  );
}
