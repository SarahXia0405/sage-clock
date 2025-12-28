import React, { useEffect, useRef, useState } from "react";
import { fetchState } from "./api";
import type { AppState, Progress } from "./types";
import LeftTodoPanel from "./components/LeftTodoPanel";
import RightTimerPanel from "./components/RightTimerPanel";

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

  // poll state for timer + UI sync
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await fetchState();
        if (!alive) return;
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
        <RightTimerPanel state={state} onState={setState} />
      </div>
    </div>
  );
}
