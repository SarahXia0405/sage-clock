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
  // ✅ user ideas（存 localStorage，避免刷新丢）
  const [userIdeas, setUserIdeas] = useState<string[]>([]);
  const [input, setInput] = useState("");

  // ✅ 合并随机池：默认 + 用户
  const ideaPool = useMemo(() => {
    // 过滤空、去重（大小写不敏感）
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

  const [idea, setIdea] = useState(() => pickRandom(DEFAULT_REST_IDEAS));

  // ✅ “施法”状态（替代 diceShake）
  const [casting, setCasting] = useState(false);

  // 载入 user ideas
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

  // 每次打开：初始化随机 idea + 可触发换番茄
  useEffect(() => {
    if (!open) return;
    setIdea(pickRandom(ideaPool.length ? ideaPool : DEFAULT_REST_IDEAS));
    onRequestNewTomato?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const castSpell = () => {
    if (casting) return;
    setCasting(true);

    window.setTimeout(() => {
      setIdea(pickRandom(ideaPool.length ? ideaPool : DEFAULT_REST_IDEAS));
      setCasting(false);
    }, 520);
  };

  const onAdd = () => {
    const v = input.trim();
    if (!v) return;

    const exists = userIdeas.some((x) => x.trim().toLowerCase() === v.toLowerCase());
    if (exists) {
      setInput("");
      return;
    }

    persistUserIdeas([v, ...userIdeas]);
    setInput("");
  };

  const onClear = () => {
    persistUserIdeas([]);
    setInput("");
  };

  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") onAdd();
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

        {/* ✅ 上半区：左 idea 框（高度= sage） + 右 sage 施法按钮 */}
        <div className="restModalBodyV2">
          <div className="restIdeaBoxV2" aria-live="polite">
            {idea}
          </div>

          <button
            type="button"
            className="sageBtn"
            onClick={castSpell}
            aria-label="Cast spell to get a new idea"
          >
            <img
              className="sageImg"
              src={casting ? "/assets/sage_magic_2.png" : "/assets/sage_magic_1.png"}
              alt="sage"
              draggable={false}
            />

            {/* ✅ 光点效果：施法时显示 */}
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

        {/* ✅ 左下角：User idea（图三），加入随机池 */}
        <div className="userIdeaRow">
          <input
            className="userIdeaInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Have your own idea?"
            aria-label="Your rest idea"
          />

          <div className="userIdeaActions">
            <button type="button" className="userIdeaBtn" onClick={onClear}>
              CLEAR
            </button>
            <button type="button" className="userIdeaBtn" onClick={onAdd}>
              ADD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
