// Shared content types.
//
// These live apart from `courses.ts` so the per-language lesson files can
// import them without creating a circular dependency back into the catalog.

export type Exercise =
  | {
      type: "output";
      prompt: string;
      starterCode: string;
      expectedOutput: string;
      /** shown above the answer box, e.g. "Type what this prints" */
      answerLabel?: string;
      hint?: string;
    }
  | {
      type: "fill-blank";
      prompt: string;
      /** code with ___ slots — one slot per blanks[] entry, in order */
      template: string;
      blanks: { options: string[]; answer: string }[];
      explanation?: string;
    }
  | {
      type: "challenge";
      problem: string;
      starterCode: string;
      /** visible test cases run through /api/runCode with `input` as stdin */
      tests: { input?: string; expected: string; label?: string }[];
      hint?: string;
    }
  | {
      /** free-text question: the learner types a value and we grade it */
      type: "quiz";
      prompt: string;
      /** every accepted answer, compared case-insensitively after trimming */
      answers: string[];
      /** optional inline code shown with the prompt */
      snippet?: string;
      placeholder?: string;
      /** shown after a wrong answer to nudge without giving it away */
      hint?: string;
      /** shown once it is solved */
      explanation?: string;
    };

export type LessonSeed = {
  id: string;
  title: string;
  minutes: number;
  md: string;
  exercise?: Exercise;
  /** every exercise on the lesson; the lesson completes when all are solved */
  exercises?: Exercise[];
};

/** A named group of lessons, e.g. "Basics" or "Advanced patterns". */
export type SectionSeed = { id: string; title: string; lessons: LessonSeed[] };