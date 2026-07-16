import { useEffect, useRef, useState } from "react";
import { Ctl, DemoShell, Seg, Slider } from "./ui";

/* ---------- 1 · text wrapping ---------- */

type WrapMode = "wrap" | "balance" | "pretty";

export function TextWrapDemo() {
  const [mode, setMode] = useState<WrapMode>("balance");
  const [width, setWidth] = useState(300);
  return (
    <DemoShell
      controls={
        <>
          <Ctl label="mode">
            <Seg
              value={mode}
              onChange={setMode}
              options={[
                { value: "wrap", label: "wrap" },
                { value: "balance", label: "balance" },
                { value: "pretty", label: "pretty" },
              ]}
            />
          </Ctl>
          <Ctl label="width">
            <Slider min={220} max={420} value={width} onChange={setWidth} />
          </Ctl>
        </>
      }
    >
      <div className="twrap-box" style={{ width }}>
        <h4 style={{ textWrap: mode === "wrap" ? "wrap" : mode }}>
          Details that make an interface feel considered
        </h4>
        <p style={{ textWrap: mode === "pretty" ? "pretty" : "wrap" }}>
          Line breaks are layout too. Balanced titles keep their visual weight
          centred, and paragraphs that refuse to strand a final word read as one
          quiet, deliberate object.
        </p>
      </div>
    </DemoShell>
  );
}

/* ---------- 4 · font smoothing ---------- */

export function FontSmoothingDemo() {
  return (
    <DemoShell
      controls={
        <span className="demo-note">
          grayscale antialiasing is a macOS/WebKit behavior — on other platforms both
          cards may render identically
        </span>
      }
    >
      <div>
        <div className="smooth-card smooth-sub">
          <h5>Subpixel rendering</h5>
          <p>Default on macOS. Slightly heavier strokes, softer edges — bolder than the design file.</p>
        </div>
        <div className="demo-tag">default</div>
      </div>
      <div>
        <div className="smooth-card smooth-aa">
          <h5>Grayscale antialiasing</h5>
          <p>-webkit-font-smoothing: antialiased. Thinner, crisper — what you saw in Figma.</p>
        </div>
        <div className="demo-tag">antialiased</div>
      </div>
    </DemoShell>
  );
}

/* ---------- 5 · tabular numbers ---------- */

function useTicker() {
  const [ms, setMs] = useState(0);
  const start = useRef(performance.now());
  useEffect(() => {
    let raf: number;
    const tick = (t: number) => {
      setMs(t - start.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const totalS = ms / 1000;
  const m = Math.floor(totalS / 60);
  const s = Math.floor(totalS % 60);
  const d = Math.floor((totalS % 1) * 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${d}`;
}

export function TabularNumsDemo() {
  const time = useTicker();
  return (
    <DemoShell>
      <div>
        <div className="tnum-timer">{time}</div>
        <div className="demo-tag">proportional</div>
      </div>
      <div>
        <div className="tnum-timer tabular">{time}</div>
        <div className="demo-tag">tabular-nums</div>
      </div>
    </DemoShell>
  );
}
