import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { TaskDetail } from "@/components/tasks/TaskDetail";
import { effortLabel } from "@/lib/effort";
import {
  useCreateTask,
  useDeleteTask,
  useSetTaskCompleted,
  useTasks,
  type Task,
} from "@/lib/data/tasks";
import { useProjects, type Project } from "@/lib/data/projects";

export const Route = createFileRoute("/_app/tasks")({
  head: () => ({
    meta: [
      { title: "All Tasks — Aperion" },
      {
        name: "description",
        content: "Capture, complete and organise your work in Aperion — effort-weighted tasks that feed your progress history.",
      },
      { property: "og:title", content: "All Tasks — Aperion" },
      {
        property: "og:description",
        content: "Capture, complete and organise your work in Aperion — effort-weighted tasks that feed your progress history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AllTasks,
});

function AllTasks() {
  const { data: tasks = [], isLoading } = useTasks("all");
  const create = useCreateTask();
  const setCompleted = useSetTaskCompleted();
  const remove = useDeleteTask();
  const [title, setTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const open = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const done = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">All Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {open.length} open · {done.length} completed
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="glass-panel rounded-3xl p-4 sm:p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              create.mutate(
                { title },
                {
                  onSuccess: () => setTitle(""),
                  onError: (err) => toast.error(err.message),
                },
              );
            }}
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a task…"
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </form>

          {isLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
          ) : tasks.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Nothing here yet — add your first task above.
            </p>
          ) : (
            <div className="mt-4 space-y-5">
              <TaskList
                tasks={open}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onToggle={(task) => setCompleted.mutate({ task, completed: true })}
                onDelete={(id) => {
                  remove.mutate({ id });
                  toast("Task deleted", {
                    action: { label: "Undo", onClick: () => remove.mutate({ id, restore: true }) },
                  });
                  if (selectedId === id) setSelectedId(null);
                }}
              />
              {done.length > 0 && (
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">Completed</p>
                  <TaskList
                    tasks={done}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onToggle={(task) => setCompleted.mutate({ task, completed: false })}
                    onDelete={(id) => {
                      remove.mutate({ id });
                      toast("Task deleted", {
                        action: { label: "Undo", onClick: () => remove.mutate({ id, restore: true }) },
                      });
                      if (selectedId === id) setSelectedId(null);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {selected ? (
          <TaskDetail task={selected} onClose={() => setSelectedId(null)} />
        ) : (
          <div className="glass-panel hidden rounded-3xl p-5 text-sm text-muted-foreground lg:block">
            Select a task to see its notes, subtasks, links and effort.
          </div>
        )}
      </div>
    </main>
  );
}

function TaskList({
  tasks,
  selectedId,
  onSelect,
  onToggle,
  onDelete,
}: {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const { data: projects = [] } = useProjects();
  const byId = new Map<string, Project>(projects.map((p) => [p.id, p]));
  return (
    <ul className="space-y-1">
      {tasks.map((task) => (
        <li
          key={task.id}
          onClick={() => onSelect(task.id)}
          className={`group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition ${
            selectedId === task.id ? "bg-accent" : "hover:bg-accent/60"
          }`}
        >
          <input
            type="checkbox"
            checked={task.completed}
            onClick={(e) => e.stopPropagation()}
            onChange={() => onToggle(task)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          <span className={`min-w-0 flex-1 truncate text-sm ${task.completed ? "text-muted-foreground line-through" : ""}`}>
            {task.title}
          </span>
          {task.project_id && byId.get(task.project_id) && (
            <span className="flex max-w-[9rem] items-center gap-1.5 truncate text-[11px] text-muted-foreground">
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" style={byId.get(task.project_id)!.color ? { background: byId.get(task.project_id)!.color! } : undefined} />
              <span className="truncate">{byId.get(task.project_id)!.name}</span>
            </span>
          )}
          {task.effort != null && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {effortLabel(task.effort)}
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
