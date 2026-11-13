import { Badge, Card, Eyebrow, StatCard, Text } from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";
import {
  formatReadingDate,
  formatReadingLanguageBadge,
  getDifficultyMeta,
  type ReadingDto,
} from "@/lib";

export interface ResultScoreHeroProps {
  t: Dictionary;
  locale: Locale;
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
  locale,
  reading,
  score,
  passed,
  responseWordCount,
  responseTargetPct,
  matchedTermsCount,
  totalTermsCount,
  lexicalCoveragePct,
}: ResultScoreHeroProps) {
  const diffMeta = getDifficultyMeta(reading.difficulty, locale);

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
                / 100
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
              {formatReadingDate(
                reading.updatedAt ?? reading.createdAt,
                locale,
              )}{" "}
              • {formatReadingLanguageBadge(reading.language, locale)} •{" "}
              {diffMeta.cefrBadge}
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
            label={
              locale === "es" ? "CALIFICACIÓN IA" : "AI COMPREHENSION SCORE"
            }
            topMeta={`${score}%`}
            progress={score}
            value={score}
            unit="/ 100"
            description={
              locale === "es"
                ? `Nivel evaluado: ${diffMeta.label} (${diffMeta.cefrBadge}).`
                : `Evaluated level: ${diffMeta.label} (${diffMeta.cefrBadge}).`
            }
          />

          <StatCard
            label={locale === "es" ? "EXTENSIÓN DE SÍNTESIS" : "SUMMARY LENGTH"}
            topMeta={`${responseTargetPct}%`}
            progress={responseTargetPct}
            value={responseWordCount}
            unit={locale === "es" ? "palabras" : "words"}
            description={
              locale === "es"
                ? "Objetivo de referencia académica: 100 palabras."
                : "Academic reference target: 100 words."
            }
          />

          <StatCard
            label={
              locale === "es" ? "LÉXICO REUTILIZADO" : "CONTEXTUAL LEXICON"
            }
            topMeta={`${lexicalCoveragePct}%`}
            progress={lexicalCoveragePct}
            value={`${matchedTermsCount}/${Math.max(1, totalTermsCount)}`}
            unit={locale === "es" ? "términos" : "terms"}
            description={
              locale === "es"
                ? "Coincidencia de vocabulario clave en tu resumen."
                : "Key reading vocabulary integrated into your summary."
            }
          />
        </div>
      </section>
    </div>
  );
}
