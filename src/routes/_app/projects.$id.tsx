import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Plus, Star } from "lucide-react";
import { toast } from "sonner";

import { effortLabel } from "@/lib/effort";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useRestoreProject,
  useUpdateProject,
  type Project,
} from "@/lib/data/projects";
import { useCreateTask, useSetTaskCompleted, useTasks, type Task } from "@/lib/data/tasks";

export const Route = createFileRoute("/_app/projects/$id")({
  head: () => ({
    meta: [
      { title: "Project — Aperion" },
      {
        name: "description",
        content: "Focus on one project — its tasks, sub-projects and description.",
      },
      { property: "og:title", content: "Project — Aperion" },
      {
        property: "og:description",
        content: "Focus on one project — its tasks, sub-projects and description.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectView,
});

const COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#14B8A6",
  "#64748B",
];

function ProjectView() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();
  const project = projects.find((p) => p.id === id) ?? null;

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
        <p className="text-sm text-muted-foreground">
          This project doesn't exist or was deleted.{" "}
          <Link to="/tasks" className="underline">
            Back to tasks
          </Link>
        </p>
      </main>
    );
  }

  return <ProjectBody key={project.id} project={project} onDeleted={() => navigate({ to: "/tasks" })} />;
}

function ProjectBody({
  project,
  onDeleted,
}: {
  project: Project;
  onDeleted: () => void;
}) {
  const update = useUpdateProject();
  const remove = useDeleteProject();
  const restore = useRestoreProject();
  const createProject = useCreateProject();
  const { data: tasks = [] } = useTasks("all");
  const { data: projects = [] } = useProjects();
  const createTask = useCreateTask();
  const setCompleted = useSetTaskCompleted();

  const [newTask, setNewTask] = useState("");
  const [newSub, setNewSub] = useState("");

  const children = useMemo(
    () => projects.filter((p) => p.parent_project_id === project.id),
    [projects, project.id],
  );
  const inProject = tasks.filter((t) => t.project_id === project.id);
  const open = inProject.filter((t) => !t.completed);
  const done = inProject.filter((t) => t.completed);
  const isChild = project.parent_project_id != null;
  const parent = projects.find((p) => p.id === project.parent_project_id);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
      <Link
        to="/tasks"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All tasks
      </Link>

      <header className="mt-3 flex items-start gap-3">
        <span
          className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full"
          style={{ backgroundColor: project.color ?? "var(--primary)" }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <input
              key={`name-${project.id}`}
              defaultValue={project.name}
              onBlur={(e) =>
                e.target.value.trim() &&
                e.target.value !== project.name &&
                update.mutate({ id: project.id, patch: { name: e.target.value } })
              }
              className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none"
            />
            <button
              type="button"
              aria-label="Favorite"
              onClick={() =>
                update.mutate({ id: project.id, patch: { is_favorite: !project.is_favorite } })
              }
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <Star
                className={`h-4 w-4 ${project.is_favorite ? "fill-current text-primary" : ""}`}
              />
            </button>
          </div>
          {isChild && parent && (
            <p className="mt-0.5 text-xs text-muted-foreground">Sub-project of {parent.name}</p>
          )}
          <textarea
            key={`desc-${project.id}`}
            defaultValue={project.description ?? ""}
            placeholder="Add a description…"
            onBlur={(e) =>
              e.target.value !== (project.description ?? "") &&
              update.mutate({ id: project.id, patch: { description: e.target.value } })
            }
            rows={2}
            className="mt-2 w-full resize-none bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/60"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Set color ${c}`}
                onClick={() => update.mutate({ id: project.id, patch: { color: c } })}
                className={`h-5 w-5 rounded-full transition ${
                  project.color === c
                    ? "ring-2 ring-foreground/50 ring-offset-2 ring-offset-background"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const projectId = project.id;
            remove.mutate(projectId, {
              onSuccess: () => {
                toast("Project deleted", {
                  description: "Its tasks stay — now without a project.",
                  action: { label: "Undo", onClick: () => restore.mutate(projectId) },
                });
                onDeleted();
              },
              onError: (err) => toast.error(err.message),
            });
          }}
          className="text-xs text-muted-foreground transition hover:text-destructive"
        >
          Delete
        </button>
      </header>

      <div className="glass-panel mt-8 rounded-3xl p-4 sm:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTask.trim()) return;
            createTask.mutate(
              { title: newTask, projectId: project.id },
              { onSuccess: () => setNewTask("") },
            );
          }}
        >
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a task to this project…"
            className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />
        </form>

        <div className="mt-4 space-y-4">
          <TaskRows
            tasks={open}
            emptyLabel="No open tasks in this project yet."
            onToggle={(task) => setCompleted.mutate({ task, completed: true })}
          />
          {done.length > 0 && (
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Completed</p>
              <TaskRows
                tasks={done}
                emptyLabel=""
                onToggle={(task) => setCompleted.mutate({ task, completed: false })}
              />
            </div>
          )}
        </div>
      </div>

      {!isChild && (
        <section className="mt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newSub.trim()) return;
              createProject.mutate(
                { name: newSub, parentId: project.id },
                {
                  onSuccess: () => setNewSub(""),
                  onError: (err) => toast.error(err.message),
                },
              );
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            <input
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              placeholder="New sub-project…"
              className="w-full max-w-xs rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </form>
          {children.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {children.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/projects/$id"
                    params={{ id: c.id }}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm transition hover:bg-accent"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: c.color ?? "var(--primary)" }}
                    />
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

function TaskRows({
  tasks,
  emptyLabel,
  onToggle,
}: {
  tasks: Task[];
  emptyLabel: string;
  onToggle: (task: Task) => void;
}) {
  if (tasks.length === 0 && emptyLabel) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-1">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-accent/60"
        >
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task)}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          <span
            className={`min-w-0 flex-1 truncate text-sm ${
              task.completed ? "text-muted-foreground line-through" : ""
            }`}
          >
            {task.title}
          </span>
          {task.effort != null && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {effortLabel(task.effort)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
