// URL → sections importer. The lazy path: drop a link, the page is fetched through
// the r.jina.ai reader and chunked into the doc's blocks — one section per h1/h2,
// paragraphs/code/images/quotes preserved, credit auto-filled. Interactive demos
// can't be lifted out of a React page, so each section can carry an anchored iframe
// of the original — the live example, scrolled into view.
// Personal, login-gated archive: capture-on-command, like a read-it-later app.
//
// Two parse paths:
//  - HTML (preferred): `x-return-format: html` gives the real DOM, so we keep only
//    semantic content (h1–h6, p, pre, blockquote, lists, img) and drop demo-widget
//    text wholesale (buttons, nav, `select-none` UI strings). Needed because some
//    sites (jakub.kr) put heading text inside buttons — the markdown reader strips
//    them and the whole article collapses into one flat mess.
//  - Markdown (fallback): the reader's default output, for pages where the HTML
//    pass finds no structure.
import type { Block, Section } from "../types";
import { uid } from "../types";

const READER = "https://r.jina.ai/";

export interface FetchedArticle {
  title: string;
  kind: "html" | "markdown";
  raw: string;
}

export async function fetchArticle(url: string): Promise<FetchedArticle> {
  // HTML first — real structure survives; CORS preflight for the header is allowed
  try {
    const res = await fetch(READER + url, { headers: { "x-return-format": "html" } });
    if (res.ok) {
      const raw = await res.text();
      const dom = new DOMParser().parseFromString(raw, "text/html");
      const root = dom.querySelector("main, article") ?? dom.body;
      if (root.querySelectorAll("h1, h2").length >= 2) {
        const title =
          dom.querySelector("h1")?.textContent?.trim() ||
          dom.title.trim() ||
          url;
        return { title, kind: "html", raw };
      }
    }
  } catch {
    /* fall through to markdown */
  }
  const res = await fetch(READER + url);
  if (!res.ok) throw new Error(`reader returned ${res.status}`);
  const raw = await res.text();
  const title = /^Title:\s*(.+)$/m.exec(raw)?.[1]?.trim() ?? url;
  const marker = raw.indexOf("Markdown Content:");
  const markdown = (marker === -1 ? raw : raw.slice(marker + "Markdown Content:".length)).trim();
  return { title, kind: "markdown", raw: markdown };
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

export function parseArticle(a: FetchedArticle, opts: ImportOptions): Section[] {
  return a.kind === "html" ? htmlToSections(a.raw, opts) : markdownToSections(a.raw, opts);
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

/* ---------- shared section assembly ---------- */

class SectionBuilder {
  sections: Section[] = [];
  private current: { section: Section; anchor: string } | null = null;
  private opts: ImportOptions;
  constructor(opts: ImportOptions) {
    this.opts = opts;
  }

  open(title: string, anchor: string) {
    // pages often repeat the title (hero h1 + article heading) — keep one section
    if (this.current && this.current.section.title === title) return;
    this.close();
    this.current = {
      section: {
        id: `${slugify(title) || "section"}-${uid()}`,
        title,
        topicId: this.opts.topicId,
        source: { author: this.opts.author, article: this.opts.article, url: this.opts.url },
        blocks: [],
      },
      anchor,
    };
  }

  push(b: Block) {
    if (!this.current) this.open(this.opts.article || "Notes", "");
    this.current!.section.blocks.push(b);
  }

  close() {
    if (!this.current) return;
    const { section, anchor } = this.current;
    if (this.opts.embedLive && section.blocks.length) {
      section.blocks.push({
        id: uid(),
        type: "iframe",
        src: anchor ? `${this.opts.url}#${anchor}` : this.opts.url,
        height: 460,
        caption: "live — this part of the original page",
      });
    }
    if (section.blocks.length) this.sections.push(section);
    this.current = null;
  }
}

/* ---------- HTML path ---------- */

const CONTENT_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6", "P", "PRE", "BLOCKQUOTE", "UL", "OL", "IMG"]);
const PRUNE_TAGS = new Set([
  "NAV", "HEADER", "FOOTER", "ASIDE", "SCRIPT", "STYLE", "NOSCRIPT",
  "BUTTON", "SVG", "FORM", "INPUT", "SELECT", "TEXTAREA", "IFRAME", "VIDEO", "CANVAS",
]);

/** demo-widget text is UI, not prose — sites mark it unselectable */
const isUiNoise = (el: Element) =>
  el.classList.contains("select-none") ||
  el.classList.contains("sr-only") ||
  el.getAttribute("aria-hidden") === "true";

/** serialize inline children back to the doc's md-ish inline syntax */
function inlineText(el: Element, baseUrl: string): string {
  let out = "";
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) out += n.textContent ?? "";
    else if (n.nodeType === Node.ELEMENT_NODE) {
      const e = n as Element;
      if (PRUNE_TAGS.has(e.tagName) || isUiNoise(e)) return;
      const inner = inlineText(e, baseUrl);
      if (!inner.trim()) return;
      switch (e.tagName) {
        case "CODE":
          out += `\`${inner}\``;
          break;
        case "STRONG":
        case "B":
          out += `**${inner}**`;
          break;
        case "EM":
        case "I":
          out += `*${inner}*`;
          break;
        case "A": {
          const href = e.getAttribute("href") ?? "";
          if (!href || href.startsWith("#")) out += inner;
          else {
            try {
              out += `[${inner}](${new URL(href, baseUrl).href})`;
            } catch {
              out += inner;
            }
          }
          break;
        }
        default:
          out += inner;
      }
    }
  });
  return out;
}

