// Quiz question bank.
// JavaScript questions are mined from the user's own quiz.js
// (C:/Users/Saud/javascript/js_notes/quiz.js) — each asks "what does this log?".

export type Question = {
  id: string;
  /** Code shown to the user (optional) */
  code?: string;
  prompt: string;
  options: string[];
  /** index of correct option */
  answer: number;
  explanation: string;
};

export type Quiz = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  questions: Question[];
};

const JS_QUESTIONS: Question[] = [
  {
    id: "js-typeof-nan",
    code: 'console.log(typeof NaN);',
    prompt: "What does this log?",
    options: ['"NaN"', '"undefined"', '"number"', '"object"'],
    answer: 2,
    explanation:
      'typeof NaN is "number" — NaN is a special numeric value (Not a Number), even though it means "not a valid number".',
  },
  {
    id: "js-typeof-typeof",
    code: "console.log(typeof typeof 1);",
    prompt: "What does this log?",
    options: ['"number"', '"string"', '"undefined"', '"bigint"'],
    answer: 1,
    explanation:
      'typeof 1 evaluates first to "number" (a string), so the outer typeof returns "string".',
  },
  {
    id: "js-holes",
    code: "let array = [1, 2, 3];\narray[6] = 9;\nconsole.log(array[5]);",
    prompt: "What does this log?",
    options: ["null", "0", "undefined", "9"],
    answer: 2,
    explanation:
      "Assigning at index 6 creates a sparse array — indexes 3–5 are empty holes, which read as undefined.",
  },
  {
    id: "js-chained-compare",
    code: "console.log(3 > 2 > 1);",
    prompt: "What does this log?",
    options: ["true", "false", "TypeError", "1"],
    answer: 1,
    explanation:
      "Chained comparison goes left to right: (3 > 2) → true, then true > 1 → 1 > 1 → false.",
  },
  {
    id: "js-false-eq-zero-str",
    code: "console.log(false == '0');",
    prompt: "What does this log?",
    options: ["false", "true", "TypeError", "undefined"],
    answer: 1,
    explanation:
      "With ==, both convert to numbers: Number(false)=0 and Number('0')=0, so 0 == 0 is true.",
  },
  {
    id: "js-true-eq-array",
    code: "const isTrue = true == [];\nconst isFalse = true == ![];\nconsole.log(isTrue + isFalse);",
    prompt: "What does this log?",
    options: ["0", "1", "2", "NaN"],
    answer: 0,
    explanation:
      "true == [] → [] becomes '' then 0, and true→1, so 1==0 → false. true == ![] → ![] is false, so again false. false+false = 0.",
  },
  {
    id: "js-sort-lexical",
    code: "const numbers = [33, 2, 8];\nnumbers.sort();\nconsole.log(numbers[1]);",
    prompt: "What does this log?",
    options: ["2", "8", "33", "undefined"],
    answer: 2,
    explanation:
      "sort() without a comparator sorts lexographically (as strings): '2' < '33' < '8' → [2, 33, 8], so index 1 is 33.",
  },
  {
    id: "js-string-raw",
    code: 'const str = String.raw`Hi\\nthere`;\nconsole.log(str.length);',
    prompt: "What does this log?",
    options: ["8", "9", "10", "7"],
    answer: 1,
    explanation:
      "String.raw keeps the backslash literally: H,i,\\,n,t,h,e,r,e = 9 characters — no newline is produced.",
  },
  {
    id: "js-num-str-concat",
    code: 'console.log(1 + "2" + "2");',
    prompt: "What does this log?",
    options: ['"122"', '"32"', "5", '"14"'],
    answer: 0,
    explanation:
      "Number + string concatenates left to right: 1+'2' = '12', then '12'+'2' = '122'.",
  },
  {
    id: "js-empty-array-truthy",
    code: "if ([]) {\n  console.log('ok')\n}",
    prompt: "What happens?",
    options: [
      "nothing logs — [] is falsy",
      "logs 'ok' — [] is truthy",
      "throws a TypeError",
      "logs 'undefined'",
    ],
    answer: 1,
    explanation:
      "Empty arrays are objects — always truthy. (But [] == false is true under loose equality coercion!)",
  },
  {
    id: "js-instanceof-string",
    code: 'console.log("str" instanceof String);\nconsole.log(new String("str") instanceof String);',
    prompt: "What does this log?",
    options: [
      "false then true",
      "true then true",
      "true then false",
      "false then false",
    ],
    answer: 0,
    explanation:
      'A primitive "str" is not a String object, so instanceof is false; new String() wraps it in an object, so true.',
  },
  {
    id: "js-banana",
    code: "console.log(('b' + 'a' + + 'a' + 'a').toLowerCase());",
    prompt: "What does this log?",
    options: ['"baaa"', '"banana"', '"baNaNa"', '"ba+aa"'],
    answer: 1,
    explanation:
      "+'a' is NaN (unary plus on a letter), so 'ba' + NaN + 'a' → 'baNaNa' → lowercased: banana.",
  },
  {
    id: "js-json-parse-number",
    code: 'const json = JSON.parse("55");\nconsole.log(typeof json);',
    prompt: "What does this log?",
    options: ['"object"', '"string"', '"number"', '"any"'],
    answer: 2,
    explanation:
      'JSON.parse("55") returns the number 55 — valid JSON can be a bare number, not only objects/arrays.',
  },
  {
    id: "js-object-reference",
    code: "const a = {}\nconst b = a\na.name = 'Saad'\nconsole.log(b.name)",
    prompt: "What does this log?",
    options: ["undefined", "'Saad'", "ReferenceError", "null"],
    answer: 1,
    explanation:
      "b points to the SAME object as a (assignment copies the reference) — mutating through a is visible via b.",
  },
  {
    id: "js-assign-clone",
    code: "const a = { x: 1, nested: { y: 2 } }\nconst c = Object.assign({}, a)\nc.nested.y = 99\nconsole.log(a.nested.y)",
    prompt: "What does this log?",
    options: ["2", "99", "undefined", "TypeError"],
    answer: 1,
    explanation:
      "Object.assign is a SHALLOW copy — the nested object is still shared, so changing c.nested.y changes a.nested.y too.",
  },
  {
    id: "js-structured-clone",
    code: "const a1 = { name: 'Saad', address: { city: 'Mumbai' } }\nconst b1 = structuredClone(a1)\na1.address.city = 'NY'\nconsole.log(b1.address.city)",
    prompt: "What does this log?",
    options: ["'NY'", "'Mumbai'", "undefined", "ReferenceError"],
    answer: 1,
    explanation:
      "structuredClone is a DEEP copy — b1.address is a separate object, so mutations to a1 don't leak in.",
  },
  {
    id: "js-join-reverse",
    code: "let a = [1, 2]\nconsole.log(a.join(''))\nconsole.log(a.reverse())",
    prompt: "What does this log?",
    options: [
      "'12' then [1, 2]",
      "'12' then [2, 1]",
      "'21' then [2, 1]",
      "'12' then '21'",
    ],
    answer: 1,
    explanation:
      "join('') concatenates → '12'. reverse() reverses IN PLACE and returns the same array → [2, 1].",
  },
  {
    id: "js-array-plus-num",
    code: "let a = []\na += 3\nconsole.log(+a)",
    prompt: "What does this log?",
    options: ["3", "'[object Object]3'", "NaN", "0"],
    answer: 0,
    explanation:
      "[] += 3 → [] becomes '' (string), then '' + 3 = '3'. Unary + converts '3' back to number 3.",
  },
  {
    id: "js-digit-split",
    code: "const a = 65\nconsole.log(Math.floor(a / 10), a % 10)",
    prompt: "What does this log?",
    options: ["6 5", "65 0", "5 6", "6.5 5"],
    answer: 0,
    explanation:
      "Classic digit split: Math.floor(a/10) gives the first digit, a % 10 gives the last.",
  },
  {
    id: "js-sliding-window",
    code: "var lengthOfLongestSubstring = function(s) {\n    let l = 0;\n    const seen = new Map();\n    let maxCount = 0;\n    for(let r = 0; r < s.length; r++) {\n        if(seen.has(s[r]) && seen.get(s[r]) >= l) {\n            l = seen.get(s[r]) + 1;\n        }\n        seen.set(s[r], r);\n        maxCount = Math.max(r - l + 1, maxCount);\n    }\n    return maxCount;\n};\nconsole.log(lengthOfLongestSubstring('ababcbb'))",
    prompt: "What does this log? (longest substring without repeating characters)",
    options: ["2", "3", "4", "6"],
    answer: 1,
    explanation:
      "The sliding window finds 'abc' (length 3) — the classic LeetCode #3 two-pointer/set pattern from your notes.",
  },
  {
    id: "js-memoize",
    code: "function memoizeOne(fn) {\n  let lastArgs = null;\n  let lastResult = null;\n  return function(...args) {\n    const isSame = lastArgs && args.length === lastArgs.length &&\n      args.every((v, i) => v === lastArgs[i]);\n    if (isSame) return lastResult;\n    lastArgs = args;\n    lastResult = fn(...args);\n    return lastResult;\n  };\n}\nconst add = (a, b) => a + b;\nconst m = memoizeOne(add);\nconsole.log(m(1, 2));\nconsole.log(m(1, 2));",
    prompt: "How many times does add actually run?",
    options: ["2 — memoization doesn't work here", "1 — second call hits the cache", "0", "Infinity"],
    answer: 1,
    explanation:
      "The second call has identical arguments, so the cached result is returned — add runs once. (This is the memoizeOne pattern from your notes.)",
  },
  {
    id: "js-flatten",
    code: "const arr = [1, 2, [3, 4, [5, 6]]]\nconsole.log(arr.flat(Infinity))",
    prompt: "What does this log?",
    options: [
      "[1, 2, 3, 4, [5, 6]]",
      "[1, 2, 3, 4, 5, 6]",
      "[[1, 2, [3, 4, [5, 6]]]]",
      "throws TypeError",
    ],
    answer: 1,
    explanation:
      "flat(Infinity) flattens all nesting levels — your notes show the manual recursive version of exactly this.",
  },
  {
    id: "js-groupby-reduce",
    code: "const items = [{key: 'A', v: 1}, {key: 'B', v: 2}, {key: 'A', v: 3}]\nconst grouped = items.reduce((acc, item) => {\n  (acc[item.key] = acc[item.key] || []).push(item)\n  return acc\n}, {})\nconsole.log(Object.keys(grouped).length)",
    prompt: "What does this log?",
    options: ["1", "2", "3", "6"],
    answer: 1,
    explanation:
      "The reduce groups by key: 'A' and 'B' → 2 keys (the data-transformation pattern from your notes).",
  },
  {
    id: "js-mod-carry",
    code: "const a = 34\nconsole.log(Math.floor(a / 10), a % 10)",
    prompt: "Following your notes' carry pattern — what does this log?",
    options: ["34 0", "3 4", "4 3", "30 4"],
    answer: 1,
    explanation:
      "x / 10 → first digit (3), x % 10 → last digit (4). This is how 'add two numbers as arrays with carry' breaks numbers apart.",
  },
];

