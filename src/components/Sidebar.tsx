import type { Group } from "../lib/groups";
import type { TocMode } from "../types";
import { addSection, getDoc, pushUndo, removeSection } from "../lib/store";

export function Sidebar({
  groups,
  mode,
  onMode,
  activeId,
  open,
  onClose,
  editing,
}: {
  groups: Group[];
  mode: TocMode;
  onMode: (m: TocMode) => void;
  activeId: string | null;
  open: boolean;
  onClose: () => void;
  editing: boolean;
}) {
  const jump = (id: string) => {
    document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    onClose();
  };

  const deleteSection = (id: string) => {
    const sections = getDoc().sections;
    const i = sections.findIndex((s) => s.id === id);
    if (i === -1) return;
    const snapshot = sections[i];
    const afterId = i > 0 ? sections[i - 1].id : null;
    removeSection(id);
    pushUndo({
      label: `“${snapshot.title || "Untitled"}” deleted`,
      restore: () => addSection(snapshot, afterId),
    });
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
                      <div className="toc-row" key={s.id}>
                        <button
                          className={`toc-item ${activeId === s.id ? "on" : ""}`}
                          onClick={() => jump(s.id)}
                        >
                          {s.title || "Untitled"}
                        </button>
                        {editing && (
                          <button
                            className="toc-del"
                            title="delete section"
                            onClick={() => deleteSection(s.id)}
                          >
                            ×
                          </button>
                        )}
                      </div>
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
