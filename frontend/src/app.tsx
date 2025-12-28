import React, { useEffect, useRef, useState } from "react";
import { fetchState } from "./api";
import type { AppState, Progress } from "./types";
import LeftTodoPanel from "./components/LeftTodoPanel";
import RightTimerPanel from "./components/RightTimerPanel";
import AlarmSound from "./components/AlarmSound";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [progress, setProgress] = useState<Progress>({ total: 0, done: 0, pct: 0 });

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

  // poll state for timer + UI sync
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetchState();
        if (!alive) return;

        // detect "hit 0" edge: >0 -> 0
        const nextRemaining = res.state?.timer?.remaining_sec ?? 0;
        const prevRemaining = lastRemainingRef.current;

        if (prevRemaining !== null && prevRemaining > 0 && nextRemaining <= 0) {
          setAlarmKey((k) => k + 1);
        }
        lastRemainingRef.current = nextRemaining;

        setState(res.state);
        setProgress(res.progress);
      } catch (e) {
        // ignore transient
      }
    };

    load();
    const t = setInterval(load, 1000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // cleanup blob URL on unmount / src change
  useEffect(() => {
    // if current src is a blob: URL, track it; if src switches away, revoke old blob
    const isBlob = alarmSrc.startsWith("blob:");
    if (isBlob) {
      // revoke previous blob if it exists and differs
      if (prevBlobUrlRef.current && prevBlobUrlRef.current !== alarmSrc) {
        try {
          URL.revokeObjectURL(prevBlobUrlRef.current);
        } catch {}
      }
      prevBlobUrlRef.current = alarmSrc;
    } else {
      // switching to default/non-blob: revoke any previous blob
      if (prevBlobUrlRef.current) {
        try {
          URL.revokeObjectURL(prevBlobUrlRef.current);
        } catch {}
        prevBlobUrlRef.current = null;
      }
    }

    return () => {
      // on unmount: revoke last blob
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

      // keep both sides usable
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

  if (!state) {
    return <div style={{ padding: 18 }}>Loading…</div>;
  }

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
