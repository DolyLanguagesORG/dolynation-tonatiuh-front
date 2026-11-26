import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "@jest/globals";

import { StreakCalendarCard } from "@/app/profile/_components/streak-calendar-card";
import {
  buildMonthCalendarGrid,
  buildStreakActivityMap,
  resolveRecentWeekDayLabels,
} from "@/app/profile/_components/streak-calendar-utils";
import { dictionaries } from "@/i18n";

describe("StreakCalendarCard & monthly calendar helpers", () => {
  it("aligns November 2026 starting on Sunday (6 leading empty slots) with 30 real days", () => {
    const referenceDate = new Date(2026, 10, 19); // Jueves 19 nov 2026
    // 60 días de ventana: hoy (nov 19) activo, nov 18 activo, nov 17 inactivo, oct 25 activo
    const streakDays = Array.from({ length: 60 }, (_, idx) => {
      const offsetFromToday = 59 - idx;
      return offsetFromToday === 0 || offsetFromToday === 1 || offsetFromToday === 25;
    });

    const activityMap = buildStreakActivityMap(streakDays, referenceDate);
    const grid = buildMonthCalendarGrid({
      year: 2026,
      monthIndex: 10, // Noviembre
      activityMap,
      referenceDate,
    });

    // 1 nov 2026 es domingo -> lunes=0 .. domingo=6 => 6 espacios vacíos antes del día 1
    expect(grid.leadingEmptyDays).toBe(6);
    expect(grid.days).toHaveLength(30);
    expect(grid.days[0]).toMatchObject({ day: 1, dateKey: "2026-11-01", status: "missed" });
    expect(grid.days[17]).toMatchObject({ day: 18, dateKey: "2026-11-18", status: "completed" });
    expect(grid.days[18]).toMatchObject({
      day: 19,
      dateKey: "2026-11-19",
      isToday: true,
      status: "completed",
    });
    expect(grid.days[19]).toMatchObject({ day: 20, dateKey: "2026-11-20", status: "future" });
    expect(grid.days[29]).toMatchObject({ day: 30, dateKey: "2026-11-30", status: "future" });
    expect(grid.activeCount).toBe(2);
  });

  it("handles leap-year February (29 days) vs non-leap February (28 days)", () => {
    const activityMap = new Map<string, boolean>();
    const ref = new Date(2026, 10, 19);

    const leapFeb = buildMonthCalendarGrid({
      year: 2024,
      monthIndex: 1,
      activityMap,
      referenceDate: ref,
    });
    const normalFeb = buildMonthCalendarGrid({
      year: 2025,
      monthIndex: 1,
      activityMap,
      referenceDate: ref,
    });

    expect(leapFeb.days).toHaveLength(29);
    expect(normalFeb.days).toHaveLength(28);
  });

  it("renders real monthly cells, distinguishes today-pending vs completed vs future, and navigates months", async () => {
    const user = userEvent.setup();
    const referenceDate = new Date(2026, 10, 19); // Jueves 19 nov 2026

    // 60 días: hoy (offset 0) SIN lectura todavía, ayer (offset 1) y anteayer (offset 2) CON lectura,
    // y 25 oct (offset 25) CON lectura.
    const streakDays = Array.from({ length: 60 }, (_, idx) => {
      const offsetFromToday = 59 - idx;
      return offsetFromToday === 1 || offsetFromToday === 2 || offsetFromToday === 25;
    });

    const { container } = render(
      <StreakCalendarCard
        t={dictionaries.es}
        locale="es"
        currentStreak={2}
        streakDays={streakDays}
        referenceDate={referenceDate}
      />,
    );

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("días consecutivos")).toBeInTheDocument();
    expect(screen.getByText("2 días con lectura este mes")).toBeInTheDocument();
    expect(screen.getByText("Objetivo de lectura diaria")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();

    // Día 30 sí existe en noviembre (ya no corta en 28)
    const nov30 = container.querySelector('[data-date="2026-11-30"]');
    expect(nov30).toHaveAttribute("data-status", "future");

    const nov19 = container.querySelector('[data-date="2026-11-19"]');
    expect(nov19).toHaveAttribute("data-status", "today-pending");

    const nov18 = container.querySelector('[data-date="2026-11-18"]');
    expect(nov18).toHaveAttribute("data-status", "completed");

    const nov10 = container.querySelector('[data-date="2026-11-10"]');
    expect(nov10).toHaveAttribute("data-status", "missed");

    const nextBtn = screen.getByRole("button", { name: "Mes siguiente" });
    const prevBtn = screen.getByRole("button", { name: "Mes anterior" });
    expect(nextBtn).toBeDisabled();
    expect(prevBtn).toBeEnabled();

    // Ir a octubre 2026 (31 días)
    await user.click(prevBtn);
    expect(container.querySelector('[data-date="2026-10-31"]')).toBeInTheDocument();
    expect(container.querySelector('[data-date="2026-10-25"]')).toHaveAttribute(
      "data-status",
      "completed",
    );
    expect(screen.getByText("1 día con lectura este mes")).toBeInTheDocument();
    expect(nextBtn).toBeEnabled();

    // Regresar al mes actual con botón Hoy
    await user.click(screen.getByRole("button", { name: "Hoy" }));
    expect(container.querySelector('[data-date="2026-11-19"]')).toBeInTheDocument();
    expect(nextBtn).toBeDisabled();
  });

  it("rotates the 7-day summary weekday labels to end on today", () => {
    const thursday = new Date(2026, 10, 19); // Jueves
    const labels = resolveRecentWeekDayLabels(
      dictionaries.es.home.weekDays,
      thursday,
    );
    expect(labels).toEqual(["V", "S", "D", "L", "M", "X", "J"]);
  });

  it("renders singular day label when currentStreak is 1", () => {
    render(
      <StreakCalendarCard
        t={dictionaries.es}
        locale="es"
        currentStreak={1}
        streakDays={[true]}
        referenceDate={new Date(2026, 10, 19)}
      />,
    );

    expect(screen.getByText("día consecutivo")).toBeInTheDocument();
  });
});
