// Generates src/data/lessons/javascript.ts from the user's local JS notes.
// Run: node scripts/gen-js-notes.mjs
// Re-run any time the notes under C:\Users\Saud\javascript\js_notes_chp change.
//
// Output format is Obsidian-style markdown:
//   - comment-only lines (// ...) become prose (bullets / bold section labels)
//   - code lines become ```js fenced blocks (rendered with syntax highlighting)
//   - `// ----X----` divider comments become `---` thematic breaks
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { noteToMarkdown, tidyMarkdownNote } from "./note-format.mjs";

const ROOT = "C:/Users/Saud/javascript/js_notes_chp";

// chapter folder → [section title, [file, display title]...]
const PLAN = [
  [
    "ch1",
    "Getting started",
    [
      ["intro.md", "What is JavaScript?"],
      ["variables.js", "Variables"],
    ],
  ],
  [
    "ch2",
    "Language basics",
    [
      ["datatypes.js", "Data types"],
      ["operators.js", "Operators"],
      ["control_flow.js", "Control flow"],
      ["loop.js", "Loops"],
      ["scopes.js", "Scopes"],
      ["popup_box.js", "Popup boxes"],
    ],
  ],
  [
    "ch3",
    "Objects, functions & classes",
    [
      ["array.js", "Arrays"],
      ["object.js", "Objects"],
      ["function.js", "Functions"],
      ["this.js", "this keyword"],
      ["class.js", "Classes"],
      ["date.js", "Date"],
      ["linkedList.js", "Linked list"],
      ["shallow_and_deep_copy.js", "Shallow vs deep copy"],
    ],
  ],
  [
    "ch4",
    "Async, modules & internals",
    [
      ["promise.js", "Promises"],
      ["async_await.js", "Async/await"],
      ["fetch.js", "fetch()"],
      ["destructuring.js", "Destructuring"],
      ["hoisting.js", "Hoisting"],
      ["scope.js", "Scope details"],
      ["try_catch.js", "try/catch"],
      ["use_strict.js", "use strict"],
      ["module_import.js", "Module import"],
      ["module_export.js", "Module export"],
    ],
  ],
  [
    "ch5",
    "Browser & performance",
    [
      ["DOM.js", "DOM"],
      ["eventCapturing.js", "Event capturing"],
      ["eventDelegation.js", "Event delegation"],
      ["settimeout_setInterval.js", "setTimeout & setInterval"],
      ["debouncing.js", "Debouncing"],
      ["throttling.js", "Throttling"],
      ["polyfills.js", "Polyfills"],
      ["cookies_local_session_storage.js", "Cookies & storage"],
    ],
  ],
  [
    "dsa",
    "DSA patterns",
    [
      ["sorting_algos/bubble_sort.js", "Bubble sort"],
      ["programming_pattern/recursion.js", "Recursion"],
      ["programming_pattern/two_pointer.js", "Two pointer"],
      ["programming_pattern/dynamic_programming.js", "Dynamic programming"],
    ],
  ],
  [
    "leetcode",
    "LeetCode practice",
    [["foundation/twoSum.js", "Two Sum"]],
  ],
];

let union = 0;
function readNote(rel) {
  try {
    const raw = readFileSync(`${ROOT}/${rel}`, "utf8");
    union += raw.length;
    return raw;
  } catch {
    console.warn(`⚠ missing: ${rel}`);
    return "// (file missing)";
  }
}

/** Turn a note into clean Obsidian-style markdown (see note-format.mjs) */function noteToMd(raw, isMarkdown) {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (isMarkdown) return { md: tidyMarkdownNote(text), raw: text };
  return { md: noteToMarkdown(text), raw: text };
}

const lessons = [];
const sections = [];

for (const [folder, sectionTitle, files] of PLAN) {
  const sectionId = folder.replace(/[^a-z0-9]/gi, "");
  const sectionLessons = [];
  for (const [file, display] of files) {
    const rel = `${folder}/${file}`;
    const raw = readNote(rel);
    const isMd = file.endsWith(".md");
    const { md, raw: rawCode } = noteToMd(raw, isMd);
    const slug = file.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const lesson = {
      id: `${sectionId}-${slug}`,
      title: display,
      minutes: Math.max(3, Math.round(raw.length / 900)),
      md,
      raw: rawCode,
    };
    sectionLessons.push(lesson);
    lessons.push(lesson);
  }
  sections.push({ id: sectionId, title: sectionTitle, lessonIds: sectionLessons.map((l) => l.id) });
}

const metaOut = `// AUTO-GENERATED from C:/Users/Saud/javascript/js_notes_chp — do not edit by hand.
// Regenerate: node scripts/gen-js-notes.mjs
export type SectionMeta = { id: string; title: string; lessonIds: string[] };

export const JS_COURSE_TITLE = "JavaScript";
export const JS_COURSE_DESCRIPTION = "A complete JavaScript course built from handwritten notes — basics, DOM, async, DSA and LeetCode patterns.";
export const JS_COURSE_SECTIONS: SectionMeta[] = ${JSON.stringify(sections, null, 2)};
`;

const lessonsOut = `// AUTO-GENERATED from C:/Users/Saud/javascript/js_notes_chp — do not edit by hand.
// Regenerate: node scripts/gen-js-notes.mjs
export type LessonData = { id: string; title: string; minutes: number; md: string; raw: string };

export const JS_COURSE_LESSONS: Record<string, LessonData> = ${JSON.stringify(
  Object.fromEntries(lessons.map((l) => [l.id, l])),
  null,
  2
)};
`;

mkdirSync("src/data/lessons", { recursive: true });
writeFileSync("src/data/lessons/javascript.ts", metaOut);
writeFileSync("src/data/lessons/javascript-lessons.ts", lessonsOut);
console.log(`✓ wrote javascript.ts (${sections.length} sections) + javascript-lessons.ts (${lessons.length} lessons, ${union} chars source)`);
