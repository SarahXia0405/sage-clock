// frontend/src/app.tsx
import React, { useEffect, useRef, useState } from "react";
import type { AppState, Progress } from "./types";
import LeftTodoPanel from "./components/LeftTodoPanel";
import RightTimerPanel from "./components/RightTimerPanel";
import AlarmSound from "./components/AlarmSound";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/**
 * ✅ Pure-frontend default state
 * - Removes dependency on /api/state for Vercel static hosting
 * - Panels can still update state locally via onState()
 *
 * If your types differ slightly, adjust fields to match ./types.ts
 */
function makeDefaultState(): AppState {
  const now = Date.now();

  return {
    // @ts-expect-error: If your AppState has additional required fields,
    // fill them in here according to ./types.ts
    timer: {
      mode: "work",
      running: false,
      remaining_sec: 25 * 60,
      duration_sec: 25 * 60,
      started_at_ms: null,
      updated_at_ms: now
    },
    // @ts-expect-error: If your state schema differs, adapt to your actual shape
    tasks: [],
    // @ts-expect-error
    flowers: [],
    // @ts-expect-error
    meta: {
      created_at_ms: now
    }
  };
}

function makeDefaultProgress(): Progress {
  return { total: 0, done: 0, pct: 0 };
}

export default function App() {
  // ✅ No longer null: do not block UI behind Loading...
  const [state, setState] = useState<AppState>(() => makeDefaultState());
  const [progress, setProgress] = useState<Progress>(() => makeDefaultProgress());

  // ===== Split sizing (percentage) =====
  const [leftPct, setLeftPct] = useState(58); // default 58%
  const draggingRef = useRef(false);
  const pageRef = useRef<HTMLDivElement | null>(null);

  // ===== Alarm src (session-local) =====
  const DEFAULT_ALARM = "/assets/alarm.mp3";
  const [alarmSrc, setAlarmSrc] = useState<string>(DEFAULT_ALARM);
  const prevBlobUrlRef = useRef<string | null>(null);

  // trigger key for AlarmSound
  const [alarmKey, setAlarmKey] = useState(0);
  const lastRemainingRef = useRef<number | null>(null);

  /**
   * ✅ Alarm edge detection stays purely local:
   * Panels update state.timer.remaining_sec; we detect >0 -> 0 transitions.
   */
  useEffect(() => {
    const nextRemaining = state?.timer?.remaining_sec ?? 0;
    const prevRemaining = lastRemainingRef.current;

    if (prevRemaining !== null && prevRemaining > 0 && nextRemaining <= 0) {
      setAlarmKey((k) => k + 1);
    }
    lastRemainingRef.current = nextRemaining;
  }, [state?.timer?.remaining_sec]);

  // cleanup blob URL on unmount / src change
  useEffect(() => {
    const isBlob = alarmSrc.startsWith("blob:");
    if (isBlob) {
      if (prevBlobUrlRef.current && prevBlobUrlRef.current !== alarmSrc) {
        try {
          URL.revokeObjectURL(prevBlobUrlRef.current);
        } catch {}
      }
      prevBlobUrlRef.current = alarmSrc;
    } else {
      if (prevBlobUrlRef.current) {
        try {
          URL.revokeObjectURL(prevBlobUrlRef.current);
        } catch {}
        prevBlobUrlRef.current = null;
      }
    }

    return () => {
      if (prevBlobUrlRef.current) {
        try {
          URL.revokeObjectURL(prevBlobUrlRef.current);
        } catch {}
        prevBlobUrlRef.current = null;
      }
    };
  }, [alarmSrc]);

  // ===== Drag handlers for resizer =====
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const page = pageRef.current;
      if (!page) return;

      const rect = page.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      setLeftPct(clamp(pct, 35, 75));
    };

    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const onDownHandle = () => {
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div className="page" ref={pageRef}>
      {/* hidden audio player */}
      <AlarmSound src={alarmSrc} playKey={alarmKey} />

      <div className="left" style={{ flexBasis: `${leftPct}%` }}>
        <LeftTodoPanel
          state={state}
          progress={progress}
          onState={setState}
          onProgress={setProgress}
        />
      </div>

      {/* draggable splitter */}
      <div
        className="splitHandle"
        onPointerDown={onDownHandle}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        tabIndex={0}
      />

      <div className="right" style={{ flexBasis: `${100 - leftPct}%` }}>
        <RightTimerPanel
          state={state}
          onState={setState}
          alarmSrc={alarmSrc}
          onAlarmSrc={setAlarmSrc}
          defaultAlarmSrc={DEFAULT_ALARM}
          onTestAlarm={() => setAlarmKey((k) => k + 1)}
        />
      </div>
    </div>
  );
}
