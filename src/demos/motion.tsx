import { useRef, useState } from "react";
import { Ctl, DemoShell, Replay, Seg, useReplay } from "./ui";

/* ---------- 3 · contextual icon swap ---------- */

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="5.5" y="5.5" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M10.5 3.5v-.5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8.5 6.5 12 13 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SwapButton({ animated }: { animated: boolean }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trigger = () => {
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1400);
  };
  return (
    <button
      className={`iswap-btn ${animated ? "iswap-anim" : "iswap-instant"}`}
      onClick={trigger}
      aria-label="copy"
    >
      <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", transition: animated ? "opacity .28s var(--ease), transform .28s var(--ease), filter .28s var(--ease)" : "none", opacity: copied ? 0 : 1, transform: copied ? "scale(.55)" : "scale(1)", filter: copied ? "blur(3px)" : "blur(0)" }}>
        <CopyIcon />
      </span>
      <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", transition: animated ? "opacity .28s var(--ease), transform .28s var(--ease), filter .28s var(--ease)" : "none", opacity: copied ? 1 : 0, transform: copied ? "scale(1)" : "scale(.55)", filter: copied ? "blur(0)" : "blur(3px)" }}>
        <CheckIcon />
      </span>
    </button>
  );
}

export function IconSwapDemo() {
  return (
    <DemoShell>
      <div>
        <SwapButton animated={false} />
        <div className="demo-tag">instant</div>
      </div>
      <div>
        <SwapButton animated />
        <div className="demo-tag">transitioned</div>
      </div>
    </DemoShell>
  );
}

/* ---------- 6 · interruptible ---------- */

export function InterruptibleDemo() {
  const [right, setRight] = useState(false);
  const [kfState, setKfState] = useState<"" | "kf-right" | "kf-left">("");
  const toggle = () => {
    setRight((r) => !r);
    setKfState(right ? "kf-left" : "kf-right");
  };
  return (
    <DemoShell
      controls={
        <>
          <button className="btn" onClick={toggle}>
            toggle — try spamming it
          </button>
          <span className="demo-note">the transition retargets mid-flight; the keyframes restart from zero</span>
        </>
      }
    >
      <div>
        <div className="intr-track">
          <div className={`intr-ball transition ${right ? "right" : ""}`} />
        </div>
        <div className="demo-tag">css transition</div>
      </div>
      <div>
        <div className="intr-track">
          <div className={`intr-ball ${kfState}`} key={kfState + String(right)} />
        </div>
        <div className="demo-tag">css keyframes</div>
      </div>
    </DemoShell>
  );
}

/* ---------- 7 · stagger ---------- */

type StagMode = "block" | "sections" | "words";

function StagPage({ mode }: { mode: StagMode }) {
  const words = ["Design", "is", "in", "the", "details"];
  const asBlock = mode === "block";
  const step = mode === "words" ? "80ms" : "100ms";
  let i = 0;
  const nxt = () => (asBlock ? 0 : ++i);
  return (
    <div
      className="stag-page"
      data-animate={asBlock ? true : undefined}
      style={{ ["--stagger-step" as string]: step }}
    >
      <div className="stag-title">
        {mode === "words"
          ? words.map((w, wi) => (
              <span key={wi} data-animate style={{ ["--stagger" as string]: wi }}>
                {w}
              </span>
            ))
          : (
              <span data-animate={!asBlock || undefined} style={{ ["--stagger" as string]: nxt() }}>
                Design is in the details
              </span>
            )}
      </div>
      <div data-animate={!asBlock || undefined} style={{ ["--stagger" as string]: mode === "words" ? 5 : nxt() }}>
        <div className="stag-line" style={{ width: "100%" }} />
        <div className="stag-line" style={{ width: "82%" }} />
        <div className="stag-line" style={{ width: "64%" }} />
      </div>
      <div
        className="stag-chiprow"
        data-animate={!asBlock || undefined}
        style={{ ["--stagger" as string]: mode === "words" ? 6 : nxt() }}
      >
        <div className="stag-chip" />
        <div className="stag-chip" />
        <div className="stag-chip" />
      </div>
    </div>
  );
}

export function StaggerDemo() {
  const [mode, setMode] = useState<StagMode>("sections");
  const [key, replay] = useReplay();
  return (
    <DemoShell
      controls={
        <>
          <Ctl label="split">
            <Seg
              value={mode}
              onChange={(m) => {
                setMode(m);
                replay();
              }}
              options={[
                { value: "block", label: "block" },
                { value: "sections", label: "sections" },
                { value: "words", label: "words" },
              ]}
            />
          </Ctl>
          <Replay onClick={replay} />
        </>
      }
    >
      <StagPage key={key} mode={mode} />
    </DemoShell>
  );
}

/* ---------- 8 · subtle exits ---------- */

const EXIT_LABELS = ["Draft saved", "Link copied", "File uploaded"];

function ExitList({ quiet }: { quiet: boolean }) {
  const [items, setItems] = useState(EXIT_LABELS);
  const [leaving, setLeaving] = useState<string | null>(null);
  const dismiss = (label: string) => {
    if (leaving) return;
    setLeaving(label);
    setTimeout(() => {
      setItems((list) => list.filter((x) => x !== label));
      setLeaving(null);
    }, 430);
  };
  return (
    <div>
      <div className="exit-list">
        {items.map((label) => (
          <div
            key={label}
            className={`exit-item ${
              leaving === label ? (quiet ? "leaving-quiet" : "leaving-loud") : ""
            }`}
          >
            <span className="dot" />
            {label}
            <button onClick={() => dismiss(label)} aria-label="dismiss">
              ×
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <button className="demo-replay" onClick={() => setItems(EXIT_LABELS)}>
            reset list
          </button>
        )}
      </div>
      <div className="demo-tag">{quiet ? "opacity + blur" : "slide out"}</div>
    </div>
  );
}

export function ExitDemo() {
  return (
    <DemoShell>
      <ExitList quiet={false} />
      <ExitList quiet />
    </DemoShell>
  );
}