const PY_QUESTIONS: Question[] = [
  {
    id: "py-mut-default",
    code: "def add(item, lst=[]):\n    lst.append(item)\n    return lst\n\nprint(add(1))\nprint(add(2))",
    prompt: "What does this print?",
    options: ["[1] then [2]", "[1] then [1, 2]", "[1, 2] then [1, 2]", "Error"],
    answer: 1,
    explanation:
      "Mutable default arguments are created ONCE at function definition — the same list is reused across calls. Use lst=None instead.",
  },
  {
    id: "py-slice",
    code: "s = 'python'\nprint(s[::-1])",
    prompt: "What does this print?",
    options: ["'python'", "'nohtyp'", "'p'", "'n'"],
    answer: 1,
    explanation: "[::-1] is the classic slice with step -1 — reverses the string.",
  },
  {
    id: "py-is-vs-eq",
    code: "a = [1, 2]\nb = [1, 2]\nprint(a == b, a is b)",
    prompt: "What does this print?",
    options: ["True True", "True False", "False True", "False False"],
    answer: 1,
    explanation: "== compares values; is compares identity (same object in memory). Two equal lists are not the same object.",
  },
  {
    id: "py-range",
    code: "print(list(range(3)))",
    prompt: "What does this print?",
    options: ["[1, 2, 3]", "[0, 1, 2]", "[0, 1, 2, 3]", "range(0, 3)"],
    answer: 1,
    explanation: "range stops BEFORE the end value and starts at 0 by default.",
  },
  {
    id: "py-tuple-single",
    code: "t = (5)\nprint(type(t))",
    prompt: "What does this print?",
    options: [
      "<class 'tuple'>",
      "<class 'int'>",
      "<class 'list'>",
      "SyntaxError",
    ],
    answer: 1,
    explanation: "(5) is just the number 5 in parentheses — a single-element tuple needs a trailing comma: (5,).",
  },
  {
    id: "py-float-precision",
    code: "print(0.1 + 0.2 == 0.3)",
    prompt: "What does this print?",
    options: ["True", "False", "0.3", "Error"],
    answer: 1,
    explanation: "Floating point: 0.1+0.2 = 0.30000000000000004. Compare with math.isclose() instead.",
  },
];

