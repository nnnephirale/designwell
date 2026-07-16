import { useCallback, useState, type ReactNode } from "react";
import "./demos.css";

export function DemoShell({
  controls,
  children,
  stageStyle,
}: {
  controls?: ReactNode;
  children: ReactNode;
  stageStyle?: React.CSSProperties;
}) {
  return (
    <div className="demo-shell">
      <div className="demo-stage" style={stageStyle}>
        {children}
      </div>
      {controls && <div className="demo-controls">{controls}</div>}
    </div>
  );
}

export function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          className={o.value === value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Ctl({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="demo-ctl">
      <span className="microcaps">{label}</span>
      {children}
    </div>
  );
}

export function Slider({
  min,
  max,
  value,
  onChange,
  suffix = "px",
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <>
      <input
        type="range"
        className="dwd-slider"
        min={min}
        max={max}
        value={value}
        style={{ ["--fill" as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="demo-value">
        {value}
        {suffix}
      </span>
    </>
  );
}

export function Replay({ onClick }: { onClick: () => void }) {
  return (
    <button className="demo-replay" onClick={onClick}>
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path
          d="M10 6a4 4 0 1 1-1.2-2.9M10 1v2.5H7.5"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      replay
    </button>
  );
}

/** remount a subtree to re-run entrance animations */
export function useReplay(): [number, () => void] {
  const [key, setKey] = useState(0);
  const replay = useCallback(() => setKey((k) => k + 1), []);
  return [key, replay];
}
