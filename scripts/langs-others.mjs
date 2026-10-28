// Structured lesson data for the remaining courses.
// Each md entry is a string, or a code block object which the generator wraps
// in the right fence. Run: node scripts/gen-languages.mjs

const S = (s) => ({ code: s });

export const PHP_SECTIONS = [
  {
    const: "PHP_BASICS",
    id: "basics",
    title: "Basics",
    lessons: [
      {
        id: "php-1",
        title: "Hello, PHP",
        minutes: 6,
        md: [
          "PHP files start with an opening tag and can mix HTML and code.",
          "",
          S('<?php\necho "Hello, PHP!";\n\n// everything echoes in a web context\n$x = 1; # hash comment\n/* block comment */'),
          "",
          "### Arrays are ordered maps",
          "",
          S("$xs = [1, 2, 3];\n$ages = ['ada' => 36, 'bob' => 25];   // keys can be strings\n\necho $ages['ada'];"),
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the opening tag so PHP code is recognised",
            template: "___php\necho \"hi\";",
            blanks: [{ options: ["<?", "<?"], answer: "<?" }],
            explanation: "`<?php` marks the start of a PHP block in an HTML file.",
          },
          {
            type: "quiz",
            prompt: "What type is a PHP array?",
            answers: [
              "an ordered map that can use any key",
              "ordered map",
              "a map",
              "key-value map",
            ],
            snippet: "$xs = [1, 2, 3];\n$ages = ['a' => 1];",
            placeholder: "what",
            hint: "One type covers both list and dictionary.",
            explanation:
              "PHP has one array type used as both a list and a dictionary — keyed by integer or string.",
          },
        ],
      },
      {
        id: "php-2",
        title: "Functions & scope",
        minutes: 7,
        md: [
          S("function add(int $a, int $b = 0): int {\n    return $a + $b;\n}\n\n$double = fn($n) => $n * 2;   // arrow function\n\n$xs = [1, 2, 3];\n$ys = array_map(fn($n) => $n * 2, $xs);"),
          "",
          "Names: `$var` for variables, `functionName` for functions, `CONSTANT_CASE` for constants, `ClassName` for classes.",
          "",
          "Functions defined inside a function are closures and can `use` outer variables.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What prefix does a PHP variable have?",
            answers: ["$", "a dollar sign", "$"],
            snippet: "$name = \"ada\";",
            placeholder: "what",
            hint: "One character.",
            explanation: "Every variable name starts with `$`.",
          },
        ],
      },
      {
        id: "php-3",
        title: "OOP",
        minutes: 8,
        md: [
          S("class Dog {\n    private string $name;\n\n    public function __construct(string $name) {\n        $this->name = $name;\n    }\n\n    public function bark(): string {\n        return $this->name . ' says woof';\n    }\n}\n\n$d = new Dog('Rex');\necho $d->bark();"),
          "",
          "`->` calls on an object, `::` for static members. Properties are commonly `private` with getters and setters.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "Which operator accesses an object's method?",
            answers: ["->", "arrow", "->\n"],
            snippet: "echo $d->bark();",
            placeholder: "the operator",
            hint: "Contrast with the scope operator.",
            explanation:
              "`->` for instance members, `::` for static ones and constants.",
          },
        ],
      },
      {
        id: "php-4",
        title: "Strings & arrays",
        minutes: 8,
        md: [
          S('$s = "hello";\nstrlen($s);        // 5\nstrtoupper($s);\nstrpos($s, "ll");  // 2\nexplode(" ", "a b c");        // ["a","b","c"]\nimplode(",", $xs);\n\n$xs = array_map(fn($n) => $n * 2, [1, 2, 3]);\narray_filter($xs, fn($n) => $n > 2);\narray_reduce($xs, fn($c, $n) => $c + $n, 0);'),
          "",
          "Prefer the `array_*` functions over manual loops — they are faster and clearer.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does `array_map` return?",
            answers: [
              "a new array with fn applied to each element",
              "a new array",
              "a new transformed array",
            ],
            snippet: "array_map(fn($n) => $n * 2, $xs);",
            placeholder: "what",
            hint: "It does not modify the original.",
            explanation:
              "A new array with the callback applied to every element — the original is untouched.",
          },
        ],
      },
    ],
  },
  {
    const: "PHP_ADVANCED",
    id: "advanced",
    title: "Advanced",
    lessons: [
      {
        id: "php-5",
        title: "Type declarations & strict mode",
        minutes: 8,
        md: [
          S("declare(strict_types=1);   // must be the first line\n\nfunction add(int $a, int $b): int {\n    return $a + $b;\n}\n\nfunction maybe(): ?string { return null; }   // nullable\n\n// union types (PHP 8)\nfunction id(int|string $v): int|string { return $v; }"),
          "",
          "Without `strict_types`, PHP coerces `\"5\"` into `5`. With it, passing the wrong type throws a `TypeError`.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does `strict_types=1` change?",
            answers: [
              "no implicit type coercion",
              "it disables type juggling",
              "types must match exactly",
            ],
            snippet: "declare(strict_types=1);",
            placeholder: "what",
            hint: "Think about `\"5\"` where `5` is expected.",
            explanation:
              "It turns off silent coercion — wrong types raise a `TypeError` instead of being converted.",
          },
        ],
      },
      {
        id: "php-6",
        title: "Exceptions & error handling",
        minutes: 8,
        md: [
          S("try {\n    $r = 1 / 0;\n} catch (DivisionByZeroError $e) {\n    echo $e->getMessage();\n} finally {\n    echo \"always\";\n}\n\n// custom\nclass ValidationError extends Exception {}"),
          "",
          "PHP 7 turned most warnings into `Error`/`Exception` objects that can be caught. Use `finally` for cleanup.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "Which block always runs?",
            answers: ["finally", "finally block"],
            snippet: "try { ... } catch (\\Throwable $e) { ... } finally { ... }",
            placeholder: "the block",
            hint: "Same idea as in Java.",
            explanation:
              "`finally` runs on both the success and error paths — the right place for cleanup.",
          },
        ],
      },
      {
        id: "php-7",
        title: "Traits & interfaces",
        minutes: 8,
        md: [
          S("interface Jsonable {\n    public function toJson(): string;\n}\n\ntrait Timestamped {\n    public function touch(): void {\n        $this->updated = time();\n    }\n}\n\nclass Post implements Jsonable {\n    use Timestamped;      // mix in the behaviour\n\n    public function toJson(): string {\n        return json_encode(['title' => $this->title]);\n    }\n}"),
          "",
          "Traits are PHP's answer to the single-inheritance limit — they bundle methods you can reuse across unrelated classes.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What is a trait used for?",
            answers: [
              "reusing methods across classes",
              "reusing behaviour",
              "mixing in methods",
            ],
            snippet: "trait Timestamped { public function touch(): void { ... } }",
            placeholder: "what",
            hint: "PHP has single inheritance only.",
            explanation:
              "Traits let you compose behaviour into any class, working around single inheritance without inheritance coupling.",
          },
        ],
      },
      {
        id: "php-8",
        title: "Composer & modern PHP",
        minutes: 8,
        md: [
          S("composer require monolog/monolog\ncomposer require --dev phpunit/phpunit\ncomposer install\ncomposer dump-autoload"),
          "",
          "### What modern PHP (8+) gives you",
          "",
          "- Named arguments: `htmlspecialchars(string: $s)`",
          "- Constructor promotion: `function __construct(private string $name) {}`",
          "- Nullsafe operator: `$user?->name()`",
          "- Match expressions instead of long `switch` chains",
          "- Enums",
          "",
          S("enum Status {\n    case Draft;\n    case Published;\n}\n\n$status = Status::Draft;"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What is Composer's analogue to npm?",
            answers: ["package manager", "a package manager", "dependency manager"],
            placeholder: "what",
            hint: "It installs libraries.",
            explanation:
              "Composer is PHP's dependency manager — `composer.json` declares requirements, `composer install` resolves them.",
          },
        ],
      },
    ],
  },
];

