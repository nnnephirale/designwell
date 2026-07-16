import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { TocMode, ViewMode } from "./types";
import { uid } from "./types";
import { addSection, consumeUndo, useDoc, useUndo } from "./lib/store";
import { initSync, onSession } from "./lib/sync";
import { groupSections } from "./lib/groups";
import { Sidebar } from "./components/Sidebar";
import { SectionView } from "./components/SectionView";
import { SettingsSheet } from "./components/SettingsSheet";
import "./app.css";

export default function App() {
  const doc = useDoc();
  const undo = useUndo();
  const [tocMode, setTocMode] = useState<TocMode>(
    () => (localStorage.getItem("dwd-toc-mode") as TocMode) || "topic"
  );
  const [view, setView] = useState<ViewMode>("read");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [hdrHidden, setHdrHidden] = useState(false);

  const canEdit = session !== null || import.meta.env.DEV;

  useEffect(() => {
    initSync();
    return onSession(setSession);
  }, []);

  useEffect(() => {
    localStorage.setItem("dwd-toc-mode", tocMode);
  }, [tocMode]);

  /* scroll-spy + mobile header auto-hide */
  const lastY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const els = document.querySelectorAll<HTMLElement>("[data-section]");
      let current: string | null = null;
      els.forEach((el) => {
        if (el.getBoundingClientRect().top <= 130) current = el.dataset.section ?? null;
      });
      setActiveId(current ?? (els[0]?.dataset.section || null));

      const y = window.scrollY;
      if (window.innerWidth <= 900) {
        if (y > lastY.current + 6 && y > 90) setHdrHidden(true);
        else if (y < lastY.current - 6) setHdrHidden(false);
      } else {
        setHdrHidden(false);
      }
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* long-press the title → settings (hidden power-user affordance) */
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = () => {
    pressTimer.current = setTimeout(() => setSettingsOpen(true), 650);
  };
  const pressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const groups = groupSections(doc, tocMode);

  const newSection = () => {
    addSection({
      id: uid(),
      title: "",
      topicId: doc.topics[0]?.id ?? "typography",
      source: { author: "", article: "", url: "" },
      blocks: [{ id: uid(), type: "text", text: "" }],
    });
  };

  return (
    <>
      <header className={`hdr ${hdrHidden ? "hidden" : ""}`}>
        <button
          className="toc-toggle"
          onClick={() => setTocOpen(true)}
          aria-label="contents"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path
              d="M2 3.5h11M2 7.5h8M2 11.5h11"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span
          className="hdr-title"
          onPointerDown={pressStart}
          onPointerUp={pressEnd}
          onPointerLeave={pressEnd}
          onContextMenu={(e) => e.preventDefault()}
        >
          designwell
        </span>
        <span className="hdr-sub">a living doc of interface craft</span>
        <span className="hdr-spacer" />
        {canEdit && (
          <div className="seg">
            <button className={view === "read" ? "on" : ""} onClick={() => setView("read")}>
              read
            </button>
            <button className={view === "edit" ? "on" : ""} onClick={() => setView("edit")}>
              edit
            </button>
          </div>
        )}
      </header>

      <div className="layout">
        <Sidebar
          groups={groups}
          mode={tocMode}
          onMode={setTocMode}
          activeId={activeId}
          open={tocOpen}
          onClose={() => setTocOpen(false)}
        />
        <main className="main">
          <div className="canvas">
            {groups.map((g) => (
              <div key={g.key}>
                <div className="group-head">
                  <span className="microcaps">{g.label}</span>
                </div>
                {g.subgroups.map((sub) => (
                  <div key={sub.key}>
                    {sub.label && <div className="article-sub">{sub.label}</div>}
                    {sub.sections.map((s) => (
                      <SectionView
                        key={s.id}
                        section={s}
                        topics={doc.topics}
                        editing={view === "edit"}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
            {view === "edit" && (
              <div className="new-section">
                <button className="btn" onClick={newSection}>
                  + new section
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {undo && (
        <div className="pill-status">
          {undo.label}
          <button onClick={consumeUndo}>undo</button>
        </div>
      )}

      {settingsOpen && (
        <SettingsSheet session={session} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}
