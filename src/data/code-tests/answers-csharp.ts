/**
 * C# translations of the worked answers.
 *
 * The C# starter is a method inside `class Program`, so each answer here is
 * that method — paste it over the stub in the editor. `System` and
 * `System.Linq` are already imported by the starter.
 */
export const CSHARP_ANSWERS: Record<string, string> = {
  "echo-lines": `static string[] numberLines(string[] lines) {
    string[] result = new string[lines.Length];
    for (int i = 0; i < lines.Length; i++) result[i] = (i + 1) + ": " + lines[i];
    return result;
}`,
  "hello-output": `static string greet(string name) {
    return "Hello, " + name + "!";
}`,
  "sum-array": `static int sumNumbers(int[] nums) {
    int total = 0;
    foreach (int n in nums) total += n;
    return total;
}`,
  "vowel-count": `static int countVowels(string text) {
    int count = 0;
    foreach (char ch in text.ToLowerInvariant()) {
        if ("aeiou".IndexOf(ch) >= 0) count++;
    }
    return count;
}`,
  "two-arrays-equal": `static bool sameOrder(int[] a, int[] b) {
    return a.SequenceEqual(b);
}`,
  "count-evens": `static int countEvens(int[] nums) {
    int evens = 0;
    foreach (int n in nums) if (n % 2 == 0) evens++;
    return evens;
}`,
  "largest-smallest": `static int[] smallestAndLargest(int[] nums) {
    int small = nums[0];
    int large = nums[0];
    foreach (int n in nums) {
        if (n < small) small = n;
        if (n > large) large = n;
    }
    return new int[] { small, large };
}`,
  "palindrome-number": `static bool isPalindromeNumber(int n) {
    if (n < 0) return false;
    string text = n.ToString();
    for (int i = 0, j = text.Length - 1; i < j; i++, j--) {
        if (text[i] != text[j]) return false;
    }
    return true;
}`,
  "remove-duplicates": `static int[] dedupe(int[] nums) {
    HashSet<int> seen = new HashSet<int>();
    List<int> result = new List<int>();
    foreach (int n in nums) {
        if (seen.Add(n)) result.Add(n);
    }
    return result.ToArray();
}`,
  "reverse-text": `static string reverseText(string text) {
    char[] chars = text.ToCharArray();
    Array.Reverse(chars);
    return new string(chars);
}`,
  "reverse-no-builtin": `static int[] reverseArray(int[] nums) {
    int[] result = (int[])nums.Clone();
    int i = 0;
    int j = result.Length - 1;
    while (i < j) {
        int tmp = result[i];
        result[i] = result[j];
        result[j] = tmp;
        i++;
        j--;
    }
    return result;
}`,
  "second-largest": `static int secondLargest(int[] nums) {
    long best = long.MinValue;
    long second = long.MinValue;
    foreach (int n in nums) {
        if (n > best) {
            second = best;
            best = n;
        } else if (n < best && n > second) {
            second = n;
        }
    }
    return second == long.MinValue ? -1 : (int)second;
}`,
  "title-case": `static string titleCase(string text) {
    string[] words = text.Split(' ');
    for (int i = 0; i < words.Length; i++) {
        if (words[i].Length > 0) {
            words[i] = char.ToUpperInvariant(words[i][0]) + words[i].Substring(1).ToLowerInvariant();
        }
    }
    return string.Join(" ", words);
}`,
  "word-count": `static int countWords(string text) {
    int count = 0;
    bool inWord = false;
    foreach (char ch in text) {
        if (char.IsWhiteSpace(ch)) {
            inWord = false;
        } else if (!inWord) {
            inWord = true;
            count++;
        }
    }
    return count;
}`,
  "anagram-check": `static bool isAnagram(string a, string b) {
    char[] x = a.ToLowerInvariant().ToCharArray();
    char[] y = b.ToLowerInvariant().ToCharArray();
    Array.Sort(x);
    Array.Sort(y);
    return x.SequenceEqual(y);
}`,
  "array-chunk": `static string[] chunk(int[] nums, int size) {
    List<string> rows = new List<string>();
    for (int i = 0; i < nums.Length; i += size) {
        List<string> parts = new List<string>();
        for (int j = i; j < Math.Min(i + size, nums.Length); j++) parts.Add(nums[j].ToString());
        rows.Add(string.Join(",", parts));
    }
    return rows.ToArray();
}`,
  "binary-bits": `static int countSetBits(int n) {
    int count = 0;
    while (n > 0) {
        n &= n - 1;
        count++;
    }
    return count;
}`,
  factorial: `static int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) result *= i;
    return result;
}`,
  "missing-number": `static int missingNumber(int n, int[] nums) {
    int expected = n * (n + 1) / 2;
    int actual = nums.Sum();
    return expected - actual;
}`,
  "find-duplicates": `static int[] findDuplicates(int[] nums) {
    HashSet<int> seen = new HashSet<int>();
    HashSet<int> reported = new HashSet<int>();
    List<int> result = new List<int>();
    foreach (int n in nums) {
        if (seen.Contains(n) && reported.Add(n)) result.Add(n);
        seen.Add(n);
    }
    return result.ToArray();
}`,
  fizzbuzz: `static string[] fizzBuzz(int n) {
    string[] rows = new string[n];
    for (int i = 1; i <= n; i++) {
        if (i % 15 == 0) rows[i - 1] = "FizzBuzz";
        else if (i % 3 == 0) rows[i - 1] = "Fizz";
        else if (i % 5 == 0) rows[i - 1] = "Buzz";
        else rows[i - 1] = i.ToString();
    }
    return rows;
}`,
  "gcd-lcm": `static int[] gcdAndLcm(int a, int b) {
    int x = a;
    int y = b;
    while (y != 0) {
        int t = x % y;
        x = y;
        y = t;
    }
    return new int[] { x, (a / x) * b };
}`,
  "grade-letter": `static string gradeLetter(int score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
}`,
  intersection: `static int[] intersection(int[] a, int[] b) {
    HashSet<int> inB = new HashSet<int>(b);
    HashSet<int> added = new HashSet<int>();
    List<int> result = new List<int>();
    foreach (int n in a) {
        if (inB.Contains(n) && added.Add(n)) result.Add(n);
    }
    return result.ToArray();
}`,
  "merge-sorted": `static int[] mergeSorted(int[] a, int[] b) {
    int[] result = new int[a.Length + b.Length];
    int i = 0;
    int j = 0;
    int k = 0;
    while (i < a.Length && j < b.Length) result[k++] = a[i] <= b[j] ? a[i++] : b[j++];
    while (i < a.Length) result[k++] = a[i++];
    while (j < b.Length) result[k++] = b[j++];
    return result;
}`,
  "move-zeros": `static int[] moveZeros(int[] nums) {
    int[] result = new int[nums.Length];
    int k = 0;
    foreach (int n in nums) if (n != 0) result[k++] = n;
    return result;
}`,
  "multiply-table": `static string[] multiplicationTable(int n) {
    string[] rows = new string[5];
    for (int i = 1; i <= 5; i++) rows[i - 1] = n + " x " + i + " = " + (n * i);
    return rows;
}`,
  "is-prime": `static bool isPrime(int n) {
    if (n < 2) return false;
    for (int d = 2; d * d <= n; d++) {
        if (n % d == 0) return false;
    }
    return true;
}`,
  "sum-digits": `static int digitSum(int n) {
    long value = Math.Abs((long)n);
    int total = 0;
    while (value > 0) {
        total += (int)(value % 10);
        value /= 10;
    }
    return total;
}`,
  "best-time-stock": `static int maxProfit(int[] prices) {
    int lowest = int.MaxValue;
    int best = 0;
    foreach (int price in prices) {
        if (price < lowest) lowest = price;
        if (price - lowest > best) best = price - lowest;
    }
    return best;
}`,
  "binary-search": `static int binarySearch(int[] nums, int target) {
    int low = 0;
    int high = nums.Length - 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
  "group-anagrams": `static int countAnagramGroups(string[] words) {
    HashSet<string> keys = new HashSet<string>();
    foreach (string word in words) {
        char[] chars = word.ToCharArray();
        Array.Sort(chars);
        keys.Add(new string(chars));
    }
    return keys.Count;
}`,
  "fib-recursion": `static int[] fibonacci(int n) {
    int[] result = new int[n];
    int a = 0;
    int b = 1;
    for (int i = 0; i < n; i++) {
        result[i] = a;
        int next = a + b;
        a = b;
        b = next;
    }
    return result;
}`,
  "freq-count": `static string frequencyReport(int[] nums) {
    Dictionary<int, int> counts = new Dictionary<int, int>();
    List<int> order = new List<int>();
    foreach (int n in nums) {
        if (!counts.ContainsKey(n)) {
            order.Add(n);
            counts[n] = 0;
        }
        counts[n]++;
    }
    List<string> parts = new List<string>();
    foreach (int n in order) {
        if (counts[n] > 1) parts.Add(n + ":" + counts[n]);
    }
    return parts.Count == 0 ? "none" : string.Join(",", parts);
}`,
  "longest-common-prefix": `static string longestCommonPrefix(string[] words) {
    if (words.Length == 0) return "";
    string prefix = words[0];
    for (int i = 1; i < words.Length; i++) {
        while (!words[i].StartsWith(prefix)) {
            prefix = prefix.Substring(0, prefix.Length - 1);
        }
    }
    return prefix;
}`,
  "majority-element": `static int majorityElement(int[] nums) {
    int count = 0;
    int candidate = nums[0];
    foreach (int n in nums) {
        if (count == 0) candidate = n;
        count += n == candidate ? 1 : -1;
    }
    return candidate;
}`,
  "reverse-linked-list": `static int reverseInteger(int n) {
    long value = Math.Abs((long)n);
    long reversed = 0;
    while (value > 0) {
        reversed = reversed * 10 + value % 10;
        value /= 10;
    }
    long result = n < 0 ? -reversed : reversed;
    if (result < -2147483648L || result > 2147483647L) return 0;
    return (int)result;
}`,
  "reverse-words": `static string reverseWords(string s) {
    List<string> words = new List<string>();
    foreach (string word in s.Split(' ')) {
        if (word.Length > 0) words.Add(word);
    }
    words.Reverse();
    return string.Join(" ", words);
}`,
  "rotate-k": `static int[] rotateRight(int[] nums, int k) {
    int n = nums.Length;
    if (n == 0) return new int[0];
    int shift = ((k % n) + n) % n;
    int[] result = new int[n];
    for (int i = 0; i < n; i++) result[(i + shift) % n] = nums[i];
    return result;
}`,
  "run-length-encode": `static string runLengthEncode(string s) {
    System.Text.StringBuilder outText = new System.Text.StringBuilder();
    int i = 0;
    while (i < s.Length) {
        int run = 1;
        while (i + run < s.Length && s[i + run] == s[i]) run++;
        outText.Append(s[i]).Append(run);
        i += run;
    }
    return outText.ToString();
}`,
  "two-sum": `static int[] twoSum(int[] nums, int target) {
    Dictionary<int, int> seen = new Dictionary<int, int>();
    for (int i = 0; i < nums.Length; i++) {
        int j;
        if (seen.TryGetValue(target - nums[i], out j)) {
            return new int[] { Math.Min(i, j), Math.Max(i, j) };
        }
        seen[nums[i]] = i;
    }
    return new int[0];
}`,
  "valid-parens": `static bool isValidParens(string s) {
    Stack<char> stack = new Stack<char>();
    foreach (char ch in s) {
        if (ch == '(' || ch == '[' || ch == '{') {
            stack.Push(ch);
        } else {
            char want = ch == ')' ? '(' : ch == ']' ? '[' : '{';
            if (stack.Count == 0 || stack.Pop() != want) return false;
        }
    }
    return stack.Count == 0;
}`,
  "key-value-zip": `static int zipKeys(string[] keys, string[] values) {
    Dictionary<string, string> map = new Dictionary<string, string>();
    for (int i = 0; i < keys.Length; i++) map[keys[i]] = values[i];
    return map.Count;
}`,
  "palindromic-substrings": `static string[] palindromicSubstrings(string s) {
    List<string> result = new List<string>();
    for (int i = 0; i < s.Length; i++) {
        for (int j = i; j < s.Length; j++) {
            bool ok = true;
            for (int l = i, r = j; l < r; l++, r--) {
                if (s[l] != s[r]) {
                    ok = false;
                    break;
                }
            }
            if (ok) result.Add(s.Substring(i, j - i + 1));
        }
    }
    return result.ToArray();
}`,
  "caesar-cipher": `static string caesar(string text, int k) {
    int shift = ((k % 26) + 26) % 26;
    char[] result = new char[text.Length];
    for (int i = 0; i < text.Length; i++) {
        char ch = text[i];
        if (ch >= 'A' && ch <= 'Z') {
            result[i] = (char)((ch - 'A' + shift) % 26 + 'A');
        } else if (ch >= 'a' && ch <= 'z') {
            result[i] = (char)((ch - 'a' + shift) % 26 + 'a');
        } else {
            result[i] = ch;
        }
    }
    return new string(result);
}`,
  "pair-sum-sorted": `static bool pairSumSorted(int[] nums, int target) {
    int i = 0;
    int j = nums.Length - 1;
    while (i < j) {
        int sum = nums[i] + nums[j];
        if (sum == target) return true;
        if (sum < target) i++;
        else j--;
    }
    return false;
}`,
  "pascal-row": `static int[] pascalRow(int n) {
    int[] row = new int[] { 1 };
    for (int step = 1; step <= n; step++) {
        int[] next = new int[row.Length + 1];
        next[0] = 1;
        next[next.Length - 1] = 1;
        for (int j = 1; j < row.Length; j++) next[j] = row[j - 1] + row[j];
        row = next;
    }
    return row;
}`,
  "roman-to-int": `static int romanToInt(string s) {
    int total = 0;
    for (int i = 0; i < s.Length; i++) {
        int current = romanValue(s[i]);
        int next = i + 1 < s.Length ? romanValue(s[i + 1]) : 0;
        total += current < next ? -current : current;
    }
    return total;
}

static int romanValue(char ch) {
    switch (ch) {
        case 'I': return 1;
        case 'V': return 5;
        case 'X': return 10;
        case 'L': return 50;
        case 'C': return 100;
        case 'D': return 500;
        default: return 1000;
    }
}`,
  "min-stack": `static int[] simulateStack(string[] ops) {
    List<int> stack = new List<int>();
    foreach (string op in ops) {
        if (op.StartsWith("push:")) {
            stack.Add(int.Parse(op.Substring(5)));
        } else if (op == "pop" && stack.Count > 0) {
            stack.RemoveAt(stack.Count - 1);
        }
    }
    return stack.ToArray();
}`,
  "matrix-transpose": `static int[][] transpose(int[][] grid) {
    if (grid.Length == 0) return new int[0][];
    int rows = grid.Length;
    int cols = grid[0].Length;
    int[][] result = new int[cols][];
    for (int c = 0; c < cols; c++) result[c] = new int[rows];
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) result[c][r] = grid[r][c];
    }
    return result;
}`,
  "climb-stairs": `static int climbStairs(int n) {
    if (n <= 2) return n;
    int a = 1;
    int b = 2;
    for (int i = 3; i <= n; i++) {
        int next = a + b;
        a = b;
        b = next;
    }
    return b;
}`,
  "longest-substring": `static int longestUniqueSubstring(string s) {
    Dictionary<char, int> lastSeen = new Dictionary<char, int>();
    int left = 0;
    int best = 0;
    for (int right = 0; right < s.Length; right++) {
        char ch = s[right];
        int seen;
        if (lastSeen.TryGetValue(ch, out seen) && seen >= left) left = seen + 1;
        lastSeen[ch] = right;
        best = Math.Max(best, right - left + 1);
    }
    return best;
}`,
  "max-subarray": `static int maxSubarray(int[] nums) {
    int running = nums[0];
    int best = nums[0];
    for (int i = 1; i < nums.Length; i++) {
        running = Math.Max(nums[i], running + nums[i]);
        best = Math.Max(best, running);
    }
    return best;
}`,
  "top-k-frequent": `static int[] topKFrequent(int[] nums, int k) {
    Dictionary<int, int> counts = new Dictionary<int, int>();
    foreach (int n in nums) {
        if (!counts.ContainsKey(n)) counts[n] = 0;
        counts[n]++;
    }
    return counts.Keys
        .OrderByDescending(key => counts[key])
        .ThenBy(key => key)
        .Take(k)
        .ToArray();
}`,
  "longest-palindrome": `static string longestPalindrome(string s) {
    if (s.Length == 0) return "";
    int bestStart = 0;
    int bestLength = 1;
    for (int i = 0; i < s.Length; i++) {
        int odd = expandAround(s, i, i);
        int even = expandAround(s, i, i + 1);
        int length = Math.Max(odd, even);
        if (length > bestLength) {
            bestLength = length;
            bestStart = i - (length - 1) / 2;
        }
    }
    return s.Substring(bestStart, bestLength);
}

