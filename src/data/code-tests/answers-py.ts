/**
 * Python translations of the worked answers.
 *
 * Same problems, same tests, same driver — these exist so a Python learner can
 * read the reveal in the language they are actually writing. Each key is a
 * problem id; the function name matches that problem's `fn`.
 */
export const PY_ANSWERS: Record<string, string> = {
  "echo-lines": `def number_lines(lines):
    return [f"{i + 1}: {line}" for i, line in enumerate(lines)]`,
  "hello-output": `def greet(name):
    return "Hello, " + name + "!"`,
  "sum-array": `def sum_numbers(nums):
    return sum(nums)`,
  "vowel-count": `def count_vowels(text):
    return sum(1 for ch in text.lower() if ch in "aeiou")`,
  "two-arrays-equal": `def same_order(a, b):
    return a == b`,
  "count-evens": `def count_evens(nums):
    return sum(1 for n in nums if n % 2 == 0)`,
  "largest-smallest": `def smallest_and_largest(nums):
    return [min(nums), max(nums)]`,
  "palindrome-number": `def is_palindrome_number(n):
    if n < 0:
        return False
    text = str(n)
    return text == text[::-1]`,
  "remove-duplicates": `def dedupe(nums):
    seen = set()
    out = []
    for n in nums:
        if n not in seen:
            seen.add(n)
            out.append(n)
    return out`,
  "reverse-text": `def reverse_text(text):
    return text[::-1]`,
  "reverse-no-builtin": `def reverse_array(nums):
    out = nums[:]
    i, j = 0, len(out) - 1
    while i < j:
        out[i], out[j] = out[j], out[i]
        i += 1
        j -= 1
    return out`,
  "second-largest": `def second_largest(nums):
    best = second = float("-inf")
    for n in nums:
        if n > best:
            second = best
            best = n
        elif n < best and n > second:
            second = n
    return -1 if second == float("-inf") else int(second)`,
  "title-case": `def title_case(text):
    return " ".join(
        word[0].upper() + word[1:].lower() if word else word
        for word in text.split(" ")
    )`,
  "word-count": `def count_words(text):
    return len(text.split())`,
  "anagram-check": `def is_anagram(a, b):
    return sorted(a.lower()) == sorted(b.lower())`,
  "array-chunk": `def chunk(nums, size):
    return [",".join(str(n) for n in nums[i:i + size]) for i in range(0, len(nums), size)]`,
  "binary-bits": `def count_set_bits(n):
    count = 0
    while n > 0:
        n &= n - 1
        count += 1
    return count`,
  factorial: `def factorial(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result`,
  "missing-number": `def missing_number(n, nums):
    expected = n * (n + 1) // 2
    return expected - sum(nums)`,
  "find-duplicates": `def find_duplicates(nums):
    seen = set()
    reported = set()
    out = []
    for n in nums:
        if n in seen and n not in reported:
            reported.add(n)
            out.append(n)
        seen.add(n)
    return out`,
  fizzbuzz: `def fizz_buzz(n):
    rows = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            rows.append("FizzBuzz")
        elif i % 3 == 0:
            rows.append("Fizz")
        elif i % 5 == 0:
            rows.append("Buzz")
        else:
            rows.append(str(i))
    return rows`,
  "gcd-lcm": `def gcd_and_lcm(a, b):
    x, y = a, b
    while y != 0:
        x, y = y, x % y
    return [x, (a // x) * b]`,
  "grade-letter": `def grade_letter(score):
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"`,
  intersection: `def intersection(a, b):
    in_b = set(b)
    out = []
    added = set()
    for n in a:
        if n in in_b and n not in added:
            added.add(n)
            out.append(n)
    return out`,
  "merge-sorted": `def merge_sorted(a, b):
    out = []
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i])
            i += 1
        else:
            out.append(b[j])
            j += 1
    out.extend(a[i:])
    out.extend(b[j:])
    return out`,
  "move-zeros": `def move_zeros(nums):
    out = [n for n in nums if n != 0]
    out.extend([0] * (len(nums) - len(out)))
    return out`,
  "multiply-table": `def multiplication_table(n):
    return [f"{n} x {i} = {n * i}" for i in range(1, 6)]`,
  "is-prime": `def is_prime(n):
    if n < 2:
        return False
    d = 2
    while d * d <= n:
        if n % d == 0:
            return False
        d += 1
    return True`,
  "sum-digits": `def digit_sum(n):
    value = abs(n)
    total = 0
    while value > 0:
        total += value % 10
        value //= 10
    return total`,
  "best-time-stock": `def max_profit(prices):
    lowest = float("inf")
    best = 0
    for price in prices:
        if price < lowest:
            lowest = price
        if price - lowest > best:
            best = price - lowest
    return best`,
  "binary-search": `def binary_search(nums, target):
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
  "group-anagrams": `def count_anagram_groups(words):
    return len({"".join(sorted(word)) for word in words})`,
  "fib-recursion": `def fibonacci(n):
    out = []
    a, b = 0, 1
    for _ in range(n):
        out.append(a)
        a, b = b, a + b
    return out`,
  "freq-count": `def frequency_report(nums):
    counts = {}
    order = []
    for n in nums:
        if n not in counts:
            order.append(n)
            counts[n] = 0
        counts[n] += 1
    parts = [f"{n}:{counts[n]}" for n in order if counts[n] > 1]
    return ",".join(parts) if parts else "none"`,
  "longest-common-prefix": `def longest_common_prefix(words):
    if not words:
        return ""
    prefix = words[0]
    for word in words[1:]:
        while not word.startswith(prefix):
            prefix = prefix[:-1]
    return prefix`,
  "majority-element": `def majority_element(nums):
    counts = {}
    for n in nums:
        counts[n] = counts.get(n, 0) + 1
        if counts[n] > len(nums) / 2:
            return n
    return nums[0]`,
  "reverse-linked-list": `def reverse_integer(n):
    sign = -1 if n < 0 else 1
    value = abs(n)
    reversed_value = 0
    while value > 0:
        reversed_value = reversed_value * 10 + value % 10
        value //= 10
    result = sign * reversed_value
    if result < -2147483648 or result > 2147483647:
        return 0
    return result`,
  "reverse-words": `def reverse_words(s):
    return " ".join(reversed(s.split()))`,
  "rotate-k": `def rotate_right(nums, k):
    n = len(nums)
    if n == 0:
        return []
    shift = k % n
    return nums[n - shift:] + nums[:n - shift]`,
  "run-length-encode": `def run_length_encode(s):
    out = ""
    i = 0
    while i < len(s):
        run = 1
        while i + run < len(s) and s[i + run] == s[i]:
            run += 1
        out += s[i] + str(run)
        i += run
    return out`,
  "two-sum": `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        need = target - n
        if need in seen:
            j = seen[need]
            return [min(i, j), max(i, j)]
        seen[n] = i
    return []`,
  "valid-parens": `def is_valid_parens(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif not stack or stack.pop() != pairs[ch]:
            return False
    return not stack`,
  "key-value-zip": `def zip_keys(keys, values):
    return len(dict(zip(keys, values)))`,
  "palindromic-substrings": `def palindromic_substrings(s):
    out = []
    for i in range(len(s)):
        for j in range(i, len(s)):
            piece = s[i:j + 1]
            if piece == piece[::-1]:
                out.append(piece)
    return out`,
  "caesar-cipher": `def caesar(text, k):
    shift = k % 26
    out = ""
    for ch in text:
        if "A" <= ch <= "Z":
            out += chr((ord(ch) - 65 + shift) % 26 + 65)
        elif "a" <= ch <= "z":
            out += chr((ord(ch) - 97 + shift) % 26 + 97)
        else:
            out += ch
    return out`,
  "pair-sum-sorted": `def pair_sum_sorted(nums, target):
    i, j = 0, len(nums) - 1
    while i < j:
        total = nums[i] + nums[j]
        if total == target:
            return True
        if total < target:
            i += 1
        else:
            j -= 1
    return False`,
  "pascal-row": `def pascal_row(n):
    row = [1]
    for _ in range(n):
        next_row = [1]
        for j in range(1, len(row)):
            next_row.append(row[j - 1] + row[j])
        next_row.append(1)
        row = next_row
    return row`,
  "roman-to-int": `def roman_to_int(s):
    values = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    total = 0
    for i, ch in enumerate(s):
        current = values[ch]
        following = values.get(s[i + 1], 0) if i + 1 < len(s) else 0
        total += -current if current < following else current
    return total`,
  "min-stack": `def simulate_stack(ops):
    stack = []
    for op in ops:
        if op.startswith("push:"):
            stack.append(int(op[5:]))
        elif op == "pop" and stack:
            stack.pop()
    return stack`,
  "matrix-transpose": `def transpose(grid):
    if not grid:
        return []
    return [list(row) for row in zip(*grid)]`,
  "climb-stairs": `def climb_stairs(n):
    if n <= 2:
        return n
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    return b`,
  "longest-substring": `def longest_unique_substring(s):
    last_seen = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best`,
  "max-subarray": `def max_subarray(nums):
    running = best = nums[0]
    for n in nums[1:]:
        running = max(n, running + n)
        best = max(best, running)
    return best`,
  "top-k-frequent": `def top_kfrequent(nums, k):
    counts = {}
    for n in nums:
        counts[n] = counts.get(n, 0) + 1
    ordered = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    return [value for value, _ in ordered[:k]]`,
  "longest-palindrome": `def longest_palindrome(s):
    if not s:
        return ""

    def expand(left, right):
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        return right - left - 1

    best_start = 0
    best_length = 1
    for i in range(len(s)):
        length = max(expand(i, i), expand(i, i + 1))
        if length > best_length:
            best_length = length
            best_start = i - (length - 1) // 2
    return s[best_start:best_start + best_length]`,
  "merge-intervals": `def merge_intervals(s):
    if not s:
        return ""
    intervals = sorted(
        ([int(a), int(b)] for a, b in (pair.split(",") for pair in s.split(";") if pair)),
        key=lambda pair: pair[0],
    )
    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return ";".join(f"{start},{end}" for start, end in merged)`,
  "recursive-salaries": `import json


def sum_salaries(text):
    def walk(node):
        if isinstance(node, list):
            return sum(walk(item) for item in node)
        if isinstance(node, dict):
            salary = node.get("salary")
            if isinstance(salary, (int, float)) and not isinstance(salary, bool):
                return salary
            return sum(walk(value) for value in node.values())
        return 0

    return walk(json.loads(text))`,
  "coin-change": `def fewest_coins(coins, amount):
    unreachable = float("inf")
    dp = [0] + [unreachable] * amount
    for value in range(1, amount + 1):
        for coin in coins:
            if coin <= value and dp[value - coin] + 1 < dp[value]:
                dp[value] = dp[value - coin] + 1
    return -1 if dp[amount] == unreachable else dp[amount]`,
  lis: `def lis_length(nums):
    if not nums:
        return 0
    dp = [1] * len(nums)
    best = 1
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
        best = max(best, dp[i])
    return best`,
  "trapping-rain": `def trap_rain(height):
    left, right = 0, len(height) - 1
    left_max = right_max = water = 0
    while left < right:
        if height[left] < height[right]:
            left_max = max(left_max, height[left])
            water += left_max - height[left]
            left += 1
        else:
            right_max = max(right_max, height[right])
            water += right_max - height[right]
            right -= 1
    return water`,
  "median-two-sorted": `def median_sorted(a, b):
    merged = sorted(a + b)
    mid = len(merged) // 2
    if len(merged) % 2 == 1:
        return float(merged[mid])
    return (merged[mid - 1] + merged[mid]) / 2`,
};
