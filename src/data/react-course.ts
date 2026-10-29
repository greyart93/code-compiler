import type { LessonSeed, SectionSeed } from "./course-types";

/** React course — JS/UI foundations applied to React 18/19 idioms. */
export const REACT_BASICS: SectionSeed = {
  id: "react-basics",
  title: "React Basics",
  lessons: [
    {
      id: "react-what",
      title: "What is React?",
      minutes: 6,
      md: `# What is React?

**React** is a JavaScript **library** (not a framework) for building user interfaces out of small, reusable pieces called **components**.

## The three ideas behind React

1. **Components** — a component is a function that returns UI.
2. **JSX** — HTML-like syntax inside JavaScript, compiled to plain function calls.
3. **Declarative state → UI** — you describe what the screen should look like for the current state; React figures out how to update the DOM.

\`\`\`jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

// usage
<Greeting name="Ada" />
\`\`\`

That \`<Greeting name=\"Ada\" />\` compiles to \`Greeting({ name: \"Ada\" })\` — it's just a function call.

## Why not just write HTML?

Because real UIs change: lists update, buttons toggle, data arrives from the network. With plain HTML you'd touch the DOM yourself; React instead swaps the whole section of UI generated from the new state (a *re-render*).`,
    },
    {
      id: "react-jsx",
      title: "JSX rules",
      minutes: 7,
      md: `# JSX rules

JSX looks like HTML but is JavaScript, with a few strict rules:

## 1. One root element

A component must return **one** element. Use a fragment \`<>\...</>\` when you don't want a wrapper div:

\`\`\`jsx
function Profile() {
  return (
    <>
      <h1>Ada Lovelace</h1>
      <p>First programmer</p>
    </>
  );
}
\`\`\`

## 2. \`className\`, not \`class\`

\`\`\`jsx
<input className=\"box\" />   // ok
<input class=\"box\" />       // JSX treats this as nothing
\`\`\`

## 3. Curly braces evaluate JavaScript

\`\`\`jsx
const user = { name: "Grace" };
<h2>{user.name.toUpperCase()}</h2>       // → GRACE
<h2>{2 + 2}</h2>                         // → 4
\`\`\`

## 4. Conditionals and loops are just JS

\`\`\`jsx
{isLoggedIn ? <Logout /> : <Login />}

{todos.map((t) => (
  <li key={t.id}>{t.text}</li>
))}
\`\`\`

Always give lists a stable \`key\` — it lets React match items between renders,
which is vital for performance and animation.

## 5. Style is an object

\`\`\`jsx
<h1 style={{ color: "crimson", fontSize: 24 }}>
\`\`\``,
    },
    {
      id: "react-components",
      title: "Components & props",
      minutes: 7,
      md: `# Components & props

Props are the arguments of components — read-only inputs flowing down:

\`\`\`jsx
function Avatar({ src, size = 64 }) {
  return <img src={src} width={size} height={size} />;
}

<>
  {/* size 64 by default */}
  <Avatar src="/cat.svg" />
  <Avatar src="/dog.svg" size={96} />
</>
\`\`\`

## Rules of props

- A component receives **only one** argument: the props object.
- Props are **read-only** — never assign \`props.x = …\`.
- \`children\` is just a prop:

\`\`\`jsx
function Card({ title, children }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

<Card title="About">
  <p>Any content goes here</p>
</Card>
\`\`\`

## Composition over inheritance

Need a component to behave differently? Wrap it or pass props instead of extending it. React rarely — if ever — uses class inheritance for reuse.`,
    },
    {
      id: "react-state",
      title: "State — the memory of a component",
      minutes: 8,
      md: `# State

Props flow **in** from parents. **State** is the memory the component owns and can change over time.

\`\`\`jsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
\`\`\`

## The rules of state

1. \`useState(initial)\` returns a pair: current value and setter.
2. **Never mutate state** — \`todos.push(x)\` is invisible to React. Replace it: \`setTodos([...todos, x])\`.
3. Updates are **queued per event** — three clicks land three \`+1\`s.
4. When the next state depends on the previous, use the **updater form**:

\`\`\`jsx
setCount((c) => c + 1);   // safe even in stale closures
\`\`\`

## What triggers a re-render?

A re-render happens when: state changes, props change, or the parent re-renders.
Any local variable you touch during a render that isn't state will be **reset** on
the next render — that's why render values must live in state or refs.`,
    },
    {
      id: "react-events",
      title: "Handling events",
      minutes: 6,
      md: `# Handling events

Event handlers are passed as functions, not strings, and are camelCase:

\`\`\`jsx
export default function Form() {
  function handleSubmit(e) {
    e.preventDefault();          // stop the browser from reloading
    alert("Submitted!");
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Go</button>
    </form>
  );
}
\`\`\`

## Common events

- \`onClick\`, \`onDoubleClick\`
- \`onChange\` (fires on every keystroke in inputs)
- \`onSubmit\`, \`onKeyDown\`, \`onKeyUp\`
- \`onMouseEnter\`, \`onMouseLeave\`

## Passing arguments

Wrap the call so it happens at click time, not render time:

\`\`\`jsx
<button onClick={() => remove(id)}>Delete</button>   // ok
<button onClick={remove(id)}>Delete</button>         // runs NOW — bug!
\`\`\`

React events are pooled wrappers of native events — but for all practical purposes
treat \`e\` like a native DOM event and call \`e.preventDefault()\` for forms and links.`,
    },
  ],
};