const TS_QUESTIONS: Question[] = [
  {
    id: "ts-unknown-any",
    code: "let a: any = 'hi';\nlet u: unknown = 'hi';\n\na.foo();\nu.foo();",
    prompt: "What happens?",
    options: [
      "Both lines compile",
      "Both fail",
      "a.foo() compiles, u.foo() fails",
      "a.foo() fails, u.foo() compiles",
    ],
    answer: 2,
    explanation: "any disables checking entirely; unknown is the type-safe any — you must narrow it before use.",
  },
  {
    id: "ts-const-obj",
    code: "const user = { name: 'Ada' };\nuser.name = 'Bob';",
    prompt: "Does this compile?",
    options: [
      "Yes — const prevents reassignment, not mutation",
      "No — const objects are frozen",
      "No — missing type annotation",
      "Yes, but only with Object.freeze",
    ],
    answer: 0,
    explanation: "const locks the binding, not the value — object properties can still change (use Readonly<> to prevent that).",
  },
  {
    id: "ts-enum-num",
    code: "enum Color { Red, Green, Blue }\nconst c: Color = 1;\nconsole.log(c);",
    prompt: "What does this log (after compiling)?",
    options: ["'Green'", "1", "Error", "undefined"],
    answer: 1,
    explanation: "Numeric enums auto-number from 0 — Green is 1, and the enum type accepts it.",
  },
  {
    id: "ts-type-widening",
    code: "let x = 3;        // type?\nx = 4;",
    prompt: "Is the reassignment valid?",
    options: [
      "Yes — x is inferred as number",
      "No — x is inferred as the literal 3",
      "No — needs annotation",
      "Yes, but only with 'use strict'",
    ],
    answer: 0,
    explanation: "let widens to number; only const keeps the literal type (const x = 3 → type 3).",
  },
];

