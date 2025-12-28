import React, { useEffect, useMemo, useRef, useState } from "react";
import type { AppState, Progress, Task } from "../types";
import ProgressBar from "./ProgressBar";
import { createTask, setSage, toggleDone } from "../api";

function splitTasks(tasks: Task[]) {
  const todo = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  return { todo, done };
}

const LS_WATER = "potato_clock_water_count_v1";

export default function LeftTodoPanel({
  state,
  progress,
  onState,
  onProgress
}: {
  state: AppState;
  progress: Progress;
  onState: (s: AppState) => void;
  onProgress: (p: Progress) => void;
}) {
  const { todo, done } = useMemo(() => splitTasks(state.tasks), [state.tasks]);
  const [text, setText] = useState("");

  // -------- Watering & Flower Growth (persisted) --------
  const [waterCount, setWaterCount] = useState<number>(() => {
    const v = Number(localStorage.getItem(LS_WATER) || "0");
    return Number.isFinite(v) ? v : 0;
  });

  const [watering, setWatering] = useState(false);

  const flowStage = useMemo(() => {
    const stage = 1 + Math.floor(waterCount / 3);
    return Math.min(5, Math.max(1, stage));
  }, [waterCount]);

  useEffect(() => {
    localStorage.setItem(LS_WATER, String(waterCount));
  }, [waterCount]);

  // Detect newly completed tasks (done transitions)
  const prevDoneIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const nowDoneIds = new Set(state.tasks.filter((t) => t.done).map((t) => t.id));
    const prev = prevDoneIdsRef.current;

    let newlyDone = 0;
    for (const id of nowDoneIds) {
      if (!prev.has(id)) newlyDone += 1;
    }

    if (newlyDone > 0) {
      setWaterCount((c) => c + newlyDone);

      setWatering(true);
      window.setTimeout(() => setWatering(false), 950);
    }

    prevDoneIdsRef.current = nowDoneIds;
  }, [state.tasks]);

  // -------- Current sage task logic --------
  const currentSageTaskId = useMemo(() => {
    const desired = state.sage_task_id || null;
    if (desired) {
      const t = state.tasks.find((x) => x.id === desired);
      if (t && !t.done) return desired;
    }
    return todo[0]?.id ?? null;
  }, [state.sage_task_id, state.tasks, todo]);

  const pct = progress.pct;

  const onAdd = async () => {
    const v = text.trim();
    if (!v) return;
    await createTask(v);
    setText("");
  };

  const handleToggle = async (id: string) => {
    await toggleDone(id);
  };

  const handleDropSage = async (taskId: string) => {
    await setSage(taskId);
  };

  // flower is ONLY draggable source now (drop target is on RIGHT panel)
  const canDragFlower = flowStage >= 5;
  const onFlowerDragStart = (e: React.DragEvent) => {
    if (!canDragFlower) return;
    e.dataTransfer.setData("text/plain", "flower:ready");
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="card">
      <div className="panelHeader">
        <div className="sectionTitle">To-Do List</div>
      </div>

      {/* Progress row: bar + sage on bar + % on right */}
      <div className="progressRow">
        <div className="progressTrackWrap">
          <ProgressBar pct={pct} />
          <img
            className="sageWalkOnBar"
            src="/assets/sage_walk.png"
            alt="sage walking"
            style={{ left: `${pct}%` }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="progressPct">{pct}%</div>
      </div>

      <div className="divider" />

      <div className="leftSplit">
        {/* TOP: TODO */}
        <div className="panelBox" style={{ flex: "0 0 54%" }}>
          <div className="row" style={{ gap: 10 }}>
            <input
              value={text}
              placeholder="Add a task…"
              onChange={(e) => setText(e.target.value)}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.12)",
                padding: "0 12px",
                fontSize: 16
              }}
            />
            <button className="btn" onClick={onAdd}>
              Add
            </button>
          </div>

          <div className="panelScroll" style={{ marginTop: 12, height: "calc(100% - 60px)" }}>
            <div className="list">
              {todo.length === 0 ? (
                <div className="mini" style={{ fontSize: 18, fontWeight: 800, opacity: 0.7, padding: "12px 2px" }}>
                  No active task
                </div>
              ) : null}

              {todo.map((t) => {
                const isSageHere = currentSageTaskId === t.id;

                return (
                  <div className="taskItem" key={t.id}>
                    <div className="taskLeft">
                      <button className="iconBtn" onClick={() => handleToggle(t.id)} title="Mark as done">
                        <img src="/assets/clover_green.png" alt="clover" />
                      </button>

                      <div className="taskText">{t.text}</div>
                    </div>

                    {/* Sage drop zone (ONLY for setting current task now) */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropSage(t.id)}
                      style={{
                        width: 190,
                        height: 70,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        borderRadius: 18,
                        border: "1px dashed rgba(0,0,0,0.18)",
                        background: isSageHere ? "rgba(0,0,0,0.04)" : "transparent",
                        padding: "0 12px"
                      }}
                      title="Drop to set as current"
                    >
                      {isSageHere ? (
                        <>
                          <img src="/assets/sage_read.png" alt="sage reading" style={{ height: 48 }} />
                          <div style={{ fontWeight: 900, opacity: 0.78 }}>I’m working on</div>
                        </>
                      ) : (
                        <div style={{ fontWeight: 800, opacity: 0.55 }}>Set as current</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Keep sage read visible even when no todo */}
              {todo.length === 0 ? (
                <div className="taskItem" style={{ marginTop: 10 }}>
                  <div className="taskLeft" style={{ minHeight: 72 }} />
                  <div
                    style={{
                      width: 190,
                      height: 70,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      borderRadius: 18,
                      border: "1px dashed rgba(0,0,0,0.18)",
                      background: "rgba(0,0,0,0.04)",
                      padding: "0 12px"
                    }}
                  >
                    <img src="/assets/sage_read.png" alt="sage reading" style={{ height: 48 }} />
                    <div style={{ fontWeight: 900, opacity: 0.78 }}>I’m working on</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* BOTTOM: DONE + WATERING + FLOW */}
        <div className="panelBox" style={{ flex: "0 0 46%" }}>
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div className="sectionTitle" style={{ fontSize: 34 }}>
              Good job!
            </div>

            {/* Flower + Can + Water drops + Sparkles */}
            <div className="gardenWrap">
              <img
                className="gardenFlower"
                src={`/assets/flow_${flowStage}.png`}
                alt={`flower stage ${flowStage}`}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
                draggable={false}
              />

              <img
                className={watering ? "gardenCan watering" : "gardenCan"}
                src="/assets/watering_can.png"
                alt="watering can"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
                draggable={false}
              />

              {/* Water drops + sparkles only when watering */}
              {watering ? (
                <>
                  <div className="waterDrops" aria-hidden="true">
                    <span className="drop d1" />
                    <span className="drop d2" />
                    <span className="drop d3" />
                    <span className="drop d4" />
                    <span className="drop d5" />
                  </div>
                  <div className="sparkles" aria-hidden="true">
                    <span className="sp s1" />
                    <span className="sp s2" />
                    <span className="sp s3" />
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="divider" />

          {/* Drag source: only when stage==5 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div className="mini" style={{ fontSize: 14, fontWeight: 800, opacity: 0.75 }}>
              {canDragFlower
                ? "Your flower is ready — drag it to the sage on the right to plant."
                : `Watering progress: ${waterCount} (every 3 grows a new flower)`}
            </div>

            {canDragFlower ? (
              <img
                src="/assets/flow_5.png"
                alt="draggable flower"
                draggable
                onDragStart={onFlowerDragStart}
                style={{ height: 58, cursor: "grab", objectFit: "contain" }}
              />
            ) : null}
          </div>

          <div className="panelScroll" style={{ height: "calc(100% - 128px)" }}>
            <div className="list" style={{ marginTop: 6 }}>
              {done.map((t) => (
                <div className="taskItem" key={t.id}>
                  <div className="taskLeft">
                    <button className="iconBtn" onClick={() => handleToggle(t.id)} title="Completed">
                      <img src="/assets/clover_gold.png" alt="gold clover" />
                    </button>

                    <div className="taskText" style={{ opacity: 0.78 }}>
                      {t.text}
                    </div>
                  </div>

                  <div style={{ width: 190, height: 70 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
