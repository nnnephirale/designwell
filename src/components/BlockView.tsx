import { useEffect, useMemo, useRef, useState } from "react";
import type { Block, CalloutStyle } from "../types";
import { renderInline } from "../lib/inline";
import { highlight } from "../lib/highlight";
import { DEMO_REGISTRY } from "../demos/registry";
import { Slider } from "../demos/ui";
import "./blocks.css";

/* auto-growing ghost textarea */
function GhostArea({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      className={`ghost ${className ?? ""}`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function CodeBlock({
  block,
  editing,
  onPatch,
}: {
  block: Extract<Block, { type: "code" }>;
  editing: boolean;
  onPatch: (p: Partial<Block>) => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };
  const areaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!editing) return;
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = el.scrollHeight + "px";
  }, [block.code, editing]);
  return (
    <div className="blk-code">
      <div className="code-head">
        {editing ? (
          <input
            className="ghost"
            style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-2)", width: 80 }}
            value={block.lang}
            onChange={(e) => onPatch({ lang: e.target.value })}
          />
        ) : (
          <span className="code-lang">{block.lang || "code"}</span>
        )}
        <button className="code-copy" onClick={copy}>
          {copied ? "copied" : "copy"}
        </button>
      </div>
      {editing ? (
        <textarea
          ref={areaRef}
          className="ghost-code"
          value={block.code}
          spellCheck={false}
          onChange={(e) => onPatch({ code: e.target.value })}
        />
      ) : (
        <pre>{highlight(block.code)}</pre>
      )}
    </div>
  );
}

/* srcdoc iframes have no base URL, so font paths must be absolute */
const FONT_BASE = new URL(`${import.meta.env.BASE_URL}fonts/`, location.href).href;
const CUSTOM_DEMO_BASE = `<style>
  @font-face { font-family:"Cursor Gothic"; src:url("${FONT_BASE}CursorGothic-Regular.woff2") format("woff2"); font-weight:400; font-display:swap; }
  @font-face { font-family:"Cursor Gothic"; src:url("${FONT_BASE}CursorGothic-Bold.woff2") format("woff2"); font-weight:700; font-display:swap; }
  :root { --ease: cubic-bezier(0.16,1,0.3,1); --ink-0:#202020; --ink-1:#646464; --ink-2:#838383; --bg-0:#fcfcfc; }
  html,body { margin:0; }
  body {
    font-family: "Cursor Gothic", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    font-size: 14px; letter-spacing: -0.01em; color: var(--ink-0);
    background: transparent; -webkit-font-smoothing: antialiased;
    display: flex; align-items: center; justify-content: center;
    min-height: 96vh; gap: 20px; flex-wrap: wrap;
  }
</style>`;

function CustomDemo({ block }: { block: Extract<Block, { type: "demo" }> }) {
  const srcdoc = useMemo(() => {
    const base = block.inherit === false ? "" : CUSTOM_DEMO_BASE;
    return `<!doctype html><html><head><meta charset="utf-8">${base}</head><body>${block.html ?? ""}</body></html>`;
  }, [block.html, block.inherit]);
  return (
    <iframe
      title="demo"
      sandbox="allow-scripts"
      srcDoc={srcdoc}
      style={{
        width: "100%",
        height: block.height ?? 240,
        border: "none",
        display: "block",
        background: "#fff",
      }}
    />
  );
}

/* Live embed of the ORIGINAL page, cropped to one region — the answer to
   "reproductions never match the original's finesse". A tall iframe renders the
   real page; the wrapper clips a window `height` tall starting `offsetY` px down.
   `pageW` freezes the embedded page's layout width and scales it to fit our
   column, so a crop calibrated on desktop stays framed on mobile. The frame is
   made taller than the page so the inner document can't scroll and break the
   crop (scroll happens via offsetY, not the page). */