export const CS_SECTIONS = [
  {
    const: "CS_BASICS",
    id: "basics",
    title: "Basics",
    lessons: [
      {
        id: "cs-1",
        title: "Hello, C#",
        minutes: 6,
        md: [
          S('using System;\n\nclass Program\n{\n    static void Main()\n    {\n        Console.WriteLine("Hello, C#!");\n    }\n}'),
          "",
          "Modern top-level statements skip the class entirely:",
          "",
          S('Console.WriteLine("Hello, C#!");'),
          "",
          "Build: `dotnet new console -o app` then `dotnet run`.",
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the call so the message reaches the console",
            template: "Console.___.WriteLine(\"hi\");",
            blanks: [{ options: ["Write", "Print", "Out"], answer: "Write" }],
            explanation: "`Console.WriteLine()` writes to standard output.",
          },
          {
            type: "quiz",
            prompt: "What is the entry point method called?",
            answers: ["main", "main\n"],
            snippet: "static void Main() { ... }",
            placeholder: "the name",
            hint: "One word, capitalised.",
            explanation:
              "`Main` — capitalised, though top-level statements let the compiler generate it for you.",
          },
        ],
      },
      {
        id: "cs-2",
        title: "Types & nullability",
        minutes: 8,
        md: [
          S("int i = 42;              // value type\nstring s = \"hi\";        // reference type\nstring? maybe = null;   // nullable\nint? opt = null;\n\n// value types cannot be null unless made nullable\n// var infers the type\nvar xs = new List<int> { 1, 2, 3 };"),
          "",
          "### Value vs reference types",
          "",
          "- `struct`, `enum`, primitives are **value types** — copied on assignment",
          "- `class`, `string`, arrays and most library types are **reference types**",
          "",
          S("struct P { public int X; }\nvar a = new P { X = 1 };\nvar b = a;\nb.X = 9;\n// a.X is still 1"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What marks a type as nullable?",
            answers: ["?", "a question mark", "?"],
            snippet: "string? maybe = null;",
            placeholder: "the syntax",
            hint: "One character after the type.",
            explanation:
              "A `?` suffix — `int?` and `string?` can hold `null`, plain `int` cannot.",
          },
        ],
      },
      {
        id: "cs-3",
        title: "OOP & properties",
        minutes: 9,
        md: [
          S("public class Dog\n{\n    private string _name;\n\n    public string Name\n    {\n        get => _name;\n        set => _name = value ?? throw new ArgumentNullException();\n    }\n\n    public Dog(string name) => Name = name;\n}\n\n// modern: primary constructor\n// public class Dog(string name) { public string Name { get; } = name; }"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What keyword declares a read-only auto property?",
            answers: ["init", "get only", "init;"],
            snippet: "public string Name { get; init; }",
            placeholder: "the keyword",
            hint: "Set once, at construction.",
            explanation:
              "`init` allows assignment only in a constructor or object initialiser — effectively immutable after creation.",
          },
        ],
      },
      {
        id: "cs-4",
        title: "Collections & LINQ",
        minutes: 9,
        md: [
          S("var xs = new List<int> { 1, 2, 3 };\nvar names = new[] { \"ada\", \"bob\" };\nvar ages = new Dictionary<string, int> { [\"ada\"] = 36 };\n\nvar evens = xs.Where(x => x % 2 == 0).ToList();\nvar doubled = xs.Select(x => x * 2).ToList();\nvar total = xs.Sum();\nvar any = xs.Any(x => x > 2);\nvar first = xs.FirstOrDefault();       // 0 if empty, no exception"),
          "",
          "LINQ is lazy until you materialise it with `ToList`, `ToArray`, `Count` or a terminal operator.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does `Select` do?",
            answers: [
              "projects each element",
              "transforms each element",
              "maps each element",
            ],
            snippet: "var doubled = xs.Select(x => x * 2).ToList();",
            placeholder: "what",
            hint: "It is the map operation.",
            explanation:
              "It projects (maps) every element through the function, producing a sequence of results.",
          },
        ],
      },
    ],
  },
  {
    const: "CS_ADVANCED",
    id: "advanced",
    title: "Advanced",
    lessons: [
      {
        id: "cs-5",
        title: "Interfaces & generics",
        minutes: 8,
        md: [
          S("public interface IShape\n{\n    double Area { get; }\n}\n\npublic record Circle(double R) : IShape\n{\n    public double Area => Math.PI * R * R;\n}\n\n// generic method\nT Max<T>(T a, T b) where T : IComparable<T>\n    => a.CompareTo(b) >= 0 ? a : b;"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What is a C# `record`?",
            answers: [
              "an immutable class with value equality",
              "a class with value equality",
              "immutable data class",
            ],
            snippet: "public record Circle(double R);",
            placeholder: "what",
            hint: "Think of it as a data holder.",
            explanation:
              "A reference type with generated value-based `Equals`, `GetHashCode` and `ToString` — ideal for small immutable data.",
          },
        ],
      },
      {
        id: "cs-6",
        title: "async & await",
        minutes: 9,
        md: [
          S("public async Task<int> LoadAsync()\n{\n    using var client = new HttpClient();\n    var body = await client.GetStringAsync(\"https://api.example.com\");\n    return body.Length;\n}\n\n// concurrent work\nvar results = await Task.WhenAll(ids.Select(id => LoadAsync(id)));"),
          "",
          "`async Task<T>` plus `await` is non-blocking. Never `.Result` or `.Wait()` on a task — that deadlocks.",
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the keyword to mark the method asynchronous",
            template: "public ___ Task<int> LoadAsync() { ... }",
            blanks: [{ options: ["async", "await"], answer: "async" }],
            explanation:
              "`async` marks the method; `await` pauses inside it while the operation runs without blocking the thread.",
          },
        ],
      },
      {
        id: "cs-7",
        title: "Exceptions & nullable reference types",
        minutes: 8,
        md: [
          S("try\n{\n    int x = int.Parse(s);\n}\ncatch (FormatException ex) when (s.Length < 3)\n{\n    // filtered — only this case\n}\ncatch (Exception ex)\n{\n    Console.WriteLine(ex.Message);\n}\nfinally\n{\n    // cleanup\n}"),
          "",
          "With nullable reference types enabled, `string?` may be null and `string` may not — the compiler warns before you hit a `NullReferenceException`.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does `finally` guarantee?",
            answers: [
              "it always runs",
              "always runs",
              "it runs even on exception",
            ],
            snippet: "try { ... } finally { ... }",
            placeholder: "what",
            hint: "Think about cleanup.",
            explanation:
              "It always runs, on both the success and exception paths.",
          },
        ],
      },
      {
        id: "cs-8",
        title: "dotnet CLI & tooling",
        minutes: 8,
        md: [
          S("dotnet new console -o app\ndotnet new webapi\ndotnet build\ndotnet run\ndotnet test\ndotnet add package Newtonsoft.Json\n\ndotnet publish -c Release -o out"),
          "",
          "### Project layout",
          "",
          S("MyApp/\n  MyApp.csproj\n  Program.cs\n  Models/User.cs\n  Services/UserService.cs\n  Tests/MyApp.Tests/"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "Which command creates a new console project?",
            answers: ["dotnet new console", "dotnet new console", "new console"],
            snippet: "$ dotnet new ___",
            placeholder: "the command",
            hint: "It follows `dotnet new`.",
            explanation:
              "`dotnet new console -o app` scaffolds a project; `dotnet new` has templates for web, classlib, xunit and more.",
          },
        ],
      },
    ],
  },
];

