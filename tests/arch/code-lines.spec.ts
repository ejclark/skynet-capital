import { codeLineCount } from "../../scripts/code-lines.mjs";

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
