import { DAILY_CAP, effortPoints, intensityLevel } from "./effort";
import { addDays, dayKey, startOfDay } from "./date";
import type { DayActivity, Task } from "./types";

/**
 * Pure aggregation layer: completed tasks in, per-day activity out.
 *
 * Knows nothing about storage or React. Historical consistency rules live
 * here by construction — the task list is the single source of truth, so:
 *  - editing a completed task's effort updates that day's total
 *  - reopening a task removes its effort from history
 *  - deleting a completed task removes its effort from history
 *  - changing completedAt moves the effort to the new day
 * The cap is applied at read time only; raw totals are never truncated.
 */
export function aggregateByDay(tasks: Task[]): Map<string, DayActivity> {
  const map = new Map<string, DayActivity>();

  for (const task of tasks) {
    if (!task.completed || !task.completedAt) continue;
    const key = dayKey(new Date(task.completedAt));
    const current = map.get(key);
    const effort = (current?.effort ?? 0) + effortPoints(task.effort);
    const taskCount = (current?.taskCount ?? 0) + 1;
    map.set(key, buildActivity(key, effort, taskCount));
  }

  return map;
}

export function buildActivity(date: string, effort: number, taskCount: number): DayActivity {
  return {
    date,
    effort,
    taskCount,
    progress: Math.min(effort / DAILY_CAP, 1),
    capped: effort >= DAILY_CAP,
    level: intensityLevel(effort),
  };
}

export function emptyActivity(date: string): DayActivity {
  return buildActivity(date, 0, 0);
}

export function tasksCompletedOn(tasks: Task[], date: string): Task[] {
  return tasks
    .filter((t) => t.completed && t.completedAt && dayKey(new Date(t.completedAt)) === date)
    .sort((a, b) => (a.completedAt! < b.completedAt! ? 1 : -1));
}

/**
 * Builds the calendar grid for the trailing 12 months, aligned to whole weeks
 * (Sunday-first columns) and ending on today.
 */
export function buildYearGrid(
  activity: Map<string, DayActivity>,
  today: Date = new Date(),
): DayActivity[][] {
  const end = startOfDay(today);
  const start = startOfDay(addDays(end, -364));
  const gridStart = addDays(start, -start.getDay());

  const weeks: DayActivity[][] = [];
  let cursor = gridStart;

  while (cursor <= end) {
    const week: DayActivity[] = [];
    for (let i = 0; i < 7; i += 1) {
      const day = addDays(cursor, i);
      if (day < start || day > end) continue;
      const key = dayKey(day);
      week.push(activity.get(key) ?? emptyActivity(key));
    }
    if (week.length) weeks.push(week);
    cursor = addDays(cursor, 7);
  }

  return weeks;
}

export interface Totals {
  activeDays: number;
  cappedDays: number;
  totalEffort: number;
  totalTasks: number;
  currentStreak: number;
  longestStreak: number;
}

export function summarise(activity: Map<string, DayActivity>, today: Date = new Date()): Totals {
  let activeDays = 0;
  let cappedDays = 0;
  let totalEffort = 0;
  let totalTasks = 0;

  for (const day of activity.values()) {
    if (day.effort > 0) activeDays += 1;
    if (day.capped) cappedDays += 1;
    totalEffort += day.effort;
    totalTasks += day.taskCount;
  }

  // Streaks over the trailing year window.
  let currentStreak = 0;
  let longestStreak = 0;
  let running = 0;
  const end = startOfDay(today);
  for (let i = 364; i >= 0; i -= 1) {
    const key = dayKey(addDays(end, -i));
    const day = activity.get(key);
    if (day && day.effort > 0) {
      running += 1;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
    }
  }
  // Today not yet worked doesn't break a streak that ran through yesterday.
  const todayKey = dayKey(end);
  const startOffset = (activity.get(todayKey)?.effort ?? 0) > 0 ? 0 : 1;
  for (let i = startOffset; i < 365; i += 1) {
    const day = activity.get(dayKey(addDays(end, -i)));
    if (day && day.effort > 0) currentStreak += 1;
    else break;
  }

  return { activeDays, cappedDays, totalEffort, totalTasks, currentStreak, longestStreak };
}
