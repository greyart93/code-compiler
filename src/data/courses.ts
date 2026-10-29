// Structured course catalog for the Learn page.
// Lessons are authored in Obsidian-style markdown (```lang fences become
// highlighted code blocks). The JavaScript course lessons are generated from
// the user's own notes (see scripts/gen-js-notes.mjs); other languages ship
// authored lessons, grouped into sections in src/data/<lang>-*.ts.

import type { Exercise, LessonSeed, SectionSeed } from "./course-types";
import { PY_BASICS } from "./python-basics";
import { PY_INTERMEDIATE } from "./python-intermediate";
import { PY_ADVANCED } from "./python-advanced";
import { JAVA_BASICS, JAVA_OOP, JAVA_ADVANCED } from "./java";
import { CPP_BASICS, CPP_OOP, CPP_ADVANCED } from "./cpp";
import { TS_BASICS, TS_ADVANCED } from "./typescript";
import { GO_BASICS, GO_ADVANCED } from "./go";
import { RUST_BASICS, RUST_ADVANCED } from "./rust";
import { PHP_BASICS, PHP_ADVANCED } from "./php";
import { CS_BASICS, CS_ADVANCED } from "./csharp";
import { KT_BASICS, KT_ADVANCED } from "./kotlin";
import { DART_BASICS } from "./dart";
import { SWIFT_BASICS } from "./swift";
import { RB_BASICS } from "./ruby";
import { LUA_BASICS } from "./lua";
import { BASH_BASICS } from "./bash";
import { ASM_BASICS } from "./assembly";
import { REACT_SECTIONS } from "./react-course";
import { NEXTJS_SECTIONS } from "./nextjs-course";
import { SQL_BASICS, SQL_ADVANCED, MONGO_BASICS, MONGO_ADVANCED } from "./sql-mongo-prisma-courses";
import {
  PRISMA_FOUNDATIONS,
  PRISMA_QUERYING,
  PRISMA_PRODUCTION,
} from "./prisma-course";
import {
  GITHUB_FOUNDATIONS,
  GITHUB_COLLABORATION,
  GITHUB_PRO,
} from "./github-course";

const JAVA_SECTIONS: SectionSeed[] = [JAVA_BASICS, JAVA_OOP, JAVA_ADVANCED];
const CPP_SECTIONS: SectionSeed[] = [CPP_BASICS, CPP_OOP, CPP_ADVANCED];

/** Every course is authored in sections so it reads Basics → Advanced. */
const PYTHON_SECTIONS: SectionSeed[] = [PY_BASICS, PY_INTERMEDIATE, PY_ADVANCED];
const TS_SECTIONS: SectionSeed[] = [TS_BASICS, TS_ADVANCED];
const GO_SECTIONS: SectionSeed[] = [GO_BASICS, GO_ADVANCED];
const RUST_SECTIONS: SectionSeed[] = [RUST_BASICS, RUST_ADVANCED];
const PHP_SECTIONS: SectionSeed[] = [PHP_BASICS, PHP_ADVANCED];
const CSHARP_SECTIONS: SectionSeed[] = [CS_BASICS, CS_ADVANCED];
const KOTLIN_SECTIONS: SectionSeed[] = [KT_BASICS, KT_ADVANCED];
const DART_SECTIONS: SectionSeed[] = [DART_BASICS];
const SWIFT_SECTIONS: SectionSeed[] = [SWIFT_BASICS];
const RUBY_SECTIONS: SectionSeed[] = [RB_BASICS];
const LUA_SECTIONS: SectionSeed[] = [LUA_BASICS];
const BASH_SECTIONS: SectionSeed[] = [BASH_BASICS];
const ASM_SECTIONS: SectionSeed[] = [ASM_BASICS];
const REACT_SECTIONS_GROUP: SectionSeed[] = REACT_SECTIONS;
const NEXT_SECTIONS: SectionSeed[] = NEXTJS_SECTIONS;
const SQL_SECTIONS: SectionSeed[] = [SQL_BASICS, SQL_ADVANCED];
const MONGO_SECTIONS: SectionSeed[] = [MONGO_BASICS, MONGO_ADVANCED];
const PRISMA_SECTIONS_GROUP: SectionSeed[] = [
  PRISMA_FOUNDATIONS,
  PRISMA_QUERYING,
  PRISMA_PRODUCTION,
];
const GITHUB_SECTIONS: SectionSeed[] = [
  GITHUB_FOUNDATIONS,
  GITHUB_COLLABORATION,
  GITHUB_PRO,
];

