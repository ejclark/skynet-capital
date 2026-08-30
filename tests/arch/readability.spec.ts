import { countSyllables, fleschKincaidGrade, stripMarkdown } from "../../scripts/readability.mjs";

// The advisory-only readability signal (Eric, 2026-08-30: integrate NLP research into the
// process, but never gate on it — no formula is universally valid, and this repo's necessarily
// precise vocabulary (EARS criteria, financial terms) is exactly the case generic formulas
// miscalibrate on). Pure math only; wiring into issue-lint.mjs's advisory notes is covered by
// issue-lint.spec.ts.
describe("readability: countSyllables", () => {
  it("counts a short word as one syllable without measuring", () => {
    expect(countSyllables("cat")).toBe(1);
  });

  it("counts a two-syllable word", () => {
    expect(countSyllables("happy")).toBe(2);
  });

  it("counts a five-syllable word", () => {
    expect(countSyllables("readability")).toBe(5);
  });

  it("never returns zero for a non-empty word", () => {
    expect(countSyllables("rhythm")).toBeGreaterThanOrEqual(1);
  });

  it("returns zero for a string with no letters", () => {
    expect(countSyllables("123")).toBe(0);
  });
});

describe("readability: stripMarkdown", () => {
  it("removes fenced code blocks entirely", () => {
    expect(stripMarkdown("before\n```js\nconst x = 1;\n```\nafter")).not.toContain("const x");
  });

  it("removes inline code", () => {
    expect(stripMarkdown("run `npm test` now")).not.toContain("`");
  });

  it("keeps link text, drops the URL", () => {
    expect(stripMarkdown("see [the doc](https://example.com/x)")).toContain("the doc");
    expect(stripMarkdown("see [the doc](https://example.com/x)")).not.toContain("example.com");
  });

  it("strips heading and bullet markers", () => {
    const out = stripMarkdown("### A heading\n- a bullet\n1. a numbered item");
    expect(out).not.toMatch(/^#/m);
    expect(out).not.toMatch(/^-/m);
    expect(out).not.toMatch(/^\d+\./m);
  });

  it("strips a GitHub alert callout marker", () => {
    expect(stripMarkdown("> [!IMPORTANT]\n> the actual ask")).not.toContain("[!IMPORTANT]");
  });

  it("strips table pipes and emphasis markers", () => {
    const out = stripMarkdown("| a | b |\n**bold** and _italic_");
    expect(out).not.toContain("|");
    expect(out).not.toContain("**");
  });
});

describe("readability: fleschKincaidGrade", () => {
  it("returns null when there isn't enough text to measure", () => {
    expect(fleschKincaidGrade("Add a star.")).toBeNull();
  });

  it("scores simple short sentences lower than dense technical prose", () => {
    const simple = "The cat sat on the mat. It was happy. The sun was warm.";
    const dense =
      "The deterministic aggregation methodology necessitates comprehensive reconciliation " +
      "across heterogeneous instrumentation subsystems prior to authoritative certification.";
    const simpleGrade = fleschKincaidGrade(simple);
    const denseGrade = fleschKincaidGrade(dense);
    expect(simpleGrade).not.toBeNull();
    expect(denseGrade).not.toBeNull();
    expect(denseGrade as number).toBeGreaterThan(simpleGrade as number);
  });

  it("returns a plain number, rounded to one decimal", () => {
    const grade = fleschKincaidGrade("The quick brown fox jumps over the lazy dog every morning.");
    expect(grade).not.toBeNull();
    expect(Number.isFinite(grade)).toBe(true);
    expect(Math.round((grade as number) * 10)).toBe((grade as number) * 10);
  });
});
