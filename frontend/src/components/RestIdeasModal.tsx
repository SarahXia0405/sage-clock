import React, { useMemo, useState } from "react";

const DEFAULT_REST_IDEAS: string[] = [
  "Stand up and stretch your shoulders + neck.",
  "Drink water — a full glass.",
  "Do 10 slow deep breaths (4s in, 6s out).",
  "Look outside / far away for 30 seconds (eye reset).",
  "Tidy one tiny area: desk corner or one drawer.",
  "Write 1 sentence: what’s the next smallest step?",
  "Walk to another room and back (no phone).",
  "Quick wrist + hand stretches.",
  "Put on a song and just listen (no scrolling).",
  "Wash your face / apply lip balm.",
  "Refill your water bottle.",
  "Do 10 bodyweight squats or calf raises.",
  "Open a window (or step outside) for fresh air.",
  "Send a kind message to someone (one line).",
  "Check posture: feet flat, shoulders relaxed, jaw unclenched.",
  "5-minute brain dump: list anything on your mind.",
  "Make the workspace ‘ready’ for the next work block.",
  "Do 1-minute mindfulness: notice 5 things you see.",
  "Prepare the next task materials (open docs, tabs).",
  "Quick gratitude: write 3 small wins today."
];

function randPick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function RestIdeasModal({
  open,
  onClose,
  ideas = DEFAULT_REST_IDEAS
}: {
  open: boolean;
  onClose: () => void;
  ideas?: string[];
}) {
  const [idea, setIdea] = useState<string>("");

  const firstIdea = useMemo(() => randPick(ideas), [ideas]);

  // When opened first time, show a default suggestion (nice UX)
  React.useEffect(() => {
    if (open) setIdea(firstIdea);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onRoll = () => {
    setIdea(randPick(ideas));
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
              src="/assets/rest_1.png"
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
                // fallback if user hasn't uploaded dice yet
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
