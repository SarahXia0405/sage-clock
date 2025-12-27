export type Task = {
  id: string;
  text: string;
  done: boolean;
  created_at: number;
};

export type TimerState = {
  mode: "work" | "rest";
  running: boolean;
  duration_sec: number;
  remaining_sec: number;
  last_tick: number;
  bound_task_id?: string | null;
};

export type GardenState = {
  water_count: number;
  stage: number; // 1..5
  can_drag_flower: boolean;
  planted_task_id?: string | null;
};

export type AppState = {
  tasks: Task[];
  timer: TimerState;
  garden: GardenState;
  sage_task_id?: string | null;
};

export type Progress = {
  total: number;
  done: number;
  pct: number;
};
