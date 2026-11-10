import type { CodeProblem, ParamType, PracticeLanguage, ReturnType } from "@/data/code-tests/types";

/**
 * LeetCode-style execution.
 *
 * The learner writes a single function and returns a value. This module turns a
 * problem's stored test input into typed arguments, renders the stub the editor
 * starts from, and appends a tiny driver that calls the function with those
 * arguments and prints the result — so no problem ever asks anyone to read
 * stdin, split lines or build output by hand.
 */

export type ParsedParam = { name: string; type: ParamType };

export function parseParams(spec: string): ParsedParam[] {
  return spec
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, type] = part.split(":");
      return { name: name.trim(), type: (type?.trim() || "int") as ParamType };
    });
}

function numbersIn(text: string): number[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed
    .split(",")
    .map((piece) => Number(piece.trim()))
    .filter((value) => !Number.isNaN(value));
}

/** Turn a stored test input into the argument list for the learner's function. */
export function parseArgs(problem: CodeProblem, input: string): unknown[] {
  const lines = input.split("\n");
  const params = parseParams(problem.params);
  const args: unknown[] = [];
  let lineIndex = 0;
  let tokens: string[] | null = null;

  const loadLine = (): boolean => {
    if (lineIndex >= lines.length) return false;
    tokens = lines[lineIndex++].split(",").map((token) => token.trim());
    return true;
  };

  const takeInt = (): number => {
    if (!tokens || tokens.length === 0) {
      if (!loadLine()) return 0;
    }
    const raw = tokens!.shift() ?? "";
    const value = Number(raw);
    return Number.isNaN(value) ? 0 : value;
  };

  const takeInts = (): number[] => {
    if (tokens && tokens.length > 0) {
      const rest = tokens;
      tokens = null;
      return numbersIn(rest.join(","));
    }
    if (lineIndex >= lines.length) return [];
    const line = lines[lineIndex++];
    tokens = null;
    return line.trim() ? numbersIn(line) : [];
  };

  for (const param of params) {
    switch (param.type) {
      case "int":
        args.push(takeInt());
        break;
      case "ints":
        args.push(takeInts());
        break;
      case "string":
        args.push(lines[lineIndex++] ?? "");
        tokens = null;
        break;
      case "words": {
        const line = lines[lineIndex++] ?? "";
        tokens = null;
        args.push(line.trim() ? line.split(",").map((word) => word.trim()) : []);
        break;
      }
      case "lines": {
        const rest = lines.slice(lineIndex);
        lineIndex = lines.length;
        tokens = null;
        args.push(rest);
        break;
      }
      case "matrix": {
        const dims = numbersIn(lines[lineIndex++] ?? "");
        const rows = dims[0] ?? 0;
        const grid = lines.slice(lineIndex, lineIndex + rows).map(numbersIn);
        lineIndex += rows;
        tokens = null;
        args.push(grid);
        break;
      }
    }
  }
  return args;
}

/* ------------------------------------------------------------------ */
/* language details                                                    */
/* ------------------------------------------------------------------ */

type Lang = {
  file: string;
  /** comment prefix used for the stub body */
  comment: string;
  /** marker line that the driver replaces; keeps the driver in the right scope */
  marker: string;
  /** languages that name functions in snake_case */
  snake?: boolean;
};

export const PRACTICE_LANGUAGES: { value: PracticeLanguage; label: string }[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c_cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "kotlin", label: "Kotlin" },
  { value: "dart", label: "Dart" },
  { value: "swift", label: "Swift" },
  { value: "lua", label: "Lua" },
];

