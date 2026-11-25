import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { recountAfterMark } from "../../../scripts/moneypenny/admission.mjs";
import { claimNext } from "../../../scripts/moneypenny/index.mjs";
import {
  issue,
  mode,
  noContinuation,
  noHold,
  noOpenPlans,
  noOpenPrs,
} from "../../support/admission-fixtures.js";

// #8213 — THE SWEEP'S RECOUNT READS THE IN-FLIGHT LIST FRESH. `claimNext` reads the in-flight list
// once and hands its claim a gate that counts that stored list. The post-mark recount (#7316) used
// the same stored reader, so it never saw the sweep's own mark or a label-event claim that marked
// mid-sweep, and the sweep's claim always kept its seat: cap 6, 5 in flight, a label claim L and
// the sweep's pick S both marking → 7 builds. These specs drive the REAL `claimNext` and the REAL
// feedback claim lane (gate, lease, mark, recount, withdrawal); only `gh` is faked, on PATH, so
// the lease and label writes are recorded instead of reaching GitHub. Every read `claimNext`
// takes is injected, as in admission-sweep.spec.ts.

type Row = ReturnType<typeof issue>;

const T0 = Date.parse("2026-11-24T04:00:00Z");
const iso = (ms: number) => new Date(ms).toISOString();
const marked = (ms: number) => [
  { event: "labeled", label: { name: "in-progress" }, created_at: iso(ms) },
];

const established = Array.from({ length: 5 }, (_, k) => issue(8001 + k, `surface ${k}`));
const L = issue(8101, "surface L", ["ready", "feedback", "in-progress"]);
const S = issue(8102, "surface S", ["ready", "feedback"]);

describe("claimNext — the post-mark recount reads the in-flight list fresh (#8213)", () => {
  let dir: string;
  let ghLog: string;
  let out: string;
  const saved = { PATH: process.env.PATH, GITHUB_OUTPUT: process.env.GITHUB_OUTPUT };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "sweep-recount-"));
    ghLog = join(dir, "gh.log");
    out = join(dir, "output");
    writeFileSync(ghLog, "");
    writeFileSync(out, "");
    const fake = join(dir, "gh");
    writeFileSync(
      fake,
      [
        "#!/bin/sh",
        `printf '%s\\n' "$*" >> "${ghLog}"`,
        'case "$*" in',
        "  *git/ref/tags/*) exit 1 ;;", // no lease held yet
        `  *git/tags*) echo '{"sha":"stamp"}' ;;`,
        "  *) echo '{}' ;;",
        "esac",
        "",
      ].join("\n"),
    );
    chmodSync(fake, 0o755);
    const curl = join(dir, "curl");
    writeFileSync(curl, "#!/bin/sh\nexit 22\n");
    chmodSync(curl, 0o755);
    process.env.PATH = `${dir}:${saved.PATH}`;
    process.env.GITHUB_OUTPUT = out; // never the real step's output file
    rstest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env.PATH = saved.PATH;
    if (saved.GITHUB_OUTPUT === undefined) delete process.env.GITHUB_OUTPUT;
    else process.env.GITHUB_OUTPUT = saved.GITHUB_OUTPUT;
    rstest.restoreAllMocks();
    rmSync(dir, { recursive: true, force: true });
  });

  /** Does S carry `in-progress` now? The claim lane's own label writes, read back from the log. */
  const sMarked = () => {
    const edits = readFileSync(ghLog, "utf8")
      .split("\n")
      .filter((c) => c.startsWith(`issue edit ${S.number} `) && c.endsWith(" in-progress"));
    return edits.at(-1)?.includes("--add-label") ?? false;
  };

  /**
   * The simulated repo. `rival` is a label-event claim that passed its gate before the sweep and
   * marks right after the sweep's own first read — the interleaving the audit reproduced.
   */
  const world = (rival: boolean) => {
    let reads = 0;
    const live = (): Row[] => {
      const rows: Row[] = [...established];
      if (rival && reads > 0) rows.push(L);
      if (sMarked()) rows.push(S);
      return rows;
    };
    const notes: number[] = [];
    const shared = {
      readMode: () => ({ ...mode("surge", 6), until: null, reason: "x" }),
      readEvents: (n: number) =>
        n === L.number
          ? marked(T0 + 1000)
          : n === S.number
            ? marked(T0 + 2000)
            : marked(T0 - 3_600_000),
      comments: () => [],
      comment: (n: number) => notes.push(n),
      settle: () => undefined,
      log: () => undefined,
    };
    const deps = {
      ...shared,
      readInFlight: () => {
        const rows = live();
        reads += 1;
        return rows;
      },
      readReady: () => [S],
      readPrIssues: noOpenPrs,
      readPlans: noOpenPlans,
      readHold: noHold,
      continuation: noContinuation,
      readIssue: (n: number) => (n === S.number ? S : L),
      readBoarded: () => new Map<number, number>(),
    };
    return { deps, live, shared, notes };
  };

  it("withdraws the sweep's claim when a label-event claim marked mid-sweep, so builds never pass the cap", () => {
    const w = world(true);
    const r = claimNext(T0 + 2000, "abc", w.deps);
    // L marked first, so L keeps its seat on its own (live) recount…
    expect(recountAfterMark(L, { ...w.shared, readInFlight: w.live }).keep).toBe(true);
    // …and S, the later mark, gives its seat back.
    expect(r).toMatchObject({ claimed: false, lane: "feedback" });
    expect(r.reason).toMatch(/^queued:/);
    expect(sMarked()).toBe(false);
    expect(w.live().length).toBeLessThanOrEqual(6);
    expect(readFileSync(out, "utf8")).not.toContain("number=");
    expect(w.notes).toEqual([S.number]);
  });

  it("keeps the sweep's claim when the fresh read still fits the cap", () => {
    const w = world(false);
    const r = claimNext(T0 + 2000, "abc", w.deps);
    expect(r).toMatchObject({ claimed: true, lane: "feedback", number: S.number });
    expect(sMarked()).toBe(true);
    expect(w.live()).toHaveLength(6);
    expect(readFileSync(out, "utf8")).toContain(`number=${S.number}`);
  });
});
