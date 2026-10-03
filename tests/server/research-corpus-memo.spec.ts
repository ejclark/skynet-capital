import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { memoByCorpus } from "../../src/server/research-corpus-memo.js";
import {
  docsMentioning,
  findResearchDoc,
  listResearch,
} from "../../src/server/research-service.js";

// The research corpus is parsed once per process (an OOM fix: re-parsing 35 MB of markdown per
// /api/research request took the 512 MB dashboard machine past its limit). These pin the other
// half of that bargain — a cache must never serve a stale or foreign shelf.
describe("research corpus memo", () => {
  let root: string;
  const doc = (rel: string, md: string, mtime = Date.now() / 1000) => {
    const file = join(root, rel);
    writeFileSync(file, md);
    utimesSync(file, mtime, mtime);
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "research-memo-"));
    mkdirSync(join(root, "events"));
    doc("alpha.md", "# Alpha study\nNVDA leads.");
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("computes once while the corpus is unchanged", () => {
    let runs = 0;
    const compute = () => ++runs;
    memoByCorpus("spec-count", root, compute);
    memoByCorpus("spec-count", root, compute);
    expect(runs).toBe(1);
  });

  it("sees an edited doc on the next call", () => {
    expect(listResearch(root).studies.map((d) => d.title)).toEqual(["Alpha study"]);
    doc("alpha.md", "# Alpha study, revised\nNVDA leads.", Date.now() / 1000 + 5);
    expect(listResearch(root).studies.map((d) => d.title)).toEqual(["Alpha study, revised"]);
  });

  it("sees a newly added ledger and its mentions", () => {
    expect(docsMentioning(["AMD"], root)).toEqual({ AMD: [] });
    doc("events/amd-2026-10-28-print.md", "# AMD print\nAMD guides up.");
    expect(listResearch(root).ledgers.map((d) => d.slug)).toEqual(["events/amd-2026-10-28-print"]);
    expect(docsMentioning(["AMD"], root)).toEqual({ AMD: ["events/amd-2026-10-28-print"] });
  });

  it("never answers one root with another root's shelf", () => {
    const other = mkdtempSync(join(tmpdir(), "research-memo-other-"));
    try {
      writeFileSync(join(other, "beta.md"), "# Beta study");
      expect(listResearch(root).studies.map((d) => d.slug)).toEqual(["alpha"]);
      expect(listResearch(other).studies.map((d) => d.slug)).toEqual(["beta"]);
      expect(listResearch(root).studies.map((d) => d.slug)).toEqual(["alpha"]);
    } finally {
      rmSync(other, { recursive: true, force: true });
    }
  });

  it("hands back a detached copy, never the value compute() built", () => {
    // A regex match is a V8 sliced string that pins its whole source file; caching it raw kept the
    // entire corpus alive (~170 MB). The clone is what lets the parsed text be collected.
    const built = { title: "Alpha study" };
    const cached = memoByCorpus("spec-detach", root, () => built);
    expect(cached).toEqual(built);
    expect(cached).not.toBe(built);
  });

  it("renders the forward-test register once, and again when a fragment changes", () => {
    mkdirSync(join(root, "forward-tests"));
    doc("forward-tests.md", "# Forward-test register\nIndex.");
    doc("forward-tests/amd-print.md", "# AMD print\nfirst row");
    expect(findResearchDoc("forward-tests", root)?.html).toContain("first row");
    expect(findResearchDoc("forward-tests", root)).toBe(findResearchDoc("forward-tests", root));
    doc("forward-tests/amd-print.md", "# AMD print\nrevised row", Date.now() / 1000 + 5);
    expect(findResearchDoc("forward-tests", root)?.html).toContain("revised row");
  });
});
