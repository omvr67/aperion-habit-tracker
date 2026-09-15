/**
 * Core task model for the Aperion Habit Tracker prototype.
 *
 * Deliberately minimal so it can be mapped onto Aperion's real task model
 * later. The tracker only ever needs: what the task is, how much effort it
 * represents, and when it was completed.
 */

export type Effort = "small" | "medium" | "large";

export interface Task {
  id: string;
  title: string;
  effort: Effort;
  completed: boolean;
  /** ISO timestamp of completion, or null while the task is open. */
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Aggregated activity for a single calendar day. */
export interface DayActivity {
  /** Local calendar day key, "YYYY-MM-DD". */
  date: string;
  /** Raw sum of effort points completed that day (uncapped). */
  effort: number;
  /** Number of tasks completed that day. */
  taskCount: number;
  /** effort / dailyCap, clamped to 1. */
  progress: number;
  /** True when raw effort met or exceeded the daily cap. */
  capped: boolean;
  /** Intensity bucket 0-4 used by the heatmap. */
  level: 0 | 1 | 2 | 3 | 4;
}

/**
 * The only surface the visualisation needs from a task source. Aperion can
 * later provide its own implementation of this shape without touching the
 * heatmap or aggregation code.
 */
export interface TaskSource {
  tasks: Task[];
}
