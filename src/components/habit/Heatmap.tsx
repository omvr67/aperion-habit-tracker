import { useEffect, useRef } from "react";

import { formatShortDate, keyToDate } from "@/lib/habits/date";
import type { DayActivity } from "@/lib/habits/types";

const LEVEL_CLASS: Record<number, string> = {
  0: "bg-heat-0",
  1: "bg-heat-1",
  2: "bg-heat-2",
  3: "bg-heat-3",
  4: "bg-heat-4",
};

const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

interface Props {
  weeks: DayActivity[][];
  selected: string;
  onSelect: (date: string) => void;
}

export function Heatmap({ weeks, selected, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks.length]);

  const monthLabels = weeks.map((week, i) => {
    const first = week[0];
    if (!first) return null;
    const date = keyToDate(first.date);
    const prev = i > 0 ? keyToDate(weeks[i - 1]![0]!.date) : null;
    if (prev && prev.getMonth() === date.getMonth()) return null;
    if (i === weeks.length - 1) return null;
    return date.toLocaleDateString(undefined, { month: "short" });
  });

  return (
    <div className="flex gap-3">
      <div className="hidden shrink-0 flex-col gap-[3px] pt-[22px] sm:flex">
        {WEEKDAYS.map((day, i) => (
          <div
            key={i}
            className="h-[13px] text-[10px] leading-[13px] text-muted-foreground/70"
            style={{ width: 26 }}
          >
            {day}
          </div>
        ))}
      </div>

      <div ref={scrollRef} className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-[3px]">
            {weeks.map((_, i) => (
              <div key={i} className="w-[13px] text-[10px] text-muted-foreground/70">
                <span className="whitespace-nowrap">{monthLabels[i]}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, di) => {
                  const day = week.find((d) => keyToDate(d.date).getDay() === di);
                  if (!day) return <div key={di} className="h-[13px] w-[13px]" />;
                  const isSelected = day.date === selected;
                  return (
                    <button
                      key={di}
                      type="button"
                      onClick={() => onSelect(day.date)}
                      title={`${formatShortDate(day.date)} — ${day.effort} effort · ${day.taskCount} task${day.taskCount === 1 ? "" : "s"}${day.capped ? " · cap reached" : ""}`}
                      aria-label={`${formatShortDate(day.date)}, ${day.effort} effort, ${day.taskCount} tasks`}
                      aria-pressed={isSelected}
                      className={`h-[13px] w-[13px] rounded-[3px] transition-all duration-150 hover:scale-[1.35] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${LEVEL_CLASS[day.level]} ${
                        isSelected
                          ? "ring-2 ring-foreground/50 ring-offset-1 ring-offset-background"
                          : ""
                      } ${day.capped ? "shadow-[0_0_0_1px_var(--heat-4)]" : ""}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span>Quiet</span>
      <div className="flex gap-[3px]">
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`h-[11px] w-[11px] rounded-[3px] ${LEVEL_CLASS[l]}`} />
        ))}
      </div>
      <span>Full day</span>
    </div>
  );
}
