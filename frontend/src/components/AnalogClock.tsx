import React, { useEffect, useMemo, useState } from "react";

export default function AnalogClock({
  size = 92,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const { hourDeg, minDeg, secDeg } = useMemo(() => {
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();

    // smooth hour hand by minutes
    const hour = (h + m / 60) * 30; // 360/12
    const minute = (m + s / 60) * 6; // 360/60
    const second = s * 6;

    return { hourDeg: hour, minDeg: minute, secDeg: second };
  }, [now]);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#111",
        position: "relative",
        boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
      }}
      aria-label="Real-time clock"
    >
      {/* numbers */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.12)",
        }}
      />
      {Array.from({ length: 12 }).map((_, i) => {
        const n = i + 1;
        const angle = (n * 30 - 90) * (Math.PI / 180);
        const r = size * 0.38;
        const x = size / 2 + Math.cos(angle) * r;
        const y = size / 2 + Math.sin(angle) * r;

        return (
          <div
            key={n}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              color: "#fff",
              fontWeight: 900,
              fontSize: Math.max(10, Math.floor(size * 0.12)),
              opacity: 0.95,
              userSelect: "none",
            }}
          >
            {n}
          </div>
        );
      })}

      {/* hands */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size * 0.04,
          height: size * 0.26,
          background: "#fff",
          borderRadius: 999,
          transformOrigin: "50% 90%",
          transform: `translate(-50%, -90%) rotate(${hourDeg}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size * 0.03,
          height: size * 0.34,
          background: "#fff",
          borderRadius: 999,
          transformOrigin: "50% 90%",
          transform: `translate(-50%, -90%) rotate(${minDeg}deg)`,
          opacity: 0.92,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size * 0.02,
          height: size * 0.38,
          background: "#f5a623", // 秒针（橙色）
          borderRadius: 999,
          transformOrigin: "50% 90%",
          transform: `translate(-50%, -90%) rotate(${secDeg}deg)`,
        }}
      />

      {/* center cap */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: size * 0.08,
          height: size * 0.08,
          borderRadius: "50%",
          background: "#fff",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
