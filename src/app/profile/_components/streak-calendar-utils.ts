export type StreakDayStatus =
  | "completed"
  | "missed"
  | "today-pending"
  | "future"
  | "outside";

export interface CalendarDayCell {
  day: number;
  dateKey: string;
  isToday: boolean;
  status: StreakDayStatus;
}

export interface MonthCalendarGrid {
  year: number;
  monthIndex: number;
  leadingEmptyDays: number;
  trailingEmptyDays: number;
  days: CalendarDayCell[];
  activeCount: number;
}

export interface YearMonth {
  year: number;
  monthIndex: number;
}

/**
 * Zona horaria del día de negocio. El backend calcula la racha con este mismo día
 * (`TIMEZONE_RESET` en `dolynation-atl-back`).
 */
export const BUSINESS_TIME_ZONE = "America/Mexico_City";

/**
 * Devuelve un `Date` cuyos campos locales (año, mes y día) son la fecha calendario de
 * `instant` en {@link BUSINESS_TIME_ZONE}. Así el servidor (SSR) y el navegador obtienen
 * el mismo día aunque corran en zonas horarias distintas, y la hidratación coincide.
 */
export function toBusinessCalendarDate(
  instant: Date = new Date(),
  timeZone: string = BUSINESS_TIME_ZONE,
): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);
  return new Date(read("year"), read("month") - 1, read("day"));
}

/**
 * Formatea una fecha local a clave `YYYY-MM-DD`.
 */
export function formatCalendarDateKey(
  year: number,
  monthIndex: number,
  day: number,
): string {
  const mm = String(monthIndex + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Normaliza una fecha al inicio del día en calendario local.
 */
export function toLocalDayStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Construye un mapa fecha (`YYYY-MM-DD`) -> actividad completada (`true`/`false`)
 * a partir del arreglo cronológico devuelto por `GET /user/streak`, donde el
 * último elemento corresponde a `referenceDate` (hoy).
 */
export function buildStreakActivityMap(
  streakDays: readonly boolean[],
  referenceDate: Date = toBusinessCalendarDate(),
): Map<string, boolean> {
  const map = new Map<string, boolean>();
  const len = streakDays.length;
  if (len === 0) {
    return map;
  }

  const baseYear = referenceDate.getFullYear();
  const baseMonth = referenceDate.getMonth();
  const baseDay = referenceDate.getDate();

  for (let offset = 0; offset < len; offset++) {
    const dayDate = new Date(baseYear, baseMonth, baseDay - offset);
    const key = formatCalendarDateKey(
      dayDate.getFullYear(),
      dayDate.getMonth(),
      dayDate.getDate(),
    );
    map.set(key, Boolean(streakDays[len - 1 - offset]));
  }

  return map;
}

/**
 * Construye la cuadrícula real de un mes (semana iniciando en lunes) alineando
 * el día 1 con su columna real de la semana y respetando 28/29/30/31 días.
 */
export function buildMonthCalendarGrid(params: {
  year: number;
  monthIndex: number;
  activityMap: ReadonlyMap<string, boolean>;
  referenceDate?: Date;
}): MonthCalendarGrid {
  const { year, monthIndex, activityMap } = params;
  const today = toLocalDayStart(params.referenceDate ?? toBusinessCalendarDate());
  const todayKey = formatCalendarDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const firstDayOfMonth = new Date(year, monthIndex, 1);
  // getDay(): 0=Dom..6=Sáb -> Lunes=0..Domingo=6
  const leadingEmptyDays = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const trailingEmptyDays =
    (7 - ((leadingEmptyDays + daysInMonth) % 7)) % 7;

  const days: CalendarDayCell[] = [];
  let activeCount = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, monthIndex, day);
    const dateKey = formatCalendarDateKey(year, monthIndex, day);
    const isToday = dateKey === todayKey;
    const isFuture = cellDate.getTime() > today.getTime();

    let status: StreakDayStatus;
    if (isFuture) {
      status = "future";
    } else if (activityMap.has(dateKey)) {
      const completed = Boolean(activityMap.get(dateKey));
      if (completed) {
        status = "completed";
        activeCount += 1;
      } else {
        status = isToday ? "today-pending" : "missed";
      }
    } else {
      status = isToday ? "today-pending" : "outside";
    }

    days.push({
      day,
      dateKey,
      isToday,
      status,
    });
  }

  return {
    year,
    monthIndex,
    leadingEmptyDays,
    trailingEmptyDays,
    days,
    activeCount,
  };
}

export function compareYearMonth(a: YearMonth, b: YearMonth): number {
  return (a.year - b.year) * 12 + (a.monthIndex - b.monthIndex);
}

export function shiftYearMonth(ym: YearMonth, deltaMonths: number): YearMonth {
  const shifted = new Date(ym.year, ym.monthIndex + deltaMonths, 1);
  return {
    year: shifted.getFullYear(),
    monthIndex: shifted.getMonth(),
  };
}

/**
 * Ordena las etiquetas de los últimos 7 días reales terminando en `referenceDate`
 * (índice 6 = hoy) usando el arreglo lunes..domingo (`weekDays`). Por defecto, "hoy"
 * es el día de negocio en {@link BUSINESS_TIME_ZONE}, no el del reloj local.
 */
export function resolveRecentWeekDayLabels(
  weekDays: readonly string[],
  referenceDate: Date = toBusinessCalendarDate(),
): string[] {
  if (weekDays.length !== 7) {
    return [...weekDays];
  }

  const baseYear = referenceDate.getFullYear();
  const baseMonth = referenceDate.getMonth();
  const baseDay = referenceDate.getDate();

  return Array.from({ length: 7 }, (_, idx) => {
    const offset = 6 - idx;
    const targetDate = new Date(baseYear, baseMonth, baseDay - offset);
    const mondayFirstIndex = (targetDate.getDay() + 6) % 7;
    return weekDays[mondayFirstIndex] ?? "";
  });
}
