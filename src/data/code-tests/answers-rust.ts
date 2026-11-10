/**
 * Rust translations of the worked answers.
 *
 * The Rust starter has no imports, so each answer is a top-level `fn` and
 * brings its own `use` lines when it needs a collection.
 */
export const RUST_ANSWERS: Record<string, string> = {
  "echo-lines": `fn numberLines(lines: Vec<String>) -> Vec<String> {
    lines
        .iter()
        .enumerate()
        .map(|(i, line)| format!("{}: {}", i + 1, line))
        .collect()
}`,
  "hello-output": `fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}`,
  "sum-array": `fn sumNumbers(nums: Vec<i64>) -> i64 {
    nums.iter().sum()
}`,
  "vowel-count": `fn countVowels(text: String) -> i64 {
    text.to_lowercase()
        .chars()
        .filter(|ch| "aeiou".contains(*ch))
        .count() as i64
}`,
  "two-arrays-equal": `fn sameOrder(a: Vec<i64>, b: Vec<i64>) -> bool {
    a == b
}`,
  "count-evens": `fn countEvens(nums: Vec<i64>) -> i64 {
    nums.iter().filter(|n| *n % 2 == 0).count() as i64
}`,
  "largest-smallest": `fn smallestAndLargest(nums: Vec<i64>) -> Vec<i64> {
    vec![*nums.iter().min().unwrap(), *nums.iter().max().unwrap()]
}`,
  "palindrome-number": `fn isPalindromeNumber(n: i64) -> bool {
    if n < 0 {
        return false;
    }
    let text = n.to_string();
    text == text.chars().rev().collect::<String>()
}`,
  "remove-duplicates": `use std::collections::HashSet;

fn dedupe(nums: Vec<i64>) -> Vec<i64> {
    let mut seen = HashSet::new();
    nums.into_iter().filter(|n| seen.insert(*n)).collect()
}`,
  "reverse-text": `fn reverseText(text: String) -> String {
    text.chars().rev().collect()
}`,
  "reverse-no-builtin": `fn reverseArray(nums: Vec<i64>) -> Vec<i64> {
    let mut out = nums.clone();
    let mut i = 0;
    let mut j = out.len() as i64 - 1;
    while i < j {
        out.swap(i as usize, j as usize);
        i += 1;
        j -= 1;
    }
    out
}`,
  "second-largest": `fn secondLargest(nums: Vec<i64>) -> i64 {
    let mut best = i64::MIN;
    let mut second = i64::MIN;
    for n in nums {
        if n > best {
            second = best;
            best = n;
        } else if n < best && n > second {
            second = n;
        }
    }
    if second == i64::MIN {
        -1
    } else {
        second
    }
}`,
  "title-case": `fn titleCase(text: String) -> String {
    text.split(' ')
        .map(|word| {
            if word.is_empty() {
                String::new()
            } else {
                let mut chars = word.chars();
                let first = chars.next().unwrap().to_uppercase().to_string();
                format!("{}{}", first, chars.as_str().to_lowercase())
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}`,
  "word-count": `fn countWords(text: String) -> i64 {
    text.split_whitespace().count() as i64
}`,
  "anagram-check": `fn isAnagram(a: String, b: String) -> bool {
    let mut x: Vec<char> = a.to_lowercase().chars().collect();
    let mut y: Vec<char> = b.to_lowercase().chars().collect();
    x.sort_unstable();
    y.sort_unstable();
    x == y
}`,
  "array-chunk": `fn chunk(nums: Vec<i64>, size: i64) -> Vec<String> {
    let step = size as usize;
    let mut rows = Vec::new();
    let mut i = 0;
    while i < nums.len() {
        let end = usize::min(i + step, nums.len());
        let row: Vec<String> = nums[i..end].iter().map(|n| n.to_string()).collect();
        rows.push(row.join(","));
        i += step;
    }
    rows
}`,
  "binary-bits": `fn countSetBits(n: i64) -> i64 {
    let mut value = n as u64;
    let mut count = 0;
    while value > 0 {
        value &= value - 1;
        count += 1;
    }
    count
}`,
  factorial: `fn factorial(n: i64) -> i64 {
    let mut result = 1;
    for i in 2..=n {
        result *= i;
    }
    result
}`,
  "missing-number": `fn missingNumber(n: i64, nums: Vec<i64>) -> i64 {
    let expected = n * (n + 1) / 2;
    expected - nums.iter().sum::<i64>()
}`,
  "find-duplicates": `use std::collections::HashSet;

fn findDuplicates(nums: Vec<i64>) -> Vec<i64> {
    let mut seen = HashSet::new();
    let mut reported = HashSet::new();
    let mut out = Vec::new();
    for n in nums {
        if seen.contains(&n) && reported.insert(n) {
            out.push(n);
        }
        seen.insert(n);
    }
    out
}`,
  fizzbuzz: `fn fizzBuzz(n: i64) -> Vec<String> {
    (1..=n)
        .map(|i| match (i % 3, i % 5) {
            (0, 0) => String::from("FizzBuzz"),
            (0, _) => String::from("Fizz"),
            (_, 0) => String::from("Buzz"),
            _ => i.to_string(),
        })
        .collect()
}`,
  "gcd-lcm": `fn gcdAndLcm(a: i64, b: i64) -> Vec<i64> {
    let mut x = a;
    let mut y = b;
    while y != 0 {
        let next = x % y;
        x = y;
        y = next;
    }
    vec![x, (a / x) * b]
}`,
  "grade-letter": `fn gradeLetter(score: i64) -> String {
    if score >= 90 {
        String::from("A")
    } else if score >= 80 {
        String::from("B")
    } else if score >= 70 {
        String::from("C")
    } else if score >= 60 {
        String::from("D")
    } else {
        String::from("F")
    }
}`,
  intersection: `use std::collections::HashSet;

fn intersection(a: Vec<i64>, b: Vec<i64>) -> Vec<i64> {
    let in_b: HashSet<i64> = b.into_iter().collect();
    let mut added = HashSet::new();
    let mut out = Vec::new();
    for n in a {
        if in_b.contains(&n) && added.insert(n) {
            out.push(n);
        }
    }
    out
}`,
  "merge-sorted": `fn mergeSorted(a: Vec<i64>, b: Vec<i64>) -> Vec<i64> {
    let mut out = Vec::with_capacity(a.len() + b.len());
    let mut i = 0;
    let mut j = 0;
    while i < a.len() && j < b.len() {
        if a[i] <= b[j] {
            out.push(a[i]);
            i += 1;
        } else {
            out.push(b[j]);
            j += 1;
        }
    }
    out.extend_from_slice(&a[i..]);
    out.extend_from_slice(&b[j..]);
    out
}`,
  "move-zeros": `fn moveZeros(nums: Vec<i64>) -> Vec<i64> {
    let mut out: Vec<i64> = nums.iter().copied().filter(|n| *n != 0).collect();
    while out.len() < nums.len() {
        out.push(0);
    }
    out
}`,
  "multiply-table": `fn multiplicationTable(n: i64) -> Vec<String> {
    (1..=5)
        .map(|i| format!("{} x {} = {}", n, i, n * i))
        .collect()
}`,
  "is-prime": `fn isPrime(n: i64) -> bool {
    if n < 2 {
        return false;
    }
    let mut d = 2;
    while d * d <= n {
        if n % d == 0 {
            return false;
        }
        d += 1;
    }
    true
}`,
  "sum-digits": `fn digitSum(n: i64) -> i64 {
    let mut value = if n < 0 { -n } else { n };
    let mut total = 0;
    while value > 0 {
        total += value % 10;
        value /= 10;
    }
    total
}`,
  "best-time-stock": `fn maxProfit(prices: Vec<i64>) -> i64 {
    let mut lowest = prices[0];
    let mut best = 0;
    for price in prices {
        if price < lowest {
            lowest = price;
        }
        if price - lowest > best {
            best = price - lowest;
        }
    }
    best
}`,
  "binary-search": `fn binarySearch(nums: Vec<i64>, target: i64) -> i64 {
    let mut low: i64 = 0;
    let mut high: i64 = nums.len() as i64 - 1;
    while low <= high {
        let mid = (low + high) / 2;
        let value = nums[mid as usize];
        if value == target {
            return mid;
        }
        if value < target {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    -1
}`,
  "group-anagrams": `use std::collections::HashSet;

fn countAnagramGroups(words: Vec<String>) -> i64 {
    let mut keys = HashSet::new();
    for word in words {
        let mut letters: Vec<char> = word.chars().collect();
        letters.sort_unstable();
        keys.insert(letters.into_iter().collect::<String>());
    }
    keys.len() as i64
}`,
  "fib-recursion": `fn fibonacci(n: i64) -> Vec<i64> {
    let mut out = Vec::new();
    let mut a = 0;
    let mut b = 1;
    for _ in 0..n {
        out.push(a);
        let next = a + b;
        a = b;
        b = next;
    }
    out
}`,
  "freq-count": `fn frequencyReport(nums: Vec<i64>) -> String {
    let mut counts: Vec<(i64, i64)> = Vec::new();
    for n in nums {
        match counts.iter_mut().find(|entry| entry.0 == n) {
            Some(entry) => entry.1 += 1,
            None => counts.push((n, 1)),
        }
    }
    let parts: Vec<String> = counts
        .iter()
        .filter(|entry| entry.1 > 1)
        .map(|entry| format!("{}:{}", entry.0, entry.1))
        .collect();
    if parts.is_empty() {
        String::from("none")
    } else {
        parts.join(",")
    }
}`,
  "longest-common-prefix": `fn longestCommonPrefix(words: Vec<String>) -> String {
    if words.is_empty() {
        return String::new();
    }
    let mut prefix = words[0].clone();
    for word in &words[1..] {
        while !word.starts_with(&prefix) {
            prefix.pop();
        }
    }
    prefix
}`,
  "majority-element": `fn majorityElement(nums: Vec<i64>) -> i64 {
    let mut count = 0;
    let mut candidate = nums[0];
    for n in nums {
        if count == 0 {
            candidate = n;
        }
        if n == candidate {
            count += 1;
        } else {
            count -= 1;
        }
    }
    candidate
}`,
  "reverse-linked-list": `fn reverseInteger(n: i64) -> i64 {
    let mut value = if n < 0 { -n } else { n };
    let mut reversed: i64 = 0;
    while value > 0 {
        reversed = reversed * 10 + value % 10;
        value /= 10;
    }
    let result = if n < 0 { -reversed } else { reversed };
    if result < -2147483648 || result > 2147483647 {
        return 0;
    }
    result
}`,
  "reverse-words": `fn reverseWords(s: String) -> String {
    s.split_whitespace().rev().collect::<Vec<_>>().join(" ")
}`,
  "rotate-k": `fn rotateRight(nums: Vec<i64>, k: i64) -> Vec<i64> {
    let n = nums.len();
    if n == 0 {
        return Vec::new();
    }
    let shift = (k as usize) % n;
    let mut out = vec![0; n];
    for i in 0..n {
        out[(i + shift) % n] = nums[i];
    }
    out
}`,
  "run-length-encode": `fn runLengthEncode(s: String) -> String {
    let bytes = s.as_bytes();
    let mut out = String::new();
    let mut i = 0;
    while i < bytes.len() {
        let mut run = 1;
        while i + run < bytes.len() && bytes[i + run] == bytes[i] {
            run += 1;
        }
        out.push(bytes[i] as char);
        out.push_str(&run.to_string());
        i += run;
    }
    out
}`,
  "two-sum": `use std::collections::HashMap;

fn twoSum(nums: Vec<i64>, target: i64) -> Vec<i64> {
    let mut seen: HashMap<i64, usize> = HashMap::new();
    for (i, n) in nums.iter().enumerate() {
        if let Some(&j) = seen.get(&(target - n)) {
            return if i < j {
                vec![i as i64, j as i64]
            } else {
                vec![j as i64, i as i64]
            };
        }
        seen.insert(*n, i);
    }
    Vec::new()
}`,
  "valid-parens": `fn isValidParens(s: String) -> bool {
    let mut stack: Vec<char> = Vec::new();
    for ch in s.chars() {
        if ch == '(' || ch == '[' || ch == '{' {
            stack.push(ch);
            continue;
        }
        let want = match ch {
            ')' => '(',
            ']' => '[',
            _ => '{',
        };
        if stack.pop() != Some(want) {
            return false;
        }
    }
    stack.is_empty()
}`,
  "key-value-zip": `use std::collections::HashMap;

fn zipKeys(keys: Vec<String>, values: Vec<String>) -> i64 {
    let mut table: HashMap<String, String> = HashMap::new();
    for (i, key) in keys.into_iter().enumerate() {
        table.insert(key, values[i].clone());
    }
    table.len() as i64
}`,
  "palindromic-substrings": `fn palindromicSubstrings(s: String) -> Vec<String> {
    let chars: Vec<char> = s.chars().collect();
    let mut out = Vec::new();
    for i in 0..chars.len() {
        for j in i..chars.len() {
            if (i..=j).all(|k| chars[k] == chars[i + j - k]) {
                out.push(chars[i..=j].iter().collect::<String>());
            }
        }
    }
    out
}`,
  "caesar-cipher": `fn caesar(text: String, k: i64) -> String {
    let shift = ((k % 26) + 26) % 26;
    text.chars()
        .map(|ch| {
            if ch.is_ascii_uppercase() {
                (b'A' + (((ch as u8 - b'A') as i64 + shift) % 26) as u8) as char
            } else if ch.is_ascii_lowercase() {
                (b'a' + (((ch as u8 - b'a') as i64 + shift) % 26) as u8) as char
            } else {
                ch
            }
        })
        .collect()
}`,
  "pair-sum-sorted": `fn pairSumSorted(nums: Vec<i64>, target: i64) -> bool {
    let mut i: i64 = 0;
    let mut j: i64 = nums.len() as i64 - 1;
    while i < j {
        let sum = nums[i as usize] + nums[j as usize];
        if sum == target {
            return true;
        }
        if sum < target {
            i += 1;
        } else {
            j -= 1;
        }
    }
    false
}`,
  "pascal-row": `fn pascalRow(n: i64) -> Vec<i64> {
    let mut row = vec![1];
    for _ in 1..=n {
        let mut next = vec![1];
        for j in 1..row.len() {
            next.push(row[j - 1] + row[j]);
        }
        next.push(1);
        row = next;
    }
    row
}`,
  "roman-to-int": `fn romanToInt(s: String) -> i64 {
    let chars: Vec<char> = s.chars().collect();
    let mut total = 0;
    for i in 0..chars.len() {
        let current = romanValue(chars[i]);
        let next = if i + 1 < chars.len() {
            romanValue(chars[i + 1])
        } else {
            0
        };
        if current < next {
            total -= current;
        } else {
            total += current;
        }
    }
    total
}

fn romanValue(ch: char) -> i64 {
    match ch {
        'I' => 1,
        'V' => 5,
        'X' => 10,
        'L' => 50,
        'C' => 100,
        'D' => 500,
        _ => 1000,
    }
}`,
  "min-stack": `fn simulateStack(ops: Vec<String>) -> Vec<i64> {
    let mut stack: Vec<i64> = Vec::new();
    for op in ops {
        if let Some(value) = op.strip_prefix("push:") {
            stack.push(value.parse().unwrap());
        } else if op == "pop" {
            stack.pop();
        }
    }
    stack
}`,
  "matrix-transpose": `fn transpose(grid: Vec<Vec<i64>>) -> Vec<Vec<i64>> {
    if grid.is_empty() {
        return Vec::new();
    }
    let cols = grid[0].len();
    let mut out = vec![vec![0; grid.len()]; cols];
    for r in 0..grid.len() {
        for c in 0..cols {
            out[c][r] = grid[r][c];
        }
    }
    out
}`,
  "climb-stairs": `fn climbStairs(n: i64) -> i64 {
    if n <= 2 {
        return n;
    }
    let mut a = 1;
    let mut b = 2;
    for _ in 3..=n {
        let next = a + b;
        a = b;
        b = next;
    }
    b
}`,
  "longest-substring": `use std::collections::HashMap;

fn longestUniqueSubstring(s: String) -> i64 {
    let chars: Vec<char> = s.chars().collect();
    let mut last_seen: HashMap<char, usize> = HashMap::new();
    let mut left = 0;
    let mut best = 0;
    for right in 0..chars.len() {
        if let Some(&seen) = last_seen.get(&chars[right]) {
            if seen >= left {
                left = seen + 1;
            }
        }
        last_seen.insert(chars[right], right);
        if right - left + 1 > best {
            best = right - left + 1;
        }
    }
    best as i64
}`,
  "max-subarray": `fn maxSubarray(nums: Vec<i64>) -> i64 {
    let mut running = nums[0];
    let mut best = nums[0];
    for n in &nums[1..] {
        running = i64::max(*n, running + n);
        best = i64::max(best, running);
    }
    best
}`,
  "top-k-frequent": `use std::collections::HashMap;

fn topKFrequent(nums: Vec<i64>, k: i64) -> Vec<i64> {
    let mut counts: HashMap<i64, i64> = HashMap::new();
    for n in nums {
        *counts.entry(n).or_insert(0) += 1;
    }
    let mut values: Vec<i64> = counts.keys().copied().collect();
    values.sort_by(|x, y| counts[y].cmp(&counts[x]).then(x.cmp(y)));
    values.into_iter().take(k as usize).collect()
}`,
  "longest-palindrome": `fn longestPalindrome(s: String) -> String {
    let chars: Vec<char> = s.chars().collect();
    if chars.is_empty() {
        return String::new();
    }
    let expand = |left: i64, right: i64| -> i64 {
        let mut l = left;
        let mut r = right;
        while l >= 0 && (r as usize) < chars.len() && chars[l as usize] == chars[r as usize] {
            l -= 1;
            r += 1;
        }
        r - l - 1
    };
    let mut best_start = 0;
    let mut best_length = 1;
    for i in 0..chars.len() {
        let odd = expand(i as i64, i as i64);
        let even = expand(i as i64, i as i64 + 1);
        let length = odd.max(even) as usize;
        if length > best_length {
            best_length = length;
            best_start = i - (length - 1) / 2;
        }
    }
    chars[best_start..best_start + best_length]
        .iter()
        .collect()
}`,
  "merge-intervals": `fn mergeIntervals(s: String) -> String {
    if s.is_empty() {
        return String::new();
    }
    let mut intervals: Vec<(i64, i64)> = Vec::new();
    for pair in s.split(';') {
        if pair.is_empty() {
            continue;
        }
        let parts: Vec<&str> = pair.split(',').collect();
        intervals.push((parts[0].parse().unwrap(), parts[1].parse().unwrap()));
    }
    intervals.sort();
    let mut merged: Vec<(i64, i64)> = Vec::new();
    for interval in intervals {
        let mut joined = false;
        if let Some(last) = merged.last_mut() {
            if interval.0 <= last.1 {
                last.1 = i64::max(last.1, interval.1);
                joined = true;
            }
        }
        if !joined {
            merged.push(interval);
        }
    }
    merged
        .iter()
        .map(|(start, end)| format!("{},{}", start, end))
        .collect::<Vec<_>>()
        .join(";")
}`,
  "recursive-salaries": `fn sumSalaries(json: String) -> i64 {
    // Every "salary" number in the text, wherever it sits in the tree.
    let bytes = json.as_bytes();
    let needle = b"\\"salary\\"";
    let mut total = 0;
    let mut pos = 0;
    while pos + needle.len() <= bytes.len() {
        if &bytes[pos..pos + needle.len()] == needle {
            let mut i = pos + needle.len();
            while i < bytes.len() && !(bytes[i] == b'-' || bytes[i].is_ascii_digit()) {
                i += 1;
            }
            let negative = i < bytes.len() && bytes[i] == b'-';
            if negative {
                i += 1;
            }
            let mut value: i64 = 0;
            while i < bytes.len() && bytes[i].is_ascii_digit() {
                value = value * 10 + (bytes[i] - b'0') as i64;
                i += 1;
            }
            total += if negative { -value } else { value };
            pos = i;
        } else {
            pos += 1;
        }
    }
    total
}`,
  "coin-change": `fn fewestCoins(coins: Vec<i64>, amount: i64) -> i64 {
    let unreachable = amount + 1;
    let mut dp = vec![unreachable; amount as usize + 1];
    dp[0] = 0;
    for value in 1..=amount as usize {
        for coin in &coins {
            let coin = *coin as usize;
            if coin <= value && dp[value - coin] + 1 < dp[value] {
                dp[value] = dp[value - coin] + 1;
            }
        }
    }
    if dp[amount as usize] == unreachable {
        -1
    } else {
        dp[amount as usize]
    }
}`,
  lis: `fn lisLength(nums: Vec<i64>) -> i64 {
    if nums.is_empty() {
        return 0;
    }
    let mut dp = vec![1; nums.len()];
    let mut best = 1;
    for i in 0..nums.len() {
        for j in 0..i {
            if nums[j] < nums[i] {
                dp[i] = i64::max(dp[i], dp[j] + 1);
            }
        }
        best = i64::max(best, dp[i]);
    }
    best
}`,
  "trapping-rain": `fn trapRain(height: Vec<i64>) -> i64 {
    let mut left = 0;
    let mut right = height.len() as i64 - 1;
    let mut left_max = 0;
    let mut right_max = 0;
    let mut water = 0;
    while left < right {
        if height[left as usize] < height[right as usize] {
            left_max = i64::max(left_max, height[left as usize]);
            water += left_max - height[left as usize];
            left += 1;
        } else {
            right_max = i64::max(right_max, height[right as usize]);
            water += right_max - height[right as usize];
            right -= 1;
        }
    }
    water
}`,
  "median-two-sorted": `fn medianSorted(a: Vec<i64>, b: Vec<i64>) -> f64 {
    let mut merged: Vec<i64> = a.into_iter().chain(b.into_iter()).collect();
    merged.sort();
    let mid = merged.len() / 2;
    if merged.len() % 2 == 1 {
        merged[mid] as f64
    } else {
        (merged[mid - 1] + merged[mid]) as f64 / 2.0
    }
}`,
};
