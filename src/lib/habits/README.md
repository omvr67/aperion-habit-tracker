# Habit tracker core

Pure, UI-free layers so the visualisation can later consume Aperion's real tasks.

```
tasks (storage or Aperion)
  -> aggregateByDay()      per-day effort + task count
  -> buildActivity()       progress vs DAILY_CAP, intensity level
  -> buildYearGrid()       trailing 12 months of DayActivity
  -> <Heatmap />
```

- `types.ts` — `Task` (id, title, effort, completed, completedAt, createdAt, updatedAt).
- `effort.ts` — effort scale (small 1, medium 3, large 6) and `DAILY_CAP = 12`.
- `aggregate.ts` — pure aggregation; takes a task array, returns day activity.
- `storage.ts` — the only place that knows about localStorage, behind `TaskStore`.
- `seed.ts` — sample year of completions for first load.

Components read data exclusively through `useTasks`, never from storage.

## History rules

The task list is the single source of truth; there is no separate frozen
completion log. Consequences, all intentional:

| Event | Behaviour |
| --- | --- |
| Completed task's effort is edited | That day's total changes to match |
| Completed task is reopened | Its effort leaves that day |
| Completed task is deleted | Its effort leaves that day |
| `completedAt` changes | Effort moves to the new day |
| Task completed while a past day is selected | Stamped to that day at 12:00 local |

The daily cap is applied at read time in `buildActivity` — raw totals are
stored uncapped, so changing the cap later re-renders history correctly.

## Integration note

Replacing the prototype source means supplying Aperion's completed tasks in
the `Task` shape (or mapping onto it) and swapping the store in `useTasks`.
Nothing in `aggregate.ts` or the components needs to change.
