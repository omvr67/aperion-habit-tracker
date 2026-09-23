import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { DayDetail } from "@/components/habit/DayDetail";
import { Heatmap, HeatmapLegend } from "@/components/habit/Heatmap";
import { useProgressEvents } from "@/lib/data/progress";
import { formatShortDate } from "@/lib/heatmap";
import { aggregateByDay, buildYearGrid, dateKey, summarise } from "@/lib/heatmap";

export const Route = createFileRoute("/_app/habits")({
  head: () => ({
    meta: [
      { title: "Habit Tracker — Aperion" },
      {
        name: "description",
        content:
          "A yearly view of the progress your completed work generated — effort-weighted, day by day.",
      },
      { property: "og:title", content: "Habit Tracker — Aperion" },
      {
        property: "og:description",
        content:
          "A yearly view of the progress your completed work generated — effort-weighted, day by day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HabitTracker,
});

function HabitTracker() {
  const { data: events = [], isLoading } = useProgressEvents();
  const [selected, setSelected] = useState(() => dateKey());

  const activity = useMemo(() => aggregateByDay(events), [events]);
  const weeks = useMemo(() => buildYearGrid(activity), [activity]);
  const totals = useMemo(() => summarise(weeks), [weeks]);

  const day = activity.get(selected) ?? { date: selected, points: 0, taskCount: 0 };
  const dayEvents = events.filter((e) => e.event_date === selected);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Habit Tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The progress your completed work generated over the last 12 months.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="glass-panel rounded-3xl p-4 sm:p-6">
          {isLoading ? (
            <p className="py-20 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                <Stat label="Total effort" value={`${totals.totalPoints} pts`} />
                <Stat label="Active days" value={totals.activeDays} />
                <Stat
                  label="Best day"
                  value={
                    totals.bestDay && totals.bestDay.points > 0
                      ? `${formatShortDate(totals.bestDay.date)} · ${totals.bestDay.points} pts`
                      : "—"
                  }
                />
              </div>
              <Heatmap weeks={weeks} selected={selected} onSelect={setSelected} />
              <div className="mt-4">
                <HeatmapLegend />
              </div>
            </>
          )}
        </div>

        <aside className="glass-panel h-fit rounded-3xl p-5">
          <DayDetail
            date={selected}
            points={day.points}
            taskCount={day.taskCount}
            events={dayEvents}
          />
        </aside>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium tracking-tight">{value}</p>
    </div>
  );
}
