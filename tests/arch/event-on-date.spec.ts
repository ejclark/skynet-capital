import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// THE DATE LOOKUP (#3361) — the PREVENT half of the duplicate-event gate #3101 opened. #3360
// shipped detect (an advisory same-date title-overlap warning) and resolve (`supersededBy`); both
// run after a duplicate already exists. This one runs before it does.
//
// WHY IT IS A LISTING. The measured failure was one mis-specified search string: a D-14 sweep
// searched for "U.S. IIP", which is not a substring of BEA's own "International Transactions and
// Investment Position", and filed a third copy of a release the calendar already carried twice. A
// lookup keyed on the DATE is keyed on something the proposing lane already holds — it is
// proposing FOR that date — so its recall does not depend on the lane's own vocabulary. That is
// the whole difference between this and a title-similarity scan tuned on seven positives.
//
// Everything here is static: no network, no session, no token.

const entry = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id,
  kind: "macro-print",
  title: `${id} title`,
  date,
  status: "confirmed",
  source: "BLS: fixture",
  impact: "low",
  symbols: [],
  ...extra,
});

const CADENCE = {
  horizon: { maxDaysOut: 60, allImpactsWithinDays: 30 },
  bands: { critical: [], high: [], medium: [], low: [{ minDaysOut: 0, intervalDays: 7 }] },
  closeOutWithinDays: 6,
};

/** Run the real CLI over a fixture calendar. `files` maps file name (`proposals/…` allowed) →
 *  entry; `prints` seeds earnings-calendar.ts, whose rows become DERIVED events with no file of
 *  their own. `cadence` is overridable so a spec can prove the listing does not read it. */
