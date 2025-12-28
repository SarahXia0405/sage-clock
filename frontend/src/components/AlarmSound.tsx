import React, { useEffect, useRef } from "react";

export default function AlarmSound({
  trigger,
  src = "/assets/alarm.mp3",
  volume = 0.9
}: {
  trigger: number;     // 每次需要响铃就 +1
  src?: string;
  volume?: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (trigger <= 0) return;

    // 首次创建
    if (!audioRef.current) {
      const a = new Audio(src);
      a.preload = "auto";
      a.volume = volume;
      audioRef.current = a;
    }

    const a = audioRef.current;

    // 重新从头播放
    try {
      a.pause();
      a.currentTime = 0;
    } catch {}

    // play() 可能被浏览器阻止（未发生用户交互时）
    a.play().catch(() => {
      // 静默失败即可；通常用户点过 Start 后就允许播放了
    });
  }, [trigger, src, volume]);

  return null;
}