const LANGS: Record<PracticeLanguage, Lang> = {
  javascript: { file: "main.js", comment: "//", marker: "//__RUN__" },
  typescript: { file: "main.ts", comment: "//", marker: "//__RUN__" },
  python: { file: "main.py", comment: "#", marker: "#__RUN__", snake: true },
  java: { file: "Main.java", comment: "//", marker: "//__RUN__" },
  c_cpp: { file: "main.cpp", comment: "//", marker: "//__RUN__" },
  csharp: { file: "main.cs", comment: "//", marker: "//__RUN__" },
  go: { file: "main.go", comment: "//", marker: "//__RUN__" },
  rust: { file: "main.rs", comment: "//", marker: "//__RUN__" },
  php: { file: "main.php", comment: "//", marker: "//__RUN__" },
  ruby: { file: "main.rb", comment: "#", marker: "#__RUN__", snake: true },
  kotlin: { file: "main.kt", comment: "//", marker: "//__RUN__" },
  dart: { file: "main.dart", comment: "//", marker: "//__RUN__" },
  swift: { file: "main.swift", comment: "//", marker: "//__RUN__" },
  lua: { file: "main.lua", comment: "--", marker: "--__RUN__", snake: true },
};

export function fileFor(language: PracticeLanguage): string {
  return LANGS[language].file;
}

export function isPracticeLanguage(value: string | null | undefined): value is PracticeLanguage {
  return !!value && value in LANGS;
}

export function labelFor(language: PracticeLanguage): string {
  return PRACTICE_LANGUAGES.find((entry) => entry.value === language)?.label ?? language;
}

export function aceMode(language: PracticeLanguage | "sql"): string {
  return language === "sql" ? "sql" : language === "c_cpp" ? "c_cpp" : language === "csharp" ? "csharp" : language;
}