export const KT_SECTIONS = [
  {
    const: "KT_BASICS",
    id: "basics",
    title: "Basics",
    lessons: [
      {
        id: "kt-1",
        title: "Hello, Kotlin",
        minutes: 6,
        md: [
          S('fun main() {\n    println("Hello, Kotlin!")\n}'),
          "",
          "### Null safety is built in",
          "",
          S('var name: String = "ada"    // non-null\nvar nick: String? = null   // nullable\n\nfun greet(who: String) {\n    println("Hi $who")\n}\n\ngreet(nick)          // compile error — String? is not String\ngreet(nick ?: "friend")   // Elvis operator supplies a default\ngreet(nick!!)         // assert non-null — throws if it is'),
          "",
          "Kotlin also has data classes, expression bodies and no semicolons.",
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the type so the variable can be null",
            template: "var nick: ___ = null",
            blanks: [{ options: ["String?", "String", "?"], answer: "String?" }],
            explanation: "A `?` suffix makes a type nullable.",
          },
          {
            type: "quiz",
            prompt: "How do you pass a possibly-null value to a non-null parameter?",
            answers: [
              "with ?: or !!",
              "elvis or bang bang",
              "?: or !!",
              "using the elvis operator",
            ],
            snippet: "greet(nick)",
            placeholder: "how",
            hint: "Supply a default, or assert it is set.",
            explanation:
              "`nick ?: \"friend\"` supplies a default, `nick!!` asserts non-null. Plain `nick` is a compile error.",
          },
        ],
      },
      {
        id: "kt-2",
        title: "Data classes & collections",
        minutes: 8,
        md: [
          S("data class User(val name: String, val age: Int)\n\nval u = User(\"ada\", 36)\nval v = u.copy(age = 37)\nprintln(u)              // User(name=ada, age=36)\n\nval xs = listOf(1, 2, 3)\nval m = mapOf(\"a\" to 1)\nval evens = xs.filter { it % 2 == 0 }\nval doubled = xs.map { it * 2 }\nval total = xs.sum()"),
          "",
          "`data class` generates `equals`, `hashCode`, `toString` and `copy` for you.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does `copy` do on a data class?",
            answers: [
              "creates a copy with some fields changed",
              "makes a modified copy",
              "duplicates with changes",
            ],
            snippet: "val v = u.copy(age = 37)",
            placeholder: "what",
            hint: "You name the fields to change.",
            explanation:
              "`copy` returns a new instance with the named properties replaced — immutable update without a constructor call.",
          },
        ],
      },
      {
        id: "kt-3",
        title: "Scope functions",
        minutes: 8,
        md: [
          S('val u = User("ada", 36)\n\nval age = u.let { it.age }          // lambda param is `it`\nval a = u.apply { println(it.name) }   // `this` = u, returns u\nval b = u.also { log(it) }            // side effect, returns u\nwith(u) { println(name) }        // `this` = u\nval c = u.run { age + 1 }           // `this` = u, returns result'),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "Which scope function runs a block with `this` bound to the object and returns the object?",
            answers: ["apply", "also", "apply\n"],
            snippet: "val u = User(...)\nval same = u.apply { ... }",
            placeholder: "the function",
            hint: "You configured the object.",
            explanation:
              "`apply` configures and returns the receiver. `also` is for logging; `run` computes a result instead.",
          },
        ],
      },
    ],
  },
  {
    const: "KT_ADVANCED",
    id: "advanced",
    title: "Advanced",
    lessons: [
      {
        id: "kt-4",
        title: "Coroutines",
        minutes: 10,
        md: [
          S("suspend fun fetch(): String {\n    delay(1000)          // non-blocking pause\n    return \"done\"\n}\n\nfun main() = runBlocking {\n    launch { println(fetch()) }   // starts a coroutine\n    val v = fetch()              // suspends here, not the thread\n    println(v)\n}"),
          "",
          "`suspend` functions can only be called from another coroutine. `Dispatchers.IO` moves work off the main thread.",
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the keyword so the function can pause",
            template: "___ fun fetch(): String { ... }",
            blanks: [{ options: ["suspend", "async"], answer: "suspend" }],
            explanation:
              "`suspend` marks a function that can pause without blocking the thread.",
          },
        ],
      },
      {
        id: "kt-5",
        title: "Extension functions",
        minutes: 8,
        md: [
          S("fun String.shout(): String = this.uppercase() + \"!\"\n\nprintln(\"hi\".shout())     // HI!\n\nfun List<Int>.second(): Int = this[1]\n\n// used for the same helper in every project, without subclassing\nfun Int.clamp(to: Int) = if (this > to) to else this"),
          "",
          "Extensions cannot access private members, and member functions always win over extensions.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does `this` refer to inside an extension function?",
            answers: ["the receiver", "the object it is called on", "the receiver object"],
            snippet: "fun String.shout(): String = this.uppercase()",
            placeholder: "what",
            hint: "It is the value before the dot.",
            explanation:
              "The receiver — the value you called it on (`\"hi\".shout()` means `this` is `\"hi\"`).",
          },
        ],
      },
      {
        id: "kt-6",
        title: "Sealed classes & when",
        minutes: 8,
        md: [
          S("sealed interface Result<out T>\n{\n    data class Ok<T>(val value: T) : Result<T>\n    data class Err(val message: String) : Result<Nothing>\n}\n\nfun <T> render(r: Result<T>): String = when (r) {\n    is Result.Ok  -> r.value.toString()\n    is Result.Err -> r.message\n}"),
          "",
          "A `sealed` hierarchy is closed, so `when` can be exhaustive without an `else`.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "Why make a class `sealed`?",
            answers: [
              "to restrict who can subclass it",
              "to close the hierarchy",
              "to limit subclasses",
            ],
            snippet: "sealed interface Result<out T>",
            placeholder: "why",
            hint: "Think about the `when` exhaustiveness.",
            explanation:
              "Only the same file can subclass it — the hierarchy is closed, which lets `when` be checked for exhaustiveness.",
          },
        ],
      },
    ],
  },
];

