/**
 * Pure heatmap math — no UI, no storage. Turns progress events into a
 * trailing-12-month activity grid and summary totals. Replaceable without
 * touching the visualization.
 */
import { intensityForPoints, type Intensity } from "@/lib/effort";

export interface DayActivity {
  date: string; // yyyy-mm-dd (local)
  points: number;
  taskCount: number;
}

export interface HeatmapDay {
  date: string;
  points: number;
  taskCount: number;
  level: Intensity;
}

export interface EventRef {
  id: string;
  title: string;
  points: number;
}

/** Aggregate events into per-day totals, keyed by local date. */
export function aggregateByDay(events: (EventRef & { event_date: string })[]): Map<string, DayActivity> {
  const map = new Map<string, DayActivity>();
  for (const e of events) {
    const day = map.get(e.event_date) ?? { date: e.event_date, points: 0, taskCount: 0 };
    day.points += e.points;
    day.taskCount += 1;
    map.set(e.event_date, day);
  }
  return map;
}

/** Trailing 12 months, weeks as columns, Sunday-first, aligned to the grid. */
export function buildYearGrid(
  activity: Map<string, DayActivity>,
  today: Date = new Date(),
): (HeatmapDay | null)[][] {
  const start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() - cursor.getDay()); // back to Sunday

  const endKey = dateKey(today);
  const weeks: (HeatmapDay | null)[][] = [];

  while (dateKey(cursor) <= endKey) {
    const week: (HeatmapDay | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const key = dateKey(cursor);
      if (key > endKey) {
        week.push(null);
      } else {
        const day = activity.get(key);
        week.push(
          day
            ? { date: key, points: day.points, taskCount: day.taskCount, level: intensityForPoints(day.points) }
            : { date: key, points: 0, taskCount: 0, level: 0 },
        );
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export interface HeatmapTotals {
  totalPoints: number;
  activeDays: number;
  totalTasks: number;
  bestDay: DayActivity | null;
}

export function summarise(weeks: (HeatmapDay | null)[][]): HeatmapTotals {
  let totalPoints = 0;
  let activeDays = 0;
  let totalTasks = 0;
  let bestDay: DayActivity | null = null;

  for (const week of weeks) {
    for (const day of week) {
      if (!day) continue;
      totalPoints += day.points;
      totalTasks += day.taskCount;
      if (day.taskCount > 0) activeDays += 1;
      if (!bestDay || day.points > bestDay.points) {
        bestDay = { date: day.date, points: day.points, taskCount: day.taskCount };
      }
    }
  }
  return { totalPoints, activeDays, totalTasks, bestDay };
}

// ---------- date helpers ----------

export function dateKey(d: Date = new Date()): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function formatShortDate(key: string): string {
  return keyToDate(key).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatLongDate(key: string): string {
  return keyToDate(key).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function isToday(key: string): boolean {
  return key === dateKey();
}
