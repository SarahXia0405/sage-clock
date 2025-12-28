import React, { useMemo, useState } from "react";

export const DEFAULT_REST_IDEAS: string[] = [
  "Pick a color and find 10 things that match it around you.",
  "Do a 60-second ‘silent walk’ — no phone, just walk and breathe.",
  "Make a tiny ‘victory list’: write 3 things you already did today.",
  "Roll your shoulders 10x + neck circles 5x each side.",
  "Hydration quest: drink a full glass, then refill your bottle.",
  "Desk reset: clear exactly 10 items (stop at 10).",
  "Eye spa: look at something far away for 30s, then blink slowly 10x.",
  "Do 20 jumping jacks OR 10 squats OR 30s wall sit (pick one).",
  "Set a 5-min ‘mini tidy’: only the surface you can touch while seated.",
  "Make the next work block easy: open the exact doc + tabs you need.",
  "Write one sentence: ‘When I return, I will…’ (the next smallest step).",
  "‘Posture check’: feet flat, shoulders down, jaw unclenched, exhale.",
  "Quick hand care: stretch fingers, rotate wrists, shake hands loose.",
  "Random kindness: send a 1-line message to someone you like.",
  "Breathing game: 4 seconds in, 6 seconds out × 8 rounds.",
  "Snack prep: wash a fruit / make tea (only if it’s actually quick).",
  "Music reset: play one song, just listen (no scrolling).",
  "5-minute brain dump: write everything on your mind, no judging.",
  "Micro-meditation: notice 5 things you see, 4 feel, 3 hear, 2 smell, 1 taste.",
  "Stand up and do a ‘reach the ceiling’ stretch for 20 seconds × 2."
];

function randPick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function RestIdeasModal({
  open,
  onClose,
  ideas = DEFAULT_REST_IDEAS,
  tomatoSrc,
  onRollTomato
}: {
  open: boolean;
  onClose: () => void;
  ideas?: string[];
  tomatoSrc: string;
  onRollTomato: () => void;
}) {
  const [idea, setIdea] = useState<string>("");

  const firstIdea = useMemo(() => randPick(ideas), [ideas]);

  React.useEffect(() => {
    if (open) setIdea(firstIdea);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onRoll = () => {
    setIdea(randPick(ideas));
    onRollTomato(); // ✅骰子同时换番茄
  };

  if (!open) return null;

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <button className="modalClose" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="modalHeader">
          <div className="modalTomato">
            <img
              src={tomatoSrc}
              alt="rest tomato"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          <div className="modalTitle">Things to do during rest</div>
        </div>

        <div className="modalBody">
          <div className="modalIdeaBox">
            <div className="modalIdeaText">{idea || "Roll for a rest idea."}</div>
          </div>

          <button className="diceBtn" onClick={onRoll} title="Roll a new idea">
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