function CroppedFrame({ block }: { block: Extract<Block, { type: "iframe" }> }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(0);
  // many crops of the same heavy page would mean many live instances — mount the
  // iframe only while its window is near the viewport, unmount once it's far
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCw(el.clientWidth));
    ro.observe(el);
    setCw(el.clientWidth);
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), {
      rootMargin: "900px 0px",
    });
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);
  // a cross-origin iframe swallows wheel events — without a shield, scrolling
  // the doc stalls whenever the cursor is over an embed. Click to interact
  // (shield lifts), mouse out to get scroll back. Maps-embed pattern.
  const [interactive, setInteractive] = useState(false);
  const offsetY = block.offsetY ?? 0;
  const winH = block.height ?? 420;
  const scale = block.pageW && cw ? cw / block.pageW : 1;
  return (
    <div
      className="blk-iframe"
      ref={wrapRef}
      style={{ height: Math.round(winH * scale) }}
      onMouseLeave={() => setInteractive(false)}
    >
      {near && (
        <iframe
          title="embed"
          src={block.src}
          scrolling="no"
          allow="clipboard-write; fullscreen"
          style={{
            width: block.pageW ?? "100%",
            height: offsetY + winH + 400,
            border: "none",
            display: "block",
            transform: `scale(${scale}) translateY(${-offsetY}px)`,
            transformOrigin: "0 0",
          }}
        />
      )}
      {near && !interactive && (
        <button className="frame-shield" onClick={() => setInteractive(true)}>
          <span>click to interact</span>
        </button>
      )}
    </div>
  );
}

