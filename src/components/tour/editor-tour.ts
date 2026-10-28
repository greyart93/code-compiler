import type { Tour } from "nextstepjs";

/**
 * The guided tour for the blog editor.
 *
 * Every step points at an `id` added to the editor UI (see
 * `tutorial-editor-form.tsx` and the /blog/new page). Steps are ordered the way
 * someone actually writes a post: name it, format, add code, preview, publish.
 *
 * `selectorRetryAttempts` covers the title textarea and the toolbar, which
 * render a tick after mount.
 */
export const EDITOR_TOUR: Tour[] = [
  {
    tour: "blogEditor",
    steps: [
      {
        icon: "✍️",
        title: "Write your post, Medium-style",
        content:
          "This tour shows every part of the editor. Nothing here is saved until you press Publish — feel free to click around and type.",
        side: "bottom",
        // no selector: a centred welcome card before we spotlight anything
        pointerPadding: 0,
        cardOffset: 0,
        scrollOffset: 80,
        pointerRadius: 0,
      },
      {
        icon: "📝",
        title: "Start with the title",
        content:
          "Click and type your headline here. It grows as you write, and it's the only thing readers see first — so make it specific.",
        selector: "#editor-title",
        side: "bottom",
        pointerPadding: 8,
        pointerRadius: 12,
        scrollOffset: 80,
        selectorRetryAttempts: 5,
      },
      {
        icon: "🎨",
        title: "Format from this toolbar",
        content:
          "Bold, italics, headings, lists and quotes live here. The toolbar sticks under the header, so it's always in reach while you write.",
        selector: "#editor-toolbar",
        side: "bottom",
        pointerPadding: 8,
        pointerRadius: 12,
        scrollOffset: 80,
        selectorRetryAttempts: 5,
      },
      {
        icon: "⌨️",
        title: "Insert a code block",
        content:
          "Press the terminal button (or type ``` then Enter). Your code is highlighted automatically and rendered as a dark block with a language label — exactly like the Learn lessons.",
        selector: "#editor-code-block-btn",
        side: "bottom",
        pointerPadding: 8,
        pointerRadius: 10,
        scrollOffset: 80,
        selectorRetryAttempts: 5,
      },
      {
        icon: "🌐",
        title: "Then pick its language",
        content:
          "Click the Code block button to insert a code block — once you're inside one, this language dropdown appears and sets the highlighting for that block. Each block can use a different language.",
        selector: "#editor-code-block-btn",
        side: "bottom",
        pointerPadding: 8,
        pointerRadius: 10,
        scrollOffset: 80,
        selectorRetryAttempts: 5,
      },
      {
        icon: "👀",
        title: "Preview before you publish",
        content:
          "Preview renders your post exactly as readers will see it — same layout, same code blocks. Switch back to Write any time.",
        selector: "#editor-preview-toggle",
        side: "bottom",
        pointerPadding: 8,
        pointerRadius: 10,
        scrollOffset: 80,
        selectorRetryAttempts: 5,
      },
      {
        icon: "🏷️",
        title: "Tag the topic",
        content:
          "Set the post's language so people browsing that topic can find it. Independent of any code block language.",
        selector: "#editor-topic",
        side: "bottom",
        pointerPadding: 8,
        pointerRadius: 10,
        scrollOffset: 80,
        selectorRetryAttempts: 5,
      },
      {
        icon: "🚀",
        title: "Publish when you're ready",
        content:
          "That's it. Publish saves the post and opens it in the reading view. You can Edit or Delete it afterwards from the post page.",
        selector: "#editor-publish",
        side: "top",
        pointerPadding: 8,
        pointerRadius: 10,
        scrollOffset: 80,
        selectorRetryAttempts: 5,
      },
    ],
  },
];