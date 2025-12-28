import React, { useEffect, useMemo, useState } from "react";
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

const LS_PLANTED_RIGHT = "potato_clock_planted_right_v1";

export default function RightTimerPanel({
  state,
  onState
}: {
  state: AppState;
  onState: (s: AppState) => void;
}) {
  const [workMin, setWorkMin] = useState(25);
  const [restMin, setRestMin] = useState(5);

  const [workFrame, setWorkFrame] = useState<number>(() => randInt(1, 6));
  const [restFrame, setRestFrame] = useState<number>(() => randInt(1, 5));

  // planted flower in right scene (persist)
  const [planted, setPlanted] = useState<boolean>(() => {
    return localStorage.getItem(LS_PLANTED_RIGHT) === "1";
  });

  useEffect(() => {
    localStorage.setItem(LS_PLANTED_RIGHT, planted ? "1" : "0");
  }, [planted]);

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
    // restMin still UI-only
  };

  const onStart = async () => {
    setWorkFrame(randInt(1, 6));
    setRestFrame(randInt(1, 5));
    await timerControl("start");
  };

  const onSceneDragOver = (e: React.DragEvent) => {
    // allow drop
    e.preventDefault();
  };

  const onSceneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const payload = e.dataTransfer.getData("text/plain");
    if (payload === "flower:ready") {
      setPlanted(true);
    }
  };

  return (
    <div>
      <div className="topControls">
        <button className="btn secondary" onClick={onApply}>Set</button>

        {!state.timer.running ? (
          <button className="btn" onClick={onStart}>Start</button>
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
          style={{ width: 90, height: 90, objectFit: "contain", cursor: mode === "rest" ? "pointer" : "default" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
          // 你后面要点番茄弹窗就在这里挂 onClick（仅 rest 时）
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

        {/* Drop target is EXACTLY the red-box sage area */}
        <div className="sceneStage" onDragOver={onSceneDragOver} onDrop={onSceneDrop}>
          <img className="sceneImg" src="/assets/scene_sage.png" alt="scene" />

          <AnalogClock
            className="sageHeldClock"
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

          {/* Planted flower on sage's right side */}
          {planted ? (
            <img
              src="/assets/flow_5.png"
              alt="planted flower"
              className="plantedFlower"
              draggable={false}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
