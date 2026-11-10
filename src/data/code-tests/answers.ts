/**
 * Worked answers for the practice library, as plain functions.
 *
 * JavaScript is the reference language: every answer here runs against the same
 * generated driver a learner's code runs against, which is how the problem set
 * is verified. Other languages fall back to this one when they have no
 * translation of their own.
 */
import { CPP_ANSWERS } from "./answers-cpp";
import { CSHARP_ANSWERS } from "./answers-csharp";
import { GO_ANSWERS } from "./answers-go";
import { JAVA_ANSWERS } from "./answers-java";
import { KOTLIN_ANSWERS } from "./answers-kotlin";
import { RUST_ANSWERS } from "./answers-rust";
import { PY_ANSWERS } from "./answers-py";
import type { PracticeLanguage } from "./types";

export const JS_ANSWERS: Record<string, string> = {
  "hello-output": `function greet(name) {
  return "Hello, " + name + "!";
}`,
  "echo-lines": `function numberLines(lines) {
  return lines.map((line, i) => (i + 1) + ": " + line);
}`,
  "sum-array": `function sumNumbers(nums) {
  return nums.reduce((total, n) => total + n, 0);
}`,
  "vowel-count": `function countVowels(text) {
  let count = 0;
  for (const ch of text.toLowerCase()) {
    if ("aeiou".includes(ch)) count++;
  }
  return count;
}`,
  "count-evens": `function countEvens(nums) {
  let evens = 0;
  for (const n of nums) if (n % 2 === 0) evens++;
  return evens;
}`,
  "largest-smallest": `function smallestAndLargest(nums) {
  let small = nums[0];
  let large = nums[0];
  for (const n of nums) {
    if (n < small) small = n;
    if (n > large) large = n;
  }
  return [small, large];
}`,
  "second-largest": `function secondLargest(nums) {
  let best = -Infinity;
  let second = -Infinity;
  for (const n of nums) {
    if (n > best) {
      second = best;
      best = n;
    } else if (n < best && n > second) {
      second = n;
    }
  }
  return second === -Infinity ? -1 : second;
}`,
  "reverse-no-builtin": `function reverseArray(nums) {
  const out = nums.slice();
  let i = 0;
  let j = out.length - 1;
  while (i < j) {
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
    i++;
    j--;
  }
  return out;
}`,
  "reverse-text": `function reverseText(text) {
  let out = "";
  for (let i = text.length - 1; i >= 0; i--) out += text[i];
  return out;
}`,
  "palindrome-number": `function isPalindromeNumber(n) {
  if (n < 0) return false;
  const text = String(n);
  return text === text.split("").reverse().join("");
}`,
  "remove-duplicates": `function dedupe(nums) {
  const seen = new Set();
  const out = [];
  for (const n of nums) {
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}`,
  "two-arrays-equal": `function sameOrder(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}`,
  "title-case": `function titleCase(text) {
  return text
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}`,
  "word-count": `function countWords(text) {
  const words = text.trim().split(/\\s+/).filter(Boolean);
  return words.length;
}`,
  "sum-digits": `function digitSum(n) {
  let value = Math.abs(n);
  let total = 0;
  while (value > 0) {
    total += value % 10;
    value = Math.floor(value / 10);
  }
  return total;
}`,
  "multiply-table": `function multiplicationTable(n) {
  const rows = [];
  for (let i = 1; i <= 5; i++) rows.push(n + " x " + i + " = " + n * i);
  return rows;
}`,
  "grade-letter": `function gradeLetter(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}`,
  fizzbuzz: `function fizzBuzz(n) {
  const rows = [];
  for (let i = 1; i <= n; i++) {
    if (i % 15 === 0) rows.push("FizzBuzz");
    else if (i % 3 === 0) rows.push("Fizz");
    else if (i % 5 === 0) rows.push("Buzz");
    else rows.push(String(i));
  }
  return rows;
}`,
  "gcd-lcm": `function gcdAndLcm(a, b) {
  let x = a;
  let y = b;
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return [x, (a / x) * b];
}`,
  "binary-bits": `function countSetBits(n) {
  let count = 0;
  while (n > 0) {
    n = n & (n - 1);
    count++;
  }
  return count;
}`,
  "is-prime": `function isPrime(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) {
    if (n % d === 0) return false;
  }
  return true;
}`,
  factorial: `function factorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}`,
  "find-duplicates": `function findDuplicates(nums) {
  const seen = new Set();
  const reported = new Set();
  const out = [];
  for (const n of nums) {
    if (seen.has(n) && !reported.has(n)) {
      reported.add(n);
      out.push(n);
    }
    seen.add(n);
  }
  return out;
}`,
  intersection: `function intersection(a, b) {
  const inB = new Set(b);
  const out = [];
  const added = new Set();
  for (const n of a) {
    if (inB.has(n) && !added.has(n)) {
      added.add(n);
      out.push(n);
    }
  }
  return out;
}`,
  "merge-sorted": `function mergeSorted(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) out.push(a[i++]);
    else out.push(b[j++]);
  }
  while (i < a.length) out.push(a[i++]);
  while (j < b.length) out.push(b[j++]);
  return out;
}`,
  "missing-number": `function missingNumber(n, nums) {
  const expected = (n * (n + 1)) / 2;
  const actual = nums.reduce((total, value) => total + value, 0);
  return expected - actual;
}`,
  "move-zeros": `function moveZeros(nums) {
  const out = nums.filter((n) => n !== 0);
  while (out.length < nums.length) out.push(0);
  return out;
}`,
  "array-chunk": `function chunk(nums, size) {
  const rows = [];
  for (let i = 0; i < nums.length; i += size) {
    rows.push(nums.slice(i, i + size).join(","));
  }
  return rows;
}`,
  "anagram-check": `function isAnagram(a, b) {
  const norm = (word) => word.toLowerCase().split("").sort().join("");
  return norm(a) === norm(b);
}`,

  "two-sum": `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) {
      const j = seen.get(need);
      return [Math.min(i, j), Math.max(i, j)];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
  "best-time-stock": `function maxProfit(prices) {
  let lowest = Infinity;
  let best = 0;
  for (const price of prices) {
    if (price < lowest) lowest = price;
    if (price - lowest > best) best = price - lowest;
  }
  return best;
}`,
  "valid-parens": `function isValidParens(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const ch of s) {
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(ch);
    } else if (!stack.length || stack.pop() !== pairs[ch]) {
      return false;
    }
  }
  return stack.length === 0;
}`,
  "group-anagrams": `function countAnagramGroups(words) {
  const keys = new Set();
  for (const word of words) keys.add(word.split("").sort().join(""));
  return keys.size;
}`,
  "freq-count": `function frequencyReport(nums) {
  const counts = new Map();
  const order = [];
  for (const n of nums) {
    if (!counts.has(n)) order.push(n);
    counts.set(n, (counts.get(n) || 0) + 1);
  }
  const parts = order
    .filter((n) => counts.get(n) > 1)
    .map((n) => n + ":" + counts.get(n));
  return parts.length ? parts.join(",") : "none";
}`,
  "key-value-zip": `function zipKeys(keys, values) {
  const map = new Map();
  for (let i = 0; i < keys.length; i++) map.set(keys[i], values[i]);
  return map.size;
}`,
  "rotate-k": `function rotateRight(nums, k) {
  const n = nums.length;
  if (n === 0) return [];
  const shift = ((k % n) + n) % n;
  return nums.slice(n - shift).concat(nums.slice(0, n - shift));
}`,
  "reverse-linked-list": `function reverseInteger(n) {
  const sign = n < 0 ? -1 : 1;
  let value = Math.abs(n);
  let reversed = 0;
  while (value > 0) {
    reversed = reversed * 10 + (value % 10);
    value = Math.floor(value / 10);
  }
  const result = sign * reversed;
  if (result < -2147483648 || result > 2147483647) return 0;
  return result;
}`,
  "binary-search": `function binarySearch(nums, target) {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
  "fib-recursion": `function fibonacci(n) {
  const out = [];
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i++) {
    out.push(a);
    const next = a + b;
    a = b;
    b = next;
  }
  return out;
}`,
  "min-stack": `function simulateStack(ops) {
  const stack = [];
  for (const op of ops) {
    if (op.startsWith("push:")) stack.push(Number(op.slice(5)));
    else if (op === "pop" && stack.length) stack.pop();
  }
  return stack;
}`,
  "palindromic-substrings": `function palindromicSubstrings(s) {
  const isPalindrome = (slice) => {
    for (let i = 0, j = slice.length - 1; i < j; i++, j--) {
      if (slice[i] !== slice[j]) return false;
    }
    return true;
  };
  const out = [];
  for (let i = 0; i < s.length; i++) {
    for (let j = i; j < s.length; j++) {
      const slice = s.slice(i, j + 1);
      if (isPalindrome(slice)) out.push(slice);
    }
  }
  return out;
}`,
  "reverse-words": `function reverseWords(s) {
  return s.trim().split(/\\s+/).filter(Boolean).reverse().join(" ");
}`,
  "run-length-encode": `function runLengthEncode(s) {
  let out = "";
  let i = 0;
  while (i < s.length) {
    let run = 1;
    while (i + run < s.length && s[i + run] === s[i]) run++;
    out += s[i] + run;
    i += run;
  }
  return out;
}`,
  "longest-common-prefix": `function longestCommonPrefix(words) {
  if (!words.length) return "";
  let prefix = words[0];
  for (const word of words.slice(1)) {
    while (!word.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}`,
  "majority-element": `function majorityElement(nums) {
  const count = new Map();
  for (const n of nums) {
    const next = (count.get(n) || 0) + 1;
    if (next > nums.length / 2) return n;
    count.set(n, next);
  }
  return nums[0];
}`,
  "pair-sum-sorted": `function pairSumSorted(nums, target) {
  let i = 0;
  let j = nums.length - 1;
  while (i < j) {
    const sum = nums[i] + nums[j];
    if (sum === target) return true;
    if (sum < target) i++;
    else j--;
  }
  return false;
}`,
  "matrix-transpose": `function transpose(grid) {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  const out = [];
  for (let c = 0; c < cols; c++) {
    const row = [];
    for (let r = 0; r < rows; r++) row.push(grid[r][c]);
    out.push(row);
  }
  return out;
}`,
  "pascal-row": `function pascalRow(n) {
  let row = [1];
  for (let i = 1; i <= n; i++) {
    const next = [1];
    for (let j = 1; j < row.length; j++) next.push(row[j - 1] + row[j]);
    next.push(1);
    row = next;
  }
  return row;
}`,
  "caesar-cipher": `function caesar(text, k) {
  const shift = ((k % 26) + 26) % 26;
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      out += String.fromCharCode(((code - 65 + shift) % 26) + 65);
    } else if (code >= 97 && code <= 122) {
      out += String.fromCharCode(((code - 97 + shift) % 26) + 97);
    } else {
      out += ch;
    }
  }
  return out;
}`,
  "roman-to-int": `function romanToInt(s) {
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const current = values[s[i]];
    const next = values[s[i + 1]] || 0;
    total += current < next ? -current : current;
  }
  return total;
}`,
  "longest-substring": `function longestUniqueSubstring(s) {
  const lastSeen = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) left = lastSeen.get(ch) + 1;
    lastSeen.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
  "max-subarray": `function maxSubarray(nums) {
  let running = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    running = Math.max(nums[i], running + nums[i]);
    best = Math.max(best, running);
  }
  return best;
}`,
  "climb-stairs": `function climbStairs(n) {
  if (n <= 2) return n;
  let a = 1;
  let b = 2;
  for (let i = 3; i <= n; i++) {
    const next = a + b;
    a = b;
    b = next;
  }
  return b;
}`,
  "top-k-frequent": `function topKFrequent(nums, k) {
  const count = new Map();
  for (const n of nums) count.set(n, (count.get(n) || 0) + 1);
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, k)
    .map((entry) => entry[0]);
}`,

  "recursive-salaries": `function sumSalaries(json) {
  const data = JSON.parse(json);
  const walk = (node) => {
    if (Array.isArray(node)) return node.reduce((total, item) => total + walk(item), 0);
    if (node && typeof node === "object") {
      if (typeof node.salary === "number") return node.salary;
      return Object.values(node).reduce((total, value) => total + walk(value), 0);
    }
    return 0;
  };
  return walk(data);
}`,
  "merge-intervals": `function mergeIntervals(s) {
  const intervals = s
    .split(";")
    .filter(Boolean)
    .map((pair) => pair.split(",").map(Number))
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of intervals) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged.map((pair) => pair.join(",")).join(";");
}`,
  "longest-palindrome": `function longestPalindrome(s) {
  if (!s) return "";
  let bestStart = 0;
  let bestLength = 1;
  const expand = (left, right) => {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    return right - left - 1;
  };
  for (let i = 0; i < s.length; i++) {
    const odd = expand(i, i);
    const even = expand(i, i + 1);
    const length = Math.max(odd, even);
    if (length > bestLength) {
      bestLength = length;
      bestStart = i - Math.floor((length - 1) / 2);
    }
  }
  return s.slice(bestStart, bestStart + bestLength);
}`,
  "trapping-rain": `function trapRain(height) {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left]);
      water += leftMax - height[left];
      left++;
    } else {
      rightMax = Math.max(rightMax, height[right]);
      water += rightMax - height[right];
      right--;
    }
  }
  return water;
}`,
  "coin-change": `function fewestCoins(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let value = 1; value <= amount; value++) {
    for (const coin of coins) {
      if (coin <= value && dp[value - coin] + 1 < dp[value]) {
        dp[value] = dp[value - coin] + 1;
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
  lis: `function lisLength(nums) {
  const dp = nums.map(() => 1);
  let best = nums.length ? 1 : 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
    best = Math.max(best, dp[i]);
  }
  return best;
}`,
  "median-two-sorted": `function medianSorted(a, b) {
  const merged = a.concat(b).sort((x, y) => x - y);
  const mid = Math.floor(merged.length / 2);
  if (merged.length % 2 === 1) return merged[mid];
  return (merged[mid - 1] + merged[mid]) / 2;
}`,
};

export type WorkedAnswer = {
  code: string;
  /** The language the code is written in, which is not always the selected one. */
  language: PracticeLanguage;
};

/**
 * The worked answer to show for a problem: in the learner's language when we
 * have a translation, otherwise the JavaScript reference.
 */
export function answerFor(id: string, language: PracticeLanguage): WorkedAnswer | null {
  const byLanguage: Partial<Record<PracticeLanguage, Record<string, string>>> = {
    python: PY_ANSWERS,
    java: JAVA_ANSWERS,
    c_cpp: CPP_ANSWERS,
    csharp: CSHARP_ANSWERS,
    go: GO_ANSWERS,
    rust: RUST_ANSWERS,
    kotlin: KOTLIN_ANSWERS,
  };
  const translated = byLanguage[language]?.[id];
  if (translated) return { code: translated, language };

  const javascript = JS_ANSWERS[id];
  return javascript ? { code: javascript, language: "javascript" } : null;
}
