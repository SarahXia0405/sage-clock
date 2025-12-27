import React, { useEffect, useMemo, useState } from "react";
import { fetchState } from "./api";
import type { AppState, Progress } from "./types";
import LeftTodoPanel from "./components/LeftTodoPanel";
import RightTimerPanel from "./components/RightTimerPanel";

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [progress, setProgress] = useState<Progress>({ total: 0, done: 0, pct: 0 });

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

  if (!state) {
    return <div style={{ padding: 18 }}>Loading…</div>;
  }

  return (
    <div className="page">
      <div className="left">
        <LeftTodoPanel state={state} progress={progress} onState={setState} onProgress={setProgress} />
      </div>
      <div className="right">
        <RightTimerPanel state={state} onState={setState} />
      </div>
    </div>
  );
}
