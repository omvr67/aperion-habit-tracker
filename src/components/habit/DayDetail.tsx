import { DAILY_TARGET, effortLabel } from "@/lib/effort";
import { formatLongDate, isToday, type EventRef } from "@/lib/heatmap";

interface Props {
  date: string;
  points: number;
  taskCount: number;
  events: (EventRef & { effort?: number | null })[];
}

export function DayDetail({ date, points, taskCount, events }: Props) {
  const pct = Math.min(100, Math.round((points / DAILY_TARGET) * 100));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium tracking-tight">
          {formatLongDate(date)}
          {isToday(date) && (
            <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
              Today
            </span>
          )}
        </h3>
      </div>

      <p className="mt-3 text-3xl font-semibold tracking-tight">
        {points}
        <span className="ml-1 text-sm font-normal text-muted-foreground">pts</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        of the ~{DAILY_TARGET} pt reference for a focused day
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-accent">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {taskCount} task{taskCount === 1 ? "" : "s"} completed
      </p>

      {events.length > 0 && (
        <ul className="mt-3 space-y-1">
          {events.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-2 rounded-xl bg-accent/50 px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">{e.title}</span>
              {"effort" in e && e.effort != null && (
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  {effortLabel(e.effort)}
                </span>
              )}
              <span className="text-xs text-muted-foreground">+{e.points}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