export const DART_SECTIONS = [
  {
    const: "DART_BASICS",
    id: "basics",
    title: "Basics",
    lessons: [
      {
        id: "dart-1",
        title: "Hello, Dart",
        minutes: 6,
        md: [
          S('void main() {\n  print("Hello, Dart!");\n}'),
          "",
          "Dart is null-safe by default, optionally typed, and the language behind Flutter.",
          "",
          S("int n = 42;\nString s = \"hi\";\ndouble? maybe;      // nullable\nvar inferred = 1;   // dynamic-ish, still checked\nfinal fixed = 2;   // runtime constant\nconst compile = 3; // compile-time constant"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What type does Dart use for a variable that may be null?",
            answers: ["nullable type", "a nullable type", "int? and string?"],
            snippet: "int? maybe;",
            placeholder: "what",
            hint: "Look at the example.",
            explanation:
              "Any type with a `?` suffix — `int?`, `String?`. Plain `int` cannot be null.",
          },
        ],
      },
      {
        id: "dart-2",
        title: "Classes & null safety",
        minutes: 8,
        md: [
          S("class Dog {\n  final String name;\n  int _age;\n\n  Dog(this.name, this._age);   // initialising formals\n\n  int get age => _age;\n\n  set age(int v) {\n    if (v < 0) throw ArgumentError('negative');\n    _age = v;\n  }\n}\n\nfinal d = Dog('Rex', 3);\nprint(d.age);"),
          "",
          "### Null-aware operators",
          "",
          S("String? s;\nprint(s?.length);      // null — safe call\nprint(s ?? \"default\");  // default\ns ??= \"now set\";        // assign if null"),
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the operator to call only when not null",
            template: "print(name___length);",
            blanks: [{ options: ["?.", "!", "??"], answer: "?." }],
            explanation: "`?.` short-circuits to null instead of throwing.",
          },
        ],
      },
      {
        id: "dart-3",
        title: "Collections & async",
        minutes: 9,
        md: [
          S("final xs = [1, 2, 3];\nfinal ys = xs.where((n) => n.isEven).toList();\nfinal m = <String, int>{'a': 1};\nfinal s = <int>{1, 2, 2};      // a Set dedupes\n\nfinal doubled = xs.map((n) => n * 2).toList();"),
          "",
          "### Futures and streams",
          "",
          S("Future<String> load() async {\n  await Future.delayed(Duration(seconds: 1));\n  return 'done';\n}\n\nStream<int> ticks() async* {\n  yield 1;\n  yield 2;\n}"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What is Dart's equivalent of a promise?",
            answers: ["future", "a future", "futures"],
            snippet: "Future<String> load() async { ... }",
            placeholder: "what",
            hint: "It resolves to one value.",
            explanation:
              "`Future<T>` for one eventual value; `Stream<T>` for a series of them.",
          },
        ],
      },
    ],
  },
];

