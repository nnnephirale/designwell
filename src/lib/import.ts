// URL → sections importer. The lazy path: drop a link, the article is fetched as
// clean markdown (r.jina.ai reader), and chunked into the doc's blocks — one section
// per h2, paragraphs/code/images/quotes preserved verbatim, credit auto-filled.
// Interactive demos can't be lifted out of a React page, so each section can carry
// an anchored iframe of the original — the live example, scrolled into view.
// Personal, login-gated archive: capture-on-command, like a read-it-later app.
import type { Block, Section } from "../types";
import { uid } from "../types";

const READER = "https://r.jina.ai/";

export interface FetchedArticle {
  title: string;
  markdown: string;
}

export async function fetchArticle(url: string): Promise<FetchedArticle> {
  const res = await fetch(READER + url);
  if (!res.ok) throw new Error(`reader returned ${res.status}`);
  const raw = await res.text();
  const title = /^Title:\s*(.+)$/m.exec(raw)?.[1]?.trim() ?? url;
  const marker = raw.indexOf("Markdown Content:");
  const markdown = (marker === -1 ? raw : raw.slice(marker + "Markdown Content:".length)).trim();
  return { title, markdown };
}

/** "emilkowal.ski" from "https://emilkowal.ski/ui/..." — a starting guess for the credit */
export function authorGuess(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export interface ImportOptions {
  url: string;
  author: string;
  article: string;
  topicId: string;
  /** append an anchored iframe of the original per section — the live demos */
  embedLive: boolean;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

/** heading text is often a self-link: "[The Basics](https://…#the-basics)" —
    greedy match because titles and anchors can themselves contain parens, e.g. scale(0) */
function parseHeading(text: string): { title: string; anchor: string } {
  const link = /^\[([^\]]+)\]\((.*)\)$/.exec(text.trim());
  if (link) {
    const hash = link[2].split("#")[1];
    return { title: link[1].trim(), anchor: hash || slugify(link[1]) };
  }
  return { title: text.trim(), anchor: slugify(text) };
}

export function markdownToSections(md: string, opts: ImportOptions): Section[] {
  const source = { author: opts.author, article: opts.article, url: opts.url };
  const sections: Section[] = [];
  let current: { section: Section; anchor: string } | null = null;
  let para: string[] = [];
  let quote: string[] = [];

  const openSection = (title: string, anchor: string) => {
    closeSection();
    current = {
      section: { id: `${slugify(title) || "section"}-${uid()}`, title, topicId: opts.topicId, source, blocks: [] },
      anchor,
    };
  };

  const push = (b: Block) => {
    if (!current) openSection(opts.article || "Notes", "");
    current!.section.blocks.push(b);
  };

  const flushPara = () => {
    const text = para.join(" ").trim();
    para = [];
    if (text) push({ id: uid(), type: "text", text });
  };

  const flushQuote = () => {
    if (!quote.length) return;
    const text = quote.join("\n").trim();
    quote = [];
    if (text) push({ id: uid(), type: "quote", text });
  };

  const closeSection = () => {
    flushPara();
    flushQuote();
    if (!current) return;
    const { section, anchor } = current;
    if (opts.embedLive && section.blocks.length) {
      section.blocks.push({
        id: uid(),
        type: "iframe",
        src: anchor ? `${opts.url}#${anchor}` : opts.url,
        height: 460,
        caption: "live — this part of the original page",
      });
    }
    if (section.blocks.length) sections.push(section);
    current = null;
  };

  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // fenced code
    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      flushPara();
      flushQuote();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]);
      push({ id: uid(), type: "code", lang: fence[1] || "code", code: buf.join("\n") });
      continue;
    }

    // headings
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const { title, anchor } = parseHeading(h[2]);
      if (h[1].length <= 2) openSection(title, anchor);
      else {
        flushPara();
        flushQuote();
        push({ id: uid(), type: "heading", text: title });
      }
      continue;
    }

    // standalone image
    const img = /^!\[([^\]]*)\]\(([^)\s]+)[^)]*\)\s*$/.exec(line.trim());
    if (img) {
      flushPara();
      flushQuote();
      push({ id: uid(), type: "image", src: img[2], alt: img[1] });
      continue;
    }

    // blockquote
    if (/^>\s?/.test(line)) {
      flushPara();
      quote.push(line.replace(/^>\s?/, ""));
      continue;
    }
    if (quote.length && line.trim() === "") {
      flushQuote();
      continue;
    }

    // paragraph flow
    if (line.trim() === "") flushPara();
    else para.push(line.trim());
  }
  closeSection();
  return sections;
}

/** tweet/x URLs get a single embed section — no reader round-trip needed */
export function tweetToSection(url: string, topicId: string): Section | null {
  const m = /(?:twitter|x)\.com\/(\w+)\/status\/(\d+)/.exec(url);
  if (!m) return null;
  const [, handle, id] = m;
  return {
    id: `tweet-${id}`,
    title: `@${handle}`,
    topicId,
    source: { author: `@${handle}`, article: "on twitter", url },
    blocks: [
      {
        id: uid(),
        type: "iframe",
        src: `https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=light&dnt=true`,
        height: 560,
      },
    ],
  };
}
