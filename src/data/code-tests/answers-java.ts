/**
 * Java translations of the worked answers.
 *
 * The Java starter is a method inside `class Main`, so each answer here is that
 * method — paste it over the stub in the editor. `java.util.*` is already
 * imported by the starter.
 */
export const JAVA_ANSWERS: Record<string, string> = {
  "echo-lines": `static String[] numberLines(String[] lines) {
    String[] out = new String[lines.length];
    for (int i = 0; i < lines.length; i++) out[i] = (i + 1) + ": " + lines[i];
    return out;
}`,
  "hello-output": `static String greet(String name) {
    return "Hello, " + name + "!";
}`,
  "sum-array": `static int sumNumbers(int[] nums) {
    int total = 0;
    for (int n : nums) total += n;
    return total;
}`,
  "vowel-count": `static int countVowels(String text) {
    int count = 0;
    for (char ch : text.toLowerCase().toCharArray()) {
        if ("aeiou".indexOf(ch) >= 0) count++;
    }
    return count;
}`,
  "two-arrays-equal": `static boolean sameOrder(int[] a, int[] b) {
    return Arrays.equals(a, b);
}`,
  "count-evens": `static int countEvens(int[] nums) {
    int evens = 0;
    for (int n : nums) if (n % 2 == 0) evens++;
    return evens;
}`,
  "largest-smallest": `static int[] smallestAndLargest(int[] nums) {
    int small = nums[0];
    int large = nums[0];
    for (int n : nums) {
        if (n < small) small = n;
        if (n > large) large = n;
    }
    return new int[] { small, large };
}`,
  "palindrome-number": `static boolean isPalindromeNumber(int n) {
    if (n < 0) return false;
    String text = String.valueOf(n);
    for (int i = 0, j = text.length() - 1; i < j; i++, j--) {
        if (text.charAt(i) != text.charAt(j)) return false;
    }
    return true;
}`,
  "remove-duplicates": `static int[] dedupe(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    List<Integer> out = new ArrayList<>();
    for (int n : nums) {
        if (seen.add(n)) out.add(n);
    }
    int[] result = new int[out.size()];
    for (int i = 0; i < out.size(); i++) result[i] = out.get(i);
    return result;
}`,
  "reverse-text": `static String reverseText(String text) {
    return new StringBuilder(text).reverse().toString();
}`,
  "reverse-no-builtin": `static int[] reverseArray(int[] nums) {
    int[] out = nums.clone();
    int i = 0;
    int j = out.length - 1;
    while (i < j) {
        int tmp = out[i];
        out[i] = out[j];
        out[j] = tmp;
        i++;
        j--;
    }
    return out;
}`,
  "second-largest": `static int secondLargest(int[] nums) {
    long best = Long.MIN_VALUE;
    long second = Long.MIN_VALUE;
    for (int n : nums) {
        if (n > best) {
            second = best;
            best = n;
        } else if (n < best && n > second) {
            second = n;
        }
    }
    return second == Long.MIN_VALUE ? -1 : (int) second;
}`,
  "title-case": `static String titleCase(String text) {
    String[] words = text.split(" ", -1);
    for (int i = 0; i < words.length; i++) {
        if (!words[i].isEmpty()) {
            words[i] = words[i].substring(0, 1).toUpperCase() + words[i].substring(1).toLowerCase();
        }
    }
    return String.join(" ", words);
}`,
  "word-count": `static int countWords(String text) {
    String trimmed = text.trim();
    return trimmed.isEmpty() ? 0 : trimmed.split("\\\\s+").length;
}`,
  "anagram-check": `static boolean isAnagram(String a, String b) {
    char[] x = a.toLowerCase().toCharArray();
    char[] y = b.toLowerCase().toCharArray();
    Arrays.sort(x);
    Arrays.sort(y);
    return Arrays.equals(x, y);
}`,
  "array-chunk": `static String[] chunk(int[] nums, int size) {
    List<String> rows = new ArrayList<>();
    for (int i = 0; i < nums.length; i += size) {
        StringBuilder row = new StringBuilder();
        for (int j = i; j < Math.min(i + size, nums.length); j++) {
            if (j > i) row.append(",");
            row.append(nums[j]);
        }
        rows.add(row.toString());
    }
    return rows.toArray(new String[0]);
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
    int actual = 0;
    for (int value : nums) actual += value;
    return expected - actual;
}`,
  "find-duplicates": `static int[] findDuplicates(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    Set<Integer> reported = new HashSet<>();
    List<Integer> out = new ArrayList<>();
    for (int n : nums) {
        if (seen.contains(n) && reported.add(n)) out.add(n);
        seen.add(n);
    }
    int[] result = new int[out.size()];
    for (int i = 0; i < out.size(); i++) result[i] = out.get(i);
    return result;
}`,
  fizzbuzz: `static String[] fizzBuzz(int n) {
    String[] rows = new String[n];
    for (int i = 1; i <= n; i++) {
        if (i % 15 == 0) rows[i - 1] = "FizzBuzz";
        else if (i % 3 == 0) rows[i - 1] = "Fizz";
        else if (i % 5 == 0) rows[i - 1] = "Buzz";
        else rows[i - 1] = String.valueOf(i);
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
  "grade-letter": `static String gradeLetter(int score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
}`,
  intersection: `static int[] intersection(int[] a, int[] b) {
    Set<Integer> inB = new HashSet<>();
    for (int n : b) inB.add(n);
    Set<Integer> added = new HashSet<>();
    List<Integer> out = new ArrayList<>();
    for (int n : a) {
        if (inB.contains(n) && added.add(n)) out.add(n);
    }
    int[] result = new int[out.size()];
    for (int i = 0; i < out.size(); i++) result[i] = out.get(i);
    return result;
}`,
  "merge-sorted": `static int[] mergeSorted(int[] a, int[] b) {
    int[] out = new int[a.length + b.length];
    int i = 0;
    int j = 0;
    int k = 0;
    while (i < a.length && j < b.length) out[k++] = a[i] <= b[j] ? a[i++] : b[j++];
    while (i < a.length) out[k++] = a[i++];
    while (j < b.length) out[k++] = b[j++];
    return out;
}`,
  "move-zeros": `static int[] moveZeros(int[] nums) {
    int[] out = new int[nums.length];
    int k = 0;
    for (int n : nums) if (n != 0) out[k++] = n;
    return out;
}`,
  "multiply-table": `static String[] multiplicationTable(int n) {
    String[] rows = new String[5];
    for (int i = 1; i <= 5; i++) rows[i - 1] = n + " x " + i + " = " + (n * i);
    return rows;
}`,
  "is-prime": `static boolean isPrime(int n) {
    if (n < 2) return false;
    for (int d = 2; d * d <= n; d++) {
        if (n % d == 0) return false;
    }
    return true;
}`,
  "sum-digits": `static int digitSum(int n) {
    long value = Math.abs((long) n);
    int total = 0;
    while (value > 0) {
        total += value % 10;
        value /= 10;
    }
    return total;
}`,
  "best-time-stock": `static int maxProfit(int[] prices) {
    int lowest = Integer.MAX_VALUE;
    int best = 0;
    for (int price : prices) {
        if (price < lowest) lowest = price;
        if (price - lowest > best) best = price - lowest;
    }
    return best;
}`,
  "binary-search": `static int binarySearch(int[] nums, int target) {
    int low = 0;
    int high = nums.length - 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
  "group-anagrams": `static int countAnagramGroups(String[] words) {
    Set<String> keys = new HashSet<>();
    for (String word : words) {
        char[] chars = word.toCharArray();
        Arrays.sort(chars);
        keys.add(new String(chars));
    }
    return keys.size();
}`,
  "fib-recursion": `static int[] fibonacci(int n) {
    int[] out = new int[n];
    int a = 0;
    int b = 1;
    for (int i = 0; i < n; i++) {
        out[i] = a;
        int next = a + b;
        a = b;
        b = next;
    }
    return out;
}`,
  "freq-count": `static String frequencyReport(int[] nums) {
    Map<Integer, Integer> counts = new LinkedHashMap<>();
    for (int n : nums) counts.put(n, counts.getOrDefault(n, 0) + 1);
    StringBuilder out = new StringBuilder();
    for (Map.Entry<Integer, Integer> entry : counts.entrySet()) {
        if (entry.getValue() <= 1) continue;
        if (out.length() > 0) out.append(",");
        out.append(entry.getKey()).append(":").append(entry.getValue());
    }
    return out.length() == 0 ? "none" : out.toString();
}`,
  "longest-common-prefix": `static String longestCommonPrefix(String[] words) {
    if (words.length == 0) return "";
    String prefix = words[0];
    for (int i = 1; i < words.length; i++) {
        while (!words[i].startsWith(prefix)) {
            prefix = prefix.substring(0, prefix.length() - 1);
        }
    }
    return prefix;
}`,
  "majority-element": `static int majorityElement(int[] nums) {
    int count = 0;
    int candidate = nums[0];
    for (int n : nums) {
        if (count == 0) candidate = n;
        count += n == candidate ? 1 : -1;
    }
    return candidate;
}`,
  "reverse-linked-list": `static int reverseInteger(int n) {
    long value = Math.abs((long) n);
    long reversed = 0;
    while (value > 0) {
        reversed = reversed * 10 + value % 10;
        value /= 10;
    }
    long result = n < 0 ? -reversed : reversed;
    if (result < -2147483648L || result > 2147483647L) return 0;
    return (int) result;
}`,
  "reverse-words": `static String reverseWords(String s) {
    String[] words = s.trim().split("\\\\s+");
    StringBuilder out = new StringBuilder();
    for (int i = words.length - 1; i >= 0; i--) {
        if (out.length() > 0) out.append(" ");
        out.append(words[i]);
    }
    return out.toString();
}`,
  "rotate-k": `static int[] rotateRight(int[] nums, int k) {
    int n = nums.length;
    if (n == 0) return new int[0];
    int shift = k % n;
    int[] out = new int[n];
    for (int i = 0; i < n; i++) out[(i + shift) % n] = nums[i];
    return out;
}`,
  "run-length-encode": `static String runLengthEncode(String s) {
    StringBuilder out = new StringBuilder();
    int i = 0;
    while (i < s.length()) {
        int run = 1;
        while (i + run < s.length() && s.charAt(i + run) == s.charAt(i)) run++;
        out.append(s.charAt(i)).append(run);
        i += run;
    }
    return out.toString();
}`,
  "two-sum": `static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        Integer j = seen.get(target - nums[i]);
        if (j != null) return new int[] { Math.min(i, j), Math.max(i, j) };
        seen.put(nums[i], i);
    }
    return new int[0];
}`,
  "valid-parens": `static boolean isValidParens(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    for (char ch : s.toCharArray()) {
        if (ch == '(' || ch == '[' || ch == '{') {
            stack.push(ch);
        } else {
            char want = ch == ')' ? '(' : ch == ']' ? '[' : '{';
            if (stack.isEmpty() || stack.pop() != want) return false;
        }
    }
    return stack.isEmpty();
}`,
  "key-value-zip": `static int zipKeys(String[] keys, String[] values) {
    Map<String, String> map = new HashMap<>();
    for (int i = 0; i < keys.length; i++) map.put(keys[i], values[i]);
    return map.size();
}`,
  "palindromic-substrings": `static String[] palindromicSubstrings(String s) {
    List<String> out = new ArrayList<>();
    for (int i = 0; i < s.length(); i++) {
        for (int j = i; j < s.length(); j++) {
            boolean ok = true;
            for (int l = i, r = j; l < r; l++, r--) {
                if (s.charAt(l) != s.charAt(r)) {
                    ok = false;
                    break;
                }
            }
            if (ok) out.add(s.substring(i, j + 1));
        }
    }
    return out.toArray(new String[0]);
}`,
  "caesar-cipher": `static String caesar(String text, int k) {
    int shift = ((k % 26) + 26) % 26;
    StringBuilder out = new StringBuilder();
    for (char ch : text.toCharArray()) {
        if (ch >= 'A' && ch <= 'Z') {
            out.append((char) ((ch - 'A' + shift) % 26 + 'A'));
        } else if (ch >= 'a' && ch <= 'z') {
            out.append((char) ((ch - 'a' + shift) % 26 + 'a'));
        } else {
            out.append(ch);
        }
    }
    return out.toString();
}`,
  "pair-sum-sorted": `static boolean pairSumSorted(int[] nums, int target) {
    int i = 0;
    int j = nums.length - 1;
    while (i < j) {
        int sum = nums[i] + nums[j];
        if (sum == target) return true;
        if (sum < target) i++;
        else j--;
    }
    return false;
}`,
  "pascal-row": `static int[] pascalRow(int n) {
    int[] row = { 1 };
    for (int step = 1; step <= n; step++) {
        int[] next = new int[row.length + 1];
        next[0] = 1;
        next[next.length - 1] = 1;
        for (int j = 1; j < row.length; j++) next[j] = row[j - 1] + row[j];
        row = next;
    }
    return row;
}`,
  "roman-to-int": `static int romanToInt(String s) {
    int total = 0;
    for (int i = 0; i < s.length(); i++) {
        int current = value(s.charAt(i));
        int next = i + 1 < s.length() ? value(s.charAt(i + 1)) : 0;
        total += current < next ? -current : current;
    }
    return total;
}

static int value(char ch) {
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
  "min-stack": `static int[] simulateStack(String[] ops) {
    List<Integer> stack = new ArrayList<>();
    for (String op : ops) {
        if (op.startsWith("push:")) {
            stack.add(Integer.parseInt(op.substring(5)));
        } else if (op.equals("pop") && !stack.isEmpty()) {
            stack.remove(stack.size() - 1);
        }
    }
    int[] out = new int[stack.size()];
    for (int i = 0; i < stack.size(); i++) out[i] = stack.get(i);
    return out;
}`,
  "matrix-transpose": `static int[][] transpose(int[][] grid) {
    if (grid.length == 0) return new int[0][0];
    int rows = grid.length;
    int cols = grid[0].length;
    int[][] out = new int[cols][rows];
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) out[c][r] = grid[r][c];
    }
    return out;
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
  "longest-substring": `static int longestUniqueSubstring(String s) {
    Map<Character, Integer> lastSeen = new HashMap<>();
    int left = 0;
    int best = 0;
    for (int right = 0; right < s.length(); right++) {
        char ch = s.charAt(right);
        Integer seen = lastSeen.get(ch);
        if (seen != null && seen >= left) left = seen + 1;
        lastSeen.put(ch, right);
        best = Math.max(best, right - left + 1);
    }
    return best;
}`,
  "max-subarray": `static int maxSubarray(int[] nums) {
    int running = nums[0];
    int best = nums[0];
    for (int i = 1; i < nums.length; i++) {
        running = Math.max(nums[i], running + nums[i]);
        best = Math.max(best, running);
    }
    return best;
}`,
  "top-k-frequent": `static int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> counts = new HashMap<>();
    for (int n : nums) counts.put(n, counts.getOrDefault(n, 0) + 1);
    List<Integer> values = new ArrayList<>(counts.keySet());
    values.sort((x, y) -> {
        int byCount = counts.get(y) - counts.get(x);
        return byCount != 0 ? byCount : x - y;
    });
    int[] out = new int[k];
    for (int i = 0; i < k; i++) out[i] = values.get(i);
    return out;
}`,
  "longest-palindrome": `static String longestPalindrome(String s) {
    if (s.isEmpty()) return "";
    int bestStart = 0;
    int bestLength = 1;
    for (int i = 0; i < s.length(); i++) {
        int odd = expand(s, i, i);
        int even = expand(s, i, i + 1);
        int length = Math.max(odd, even);
        if (length > bestLength) {
            bestLength = length;
            bestStart = i - (length - 1) / 2;
        }
    }
    return s.substring(bestStart, bestStart + bestLength);
}

static int expand(String s, int left, int right) {
    while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
        left--;
        right++;
    }
    return right - left - 1;
}`,
  "merge-intervals": `static String mergeIntervals(String s) {
    if (s.isEmpty()) return "";
    List<int[]> intervals = new ArrayList<>();
    for (String pair : s.split(";")) {
        if (pair.isEmpty()) continue;
        String[] parts = pair.split(",");
        intervals.add(new int[] { Integer.parseInt(parts[0]), Integer.parseInt(parts[1]) });
    }
    intervals.sort((x, y) -> x[0] - y[0]);
    List<int[]> merged = new ArrayList<>();
    for (int[] interval : intervals) {
        int[] last = merged.isEmpty() ? null : merged.get(merged.size() - 1);
        if (last != null && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]);
        else merged.add(new int[] { interval[0], interval[1] });
    }
    StringBuilder out = new StringBuilder();
    for (int[] interval : merged) {
        if (out.length() > 0) out.append(";");
        out.append(interval[0]).append(",").append(interval[1]);
    }
    return out.toString();
}`,
  "recursive-salaries": `static int sumSalaries(String json) {
    // Every salary anywhere in the tree, in one pass over the JSON text.
    java.util.regex.Matcher matcher =
        java.util.regex.Pattern.compile("\\"salary\\"\\\\s*:\\\\s*(-?\\\\d+)").matcher(json);
    int total = 0;
    while (matcher.find()) total += Integer.parseInt(matcher.group(1));
    return total;
}`,
  "coin-change": `static int fewestCoins(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, Integer.MAX_VALUE);
    dp[0] = 0;
    for (int value = 1; value <= amount; value++) {
        for (int coin : coins) {
            if (coin <= value && dp[value - coin] != Integer.MAX_VALUE) {
                dp[value] = Math.min(dp[value], dp[value - coin] + 1);
            }
        }
    }
    return dp[amount] == Integer.MAX_VALUE ? -1 : dp[amount];
}`,
  lis: `static int lisLength(int[] nums) {
    if (nums.length == 0) return 0;
    int[] dp = new int[nums.length];
    Arrays.fill(dp, 1);
    int best = 1;
    for (int i = 0; i < nums.length; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
        }
        best = Math.max(best, dp[i]);
    }
    return best;
}`,
  "trapping-rain": `static int trapRain(int[] height) {
    int left = 0;
    int right = height.length - 1;
    int leftMax = 0;
    int rightMax = 0;
    int water = 0;
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
  "median-two-sorted": `static double medianSorted(int[] a, int[] b) {
    int[] merged = new int[a.length + b.length];
    System.arraycopy(a, 0, merged, 0, a.length);
    System.arraycopy(b, 0, merged, a.length, b.length);
    Arrays.sort(merged);
    int mid = merged.length / 2;
    if (merged.length % 2 == 1) return merged[mid];
    return (merged[mid - 1] + merged[mid]) / 2.0;
}`,
};
