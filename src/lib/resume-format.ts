export type Block = { type: "h1" | "h2" | "h3" | "li" | "p"; text: string };

/** Parses the plain-text resume format (#, ##, ###, -) into single-column blocks. */
export function parseResume(src: string): Block[] {
  return src
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      if (l.startsWith("### ")) return { type: "h3", text: l.slice(4) };
      if (l.startsWith("## ")) return { type: "h2", text: l.slice(3) };
      if (l.startsWith("# ")) return { type: "h1", text: l.slice(2) };
      if (/^[-•*] /.test(l)) return { type: "li", text: l.slice(2) };
      return { type: "p", text: l.replace(/\*\*/g, "") };
    });
}
