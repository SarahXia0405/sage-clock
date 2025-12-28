import React, { useMemo, useState } from "react";
import type { AppState } from "../types";
import { timerControl, timerSet } from "../api";
import AnalogClock from "./AnalogClock";

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function RightTimerPanel({
  state
}: {
  state: AppState;
  onState: (s: AppState) => void;
}) {
  const [workMin, setWorkMin] = useState(25);
  const [restMin, setRestMin] = useState(5);

  const [workFrame, setWorkFrame] = useState<number>(() => randInt(1, 6));
  const [restFrame, setRestFrame] = useState<number>(() => randInt(1, 5));

  // SESSION ONLY
  const [planted, setPlanted] = useState(false);

  const remaining = state.timer.remaining_sec;
  const mode = state.timer.mode;

  const digits = useMemo(() => {
    const [m, s] = fmt(remaining).split(":");
    return [m[0], m[1], s[0], s[1]];
  }, [remaining]);

  const tomatoSrc = useMemo(() => {
    if (mode === "work") return `/assets/work_${workFrame}.png`;
    return `/assets/rest_${restFrame}.png`;
  }, [mode, workFrame, restFrame]);

  const bindTask = state.sage_task_id || state.timer.bound_task_id || null;

  const onApply = async () => {
    await timerSet("work", workMin, bindTask);
  };

  const onStart = async () => {
    setWorkFrame(randInt(1, 6));
    setRestFrame(randInt(1, 5));
    await timerControl("start");
  };

  return (
    <div>
      <div className="topControls">
        <button className="btn secondary" onClick={onApply}>
          Set
        </button>

        {!state.timer.running ? (
          <button className="btn" onClick={onStart}>
            Start
          </button>
        ) : (
          <button className="btn" onClick={() => timerControl("pause")}>
            Pause
          </button>
        )}

        <button className="btn secondary" onClick={() => timerControl("skip")}>
          Skip
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontWeight: 900 }}>Work</span>
          <input
            type="number"
            value={workMin}
            min={1}
            onChange={(e) => setWorkMin(Number(e.target.value))}
            style={{
              width: 80,
              height: 40,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              padding: "0 10px"
            }}
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
            style={{
              width: 80,
              height: 40,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              padding: "0 10px"
            }}
          />
          <span className="mini">min</span>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16 }}>
        <img
          src={tomatoSrc}
          alt="tomato"
          style={{ width: 90, height: 90, objectFit: "contain" }}
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          draggable={false}
        />

        <div className="timerDigits">
          <div className="digitBox">{digits[0]}</div>
          <div className="digitBox">{digits[1]}</div>
          <div style={{ fontSize: 40, fontWeight: 900 }}>:</div>
          <div className="digitBox">{digits[2]}</div>
          <div className="digitBox">{digits[3]}</div>
        </div>
      </div>

      <div className="scene">
        <div className="mini" style={{ marginBottom: 8 }}>
          Scene · Drop your flower onto the sage to plant
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            overflow: "hidden",
            borderRadius: 18
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const v = e.dataTransfer.getData("text/plain");
            if (v === "flower_ready") setPlanted(true);
          }}
        >
          <img
            src="/assets/scene_sage.png"
            alt="scene"
            draggable={false}
            style={{ width: "100%", height: "auto", display: "block" }}
          />

          {/* Clock on sage’s held clock (lock by inline style, avoid CSS conflicts) */}
          <AnalogClock
            size={104}
            style={{
              position: "absolute",
              left: "52%",
              top: "70%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              pointerEvents: "none"
            }}
          />

          {/* Planted flower should be SMALL (same as left) */}
          {planted && (
            <img
              src="/assets/flow_5.png"
              alt="planted"
              draggable={false}
              style={{
                position: "absolute",
                left: "74%",
                top: "68%",
                transform: "translate(-50%, -50%)",
                height: 56,
                width: "auto",
                objectFit: "contain",
                zIndex: 12,
                pointerEvents: "none"
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
