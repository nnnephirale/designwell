import { useEffect, useRef, useState } from "react";
import { DemoShell } from "./ui";

function useClock() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setS((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function Card({ after, time }: { after: boolean; time: string }) {
  const [copied, setCopied] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copy = () => {
    setCopied(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setCopied(false), 1400);
  };
  const iconStyle = (show: boolean): React.CSSProperties =>
    after
      ? {
          opacity: show ? 1 : 0,
          transform: show ? "scale(1)" : "scale(.55)",
          filter: show ? "blur(0)" : "blur(3px)",
        }
      : { opacity: show ? 1 : 0 };
  return (
    <div>
      <div className={`bfaf-card ${after ? "after" : "before"}`}>
        <h5>A session recording worth sharing with the team</h5>
        <p>
          Every detail on this card is either applied or skipped — corners, edges,
          digits, icon transitions and text wrapping alike.
        </p>
        <div className="bfaf-row">
          <span className="bfaf-timer">{time}</span>
          <button className="bfaf-copy" onClick={copy}>
            <span className="ic">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={iconStyle(!copied)}>
                <path
                  d="M6.5 9.5a3 3 0 0 0 4.4.2l2-2a3 3 0 0 0-4.2-4.2l-1 1"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                <path
                  d="M9.5 6.5a3 3 0 0 0-4.4-.2l-2 2a3 3 0 0 0 4.2 4.2l1-1"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={iconStyle(copied)}>
                <path
                  d="M3 8.5 6.5 12 13 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {copied ? "copied" : "copy link"}
          </button>
        </div>
      </div>
      <div className="demo-tag">{after ? "after" : "before"}</div>
    </div>
  );
}

export function BeforeAfterDemo() {
  const time = useClock();
  return (
    <DemoShell>
      <Card after={false} time={time} />
      <Card after time={time} />
    </DemoShell>
  );
}
