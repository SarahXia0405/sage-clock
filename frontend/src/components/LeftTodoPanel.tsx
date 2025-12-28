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

  const sageLeftPct = useMemo(() => {
    const pct = Math.max(0, Math.min(100, progress.pct || 0));
    return pct;
  }, [progress.pct]);

  const currentSageTaskId = useMemo(() => {
    if (state.sage_task_id) return state.sage_task_id;
    if (todo[0]?.id) return todo[0].id;
    if (done[0]?.id) return done[0].id;
    return null;
  }, [state.sage_task_id, todo, done]);

  // SESSION ONLY: flower growth resets on refresh
  const [waterCount, setWaterCount] = useState(0);
  const [watering, setWatering] = useState(false);

  const flowerStage = useMemo(() => {
    if (waterCount <= 0) return 0;
    const stage = Math.min(5, Math.floor((waterCount - 1) / 3) + 1);
    return stage; // 1..5
  }, [waterCount]);

  const flowerReady = flowerStage >= 5;

  const onAdd = async () => {
    const v = text.trim();
    if (!v) return;
    await createTask(v);
    setText("");
  };

  const handleToggle = async (id: string) => {
    const target = state.tasks.find((t) => t.id === id);
    const wasDone = !!target?.done;

    await toggleDone(id);

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
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="sectionTitle">To-Do List</div>
      </div>

      <div className="divider" />

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

            {/* LOCKED POSITIONS by inline style */}
            <div style={{ position: "relative", width: 220, height: 84, marginLeft: 12 }}>
              {/* POT */}
              <img
                src={`/assets/flow_${Math.max(1, Math.min(5, flowerStage || 1))}.png`}
                alt="flower"
                draggable={false}
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 0,
                  transform: "translateX(-50%)",
                  height: 62,
                  width: "auto",
                  objectFit: "contain",
                  opacity: flowerStage > 0 ? 1 : 0.35
                }}
              />

              {/* CAN: ALWAYS ABOVE POT */}
              <img
                src="/assets/water_can.png"
                alt="water can"
                draggable={false}
                style={{
                  position: "absolute",
                  left: "70%",
                  top: -6,
                  transform: "translate(-50%, 0)",
                  height: 52,
                  width: "auto",
                  objectFit: "contain",
                  transformOrigin: "70% 70%",
                  animation: watering ? "canWiggle 0.9s ease-in-out" : "none"
                }}
              />

              {/* WATER FX */}
              {watering && (
                <div
                  style={{
                    position: "absolute",
                    left: "60%",
                    top: 18,
                    width: 90,
                    height: 70,
                    pointerEvents: "none"
                  }}
                >
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

            {flowerReady && (
              <div style={{ marginTop: 14, color: "rgba(0,0,0,0.55)", fontWeight: 800 }}>
                Your flower is ready — drag it to the sage on the right to plant.
              </div>
            )}

            {flowerReady && (
              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                <img
                  src="/assets/flow_5.png"
                  alt="ready flower"
                  draggable
                  style={{ height: 56, width: "auto", objectFit: "contain", cursor: "grab" }}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", "flower_ready")}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
