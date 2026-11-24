import { afterEach, describe, expect, it, jest } from "@jest/globals";

import {
  buildMonthCalendarGrid,
  buildStreakActivityMap,
  resolveRecentWeekDayLabels,
  toBusinessCalendarDate,
} from "@/app/profile/_components/streak-calendar-utils";

// Lunes..domingo, como `t.home.weekDays`.
const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"] as const;

// Viernes 20 de noviembre de 2026 a las 21:00 en CDMX = sábado 21 a las 03:00 UTC.
// El SSR de dev y el CI corren en UTC: con el reloj local, el servidor ve sábado y un
// navegador en CDMX ve viernes, y la hidratación falla (front#176).
const FRIDAY_NIGHT_CDMX = new Date("2026-11-21T03:00:00Z");

describe("día de negocio en America/Mexico_City", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("toBusinessCalendarDate devuelve la fecha de CDMX aunque en UTC ya sea otro día", () => {
    const businessDay = toBusinessCalendarDate(FRIDAY_NIGHT_CDMX);
    expect([
      businessDay.getFullYear(),
      businessDay.getMonth(),
      businessDay.getDate(),
    ]).toEqual([2026, 10, 20]);
  });

  it("las etiquetas de la semana terminan en el día de CDMX, sin importar la zona del proceso", () => {
    jest.useFakeTimers().setSystemTime(FRIDAY_NIGHT_CDMX);
    expect(resolveRecentWeekDayLabels(WEEK_DAYS)).toEqual([
      "S",
      "D",
      "L",
      "M",
      "X",
      "J",
      "V",
    ]);
  });

  it("el calendario mensual marca como hoy el día de CDMX", () => {
    jest.useFakeTimers().setSystemTime(FRIDAY_NIGHT_CDMX);
    const grid = buildMonthCalendarGrid({
      year: 2026,
      monthIndex: 10,
      activityMap: buildStreakActivityMap([true, false, true]),
    });

    expect(grid.days.find((day) => day.isToday)?.dateKey).toBe("2026-11-20");
    // El último elemento de la racha cae en ese mismo día.
    expect(grid.days.find((day) => day.dateKey === "2026-11-20")?.status).toBe(
      "completed",
    );
    expect(grid.days.find((day) => day.dateKey === "2026-11-21")?.status).toBe(
      "future",
    );
  });
});
