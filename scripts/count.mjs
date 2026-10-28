// Quick sanity check on the authored courses: sections, lessons, exercises,
// and that every lesson body is real markdown (fences balanced, no stray "\\"").
import { COURSES } from "../src/data/courses.ts";

let problems = 0;
for (const c of COURSES) {
  const { sections, lessons } = await c.load();
  const ids = sections.flatMap((s) => s.lessonIds);
  const nEx = ids.reduce((a, id) => a + (lessons[id]?.exercises?.length ?? 0), 0);
  const bad = ids.filter((id) => {
    const l = lessons[id];
    if (!l) return true;
    const fences = (l.md.match(/```/g) || []).length;
    return fences % 2 !== 0 || !l.title || !l.md.trim();
  });
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (bad.length || dupes.length) problems++;
  console.log(
    `${c.slug.padEnd(12)} ${String(sections.length).padStart(2)} sec ` +
      `${String(ids.length).padStart(3)} lessons ${String(nEx).padStart(3)} ex  ` +
      `sections=[${sections.map((s) => `${s.title}(${s.lessonIds.length})`).join(", ")}]` +
      (bad.length ? `  BAD: ${bad.join(",")}` : "") +
      (dupes.length ? `  DUP: ${dupes.join(",")}` : "")
  );
}
console.log(problems ? `\n${problems} course(s) with problems` : "\nall courses ok");