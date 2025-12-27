from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional, Literal, Dict
import time
import uuid

app = FastAPI(title="Potato Clock API")

# -----------------------------
# In-memory state (MVP)
# Note: HF free spaces are ephemeral; later you can add sqlite or HF persistent storage.
# -----------------------------
class Task(BaseModel):
    id: str
    text: str
    done: bool = False
    created_at: float

class TimerState(BaseModel):
    mode: Literal["work", "rest"] = "work"
    running: bool = False
    duration_sec: int = 25 * 60
    remaining_sec: int = 25 * 60
    last_tick: float = 0.0
    bound_task_id: Optional[str] = None

class GardenState(BaseModel):
    water_count: int = 0           # total gold clovers clicked
    stage: int = 1                 # 1..5 (flow_1..flow_5)
    can_drag_flower: bool = False  # stage==5 unlock
    planted_task_id: Optional[str] = None

class AppState(BaseModel):
    tasks: List[Task]
    timer: TimerState
    garden: GardenState
    sage_task_id: Optional[str] = None  # which task sage is "on" (drag target)

STATE = AppState(
    tasks=[],
    timer=TimerState(),
    garden=GardenState(),
    sage_task_id=None,
)

def recompute_progress() -> Dict[str, int]:
    total = len(STATE.tasks)
    done = sum(1 for t in STATE.tasks if t.done)
    pct = int(round((done / total) * 100)) if total > 0 else 0
    return {"total": total, "done": done, "pct": pct}

def garden_after_done_increment():
    # each completion triggers water once; every 3 waters stage++ until 5.
    g = STATE.garden
    g.water_count += 1
    # stage logic: stage advances at water_count 3,6,9,12 (max stage 5)
    g.stage = min(5, 1 + (g.water_count // 3))
    g.can_drag_flower = (g.stage >= 5)

# -----------------------------
# Schemas
# -----------------------------
class CreateTaskReq(BaseModel):
    text: str

class ToggleDoneReq(BaseModel):
    id: str

class SetSageReq(BaseModel):
    task_id: str

class TimerSetReq(BaseModel):
    duration_min: int
    mode: Literal["work", "rest"]
    bound_task_id: Optional[str] = None

class TimerControlReq(BaseModel):
    action: Literal["start", "pause", "reset", "skip"]

class PlantFlowerReq(BaseModel):
    task_id: str

# -----------------------------
# API
# -----------------------------
@app.get("/state")
def get_state():
    timer_tick_if_running()  
    return {
        "state": STATE.model_dump(),
        "progress": recompute_progress(),
        "now": time.time(),
    }


@app.post("/tasks")
def create_task(req: CreateTaskReq):
    tid = str(uuid.uuid4())
    task = Task(id=tid, text=req.text.strip(), done=False, created_at=time.time())
    STATE.tasks.insert(0, task)

    # default sage on first task if not set
    if STATE.sage_task_id is None:
        STATE.sage_task_id = tid
        STATE.timer.bound_task_id = tid

    return {"ok": True, "task": task.model_dump(), "progress": recompute_progress()}

@app.post("/tasks/toggle_done")
def toggle_done(req: ToggleDoneReq):
    for t in STATE.tasks:
        if t.id == req.id:
            if not t.done:
                # turning green -> gold, and move to completed section (front-end will render by done flag)
                t.done = True
                garden_after_done_increment()
            else:
                # allow undo (optional)
                t.done = False
            break
    return {"ok": True, "state": STATE.model_dump(), "progress": recompute_progress()}

@app.post("/sage/set")
def set_sage(req: SetSageReq):
    STATE.sage_task_id = req.task_id
    # bind timer to this task by default
    STATE.timer.bound_task_id = req.task_id
    return {"ok": True, "state": STATE.model_dump()}

def timer_tick_if_running():
    tm = STATE.timer
    if not tm.running:
        return
    now = time.time()
    if tm.last_tick <= 0:
        tm.last_tick = now
        return
    elapsed = int(now - tm.last_tick)
    if elapsed <= 0:
        return
    tm.last_tick = now
    tm.remaining_sec -= elapsed
    if tm.remaining_sec <= 0:
        # auto switch
        if tm.mode == "work":
            tm.mode = "rest"
            # default rest 5 min
            tm.duration_sec = max(tm.duration_sec, 25 * 60)  # keep last work duration
            tm.remaining_sec = 5 * 60
        else:
            tm.mode = "work"
            tm.remaining_sec = tm.duration_sec

@app.post("/timer/set")
def timer_set(req: TimerSetReq):
    tm = STATE.timer
    tm.mode = req.mode
    tm.duration_sec = max(1, req.duration_min) * 60
    tm.remaining_sec = tm.duration_sec if req.mode == "work" else max(1, req.duration_min) * 60
    tm.bound_task_id = req.bound_task_id
    tm.running = False
    tm.last_tick = time.time()
    return {"ok": True, "timer": tm.model_dump()}

@app.post("/timer/control")
def timer_control(req: TimerControlReq):
    timer_tick_if_running()
    tm = STATE.timer
    if req.action == "start":
        tm.running = True
        tm.last_tick = time.time()
    elif req.action == "pause":
        tm.running = False
    elif req.action == "reset":
        tm.running = False
        tm.remaining_sec = tm.duration_sec if tm.mode == "work" else tm.remaining_sec
        tm.last_tick = time.time()
    elif req.action == "skip":
        # switch immediately
        tm.mode = "rest" if tm.mode == "work" else "work"
        tm.remaining_sec = (5 * 60) if tm.mode == "rest" else tm.duration_sec
        tm.last_tick = time.time()
    return {"ok": True, "timer": tm.model_dump()}

@app.post("/garden/plant")
def plant(req: PlantFlowerReq):
    g = STATE.garden
    if not g.can_drag_flower:
        return {"ok": False, "error": "Flower not unlocked yet (need stage 5)."}
    g.planted_task_id = req.task_id
    return {"ok": True, "garden": g.model_dump()}
