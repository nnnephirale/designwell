// local-first doc store. localStorage is the source of truth; cloud sync
// (lib/sync.ts) is layered on top and the app never depends on it.
import { useSyncExternalStore } from "react";
import type { Block, Doc, Section } from "../types";
import seed from "../content/seed.json";

const DOC_KEY = "dwd-doc";

type Listener = () => void;
const listeners = new Set<Listener>();

function loadInitial(): Doc {
  try {
    const raw = localStorage.getItem(DOC_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Doc;
      if (parsed && Array.isArray(parsed.sections)) return parsed;
    }
  } catch {
    /* corrupted or blocked storage — fall back to seed */
  }
  return seed as unknown as Doc;
}

let doc: Doc = loadInitial();

function persist() {
  try {
    localStorage.setItem(DOC_KEY, JSON.stringify(doc));
  } catch {
    /* storage full/blocked — keep going in memory */
  }
}

export function getDoc(): Doc {
  return doc;
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let onChange: ((doc: Doc) => void) | null = null;
/** sync layer registers here to receive debounced change notifications */
export function registerChangeHook(fn: (doc: Doc) => void) {
  onChange = fn;
}

export function setDoc(next: Doc, opts: { fromSync?: boolean } = {}) {
  doc = { ...next, updatedAt: opts.fromSync ? next.updatedAt : new Date().toISOString() };
  persist();
  listeners.forEach((l) => l());
  if (!opts.fromSync && onChange) onChange(doc);
}

export function useDoc(): Doc {
  return useSyncExternalStore(subscribe, getDoc);
}

/* ---------- mutations ---------- */

export function updateSection(id: string, patch: Partial<Section>) {
  setDoc({
    ...doc,
    sections: doc.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  });
}

/** afterId: string = insert after that section, null = insert first, undefined = append */
export function addSection(section: Section, afterId?: string | null) {
  const sections = [...doc.sections];
  const i =
    afterId === null
      ? -1
      : afterId
        ? sections.findIndex((s) => s.id === afterId)
        : sections.length - 1;
  sections.splice(i + 1, 0, section);
  setDoc({ ...doc, sections });
}

export function removeSection(id: string) {
  setDoc({ ...doc, sections: doc.sections.filter((s) => s.id !== id) });
}

export function moveSection(id: string, dir: -1 | 1) {
  const sections = [...doc.sections];
  const i = sections.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i === -1 || j < 0 || j >= sections.length) return;
  [sections[i], sections[j]] = [sections[j], sections[i]];
  setDoc({ ...doc, sections });
}

export function updateBlock(sectionId: string, blockId: string, patch: Partial<Block>) {
  setDoc({
    ...doc,
    sections: doc.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            blocks: s.blocks.map((b) =>
              b.id === blockId ? ({ ...b, ...patch } as Block) : b
            ),
          }
        : s
    ),
  });
}

export function insertBlock(sectionId: string, block: Block, index: number) {
  setDoc({
    ...doc,
    sections: doc.sections.map((s) => {
      if (s.id !== sectionId) return s;
      const blocks = [...s.blocks];
      blocks.splice(index, 0, block);
      return { ...s, blocks };
    }),
  });
}

export function removeBlock(sectionId: string, blockId: string) {
  setDoc({
    ...doc,
    sections: doc.sections.map((s) =>
      s.id === sectionId ? { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) } : s
    ),
  });
}

export function moveBlock(sectionId: string, blockId: string, dir: -1 | 1) {
  setDoc({
    ...doc,
    sections: doc.sections.map((s) => {
      if (s.id !== sectionId) return s;
      const blocks = [...s.blocks];
      const i = blocks.findIndex((b) => b.id === blockId);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= blocks.length) return s;
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      return { ...s, blocks };
    }),
  });
}

/* ---------- quiet undo (deletes only, optimistic UI) ---------- */

export interface UndoEntry {
  label: string;
  restore: () => void;
}

let undoEntry: UndoEntry | null = null;
let undoTimer: ReturnType<typeof setTimeout> | null = null;
const undoListeners = new Set<Listener>();

export function pushUndo(entry: UndoEntry) {
  undoEntry = entry;
  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    undoEntry = null;
    undoListeners.forEach((l) => l());
  }, 6000);
  undoListeners.forEach((l) => l());
}

export function consumeUndo() {
  const e = undoEntry;
  undoEntry = null;
  if (undoTimer) clearTimeout(undoTimer);
  undoListeners.forEach((l) => l());
  e?.restore();
}

export function dismissUndo() {
  undoEntry = null;
  if (undoTimer) clearTimeout(undoTimer);
  undoListeners.forEach((l) => l());
}

export function useUndo(): UndoEntry | null {
  return useSyncExternalStore(
    (fn) => {
      undoListeners.add(fn);
      return () => undoListeners.delete(fn);
    },
    () => undoEntry
  );
}

/* ---------- export ---------- */

export function exportDoc() {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "content.json";
  a.click();
  URL.revokeObjectURL(url);
}
