import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AppState, Progress, Task } from "../types";
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

  // ===== Progress bar: compute sage_walk X based on actual track width
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [sageX, setSageX] = useState(0);

  useLayoutEffect(() => {
    const update = () => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const w = rect.width;
      const pct = clamp(progress.pct, 0, 100);
      setSageX((w * pct) / 100);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [progress.pct]);

  // ===== read-sage target must always be valid
  const todoIds = useMemo(() => new Set(todo.map((t) => t.id)), [todo]);

  const effectiveSageTaskId = useMemo(() => {
    const desired = state.sage_task_id ?? null;
    if (desired && todoIds.has(desired)) return desired;
    return todo[0]?.id ?? null;
  }, [state.sage_task_id, todoIds, todo]);

  // If backend still points to a completed task, sync to fallback todo[0]
  useLayoutEffect(() => {
    const desired = state.sage_task_id ?? null;
    if (desired && todoIds.has(desired)) return;
    const fallback = todo[0]?.id ?? null;
    if (!fallback) return;
    if (fallback === desired) return;
    setSage(fallback).catch(() => {});
  }, [state.sage_task_id, todoIds, todo]);

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

  return (
    <div className="leftSplit">
      {/* ===== TOP: To-Do (fixed header + scroll list) ===== */}
      <div className="panelBox" style={{ flex: 6, minHeight: 0 }}>
        <div className="panelHeader">
          <div className="sectionTitle">To-Do List</div>
        </div>

        <div className="divider" />

        {/* Progress row */}
        <div className="progressRow">
          <div className="progressTrackWrap" ref={trackRef}>
            <div className="progressBar" aria-label="progress">
              <div
                className="progressFill"
                style={{ width: `${clamp(progress.pct, 0, 100)}%` }}
              />
            </div>

            <img
              className="sageWalkOnBar"
              src="/assets/sage_walk.png"
              alt="sage walking"
              style={{ left: `${sageX}px` }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          <div className="progressPct">{progress.pct}%</div>
        </div>

        {/* Add task */}
        <div className="todoBox" style={{ marginTop: 12 }}>
          <div className="row" style={{ gap: 10 }}>
            <input
              value={text}
              placeholder="Add a task…"
              onChange={(e) => setText(e.target.value)}
              style={{
                flex: 1,
                height: 56,
                borderRadius: 16,
                border: "1px solid rgba(0,0,0,0.12)",
                padding: "0 14px",
                fontSize: 16
              }}
            />
            <button className="btn" onClick={onAdd} style={{ height: 56, borderRadius: 16 }}>
              Add
            </button>
          </div>
        </div>

        {/* Scrollable ToDo list */}
        <div className="panelScroll" style={{ marginTop: 12 }}>
          <div className="list">
            {todo.map((t) => {
              const isSageHere = effectiveSageTaskId === t.id;

              return (
                <div className="taskItem" key={t.id}>
                  <div className="taskLeft">
                    <button
                      className="iconBtn"
                      onClick={() => handleToggle(t.id)}
                      title="Mark as done"
                    >
                      <img src="/assets/clover_green.png" alt="clover" />
                    </button>

                    <div className="taskText">{t.text}</div>
                  </div>

                  {/* “read sage” zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropSage(t.id)}
                    style={{
                      width: 170,
                      height: 64,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 16,
                      border: "1px dashed rgba(0,0,0,0.18)",
                      background: isSageHere ? "rgba(0,0,0,0.04)" : "transparent"
                    }}
                    title="Set current task"
                  >
                    {isSageHere ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img
                          src="/assets/sage_read.png"
                          alt="sage reading"
                          style={{ height: 48 }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <span
                          className="mini"
                          style={{ fontSize: 13, fontWeight: 800, color: "#333" }}
                        >
                          I’m working on
                        </span>
                      </div>
                    ) : (
                      <span className="mini" style={{ fontSize: 13, fontWeight: 800 }}>
                        Set as current
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* If no TODO tasks, keep read-sage visible */}
            {todo.length === 0 && (
              <div className="taskItem">
                <div className="taskLeft">
                  <div style={{ width: 64, height: 64 }} />
                  <div className="taskText" style={{ opacity: 0.75 }}>
                    No active task
                  </div>
                </div>

                <div
                  style={{
                    width: 170,
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 16,
                    border: "1px dashed rgba(0,0,0,0.18)",
                    background: "rgba(0,0,0,0.04)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img
                      src="/assets/sage_read.png"
                      alt="sage reading"
                      style={{ height: 48 }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <span
                      className="mini"
                      style={{ fontSize: 13, fontWeight: 800, color: "#333" }}
                    >
                      I’m working on
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== BOTTOM: Done (scroll list) ===== */}
      <div className="panelBox" style={{ flex: 4, minHeight: 0 }}>
        <div className="panelHeader">
          <div className="sectionTitle" style={{ fontSize: 28 }}>
            Good job
          </div>
        </div>

        <div className="divider" />

        <div className="panelScroll">
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

                {/* placeholder for flower drag target later */}
                <div style={{ width: 96, height: 64 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