export function htmlToSections(html: string, opts: ImportOptions): Section[] {
  const dom = new DOMParser().parseFromString(html, "text/html");
  const root = dom.querySelector("main, article") ?? dom.body;
  const b = new SectionBuilder(opts);

  const emit = (el: Element) => {
    const tag = el.tagName;
    if (tag === "H1" || tag === "H2") {
      const title = el.textContent?.trim() ?? "";
      if (title) b.open(title, el.id || slugify(title));
      return;
    }
    if (/^H[3-6]$/.test(tag)) {
      const text = el.textContent?.trim() ?? "";
      if (text) b.push({ id: uid(), type: "heading", text });
      return;
    }
    if (tag === "P") {
      const text = inlineText(el, opts.url).trim();
      if (text) b.push({ id: uid(), type: "text", text });
      return;
    }
    if (tag === "PRE") {
      const code = (el.textContent ?? "").replace(/\n+$/, "");
      if (!code.trim()) return;
      const langMatch = /language-(\w+)/.exec(el.className + " " + (el.querySelector("code")?.className ?? ""));
      b.push({ id: uid(), type: "code", lang: langMatch?.[1] ?? "code", code });
      return;
    }
    if (tag === "BLOCKQUOTE") {
      const text = inlineText(el, opts.url).trim();
      if (text) b.push({ id: uid(), type: "quote", text });
      return;
    }
    if (tag === "UL" || tag === "OL") {
      const items = [...el.querySelectorAll(":scope > li")]
        .map((li) => inlineText(li, opts.url).trim())
        .filter(Boolean);
      if (items.length) b.push({ id: uid(), type: "text", text: items.map((i) => `• ${i}`).join("\n") });
      return;
    }
    if (tag === "IMG") {
      const src = el.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      try {
        b.push({ id: uid(), type: "image", src: new URL(src, opts.url).href, alt: el.getAttribute("alt") ?? "" });
      } catch {
        /* unresolvable src */
      }
      return;
    }
  };

  const walk = (el: Element) => {
    if (PRUNE_TAGS.has(el.tagName) || isUiNoise(el)) return;
    if (CONTENT_TAGS.has(el.tagName)) {
      emit(el);
      return; // content elements are leaves — don't double-capture nested tags
    }
    for (const child of el.children) walk(child);
  };
  walk(root);
  b.close();
  return b.sections;
}

/* ---------- markdown path (fallback) ---------- */

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
  const b = new SectionBuilder(opts);
  let para: string[] = [];
  let quote: string[] = [];

  const flushPara = () => {
    const text = para.join(" ").trim();
    para = [];
    if (text) b.push({ id: uid(), type: "text", text });
  };

  const flushQuote = () => {
    if (!quote.length) return;
    const text = quote.join("\n").trim();
    quote = [];
    if (text) b.push({ id: uid(), type: "quote", text });
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
      b.push({ id: uid(), type: "code", lang: fence[1] || "code", code: buf.join("\n") });
      continue;
    }

    // headings
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const { title, anchor } = parseHeading(h[2]);
      if (h[1].length <= 2) {
        flushPara();
        flushQuote();
        b.open(title, anchor);
      } else {
        flushPara();
        flushQuote();
        b.push({ id: uid(), type: "heading", text: title });
      }
      continue;
    }

    // standalone image
    const img = /^!\[([^\]]*)\]\(([^)\s]+)[^)]*\)\s*$/.exec(line.trim());
    if (img) {
      flushPara();
      flushQuote();
      b.push({ id: uid(), type: "image", src: img[2], alt: img[1] });
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
  flushPara();
  flushQuote();
  b.close();
  return b.sections;
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
