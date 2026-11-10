import type { CodeProblem } from "./types";

/**
 * Levels 7–10 — the deep end. Recursion over data, interval and DP problems,
 * and one that really wants binary search.
 */
export const CODE_LEVEL_7_TO_10: CodeProblem[] = [
  {
    id: "recursive-salaries",
    fn: "sumSalaries",
    params: "json:string",
    returns: "int",
    title: "Sum Nested Salaries",
    level: 7,
    blurb: "Recursion over a JSON tree of objects and arrays.",
    topics: ["recursion", "JSON", "trees"],
    task: "return the total of every salary",
    statement: `Read a nested company JSON from stdin. Departments are objects; employees live in arrays as \`{ "name": ..., "salary": ... }\`, and departments can contain more departments. Return the total of every salary.

**Input** — \`{"sales":[{"name":"John","salary":1000}],"dev":{"sites":[{"name":"Peter","salary":2000}]}}\`
**Output** — \`3000\`

Array → sum the entries (recursing into objects); object → recurse over its values.`,
    hints: [
      "Write one function that takes any JSON value: array, object or scalar.",
      "An object with a salary key is a leaf; otherwise recurse into every value.",
    ],
    tests: [
      {
        input:
          '{"sales":[{"name":"John","salary":1000},{"name":"Alice","salary":1600}],"development":{"sites":[{"name":"Peter","salary":2000}],"internals":[{"name":"Jack","salary":1300}]}}',
        expected: "5900",
        label: "two levels",
      },
      { input: '{"a":[{"name":"x","salary":100}]}', expected: "100", label: "one employee" },
      {
        input: '{"a":{"b":[{"name":"y","salary":5}],"c":{"d":[{"name":"z","salary":10}]}}}',
        expected: "15",
        label: "three levels deep",
      },
    ],
  },
  {
    id: "merge-intervals",
    fn: "mergeIntervals",
    params: "s:string",
    returns: "string",
    title: "Merge Overlapping Intervals",
    level: 7,
    blurb: "Sort by start, then sweep.",
    topics: ["sorting", "intervals"],
    task: "return the merged intervals",
    statement: `Intervals arrive semicolon-separated as \`start,end\`. Merge the overlapping or touching ones and return them in ascending order in the same format.

**Input** — \`1,3;2,6;8,10;15,18\`
**Output** — \`1,6;8,10;15,18\`

Touching intervals (ending where the next starts) merge too: \`1,2;2,3\` → \`1,3\`.`,
    hints: [
      "Sort the intervals by start value first.",
      "Walk forward keeping the current merged interval; extend its end when the next start is ≤ that end.",
    ],
    tests: [
      { input: "1,3;2,6;8,10;15,18", expected: "1,6;8,10;15,18", label: "classic" },
      { input: "1,4;4,5", expected: "1,5", label: "touching intervals" },
      { input: "5,7;1,2", expected: "1,2;5,7", label: "unsorted input" },
    ],
  },
  {
    id: "longest-palindrome",
    fn: "longestPalindrome",
    params: "s:string",
    returns: "string",
    title: "Longest Palindromic Substring",
    level: 7,
    blurb: "Expand around every centre.",
    topics: ["strings", "expanding"],
    task: "return the longest palindromic substring",
    statement: `Return the longest palindromic substring. If several have the same length, return the one that starts earliest.

**Input** — \`babad\`
**Output** — \`bab\` (\`aba\` is equally long but starts later)

There are \`2n - 1\` centres: every character and every gap between characters.`,
    hints: [
      "For each centre, expand while the characters match.",
      "Handle odd and even lengths by trying centre i and centre (i, i+1).",
    ],
    tests: [
      { input: "babad", expected: "bab", label: "earliest wins the tie" },
      { input: "cbbd", expected: "bb", label: "even length" },
      { input: "a", expected: "a", label: "single character" },
    ],
  },
  {
    id: "trapping-rain",
    fn: "trapRain",
    params: "height:ints",
    returns: "int",
    title: "Trapping Rain Water",
    level: 8,
    blurb: "Water above each bar is bounded by the tallest walls on both sides.",
    topics: ["arrays", "two pointers"],
    task: "return the total trapped water",
    statement: `Heights of bars are given comma-separated. Return how many units of rainwater can be trapped between them.

**Input** — \`0,1,0,2,1,0,1,3,2,1,2,1\`
**Output** — \`6\`

Water above a bar = min(tallest to its left, tallest to its right) - its height, never below zero.`,
    hints: [
      "Prefix and suffix maxima give the answer in O(n) time and O(n) space.",
      "Two pointers can do it with O(1) space: move the side with the smaller maximum.",
    ],
    tests: [
      { input: "0,1,0,2,1,0,1,3,2,1,2,1", expected: "6", label: "classic" },
      { input: "4,2,0,3,2,5", expected: "9", label: "basin" },
      { input: "1,2,3", expected: "0", label: "rising bars" },
    ],
  },
  {
    id: "coin-change",
    fn: "fewestCoins",
    params: "coins:ints,amount:int",
    returns: "int",
    title: "Fewest Coins",
    level: 8,
    blurb: "The classic unbounded knapsack DP.",
    topics: ["dynamic programming"],
    task: "return the minimum number of coins, or -1",
    statement: `Line 1: available coin values. Line 2: amount. Return the fewest coins needed to make exactly that amount, or \`-1\` if it is impossible.

**Input** — \`1,2,5\` / \`11\`
**Output** — \`3\` (5 + 5 + 1)

Greedy fails for coins like 1, 3, 4 — you need the table.`,
    hints: [
      "dp[0] = 0 and dp[amount] = 1 + min(dp[amount - coin]) over usable coins.",
      "Fill the table upwards so smaller amounts are solved before larger ones.",
    ],
    tests: [
      { input: "1,2,5\n11", expected: "3", label: "11 with 1,2,5" },
      { input: "2\n3", expected: "-1", label: "impossible" },
      { input: "1\n0", expected: "0", label: "zero amount" },
    ],
  },
  {
    id: "lis",
    fn: "lisLength",
    params: "nums:ints",
    returns: "int",
    title: "Longest Increasing Subsequence",
    level: 8,
    blurb: "Patience sorting in O(n log n), or the O(n²) table.",
    topics: ["dynamic programming", "binary search"],
    task: "return the length of the longest increasing subsequence",
    statement: `Return the length of the longest strictly increasing subsequence (not necessarily contiguous).

**Input** — \`10,9,2,5,3,7,101,18\`
**Output** — \`4\` (2, 3, 7, 101)`,
    hints: [
      "dp[i] = 1 + max(dp[j]) for every j < i with value[j] < value[i].",
      "The faster version keeps a sorted list of smallest tails and binary-searches it.",
    ],
    tests: [
      { input: "10,9,2,5,3,7,101,18", expected: "4", label: "classic" },
      { input: "1,2,3", expected: "3", label: "already increasing" },
      { input: "5", expected: "1", label: "single value" },
    ],
  },
  {
    id: "median-two-sorted",
    fn: "medianSorted",
    params: "a:ints,b:ints",
    returns: "float1",
    title: "Median of Two Sorted Lists",
    level: 9,
    blurb: "The binary-search answer interviewers love.",
    topics: ["binary search", "arrays"],
    task: "return the median with one decimal place",
    statement: `Two ascending sorted lists (line 1 and line 2, either may be empty). Return their combined median with exactly one decimal place.

**Input** — \`1,3\` / \`2\`
**Output** — \`2.0\`

A merge is O(n + m) and perfectly acceptable; the famous solution is O(log(min(n, m))) by partitioning.`,
    hints: [
      "Merging both lists and indexing the middle is enough for a correct answer.",
      "For an even total, average the two middle values; always format to one decimal place.",
    ],
    tests: [
      { input: "1,3\n2", expected: "2.0", label: "odd total" },
      { input: "1,2\n3,4", expected: "2.5", label: "even total" },
      { input: "0,0\n0,0", expected: "0.0", label: "all zeros" },
    ],
  },
];