export const SWIFT_SECTIONS = [
  {
    const: "SWIFT_BASICS",
    id: "basics",
    title: "Basics",
    lessons: [
      {
        id: "swift-1",
        title: "Hello, Swift",
        minutes: 6,
        md: [
          S('import Foundation\n\nlet greeting = "Hello, Swift!"\nprint(greeting)'),
          "",
          "`let` is immutable, `var` is mutable. Types are usually inferred but must be consistent:",
          "",
          S("let n = 42            // Int\nvar s = \"hi\"\nlet d: Double = 3.14  // explicit\n\n// multiple bindings, no type mixing\nlet a = 1, b = 2, c = \"s\""),
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the keyword so the value can change",
            template: "___ count = 0\ncount += 1",
            blanks: [{ options: ["var", "let", "mutable"], answer: "var" }],
            explanation: "`var` is mutable; `let` is a constant.",
          },
          {
            type: "quiz",
            prompt: "Which keyword declares an immutable value?",
            answers: ["let", "let\n"],
            snippet: "let n = 42",
            placeholder: "the keyword",
            hint: "Three letters.",
            explanation:
              "`let` creates an immutable constant — Swift's default choice, opposite to JavaScript's `const`.",
          },
        ],
      },
      {
        id: "swift-2",
        title: "Optionals",
        minutes: 9,
        md: [
          "Swift has no `null`. A value that may be absent is wrapped in an Optional.",
          "",
          S("var name: String? = \"ada\"\nname = nil\n\nif let n = name {          // unwrap\n    print(n)\n}\n\nguard let n = name else { return }   // else must exit scope\n\nprint(name ?? \"unknown\")   // default\nprint(name!)               // crash if nil — avoid it"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "How do you unwrap an optional safely?",
            answers: ["if let", "optional binding", "if let or guard let"],
            snippet: "if let n = name { print(n) }",
            placeholder: "how",
            hint: "Two keywords, both common.",
            explanation:
              "`if let` or `guard let` bind only when a value exists. Force-unwrapping with `!` crashes on nil.",
          },
        ],
      },
      {
        id: "swift-3",
        title: "Structs, enums & protocols",
        minutes: 9,
        md: [
          S("struct Point {\n    var x: Int\n    var y: Int\n    func sum() -> Int { x + y }\n}\n\nvar p = Point(x: 1, y: 2)\np.x = 5\n\nenum Direction {\n    case north, south\n    case east(Int)          // associated value\n}\n\nprotocol Speak { func speak() -> String }\n\nstruct Dog: Speak {\n    func speak() -> String { \"woof\" }\n}"),
          "",
          "Structs are value types (copied on assignment); classes are reference types.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "Is a Swift `struct` copied or shared when assigned?",
            answers: ["copied", "it is copied", "value type, copied"],
            snippet: "var a = Point(x: 1, y: 2)\nvar b = a\nb.x = 9",
            placeholder: "what",
            hint: "Value type behaviour.",
            explanation:
              "Copied — structs are value types, so `b` is an independent copy and `a.x` is unchanged.",
          },
        ],
      },
    ],
  },
];

