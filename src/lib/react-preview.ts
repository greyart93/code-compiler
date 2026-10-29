// React/JSX playground support.
//
// The normal compiler path posts code to glot.io, which only understands plain
// JavaScript. React lessons are JSX, so we transpile them in the browser and run
// the result inside a sandboxed iframe with React loaded from esm.sh. Keeping the
// user code out of the app origin means a snippet cannot read cookies, localStorage
// or the parent document.

const REACT_VERSION = "19.3.0";

type Range = { start: number; end: number };

type ParsedModule = { ranges: Range[]; components: string[] };

/**
 * Find JSX expressions sitting at the top level of the module. Lesson snippets
 * often end with a bare `<Avatar … />` (or a fragment) to show the component in
 * action. Wrapping those in `__codevitCapture(...)` lets us mount them without
 * forcing every example to define an `App` component.
 *
 * We also collect zero-argument, capitalised top-level functions/arrows: many
 * lessons define only `function Counter() { … }` and never render it. The
 * preview can mount that component so the example still produces something.
 */
function analyzeModule(
  source: string,
  parse: typeof import("@babel/parser").parse
): ParsedModule {
  const ast = parse(source, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
    errorRecovery: true,
  });
  const ranges: Range[] = [];
  const components: string[] = [];

  const collectFunction = (node: {
    id?: { name?: string } | null;
    params?: unknown[];
    async?: boolean;
    generator?: boolean;
  }) => {
    const name = node.id?.name;
    if (name && /^[A-Z]/.test(name) && !node.async && !node.generator && node.params?.length === 0) {
      components.push(name);
    }
  };

  for (const statement of ast.program.body) {
    const expression =
      statement.type === "ExpressionStatement"
        ? statement.expression
        : statement.type === "ExportDefaultDeclaration"
          ? statement.declaration
          : null;

    if (
      expression &&
      (expression.type === "JSXElement" || expression.type === "JSXFragment") &&
      typeof expression.start === "number" &&
      typeof expression.end === "number"
    ) {
      ranges.push({ start: expression.start, end: expression.end });
    }

    if (statement.type === "FunctionDeclaration") {
      collectFunction(statement);
    } else if (statement.type === "VariableDeclaration") {
      for (const declarator of statement.declarations) {
        if (declarator.id.type !== "Identifier" || !/^[A-Z]/.test(declarator.id.name)) continue;
        const init = declarator.init;
        if (
          init &&
          (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression") &&
          !init.async &&
          init.params.length === 0
        ) {
          components.push(declarator.id.name);
        }
      }
    } else if (statement.type === "ExportNamedDeclaration") {
      const declaration = statement.declaration;
      if (
        declaration &&
        (declaration.type === "FunctionDeclaration" || declaration.type === "TSDeclareFunction")
      ) {
        collectFunction(declaration);
      }
    } else if (statement.type === "ExportDefaultDeclaration") {
      const declaration = statement.declaration;
      if (
        declaration.type === "FunctionDeclaration" ||
        declaration.type === "TSDeclareFunction"
      ) {
        collectFunction(declaration);
      }
    }
  }

  return {
    ranges: ranges.sort((a, b) => b.start - a.start),
    components: [...new Set(components)],
  };
}

function wrapTopLevelJsx(source: string, ranges: Range[]): string {
  let wrapped = source;
  for (const range of ranges) {
    wrapped =
      wrapped.slice(0, range.start) +
      "__codevitCapture(" +
      wrapped.slice(range.start, range.end) +
      ")" +
      wrapped.slice(range.end);
  }
  return wrapped;
}

