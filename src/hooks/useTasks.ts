import { useCallback, useEffect, useMemo, useState } from "react";

import { aggregateByDay, buildYearGrid, summarise, tasksCompletedOn } from "@/lib/habits/aggregate";
import { localTaskStore, type TaskStore } from "@/lib/habits/storage";
import { seedTasks } from "@/lib/habits/seed";
import type { Effort, Task } from "@/lib/habits/types";

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * The single access point components use for task data. Swapping the store
 * (or pointing it at Aperion) happens here, not in the UI.
 */
export function useTasks(store: TaskStore = localTaskStore) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = store.load();
    setTasks(loaded ?? seedTasks());
    setReady(true);
  }, [store]);

  useEffect(() => {
    if (ready) store.save(tasks);
  }, [tasks, ready, store]);

  const addTask = useCallback((title: string, effort: Effort) => {
    const stamp = nowIso();
    setTasks((prev) => [
      {
        id: createId(),
        title: title.trim(),
        effort,
        completed: false,
        completedAt: null,
        createdAt: stamp,
        updatedAt: stamp,
      },
      ...prev,
    ]);
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Pick<Task, "title" | "effort">>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t)),
    );
  }, []);

  /**
   * Toggling completion stamps or clears completedAt. Reopening a task pulls
   * its effort back out of that day's history — the task list is the only
   * source of truth, there is no separate frozen log.
   */
  const toggleTask = useCallback((id: string, completedAt?: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const completed = !t.completed;
        return {
          ...t,
          completed,
          completedAt: completed ? (completedAt ?? nowIso()) : null,
          updatedAt: nowIso(),
        };
      }),
    );
  }, []);

  /** Moves a completion to another day; its effort moves with it. */
  const setCompletedAt = useCallback((id: string, iso: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: true, completedAt: iso, updatedAt: nowIso() } : t,
      ),
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    store.clear();
    setTasks(seedTasks());
  }, [store]);

  const activity = useMemo(() => aggregateByDay(tasks), [tasks]);
  const weeks = useMemo(() => buildYearGrid(activity), [activity]);
  const totals = useMemo(() => summarise(activity), [activity]);
  const openTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);

  const completedOn = useCallback((date: string) => tasksCompletedOn(tasks, date), [tasks]);

  return {
    tasks,
    openTasks,
    ready,
    activity,
    weeks,
    totals,
    completedOn,
    addTask,
    updateTask,
    toggleTask,
    setCompletedAt,
    deleteTask,
    resetAll,
  };
}
