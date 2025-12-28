// frontend/src/components/RightTimerPanel.tsx
import React, { useMemo, useState, useCallback } from "react";
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

// If your Left panel drag uses a different payload, change this:
const FLOWER_DRAG_KEY = "flower_ready";

export default function RightTimerPanel({
  state,
  onState
}: {
  state: AppState;
  onState: (s: AppState) => void;
}) {
  const [workMin, setWorkMin] = useState(25);
  const [restMin, setRestMin] = useState(5);

  // work: 1..6, rest: 1..5
  const [workFrame, setWorkFrame] = useState<number>(() => randInt(1, 6));
  const [restFrame, setRestFrame] = useState<number>(() => randInt(1, 5));

  // ✅ modal state + modal tomato frame (1..5)
  const [restModalOpen, setRestModalOpen] = useState(false);
  const [modalRestFrame, setModalRestFrame] = useState<number>(() => randInt(1, 5));

  // ✅ Garden state (session-local)
  const [gardenFlowers, setGardenFlowers] = useState<Array<{ id: string; at: number }>>([]);

  // Optional: visual hint when dragging flower over sage scene
  const [dragOverSage, setDragOverSage] = useState(false);

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
    // restMin still UI-only (kept)
  };

  const onStart = async () => {
    setWorkFrame(randInt(1, 6));
    setRestFrame(randInt(1, 5));
    await timerControl("start");
  };

  const openRestModal = () => {
    if (!isRest) return;
    setModalRestFrame(randInt(1, 5)); // 每次打开随机一个番茄
    setRestModalOpen(true);
  };

  // ===== Flower drop onto sage scene =====
  const handleDragOverSage = useCallback((e: React.DragEvent) => {
    // allow drop
    e.preventDefault();
    if (!dragOverSage) setDragOverSage(true);
  }, [dragOverSage]);

  const handleDragLeaveSage = useCallback(() => {
    setDragOverSage(false);
  }, []);

  const handleDropOnSage = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSage(false);

    const payload =
      e.dataTransfer.getData("text/plain") ||
      e.dataTransfer.getData("application/x-flower") ||
      "";

    // Accept either exact key, or a JSON-like payload containing it
    const ok =
      payload === FLOWER_DRAG_KEY ||
      payload.includes(FLOWER_DRAG_KEY);

    if (!ok) return;

    // Add one flower into garden
    setGardenFlowers((prev) => [
      ...prev,
      { id: `f_${Date.now()}_${Math.random().toString(16).slice(2)}`, at: Date.now() }
    ]);

    // Tell Left panel to reset growth (simple event; Left can listen if you want)
    window.dispatchEvent(new CustomEvent("flower:used"));
  }, []);

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
        {/* ✅ 不加背景：纯 img，可点区域就是图片本身 */}
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
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
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

      {/* ===== Scene (sage + real-time clock) ===== */}
      <div className="scene">
        <div className="mini" style={{ marginBottom: 8 }}>
          Scene · Drop your grown flower onto sage to plant it
        </div>

        {/* ✅ 固定 sceneStage 缩放基准，避免 panel 拉伸导致钟不同步 */}
        <div
          className={`sceneStage ${dragOverSage ? "sceneStageDropActive" : ""}`}
          style={{
            maxWidth: 560,
            margin: "0 auto",
            position: "relative"
          }}
          onDragOver={handleDragOverSage}
          onDragLeave={handleDragLeaveSage}
          onDrop={handleDropOnSage}
          title="Drop flower here to plant"
        >
          <img
            className="sceneImg"
            src="/assets/scene_sage.png"
            alt="scene"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              objectFit: "contain"
            }}
            draggable={false}
          />

          <AnalogClock
            className="sageHeldClock"
            size={104}
            style={{
              position: "absolute",
              left: "52%",
              top: "58%",
              transform: "translate(-50%, -50%)",
              zIndex: 10,
              pointerEvents: "none"
            }}
          />
        </div>
      </div>

      {/* ===== Garden (below sage) ===== */}
      <div className="gardenStage">
        <div className="gardenBg">
          <img
            src="/assets/garden.png"
            alt="garden"
            draggable={false}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
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

      {/* ✅ 真正弹窗：居中覆盖（你已有独立组件） */}
      <RestIdeasModal
        open={restModalOpen}
        onClose={() => setRestModalOpen(false)}
        tomatoSrc={`/assets/rest_${modalRestFrame}.png`}
        onRequestNewTomato={() => setModalRestFrame(randInt(1, 5))}
      />
    </div>
  );
}
