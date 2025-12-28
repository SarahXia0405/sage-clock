// frontend/src/components/RestIdeasModal.tsx
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

const USER_IDEAS_KEY = "sage_clock_user_rest_ideas_v1";

function pickRandom(pool: string[]) {
  if (!pool.length) return "";
  return pool[randInt(0, pool.length - 1)];
}

function sanitizeIdea(raw: string): { ok: boolean; value: string } {
  let v = (raw ?? "").trim().replace(/\s+/g, " ");
  if (v.length < 4) return { ok: false, value: "" };
  if (/https?:\/\/|www\./i.test(v)) return { ok: false, value: "" };
  const letters = v.match(/[A-Za-z]/g) ?? [];
  if (letters.length === 0) return { ok: false, value: "" };
  if (/^(.)\1{4,}$/.test(v.replace(/\s/g, ""))) return { ok: false, value: "" };

  const onlyLettersSpaces = /^[A-Za-z\s]+$/.test(v);
  if (onlyLettersSpaces) {
    const vowelCount = (v.match(/[aeiou]/gi) ?? []).length;
    if (vowelCount < 2) return { ok: false, value: "" };
  }

  v = v.charAt(0).toUpperCase() + v.slice(1);
  return { ok: true, value: v };
}

export default function RestIdeasModal({
  open,
  onClose,
  tomatoSrc
}: {
  open: boolean;
  onClose: () => void;
  tomatoSrc: string; // ✅ fixed: use same tomato as timer page
}) {
  const [userIdeas, setUserIdeas] = useState<string[]>([]);

  // ✅ LOCKED: idea 只在组件首次创建时决定一次；之后永远不自动变
  const [idea, setIdea] = useState(() => pickRandom(DEFAULT_REST_IDEAS));

  const [casting, setCasting] = useState(false);

  // Secondary idea modal
  const [ideaModalOpen, setIdeaModalOpen] = useState(false);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");

  const ideaPool = useMemo(() => {
    const seen = new Set<string>();
    const merged: string[] = [];
    const add = (s: string) => {
      const v = (s ?? "").trim();
      if (!v) return;
      const k = v.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      merged.push(v);
    };
    DEFAULT_REST_IDEAS.forEach(add);
    userIdeas.forEach(add);
    return merged;
  }, [userIdeas]);

  // Load user ideas once (does NOT change idea)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_IDEAS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setUserIdeas(arr.filter((x) => typeof x === "string"));
      }
    } catch {
      // ignore
    }
  }, []);

  const persistUserIdeas = (next: string[]) => {
    setUserIdeas(next);
    try {
      localStorage.setItem(USER_IDEAS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // ✅ ONLY CHANGE idea here
  const castSpell = () => {
    if (casting) return;
    setCasting(true);
    window.setTimeout(() => {
      setIdea(pickRandom(ideaPool.length ? ideaPool : DEFAULT_REST_IDEAS));
      setCasting(false);
    }, 520);
  };

  const openIdeaModal = () => {
    setIdeaModalOpen(true);
    setInputError("");
    window.requestAnimationFrame(() => {
      const el = document.getElementById("userIdeaModalInput") as HTMLInputElement | null;
      el?.focus();
    });
  };

  const closeIdeaModal = () => setIdeaModalOpen(false);

  const onAdd = () => {
    const cleaned = sanitizeIdea(input);
    if (!cleaned.ok) {
      setInputError("Please enter a real rest idea (a short phrase or sentence).");
      return;
    }
    const v = cleaned.value;

    const exists = userIdeas.some((x) => x.trim().toLowerCase() === v.toLowerCase());
    if (!exists) persistUserIdeas([v, ...userIdeas]);

    setInput("");
    setInputError("");
    setIdeaModalOpen(false);
  };

  const onClear = () => {
    persistUserIdeas([]);
    setInput("");
    setInputError("");
  };

  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") onAdd();
    if (e.key === "Escape") closeIdeaModal();
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

        <div className="restModalBodyV2">
          <div className="restIdeaBoxV2" aria-live="polite">
            {idea}
          </div>

          <button type="button" className="sageBtn" onClick={castSpell} aria-label="Cast spell">
            <img
              className="sageImg"
              src={casting ? "/assets/sage_magic_2.png" : "/assets/sage_magic_1.png"}
              alt="sage"
              draggable={false}
            />
            <span className={casting ? "sparkles sparklesOn" : "sparkles"} aria-hidden="true">
              <i className="sp sp1" />
              <i className="sp sp2" />
              <i className="sp sp3" />
              <i className="sp sp4" />
              <i className="sp sp5" />
              <i className="sp sp6" />
              <i className="sp sp7" />
              <i className="sp sp8" />
            </span>
          </button>
        </div>

        <div className="userIdeaTriggerRow">
          <button
            type="button"
            className="userIdeaTrigger userIdeaTip"
            onClick={openIdeaModal}
            aria-label="Open idea modal"
          >
            <span className="ideaEmoji" aria-hidden="true">
              💡
            </span>
            <span className="userIdeaTriggerText">Have your own idea?</span>
          </button>
        </div>

        {ideaModalOpen && (
          <div className="ideaModalOverlay" onMouseDown={closeIdeaModal}>
            <div className="ideaModalCard" onMouseDown={(e) => e.stopPropagation()}>
              <button className="ideaModalClose" onClick={closeIdeaModal} aria-label="Close">
                ×
              </button>

              <div className="ideaModalHeader">
                <img
                  className="ideaModalIcon"
                  src="/assets/sage_idea.png"
                  alt="sage idea"
                  draggable={false}
                />
              </div>

              <div className="ideaModalBody">
                <input
                  id="userIdeaModalInput"
                  className="userIdeaInput"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (inputError) setInputError("");
                  }}
                  onKeyDown={onInputKeyDown}
                  placeholder="Type your rest idea…"
                  aria-label="Your rest idea"
                />

                {inputError ? <div className="userIdeaError">{inputError}</div> : null}

                <div className="userIdeaActions">
                  <button type="button" className="userIdeaBtn" onClick={onClear}>
                    CLEAR
                  </button>
                  <button type="button" className="userIdeaBtn" onClick={onAdd}>
                    ADD
                  </button>
                </div>

                <div className="userIdeaHint" aria-hidden="true">
                  Your ideas: {userIdeas.length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
