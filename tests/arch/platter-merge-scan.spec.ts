import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { LOG_FORMAT, landings, ledgerItems, parseLog } from "../../scripts/platter-merge-scan.mjs";

/**
 * The platter's per-item revert, made checkable (#3754).
 *
 * `ship platter` boards one commit per item and the PR body asks Eric to land it with a merge
 * commit, because that is what keeps each item's sha on `main` and `git revert <item sha>` honest.
 * A sentence cannot force a merge method: by 2026-09-25 five of eleven landed platters were
 * single-parent squashes, so their per-item shas died with the deleted platter branch.
 *
 * This specs the detector over a FIXTURE LOG rather than the live repo — the live counts move every
 * time a platter lands, and a spec that asserts on them would be a calendar, not a contract. The
 * fixture is written in the exact byte shape `git log --format=LOG_FORMAT` emits (NUL between
 * fields, RS between records), including GitHub's hard wrap of a commit message mid-table, which is
 * the one thing a naive table parser gets wrong.
 */

/** One record in the shape git emits: sha \0 parents \0 subject \0 body \x1e */
const record = (sha: string, parents: string, subject: string, body: string) =>
  `${sha}\u0000${parents}\u0000${subject}\u0000${body}\u001e`;

// A ledger as GitHub stores it on a merge/squash commit: hard-wrapped, so rows span lines.
const WRAPPED_LEDGER = `## The picture

| # | item | why | verify evidence | revert |
|---|---|---|---|---|
| 1 | \`fix/repair-lane-push-token\` | fix(moneypenny): give the repair
lane's push a write-capable token | verify green 2026-09-19T11:02Z ·
\`.github/workflows/moneypenny-events.yml\` | \`3cbf4ac\` |
| 2 | \`fix/screen-pr-wire-guard\` | fix(moneypenny): skip a screen PR while
one is already open | verify green 2026-09-19T11:40Z ·
\`.github/workflows/moneypenny-events.yml\` | \`90b8cfc\` |

_Caption — the platter ledger, read from the boarded commits: each item,
the evidence it was green, and the sha that reverts it alone._

## Summary

- One merge clears every protected-path change below.`;

const FIXTURE_LOG = [
  record(
    "38e3a4bbc01a57bbad0f45452689bd3a58f47bf4",
    "df65c3f91bdf3b611b6307ee37ccc754852b9554",
    "chore(platter): protected-path changes — 2026-09-19 (#3329)",
    `chore(platter): protected-path changes — 2026-09-19 (#3329)\n\n${WRAPPED_LEDGER}`,
  ),
  record(
    "ff55c457c0f18f846bfa9dab6704e35a59b6a1c0",
    "cbf106f893a65fd2eea5b7ce24db963e87bc8ef0 cc5f521cfed5e92ac462e41047586d316ecca989",
    "chore(platter): protected-path changes — 2026-09-15 (#2979)",
    `chore(platter): protected-path changes — 2026-09-15 (#2979)\n\n${WRAPPED_LEDGER}`,
  ),
  record(
    "02da6fc3fa6a2fccb83778649c27503c5df3acc1",
    "b9c6b37d9292619a30f4e7d3221bfed6f1e166af",
    "feat(research): bound the calendar with a research horizon (#2971)",
    "feat(research): bound the calendar with a research horizon (#2971)\n\nAn ordinary PR.",
  ),
].join("");

describe("platter-merge-scan — a squashed platter is named, a merged one is not", () => {
  const found = landings(parseLog(FIXTURE_LOG));

  it("reads only the platter landings out of the log, leaving ordinary PRs alone", () => {
    expect(found).toHaveLength(2);
    expect(found.map((l) => l.pr)).toEqual([3329, 2979]);
  });

  it("flags the single-parent landing — one parent means the items were flattened into it", () => {
    expect(found[0]).toMatchObject({ pr: 3329, flattened: true });
  });

  it("clears the merge commit — two parents is the shape that keeps per-item revert", () => {
    expect(found[1]).toMatchObject({ pr: 2979, flattened: false });
  });

  it("names the items a squash flattened, so the report says what was lost, not just that", () => {
    expect(found[0]?.items).toEqual([
      expect.objectContaining({ item: "fix/repair-lane-push-token", revert: "3cbf4ac" }),
      expect.objectContaining({ item: "fix/screen-pr-wire-guard", revert: "90b8cfc" }),
    ]);
  });
});

describe("platter-merge-scan — ledgerItems survives how GitHub actually stores a ledger", () => {
  it("rejoins a row GitHub hard-wrapped mid-cell instead of dropping it", () => {
    const items = ledgerItems(WRAPPED_LEDGER);
    expect(items).toHaveLength(2);
    expect(items[0]?.why).toContain("give the repair lane's push a write-capable token");
  });

  it("stops at the caption rather than swallowing the prose below the table", () => {
    expect(ledgerItems(WRAPPED_LEDGER).map((i) => i.item)).not.toContain("Caption");
  });

  it("returns nothing when the commit message carries no ledger at all", () => {
    expect(ledgerItems("chore(platter): protected-path changes\n\nNo table here.")).toEqual([]);
  });
});

describe("platter-merge-scan — the report is advisory, never a gate", () => {
  let dir: string;
  let logFile: string;

  const scan = (args: string[]) => {
    try {
      const stdout = execFileSync("node", [resolve("scripts/platter-merge-scan.mjs"), ...args], {
        encoding: "utf8",
        stdio: "pipe",
      });
      return { code: 0, stdout };
    } catch (error) {
      const e = error as { status?: number; stdout?: Buffer };
      return { code: e.status ?? -1, stdout: e.stdout?.toString() ?? "" };
    }
  };

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "platter-scan-"));
    logFile = join(dir, "main-log.txt");
    writeFileSync(logFile, FIXTURE_LOG);
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  // Exit 0 on a finding is the design, not an oversight: the squashes already on `main` cannot be
  // un-squashed, so a blocking check would be permanently red for a defect no PR can clear.
  it("exits 0 even when it finds a flattened platter", () => {
    expect(scan(["--log", logFile]).code).toBe(0);
  });

  it("reports the flattened platter by PR number with the items it lost", () => {
    const { stdout } = scan(["--log", logFile]);
    expect(stdout).toContain("1 of 2 platter landing(s) were squashed");
    expect(stdout).toContain("#3329");
    expect(stdout).toContain("fix/repair-lane-push-token");
    expect(stdout).not.toContain("#2979");
  });

  it("names the revert path that actually exists for a squashed platter", () => {
    expect(scan(["--log", logFile]).stdout).toContain("the whole platter, as one");
  });

  it("emits the same finding as JSON for anything downstream", () => {
    const parsed = JSON.parse(scan(["--log", logFile, "--json"]).stdout);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].flattened).toBe(true);
  });

  it("pins the log format the parser expects, so a git-side change cannot pass silently", () => {
    expect(LOG_FORMAT).toBe("%H%x00%P%x00%s%x00%B%x1e");
  });
});
