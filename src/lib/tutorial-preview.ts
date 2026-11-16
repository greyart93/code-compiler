export type TutorialPreview = {
  excerpt: string;
  minutes: number;
};

/** Strip markup so the excerpt reflects prose, not HTML or code blocks. */
export function stripTutorialHtml(html: string) {
  return html
    .replace(/<pre[\s\S]*?<\/pre>/g, " ")
    .replace(/<[^>]+>/g, " ")
    // tolerate markdown seeds / imported posts as well as the editor's HTML
    .replace(/```[a-z0-9+#-]*/gi, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>]/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tutorialPreview(html: string): TutorialPreview {
  const text = stripTutorialHtml(html);
  const words = text ? text.split(/\s+/).length : 0;
  return {
    excerpt: text.length > 220 ? `${text.slice(0, 220).trimEnd()}…` : text,
    minutes: Math.max(1, Math.round(words / 200)),
  };
}
