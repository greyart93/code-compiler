// Converts the user's annotated JS notes into clean Obsidian-style markdown.
//
// Note conventions handled here:
//   // Chapter: 1 / 1.1 topic   → table of contents (dropped) + real headings
//   // 1.1 var, let and const    → "###" heading
//   // primitive types:          → prose (labels become headings only when alone)
//   // pending<TAB>initial state → "- **pending** — initial state" bullet
//   // o/p: / // output:         → "**Output**" + a text block of the values
//   // -------------------------- → "---"
//   // var a // Declaration      → "- `var a` — Declaration" bullet
//   // x + y = z                 → prose with an inline code span
//   code lines (commented or not)→ one ```js fence per run (blank-line aware)

const DIVIDER = /^[─\-=_=~*X\s]+$/; // -------X------, ======, etc.
const DIAGRAM = /[│┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬▀▄█]/;

const CODE_SIGNALS = [
  /[=;]/, // assignment, comparison, statement end
  /\+\+|--/, // i++, n--
  /[a-zA-Z_$][\w$.]*\([^)]*\)/, // call(...) e.g. console.log(x)
  /[{[]/, // opens a block or array
  // lone closing tail, e.g. "})()", "})();", "})", "}]" — the ")" before the
  // call parens is what made the naive version miss IIFE tails
  /^[})\]]\s*\)?\s*(\(\s*\))?\s*;?\s*$/,
  /^[})\]]/, // opens with a closer → the tail of an expression
  /[;{]\s*$/, // ends a statement / opens a block
  /^(#include|package|import|from|using\s+\w+::|def|class|struct|enum|fn|func|public|private|return|else|elif|try|catch)\b/,
  /^(break|continue|true|false|null|undefined|this)\b/,
];

// a bare statement like "var a" or "return this.name" — but NOT the prose
// "var ko kabhi bhi initialize kar sakte hai", hence the 2-word limit
const BARE_CODE = /^(?:var|let|const|return|throw|delete|typeof|new)\s+[\w$(][\w$().,[\]]*$/;

// ── operator reference ────────────────────────────────────────────────────
// The notes list operators as bare symbols ("// +", "// **=", "// ==="), which
// carry no name or meaning on their own. These tables give the reader both.

const OPERATOR_GROUPS = {
  "arithmetic operators": {
    title: "Arithmetic operators",
    blurb: "Do maths on values and produce a new value.",
  },
  "assignment operators": {
    title: "Assignment operators",
    blurb:
      "Compute a value and store it back in one step — shorthand for `x = x + …`.",
  },
  "comparison operators": {
    title: "Comparison operators",
    blurb: "Compare two values and return a boolean: `true` or `false`.",
  },
  "logical operators": {
    title: "Logical operators",
    blurb: "Combine truthy / falsy values instead of comparing them.",
  },
  "bitwise operators": {
    title: "Bitwise operators",
    blurb: "Operate on the binary representation of a number.",
  },
  "unary operators": {
    title: "Unary operators",
    blurb: "Work on a single operand.",
  },
  "ternary operator": {
    title: "Ternary operator",
    blurb: "A one-line `if / else`: `cond ? a : b`.",
  },
};

/** symbol → [name, what it does] */
const OPERATORS = {
  "+": ["Addition", "adds two values"],
  "-": ["Subtraction", "subtracts the right from the left"],
  "*": ["Multiplication", "multiplies two values"],
  "/": ["Division", "divides the left by the right"],
  "%": ["Modulus", "remainder left after division"],
  "**": ["Exponentiation", "raises the left to the power of the right"],
  "++": ["Increment", "adds one to a variable"],
  "--": ["Decrement", "subtracts one from a variable"],
  "+=": ["Add and assign", "`x += 2` is `x = x + 2`"],
  "-=": ["Subtract and assign", "`x -= 2` is `x = x - 2`"],
  "*=": ["Multiply and assign", "`x *= 2` is `x = x * 2`"],
  "/=": ["Divide and assign", "`x /= 2` is `x = x / 2`"],
  "**=": ["Exponent and assign", "`x **= 2` is `x = x ** 2`"],
  "%=": ["Modulus and assign", "`x %= 2` is `x = x % 2`"],
  "==": ["Loose equality", "equal after converting types — `\"2\" == 2` is true"],
  "===": ["Strict equality", "equal value **and** type — `\"2\" === 2` is false"],
  "!=": ["Loose not equal", "the opposite of `==`"],
  "!==": ["Strict not equal", "the opposite of `===`"],
  "<": ["Less than", "is the left smaller?"],
  "<=": ["Less than or equal", "is the left smaller or the same?"],
  ">": ["Greater than", "is the left bigger?"],
  ">=": ["Greater than or equal", "is the left bigger or the same?"],
  "&&": ["Logical AND", "left **and** right are truthy"],
  "||": ["Logical OR", "either left **or** right is truthy"],
  "??": ["Nullish coalescing", "right side, only when left is `null` / `undefined`"],
  "&&=": ["Logical AND assign", "assigns when both sides are truthy"],
  "||=": ["Logical OR assign", "assigns when either side is truthy"],
  "^": ["XOR", "bitwise exclusive-or — also the classic swap trick"],
  "!": ["Logical NOT", "flips a value's truthiness"],
  "|": ["Bitwise OR", "bitwise or"],
  "&": ["Bitwise AND", "bitwise and"],
  "~": ["Bitwise NOT", "flips every bit"],
  "<<": ["Left shift", "shifts bits left"],
  ">>": ["Right shift", "shifts bits right"],
  ">>>": ["Unsigned right shift", "shifts right, ignoring the sign bit"],
};

/** "# Arithmetic operators" / "assignment operators" → a known group name */
function operatorGroup(prose) {
  const key = prose.trim().replace(/^#+\s*/, "").replace(/[:.]+$/, "").trim().toLowerCase();
  return OPERATOR_GROUPS[key];
}

/**
 * The operator reference starting at `lines[i]`, or null.
 *
 * A group heading followed by 3+ bare symbols becomes a definition, a
 * symbol/name/description table, and — when the notes already wrote a name
 * beside the symbol — keeps that name instead of the dictionary's.
 */
function operatorSection(lines, i) {
  const group = operatorGroup(stripComment(lines[i]));
  if (!group) return null;

  const rows = [];
  let j = i + 1;
  for (; j < lines.length; j++) {
    // blank lines inside the list are just how the notes are spaced out
    if (isBlank(lines[j])) continue;
    const text = stripComment(lines[j]).trim();
    if (!text || operatorGroup(text) || DIAGRAM.test(text)) break;

    // "// ===" or "// === equal to and equal type"
    const m = text.match(/^([^\s]+)(?:\s{2,}|[ \t]+(?=\S))?\s*(.*)$/);
    if (!m) break;
    const symbol = m[1];
    if (!/^[+\-*/%^!<>=&|~?:]+$/.test(symbol)) break;
    const own = m[2].trim();
    const known = OPERATORS[symbol];
    // a symbol we can't explain (a duplicated "^^", say) is skipped rather
    // than ending the list — the note's real operators still follow it
    if (!own && !known) continue;
    rows.push([
      symbol,
      // the note's own wording wins — it is the author's phrasing
      own || known[0],
      known?.[1] ?? "",
    ]);
    if (rows.length >= 14) break;
  }

  if (rows.length < 3) return null;

  const cell = (t) => t.replace(/\|/g, "\\|");
  // the symbol itself is code, so it reads as `+` rather than a stray "+"
  const pad = (r) =>
    `| \`${cell(r[0])}\` | ${cell(r[1])} | ${cell(r[2])} |`;
  const md = [
    `#### ${group.title}`,
    "",
    group.blurb,
    "",
    "| Operator | Name | What it does |",
    "| --- | --- | --- |",
    ...rows.map((r) => pad(r)),
  ].join("\n");

  return { md, next: j };
}

// cells of a hand-aligned table are separated by a tab or 2+ spaces
const TABLE_SEP = /\t|[ ]{2,}/;
// the label column holds words, never expressions — this is what tells a real
// table from an execution trace like "i=0   [29, 10, 14]   (29>10 so swap)"
const TABLE_LABEL = /^[A-Za-z][^=<>{};+*]*$/;

/** Split a row into its cells, noting whether any tab separated them. */
function tableCells(text) {
  const cells = [];
  let tabbed = false;
  let i = 0;
  while (i < text.length) {
    const m = TABLE_SEP.exec(text.slice(i));
    const end = m ? i + m.index : text.length;
    const chunk = text.slice(i, end);
    if (chunk.trim()) cells.push(chunk.trim());
    if (!m) break;
    if (m[0].includes("\t")) tabbed = true;
    i = end + m[0].length;
  }
  return { cells, tabbed };
}

/** A cell that is really a snippet gets an inline code span. */
function tableCell(cell) {
  if (!cell) return "";
  const code = /[=;]/.test(cell) || /^\{.*\}$/.test(cell) || (/\(/.test(cell) && /\./.test(cell));
  const safe = cell.replace(/\|/g, "\\|");
  return code ? `\`${safe}\`` : safe;
}

/**
 * The space/tab-aligned table starting at `lines[i]`, or null.
 *
 * The notes write comparison tables by hand ("redeclare   y   n   n   var a"),
 * which used to fall through to a code fence. Runs that don't line up, carry
 * diagram characters, or whose label column holds expressions are left alone
 * so execution traces and recursion trees stay code.
 */
function tableRun(lines, i) {
  const rows = [];
  let tabbed = false;
  let j = i;
  for (; j < lines.length; j++) {
    if (lines[j].trim() === "") break;
    const text = lines[j].trim().replace(/^\/\/+\s?/, "").replace(/\s+$/, "");
    if (DIAGRAM.test(text)) break;
    const got = tableCells(text);
    if (got.cells.length < 2) break;
    if (got.cells.some((c) => c.length > 40)) break;
    if (got.tabbed) tabbed = true;
    rows.push(got.cells);
  }
  if (rows.length < 3) return null;

  const width = Math.max(...rows.map((r) => r.length));
  // the header row may leave the label column blank, nothing shorter is a table
  if (rows.some((r) => r.length < width - 1)) return null;
  for (const r of rows) while (r.length < width) r.unshift("");
  // 3+ columns is always a table. A 2-column run is only one when it is long
  // enough to be a comparison — the notes also use short tab pairs as plain
  // definitions ("pending⇥initial state"), which read better as bullets.
  if (width < 3 && (!tabbed || rows.length < 4)) return null;
  if (!rows.every((r, k) => k === 0 || TABLE_LABEL.test(r[0]))) return null;

  const pad = (row) => `| ${row.map(tableCell).join(" | ")} |`;
  return {
    md:
      [pad(rows[0]), `| ${Array(width).fill("---").join(" | ")} |`, ...rows.slice(1).map(pad)].join(
        "\n"
      ),
    next: j,
  };
}

// HTML lines (the notes embed markup examples) get their own fence language
const HTML_LINE = /^\s*<\/?[a-z][\w-]*(\s[^>]*)?\/?>\s*$/i;
const fenceLangFor = (lines) => (lines.some((l) => HTML_LINE.test(l)) ? "html" : "js");

const LABEL_WORDS =
  "theory|syntax|example|examples?|ex\\d*|note|notes|remember this|remember|intuition|why|how|steps?|problem|task|tip|todo|o\\/p|op|output|input|usecase|use case|gotcha|warning|rule|definition|defs|intro|overview";

// strip the comment marker AND the indentation that follows it
const stripComment = (line) => line.trim().replace(/^\/\/+\s*/, "");
// keeps whatever indentation followed the marker ("// \tname:" → "\tname:")
const inner = (line) => line.replace(/^\/\/+\s?/, "");
/** a commented line indented inside an example — it belongs to that block */
const isIndentedComment = (raw) => /^\s/.test(raw) || /^\/\/+\s?\t/.test(raw);
const isBlank = (line) => line.trim() === "" || line.trim() === "//";

/** A code-ish span inside prose: `x + y`, `NaN ** 0`, `target - arr[i]`.
    Prose colons ("Theory:") and arrows ("a -> b") deliberately don't match. */
const CODE_SPAN =
  /(^|[\s(])((?:[a-zA-Z_$][\w$.]*|\d+(?:\.\d+)?)(?:[ \t]*[-+*/%<>=!&|^~?]+[ \t]*(?:[a-zA-Z_$][\w$.]*|\d+(?:\.\d+)?|\([^)]*\)|\[[^\]]*\]))+)(?=$|[\s,.;:)])/g;

function withInlineCode(s) {
  return s
    .replace(/`/g, "")
    .replace(CODE_SPAN, (m, lead, span) =>
      span.includes("->") || span.length > 60 ? m : `${lead}\`${span}\``
    );
}

/** Tidy a hand-written .md note: tab-aligned blocks become real tables and
    indented "term – description" lines become definition bullets. */
export function tidyMarkdownNote(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // run of tab-separated lines → a markdown table
    if (/\t/.test(line)) {
      const rows = [];
      while (i < lines.length && /\t/.test(lines[i])) {
        rows.push(lines[i].trim().split(/\t+/).map((c) => c.trim()));
        i++;
      }
      i--;
      const cols = Math.max(...rows.map((r) => r.length));
      if (rows.length >= 2 && cols >= 2) {
        const pad = (r) => [...r, ...Array(cols - r.length).fill("")].join(" | ");
        out.push(`| ${pad(rows[0])} |`);
        out.push(`| ${Array(cols).fill("---").join(" | ")} |`);
        for (const r of rows.slice(1)) out.push(`| ${pad(r)} |`);
        out.push("");
      } else {
        for (const r of rows) out.push(r.join(" | "));
      }
      continue;
    }

    // indented "term – description" → definition bullet
    const def = line.match(/^\s{2,}([^\n–]{2,40}?)\s+[–—-]\s+(\S.*)$/);
    if (def) {
      out.push(`- **${def[1].trim()}** — ${withInlineCode(def[2].trim())}`);
      continue;
    }

    // any other indented block → plain text (drop the 4-space code-block indent)
    out.push(/^ {4,}\S/.test(line) ? line.replace(/^ {2,4}/, "") : line);
  }

  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    // keep consecutive bullets tight instead of a loose list
    .replace(/\n\n(- )/g, "\n$1")
    .trim() + "\n";
}

/** Convert a raw note into markdown. */
export function noteToMarkdown(raw) {
  const lines = dropToc(raw.replace(/\r\n/g, "\n").split("\n"));

  // ── classify ──────────────────────────────────────────────────────────
  const tokens = [];
  let inOutput = false;
  let prevNotBlank = null; // last emitted non-blank token type
  let lastCodeCommented = null; // was the previous code line commented out?

  /** A commented line at column 0 right after real code starts a NEW example
      (that's how the notes are written) — split the block there. */
  const pushCommentedCode = (raw) => {
    // raw keeps the original indentation, so we can tell an indented
    // in-example comment from a column-0 line that starts a new example
    if (lastCodeCommented === false && !isIndentedComment(raw)) {
      tokens.push({ type: "break" });
    }
    tokens.push({ type: "code", line: raw, commented: true });
    prevNotBlank = "code";
    lastCodeCommented = true;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isBlank(line)) {
      tokens.push({ type: "blank" });
      inOutput = false;
      lastCodeCommented = null;
      continue;
    }

    // uncommented line = real code (keep its indentation)
    if (!trimmed.startsWith("//")) {
      tokens.push({ type: "code", line: line.replace(/\s+$/, "") });
      prevNotBlank = "code";
      lastCodeCommented = false;
      inOutput = false;
      continue;
    }

    const prose = stripComment(line);

    // a tab-indented line right after code is part of that example (an object
    // literal's properties, a nested statement) and must not fall out of it
    if (/^\t/.test(inner(line)) && prevNotBlank === "code") {
      pushCommentedCode(line.replace(/\s+$/, ""));
      inOutput = false;
      continue;
    }

    // "// // \"foo\" 1" — the notes double-comment the output they observed
    const doubleComment = line.match(/^\/\/\s*\/\/\s*(.+)$/);
    if (doubleComment) {
      const payload = doubleComment[1].trim();
      const logged = payload.match(/^(?:logs?|output|o\/p|op)\s*:\s*(.+)$/i);
      // a double comment that still reads as code is code, not output
      if (!CODE_SIGNALS.some((re) => re.test(payload))) {
        tokens.push({ type: "value", text: (logged ? logged[1] : payload).trim() });
        prevNotBlank = "value";
        lastCodeCommented = null;
        inOutput = false;
        continue;
      }
    }

    // "// Logs: 3 5 7" / "// o/p: 1 2 3" — a recorded run of the example above
    const logged = prose.match(/^(?:logs?|output|o\/p|op)\s*:\s*(.+)$/i);
    if (logged) {
      tokens.push({ type: "value", text: logged[1].trim() });
      prevNotBlank = "value";
      lastCodeCommented = null;
      inOutput = false;
      continue;
    }

    // HTML markup in the notes → its own block
    if (HTML_LINE.test(prose)) {
      tokens.push({ type: "code", line: line.replace(/\s+$/, "") });
      prevNotBlank = "code";
      lastCodeCommented = false;
      inOutput = false;
      continue;
    }

    if (DIVIDER.test(prose) && /[-=_]{4,}/.test(prose)) {
      tokens.push({ type: "divider" });
      inOutput = false;
      lastCodeCommented = null;
      continue;
    }
    if (DIAGRAM.test(prose)) {
      tokens.push({ type: "code", line: prose });
      prevNotBlank = "code";
      lastCodeCommented = false;
      inOutput = false;
      continue;
    }

    // headings: "1.1 var, let and const" · "1. difference: reassign" · "Chapter: 2"
    const hX = prose.match(/^(\d+)\.(\d+)\s+(.+)$/);
    const hN = prose.match(/^(\d+)\.\s+(.+)$/);
    const hC = prose.match(/^(?:chapter|section)\s*[:.]?\s*(\d+)?\s*(.*)$/i);
    if (hX) {
      tokens.push({ type: "heading", level: 3, text: `${hX[1]}.${hX[2]} ${hX[3]}` });
      inOutput = false;
      continue;
    }
    if (hN) {
      tokens.push({ type: "heading", level: 4, text: hN[2] });
      inOutput = false;
      continue;
    }
    if (hC && (hC[1] || hC[2])) {
      tokens.push({ type: "heading", level: 2, text: hC[2] || `Chapter ${hC[1]}` });
      inOutput = false;
      continue;
    }

    // label on its own line: "theory:", "remember this:", "ex1:", "o/p:"
    const label = prose.match(new RegExp(`^(${LABEL_WORDS})\\s*:\\s*$`, "i"));
    if (label) {
      const isOutput = /^(o\/p|op|output)$/i.test(label[1]);
      tokens.push({ type: "label", text: titleCase(label[1]), isOutput });
      inOutput = isOutput;
      continue;
    }

    // an operator group ("// Arithmetic operators" then a list of bare symbols)
    const ops = operatorSection(lines, i);
    if (ops) {
      tokens.push({ type: "table", md: ops.md });
      prevNotBlank = "table";
      lastCodeCommented = null;
      inOutput = false;
      i = ops.next - 1;
      continue;
    }

    // a hand-aligned comparison table ("redeclare   y   n   n   var a; var a")
    const table = tableRun(lines, i);
    if (table) {
      tokens.push({ type: "table", md: table.md });
      prevNotBlank = "table";
      lastCodeCommented = null;
      inOutput = false;
      i = table.next - 1;
      continue;
    }

    // code-ish (the leading marker is stripped later if the whole block is comments)
    if (CODE_SIGNALS.some((re) => re.test(prose))) {
      pushCommentedCode(line.replace(/\s+$/, ""));
      inOutput = false;
      continue;
    }

    // bare statements: "var a", "let b", "return this.name"
    if (BARE_CODE.test(prose) && prose.split(/\s+/).length <= 2) {
      pushCommentedCode(line.replace(/\s+$/, ""));
      inOutput = false;
      continue;
    }

    // "var a // Declaration" — code with a trailing explanation. It belongs to the
    // example it sits in, so it stays in the block instead of becoming a bullet.
    const pair = prose.match(/^([^/]{1,60}?)\s{1,}\/\/\s*(\S.{0,120})$/);
    if (
      pair &&
      pair[1].split(/\s+/).length <= 4 &&
      /^[\w$]+(\s+|\s*[-+*/%<>=!&|^~?:]\s*)/.test(pair[1]) &&
      !/[.!?]$/.test(pair[2])
    ) {
      pushCommentedCode(line.replace(/\s+$/, ""));
      inOutput = false;
      continue;
    }

    // definition pair: "pending\tinitial state" / "primitive types    explanation"
    const def = prose.match(/^([\w .'-]{1,24}?)(?:\t+|[ ]{2,})(\S.*)$/);
    if (def && /\w/.test(def[1]) && !isSentence(def[2])) {
      tokens.push({
        type: "bullet",
        text: `**${def[1].trim()}** — ${withInlineCode(def[2].trim())}`,
      });
      prevNotBlank = "bullet";
      lastCodeCommented = null;
      inOutput = false;
      continue;
    }

    // short bare values → output listing (needs a run, or an Output: label)
    if (inOutput || (isBareValue(prose) && nextIsBareValue(lines, i))) {
      tokens.push({ type: "value", text: prose.trim() });
      prevNotBlank = "value";
      lastCodeCommented = null;
      continue;
    }

    // an INDENTED comment sitting inside an open code example (no blank line
    // before it) belongs to that block — column-0 comments are prose instead
    if (
      prevNotBlank === "code" &&
      /^\s{1,}\/\//.test(line) &&
      prose.length < 60 &&
      !/\/\//.test(prose)
    ) {
      tokens.push({ type: "code", line: line.replace(/\s+$/, ""), commented: true });
      continue;
    }

    const rendered = withInlineCode(prose.trim());
    if (/^[-•*]\s+/.test(prose)) {
      tokens.push({ type: "bullet", text: rendered.replace(/^[-•*]\s+/, "") });
      prevNotBlank = "bullet";
    } else {
      tokens.push({ type: "prose", text: rendered });
      prevNotBlank = "prose";
    }
    lastCodeCommented = null;
    inOutput = false;
  }

  return assemble(tokens);
}

/** The notes start each file with `// Chapter: n` + topic list — drop it. */
function dropToc(lines) {
  const firstIdx = lines.findIndex((l) => !isBlank(l));
  if (firstIdx === -1) return lines;
  if (!/^\/\/\s*(chapter|section)\b/i.test(lines[firstIdx].trim())) return lines;
  let i = firstIdx;
  while (i < lines.length && !isBlank(lines[i])) i++; // the whole run
  while (i < lines.length && isBlank(lines[i])) i++; // and the blank after it
  return lines.slice(i);
}

/** A multi-word sentence ending in "." — prose, not a definition value. */
function isSentence(desc) {
  const t = desc.trim();
  return t.endsWith(".") && t.split(/\s+/).length > 4;
}

/** `// ============ end ============` style separators carry no meaning. */
function isMarkerLine(s) {
  const t = s.trim();
  if (!t) return true;
  const sym = (t.match(/[=\-*~#/\\|_+. ]/g) || []).length;
  return /[=\-~#]{3,}/.test(t) && sym / t.length > 0.7;
}

/** 1-3 short tokens with no code punctuation → an output listing value */
function isBareValue(prose) {
  const p = prose.trim();
  if (!p || p.length > 24) return false;
  if (/[=;{}$@]/.test(p)) return false;
  if (!/^[\w .,'"`+*/%<>()[\]-]+$/.test(p)) return false;
  return p.split(/\s+/).length <= 3;
}

/** The following non-blank line is also a bare value (a listing run) */
function nextIsBareValue(lines, i) {
  for (let j = i + 1; j < lines.length; j++) {
    if (isBlank(lines[j])) continue;
    const t = lines[j].trim().replace(/^\/\/\s?/, "");
    return t.startsWith("//") ? isBareValue(t) : false;
  }
  return false;
}

function titleCase(word) {
  const map = {
    "o/p": "Output",
    op: "Output",
    output: "Output",
    input: "Input",
    usecase: "Use case",
    "use case": "Use case",
    "remember this": "Remember this",
    remember: "Remember",
    ex: "Example",
  };
  if (map[word.toLowerCase()]) return map[word.toLowerCase()];
  const w = word.toLowerCase();
  return w.charAt(0).toUpperCase() + w.slice(1);
}

/** Group tokens into markdown blocks. */
function assemble(tokens) {
  const out = [];
  let code = [];
  let values = [];
  let bullets = [];
  let blanksSinceCode = 0;
  let runGap = Infinity; // blank lines between the previous code block and this run
  let prevType = null;

  const flushCode = () => {
    while (code.length && code[code.length - 1].trim() === "") code.pop();
    if (!code.length) return;

    // A block where EVERY line was commented out in the notes is an example the
    // learner should read (and run) as real code: strip the leading markers but
    // keep any trailing comments. Blocks that mix real + commented lines keep
    // their markers, because there the commenting is the lesson.
    let body = code;
    if (code.every((l) => l.trim().startsWith("//"))) {
      body = code
        .map((l) =>
          // some notes double-comment the payload ("// // \"0\" \"1\""),
          // so peel every leading marker, not just the first
          l.trim().replace(/^(?:\/\/\s?)+/, "")
        )
        .filter((l) => l.trim() && !isMarkerLine(l));
    }
    if (!body.length) {
      code = [];
      return;
    }

    // a single blank line inside a code run doesn't split the block
    const lang = fenceLangFor(body);
    const last = out[out.length - 1];
    const prevLang = typeof last === "string" ? /^```([a-z]+)\n/.exec(last)?.[1] : null;
    if (runGap <= 1 && typeof last === "string" && prevLang && last.endsWith("\n```")) {
      const head = "```" + prevLang + "\n";
      const merged = last.slice(head.length, -4) + "\n" + body.join("\n");
      out[out.length - 1] = head + merged + "\n```";
    } else {
      out.push("```" + lang + "\n" + body.join("\n") + "\n```");
    }
    code = [];
    prevType = "code";
  };
  const flushValues = () => {
    if (values.length) {
      out.push("```text\n" + values.join("\n") + "\n```");
      prevType = "code";
    }
    values = [];
  };
  const flushBullets = () => {
    if (bullets.length) {
      out.push(bullets.map((b) => `- ${b}`).join("\n"));
      prevType = "bullets";
    }
    bullets = [];
  };
  const flushAll = () => {
    flushCode();
    flushValues();
    flushBullets();
  };

  for (const t of tokens) {
    switch (t.type) {
      case "blank":
        blanksSinceCode++;
        // two or more blank lines end a code run: the next block is a new example
        if (code.length && blanksSinceCode >= 2) {
          flushCode();
          blanksSinceCode = 0;
        }
        flushValues();
        flushBullets();
        if (!code.length) prevType = null;
        break;
      case "code":
        flushValues();
        flushBullets();
        if (code.length === 0) {
          runGap = blanksSinceCode;
          blanksSinceCode = 0;
        }
        code.push(t.line);
        break;
      case "value":
        flushCode();
        flushBullets();
        values.push(t.text);
        break;
      case "break":
        flushCode();
        // never re-merge with the block we just split off
        runGap = Infinity;
        blanksSinceCode = 99;
        prevType = null;
        break;
      case "bullet":
        flushCode();
        flushValues();
        bullets.push(t.text);
        break;
      case "table":
        flushAll();
        out.push(t.md);
        prevType = "table";
        break;
      case "heading": {
        flushAll();
        const text = withInlineCode(t.text)
          .replace(/\s{2,}/g, " ")
          .replace(/:\s*$/, "")
          .trim();
        if (prevType !== "heading") out.push(`${"#".repeat(t.level)} ${text}`);
        prevType = "heading";
        break;
      }
      case "label": {
        flushAll();
        if (t.isOutput) {
          out.push("**Output**");
          prevType = "label";
        } else {
          out.push(`#### ${t.text}`);
          prevType = "heading";
        }
        break;
      }
      case "divider": {
        flushAll();
        if (prevType !== "divider" && prevType !== "heading") out.push("---");
        prevType = "divider";
        break;
      }
      default:
        flushAll();
        out.push(t.text);
        prevType = "prose";
    }
  }
  flushAll();

  // collapse duplicate dividers / trim
  const md = [];
  for (const block of out) {
    if (block === "---" && md[md.length - 1] === "---") continue;
    md.push(block);
  }
  return md.join("\n\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}