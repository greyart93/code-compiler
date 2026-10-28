// Java course content, split by section so each file stays readable.
// Types come from course-types.ts.
import type { SectionSeed } from "./course-types";

const jv = (code: string) => "```java\n" + code + "\n```";

// ───────────────────────── 1. Basics ─────────────────────────

export const JAVA_BASICS: SectionSeed = {
  id: "basics",
  title: "Basics",
  lessons: [
    {
      id: "jv-1",
      title: "Hello, Java",
      minutes: 6,
      md: [
        "Java is **compiled** to bytecode and runs on the JVM.",
        "",
        "Every program needs a `main` method inside a class:",
        "",
        jv('public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}'),
        "",
        "Run it: `javac Main.java` then `java Main`.",
        "",
        "### Naming conventions",
        "",
        "- Classes: `PascalCase` — `class BankAccount`",
        "- Methods & variables: `camelCase` — `depositMoney`",
        "- Constants: `UPPER_SNAKE` — `MAX_BALANCE`",
        "- Every statement ends with `;`",
      ].join("\n"),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Complete the line so the message reaches the console",
          template: 'System.___.println("Hello");',
          blanks: [{ options: ["out", "console", "log"], answer: "out" }],
          explanation: "`System.out.println()` is Java's print-to-console call.",
        },
        {
          type: "quiz",
          prompt: "What does the JVM run?",
          answers: ["bytecode", "bytecode\n", "java bytecode"],
          placeholder: "what",
          hint: "`javac` does not produce a `.class` for the source directly…",
          explanation:
            "`javac` compiles source to bytecode, and the JVM executes that bytecode — which is why Java is platform independent.",
        },
      ],
    },
    {
      id: "jv-2",
      title: "Variables & types",
      minutes: 7,
      md: [
        "Java is **statically typed** — every variable has a declared type that never changes.",
        "",
        jv("int age = 30;\nlong big = 9_000_000_000L;\ndouble pi = 3.14;\nfloat f = 1.5f;\nchar c = 'a';          // single quotes\nboolean ok = true;\nString name = \"Ada\";    // capital S, NOT a primitive"),
        "",
        "### The two categories",
        "",
        jv("// primitives — 8 of them, always raw values\nbyte short int long float double char boolean\n\n// objects — reference types, start with capital\nString Integer ArrayList"),
        "",
        "### Casting",
        "",
        jv("int a = 3;\ndouble b = a;      // widening — always safe\nint c = (int) b;  // narrowing — needs an explicit cast\n\nchar z = (char) 98;   // 'b' — chars are ints under the hood"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Which type holds whole numbers up to ~9 quintillion?",
          answers: ["long", "long\n"],
          placeholder: "the type",
          hint: "`int` tops out around 2 billion.",
          explanation:
            "`long` is 64-bit. Note the `L` suffix — `9_000_000_000` without it does not fit in an `int`.",
        },
        {
          type: "quiz",
          prompt: "What is the difference between `char` and `String`?",
          answers: [
            "char is one character, string is text",
            "char holds a single character",
            "char is single character",
          ],
          snippet: "char c = 'a';\nString s = \"abc\";",
          placeholder: "describe the difference",
          hint: "Look at the quotes and the count.",
          explanation:
            "`char` is a primitive holding exactly one character in single quotes. `String` is a class holding a sequence in double quotes.",
        },
      ],
    },
    {
      id: "jv-3",
      title: "Control flow",
      minutes: 7,
      md: [
        jv("int n = 7;\nif (n % 2 == 0) {\n    System.out.println(\"even\");\n} else {\n    System.out.println(\"odd\");\n}\n\nfor (int i = 0; i < 3; i++) {\n    System.out.println(i);\n}\n\nwhile (n > 0) {\n    n--;\n}"),
        "",
        "### `switch` — the modern form",
        "",
        jv("int day = 3;\nswitch (day) {\n    case 1 -> System.out.println(\"Mon\");\n    case 2 -> System.out.println(\"Tue\");\n    default -> System.out.println(\"Other\");\n}"),
        "",
        "### Looping over collections",
        "",
        jv("for (int i = 0; i < xs.length; i++) { ... }\nfor (String s : names) { ... }   // for-each, cleaner"),
        "",
        "`break` exits the loop; `continue` skips to the next iteration.",
      ].join("\n"),
      exercises: [
        {
          type: "fill-blank",
          prompt: "Complete the keyword so the block runs when `n` is even",
          template: "int n = 7;\n___ (n % 2 == 0) {\n    System.out.println(\"even\");\n}",
          blanks: [{ options: ["if", "when", "check"], answer: "if" }],
          explanation: "`if (condition) { ... }` opens a conditional block.",
        },
        {
          type: "quiz",
          prompt: "Which loop form iterates a collection without an index?",
          answers: ["for-each", "for each", "foreach", "enhanced for", "for-each loop"],
          snippet: "for (String s : names) { ... }",
          placeholder: "name it",
          hint: "It is the loop with a colon in the header.",
          explanation:
            "The for-each loop — `for (T item : collection)` — avoids manual indexing and cannot skip past the size.",
        },
      ],
    },
    {
      id: "jv-4",
      title: "Methods",
      minutes: 7,
      md: [
        jv("public static int add(int a, int b) {\n    return a + b;\n}\n\n// overloading: same name, different parameters\npublic static int add(int a, int b, int c) {\n    return a + b + c;\n}\n\n// varargs: any number of args\npublic static int sum(int... nums) {\n    int t = 0;\n    for (int n : nums) t += n;\n    return t;\n}"),
        "",
        "### Pass by value",
        "",
        jv("static void bump(int n) {\n    n = 100;          // changes the local copy only\n}\n\nint x = 1;\nbump(x);\nSystem.out.println(x);   // 1"),
        "",
        "Primitives are copied; **objects are passed by reference to their copy**, so mutating fields on an object works, reassigning the parameter does not.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "How are Java arguments passed?",
          answers: ["by value", "value", "pass by value", "always by value"],
          snippet: "static void f(int n) { n = 99; }",
          placeholder: "how",
          hint: "Even objects are passed by value.",
          explanation:
            "Always by value. For objects the value *is* the reference, so you can mutate the object but not swap the caller's reference.",
        },
      ],
    },
    {
      id: "jv-5",
      title: "Arrays & strings",
      minutes: 8,
      md: [
        jv("int[] xs = {1, 2, 3};       // the usual form\nint[] ys = new int[5];       // zeroes\n\nSystem.out.println(xs[0]);      // 1\nSystem.out.println(xs.length);   // 3 — .length not a method\n\nfor (int x : xs) System.out.println(x);"),
        "",
        "### Multi-dimensional",
        "",
        jv("int[][] grid = new int[3][3];\nint[][] lit = {{1,2},{3,4}};\nSystem.out.println(lit[1][0]);   // 3"),
        "",
        "### Strings are immutable",
        "",
        jv('String s = "hello";\ns.toUpperCase();     // returns a NEW string, s is unchanged\ns.length();          // 5\ns.charAt(0);         // \'h\'\ns.indexOf("ll");\ns.substring(1, 3);   // "el"\nString joined = String.join("-", "a", "b");   // a-b'),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "How do you get the length of an array in Java?",
          answers: ["xs.length", "length", ".length", "xs.length\n"],
          snippet: "int[] xs = {1,2,3};\n// print its size",
          placeholder: "the expression",
          hint: "It is a field, not a method call.",
          explanation:
            "`xs.length` — a public final field. Strings use `s.length()` with parentheses because that is a method.",
        },
      ],
    },
    {
      id: "jv-6",
      title: "Exceptions",
      minutes: 7,
      md: [
        "Checked exceptions must be declared or caught; unchecked ones need not.",
        "",
        jv("try {\n    int x = Integer.parseInt(\"abc\");   // throws NumberFormatException\n} catch (NumberFormatException | NullPointerException e) {\n    System.out.println(\"bad input: \" + e.getMessage());\n} finally {\n    System.out.println(\"always runs\");\n}"),
        "",
        "### Throwing and declaring",
        "",
        jv("static void check(int n) throws Exception {\n    if (n < 0) throw new IllegalArgumentException(\"negative\");\n}"),
        "",
        "### try-with-resources",
        "",
        jv("try (BufferedReader r = new BufferedReader(new FileReader(\"f.txt\"))) {\n    System.out.println(r.readLine());\n}   // closed automatically"),
        "",
        "Common ones: `NullPointerException`, `ArrayIndexOutOfBoundsException`, `ClassCastException`, `NumberFormatException`.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Which block always runs?",
          answers: ["finally", "finally block", "the finally block"],
          snippet: "try { ... } catch (Exception e) { ... } finally { ... }",
          placeholder: "the block",
          hint: "It means 'in any case'.",
          explanation:
            "`finally` runs whether or not an exception was thrown — the usual place for cleanup.",
        },
      ],
    },
  ],
};

