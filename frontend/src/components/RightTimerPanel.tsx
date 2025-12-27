import React, { useMemo, useState } from "react";
import type { AppState } from "../types";
import { timerControl, timerSet } from "../api";
import ClockNow from "./ClockNow";

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function RightTimerPanel({
  state,
  onState
}: {
  state: AppState;
  onState: (s: AppState) => void;
}) {
  const [workMin, setWorkMin] = useState(25);
  const [restMin, setRestMin] = useState(5);

  const remaining = state.timer.remaining_sec;
  const mode = state.timer.mode;

  const digits = useMemo(() => {
    const [m, s] = fmt(remaining).split(":");
    return [m[0], m[1], s[0], s[1]];
  }, [remaining]);

  const tomatoSrc = useMemo(() => {
    // simplest: just two frames; later you can map remaining ratio to work_1..work_n
    if (mode === "work") return "/assets/work_1.png";
    return "/assets/rest_1.png";
  }, [mode]);

  const bindTask = state.sage_task_id || state.timer.bound_task_id || null;

  const onApply = async () => {
    await timerSet("work", workMin, bindTask);
    // rest duration is handled client-side by skip or end-of-work; later we can store restMin too
  };

  return (
    <div>
      <div className="topControls">
        <button className="btn secondary" onClick={onApply}>Set</button>
        {!state.timer.running ? (
          <button className="btn" onClick={() => timerControl("start")}>Start</button>
        ) : (
          <button className="btn" onClick={() => timerControl("pause")}>Pause</button>
        )}
        <button className="btn secondary" onClick={() => timerControl("skip")}>Skip</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontWeight: 900 }}>Work</span>
          <input
            type="number"
            value={workMin}
            min={1}
            onChange={(e) => setWorkMin(Number(e.target.value))}
            style={{ width: 80, height: 40, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", padding: "0 10px" }}
          />
          <span className="mini">min</span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontWeight: 900 }}>Rest</span>
          <input
            type="number"
            value={restMin}
            min={1}
            onChange={(e) => setRestMin(Number(e.target.value))}
            style={{ width: 80, height: 40, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", padding: "0 10px" }}
          />
          <span className="mini">min</span>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16 }}>
        {/* tomato */}
        <img
          src={tomatoSrc}
          alt="tomato"
          style={{ width: 90, height: 90, objectFit: "contain" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />

        {/* digits */}
        <div className="timerDigits">
          <div className="digitBox">{digits[0]}</div>
          <div className="digitBox">{digits[1]}</div>
          <div style={{ fontSize: 40, fontWeight: 900 }}>:</div>
          <div className="digitBox">{digits[2]}</div>
          <div className="digitBox">{digits[3]}</div>
        </div>
      </div>

      {/* scene area */}
      <div className="scene">
        <div className="mini" style={{ marginBottom: 8 }}>
          Scene · Real-time clock is shown in bottom-right
        </div>

        <img
          src="/assets/scene_sage.png"
          alt="scene"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />

        <ClockNow />
      </div>
    </div>
  );
}
