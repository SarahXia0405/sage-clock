import React, { useEffect, useMemo, useState } from "react";

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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
  "5-min brain dump: write everything on your mind.",
  "Make the workspace ‘ready’ for the next work block.",
  "Do 1-minute mindfulness: notice 5 things you see.",
  "Prepare the next task materials (open docs, tabs).",
  "Quick gratitude: write 3 small wins today."
];

export default function RestIdeasModal({
  open,
  onClose,
  tomatoSrc,
  onRequestNewTomato
}: {
  open: boolean;
  onClose: () => void;
  tomatoSrc: string;
  onRequestNewTomato?: () => void;
}) {
  const [idea, setIdea] = useState(
    DEFAULT_REST_IDEAS[randInt(0, DEFAULT_REST_IDEAS.length - 1)]
  );
  const [diceShake, setDiceShake] = useState(false);

  // 每次打开，初始化一条 idea（并可触发换番茄）
  useEffect(() => {
    if (!open) return;
    setIdea(DEFAULT_REST_IDEAS[randInt(0, DEFAULT_REST_IDEAS.length - 1)]);
    onRequestNewTomato?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onRoll = () => {
    if (diceShake) return;
    setDiceShake(true);
    window.setTimeout(() => {
      setIdea(DEFAULT_REST_IDEAS[randInt(0, DEFAULT_REST_IDEAS.length - 1)]);
      setDiceShake(false);
    }, 420);
  };

  if (!open) return null;

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modalClose" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="restModalHeader">
          <img className="restModalTomato" src={tomatoSrc} alt="rest tomato" draggable={false} />
          <div className="restModalTitle">Things to do during rest</div>
        </div>

        <div className="restModalBody">
          <div className="restIdeaBox">{idea}</div>

          {/* 用你现有的 dice_3d.png（不需要 dice.png） */}
          <button className="diceBtn" type="button" onClick={onRoll} aria-label="Roll">
            <img
              src="/assets/dice_3d.png"
              alt="dice"
              className={diceShake ? "diceShake" : ""}
              draggable={false}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