export type { Exercise, LessonSeed, SectionSeed };

export type LessonData = {
  id: string;
  title: string;
  minutes: number;
  /** Obsidian-style markdown — fenced code blocks render highlighted */
  md: string;
  raw?: string;
  /** first exercise — kept for single-exercise lessons */
  exercise?: Exercise;
  /** every exercise on the lesson; the lesson completes when all are solved */
  exercises?: Exercise[];
};

export type SectionMeta = { id: string; title: string; lessonIds: string[] };

export type CourseMeta = {
  slug: string;
  title: string;
  description: string;
  icon: string; // emoji or short label shown in the chip
  accent: string; // tailwind classes for the icon chip
  /**
   * False when the lesson code is illustrative rather than executable in the
   * Playground (database clients, framework server code, local Git commands).
   * Non-runnable courses hide every Run control instead of opening the editor
   * on a snippet that is guaranteed to fail.
   */
  runnable?: boolean;
  /** Official docs linked from non-runnable courses. */
  docsUrl?: string;
  docsLabel?: string;
  load: () => Promise<{ sections: SectionMeta[]; lessons: Record<string, LessonData> }>;
};

// ─────────────────── JavaScript course exercises (notes overlay) ─────────────
// The JS lessons come from the user's own notes (generated); exercises are
// merged in by id at load time so the generated files stay pure.

