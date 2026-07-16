import { useEffect, useRef, useState } from "react";
import type { Block, BlockType } from "../types";
import { uid } from "../types";

const TYPES: { type: BlockType; label: string; glyph: string }[] = [
  { type: "heading", label: "Heading", glyph: "T" },
  { type: "text", label: "Text", glyph: "≡" },
  { type: "code", label: "Code", glyph: "<>" },
  { type: "image", label: "Image", glyph: "◪" },
  { type: "quote", label: "Quote", glyph: "❞" },
  { type: "callout", label: "Callout", glyph: "▣" },
  { type: "demo", label: "Live demo", glyph: "◉" },
  { type: "iframe", label: "Iframe embed", glyph: "⧉" },
  { type: "spacer", label: "Spacer", glyph: "↕" },
  { type: "divider", label: "Divider", glyph: "—" },
];

export function makeBlock(type: BlockType): Block {
  const id = uid();
  switch (type) {
    case "heading":
      return { id, type, text: "" };
    case "text":
      return { id, type, text: "" };
    case "code":
      return { id, type, lang: "css", code: "" };
    case "image":
      return { id, type, src: "" };
    case "quote":
      return { id, type, text: "" };
    case "callout":
      return { id, type, style: "soft", text: "" };
    case "demo":
      return { id, type, html: "", inherit: true, height: 240 };
    case "iframe":
      return { id, type, src: "", height: 420 };
    case "spacer":
      return { id, type, height: 48 };
    case "divider":
      return { id, type };
  }
}

/** the hover "+ add" gap between blocks, with the video-style dropdown */
export function AddGap({ onAdd }: { onAdd: (b: Block) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  return (
    <div className={`addgap ${open ? "open" : ""}`} ref={ref}>
      <button className="plus" onClick={() => setOpen((o) => !o)}>
        + add
      </button>
      {open && (
        <div className="addmenu">
          {TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => {
                onAdd(makeBlock(t.type));
                setOpen(false);
              }}
            >
              <span className="mi">{t.glyph}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
