// Shared language metadata used by the playground, showcase cards and downloads.
// `value` is our key, `glot` is the glot.io docker image name, `ace` is the Ace editor mode.
export const LANGUAGES = [
  { value: "javascript", label: "JavaScript", glot: "javascript", ace: "javascript" },
  { value: "typescript", label: "TypeScript", glot: "typescript", ace: "typescript" },
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

export const FILE_NAME: Record<string, string> = {
  javascript: "main.js",
  typescript: "main.ts",
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