const JS_EXERCISES: Record<string, Exercise[]> = {
  "ch1-variables": [
    {
      type: "fill-blank",
      prompt: "Declare a variable that can be **reassigned** but **not redeclared**",
      template: "___ b = 1;\nb = 2;  // reassign is OK",
      blanks: [{ options: ["let", "const", "var"], answer: "let" }],
      explanation:
        "`let` allows reassignment but not redeclaration; `const` allows neither; `var` allows both.",
    },
    {
      type: "quiz",
      prompt:
        "Per the summary table — which of these does `var` allow but `let` and `const` do not?",
      answers: ["redeclare", "redeclaration", "redeclaring"],
      snippet: "var a = 1\nvar a = 2   // fine",
      placeholder: "e.g. redeclare",
      hint: "Check the “redeclare” row of the table.",
      explanation:
        "`var` can be redeclared; `let` and `const` throw a SyntaxError on a second declaration of the same name.",
    },
    {
      type: "output",
      prompt: "Predict the output — `var` is function scoped, so the inner value leaks out.",
      starterCode:
        '(function () {\n  if (true) {\n    var a = 10;\n  }\n  console.log(a);\n})();',
      expectedOutput: "10",
      hint: "`var` is function scoped, so `a` is still visible after the `if` block.",
    },
  ],
  "ch2-datatypes": [
    {
      type: "output",
      prompt:
        "JavaScript is loosely typed — `+` concatenates when either side is a string. Predict, then experiment.",
      starterCode: 'console.log(1 + "1");',
      expectedOutput: "11",
      answerLabel: "Type what this prints",
      hint: 'Number + String → String: 1 becomes "1", then "1" + "1" = "11".',
    },
    {
      type: "quiz",
      prompt: "What does `typeof null` return?",
      answers: ["object"],
      snippet: "typeof null",
      placeholder: "the returned type",
      hint: "It is a famous bug from the very first version of JavaScript.",
      explanation:
        "`null` was implemented as the absence of an object, so `typeof null` is `\"object\"` — a quirk that was too late to change.",
    },
    {
      type: "quiz",
      prompt: "Which of these is **not** a primitive data type?",
      answers: ["object", "obj"],
      snippet: "string  number  boolean  undefined  symbol  bigint  object",
      placeholder: "type the primitive",
      hint: "Everything except object stores a value directly; objects are referenced.",
      explanation:
        "`object` (arrays, functions, plain objects) is non-primitive — it is stored and copied by reference.",
    },
  ],
  "ch2-control-flow": [
    {
      type: "output",
      prompt: "Predict the output — then tweak `n` and run again.",
      starterCode:
        'const n = 7;\nif (n % 2 === 0) {\n  console.log("even");\n} else {\n  console.log("odd");\n}',
      expectedOutput: "odd",
      hint: "7 % 2 is 1, so the else branch runs.",
    },
    {
      type: "quiz",
      prompt: "What does this print?",
      answers: ["0", "false"],
      snippet: 'console.log(0 || "default");',
      placeholder: "type the output",
      hint: "`||` returns the first truthy value, or the last one.",
      explanation:
        "`0` is falsy, so the expression falls through to the right side and returns `\"default\"`.",
    },
  ],
  "ch2-loop": [
    {
      type: "output",
      prompt: "How many lines, and what values? Predict first.",
      starterCode: "for (let i = 0; i < 3; i++) {\n  console.log(i);\n}",
      expectedOutput: "0\n1\n2",
      answerLabel: "Type the output (one value per line)",
      hint: "i takes 0, 1, 2 — the loop stops before 3.",
    },
    {
      type: "quiz",
      prompt: "Which loop uses **keys** — names for objects and indices for arrays?",
      answers: ["for...in", "for in", "for-in", "forin", "for...in loop"],
      snippet: "for (const k in obj) { ... }",
      placeholder: "the loop keyword",
      hint: "It pairs with `of`: one walks keys, the other walks values.",
      explanation:
        "`for...in` iterates enumerable property keys; `for...of` iterates the values themselves.",
    },
    {
      type: "quiz",
      prompt: "After `break`, where does execution continue?",
      answers: [
        "after the loop",
        "after the loop / after loop",
        "outside the loop",
        "after the entire loop",
        "next iteration",
        "to the next iteration",
      ],
      snippet: "for (let i = 0; i < 3; i++) {\n  if (i === 1) break;\n}",
      placeholder: "where does it go?",
      hint: "`break` leaves the loop entirely, unlike `continue`.",
      explanation: "`break` exits the loop completely; `continue` only skips the rest of this iteration.",
    },
  ],
  "ch3-function": [
    {
      type: "fill-blank",
      prompt: "Complete the function so it hands back a + b to the caller",
      template: "function add(a, b) {\n  ___ a + b;\n}\nconsole.log(add(1, 2));",
      blanks: [{ options: ["return", "print", "yield"], answer: "return" }],
      explanation: "`return` sends the value back to the caller and stops the function.",
    },
    {
      type: "quiz",
      prompt: "What does `call()` do that `apply()` does not?",
      answers: ["passes arguments individually", "individual arguments", "one by one", "comma-separated arguments"],
      snippet: "fn.call(thisArg, a, b)\nfn.apply(thisArg, [a, b])",
      placeholder: "describe the difference",
      hint: "One takes a list, the other takes the values directly.",
      explanation:
        "`call` takes arguments one by one; `apply` takes a single array (or array-like).",
    },
  ],
  "ch3-array": [
    {
      type: "challenge",
      problem:
        "Read numbers **separated by spaces** from stdin and print their **sum**.\n\nExample: input `1 2 3 4` → output `10`",
      starterCode:
        'const nums = require("fs").readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);\n\n// print the sum of nums\n',
      tests: [
        { input: "1 2 3 4", expected: "10", label: "1 2 3 4 → 10" },
        { input: "5 5 5", expected: "15", label: "5 5 5 → 15" },
        { input: "42", expected: "42", label: "42 → 42" },
      ],
      hint: "`nums.reduce((a, b) => a + b, 0)`",
    },
    {
      type: "quiz",
      prompt: "What is the **index** of the last element of `[10, 20, 30]`?",
      answers: ["2"],
      snippet: "const a = [10, 20, 30];",
      placeholder: "the index",
      hint: "Indices start at zero.",
      explanation: "Indices are 0-based, so the last element sits at `length - 1` = 2.",
    },
    {
      type: "quiz",
      prompt: "Which method returns **new** elements without touching the original array?",
      answers: ["map", ".map", "array.prototype.map", "map()"],
      snippet: "const doubled = a.map((n) => n * 2);",
      placeholder: "the method name",
      hint: "The mutating one is `sort`.",
      explanation:
        "`map` builds a new array. `sort`, `reverse`, `splice` and `push` all mutate in place.",
    },
  ],
  "leetcode-foundation-twosum": [
    {
      type: "challenge",
      problem:
        "**Two Sum** — given an array of integers `nums` and a `target`, print the **indices** (space-separated) of the two numbers that add up to the target.\n\n**Input** — line 1: comma-separated `nums`; line 2: `target`.\n**Output** — the two indices, smallest first.\n\nExample: `nums = [2,7,11,15]`, `target = 9` → `0 1`",
      starterCode:
        'const lines = require("fs").readFileSync(0, "utf8").trim().split("\\n");\nconst nums = lines[0].split(",").map(Number);\nconst target = Number(lines[1]);\n\n// Example: nums = [2,7,11,15], target = 9  ->  print("0 1")\n',
      tests: [
        { input: "2,7,11,15\n9", expected: "0 1", label: "nums=[2,7,11,15], target=9" },
        { input: "3,2,4\n6", expected: "1 2", label: "nums=[3,2,4], target=6" },
        { input: "3,3\n6", expected: "0 1", label: "nums=[3,3], target=6" },
      ],
      hint: "A double loop works; a Map of seen numbers makes it O(n).",
    },
    {
      type: "quiz",
      prompt: "For `nums = [2,7,11,15]` and `target = 9`, which **index pair** works?",
      answers: ["0 1", "0,1", "0 and 1", "0, 1", "[0, 1]", "1 0", "1,0"],
      snippet: "nums = [2,7,11,15]\ntarget = 9",
      placeholder: "e.g. 0 1",
      explanation: "`2 + 7 = 9`, and those sit at indices 0 and 1.",
    },
    {
      type: "quiz",
      prompt: "Using a **Map** of seen values, what is the time complexity of Two Sum?",
      answers: ["o(n)", "o(n) time", "linear", "linear time", "on", "o(n)"],
      placeholder: "e.g. O(n)",
      hint: "You only walk the array once.",
      explanation:
        "Each element is visited once and looked up in O(1), so the whole pass is O(n) — better than the O(n²) double loop.",
    },
  ],
};

