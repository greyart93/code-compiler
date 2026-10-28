// C++ course content, split by section so each file stays readable.
// Types come from course-types.ts.
import type { SectionSeed } from "./course-types";

const cpp = (code: string) => "```cpp\n" + code + "\n```";

// ───────────────────────── 1. Basics ─────────────────────────

export const CPP_BASICS: SectionSeed = {
  id: "basics",
  title: "Basics",
  lessons: [
    {
      id: "cpp-1",
      title: "Hello, C++",
      minutes: 6,
      md: [
        "A C++ program needs `main`, and `#include` brings in the standard library.",
        "",
        cpp('#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++!" << std::endl;\n    return 0;\n}'),
        "",
        "Compile: `g++ main.cpp -o main` then `./main`.",
        "",
        "### The stream operators",
        "",
        cpp('std::cout << "value: " << 42 << "\\n";\nint x;\nstd::cin >> x;          // read one value\nstd::getline(std::cin, line);   // read a whole line\n\n// chaining works because << returns the stream\nstd::cout << "a" << "b" << "c";'),
        "",
        "### `using namespace std;`",
        "",
        cpp("#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"no std:: needed\" << endl;   // convenient, but pollutes the namespace"),
      ].join("\n"),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Complete the stream so the message reaches the console",
          template: 'std::___ << "Hello";',
          blanks: [{ options: ["cout", "print", "printf"], answer: "cout" }],
          explanation: "`std::cout` is C++'s standard output stream.",
        },
        {
          type: "quiz",
          prompt: "Which preprocessor directive includes the standard I/O header?",
          answers: ["#include <iostream>", "include iostream", "#include <iostream>\n"],
          snippet: "___ <iostream>",
          placeholder: "the directive",
          hint: "It starts with a hash.",
          explanation:
            "`#include <iostream>` brings in `std::cout`, `std::cin` and friends.",
        },
      ],
    },
    {
      id: "cpp-2",
      title: "Variables & types",
      minutes: 7,
      md: [
        cpp("int i = 42;            // usually 32-bit\nlong l = 100L;\ndouble d = 3.14;\nfloat f = 1.5f;\nchar c = 'a';\nbool b = true;\n\nauto x = 5;             // type deduced — prefer this"),
        "",
        "### `const` and `constexpr`",
        "",
        cpp("const double PI = 3.14159;      // cannot change after init\nconstexpr int MAX = 100;          // known at compile time\n\n// const guarantees a value; constexpr guarantees a compile-time constant"),
        "",
        "### Casting",
        "",
        cpp("double d = 3.9;\nint i = (int) d;        // 3 — truncates, does not round\ni = static_cast<int>(d);   // clearer, checked\n\n// implicit conversions still happen, sometimes silently"),
        "",
        "### `std::string`",
        "",
        cpp('#include <string>\nstd::string s = "hi";\ns += " there";        // += works\nstd::cout << s.length();\nstd::cout << s[0];'),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What does `(int) 3.9` produce?",
          answers: ["3", "3\n"],
          snippet: "double d = 3.9;\nint i = (int) d;",
          placeholder: "the value",
          hint: "It truncates rather than rounding.",
          explanation:
            "`3` — a cast toward zero truncates the fraction. Use `std::round()` if you want nearest.",
        },
        {
          type: "quiz",
          prompt: "What is `auto` used for in C++11 and later?",
          answers: [
            "deduces the type for you",
            "type deduction",
            "deduce type",
            "it deduces the type",
          ],
          snippet: "auto x = 5;",
          placeholder: "what it does",
          hint: "The compiler works it out.",
          explanation:
            "`auto` lets the compiler deduce the type from the initialiser — less repetition and refactor-friendly.",
        },
      ],
    },
    {
      id: "cpp-3",
      title: "Control flow",
      minutes: 7,
      md: [
        cpp("int n = 7;\nif (n % 2 == 0) {\n    std::cout << \"even\\n\";\n} else if (n < 0) {\n    std::cout << \"negative\\n\";\n} else {\n    std::cout << \"odd\\n\";\n}\n\nfor (int i = 0; i < 3; i++)  std::cout << i << '\\n';\nwhile (n > 0) n--;\ndo { n++; } while (n < 3);   // runs at least once"),
        "",
        "### `switch`",
        "",
        cpp("switch (day) {\n    case 1: std::cout << \"Mon\"; break;   // break is essential\n    case 2: std::cout << \"Tue\"; break;\n    default: std::cout << \"Other\";\n}"),
        "",
        "### Range-based `for`",
        "",
        cpp("std::vector<int> xs{1, 2, 3};\nfor (int x : xs)      std::cout << x;\nfor (int& x : xs)    x *= 2;   // by reference — modifies"),
      ].join("\n"),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Complete the keyword so the block runs when `n` is even",
          template: "int n = 7;\n___ (n % 2 == 0) {\n    std::cout << \"even\\n\";\n}",
          blanks: [{ options: ["if", "when", "check"], answer: "if" }],
          explanation: "`if (condition) { ... }` opens a conditional block.",
        },
        {
          type: "quiz",
          prompt: "What happens if you forget `break` in a `switch` case?",
          answers: ["it falls through", "fall through", "it falls through to the next case", "falls through"],
          snippet: "switch (x) { case 1: f(); case 2: g(); }",
          placeholder: "what happens",
          hint: "There is no implicit stop.",
          explanation:
            "Execution falls through into the next case, running both bodies. Omitting `break` accidentally is a classic C++ bug.",
        },
      ],
    },
    {
      id: "cpp-4",
      title: "Functions",
      minutes: 7,
      md: [
        cpp("int add(int a, int b = 0) { return a + b; }   // default arg\n\n// pass by value — the caller keeps its copy\nvoid byValue(int n) { n = 99; }\n\n// pass by reference — the caller sees changes\nvoid byRef(int& n) { n = 99; }\n\n// avoid a copy of a big object but do not mutate it\nvoid big(const std::string& s) { }"),
        "",
        "### Overloading",
        "",
        cpp("int    add(int a, int b);\ndouble add(double a, double b);   // same name, different params"),
        "",
        "### Templates — generic functions",
        "",
        cpp("template <typename T>\nT maxOf(T a, T b) { return a > b ? a : b; }\n\nmaxOf(3, 5);        // T = int\nmaxOf(2.5, 1.5);    // T = double"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "How do you pass a large object without copying it, and without changing it?",
          answers: ["const reference", "const&", "by const reference", "a const reference"],
          snippet: "void f(std::string& s)",
          placeholder: "how",
          hint: "One keyword for read-only, one for the reference itself.",
          explanation:
            "Pass by `const&` — no copy is made, and the function cannot modify the caller's object.",
        },
      ],
    },
    {
      id: "cpp-5",
      title: "Arrays, pointers & memory",
      minutes: 10,
      md: [
        cpp("int xs[5] = {1, 2, 3};      // fixed size, stack\nint* p = xs;                      // xs decays to a pointer\nstd::cout << *p;                  // 1  — * dereferences\np++;                              // now points at xs[1]"),
        "",
        "### `new` and `delete`",
        "",
        cpp("int* n = new int(10);\n*n = 20;\ndelete n;      // always pair these\n\n// prefer the modern form:\nauto v = std::make_unique<int>(10);   // freed automatically"),
        "",
        "### The rules",
        "",
        "- An array **decays** to a pointer to its first element when passed",
        "- `sizeof(arr)/sizeof(arr[0])` gives length only where the array is still an array",
        "- Raw `new`/`delete` pairs are error-prone — reach for `std::vector` instead",
        "",
        cpp("std::vector<int> v{1, 2, 3};\nv.push_back(4);     // resizes safely\nv.size();          // 4 — no manual memory"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What is the safest way to allocate memory in modern C++?",
          answers: [
            "std::vector",
            "vector",
            "std::vector or smart pointers",
            "smart pointers",
          ],
          snippet: "// want a growable list of ints",
          placeholder: "what",
          hint: "You should rarely need `new` at all.",
          explanation:
            "`std::vector` manages its own memory and resizes safely; `std::make_unique` / `make_shared` cover the rest.",
        },
        {
          type: "quiz",
          prompt: "What does `*p` do when `p` is a pointer?",
          answers: ["dereferences it", "dereference", "it dereferences the pointer", "reads the value it points to"],
          snippet: "int* p = xs;\nstd::cout << *p;",
          placeholder: "what",
          hint: "The opposite of taking an address with `&`.",
          explanation:
            "`*` dereferences — it reads the value the pointer refers to. `&` takes the address instead.",
        },
      ],
    },
    {
      id: "cpp-6",
      title: "Strings",
      minutes: 7,
      md: [
        cpp('#include <string>\nstd::string s = "hello";\ns += " world";\ns.size();          // 11\ns[0];              // \'h\'\ns.substr(0, 5);   // "hello"\ns.find("world");   // position or npos\n\n// C-style strings still exist:\nconst char* cs = "hi";   // a pointer — cannot resize'),
        "",
        "### Converting",
        "",
        cpp('int n = std::stoi("42");\nstd::string back = std::to_string(42);\n\n// reading input\nstd::getline(std::cin, s);'),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Why prefer `std::string` over `const char*`?",
          answers: [
            "it manages memory and knows its length",
            "owns its memory",
            "it is safer",
            "it knows its own length",
          ],
          snippet: 'const char* cs = "hi";\n// vs\nstd::string s = "hi";',
          placeholder: "why",
          hint: "Think about resizing.",
          explanation:
            "`std::string` owns its buffer, knows its length, resizes safely and frees itself at end of scope.",
        },
      ],
    },
  ],
};