const CPP_QUESTIONS: Question[] = [
  {
    id: "cpp-ref-vs-copy",
    code: "void f(int x) { x = 99; }\nvoid g(int& x) { x = 99; }\n\nint n = 1;\nf(n); g(n);\ncout << n;",
    prompt: "What is printed?",
    options: ["1", "99", "undefined", "compile error"],
    answer: 1,
    explanation: "f takes by value (copy discarded); g takes by reference and mutates the caller's n → 99.",
  },
  {
    id: "cpp-sizeof-array",
    code: "int arr[] = {1, 2, 3};\ncout << sizeof(arr) / sizeof(arr[0]);",
    prompt: "What is printed?",
    options: ["3", "12", "4", "undefined"],
    answer: 0,
    explanation: "sizeof(arr) = 12 bytes (3 × 4-byte ints), divided by element size 4 → 3 elements.",
  },
  {
    id: "cpp-dangling-ref",
    code: "int& bad() {\n  int x = 5;\n  return x;\n}",
    prompt: "What's wrong?",
    options: [
      "Nothing",
      "Returns a reference to a local — dangling",
      "Missing const",
      "Can't return references in C++",
    ],
    answer: 1,
    explanation: "x dies at the end of the function — returning a reference to it is undefined behavior.",
  },
];