export const RB_SECTIONS = [
  {
    const: "RB_BASICS",
    id: "basics",
    title: "Basics",
    lessons: [
      {
        id: "rb-1",
        title: "Hello, Ruby",
        minutes: 6,
        md: [
          S('puts "Hello, Ruby!"'),
          "",
          "### Everything is an object and a method can stand alone",
          "",
          S('3.times do\n  puts "hi"\nend\n\n5.times { |i| puts i }\n\n2.upto(4) { |n| print n }   # 234'),
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the method so the text goes to the console",
            template: "___ \"Hello, Ruby!\"",
            blanks: [{ options: ["puts", "print", "echo"], answer: "puts" }],
            explanation: "`puts` prints with a newline; `print` does not.",
          },
          {
            type: "quiz",
            prompt: "What does `5.times { }` call?",
            answers: ["times", "times\n", "each"],
            snippet: "5.times { |i| puts i }",
            placeholder: "the method",
            hint: "It means 'do this N times'.",
            explanation:
              "`Integer#times` — a method on the number itself, called with an implicit block.",
          },
        ],
      },
      {
        id: "rb-2",
        title: "Blocks, arrays & hashes",
        minutes: 8,
        md: [
          S("xs = [1, 2, 3]\nys = xs.map { |n| n * 2 }\nxs.each_with_index { |n, i| puts \"#{i}: #{n}\" }\nxs.select { |n| n.odd? }\n\nages = { 'ada' => 36 }\nages.each { |k, v| puts \"#{k} is #{v}\" }\nages.map { |k, v| v }.sum\n\nxs.reduce(0) { |acc, n| acc + n }"),
          "",
          "Blocks are the core idea — almost every iterator takes one.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What is Ruby's equivalent of a dict called?",
            answers: ["hash", "a hash", "hashes"],
            snippet: "ages = { 'ada' => 36 }",
            placeholder: "what",
            hint: "Same idea as Python's dict.",
            explanation:
              "A `Hash` — key/value pairs written with `=>` and iterated with `each`.",
          },
        ],
      },
      {
        id: "rb-3",
        title: "Symbols & strings",
        minutes: 7,
        md: [
          S('name = "ada"     # a mutable String\nsym = :ada       # a Symbol — cheap, unique, immutable\n\nsym.to_s   # "ada"\n:ada.to_s  # "ada"\n\nh = { name: 1 }   # symbol key, no quotes needed\nh[:name]          # 1'),
          "",
          "Use symbols for identifiers, keys and method names; use strings for text you will edit.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "How do you write a Symbol literal?",
            answers: [":name", "colon prefix", "with a leading colon"],
            snippet: "sym = ___ada",
            placeholder: "how",
            hint: "One character prefix.",
            explanation:
              "A leading colon — `:ada`. Symbols are unique and immutable, so they are ideal for keys and identifiers.",
          },
        ],
      },
    ],
  },
];

