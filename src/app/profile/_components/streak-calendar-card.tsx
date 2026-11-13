"use client";

import {
  Card,
  Eyebrow,
  Heading,
  Icon,
  ProgressBar,
  Text,
} from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";

export interface StreakCalendarCardProps {
  t: Dictionary;
  locale: Locale;
  currentStreak: number;
  streakDays: readonly boolean[];
}

/**
 * Matriz de constancia de 4 semanas (`04-perfil-y-progreso.png`).
 */
export function StreakCalendarCard({
  t,
  locale,
  currentStreak,
  streakDays,
}: StreakCalendarCardProps) {
  const cycleLabel = new Date().toLocaleDateString(
    locale === "es" ? "es-MX" : "en-US",
    { month: "long", year: "numeric" },
  );

  const dailyGoalPct = currentStreak > 0 ? 100 : 0;

  return (
    <Card padding="lg" as="section" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="calendar" size="md" className="text-heading" />
          <Heading as="h2" variant="subsection">
            {t.profile.streakSectionTitle}
          </Heading>
        </div>

        <Eyebrow tone="muted" className="text-[10px]">
          CICLO: {cycleLabel}
        </Eyebrow>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="flex flex-col justify-between gap-6 md:col-span-5">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline gap-2.5">
              <span className="font-serif text-4xl font-semibold text-ink tabular-nums sm:text-5xl">
                {currentStreak}
              </span>
              <Eyebrow as="span" tone="heading">
                {t.home.streakDaysSuffix}
              </Eyebrow>
            </div>

            <Text variant="small" tone="muted">
              {t.profile.streakSubtitle}
            </Text>
          </div>

          <ProgressBar
            value={dailyGoalPct}
            label={t.profile.dailyGoalLabel}
            valueLabel={`${dailyGoalPct}%`}
            size="md"
          />
        </div>

        <div className="flex flex-col gap-3 md:col-span-7 md:border-l md:border-default md:pl-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow tone="muted" className="text-[10px]">
              {t.profile.activityGridTitle}
            </Eyebrow>

            <div className="flex items-center gap-4 text-[11px] font-medium text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-xxs bg-brand"
                />
                {t.profile.legendCompleted}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-2.5 w-2.5 rounded-xxs bg-neutral-secondary-medium"
                />
                {t.profile.legendRest}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {t.home.weekDays.map((day, idx) => (
              <span
                key={`${day}-${idx}`}
                className="font-mono text-[10px] font-bold text-muted"
              >
                {day}
              </span>
            ))}

            {streakDays.map((completed, index) => (
              <div
                key={index}
                className={[
                  "flex min-h-9 items-center justify-center rounded-xxs font-mono text-xs font-bold tabular-nums",
                  completed
                    ? "bg-brand text-white"
                    : "border border-default bg-neutral-secondary-soft text-muted",
                ].join(" ")}
              >
                {String(index + 1).padStart(2, "0")}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
