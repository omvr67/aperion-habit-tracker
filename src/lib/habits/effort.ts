import type { Effort } from "./types";

/**
 * Effort scale. Three sizes, nothing more — quick to pick, easy to reason
 * about, and simple to map onto whatever Aperion ends up storing.
 */
export const EFFORT_POINTS: Record<Effort, number> = {
  small: 1,
  medium: 3,
  large: 6,
};

export const EFFORT_ORDER: Effort[] = ["small", "medium", "large"];

export const EFFORT_LABEL: Record<Effort, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

/**
 * Roughly what a focused ~6 hour working day looks like: two large tasks, or
 * a large plus a couple of mediums and some smalls. The cap exists so a single
 * oversized task cannot manufacture a perfect day.
 */
export const DAILY_CAP = 12;

export function effortPoints(effort: Effort): number {
  return EFFORT_POINTS[effort];
}

/** 0 = empty, 4 = at or above the daily cap. */
export function intensityLevel(effort: number): 0 | 1 | 2 | 3 | 4 {
  if (effort <= 0) return 0;
  const ratio = effort / DAILY_CAP;
  if (ratio >= 1) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}
