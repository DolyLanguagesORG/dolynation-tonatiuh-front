"use client";

import { ActionLink, Card, Eyebrow, Icon, Text } from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";
import { type HistorySummary } from "@/lib";

export interface StreakSummaryCardProps {
  t: Dictionary;
  locale: Locale;
  streakDaysCount: number;
  weeklyActiveDays: readonly boolean[];
  historySummary: HistorySummary | null;
  isAuthenticated: boolean;
}

/**
 * Tarjeta editorial de racha semanal, retención sintáctica y vocabulario acumulado (`01-inicio.png`).
 */
export function StreakSummaryCard({
  t,
  locale,
  streakDaysCount,
  weeklyActiveDays,
  historySummary,
  isAuthenticated,
}: StreakSummaryCardProps) {
  const averageLabel =
    isAuthenticated && historySummary?.readings.averageScore != null
      ? locale === "es"
        ? `PRECISIÓN PROMEDIO: ${Math.round(historySummary.readings.averageScore)}%`
        : `AVERAGE ACCURACY: ${Math.round(historySummary.readings.averageScore)}%`
      : t.home.syntacticRetention;

  const vocabLabel =
    isAuthenticated && typeof historySummary?.wordsLookedUp === "number"
      ? locale === "es"
        ? `TÉRMINOS CONSULTADOS: ${historySummary.wordsLookedUp} PALABRAS`
        : `LOOKED-UP VOCABULARY: ${historySummary.wordsLookedUp} WORDS`
      : t.home.acquiredVocabulary;

  return (
    <Card variant="subtle" padding="lg" as="section">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-ink">
            <Icon name="flame" size="sm" />
            <Eyebrow as="span" tone="heading" className="tracking-wider">
              {t.home.streakTitle}
            </Eyebrow>
          </div>

          <div className="flex items-baseline gap-2.5">
            <span className="font-serif text-4xl font-semibold text-ink tabular-nums sm:text-5xl">
              {streakDaysCount}
            </span>
            <span className="font-serif text-lg text-ink sm:text-xl">
              {t.home.streakDaysSuffix}
            </span>
          </div>

          <Text variant="small" tone="muted" className="max-w-md">
            {t.home.streakDailyGoal}
          </Text>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <Eyebrow tone="muted" className="text-[10px]">
              {t.home.weeklyLogTitle}
            </Eyebrow>
            {isAuthenticated && (
              <ActionLink
                href="/profile"
                variant="ghost"
                size="xs"
                className="h-auto min-h-0 px-0 py-0 text-[10px] hover:bg-transparent hover:underline"
              >
                {t.nav.profileAndProgress}
              </ActionLink>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {t.home.weekDays.map((day, idx) => {
              const completed = weeklyActiveDays[idx] ?? false;
              return (
                <div
                  key={`${day}-${idx}`}
                  className="flex flex-col items-center gap-1 rounded-xs border border-border bg-surface px-2 py-1.5"
                >
                  <span
                    className={`text-[10px] font-bold ${
                      idx === 6 ? "text-ink" : "text-muted"
                    }`}
                  >
                    {day}
                  </span>
                  <span
                    aria-hidden="true"
                    className={[
                      "inline-flex h-4 w-4 items-center justify-center rounded-[2px] border",
                      completed
                        ? "border-brand bg-brand text-white"
                        : "border-default-medium bg-neutral-secondary-soft text-transparent",
                    ].join(" ")}
                  >
                    <Icon name="check" size="xs" strokeWidth={2.5} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-3.5 text-[11px] font-bold tracking-wider text-muted uppercase">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <span>{averageLabel}</span>
          <span>{vocabLabel}</span>
        </div>

        <svg
          aria-hidden="true"
          className="h-5 w-24 text-ink"
          viewBox="0 0 96 20"
          fill="none"
        >
          <path
            d="M2 16L18 14L34 15L50 9L66 11L82 5L94 3"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Card>
  );
}
