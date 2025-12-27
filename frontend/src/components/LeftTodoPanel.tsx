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

  /**
   * ===== 1) Progress bar sage-walk positioning =====
   * We anchor the walk-sage to the end of the fill.
   * Use a ref on the track wrap to get exact width.
   */
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [sageX, setSageX] = useState(0);

  useLayoutEffect(() => {
    const update = () => {
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const w = rect.width;

      // End of fill: pct% of track width
      const pct = clamp(progress.pct, 0, 100);
      const x = (w * pct) / 100;

      setSageX(x);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [progress.pct]);

  /**
   * ===== 2) Read-sage should always exist =====
   * - Preferred target: state.sage_task_id if it's still in TODO
   * - Otherwise fallback to first TODO
   * - If no TODO tasks => show placeholder
   */
  const todoIds = useMemo(() => new Set(todo.map((t) => t.id)), [todo]);
  const effectiveSageTaskId = useMemo(() => {
    const desired = state.sage_task_id ?? null;
    if (desired && todoIds.has(desired)) return desired;
    return todo[0]?.id ?? null;
  }, [state.sage_task_id, todoIds, todo]);

  // If current sage task is no longer valid, gently sync backend to the fallback (so timer binding follows)
  useLayoutEffect(() => {
    const desired = state.sage_task_id ?? null;
    if (desired && todoIds.has(desired)) return; // ok
    const fallback = todo[0]?.id ?? null;
    if (!fallback) return; // no todo -> don't spam backend
    if (fallback === desired) return;
    // fire-and-forget (parent polling will refresh)
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
    <div className="card">
      {/* Header */}
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="sectionTitle">To-Do List</div>
      </div>

      <div className="divider" />

      {/* ===== Progress row: match your screenshot ===== */}
      <div className="progressRow">
        <div className="progressTrackWrap" ref={trackRef}>
          <div className="progressBar" aria-label="progress">
            <div
              className="progressFill"
              style={{ width: `${clamp(progress.pct, 0, 100)}%` }}
            />
          </div>

          {/* walk sage sits on bar and follows fill end */}
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

        {/* percent on the right of the bar */}
        <div className="progressPct">{progress.pct}%</div>
      </div>

      {/* Input */}
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

        {/* ===== TODO list ===== */}
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

                {/* Drop zone for sage_read (always show, either image or "Drop") */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropSage(t.id)}
                  style={{
                    width: 96,
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 16,
                    border: "1px dashed rgba(0,0,0,0.18)",
                    background: isSageHere ? "rgba(0,0,0,0.04)" : "transparent"
                  }}
                  title="Drop sage here"
                >
                  {isSageHere ? (
                    <img
                      src="/assets/sage_read.png"
                      alt="sage reading"
                      style={{ height: 48 }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="mini">Drop</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* If no TODO tasks, keep read-sage visible in a placeholder row */}
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
                  width: 96,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 16,
                  border: "1px dashed rgba(0,0,0,0.18)",
                  background: "rgba(0,0,0,0.04)"
                }}
              >
                <img
                  src="/assets/sage_read.png"
                  alt="sage reading"
                  style={{ height: 48 }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="divider" style={{ marginTop: 18 }} />

        {/* ===== Done ===== */}
        <div className="sectionTitle" style={{ fontSize: 28 }}>
          Good job
        </div>

        <div className="list" style={{ marginTop: 12 }}>
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
  );
}
