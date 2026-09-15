import { useState, type FormEvent } from "react";

import { EFFORT_LABEL, EFFORT_ORDER, effortPoints } from "@/lib/habits/effort";
import { formatShortDate, keyToDate } from "@/lib/habits/date";
import type { Effort, Task } from "@/lib/habits/types";

interface Props {
  openTasks: Task[];
  selectedDate: string;
  isToday: boolean;
  onAdd: (title: string, effort: Effort) => void;
  onUpdate: (id: string, patch: Partial<Pick<Task, "title" | "effort">>) => void;
  onToggle: (id: string, completedAt?: string) => void;
  onDelete: (id: string) => void;
}

/** Completing while a past day is selected stamps that day at midday local time. */
function completionStampFor(dateKey: string, isToday: boolean) {
  if (isToday) return undefined;
  const d = keyToDate(dateKey);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

export function TaskArea({
  openTasks,
  selectedDate,
  isToday,
  onAdd,
  onUpdate,
  onToggle,
  onDelete,
}: Props) {
  const [title, setTitle] = useState("");
  const [effort, setEffort] = useState<Effort>("medium");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title, effort);
    setTitle("");
  }

  function commitEdit(task: Task) {
    if (draftTitle.trim() && draftTitle.trim() !== task.title) {
      onUpdate(task.id, { title: draftTitle.trim() });
    }
    setEditingId(null);
  }

  const stamp = completionStampFor(selectedDate, isToday);

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="h-10 flex-1 rounded-xl border border-border bg-card/70 px-3.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/40 focus:ring-2 focus:ring-ring"
        />
        <div className="flex items-center gap-2">
          <div className="flex h-10 items-center rounded-xl border border-border bg-card/70 p-1">
            {EFFORT_ORDER.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEffort(e)}
                className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors ${
                  effort === e
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {EFFORT_LABEL[e]}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="h-10 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            disabled={!title.trim()}
          >
            Add
          </button>
        </div>
      </form>

      <div className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Open
          {!isToday && (
            <span className="ml-2 normal-case">
              — completing logs to {formatShortDate(selectedDate)}
            </span>
          )}
        </p>
        {openTasks.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Nothing open. Add a task above.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {openTasks.map((task) => (
              <li key={task.id} className="group flex items-center gap-3 py-2.5">
                <button
                  type="button"
                  onClick={() => onToggle(task.id, stamp)}
                  aria-label={`Complete ${task.title}`}
                  className="size-[18px] shrink-0 rounded-full border border-border transition-colors hover:border-primary hover:bg-primary/10"
                />
                {editingId === task.id ? (
                  <input
                    autoFocus
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onBlur={() => commitEdit(task)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(task);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 rounded-lg border border-border bg-card px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(task.id);
                      setDraftTitle(task.title);
                    }}
                    title="Rename"
                    className="flex-1 truncate text-left text-sm"
                  >
                    {task.title}
                  </button>
                )}
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
    </div>
  );
}
