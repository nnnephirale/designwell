import { useState } from "react";
import { Ctl, DemoShell, Seg, Slider } from "./ui";

/* ---------- 2 · concentric radius ---------- */

export function ConcentricRadiusDemo() {
  const [innerR, setInnerR] = useState(12);
  const [pad, setPad] = useState(10);
  const [concentric, setConcentric] = useState(true);
  const outerR = concentric ? innerR + pad : innerR;
  return (
    <DemoShell
      controls={
        <>
          <Ctl label="corners">
            <Seg
              value={concentric ? "concentric" : "same"}
              onChange={(v) => setConcentric(v === "concentric")}
              options={[
                { value: "same", label: "same radius" },
                { value: "concentric", label: "concentric" },
              ]}
            />
          </Ctl>
          <Ctl label="radius">
            <Slider min={4} max={24} value={innerR} onChange={setInnerR} />
          </Ctl>
          <Ctl label="padding">
            <Slider min={4} max={24} value={pad} onChange={setPad} />
          </Ctl>
        </>
      }
    >
      <div className="conc-outer" style={{ padding: pad, borderRadius: outerR }}>
        <div className="conc-inner" style={{ borderRadius: innerR }} />
      </div>
      <div className="conc-formula">
        outer <b>{outerR}px</b> {concentric ? "=" : "≠"} inner <b>{innerR}px</b> + padding{" "}
        <b>{pad}px</b>
      </div>
    </DemoShell>
  );
}

/* ---------- 9 · optical alignment ---------- */

export function OpticalDemo() {
  const [optical, setOptical] = useState(false);
  const [guides, setGuides] = useState(true);
  return (
    <DemoShell
      controls={
        <>
          <Ctl label="alignment">
            <Seg
              value={optical ? "optical" : "geometric"}
              onChange={(v) => setOptical(v === "optical")}
              options={[
                { value: "geometric", label: "geometric" },
                { value: "optical", label: "optical" },
              ]}
            />
          </Ctl>
          <label className="demo-ctl" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={guides}
              onChange={(e) => setGuides(e.target.checked)}
            />
            <span className="microcaps">guides</span>
          </label>
        </>
      }
    >
      <div>
        <div className={`opt-btn ${guides ? "opt-guides" : ""}`}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
            style={{ transform: optical ? "translateX(1.5px)" : "translateX(0)" }}
          >
            <path d="M6.5 4.5v11l9-5.5z" />
          </svg>
        </div>
        <div className="demo-tag">play</div>
      </div>
      <div>
        <div className={`opt-btn ${guides ? "opt-guides" : ""}`}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: optical ? "translateY(1px)" : "translateY(0)" }}
          >
            <path d="M5 12.5 10 7.5l5 5" />
          </svg>
        </div>
        <div className="demo-tag">chevron</div>
      </div>
      <span className="demo-note" style={{ maxWidth: 200 }}>
        the triangle's mass sits behind its centroid — mathematically centred, it drifts left
      </span>
    </DemoShell>
  );
}

/* ---------- 10 · shadows vs borders ---------- */

export function ShadowsDemo() {
  const [busy, setBusy] = useState(false);
  return (
    <DemoShell
      controls={
        <Ctl label="background">
          <Seg
            value={busy ? "busy" : "plain"}
            onChange={(v) => setBusy(v === "busy")}
            options={[
              { value: "plain", label: "plain" },
              { value: "busy", label: "patterned" },
            ]}
          />
        </Ctl>
      }
    >
      <div className={`shvb-bg ${busy ? "busy" : ""}`}>
        <div className="shvb-card bordered">
          <h6>Border</h6>
          <p>An opaque line — identical on every background.</p>
        </div>
        <div className="demo-tag">border: 1px solid</div>
      </div>
      <div className={`shvb-bg ${busy ? "busy" : ""}`}>
        <div className="shvb-card shadowed">
          <h6>Shadow ring</h6>
          <p>Translucent — it lets the background through. Hover me.</p>
        </div>
        <div className="demo-tag">layered box-shadow</div>
      </div>
    </DemoShell>
  );
}

/* ---------- 11 · image outline ---------- */

const SKY_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="220"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfdfc"/><stop offset=".55" stop-color="#f2efe8"/><stop offset="1" stop-color="#e4ded1"/></linearGradient></defs><rect width="340" height="220" fill="url(#s)"/><ellipse cx="80" cy="60" rx="46" ry="16" fill="#fff" opacity=".85"/><ellipse cx="240" cy="44" rx="60" ry="18" fill="#fff" opacity=".7"/><path d="M0 170 Q90 130 180 160 T340 150 V220 H0 Z" fill="#d8d2c2"/><path d="M0 190 Q110 160 220 185 T340 180 V220 H0 Z" fill="#c9c2af"/></svg>`
)}`;

const DUSK_IMG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="220"><defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3833"/><stop offset=".6" stop-color="#6b5f52"/><stop offset="1" stop-color="#a08a70"/></linearGradient></defs><rect width="340" height="220" fill="url(#d)"/><circle cx="250" cy="70" r="26" fill="#f4e9d4" opacity=".9"/><path d="M0 175 Q80 145 170 168 T340 158 V220 H0 Z" fill="#2e2b26"/></svg>`
)}`;

export function ImageOutlineDemo() {
  const [outlined, setOutlined] = useState(true);
  return (
    <DemoShell
      controls={
        <Ctl label="outline">
          <Seg
            value={outlined ? "on" : "off"}
            onChange={(v) => setOutlined(v === "on")}
            options={[
              { value: "off", label: "off" },
              { value: "on", label: "1px · 10%" },
            ]}
          />
        </Ctl>
      }
    >
      <div>
        <img src={SKY_IMG} alt="light sky" className={`imgo ${outlined ? "outlined" : ""}`} />
        <div className="demo-tag">light edges</div>
      </div>
      <div>
        <img src={DUSK_IMG} alt="dusk" className={`imgo ${outlined ? "outlined" : ""}`} />
        <div className="demo-tag">dark edges</div>
      </div>
    </DemoShell>
  );
}
