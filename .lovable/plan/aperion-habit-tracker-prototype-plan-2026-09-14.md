# Aperion Habit Tracker — Prototype Plan

A calm, single-page productivity tracker where the yearly heatmap is driven by effort from completed tasks — not manual habit check-offs. Everything is stored in the browser, no accounts, no backend.

## The effort system

Three sizes, nothing more:

- Small — 1 point
- Medium — 3 points
- Large — 6 points

Daily cap: **12 points**, roughly a strong 6-hour focused day (e.g. two large tasks, or a large + two mediums + a few smalls). A single task can never fill the day past the cap, so one huge task can't fake a perfect square.

## Heatmap

- Last 12 months, one square per day, weeks as columns.
- Five intensity steps: empty, then ratio of day's effort to the cap at roughly under 25%, under 50%, under 100%, and at/over the cap (which gets a slightly brighter, "capped" look).
- Hover shows date, total effort, task count, and whether the cap was reached. Clicking selects the day.
- On narrow screens the grid scrolls sideways rather than shrinking, with month labels staying aligned.

## Day detail

Selecting a square reveals the date, total effort, a slim progress bar toward the cap, the number of completed tasks, and the list of those tasks with their effort size. Today is selected by default.

## Tasks

Create, edit, delete, complete, and reopen. Each task has a title and an effort size. Completing stamps the completion time; reopening clears it. For testing history, completion date is adjustable so you can backfill past days.

### History rules (documented in the code too)

- Changing effort on a completed task updates that day's total — the task is the single source of truth, no frozen snapshots. Keeps the model simple and matches how Aperion will feed real tasks in.
- Reopening a task removes its effort from the day it was completed on.
- Deleting a completed task removes its effort from history.
- Moving a completion date moves the effort with it.
- The cap is applied at display time during aggregation, never stored, so raw history stays intact.

## Look and feel

An original interface in Aperion's spirit: light, airy surfaces with restrained translucency and a fine border, generous spacing, one restrained accent color used for the heatmap ramp and progress, quiet hover and selection transitions. No neon, no big gradients, no gamification, no extra charts or widgets. Dashboard reads as one continuous surface: header with overall progress summary, heatmap, day detail, task area.

## Technical notes

- TanStack Start + React + TypeScript + Tailwind, single route at `/`.
- Layers kept separate so Aperion can swap the source later:
  - `types` — Task shape: id, title, effort, completed, completedAt, createdAt, updatedAt.
  - `effort.ts` — effort scale, cap, intensity levels. Pure.
  - `aggregate.ts` — completed tasks to a map of day totals, task counts, capped ratio. Pure, takes tasks as an argument, knows nothing of storage.
  - `storage.ts` — localStorage read/write behind a small interface.
  - `useTasks` — the only hook components use; components never touch localStorage directly.
  - Components: heatmap grid, day detail, task list, task editor, progress header.
- No Supabase, no auth, no external data.
- Seeded with a realistic year of sample completions on first load so the heatmap is immediately meaningful; clearable.
