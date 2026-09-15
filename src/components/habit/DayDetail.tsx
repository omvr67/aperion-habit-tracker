import { DAILY_CAP, EFFORT_LABEL, EFFORT_ORDER, effortPoints } from "@/lib/habits/effort";
import { formatLongDate, formatTime } from "@/lib/habits/date";
import type { DayActivity, Effort, Task } from "@/lib/habits/types";

interface Props {
  day: DayActivity;
  tasks: Task[];
  onReopen: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<Task, "title" | "effort">>) => void;
  onDelete: (id: string) => void;
}

export function DayDetail({ day, tasks, onReopen, onUpdate, onDelete }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="text-base font-medium tracking-tight">{formatLongDate(day.date)}</h2>
        <p className="text-sm text-muted-foreground">
          {day.taskCount} task{day.taskCount === 1 ? "" : "s"} completed
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium tabular-nums">
            {day.effort}
            <span className="text-muted-foreground"> / {DAILY_CAP} effort</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {day.capped ? "Daily cap reached" : `${Math.round(day.progress * 100)}% of a full day`}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-heat-0">
          <div
            className="h-full rounded-full bg-heat-4 transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(day.progress * 100, day.effort > 0 ? 4 : 0)}%` }}
          />
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
          Nothing completed on this day.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {tasks.map((task) => (
            <li key={task.id} className="group flex items-center gap-3 py-2.5">
              <button
                type="button"
                onClick={() => onReopen(task.id)}
                aria-label={`Reopen ${task.title}`}
                title="Reopen"
                className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground transition-opacity hover:opacity-70"
              >
                ✓
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {task.completedAt ? formatTime(task.completedAt) : ""}
                </p>
              </div>
              <select
                value={task.effort}
                onChange={(e) => onUpdate(task.id, { effort: e.target.value as Effort })}
                aria-label="Effort"
                className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground outline-none"
              >
                {EFFORT_ORDER.map((e) => (
                  <option key={e} value={e}>
                    {EFFORT_LABEL[e]} · {effortPoints(e)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                aria-label={`Delete ${task.title}`}
                className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
