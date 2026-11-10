/**
 * Kotlin translations of the worked answers.
 *
 * The Kotlin starter is a single top-level `fun` plus the `//__RUN__` marker,
 * so each answer here is that function — paste it over the stub in the editor.
 * Only Kotlin's default imports are used (no `import` line in an answer).
 */
export const KOTLIN_ANSWERS: Record<string, string> = {
  "hello-output": `fun greet(name: String): String {
    return "Hello, " + name + "!"
}`,
  "echo-lines": `fun numberLines(lines: List<String>): List<String> {
    return lines.mapIndexed { index, line -> (index + 1).toString() + ": " + line }
}`,
  "sum-array": `fun sumNumbers(nums: IntArray): Int {
    var total = 0
    for (n in nums) total += n
    return total
}`,
  "vowel-count": `fun countVowels(text: String): Int {
    var count = 0
    for (ch in text.lowercase()) {
        if (ch in "aeiou") count++
    }
    return count
}`,
  "count-evens": `fun countEvens(nums: IntArray): Int {
    var evens = 0
    for (n in nums) if (n % 2 == 0) evens++
    return evens
}`,
  "largest-smallest": `fun smallestAndLargest(nums: IntArray): IntArray {
    var small = nums[0]
    var large = nums[0]
    for (n in nums) {
        if (n < small) small = n
        if (n > large) large = n
    }
    return intArrayOf(small, large)
}`,
  "second-largest": `fun secondLargest(nums: IntArray): Int {
    var best = Int.MIN_VALUE
    var second = Int.MIN_VALUE
    for (n in nums) {
        if (n > best) {
            second = best
            best = n
        } else if (n < best && n > second) {
            second = n
        }
    }
    return if (second == Int.MIN_VALUE) -1 else second
}`,
  "reverse-no-builtin": `fun reverseArray(nums: IntArray): IntArray {
    val result = nums.copyOf()
    var i = 0
    var j = result.size - 1
    while (i < j) {
        val tmp = result[i]
        result[i] = result[j]
        result[j] = tmp
        i++
        j--
    }
    return result
}`,
  "reverse-text": `fun reverseText(text: String): String {
    var result = ""
    for (i in text.length - 1 downTo 0) result += text[i]
    return result
}`,
  "palindrome-number": `fun isPalindromeNumber(n: Int): Boolean {
    if (n < 0) return false
    val text = n.toString()
    return text == text.reversed()
}`,
  "remove-duplicates": `fun dedupe(nums: IntArray): IntArray {
    val seen = mutableSetOf<Int>()
    val result = mutableListOf<Int>()
    for (n in nums) {
        if (seen.add(n)) result.add(n)
    }
    return result.toIntArray()
}`,
  "two-arrays-equal": `fun sameOrder(a: IntArray, b: IntArray): Boolean {
    if (a.size != b.size) return false
    for (i in a.indices) {
        if (a[i] != b[i]) return false
    }
    return true
}`,
  "title-case": `fun titleCase(text: String): String {
    val words = text.split(" ")
    val result = mutableListOf<String>()
    for (word in words) {
        if (word.isEmpty()) result.add(word)
        else result.add(word[0].uppercase() + word.substring(1).lowercase())
    }
    return result.joinToString(" ")
}`,
  "word-count": `fun countWords(text: String): Int {
    return text.trim().split(Regex("\\\\s+")).count { it.isNotEmpty() }
}`,
  "sum-digits": `fun digitSum(n: Int): Int {
    var value = Math.abs(n)
    var total = 0
    while (value > 0) {
        total += value % 10
        value /= 10
    }
    return total
}`,
  "multiply-table": `fun multiplicationTable(n: Int): List<String> {
    val rows = mutableListOf<String>()
    for (i in 1..5) rows.add(n.toString() + " x " + i + " = " + (n * i))
    return rows
}`,
  "grade-letter": `fun gradeLetter(score: Int): String {
    if (score >= 90) return "A"
    if (score >= 80) return "B"
    if (score >= 70) return "C"
    if (score >= 60) return "D"
    return "F"
}`,
  fizzbuzz: `fun fizzBuzz(n: Int): List<String> {
    val rows = mutableListOf<String>()
    for (i in 1..n) {
        if (i % 15 == 0) rows.add("FizzBuzz")
        else if (i % 3 == 0) rows.add("Fizz")
        else if (i % 5 == 0) rows.add("Buzz")
        else rows.add(i.toString())
    }
    return rows
}`,
  "gcd-lcm": `fun gcdAndLcm(a: Int, b: Int): IntArray {
    var x = a
    var y = b
    while (y != 0) {
        val t = x % y
        x = y
        y = t
    }
    return intArrayOf(x, (a / x) * b)
}`,
  "binary-bits": `fun countSetBits(n: Int): Int {
    var value = n
    var count = 0
    while (value > 0) {
        value = value and (value - 1)
        count++
    }
    return count
}`,
  "is-prime": `fun isPrime(n: Int): Boolean {
    if (n < 2) return false
    var d = 2
    while (d * d <= n) {
        if (n % d == 0) return false
        d++
    }
    return true
}`,
  factorial: `fun factorial(n: Int): Int {
    var result = 1
    for (i in 2..n) result *= i
    return result
}`,
  "find-duplicates": `fun findDuplicates(nums: IntArray): IntArray {
    val seen = mutableSetOf<Int>()
    val reported = mutableSetOf<Int>()
    val result = mutableListOf<Int>()
    for (n in nums) {
        if (n in seen && reported.add(n)) result.add(n)
        seen.add(n)
    }
    return result.toIntArray()
}`,
  intersection: `fun intersection(a: IntArray, b: IntArray): IntArray {
    val inB = b.toSet()
    val added = mutableSetOf<Int>()
    val result = mutableListOf<Int>()
    for (n in a) {
        if (n in inB && added.add(n)) result.add(n)
    }
    return result.toIntArray()
}`,
  "merge-sorted": `fun mergeSorted(a: IntArray, b: IntArray): IntArray {
    val result = mutableListOf<Int>()
    var i = 0
    var j = 0
    while (i < a.size && j < b.size) {
        if (a[i] <= b[j]) {
            result.add(a[i])
            i++
        } else {
            result.add(b[j])
            j++
        }
    }
    while (i < a.size) {
        result.add(a[i])
        i++
    }
    while (j < b.size) {
        result.add(b[j])
        j++
    }
    return result.toIntArray()
}`,
  "missing-number": `fun missingNumber(n: Int, nums: IntArray): Int {
    var actual = 0
    for (value in nums) actual += value
    return (n * (n + 1)) / 2 - actual
}`,
  "move-zeros": `fun moveZeros(nums: IntArray): IntArray {
    val result = mutableListOf<Int>()
    for (n in nums) if (n != 0) result.add(n)
    while (result.size < nums.size) result.add(0)
    return result.toIntArray()
}`,
  "array-chunk": `fun chunk(nums: IntArray, size: Int): List<String> {
    val rows = mutableListOf<String>()
    var i = 0
    while (i < nums.size) {
        val end = minOf(i + size, nums.size)
        val parts = mutableListOf<String>()
        for (j in i until end) parts.add(nums[j].toString())
        rows.add(parts.joinToString(","))
        i += size
    }
    return rows
}`,
  "anagram-check": `fun isAnagram(a: String, b: String): Boolean {
    fun normalize(word: String): String {
        return word.lowercase().toCharArray().sorted().joinToString("")
    }
    return normalize(a) == normalize(b)
}`,
  "two-sum": `fun twoSum(nums: IntArray, target: Int): IntArray {
    val seen = mutableMapOf<Int, Int>()
    for (i in nums.indices) {
        val need = target - nums[i]
        val j = seen[need]
        if (j != null) return intArrayOf(minOf(i, j), maxOf(i, j))
        seen[nums[i]] = i
    }
    return IntArray(0)
}`,
  "best-time-stock": `fun maxProfit(prices: IntArray): Int {
    var lowest = Int.MAX_VALUE
    var best = 0
    for (price in prices) {
        if (price < lowest) lowest = price
        if (price - lowest > best) best = price - lowest
    }
    return best
}`,
  "valid-parens": `fun isValidParens(s: String): Boolean {
    val pairs = mapOf(')' to '(', ']' to '[', '}' to '{')
    val stack = mutableListOf<Char>()
    for (ch in s) {
        if (ch == '(' || ch == '[' || ch == '{') {
            stack.add(ch)
        } else if (stack.isEmpty() || stack.removeAt(stack.size - 1) != pairs[ch]) {
            return false
        }
    }
    return stack.isEmpty()
}`,
  "group-anagrams": `fun countAnagramGroups(words: List<String>): Int {
    val keys = mutableSetOf<String>()
    for (word in words) keys.add(word.toCharArray().sorted().joinToString(""))
    return keys.size
}`,
  "freq-count": `fun frequencyReport(nums: IntArray): String {
    val counts = mutableMapOf<Int, Int>()
    val order = mutableListOf<Int>()
    for (n in nums) {
        if (!counts.containsKey(n)) order.add(n)
        counts[n] = (counts[n] ?: 0) + 1
    }
    val parts = mutableListOf<String>()
    for (n in order) {
        val count = counts[n] ?: 0
        if (count > 1) parts.add(n.toString() + ":" + count)
    }
    return if (parts.isEmpty()) "none" else parts.joinToString(",")
}`,
  "key-value-zip": `fun zipKeys(keys: List<String>, values: List<String>): Int {
    val map = mutableMapOf<String, String>()
    for (i in keys.indices) map[keys[i]] = values[i]
    return map.size
}`,
  "rotate-k": `fun rotateRight(nums: IntArray, k: Int): IntArray {
    val n = nums.size
    if (n == 0) return IntArray(0)
    val shift = ((k % n) + n) % n
    val result = IntArray(n)
    for (i in 0 until n) result[(i + shift) % n] = nums[i]
    return result
}`,
  "reverse-linked-list": `fun reverseInteger(n: Int): Int {
    val sign = if (n < 0) -1 else 1
    var value = Math.abs(n.toLong())
    var reversed = 0L
    while (value > 0) {
        reversed = reversed * 10 + value % 10
        value /= 10
    }
    val result = sign * reversed
    if (result < Int.MIN_VALUE || result > Int.MAX_VALUE) return 0
    return result.toInt()
}`,
  "binary-search": `fun binarySearch(nums: IntArray, target: Int): Int {
    var low = 0
    var high = nums.size - 1
    while (low <= high) {
        val mid = (low + high) / 2
        if (nums[mid] == target) return mid
        if (nums[mid] < target) low = mid + 1
        else high = mid - 1
    }
    return -1
}`,
  "fib-recursion": `fun fibonacci(n: Int): IntArray {
    val result = mutableListOf<Int>()
    var a = 0
    var b = 1
    for (i in 0 until n) {
        result.add(a)
        val next = a + b
        a = b
        b = next
    }
    return result.toIntArray()
}`,
  "min-stack": `fun simulateStack(ops: List<String>): IntArray {
    val stack = mutableListOf<Int>()
    for (op in ops) {
        if (op.startsWith("push:")) stack.add(op.substring(5).trim().toInt())
        else if (op == "pop" && stack.isNotEmpty()) stack.removeAt(stack.size - 1)
    }
    return stack.toIntArray()
}`,
  "palindromic-substrings": `fun palindromicSubstrings(s: String): List<String> {
    fun isPalindrome(text: String): Boolean {
        var i = 0
        var j = text.length - 1
        while (i < j) {
            if (text[i] != text[j]) return false
            i++
            j--
        }
        return true
    }
    val result = mutableListOf<String>()
    for (i in s.indices) {
        for (j in i until s.length) {
            val slice = s.substring(i, j + 1)
            if (isPalindrome(slice)) result.add(slice)
        }
    }
    return result
}`,
  "reverse-words": `fun reverseWords(s: String): String {
    val words = s.trim().split(Regex("\\\\s+")).filter { it.isNotEmpty() }
    return words.reversed().joinToString(" ")
}`,
  "run-length-encode": `fun runLengthEncode(s: String): String {
    var result = ""
    var i = 0
    while (i < s.length) {
        var run = 1
        while (i + run < s.length && s[i + run] == s[i]) run++
        result += s[i] + run.toString()
        i += run
    }
    return result
}`,
  "longest-common-prefix": `fun longestCommonPrefix(words: List<String>): String {
    if (words.isEmpty()) return ""
    var prefix = words[0]
    for (index in 1 until words.size) {
        val word = words[index]
        while (!word.startsWith(prefix)) prefix = prefix.substring(0, prefix.length - 1)
    }
    return prefix
}`,
  "majority-element": `fun majorityElement(nums: IntArray): Int {
    val count = mutableMapOf<Int, Int>()
    for (n in nums) {
        val next = (count[n] ?: 0) + 1
        if (next > nums.size / 2.0) return n
        count[n] = next
    }
    return nums[0]
}`,
  "pair-sum-sorted": `fun pairSumSorted(nums: IntArray, target: Int): Boolean {
    var i = 0
    var j = nums.size - 1
    while (i < j) {
        val sum = nums[i] + nums[j]
        if (sum == target) return true
        if (sum < target) i++
        else j--
    }
    return false
}`,
  "matrix-transpose": `fun transpose(grid: Array<IntArray>): Array<IntArray> {
    val rows = grid.size
    val cols = if (rows == 0) 0 else grid[0].size
    return Array(cols) { c -> IntArray(rows) { r -> grid[r][c] } }
}`,
  "pascal-row": `fun pascalRow(n: Int): IntArray {
    var row = intArrayOf(1)
    for (i in 1..n) {
        val next = mutableListOf<Int>()
        next.add(1)
        for (j in 1 until row.size) next.add(row[j - 1] + row[j])
        next.add(1)
        row = next.toIntArray()
    }
    return row
}`,
  "caesar-cipher": `fun caesar(text: String, k: Int): String {
    val shift = ((k % 26) + 26) % 26
    val result = StringBuilder()
    for (ch in text) {
        when {
            ch in 'a'..'z' -> result.append('a' + (ch - 'a' + shift) % 26)
            ch in 'A'..'Z' -> result.append('A' + (ch - 'A' + shift) % 26)
            else -> result.append(ch)
        }
    }
    return result.toString()
}`,
  "roman-to-int": `fun romanToInt(s: String): Int {
    val values = mapOf('I' to 1, 'V' to 5, 'X' to 10, 'L' to 50, 'C' to 100, 'D' to 500, 'M' to 1000)
    var total = 0
    for (i in s.indices) {
        val current = values[s[i]] ?: 0
        val next = if (i + 1 < s.length) values[s[i + 1]] ?: 0 else 0
        total += if (current < next) -current else current
    }
    return total
}`,
  "longest-substring": `fun longestUniqueSubstring(s: String): Int {
    val lastSeen = mutableMapOf<Char, Int>()
    var left = 0
    var best = 0
    for (right in s.indices) {
        val seen = lastSeen[s[right]]
        if (seen != null && seen >= left) left = seen + 1
        lastSeen[s[right]] = right
        best = Math.max(best, right - left + 1)
    }
    return best
}`,
  "max-subarray": `fun maxSubarray(nums: IntArray): Int {
    var running = nums[0]
    var best = nums[0]
    for (i in 1 until nums.size) {
        running = maxOf(nums[i], running + nums[i])
        best = maxOf(best, running)
    }
    return best
}`,
  "climb-stairs": `fun climbStairs(n: Int): Int {
    if (n <= 2) return n
    var a = 1
    var b = 2
    for (i in 3..n) {
        val next = a + b
        a = b
        b = next
    }
    return b
}`,
  "top-k-frequent": `fun topKFrequent(nums: IntArray, k: Int): IntArray {
    val counts = mutableMapOf<Int, Int>()
    for (n in nums) counts[n] = (counts[n] ?: 0) + 1
    return counts.entries
        .sortedWith(compareByDescending<Map.Entry<Int, Int>> { it.value }.thenBy { it.key })
        .take(k)
        .map { it.key }
        .toIntArray()
}`,
  "recursive-salaries": `fun sumSalaries(json: String): Int {
    // Every "salary" number in the text, wherever it sits in the tree.
    val needle = "salary"
    var total = 0
    var pos = 0
    while (true) {
        val found = json.indexOf(needle, pos)
        if (found < 0) break
        pos = found + needle.length
        while (pos < json.length && !(json[pos] == '-' || json[pos] in '0'..'9')) pos++
        val negative = pos < json.length && json[pos] == '-'
        if (negative) pos++
        var value = 0
        while (pos < json.length && json[pos] in '0'..'9') {
            value = value * 10 + (json[pos] - '0')
            pos++
        }
        total += if (negative) -value else value
    }
    return total
}`,
  "merge-intervals": `fun mergeIntervals(s: String): String {
    if (s.isEmpty()) return ""
    val intervals = mutableListOf<IntArray>()
    for (pair in s.split(";")) {
        if (pair.isEmpty()) continue
        val parts = pair.split(",")
        intervals.add(intArrayOf(parts[0].trim().toInt(), parts[1].trim().toInt()))
    }
    intervals.sortBy { it[0] }
    val merged = mutableListOf<IntArray>()
    for (interval in intervals) {
        val last = merged.lastOrNull()
        if (last != null && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1])
        else merged.add(intArrayOf(interval[0], interval[1]))
    }
    return merged.joinToString(";") { it[0].toString() + "," + it[1].toString() }
}`,
  "longest-palindrome": `fun longestPalindrome(s: String): String {
    if (s.isEmpty()) return ""
    var bestStart = 0
    var bestLength = 1
    fun expand(leftStart: Int, rightStart: Int): Int {
        var left = leftStart
        var right = rightStart
        while (left >= 0 && right < s.length && s[left] == s[right]) {
            left--
            right++
        }
        return right - left - 1
    }
    for (i in s.indices) {
        val length = Math.max(expand(i, i), expand(i, i + 1))
        if (length > bestLength) {
            bestLength = length
            bestStart = i - (length - 1) / 2
        }
    }
    return s.substring(bestStart, bestStart + bestLength)
}`,
  "trapping-rain": `fun trapRain(height: IntArray): Int {
    var left = 0
    var right = height.size - 1
    var leftMax = 0
    var rightMax = 0
    var water = 0
    while (left < right) {
        if (height[left] < height[right]) {
            leftMax = Math.max(leftMax, height[left])
            water += leftMax - height[left]
            left++
        } else {
            rightMax = Math.max(rightMax, height[right])
            water += rightMax - height[right]
            right--
        }
    }
    return water
}`,
  "coin-change": `fun fewestCoins(coins: IntArray, amount: Int): Int {
    val unreachable = amount + 1
    val dp = IntArray(amount + 1) { unreachable }
    dp[0] = 0
    for (value in 1..amount) {
        for (coin in coins) {
            if (coin <= value && dp[value - coin] + 1 < dp[value]) {
                dp[value] = dp[value - coin] + 1
            }
        }
    }
    return if (dp[amount] >= unreachable) -1 else dp[amount]
}`,
  lis: `fun lisLength(nums: IntArray): Int {
    if (nums.isEmpty()) return 0
    val dp = IntArray(nums.size) { 1 }
    var best = 1
    for (i in nums.indices) {
        for (j in 0 until i) {
            if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1)
        }
        best = Math.max(best, dp[i])
    }
    return best
}`,
  "median-two-sorted": `fun medianSorted(a: IntArray, b: IntArray): Double {
    val merged = (a + b).sortedArray()
    val mid = merged.size / 2
    if (merged.size % 2 == 1) return merged[mid].toDouble()
    return (merged[mid - 1] + merged[mid]) / 2.0
}`,
};
