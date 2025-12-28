import React, { useMemo, useRef, useState } from "react";
import type { AppState, Progress, Task } from "../types";
import ProgressBar from "./ProgressBar";
import { createTask, setSage, toggleDone } from "../api";

function splitTasks(tasks: Task[]) {
  const todo = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  return { todo, done };
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function LeftTodoPanel({
  state,
  progress
}: {
  state: AppState;
  progress: Progress;
  onState: (s: AppState) => void;
  onProgress: (p: Progress) => void;
}) {
  const { todo, done } = useMemo(() => splitTasks(state.tasks), [state.tasks]);
  const [text, setText] = useState("");

  // progress bar refs (for accurate sage positioning)
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [trackW, setTrackW] = useState(520);

  const pct = clamp(progress.pct || 0, 0, 100);

  // active task: keep sage even if previous task completed
  const activeTaskId = state.sage_task_id || todo[0]?.id || done[0]?.id || null;

  // ===== watering / flower growth =====
  const [waterCount, setWaterCount] = useState(0); // 0..∞
  const [pouring, setPouring] = useState(false);

  const stage = useMemo(() => {
    const s = Math.floor(waterCount / 3) + 1; // 1..5
    return clamp(s, 1, 5);
  }, [waterCount]);

  const flowerReady = stage >= 5;

  const onAdd = async () => {
    const v = text.trim();
    if (!v) return;
    await createTask(v);
    setText("");
  };

  // ✅ reset growth when flower planted on right
  React.useEffect(() => {
    const onUsed = () => {
      setWaterCount(0);
      setPouring(false);
    };
    window.addEventListener("flower:used", onUsed as EventListener);
    return () => window.removeEventListener("flower:used", onUsed as EventListener);
  }, []);

  const handleToggle = async (id: string) => {
    // determine current status before toggling
    const before = state.tasks.find((t) => t.id === id);
    const wasDone = !!before?.done;

    await toggleDone(id);

    // ✅ only water when turning a todo -> done (i.e., wasDone === false)
    if (!wasDone) {
      setPouring(true);
      setWaterCount((c) => c + 1);
      window.setTimeout(() => setPouring(false), 700);
    }
  };

  const handleSetCurrent = async (taskId: string) => {
    await setSage(taskId);
  };

  const sageX = useMemo(() => {
    const w = trackW || 520;
    const x = (w * pct) / 100;
    return x;
  }, [pct, trackW]);

  // measure track width once rendered
  React.useEffect(() => {
    if (!trackRef.current) return;
    const el = trackRef.current;
    const ro = new ResizeObserver(() => {
      setTrackW(el.getBoundingClientRect().width);
    });
    ro.observe(el);
    setTrackW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="card">
      <div className="leftSplit">
        {/* ===== TOP: TODO ===== */}
        <div className="panelBox" style={{ flex: "0 0 54%" }}>
          <div className="panelHeader">
            <div className="sectionTitle">To-Do List</div>
          </div>

          <div className="divider" />

          {/* Progress row: bar + sage + pct on right */}
          <div className="progressRow">
            <div className="progressTrackWrap" ref={trackRef}>
              <ProgressBar pct={pct} />
              <img
                className="sageWalkOnBar"
                src="/assets/sage_walk.png"
                alt="sage walking"
                style={{ left: `${sageX}px` }}
                draggable={false}
              />
            </div>
            <div className="progressPct">{pct}%</div>
          </div>

          <div className="divider" style={{ marginTop: 12 }} />

          <div className="row" style={{ gap: 12 }}>
            <input
              className="taskInput"
              value={text}
              placeholder="Add a task..."
              onChange={(e) => setText(e.target.value)}
            />
            <button className="btn" onClick={onAdd}>
              Add
            </button>
          </div>

          <div className="panelScroll" style={{ marginTop: 16 }}>
            <div className="list">
              {todo.length === 0 ? (
                <div style={{ fontWeight: 900, color: "rgba(0,0,0,0.35)", fontSize: 22, marginTop: 10 }}>
                  No active task
                </div>
              ) : (
                todo.map((t) => {
                  const isActive = activeTaskId === t.id;
                  return (
                    <div className="taskItem" key={t.id}>
                      <div className="taskLeft">
                        <button className="iconBtn" onClick={() => handleToggle(t.id)} title="Mark as done">
                          <img src="/assets/clover_green.png" alt="clover" />
                        </button>

                        <div className="taskText">{t.text}</div>
                      </div>

                      {isActive ? (
                        <div className="taskPill active" title="Current task">
                          <img src="/assets/sage_read.png" alt="sage reading" draggable={false} />
                          <span>I’m working on</span>
                        </div>
                      ) : (
                        <button
                          className="taskPill dashed"
                          onClick={() => handleSetCurrent(t.id)}
                          title="Set as current"
                          type="button"
                        >
                          <span>Set as current</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ===== BOTTOM: DONE ===== */}
        <div className="panelBox" style={{ flex: "0 0 46%" }}>
          <div className="panelHeader">
            <div className="sectionTitle" style={{ fontSize: 44 }}>
              Good job!
            </div>
          </div>

          <div className="divider" />

          {/* watering row (pot + can) */}
          <div className="growRow">
            <img className="flowerPot" src={`/assets/flow_${stage}.png`} alt={`flower stage ${stage}`} draggable={false} />
            <img
              className={`waterCan ${pouring ? "pouring" : ""}`}
              src="/assets/water_can.png"
              alt="water can"
              draggable={false}
            />
            <div className={`waterSpark ${pouring ? "on" : ""}`}>
              <svg width="120" height="60" viewBox="0 0 120 60">
                <circle cx="30" cy="20" r="4" fill="rgba(255,255,255,0.9)" />
                <circle cx="50" cy="30" r="3" fill="rgba(255,255,255,0.7)" />
                <circle cx="70" cy="18" r="4" fill="rgba(255,255,255,0.8)" />
                <circle cx="90" cy="34" r="3" fill="rgba(255,255,255,0.7)" />
              </svg>
            </div>
          </div>

          {flowerReady && (
            <div style={{ marginTop: 6, fontWeight: 900, color: "rgba(0,0,0,0.55)" }}>
              Your flower is ready — drag it to the sage on the right to plant.
            </div>
          )}

          <div className="panelScroll" style={{ marginTop: 12 }}>
            <div className="list">
              {done.map((t) => (
                <div className="taskItem" key={t.id}>
                  <div className="taskLeft">
                    <button className="iconBtn" onClick={() => handleToggle(t.id)} title="Completed">
                      <img src="/assets/clover_gold.png" alt="gold clover" />
                    </button>

                    <div className="taskText" style={{ opacity: 0.65 }}>
                      {t.text}
                    </div>
                  </div>

                  <div style={{ width: 240, height: 78 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Draggable flower (same size as left pot icon) */}
          {flowerReady && (
            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
              <img
                src="/assets/flow_5.png"
                alt="ready flower"
                style={{ height: 72, width: "auto", cursor: "grab" }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", "flower_ready");
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
