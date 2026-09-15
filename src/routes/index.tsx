import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Heatmap, HeatmapLegend } from "@/components/habit/Heatmap";
import { DayDetail } from "@/components/habit/DayDetail";
import { TaskArea } from "@/components/habit/TaskArea";
import { useTasks } from "@/hooks/useTasks";
import { emptyActivity } from "@/lib/habits/aggregate";
import { dayKey } from "@/lib/habits/date";
import { DAILY_CAP } from "@/lib/habits/effort";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aperion Habit Tracker — Effort from completed tasks" },
      {
        name: "description",
        content:
          "A calm yearly heatmap of real productivity: effort earned from completed tasks, capped to a realistic focused day.",
      },
      { property: "og:title", content: "Aperion Habit Tracker" },
      {
        property: "og:description",
        content:
          "A calm yearly heatmap of real productivity: effort earned from completed tasks, capped to a realistic focused day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const {
    ready,
    openTasks,
    activity,
    weeks,
    totals,
    completedOn,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    resetAll,
  } = useTasks();

  const todayKey = useMemo(() => dayKey(new Date()), []);
  const [selected, setSelected] = useState(todayKey);

  const day = activity.get(selected) ?? emptyActivity(selected);
  const dayTasks = completedOn(selected);
  const today = activity.get(todayKey) ?? emptyActivity(todayKey);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Aperion
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Habit Tracker</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Progress earned by finishing work — not by checking boxes.
          </p>
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Reset sample data
        </button>
      </header>

      <div className="glass-panel rounded-3xl">
        <section className="flex flex-wrap gap-x-10 gap-y-4 px-5 py-5 sm:px-7 sm:py-6">
          <Stat
            label="Today"
            value={`${today.effort} / ${DAILY_CAP}`}
            hint={today.capped ? "Cap reached" : `${Math.round(today.progress * 100)}% of a day`}
          />
          <Stat
            label="Current streak"
            value={`${totals.currentStreak}d`}
            hint={`Longest ${totals.longestStreak}d`}
          />
          <Stat
            label="Active days"
            value={`${totals.activeDays}`}
            hint={`${totals.cappedDays} at full cap`}
          />
          <Stat
            label="Tasks completed"
            value={`${totals.totalTasks}`}
            hint={`${totals.totalEffort} effort earned`}
          />
        </section>

        <section className="border-t border-panel-border px-5 py-6 sm:px-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Last 12 months</h2>
            <HeatmapLegend />
          </div>
          {ready ? (
            <Heatmap weeks={weeks} selected={selected} onSelect={setSelected} />
          ) : (
            <div className="h-[120px] animate-pulse rounded-xl bg-heat-0" />
          )}
        </section>

        <section className="border-t border-panel-border px-5 py-6 sm:px-7">
          <DayDetail
            day={day}
            tasks={dayTasks}
            onReopen={(id) => toggleTask(id)}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        </section>

        <section className="border-t border-panel-border px-5 py-6 sm:px-7">
          <TaskArea
            openTasks={openTasks}
            selectedDate={selected}
            isToday={selected === todayKey}
            onAdd={addTask}
            onUpdate={updateTask}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        </section>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Effort scale: Small 1 · Medium 3 · Large 6 — a focused day caps at {DAILY_CAP}.
      </p>
    </main>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground/80">{hint}</p>
    </div>
  );
}
