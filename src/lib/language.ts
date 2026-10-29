// Shared language metadata used by the playground, showcase cards and downloads.
// `value` is our key, `glot` is the glot.io docker image name, `ace` is the Ace editor mode.
export const LANGUAGES = [
  { value: "javascript", label: "JavaScript", glot: "javascript", ace: "javascript" },
  { value: "typescript", label: "TypeScript", glot: "typescript", ace: "typescript" },
  { value: "react", label: "React", glot: "javascript", ace: "jsx" },
  { value: "sql", label: "SQL", glot: "sql", ace: "sql" },
  { value: "python", label: "Python", glot: "python", ace: "python" },
  { value: "c_cpp", label: "C++", glot: "clang", ace: "c_cpp" },
  { value: "java", label: "Java", glot: "java", ace: "java" },
  { value: "go", label: "Go", glot: "golang", ace: "golang" },
  { value: "rust", label: "Rust", glot: "rust", ace: "rust" },
  { value: "php", label: "PHP", glot: "php", ace: "php" },
  { value: "csharp", label: "C#", glot: "csharp", ace: "csharp" },
  { value: "lua", label: "Lua", glot: "lua", ace: "lua" },
  { value: "kotlin", label: "Kotlin", glot: "kotlin", ace: "kotlin" },
  { value: "dart", label: "Dart", glot: "dart", ace: "dart" },
  { value: "swift", label: "Swift", glot: "swift", ace: "swift" },
  { value: "ruby", label: "Ruby", glot: "ruby", ace: "ruby" },
  { value: "bash", label: "Bash", glot: "bash", ace: "sh" },
  { value: "assembly", label: "Assembly (x86-64)", glot: "assembly", ace: "assembly_x86" },
] as const;

export type LanguageValue = (typeof LANGUAGES)[number]["value"];

/**
 * Markdown fences and course slugs are not always the playground's exact
 * language keys. `jsx` should open the React preview, while `tsx` / `nextjs`
 * stay on TypeScript — otherwise the editor falls back to Python.
 */
const LANGUAGE_ALIASES: Record<string, LanguageValue> = {
  js: "javascript",
  jsx: "react",
  ts: "typescript",
  tsx: "typescript",
  nextjs: "typescript",
  next: "typescript",
  postgres: "sql",
  postgresql: "sql",
  pgsql: "sql",
  mysql: "sql",
  sqlite: "sql",
  mssql: "sql",
  sqlserver: "sql",
  py: "python",
  cpp: "c_cpp",
  "c++": "c_cpp",
  golang: "go",
  rs: "rust",
  cs: "csharp",
  "c#": "csharp",
  kt: "kotlin",
  rb: "ruby",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  asm: "assembly",
  nasm: "assembly",
};

/** Resolve a fence tag, course slug or query value to a runnable language key. */
export function resolveLanguage(value: string | null | undefined): LanguageValue | null {
  if (!value) return null;
  const key = value.toLowerCase().trim();
  const direct = LANGUAGES.find((l) => l.value === key);
  if (direct) return direct.value;
  return LANGUAGE_ALIASES[key] ?? null;
}

/**
 * Some fences resolve to a playground language but are not actually runnable:
 * Prisma/Mongoose client code needs a database, Next.js examples need a server,
 * and most of the SQL course's DDL/DML is blocked by the read-only SQL sandbox.
 *
 * `isRunnableSnippet` answers the narrower "should this block get a Run button?"
 * question. It is deliberately conservative: hiding a Run button is a small
 * loss, while sending someone into the Playground to hit a guaranteed error is
 * a much worse experience.
 */
const SQL_READ_ONLY_STARTS = new Set([
  "SELECT",
  "WITH",
  "VALUES",
  "EXPLAIN",
  "SHOW",
  "DESCRIBE",
  "PRAGMA",
  "TABLE",
]);

const SQL_WRITE_WORDS =
  /\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|REPLACE|MERGE|BEGIN|COMMIT|ROLLBACK|GRANT|REVOKE|CALL|DO)\b/i;

export function isRunnableSnippet(
  language: string | null | undefined,
  code: string
): boolean {
  const resolved = resolveLanguage(language);
  if (!resolved) return false;

  if (resolved === "sql") {
    // Strip comments before looking at the first keyword so a leading
    // `-- explain ...` comment does not hide a perfectly runnable SELECT.
    const cleaned = code
      .replace(/--[^\n]*/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .trim();
    if (!cleaned) return false;

    const first = cleaned.match(/^[a-z]+/i)?.[0]?.toUpperCase();
    if (!first || !SQL_READ_ONLY_STARTS.has(first)) return false;
    return !SQL_WRITE_WORDS.test(cleaned);
  }

  // A JS/TS block that imports a server-only package will not run in the
  // browser/glot playground, even though the fence tag itself is executable.
  if (resolved === "javascript" || resolved === "typescript" || resolved === "react") {
    if (
      /(?:from\s+["']|require\(\s*["'])(?:@prisma\/client|mongoose|mongodb|next\/|@prisma\/adapter-)/.test(
        code
      )
    ) {
      return false;
    }
  }

  return true;
}


export const FILE_NAME: Record<string, string> = {
  javascript: "main.js",
  typescript: "main.ts",
  react: "App.jsx",
  sql: "query.sql",
  python: "main.py",
  c_cpp: "main.cpp",
  java: "Main.java",
  go: "main.go",
  rust: "main.rs",
  php: "main.php",
  csharp: "main.cs",
  lua: "main.lua",
  kotlin: "main.kt",
  dart: "main.dart",
  swift: "main.swift",
  ruby: "main.rb",
  bash: "main.sh",
  assembly: "main.asm",
};

export function fileNameFor(language: string): string {
  return FILE_NAME[language] ?? "snippet.txt";
}

/** Ace editor mode for a language key (falls back to plain text) */
export function aceModeFor(language: string): string {
  return LANGUAGES.find((l) => l.value === language)?.ace ?? "plain_text";
}

/** Language label for a language key */
export function languageLabel(language: string): string {
  return LANGUAGES.find((l) => l.value === language)?.label ?? language;
}
