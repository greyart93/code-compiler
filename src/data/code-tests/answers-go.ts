/**
 * Go translations of the worked answers.
 *
 * The Go starter already has `package main` and imports `fmt` and `strings`,
 * so each answer here is just the function — paste it over the stub in the
 * editor. Nothing else is imported, so sorting is done by hand.
 */
export const GO_ANSWERS: Record<string, string> = {
  "echo-lines": `func numberLines(lines []string) []string {
	out := make([]string, len(lines))
	for i, line := range lines {
		out[i] = fmt.Sprint(i+1) + ": " + line
	}
	return out
}`,
  "hello-output": `func greet(name string) string {
	return "Hello, " + name + "!"
}`,
  "sum-array": `func sumNumbers(nums []int) int {
	total := 0
	for _, n := range nums {
		total += n
	}
	return total
}`,
  "vowel-count": `func countVowels(text string) int {
	count := 0
	for _, ch := range strings.ToLower(text) {
		if strings.ContainsRune("aeiou", ch) {
			count++
		}
	}
	return count
}`,
  "two-arrays-equal": `func sameOrder(a []int, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}`,
  "count-evens": `func countEvens(nums []int) int {
	evens := 0
	for _, n := range nums {
		if n%2 == 0 {
			evens++
		}
	}
	return evens
}`,
  "largest-smallest": `func smallestAndLargest(nums []int) []int {
	small := nums[0]
	large := nums[0]
	for _, n := range nums {
		if n < small {
			small = n
		}
		if n > large {
			large = n
		}
	}
	return []int{small, large}
}`,
  "palindrome-number": `func isPalindromeNumber(n int) bool {
	if n < 0 {
		return false
	}
	text := fmt.Sprint(n)
	for i, j := 0, len(text)-1; i < j; i, j = i+1, j-1 {
		if text[i] != text[j] {
			return false
		}
	}
	return true
}`,
  "remove-duplicates": `func dedupe(nums []int) []int {
	seen := map[int]bool{}
	out := []int{}
	for _, n := range nums {
		if !seen[n] {
			seen[n] = true
			out = append(out, n)
		}
	}
	return out
}`,
  "reverse-text": `func reverseText(text string) string {
	runes := []rune(text)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}`,
  "reverse-no-builtin": `func reverseArray(nums []int) []int {
	out := make([]int, len(nums))
	copy(out, nums)
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out
}`,
  "second-largest": `func secondLargest(nums []int) int {
	best := nums[0]
	second := 0
	have := false
	for _, n := range nums {
		if n > best {
			second = best
			best = n
			have = true
		} else if n < best && (!have || n > second) {
			second = n
			have = true
		}
	}
	if !have {
		return -1
	}
	return second
}`,
  "title-case": `func titleCase(text string) string {
	words := strings.Split(text, " ")
	for i, word := range words {
		if word == "" {
			continue
		}
		runes := []rune(word)
		words[i] = strings.ToUpper(string(runes[0])) + strings.ToLower(string(runes[1:]))
	}
	return strings.Join(words, " ")
}`,
  "word-count": `func countWords(text string) int {
	return len(strings.Fields(text))
}`,
  "anagram-check": `func isAnagram(a string, b string) bool {
	counts := map[rune]int{}
	for _, ch := range strings.ToLower(a) {
		counts[ch]++
	}
	for _, ch := range strings.ToLower(b) {
		counts[ch]--
	}
	for _, count := range counts {
		if count != 0 {
			return false
		}
	}
	return true
}`,
  "array-chunk": `func chunk(nums []int, size int) []string {
	rows := []string{}
	for i := 0; i < len(nums); i += size {
		end := i + size
		if end > len(nums) {
			end = len(nums)
		}
		parts := make([]string, 0, end-i)
		for _, n := range nums[i:end] {
			parts = append(parts, fmt.Sprint(n))
		}
		rows = append(rows, strings.Join(parts, ","))
	}
	return rows
}`,
  "binary-bits": `func countSetBits(n int) int {
	count := 0
	for n > 0 {
		n &= n - 1
		count++
	}
	return count
}`,
  factorial: `func factorial(n int) int {
	result := 1
	for i := 2; i <= n; i++ {
		result *= i
	}
	return result
}`,
  "missing-number": `func missingNumber(n int, nums []int) int {
	expected := n * (n + 1) / 2
	actual := 0
	for _, value := range nums {
		actual += value
	}
	return expected - actual
}`,
  "find-duplicates": `func findDuplicates(nums []int) []int {
	seen := map[int]bool{}
	reported := map[int]bool{}
	out := []int{}
	for _, n := range nums {
		if seen[n] && !reported[n] {
			reported[n] = true
			out = append(out, n)
		}
		seen[n] = true
	}
	return out
}`,
  fizzbuzz: `func fizzBuzz(n int) []string {
	rows := make([]string, n)
	for i := 1; i <= n; i++ {
		switch {
		case i%15 == 0:
			rows[i-1] = "FizzBuzz"
		case i%3 == 0:
			rows[i-1] = "Fizz"
		case i%5 == 0:
			rows[i-1] = "Buzz"
		default:
			rows[i-1] = fmt.Sprint(i)
		}
	}
	return rows
}`,
  "gcd-lcm": `func gcdAndLcm(a int, b int) []int {
	x, y := a, b
	for y != 0 {
		x, y = y, x%y
	}
	return []int{x, (a / x) * b}
}`,
  "grade-letter": `func gradeLetter(score int) string {
	if score >= 90 {
		return "A"
	}
	if score >= 80 {
		return "B"
	}
	if score >= 70 {
		return "C"
	}
	if score >= 60 {
		return "D"
	}
	return "F"
}`,
  intersection: `func intersection(a []int, b []int) []int {
	inB := map[int]bool{}
	for _, n := range b {
		inB[n] = true
	}
	added := map[int]bool{}
	out := []int{}
	for _, n := range a {
		if inB[n] && !added[n] {
			added[n] = true
			out = append(out, n)
		}
	}
	return out
}`,
  "merge-sorted": `func mergeSorted(a []int, b []int) []int {
	out := make([]int, 0, len(a)+len(b))
	i, j := 0, 0
	for i < len(a) && j < len(b) {
		if a[i] <= b[j] {
			out = append(out, a[i])
			i++
		} else {
			out = append(out, b[j])
			j++
		}
	}
	out = append(out, a[i:]...)
	out = append(out, b[j:]...)
	return out
}`,
  "move-zeros": `func moveZeros(nums []int) []int {
	out := make([]int, len(nums))
	k := 0
	for _, n := range nums {
		if n != 0 {
			out[k] = n
			k++
		}
	}
	return out
}`,
  "multiply-table": `func multiplicationTable(n int) []string {
	rows := make([]string, 5)
	for i := 1; i <= 5; i++ {
		rows[i-1] = fmt.Sprint(n) + " x " + fmt.Sprint(i) + " = " + fmt.Sprint(n*i)
	}
	return rows
}`,
  "is-prime": `func isPrime(n int) bool {
	if n < 2 {
		return false
	}
	for d := 2; d*d <= n; d++ {
		if n%d == 0 {
			return false
		}
	}
	return true
}`,
  "sum-digits": `func digitSum(n int) int {
	value := n
	if value < 0 {
		value = -value
	}
	total := 0
	for value > 0 {
		total += value % 10
		value /= 10
	}
	return total
}`,
  "best-time-stock": `func maxProfit(prices []int) int {
	lowest := prices[0]
	best := 0
	for _, price := range prices {
		if price < lowest {
			lowest = price
		}
		if price-lowest > best {
			best = price - lowest
		}
	}
	return best
}`,
  "binary-search": `func binarySearch(nums []int, target int) int {
	low, high := 0, len(nums)-1
	for low <= high {
		mid := (low + high) / 2
		if nums[mid] == target {
			return mid
		}
		if nums[mid] < target {
			low = mid + 1
		} else {
			high = mid - 1
		}
	}
	return -1
}`,
  "group-anagrams": `func countAnagramGroups(words []string) int {
	keys := map[string]bool{}
	for _, word := range words {
		letters := []rune(word)
		for i := 1; i < len(letters); i++ {
			for j := i; j > 0 && letters[j] < letters[j-1]; j-- {
				letters[j], letters[j-1] = letters[j-1], letters[j]
			}
		}
		keys[string(letters)] = true
	}
	return len(keys)
}`,
  "fib-recursion": `func fibonacci(n int) []int {
	out := make([]int, n)
	a, b := 0, 1
	for i := 0; i < n; i++ {
		out[i] = a
		a, b = b, a+b
	}
	return out
}`,
  "freq-count": `func frequencyReport(nums []int) string {
	counts := map[int]int{}
	order := []int{}
	for _, n := range nums {
		if counts[n] == 0 {
			order = append(order, n)
		}
		counts[n]++
	}
	parts := []string{}
	for _, n := range order {
		if counts[n] > 1 {
			parts = append(parts, fmt.Sprint(n)+":"+fmt.Sprint(counts[n]))
		}
	}
	if len(parts) == 0 {
		return "none"
	}
	return strings.Join(parts, ",")
}`,
  "longest-common-prefix": `func longestCommonPrefix(words []string) string {
	if len(words) == 0 {
		return ""
	}
	prefix := words[0]
	for _, word := range words[1:] {
		for !strings.HasPrefix(word, prefix) {
			prefix = prefix[:len(prefix)-1]
		}
	}
	return prefix
}`,
  "majority-element": `func majorityElement(nums []int) int {
	count := 0
	candidate := nums[0]
	for _, n := range nums {
		if count == 0 {
			candidate = n
		}
		if n == candidate {
			count++
		} else {
			count--
		}
	}
	return candidate
}`,
  "reverse-linked-list": `func reverseInteger(n int) int {
	value := n
	if value < 0 {
		value = -value
	}
	reversed := 0
	for value > 0 {
		reversed = reversed*10 + value%10
		value /= 10
	}
	if n < 0 {
		reversed = -reversed
	}
	if reversed < -2147483648 || reversed > 2147483647 {
		return 0
	}
	return reversed
}`,
  "reverse-words": `func reverseWords(s string) string {
	words := strings.Fields(s)
	for i, j := 0, len(words)-1; i < j; i, j = i+1, j-1 {
		words[i], words[j] = words[j], words[i]
	}
	return strings.Join(words, " ")
}`,
  "rotate-k": `func rotateRight(nums []int, k int) []int {
	n := len(nums)
	if n == 0 {
		return []int{}
	}
	shift := k % n
	out := make([]int, n)
	for i := 0; i < n; i++ {
		out[(i+shift)%n] = nums[i]
	}
	return out
}`,
  "run-length-encode": `func runLengthEncode(s string) string {
	var out strings.Builder
	i := 0
	for i < len(s) {
		run := 1
		for i+run < len(s) && s[i+run] == s[i] {
			run++
		}
		out.WriteByte(s[i])
		out.WriteString(fmt.Sprint(run))
		i += run
	}
	return out.String()
}`,
  "two-sum": `func twoSum(nums []int, target int) []int {
	seen := map[int]int{}
	for i, n := range nums {
		if j, ok := seen[target-n]; ok {
			if i < j {
				return []int{i, j}
			}
			return []int{j, i}
		}
		seen[n] = i
	}
	return []int{}
}`,
  "valid-parens": `func isValidParens(s string) bool {
	stack := []rune{}
	for _, ch := range s {
		if ch == '(' || ch == '[' || ch == '{' {
			stack = append(stack, ch)
			continue
		}
		if len(stack) == 0 {
			return false
		}
		want := '{'
		if ch == ')' {
			want = '('
		} else if ch == ']' {
			want = '['
		}
		if stack[len(stack)-1] != want {
			return false
		}
		stack = stack[:len(stack)-1]
	}
	return len(stack) == 0
}`,
  "key-value-zip": `func zipKeys(keys []string, values []string) int {
	table := map[string]string{}
	for i, key := range keys {
		table[key] = values[i]
	}
	return len(table)
}`,
  "palindromic-substrings": `func palindromicSubstrings(s string) []string {
	out := []string{}
	for i := 0; i < len(s); i++ {
		for j := i; j < len(s); j++ {
			ok := true
			for l, r := i, j; l < r; l, r = l+1, r-1 {
				if s[l] != s[r] {
					ok = false
					break
				}
			}
			if ok {
				out = append(out, s[i:j+1])
			}
		}
	}
	return out
}`,
  "caesar-cipher": `func caesar(text string, k int) string {
	shift := ((k % 26) + 26) % 26
	var out strings.Builder
	for _, ch := range text {
		switch {
		case ch >= 'A' && ch <= 'Z':
			out.WriteRune('A' + (ch-'A'+rune(shift))%26)
		case ch >= 'a' && ch <= 'z':
			out.WriteRune('a' + (ch-'a'+rune(shift))%26)
		default:
			out.WriteRune(ch)
		}
	}
	return out.String()
}`,
  "pair-sum-sorted": `func pairSumSorted(nums []int, target int) bool {
	i, j := 0, len(nums)-1
	for i < j {
		sum := nums[i] + nums[j]
		if sum == target {
			return true
		}
		if sum < target {
			i++
		} else {
			j--
		}
	}
	return false
}`,
  "pascal-row": `func pascalRow(n int) []int {
	row := []int{1}
	for step := 1; step <= n; step++ {
		next := make([]int, len(row)+1)
		next[0] = 1
		next[len(next)-1] = 1
		for j := 1; j < len(row); j++ {
			next[j] = row[j-1] + row[j]
		}
		row = next
	}
	return row
}`,
  "roman-to-int": `func romanToInt(s string) int {
	total := 0
	for i := 0; i < len(s); i++ {
		current := romanValue(s[i])
		next := 0
		if i+1 < len(s) {
			next = romanValue(s[i+1])
		}
		if current < next {
			total -= current
		} else {
			total += current
		}
	}
	return total
}

func romanValue(ch byte) int {
	switch ch {
	case 'I':
		return 1
	case 'V':
		return 5
	case 'X':
		return 10
	case 'L':
		return 50
	case 'C':
		return 100
	case 'D':
		return 500
	default:
		return 1000
	}
}`,
  "min-stack": `func simulateStack(ops []string) []int {
	stack := []int{}
	for _, op := range ops {
		if strings.HasPrefix(op, "push:") {
			value := 0
			fmt.Sscan(op[5:], &value)
			stack = append(stack, value)
		} else if op == "pop" && len(stack) > 0 {
			stack = stack[:len(stack)-1]
		}
	}
	return stack
}`,
  "matrix-transpose": `func transpose(grid [][]int) [][]int {
	if len(grid) == 0 {
		return [][]int{}
	}
	rows := len(grid)
	cols := len(grid[0])
	out := make([][]int, cols)
	for c := 0; c < cols; c++ {
		out[c] = make([]int, rows)
		for r := 0; r < rows; r++ {
			out[c][r] = grid[r][c]
		}
	}
	return out
}`,
  "climb-stairs": `func climbStairs(n int) int {
	if n <= 2 {
		return n
	}
	a, b := 1, 2
	for i := 3; i <= n; i++ {
		a, b = b, a+b
	}
	return b
}`,
  "longest-substring": `func longestUniqueSubstring(s string) int {
	lastSeen := map[byte]int{}
	left := 0
	best := 0
	for right := 0; right < len(s); right++ {
		if seen, ok := lastSeen[s[right]]; ok && seen >= left {
			left = seen + 1
		}
		lastSeen[s[right]] = right
		if right-left+1 > best {
			best = right - left + 1
		}
	}
	return best
}`,
  "max-subarray": `func maxSubarray(nums []int) int {
	running := nums[0]
	best := nums[0]
	for _, n := range nums[1:] {
		if running+n > n {
			running += n
		} else {
			running = n
		}
		if running > best {
			best = running
		}
	}
	return best
}`,
  "top-k-frequent": `func topKFrequent(nums []int, k int) []int {
	counts := map[int]int{}
	values := []int{}
	for _, n := range nums {
		if counts[n] == 0 {
			values = append(values, n)
		}
		counts[n]++
	}
	// Most frequent first, ties in ascending value order.
	for i := 1; i < len(values); i++ {
		for j := i; j > 0; j-- {
			left, right := values[j-1], values[j]
			if counts[right] > counts[left] || (counts[right] == counts[left] && right < left) {
				values[j-1], values[j] = right, left
			} else {
				break
			}
		}
	}
	return values[:k]
}`,
  "longest-palindrome": `func longestPalindrome(s string) string {
	if len(s) == 0 {
		return ""
	}
	expand := func(left int, right int) int {
		for left >= 0 && right < len(s) && s[left] == s[right] {
			left--
			right++
		}
		return right - left - 1
	}
	bestStart := 0
	bestLength := 1
	for i := 0; i < len(s); i++ {
		length := expand(i, i)
		if even := expand(i, i+1); even > length {
			length = even
		}
		if length > bestLength {
			bestLength = length
			bestStart = i - (length-1)/2
		}
	}
	return s[bestStart : bestStart+bestLength]
}`,
  "merge-intervals": `func mergeIntervals(s string) string {
	if s == "" {
		return ""
	}
	type pair struct{ start, end int }
	intervals := []pair{}
	for _, chunkText := range strings.Split(s, ";") {
		if chunkText == "" {
			continue
		}
		parts := strings.Split(chunkText, ",")
		start, end := 0, 0
		fmt.Sscan(parts[0], &start)
		fmt.Sscan(parts[1], &end)
		intervals = append(intervals, pair{start, end})
	}
	for i := 1; i < len(intervals); i++ {
		for j := i; j > 0 && intervals[j].start < intervals[j-1].start; j-- {
			intervals[j], intervals[j-1] = intervals[j-1], intervals[j]
		}
	}
	merged := []pair{}
	for _, interval := range intervals {
		if len(merged) > 0 && interval.start <= merged[len(merged)-1].end {
			if interval.end > merged[len(merged)-1].end {
				merged[len(merged)-1].end = interval.end
			}
		} else {
			merged = append(merged, interval)
		}
	}
	parts := make([]string, len(merged))
	for i, interval := range merged {
		parts[i] = fmt.Sprint(interval.start) + "," + fmt.Sprint(interval.end)
	}
	return strings.Join(parts, ";")
}`,
  "recursive-salaries": `func sumSalaries(json string) int {
	// Every "salary" number in the text, wherever it sits in the tree.
	total := 0
	pos := 0
	for {
		found := strings.Index(json[pos:], "\\"salary\\"")
		if found < 0 {
			break
		}
		pos += found + len("\\"salary\\"")
		i := pos
		for i < len(json) && !(json[i] == '-' || (json[i] >= '0' && json[i] <= '9')) {
			i++
		}
		negative := i < len(json) && json[i] == '-'
		if negative {
			i++
		}
		value := 0
		for i < len(json) && json[i] >= '0' && json[i] <= '9' {
			value = value*10 + int(json[i]-'0')
			i++
		}
		if negative {
			total -= value
		} else {
			total += value
		}
		pos = i
	}
	return total
}`,
  "coin-change": `func fewestCoins(coins []int, amount int) int {
	unreachable := amount + 1
	dp := make([]int, amount+1)
	for i := 1; i <= amount; i++ {
		dp[i] = unreachable
	}
	for value := 1; value <= amount; value++ {
		for _, coin := range coins {
			if coin <= value && dp[value-coin]+1 < dp[value] {
				dp[value] = dp[value-coin] + 1
			}
		}
	}
	if dp[amount] == unreachable {
		return -1
	}
	return dp[amount]
}`,
  lis: `func lisLength(nums []int) int {
	if len(nums) == 0 {
		return 0
	}
	dp := make([]int, len(nums))
	best := 1
	for i := range nums {
		dp[i] = 1
		for j := 0; j < i; j++ {
			if nums[j] < nums[i] && dp[j]+1 > dp[i] {
				dp[i] = dp[j] + 1
			}
		}
		if dp[i] > best {
			best = dp[i]
		}
	}
	return best
}`,
  "trapping-rain": `func trapRain(height []int) int {
	left, right := 0, len(height)-1
	leftMax, rightMax, water := 0, 0, 0
	for left < right {
		if height[left] < height[right] {
			if height[left] > leftMax {
				leftMax = height[left]
			}
			water += leftMax - height[left]
			left++
		} else {
			if height[right] > rightMax {
				rightMax = height[right]
			}
			water += rightMax - height[right]
			right--
		}
	}
	return water
}`,
  "median-two-sorted": `func medianSorted(a []int, b []int) float64 {
	merged := append(append([]int{}, a...), b...)
	for i := 1; i < len(merged); i++ {
		for j := i; j > 0 && merged[j] < merged[j-1]; j-- {
			merged[j], merged[j-1] = merged[j-1], merged[j]
		}
	}
	mid := len(merged) / 2
	if len(merged)%2 == 1 {
		return float64(merged[mid])
	}
	return float64(merged[mid-1]+merged[mid]) / 2
}`,
};