static int expandAround(string s, int left, int right) {
    while (left >= 0 && right < s.Length && s[left] == s[right]) {
        left--;
        right++;
    }
    return right - left - 1;
}`,
  "merge-intervals": `static string mergeIntervals(string s) {
    if (s.Length == 0) return "";
    List<int[]> intervals = new List<int[]>();
    foreach (string pair in s.Split(';')) {
        if (pair.Length == 0) continue;
        string[] parts = pair.Split(',');
        intervals.Add(new int[] { int.Parse(parts[0]), int.Parse(parts[1]) });
    }
    intervals.Sort((x, y) => x[0] - y[0]);
    List<int[]> merged = new List<int[]>();
    foreach (int[] interval in intervals) {
        int[] last = merged.Count == 0 ? null : merged[merged.Count - 1];
        if (last != null && interval[0] <= last[1]) last[1] = Math.Max(last[1], interval[1]);
        else merged.Add(new int[] { interval[0], interval[1] });
    }
    List<string> parts2 = new List<string>();
    foreach (int[] interval in merged) parts2.Add(interval[0] + "," + interval[1]);
    return string.Join(";", parts2);
}`,
  "recursive-salaries": `static int sumSalaries(string json) {
    // Every "salary" number in the text, wherever it sits in the tree.
    string needle = "\\"salary\\"";
    int total = 0;
    int pos = 0;
    while (true) {
        int found = json.IndexOf(needle, pos, StringComparison.Ordinal);
        if (found < 0) break;
        pos = found + needle.Length;
        while (pos < json.Length && !(json[pos] == '-' || (json[pos] >= '0' && json[pos] <= '9'))) pos++;
        bool negative = pos < json.Length && json[pos] == '-';
        if (negative) pos++;
        int value = 0;
        while (pos < json.Length && json[pos] >= '0' && json[pos] <= '9') {
            value = value * 10 + (json[pos] - '0');
            pos++;
        }
        total += negative ? -value : value;
    }
    return total;
}`,
    "coin-change": `static int fewestCoins(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    for (int i = 0; i <= amount; i++) dp[i] = int.MaxValue;
    dp[0] = 0;
    for (int value = 1; value <= amount; value++) {
        foreach (int coin in coins) {
            if (coin <= value && dp[value - coin] != int.MaxValue) {
                dp[value] = Math.Min(dp[value], dp[value - coin] + 1);
            }
        }
    }
    return dp[amount] == int.MaxValue ? -1 : dp[amount];
}`,
  lis: `static int lisLength(int[] nums) {
    if (nums.Length == 0) return 0;
    int[] dp = new int[nums.Length];
    for (int i = 0; i < dp.Length; i++) dp[i] = 1;
    int best = 1;
    for (int i = 0; i < nums.Length; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) dp[i] = Math.Max(dp[i], dp[j] + 1);
        }
        best = Math.Max(best, dp[i]);
    }
    return best;
}`,
  "trapping-rain": `static int trapRain(int[] height) {
    int left = 0;
    int right = height.Length - 1;
    int leftMax = 0;
    int rightMax = 0;
    int water = 0;
    while (left < right) {
        if (height[left] < height[right]) {
            leftMax = Math.Max(leftMax, height[left]);
            water += leftMax - height[left];
            left++;
        } else {
            rightMax = Math.Max(rightMax, height[right]);
            water += rightMax - height[right];
            right--;
        }
    }
    return water;
}`,
  "median-two-sorted": `static double medianSorted(int[] a, int[] b) {
    int[] merged = new int[a.Length + b.Length];
    Array.Copy(a, 0, merged, 0, a.Length);
    Array.Copy(b, 0, merged, a.Length, b.Length);
    Array.Sort(merged);
    int mid = merged.Length / 2;
    if (merged.Length % 2 == 1) return merged[mid];
    return (merged[mid - 1] + merged[mid]) / 2.0;
}`,
};
