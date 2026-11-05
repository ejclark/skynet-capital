import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "@rstest/core";
import { sameDefect } from "../../scripts/pr-review/post.mjs";

// #6870 S2. The post-merge audit and the pre-merge reviewer route a PR by the same rules, or the miss
// rate S7 measures compares two different routings. The audit is a workflow script and cannot import,
// so it keeps its own copy of DEEP_ROOTS, DOCS_ONLY and sameDefect. This reads that copy out of the
// workflow's source and fails when it and scripts/review-roots.mjs (or post.mjs) differ: widen both
// in the same PR.

interface Roots {
  DEEP_ROOTS: string[];
  DOCS_ONLY_ROOTS: string[];
  DOCS_ONLY: (f: string) => boolean;
  isDeepPath: (f: string) => boolean;
}

const AUDIT = readFileSync(join(process.cwd(), ".claude/workflows/post-merge-audit.js"), "utf8");
// Loaded by URL, not a static import: scripts/ gets no type file for one module a spec reads.
const roots = (): Promise<Roots> =>
  import(pathToFileURL(join(process.cwd(), "scripts/review-roots.mjs")).href);

/** One `const NAME = …` from the audit's source, evaluated. Its copies are plain literals. */
function fromAudit<T>(name: string, shape: RegExp): T {
  const text = shape.exec(AUDIT)?.[1];
  if (!text)
    throw new Error(`post-merge-audit.js no longer declares ${name} in the shape this spec reads`);
  return new Function(`return (${text})`)() as T;
}

const auditDeep = () =>
  fromAudit<string[]>("DEEP_ROOTS", /^const DEEP_ROOTS = (\[[\s\S]*?\])\s*$/m);
const auditDocsOnly = () =>
  fromAudit<(f: string) => boolean>("DOCS_ONLY", /^const DOCS_ONLY = (.+)$/m);
type Place = { lens?: string; file?: string; line?: number | null };
const auditSameDefect = () =>
  fromAudit<(f: Place, g: Place) => boolean>("sameDefect", /^const sameDefect = (.+)$/m);

describe("the audit's copy of the review roots", () => {
  it("lists the same deep roots, in the same order", async () => {
    expect((await roots()).DEEP_ROOTS).toEqual(auditDeep());
  });

  it("names the same docs-only prefixes", async () => {
    const prefixes = [
      ...(/^const DOCS_ONLY = (.+)$/m.exec(AUDIT)?.[1] ?? "").matchAll(/startsWith\('([^']+)'\)/g),
    ].map((m) => m[1]);
    expect((await roots()).DOCS_ONLY_ROOTS).toEqual(prefixes);
  });

  it("calls the same paths docs-only, near misses included", async () => {
    const { DOCS_ONLY, DOCS_ONLY_ROOTS, DEEP_ROOTS } = await roots();
    const audit = auditDocsOnly();
    const probes = [
      ...DOCS_ONLY_ROOTS.flatMap((r) => [r, `${r}x.md`, r.slice(0, -1), `app/${r}x`]),
      ...DEEP_ROOTS.map((r) => `${r}x.ts`),
      "doc/x.md",
      "README.md",
      "src/domain/market-events/x.ts",
    ];
    for (const p of probes) expect([p, DOCS_ONLY(p)]).toEqual([p, audit(p)]);
  });

  it("routes the same paths deep", async () => {
    const { isDeepPath, DEEP_ROOTS } = await roots();
    const audit = auditDeep();
    const probes = [
      ...DEEP_ROOTS.flatMap((r) => [`${r}x`, r.slice(0, -1), `x/${r}`]),
      "scripts/bots",
      "src/ui/x.ts",
    ];
    for (const p of probes)
      expect([p, isDeepPath(p)]).toEqual([p, audit.some((r) => p.startsWith(r))]);
  });
});

describe("the audit's copy of the same-defect rule", () => {
  it("folds exactly the pairs post.mjs folds", () => {
    const audit = auditSameDefect();
    const lines = [null, 1, 2, 4, 5, 8];
    for (const lens of ["review", "adversarial"])
      for (const file of ["src/a.ts", "src/b.ts"])
        for (const line of lines) {
          const f = { lens: "review", file: "src/a.ts", line: 4 };
          const g = { lens, file, line };
          expect([g, sameDefect(f, g)]).toEqual([g, audit(f, g)]);
          expect([g, sameDefect(g, f)]).toEqual([g, audit(g, f)]);
        }
  });
});