const JAVA_QUESTIONS: Question[] = [
  {
    id: "jv-string-pool",
    code: 'String a = "hi";\nString b = "hi";\nString c = new String("hi");\nSystem.out.println(a == b);\nSystem.out.println(a == c);',
    prompt: "What does this print?",
    options: ["true true", "true false", "false false", "false true"],
    answer: 1,
    explanation: "Literals are interned in the string pool (a == b). new String creates a fresh heap object, so a == c is false — use .equals().",
  },
  {
    id: "jv-int-overflow",
    code: "System.out.println(Integer.MAX_VALUE + 1);",
    prompt: "What does this print?",
    options: ["2147483648", "-2147483648", "throws exception", "0"],
    answer: 1,
    explanation: "int overflow wraps around silently (two's complement) — MAX_VALUE + 1 becomes MIN_VALUE.",
  },
  {
    id: "jv-integer-cache",
    code: "Integer a = 127, b = 127;\nInteger c = 128, d = 128;\nSystem.out.println(a == b);\nSystem.out.println(c == d);",
    prompt: "What does this print?",
    options: ["true true", "true false", "false false", "true then exception"],
    answer: 1,
    explanation: "Integer boxing caches -128..127, so 127==127 is true. 128 creates new objects → use .equals().",
  },
];

const GO_QUESTIONS: Question[] = [
  {
    id: "go-nil-map",
    code: "var m map[string]int\nm[\"a\"] = 1\nfmt.Println(m[\"a\"])",
    prompt: "What happens?",
    options: ["Prints 1", "Panics: assignment to nil map", "Prints 0", "Compile error"],
    answer: 1,
    explanation: "A declared (nil) map can be READ but not written — must make(map[string]int) first.",
  },
  {
    id: "go-slice-cap",
    code: "s := make([]int, 3, 5)\nfmt.Println(len(s), cap(s))",
    prompt: "What does this print?",
    options: ["5 5", "3 5", "3 3", "0 5"],
    answer: 1,
    explanation: "make([]int, len, cap) — length 3 (visible elements), capacity 5 (backing array size).",
  },
  {
    id: "go-closure-var",
    code: "fns := []func(){}\nfor i := 0; i < 3; i++ {\n    fns = append(fns, func() { fmt.Print(i) })\n}\nfor _, f := range fns { f() }",
    prompt: "What does this print (Go ≥1.22)?",
    options: ["333", "012", "000", "312"],
    answer: 1,
    explanation: "Since Go 1.22 loop variables are per-iteration, so each closure captures its own i → 012. (Pre-1.22 printed 333!)",
  },
];

