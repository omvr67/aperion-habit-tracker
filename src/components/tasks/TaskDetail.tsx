import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";

import { EFFORT_OPTIONS } from "@/lib/effort";
import { useProjects } from "@/lib/data/projects";
import {
  useLinkMutations,
  useLinks,
  useSubtaskMutations,
  useSubtasks,
  useUpdateTask,
  type Task,
} from "@/lib/data/tasks";

export function TaskDetail({ task, onClose }: { task: Task; onClose: () => void }) {
  const update = useUpdateTask();
  const projects = useProjects();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");

  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes ?? "");
  }, [task.id, task.title, task.notes]);

  const subtasks = useSubtasks(task.id);
  const subtaskOps = useSubtaskMutations(task.id);
  const links = useLinks(task.id);
  const linkOps = useLinkMutations(task.id);
  const [newSubtask, setNewSubtask] = useState("");
  const [newLink, setNewLink] = useState("");

  return (
    <aside className="glass-panel h-full rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== task.title && update.mutate({ id: task.id, patch: { title } })}
          className="w-full bg-transparent text-base font-medium tracking-tight outline-none"
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Favorite"
            onClick={() => update.mutate({ id: task.id, patch: { is_favorite: !task.is_favorite } })}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <Star className={`h-4 w-4 ${task.is_favorite ? "fill-current text-primary" : ""}`} />
          </button>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <section className="mt-5">
        <p className="text-xs text-muted-foreground">Effort</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <EffortChip
            active={task.effort == null}
            label="None"
            onClick={() => update.mutate({ id: task.id, patch: { effort: null } })}
          />
          {EFFORT_OPTIONS.map((o) => (
            <EffortChip
              key={o.value}
              active={task.effort === o.value}
              label={o.label}
              onClick={() => update.mutate({ id: task.id, patch: { effort: o.value } })}
            />
          ))}
        </div>
      </section>

      <section className="mt-5">
        <p className="text-xs text-muted-foreground">Project</p>
        <select
          value={task.project_id ?? ""}
          onChange={(e) =>
            update.mutate({ id: task.id, patch: { project_id: e.target.value || null } })
          }
          className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        >
          <option value="">No project</option>
          {projects.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </section>

      <section className="mt-5">
        <p className="text-xs text-muted-foreground">Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (task.notes ?? "") && update.mutate({ id: task.id, patch: { notes } })}
          rows={4}
          placeholder="Add notes…"
          className="mt-2 w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        />
      </section>

      <section className="mt-5">
        <p className="text-xs text-muted-foreground">Subtasks</p>
        <ul className="mt-2 space-y-1">
          {subtasks.data?.map((s) => (
            <li key={s.id} className="group flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.completed}
                onChange={() => subtaskOps.toggle.mutate(s)}
                className="h-3.5 w-3.5 accent-[var(--primary)]"
              />
              <span className={s.completed ? "text-muted-foreground line-through" : ""}>{s.title}</span>
              <button
                type="button"
                onClick={() => subtaskOps.remove.mutate(s.id)}
                className="ml-auto text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newSubtask.trim()) return;
            subtaskOps.add.mutate(newSubtask, { onSuccess: () => setNewSubtask("") });
          }}
        >
          <input
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Add subtask"
            className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />
        </form>
      </section>

      <section className="mt-5">
        <p className="text-xs text-muted-foreground">Links</p>
        <ul className="mt-2 space-y-1">
          {links.data?.map((l) => (
            <li key={l.id} className="group flex items-center gap-2 text-sm">
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="truncate text-primary hover:underline"
              >
                {l.label ?? l.url}
              </a>
              <button
                type="button"
                onClick={() => linkOps.remove.mutate(l.id)}
                className="ml-auto text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newLink.trim()) return;
            linkOps.add.mutate(newLink, { onSuccess: () => setNewLink("") });
          }}
        >
          <input
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            placeholder="https://…"
            className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          />
        </form>
      </section>
    </aside>
  );
}

function EffortChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs transition ${
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
