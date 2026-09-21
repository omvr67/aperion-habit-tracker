/**
 * Task data layer. Components never touch the database directly — they use
 * these hooks. Swapping storage later means rewriting this file only.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { pointsForEffort } from "@/lib/effort";
import type { Tables } from "@/integrations/supabase/types";

export type Task = Tables<"tasks">;
export type Subtask = Tables<"subtasks">;
export type TaskLink = Tables<"links">;

export const taskKeys = {
  all: ["tasks"] as const,
  list: (scope: string) => ["tasks", scope] as const,
  subtasks: (taskId: string) => ["subtasks", taskId] as const,
  links: (taskId: string) => ["links", taskId] as const,
};

function localDate(d = new Date()) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function useTasks(scope: "all" | "favorites" | "deleted" = "all") {
  return useQuery({
    queryKey: taskKeys.list(scope),
    queryFn: async (): Promise<Task[]> => {
      let q = supabase.from("tasks").select("*");
      q = scope === "deleted" ? q.not("deleted_at", "is", null) : q.is("deleted_at", null);
      if (scope === "favorites") q = q.eq("is_favorite", true);
      const { data, error } = await q
        .order("completed", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; effort?: number | null; projectId?: string | null }) => {
      const title = input.title.trim();
      if (!title) throw new Error("A task needs a title");
      const user_id = await currentUserId();
      const { data, error } = await supabase
        .from("tasks")
        .insert({ title, effort: input.effort ?? null, project_id: input.projectId ?? null, user_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<Task, "title" | "notes" | "effort" | "is_favorite" | "project_id">>;
    }) => {
      if (patch.title !== undefined && !patch.title.trim()) throw new Error("A task needs a title");
      const { data, error } = await supabase
        .from("tasks")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

/**
 * Completing a task writes one immutable progress event carrying the points
 * the effort resolved to at that moment. Re-opening removes that event.
 * Later effort edits never rewrite history.
 */
export function useSetTaskCompleted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ task, completed }: { task: Task; completed: boolean }) => {
      const now = new Date();
      const { error } = await supabase
        .from("tasks")
        .update({
          completed,
          completed_at: completed ? now.toISOString() : null,
          updated_at: now.toISOString(),
        })
        .eq("id", task.id);
      if (error) throw error;

      if (completed) {
        const { data: existing } = await supabase
          .from("progress_events")
          .select("id")
          .eq("task_id", task.id)
          .maybeSingle();
        if (!existing) {
          const user_id = await currentUserId();
          const { error: evErr } = await supabase.from("progress_events").insert({
            user_id,
            task_id: task.id,
            project_id: task.project_id,
            title: task.title,
            points: pointsForEffort(task.effort),
            event_date: localDate(now),
          });
          if (evErr) throw evErr;
        }
      } else {
        const { error: delErr } = await supabase
          .from("progress_events")
          .delete()
          .eq("task_id", task.id);
        if (delErr) throw delErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

/** Soft delete — recoverable from Recently Deleted. History is preserved. */
export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, restore = false }: { id: string; restore?: boolean }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ deleted_at: restore ? null : new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
  });
}

export function useSubtasks(taskId: string | null) {
  return useQuery({
    queryKey: taskKeys.subtasks(taskId ?? "none"),
    enabled: !!taskId,
    queryFn: async (): Promise<Subtask[]> => {
      const { data, error } = await supabase
        .from("subtasks")
        .select("*")
        .eq("task_id", taskId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubtaskMutations(taskId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: taskKeys.subtasks(taskId) });

  const add = useMutation({
    mutationFn: async (title: string) => {
      const clean = title.trim();
      if (!clean) throw new Error("A subtask needs a title");
      const user_id = await currentUserId();
      const { error } = await supabase
        .from("subtasks")
        .insert({ task_id: taskId, title: clean, user_id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggle = useMutation({
    mutationFn: async (s: Subtask) => {
      const { error } = await supabase
        .from("subtasks")
        .update({ completed: !s.completed })
        .eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subtasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, toggle, remove };
}

export function useLinks(taskId: string | null) {
  return useQuery({
    queryKey: taskKeys.links(taskId ?? "none"),
    enabled: !!taskId,
    queryFn: async (): Promise<TaskLink[]> => {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLinkMutations(taskId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: taskKeys.links(taskId) });

  const add = useMutation({
    mutationFn: async (url: string) => {
      const clean = url.trim();
      if (!/^https?:\/\/\S+$/i.test(clean)) throw new Error("Enter a valid link starting with http");
      const user_id = await currentUserId();
      const { error } = await supabase.from("links").insert({ task_id: taskId, url: clean, user_id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { add, remove };
}
