import React, { useEffect, useRef } from "react";

type Props = {
  /** Audio source URL. Can be "/assets/alarm.mp3" or a blob: URL */
  src: string;

  /** Increment this key to trigger playback once */
  playKey: number;

  /** Optional: volume 0..1 */
  volume?: number;
};

export default function AlarmSound({ src, playKey, volume = 1 }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSrcRef = useRef<string>("");

  // Keep <audio> element in sync with src
  useEffect(() => {
    if (!audioRef.current) return;
    if (lastSrcRef.current === src) return;
    lastSrcRef.current = src;
    audioRef.current.src = src;
    // don't auto-play on src change
  }, [src]);

  // Play once when playKey changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    // Best-effort: allow replay even if last sound still "loading"
    a.pause();
    a.currentTime = 0;
    a.volume = Math.max(0, Math.min(1, volume));

    const p = a.play();
    if (p && typeof (p as any).catch === "function") {
      (p as Promise<void>).catch(() => {
        // Autoplay policies may block if user hasn't interacted yet.
        // We silently ignore; after any click (Start/Pause/etc.) it will work.
      });
    }
  }, [playKey, volume]);

  return <audio ref={audioRef} preload="auto" />;
}
