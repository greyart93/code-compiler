// Structured lesson data for the remaining courses.
// Each md entry is a string, or a code block object which the generator wraps
// in the right fence. Run: node scripts/gen-languages.mjs

const S = (s) => ({ code: s });

export const TS_SECTIONS = [
  {
    const: "TS_BASICS",
    id: "basics",
    title: "Basics",
    lessons: [
      {
        id: "ts-1",
        title: "Types 101",
        minutes: 6,
        md: [
          "TypeScript is JavaScript with types checked before it runs.",
          "",
          S("let n: number = 1;\nlet s: string = \"hi\";\nlet b: boolean = true;\nlet xs: number[] = [1, 2];\n\nfunction add(a: number, b: number): number {\n  return a + b;\n}"),
          "",
          "- `number`, `string`, `boolean`, `null`, `undefined`",
          "- `any` opts out — treat it as a last resort",
          "- `unknown` is the safe version of `any`",
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Add the type annotation so this variable is a string",
            template: 'let name: ___ = "ada";',
            blanks: [{ options: ["string", "str", "text"], answer: "string" }],
            explanation: "`string` is the primitive string type.",
          },
          {
            type: "quiz",
            prompt: "What is the difference between `any` and `unknown`?",
            answers: [
              "unknown is safe, any disables checking",
              "unknown requires narrowing",
              "any disables checks, unknown is safe",
            ],
            snippet: "let a: any;    let u: unknown;",
            placeholder: "the difference",
            hint: "One of them defeats the compiler.",
            explanation:
              "`any` turns off type checking entirely. `unknown` accepts anything on assignment but you must narrow before using it.",
          },
        ],
      },
      {
        id: "ts-2",
        title: "Interfaces & type aliases",
        minutes: 7,
        md: [
          S("interface User {\n  id: number;\n  name: string;\n  email?: string;   // optional\n}\n\ntype Id = string | number;   // union\ntype Pair = [string, number]; // tuple\n\nconst u: User = { id: 1, name: \"ada\" };"),
          "",
          "`interface` for object shapes, `type` for everything else. Use `extends`:",
          "",
          S("interface Admin extends User {\n  level: \"root\" | \"staff\";\n}"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What marks an interface property as optional?",
            answers: ["?", "a question mark", "?"],
            snippet: "interface U {\n  email?: string;\n}",
            placeholder: "the syntax",
            hint: "One character.",
            explanation:
              "A `?` after the name — the property may be absent or `undefined`.",
          },
        ],
      },
      {
        id: "ts-3",
        title: "Generics",
        minutes: 8,
        md: [
          S("function first<T>(xs: T[]): T | undefined {\n  return xs[0];\n}\n\nconst n = first([1, 2, 3]);   // number | undefined\n\nfunction pair<A, B>(a: A, b: B): [A, B] {\n  return [a, b];\n}"),
          "",
          "### Constraints",
          "",
          S("function len<T extends { length: number }>(x: T): number {\n  return x.length;\n}\n\nfunction uniq<T>(xs: T[]): T[] { ... }"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does a generic `<T>` give you?",
            answers: [
              "a reusable type-safe container",
              "type safety for any type",
              "reusable type-safe code",
            ],
            snippet: "function first<T>(xs: T[]): T { ... }",
            placeholder: "why",
            hint: "Compare with `any`.",
            explanation:
              "You write the logic once and it stays fully type-checked for every type you use it with.",
          },
        ],
      },
      {
        id: "ts-4",
        title: "Narrowing & unions",
        minutes: 8,
        md: [
          S("function print(x: string | number) {\n  if (typeof x === \"string\") {\n    x.toUpperCase();   // narrowed to string\n  } else {\n    x.toFixed(2);      // narrowed to number\n  }\n}"),
          "",
          "### Discriminated unions",
          "",
          S("type Shape =\n  | { kind: \"circle\"; r: number }\n  | { kind: \"rect\"; w: number; h: number };\n\nfunction area(s: Shape) {\n  switch (s.kind) {\n    case \"circle\": return Math.PI * s.r ** 2;\n    case \"rect\":   return s.w * s.h;\n  }\n}"),
          "",
          "Other guards: `in`, `instanceof`, `Array.isArray`, and user-defined `x is T` predicates.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "How do you narrow `string | number` to `string`?",
            answers: ["typeof check", "a typeof check", "typeof x === string", "typeof"],
            snippet: "function f(x: string | number) { ... }",
            placeholder: "how",
            hint: "It checks the runtime type.",
            explanation:
              "A `typeof` check (or `instanceof`, `in`, or a discriminated union) lets the compiler narrow the union for you.",
          },
        ],
      },
      {
        id: "ts-5",
        title: "Utility types",
        minutes: 6,
        md: [
          S("interface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\ntype PartialUser = Partial<User>;        // all optional\ntype ReadonlyUser = Readonly<User>;    // none assignable\ntype Pick1 = Pick<User, \"id\" | \"name\">;\ntype Omit1 = Omit<User, \"email\">;\ntype Rec = Record<\"a\" | \"b\", number>;\n\nfunction update(u: User): Partial<User> {\n  return { name: \"new\" };    // typechecked against User\n}"),
          "",
          "These turn an interface into derived types without repeating the fields — and they stay in sync automatically.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "Which utility type makes every property optional?",
            answers: ["partial", "Partial", "partial<>"],
            snippet: "type X = ___<User>;",
            placeholder: "the name",
            hint: "It describes partial objects.",
            explanation:
              "`Partial<T>` — ideal for update functions where you only send the fields that changed.",
          },
        ],
      },
      {
        id: "ts-6",
        title: "Classes & access modifiers",
        minutes: 7,
        md: [
          S("class Counter {\n  private count = 0;\n  readonly id: number;\n\n  constructor(id: number) {\n    this.id = id;\n  }\n\n  increment(): this {\n    this.count++;\n    return this;\n  }\n\n  get value(): number { return this.count; }\n}"),
          "",
          "Modifiers: `private` (class only), `protected` (class + subclasses), `public` (default). `readonly` blocks writes after construction.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does `readonly` prevent?",
            answers: [
              "writing to it after construction",
              "writes",
              "modifying it after the constructor",
            ],
            snippet: "class C {\n  readonly id = 1;\n}",
            placeholder: "what",
            hint: "It can be set once.",
            explanation:
              "Reassignment anywhere after the constructor — the value is fixed once initialised.",
          },
        ],
      },
    ],
  },
  {
    const: "TS_ADVANCED",
    id: "advanced",
    title: "Advanced",
    lessons: [
      {
        id: "ts-7",
        title: "Type guards & conditional types",
        minutes: 9,
        md: [
          S("function isString(x: unknown): x is string {\n  return typeof x === \"string\";\n}\n\nfunction f(x: unknown) {\n  if (isString(x)) x.toUpperCase();   // narrowed\n}"),
          "",
          "### Conditional and mapped types",
          "",
          S("type IsString<T> = T extends string ? true : false;\ntype Unwrap<T> = T extends Promise<infer U> ? U : T;\n\ntype Flags<T> = { readonly [K in keyof T]?: boolean };\n\ntype Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };"),
          "",
          "### `as const`",
          "",
          S("const cfg = { mode: \"dark\" } as const;\n// cfg.mode is the literal \"dark\", not string"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does the `is` part of `x is string` do?",
            answers: [
              "makes it a type guard",
              "it creates a type predicate",
              "declares a type guard",
            ],
            snippet: "function isString(x: unknown): x is string { ... }",
            placeholder: "what",
            hint: "The caller benefits from it.",
            explanation:
              "It declares a **type predicate** — TypeScript narrows the argument wherever the guard returns true.",
          },
        ],
      },
      {
        id: "ts-8",
        title: "Modules & declarations",
        minutes: 7,
        md: [
          S("// named\nexport function f() {}\nexport const x = 1;\n\n// default\nexport default function App() {}\n\n// re-export\n// utils.ts\nexport * from \"./math\";\nexport { helper as calc } from \"./math\";"),
          "",
          "### Ambient types for untyped JS",
          "",
          S("// types.d.ts\ndeclare module \"legacy-lib\" {\n  export function old(a: number): string;\n}\n\n// path aliases in tsconfig.json\n{ \"compilerOptions\": { \"paths\": { \"@/*\": [\"./src/*\"] } } }"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "How many modules can a file export by default?",
            answers: ["one", "1", "only one"],
            snippet: "export default App;",
            placeholder: "how many",
            hint: "Named exports can be many.",
            explanation:
              "Exactly one `export default`. Named `export`s can be unlimited, and a module can have both.",
          },
        ],
      },
      {
        id: "ts-9",
        title: "Strict mode & compiler options",
        minutes: 7,
        md: [
          "The settings that actually catch bugs:",
          "",
          "```json",
          "{",
          '  "compilerOptions": {',
          '    "strict": true,',
          '    "noUncheckedIndexedAccess": true,',
          '    "noImplicitOverride": true,',
          '    "noUnusedLocals": true,',
          '    "exactOptionalPropertyTypes": true,',
          '    "target": "ES2022"',
          "  }",
          "}",
          "```",
          "",
          "`strict` alone enables `strictNullChecks`, `noImplicitAny` and four others — turn it on first.",
          "",
          "`noUncheckedIndexedAccess` is the one most people skip: it makes `arr[0]` be `T | undefined`, which is honest.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "Which option makes `arr[i]` include `undefined` in its type?",
            answers: [
              "noUncheckedIndexedAccess",
              "nouncheckedindexedaccess",
              "noUncheckedIndexedAccess\n",
            ],
            snippet: "{ \"compilerOptions\": { ... } }",
            placeholder: "the option",
            hint: "It is about indexing.",
            explanation:
              "`noUncheckedIndexedAccess` stops the compiler pretending out-of-bounds indices always succeed.",
          },
        ],
      },
      {
        id: "ts-10",
        title: "Typing the DOM & APIs",
        minutes: 8,
        md: [
          S("const el = document.querySelector<HTMLInputElement>(\"#name\");\nel?.value;\n\ninterface Window {\n  myApp: { version: string };\n}\n\nasync function load(url: string): Promise<unknown> {\n  const res = await fetch(url);\n  if (!res.ok) throw new Error(res.statusText);\n  return res.json();\n}"),
          "",
          "The DOM ships with types. For third-party libraries, either install `@types/*` or write a `.d.ts` declaration yourself.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does `querySelector` return without a generic?",
            answers: ["element or null", "element | null", "null if not found"],
            snippet: 'const el = document.querySelector("#x");',
            placeholder: "what",
            hint: "It might not be there.",
            explanation:
              "`Element | null` — always check for `null` before using it, or use the optional chain `el?.`.",
          },
        ],
      },
    ],
  },
];