export const REACT_TOOLING: SectionSeed = {
  id: "react-tooling",
  title: "Hooks & Patterns",
  lessons: [
    {
      id: "react-effect",
      title: "The useEffect hook",
      minutes: 9,
      md: `# useEffect

Effects run **after** render, for work that touches the outside world: network calls, timers, subscriptions, the DOM directly.

\`\`\`jsx
import { useEffect, useState } from "react";

function Repo() {
  const [repo, setRepo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.github.com/repos/facebook/react")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setRepo(d); });
    return () => { cancelled = true; };   // cleanup runs before every next effect & on unmount
  }, []);                                  // [] = run once after mount

  if (!repo) return <p>Loading…</p>;
  return <p>{repo.full_name} — ⭐ {repo.stargazers_count}</p>;
}
\`\`\`

## Dependency array cheat sheet

| deps | when the effect runs |
|---|---|
| *(none)* | **every** render — usually a bug |
| \`[]\` | once, after mount |
| \`[a, b]\` | when \`a\` or \`b\` changes (compared with \`Object.is\`) |

## Rules that prevent 95% of bugs

- Every value used inside the effect must be in the deps array (the linter enforces this).
- Return a **cleanup** for anything you started: timers, subscriptions, in-flight fetches.
- For things derived from props/state, compute them during render instead —
  \`useEffect\` is not for "math on render".

## You might not need an effect

Setting state in response to a prop change → derive it instead.
\`\`\`jsx
// wrong: extra render + flicker
const [full, setFull] = useState();
useEffect(() => setFull(first + " " + last), [first, last]);

// right: computed during render
const full = first + " " + last;
\`\`\``,
    },
    {
      id: "react-hooks-more",
      title: "useRef, useMemo, useCallback",
      minutes: 8,
      md: `# useRef, useMemo, useCallback

## useRef — a box that survives re-renders

\`\`\`jsx
const inputRef = useRef(null);
const timerId = useRef(0);

// 1. Dom access
<input ref={inputRef} />;
inputRef.current.focus();

// 2. Mutable value that does NOT trigger re-renders
timerId.current = setInterval(tick, 1000);
\`\`\`

Unlike state, **mutating a ref does not re-render** — use it for values you want to
persist but never paint (timers, "is running" flags, previous values).

## useMemo — cache an expensive computation

\`\`\`jsx
const sorted = useMemo(
  () => [...items].sort(byPrice),
  [items]      // recompute only when items changes
);
\`\`\`

## useCallback — cache a function identity

\`\`\`jsx
const onSave = useCallback((draft) => save(draft), [save]);
\`\`\`

Use it when a memoized component would otherwise rebuild its tree because it
receives a "new" function every render. Together \`useMemo\` + \`useCallback\`
implement the same idea: **referential stability**.
\`\`\`jsx
const MemoRow = memo(Row);
\`\`\`

**Don't sprinkle these everywhere** — first make the computation cheap, then cache
only if a profiler shows a real problem.`,
    },
    {
      id: "react-lifecyle-lists",
      title: "Lists, keys and conditional rendering",
      minutes: 7,
      md: `# Lists, keys, conditionals

## Rendering a list

\`\`\`jsx
{users.map((u) => (
  <UserRow key={u.id} user={u} />
))}
\`\`\`

Keys must be **stable, unique among siblings**. Array index is a poor key when the
list can reorder — React may reuse the wrong row entirely.

## Conditional rendering — four idioms

\`\`\`jsx
{loading && <Spinner />}              // short-circuit
{error ?? <ErrorBox error={error} />} // null-coalesce fallback
{active ? <A /> : <B />}              // ternary
{active && <Panel />}                 // careful: 0 renders as "0"!

// safer guard for numbers:
{active > 0 && <Panel />}
\`\`\``,
    },
    {
      id: "react-context",
      title: "Context — avoiding prop drilling",
      minutes: 8,
      md: `# Context

When many components need the same value (theme, current user, locale) passing it
through every level is *prop drilling*. Context hands the value to the whole tree:

\`\`\`jsx
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext(null);

export function App() {
  const [theme, setTheme] = useState("dark");
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Page />
    </ThemeContext.Provider>
  );
}

function Page() {
  const { theme, setTheme } = useContext(ThemeContext);
  return <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>{theme}</button>;
}
\`\`\`

## When — and when not

- ✅ genuinely global, slowly-changing values: theme, auth, locale, feature flags
- ❌ data that changes often or is used by one subtree — **pass it as props** instead.
  Context changes re-render every consumer.`,
    },
    {
      id: "react-forms",
      title: "Forms the React way",
      minutes: 7,
      md: `# Forms

## Controlled inputs

The value lives in state; the input just displays it:

\`\`\`jsx
function Signup() {
  const [email, setEmail] = useState("");

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(email); }}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <button>Sign up</button>
    </form>
  );
}
\`\`\`

## Uncontrolled — read the DOM only when you need it

\`\`\`jsx
const ref = useRef(null);
<input ref={ref} defaultValue="" />;
// on submit: ref.current.value
\`\`\`

Controlled is the default because it lets you validate on every keystroke.
Reach for uncontrolled when performance matters (a giant form) or when you
integrate non-React code.`,
    },
    {
      id: "react-async",
      title: "Data fetching patterns",
      minutes: 9,
      md: `# Data fetching

## The classic three-state pattern

\`\`\`jsx
function Todos() {
  const [state, setState] = useState({ status: "idle", data: null, error: null });

  useEffect(() => {
    setState({ status: "loading", data: null, error: null });
    const ctrl = new AbortController();
    fetch("/api/todos", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => setState({ status: "success", data, error: null }))
      .catch((error) => { if (error.name !== "AbortError") setState({ status: "error", data: null, error }); });
    return () => ctrl.abort();
  }, []);

  if (state.status === "loading") return <Spinner />;
  if (state.status === "error") return <p>Boom: {state.error.message}</p>;
  return <List items={state.data} />;
}
\`\`\`

Three things this example does right:

1. **One state object** — no impossible "loading + data" combinations.
2. **AbortController** — kills stale requests when a filter changes.
3. **Guards AbortError** — aborting is expected, not an error to show.

## Race conditions

If the user types fast and you fetch per keystroke, two responses can arrive out of
order. Either compare a request id, or debounce.

## In production

Teams usually add **TanStack Query** or **SWR** — they cache, dedupe, refetch on
focus, and expose \`isLoading\` for free; the manual pattern above shows you what
they automate.`,
    },
  ],
};

