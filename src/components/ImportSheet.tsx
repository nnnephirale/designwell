import { useState } from "react";
import type { Section, Topic } from "../types";
import { addSection } from "../lib/store";
import {
  authorGuess,
  fetchArticle,
  markdownToSections,
  tweetToSection,
} from "../lib/import";

export function ImportSheet({
  topics,
  onClose,
}: {
  topics: Topic[];
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [author, setAuthor] = useState("");
  const [article, setArticle] = useState("");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [embedLive, setEmbedLive] = useState(true);

  const isTweet = /(?:twitter|x)\.com\/\w+\/status\/\d+/.test(url);

  const preview: Section[] | null = markdown
    ? markdownToSections(markdown, { url, author, article, topicId, embedLive })
    : null;

  const fetchIt = async () => {
    setBusy(true);
    setErr(null);
    try {
      const a = await fetchArticle(url.trim());
      setMarkdown(a.markdown);
      setArticle(a.title);
      setAuthor(authorGuess(url));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "fetch failed");
    }
    setBusy(false);
  };

  const importIt = () => {
    const sections = isTweet
      ? [tweetToSection(url.trim(), topicId)!]
      : preview ?? [];
    sections.forEach((s) => addSection(s));
    onClose();
    const first = sections[0];
    if (first)
      setTimeout(
        () => document.getElementById(`s-${first.id}`)?.scrollIntoView({ block: "start" }),
        80
      );
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet sheet-import" onClick={(e) => e.stopPropagation()}>
        <h3>Import from URL</h3>

        <div className="hint">
          drop a link — articles are fetched and chunked into sections (one per
          heading, text/code/images kept). tweets become a single embed.
        </div>

        <div className="row">
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setMarkdown(null);
              setErr(null);
            }}
            placeholder="https://…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && url.trim() && !isTweet) fetchIt();
            }}
          />
          {!isTweet && (
            <button className="btn" onClick={fetchIt} disabled={busy || !url.trim()}>
              {busy ? "fetching…" : "fetch"}
            </button>
          )}
        </div>

        {err && <div className="hint">couldn't read that page — {err}</div>}

        {(markdown || isTweet) && (
          <>
            {!isTweet && (
              <>
                <span className="microcaps sect-label">credit</span>
                <div className="row">
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="author"
                  />
                  <input
                    type="text"
                    value={article}
                    onChange={(e) => setArticle(e.target.value)}
                    placeholder="article"
                  />
                </div>
              </>
            )}

            <span className="microcaps sect-label">into</span>
            <div className="row">
              <select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              {!isTweet && (
                <label className="check">
                  <input
                    type="checkbox"
                    checked={embedLive}
                    onChange={(e) => setEmbedLive(e.target.checked)}
                  />
                  embed live demos
                </label>
              )}
            </div>

            <div className="row">
              <button className="btn" onClick={importIt}>
                {isTweet
                  ? "import tweet"
                  : `import ${preview?.length ?? 0} section${(preview?.length ?? 0) === 1 ? "" : "s"}`}
              </button>
            </div>
            {!isTweet && (
              <div className="hint">
                everything lands editable — trim, reorder, or delete blocks afterwards.
                "embed live demos" adds each section of the original page in a small
                frame, scrolled to that section, so the interactive examples stay live.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
