import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Flame,
  Search,
  Settings,
  Star,
  Trash2,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { useCreateProject, useProjects } from "@/lib/data/projects";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const soonItems = [
  { label: "Favorites", icon: Star },
  { label: "Search", icon: Search },
  { label: "Recently Deleted", icon: Trash2 },
  { label: "Settings", icon: Settings },
];

const navClass =
  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground";

function AppLayout() {
  const { session, loading, signOut, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <aside className="glass-panel sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto rounded-none border-y-0 border-l-0 px-3 py-5 sm:flex">
        <p className="px-3 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Aperion
        </p>

        <nav className="mt-5 space-y-0.5">
          <Link to="/tasks" activeProps={{ className: "bg-accent text-foreground" }} className={navClass}>
            <CheckCircle2 className="h-4 w-4" />
            All Tasks
          </Link>
          <Link to="/habits" activeProps={{ className: "bg-accent text-foreground" }} className={navClass}>
            <Flame className="h-4 w-4" />
            Habit Tracker
          </Link>
          {soonItems.map(({ label, icon: Icon }) => (
            <span
              key={label}
              title="Coming in the next stage"
              className="flex cursor-default items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground/45"
            >
              <Icon className="h-4 w-4" />
              {label}
            </span>
          ))}
        </nav>

        <ProjectsSection />

        <div className="mt-auto space-y-2 px-3 pt-4">
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-2 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <nav className="glass-panel flex gap-1 overflow-x-auto rounded-none border-x-0 border-t-0 px-3 py-2 sm:hidden">
        <Link to="/tasks" activeProps={{ className: "bg-accent text-foreground" }} className={navClass}>
          All Tasks
        </Link>
        <Link to="/habits" activeProps={{ className: "bg-accent text-foreground" }} className={navClass}>
          Habit Tracker
        </Link>
      </nav>

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

function ProjectsSection() {
  const { data: projects = [] } = useProjects();
  const create = useCreateProject();
  const [open, setOpen] = useState(true);
  const [name, setName] = useState("");
  const top = projects.filter((p) => !p.parent_project_id);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase"
      >
        Projects
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-0.5">
          {top.map((p) => (
            <div key={p.id}>
              <ProjectLink id={p.id} name={p.name} color={p.color} />
              {projects
                .filter((c) => c.parent_project_id === p.id)
                .map((c) => (
                  <div key={c.id} className="pl-4">
                    <ProjectLink id={c.id} name={c.name} color={c.color} />
                  </div>
                ))}
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              create.mutate(
                { name },
                { onSuccess: () => setName(""), onError: (err) => toast.error(err.message) },
              );
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New project…"
              className="mt-1 w-full rounded-xl bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:bg-accent"
            />
          </form>
        </div>
      )}
    </div>
  );
}

function ProjectLink({ id, name, color }: { id: string; name: string; color: string | null }) {
  return (
    <Link
      to="/projects/$id"
      params={{ id }}
      activeProps={{ className: "bg-accent text-foreground" }}
      className={navClass}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full bg-primary"
        style={color ? { background: color } : undefined}
      />
      <span className="truncate">{name}</span>
    </Link>
  );
}
