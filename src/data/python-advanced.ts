// Python course content, split by section so each file stays readable.
// Types come from course-types.ts.
import type { SectionSeed } from "./course-types";

const py = (code: string) => "```python\n" + code + "\n```";

// ───────────────────────── 3. Advanced ─────────────────────────

export const PY_ADVANCED: SectionSeed = {
  id: "advanced",
  title: "Advanced",
  lessons: [
    {
      id: "py-15",
      title: "Complexity & data structures",
      minutes: 10,
      md: [
        "Big-O describes how work grows with input size.",
        "",
        py("# O(1)      dict lookup, list index\n# O(log n)   binary search\n# O(n)       one pass, .count()\n# O(n log n) sort, heapsort\n# O(n^2)     nested loop over the same list\n# O(2^n)     naive fibonacci recursion"),
        "",
        "### Choosing the right container",
        "",
        py("need order + fast lookup by key   → dict\nneed order + duplicates              → list\nneed uniqueness + fast membership    → set\nneed order + immutability            → tuple\nneed first-in-first-out              → collections.deque"),
        "",
        "### The three O(n) killers to avoid",
        "",
        py("# 1. membership test in a list — O(n) each time\n" +
          'names = ["ada", "bob", "cat"]\n' +
          'if "cat" in names:      # O(n)\n' +
          '    pass\n\n' +
          "# 2. string concatenation in a loop — O(n^2)\n" +
          'out = ""\nfor w in ["a", "b", "c"]:\n    out += w          # builds a new string each time\n\nout = "".join(["a", "b", "c"])   # O(n)\n\n' +
          "# 3. inserting at the front of a list — O(n) each time\n" +
          "xs = [1, 2, 3]\nxs.insert(0, 0)      # O(n)\ndeque.appendleft(x) # O(1) — use collections.deque"),
        "",
        "### Sorting",
        "",
        py('words = ["pear", "fig", "banana"]\nwords.sort(key=len)                 # by length\nprint(sorted(words, reverse=True)) # a new list, descending'),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What is the complexity of `x in some_list`?",
          answers: ["o(n)", "o(n)", "linear", "o(n) linear", "n"],
          snippet: "if x in some_list: ...",
          placeholder: "e.g. O(n)",
          hint: "Python scans the list comparing each item.",
          explanation:
            "It is O(n) because membership tests a list linearly. With a `set` or `dict` it drops to O(1).",
        },
        {
          type: "quiz",
          prompt: "Why is `\"\" + w` inside a loop a bad idea?",
          answers: [
            "strings are immutable so it is quadratic",
            "o(n^2)",
            "quadratic",
            "it is o(n^2)",
            "immutable strings cause quadratic time",
          ],
          snippet: 'out = ""\nfor w in words:\n    out += w',
          placeholder: "why",
          hint: "Strings cannot grow in place.",
          explanation:
            "Each `+=` allocates a whole new string and copies everything, so n iterations cost O(n²). Use `\"\".join(...)`.",
        },
      ],
    },
    {
      id: "py-16",
      title: "Sorting & searching",
      minutes: 8,
      md: [
        py("xs = [5, 3, 9, 1]\nxs.sort()                 # in place, O(n log n)\nys = sorted(xs)          # returns a new list"),
        "",
        "### Custom keys",
        "",
        py('users = [{"n": "ada", "a": 36}, {"n": "bob", "a": 25}]\nusers.sort(key=lambda u: u["a"])'),
        "",
        "### Binary search — the pattern to memorise",
        "",
        py("def bsearch(xs, target):\n    lo, hi = 0, len(xs) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if xs[mid] == target:\n            return mid\n        if xs[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1"),
        "",
        "### Two pointers",
        "",
        py("def two_sum(xs, target):\n    seen = {}\n    for i, v in enumerate(xs):\n        if target - v in seen:\n            return [seen[target - v], i]\n        seen[v] = i\n    return []"),
      ].join("\n"),
      exercises: [
        {
          type: "challenge",
          problem:
            "Read space-separated numbers from stdin and print the **largest**.\n\nExample: input `3 9 2` → output `9`",
          starterCode:
            'xs = [int(x) for x in input().split()]\n\n# print the largest\n',
          tests: [
            { input: "3 9 2", expected: "9", label: "3 9 2 → 9" },
            { input: "-5 -1 -9", expected: "-1", label: "-5 -1 -9 → -1" },
            { input: "7", expected: "7", label: "7 → 7" },
          ],
          hint: "`max(xs)` does exactly this.",
        },
      ],
    },
    {
      id: "py-17",
      title: "Testing",
      minutes: 8,
      md: [
        "Tests assert expected behaviour so refactoring stays safe.",
        "",
        py("def add(a, b):\n    return a + b\n\ndef test_add():\n    assert add(1, 2) == 3\n    assert add(-1, 1) == 0\n\ntest_add()   # passes silently"),
        "",
        "### `pytest` style",
        "",
        py("import pytest\n\n@pytest.mark.parametrize(\"a,b,want\", [(1, 2, 3), (0, 0, 0)])\ndef test_add(a, b, want):\n    assert add(a, b) == want\n\ndef test_raises():\n    with pytest.raises(ZeroDivisionError):\n        1 / 0"),
        "",
        "### Fixtures and mocking",
        "",
        py("import pytest\n\n@pytest.fixture\ndef db():\n    conn = connect()\n    yield conn      # runs the test\n    conn.close()    # runs teardown after"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What does `assert` do when its condition is false?",
          answers: ["raises an error", "raises assertionerror", "an error", "raises", "it raises an error"],
          snippet: "assert add(1, 2) == 3",
          placeholder: "what happens",
          hint: "The test should fail loudly.",
          explanation:
            "It raises `AssertionError`, which fails that test. Without assertions a test always passes.",
        },
      ],
    },
    {
      id: "py-18",
      title: "Advanced OOP",
      minutes: 9,
      md: [
        "### Composition over inheritance",
        "",
        py("class Engine:\n    def start(self):\n        return \"vroom\"\n\nclass Car:\n    def __init__(self, engine):\n        self.engine = engine   # has-a, not is-a\n\n    def drive(self):\n        return self.engine.start()"),
        "",
        "### Dataclasses remove boilerplate",
        "",
        py("from dataclasses import dataclass, field\n\n@dataclass\nclass User:\n    name: str\n    age: int = 0\n    tags: list = field(default_factory=list)\n\nu = User(\"ada\")   # __init__ generated for you"),
        "",
        "### Enums for fixed choices",
        "",
        py("from enum import Enum\n\nclass Color(Enum):\n    RED = 1\n    GREEN = 2\n\nprint(Color.RED.name)   # RED"),
        "",
        "### Multiple inheritance & `super()`",
        "",
        py("class A:\n    def hello(self): return \"A\"\n\nclass B:\n    def hello(self): return \"B\"\n\nclass C(A, B):\n    def hello(self):\n        return super().hello()   # A first, then B"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What does `@dataclass` generate for you?",
          answers: [
            "__init__ and repr",
            "init",
            "__init__",
            "init and repr",
            "an __init__ method",
            "__init__()",
          ],
          snippet: "@dataclass\nclass User:\n    name: str",
          placeholder: "what it creates",
          hint: "You would otherwise write it by hand.",
          explanation:
            "It synthesises `__init__`, `__repr__` and usually `__eq__` from your field annotations.",
        },
      ],
    },
    {
      id: "py-19",
      title: "Concurrency",
      minutes: 10,
      md: [
        "### Threads vs processes",
        "",
        py("# Thread  — same memory, good for I/O (network, disk)\n# Process — separate memory, good for CPU-heavy work\n# GIL: only one thread runs Python bytecode at a time"),
        "",
        "### `threading`",
        "",
        py("import threading\n\ndef work():\n    print(\"done\")\n\nt = threading.Thread(target=work)\nt.start()\nt.join()   # wait for it"),
        "",
        "### `asyncio` — async I/O",
        "",
        py("import asyncio\n\nasync def fetch(n):\n    await asyncio.sleep(1)\n    return n\n\nasync def main():\n    results = await asyncio.gather(fetch(1), fetch(2))\n    print(results)\n\nasyncio.run(main())"),
        "",
        "`await` yields control back to the loop while waiting, so thousands of requests can share one thread.",
        "",
        "### `multiprocessing` — real CPU parallelism",
        "",
        py("from concurrent.futures import ProcessPoolExecutor\n\nwith ProcessPoolExecutor() as ex:\n    print(list(ex.map(square, [1, 2, 3])))"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What does the GIL limit?",
          answers: [
            "one thread running python code at a time",
            "threads",
            "one thread at a time",
            "python bytecode",
            "only one thread runs python code at a time",
          ],
          snippet: "import threading",
          placeholder: "what is limited",
          hint: "It is about Python, not the CPU.",
          explanation:
            "The Global Interpreter Lock lets only one thread execute Python bytecode at once, which is why CPU work needs processes.",
        },
      ],
    },
    {
      id: "py-20",
      title: "Typing & protocols",
      minutes: 7,
      md: [
        py("from typing import Protocol, TypeVar, Generic\n\nT = TypeVar(\"T\")\n\nclass Container(Generic[T]):\n    def get(self) -> T: ...\n\nclass Sized(Protocol):\n    def __len__(self) -> int: ...\n\ndef biggest(xs: Sized) -> None:\n    print(len(xs))"),
        "",
        "A `Protocol` is structural: any object with the right methods fits, without inheriting.",
        "",
        py("from typing import Literal, TypedDict\n\nMode = Literal[\"r\", \"w\", \"a\"]\n\nclass Config(TypedDict):\n    name: str\n    retries: int"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What is a `Protocol` for?",
          answers: [
            "structural typing",
            "structural typing without inheritance",
            "duck typing",
            "it lets types match structurally",
          ],
          snippet: "class Sized(Protocol):\n    def __len__(self) -> int: ...",
          placeholder: "what it enables",
          hint: "The class does not have to inherit from anything.",
          explanation:
            "It defines a shape; any object with matching methods satisfies it, which is duck typing with type-checker support.",
        },
      ],
    },
    {
      id: "py-21",
      title: "Packaging & tooling",
      minutes: 6,
      md: [
        "### Project layout",
        "",
        py("myproject/\n  pyproject.toml\n  src/mypkg/\n    __init__.py\n    core.py\n  tests/\n    test_core.py"),
        "",
        "### `pyproject.toml`",
        "",
        py('[project]\nname = "mypkg"\nversion = "0.1.0"\nrequires-python = ">=3.10"\ndependencies = ["requests>=2"]'),
        "",
        "### Everyday commands",
        "",
        py("python -m venv .venv && source .venv/bin/activate\npip install -e .\npython -m pytest\npython -m mypy src"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "Which file describes a Python project's metadata and dependencies?",
          answers: ["pyproject.toml", "pyproject", "pyproject.toml\n", "setup.py"],
          placeholder: "the filename",
          hint: "It is the modern standard.",
          explanation:
            "`pyproject.toml` is the current standard; `setup.py` is legacy and only needed for some dynamic setups.",
        },
      ],
    },
    {
      id: "py-22",
      title: "asyncio in depth",
      minutes: 10,
      md: [
        "### Coroutines, tasks and awaiting",
        "",
        py("import asyncio\n\nasync def slow(n):\n    await asyncio.sleep(n)\n    return n\n\nasync def main():\n    t = asyncio.create_task(slow(1))\n    print(await t)\n\nasyncio.run(main())"),
        "",
        "### Racing tasks — first one wins",
        "",
        py("done, pending = await asyncio.wait(\n    [asyncio.create_task(slow(2)), asyncio.create_task(slow(1))],\n    return_when=asyncio.FIRST_COMPLETED,\n)"),
        "",
        "### Timeouts and cancellation",
        "",
        py("try:\n    await asyncio.wait_for(slow(10), timeout=1)\nexcept asyncio.TimeoutError:\n    print(\"too slow\")"),
        "",
        "### Async iteration",
        "",
        py("async def stream(n):\n    for i in range(n):\n        await asyncio.sleep(0)\n        yield i\n\nasync for v in stream(3):\n    print(v)"),
      ].join("\n"),
      exercises: [
        {
          type: "quiz",
          prompt: "What does `await` do?",
          answers: [
            "pauses the coroutine and lets the loop run other tasks",
            "pauses the coroutine",
            "yields control to the event loop",
            "it pauses until the awaitable finishes",
          ],
          snippet: "await asyncio.sleep(1)",
          placeholder: "what happens",
          hint: "One task blocks, many others do not.",
          explanation:
            "It suspends just that coroutine and hands control back to the event loop, so other tasks keep running.",
        },
      ],
    },
  ],
};