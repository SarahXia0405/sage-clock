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

const DEFAULT_REST_IDEAS: string[] = [
  "Stand up and stretch your shoulders + neck.",
  "Drink water — a full glass.",
  "Do 10 slow deep breaths (4s in, 6s out).",
  "Look outside / far away for 30 seconds (eye reset).",
  "Tidy one tiny area: desk corner or one drawer.",
  "Write 1 sentence: what’s the next smallest step?",
  "Walk to another room and back (no phone).",
  "Quick wrist + hand stretches.",
  "Put on a song and just listen (no scrolling).",
  "Wash your face / apply lip balm.",
  "Refill your water bottle.",
  "Do 10 bodyweight squats or calf raises.",
  "Open a window (or step outside) for fresh air.",
  "Send a kind message to someone (one line).",
  "Check posture: feet flat, shoulders relaxed, jaw unclenched.",
  "5-minute brain dump: write everything on your mind.",
  "Make the workspace ‘ready’ for the next work block.",
  "Do 1-minute mindfulness: notice 5 things you see.",
  "Prepare the next task materials (open docs, tabs).",
  "Quick gratitude: write 3 small wins today."
];

export default function RightTimerPanel({
  state
}: {
  state: AppState;
  onState: (s: AppState) => void;
}) {
  const [workMin, setWorkMin] = useState(25);
  const [restMin, setRestMin] = useState(5);

  // work: 1..6, rest: 1..5
  const [workFrame, setWorkFrame] = useState<number>(() => randInt(1, 6));
  const [restFrame, setRestFrame] = useState<number>(() => randInt(1, 5));

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
    // restMin still UI only
  };

  const onStart = async () => {
    setWorkFrame(randInt(1, 6));
    setRestFrame(randInt(1, 5));
    await timerControl("start");
  };

  // ===== Rest modal =====
  const [restOpen, setRestOpen] = useState(false);
  const [idea, setIdea] = useState(() => DEFAULT_REST_IDEAS[randInt(0, DEFAULT_REST_IDEAS.length - 1)]);
  const [diceShake, setDiceShake] = useState(false);

  const modalTomatoSrc = useMemo(() => `/assets/rest_${randInt(1, 5)}.png`, [restOpen]); // change each open

  const onRoll = () => {
    if (diceShake) return;
    setDiceShake(true);
    window.setTimeout(() => {
      const next = DEFAULT_REST_IDEAS[randInt(0, DEFAULT_REST_IDEAS.length - 1)];
      setIdea(next);
      setDiceShake(false);
    }, 420);
  };

  const canOpenRest = mode === "rest";

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
            style={{ width: 86, height: 44, borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)", padding: "0 12px" }}
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
            style={{ width: 86, height: 44, borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)", padding: "0 12px" }}
          />
          <span className="mini">min</span>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16 }}>
        {/* tomato as button: no background */}
        <button
          className="tomatoBtn"
          type="button"
          onClick={() => { if (canOpenRest) setRestOpen(true); }}
          disabled={!canOpenRest}
          title={canOpenRest ? "Open rest ideas" : "Only available during rest"}
        >
          <img
            src={tomatoSrc}
            alt="tomato"
            style={{ width: 92, height: 92, objectFit: "contain" }}
          />
        </button>

        <div className="timerDigits">
          <div className="digitBox">{digits[0]}</div>
          <div className="digitBox">{digits[1]}</div>
          <div style={{ fontSize: 44, fontWeight: 900 }}>:</div>
          <div className="digitBox">{digits[2]}</div>
          <div className="digitBox">{digits[3]}</div>
        </div>
      </div>

      <div className="scene">
        <div className="mini" style={{ marginBottom: 8 }}>
          Scene · Real-time clock is shown on sage’s clock
        </div>

        <div className="sceneStage">
          <img className="sceneImg" src="/assets/scene_sage.png" alt="scene" />

          {/* Keep your existing placement; tweak left/top if needed */}
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
        </div>
      </div>

      {/* ===== Rest modal ===== */}
      {restOpen && (
        <div className="modalOverlay" onMouseDown={() => setRestOpen(false)}>
          <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
            <button className="modalClose" onClick={() => setRestOpen(false)} aria-label="Close">
              ×
            </button>

            <div className="modalTitleRow">
              <img src={modalTomatoSrc} alt="rest tomato" style={{ width: 130, height: 130, objectFit: "contain" }} />
              <div className="modalTitle">Things to do during rest</div>
            </div>

            <div className="modalIdeaBox">
              {idea}
            </div>

            {/* keep your dice image (no dice.png) */}
            <button className="diceBtn" type="button" onClick={onRoll} aria-label="Roll">
              <img
                src="/assets/dice_3d.png"
                alt="dice"
                className={diceShake ? "diceShake" : ""}
                draggable={false}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
