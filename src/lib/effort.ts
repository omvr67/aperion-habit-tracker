/**
 * Effort scale and heatmap thresholds — pure, UI-free, storage-free.
 * This module is the single source of truth for how work turns into points.
 */

export type Effort = 1 | 2 | 3 | 4 | 5;

export const EFFORT_OPTIONS: { value: Effort; label: string }[] = [
  { value: 1, label: "Small" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Large" },
  { value: 4, label: "Very Large" },
  { value: 5, label: "Exceptional" },
];

export function effortLabel(effort: number | null | undefined): string {
  return EFFORT_OPTIONS.find((o) => o.value === effort)?.label ?? "No effort";
}

/** Points a task is worth at the moment it is completed. No effort = 0. */
export function pointsForEffort(effort: number | null | undefined): number {
  if (typeof effort !== "number") return 0;
  if (effort < 1 || effort > 5) return 0;
  return Math.round(effort);
}

/** Reference target for a focused day; used for framing, never to clamp totals. */
export const DAILY_TARGET = 12;

export type Intensity = 0 | 1 | 2 | 3 | 4;

/** Visual intensity only — the true total is always stored and displayed. */
export function intensityForPoints(points: number): Intensity {
  if (points <= 0) return 0;
  if (points <= 3) return 1;
  if (points <= 7) return 2;
  if (points <= 11) return 3;
  return 4;
}