export const LUA_SECTIONS = [
  {
    const: "LUA_BASICS",
    id: "basics",
    title: "Basics",
    lessons: [
      {
        id: "lua-1",
        title: "Hello, Lua",
        minutes: 6,
        md: [
          S('print("Hello, Lua!")'),
          "",
          "### Tables are the only data structure",
          "",
          S("local t = { 1, 2, 3 }           -- array\nlocal cfg = { mode = \"dark\" } -- dict\nprint(t[1], cfg.mode)      -- arrays start at 1\n\nfor i, v in ipairs(t) do print(i, v) end\nfor k, v in pairs(cfg) do print(k, v) end"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What is the index of the **first** element of a Lua array?",
            answers: ["1", "1\n"],
            snippet: "local t = { 10, 20 }\nprint(t[?])",
            placeholder: "the index",
            hint: "Lua arrays are 1-based.",
            explanation:
              "`1` — unlike most languages, Lua arrays start at index 1, so `t[1]` is the first element.",
          },
        ],
      },
      {
        id: "lua-2",
        title: "Functions & tables",
        minutes: 8,
        md: [
          S("local function add(a, b)\n  return a + b\nend\n\nlocal xs = { 1, 2, 3 }\ntable.insert(xs, 4)\ntable.remove(xs, 1)\ntable.sort(xs)\nprint(#xs)              -- length operator\nprint(table.concat(xs, \", \"))"),
          "",
          "`local` keeps the variable scoped — prefer it at file scope.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "How do you get the length of a Lua table?",
            answers: ["the # operator", "#", "#xs"],
            snippet: "print(#xs)",
            placeholder: "how",
            hint: "It is one character.",
            explanation:
              "The length operator `#`, which works on tables, strings and arrays.",
          },
        ],
      },
      {
        id: "lua-3",
        title: "Metatables & OOP",
        minutes: 8,
        md: [
          S("local Dog = {}\nDog.__index = Dog          -- lookups fall back here\n\nfunction Dog.new(name)\n  return setmetatable({ name = name }, Dog)\nend\n\nfunction Dog:speak()        -- : passes self\n  return self.name .. \" says woof\"\nend\n\nlocal d = Dog.new(\"Rex\")\nprint(d:speak())"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does `Dog.__index = Dog` do?",
            answers: [
              "makes missing keys look up on Dog",
              "sets the lookup fallback",
              "it is the method lookup mechanism",
            ],
            snippet: "Dog.__index = Dog",
            placeholder: "what",
            hint: "It is how methods get found.",
            explanation:
              "It sets the metatable's `__index` field — any key not found on the instance is looked up on `Dog`, which is how methods resolve.",
          },
        ],
      },
    ],
  },
];

