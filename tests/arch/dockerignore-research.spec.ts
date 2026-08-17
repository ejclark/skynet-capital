import { readFileSync } from "node:fs";
import { join } from "node:path";
import dockerignore from "@balena/dockerignore";

/**
 * Deploy-packaging guard for the research surface (docs/plans/research-lab.md).
 *
 * The `/research` route reads its content as markdown from `docs/research/` at REQUEST time
 * (src/server/research-service.ts) — so those files must survive `.dockerignore` and land in the
 * production image. They nearly didn't: a bare `docs` exclusion silently emptied every `/research`
 * page in prod while every test (temp-dir fixtures) and every local screenshot (full checkout)
 * stayed green. This spec closes that gap by matching the real files against the real
 * `.dockerignore` with docker's own semantics — the check the earlier miss lacked.
 */
const ROOT = join(__dirname, "..", "..");

function ignorer() {
  const patterns = readFileSync(join(ROOT, ".dockerignore"), "utf8").split("\n");
  return dockerignore().add(patterns);
}
const included = (p: string) => !ignorer().ignores(p);

describe("dockerignore — research shelf ships to prod", () => {
  it("keeps the docs/research markdown the /research route reads at runtime", () => {
    // The exact files the live pages depend on — event ledgers and studies.
    for (const p of [
      "docs/research/events/nvda-2026-08-26-print.md",
      "docs/research/events/crwv-2026-11-10-print.md",
      "docs/research/nvda-aug-2026-print.md",
      "docs/research/multi-symbol-sweep.md",
      "docs/research/forward-tests.md",
    ]) {
      expect({ path: p, included: included(p) }).toEqual({ path: p, included: true });
    }
  });

  it("still excludes the rest of docs/ and root markdown (image stays lean)", () => {
    for (const p of [
      "docs/plans/research-lab.md",
      "docs/BRAND.md",
      "docs/ENGINEERING.md",
      "README.md",
    ]) {
      expect({ path: p, included: included(p) }).toEqual({ path: p, included: false });
    }
  });
});