export const GO_SECTIONS = [
  {
    const: "GO_BASICS",
    id: "basics",
    title: "Basics",
    lessons: [
      {
        id: "go-1",
        title: "Hello, Go",
        minutes: 6,
        md: [
          "Go is compiled, statically typed, and every file starts with a `package`.",
          "",
          S('package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, Go!")\n}'),
          "",
          "Build and run: `go run main.go`, or `go build && ./app`.",
          "",
          "### Exports start with a capital",
          "",
          S("// person.go\ntype Person struct {\n\tName string   // exported\n\tage  int      // unexported\n}\n\nfunc (p Person) Greet() string { return \"hi \" + p.Name }"),
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the declaration so this function is exported",
            template: "func ___ add(a, b int) int { return a + b }",
            blanks: [{ options: ["", "export", "pub"], answer: "" }],
            explanation:
              "Go has no `export` keyword — a capital first letter (`Add`) makes a function or type exported.",
          },
          {
            type: "quiz",
            prompt: "How do you **export** a function in Go?",
            answers: [
              "capitalize its name",
              "capital letter",
              "start with a capital",
              "uppercase first letter",
            ],
            snippet: "func Add(a, b int) int { ... }",
            placeholder: "how",
            hint: "There is no keyword.",
            explanation:
              "An identifier starting with an upper-case letter is exported. Lowercase keeps it package-private.",
          },
        ],
      },
      {
        id: "go-2",
        title: "Variables & zero values",
        minutes: 7,
        md: [
          S('package main\n\nimport "fmt"\n\nfunc main() {\n\tvar x int          // zero value: 0\n\tvar s string       // ""\n\tvar p *int         // nil\n\tvar ok bool        // false\n\n\ty := 10            // short declaration inside a function\n\tfmt.Println(x, s, p, ok, y)\n}'),
          "",
          "### Multiple assignment",
          "",
          S("a, b := 1, 2\na, b = b, a    // swap in one line\n\nv, err := os.Open(\"f\")\nif err != nil {\n    return err\n}"),
          "",
          "Go has no `null` — pointer types use `nil`, and slices/maps can be `nil` safely.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What is the zero value of a `bool` in Go?",
            answers: ["false", "false\n"],
            snippet: "var ok bool\nfmt.Println(ok)",
            placeholder: "the value",
            hint: "Go always initialises declared variables.",
            explanation:
              "`false` — every declared variable gets a zero value automatically: 0, \"\", nil, or false.",
          },
        ],
      },
      {
        id: "go-3",
        title: "Slices & maps",
        minutes: 8,
        md: [
          S("xs := []int{1, 2, 3}        // slice\nxs = append(xs, 4)          // returns a new slice\nxs = xs[1:3]                 // slice of a slice\n\nm := map[string]int{\"a\": 1}\nm[\"b\"] = 2\nv, ok := m[\"missing\"]      // ok tells you if it existed\ndelete(m, \"a\")\n\n// a nil slice is safe to range and append to\nvar empty []int"),
          "",
          "Slices share backing memory, so appending can surprise you:",
          "",
          S("a := []int{1, 2}\nb := a\nb[0] = 99\nfmt.Println(a[0])   // 99 — same backing array"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does `append` return?",
            answers: ["a new slice", "new slice", "a slice"],
            snippet: "xs = append(xs, 4)",
            placeholder: "what",
            hint: "It does not modify in place.",
            explanation:
              "A possibly-reallocated new slice — you must assign the result back, which is why the idiom is `xs = append(xs, 4)`.",
          },
          {
            type: "quiz",
            prompt: "How do you check a key exists in a map?",
            answers: [
              "the two-value form of lookup",
              "v, ok := m[k]",
              "comma ok",
              "comma ok form",
            ],
            snippet: 'v, ok := m["key"]',
            placeholder: "how",
            hint: "One extra variable.",
            explanation:
              "`v, ok := m[k]` — `ok` is false when the key is absent, so you never confuse a missing key with a zero value.",
          },
        ],
      },
      {
        id: "go-4",
        title: "Functions & error handling",
        minutes: 8,
        md: [
          S("func add(a, b int) int {\n\treturn a + b\n}\n\n// multiple returns — extremely common\nfunc divmod(a, b int) (int, int) {\n\treturn a / b, a % b\n}\n\nq, r := divmod(10, 3)   // 3, 1"),
          "",
          "### Errors are values",
          "",
          S('func read(path string) ([]byte, error) {\n\tb, err := os.ReadFile(path)\n\tif err != nil {\n\t\treturn nil, fmt.Errorf("read %s: %w", path, err)\n\t}\n\treturn b, nil\n}'),
          "",
          "Always check the error. Wrap with `%w` so `errors.Is` / `errors.As` keep working.",
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the statement so the error is handled",
            template: 'f, err := os.Open("x")\nif err != nil {\n    return ___\n}',
            blanks: [{ options: ["err", "error"], answer: "err" }],
            explanation: "`return err` propagates the error to the caller.",
          },
          {
            type: "quiz",
            prompt: "What is Go's equivalent of exceptions?",
            answers: [
              "returned error values",
              "error values",
              "errors as return values",
              "returned errors",
            ],
            snippet: "func f() (int, error) { ... }",
            placeholder: "what",
            hint: "Errors travel in the return values.",
            explanation:
              "Errors are ordinary return values, so every failure path is visible in the signature and the compiler forces you to handle it.",
          },
        ],
      },
      {
        id: "go-5",
        title: "Structs & methods",
        minutes: 8,
        md: [
          S("type Point struct {\n\tX, Y int\n}\n\nfunc (p Point) Sum() int { return p.X + p.Y }      // value receiver\nfunc (p *Point) Move(dx int) { p.X += dx }         // pointer receiver\n\np := Point{X: 1, Y: 2}\np.Move(5)                    // Go takes &p for you"),
          "",
          "### Value vs pointer receivers",
          "",
          "- Use a **value receiver** for small, read-only methods",
          "- Use a **pointer receiver** when you mutate, or the struct is large",
          "- Be consistent — mixing both on one type is a bug factory",
          "",
          "### Embedded structs",
          "",
          S("type Base struct{ ID int }\ntype User struct {\n\tBase        // promoted: u.ID works\n\tName string\n}"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "When should a method use a **pointer** receiver?",
            answers: [
              "when it modifies the receiver",
              "when modifying",
              "when it mutates",
              "when it changes the struct",
            ],
            snippet: "func (p *Point) Move(d int) { p.X += d }",
            placeholder: "when",
            hint: "Think about copies.",
            explanation:
              "A pointer receiver can mutate the original; a value receiver only ever sees a copy. Use a pointer if you change anything.",
          },
        ],
      },
    ],
  },
  {
    const: "GO_ADVANCED",
    id: "advanced",
    title: "Advanced",
    lessons: [
      {
        id: "go-6",
        title: "Interfaces",
        minutes: 9,
        md: [
          S("type Speaker interface {\n\tSpeak() string\n}\n\ntype Dog struct{}\n\nfunc (d Dog) Speak() string { return \"woof\" }\n\nfunc main() {\n\tvar s Speaker = Dog{}   // implicit\n\tfmt.Println(s.Speak())\n}"),
          "",
          "Go interfaces are **implicit** and satisfied structurally — `Dog` never declares it implements `Speaker`.",
          "",
          "### The empty interface",
          "",
          S("func printAll(xs ...interface{}) {   // any in modern Go\n\tfor _, x := range xs {\n\t\tfmt.Println(x)\n\t}\n}"),
          "",
          "Keep interfaces small. A one- or two-method interface is easier to implement than a large one.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "How does a type satisfy a Go interface?",
            answers: [
              "structurally, by having the methods",
              "implicitly",
              "by implementing the methods",
              "structurally",
            ],
            snippet: "type Dog struct{}\nfunc (d Dog) Speak() string { ... }",
            placeholder: "how",
            hint: "There is no `implements` keyword.",
            explanation:
              "Implicitly and structurally — if a type has the right method set it satisfies the interface, with no declaration needed.",
          },
        ],
      },
      {
        id: "go-7",
        title: "Goroutines & channels",
        minutes: 10,
        md: [
          S("func main() {\n\tch := make(chan int)\n\n\tgo func() {\n\t\tch <- 42        // send\n\t}()\n\n\tfmt.Println(<-ch)   // receive — blocks until ready\n}"),
          "",
          "### `select`",
          "",
          S("select {\ncase v := <-results:\n\tfmt.Println(v)\ncase <-time.After(2 * time.Second):\n\tfmt.Println(\"timed out\")\n}"),
          "",
          "### `WaitGroup`",
          "",
          S("var wg sync.WaitGroup\nfor _, job := range jobs {\n\twg.Add(1)\n\tgo func(j Job) {\n\t\tdefer wg.Done()\n\t\tprocess(j)\n\t}(job)\n}\nwg.Wait()"),
        ],
        exercises: [
          {
            type: "output",
            prompt: "What does this print? Predict, then run.",
            starterCode:
              'package main\n\nimport "fmt"\n\nfunc main() {\n\tch := make(chan int, 1)\n\tch <- 7\n\tfmt.Println(<-ch)\n}',
            expectedOutput: "7",
            answerLabel: "Type what this prints",
            hint: "A buffered channel of size 1 holds the value until it is read.",
          },
          {
            type: "quiz",
            prompt: "What happens when you read from an empty, unbuffered channel?",
            answers: ["the goroutine blocks", "it blocks", "blocks until a value arrives"],
            snippet: "ch := make(chan int)\nfmt.Println(<-ch)",
            placeholder: "what",
            hint: "Channels synchronise.",
            explanation:
              "The receiving goroutine blocks until another goroutine sends — that blocking is exactly the synchronisation you want.",
          },
        ],
      },
      {
        id: "go-8",
        title: "Concurrency patterns",
        minutes: 9,
        md: [
          "### Worker pool",
          "",
          S("jobs := make(chan int, 100)\nresults := make(chan int, 100)\n\nvar wg sync.WaitGroup\nfor w := 1; w <= 4; w++ {\n\twg.Add(1)\n\tgo func() {\n\t\tdefer wg.Done()\n\t\tfor j := range jobs {\n\t\t\tresults <- j * 2\n\t\t}\n\t}()\n}\n\nclose(jobs)\nwg.Wait()\nclose(results)\n\nfor r := range results {\n\tfmt.Println(r)\n}"),
          "",
          "Always `close` a channel when the sender is done, and `sync.Once` when a value must be initialised exactly once.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "When should you `close` a channel?",
            answers: [
              "when the sender is finished",
              "after the last send",
              "when the producing goroutine ends",
            ],
            snippet: "close(results)",
            placeholder: "when",
            hint: "Closing tells receivers to stop.",
            explanation:
              "Once the last send is done — receivers ranging over the channel then see the close and finish cleanly instead of blocking forever.",
          },
        ],
      },
      {
        id: "go-9",
        title: "Generics",
        minutes: 8,
        md: [
          S("func Map[T, U any](xs []T, f func(T) U) []U {\n\tout := make([]U, 0, len(xs))\n\tfor _, x := range xs {\n\t\tout = append(out, f(x))\n\t}\n\treturn out\n}\n\ns := Map([]int{1, 2}, func(i int) string { return fmt.Sprint(i) })"),
          "",
          "Go 1.18 added generics. `any` is an alias for `interface{}`. Go also has **type sets** for constraining what a type parameter accepts:",
          "",
          S("type Number interface {\n\t~int | ~float64\n}\n\nfunc Sum[T Number](xs []T) T { ... }"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does the `~` in `~int | ~float64` mean?",
            answers: [
              "allows types with that underlying type",
              "underlying type",
              "matches named types too",
            ],
            snippet: "type Number interface {\n\t~int | ~float64\n}",
            placeholder: "what",
            hint: "Think of `type MyInt int`.",
            explanation:
              "`~` widens the set to include any type whose underlying type matches, so `type MyInt int` is accepted too.",
          },
        ],
      },
      {
        id: "go-10",
        title: "Testing & tooling",
        minutes: 8,
        md: [
          S("package math\n\nimport \"testing\"\n\nfunc TestAdd(t *testing.T) {\n\tif got := Add(1, 2); got != 3 {\n\t\tt.Errorf(\"Add(1,2) = %d, want 3\", got)\n\t}\n}\n\nfunc TestTable(t *testing.T) {\n\tcases := []struct{ name string; in, want int }{\n\t\t{\"one\", 1, 1},\n\t\t{\"two\", 2, 2},\n\t}\n\tfor _, c := range cases {\n\t\tt.Run(c.name, func(t *testing.T) { ... })\n\t}\n}"),
          "",
          "### Everyday commands",
          "",
          S("go test ./...\ngo test -race ./...      # the race detector — always run it\ngo vet ./...\ngofmt -w .\ngo mod init myapp && go mod tidy"),
          "",
          "`-race` finds data races at runtime for free. Format with `gofmt` — it is not negotiable.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "Which flag detects data races at runtime?",
            answers: ["-race", "race", "-race\n"],
            snippet: "go test ___ ./...",
            placeholder: "the flag",
            hint: "It is about threads.",
            explanation:
              "`-race` instruments the binary and reports unsynchronised access between goroutines while your tests run.",
          },
        ],
      },
    ],
  },
];

