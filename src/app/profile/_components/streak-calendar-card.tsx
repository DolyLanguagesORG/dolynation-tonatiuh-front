"use client";

import { useMemo, useState } from "react";

import {
  buildMonthCalendarGrid,
  buildStreakActivityMap,
  compareYearMonth,
  formatCalendarDateKey,
  shiftYearMonth,
  toBusinessCalendarDate,
  type StreakDayStatus,
  type YearMonth,
} from "@/app/profile/_components/streak-calendar-utils";
import {
  Button,
  Card,
  Eyebrow,
  Heading,
  Icon,
  IconButton,
  ProgressBar,
  Text,
} from "@/components/ui";
import { type Dictionary, formatMessage, type Locale } from "@/i18n";
import { getDateLocale } from "@/lib";

export interface StreakCalendarCardProps {
  t: Dictionary;
  locale: Locale;
  currentStreak: number;
  streakDays: readonly boolean[];
  /** Fecha de referencia opcional para pruebas deterministas (por defecto hoy). */
  referenceDate?: Date;
}

const DAY_STATUS_CLASS: Record<StreakDayStatus, string> = {
  completed: "border border-brand bg-brand text-white",
  "today-pending": "border-2 border-brand bg-surface text-heading",
  missed: "border border-default bg-neutral-secondary-soft text-muted",
  future:
    "border border-dashed border-default/60 bg-transparent text-muted/45",
  outside:
    "border border-dashed border-default/60 bg-transparent text-muted/45",
};

/**
 * Calendario mensual real de racha y constancia (`04-perfil-y-progreso.png`).
 * Respeta el día de la semana de inicio de cada mes y la cantidad exacta de días,
 * diferenciando días con lectura, días pasados sin lectura, hoy y días futuros.
 */
export function StreakCalendarCard({
  t,
  locale,
  currentStreak,
  streakDays,
  referenceDate,
}: StreakCalendarCardProps) {
  const today = useMemo(
    () => referenceDate ?? toBusinessCalendarDate(),
    [referenceDate],
  );
  const currentYearMonth = useMemo<YearMonth>(
    () => ({
      year: today.getFullYear(),
      monthIndex: today.getMonth(),
    }),
    [today],
  );

  const [displayedMonth, setDisplayedMonth] =
    useState<YearMonth>(currentYearMonth);

  const minYearMonth = useMemo<YearMonth>(() => {
    if (streakDays.length === 0) {
      return currentYearMonth;
    }
    const earliestDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - Math.max(0, streakDays.length - 1),
    );
    return {
      year: earliestDate.getFullYear(),
      monthIndex: earliestDate.getMonth(),
    };
  }, [currentYearMonth, streakDays.length, today]);

  const activityMap = useMemo(
    () => buildStreakActivityMap(streakDays, today),
    [streakDays, today],
  );

  const monthGrid = useMemo(
    () =>
      buildMonthCalendarGrid({
        year: displayedMonth.year,
        monthIndex: displayedMonth.monthIndex,
        activityMap,
        referenceDate: today,
      }),
    [activityMap, displayedMonth.monthIndex, displayedMonth.year, today],
  );

  const dateLocale = getDateLocale(locale);
  const cycleLabel = new Date(
    displayedMonth.year,
    displayedMonth.monthIndex,
    1,
  ).toLocaleDateString(dateLocale, {
    month: "long",
    year: "numeric",
  });

  const canGoPrev = compareYearMonth(displayedMonth, minYearMonth) > 0;
  const canGoNext = compareYearMonth(displayedMonth, currentYearMonth) < 0;

  const todayKey = formatCalendarDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const todayCompleted =
    activityMap.get(todayKey) ?? (streakDays.length === 0 && currentStreak > 0);
  const dailyGoalPct = todayCompleted ? 100 : 0;

  const activeSummaryLabel = formatMessage(
    monthGrid.activeCount === 1
      ? t.profile.monthActiveDaySingular
      : t.profile.monthActiveDaysSummary,
    { count: monthGrid.activeCount },
  );

  const resolveStatusText = (status: StreakDayStatus): string => {
    switch (status) {
      case "completed":
        return t.profile.legendCompleted;
      case "today-pending":
        return t.profile.legendToday;
      case "future":
      case "outside":
        return t.profile.legendUpcoming;
      case "missed":
      default:
        return t.profile.legendRest;
    }
  };

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
          {t.profile.cyclePrefix} {cycleLabel}
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

            <Text variant="caption" tone="muted" className="font-mono">
              {activeSummaryLabel}
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
            <div className="flex items-center gap-2">
              <Eyebrow tone="muted" className="text-[10px]">
                {t.profile.activityGridTitle}
              </Eyebrow>
              <span className="font-mono text-xs font-semibold capitalize text-heading">
                {cycleLabel}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {canGoNext && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setDisplayedMonth(currentYearMonth)}
                  className="mr-1 normal-case tracking-normal"
                >
                  {t.profile.currentMonthButton}
                </Button>
              )}
              <IconButton
                icon="chevron-left"
                size="xs"
                variant="secondary"
                disabled={!canGoPrev}
                aria-label={t.profile.prevMonthAria}
                onClick={() =>
                  setDisplayedMonth((prev) => shiftYearMonth(prev, -1))
                }
              />
              <IconButton
                icon="chevron-right"
                size="xs"
                variant="secondary"
                disabled={!canGoNext}
                aria-label={t.profile.nextMonthAria}
                onClick={() =>
                  setDisplayedMonth((prev) => shiftYearMonth(prev, 1))
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-muted">
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
                className="inline-block h-2.5 w-2.5 rounded-xxs border border-default bg-neutral-secondary-soft"
              />
              {t.profile.legendRest}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-xxs border-2 border-brand bg-surface"
              />
              {t.profile.legendToday}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-xxs border border-dashed border-default"
              />
              {t.profile.legendUpcoming}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center sm:gap-2">
            {t.home.weekDays.map((day, idx) => (
              <span
                key={`${day}-${idx}`}
                className="font-mono text-[10px] font-bold text-muted"
              >
                {day}
              </span>
            ))}

            {Array.from({ length: monthGrid.leadingEmptyDays }).map((_, idx) => (
              <div
                key={`lead-${idx}`}
                aria-hidden="true"
                className="min-h-9"
              />
            ))}

            {monthGrid.days.map((cell) => {
              const formattedDate = new Date(
                displayedMonth.year,
                displayedMonth.monthIndex,
                cell.day,
              ).toLocaleDateString(dateLocale, {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const statusText = resolveStatusText(cell.status);
              const cellLabel = `${formattedDate} — ${statusText}`;
              const todayRing =
                cell.isToday && cell.status === "completed"
                  ? "ring-2 ring-brand/35 ring-offset-1"
                  : "";

              return (
                <div
                  key={cell.dateKey}
                  data-date={cell.dateKey}
                  data-status={cell.status}
                  aria-label={cellLabel}
                  title={cellLabel}
                  aria-current={cell.isToday ? "date" : undefined}
                  className={`flex min-h-9 items-center justify-center rounded-xxs font-mono text-xs font-bold tabular-nums transition-colors ${DAY_STATUS_CLASS[cell.status]} ${todayRing}`}
                >
                  {String(cell.day).padStart(2, "0")}
                </div>
              );
            })}

            {Array.from({ length: monthGrid.trailingEmptyDays }).map((_, idx) => (
              <div
                key={`trail-${idx}`}
                aria-hidden="true"
                className="min-h-9"
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