export const REACT_ADVANCED: SectionSeed = {
  id: "react-advanced",
  title: "Going Deeper",
  lessons: [
    {
      id: "react-perf",
      title: "Performance: memo, keys, code-splitting",
      minutes: 9,
      md: `# Performance

React is fast; most "slow React apps" are re-rendering too much.

## 1. Find the problem first

Use the **React DevTools Profiler** — record an interaction, look for the
components that flash grey on every keystroke. Don't memo blindly.

## 2. memo + stable props

\`\`\`jsx
const Row = memo(function Row({ user, onPick }) {
  return <li onClick={() => onPick(user.id)}>…</li>;
});
\`\`\`

\`memo\` skips a re-render when props are shallow-equal — but a fresh inline
\`onPick={() => …}\` every render defeats it: pair with \`useCallback\`.

## 3. Keys that help React help you

Stable \$ key \$ values let React move nodes instead of rebuilding them;
index keys during reordering cause focus loss and animation glitches.

## 4. Split the bundle

\`\`\`jsx
import { lazy, Suspense } from "react";
const Chart = lazy(() => import("./Chart"));

<Suspense fallback={<Spinner />}><Chart /></Suspense>
\`\`\`

## 5. Cheap wins

- Move state to the lowest common ancestor that needs it.
- \`useDeferredValue(input)\` keeps typing smooth while a heavy list catches up.
- Virtualize long lists (\`@tanstack/react-virtual\`).`,
    },
    {
      id: "react-testing",
      title: "Testing React apps",
      minutes: 8,
      md: `# Testing

Three layers, cheapest-first:

## Unit — pure functions and reducers

\`\`\`js
test("todos reducer adds", () => {
  expect(todosReducer([], { type: "add", text: "hi" })).toEqual([{ text: "hi", done: false }]);
});
\`\`\`

## Integration — render the component

\`\`\`jsx
test("counter increments", async () => {
  render(<Counter />);
  await userEvent.click(screen.getByRole("button", { name: /add/i }));
  expect(screen.getByText("Clicked 1 times")).toBeVisible();
});
\`\`\`

Query by **role and label** (what users see), not CSS classes — tests stop breaking
when styles change.

## E2E — Playwright / Cypress

Drive the real browser through the critical user journey: sign up → do the core
action → sign out. Keep it to the 5–10 flows that pay rent.

## What good tests look like

- Test **behavior**, not implementation details (no \`component.state.foo\`).
- One assert-per-idea; the failure message should tell the story.
- Mock the network boundary, not React.`,
    },
    {
      id: "react-patterns",
      title: "Patterns: composition, custom hooks",
      minutes: 9,
      md: `# Patterns

## Custom hooks — reuse stateful logic

\`\`\`jsx
function useFetch(url) {
  const [state, setState] = useState({ status: "idle", data: null });
  useEffect(() => {
    setState({ status: "loading", data: null });
    fetch(url).then(r => r.json())
      .then(data => setState({ status: "success", data }))
      .catch(() => setState({ status: "error", data: null }));
  }, [url]);
  return state;
}

// using it
const { status, data, error } = useFetch("/api/user");
\`\`\`

Rules: name it \`use…\`, call hooks unconditionally, return values (not JSX).

## Compound components — flexible APIs

\`\`\`jsx
<Tabs default={0}>
  <Tabs.List><Tabs.Tab>One</Tabs.Tab><Tabs.Tab>Two</Tabs.Tab></Tabs.List>
  <Tabs.Panel>…</Tabs.Panel>
</Tabs>
\`\`\`

Shared via context internally; the consumer composes pieces instead of you
imagining every prop they might need.

## The decision guide

- Share **logic** → custom hook.
- Share **UI with slots** → children / compound components.
- Share raw value to a deep tree → context.
- Everything else → props.`,
    },
    {
      id: "react-ssr",
      title: "SSR, RSC and where React is heading",
      minutes: 8,
      md: `# SSR, hydration and Server Components

## Rendering on the server vs the client

- **CSR** — ship an empty div, build the UI in the browser.
- **SSR** — server renders HTML, browser hydrates it.
- **RSC (React Server Components)** — components that render on the server
  *and never ship to the client*: zero JS for them.

## Server Component mental model

\`\`\`jsx
// server: async data, direct DB access
export default async function Page() {
  const posts = await db.post.findMany();
  return <List posts={posts} />;
}

function List({ posts }) {   // client component when it uses state
  "use client";
  const [q, setQ] = useState("");
  …
}
\`\`\`

Two grab-bag rules: server components can be \`async\`, can import secrets, cannot use state/effects.
Small leaf components that need interactivity opt in with \`"use client"\`.

## Hydration

The server-painted HTML becomes live: React attaches handlers and takes over.
If client HTML ≠ server HTML you get the classic
*"Hydration failed because the server rendered HTML didn't match the client"* —
usually a \`Date\`, random value, or browser-only API rendering differently.`,
    },
  ],
};

export const REACT_SECTIONS: SectionSeed[] = [REACT_BASICS, REACT_TOOLING, REACT_ADVANCED];
