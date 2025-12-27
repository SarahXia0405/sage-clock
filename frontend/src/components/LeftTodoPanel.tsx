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

  const sageLeftPx = useMemo(() => {
    // Put sage_walk on progress bar track: 0%-> near left, 100%-> near right
    const track = 520; // rough px; optional refine with refs
    const x = 160 + (track * progress.pct) / 100;
    return x;
  }, [progress.pct]);

  const currentSageTaskId = state.sage_task_id || (todo[0]?.id ?? null);

  const onAdd = async () => {
    const v = text.trim();
    if (!v) return;
    const res = await createTask(v);
    setText("");
    // refresh from server quickly by fetching /state is okay, but we’ll patch minimally:
    // simplest: reload page state via window fetch in outer polling; so no-op here.
  };

  const handleToggle = async (id: string) => {
    await toggleDone(id);
    // outer poll will refresh. If you want instant: call /state fetch in parent.
  };

  const handleDropSage = async (taskId: string) => {
    await setSage(taskId);
  };

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="sectionTitle">To-Do List</div>
        <div style={{ fontWeight: 900, fontSize: 22 }}>{progress.pct}%</div>
      </div>

      <div className="divider" />

      {/* Progress bar area with sage_walk */}
      <div className="progressWrap" style={{ position: "relative" }}>
        <ProgressBar pct={progress.pct} />
        <img
          className="sageWalk"
          src="/assets/sage_walk.png"
          alt="sage walking"
          style={{ left: `${sageLeftPx}px` }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      <div className="todoBox" style={{ marginTop: 12 }}>
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

        <div className="list">
          {todo.map((t) => {
            const isSageHere = currentSageTaskId === t.id;
            return (
              <div className="taskItem" key={t.id}>
                <div className="taskLeft">
                  {/* clover toggle */}
                  <button className="iconBtn" onClick={() => handleToggle(t.id)} title="Mark as done">
                    <img src="/assets/clover_green.png" alt="clover" />
                  </button>

                  <div className="taskText">{t.text}</div>
                  <div className="line" />
                </div>

                {/* Drop zone for sage_read */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropSage(t.id)}
                  style={{
                    width: 82,
                    height: 54,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 14,
                    border: "1px dashed rgba(0,0,0,0.18)",
                    background: isSageHere ? "rgba(0,0,0,0.04)" : "transparent"
                  }}
                  title="Drag sage here"
                >
                  {isSageHere ? (
                    <img
                      src="/assets/sage_read.png"
                      alt="sage reading"
                      style={{ height: 44 }}
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
        </div>

        <div className="divider" style={{ marginTop: 18 }} />

        <div className="sectionTitle" style={{ fontSize: 28 }}>
          Good job
        </div>

        <div className="list" style={{ marginTop: 12 }}>
          {done.map((t) => (
            <div className="taskItem" key={t.id}>
              <div className="taskLeft">
                <button
                  className="iconBtn"
                  onClick={() => handleToggle(t.id)}
                  title="Completed"
                >
                  <img src="/assets/clover_gold.png" alt="gold clover" />
                </button>
        
                <div className="taskText" style={{ opacity: 0.78 }}>
                  {t.text}
                </div>
              </div>
        
              {/* placeholder for flower drag target later */}
              <div style={{ width: 82, height: 54 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