const RUST_QUESTIONS: Question[] = [
  {
    id: "rs-move",
    code: 'let s = String::from("hi");\nlet t = s;\nprintln!("{}", s);',
    prompt: "Does this compile?",
    options: [
      "Yes — s is copied",
      "No — s was moved into t",
      "Yes — with .clone()",
      "No — strings can't be bound twice",
    ],
    answer: 1,
    explanation: "String is not Copy; assignment moves ownership. Fix: clone() or borrow with &.",
  },
  {
    id: "rs-mut-borrow",
    code: "let mut v = vec![1, 2];\nlet first = &v[0];\nv.push(3);\nprintln!(\"{}\", first);",
    prompt: "Does this compile?",
    options: [
      "Yes",
      "No — v is borrowed while mutated",
      "No — needs unsafe",
      "Yes, with #![allow(mut)]",
    ],
    answer: 1,
    explanation: "The borrow checker forbids holding an immutable reference across a mutation — copy the value (let first = v[0];) to fix.",
  },
  {
    id: "rs-shadowing",
    code: "let x = 5;\nlet x = x + 1;\nlet x = x * 2;\nprintln!(\"{x}\");",
    prompt: "What does this print?",
    options: ["5", "6", "12", "compile error"],
    answer: 2,
    explanation: "Shadowing re-binds x: 5 → 6 → 12. This is valid Rust (different from mut).",
  },
];

const PHP_QUESTIONS: Question[] = [
  {
    id: "php-loose-cmp",
    code: "var_dump('10' == 10);\nvar_dump('10' === 10);",
    prompt: "What does this print?",
    options: ["true true", "true false", "false false", "true then error"],
    answer: 1,
    explanation: "== coerces ('10' to 10); === checks type too — string vs int → false.",
  },
  {
    id: "php-array-keys",
    code: "$a = [5 => 'x', 'y'];\necho $a[6];",
    prompt: "What does this echo?",
    options: ["y", "error", "null with warning", "0"],
    answer: 0,
    explanation: "PHP auto-increments from the largest numeric key — the next element gets key 6.",
  },
];

const CSHARP_QUESTIONS: Question[] = [
  {
    id: "cs-value-vs-ref",
    code: "struct S { public int X; }\nclass C { public int X; }\n\nvar s = new S { X = 1 };\nvar s2 = s; s2.X = 99;\nvar c = new C { X = 1 };\nvar c2 = c; c2.X = 99;\nConsole.WriteLine($\"{s.X} {c.X}\");",
    prompt: "What is printed?",
    options: ["1 1", "1 99", "99 99", "99 1"],
    answer: 1,
    explanation: "structs are value types (copied), classes are reference types (shared).",
  },
  {
    id: "cs-string-intern",
    code: 'string a = "hi";\nstring b = "hi";\nConsole.WriteLine(ReferenceEquals(a, b));',
    prompt: "What is printed?",
    options: ["True", "False", "throws", "undefined"],
    answer: 0,
    explanation: "C# interns string literals — both variables reference the same interned instance.",
  },
];

const BASH_QUESTIONS: Question[] = [
  {
    id: "bash-exit-code",
    code: 'false\necho "$?"',
    prompt: "What does this print?",
    options: ["0", "1", "127", "false"],
    answer: 1,
    explanation: "$? holds the last command's exit code — false exits with 1 (0 means success).",
  },
  {
    id: "bash-quotes",
    code: 'name="world"\necho \'hi $name\'\necho "hi $name"',
    prompt: "What does this print?",
    options: [
      "hi $name / hi world",
      "hi world / hi world",
      "hi $name / hi $name",
      "syntax error",
    ],
    answer: 0,
    explanation: "Single quotes prevent expansion; double quotes allow $VAR expansion.",
  },
];

const LUA_QUESTIONS: Question[] = [
  {
    id: "lua-one-index",
    code: "local t = {'a', 'b', 'c'}\nprint(t[1])",
    prompt: "What does this print?",
    options: ["a", "b", "nil", "error"],
    answer: 0,
    explanation: "Lua tables are 1-indexed — unlike almost every other language.",
  },
  {
    id: "lua-nil-trick",
    code: "local t = {x = 1}\nt.x = nil\nprint(next(t))",
    prompt: "What does this print?",
    options: ["nil", "x", "1", "error"],
    answer: 0,
    explanation: "Setting a key to nil removes it — the table is empty again.",
  },
];