// ───────────────────────── 2. OOP ─────────────────────────

export const JAVA_OOP: SectionSeed = {
  id: "oop",
  title: "Object-oriented",
  lessons: [
    {
      id: "jv-7",
      title: "Classes & objects",
      minutes: 8,
      md: [
        jv("public class Dog {\n    private String name;      // private: not visible outside\n    private int age;\n\n    public Dog(String name, int age) {   // constructor\n        this.name = name;\n        this.age = age;\n    }\n\n    public String getName() { return name; }\n\n    @Override\n    public String toString() {\n        return name + \" (\" + age + \")\";\n    }\n}"),
        "",
        "### The rules that matter",
        "",
        "- Fields are **private** by convention; expose them with getters/setters",
        "- Constructors have no return type, not even `void`",
        "- `this` refers to the current object",
        "- One public class per file, named after the file",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Does a Java constructor declare a return type?",
          answers: ["no", "no it doesnt", "not even void", "none"],
          snippet: "public Dog(String n) { ... }",
          placeholder: "yes or no",
          hint: "Even `void` is wrong.",
          explanation:
            "No — naming the constructor defines its signature, so any return type would be a compile error.",
        },
      ],
    },
    {
      id: "jv-8",
      title: "Inheritance & polymorphism",
      minutes: 9,
      md: [
        jv("public class Animal {\n    protected String name;\n\n    public Animal(String name) { this.name = name; }\n\n    public String speak() { return \"...\"; }\n}\n\npublic class Cat extends Animal {\n    public Cat(String name) { super(name); }   // call parent first\n\n    @Override\n    public String speak() { return \"meow\"; }\n}"),
        "",
        "### Why polymorphism matters",
        "",
        jv("Animal[] pets = { new Dog(\"Rex\"), new Cat(\"Tom\") };\nfor (Animal a : pets) {\n    System.out.println(a.speak());   // woof, meow — decided at runtime\n}"),
        "",
        "`final` prevents overriding, `abstract` demands subclasses implement it, `super` reaches the parent.",
      ].join("\n"),
      exercises: [
        {
          type: "output",
          prompt: "What does this print? Predict, then run.",
          starterCode:
            'class A { String f() { return "A"; } }\nclass B extends A { String f() { return "B"; } }\n\nclass P {\n  public static void main(String[] a) {\n    A x = new B();\n    System.out.println(x.f());\n  }\n}',
          expectedOutput: "B",
          answerLabel: "Type what this prints",
          hint: "The object decides which method runs, not the variable's type.",
        },
        {
          type: "quiz",
          prompt: "Which keyword stops a method from being overridden?",
          answers: ["final", "final\n"],
          snippet: "public ___ String f() { ... }",
          placeholder: "the keyword",
          hint: "It means 'this is final'.",
          explanation:
            "`final` forbids overriding in a subclass — the method body is fixed at compile time.",
        },
      ],
    },
    {
      id: "jv-9",
      title: "Interfaces & abstract classes",
      minutes: 8,
      md: [
        jv("public interface Drawable {\n    void draw();              // implicitly public abstract\n    default void label() {    // optional shared behaviour\n        System.out.println(\"a shape\");\n    }\n}\n\npublic class Circle implements Drawable {\n    @Override public void draw() { System.out.println(\"circle\"); }\n}"),
        "",
        "### Interface vs abstract class",
        "",
        "| | Interface | Abstract class |",
        "|---|---|---|",
        "| Fields | all `public static final` | any |",
        "| Multiple inheritance | yes | no, only one class |",
        "| Constructor | none | yes |",
        "",
        "Use an interface to express *what* something can do; an abstract class to share *how* among related subclasses.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "How many interfaces can a class implement?",
          answers: ["many", "multiple", "any number", "more than one", "several"],
          snippet: "class C implements A, B { ... }",
          placeholder: "how many",
          hint: "Classes get one superclass, but interfaces are unlimited.",
          explanation:
            "Any number — that is how Java gets multiple inheritance of *behaviour* while classes still have a single parent.",
        },
      ],
    },
    {
      id: "jv-10",
      title: "Collections framework",
      minutes: 10,
      md: [
        jv("import java.util.*;\n\nList<String> list = new ArrayList<>();      // ordered, duplicates\nSet<Integer> set = new HashSet<>();        // unique, fast contains\nMap<String, Integer> map = new HashMap<>(); // key -> value\n\nlist.add(\"a\");\nmap.put(\"a\", 1);\n\nfor (Map.Entry<String, Integer> e : map.entrySet()) {\n    System.out.println(e.getKey() + \"=\" + e.getValue());\n}"),
        "",
        "### Picking one",
        "",
        "| Need | Use |",
        "|---|---|",
        "| ordered, allows dupes | `ArrayList` / `LinkedList` |",
        "| unique values | `HashSet` / `TreeSet` (sorted) |",
        "| lookup by key | `HashMap` / `TreeMap` (sorted) |",
        "",
        "Also useful: `ArrayDeque` as a stack or queue, `Collections.sort(list)`, `list.sort(null)`.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Which collection gives O(1) lookup by key?",
          answers: ["hashmap", "map", "a map", "hashmap\n", "hash map"],
          snippet: 'Map<String, Integer> m = new HashMap<>();',
          placeholder: "the type",
          hint: "It hashes the key.",
          explanation:
            "`HashMap` hashes keys for average O(1) `get`/`put`. `TreeMap` is sorted but O(log n).",
        },
        {
          type: "quiz",
          prompt: "Does a `Set` allow duplicates?",
          answers: ["no", "no it doesnt", "it does not", "no, duplicates are removed"],
          placeholder: "yes or no",
          hint: "Think about what makes a set a set.",
          explanation:
            "No — adding an existing element is a no-op, which is exactly how `Set` removes duplicates.",
        },
      ],
    },
  ],
};

