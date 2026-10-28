import fs from "node:fs";
import path from "node:path";
import { noteToMarkdown, tidyMarkdownNote } from "./note-format.mjs";

const ROOT = "C:/Users/Saud/javascript/js_notes_chp";

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|md)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
let blocks = 0;
let unbalanced = 0;
let allComment = 0;
const orphans = [];

for (const f of files) {
  const raw = fs.readFileSync(f, "utf8");
  const md = f.endsWith(".md") ? tidyMarkdownNote(raw) : noteToMarkdown(raw);

  let open = false;
  for (const l of md.split("\n")) if (l.trim().startsWith("```")) open = !open;
  if (open) {
    unbalanced++;
    console.log("UNBALANCED fence:", path.relative(ROOT, f));
  }

  const found = [...md.matchAll(/```[a-z]*\n([\s\S]*?)```/g)];
  blocks += found.length;
  for (const m of found) {
    const ls = m[1].split("\n").filter((l) => l.trim());
    if (ls.length && ls.every((l) => /^\s*\/\//.test(l))) {
      allComment++;
      console.log("ALL-COMMENT block:", path.relative(ROOT, f), JSON.stringify(m[1].slice(0, 100)));
    }
  }

  // prose outside fences that still reads as code
  const prose = md.replace(/```[a-z]*\n[\s\S]*?```/g, "");
  for (const m of prose.matchAll(/^[^\n]+$/gm)) {
    const t = m[0].trim();
    if (/^[-*#|>\d]/.test(t)) continue;
    if (/^\|/.test(t)) continue;
    if (/^\s*(?:\}\s*\)?\s*(\(\s*\))?\s*;?|\}|\]|[)\]])$/.test(t)) {
      orphans.push(`${path.relative(ROOT, f)}: ${JSON.stringify(t)}`);
    }
  }
}

console.log(`\nfiles ${files.length} · blocks ${blocks}`);
console.log(`unbalanced ${unbalanced} · all-comment ${allComment} · orphans ${orphans.length}`);
[...new Set(orphans)].forEach((s) => console.log("  ", s));