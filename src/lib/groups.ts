import type { Doc, Section, TocMode } from "../types";

export interface SubGroup {
  key: string;
  label: string; // article title (author mode) or "" (topic mode)
  sections: Section[];
}

export interface Group {
  key: string;
  label: string; // topic label or author name
  subgroups: SubGroup[];
}

/** group sections for the active TOC mode; canvas + sidebar share this */
export function groupSections(doc: Doc, mode: TocMode): Group[] {
  if (mode === "topic") {
    return doc.topics
      .map((t) => ({
        key: t.id,
        label: t.label,
        subgroups: [
          {
            key: t.id,
            label: "",
            sections: doc.sections.filter((s) => s.topicId === t.id),
          },
        ],
      }))
      .filter((g) => g.subgroups[0].sections.length > 0);
  }

  // author mode: authors in order of first appearance, subdivided by article
  const groups: Group[] = [];
  for (const s of doc.sections) {
    const author = s.source.author || "Uncredited";
    const article = s.source.article || "";
    let g = groups.find((x) => x.label === author);
    if (!g) {
      g = { key: `a-${author}`, label: author, subgroups: [] };
      groups.push(g);
    }
    let sub = g.subgroups.find((x) => x.label === article);
    if (!sub) {
      sub = { key: `${g.key}-${article || "misc"}`, label: article, sections: [] };
      g.subgroups.push(sub);
    }
    sub.sections.push(s);
  }
  return groups;
}