// ───────────────────────── 3. Advanced ─────────────────────────

export const JAVA_ADVANCED: SectionSeed = {
  id: "advanced",
  title: "Advanced",
  lessons: [
    {
      id: "jv-11",
      title: "Generics",
      minutes: 8,
      md: [
        jv("public class Box<T> {\n    private T item;\n    public void set(T item) { this.item = item; }\n    public T get() { return item; }\n}\n\nBox<String> b = new Box<>();   // <T> is inferred\nb.set(\"hi\");"),
        "",
        "### Bounded wildcards",
        "",
        jv("public static double total(List<? extends Number> xs) {\n    double t = 0;\n    for (Number n : xs) t += n.doubleValue();\n    return t;\n}\n\n// ? extends T  — reads only (producer)\n// ? super T    — writes only (consumer)\n// ?            — anything"),
        "",
        "Generic **methods** declare their own type parameter:",
        "",
        jv("static <T> T first(List<T> xs) { return xs.get(0); }"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What does `<T>` on a class stand for?",
          answers: ["a type placeholder", "type parameter", "a type variable", "type placeholder\n"],
          snippet: "class Box<T> { ... }",
          placeholder: "what it is",
          hint: "It is swapped for a real type at compile time.",
          explanation:
            "A type parameter — a placeholder filled in by the compiler so the class works with any type safely.",
        },
      ],
    },
    {
      id: "jv-12",
      title: "Streams & lambdas",
      minutes: 10,
      md: [
        jv("import java.util.stream.*;\n\nList<String> names = List.of(\"ada\", \"bob\", \"cat\");\n\nnames.stream()\n     .filter(n -> n.length() > 2)\n     .map(String::toUpperCase)\n     .sorted()\n     .forEach(System.out::println);"),
        "",
        "### Terminal operations",
        "",
        jv("long count = names.stream().filter(n -> n.startsWith(\"a\")).count();\nint total = Stream.of(1, 2, 3).mapToInt(Integer::intValue).sum();\nOptional<String> first = names.stream().findFirst();\nString csv = names.stream().collect(Collectors.joining(\", \"));"),
        "",
        "### Parallel streams",
        "",
        jv("long n = bigList.parallelStream().filter(...).count();   // across cores\n// only worth it for large data and CPU-bound work"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What is the point of a Java **stream**?",
          answers: [
            "pipeline operations over collections",
            "pipelines data",
            "to chain operations",
            "chaining operations",
            "pipeline",
          ],
          snippet: 'names.stream().filter(...).map(...).forEach(...);',
          placeholder: "why",
          hint: "It is about composing operations.",
          explanation:
            "Streams let you chain transformations in a pipeline without intermediate lists — lazy, and parallelisable.",
        },
      ],
    },
    {
      id: "jv-13",
      title: "Exception design & try-with-resources",
      minutes: 8,
      md: [
        jv("public class InsufficientFunds extends Exception {\n    public InsufficientFunds(double need) {\n        super(\"need \" + need);\n    }\n}\n\nstatic void withdraw(double n) throws InsufficientFunds {\n    if (n > 100) throw new InsufficientFunds(n);\n}"),
        "",
        "### Unchecked vs checked",
        "",
        jv("// unchecked — subclasses of RuntimeException, no declaration needed\nNullPointerException, IllegalArgumentException\n\n// checked — subclasses of Exception, must be caught or declared\nIOException, SQLException"),
        "",
        "### The right way to close resources",
        "",
        jv("try (BufferedReader r = new BufferedReader(new FileReader(\"f.txt\"))) {\n    r.readLine();\n}   // closed even if readLine() throws"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Which is a **checked** exception?",
          answers: ["ioexception", "sqlexception", "filenotfoundexception"],
          snippet: "try { ... } catch (??? e) { ... }",
          placeholder: "one example",
          hint: "It is not a RuntimeException.",
          explanation:
            "`IOException`, `SQLException` and `FileNotFoundException` are checked — the compiler forces you to handle them.",
        },
      ],
    },
    {
      id: "jv-14",
      title: "Files, NIO & streams of data",
      minutes: 8,
      md: [
        jv("import java.nio.file.*;\n\nPath p = Paths.get(\"data.txt\");\nFiles.exists(p);\nString text = Files.readString(p);           // Java 11+\nFiles.writeString(p, \"hello\");\n\nFiles.lines(p).forEach(System.out::println);  // lazy Stream<String>\nFiles.list(dir).count();"),
        "",
        "### Buffered streams, old style",
        "",
        jv("try (BufferedReader r = Files.newBufferedReader(p)) {\n    String line;\n    while ((line = r.readLine()) != null) { ... }\n}"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Which class represents a **file path**?",
          answers: ["path", "java.nio.file.path", "a path"],
          placeholder: "the class",
          hint: "It is in `java.nio.file`.",
          explanation:
            "`Path` is the modern abstraction — `Paths.get(...)` builds one, and `Files` does the actual work.",
        },
      ],
    },
    {
      id: "jv-15",
      title: "Concurrency",
      minutes: 10,
      md: [
        jv("Runnable r = () -> System.out.println(\"task\");\nThread t = new Thread(r);\nt.start();\nt.join();      // wait for it"),
        "",
        "### The Executor — the way you should do it",
        "",
        jv("ExecutorService pool = Executors.newFixedThreadPool(4);\npool.submit(() -> System.out.println(\"hi\"));\npool.shutdown();"),
        "",
        "### Shared state needs locks",
        "",
        jv("private final AtomicInteger count = new AtomicInteger(0);\ncount.incrementAndGet();     // safe without a lock\n\nsynchronized void bump() { count++; }   // coarse alternative"),
        "",
        "`volatile` guarantees visibility across threads; it does **not** make compound operations atomic.",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Which is the preferred way to create threads in modern Java?",
          answers: ["executorservice", "executor", "an executor", "executor service"],
          snippet: "var pool = Executors.newFixedThreadPool(4);",
          placeholder: "what",
          hint: "Not `new Thread()`.",
          explanation:
            "An `ExecutorService` reuses a pool of threads and manages shutdown for you; raw threads need manual lifecycle handling.",
        },
      ],
    },
    {
      id: "jv-16",
      title: "Strings interning & text",
      minutes: 7,
      md: [
        jv('String a = "hi";\nString b = "hi";\nSystem.out.println(a == b);   // true — literals are interned\n\nString c = new String("hi");\nSystem.out.println(a == c);   // false — use .equals() instead'),
        "",
        "### The builders",
        "",
        jv('StringBuilder sb = new StringBuilder();\nsb.append("a").append(1);\n\nStringBuffer sf = new StringBuffer();   // thread-safe, slower\n\nString out = String.join(", ", "a", "b");\nString fmt = String.format("%s has %d apples", name, n);\nString[] parts = csv.split(",");\nString trimmed = "  x  ".strip();   // Java 11+'),
      ].join("\n"),
      exercises: [
        {
          type: "output",
          prompt: "What does this print? Predict, then run.",
          starterCode:
            'class P {\n  public static void main(String[] a) {\n    String x = new String("hi");\n    String y = new String("hi");\n    System.out.println(x.equals(y));\n  }\n}',
          expectedOutput: "true",
          answerLabel: "Type what this prints",
          hint: "Compare contents, not references.",
        },
      ],
    },
    {
      id: "jv-17",
      title: "Testing with JUnit",
      minutes: 8,
      md: [
        jv("import org.junit.jupiter.api.*;\n\nclass CalcTest {\n    @Test\n    void adds() {\n        assertEquals(3, new Calc().add(1, 2));\n    }\n\n    @Test\n    void throwsOnNegative() {\n        assertThrows(IllegalArgumentException.class,\n            () -> new Calc().add(1, -1));\n    }\n\n    @ParameterizedTest\n    @ValueSource(ints = {1, 2, 3})\n    void positive(int n) {\n        assertTrue(new Calc().isPositive(n));\n    }\n}"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What annotation marks a test method?",
          answers: ["@test", "test", "@test\n"],
          snippet: "@__\nvoid adds() { ... }",
          placeholder: "the annotation",
          hint: "It is the JUnit 5 name.",
          explanation:
            "`@Test` tells JUnit to run that method; `@BeforeEach` runs setup and `@ParameterizedTest` runs one case per input.",
        },
      ],
    },
    {
      id: "jv-18",
      title: "Algorithms & Big-O",
      minutes: 10,
      md: [
        jv("// O(1)      HashMap.get, array index\n// O(log n)   Arrays.binarySearch\n// O(n)       one pass\n// O(n log n) Arrays.sort\n// O(n^2)     nested loops"),
        "",
        "### Sorting with a comparator",
        "",
        jv('List<String> xs = new ArrayList<>(List.of("pear", "fig"));\nxs.sort(Comparator.comparingInt(String::length));\nxs.sort(Comparator.naturalOrder());\nxs.sort(Comparator.reverseOrder());'),
        "",
        "### Two pointers",
        "",
        jv("static int[] twoSum(int[] xs, int target) {\n    Map<Integer, Integer> seen = new HashMap<>();\n    for (int i = 0; i < xs.length; i++) {\n        int want = target - xs[i];\n        if (seen.containsKey(want)) return new int[]{seen.get(want), i};\n        seen.put(xs[i], i);\n    }\n    return new int[]{};\n}"),
      ].join("\n"),
      exercises: [
        {
          type: "challenge",
          problem:
            "Read space-separated integers from stdin and print the **largest**.\n\nExample: input `3 9 2` → output `9`",
          starterCode:
            'import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) throws Exception {\n    var sc = new Scanner(System.in);\n    // read the ints and print the largest\n  }\n}',
          tests: [
            { input: "3 9 2", expected: "9", label: "3 9 2 → 9" },
            { input: "-5 -1 -9", expected: "-1", label: "-5 -1 -9 → -1" },
            { input: "7", expected: "7", label: "7 → 7" },
          ],
          hint: "Read tokens with a Scanner and track a running max.",
        },
      ],
    },
    {
      id: "jv-19",
      title: "Design patterns",
      minutes: 10,
      md: [
        jv("// Singleton — one instance\npublic class Config {\n    private static Config instance;\n    private Config() {}\n    public static Config get() {\n        if (instance == null) instance = new Config();\n        return instance;\n    }\n}"),
        "",
        "### Strategy — swap the algorithm at runtime",
        "",
        jv("interface Pay { double fee(int amount); }\n\nrecord CardPay(double pct) implements Pay {\n    public double fee(int a) { return a * pct; }\n}\n\n// checkout takes a Pay, so the rule is swappable"),
        "",
        "### Others worth knowing",
        "",
        "- **Observer** — listeners, event handlers",
        "- **Factory** — centralise object creation",
        "- **Builder** — many optional constructor args",
        "- **Adapter** — make an incompatible API fit",
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Which pattern keeps **one** instance of a class?",
          answers: ["singleton", "the singleton pattern", "singleton\n"],
          snippet: "Config.get()",
          placeholder: "the pattern",
          hint: "Its name is a cardinal number.",
          explanation:
            "Singleton hides the constructor and hands out one shared instance via a static accessor.",
        },
      ],
    },
    {
      id: "jv-20",
      title: "Build tools & project layout",
      minutes: 6,
      md: [
        jv("myapp/\n  pom.xml            (Maven)\n  build.gradle       (Gradle)\n  src/main/java/com/app/Main.java\n  src/test/java/com/app/MainTest.java"),
        "",
        "### Maven",
        "",
        jv("mvn clean package      # build a jar\nmvn test               # run tests\nmvn exec:java           # run the main class"),
        "",
        "### Gradle",
        "",
        jv("./gradlew build\n./gradlew test\n./gradlew bootRun"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Which file declares a Maven project's dependencies?",
          answers: ["pom.xml", "pom", "pom.xml\n"],
          placeholder: "the filename",
          hint: "It is Maven's descriptor.",
          explanation:
            "`pom.xml` is Maven's project object model; Gradle uses `build.gradle` instead.",
        },
      ],
    },
  ],
};