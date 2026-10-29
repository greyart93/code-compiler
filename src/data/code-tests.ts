/**
 * LeetCode-style code test problems.
 * Each problem ships a function-signature stub per language and fixed test
 * cases (stdin → expected stdout). The runner hits /api/runCode (glot).
 */

export type TestCase = { input: string; expected: string; label: string };

export type Problem = {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  blurb: string;
  statement: string;   // prose problem statement (markdown-ish)
  /** starter code per language — reads stdin, prints result */
  starter: Partial<Record<string, string>>;
  tests: TestCase[];
  /** what the default solve is graded against */
  topics: string[];
};

export const PROBLEMS: Problem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    blurb: "Find the indices of the two numbers that add up to the target.",
    topics: ["arrays", "hashmap", "O(n)"],
    statement: `Given an array of integers \`nums\` and a \`target\`, print the **indices** (space-separated) of the two numbers that add up to the target. Exactly one solution exists; you may not use the same element twice.

**Input** — line 1: comma-separated \`nums\`; line 2: \`target\`.
**Output** — the two indices, smaller index first.

Example: \`nums = [2,7,11,15]\`, \`target = 9\` → \`0 1\``,
    starter: {
      javascript: 'const lines = require("fs").readFileSync(0, "utf8").trim().split("\\n");\nconst nums = lines[0].split(",").map(Number);\nconst target = Number(lines[1]);\n\n// print the two indices, space-separated\n',
      python: 'import sys\n\nlines = sys.stdin.read().strip().split("\\n")\nnums = list(map(int, lines[0].split(",")))\ntarget = int(lines[1])\n\n# print the two indices, space-separated\n',
    },
    tests: [
      { input: "2,7,11,15\n9", expected: "0 1", label: "nums=[2,7,11,15], target=9" },
      { input: "3,2,4\n6", expected: "1 2", label: "nums=[3,2,4], target=6" },
      { input: "3,3\n6", expected: "0 1", label: "nums=[3,3], target=6" },
    ],
  },
  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    blurb: "Sliding window over a string, keep the winning window length.",
    topics: ["strings", "sliding window", "set"],
    statement: `Given a string \`s\`, print the **length** of the longest substring without repeating characters.

Example: \`"abcabcbb"\` → \`3\` (the substring "abc").`,
    starter: {
      javascript: 'const s = require("fs").readFileSync(0, "utf8").trim();\n\n// print the length of the longest substring without repeats\n',
      python: 'import sys\n\ns = sys.stdin.read().strip()\n\n# print the length of the longest substring without repeats\n',
    },
    tests: [
      { input: "abcabcbb", expected: "3", label: '"abcabcbb" → 3' },
      { input: "bbbbb", expected: "1", label: '"bbbbb" → 1' },
      { input: "pwwkew", expected: "3", label: '"pwwkew" → 3' },
      { input: "", expected: "0", label: '"" → 0' },
    ],
  },
  {
    id: "valid-parens",
    title: "Valid Parentheses",
    difficulty: "easy",
    blurb: "Stack of brackets — is the string balanced?",
    topics: ["stack", "strings"],
    statement: `Given a string containing just the characters \`()\[\]{}\`, print \`true\` if the brackets are closed in the right order, else \`false\`.

Example: \`"()[]{}"\` → \`true\`, \`"([)]"\` → \`false\`.`,
    starter: {
      javascript: 'const s = require("fs").readFileSync(0, "utf8").trim();\n\n// print true or false\n',
      python: 'import sys\n\ns = sys.stdin.read().strip()\n\n# print True or False\n',
    },
    tests: [
      { input: "()[]{}", expected: "true", label: '"()[]{}" → true' },
      { input: "([)]", expected: "false", label: '"([)]" → false' },
      { input: "({[]})", expected: "true", label: '"({[]})" → true' },
      { input: "(", expected: "false", label: '"(" → false' },
    ],
  },
  {
    id: "best-time-stock",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "easy",
    blurb: "One pass: track the min price so far.",
    topics: ["arrays", "one pass", "greedy"],
    statement: `Given an array of prices \`prices[i]\` on day i, pick ONE buy day and ONE later sell day, print the **maximum profit** (0 if no profitable pair exists).

Example: \`prices = [7,1,5,3,6,4]\` → \`5\` (buy day 1, sell day 4).`,
    starter: {
      javascript: 'const prices = require("fs").readFileSync(0, "utf8").trim().split(",").map(Number);\n\n// print the max profit\n',
      python: 'import sys\n\nprices = list(map(int, sys.stdin.read().strip().split(",")))\n\n# print the max profit\n',
    },
    tests: [
      { input: "7,1,5,3,6,4", expected: "5", label: "[7,1,5,3,6,4] → 5" },
      { input: "7,6,4,3,1", expected: "0", label: "[7,6,4,3,1] → 0" },
      { input: "2,4,1", expected: "2", label: "[2,4,1] → 2" },
    ],
  },
  {
    id: "reverse-linked-list",
    title: "Reverse Integer Digits",
    difficulty: "medium",
    blurb: "Reverse the digits of a signed 32-bit integer.",
    topics: ["math"],
    statement: `Given a signed 32-bit integer \`n\`, print \`n\` with its digits reversed. If reversing overflows 32-bit, print \`0\`.

Example: \`123\` → \`321\`, \`-120\` → \`-21\`, \`1534236469\` → \`0\` (overflow).`,
    starter: {
      javascript: 'const n = Number(require("fs").readFileSync(0, "utf8").trim());\n\n// print the reversed integer\n',
      python: 'import sys\n\nn = int(sys.stdin.read().strip())\n\n# print the reversed integer\n',
    },
    tests: [
      { input: "123", expected: "321", label: "123 → 321" },
      { input: "-120", expected: "-21", label: "-120 → -21" },
      { input: "120", expected: "21", label: "120 → 21" },
      { input: "1534236469", expected: "0", label: "overflow → 0" },
    ],
  },
  {
    id: "group-anagrams",
    title: "Group Anagrams (count)",
    difficulty: "medium",
    blurb: "How many distinct anagram groups are in a comma-separated list?",
    topics: ["strings", "hashmap"],
    statement: `Given a comma-separated list of words, print the **number of distinct anagram groups**. Two words are anagrams if one rearranges into the other.

Example: \`eat,tea,tan,ate,nat,bat\` → \`3\` (groups: {eat,tea,ate}, {tan,nat}, {bat}).`,
    starter: {
      javascript: 'const words = require("fs").readFileSync(0, "utf8").trim().split(",");\n\n// print the number of distinct anagram groups\n',
      python: 'import sys\n\nwords = sys.stdin.read().strip().split(",")\n\n# print the number of distinct anagram groups\n',
    },
    tests: [
      { input: "eat,tea,tan,ate,nat,bat", expected: "3", label: "6 words → 3 groups" },
      { input: "abc,def,abc", expected: "2", label: "abc,def,abc → 2" },
      { input: "a", expected: "1", label: "one word → 1" },
    ],
  },
  // ─── from the JavaScript notes ch3 practice set ───
  {
    id: "largest-smallest",
    title: "Largest and Smallest Element",
    difficulty: "easy",
    blurb: "One scan with -Infinity / Infinity trackers.",
    topics: ["arrays", "loops"],
    statement: `Given a comma-separated array of integers, print the **smallest** and the **largest** element, space-separated.

**Constraints** — \`1 ≤ n ≤ 10^5\`, \`-10^9 ≤ nums[i] ≤ 10^9\`.

Example: \`1,3,4,5,0,3,8,2,5,4\` → \`0 8\`.`,
    starter: {
      javascript: 'const nums = require("fs").readFileSync(0, "utf8").trim().split(",").map(Number);\n\n// print smallest and largest, space-separated\n',
      python: 'import sys\n\nnums = list(map(int, sys.stdin.read().strip().split(",")))\n\n# print smallest and largest, space-separated\n',
    },
    tests: [
      { input: "1,3,4,5,0,3,8,2,5,4", expected: "0 8", label: "notes example → 0 8" },
      { input: "7", expected: "7 7", label: "single element → 7 7" },
      { input: "-5,-2,-9", expected: "-9 -2", label: "negatives → -9 -2" },
    ],
  },
  {
    id: "second-largest",
    title: "Second Largest Element",
    difficulty: "easy",
    blurb: "One pass, two trackers — no sorting needed.",
    topics: ["arrays", "one pass"],
    statement: `Given a comma-separated array of integers, print the **second largest distinct** element, or \`-1\` if it does not exist (fewer than 2 distinct values).

**Constraints** — \`1 ≤ n ≤ 10^5\`.

Example: \`1,3,4,5,0,3,8,2,5,4\` → \`5\`.`,
    starter: {
      javascript: 'const nums = require("fs").readFileSync(0, "utf8").trim().split(",").map(Number);\n\n// print the second largest distinct element, or -1\n',
      python: 'import sys\n\nnums = list(map(int, sys.stdin.read().strip().split(",")))\n\n# print the second largest distinct element, or -1\n',
    },
    tests: [
      { input: "1,3,4,5,0,3,8,2,5,4", expected: "5", label: "notes example → 5" },
      { input: "2,2,2", expected: "-1", label: "all same → -1" },
      { input: "10,20", expected: "10", label: "two values → 10" },
    ],
  },
  {
    id: "zero-one-align",
    title: "0 and 1 Alignment",
    difficulty: "easy",
    blurb: "Two pointers swap all 0s before all 1s in place.",
    topics: ["arrays", "two pointers"],
    statement: `Given a binary array, rearrange it **in place** so all \`1\`s come first, then all \`0\`s, and print the result space-separated.

**Constraints** — solve without sorting and without extra arrays.

Example: \`0,0,1,1,0,1,0,1\` → \`1 1 1 1 0 0 0 0\`.`,
    starter: {
      javascript: 'let arr = require("fs").readFileSync(0, "utf8").trim().split(",").map(Number);\n\n// rearrange in place: all 1s first, then 0s — print space-separated\n',
      python: 'import sys\n\narr = list(map(int, sys.stdin.read().strip().split(",")))\n\n# rearrange in place: all 1s first, then 0s — print space-separated\n',
    },
    tests: [
      { input: "0,0,1,1,0,1,0,1", expected: "1 1 1 1 0 0 0 0", label: "notes example → 1s first" },
      { input: "0,0,0", expected: "0 0 0", label: "all zeros → same" },
      { input: "1", expected: "1", label: "single 1 → same" },
    ],
  },
  {
    id: "reverse-no-builtin",
    title: "Reverse Array (no built-ins)",
    difficulty: "easy",
    blurb: "Two pointers swap ends inward — recursion or loop.",
    topics: ["arrays", "two pointers", "recursion"],
    statement: `Given a comma-separated array, print it **reversed** space-separated. Do **not** use \`reverse()\`, \`toReversed()\` or \`slice().reverse()\`.

Example: \`1,2,3,4,5\` → \`5 4 3 2 1\`.`,
    starter: {
      javascript: 'let arr = require("fs").readFileSync(0, "utf8").trim().split(",").map(Number);\n\n// reverse without built-ins, print space-separated\n',
      python: 'import sys\n\narr = list(map(int, sys.stdin.read().strip().split(",")))\n\n# reverse without [::-1] slicing, print space-separated\n',
    },
    tests: [
      { input: "1,2,3,4,5", expected: "5 4 3 2 1", label: "odd length → reversed" },
      { input: "1,2,3,4", expected: "4 3 2 1", label: "even length → reversed" },
      { input: "42", expected: "42", label: "single element → same" },
    ],
  },
  {
    id: "merge-sorted",
    title: "Merge Two Sorted Arrays",
    difficulty: "easy",
    blurb: "Classic two-array two-pointer walk.",
    topics: ["arrays", "two pointers"],
    statement: `Given two comma-separated **sorted** arrays (line 1 and line 2), merge them into one sorted array and print it space-separated.

**Constraints** — do it in \`O(n+m)\`, don't concatenate and sort.

Example: \`[1,3,5,7]\` + \`[2,4,6,8]\` → \`1 2 3 4 5 6 7 8\`.`,
    starter: {
      javascript: 'const lines = require("fs").readFileSync(0, "utf8").trim().split("\\n");\nconst a = lines[0].split(",").map(Number);\nconst b = lines[1].split(",").map(Number);\n\n// merge a and b (both sorted), print space-separated\n',
      python: 'import sys\n\nlines = sys.stdin.read().strip().split("\\n")\na = list(map(int, lines[0].split(",")))\nb = list(map(int, lines[1].split(",")))\n\n# merge a and b (both sorted), print space-separated\n',
    },
    tests: [
      { input: "1,3,5,7\\n2,4,6,8", expected: "1 2 3 4 5 6 7 8", label: "even split → merged" },
      { input: "1,1,2\\n1,5", expected: "1 1 1 2 5", label: "duplicates kept" },
      { input: "\\n2,3", expected: "2 3", label: "empty first array" },
    ],
  },
  {
    id: "find-duplicates",
    title: "Find Duplicates with a Set",
    difficulty: "easy",
    blurb: "Track seen values; collect the repeats.",
    topics: ["arrays", "set"],
    statement: `Given a comma-separated array, print the **elements that appear more than once**, space-separated in first-repeat order. If none, print \`\` (nothing) — the checker treats empty output as pass when expected is empty.

Example: \`1,2,3,1,2,4,5\` → \`1 2\`.`,
    starter: {
      javascript: 'const arr = require("fs").readFileSync(0, "utf8").trim().split(",").map(Number);\n\n// print elements that appear more than once, space-separated\n',
      python: 'import sys\n\narr = list(map(int, sys.stdin.read().strip().split(",")))\n\n# print elements that appear more than once, space-separated\n',
    },
    tests: [
      { input: "1,2,3,1,2,4,5", expected: "1 2", label: "notes example → 1 2" },
      { input: "1,2,3", expected: "", label: "no duplicates → empty" },
      { input: "5,5", expected: "5", label: "one duplicate pair → 5" },
    ],
  },
  {
    id: "remove-duplicates",
    title: "Remove Duplicates",
    difficulty: "easy",
    blurb: "Spread a Set — or filter with includes().",
    topics: ["arrays", "set"],
    statement: `Given a comma-separated array, print it with duplicates removed, keeping first occurrences in order.

Example: \`1,2,2,3,4,4,5\` → \`1 2 3 4 5\`.`,
    starter: {
      javascript: 'const arr = require("fs").readFileSync(0, "utf8").trim().split(",").map(Number);\n\n// print the deduped array, space-separated\n',
      python: 'import sys\n\narr = list(map(int, sys.stdin.read().strip().split(",")))\n\n# print the deduped array, space-separated\n',
    },
    tests: [
      { input: "1,2,2,3,4,4,5", expected: "1 2 3 4 5", label: "notes example → deduped" },
      { input: "9,9,9,9", expected: "9", label: "all same → single" },
      { input: "1,2,3", expected: "1 2 3", label: "already unique → same" },
    ],
  },
  {
    id: "rotate-k",
    title: "Rotate Array by K",
    difficulty: "medium",
    blurb: "Slice-concat, or the 3-reversal trick.",
    topics: ["arrays", "rotation", "reversal trick"],
    statement: `Given a comma-separated array (line 1) and \`k\` (line 2), rotate the array to the right by \`k\` positions and print it space-separated.

**Constraints** — \`k\` can be larger than the array length (reduce it with mod).

Example: \`[1,2,3,4,5]\`, \`k=2\` → \`4 5 1 2 3\`.`,
    starter: {
      javascript: 'const lines = require("fs").readFileSync(0, "utf8").trim().split("\\n");\nconst arr = lines[0].split(",").map(Number);\nconst k = Number(lines[1]);\n\n// rotate right by k, print space-separated\n',
      python: 'import sys\n\nlines = sys.stdin.read().strip().split("\\n")\narr = list(map(int, lines[0].split(",")))\nk = int(lines[1])\n\n# rotate right by k, print space-separated\n',
    },
    tests: [
      { input: "1,2,3,4,5\\n2", expected: "4 5 1 2 3", label: "notes example → 4 5 1 2 3" },
      { input: "1,2,3\\n7", expected: "3 1 2", label: "k > length wraps (7%3=1)" },
      { input: "1,2\\n0", expected: "1 2", label: "k=0 → unchanged" },
    ],
  },
  {
    id: "missing-number",
    title: "Find the Missing Number",
    difficulty: "easy",
    blurb: "n(n+1)/2 minus the actual sum — or XOR.",
    topics: ["arrays", "math", "sum formula"],
    statement: `Line 1 is \`n\` (the full range is \`1..n\`), line 2 lists \`n-1\` distinct numbers from that range. Print the missing one.

**Constraints** — solve in \`O(n)\` with constant memory.

Example: \`n=5\`, \`1,2,4,5\` → \`3\`.`,
    starter: {
      javascript: 'const lines = require("fs").readFileSync(0, "utf8").trim().split("\\n");\nconst n = Number(lines[0]);\nconst arr = lines[1].split(",").map(Number);\n\n// print the missing number from 1..n\n',
      python: 'import sys\n\nlines = sys.stdin.read().strip().split("\\n")\nn = int(lines[0])\narr = list(map(int, lines[1].split(",")))\n\n# print the missing number from 1..n\n',
    },
    tests: [
      { input: "5\\n1,2,4,5", expected: "3", label: "notes example → 3" },
      { input: "3\\n2,3", expected: "1", label: "missing at start → 1" },
      { input: "2\\n2", expected: "1", label: "n=2, [2] → 1" },
    ],
  },
  {
    id: "vowel-count",
    title: "Vowel Counter",
    difficulty: "easy",
    blurb: "includes() over lowercase chars — from the notes.",
    topics: ["strings", "includes"],
    statement: `Given a line of text, print the **number of vowels** (a, e, i, o, u — case-insensitive).

Example: \`Hey JS You ARE AmaZing!\` → \`8\`.`,
    starter: {
      javascript: 'const s = require("fs").readFileSync(0, "utf8").trim();\n\n// print the vowel count\n',
      python: 'import sys\n\ns = sys.stdin.read().strip()\n\n# print the vowel count\n',
    },
    tests: [
      { input: "Hey JS You ARE AmaZing!", expected: "8", label: "notes example → 8" },
      { input: "bcdfg", expected: "0", label: "no vowels → 0" },
      { input: "aEiOu", expected: "5", label: "all vowels mixed case → 5" },
    ],
  },
  {
    id: "palindromic-substrings",
    title: "All Palindromic Substrings",
    difficulty: "medium",
    blurb: "Every substring that reads the same both ways.",
    topics: ["strings", "nested loops"],
    statement: `Given a string, print every **palindromic substring** (length ≥ 1) space-separated, in the scan order \`i\` outer, \`j\` inner. Single characters count.

Example: \`oko\` → \`o oko k o\`.`,
    starter: {
      javascript: 'const s = require("fs").readFileSync(0, "utf8").trim();\n\n// print all palindromic substrings space-separated\n',
      python: 'import sys\n\ns = sys.stdin.read().strip()\n\n# print all palindromic substrings space-separated\n',
    },
    tests: [
      { input: "oko", expected: "o oko k o", label: "notes example (longest: oko)" },
      { input: "aba", expected: "a aba b a", label: '"aba" → a aba b a' },
      { input: "aa", expected: "a aa a", label: '"aa" → a aa a' },
    ],
  },
  {
    id: "intersection",
    title: "Intersection of Two Arrays",
    difficulty: "easy",
    blurb: "One Set + a filter — note style.",
    topics: ["arrays", "set"],
    statement: `Two comma-separated arrays (line 1, line 2). Print their **common elements**, space-separated (each common value once, in the order they appear in the first array).

Example: \`[1,2,3,4,5]\` ∩ \`[4,5,6,7,8]\` → \`4 5\`.`,
    starter: {
      javascript: 'const lines = require("fs").readFileSync(0, "utf8").trim().split("\\n");\nconst a = lines[0].split(",").map(Number);\nconst b = lines[1].split(",").map(Number);\n\n// print common elements, space-separated\n',
      python: 'import sys\n\nlines = sys.stdin.read().strip().split("\\n")\na = list(map(int, lines[0].split(",")))\nb = list(map(int, lines[1].split(",")))\n\n# print common elements, space-separated\n',
    },
    tests: [
      { input: "1,2,3,4,5\\n4,5,6,7,8", expected: "4 5", label: "notes example → 4 5" },
      { input: "1,2\\n3,4", expected: "", label: "no overlap → empty" },
      { input: "1,2,2,3\\n2,2", expected: "2", label: "dupes → common once" },
    ],
  },
  {
    id: "two-arrays-equal",
    title: "Are Two Arrays Equal?",
    difficulty: "easy",
    blurb: "Length check + element loop or JSON compare.",
    topics: ["arrays", "comparison"],
    statement: `Two comma-separated arrays (line 1, line 2). Print \`true\` if they contain the same elements in the same order, else \`false\`.

Example: \`[1,2,3]\` vs \`[1,2,3]\` → \`true\`.`,
    starter: {
      javascript: 'const lines = require("fs").readFileSync(0, "utf8").trim().split("\\n");\nconst a = lines[0].split(",");\nconst b = lines[1].split(",");\n\n// print true or false\n',
      python: 'import sys\n\nlines = sys.stdin.read().strip().split("\\n")\na = lines[0].split(",")\nb = lines[1].split(",")\n\n# print True or False\n',
    },
    tests: [
      { input: "1,2,3\\n1,2,3", expected: "true", label: "identical → true" },
      { input: "1,2,3\\n1,2,4", expected: "false", label: "last diff → false" },
      { input: "1,2\\n1,2,3", expected: "false", label: "length diff → false" },
    ],
  },
  {
    id: "is-prime",
    title: "Prime Check",
    difficulty: "easy",
    blurb: "Trial division up to √n — notes style.",
    topics: ["math", "primes"],
    statement: `Given an integer \`n\`, print \`true\` if it is prime, else \`false\`. (1 and non-integers are not prime.)

**Constraints** — \`n\` up to \`10^9\`; use a √n loop, not a 2..n/2 one.

Example: \`11\` → \`true\`, \`15\` → \`false\`.`,
    starter: {
      javascript: 'const n = Number(require("fs").readFileSync(0, "utf8").trim());\n\n// print true or false\n',
      python: 'import sys\n\nn = int(sys.stdin.read().strip())\n\n# print True or False\n',
    },
    tests: [
      { input: "11", expected: "true", label: "11 → true" },
      { input: "15", expected: "false", label: "15 → false" },
      { input: "2", expected: "true", label: "2 → true" },
      { input: "1", expected: "false", label: "1 → false" },
    ],
  },
  {
    id: "key-value-zip",
    title: "Zip Keys into Values (reduce)",
    difficulty: "medium",
    blurb: "From the notes: reduce two lists into one object.",
    topics: ["objects", "reduce"],
    statement: `Line 1: comma-separated keys; line 2: comma-separated values (same length). Build an object mapping each key to its value and print the count of entries.

Example: keys \`one,two,three\`, values \`1,2,3\` → \`3\` (for {one:1, two:2, three:3}).`,
    starter: {
      javascript: 'const lines = require("fs").readFileSync(0, "utf8").trim().split("\\n");\nconst keys = lines[0].split(",");\nconst vals = lines[1].split(",");\n\n// reduce into an object, then print the number of entries\n',
      python: 'import sys\n\nlines = sys.stdin.read().strip().split("\\n")\nkeys = lines[0].split(",")\nvals = lines[1].split(",")\n\n# build a dict, then print the number of entries\n',
    },
    tests: [
      { input: "one,two,three\\n1,2,3", expected: "3", label: "3 pairs → 3" },
      { input: "a\\ntrue", expected: "1", label: "1 pair → 1" },
      { input: "count,increment,error\n0,2,x", expected: "3", label: "3 pairs → 3" },
    ],
  },
  {
    id: "recursive-salaries",
    title: "Sum Nested Salaries (recursion)",
    difficulty: "hard",
    blurb: "The notes' company tree — recursive sum over arrays of objects.",
    topics: ["recursion", "objects", "trees"],
    statement: `Parse a nested department JSON from stdin (company → departments → either arrays of \`{name, salary}\` employees or sub-objects). Print the **total of all salaries**.

Use recursion: array → \`reduce\` over \`salary\`; object → recurse over \`Object.values\`.

Example input:
\`{"sales":[{"name":"John","salary":1000},{"name":"Alice","salary":1600}],"development":{"sites":[{"name":"Peter","salary":2000}],"internals":[{"name":"Jack","salary":1300}]}}\`
→ \`5900\`.`,
    starter: {
      javascript: 'const company = JSON.parse(require("fs").readFileSync(0, "utf8"));\n\n// recursively sum every salary, print the total\n',
      python: 'import sys, json\n\ncompany = json.loads(sys.stdin.read())\n\n# recursively sum every salary, print the total\n',
    },
    tests: [
      { input: '{"sales":[{"name":"John","salary":1000},{"name":"Alice","salary":1600}],"development":{"sites":[{"name":"Peter","salary":2000}],"internals":[{"name":"Jack","salary":1300}]}}', expected: "5900", label: "notes example → 5900" },
      { input: '{"a":[{"name":"x","salary":100}]}', expected: "100", label: "one employee → 100" },
      { input: '{"a":{"b":[{"name":"y","salary":5}],"c":{"d":[{"name":"z","salary":10}]}}}', expected: "15", label: "3-deep nesting → 15" },
    ],
  },
  {
    id: "min-stack",
    title: "Stack & Queue from Arrays",
    difficulty: "medium",
    blurb: "Simulate operations, print the final stack.",
    topics: ["stack", "queue", "simulation"],
    statement: `Process comma-separated operations on an empty stack (line 1): \`push:x\` appends x, \`pop\` removes the last element, \`peek\` does nothing. Print the final stack space-separated (top last). Ignore a \`pop\` on an empty stack.

Example: \`push:1,push:2,pop,push:3\` → \`1 3\`.`,
    starter: {
      javascript: 'const ops = require("fs").readFileSync(0, "utf8").trim().split(",");\n\n// simulate the stack, print space-separated\n',
      python: 'import sys\n\nops = sys.stdin.read().strip().split(",")\n\n# simulate the stack, print space-separated\n',
    },
    tests: [
      { input: "push:1,push:2,pop,push:3", expected: "1 3", label: "example → 1 3" },
      { input: "pop,push:5", expected: "5", label: "pop on empty ignored → 5" },
      { input: "push:1,push:2", expected: "1 2", label: "no ops removal → 1 2" },
    ],
  },
  {
    id: "fib-recursion",
    title: "Fibonacci Series (recursion)",
    difficulty: "medium",
    blurb: "The notes' tail-recursive two-variable fib.",
    topics: ["recursion", "fibonacci"],
    statement: `Given \`n\` (line 1), print the Fibonacci numbers **up to and including n terms** space-separated, starting from \`0\` (1st term is 0, 2nd is 1).

Example: \`n=8\` → \`0 1 1 2 3 5 8 13\`.`,
    starter: {
      javascript: 'const n = Number(require("fs").readFileSync(0, "utf8").trim());\n\n// print the first n Fibonacci numbers space-separated\n',
      python: 'import sys\n\nn = int(sys.stdin.read().strip())\n\n# print the first n Fibonacci numbers space-separated\n',
    },
    tests: [
      { input: "8", expected: "0 1 1 2 3 5 8 13", label: "8 terms" },
      { input: "1", expected: "0", label: "1 term → 0" },
      { input: "2", expected: "0 1", label: "2 terms → 0 1" },
    ],
  },
  {
    id: "factorial",
    title: "Factorial",
    difficulty: "easy",
    blurb: "n! — loop or recursion, your pick.",
    topics: ["math", "recursion"],
    statement: `Given a non-negative integer \`n\`, print \`n!\` (factorial). \`0! = 1\`.

**Constraints** — \`0 ≤ n ≤ 20\` (fits in a JS Number exactly).

Example: \`5\` → \`120\`.`,
    starter: {
      javascript: 'const n = Number(require("fs").readFileSync(0, "utf8").trim());\n\n// print n!\n',
      python: 'import sys\n\nn = int(sys.stdin.read().strip())\n\n# print n!\n',
    },
    tests: [
      { input: "5", expected: "120", label: "5! → 120" },
      { input: "0", expected: "1", label: "0! → 1" },
      { input: "10", expected: "3628800", label: "10! → 3628800" },
    ],
  },
  {
    id: "binary-search",
    title: "Binary Search",
    difficulty: "medium",
    blurb: "Classic halving on a sorted array.",
    topics: ["arrays", "binary search"],
    statement: `Line 1: a comma-separated **ascending** sorted array; line 2: a \`target\`. Print the **index** of the target, or \`-1\` if absent.

**Constraints** — must run in \`O(log n)\`.

Example: \`[1,3,5,7,9]\`, target \`7\` → \`3\`.`,
    starter: {
      javascript: 'const lines = require("fs").readFileSync(0, "utf8").trim().split("\\n");\nconst arr = lines[0].split(",").map(Number);\nconst target = Number(lines[1]);\n\n// print the index of target, or -1\n',
      python: 'import sys\n\nlines = sys.stdin.read().strip().split("\\n")\narr = list(map(int, lines[0].split(",")))\ntarget = int(lines[1])\n\n# print the index of target, or -1\n',
    },
    tests: [
      { input: "1,3,5,7,9\\n7", expected: "3", label: "found middle-right → 3" },
      { input: "1,3,5,7,9\\n4", expected: "-1", label: "absent → -1" },
      { input: "5\\n5", expected: "0", label: "single hit → 0" },
    ],
  },
  {
    id: "freq-count",
    title: "Frequency Count (JSON out)",
    difficulty: "medium",
    blurb: "The notes' {value: count} reducer + duplicate check.",
    topics: ["arrays", "objects", "hashmap"],
    statement: `Given a comma-separated array, build a frequency object mapping **each distinct value** to the number of times it appears, then print only the **values that appear more than once**, each as \`value:count\` comma-separated, in first-appearance order. If none repeat, print \`none\`.

Example: \`1,2,3,2,2,4\` → \`2:3\`.`,
    starter: {
      javascript: 'const arr = require("fs").readFileSync(0, "utf8").trim().split(",");\n\n// build the frequency map, print "value:count" for repeats or none\n',
      python: 'import sys\n\narr = sys.stdin.read().strip().split(",")\n\n# build the freq map, print "value:count" for repeats or none\n',
    },
    tests: [
      { input: "1,2,3,2,2,4", expected: "2:3", label: "2 appears 3× → 2:3" },
      { input: "1,1,2,2,3", expected: "1:2,2:2", label: "two repeats → 1:2,2:2" },
      { input: "1,2,3", expected: "none", label: "no repeats → none" },
    ],
  },
];

export const PROBLEM_LANGS = ["javascript", "python"] as const;