/**
 * Turns the authored sections (Basics → Advanced) into a course loader so a
 * long course stays navigable.
 */
const groupedToLoader =
  (sections: SectionSeed[]) =>
  async () => {
    const lessons: Record<string, LessonData> = {};
    for (const s of sections) {
      for (const l of s.lessons) lessons[l.id] = { ...l } as LessonData;
    }
    return {
      sections: sections.map((s) => ({
        id: s.id,
        title: s.title,
        lessonIds: s.lessons.map((l) => l.id),
      })),
      lessons,
    };
  };

export const COURSES: CourseMeta[] = [
  {
    slug: "react",
    title: "React",
    description:
      "A complete React course — JSX, state and hooks through context, forms, data fetching, performance, testing and Server Components.",
    icon: "⚛",
    accent: "bg-sky-400/15 text-sky-400",
    load: groupedToLoader(REACT_SECTIONS_GROUP),
  },
  {
    slug: "nextjs",
    title: "Next.js",
    description:
      "A complete Next.js App Router course — layouts and routing through server components, streaming, middleware and production caching.",
    icon: "▲",
    accent: "bg-neutral-200/20 text-neutral-100",
    runnable: false,
    docsUrl: "https://nextjs.org/docs",
    docsLabel: "Next.js docs",
    load: groupedToLoader(NEXT_SECTIONS),
  },
  {
    slug: "sql",
    title: "SQL",
    description:
      "A complete SQL course — SELECT and aggregates through joins, indexing, window functions, CTEs, transactions and schema design.",
    icon: "🗄",
    accent: "bg-slate-500/15 text-slate-300",
    load: groupedToLoader(SQL_SECTIONS),
  },
  {
    slug: "mongodb",
    title: "MongoDB",
    description:
      "A complete MongoDB course — documents and CRUD through aggregation, indexing, and real-world Mongoose + Node patterns.",
    icon: "🍃",
    accent: "bg-green-500/15 text-green-500",
    runnable: false,
    docsUrl: "https://www.mongodb.com/docs/",
    docsLabel: "MongoDB docs",
    load: groupedToLoader(MONGO_SECTIONS),
  },
  {
    slug: "prisma",
    title: "Prisma 7.10",
    description:
      "A complete Prisma 7.10 course — driver adapters and the generated client through schema design, migrations, CRUD, relations, transactions, error handling, performance and deployment.",
    icon: "🔺",
    accent: "bg-blue-400/15 text-blue-400",
    runnable: false,
    docsUrl: "https://www.prisma.io/docs/orm/v7",
    docsLabel: "Prisma 7 docs",
    load: groupedToLoader(PRISMA_SECTIONS_GROUP),
  },
  {
    slug: "github",
    title: "GitHub",
    description:
      "A complete GitHub course — repositories, branches and pull requests through issues, Actions, Pages, security, the CLI and open-source collaboration.",
    icon: "GH",
    accent: "bg-neutral-800/10 text-neutral-700 dark:text-neutral-200",
    runnable: false,
    docsUrl: "https://docs.github.com/",
    docsLabel: "GitHub docs",
    load: groupedToLoader(GITHUB_SECTIONS),
  },
  {
    slug: "javascript",
    title: "JavaScript",
    description:
      "A complete JavaScript course built from handwritten notes — basics, DOM, async, DSA and LeetCode patterns.",
    icon: "JS",
    accent: "bg-yellow-500/15 text-yellow-500",
    load: async () => {
      const [meta, lessonsMod] = await Promise.all([
        import("@/data/lessons/javascript"),
        import("@/data/lessons/javascript-lessons"),
      ]);
      const lessons = lessonsMod.JS_COURSE_LESSONS as unknown as Record<string, LessonData>;
      // merge authored exercises into the generated notes
      for (const [id, list] of Object.entries(JS_EXERCISES)) {
        if (lessons[id]) lessons[id] = { ...lessons[id], exercises: list };
      }
      return { sections: meta.JS_COURSE_SECTIONS as SectionMeta[], lessons };
    },
  },
  {
    slug: "python",
    title: "Python",
    description:
      "A complete Python course — basics through OOP, generators, decorators, typing, packaging and asyncio.",
    icon: "🐍",
    accent: "bg-sky-500/15 text-sky-500",
    load: groupedToLoader(PYTHON_SECTIONS),
  },
  {
    slug: "java",
    title: "Java",
    description:
      "A complete Java course — syntax and types through OOP, collections, streams, generics, concurrency and design patterns.",
    icon: "☕",
    accent: "bg-orange-600/15 text-orange-500",
    load: groupedToLoader(JAVA_SECTIONS),
  },
  {
    slug: "c_cpp",
    title: "C++",
    description:
      "A complete C++ course — syntax and pointers through OOP, templates, the STL, RAII, move semantics and concurrency.",
    icon: "C+",
    accent: "bg-blue-500/15 text-blue-400",
    load: groupedToLoader(CPP_SECTIONS),
  },
  {
    slug: "typescript",
    title: "TypeScript",
    description:
      "A complete TypeScript course — types and narrowing, generics, interfaces, async patterns and tooling.",
    icon: "TS",
    accent: "bg-blue-500/15 text-blue-500",
    load: groupedToLoader(TS_SECTIONS),
  },
  {
    slug: "go",
    title: "Go",
    description:
      "A complete Go course — syntax and types through interfaces, goroutines, channels and the standard library.",
    icon: "Go",
    accent: "bg-cyan-500/15 text-cyan-500",
    load: groupedToLoader(GO_SECTIONS),
  },
  {
    slug: "rust",
    title: "Rust",
    description:
      "A complete Rust course — ownership and borrowing through traits, lifetimes, error handling and concurrency.",
    icon: "🦀",
    accent: "bg-red-500/15 text-red-500",
    load: groupedToLoader(RUST_SECTIONS),
  },
  {
    slug: "php",
    title: "PHP",
    description:
      "A complete PHP course — arrays and functions through OOP, strict types, exceptions, traits and Composer.",
    icon: "php",
    accent: "bg-sky-500/15 text-sky-400",
    load: groupedToLoader(PHP_SECTIONS),
  },
  {
    slug: "csharp",
    title: "C#",
    description:
      "A complete C# course — types and nullability through OOP, LINQ, generics, async/await and the dotnet CLI.",
    icon: "C#",
    accent: "bg-blue-500/15 text-blue-500",
    load: groupedToLoader(CSHARP_SECTIONS),
  },
  {
    slug: "kotlin",
    title: "Kotlin",
    description:
      "A complete Kotlin course — data classes and collections through scope functions, coroutines and sealed types.",
    icon: "Ko",
    accent: "bg-red-500/15 text-red-400",
    load: groupedToLoader(KOTLIN_SECTIONS),
  },
  {
    slug: "lua",
    title: "Lua",
    description:
      "A complete Lua course — tables and functions through metatables, OOP patterns and the standard library.",
    icon: "🌙",
    accent: "bg-blue-400/15 text-blue-300",
    load: groupedToLoader(LUA_SECTIONS),
  },
  {
    slug: "dart",
    title: "Dart",
    description:
      "A complete Dart course — language basics through classes, null safety, collections and async.",
    icon: "Da",
    accent: "bg-teal-500/15 text-teal-400",
    load: groupedToLoader(DART_SECTIONS),
  },
  {
    slug: "swift",
    title: "Swift",
    description:
      "A complete Swift course — basics and optionals through structs, enums, protocols and value semantics.",
    icon: "🐦",
    accent: "bg-orange-500/15 text-orange-400",
    load: groupedToLoader(SWIFT_SECTIONS),
  },
  {
    slug: "ruby",
    title: "Ruby",
    description:
      "A complete Ruby course — blocks and collections through symbols, strings and idiomatic Ruby style.",
    icon: "💎",
    accent: "bg-rose-600/15 text-rose-500",
    load: groupedToLoader(RUBY_SECTIONS),
  },
  {
    slug: "bash",
    title: "Bash",
    description:
      "A complete Bash course — arguments and control flow through pipes, scripting and safe shell habits.",
    icon: "$_",
    accent: "bg-neutral-500/15 text-neutral-300",
    load: groupedToLoader(BASH_SECTIONS),
  },
  {
    slug: "assembly",
    title: "Assembly",
    description:
      "An Assembly course — the stack, registers and memory through procedures, syscalls and calling conventions.",
    icon: "⚙",
    accent: "bg-zinc-500/15 text-zinc-300",
    load: groupedToLoader(ASM_SECTIONS),
  },
];
