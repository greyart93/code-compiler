/**
 * C++ translations of the worked answers.
 *
 * The C++ starter already includes <iostream>, <string>, <vector>, <algorithm>,
 * <map>, <set>, <sstream> and <iomanip> and has `using namespace std;`, so each
 * answer is just the function — paste it over the stub.
 */
export const CPP_ANSWERS: Record<string, string> = {
  "echo-lines": `vector<string> numberLines(vector<string> lines) {
    vector<string> out;
    for (size_t i = 0; i < lines.size(); i++) out.push_back(to_string(i + 1) + ": " + lines[i]);
    return out;
}`,
  "hello-output": `string greet(string name) {
    return "Hello, " + name + "!";
}`,
  "sum-array": `int sumNumbers(vector<int> nums) {
    int total = 0;
    for (int n : nums) total += n;
    return total;
}`,
  "vowel-count": `int countVowels(string text) {
    string vowels = "aeiou";
    int count = 0;
    for (char ch : text) {
        char lower = (ch >= 'A' && ch <= 'Z') ? (char)(ch - 'A' + 'a') : ch;
        if (vowels.find(lower) != string::npos) count++;
    }
    return count;
}`,
  "two-arrays-equal": `bool sameOrder(vector<int> a, vector<int> b) {
    return a == b;
}`,
  "count-evens": `int countEvens(vector<int> nums) {
    int evens = 0;
    for (int n : nums) if (n % 2 == 0) evens++;
    return evens;
}`,
  "largest-smallest": `vector<int> smallestAndLargest(vector<int> nums) {
    return { *min_element(nums.begin(), nums.end()), *max_element(nums.begin(), nums.end()) };
}`,
  "palindrome-number": `bool isPalindromeNumber(int n) {
    if (n < 0) return false;
    string text = to_string(n);
    for (int i = 0, j = (int)text.size() - 1; i < j; i++, j--) {
        if (text[i] != text[j]) return false;
    }
    return true;
}`,
  "remove-duplicates": `vector<int> dedupe(vector<int> nums) {
    set<int> seen;
    vector<int> out;
    for (int n : nums) {
        if (seen.insert(n).second) out.push_back(n);
    }
    return out;
}`,
  "reverse-text": `string reverseText(string text) {
    return string(text.rbegin(), text.rend());
}`,
  "reverse-no-builtin": `vector<int> reverseArray(vector<int> nums) {
    int i = 0;
    int j = (int)nums.size() - 1;
    while (i < j) swap(nums[i++], nums[j--]);
    return nums;
}`,
  "second-largest": `int secondLargest(vector<int> nums) {
    long long best = -(1LL << 60);
    long long second = -(1LL << 60);
    for (int n : nums) {
        if (n > best) {
            second = best;
            best = n;
        } else if (n < best && n > second) {
            second = n;
        }
    }
    return second == -(1LL << 60) ? -1 : (int)second;
}`,
  "title-case": `string titleCase(string text) {
    string out;
    bool startOfWord = true;
    for (char ch : text) {
        if (ch == ' ') {
            startOfWord = true;
            out += ch;
        } else if (startOfWord) {
            out += (ch >= 'a' && ch <= 'z') ? (char)(ch - 'a' + 'A') : ch;
            startOfWord = false;
        } else {
            out += (ch >= 'A' && ch <= 'Z') ? (char)(ch - 'A' + 'a') : ch;
        }
    }
    return out;
}`,
  "word-count": `int countWords(string text) {
    istringstream stream(text);
    string word;
    int count = 0;
    while (stream >> word) count++;
    return count;
}`,
  "anagram-check": `bool isAnagram(string a, string b) {
    auto lower = [](char ch) { return (ch >= 'A' && ch <= 'Z') ? (char)(ch - 'A' + 'a') : ch; };
    for (char &ch : a) ch = lower(ch);
    for (char &ch : b) ch = lower(ch);
    sort(a.begin(), a.end());
    sort(b.begin(), b.end());
    return a == b;
}`,
  "array-chunk": `vector<string> chunk(vector<int> nums, int size) {
    vector<string> rows;
    for (size_t i = 0; i < nums.size(); i += size) {
        string row;
        for (size_t j = i; j < nums.size() && j < i + (size_t)size; j++) {
            if (j > i) row += ",";
            row += to_string(nums[j]);
        }
        rows.push_back(row);
    }
    return rows;
}`,
  "binary-bits": `int countSetBits(int n) {
    int count = 0;
    while (n > 0) {
        n &= n - 1;
        count++;
    }
    return count;
}`,
  factorial: `int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) result *= i;
    return result;
}`,
  "missing-number": `int missingNumber(int n, vector<int> nums) {
    int expected = n * (n + 1) / 2;
    int actual = 0;
    for (int value : nums) actual += value;
    return expected - actual;
}`,
  "find-duplicates": `vector<int> findDuplicates(vector<int> nums) {
    set<int> seen;
    set<int> reported;
    vector<int> out;
    for (int n : nums) {
        if (seen.count(n) && !reported.count(n)) {
            reported.insert(n);
            out.push_back(n);
        }
        seen.insert(n);
    }
    return out;
}`,
  fizzbuzz: `vector<string> fizzBuzz(int n) {
    vector<string> rows;
    for (int i = 1; i <= n; i++) {
        if (i % 15 == 0) rows.push_back("FizzBuzz");
        else if (i % 3 == 0) rows.push_back("Fizz");
        else if (i % 5 == 0) rows.push_back("Buzz");
        else rows.push_back(to_string(i));
    }
    return rows;
}`,
  "gcd-lcm": `vector<int> gcdAndLcm(int a, int b) {
    int x = a;
    int y = b;
    while (y != 0) {
        int t = x % y;
        x = y;
        y = t;
    }
    return { x, (a / x) * b };
}`,
  "grade-letter": `string gradeLetter(int score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
}`,
  intersection: `vector<int> intersection(vector<int> a, vector<int> b) {
    set<int> inB(b.begin(), b.end());
    set<int> added;
    vector<int> out;
    for (int n : a) {
        if (inB.count(n) && added.insert(n).second) out.push_back(n);
    }
    return out;
}`,
  "merge-sorted": `vector<int> mergeSorted(vector<int> a, vector<int> b) {
    vector<int> out;
    size_t i = 0;
    size_t j = 0;
    while (i < a.size() && j < b.size()) {
        if (a[i] <= b[j]) out.push_back(a[i++]);
        else out.push_back(b[j++]);
    }
    while (i < a.size()) out.push_back(a[i++]);
    while (j < b.size()) out.push_back(b[j++]);
    return out;
}`,
  "move-zeros": `vector<int> moveZeros(vector<int> nums) {
    vector<int> out;
    int zeros = 0;
    for (int n : nums) {
        if (n == 0) zeros++;
        else out.push_back(n);
    }
    out.resize(out.size() + zeros, 0);
    return out;
}`,
  "multiply-table": `vector<string> multiplicationTable(int n) {
    vector<string> rows;
    for (int i = 1; i <= 5; i++) {
        rows.push_back(to_string(n) + " x " + to_string(i) + " = " + to_string(n * i));
    }
    return rows;
}`,
  "is-prime": `bool isPrime(int n) {
    if (n < 2) return false;
    for (int d = 2; d * d <= n; d++) {
        if (n % d == 0) return false;
    }
    return true;
}`,
  "sum-digits": `int digitSum(int n) {
    long long value = n < 0 ? -(long long)n : (long long)n;
    int total = 0;
    while (value > 0) {
        total += value % 10;
        value /= 10;
    }
    return total;
}`,
  "best-time-stock": `int maxProfit(vector<int> prices) {
    int lowest = prices.empty() ? 0 : prices[0];
    int best = 0;
    for (int price : prices) {
        if (price < lowest) lowest = price;
        if (price - lowest > best) best = price - lowest;
    }
    return best;
}`,
  "binary-search": `int binarySearch(vector<int> nums, int target) {
    int low = 0;
    int high = (int)nums.size() - 1;
    while (low <= high) {
        int mid = (low + high) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}`,
  "group-anagrams": `int countAnagramGroups(vector<string> words) {
    set<string> keys;
    for (string word : words) {
        sort(word.begin(), word.end());
        keys.insert(word);
    }
    return (int)keys.size();
}`,
  "fib-recursion": `vector<int> fibonacci(int n) {
    vector<int> out;
    int a = 0;
    int b = 1;
    for (int i = 0; i < n; i++) {
        out.push_back(a);
        int next = a + b;
        a = b;
        b = next;
    }
    return out;
}`,
  "freq-count": `string frequencyReport(vector<int> nums) {
    map<int, int> counts;
    vector<int> order;
    for (int n : nums) {
        if (!counts.count(n)) order.push_back(n);
        counts[n]++;
    }
    string out;
    for (int n : order) {
        if (counts[n] <= 1) continue;
        if (!out.empty()) out += ",";
        out += to_string(n) + ":" + to_string(counts[n]);
    }
    return out.empty() ? "none" : out;
}`,
  "longest-common-prefix": `string longestCommonPrefix(vector<string> words) {
    if (words.empty()) return "";
    string prefix = words[0];
    for (size_t i = 1; i < words.size(); i++) {
        while (words[i].find(prefix) != 0) prefix.pop_back();
    }
    return prefix;
}`,
  "majority-element": `int majorityElement(vector<int> nums) {
    int count = 0;
    int candidate = nums[0];
    for (int n : nums) {
        if (count == 0) candidate = n;
        count += (n == candidate) ? 1 : -1;
    }
    return candidate;
}`,
  "reverse-linked-list": `int reverseInteger(int n) {
    long long value = n < 0 ? -(long long)n : (long long)n;
    long long reversed = 0;
    while (value > 0) {
        reversed = reversed * 10 + value % 10;
        value /= 10;
    }
    long long result = n < 0 ? -reversed : reversed;
    if (result < -2147483648LL || result > 2147483647LL) return 0;
    return (int)result;
}`,
  "reverse-words": `string reverseWords(string s) {
    istringstream stream(s);
    vector<string> words;
    string word;
    while (stream >> word) words.push_back(word);
    string out;
    for (int i = (int)words.size() - 1; i >= 0; i--) {
        if (!out.empty()) out += " ";
        out += words[i];
    }
    return out;
}`,
  "rotate-k": `vector<int> rotateRight(vector<int> nums, int k) {
    int n = (int)nums.size();
    if (n == 0) return {};
    int shift = ((k % n) + n) % n;
    vector<int> out(n);
    for (int i = 0; i < n; i++) out[(i + shift) % n] = nums[i];
    return out;
}`,
  "run-length-encode": `string runLengthEncode(string s) {
    string out;
    size_t i = 0;
    while (i < s.size()) {
        size_t run = 1;
        while (i + run < s.size() && s[i + run] == s[i]) run++;
        out += s[i];
        out += to_string(run);
        i += run;
    }
    return out;
}`,
  "two-sum": `vector<int> twoSum(vector<int> nums, int target) {
    map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        if (seen.count(target - nums[i])) {
            int j = seen[target - nums[i]];
            return { min(i, j), max(i, j) };
        }
        seen[nums[i]] = i;
    }
    return {};
}`,
  "valid-parens": `bool isValidParens(string s) {
    map<char, char> pairs = { {')', '('}, {']', '['}, {'}', '{'} };
    vector<char> stack;
    for (char ch : s) {
        if (ch == '(' || ch == '[' || ch == '{') {
            stack.push_back(ch);
        } else if (stack.empty() || stack.back() != pairs[ch]) {
            return false;
        } else {
            stack.pop_back();
        }
    }
    return stack.empty();
}`,
  "key-value-zip": `int zipKeys(vector<string> keys, vector<string> values) {
    map<string, string> table;
    for (size_t i = 0; i < keys.size(); i++) table[keys[i]] = values[i];
    return (int)table.size();
}`,
  "palindromic-substrings": `vector<string> palindromicSubstrings(string s) {
    vector<string> out;
    for (size_t i = 0; i < s.size(); i++) {
        for (size_t j = i; j < s.size(); j++) {
            string piece = s.substr(i, j - i + 1);
            bool ok = true;
            for (size_t l = 0, r = piece.size() - 1; l < r; l++, r--) {
                if (piece[l] != piece[r]) {
                    ok = false;
                    break;
                }
            }
            if (ok) out.push_back(piece);
        }
    }
    return out;
}`,
  "caesar-cipher": `string caesar(string text, int k) {
    int shift = ((k % 26) + 26) % 26;
    for (char &ch : text) {
        if (ch >= 'A' && ch <= 'Z') ch = 'A' + (ch - 'A' + shift) % 26;
        else if (ch >= 'a' && ch <= 'z') ch = 'a' + (ch - 'a' + shift) % 26;
    }
    return text;
}`,
  "pair-sum-sorted": `bool pairSumSorted(vector<int> nums, int target) {
    int i = 0;
    int j = (int)nums.size() - 1;
    while (i < j) {
        int sum = nums[i] + nums[j];
        if (sum == target) return true;
        if (sum < target) i++;
        else j--;
    }
    return false;
}`,
  "pascal-row": `vector<int> pascalRow(int n) {
    vector<int> row = { 1 };
    for (int step = 1; step <= n; step++) {
        vector<int> next(row.size() + 1, 1);
        for (size_t j = 1; j < row.size(); j++) next[j] = row[j - 1] + row[j];
        row = next;
    }
    return row;
}`,
  "roman-to-int": `int romanToInt(string s) {
    map<char, int> values = {
        {'I', 1}, {'V', 5}, {'X', 10}, {'L', 50}, {'C', 100}, {'D', 500}, {'M', 1000}
    };
    int total = 0;
    for (size_t i = 0; i < s.size(); i++) {
        int current = values[s[i]];
        int next = i + 1 < s.size() ? values[s[i + 1]] : 0;
        total += current < next ? -current : current;
    }
    return total;
}`,
  "min-stack": `vector<int> simulateStack(vector<string> ops) {
    vector<int> stack;
    for (string op : ops) {
        if (op.rfind("push:", 0) == 0) {
            stack.push_back(stoi(op.substr(5)));
        } else if (op == "pop" && !stack.empty()) {
            stack.pop_back();
        }
    }
    return stack;
}`,
  "matrix-transpose": `vector<vector<int>> transpose(vector<vector<int>> grid) {
    if (grid.empty()) return {};
    size_t rows = grid.size();
    size_t cols = grid[0].size();
    vector<vector<int>> out(cols, vector<int>(rows));
    for (size_t r = 0; r < rows; r++) {
        for (size_t c = 0; c < cols; c++) out[c][r] = grid[r][c];
    }
    return out;
}`,
  "climb-stairs": `int climbStairs(int n) {
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
  "longest-substring": `int longestUniqueSubstring(string s) {
    map<char, int> lastSeen;
    int left = 0;
    int best = 0;
    for (int right = 0; right < (int)s.size(); right++) {
        char ch = s[right];
        if (lastSeen.count(ch) && lastSeen[ch] >= left) left = lastSeen[ch] + 1;
        lastSeen[ch] = right;
        best = max(best, right - left + 1);
    }
    return best;
}`,
  "max-subarray": `int maxSubarray(vector<int> nums) {
    int running = nums[0];
    int best = nums[0];
    for (size_t i = 1; i < nums.size(); i++) {
        running = max(nums[i], running + nums[i]);
        best = max(best, running);
    }
    return best;
}`,
  "top-k-frequent": `vector<int> topKFrequent(vector<int> nums, int k) {
    map<int, int> counts;
    for (int n : nums) counts[n]++;
    vector<pair<int, int>> entries(counts.begin(), counts.end());
    sort(entries.begin(), entries.end(), [](const pair<int, int> &a, const pair<int, int> &b) {
        if (a.second != b.second) return a.second > b.second;
        return a.first < b.first;
    });
    vector<int> out;
    for (int i = 0; i < k && i < (int)entries.size(); i++) out.push_back(entries[i].first);
    return out;
}`,
  "longest-palindrome": `string longestPalindrome(string s) {
    if (s.empty()) return "";
    int bestStart = 0;
    int bestLength = 1;
    auto expand = [&](int left, int right) {
        while (left >= 0 && right < (int)s.size() && s[left] == s[right]) {
            left--;
            right++;
        }
        return right - left - 1;
    };
    for (int i = 0; i < (int)s.size(); i++) {
        int length = max(expand(i, i), expand(i, i + 1));
        if (length > bestLength) {
            bestLength = length;
            bestStart = i - (length - 1) / 2;
        }
    }
    return s.substr(bestStart, bestLength);
}`,
  "merge-intervals": `string mergeIntervals(string s) {
    if (s.empty()) return "";
    vector<pair<int, int>> intervals;
    size_t pos = 0;
    while (pos <= s.size()) {
        size_t end = s.find(';', pos);
        if (end == string::npos) end = s.size();
        string pairText = s.substr(pos, end - pos);
        if (!pairText.empty()) {
            size_t comma = pairText.find(',');
            intervals.push_back({ stoi(pairText.substr(0, comma)), stoi(pairText.substr(comma + 1)) });
        }
        if (end == s.size()) break;
        pos = end + 1;
    }
    sort(intervals.begin(), intervals.end());
    vector<pair<int, int>> merged;
    for (auto &interval : intervals) {
        if (!merged.empty() && interval.first <= merged.back().second) {
            merged.back().second = max(merged.back().second, interval.second);
        } else {
            merged.push_back(interval);
        }
    }
    string out;
    for (auto &interval : merged) {
        if (!out.empty()) out += ";";
        out += to_string(interval.first) + "," + to_string(interval.second);
    }
    return out;
}`,
  "recursive-salaries": `int sumSalaries(string json) {
    // Walk the text for every "salary": <number>, at any depth.
    int total = 0;
    size_t pos = 0;
    while ((pos = json.find("\\"salary\\"", pos)) != string::npos) {
        size_t colon = json.find(':', pos);
        if (colon == string::npos) break;
        size_t i = colon + 1;
        while (i < json.size() && !(json[i] == '-' || (json[i] >= '0' && json[i] <= '9'))) i++;
        bool negative = i < json.size() && json[i] == '-';
        if (negative) i++;
        int value = 0;
        while (i < json.size() && json[i] >= '0' && json[i] <= '9') {
            value = value * 10 + (json[i] - '0');
            i++;
        }
        total += negative ? -value : value;
        pos = i;
    }
    return total;
}`,
  "coin-change": `int fewestCoins(vector<int> coins, int amount) {
    const int unreachable = 1 << 30;
    vector<int> dp(amount + 1, unreachable);
    dp[0] = 0;
    for (int value = 1; value <= amount; value++) {
        for (int coin : coins) {
            if (coin <= value && dp[value - coin] + 1 < dp[value]) {
                dp[value] = dp[value - coin] + 1;
            }
        }
    }
    return dp[amount] >= unreachable ? -1 : dp[amount];
}`,
  lis: `int lisLength(vector<int> nums) {
    if (nums.empty()) return 0;
    vector<int> dp(nums.size(), 1);
    int best = 1;
    for (size_t i = 0; i < nums.size(); i++) {
        for (size_t j = 0; j < i; j++) {
            if (nums[j] < nums[i]) dp[i] = max(dp[i], dp[j] + 1);
        }
        best = max(best, dp[i]);
    }
    return best;
}`,
  "trapping-rain": `int trapRain(vector<int> height) {
    int left = 0;
    int right = (int)height.size() - 1;
    int leftMax = 0;
    int rightMax = 0;
    int water = 0;
    while (left < right) {
        if (height[left] < height[right]) {
            leftMax = max(leftMax, height[left]);
            water += leftMax - height[left];
            left++;
        } else {
            rightMax = max(rightMax, height[right]);
            water += rightMax - height[right];
            right--;
        }
    }
    return water;
}`,
  "median-two-sorted": `double medianSorted(vector<int> a, vector<int> b) {
    vector<int> merged = a;
    merged.insert(merged.end(), b.begin(), b.end());
    sort(merged.begin(), merged.end());
    size_t mid = merged.size() / 2;
    if (merged.size() % 2 == 1) return merged[mid];
    return (merged[mid - 1] + merged[mid]) / 2.0;
}`,
};
