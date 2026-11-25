import { describe, expect, it } from "@rstest/core";
import { isNarration, scanSource } from "../../scripts/comment-bloat-scan.mjs";

// docs/ENGINEERING.md → *WHY earns its place*: "A comment whose only content is a bare issue/PR
// number, 'used by X', or 'added for the Y flow' is narration." WHEN the comment-bloat scan reads a
// comment, it SHALL flag it only when a history signal is its whole content, and SHALL keep a WHY
// that cites its source (#7950: the line-level pattern flagged 2065 such lines, nearly all WHY).

describe("isNarration", () => {
  it("flags a comment whose only content is a citation or a caller", () => {
    for (const text of [
      "issue #885",
      "#588",
      "(#738 phase 2c)",
      "see #12",
      "added in PR #40",
      "used by `desk-json-view.ts`",
      "This was removed in #12.",
    ]) {
      expect({ text, narration: isNarration(text) }).toEqual({ text, narration: true });
    }
  });

  it("keeps a WHY that cites where it was decided", () => {
    for (const text of [
      "a production boot with no sign-in must fail, not serve an open dashboard (#4621).",
      "Symbol-targeting filter (#885) — absent means unrestricted.",
      "#1211 slice 2 — dark unless configured",
      "In-memory store: the reference implementation, used by tests.",
      "`prev` with each named setting set, or removed when `null`.",
    ]) {
      expect({ text, narration: isNarration(text) }).toEqual({ text, narration: false });
    }
  });

  it("never flags a comment with no history signal, however short", () => {
    expect(isNarration("-----")).toBe(false);
    expect(isNarration("")).toBe(false);
  });
});

describe("scanSource", () => {
  it("reads a multi-line comment as one, so a citation on its last line is not judged alone", () => {
    const source = [
      "// The leg table is insert-only, so remember the hits and the misses",
      "// until the table gains a row (#4619).",
      "const x = 1;",
    ].join("\n");
    expect(scanSource(source)).toEqual([]);
  });

  it("flags a bare trailing citation at its own line, and ignores `//` inside a URL", () => {
    const source = [
      "const rosters = build(bots); // issue #885",
      'const url = "https://example.com/#123";',
      "/**",
      " * (#3968)",
      " */",
    ].join("\n");
    expect(scanSource(source)).toEqual([
      { line: 1, text: "const rosters = build(bots); // issue #885" },
      { line: 3, text: "/**" },
    ]);
  });
});
