import React, { useEffect, useMemo, useState } from "react";

const DEFAULT_REST_IDEAS: string[] = [
  "Pick a color and find 10 matching objects nearby.",
  "Do a 60-second silent walk (no phone).",
  "Write 3 tiny wins from today (even small ones).",
  "Shoulder + neck reset: 10 rolls + 5 circles each side.",
  "Hydration quest: drink a full glass, then refill.",
  "Desk mini-game: put exactly 10 things back in place.",
  "Eye spa: look far 30s, blink slowly 10x.",
  "Choose one: 20 jumping jacks / 10 squats / 30s wall sit.",
  "Make next block easy: open the doc + tabs you’ll need.",
  "One-sentence plan: ‘When I return, I will ___’",
  "Breathing: 4s in, 6s out × 8 rounds.",
  "Music reset: one song, just listen (no scrolling).",
  "5-min brain dump: write everything on your mind.",
  "Mindfulness: 5 see / 4 feel / 3 hear / 2 smell / 1 taste.",
  "Stretch hands: finger pulls + wrist circles 30s each.",
  "Quick tidy: only the space within arm’s reach.",
  "Compliment yourself: write one line you’d tell a friend.",
  "Fresh air: open window or stand outside for 1 minute.",
  "Make tea / wash fruit (only if it stays under 5 min).",
  "Posture check: feet flat, jaw unclench, long exhale."
];

function randPick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function RestIdeasModal({
  open,
  onClose,
  tomatoSrc,
  onRequestNewTomato,
  ideas = DEFAULT_REST_IDEAS
}: {
  open: boolean;
  onClose: () => void;
  tomatoSrc: string;
  onRequestNewTomato: () => void;
  ideas?: string[];
}) {
  const [idea, setIdea] = useState<string>("");
  const [rolling, setRolling] = useState(false);

  const initial = useMemo(() => randPick(ideas), [ideas]);

  useEffect(() => {
    if (!open) return;
    setIdea(initial);
    setRolling(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const roll = () => {
    if (rolling) return;
    setRolling(true);

    // 短动画结束后再出结果
    window.setTimeout(() => {
      setIdea(randPick(ideas));
      onRequestNewTomato();
      setRolling(false);
    }, 350);
  };

  if (!open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modalClose" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="modalHeader">
          <div className="modalTomato">
            <img
              src={tomatoSrc}
              alt="rest tomato"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>

          <div className="modalTitle">Things to do during rest</div>
        </div>

        <div className="modalBody">
          <div className="modalIdeaBox">
            <div className="modalIdeaText">{idea || "Roll for a rest idea."}</div>
          </div>

          <button className={`diceBtn ${rolling ? "rolling" : ""}`} onClick={roll} title="Roll">
            <img
              src="/assets/dice.png"
              alt="dice"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="diceFallback">🎲</span>
          </button>
        </div>
      </div>
    </div>
  );
}
