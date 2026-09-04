import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { scanWorkflowMeta } from "../../scripts/workflow-meta-scan.mjs";

// Workflow-meta gate — every .claude/workflows/*.js must carry an `export const meta` the Workflow
// tool's registry can read STATICALLY (a pure literal, first statement, name = filename). The
// registry does not error on a bad meta; the workflow silently disappears from `Workflow({name})`.
// That is how /grind shipped documented, routed from CLAUDE.md, and un-invokable (2026-09-04).
// Blocking on purpose: a dropped workflow is a broken contract, not debt to ratchet down.
const SCRIPT = join(process.cwd(), "scripts/workflow-meta-scan.mjs");

const PURE = `// leading comments are fine
export const meta = {
  name: 'demo',
  description: 'A demo',
  whenToUse: 'When {items: [...]} arrive — braces and "quotes" in a string are just characters',
  phases: [{ title: 'One', detail: 'first' }, { title: 'Two' }],
}
const x = await agent('go')
return x
`;

describe("workflow-meta gate (blocking)", () => {
  it("every checked-in workflow script has a registry-readable meta", () => {
    execFileSync("node", [SCRIPT], { cwd: process.cwd(), stdio: "pipe" });
  });
});

describe("workflow-meta scanner behavior", () => {
  it("accepts a pure-literal meta that is the first statement", () => {
    expect(scanWorkflowMeta(PURE, "x/demo.js")).toEqual([]);
  });

  it("flags string concatenation in a field — the shape that dropped /grind", () => {
    const src = PURE.replace("description: 'A demo'", "description: 'A ' + 'demo'");
    const problems = scanWorkflowMeta(src, "x/demo.js");
    expect(
      problems.some((p) => p.includes("meta.description") && p.includes("BinaryExpression")),
    ).toBe(true);
  });

  it("flags a template literal", () => {
    const src = PURE.replace("description: 'A demo'", "description: `A demo`");
    expect(scanWorkflowMeta(src, "x/demo.js").some((p) => p.includes("TemplateLiteral"))).toBe(
      true,
    );
  });

  it("flags an identifier, a call, and a spread", () => {
    const ident = PURE.replace("description: 'A demo'", "description: DESC");
    const call = PURE.replace("description: 'A demo'", "description: describe()");
    const spread = PURE.replace("phases: [", "phases: [...EXTRA, ");
    expect(scanWorkflowMeta(ident, "x/demo.js").some((p) => p.includes("Identifier"))).toBe(true);
    expect(scanWorkflowMeta(call, "x/demo.js").some((p) => p.includes("CallExpression"))).toBe(
      true,
    );
    expect(scanWorkflowMeta(spread, "x/demo.js").some((p) => p.includes("SpreadElement"))).toBe(
      true,
    );
  });

  it("flags a meta whose name does not match the filename", () => {
    const problems = scanWorkflowMeta(PURE, "x/other.js");
    expect(problems.some((p) => p.includes('"demo"') && p.includes("other.js"))).toBe(true);
  });

  it("flags code before the meta export", () => {
    const src = `const early = 1\n${PURE}`;
    expect(scanWorkflowMeta(src, "x/demo.js").some((p) => p.includes("first statement"))).toBe(
      true,
    );
  });

  it("flags a script with no meta export at all", () => {
    expect(scanWorkflowMeta("const x = 1\n", "x/demo.js")[0]).toContain("no `export const meta");
  });

  it("flags a phase without a string title", () => {
    const src = PURE.replace("{ title: 'Two' }", "{ detail: 'no title' }");
    expect(scanWorkflowMeta(src, "x/demo.js").some((p) => p.includes("phases[1]"))).toBe(true);
  });

  it("reports a syntax error as a parse failure rather than crashing", () => {
    const [only] = scanWorkflowMeta("export const meta = {\n", "x/demo.js");
    expect(only).toContain("does not parse");
  });
});
