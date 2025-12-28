import React, { useMemo, useState } from "react";
import type { AppState, Progress, Task } from "../types";
import ProgressBar from "./ProgressBar";
import { createTask, setSage, toggleDone } from "../api";

function splitTasks(tasks: Task[]) {
  const todo = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  return { todo, done };
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

  // ---- Progress bar sage position (0..100 mapped to track) ----
  const sageLeftPct = useMemo(() => {
    const pct = Math.max(0, Math.min(100, progress.pct || 0));
    return pct;
  }, [progress.pct]);

  // ---- Current task for sage_read (must always exist) ----
  const currentSageTaskId = useMemo(() => {
    if (state.sage_task_id) return state.sage_task_id;
    if (todo[0]?.id) return todo[0].id;
    // if no todo left, keep showing on last done task (or null)
    if (done[0]?.id) return done[0].id;
    return null;
  }, [state.sage_task_id, todo, done]);

  // ---- Flower growth (RESET EACH SESSION) ----
  // Each completed task => waterCount + 1
  // Every 3 waters => grow stage (+1), stage 1..5
  const [waterCount, setWaterCount] = useState<number>(0);
  const [watering, setWatering] = useState<boolean>(false);

  const flowerStage = useMemo(() => {
    // stage: 0 means none yet; show flow_1 once any water happens
    const stage = Math.min(5, Math.max(0, Math.floor(waterCount / 3) + (waterCount > 0 ? 1 : 0)));
    return stage; // 0..5
  }, [waterCount]);

  const flowerReady = flowerStage >= 5;

  const onAdd = async () => {
    const v = text.trim();
    if (!v) return;
    await createTask(v);
    setText("");
  };

  const handleToggle = async (id: string) => {
    // We want: clicking green clover => task done => gold & move down
    // Also watering animation triggers when a task transitions to done.
    const target = state.tasks.find((t) => t.id === id);
    const wasDone = !!target?.done;

    await toggleDone(id);

    // If it was not done and now becomes done, trigger watering
    if (!wasDone) {
      setWaterCount((c) => c + 1);
      setWatering(true);
      window.setTimeout(() => setWatering(false), 900);
    }
  };

  const handleSetCurrent = async (taskId: string) => {
    await setSage(taskId);
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="sectionTitle">To-Do List</div>
      </div>

      <div className="divider" />

      {/* Progress row: bar + sage on bar + pct on right */}
      <div className="progressRow">
        <div className="progressTrackWrap">
          <ProgressBar pct={progress.pct} />
          <img
            className="sageWalkOnBar"
            src="/assets/sage_walk.png"
            alt="sage walk"
            style={{ left: `${sageLeftPct}%` }}
            draggable={false}
          />
        </div>
        <div className="progressPct">{progress.pct}%</div>
      </div>

      {/* Split scroll areas */}
      <div className="leftSplit" style={{ marginTop: 12 }}>
        {/* TOP: TODO */}
        <div className="panelBox" style={{ flex: 1, minHeight: 220 }}>
          <div className="todoBox">
            <div className="row" style={{ gap: 10 }}>
              <input
                value={text}
                placeholder="Add a task…"
                onChange={(e) => setText(e.target.value)}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,0.12)",
                  padding: "0 14px",
                  fontSize: 16,
                  background: "rgba(255,255,255,0.7)"
                }}
              />
              <button className="btn" onClick={onAdd}>
                Add
              </button>
            </div>

            <div className="panelScroll" style={{ marginTop: 14, height: "calc(100% - 70px)" }}>
              {todo.length === 0 ? (
                <div style={{ marginTop: 18, color: "rgba(0,0,0,0.45)", fontWeight: 800 }}>
                  No active task
                </div>
              ) : (
                <div className="list">
                  {todo.map((t) => {
                    const isSageHere = currentSageTaskId === t.id;
                    return (
                      <div className="taskItem" key={t.id}>
                        <div className="taskLeft">
                          <button className="iconBtn" onClick={() => handleToggle(t.id)} title="Mark as done">
                            <img src="/assets/clover_green.png" alt="clover green" draggable={false} />
                          </button>

                          <div className="taskText">{t.text}</div>
                        </div>

                        <button
                          className={`sageDrop ${isSageHere ? "active" : ""}`}
                          onClick={() => handleSetCurrent(t.id)}
                          title="Set as current"
                          type="button"
                        >
                          <img
                            src="/assets/sage_read.png"
                            alt="sage reading"
                            className="sageReadIcon"
                            draggable={false}
                          />
                          <span>{isSageHere ? "I’m working on" : "Set as current"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM: DONE */}
        <div className="panelBox" style={{ flex: 1, minHeight: 220 }}>
          <div className="panelHeader" style={{ alignItems: "flex-end" }}>
            <div className="sectionTitle" style={{ fontSize: 40 }}>
              Good job!
            </div>

            {/* Garden HUD (pot + can). Can must be ABOVE pot */}
            <div className={`gardenHud ${watering ? "watering" : ""}`}>
              {/* flower/pot stage */}
              {flowerStage > 0 ? (
                <img
                  className="gardenPot"
                  src={`/assets/flow_${Math.min(5, flowerStage)}.png`}
                  alt="flower"
                  draggable={false}
                />
              ) : (
                <img
                  className="gardenPot"
                  src={`/assets/flow_1.png`}
                  alt="flower"
                  style={{ opacity: 0.35 }}
                  draggable={false}
                />
              )}

              {/* watering can ABOVE pot */}
              <img className="gardenCan" src="/assets/water_can.png" alt="water can" draggable={false} />

              {/* droplets/sparkle overlay */}
              {watering && (
                <div className="waterFX" aria-hidden>
                  <span className="drop d1" />
                  <span className="drop d2" />
                  <span className="drop d3" />
                  <span className="spark s1" />
                  <span className="spark s2" />
                </div>
              )}
            </div>
          </div>

          <div className="divider" />

          <div className="panelScroll" style={{ height: "calc(100% - 82px)" }}>
            <div className="list">
              {done.map((t) => (
                <div className="taskItem" key={t.id}>
                  <div className="taskLeft">
                    <button className="iconBtn" onClick={() => handleToggle(t.id)} title="Completed">
                      <img src="/assets/clover_gold.png" alt="clover gold" draggable={false} />
                    </button>
                    <div className="taskText" style={{ opacity: 0.78 }}>
                      {t.text}
                    </div>
                  </div>
                  <div style={{ width: 82, height: 54 }} />
                </div>
              ))}
            </div>

            {/* Optional helper text when flower is ready */}
            {flowerReady && (
              <div style={{ marginTop: 14, color: "rgba(0,0,0,0.55)", fontWeight: 800 }}>
                Your flower is ready — drag it to the sage on the right to plant.
              </div>
            )}

            {/* Draggable flower icon (small, same as left size) */}
            {flowerReady && (
              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                <img
                  src="/assets/flow_5.png"
                  alt="ready flower"
                  draggable
                  className="readyFlower"
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", "flower_ready");
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