export function BlockView({
  block,
  editing,
  onPatch,
}: {
  block: Block;
  editing: boolean;
  onPatch: (p: Partial<Block>) => void;
}) {
  switch (block.type) {
    case "heading":
      return editing ? (
        <GhostArea
          className="ghost-heading"
          value={block.text}
          placeholder="Heading"
          onChange={(text) => onPatch({ text })}
        />
      ) : (
        <h3 className="blk-heading">{block.text}</h3>
      );

    case "text":
      return editing ? (
        <GhostArea
          className="ghost-text"
          value={block.text}
          placeholder="Write something — **bold**, *italic*, `code`, [link](url)"
          onChange={(text) => onPatch({ text })}
        />
      ) : (
        <p className="blk-text">{renderInline(block.text)}</p>
      );

    case "code":
      return <CodeBlock block={block} editing={editing} onPatch={onPatch} />;

    case "image":
      return (
        <figure className="blk-image" style={{ margin: 0 }}>
          {block.src ? (
            <img src={block.src} alt={block.alt ?? ""} loading="lazy" />
          ) : (
            <div
              style={{
                borderRadius: 16,
                background: "rgba(0,0,0,.035)",
                padding: "34px 0",
                textAlign: "center",
                fontSize: 11.5,
                color: "var(--ink-3)",
              }}
            >
              paste an image url below
            </div>
          )}
          {editing ? (
            <div className="blk-fieldrow">
              <span className="microcaps">src</span>
              <input
                type="url"
                value={block.src}
                style={{ flex: 1 }}
                placeholder="https://…"
                onChange={(e) => onPatch({ src: e.target.value })}
              />
              <span className="microcaps">caption</span>
              <input
                type="text"
                value={block.caption ?? ""}
                onChange={(e) => onPatch({ caption: e.target.value })}
              />
            </div>
          ) : (
            block.caption && <figcaption className="blk-caption">{block.caption}</figcaption>
          )}
        </figure>
      );

    case "quote":
      return (
        <blockquote className="blk-quote">
          {editing ? (
            <>
              <GhostArea
                value={block.text}
                placeholder="Quote"
                onChange={(text) => onPatch({ text })}
              />
              <div className="blk-fieldrow">
                <span className="microcaps">cite</span>
                <input
                  type="text"
                  value={block.cite ?? ""}
                  onChange={(e) => onPatch({ cite: e.target.value })}
                />
              </div>
            </>
          ) : (
            <>
              {renderInline(block.text)}
              {block.cite && <cite>— {block.cite}</cite>}
            </>
          )}
        </blockquote>
      );

    case "callout":
      return (
        <div className={`blk-callout ${block.style}`}>
          {editing ? (
            <>
              <GhostArea
                value={block.text}
                placeholder="Callout"
                onChange={(text) => onPatch({ text })}
              />
              <div className="blk-fieldrow">
                <span className="microcaps">style</span>
                <div className="seg">
                  {(["soft", "pull", "highlight"] as CalloutStyle[]).map((s) => (
                    <button
                      key={s}
                      className={block.style === s ? "on" : ""}
                      onClick={() => onPatch({ style: s })}
                    >
                      {s === "soft" ? "soft card" : s === "pull" ? "pull quote" : "highlight"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            renderInline(block.text)
          )}
        </div>
      );

    case "demo": {
      const entry = block.demoId ? DEMO_REGISTRY[block.demoId] : undefined;
      return (
        <div>
          {entry ? <entry.Component /> : block.html ? <div className="demo-shell"><CustomDemo block={block} /></div> : null}
          {editing ? (
            <>
              <div className="blk-fieldrow">
                <span className="microcaps">built-in</span>
                <select
                  value={block.demoId ?? ""}
                  onChange={(e) => onPatch({ demoId: e.target.value || undefined })}
                >
                  <option value="">— custom html —</option>
                  {Object.entries(DEMO_REGISTRY).map(([id, d]) => (
                    <option key={id} value={id}>
                      {d.label}
                    </option>
                  ))}
                </select>
                {!block.demoId && (
                  <>
                    <label className="demo-ctl" style={{ cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={block.inherit !== false}
                        onChange={(e) => onPatch({ inherit: e.target.checked })}
                      />
                      <span className="microcaps">inherit site styles</span>
                    </label>
                    <span className="microcaps">height</span>
                    <Slider
                      min={120}
                      max={640}
                      value={block.height ?? 240}
                      onChange={(height) => onPatch({ height })}
                    />
                  </>
                )}
                <span className="microcaps">caption</span>
                <input
                  type="text"
                  value={block.caption ?? ""}
                  onChange={(e) => onPatch({ caption: e.target.value })}
                />
              </div>
              {!block.demoId && (
                <textarea
                  className="demo-src"
                  style={{ marginTop: 8 }}
                  placeholder="<div>custom demo html + <style> + <script></div>"
                  value={block.html ?? ""}
                  spellCheck={false}
                  onChange={(e) => onPatch({ html: e.target.value })}
                />
              )}
            </>
          ) : (
            block.caption && <div className="blk-caption">{block.caption}</div>
          )}
        </div>
      );
    }

    case "iframe":
      return (
        <div>
          {block.src ? (
            <CroppedFrame block={block} />
          ) : (
            <div
              style={{
                borderRadius: 16,
                background: "rgba(0,0,0,.035)",
                padding: "34px 0",
                textAlign: "center",
                fontSize: 11.5,
                color: "var(--ink-3)",
              }}
            >
              paste an embed url below
            </div>
          )}
          {editing ? (
            <>
              <div className="blk-fieldrow">
                <span className="microcaps">url</span>
                <input
                  type="url"
                  value={block.src}
                  style={{ flex: 1 }}
                  placeholder="https://…"
                  onChange={(e) => onPatch({ src: e.target.value })}
                />
                <span className="microcaps">caption</span>
                <input
                  type="text"
                  value={block.caption ?? ""}
                  onChange={(e) => onPatch({ caption: e.target.value })}
                />
              </div>
              <div className="blk-fieldrow">
                <span className="microcaps">offset</span>
                <Slider
                  min={0}
                  max={20000}
                  value={block.offsetY ?? 0}
                  onChange={(offsetY) => onPatch({ offsetY })}
                />
                <input
                  type="number"
                  className="blk-num"
                  value={block.offsetY ?? 0}
                  onChange={(e) => onPatch({ offsetY: Math.max(0, Number(e.target.value) || 0) })}
                />
                <span className="microcaps">height</span>
                <Slider
                  min={160}
                  max={1100}
                  value={block.height ?? 420}
                  onChange={(height) => onPatch({ height })}
                />
                <span className="microcaps">page w</span>
                <input
                  type="number"
                  className="blk-num"
                  placeholder="fluid"
                  value={block.pageW ?? ""}
                  onChange={(e) =>
                    onPatch({ pageW: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </div>
            </>
          ) : (
            block.caption && <div className="blk-caption">{block.caption}</div>
          )}
        </div>
      );

    case "spacer":
      return editing ? (
        <div className="blk-fieldrow" style={{ justifyContent: "center", opacity: 0.7 }}>
          <span className="microcaps">spacer</span>
          <Slider
            min={8}
            max={160}
            value={block.height}
            onChange={(height) => onPatch({ height })}
          />
        </div>
      ) : (
        <div style={{ height: block.height }} aria-hidden />
      );

    case "divider":
      return <hr className="blk-divider" />;
  }
}
