import React from "react";

export default function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="progressBar" aria-label="progress">
      <div className="progressFill" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}
