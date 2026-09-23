/**
 * Progress event data layer — read-only view over the permanent completion
 * history. Events are written by the task layer when tasks are completed.
 */
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export interface ProgressEvent {
  id: string;
  title: string;
  points: number;
  event_date: string;
}

export const progressKeys = {
  all: ["progress"] as const,
};

export function useProgressEvents() {
  return useQuery({
    queryKey: progressKeys.all,
    queryFn: async (): Promise<ProgressEvent[]> => {
      // Trailing 12 months is all the heatmap shows; widen if views grow.
      const start = new Date();
      start.setMonth(start.getMonth() - 12);
      start.setDate(1);
      const startKey = new Date(start.getTime() - start.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
      const { data, error } = await supabase
        .from("progress_events")
        .select("id, title, points, event_date")
        .gte("event_date", startKey)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function eventsOnDate(events: ProgressEvent[], date: string): ProgressEvent[] {
  return events.filter((e) => e.event_date === date);
}
