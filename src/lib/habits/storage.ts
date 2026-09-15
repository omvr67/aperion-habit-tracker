import type { Task } from "./types";

/**
 * Thin persistence boundary. Components never import this directly — they go
 * through useTasks — so swapping localStorage for Aperion's real task store
 * means replacing this one file.
 */
export interface TaskStore {
  load(): Task[] | null;
  save(tasks: Task[]): void;
  clear(): void;
}

const STORAGE_KEY = "aperion.habit-tracker.tasks.v1";

export const localTaskStore: TaskStore = {
  load() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Task[]) : null;
    } catch {
      return null;
    }
  },
  save(tasks) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      /* storage full or unavailable — prototype degrades to in-memory */
    }
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  },
};
