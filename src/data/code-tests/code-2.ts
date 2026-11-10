import type { CodeProblem } from "./types";

/**
 * Levels 4–6 — the patterns that show up in every interview: hashing, two
 * pointers, windows, stacks, a first dynamic program.
 */
export const CODE_LEVEL_4_TO_6: CodeProblem[] = [
  {
    id: "two-sum",
    fn: "twoSum",
    params: "nums:ints,target:int",
    returns: "ints",
    title: "Two Sum",
    level: 4,
    blurb: "Find the pair that hits the target — hash map, one pass.",
    topics: ["arrays", "hashmap", "O(n)"],
    task: "return the two indices, smaller first",
    statement: `Given comma-separated integers and a target, return the **indices** (space-separated, smaller first) of the two numbers that add up to the target. Exactly one solution exists and an element cannot be used twice.

**Input** — line 1: \`2,7,11,15\`, line 2: \`9\`
**Output** — \`0 1\`

A double loop is O(n²); a map from value → index gets you O(n).`,
    hints: [
      "For each number, the value you need is target - number.",
      "Store seen values in a map as you go, and look up the need before inserting.",
    ],
    tests: [
      { input: "2,7,11,15\n9", expected: "0 1", label: "first and second" },
      { input: "3,2,4\n6", expected: "1 2", label: "middle and last" },
      { input: "3,3\n6", expected: "0 1", label: "equal values" },
    ],
  },
  {
    id: "best-time-stock",
    fn: "maxProfit",
    params: "prices:ints",
    returns: "int",
    title: "Best Time to Buy and Sell",
    level: 4,
    blurb: "Track the cheapest price so far in one pass.",
    topics: ["arrays", "greedy", "one pass"],
    task: "return the maximum profit",
    statement: `Given daily prices, pick one buy day and one later sell day. Return the maximum profit, or \`0\` if no profitable pair exists.

**Input** — \`7,1,5,3,6,4\`
**Output** — \`5\` (buy at 1, sell at 6)`,
    hints: [
      "You only ever need the lowest price seen so far.",
      "At each day, profit = today - lowest, and keep the best.",
    ],
    tests: [
      { input: "7,1,5,3,6,4", expected: "5", label: "classic" },
      { input: "7,6,4,3,1", expected: "0", label: "only falling prices" },
      { input: "2,4,1", expected: "2", label: "buy 2 sell 4" },
    ],
  },
  {
    id: "valid-parens",
    fn: "isValidParens",
    params: "s:string",
    returns: "bool",
    title: "Valid Parentheses",
    level: 4,
    blurb: "A stack of opening brackets.",
    topics: ["stack", "strings"],
    task: "print true or false",
    statement: `A string of \`()[]{}\` characters is valid when every opening bracket is closed by the matching type, in the right order. Return \`true\` or \`false\`.

**Input** — \`([)]\`
**Output** — \`false\``,
    hints: [
      "Push opening brackets; on a closing bracket, pop and check the match.",
      "An empty stack when closing, or a non-empty stack at the end, means false.",
    ],
    tests: [
      { input: "()[]{}", expected: "true", label: "all pairs" },
      { input: "([)]", expected: "false", label: "wrong nesting" },
      { input: "({[]})", expected: "true", label: "nested" },
      { input: "(", expected: "false", label: "unclosed" },
    ],
  },
  {
    id: "group-anagrams",
    fn: "countAnagramGroups",
    params: "words:words",
    returns: "int",
    title: "Count Anagram Groups",
    level: 4,
    blurb: "Normalise each word into a key, then count keys.",
    topics: ["strings", "hashmap"],
    task: "return the number of distinct groups",
    statement: `Given a list of words, return how many distinct anagram groups they form.

**Input** — \`eat,tea,tan,ate,nat,bat\`
**Output** — \`3\` — \`{eat, tea, ate}\`, \`{tan, nat}\`, \`{bat}\`

The trick: sort the letters of each word — anagrams share the sorted form.`,
    hints: [
      "Sorting a word gives a canonical key for its anagram group.",
      "A set of keys is all you need; the size of the set is the answer.",
    ],
    tests: [
      { input: "eat,tea,tan,ate,nat,bat", expected: "3", label: "six words" },
      { input: "abc,def,abc", expected: "2", label: "one repeat" },
      { input: "a", expected: "1", label: "single word" },
    ],
  },
  {
    id: "freq-count",
    fn: "frequencyReport",
    params: "nums:ints",
    returns: "string",
    title: "Frequency Report",
    level: 4,
    blurb: "Build a counter, then filter the repeats.",
    topics: ["arrays", "objects", "hashmap"],
    task: "print value:count for repeats, or none",
    statement: `Count the occurrences of each value. Return \`value:count\` for the values that appear more than once, comma-separated in first-appearance order, or \`none\`.

**Input** — \`1,2,3,2,2,4\`
**Output** — \`2:3\``,
    hints: ["One pass to count, one pass over the first-appearance order to build the report.", "Do not rely on map ordering — track the original order."],
    tests: [
      { input: "1,2,3,2,2,4", expected: "2:3", label: "2 appears three times" },
      { input: "1,1,2,2,3", expected: "1:2,2:2", label: "two repeats" },
      { input: "1,2,3", expected: "none", label: "no repeats" },
    ],
  },
  {
    id: "key-value-zip",
    fn: "zipKeys",
    params: "keys:words,values:words",
    returns: "int",
    title: "Zip Keys to Values",
    level: 4,
    blurb: "Two parallel lists into one map.",
    topics: ["objects", "arrays"],
    task: "build the map and return its size",
    statement: `Line 1: comma-separated keys. Line 2: comma-separated values (same length). Build a map from them and return how many entries it has.

**Input** — \`one,two,three\` / \`1,2,3\`
**Output** — \`3\`

Duplicate keys collapse — the last value wins.`,
    hints: ["Walk both lists with the same index.", "Assignments to an existing key overwrite it; that is why the count can be smaller than the list."],
    tests: [
      { input: "one,two,three\n1,2,3", expected: "3", label: "three pairs" },
      { input: "a\ntrue", expected: "1", label: "one pair" },
      { input: "count,increment,error\n0,2,x", expected: "3", label: "three pairs" },
    ],
  },
  {
    id: "rotate-k",
    fn: "rotateRight",
    params: "nums:ints,k:int",
    returns: "ints",
    title: "Rotate a List by K",
    level: 4,
    blurb: "Modulo first, then rotate right.",
    topics: ["arrays", "rotation"],
    task: "return the rotated list",
    statement: `Line 1: comma-separated integers. Line 2: \`k\`. Rotate the list to the right by \`k\` positions and return it space-separated.

**Input** — \`1,2,3,4,5\` / \`2\`
**Output** — \`4 5 1 2 3\`

\`k\` may be larger than the list — reduce it with \`k % n\` first.`,
    hints: ["Reduce k, and remember that rotating by 0 is a no-op.", "The last k elements move to the front."],
    tests: [
      { input: "1,2,3,4,5\n2", expected: "4 5 1 2 3", label: "rotate by 2" },
      { input: "1,2,3\n7", expected: "3 1 2", label: "k wraps (7 % 3 = 1)" },
      { input: "1,2\n0", expected: "1 2", label: "k = 0" },
    ],
  },
  {
    id: "reverse-linked-list",
    fn: "reverseInteger",
    params: "n:int",
    returns: "int",
    title: "Reverse an Integer",
    level: 4,
    blurb: "Digit surgery with % and /, plus an overflow rule.",
    topics: ["math", "overflow"],
    task: "return the reversed integer, or 0 on overflow",
    statement: `Reverse the digits of a signed 32-bit integer. If the reversed value would overflow the signed 32-bit range, return \`0\`. Trailing zeros disappear.

**Input** — \`-120\`
**Output** — \`-21\``,
    hints: ["Build the result digit by digit: result = result * 10 + digit.", "Check the 32-bit bounds before returning, not after."],
    tests: [
      { input: "123", expected: "321", label: "positive" },
      { input: "-120", expected: "-21", label: "negative with zero" },
      { input: "120", expected: "21", label: "trailing zero" },
      { input: "1534236469", expected: "0", label: "overflow" },
    ],
  },
  {
    id: "binary-search",
    fn: "binarySearch",
    params: "nums:ints,target:int",
    returns: "int",
    title: "Binary Search",
    level: 4,
    blurb: "Halve the range until it lands.",
    topics: ["arrays", "binary search"],
    task: "return the index of the target, or -1",
    statement: `Line 1: an ascending sorted list. Line 2: a target. Return the target's index, or \`-1\` if it is absent. Use binary search, not a linear scan.

**Input** — \`1,3,5,7,9\` / \`7\`
**Output** — \`3\``,
    hints: [
      "Keep low and high bounds and probe the middle.",
      "Move low to mid + 1, or high to mid - 1 — never leave a bound that cannot change.",
    ],
    tests: [
      { input: "1,3,5,7,9\n7", expected: "3", label: "right of middle" },
      { input: "1,3,5,7,9\n4", expected: "-1", label: "absent" },
      { input: "5\n5", expected: "0", label: "single element" },
    ],
  },
  {
    id: "fib-recursion",
    fn: "fibonacci",
    params: "n:int",
    returns: "ints",
    title: "Fibonacci Series",
    level: 4,
    blurb: "Recursion is elegant; memoisation makes it fast.",
    topics: ["recursion", "dynamic programming"],
    task: "return the first n terms",
    statement: `Return the first \`n\` Fibonacci numbers space-separated, starting \`0, 1\`.

**Input** — \`8\`
**Output** — \`0 1 1 2 3 5 8 13\`

Naive recursion recomputes the same values repeatedly — iterative or memoised both work here.`,
    hints: ["Keep the last two values and append their sum.", "n = 1 returns just 0; n = 2 returns 0 1."],
    tests: [
      { input: "8", expected: "0 1 1 2 3 5 8 13", label: "8 terms" },
      { input: "1", expected: "0", label: "one term" },
      { input: "2", expected: "0 1", label: "two terms" },
    ],
  },
  {
    id: "min-stack",
    fn: "simulateStack",
    params: "ops:words",
    returns: "ints",
    title: "Simulate a Stack",
    level: 5,
    blurb: "Parse operations and keep the state.",
    topics: ["stack", "simulation"],
    task: "return the final stack",
    statement: `Apply comma-separated operations to an empty stack: \`push:x\` appends, \`pop\` removes the last element, \`peek\` changes nothing. Ignore \`pop\` on an empty stack. Return the final stack space-separated, top last.

**Input** — \`push:1,push:2,pop,push:3\`
**Output** — \`1 3\``,
    hints: ["Split each operation on the colon; only push carries a value.", "Check for emptiness before popping."],
    tests: [
      { input: "push:1,push:2,pop,push:3", expected: "1 3", label: "push, push, pop, push" },
      { input: "pop,push:5", expected: "5", label: "pop on empty" },
      { input: "push:1,push:2", expected: "1 2", label: "no removals" },
    ],
  },
  {
    id: "palindromic-substrings",
    fn: "palindromicSubstrings",
    params: "s:string",
    returns: "words",
    title: "All Palindromic Substrings",
    level: 5,
    blurb: "Every substring that reads the same both ways.",
    topics: ["strings", "nested loops"],
    task: "print every palindromic substring",
    statement: `Return every palindromic substring (length ≥ 1) space-separated, scanning \`i\` from 0 upwards and \`j\` from \`i\` upwards. Single characters count.

**Input** — \`oko\`
**Output** — \`o oko k o\`

The order is part of the test: \`i\` outer, \`j\` inner.`,
    hints: ["Two loops over start and end, then a palindrome check on the slice.", "Include length-1 substrings, and do not skip j === i."],
    tests: [
      { input: "oko", expected: "o oko k o", label: "oko" },
      { input: "aba", expected: "a aba b a", label: "aba" },
      { input: "aa", expected: "a aa a", label: "aa" },
    ],
  },
  {
    id: "reverse-words",
    fn: "reverseWords",
    params: "s:string",
    returns: "string",
    title: "Reverse Word Order",
    level: 4,
    blurb: "Reverse the words, not the letters.",
    topics: ["strings", "splitting"],
    task: "return the words in reverse order",
    statement: `Reverse the order of the words in the sentence and return them separated by single spaces. Collapse runs of spaces.

**Input** — \`the sky  is blue\`
**Output** — \`blue is sky the\``,
    hints: ["Split on whitespace runs, filter empties, then walk backwards.", "Join with single spaces at the end."],
    tests: [
      { input: "the sky  is blue", expected: "blue is sky the", label: "extra spaces" },
      { input: "one", expected: "one", label: "single word" },
      { input: "a b", expected: "b a", label: "two words" },
    ],
  },
  {
    id: "run-length-encode",
    fn: "runLengthEncode",
    params: "s:string",
    returns: "string",
    title: "Run-Length Encoding",
    level: 4,
    blurb: "Compress consecutive repeats into letter + count.",
    topics: ["strings", "loops"],
    task: "return the compressed string",
    statement: `Compress the input by replacing each run of identical characters with the character followed by the run length. Even runs of one get a \`1\`.

**Input** — \`aaabbc\`
**Output** — \`a3b2c1\``,
    hints: ["Walk the string keeping the current character and a counter.", "Flush the run whenever the character changes, and once more at the end."],
    tests: [
      { input: "aaabbc", expected: "a3b2c1", label: "aaabbc" },
      { input: "abc", expected: "a1b1c1", label: "no repeats" },
      { input: "zzzz", expected: "z4", label: "one long run" },
    ],
  },
  {
    id: "longest-common-prefix",
    fn: "longestCommonPrefix",
    params: "words:words",
    returns: "string",
    title: "Longest Common Prefix",
    level: 4,
    blurb: "Shrink a candidate prefix until it fits them all.",
    topics: ["strings", "arrays"],
    task: "return the common prefix",
    statement: `Given comma-separated words, return their longest common prefix. If they share none, return an empty string.

**Input** — \`flower,flow,flight\`
**Output** — \`fl\``,
    hints: ["Start with the first word as the candidate.", "While any other word does not start with the candidate, drop its last character."],
    tests: [
      { input: "flower,flow,flight", expected: "fl", label: "fl" },
      { input: "dog,cat", expected: "", label: "none" },
      { input: "solo", expected: "solo", label: "one word is its own prefix" },
    ],
  },
  {
    id: "majority-element",
    fn: "majorityElement",
    params: "nums:ints",
    returns: "int",
    title: "Majority Element",
    level: 4,
    blurb: "More than half the list — Boyer-Moore or a counter.",
    topics: ["arrays", "voting", "hashmap"],
    task: "return the majority value",
    statement: `Return the value that appears more than \`n / 2\` times. It is guaranteed to exist.

**Input** — \`2,2,1,1,1,2,2\`
**Output** — \`2\`

A counter map works; Boyer-Moore voting does it with constant memory.`,
    hints: [
      "Count occurrences in a map and return the one above n/2.",
      "Or keep a candidate and a balance: same value +1, different -1, swap when it hits 0.",
    ],
    tests: [
      { input: "2,2,1,1,1,2,2", expected: "2", label: "2 wins" },
      { input: "3,3,4", expected: "3", label: "bare majority" },
      { input: "1", expected: "1", label: "single value" },
    ],
  },
  {
    id: "pair-sum-sorted",
    fn: "pairSumSorted",
    params: "nums:ints,target:int",
    returns: "bool",
    title: "Pair Sum in a Sorted List",
    level: 5,
    blurb: "Two pointers from both ends.",
    topics: ["arrays", "two pointers"],
    task: "print true or false",
    statement: `Line 1: an ascending sorted list. Line 2: a target. Return \`true\` if two different positions add up to the target, else \`false\`.

**Input** — \`1,2,3,4,6\` / \`6\`
**Output** — \`true\` (2 + 4)`,
    hints: ["Point at the smallest and largest values.", "If the sum is too small move the left pointer, too large move the right one."],
    tests: [
      { input: "1,2,3,4,6\n6", expected: "true", label: "2 + 4" },
      { input: "1,2,3\n9", expected: "false", label: "no pair" },
      { input: "1,1\n2", expected: "true", label: "two different positions" },
    ],
  },
  {
    id: "matrix-transpose",
    fn: "transpose",
    params: "grid:matrix",
    returns: "matrix",
    title: "Transpose a Matrix",
    level: 5,
    blurb: "Rows become columns.",
    topics: ["matrices", "arrays"],
    task: "return the transposed matrix",
    statement: `Line 1: rows \`r\` and columns \`c\`, comma-separated. Then \`r\` lines, each a row of \`c\` integers.

Return the transposed matrix: \`c\` lines of \`r\` numbers, space-separated.

**Input**
\`\`\`
2,3
1,2,3
4,5,6
\`\`\`
**Output**
\`\`\`
1 4
2 5
3 6
\`\`\``,
    hints: ["Loop over columns first, then rows.", "out[col][row] = grid[row][col]."],
    tests: [
      { input: "2,3\n1,2,3\n4,5,6", expected: "1 4\n2 5\n3 6", label: "2×3 → 3×2" },
      { input: "1,2\n7,8", expected: "7\n8", label: "1×2 → 2×1" },
      { input: "2,2\n1,2\n3,4", expected: "1 3\n2 4", label: "square" },
    ],
  },
  {
    id: "pascal-row",
    fn: "pascalRow",
    params: "n:int",
    returns: "ints",
    title: "Pascal's Triangle Row",
    level: 5,
    blurb: "Each value is the sum of the two above it.",
    topics: ["arrays", "math"],
    task: "print row n, space-separated",
    statement: `Return row \`n\` (0-based) of Pascal's triangle, space-separated. Row 0 is \`1\`; row 3 is \`1 3 3 1\`.

**Input** — \`4\`
**Output** — \`1 4 6 4 1\``,
    hints: ["Build rows from 0 up to n, or compute binomial coefficients directly.", "Each row starts and ends with 1; the middle values are sums of neighbours from the previous row."],
    tests: [
      { input: "4", expected: "1 4 6 4 1", label: "row 4" },
      { input: "0", expected: "1", label: "row 0" },
      { input: "6", expected: "1 6 15 20 15 6 1", label: "row 6" },
    ],
  },
  {
    id: "caesar-cipher",
    fn: "caesar",
    params: "text:string,k:int",
    returns: "string",
    title: "Caesar Cipher",
    level: 5,
    blurb: "Shift letters, wrap around the alphabet.",
    topics: ["strings", "modulo"],
    task: "return the shifted text",
    statement: `Line 1: text. Line 2: shift \`k\`. Shift each letter forward by \`k\` within the alphabet, wrapping z → a and keeping case. Leave non-letters untouched.

**Input** — \`Hello, World!\` / \`3\`
**Output** — \`Khoor, Zruog!\`

Use \`(position + k) % 26\` — and remember \`k\` can exceed 26 or be negative.`,
    hints: ["Convert each letter to 0–25, shift, wrap with modulo, convert back.", "Only rotate a-z and A-Z; punctuation and spaces stay."],
    tests: [
      { input: "Hello, World!\n3", expected: "Khoor, Zruog!", label: "shift 3 mixed case" },
      { input: "xyz\n3", expected: "abc", label: "wraps the alphabet" },
      { input: "Attack at dawn\n29", expected: "Dwwdfn dw gdzq", label: "shift 29 = 3" },
    ],
  },
  {
    id: "roman-to-int",
    fn: "romanToInt",
    params: "s:string",
    returns: "int",
    title: "Roman Numerals to Integer",
    level: 5,
    blurb: "Subtract when a smaller symbol precedes a larger one.",
    topics: ["strings", "hashmap"],
    task: "return the integer value",
    statement: `Convert a Roman numeral to an integer. Numerals are valid and in the standard forms (1 ≤ value ≤ 3999).

**Input** — \`MCMXCIV\`
**Output** — \`1994\`

Rule: if a symbol is smaller than the one after it, subtract it; otherwise add it.`,
    hints: [
      "Map I, V, X, L, C, D, M to their values.",
      "Compare each symbol with its right-hand neighbour to decide add or subtract.",
    ],
    tests: [
      { input: "MCMXCIV", expected: "1994", label: "1994" },
      { input: "III", expected: "3", label: "III" },
      { input: "XL", expected: "40", label: "subtractive XL" },
      { input: "MMXXV", expected: "2025", label: "2025" },
    ],
  },
  {
    id: "longest-substring",
    fn: "longestUniqueSubstring",
    params: "s:string",
    returns: "int",
    title: "Longest Substring Without Repeats",
    level: 6,
    blurb: "Sliding window with a last-seen map.",
    topics: ["strings", "sliding window"],
    task: "return the length of the longest substring",
    statement: `Return the length of the longest substring that contains no repeated character.

**Input** — \`abcabcbb\`
**Output** — \`3\` (\"abc\`)

Keep a window with a left edge and a map of where each character was last seen; jump the left edge past the repeat.`,
    hints: [
      "When you see a character inside the current window, move left to just after its previous position.",
      "Track the maximum window length as you extend right.",
    ],
    tests: [
      { input: "abcabcbb", expected: "3", label: "abcabcbb" },
      { input: "bbbbb", expected: "1", label: "all one letter" },
      { input: "pwwkew", expected: "3", label: "pwwkew" },
    ],
  },
  {
    id: "max-subarray",
    fn: "maxSubarray",
    params: "nums:ints",
    returns: "int",
    title: "Maximum Subarray Sum",
    level: 6,
    blurb: "Kadane's algorithm — restart or extend?",
    topics: ["arrays", "dynamic programming"],
    task: "return the largest sum of a contiguous subarray",
    statement: `Return the largest sum of any non-empty contiguous subarray.

**Input** — \`-2,1,-3,4,-1,2,1,-5,4\`
**Output** — \`6\` (4 + -1 + 2 + 1)

Kadane: running = max(value, running + value), best = max(best, running).`,
    hints: [
      "At each element decide whether to extend the current run or start fresh from here.",
      "The answer can be a single negative number, so start best at the first value, not 0.",
    ],
    tests: [
      { input: "-2,1,-3,4,-1,2,1,-5,4", expected: "6", label: "classic" },
      { input: "-3,-1,-2", expected: "-1", label: "all negative" },
      { input: "5", expected: "5", label: "single value" },
    ],
  },
  {
    id: "climb-stairs",
    fn: "climbStairs",
    params: "n:int",
    returns: "int",
    title: "Climbing Stairs",
    level: 6,
    blurb: "Your first recurrence that is Fibonacci in disguise.",
    topics: ["dynamic programming", "recursion"],
    task: "return the number of ways",
    statement: `You climb \`n\` stairs taking 1 or 2 steps at a time. Return how many distinct ways there are.

**Input** — \`5\`
**Output** — \`8\`

ways(n) = ways(n-1) + ways(n-2), with ways(1) = 1 and ways(2) = 2.`,
    hints: [
      "The last step is either 1 or 2, so the count is the sum of the two smaller cases.",
      "Iterate upwards with two variables instead of recursing — otherwise it is exponential.",
    ],
    tests: [
      { input: "5", expected: "8", label: "n = 5" },
      { input: "1", expected: "1", label: "n = 1" },
      { input: "10", expected: "89", label: "n = 10" },
    ],
  },
  {
    id: "top-k-frequent",
    fn: "topKFrequent",
    params: "nums:ints,k:int",
    returns: "ints",
    title: "Top K Frequent Values",
    level: 6,
    blurb: "Count first, then sort by count.",
    topics: ["hashmap", "sorting"],
    task: "return the k most frequent values",
    statement: `Line 1: comma-separated values. Line 2: \`k\`. Return the \`k\` most frequent values, space-separated, most frequent first. Break ties by the smaller value first.

**Input** — \`1,1,1,2,2,3\` / \`2\`
**Output** — \`1 2\``,
    hints: ["Count occurrences, then sort the distinct values by (count desc, value asc).", "Take the first k of that order."],
    tests: [
      { input: "1,1,1,2,2,3\n2", expected: "1 2", label: "k = 2" },
      { input: "4,4,6,6,6,9\n1", expected: "6", label: "k = 1" },
      { input: "5,3,5\n2", expected: "5 3", label: "tie broken by value" },
    ],
  },
];
