import type { ReactNode } from "react";

// minimal syntax tinting for css / js / jsx / html snippets.
// not a real parser — just enough color to make code scannable.

const RULES: { re: RegExp; cls: string }[] = [
  { re: /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)/, cls: "tok-comment" },
  { re: /("[^"\n]*"|'[^'\n]*'|`[^`]*`)/, cls: "tok-string" },
  { re: /(-?\d+\.?\d*(?:px|ms|s|em|rem|%|deg|vh|vw)?)(?![\w-])/, cls: "tok-num" },
  {
    re: /\b(const|let|var|function|return|import|export|from|if|else|new|class|extends|typeof|await|async)\b/,
    cls: "tok-kw",
  },
  { re: /([a-z-]+)(?=\s*:)/, cls: "tok-prop" },
  { re: /(@keyframes|@media|!important)/, cls: "tok-kw" },
];

const MASTER = new RegExp(RULES.map((r) => r.re.source).join("|"), "g");

export function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of code.matchAll(MASTER)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(code.slice(last, idx));
    const text = m[0];
    // find which rule matched (first defined capture group)
    let cls = "tok";
    for (let g = 0; g < RULES.length; g++) {
      if (m[g + 1] !== undefined) {
        cls = RULES[g].cls;
        break;
      }
    }
    out.push(
      <span key={key++} className={cls}>
        {text}
      </span>
    );
    last = idx + text.length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}
