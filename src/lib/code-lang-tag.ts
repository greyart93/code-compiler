import { Extension } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

const key = new PluginKey<DecorationSet>("codeLangTag");

/** the label shown on the tag; `c_cpp` reads better as `cpp` */
export function codeLangLabel(language: string | null | undefined) {
  const lang = language || "plaintext";
  return lang === "c_cpp" ? "cpp" : lang;
}

function build(doc: ProseMirrorNode) {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (node.type.name !== "codeBlock") return;
    const language = codeLangLabel(node.attrs.language as string | undefined);

    decorations.push(
      Decoration.widget(
        pos + 1,
        () => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "code-lang-tag";
          button.contentEditable = "false";
          button.dataset.codeLangPos = String(pos);
          button.dataset.codeLang = language;
          button.textContent = language;
          button.setAttribute("aria-label", `Change code language, currently ${language}`);
          button.setAttribute("aria-haspopup", "listbox");
          return button;
        },
        { side: -1, key: `code-lang-${pos}-${language}` }
      )
    );
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Puts a clickable language tag in the corner of every code block.
 *
 * It is a widget decoration, not document content, so it never appears in
 * `editor.getHTML()` or the published post (where `RichContent` keeps the
 * plain CSS label). The form listens for clicks on `.code-lang-tag` and opens
 * its language menu.
 */
export const CodeLangTag = Extension.create({
  name: "codeLangTag",

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key,
        state: {
          init: (_config, state) => build(state.doc),
          apply: (tr, previous) => (tr.docChanged ? build(tr.doc) : previous),
        },
        props: {
          decorations(state) {
            return key.getState(state);
          },
        },
      }),
    ];
  },
});
