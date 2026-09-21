import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  CheckCircle2,
  Flame,
  Search,
  Settings,
  Star,
  Trash2,
  LogOut,
} from "lucide-react";

import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const soonItems = [
  { label: "Favorites", icon: Star },
  { label: "Habit Tracker", icon: Flame },
  { label: "Search", icon: Search },
  { label: "Recently Deleted", icon: Trash2 },
  { label: "Settings", icon: Settings },
];

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
    <div className="flex min-h-screen">
      <aside className="glass-panel sticky top-0 hidden h-screen w-60 shrink-0 flex-col rounded-none border-y-0 border-l-0 px-3 py-5 sm:flex">
        <p className="px-3 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Aperion
        </p>

        <nav className="mt-5 space-y-0.5">
          <Link
            to="/tasks"
            activeProps={{ className: "bg-accent text-foreground" }}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <CheckCircle2 className="h-4 w-4" />
            All Tasks
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

        <div className="mt-auto space-y-2 px-3">
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

      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
