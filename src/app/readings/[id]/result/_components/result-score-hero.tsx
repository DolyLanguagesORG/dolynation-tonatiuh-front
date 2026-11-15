import { Badge, Card, Eyebrow, StatCard, Text } from "@/components/ui";
import { type ReadingFlowDictionary } from "@/i18n";
import {
  formatReadingDate,
  formatReadingLanguageBadge,
  getDifficultyMeta,
  type ReadingDto,
  type TargetLanguageCode,
} from "@/lib";

export interface ResultScoreHeroProps {
  t: ReadingFlowDictionary;
  displayLanguage: TargetLanguageCode;
  reading: ReadingDto;
  score: number;
  passed: boolean;
  responseWordCount: number;
  responseTargetPct: number;
  matchedTermsCount: number;
  totalTermsCount: number;
  lexicalCoveragePct: number;
}

/**
 * Cabecera de calificación global y tarjetas de desglose de desempeño
 * (`08-resultado-de-evaluacion.png`).
 */
export function ResultScoreHero({
  t,
  displayLanguage,
  reading,
  score,
  passed,
  responseWordCount,
  responseTargetPct,
  matchedTermsCount,
  totalTermsCount,
  lexicalCoveragePct,
}: ResultScoreHeroProps) {
  const diffMeta = getDifficultyMeta(reading.difficulty, displayLanguage);

  return (
    <div className="flex flex-col gap-6">
      <Card padding="lg" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Eyebrow tone="muted">{t.readings.result.globalIndexLabel}</Eyebrow>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-6xl leading-none font-bold tracking-tight text-heading tabular-nums">
                {score}
              </span>
              <span className="font-mono text-xl font-semibold text-muted">
                {t.readings.result.scoreMetricUnit}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Badge variant={passed ? "success" : "warning"}>
              {passed
                ? t.readings.result.passedBadge
                : t.readings.result.reviewBadge}
            </Badge>
            <Text variant="caption" tone="muted" className="font-mono uppercase">
              {t.readings.result.evaluatedOnPrefix}{" "}
              {formatReadingDate(
                reading.updatedAt ?? reading.createdAt,
                displayLanguage,
              )}{" "}
              •{" "}
              {formatReadingLanguageBadge(reading.language, displayLanguage)} •{" "}
              {diffMeta.label}
            </Text>
          </div>
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Eyebrow tone="muted">{t.readings.result.breakdownTitle}</Eyebrow>
          <Badge variant="outline">{t.readings.result.dimensionsCount}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label={t.readings.result.scoreMetricLabel}
            topMeta={`${score}%`}
            progress={score}
            value={score}
            unit={t.readings.result.scoreMetricUnit}
            description={`${t.readings.result.scoreMetricLevelPrefix} ${diffMeta.label}.`}
          />

          <StatCard
            label={t.readings.result.lengthMetricLabel}
            topMeta={`${responseTargetPct}%`}
            progress={responseTargetPct}
            value={responseWordCount}
            unit={t.readings.result.lengthMetricUnit}
            description={t.readings.result.lengthMetricDesc}
          />

          <StatCard
            label={t.readings.result.lexiconMetricLabel}
            topMeta={`${lexicalCoveragePct}%`}
            progress={lexicalCoveragePct}
            value={`${matchedTermsCount}/${Math.max(1, totalTermsCount)}`}
            unit={t.readings.result.lexiconMetricUnit}
            description={t.readings.result.lexiconMetricDesc}
          />
        </div>
      </section>
    </div>
  );
}
