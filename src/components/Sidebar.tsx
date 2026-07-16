import type { Group } from "../lib/groups";
import type { TocMode } from "../types";

export function Sidebar({
  groups,
  mode,
  onMode,
  activeId,
  open,
  onClose,
}: {
  groups: Group[];
  mode: TocMode;
  onMode: (m: TocMode) => void;
  activeId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const jump = (id: string) => {
    document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    onClose();
  };
  return (
    <>
      <div className={`scrim ${open ? "on" : ""}`} onClick={onClose} />
      <aside className={`side ${open ? "open" : ""}`}>
        <div className="side-panel">
          <div className="side-head">
            <div className="seg" style={{ display: "flex" }}>
              <button
                className={mode === "topic" ? "on" : ""}
                style={{ flex: 1 }}
                onClick={() => onMode("topic")}
              >
                topic
              </button>
              <button
                className={mode === "author" ? "on" : ""}
                style={{ flex: 1 }}
                onClick={() => onMode("author")}
              >
                author
              </button>
            </div>
          </div>
          <nav className="side-scroll">
            {groups.map((g) => (
              <div className="toc-group" key={g.key}>
                <span className="microcaps toc-group-label">{g.label}</span>
                {g.subgroups.map((sub) => (
                  <div key={sub.key}>
                    {sub.label && <div className="toc-sub">{sub.label}</div>}
                    {sub.sections.map((s) => (
                      <button
                        key={s.id}
                        className={`toc-item ${activeId === s.id ? "on" : ""}`}
                        onClick={() => jump(s.id)}
                      >
                        {s.title || "Untitled"}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
