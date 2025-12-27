import type { AppState, Progress } from "./types";

export async function fetchState(): Promise<{ state: AppState; progress: Progress; now: number }> {
  const r = await fetch("/api/state");
  if (!r.ok) throw new Error("fetchState failed");
  return r.json();
}

export async function createTask(text: string) {
  const r = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  if (!r.ok) throw new Error("createTask failed");
  return r.json();
}

export async function toggleDone(id: string) {
  const r = await fetch("/api/tasks/toggle_done", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });
  if (!r.ok) throw new Error("toggleDone failed");
  return r.json();
}

export async function setSage(task_id: string) {
  const r = await fetch("/api/sage/set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id })
  });
  if (!r.ok) throw new Error("setSage failed");
  return r.json();
}

export async function timerControl(action: "start" | "pause" | "reset" | "skip") {
  const r = await fetch("/api/timer/control", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action })
  });
  if (!r.ok) throw new Error("timerControl failed");
  return r.json();
}

export async function timerSet(mode: "work" | "rest", duration_min: number, bound_task_id?: string | null) {
  const r = await fetch("/api/timer/set", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, duration_min, bound_task_id })
  });
  if (!r.ok) throw new Error("timerSet failed");
  return r.json();
}

export async function plantFlower(task_id: string) {
  const r = await fetch("/api/garden/plant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_id })
  });
  return r.json();
}
