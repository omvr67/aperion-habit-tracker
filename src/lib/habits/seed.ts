import { addDays, startOfDay } from "./date";
import type { Effort, Task } from "./types";

const TITLES = [
  "Draft weekly review",
  "Refactor task list rendering",
  "Reply to support thread",
  "Outline Q3 roadmap",
  "Fix sync edge case",
  "Write release notes",
  "Design settings sheet",
  "Clean up backlog",
  "Pair on onboarding flow",
  "Update component docs",
  "Plan sprint scope",
  "Review pull requests",
  "Prototype quick capture",
  "Audit keyboard shortcuts",
  "Tidy project sections",
];

/** Deterministic pseudo-random so the sample year is stable per session. */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * A realistic-looking year of completed work so the heatmap is meaningful on
 * first load. Weekends are quieter, a few stretches are idle.
 */
export function seedTasks(today: Date = new Date()): Task[] {
  const random = makeRandom(20260914);
  const tasks: Task[] = [];
  const end = startOfDay(today);

  for (let offset = 364; offset >= 0; offset -= 1) {
    const day = addDays(end, -offset);
    const weekend = day.getDay() === 0 || day.getDay() === 6;
    const idle = random() < (weekend ? 0.62 : 0.14);
    if (idle) continue;

    const count = weekend ? 1 + Math.floor(random() * 2) : 1 + Math.floor(random() * 3);
    for (let i = 0; i < count; i += 1) {
      const roll = random();
      const effort: Effort = roll < 0.5 ? "small" : roll < 0.85 || weekend ? "medium" : "large";
      const completedAt = new Date(day);
      completedAt.setHours(9 + Math.floor(random() * 9), Math.floor(random() * 60), 0, 0);
      const created = new Date(completedAt.getTime() - 1000 * 60 * 60 * (1 + random() * 20));
      tasks.push({
        id: `seed-${offset}-${i}`,
        title: TITLES[Math.floor(random() * TITLES.length)] ?? "Focused work block",
        effort,
        completed: true,
        completedAt: completedAt.toISOString(),
        createdAt: created.toISOString(),
        updatedAt: completedAt.toISOString(),
      });
    }
  }

  // A couple of open tasks for today so the task area isn't empty.
  const now = new Date();
  tasks.push(
    {
      id: "seed-open-1",
      title: "Sketch heatmap empty state",
      effort: "medium",
      completed: false,
      completedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "seed-open-2",
      title: "Tidy inbox",
      effort: "small",
      completed: false,
      completedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  );

  return tasks;
}