function run(
  args: string[],
  files: Record<string, object>,
  prints: readonly object[] = [],
  cadence: object = CADENCE,
): { ok: boolean; out: string } {
  const dir = mkdtempSync(join(tmpdir(), "event-on-date-"));
  try {
    mkdirSync(join(dir, "events", "proposals"), { recursive: true });
    for (const [name, event] of Object.entries(files))
      writeFileSync(join(dir, "events", name), `${JSON.stringify(event, null, 2)}\n`);
    writeFileSync(
      join(dir, "earnings-calendar.ts"),
      `export const UPCOMING_PRINTS: readonly EarningsPrint[] = ${JSON.stringify(prints)};\n`,
    );
    writeFileSync(join(dir, "cadence.json"), JSON.stringify(cadence));
    const done = spawnSync(
      "node",
      [
        "scripts/event-scan.mjs",
        ...args,
        `--events-dir=${join(dir, "events")}`,
        `--calendar-file=${join(dir, "earnings-calendar.ts")}`,
        `--cadence-file=${join(dir, "cadence.json")}`,
        `--ledger-dir=${join(dir, "no-ledgers")}`,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    return { ok: done.status === 0, out: `${done.stdout}${done.stderr}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Just the listing lines — the `·`/`✗` rows, without the trailing count sentence. Runs of
 *  whitespace collapse to one space: the columns are aligned to the widest id on the date, so
 *  pinning their exact width would make every spec here a test of `padEnd` rather than of content. */
const lines = (out: string) =>
  out
    .split("\n")
    .filter((l) => /^[·✗] /.test(l))
    .map((l) => l.replace(/\s+/g, " ").trim());

describe("event-scan --on-date", () => {
  it("lists every kind of entry on the date — canonical, standing proposal, derived print", () => {
    // The proposal names an id no canonical file names, so it is a STANDING one: it loads as the
    // calendar, and a lane that cannot see it will re-propose the release it already describes.
    const { ok, out } = run(
      ["--on-date=2026-05-01"],
      {
        "beta.json": entry("beta", "2026-05-01", { impact: "medium", status: "estimate" }),
        "alpha.json": entry("alpha", "2026-05-01"),
        "elsewhere.json": entry("elsewhere", "2026-05-02"),
        "proposals/gamma.from-somebody.json": entry("gamma", "2026-05-01"),
      },
      [{ symbol: "NVDA", date: "2026-05-01", status: "confirmed", source: "IR: fixture" }],
    );
    expect(ok).toBe(true);
    // (date, id) order — one date, so alphabetical by id. Derived prints sort in with the rest.
    expect(lines(out)).toEqual([
      "· alpha confirmed low alpha title",
      "· beta estimate medium beta title",
      "· gamma confirmed low gamma title",
      "· nvda-2026-05-01-print confirmed critical NVDA earnings print",
    ]);
    expect(out).not.toContain("elsewhere");
    expect(out).toContain("4 entries on 2026-05-01");
  });

  // THE SHARP ONE. `supersededBy` stops an entry loading AS the calendar, and the caller who most
  // needs to see it anyway is precisely this one: a lane about to re-file that release has to know
  // the slug was already tried and which id won. Omit it and the next sweep re-proposes the very
  // id a lane just retired, which would make the prevent half undo the resolve half.
  it("prints a retired re-slug marked as retired, naming the survivor, rather than omitting it", () => {
    const { out } = run(["--on-date=2026-05-01"], {
      "survivor.json": entry("survivor", "2026-05-01"),
      "reslug.json": entry("reslug", "2026-05-01", {
        status: "estimate",
        supersededBy: "survivor",
      }),
    });
    expect(lines(out)).toEqual([
      "✗ reslug estimate low reslug title [RETIRED — superseded by survivor]",
      "· survivor confirmed low survivor title",
    ]);
    expect(out).toContain("2 entries on 2026-05-01 (1 retired)");
  });

  // The loader's dedupe still governs: a proposal shadowed by a canonical file of the same id is
  // one entry, not two. Printing both would tell a lane the calendar carries a duplicate it does
  // not carry — a false positive on the one check whose value is that it has no false rate.
  it("prints one line for an id whose proposal a canonical file shadows", () => {
    const { out } = run(["--on-date=2026-05-01"], {
      "alpha.json": entry("alpha", "2026-05-01"),
      "proposals/alpha.from-somebody.json": entry("alpha", "2026-05-01", { title: "the ghost" }),
    });
    expect(lines(out)).toEqual(["· alpha confirmed low alpha title"]);
  });

  // Loud-failure doctrine, pointed at the caller rather than the file. An unreadable calendar has
  // already thrown by this point, so bare silence would be the one output a lane could read as
  // "the check ran and found nothing" when it meant "the check never ran".
  it("says a date is empty in words rather than printing nothing", () => {
    const { ok, out } = run(["--on-date=2026-07-04"], {
      "alpha.json": entry("alpha", "2026-05-01"),
    });
    expect([ok, lines(out)]).toEqual([true, []]);
    expect(out).toContain("No calendar entry on 2026-07-04");
  });

  it.each([
    ["a malformed value", ["--on-date=nope"]],
    ["an empty value", ["--on-date="]],
    // A bare `--on-date 2026-05-01` (space, not `=`) would otherwise fall through to the human
    // report, which a lane skimming for its own date would read as "nothing there".
    ["a value passed with a space instead of =", ["--on-date", "2026-05-01"]],
  ])("throws on %s rather than guessing", (_why, args) => {
    const { ok, out } = run(args, { "alpha.json": entry("alpha", "2026-05-01") });
    expect([ok, out]).toEqual([false, expect.stringContaining("--on-date must be YYYY-MM-DD")]);
  });

  // SAME-DATE ONLY IS A MEASUREMENT, NOT AN OVERSIGHT (#3361's open question: should the listing
  // also carry D±1, since an off-by-one re-slug evades a same-date check exactly as it evades
  // #3360's same-date scan?). Re-scoring #3360's title overlap at 0.45 over each date's D+1 cohort
  // across the 720 committed live events returns 14 cross-date pairs and NOT ONE is a re-slug:
  // nine are Treasury auctions (a different tenor every day of a settlement week), the rest
  // cpi×ppi, dallas-fed-mfg×dallas-fed-tssos, iea-omr×opec-momr. A neighbour cohort would put
  // three near-identical adjacent rows in front of every auction proposal, for 0/14 precision
  // against the single failure it exists to catch. FALSIFIER: the first confirmed same-release
  // re-slug whose two entries carry different dates — one such pair and this test should change.
  it("carries the date asked for and not its neighbours", () => {
    const { out } = run(["--on-date=2026-05-02"], {
      "day-before.json": entry("day-before", "2026-05-01"),
      "the-day.json": entry("the-day", "2026-05-02"),
      "day-after.json": entry("day-after", "2026-05-03"),
    });
    expect(lines(out)).toEqual(["· the-day confirmed low the-day title"]);
  });

  // A listing of what exists must not be able to fail on a config field it never reads. The human
  // report and `--due` deliberately DO fail closed there (#2946: an absent horizon must never read
  // as "no horizon"), so this pins the one branch that is upstream of that check on purpose.
  it("lists without a valid research horizon, where the human report refuses to run", () => {
    const files = { "alpha.json": entry("alpha", "2026-05-01") };
    const noHorizon = { ...CADENCE, horizon: undefined };
    expect(run(["--on-date=2026-05-01"], files, [], noHorizon).ok).toBe(true);
    const report = run([], files, [], noHorizon);
    expect([report.ok, report.out]).toEqual([
      false,
      expect.stringContaining("refusing to scan with no valid research horizon"),
    ]);
  });
});