// ───────────────────────── 2. OOP ─────────────────────────

export const CPP_OOP: SectionSeed = {
  id: "oop",
  title: "Object-oriented",
  lessons: [
    {
      id: "cpp-7",
      title: "Classes & structs",
      minutes: 8,
      md: [
        cpp("class Dog {\nprivate:              // default for class\n    std::string name_;\n\npublic:\n    Dog(const std::string& n) : name_(n) {}   // init list\n\n    const std::string& name() const { return name_; }   // const getter\n    void rename(const std::string& n) { name_ = n; }\n};\n\nDog d(\"Rex\");\ndog.rename(\"Fido\");"),
        "",
        "### Three special members",
        "",
        cpp("Dog(const Dog& other);          // copy constructor\nDog& operator=(const Dog&);  // copy assignment\nDog(Dog&&) noexcept;           // move — steals the buffer"),
        "",
        "Rule of zero: if you declare none of them, the compiler generates correct ones. Declare one and you probably need all three.",
        "",
        "`struct` is public by default, `class` is private — beyond that they are identical.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What are `struct` and `class` different in C++?",
          answers: [
            "default access: public vs private",
            "access default",
            "struct is public class is private",
            "default member access",
          ],
          snippet: "struct S { int x; };   // x is public\nclass C { int x; };      // x is private",
          placeholder: "the difference",
          hint: "It is about one access level only.",
          explanation:
            "Only the default member access differs — `struct` is public, `class` is private. Everything else behaves the same.",
        },
      ],
    },
    {
      id: "cpp-8",
      title: "Inheritance & polymorphism",
      minutes: 9,
      md: [
        cpp("struct Animal {\n    virtual ~Animal() = default;      // virtual destructor — always\n    virtual std::string speak() const { return \"...\"; }\n};\n\nstruct Cat : Animal {\n    std::string speak() const override { return \"meow\"; }\n};\n\nAnimal* a = new Cat();\nstd::cout << a->speak();   // meow — virtual dispatch"),
        "",
        "### Why the destructor must be virtual",
        "",
        cpp("Animal* a = new Cat();\ndelete a;   // wrong without virtual ~Animal(): only ~Animal runs"),
        "",
        "`override` makes the compiler check you really are overriding — use it always.",
      ].join("\n"),
      exercises: [
        {
          type: "output",
          prompt: "What does this print? Predict, then run.",
          starterCode:
            '#include <iostream>\nstruct A { virtual std::string s() { return "A"; } };\nstruct B : A { std::string s() override { return "B"; } };\n\nint main() {\n  A* p = new B();\n  std::cout << p->s();\n}',
          expectedOutput: "B",
          answerLabel: "Type what this prints",
          hint: "The function is virtual.",
        },
        {
          type: "quiz",
          prompt: "When must a base-class destructor be `virtual`?",
          answers: [
            "when deleting through a base pointer",
            "when deleting through a base pointer",
            "if you delete via a base pointer",
            "when using base pointers",
          ],
          snippet: "Animal* a = new Cat();\ndelete a;",
          placeholder: "when",
          hint: "Think about how the object is destroyed.",
          explanation:
            "Whenever you might delete through a base pointer. Otherwise the derived destructor is skipped and resources leak.",
        },
      ],
    },
    {
      id: "cpp-9",
      title: "Templates",
      minutes: 8,
      md: [
        cpp("template <typename T>\nT maxOf(T a, T b) { return a > b ? a : b; }\n\ntemplate <typename T>\nclass Stack {\n    std::vector<T> items_;\npublic:\n    void push(T v) { items_.push_back(v); }\n    T pop() { T v = items_.back(); items_.pop_back(); return v; }\n};\n\nStack<int> s;   // instantiate for int\ns.push(1);"),
        "",
        "### The typename problem",
        "",
        cpp("template <typename T>\nvoid f(const T& t) {\n    // auto it = t.begin();          // error in dependent code\n    typename T::const_iterator it = t.begin();   // tell the compiler\n}"),
        "",
        "### Specialisations",
        "",
        cpp("template <typename T>\nstd::string describe(T v) { return \"generic\"; }\n\ntemplate <>\nstd::string describe<bool>(bool v) { return v ? \"true\" : \"false\"; }"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What does `template <typename T>` provide?",
          answers: [
            "compile-time polymorphism",
            "generics",
            "generic programming",
            "compile time polymorphism",
          ],
          snippet: "template <typename T>\nT maxOf(T a, T b) { ... }",
          placeholder: "what",
          hint: "Compare with virtual functions.",
          explanation:
            "Compile-time (static) polymorphism — one implementation serves every type, resolved by the compiler rather than at runtime.",
        },
      ],
    },
    {
      id: "cpp-10",
      title: "The STL",
      minutes: 10,
      md: [
        cpp("#include <vector>\n#include <algorithm>\n#include <map>\n#include <unordered_map>\n#include <set>\n\nstd::vector<int> v{3, 1, 2};\nstd::sort(v.begin(), v.end());\nstd::sort(v.begin(), v.end(), std::greater<int>());\n\nstd::map<std::string, int> m;      // ordered keys\nm[\"a\"] = 1;\nm.count(\"a\");\n\nstd::unordered_map<int, int> um;   // fast, unordered\n\n// erase-remove idiom\nv.erase(std::remove_if(v.begin(), v.end(), [](int x){ return x < 0; }), v.end());"),
        "",
        "### Containers at a glance",
        "",
        "| Need | Use | Lookup |",
        "|---|---|---|",
        "| dynamic array | `vector` | O(n) |",
        "| sorted keys | `map` | O(log n) |",
        "| fast key lookup | `unordered_map` | O(1) avg |",
        "| unique values | `set` | O(log n) |",
        "| stack / queue | `stack`, `queue`, `deque` | O(1) |",
        "",
        "Prefer `std::span` for non-owning views and `std::optional` for maybe-values.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Which container gives O(1) average lookup by key?",
          answers: ["unordered_map", "unordered map", "hash map"],
          snippet: 'std::unordered_map<int, int> m;',
          placeholder: "the container",
          hint: "The name says it does not keep order.",
          explanation:
            "`unordered_map` hashes keys — average O(1). `std::map` keeps keys sorted and costs O(log n).",
        },
        {
          type: "quiz",
          prompt: "What is the **erase-remove** idiom for?",
          answers: [
            "removing elements matching a predicate",
            "removing elements",
            "to remove matching elements",
            "removing items that match",
          ],
          snippet: "v.erase(std::remove_if(...), v.end());",
          placeholder: "what it does",
          hint: "`std::vector` has no remove-by-predicate method.",
          explanation:
            "Since `vector` has no predicate-aware erase, you move the unwanted elements to the end with `remove_if`, then `erase` the tail.",
        },
      ],
    },
    {
      id: "cpp-11",
      title: "RAII & smart pointers",
      minutes: 9,
      md: [
        cpp('#include <memory>\n\nauto a = std::make_unique<int>(10);   // sole owner\nauto b = std::make_shared<int>(10);   // shared ownership\n\n{\n    std::unique_ptr<int> p = std::make_unique<int>(5);\n}   // freed here automatically\n\n// raw pointer still available when required\nint* raw = p.get();'),
        "",
        "### Which one",
        "",
        "| Type | Ownership | Cost |",
        "|---|---|---|",
        "| `unique_ptr<T>` | one owner | no overhead |",
        "| `shared_ptr<T>` | shared, refcounted | atomic refcount |",
        "| `weak_ptr<T>` | non-owning observer | cheap |",
        "| raw `T*` | none — you manage | free |",
        "",
        "RAII ties resource lifetime to object lifetime: acquire in the constructor, release in the destructor. Every STL container and file handle already does this.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What does RAII stand for?",
          answers: ["resource acquisition is initialization", "raii"],
          snippet: "class File { File() { open(); } ~File() { close(); } };",
          placeholder: "expand it",
          hint: "Three words.",
          explanation:
            "Resource Acquisition Is Initialization — resources are acquired in the constructor and released in the destructor, so cleanup is automatic.",
        },
        {
          type: "quiz",
          prompt: "Which smart pointer is the default choice for a single owner?",
          answers: ["unique_ptr", "std::unique_ptr", "uniqueptr"],
          snippet: "auto p = std::make_???<int>(5);",
          placeholder: "the type",
          hint: "It enforces sole ownership at compile time.",
          explanation:
            "`std::unique_ptr` — it is non-copyable, which makes ownership explicit and free at runtime. Reach for `shared_ptr` only when sharing is real.",
        },
      ],
    },
  ],
};