const KOTLIN_QUESTIONS: Question[] = [
  {
    id: "kt-val-var",
    code: "val a = 1\nvar b = 2\na = 3",
    prompt: "Does this compile?",
    options: [
      "Yes",
      "No — val can't be reassigned",
      "No — missing type",
      "Only with lateinit",
    ],
    answer: 1,
    explanation: "val is read-only (like Java's final); use var for reassignable variables.",
  },
  {
    id: "kt-elvis",
    code: 'val s: String? = null\nprintln(s ?: "fallback")',
    prompt: "What does this print?",
    options: ["null", "fallback", "throws NPE", "kotlin.Unit"],
    answer: 1,
    explanation: "?: (elvis) returns the right side when the left is null.",
  },
];

const DART_QUESTIONS: Question[] = [
  {
    id: "dart-interp",
    code: "var name = 'Dart';\nprint('Hi $name');\nprint('Sum: ${2 + 3}');",
    prompt: "What does this print?",
    options: [
      "Hi $name / Sum: 5",
      "Hi Dart / Sum: ${2 + 3}",
      "Hi Dart / Sum: 5",
      "compile error",
    ],
    answer: 2,
    explanation: "$var interpolates simple identifiers; ${expr} evaluates full expressions.",
  },
  {
    id: "dart-final-const",
    code: "final a = DateTime.now();\nconst b = DateTime.now();",
    prompt: "Which line compiles?",
    options: ["Both", "Only final", "Only const", "Neither"],
    answer: 1,
    explanation: "const requires compile-time constants; DateTime.now() is runtime — final works.",
  },
];

const SWIFT_QUESTIONS: Question[] = [
  {
    id: "swift-optional-unwrap",
    code: 'var text: String? = nil\nif let t = text { print(t) }\nprint(text ?? "none")',
    prompt: "What does this print?",
    options: ["nil / none", "none", "crashes", "nothing"],
    answer: 1,
    explanation: "if-let skips (text is nil); ?? provides the default → none.",
  },
  {
    id: "swift-force-unwrap",
    code: 'var text: String? = nil\nprint(text!)',
    prompt: "What happens?",
    options: ["Prints nil", "Prints empty", "Runtime crash", "Compile error"],
    answer: 2,
    explanation: "! force-unwraps — on nil it traps at runtime. Prefer if-let or ?? guards.",
  },
];

const RUBY_QUESTIONS: Question[] = [
  {
    id: "rb-everything-object",
    code: "puts 1.class\nputs nil.class",
    prompt: "What does this print?",
    options: [
      "Integer / NilClass",
      "Fixnum / Null",
      "number / nil",
      "error on nil.class",
    ],
    answer: 0,
    explanation: "In Ruby everything is an object — even 1 and nil have classes.",
  },
  {
    id: "rb-symbol-vs-string",
    code: 'puts :name.object_id == :name.object_id\nputs "name".object_id == "name".object_id',
    prompt: "What does this print?",
    options: ["true true", "true false", "false false", "false true"],
    answer: 1,
    explanation: "Symbols are interned (same object); each string literal is a new object.",
  },
];

const ASM_QUESTIONS: Question[] = [
  {
    id: "asm-syscall-num",
    code: "mov rax, 1\nmov rdi, 1\nsyscall",
    prompt: "What does this syscall do (x86-64 Linux)?",
    options: [
      "exit(1)",
      "write to stdout (sys_write)",
      "read input",
      "fork",
    ],
    answer: 1,
    explanation: "rax=1 is sys_write; rdi=1 is the fd (stdout). rax=60 would be sys_exit.",
  },
  {
    id: "asm-equ",
    code: "msg db 'hi', 10\nlen equ $ - msg",
    prompt: "What is len?",
    options: ["2", "3", "the string length + newline = 3", "undefined"],
    answer: 2,
    explanation: "$ is the current address — $ - msg is the byte length of msg: 'h','i',newline = 3.",
  },
];