export const RUST_SECTIONS = [
  {
    const: "RUST_BASICS",
    id: "basics",
    title: "Basics",
    lessons: [
      {
        id: "rs-1",
        title: "Hello, Rust",
        minutes: 7,
        md: [
          S('fn main() {\n    println!("Hello, Rust!");\n}'),
          "",
          "Build: `cargo new myapp`, `cargo run`, `cargo build --release`.",
          "",
          "### Variables are immutable by default",
          "",
          S("let x = 5;\nx = 6;            // error\nlet mut y = 6;\ny = 7;            // ok\n\nlet z: i32 = 8;   // explicit type"),
          "",
          "Rust makes the safe thing the default and requires `mut` to opt in.",
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the keyword so this variable can be reassigned",
            template: "let ___ count = 0;\ncount += 1;",
            blanks: [{ options: ["mut", "var", "change"], answer: "mut" }],
            explanation:
              "`let mut` makes a binding mutable. Plain `let` is immutable by design.",
          },
          {
            type: "quiz",
            prompt: "In Rust, what is a `let` binding by default?",
            answers: ["immutable", "immutable\n"],
            snippet: "let x = 5;\nx = 6;   // compile error",
            placeholder: "what",
            hint: "You need `mut` to change it.",
            explanation:
              "Immutable. Rust defaults to immutability and asks for `mut` explicitly when a value needs to change.",
          },
        ],
      },
      {
        id: "rs-2",
        title: "Ownership & borrowing",
        minutes: 10,
        md: [
          "Rust gives every value one owner. When the owner goes out of scope, the value is dropped.",
          "",
          S('fn main() {\n    let s1 = String::from("hello");\n    let s2 = s1;            // moved — s1 is now invalid\n    println!("{}", s2);\n    // println!("{}", s1);   // error: borrow of moved value\n}'),
          "",
          "### Borrowing avoids the move",
          "",
          S("fn len(s: &String) -> usize { s.len() }\n\nlet a = String::from(\"hi\");\nlet n = len(&a);       // borrow, a still usable"),
          "",
          "Borrow rules: many `&T` or one `&mut T`, never both.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What happens to `s1` after `let s2 = s1;`?",
            answers: ["it is moved", "moved", "it cannot be used", "it becomes invalid"],
            snippet: 'let s1 = String::from("hi");\nlet s2 = s1;',
            placeholder: "what",
            hint: "There is only one owner.",
            explanation:
              "Ownership moves to `s2` and `s1` can no longer be used — that is how Rust avoids double frees at compile time.",
          },
        ],
      },
      {
        id: "rs-3",
        title: "Enums & pattern matching",
        minutes: 9,
        md: [
          S("enum Shape {\n    Circle(f64),\n    Rect { w: f64, h: f64 },\n}\n\nfn area(s: &Shape) -> f64 {\n    match s {\n        Shape::Circle(r) => 3.14 * r * r,\n        Shape::Rect { w, h } => w * h,\n    }\n}"),
          "",
          "`match` must be exhaustive. Use a catch-all when you genuinely do not care:",
          "",
          S("match maybe_num {\n    Some(n) if n > 10 => println!(\"big\"),\n    Some(_) => println!(\"small\"),\n    None => println!(\"nothing\"),\n}"),
          "",
          "`if let` is the shorthand for a single interesting case.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What must a `match` cover?",
            answers: ["every possible value", "all cases", "every case"],
            snippet: "match shape { ... }",
            placeholder: "what",
            hint: "The compiler checks it.",
            explanation:
              "Every possible case. Miss one and it will not compile — which is exactly why `match` is safe.",
          },
        ],
      },
      {
        id: "rs-4",
        title: "Error handling",
        minutes: 9,
        md: [
          "Rust has no exceptions. Failures are values in the return type.",
          "",
          S("fn read(path: &str) -> Result<String, std::io::Error> {\n    let s = std::fs::read_to_string(path)?;   // ? returns early on error\n    Ok(s)\n}\n\nmatch read(\"f.txt\") {\n    Ok(s)  => println!(\"{}\", s),\n    Err(e) => eprintln!(\"failed: {}\", e),\n}"),
          "",
          "`?` unwraps or returns. Panics (`unwrap`, `expect`) are for bugs, not expected failures.",
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the operator to return early on error",
            template: "let s = std::fs::read_to_string(p)___;",
            blanks: [{ options: ["?", "!", "."], answer: "?" }],
            explanation:
              "The `?` operator returns `Err` if the value is an error and unwraps it on success.",
          },
          {
            type: "quiz",
            prompt: "What does the `?` operator do?",
            answers: [
              "returns the error early",
              "returns early on error",
              "unwraps or returns err",
            ],
            snippet: "let s = read_to_string(p)?;",
            placeholder: "what",
            hint: "It saves you writing match.",
            explanation:
              "On `Ok` it unwraps the value, on `Err` it returns the error from the enclosing function — the standard way to handle failures.",
          },
        ],
      },
      {
        id: "rs-5",
        title: "Traits & generics",
        minutes: 9,
        md: [
          S("trait Speak {\n    fn speak(&self) -> String;\n}\n\nstruct Dog;\nimpl Speak for Dog {\n    fn speak(&self) -> String { \"woof\".to_string() }\n}\n\nfn greet<T: Speak>(x: &T) -> String {\n    x.speak()\n}"),
          "",
          "Generics are zero-cost — monomorphised at compile time, no runtime dispatch.",
          "",
          S("fn largest<T: PartialOrd>(xs: &[T]) -> &T {\n    let mut best = &xs[0];\n    for x in xs {\n        if x > best { best = x; }\n    }\n    best\n}"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What is a trait in Rust?",
            answers: [
              "a set of methods a type can implement",
              "an interface",
              "a shared behaviour contract",
            ],
            snippet: "trait Speak {\n    fn speak(&self) -> String;\n}",
            placeholder: "what",
            hint: "Similar to an interface.",
            explanation:
              "A trait is a contract for behaviour — like an interface, but you can implement it for types you do not own, including foreign ones.",
          },
        ],
      },
    ],
  },
  {
    const: "RUST_ADVANCED",
    id: "advanced",
    title: "Advanced",
    lessons: [
      {
        id: "rs-6",
        title: "Lifetimes",
        minutes: 10,
        md: [
          "Lifetimes describe how long a reference is valid. Most of the time the compiler infers them.",
          "",
          S("fn longer<'a>(x: &'a str, y: &'a str) -> &'a str {\n    if x.len() > y.len() { x } else { y }\n}"),
          "",
          "### `'static`",
          "",
          S('fn shout(s: &\'static str) -> String { s.to_uppercase() }\n// string literals live for the whole program'),
          "",
          "Lifetime annotations only appear in function signatures — never in struct fields you can avoid. If a struct holds references, it gets a lifetime parameter:",
          "",
          S("struct Excerpt<'a> {\n    part: &'a str,\n}"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does the `'static` lifetime mean?",
            answers: [
              "lives for the whole program",
              "lives forever",
              "the entire program",
            ],
            snippet: "fn f(s: &'static str) { ... }",
            placeholder: "what",
            hint: "Think about string literals.",
            explanation:
              "The reference is valid for the entire program — string literals are the usual case.",
          },
        ],
      },
      {
        id: "rs-7",
        title: "Smart pointers",
        minutes: 9,
        md: [
          S("use std::rc::Rc;\nuse std::cell::RefCell;\n\nlet a = Rc::new(5);\nlet b = Rc::clone(&a);   // shared ownership\n\n// interior mutability\nlet v = RefCell::new(1);\n*v.borrow_mut() += 1;"),
          "",
          "| Type | Ownership | Counted | Mutable after creation |",
          "|---|---|---|---|",
          "| `Box<T>` | one | no | no |",
          "| `Rc<T>` | shared | yes | no |",
          "| `Arc<T>` | shared (threads) | yes | no |",
          "| `RefCell<T>` | one | — | yes, checked at runtime |",
          "",
          "`Box::new` also escapes the stack-size limit for large values, and `Box<dyn Trait>` is trait object syntax.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "Which smart pointer allows **shared ownership**?",
            answers: ["rc", "std::rc::rc", "arc"],
            snippet: "let a = ___::new(5);\nlet b = Rc::clone(&a);",
            placeholder: "the type",
            hint: "Reference counted.",
            explanation:
              "`Rc` for single-threaded shared ownership (`Arc` across threads). `Box` gives unique ownership only.",
          },
        ],
      },
      {
        id: "rs-8",
        title: "Concurrency",
        minutes: 10,
        md: [
          S("use std::thread;\n\nlet h = thread::spawn(|| {\n    42\n});\n\nlet n = h.join().unwrap();   // waits for the thread\n\n// moving data into a thread\nlet s = String::from(\"hi\");\nthread::spawn(move || println!(\"{}\", s));"),
          "",
          "### Channels",
          "",
          S("use std::sync::mpsc;\n\nlet (tx, rx) = mpsc::channel();\n\nthread::spawn(move || tx.send(42).unwrap());\n\nlet got = rx.recv().unwrap();"),
          "",
          "`Send` and `Sync` are auto-derived marker traits — the compiler refuses to share across threads unless it is provably safe.",
        ],
        exercises: [
          {
            type: "fill-blank",
            prompt: "Complete the keyword so the closure takes ownership of `s`",
            template: 'let s = String::from("hi");\nthread::spawn(___ || println!("{}", s));',
            blanks: [{ options: ["move", "async", "ref"], answer: "move" }],
            explanation:
              "`move` moves `s` into the thread's closure, which is required since the thread outlives the main function's scope.",
          },
        ],
      },
      {
        id: "rs-9",
        title: "Iterators & closures",
        minutes: 9,
        md: [
          S("let v = vec![1, 2, 3, 4];\n\nlet doubled: Vec<_> = v.iter().map(|x| x * 2).collect();\nlet evens: Vec<_> = v.iter().filter(|x| *x % 2 == 0).collect();\nlet total: i32 = v.iter().sum();\n\nfor x in &v { }         // borrow\nfor x in v { }          // consume\nfor x in &mut v { }     // mutable borrow"),
          "",
          "### The three closure traits",
          "",
          "- `Fn` — borrows and calls",
          "- `FnMut` — mutably borrows and calls",
          "- `FnOnce` — consumes the captured value",
          "",
          "Iterators are lazy and zero-cost — they compile to the same code as a hand-written loop.",
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "What does `.collect()` do?",
            answers: [
              "gathers the iterator into a collection",
              "collects into a collection",
              "turns the iterator into a vec",
            ],
            snippet: "let xs: Vec<i32> = it.map(|x| x * 2).collect();",
            placeholder: "what",
            hint: "The target type is on the left.",
            explanation:
              "It consumes the iterator and builds a `Vec` (or whatever the annotation asks for). Without it the chain does nothing.",
          },
        ],
      },
      {
        id: "rs-10",
        title: "Cargo & tooling",
        minutes: 8,
        md: [
          S("[package]\nname = \"myapp\"\nversion = \"0.1.0\"\nedition = \"2021\"\n\n[dependencies]\nserde = { version = \"1\", features = [\"derive\"] }\n\n[dev-dependencies]\ncriterion = \"0.5\""),
          "",
          "### Everyday commands",
          "",
          S("cargo build --release        // optimised\ncargo test\ncargo clippy -- -D warnings  // lints\ncargo fmt\ncargo doc --open\n\ncargo add serde\ncargo tree                   # why is this dependency here?"),
          "",
          "### Modules",
          "",
          S("mod shapes;                // src/shapes.rs\nmod utils;                  // src/utils.rs\n\npub mod geometry;             // re-exported from src/shapes.rs"),
        ],
        exercises: [
          {
            type: "quiz",
            prompt: "Which tool is Rust's linter?",
            answers: ["clippy", "cargo clippy", "clippy\n"],
            snippet: "cargo ___ -- -D warnings",
            placeholder: "the tool",
            hint: "Its name is also an animal.",
            explanation:
              "Clippy finds idiomatic and correctness issues; `-D warnings` turns them into hard errors for CI.",
          },
        ],
      },
    ],
  },
];