function documentFor(code: string, componentName: string | null): string {
  // Prevent user content from closing the module script early. `<\/script` is
  // equivalent inside strings/regexes, which is the only place this sequence can
  // legally appear in valid JavaScript.
  const safeCode = code.replace(/<\/script/gi, "<\\/script");
  const candidateCode =
    componentName && componentName !== "App"
      ? `  if (!__codevitCaptured.length && typeof ${componentName} !== "undefined") {
    __codevitCaptured.push(__codevitReact.createElement(${componentName}));
  }`
      : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; }
  body {
    background: #0b0c0f;
    color: #e7e7e7;
    font: 13px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    padding: 22px;
  }
  #root { min-height: 100%; display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
  h1, h2, h3 { margin: 0; line-height: 1.25; }
  p { margin: 0; }
  button {
    font: inherit;
    padding: 8px 14px;
    border-radius: 9px;
    border: 1px solid #34343a;
    background: #17181c;
    color: #f2f2f2;
    cursor: pointer;
  }
  button:hover { background: #202127; }
  input {
    font: inherit;
    padding: 7px 10px;
    border-radius: 8px;
    border: 1px solid #34343a;
    background: #111216;
    color: #f2f2f2;
  }
  img { max-width: 100%; height: auto; }
  .cv-empty { color: #8d8d96; font-size: 12.5px; }
  .cv-error {
    margin-top: 16px;
    padding: 12px 14px;
    border: 1px solid rgb(248 113 113 / 0.28);
    border-radius: 10px;
    background: rgb(248 113 113 / 0.08);
    color: #fca5a5;
    font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
<script type="importmap">
${JSON.stringify({
  imports: {
    react: `https://esm.sh/react@${REACT_VERSION}`,
    "react/jsx-runtime": `https://esm.sh/react@${REACT_VERSION}/jsx-runtime`,
    "react/jsx-dev-runtime": `https://esm.sh/react@${REACT_VERSION}/jsx-dev-runtime`,
    "react-dom": `https://esm.sh/react-dom@${REACT_VERSION}`,
    "react-dom/client": `https://esm.sh/react-dom@${REACT_VERSION}/client`,
  },
})}
</script>
</head>
<body>
<div id="root"><p class="cv-empty">Loading React preview…</p></div>
<div id="cv-error" class="cv-error" hidden></div>
<script type="module">
  import __codevitReact from "react";
  import { createRoot as __codevitCreateRoot } from "react-dom/client";

  globalThis.React = __codevitReact;

  // Lesson snippets often use hooks without imports for brevity. Global
  // properties are readable as bare identifiers, and a real import still
  // shadows them, so this stays safe for complete modules too.
  for (const __codevitName of [
    "useState", "useEffect", "useLayoutEffect", "useMemo", "useCallback",
    "useRef", "useReducer", "useContext", "createContext", "useId",
    "useTransition", "useDeferredValue", "useSyncExternalStore",
    "useInsertionEffect", "useImperativeHandle", "memo", "forwardRef",
    "lazy", "Suspense", "Fragment", "createElement", "cloneElement",
    "Children", "isValidElement", "startTransition"
  ]) {
    if (typeof __codevitReact[__codevitName] !== "undefined") {
      globalThis[__codevitName] = __codevitReact[__codevitName];
    }
  }

  const __codevitCaptured = [];
  const __codevitCapture = (element) => { __codevitCaptured.push(element); };

  const __codevitShowError = (error) => {
    const box = document.getElementById("cv-error");
    const root = document.getElementById("root");
    if (root) root.innerHTML = "";
    if (!box) return;
    box.hidden = false;
    box.textContent = String((error && (error.stack || error.message)) || error || "Unknown error");
    if (root) root.dataset.rendered = "1";
  };

  class __CodevitBoundary extends __codevitReact.Component {
    constructor(props) {
      super(props);
      this.state = { failed: false };
    }
    static getDerivedStateFromError() {
      return { failed: true };
    }
    componentDidCatch(error) {
      __codevitShowError(error);
    }
    render() {
      return this.state.failed ? null : this.props.children;
    }
  }

  window.addEventListener("error", (event) => {
    __codevitShowError(event.error || event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    __codevitShowError(event.reason);
  });

  // User code stays at module top level: imports/exports are only legal there.
  // A synchronous throw is reported through the window error listener above.
${safeCode}

  try {
    if (!__codevitCaptured.length && typeof App !== "undefined") {
      __codevitCaptured.push(__codevitReact.createElement(App));
    }
${candidateCode}

    const rootElement = document.getElementById("root");
    rootElement.innerHTML = "";
    rootElement.dataset.rendered = "1";
    const root = __codevitCreateRoot(rootElement);

    if (__codevitCaptured.length) {
      const tree = __codevitReact.createElement(
        __codevitReact.Fragment,
        null,
        ...__codevitCaptured
      );
      root.render(__codevitReact.createElement(__CodevitBoundary, null, tree));
    } else {
      root.render(
        __codevitReact.createElement(
          "p",
          { className: "cv-empty" },
          "Compiled successfully. Add a top-level JSX element or render a component to see a preview."
        )
      );
    }
  } catch (error) {
    __codevitShowError(error);
  }

  setTimeout(() => {
    const root = document.getElementById("root");
    if (root && root.dataset.rendered !== "1") {
      root.innerHTML = '<p class="cv-empty">React preview could not start. Check your connection and try again.</p>';
    }
  }, 10000);
</script>
</body>
</html>`;
}

/**
 * Transpile JSX/TSX and return a complete HTML document for the preview iframe.
 * Throws a readable error when the snippet cannot be compiled.
 */
export async function compileReactPreview(source: string): Promise<string> {
  const [{ parse }, { transform }] = await Promise.all([
    import("@babel/parser"),
    import("sucrase"),
  ]);

  let prepared = source;
  let componentName: string | null = null;
  try {
    const analyzed = analyzeModule(source, parse);
    prepared = wrapTopLevelJsx(source, analyzed.ranges);
    // Prefer the last top-level zero-arg component; `App` is handled by name
    // below, and child/helper components usually come before the main one.
    componentName = analyzed.components.filter((name) => name !== "App").slice(-1)[0] ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/Adjacent JSX elements/i.test(message)) {
      throw new Error(
        "Adjacent JSX elements need a fragment — wrap them in <> … </> or a parent element."
      );
    }
    // Other parser errors are reported by Sucrase below, which gives a more
    // useful line/column for the actual syntax problem.
  }

  const { code } = transform(prepared, {
    transforms: ["jsx", "typescript"],
    jsxRuntime: "automatic",
    production: false,
    filePath: "App.jsx",
  });

  return documentFor(code, componentName);
}