function snakeCase(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

function fnName(problem: CodeProblem, language: PracticeLanguage): string {
  return LANGS[language].snake ? snakeCase(problem.fn) : problem.fn;
}

const LABEL: Record<ParamType, string> = {
  int: "number",
  ints: "number[]",
  string: "string",
  words: "string[]",
  lines: "string[]",
  matrix: "number[][]",
};

/** Human-readable signature, used by the problem page's signature card. */
export function describeSignature(problem: CodeProblem): string {
  const params = parseParams(problem.params)
    .map((param) => `${param.name}: ${LABEL[param.type]}`)
    .join(", ");
  const returns =
    problem.returns === "float1"
      ? "number"
      : problem.returns === "bool"
        ? "boolean"
        : problem.returns === "int"
          ? "number"
          : problem.returns === "string"
            ? "string"
            : problem.returns === "matrix"
              ? "number[][]"
              : problem.returns === "words" || problem.returns === "lines"
                ? "string[]"
                : "number[]";
  return `${problem.fn}(${params}): ${returns}`;
}

/* ------------------------------------------------------------------ */
/* literals, stubs and drivers                                         */
/* ------------------------------------------------------------------ */

function quote(value: string): string {
  return JSON.stringify(value);
}

/** A literal for a JS value in the target language. */
function literal(language: PracticeLanguage, type: ParamType, value: unknown): string {
  const nums = (value as number[]) ?? [];
  const strs = (value as string[]) ?? [];
  switch (type) {
    case "int":
      return String(value);
    case "ints":
      switch (language) {
        case "java":
          return `new int[]{${nums.join(", ")}}`;
        case "c_cpp":
          return `std::vector<int>{${nums.join(", ")}}`;
        case "csharp":
          return `new int[]{${nums.join(", ")}}`;
        case "go":
          return `[]int{${nums.join(", ")}}`;
        case "rust":
          return `vec![${nums.join(", ")}]`;
        case "kotlin":
          return `intArrayOf(${nums.join(", ")})`;
        case "lua":
          return `{${nums.join(", ")}}`;
        default:
          return `[${nums.join(", ")}]`;
      }
    case "string":
      switch (language) {
        case "rust":
          return `${quote(String(value))}.to_string()`;
        default:
          return quote(String(value));
      }
    case "words":
    case "lines":
      switch (language) {
        case "lua":
          return `{${strs.map(quote).join(", ")}}`;
        case "java":
          return `new String[]{${strs.map(quote).join(", ")}}`;
        case "c_cpp":
          return `std::vector<std::string>{${strs.map(quote).join(", ")}}`;
        case "csharp":
          return `new string[]{${strs.map(quote).join(", ")}}`;
        case "go":
          return `[]string{${strs.map(quote).join(", ")}}`;
        case "rust":
          return `vec![${strs.map((s) => `${quote(s)}.to_string()`).join(", ")}]`;
        case "kotlin":
          return `listOf(${strs.map(quote).join(", ")})`;
        default:
          return `[${strs.map(quote).join(", ")}]`;
      }
    case "matrix": {
      const grid = (value as number[][]) ?? [];
      const rows = grid.map((row) => `[${row.join(", ")}]`);
      switch (language) {
        case "java":
          return `new int[][]{${grid.map((row) => `new int[]{${row.join(", ")}}`).join(", ")}}`;
        case "c_cpp":
          return `std::vector<std::vector<int>>{${grid.map((row) => `{${row.join(", ")}}`).join(", ")}}`;
        case "csharp":
          return `new int[][]{${grid.map((row) => `new int[]{${row.join(", ")}}`).join(", ")}}`;
        case "go":
          return `[][]int{${grid.map((row) => `{${row.join(", ")}}`).join(", ")}}`;
        case "rust":
          return `vec![${grid.map((row) => `vec![${row.join(", ")}]`).join(", ")}]`;
        case "kotlin":
          return `arrayOf(${grid.map((row) => `intArrayOf(${row.join(", ")})`).join(", ")})`;
        case "lua":
          return `{${grid.map((row) => `{${row.join(", ")}}`).join(", ")}}`;
        default:
          return `[${rows.join(", ")}]`;
      }
    }
  }
}

function typeText(language: PracticeLanguage, type: ParamType): string {
  switch (language) {
    case "typescript":
      return type === "int" ? "number" : type === "string" ? "string" : type === "matrix" ? "number[][]" : type === "ints" ? "number[]" : "string[]";
    case "python":
      return type === "int" ? "int" : type === "string" ? "str" : type === "ints" ? "list[int]" : type === "matrix" ? "list[list[int]]" : "list[str]";
    case "java":
      return type === "int" ? "int" : type === "string" ? "String" : type === "ints" ? "int[]" : type === "matrix" ? "int[][]" : "String[]";
    case "c_cpp":
      return type === "int" ? "int" : type === "string" ? "std::string" : type === "ints" ? "std::vector<int>" : type === "matrix" ? "std::vector<std::vector<int>>" : "std::vector<std::string>";
    case "csharp":
      return type === "int" ? "int" : type === "string" ? "string" : type === "ints" ? "int[]" : type === "matrix" ? "int[][]" : "string[]";
    case "go":
      return type === "int" ? "int" : type === "string" ? "string" : type === "ints" ? "[]int" : type === "matrix" ? "[][]int" : "[]string";
    case "rust":
      return type === "int" ? "i64" : type === "string" ? "String" : type === "ints" ? "Vec<i64>" : type === "matrix" ? "Vec<Vec<i64>>" : "Vec<String>";
    case "kotlin":
      return type === "int" ? "Int" : type === "string" ? "String" : type === "ints" ? "IntArray" : type === "matrix" ? "Array<IntArray>" : "List<String>";
    case "dart":
      return type === "int" ? "int" : type === "string" ? "String" : type === "ints" ? "List<int>" : type === "matrix" ? "List<List<int>>" : "List<String>";
    case "swift":
      return type === "int" ? "Int" : type === "string" ? "String" : type === "ints" ? "[Int]" : type === "matrix" ? "[[Int]]" : "[String]";
    default:
      return "";
  }
}

function returnText(language: PracticeLanguage, returns: ReturnType): string {
  const map: Record<ReturnType, ParamType | "float"> = {
    int: "int",
    bool: "int",
    string: "string",
    ints: "ints",
    words: "words",
    lines: "lines",
    matrix: "matrix",
    float1: "int",
  };
  if (returns === "bool") {
    switch (language) {
      case "typescript":
        return "boolean";
      case "python":
      case "rust":
      case "dart":
        return "bool";
      case "java":
        return "boolean";
      case "csharp":
        return "bool";
      case "c_cpp":
      case "go":
        return "bool";
      case "kotlin":
        return "Boolean";
      case "swift":
        return "Bool";
      default:
        return "";
    }
  }
  if (returns === "float1") {
    switch (language) {
      case "typescript":
        return "number";
      case "python":
        return "float";
      case "java":
      case "csharp":
        return "double";
      case "c_cpp":
        return "double";
      case "go":
        return "float64";
      case "rust":
        return "f64";
      case "kotlin":
        return "Double";
      case "dart":
        return "double";
      case "swift":
        return "Double";
      default:
        return "";
    }
  }
  return typeText(language, map[returns] as ParamType);
}

/** How a parameter is written in the target language. */
function paramDecl(language: PracticeLanguage, param: ParsedParam): string {
  const type = typeText(language, param.type);
  switch (language) {
    // name: type
    case "typescript":
    case "kotlin":
    case "swift":
    case "rust":
    case "python":
      return type ? `${param.name}: ${type}` : param.name;
    // type name
    case "java":
    case "c_cpp":
    case "csharp":
    case "dart":
      return `${type} ${param.name}`;
    // name type
    case "go":
      return `${param.name} ${type}`;
    case "php":
      return `$${param.name}`;
    default:
      return param.name;
  }
}

function stubBody(problem: CodeProblem, language: PracticeLanguage): string {
  const lang = LANGS[language];
  const name = fnName(problem, language);
  const params = parseParams(problem.params);
  const args = params.map((param) => paramDecl(language, param)).join(", ");
  const ret = returnText(language, problem.returns);
  const retSuffix = ret ? `: ${ret}` : "";

  switch (language) {
    case "javascript":
      return `function ${name}(${args}) {\n  ${lang.comment} your code here\n}\n\n${lang.marker}`;
    case "typescript":
      return `function ${name}(${args})${retSuffix} {\n  ${lang.comment} your code here\n}\n\n${lang.marker}`;
    case "python":
      return `def ${name}(${args}):\n    ${lang.comment} your code here\n\n${lang.marker}`;
    case "java":
      return `import java.util.*;\n\npublic class Main {\n    static ${ret || "int"} ${name}(${args}) {\n        ${lang.comment} your code here\n    }\n\n    ${lang.marker}\n}`;
    case "c_cpp":
      return `#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\n#include <map>\n#include <set>\n#include <sstream>\n#include <iomanip>\nusing namespace std;\n\n${ret || "int"} ${name}(${args}) {\n    ${lang.comment} your code here\n}\n\n${lang.marker}`;
    case "csharp":
      // Collections come with the starter, the way Java's `java.util.*` does:
      // a learner should not have to add a using line to write a List.
      return `using System;\nusing System.Collections.Generic;\nusing System.Linq;\n\nclass Program {\n    static ${ret || "int"} ${name}(${args}) {\n        ${lang.comment} your code here\n    }\n\n    ${lang.marker}\n}`;
    case "go":
      return `package main\n\nimport (\n\t"fmt"\n\t"strings"\n)\n\nfunc ${name}(${args}) ${ret || "int"} {\n\t${lang.comment} your code here\n}\n\n${lang.marker}`;
    case "rust":
      return `fn ${name}(${args}) -> ${ret || "i64"} {\n    ${lang.comment} your code here\n}\n\n${lang.marker}`;
    case "php":
      return `<?php\n\nfunction ${name}(${args}) {\n    ${lang.comment} your code here\n}\n\n${lang.marker}`;
    case "ruby":
      return `def ${name}(${args})\n  ${lang.comment} your code here\nend\n\n${lang.marker}`;
    case "kotlin":
      return `fun ${name}(${args})${retSuffix} {\n    ${lang.comment} your code here\n}\n\n${lang.marker}`;
    case "dart":
      return `${ret || "int"} ${name}(${args}) {\n  ${lang.comment} your code here\n}\n\n${lang.marker}`;
    case "swift":
      return `import Foundation\n\nfunc ${name}(${args}) -> ${ret || "Int"} {\n    ${lang.comment} your code here\n}\n\n${lang.marker}`;
    case "lua":
      return `function ${name}(${args})\n  ${lang.comment} your code here\nend\n\n${lang.marker}`;
  }
}

/** The code the editor starts from: a signature, no I/O plumbing. */
export function stubFor(problem: CodeProblem, language: PracticeLanguage): string {
  return stubBody(problem, language);
}

const CALL = "RESULT";

function printResult(problem: CodeProblem, language: PracticeLanguage, call: string): string {
  const ret = problem.returns;
  switch (language) {
    case "javascript":
    case "typescript":
      if (ret === "ints") return `console.log(${call}.join(" "));`;
      if (ret === "words") return `console.log(${call}.join(" "));`;
      if (ret === "lines") return `console.log(${call}.join("\\n"));`;
      if (ret === "matrix") return `for (const row of ${call}) console.log(row.join(" "));`;
      if (ret === "float1") return `console.log(${call}.toFixed(1));`;
      if (ret === "bool") return `console.log(${call} ? "true" : "false");`;
      return `console.log(${call});`;
    case "python":
      if (ret === "ints" || ret === "words") return `print(" ".join(str(v) for v in ${call}))`;
      if (ret === "lines") return `print("\\n".join(str(v) for v in ${call}))`;
      if (ret === "matrix") return `for row in ${call}:\n    print(" ".join(str(v) for v in row))`;
      if (ret === "float1") return `print(f"{${call}:.1f}")`;
      if (ret === "bool") return `print("true" if ${call} else "false")`;
      return `print(${call})`;
    case "java":
      if (ret === "ints") return `System.out.println(joinInts(${call}));`;
      if (ret === "words") return `System.out.println(String.join(" ", ${call}));`;
      if (ret === "lines") return `System.out.println(String.join("\\n", ${call}));`;
      if (ret === "matrix") return `for (int[] row : ${call}) System.out.println(joinInts(row));`;
      if (ret === "float1") return `System.out.printf("%.1f%n", ${call});`;
      if (ret === "bool") return `System.out.println(${call} ? "true" : "false");`;
      return `System.out.println(${call});`;
    case "c_cpp":
      if (ret === "ints") return `for (size_t i = 0; i < ${call}.size(); i++) cout << (i ? " " : "") << ${call}[i];\n    cout << endl;`;
      if (ret === "words") return `for (size_t i = 0; i < ${call}.size(); i++) cout << (i ? " " : "") << ${call}[i];\n    cout << endl;`;
      if (ret === "lines") return `for (size_t i = 0; i < ${call}.size(); i++) cout << (i ? "\\n" : "") << ${call}[i];\n    cout << endl;`;
      if (ret === "matrix")
        return `for (size_t r = 0; r < ${call}.size(); r++) {\n        for (size_t c = 0; c < ${call}[r].size(); c++) cout << (c ? " " : "") << ${call}[r][c];\n        cout << endl;\n    }`;
      if (ret === "float1") return `cout << fixed << setprecision(1) << ${call} << endl;`;
      if (ret === "bool") return `cout << (${call} ? "true" : "false") << endl;`;
      return `cout << ${call} << endl;`;
    case "csharp":
      if (ret === "ints") return `Console.WriteLine(string.Join(" ", ${call}));`;
      if (ret === "words") return `Console.WriteLine(string.Join(" ", ${call}));`;
      if (ret === "lines") return `Console.WriteLine(string.Join("\\n", ${call}));`;
      if (ret === "matrix") return `foreach (var row in ${call}) Console.WriteLine(string.Join(" ", row));`;
      if (ret === "float1") return `Console.WriteLine(${call}.ToString("F1"));`;
      if (ret === "bool") return `Console.WriteLine(${call} ? "true" : "false");`;
      return `Console.WriteLine(${call});`;
    case "go":
      if (ret === "ints") return `parts := make([]string, len(${call}))\n\tfor i, v := range ${call} {\n\t\tparts[i] = fmt.Sprint(v)\n\t}\n\tfmt.Println(strings.Join(parts, " "))`;
      if (ret === "words") return `fmt.Println(strings.Join(${call}, " "))`;
      if (ret === "lines") return `fmt.Println(strings.Join(${call}, "\\n"))`;
      if (ret === "matrix")
        return `for _, row := range ${call} {\n\t\tparts := make([]string, len(row))\n\t\tfor i, v := range row {\n\t\t\tparts[i] = fmt.Sprint(v)\n\t\t}\n\t\tfmt.Println(strings.Join(parts, " "))\n\t}`;
      if (ret === "float1") return `fmt.Printf("%.1f\\n", ${call})`;
      if (ret === "bool") return `fmt.Println(${call})`;
      return `fmt.Println(${call})`;
    case "rust":
      if (ret === "ints") return `println!("{}", ${call}.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(" "));`;
      if (ret === "words") return `println!("{}", ${call}.join(" "));`;
      if (ret === "lines") return `println!("{}", ${call}.join("\\n"));`;
      if (ret === "matrix")
        return `for row in &${call} {\n        println!("{}", row.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(" "));\n    }`;
      if (ret === "float1") return `println!("{:.1}", ${call});`;
      if (ret === "bool") return `println!("{}", ${call});`;
      return `println!("{}", ${call});`;
    case "php":
      if (ret === "ints" || ret === "words") return `echo implode(" ", ${call}) . "\\n";`;
      if (ret === "lines") return `echo implode("\\n", ${call}) . "\\n";`;
      if (ret === "matrix") return `foreach (${call} as $row) echo implode(" ", $row) . "\\n";`;
      if (ret === "float1") return `echo number_format(${call}, 1, ".", "") . "\\n";`;
      if (ret === "bool") return `echo (${call} ? "true" : "false") . "\\n";`;
      return `echo ${call} . "\\n";`;
    case "ruby":
      if (ret === "ints" || ret === "words") return `puts ${call}.join(" ")`;
      if (ret === "lines") return `puts ${call}.join("\\n")`;
      if (ret === "matrix") return `${call}.each { |row| puts row.join(" ") }`;
      if (ret === "float1") return `puts format("%.1f", ${call})`;
      if (ret === "bool") return `puts(${call} ? "true" : "false")`;
      return `puts ${call}`;
    case "kotlin":
      if (ret === "ints") return `println(${call}.joinToString(" "))`;
      if (ret === "words") return `println(${call}.joinToString(" "))`;
      if (ret === "lines") return `println(${call}.joinToString("\\n"))`;
      if (ret === "matrix") return `for (row in ${call}) println(row.joinToString(" "))`;
      if (ret === "float1") return `println(String.format("%.1f", ${call}))`;
      if (ret === "bool") return `println(${call})`;
      return `println(${call})`;
    case "dart":
      if (ret === "ints") return `print(${call}.join(" "));`;
      if (ret === "words") return `print(${call}.join(" "));`;
      if (ret === "lines") return `print(${call}.join("\\n"));`;
      if (ret === "matrix") return `for (final row in ${call}) print(row.join(" "));`;
      if (ret === "float1") return `print(${call}.toStringAsFixed(1));`;
      if (ret === "bool") return `print(${call});`;
      return `print(${call});`;
    case "swift":
      if (ret === "ints") return `print(${call}.map { String($0) }.joined(separator: " "))`;
      if (ret === "words") return `print(${call}.joined(separator: " "))`;
      if (ret === "lines") return `print(${call}.joined(separator: "\\n"))`;
      if (ret === "matrix") return `for row in ${call} { print(row.map { String($0) }.joined(separator: " ")) }`;
      if (ret === "float1") return `print(String(format: "%.1f", ${call}))`;
      if (ret === "bool") return `print(${call} ? "true" : "false")`;
      return `print(${call})`;
    case "lua":
      if (ret === "ints" || ret === "words") return `print(table.concat(${call}, " "))`;
      if (ret === "lines") return `print(table.concat(${call}, "\\n"))`;
      if (ret === "matrix") return `for _, row in ipairs(${call}) do print(table.concat(row, " ")) end`;
      if (ret === "float1") return `print(string.format("%.1f", ${call}))`;
      if (ret === "bool") return `print(${call} and "true" or "false")`;
      return `print(${call})`;
  }
}

function driver(problem: CodeProblem, language: PracticeLanguage, args: unknown[]): string {
  const name = fnName(problem, language);
  const params = parseParams(problem.params);
  const literals = params.map((param, i) => literal(language, param.type, args[i]));
  // Swift wants the argument labels at the call site.
  const callArgs =
    language === "swift"
      ? literals.map((value, i) => `${params[i].name}: ${value}`).join(", ")
      : literals.join(", ");
  const call = `${name}(${callArgs})`;
  const printed = printResult(problem, language, call);

  switch (language) {
    case "javascript":
    case "typescript":
    case "php":
      return printed;
    case "python":
      return printed;
    case "java":
      return `public static void main(String[] args) {\n        ${printed}\n    }\n\n    static String joinInts(int[] values) {\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < values.length; i++) {\n            if (i > 0) sb.append(" ");\n            sb.append(values[i]);\n        }\n        return sb.toString();\n    }`;
    case "c_cpp":
      return `int main() {\n    ${printed}\n    return 0;\n}`;
    case "csharp":
      return `static void Main() {\n        ${printed}\n    }`;
    case "go":
      // Go fails to build when an import goes unused, and a short answer often
      // needs neither `strings` nor `fmt`. The driver keeps them used so a
      // learner who writes two lines still gets a run.
      return `func main() {\n\t${printed}\n}\n\nvar _ = fmt.Sprint\nvar _ = strings.Join`;
    case "rust":
      return `fn main() {\n    ${printed}\n}`;
    case "ruby":
    case "lua":
      return printed;
    case "kotlin":
      return `fun main() {\n    ${printed}\n}`;
    case "dart":
      return `void main() {\n  ${printed}\n}`;
    case "swift":
      return printed;
  }
}

/** Languages whose entry point must live inside the type that holds the function. */
const CLASS_SCOPED: PracticeLanguage[] = ["java", "csharp"];

function braceDepthBefore(lines: string[], upto: number): number {
  let depth = 0;
  for (let i = 0; i < upto; i++) {
    for (const ch of lines[i]) {
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
    }
  }
  return depth;
}

/**
 * Is the marker where the driver can actually run? Java/C# need it one level
 * deep (inside the class, outside the method); brace languages need it at the
 * top level; indented languages need it flush left.
 */
function markerInScope(language: PracticeLanguage, lines: string[], index: number): boolean {
  if (language === "python" || language === "ruby" || language === "lua") {
    return !/^\s/.test(lines[index]);
  }
  const expected = CLASS_SCOPED.includes(language) ? 1 : 0;
  return braceDepthBefore(lines, index) === expected;
}

/**
 * The full program to run: whatever the learner wrote, with the driver placed
 * where it can execute.
 *
 * The marker line is the normal path, but saved drafts can carry a marker from
 * an older starter — one that sits inside the function, after the `return`, so
 * the driver never runs and every test reports empty output. A misplaced
 * marker is dropped and the driver is appended in the right scope instead.
 */
export function programFor(
  problem: CodeProblem,
  language: PracticeLanguage,
  userCode: string,
  args: unknown[]
): string {
  const body = driver(problem, language, args);
  const marker = LANGS[language].marker;
  const lines = userCode.split("\n");
  const index = lines.findIndex((line) => line.trim() === marker);

  if (index !== -1 && markerInScope(language, lines, index)) {
    lines.splice(index, 1, body);
    return `${lines.join("\n")}\n`;
  }

  if (index !== -1) lines.splice(index, 1);
  const text = lines.join("\n").trimEnd();

  if (CLASS_SCOPED.includes(language)) {
    const close = text.lastIndexOf("}");
    if (close !== -1) {
      return `${text.slice(0, close).trimEnd()}\n\n    ${body}\n${text.slice(close)}\n`;
    }
  }

  return `${text}\n${body}\n`;
}