export const QUIZZES: Quiz[] = [
  {
    slug: "javascript",
    title: "JavaScript",
    description: "Tricky outputs, coercion, references & patterns — from your own quiz.js notes.",
    icon: "JS",
    accent: "bg-yellow-500/15 text-yellow-500",
    questions: JS_QUESTIONS,
  },
  {
    slug: "python",
    title: "Python",
    description: "Mutable defaults, slices, identity vs equality and more.",
    icon: "🐍",
    accent: "bg-sky-500/15 text-sky-500",
    questions: PY_QUESTIONS,
  },
  {
    slug: "typescript",
    title: "TypeScript",
    description: "any vs unknown, widening, enums and const behavior.",
    icon: "TS",
    accent: "bg-blue-500/15 text-blue-500",
    questions: TS_QUESTIONS,
  },
  {
    slug: "c_cpp",
    title: "C++",
    description: "References, sizeof tricks and dangling pointers.",
    icon: "C+",
    accent: "bg-indigo-500/15 text-indigo-400",
    questions: CPP_QUESTIONS,
  },
  {
    slug: "java",
    title: "Java",
    description: "String pool, Integer cache and integer overflow.",
    icon: "☕",
    accent: "bg-orange-600/15 text-orange-500",
    questions: JAVA_QUESTIONS,
  },
  {
    slug: "go",
    title: "Go",
    description: "Nil maps, slice len/cap and loop-variable captures.",
    icon: "Go",
    accent: "bg-cyan-500/15 text-cyan-500",
    questions: GO_QUESTIONS,
  },
  {
    slug: "rust",
    title: "Rust",
    description: "Move semantics, borrow checker fights and shadowing.",
    icon: "🦀",
    accent: "bg-red-500/15 text-red-500",
    questions: RUST_QUESTIONS,
  },
  {
    slug: "php",
    title: "PHP",
    description: "Loose vs strict comparison and array key magic.",
    icon: "php",
    accent: "bg-violet-500/15 text-violet-400",
    questions: PHP_QUESTIONS,
  },
  {
    slug: "csharp",
    title: "C#",
    description: "Struct vs class semantics and string interning.",
    icon: "C#",
    accent: "bg-purple-500/15 text-purple-500",
    questions: CSHARP_QUESTIONS,
  },
  {
    slug: "lua",
    title: "Lua",
    description: "1-based indexing and the nil-deletes-keys quirk.",
    icon: "🌙",
    accent: "bg-blue-400/15 text-blue-300",
    questions: LUA_QUESTIONS,
  },
  {
    slug: "kotlin",
    title: "Kotlin",
    description: "val vs var and the elvis operator.",
    icon: "Ko",
    accent: "bg-fuchsia-500/15 text-fuchsia-400",
    questions: KOTLIN_QUESTIONS,
  },
  {
    slug: "dart",
    title: "Dart",
    description: "String interpolation and final vs const.",
    icon: "Da",
    accent: "bg-teal-500/15 text-teal-400",
    questions: DART_QUESTIONS,
  },
  {
    slug: "swift",
    title: "Swift",
    description: "Optional unwrapping and the force-unwrap trap.",
    icon: "🐦",
    accent: "bg-orange-500/15 text-orange-400",
    questions: SWIFT_QUESTIONS,
  },
  {
    slug: "ruby",
    title: "Ruby",
    description: "Everything-is-an-object and symbol identity.",
    icon: "💎",
    accent: "bg-rose-600/15 text-rose-500",
    questions: RUBY_QUESTIONS,
  },
  {
    slug: "bash",
    title: "Bash",
    description: "Exit codes and quote expansion rules.",
    icon: "$_",
    accent: "bg-neutral-500/15 text-neutral-300",
    questions: BASH_QUESTIONS,
  },
  {
    slug: "assembly",
    title: "Assembly",
    description: "Syscalls, registers and address arithmetic.",
    icon: "⚙",
    accent: "bg-zinc-500/15 text-zinc-300",
    questions: ASM_QUESTIONS,
  },
];
