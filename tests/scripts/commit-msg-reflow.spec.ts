import { LIMIT, reflow } from "../../scripts/commit-msg-reflow.mjs";

/**
 * The commit-msg reflow hook: commitlint's 100-column body rule stays (a commit's format is an
 * interface — docs/COACHES.md), but an author can no longer trip it by hand — the hook wraps
 * prose before commitlint reads it. Everything that is not prose passes through untouched.
 */
const long =
  "- A sweep's adjacent-event proposal is `market-events/proposals/<id>.from-<proposer>.json`, owned by the proposing lane";

describe("commit-msg reflow", () => {
  it("wraps an over-long body paragraph at word boundaries under the limit", () => {
    const out = reflow(`feat: x\n\n${long}\n`);
    const body = out.split("\n").slice(2);
    for (const l of body) expect(l.length).toBeLessThanOrEqual(LIMIT);
    expect(body.join(" ").replace(/\s+/g, " ")).toContain("owned by the proposing lane");
  });

  it("keeps a list item's hanging indent so the wrapped lines stay inside the bullet", () => {
    const [, , first, second] = reflow(`feat: x\n\n${long}\n`).split("\n");
    expect(first).toMatch(/^- /);
    expect(second).toMatch(/^ {2}\S/);
  });

  it("never rewrites the header, even when it is over the limit", () => {
    const header = `feat: ${"x".repeat(120)}`;
    expect(reflow(`${header}\n\nbody\n`).split("\n")[0]).toBe(header);
  });

  it("leaves fenced code, tables, headings and trailers verbatim", () => {
    const code = `\`\`\`\n${"code ".repeat(30)}\n\`\`\``;
    const table = `| a | ${"b".repeat(120)} |`;
    const heading = `## ${"h".repeat(120)}`;
    const trailer = `Claude-Session: https://claude.ai/code/${"s".repeat(100)}`;
    const msg = `feat: x\n\n${code}\n\n${table}\n\n${heading}\n\n${trailer}\n`;
    expect(reflow(msg)).toBe(msg);
  });

  it("leaves a single token longer than the limit on its own line — the one residual", () => {
    const url = `https://example.com/${"p".repeat(120)}`;
    const out = reflow(`feat: x\n\nsee ${url} for details\n`);
    expect(out.split("\n")).toContain(url);
  });

  it("is a no-op on a message that already conforms", () => {
    const msg = "fix: y\n\n## Summary\n\n- short line\n- another\n\nCo-Authored-By: A <a@b.c>\n";
    expect(reflow(msg)).toBe(msg);
  });
});
