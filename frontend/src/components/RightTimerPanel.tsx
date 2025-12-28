import React, { useMemo, useState, useCallback, useRef } from "react";
import type { AppState } from "../types";
import { timerControl, timerSet } from "../api";
import AnalogClock from "./AnalogClock";
import RestIdeasModal from "./RestIdeasModal";

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const FLOWER_DRAG_KEY = "flower_ready";

export default function RightTimerPanel({
  state,
  onState,
  alarmSrc,
  onAlarmSrc,
  defaultAlarmSrc,
  onTestAlarm
}: {
  state: AppState;
  onState: (s: AppState) => void;

  // alarm (session-local)
  alarmSrc: string;
  onAlarmSrc: (src: string) => void;
  defaultAlarmSrc: string;
  onTestAlarm: () => void;
}) {
  const [workMin, setWorkMin] = useState(25);
  const [restMin, setRestMin] = useState(5);

  // work: 1..6, rest: 1..5
  const [workFrame, setWorkFrame] = useState<number>(() => randInt(1, 6));
  const [restFrame, setRestFrame] = useState<number>(() => randInt(1, 5));

  // modal state + modal tomato frame (1..5)
  const [restModalOpen, setRestModalOpen] = useState(false);
  const [modalRestFrame, setModalRestFrame] = useState<number>(() => randInt(1, 5));

  // Garden (session-local)
  const [gardenFlowers, setGardenFlowers] = useState<Array<{ id: string; at: number }>>([]);
  const [dragOverSage, setDragOverSage] = useState(false);

  // alarm upload
  const fileRef = useRef<HTMLInputElement | null>(null);

  const remaining = state.timer.remaining_sec;
  const mode = state.timer.mode; // "work" | "rest"
  const isRest = mode === "rest";

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

  const openRestModal = () => {
    if (!isRest) return;
    setModalRestFrame(randInt(1, 5));
    setRestModalOpen(true);
  };

  // ===== Drop flower on sage =====
  const onDragOverSage = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSage(true);
  }, []);

  const onDragLeaveSage = useCallback(() => {
    setDragOverSage(false);
  }, []);

  const onDropOnSage = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSage(false);

    const payload = e.dataTransfer.getData("text/plain");
    if (payload !== FLOWER_DRAG_KEY) return;

    setGardenFlowers((prev) => [
      ...prev,
      { id: `g_${Date.now()}_${Math.random().toString(16).slice(2)}`, at: Date.now() }
    ]);

    window.dispatchEvent(new CustomEvent("flower:used"));
  }, []);

  // ===== Alarm upload handlers =====
  const onPickAlarm = () => fileRef.current?.click();

  const onAlarmFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.type.startsWith("audio/")) {
      e.target.value = "";
      return;
    }

    const url = URL.createObjectURL(f);
    onAlarmSrc(url);

    // allow picking same file again later
    e.target.value = "";
  };

  const onResetAlarm = () => onAlarmSrc(defaultAlarmSrc);

  return (
    <div>
      {/* ===== Top row: Timer controls + Alarm controls aligned ===== */}
      <div className="topControls alarmRow">
        <div className="timerControls">
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

        <div className="alarmControls">
          <span className="alarmLabel">Alarm:</span>

          {/* hidden file input lives here so Upload always works */}
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            style={{ display: "none" }}
            onChange={onAlarmFileChange}
          />

          <button type="button" onClick={onPickAlarm} className="btn secondary">
            Upload
          </button>

          <button type="button" onClick={onTestAlarm} className="btn secondary">
            Test
          </button>

          <button type="button" onClick={onResetAlarm} className="btn secondary">
            Reset
          </button>
        </div>
      </div>

      {/* ===== Work/Rest inputs ===== */}
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

      {/* ===== Tomato + digits ===== */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16 }}>
        <img
          src={tomatoSrc}
          alt="tomato"
          className={isRest ? "restTomatoClickable" : ""}
          onClick={openRestModal}
          style={{
            width: 90,
            height: 90,
            objectFit: "contain",
            cursor: isRest ? "pointer" : "default"
          }}
          draggable={false}
          title={isRest ? "Click for a rest idea" : ""}
        />

        <div className="timerDigits">
          <div className="digitBox">{digits[0]}</div>
          <div className="digitBox">{digits[1]}</div>
          <div style={{ fontSize: 40, fontWeight: 900 }}>:</div>
          <div className="digitBox">{digits[2]}</div>
          <div className="digitBox">{digits[3]}</div>
        </div>
      </div>

      {/* ===== Scene ===== */}
      <div className="scene">
        <div className="mini" style={{ marginBottom: 8 }}>
          Scene · Drop your flower onto sage to plant
        </div>

        <div
          className={`sceneStage ${dragOverSage ? "sceneStageDropActive" : ""}`}
          style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}
          onDragOver={onDragOverSage}
          onDragLeave={onDragLeaveSage}
          onDrop={onDropOnSage}
          title="Drop flower here"
        >
          <img
            className="sceneImg"
            src="/assets/scene_sage.png"
            alt="scene"
            style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
            draggable={false}
          />

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

      {/* ===== Garden ===== */}
      <div className="gardenStage">
        <div className="gardenBg">
          <img src="/assets/garden.png" alt="garden" draggable={false} />
        </div>

        <div className="gardenFlowers">
          {gardenFlowers.map((f) => (
            <img
              key={f.id}
              src="/assets/flow_5.png"
              className="gardenFlower"
              draggable={false}
              alt="flower"
              title={new Date(f.at).toLocaleString()}
            />
          ))}
        </div>
      </div>

      {/* ===== Rest modal ===== */}
      <RestIdeasModal
        open={restModalOpen}
        onClose={() => setRestModalOpen(false)}
        tomatoSrc={`/assets/rest_${modalRestFrame}.png`}
        onRequestNewTomato={() => setModalRestFrame(randInt(1, 5))}
      />
    </div>
  );
}
