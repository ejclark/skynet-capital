import { codeLineCount, lineBreakdown } from "../../scripts/code-lines.mjs";

// The counter behind the size cap (#1713): structure is priced, intent is not. Biome's rule charged
// full price for `//` lines and blanks while collapsing block comments and template literals to one
// line, which is what taught sessions to write WHY as a docstring — these cases pin the inverse.
describe("code-lines: codeLineCount", () => {
  it("counts a line of code", () => {
    expect(codeLineCount("const a = 1;\nconst b = 2;")).toBe(2);
  });

  it("does not count blank or whitespace-only lines", () => {
    expect(codeLineCount("const a = 1;\n\n   \nconst b = 2;")).toBe(2);
  });

  it("does not count a whole-line // comment", () => {
    expect(codeLineCount("// why this exists (#1713)\nconst a = 1;")).toBe(1);
  });

  it("counts an indented // comment as a comment, not code", () => {
    expect(codeLineCount("function f() {\n  // the invariant\n  return 1;\n}")).toBe(3);
  });

  it("does not count any line of a multi-line block comment", () => {
    const source = "/**\n * A docstring.\n * Second line.\n */\nconst a = 1;";
    expect(codeLineCount(source)).toBe(1);
  });

  it("does not count a single-line block comment", () => {
    expect(codeLineCount("/* inline note */\nconst a = 1;")).toBe(1);
  });

  it("prices a docstring and the equivalent // lines identically", () => {
    const docstring = "/**\n * one\n * two\n * three\n */\nconst a = 1;";
    const inline = "// one\n// two\n// three\n// (block delimiters)\n// \nconst a = 1;";
    expect(codeLineCount(docstring)).toBe(codeLineCount(inline));
  });

  it("resumes counting code after a block comment closes", () => {
    expect(codeLineCount("/*\n a\n*/\nconst a = 1;\nconst b = 2;")).toBe(2);
  });

  it("counts a trailing comment's line as code", () => {
    expect(codeLineCount("const a = 1; // why")).toBe(1);
  });

  it("returns zero for a file that is all comment", () => {
    expect(codeLineCount("// a\n// b\n/* c */\n")).toBe(0);
  });
});

// The cap itself, at its two interesting boundaries. CAP mirrors scripts/arch-scan.mjs — the scan
// runs as a script (top-level walk + process.exit), so its constant cannot be imported; these cases
// pin the RULE the scan applies, which is what #1713 changed.
const CAP = 300;
const repeat = (line: string, n: number) => `${Array.from({ length: n }, () => line).join("\n")}\n`;

describe("code-lines: the 300 code-line cap", () => {
  it("leaves a file of 400 comment lines and 10 code lines under the cap", () => {
    const source = repeat("// context for the next session", 400) + repeat("const a = 1;", 10);
    const { code, comment, physical } = lineBreakdown(source);

    expect(code).toBe(10);
    expect(comment).toBe(400);
    expect(code).toBeLessThanOrEqual(CAP);
    expect(physical).toBeGreaterThan(CAP); // the old physical-line cap would have flagged it
  });

  it("puts a file of 310 code lines over the cap", () => {
    const { code, comment } = lineBreakdown(repeat("const a = 1;", 310));

    expect(code).toBe(310);
    expect(comment).toBe(0);
    expect(code).toBeGreaterThan(CAP);
  });

  it("does not let comments rescue a file that is over the cap on code alone", () => {
    const source = repeat("// why", 400) + repeat("const a = 1;", 310);

    expect(lineBreakdown(source).code).toBeGreaterThan(CAP);
  });
});

describe("code-lines: lineBreakdown", () => {
  it("reports code and comment lines separately", () => {
    const { code, comment } = lineBreakdown("// why\nconst a = 1;\nconst b = 2;");

    expect(code).toBe(2);
    expect(comment).toBe(1);
  });

  it("counts every line of a multi-line block comment as comment", () => {
    expect(lineBreakdown("/**\n * one\n * two\n */\nconst a = 1;").comment).toBe(4);
  });

  it("classifies every line exactly once — code + comment + blank equals physical", () => {
    const source = "// why\n\n/*\n block\n*/\nconst a = 1; // trailing\n";
    const { code, comment, blank, physical } = lineBreakdown(source);

    expect(code + comment + blank).toBe(physical);
    expect(physical).toBe(source.split("\n").length);
  });
});
