export interface Topic {
  id: string;
  label: string;
}

export interface Source {
  author: string;
  article: string;
  url: string;
}

export type CalloutStyle = "soft" | "pull" | "highlight";

export type Block =
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "code"; lang: string; code: string }
  | { id: string; type: "image"; src: string; alt?: string; caption?: string }
  | { id: string; type: "quote"; text: string; cite?: string }
  | { id: string; type: "callout"; style: CalloutStyle; text: string }
  | {
      id: string;
      type: "demo";
      demoId?: string; // built-in registry component
      html?: string; // custom demo source (rendered in srcdoc iframe)
      inherit?: boolean; // inject house styles into custom demo
      height?: number;
      caption?: string;
    }
  | {
      id: string;
      type: "iframe";
      src: string;
      height?: number; // visible window height, in page px
      caption?: string;
      offsetY?: number; // crop: how far down the original page the window starts
      pageW?: number; // crop: freeze the embedded page's layout width (scales to fit)
    }
  | { id: string; type: "spacer"; height: number }
  | { id: string; type: "divider" };

export type BlockType = Block["type"];

export interface Section {
  id: string;
  title: string;
  topicId: string;
  source: Source;
  blocks: Block[];
}

export interface Doc {
  version: number;
  updatedAt: string; // ISO — drives last-write-wins in cloud sync
  topics: Topic[];
  sections: Section[];
}

export type TocMode = "topic" | "author";
export type ViewMode = "read" | "edit";

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