// ───────────────────────── 3. Advanced ─────────────────────────

export const CPP_ADVANCED: SectionSeed = {
  id: "advanced",
  title: "Advanced",
  lessons: [
    {
      id: "cpp-12",
      title: "move semantics",
      minutes: 9,
      md: [
        cpp("struct Buffer {\n    std::vector<int> data;\n\n    Buffer(Buffer&& other) noexcept   // move constructor\n        : data(std::move(other.data)) {}\n\n    Buffer& operator=(Buffer&&) noexcept = default;   // move assign\n};\n\nBuffer make() { return Buffer{}; }   // no copy — the return is moved"),
        "",
        "### Copy vs move",
        "",
        cpp("std::string a = \"hello\";\nstd::string b = a;              // copy — allocates and duplicates\nstd::string c = std::move(a);     // move — steals b's buffer, a is left empty\n\n// after moving, only the moved-from object is valid to destroy or reassign"),
        "",
        "Return by value and rely on copy elision — it is faster and clearer than `new`/return pairs.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What does `std::move` actually do?",
          answers: [
            "just a cast that enables the move",
            "nothing, just a cast",
            "it casts to an rvalue reference",
            "enables the move constructor",
          ],
          snippet: "std::string c = std::move(a);",
          placeholder: "be honest",
          hint: "It does not move anything by itself.",
          explanation:
            "`std::move` is a cast to an rvalue reference. The actual transfer happens in the move constructor it enables.",
        },
      ],
    },
    {
      id: "cpp-13",
      title: "constexpr & compile-time",
      minutes: 7,
      md: [
        cpp("constexpr int square(int n) { return n * n; }\nstatic_assert(square(5) == 25, \"must hold\");\n\nconstexpr int N = 10;\nstd::array<int, N> buf;      // N usable as a size\n\n// consteval: must be evaluated at compile time\nconsteval int only_compile_time(int n) { return n + 1; }"),
        "",
        "Compile-time evaluation means zero runtime cost and earlier error reporting for problems the compiler can prove.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What does `static_assert` do when its condition is false?",
          answers: ["fails at compile time", "compile error", "it is a compile error", "causes a compile error"],
          snippet: 'static_assert(n > 0, "must be positive");',
          placeholder: "when",
          hint: "It is checked before the program runs.",
          explanation:
            "It stops compilation with your message — useful for encoding invariants the compiler can verify.",
        },
      ],
    },
    {
      id: "cpp-14",
      title: "Exception safety",
      minutes: 8,
      md: [
        cpp("void f() {\n    Widget w;              // acquire\n    risky();               // if this throws, ~Widget still runs\n}   // w destroyed either way"),
        "",
        "### Three guarantees",
        "",
        cpp("// no-throw      — never throws\n// basic         — no leaks, object still valid\n// strong        — either fully succeeds or changes nothing"),
        "",
        "### Copy-and-swap gives strong safety for free",
        "",
        cpp("void addItem(Item i) {\n    std::vector<Item> tmp = items_;   // work on a copy\n    tmp.push_back(i);                // may throw\n    items_ = std::move(tmp);          // commit — no-throw\n}"),
        "",
        "`noexcept` is not decoration: it lets the compiler move rather than copy, and it stops a throwing destructor terminating.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What does RAII guarantee when an exception is thrown?",
          answers: [
            "destructors still run",
            "objects are still destroyed",
            "cleanup happens",
            "it cleans up",
          ],
          snippet: "void f() { Widget w; risky(); }",
          placeholder: "what",
          hint: "Stack unwinding.",
          explanation:
            "Stack unwinding destroys every constructed object, so resources are released even on the error path.",
        },
      ],
    },
    {
      id: "cpp-15",
      title: "Lambdas & functional style",
      minutes: 8,
      md: [
        cpp("auto add = [](int a, int b) { return a + b; };\nstd::cout << add(1, 2);\n\nauto mul = [](int a, int b) { return a * b; };   // no capture needed\n\nint base = 10;\nauto plus = [base](int x) { return x + base; };   // capture by value\nauto bump = [&base](int x) { base += x; return base; };  // capture by reference\n\nauto log = [](int x) { return x; };\nauto add1 = [log](int x) { return log(x) + 1; };   // capture another lambda"),
        "",
        "### Passing to algorithms",
        "",
        cpp("std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });\n\nauto it = std::find_if(v.begin(), v.end(), [](int x) { return x < 0; });"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What does `[&]` capture?",
          answers: ["by reference", "references"],
          snippet: "auto f = [&](int x) { return x + base; };",
          placeholder: "how",
          hint: "Contrast with `[=]`.",
          explanation:
            "`[&]` captures every used variable by reference, so writes inside the lambda are visible outside. `[=]` copies them instead.",
        },
      ],
    },
    {
      id: "cpp-16",
      title: "Concurrency",
      minutes: 10,
      md: [
        cpp('#include <thread>\n#include <mutex>\n\nstd::thread t([]{ std::cout << "hi\\n"; });\nt.join();\n\nstd::mutex m;\nint counter = 0;\nvoid bump() {\n    std::lock_guard<std::mutex> lock(m);   // unlocks automatically\n    counter++;\n}\n\nstd::atomic<int> hits{0};   // simple counters need no mutex\nhits.fetch_add(1);'),
        "",
        "### Atomics and futures",
        "",
        cpp("std::atomic<bool> flag{false};\n\nauto f = std::async(std::launch::async, work);\nstd::cout << f.get();      // waits for the result"),
        "",
        "Always lock with `std::lock_guard` (RAII). Deadlocks come from inconsistent lock ordering or calling unknown code while holding a lock.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Why use `std::lock_guard` instead of `lock()`/`unlock()` by hand?",
          answers: [
            "it unlocks automatically",
            "raii",
            "it unlocks even on exceptions",
            "automatic unlock",
          ],
          snippet: "std::mutex m;\n// lock, work, unlock",
          placeholder: "why",
          hint: "Think about an exception thrown mid-work.",
          explanation:
            "It is RAII — the lock is released on every exit path including an exception, so the mutex can never be left locked.",
        },
      ],
    },
    {
      id: "cpp-17",
      title: "Algorithms & complexity",
      minutes: 9,
      md: [
        cpp("// O(1)      unordered_map lookup, vector index\n// O(log n)   std::binary_search\n// O(n)       std::count_if\n// O(n log n) std::sort\n// O(n^2)     nested loops"),
        "",
        "### The ones you will actually use",
        "",
        cpp("std::sort(v.begin(), v.end());\nauto it = std::lower_bound(v.begin(), v.end(), x);  // needs sorted input\nstd::count_if(v.begin(), v.end(), [](int x){ return x > 0; });\nstd::accumulate(v.begin(), v.end(), 0);\nstd::unique(v.begin(), v.end());"),
        "",
        "### Two pointers",
        "",
        cpp("std::vector<int> twoSum(std::vector<int>& xs, int target) {\n    std::unordered_map<int, int> seen;\n    for (int i = 0; i < (int)xs.size(); i++) {\n        int want = target - xs[i];\n        if (seen.count(want)) return {seen[want], i};\n        seen[xs[i]] = i;\n    }\n    return {};\n}"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What complexity does `std::sort` guarantee?",
          answers: ["o(n log n)", "n log n", "o(nlogn)", "o(n log n)\n"],
          snippet: "std::sort(v.begin(), v.end());",
          placeholder: "e.g. O(n log n)",
          hint: "Merge sort style, worst case.",
          explanation:
            "O(n log n) in both average and worst case since C++11 — introsort combines quicksort, heapsort and insertion sort.",
        },
        {
          type: "challenge",
          problem:
            "Read space-separated integers from stdin and print the **largest**.\n\nExample: input `3 9 2` → output `9`",
          starterCode:
            "#include <iostream>\n#include <sstream>\n#include <string>\n\nint main() {\n  // read the ints and print the largest\n}",
          tests: [
            { input: "3 9 2", expected: "9", label: "3 9 2 → 9" },
            { input: "-5 -1 -9", expected: "-1", label: "-5 -1 -9 → -1" },
            { input: "7", expected: "7", label: "7 → 7" },
          ],
          hint: "Read the line, split it with a stringstream, track a running max.",
        },
      ],
    },
    {
      id: "cpp-18",
      title: "Error handling",
      minutes: 8,
      md: [
        cpp("try {\n    int x = std::stoi(\"abc\");\n} catch (const std::invalid_argument& e) {\n    // bad input\n} catch (const std::exception& e) {\n    // anything else std throws\n}"),
        "",
        "### `std::optional` — no exceptions needed for maybe-values",
        "",
        cpp("std::optional<int> find(std::vector<int> xs, int t) {\n    auto it = std::find(xs.begin(), xs.end(), t);\n    if (it == xs.end()) return std::nullopt;\n    return *it;\n}\n\nauto r = find(xs, 5);\nif (r) std::cout << *r;"),
        "",
        "### `std::variant` — a value that is one of several types",
        "",
        cpp("using Shape = std::variant<Circle, Square>;\n\nstd::visit([](auto& s) { /* ... */ }, shape);"),
        "",
        "Prefer returning `optional` over throwing for ordinary \"not found\" — exceptions should be exceptional.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "When is `std::optional` a better choice than an exception?",
          answers: [
            "when not found is expected",
            "for a missing value",
            "normal not-found cases",
            "when the result may simply be absent",
          ],
          snippet: "auto r = find(xs, 5);",
          placeholder: "when",
          hint: "Exceptions are for exceptional cases.",
          explanation:
            "When absence is an ordinary outcome, `optional` makes the caller handle it explicitly with no exception cost.",
        },
      ],
    },
    {
      id: "cpp-19",
      title: "Modern C++ features",
      minutes: 8,
      md: [
        cpp("auto [id, name] = getUser();   // structured bindings (C++17)\n\nauto f = [x = 5](int y) { return x + y; };   // init capture\n\nif (auto* p = getPtr(); p != nullptr) { ... }   // if-init (C++17)\n\nstd::string_view sv = \"no copy\";   // non-owning view\n\nauto result = std::invoke(f);   // call anything callable\n\nconstexpr auto is_prime = [](int n) {\n    for (int i = 2; i * i <= n; i++) if (n % i == 0) return false;\n    return n > 1;\n};"),
        "",
        "### Which standard?",
        "",
        "- **C++11** — auto, lambdas, `unique_ptr`, `move`",
        "- **C++14** — generic lambdas, `make_unique`",
        "- **C++17** — structured bindings, `optional`, `string_view`, `if constexpr`",
        "- **C++20** — concepts, ranges, coroutines, modules",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Which C++ version introduced **structured bindings**?",
          answers: ["c++17", "17", "c++17\n"],
          snippet: "auto [id, name] = getUser();",
          placeholder: "the version",
          hint: "It came with `optional` and `string_view`.",
          explanation:
            "C++17 — `auto [a, b] = pair;` unpacks tuples, pairs and maps at once.",
        },
      ],
    },
    {
      id: "cpp-20",
      title: "Build tools & debugging",
      minutes: 7,
      md: [
        cpp("CMakeLists.txt:\n\ncmake_minimum_required(VERSION 3.20)\nproject(myapp CXX)\n\nset(CMAKE_CXX_STANDARD 20)\n\nadd_executable(myapp main.cpp)\ntarget_link_libraries(myapp PRIVATE spdlog)"),
        "",
        "### Commands",
        "",
        cpp("cmake -B build -DCMAKE_BUILD_TYPE=Release\ncmake --build build\n./build/myapp\n\n# warnings worth turning on\ng++ -std=c++20 -Wall -Wextra -Wpedantic -fsanitize=address,undefined main.cpp"),
        "",
        "### Debugging",
        "",
        cpp("gdb ./myapp\n(gdb) break main\n(gdb) run\n(gdb) print n\n(gdb) step"),
        "",
        "`-fsanitize=address` catches buffer overflows and use-after-free at runtime — far cheaper than chasing undefined behaviour by hand.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Which flag enables AddressSanitizer?",
          answers: ["-fsanitize=address", "fsanitize=address", "-fsanitize=address\n"],
          snippet: "g++ -___=address main.cpp",
          placeholder: "the flag",
          hint: "It is a `-f` flag.",
          explanation:
            "`-fsanitize=address` (usually with `undefined`) instruments memory access and reports overflows and leaks at runtime.",
        },
      ],
    },
  ],
};