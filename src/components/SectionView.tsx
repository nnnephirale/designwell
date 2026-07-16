import type { Block, Section, Topic } from "../types";
import {
  addSection,
  insertBlock,
  moveBlock,
  moveSection,
  pushUndo,
  removeBlock,
  removeSection,
  updateBlock,
  updateSection,
} from "../lib/store";
import { BlockView } from "./BlockView";
import { AddGap } from "./AddMenu";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function SectionView({
  section,
  topics,
  editing,
}: {
  section: Section;
  topics: Topic[];
  editing: boolean;
}) {
  const s = section;

  const deleteBlock = (block: Block, index: number) => {
    removeBlock(s.id, block.id);
    pushUndo({
      label: "block deleted",
      restore: () => insertBlock(s.id, block, index),
    });
  };

  const deleteSection = () => {
    const snapshot = s;
    removeSection(s.id);
    pushUndo({
      label: "section deleted",
      restore: () => addSection(snapshot),
    });
  };

  return (
    <section className="sect" id={`s-${s.id}`} data-section={s.id}>
      {editing && (
        <div className="sect-chrome">
          <span className="microcaps">section</span>
          <select
            value={s.topicId}
            onChange={(e) => updateSection(s.id, { topicId: e.target.value })}
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <span className="sep" />
          <span className="microcaps">credit</span>
          <input
            placeholder="author"
            value={s.source.author}
            onChange={(e) =>
              updateSection(s.id, { source: { ...s.source, author: e.target.value } })
            }
          />
          <input
            placeholder="article"
            value={s.source.article}
            style={{ width: 150 }}
            onChange={(e) =>
              updateSection(s.id, { source: { ...s.source, article: e.target.value } })
            }
          />
          <input
            placeholder="url"
            value={s.source.url}
            style={{ width: 120 }}
            onChange={(e) =>
              updateSection(s.id, { source: { ...s.source, url: e.target.value } })
            }
          />
          <span className="sep" />
          <button onClick={() => moveSection(s.id, -1)} title="move up">
            ↑
          </button>
          <button onClick={() => moveSection(s.id, 1)} title="move down">
            ↓
          </button>
          <button className="del" onClick={deleteSection} title="delete section">
            ×
          </button>
        </div>
      )}

      {editing ? (
        <input
          className="ghost sect-title-input"
          value={s.title}
          placeholder="Section title"
          onChange={(e) => updateSection(s.id, { title: e.target.value })}
        />
      ) : (
        <h2 className="sect-title">{s.title}</h2>
      )}

      {(s.source.author || s.source.article) && (
        <a
          className="credit"
          href={s.source.url || undefined}
          target="_blank"
          rel="noreferrer"
        >
          <span className="credit-dot">{initials(s.source.author || "?")}</span>
          {s.source.author}
          {s.source.article && <span style={{ opacity: 0.65 }}>· {s.source.article}</span>}
          {s.source.url && <span className="arrow">→</span>}
        </a>
      )}

      <div>
        {editing && <AddGap onAdd={(b) => insertBlock(s.id, b, 0)} />}
        {s.blocks.map((b, i) => (
          <div key={b.id}>
            <div className="blkwrap">
              {editing && (
                <div className="blk-chrome">
                  <button onClick={() => moveBlock(s.id, b.id, -1)} title="move up">
                    ↑
                  </button>
                  <button onClick={() => moveBlock(s.id, b.id, 1)} title="move down">
                    ↓
                  </button>
                  <button className="del" onClick={() => deleteBlock(b, i)} title="delete">
                    ×
                  </button>
                </div>
              )}
              <BlockView
                block={b}
                editing={editing}
                onPatch={(p) => updateBlock(s.id, b.id, p)}
              />
            </div>
            {editing && <AddGap onAdd={(nb) => insertBlock(s.id, nb, i + 1)} />}
          </div>
        ))}
      </div>
    </section>
  );
}