export const BASH_SECTIONS = [
  {
    const: "BASH_BASICS",
    id: "basics",
    title: "Basics",
    lessons: [
      {
        id: "bash-1",
        title: "Hello, Bash",
        minutes: 6,
        md: [
          S('#!/bin/bash\n\necho "Hello, Bash!"'),
          "",
          "Run with `chmod +x script.sh && ./script.sh`, or source it with `source script.sh`.",
          "",
          "### Variables",
          "",
          S('name="world"\necho "Hello, $name"        # Hello, world\necho "Hello, ${name}"    # braces disambiguate\n\nread -p "Your name: " name\necho "$name"\n\nexport PATH="$PATH:$HOME/bin"   # visible to child processes'),
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the declaration so the value is a variable",
            template: '___="world"\necho "Hello, $___"',
            blanks: [{ options: ["name", "NAME", "var"], answer: "name" }],
            explanation: "In bash an unquoted assignment sets a variable: `name=\"world\"`.",
          },
          {
            type: "quiz",
            prompt: "Which declaration makes a variable visible to **child processes**?",
            answers: ["export", "export\n"],
            snippet: '___ PATH="$PATH:$HOME/bin"',
            placeholder: "the keyword",
            hint: "One word.",
            explanation:
              "`export` puts it in the environment, so commands you run can read it. Without it the variable is local to the shell.",
          },
        ],
      },
      {
        id: "bash-2",
        title: "Arguments, tests & control flow",
        minutes: 8,
        md: [
          S("#!/bin/bash\n\nif [ $# -eq 0 ]; then\n    echo \"no args\"\nfi\n\necho \"$@\"      # all args\nfor f in \"$@\"; do echo \"$f\"; done\n\nif [ -f \"$1\" ]; then echo \"file exists\"; fi\n\ncase \"$1\" in\n    start) echo \"starting\" ;;\n    stop)  echo \"stopping\" ;;\n    *)     echo \"usage\"; exit 1 ;;\nesac"),
          "",
          "Always quote `\"$var\"` — unquoted values split on whitespace and glob.",
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the keyword to exit the script early",
            template: "echo \"bad input\"; ___ 1",
            blanks: [{ options: ["exit", "quit", "stop"], answer: "exit" }],
            explanation: "`exit 1` ends the script with a non-zero status, which is how you signal failure.",
          },
          {
            type: "quiz",
            prompt: "Why should you write `\"$var\"` rather than `$var`?",
            answers: [
              "unquoted values split on spaces",
              "unquoted splits on whitespace",
              "to stop word splitting",
              "to avoid word splitting and globbing",
            ],
            snippet: 'rm $file   # breaks on spaces\necho "$file"',
            placeholder: "why",
            hint: "Try a filename with a space in it.",
            explanation:
              "Unquoted, the shell splits on whitespace and expands globs, so `rm $f` could delete the wrong files.",
          },
        ],
      },
      {
        id: "bash-3",
        title: "Pipes & scripting",
        minutes: 8,
        md: [
          S("cat access.log | grep \" 500 \" | awk '{print $7}' | sort | uniq -c | sort -rn | head"),
          "",
          "Every stage reads stdin and writes stdout — that is what makes them chainable.",
          "",
          S("set -euo pipefail     # exit on error, unset var, or failed pipe\ntrap 'echo \"failed on line $LINENO\"' ERR\n\nfor f in *.txt; do\n    echo \"processing $f\"\ndone"),
          "",
          "Redirect with `>` for stdout, `2>` for stderr and `>>` to append.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does `set -e` do?",
            answers: [
              "exits when a command fails",
              "exit on error",
              "it stops on error",
            ],
            snippet: "set -euo pipefail",
            placeholder: "what",
            hint: "One flag, one behaviour.",
            explanation:
              "`set -e` stops the script when any command returns non-zero, so errors are not silently ignored.",
          },
        ],
      },
    ],
  },
];

export const ASM_SECTIONS = [
  {
    const: "ASM_BASICS",
    id: "basics",
    title: "Basics",
    lessons: [
      {
        id: "asm-1",
        title: "Hello, Assembly",
        minutes: 10,
        md: [
          "Linux x86-64 assembly uses two calling conventions: **System V** (userland, what `gcc` uses) and **Microsoft** (Windows).",
          "",
          S("global _start\n\nsection .data\n    msg db \"Hello, ASM!\", 10    ; db = define byte, 10 is newline\n    len equ $ - msg              ; length of the string\n\nsection .text\n_start:\n    mov rax, 1          ; sys_write\n    mov rdi, 1          ; stdout\n    mov rsi, msg        ; buffer\n    mov rdx, len        ; count\n    syscall\n\n    mov rax, 60         ; sys_exit\n    xor rdi, rdi        ; exit code 0\n    syscall"),
          "",
          "- `syscall` invokes the kernel",
          "- `rax` = syscall number",
          "- `nasm` assembles, `ld` links (the Playground runs both)",
          "",
          "```bash",
          "nasm -f elf64 hello.asm -o hello.o",
          "ld hello.o -o hello",
          "./hello",
          "```",
          "",
          "Registers you will use constantly: `rax` (return/syscall), `rdi`/`rsi`/`rdx` (first three args), `rsp` (stack).",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "Which register holds the **syscall number**?",
            answers: ["rax", "rax\n"],
            snippet: "mov rax, 1   ; sys_write\nsyscall",
            placeholder: "the register",
            hint: "It is also the return-value register.",
            explanation:
              "`rax` holds the syscall number before `syscall`, and the kernel returns the result in it too.",
          },
          {
            type: "quiz",
            prompt: "What does `syscall` do?",
            answers: [
              "invokes the kernel",
              "calls the kernel",
              "it enters the kernel",
            ],
            snippet: "mov rax, 60\nsyscall",
            placeholder: "what",
            hint: "The arguments must be set first.",
            explanation:
              "It transfers control into the kernel with the arguments already placed in the registers.",
          },
        ],
      },
    ],
  },
];