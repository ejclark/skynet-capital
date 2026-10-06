import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import v8 from "node:v8";
import vm from "node:vm";
import { memoByCorpus } from "../../src/server/research-corpus-memo.js";
import { ledgerDigests } from "../../src/server/research-horizon-calls.js";
import {
  docsMentioning,
  eventCalls,
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

  it("describes each ledger from one read, so the listing, calls and digests agree (#4615)", () => {
    // Each of the three used to re-read every ledger: the first calendar request after boot decoded
    // the event corpus three times. A second read is also the only way the three could describe
    // two versions of one file — which is how this pins the single read.
    const ledger = (call: string) =>
      `# AMD print\n\n## At a glance\n\n| Horizon | Call | Why |\n|---|---|---|\n| Today | ${call} | edge |\n`;
    const at = 1_790_000_000;
    doc("events/amd-2026-10-28-print.md", ledger("Long the print"), at);
    expect(listResearch(root).ledgers.map((d) => d.slug)).toEqual(["events/amd-2026-10-28-print"]);

    // Same size, same mtime: the corpus fingerprint cannot see this edit; only a re-read would.
    doc("events/amd-2026-10-28-print.md", ledger("Fade the print"), at);

    expect(eventCalls(root).get("amd-2026-10-28-print")?.call).toBe("Long the print");
    expect(ledgerDigests(root).get("amd-2026-10-28-print")?.horizons.today?.call).toBe(
      "Long the print",
    );
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

  it("keeps the value itself when compute says every row is already detached (#4615)", () => {
    // The shelf's ledger pass detaches each row as it reads it; cloning the finished shelf again
    // only doubled what was live at the end of the cold build.
    const built = { title: "Alpha study" };
    expect(memoByCorpus("spec-own", root, () => built, { detached: true })).toBe(built);
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

describe("the cold build lets go of each doc once its row is built (#4612 slice 3, #4615)", () => {
  // A regex match is a V8 sliced string that keeps its whole source file alive. #4519 detached at
  // the memo, which bounded what the process KEEPS — but while the build ran, every row still
  // pinned its file until the last one was read, so the whole corpus was live at once: +93-99 MB
  // on the first calendar request after boot in a 512 MB container. Each row is detached as it is
  // built now, so a finished doc is garbage before the next one is read.
  //
  // Measured as live heap after a full GC at every structuredClone the build makes: each row's
  // clone in a build that detaches as it reads, the finished shelf's in one that detaches only at
  // the memo — the moment such a build peaks. A build that clones nothing at all would cache sliced
  // strings for good, so it fails here too (no samples).
  v8.setFlagsFromString("--expose-gc");
  const gc = vm.runInNewContext("gc") as () => void;

  const DOCS = 12;
  /** ~0.5 MB of heap per doc: em dashes keep it two-byte, like the real corpus. */
  const FILLER = "— a line of method notes, as long as the real ones run\n".repeat(5_000);
  const ledger = (i: number) =>
    `# Event ledger ${i} — a title long enough to be sliced\n\n**Last assessed:** 2026-10-01\n\n` +
    "## At a glance\n\n**TL;DR.** Stand aside into the print.\n\n" +
    "| Horizon | Call | Confidence | Why | Proves it wrong |\n|---|---|---|---|---|\n" +
    `| Today | Stand aside, no edge into print ${i} | High | thin tape | a 2% move |\n` +
    `| This week | Wait for the reaction before sizing ${i} | Medium | the fork | CPI |\n\n` +
    `## Method\n\n${FILLER}`;
  /** Heap the whole shelf's text occupies: two bytes a character. */
  const corpusHeap = ledger(0).length * 2 * DOCS;

  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "research-detach-"));
    mkdirSync(join(root, "events"));
    for (let i = 0; i < DOCS; i++) {
      writeFileSync(join(root, "events", `evt${i}-2026-10-30-print.md`), ledger(i));
    }
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  /** The most the live heap rose above where it stood before `build`, sampled at each detach. */
  function peakLiveGrowth(build: () => unknown): { samples: number; growth: number } {
    gc();
    const before = process.memoryUsage().heapUsed;
    let peak = before;
    let samples = 0;
    const clone = globalThis.structuredClone;
    globalThis.structuredClone = ((value: unknown, options?: StructuredSerializeOptions) => {
      gc();
      peak = Math.max(peak, process.memoryUsage().heapUsed);
      samples += 1;
      return clone(value, options);
    }) as typeof structuredClone;
    try {
      build();
    } finally {
      globalThis.structuredClone = clone;
    }
    return { samples, growth: peak - before };
  }

  it("holds no finished doc while listing the shelf", () => {
    const { samples, growth } = peakLiveGrowth(() => listResearch(root));

    expect(samples).toBeGreaterThan(0);
    expect(growth).toBeLessThan(corpusHeap / 4);
  });

  it("holds no finished ledger while reading the calls cold", () => {
    const { samples, growth } = peakLiveGrowth(() => eventCalls(root));

    expect(samples).toBeGreaterThan(0);
    expect(growth).toBeLessThan(corpusHeap / 4);
    expect(eventCalls(root).get("evt3-2026-10-30-print")?.call).toBe(
      "Stand aside, no edge into print 3",
    );
  });

  it("holds no finished ledger while reading the digests cold", () => {
    const { samples, growth } = peakLiveGrowth(() => ledgerDigests(root));

    expect(samples).toBeGreaterThan(0);
    expect(growth).toBeLessThan(corpusHeap / 4);
    expect(ledgerDigests(root).get("evt5-2026-10-30-print")?.horizons.week?.call).toBe(
      "Wait for the reaction before sizing 5",
    );
  });
});
