/**
 * Browser speech-to-text mangles developer jargon ("node js" → "nodges", etc.).
 * These fixups run only on the live browser preview / fallback transcript.
 * The authoritative Whisper transcript is left untouched — Whisper already
 * understands the domain, and aggressive replacements would damage it.
 *
 * Keep this list to unambiguous, multi-word technical phrases. Single common
 * English words ("closer", "frame", "hosting") must not be rewritten.
 */

const FIXUPS: Array<[RegExp, string]> = [
  // Languages / frameworks
  [/\bjava\s?script\b/gi, "JavaScript"],
  [/\btype\s?script\b/gi, "TypeScript"],
  [/\bnode\s?j\s?s\b/gi, "Node.js"],
  [/\bnext\s?j\s?s\b/gi, "Next.js"],
  [/\breact\s?j\s?s\b/gi, "React.js"],
  [/\bvue\s?j\s?s\b/gi, "Vue.js"],
  [/\bmongo\s?db\b/gi, "MongoDB"],
  [/\bmy\s?sequel\b/gi, "MySQL"],
  [/\bpost\s?gres(?:ql)?\b/gi, "PostgreSQL"],
  [/\bsequel\b/gi, "SQL"],

  // React / JS API names
  [/\buse\s?state\b/gi, "useState"],
  [/\buse\s?effect\b/gi, "useEffect"],
  [/\buse\s?memo\b/gi, "useMemo"],
  [/\buse\s?ref\b/gi, "useRef"],
  [/\buse\s?context\b/gi, "useContext"],
  [/\buse\s?reducer\b/gi, "useReducer"],
  [/\bstring\s?if\s?(?:y|i|ied)\b/gi, "stringify"],
  [/\bdot\s+(?=(?:then|catch|finally|map|filter|reduce)\b)/gi, "."],
  [/\s+then\b(?=\s*\()/g, ".then("],

  // Symbols / operators
  [/\bplus\s+equals\b/gi, "+="],
  [/\bdouble\s+equals\b/gi, "=="],
  [/\btriple\s+equals\b/gi, "==="],
  [/\bgreater\s+than\s+or\s+equal\s+to\b/gi, ">="],
  [/\bless\s+than\s+or\s+equal\s+to\b/gi, "<="],
  [/\bn\s+plus\s+one\b/gi, "N+1"],

  // Acronyms that STT often spells out
  [/\ba\s?p\s?i\b/gi, "API"],
  [/\bc\s?r\s?u\s?d\b/gi, "CRUD"],
  [/\bo\s?r\s?m\b/gi, "ORM"],
  [/\bs\s?s\s?r\b/gi, "SSR"],
  [/\bc\s?s\s?s\b/gi, "CSS"],
  [/\bh\s?t\s?m\s?l\b/gi, "HTML"],
  [/\bj\s?s\s?x\b/gi, "JSX"],
  [/\bt\s?s\s?x\b/gi, "TSX"],

  // Common phrases
  [/\bevent\s+loop\b/gi, "event loop"],
  [/\bmicro\s?task\b/gi, "microtask"],
  [/\bcall\s?back\b/gi, "callback"],
  [/\barrow\s+function\b/gi, "arrow function"],
  [/\bi\s?frame\b/gi, "iframe"],
  [/\bvirtual\s?dom\b/gi, "virtual DOM"],
  [/\brest\s?api\b/gi, "REST API"],
  [/\bbig\s?o\b/gi, "Big O"],
];

/** Apply conservative transcript fixups; collapses the whitespace they introduce. */
export function fixupTranscript(text: string): string {
  let out = text;
  for (const [re, to] of FIXUPS) out = out.replace(re, to);
  return out.replace(/[ \t]{2,}/g, " ").trim();
}
