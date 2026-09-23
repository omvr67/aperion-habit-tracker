/**
 * Project data layer. Components never touch the database directly — they use
 * these hooks. Swapping storage later means rewriting this file only.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Project = Tables<"projects">;

export const projectKeys = {
  all: ["projects"] as const,
};

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .is("deleted_at", null)
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; parentId?: string | null }) => {
      const name = input.name.trim();
      if (!name) throw new Error("A project needs a name");
      const user_id = await currentUserId();
      const { data, error } = await supabase
        .from("projects")
        .insert({ name, parent_project_id: input.parentId ?? null, user_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<Project, "name" | "description" | "color" | "icon" | "is_favorite">>;
    }) => {
      if (patch.name !== undefined && !patch.name.trim()) throw new Error("A project needs a name");
      const { data, error } = await supabase
        .from("projects")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

/**
 * Deleting a project detaches its tasks — they stay standalone, with their
 * completion history intact. The project is soft-deleted (recoverable for
 * 30 days); detached tasks are not re-attached on restore.
 */
export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      const { error: detachErr } = await supabase
        .from("tasks")
        .update({ project_id: null, updated_at: new Date().toISOString() })
        .eq("project_id", id);
      if (detachErr) throw detachErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/** Undo for project deletion — clears deleted_at. Tasks stay detached. */
export function useRestoreProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ deleted_at: null, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
