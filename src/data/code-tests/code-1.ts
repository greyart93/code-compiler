import type { CodeProblem } from "./types";

/**
 * Levels 1–3 — the first few hours. Everything here is one loop, one list or
 * one condition, and every problem asks for one returned value so the same tests
 * run in any language.
 */
export const CODE_LEVEL_1_TO_3: CodeProblem[] = [
  {
    id: "hello-output",
    fn: "greet",
    params: "name:string",
    returns: "string",
    title: "Say Hello",
    level: 1,
    blurb: "Read one line and return it back inside a sentence.",
    topics: ["input", "strings", "output"],
    task: "print Hello, <name>!",
    statement: `Given a name, return exactly \`Hello, <name>!\`.

**Input** — one line: the name.
**Output** — \`Hello, Ana!\`

This is the warm-up: return the greeting and you are done.`,
    hints: [
      "Read the whole input, trim the whitespace, and keep the first line.",
      "Build one string: the word Hello, a comma, a space, the name, and an exclamation mark.",
    ],
    tests: [
      { input: "Ana", expected: "Hello, Ana!", label: "Ana" },
      { input: "CodeVit", expected: "Hello, CodeVit!", label: "CodeVit" },
    ],
  },
  {
    id: "echo-lines",
    fn: "numberLines",
    params: "lines:lines",
    returns: "lines",
    title: "Number the Lines",
    level: 1,
    blurb: "Loop over input lines and prefix each with its number.",
    topics: ["loops", "strings"],
    task: "print each line as `<n>: <line>`",
    statement: `Return every input line prefixed with its 1-based number and a colon.

**Input** — one or more lines.
**Output** — \`1: red\` then \`2: blue\` …

Numbering is the point: you need the loop index, not just the text.`,
    hints: [
      "Split the trimmed input on newlines to get a list.",
      "Return `index + 1`, a colon, a space, then the line.",
    ],
    tests: [
      { input: "red\nblue", expected: "1: red\n2: blue", label: "two lines" },
      { input: "solo", expected: "1: solo", label: "one line" },
      { input: "a\nb\nc", expected: "1: a\n2: b\n3: c", label: "three lines" },
    ],
  },
  {
    id: "sum-array",
    fn: "sumNumbers",
    params: "nums:ints",
    returns: "int",
    title: "Sum a List",
    level: 1,
    blurb: "Add up every number in the list.",
    topics: ["arrays", "loops", "parsing"],
    task: "return the sum of the numbers",
    statement: `Given a list of integers, return their sum.

**Input** — \`1,2,3\`
**Output** — \`6\`

Every later problem reuses this move: split, convert, reduce.`,
    hints: [
      "Split the line on commas, then convert each piece to a number.",
      "Add them in a loop, or with a reduce/fold helper if your language has one.",
    ],
    tests: [
      { input: "1,2,3", expected: "6", label: "1,2,3" },
      { input: "10,-5", expected: "5", label: "one negative" },
      { input: "42", expected: "42", label: "single value" },
      { input: "0,0,0,0", expected: "0", label: "all zeros" },
    ],
  },
  {
    id: "vowel-count",
    fn: "countVowels",
    params: "text:string",
    returns: "int",
    title: "Vowel Counter",
    level: 1,
    blurb: "Walk a string and count the vowels, case-insensitively.",
    topics: ["strings", "loops"],
    task: "return the number of vowels",
    statement: `Given a line of text, return the number of vowels (a, e, i, o, u — upper or lower case).

**Input** — \`Hey JS You ARE AmaZing!\`
**Output** — \`8\`

Consonants, spaces and punctuation are ignored.`,
    hints: [
      "Lowercase the whole line first so you only compare against five letters.",
      "Check membership of each character in the set a, e, i, o, u.",
    ],
    tests: [
      { input: "Hey JS You ARE AmaZing!", expected: "8", label: "mixed case sentence" },
      { input: "bcdfg", expected: "0", label: "no vowels" },
      { input: "aEiOu", expected: "5", label: "all vowels" },
    ],
  },
  {
    id: "count-evens",
    fn: "countEvens",
    params: "nums:ints",
    returns: "int",
    title: "Count the Even Numbers",
    level: 2,
    blurb: "One pass, one counter, one modulo.",
    topics: ["arrays", "loops", "modulo"],
    task: "print how many numbers are even",
    statement: `Given a list of integers, return how many of them are even.

**Input** — \`2,3,4,5\`
**Output** — \`2\`

\`0\` counts as even, negatives count by their absolute value.`,
    hints: ["A number is even when dividing by 2 leaves no remainder.", "Keep a counter and increment it inside the loop."],
    tests: [
      { input: "2,3,4,5", expected: "2", label: "2,3,4,5" },
      { input: "1,3,5", expected: "0", label: "all odd" },
      { input: "0,-2,7", expected: "2", label: "zero and a negative" },
    ],
  },
  {
    id: "largest-smallest",
    fn: "smallestAndLargest",
    params: "nums:ints",
    returns: "ints",
    title: "Largest and Smallest",
    level: 2,
    blurb: "Scan once with two trackers — no sorting required.",
    topics: ["arrays", "loops"],
    task: "return the smallest and largest, space-separated",
    statement: `Given comma-separated integers, return the smallest and the largest, space-separated.

**Input** — \`1,3,4,5,0,3,8,2,5,4\`
**Output** — \`0 8\`

**Constraints** — \`1 ≤ n ≤ 10^5\`, \`-10^9 ≤ value ≤ 10^9\`. One pass is enough.`,
    hints: [
      "Start smallest at positive infinity and largest at negative infinity, or with the first element.",
      "Update both while looping over the rest of the list.",
    ],
    tests: [
      { input: "1,3,4,5,0,3,8,2,5,4", expected: "0 8", label: "ten values" },
      { input: "7", expected: "7 7", label: "single value" },
      { input: "-5,-2,-9", expected: "-9 -2", label: "all negative" },
    ],
  },
  {
    id: "second-largest",
    fn: "secondLargest",
    params: "nums:ints",
    returns: "int",
    title: "Second Largest",
    level: 2,
    blurb: "Two trackers, but the comparison order matters.",
    topics: ["arrays", "one pass"],
    task: "return the second largest distinct value, or -1",
    statement: `Return the second largest **distinct** value, or \`-1\` when there is no such value.

**Input** — \`1,3,4,5,0,3,8,2,5,4\`
**Output** — \`5\`

Duplicates of the maximum do not count as the second largest.`,
    hints: [
      "Track the best and the runner-up separately.",
      "When a value beats the best, move the old best down to the runner-up; when it only beats the runner-up, replace that.",
    ],
    tests: [
      { input: "1,3,4,5,0,3,8,2,5,4", expected: "5", label: "ten values" },
      { input: "2,2,2", expected: "-1", label: "all equal" },
      { input: "10,20", expected: "10", label: "two values" },
    ],
  },
  {
    id: "reverse-no-builtin",
    fn: "reverseArray",
    params: "nums:ints",
    returns: "ints",
    title: "Reverse an Array",
    level: 2,
    blurb: "Two pointers walking inward, no reverse() allowed.",
    topics: ["arrays", "two pointers"],
    task: "return the array reversed, space-separated",
    statement: `Return the comma-separated array reversed, space-separated. Do **not** use \`reverse()\` / \`reversed()\` — swap ends with two pointers instead.

**Input** — \`1,2,3,4,5\`
**Output** — \`5 4 3 2 1\``,
    hints: [
      "Keep one index at the start and one at the end.",
      "Swap the two values, move the pointers inward, stop when they cross.",
    ],
    tests: [
      { input: "1,2,3,4,5", expected: "5 4 3 2 1", label: "odd length" },
      { input: "1,2,3,4", expected: "4 3 2 1", label: "even length" },
      { input: "42", expected: "42", label: "single value" },
    ],
  },
  {
    id: "reverse-text",
    fn: "reverseText",
    params: "text:string",
    returns: "string",
    title: "Reverse a String",
    level: 2,
    blurb: "Characters, not numbers — same idea, different type.",
    topics: ["strings", "loops"],
    task: "return the text backwards",
    statement: `Return the input line with its characters in reverse order.

**Input** — \`hello\`
**Output** — \`olleh\`

Spaces stay where the reversal puts them.`,
    hints: ["Walk the string from the last index down to 0.", "Build a result string, or collect characters in a list and join."],
    tests: [
      { input: "hello", expected: "olleh", label: "hello" },
      { input: "abc def", expected: "fed cba", label: "with a space" },
      { input: "x", expected: "x", label: "single character" },
    ],
  },
  {
    id: "palindrome-number",
    fn: "isPalindromeNumber",
    params: "n:int",
    returns: "bool",
    title: "Palindrome Number",
    level: 2,
    blurb: "A number that reads the same backwards.",
    topics: ["math", "strings"],
    task: "print true or false",
    statement: `Return \`true\` if the integer reads the same forwards and backwards, else \`false\`. Negative numbers are never palindromes (the minus sign would end up at the back).

**Input** — \`121\`
**Output** — \`true\``,
    hints: ["Turn the number into text and compare it with its reversal.", "For the numeric version: reverse the digits with % 10 and / 10 and compare with the original."],
    tests: [
      { input: "121", expected: "true", label: "121" },
      { input: "-121", expected: "false", label: "negative" },
      { input: "10", expected: "false", label: "trailing zero" },
      { input: "1221", expected: "true", label: "1221" },
    ],
  },
  {
    id: "remove-duplicates",
    fn: "dedupe",
    params: "nums:ints",
    returns: "ints",
    title: "Remove Duplicates",
    level: 2,
    blurb: "Keep first occurrences, drop the repeats.",
    topics: ["arrays", "set"],
    task: "return the list without duplicates",
    statement: `Remove duplicates from the comma-separated list, keeping first occurrences in order, and return the result space-separated.

**Input** — \`1,2,2,3,4,4,5\`
**Output** — \`1 2 3 4 5\``,
    hints: [
      "A set remembers what you have already added.",
      "Check membership before adding, then add the value.",
    ],
    tests: [
      { input: "1,2,2,3,4,4,5", expected: "1 2 3 4 5", label: "two duplicates" },
      { input: "9,9,9,9", expected: "9", label: "all equal" },
      { input: "1,2,3", expected: "1 2 3", label: "already unique" },
    ],
  },
  {
    id: "two-arrays-equal",
    fn: "sameOrder",
    params: "a:ints,b:ints",
    returns: "bool",
    title: "Are Two Lists Equal?",
    level: 2,
    blurb: "Same length, same order, same values.",
    topics: ["arrays", "comparison"],
    task: "print true or false",
    statement: `Two lists. Return \`true\` if they hold the same values in the same order, else \`false\`.

**Input** — \`1,2,3\` and \`1,2,3\`
**Output** — \`true\`

Compare as text after splitting — do not join and compare strings, or \`1,23\` would equal \`1,2,3\`.`,
    hints: ["Compare lengths first.", "Then compare element by element and stop at the first mismatch."],
    tests: [
      { input: "1,2,3\n1,2,3", expected: "true", label: "identical" },
      { input: "1,2,3\n1,2,4", expected: "false", label: "last element differs" },
      { input: "1,2\n1,2,3", expected: "false", label: "different lengths" },
    ],
  },
  {
    id: "title-case",
    fn: "titleCase",
    params: "text:string",
    returns: "string",
    title: "Title Case",
    level: 2,
    blurb: "Uppercase each word's first letter, lowercase the rest.",
    topics: ["strings", "loops"],
    task: "return the sentence in Title Case",
    statement: `Return the input sentence in Title Case: the first letter of each word uppercase, every other letter lowercase.

**Input** — \`THE QUICK fox\`
**Output** — \`The Quick Fox\``,
    hints: [
      "Split on spaces, transform each word, then join back with a single space.",
      "For a word: uppercase the first character, lowercase the remainder.",
    ],
    tests: [
      { input: "hello world", expected: "Hello World", label: "lowercase input" },
      { input: "THE QUICK FOX", expected: "The Quick Fox", label: "all caps" },
      { input: "a", expected: "A", label: "single letter" },
    ],
  },
  {
    id: "word-count",
    fn: "countWords",
    params: "text:string",
    returns: "int",
    title: "Word Count",
    level: 2,
    blurb: "Split on whitespace — but be careful with extra spaces.",
    topics: ["strings", "splitting"],
    task: "return the number of words",
    statement: `Return how many words the input line contains. Words are separated by one or more spaces.

**Input** — \`  spaced   out   words \`
**Output** — \`3\``,
    hints: ["Trimming first removes the leading and trailing spaces.", "Splitting on runs of whitespace gives exactly one entry per word."],
    tests: [
      { input: "hello world", expected: "2", label: "two words" },
      { input: "  spaced   out   words ", expected: "3", label: "extra spaces" },
      { input: "solo", expected: "1", label: "one word" },
    ],
  },
  {
    id: "sum-digits",
    fn: "digitSum",
    params: "n:int",
    returns: "int",
    title: "Sum of Digits",
    level: 3,
    blurb: "Peel digits off a number with % and /.",
    topics: ["math", "loops"],
    task: "return the sum of the digits",
    statement: `Given an integer, return the sum of its digits. Ignore the minus sign.

**Input** — \`-4821\`
**Output** — \`15\`

Do it numerically (\`% 10\`, \`/ 10\`) or as text — your call.`,
    hints: ["Take the last digit with n % 10, then drop it with integer division by 10.", "Work on the absolute value so the minus sign never matters."],
    tests: [
      { input: "1234", expected: "10", label: "1234" },
      { input: "-4821", expected: "15", label: "negative" },
      { input: "0", expected: "0", label: "zero" },
    ],
  },
  {
    id: "multiply-table",
    fn: "multiplicationTable",
    params: "n:int",
    returns: "lines",
    title: "Multiplication Table",
    level: 3,
    blurb: "Format a small table with a loop.",
    topics: ["loops", "formatting"],
    task: "return the 1..5 times table for n",
    statement: `Given \`n\`, return the first five lines of its times table in this exact shape:

\`n x i = product\`

**Input** — \`3\`
**Output**
\`\`\`
3 x 1 = 3
3 x 2 = 6
3 x 3 = 9
3 x 4 = 12
3 x 5 = 15
\`\`\`

Wording and spacing are part of the test.`,
    hints: ["Loop i from 1 to 5.", "Return the number, \" x \", i, \" = \", and the product — watch the spaces."],
    tests: [
      {
        input: "3",
        expected: "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15",
        label: "table for 3",
      },
      { input: "1", expected: "1 x 1 = 1\n1 x 2 = 2\n1 x 3 = 3\n1 x 4 = 4\n1 x 5 = 5", label: "table for 1" },
    ],
  },
  {
    id: "grade-letter",
    fn: "gradeLetter",
    params: "score:int",
    returns: "string",
    title: "Grade Letters",
    level: 3,
    blurb: "Chained conditions — order them carefully.",
    topics: ["conditionals"],
    task: "print A, B, C, D or F",
    statement: `Convert a score to a letter grade:

| score | grade |
| --- | --- |
| 90–100 | A |
| 80–89 | B |
| 70–79 | C |
| 60–69 | D |
| below 60 | F |

**Input** — \`85\`
**Output** — \`B\``,
    hints: ["Test from the highest band downwards so the first match wins.", "Remember 80 itself belongs to B, not C."],
    tests: [
      { input: "95", expected: "A", label: "95" },
      { input: "80", expected: "B", label: "boundary 80" },
      { input: "72", expected: "C", label: "72" },
      { input: "65", expected: "D", label: "65" },
      { input: "59", expected: "F", label: "59" },
    ],
  },
  {
    id: "fizzbuzz",
    fn: "fizzBuzz",
    params: "n:int",
    returns: "lines",
    title: "FizzBuzz",
    level: 3,
    blurb: "The interview warm-up that catches ordering bugs.",
    topics: ["loops", "modulo", "conditionals"],
    task: "print FizzBuzz for 1..n",
    statement: `Return the numbers 1 to \`n\`, one per line, replacing:

- multiples of 3 with \`Fizz\`
- multiples of 5 with \`Buzz\`
- multiples of both with \`FizzBuzz\`

**Input** — \`5\`
**Output** — \`1\`, \`2\`, \`Fizz\`, \`4\`, \`Buzz\`

Check the both-case **first**; otherwise 15 becomes Fizz only.`,
    hints: ["The order of your conditions is the whole problem.", "Use the remainder operator: n % 3 === 0 means divisible by 3."],
    tests: [
      { input: "5", expected: "1\n2\nFizz\n4\nBuzz", label: "n = 5" },
      {
        input: "15",
        expected: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz",
        label: "n = 15 includes FizzBuzz",
      },
    ],
  },
  {
    id: "gcd-lcm",
    fn: "gcdAndLcm",
    params: "a:int,b:int",
    returns: "ints",
    title: "GCD and LCM",
    level: 3,
    blurb: "Euclid's algorithm, then one multiplication.",
    topics: ["math", "loops"],
    task: "return the gcd and lcm, space-separated",
    statement: `Two integers on one line, comma-separated. Return their greatest common divisor and least common multiple, space-separated.

**Input** — \`12,18\`
**Output** — \`6 36\`

Use Euclid: \`gcd(a, b) = gcd(b, a % b)\` until the remainder is 0. The LCM is \`a / gcd * b\` (divide first to avoid overflow).`,
    hints: ["Write the gcd loop first and test it on its own.", "lcm = a / gcd(a, b) * b."],
    tests: [
      { input: "12,18", expected: "6 36", label: "12,18" },
      { input: "7,13", expected: "1 91", label: "coprime" },
      { input: "10,10", expected: "10 10", label: "equal" },
    ],
  },
  {
    id: "binary-bits",
    fn: "countSetBits",
    params: "n:int",
    returns: "int",
    title: "Count Set Bits",
    level: 3,
    blurb: "How many 1s are in this number's binary form?",
    topics: ["bit manipulation", "loops"],
    task: "return the number of 1 bits",
    statement: `Return how many \`1\` bits the binary form of \`n\` contains.

**Input** — \`7\` (binary \`111\`)
**Output** — \`3\`

There is a neat trick: \`n & (n - 1)\` clears the lowest set bit, so the loop runs once per 1.`,
    hints: ["Count n % 2 while halving, or use the n & (n - 1) trick.", "0 has no set bits."],
    tests: [
      { input: "7", expected: "3", label: "7 = 111" },
      { input: "8", expected: "1", label: "8 = 1000" },
      { input: "0", expected: "0", label: "zero" },
      { input: "255", expected: "8", label: "255 = 11111111" },
    ],
  },
  {
    id: "is-prime",
    fn: "isPrime",
    params: "n:int",
    returns: "bool",
    title: "Prime Check",
    level: 3,
    blurb: "Trial division up to the square root.",
    topics: ["math", "primes"],
    task: "print true or false",
    statement: `Return \`true\` if \`n\` is prime, else \`false\`. 1 and 0 are not prime.

**Input** — \`11\`
**Output** — \`true\`

**Constraints** — \`n\` up to \`10^9\`; loop to \`√n\`, not to \`n/2\`.`,
    hints: ["Check divisibility by 2 separately, then try odd divisors up to the square root.", "Stop early the moment a divisor divides evenly."],
    tests: [
      { input: "11", expected: "true", label: "11" },
      { input: "15", expected: "false", label: "15" },
      { input: "2", expected: "true", label: "2" },
      { input: "1", expected: "false", label: "1" },
    ],
  },
  {
    id: "factorial",
    fn: "factorial",
    params: "n:int",
    returns: "int",
    title: "Factorial",
    level: 3,
    blurb: "n! — a loop, or a first taste of recursion.",
    topics: ["math", "recursion"],
    task: "print n!",
    statement: `Return \`n!\` for \`0 ≤ n ≤ 20\`. By definition \`0! = 1\`.

**Input** — \`5\`
**Output** — \`120\``,
    hints: ["Start the accumulator at 1 and multiply 1..n.", "The recursive form is n * factorial(n - 1) with 0! = 1 as the base case."],
    tests: [
      { input: "5", expected: "120", label: "5!" },
      { input: "0", expected: "1", label: "0!" },
      { input: "10", expected: "3628800", label: "10!" },
    ],
  },
  {
    id: "find-duplicates",
    fn: "findDuplicates",
    params: "nums:ints",
    returns: "ints",
    title: "Find the Repeats",
    level: 3,
    blurb: "Track what you have seen; collect what comes twice.",
    topics: ["arrays", "set"],
    task: "print values that appear more than once",
    statement: `Given a list of integers, return each value that appears more than once, once each, in the order of its second appearance... simpler: in first-appearance order.

**Input** — \`1,2,3,1,2,4,5\`
**Output** — \`1 2\`

If nothing repeats, return an empty list.`,
    hints: ["Keep a set of seen values and a set of reported values.", "Return a value the first time you see it already in the seen set."],
    tests: [
      { input: "1,2,3,1,2,4,5", expected: "1 2", label: "two repeats" },
      { input: "1,2,3", expected: "", label: "no repeats" },
      { input: "5,5", expected: "5", label: "one pair" },
    ],
  },
  {
    id: "intersection",
    fn: "intersection",
    params: "a:ints,b:ints",
    returns: "ints",
    title: "Intersection of Two Lists",
    level: 3,
    blurb: "Set membership, first list order.",
    topics: ["arrays", "set"],
    task: "return the common values, space-separated",
    statement: `Two comma-separated lists (line 1, line 2). Return the values that appear in both, each once, in the order of the first list.

**Input** — \`1,2,3,4,5\` and \`4,5,6,7,8\`
**Output** — \`4 5\``,
    hints: ["Put the second list in a set for O(1) lookups.", "Walk the first list, add values that are in the set, and remember what you already added."],
    tests: [
      { input: "1,2,3,4,5\n4,5,6,7,8", expected: "4 5", label: "overlap" },
      { input: "1,2\n3,4", expected: "", label: "no overlap" },
      { input: "1,2,2,3\n2,2", expected: "2", label: "duplicates collapse" },
    ],
  },
  {
    id: "merge-sorted",
    fn: "mergeSorted",
    params: "a:ints,b:ints",
    returns: "ints",
    title: "Merge Two Sorted Lists",
    level: 3,
    blurb: "The merge step from merge sort, without sorting.",
    topics: ["arrays", "two pointers"],
    task: "return the merged list, space-separated",
    statement: `Two comma-separated **already sorted** lists. Merge them into one sorted list in \`O(n + m)\` and return it space-separated.

**Input** — \`1,3,5,7\` and \`2,4,6,8\`
**Output** — \`1 2 3 4 5 6 7 8\`

Do not concatenate and sort — that is the exercise.`,
    hints: ["Walk both lists with their own index and always take the smaller current head.", "When one list runs out, append the rest of the other."],
    tests: [
      { input: "1,3,5,7\n2,4,6,8", expected: "1 2 3 4 5 6 7 8", label: "interleaved" },
      { input: "1,1,2\n1,5", expected: "1 1 1 2 5", label: "duplicates kept" },
      { input: "\n2,3", expected: "2 3", label: "empty first list" },
    ],
  },
  {
    id: "missing-number",
    fn: "missingNumber",
    params: "n:int,nums:ints",
    returns: "int",
    title: "Find the Missing Number",
    level: 3,
    blurb: "The sum formula beats sorting.",
    topics: ["arrays", "math"],
    task: "return the missing number",
    statement: `Line 1 is \`n\`; line 2 lists \`n - 1\` distinct numbers taken from \`1..n\`. Return the one that is missing.

**Input**
\`\`\`
5
1,2,4,5
\`\`\`
**Output** — \`3\`

Sum of 1..n is \`n * (n + 1) / 2\`; subtract what you were given.`,
    hints: ["Compute the expected total, then the actual total.", "The difference is the missing value — O(n) time, constant memory."],
    tests: [
      { input: "5\n1,2,4,5", expected: "3", label: "missing in the middle" },
      { input: "3\n2,3", expected: "1", label: "missing first" },
      { input: "2\n2", expected: "1", label: "n = 2" },
    ],
  },
  {
    id: "move-zeros",
    fn: "moveZeros",
    params: "nums:ints",
    returns: "ints",
    title: "Move Zeros to the End",
    level: 3,
    blurb: "Stable partition in one pass.",
    topics: ["arrays", "two pointers"],
    task: "return the list with zeros moved to the end",
    statement: `Move every \`0\` to the end of the list while keeping the order of the non-zero values, then return the list space-separated.

**Input** — \`0,1,0,3,12\`
**Output** — \`1 3 12 0 0\`

Write index for non-zeros, then pad with zeros — or swap in place.`,
    hints: ["First pass: copy non-zero values forward. Second pass: fill the rest with zeros.", "Or keep a write index and swap each non-zero into it."],
    tests: [
      { input: "0,1,0,3,12", expected: "1 3 12 0 0", label: "mixed" },
      { input: "1,2,3", expected: "1 2 3", label: "no zeros" },
      { input: "0,0", expected: "0 0", label: "only zeros" },
    ],
  },
  {
    id: "array-chunk",
    fn: "chunk",
    params: "nums:ints,size:int",
    returns: "lines",
    title: "Chunk a List",
    level: 3,
    blurb: "Slice a list into fixed-size pieces.",
    topics: ["arrays", "loops"],
    task: "return the list in chunks of size k",
    statement: `Line 1: comma-separated integers. Line 2: chunk size \`k\`. Return the list split into chunks of at most \`k\` items, one chunk per line, comma-separated.

**Input**
\`\`\`
1,2,3,4,5
2
\`\`\`
**Output**
\`\`\`
1,2
3,4
5
\`\`\`

The last chunk may be shorter.`,
    hints: ["Step through the list in jumps of k.", "Slice from index i up to i + k, letting the slice clamp at the end."],
    tests: [
      { input: "1,2,3,4,5\n2", expected: "1,2\n3,4\n5", label: "chunks of 2" },
      { input: "1,2,3\n3", expected: "1,2,3", label: "exact fit" },
      { input: "1,2\n5", expected: "1,2", label: "k larger than list" },
    ],
  },
  {
    id: "anagram-check",
    fn: "isAnagram",
    params: "a:string,b:string",
    returns: "bool",
    title: "Are They Anagrams?",
    level: 3,
    blurb: "Same letters, different order.",
    topics: ["strings", "sorting", "counting"],
    task: "print true or false",
    statement: `Two words, compared case-insensitively. Return \`true\` if one is an anagram of the other, else \`false\`.

**Input** — \`listen\` / \`silent\`
**Output** — \`true\`

Sorting both words is the short answer; counting letters is the O(n) one.`,
    hints: ["Lowercase both words first.", "Equal length plus equal sorted characters (or equal letter counts) is the test."],
    tests: [
      { input: "listen\nsilent", expected: "true", label: "listen / silent" },
      { input: "abc\nabd", expected: "false", label: "one letter differs" },
      { input: "Dormitory\ndirtyroom", expected: "true", label: "mixed case" },
    ],
  },
];
