import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadMarketEvents } from "../../src/domain/market-events-data.js";

// RETIRING A RE-SLUG (#3101). Two lanes sweeping adjacencies can each discover the same release
// and file it under a different slug; `loadMarketEvents` keys a Map by id, so both load, both get
// researched on their own cadence, and both buy their own close-out. Four duplicate pairs and one
// triplet survived every check we had. `supersededBy` is the enforced half of the fix — the
// duplicate's OWN lane marks its OWN file, the loader drops it, and the file, its ledger and its
// forward-test fragment stay on disk as the record (RFC 5545's mark-don't-delete). The advisory
// same-date title-overlap warning is the detect half, covered at the bottom.
//
// Everything here is static: no network, no session, no token.

const entry = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id,
  kind: "macro-print",
  title: id,
  date,
  status: "estimate",
  source: "EST: fixture",
  impact: "low",
  symbols: [],
  ...extra,
});

/** A fixture calendar directory + forward-test register, run through the real `--validate` CLI.
 *  `files` maps file name (`proposals/…` allowed) → entry; `fragments` maps event id → the
 *  forward-test markdown that id registered. Returns the CLI's combined output and exit status so
 *  a spec can assert on an advisory `⚠` line as readily as on a `✗` refusal. */
function validateFixture(
  files: Record<string, object>,
  fragments: Record<string, string> = {},
): { ok: boolean; out: string } {
  const dir = mkdtempSync(join(tmpdir(), "event-supersedes-"));
  try {
    mkdirSync(join(dir, "events", "proposals"), { recursive: true });
    mkdirSync(join(dir, "forward-tests"), { recursive: true });
    for (const [name, event] of Object.entries(files))
      writeFileSync(join(dir, "events", name), `${JSON.stringify(event, null, 2)}\n`);
    for (const [id, md] of Object.entries(fragments))
      writeFileSync(join(dir, "forward-tests", `${id}.md`), md);
    writeFileSync(
      join(dir, "earnings-calendar.ts"),
      "export const UPCOMING_PRINTS: readonly EarningsPrint[] = [];\n",
    );
    const run = spawnSync(
      "node",
      [
        "scripts/event-scan.mjs",
        "--validate",
        `--events-dir=${join(dir, "events")}`,
        `--calendar-file=${join(dir, "earnings-calendar.ts")}`,
        `--ledger-dir=${join(dir, "no-ledgers")}`,
        `--forward-tests-dir=${join(dir, "forward-tests")}`,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    return { ok: run.status === 0, out: `${run.stdout}${run.stderr}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** A calendar directory on disk, for the loader-side specs. */
function fixtureDir(files: Record<string, object>): string {
  const dir = mkdtempSync(join(tmpdir(), "market-events-superseded-"));
  mkdirSync(join(dir, "proposals"), { recursive: true });
  for (const [name, event] of Object.entries(files))
    writeFileSync(join(dir, name), JSON.stringify(event, null, 2));
  return dir;
}

/** One forward-test fragment row; an empty `outcome` cell is the register's "not scored yet". */
const fragment = (rows: [id: string, scoreBy: string, outcome: string][]) =>
  `| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |\n|---|---|---|---|---|---|\n${rows
    .map(([id, scoreBy, outcome]) => `| ${id} | h | p | k | ${scoreBy} | ${outcome} |`)
    .join("\n")}\n`;

describe("supersededBy — the loader", () => {
  it("drops a retired re-slug from the calendar and leaves everything else alone", () => {
    const dir = fixtureDir({
      "survivor.json": entry("survivor", "2026-05-01", { status: "confirmed", source: "BEA: x" }),
      "reslug.json": entry("reslug", "2026-05-01", { supersededBy: "survivor" }),
      "unrelated.json": entry("unrelated", "2026-06-01"),
    });
    try {
      expect(loadMarketEvents(dir).map((e) => e.id)).toEqual(["survivor", "unrelated"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The filter runs AFTER the id dedupe, never before. If it ran first, retiring a canonical file
  // would un-shadow any proposal sharing its id and quietly resurrect the very event the lane just
  // retired — under a proposal's title, which nobody has looked at since it was swept up.
  it("never resurrects a retired id through the proposal it was shadowing", () => {
    const dir = fixtureDir({
      "survivor.json": entry("survivor", "2026-05-01", { status: "confirmed", source: "BEA: x" }),
      "reslug.json": entry("reslug", "2026-05-01", { supersededBy: "survivor" }),
      "proposals/reslug.from-survivor.json": entry("reslug", "2026-05-01", { title: "the ghost" }),
    });
    try {
      expect(loadMarketEvents(dir).map((e) => e.id)).toEqual(["survivor"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses a supersededBy that is not a string", () => {
    const dir = fixtureDir({ "reslug.json": entry("reslug", "2026-05-01", { supersededBy: 7 }) });
    try {
      expect(() => loadMarketEvents(dir)).toThrow(/supersededBy must be a non-empty event id/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // THE DRIFT GATE, on the new branch. tests/arch/event-scan.spec.ts pins the scanner's read to the
  // loader's on the COMMITTED calendar — which carries no superseded entry yet, so it would go on
  // passing if only one of the two readers learned this rule. Both are exercised on one fixture.
  it("the scanner's read drops exactly what the loader drops", () => {
    const dir = fixtureDir({
      "survivor.json": entry("survivor", "2026-05-01", { status: "confirmed", source: "BEA: x" }),
      "reslug.json": entry("reslug", "2026-05-01", { supersededBy: "survivor" }),
    });
    const calendar = join(dir, "earnings-calendar.ts");
    writeFileSync(calendar, "export const UPCOMING_PRINTS: readonly EarningsPrint[] = [];\n");
    try {
      const dumped = JSON.parse(
        execFileSync(
          "node",
          [
            "scripts/event-scan.mjs",
            "--dump",
            `--events-dir=${dir}`,
            `--calendar-file=${calendar}`,
          ],
          { cwd: process.cwd(), encoding: "utf8" },
        ),
      );
      expect(dumped.curated).toEqual(JSON.parse(JSON.stringify(loadMarketEvents(dir))));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("supersededBy — the --validate contract", () => {
  const survivor = entry("survivor", "2026-05-01", { status: "confirmed", source: "BEA: x" });

  it("accepts a same-date estimate retiring itself in favour of a canonical survivor", () => {
    const { ok, out } = validateFixture({
      "survivor.json": survivor,
      "reslug.json": entry("reslug", "2026-05-01", { supersededBy: "survivor" }),
    });
    expect([ok, out]).toEqual([true, expect.stringContaining("1 superseded, not loaded")]);
  });

  // Every rule below turns a typo into a red build. Without them `supersededBy` is the one field
  // that can delete an event from the calendar silently — which is strictly worse than the
  // duplicate it exists to retire.
  it.each([
    [
      "an unknown survivor",
      { "reslug.json": entry("reslug", "2026-05-01", { supersededBy: "nobody" }) },
      /supersededBy "nobody" is not a canonical/,
    ],
    [
      "a survivor that is only a proposal",
      {
        "survivor.json": survivor,
        "reslug.json": entry("reslug", "2026-05-01", { supersededBy: "sketch" }),
        "proposals/sketch.from-survivor.json": entry("sketch", "2026-05-01"),
      },
      /supersededBy "sketch" is not a canonical/,
    ],
    [
      "a survivor on another date",
      {
        "survivor.json": survivor,
        "reslug.json": entry("reslug", "2026-07-09", { supersededBy: "survivor" }),
      },
      /is dated 2026-05-01 — a re-slug names the SAME release/,
    ],
    [
      "a chain",
      {
        "survivor.json": survivor,
        "middle.json": entry("middle", "2026-05-01", { supersededBy: "survivor" }),
        "reslug.json": entry("reslug", "2026-05-01", { supersededBy: "middle" }),
      },
      /is itself superseded — point at the surviving id \("survivor"\)/,
    ],
    [
      "an entry pointing at itself",
      { "reslug.json": entry("reslug", "2026-05-01", { supersededBy: "reslug" }) },
      /supersededBy cannot point at itself/,
    ],
    [
      "a confirmed entry retiring itself",
      {
        "survivor.json": survivor,
        "reslug.json": entry("reslug", "2026-05-01", {
          status: "confirmed",
          source: "BEA: x",
          supersededBy: "survivor",
        }),
      },
      /always status "estimate" — the survivor owns the confirming flip/,
    ],
  ])("refuses %s", (_why, files, expected) => {
    const { ok, out } = validateFixture(files);
    expect([ok, out]).toEqual([false, expect.stringMatching(expected)]);
  });

  // THE SHARP ONE. A superseded id never reaches close-out, and the close-out is what scores an
  // event's registered predictions — so a live forward test on a retired id would be scored by
  // nobody, ever. The real case is FT-bea-international-transactions-q2-2026-09-24-3, which scores
  // 2026-10-15: retiring that id first would strand it, and a kill caused BY this fix is a
  // different fact from a kill caused by the duplicate never existing.
  it("refuses to retire an id that still has an unscored forward test, and names it", () => {
    const files = {
      "survivor.json": survivor,
      "reslug.json": entry("reslug", "2026-05-01", { supersededBy: "survivor" }),
    };
    const open = fragment([["FT-reslug-2026-05-01-1", "2026-10-15", "_open_"]]);
    const refused = validateFixture(files, { reslug: open });
    expect([refused.ok, refused.out]).toEqual([
      false,
      expect.stringContaining("1 unscored forward test(s) (FT-reslug-2026-05-01-1)"),
    ]);
    // Scored — including scored as killed by this very fix — and the retirement goes through.
    const scored = fragment([
      ["FT-reslug-2026-05-01-1", "2026-10-15", "**kill** — retired as a duplicate, 2026-09-20"],
    ]);
    expect(validateFixture(files, { reslug: scored }).ok).toBe(true);
  });
});

describe("same-date title overlap — the advisory half", () => {
  const bea = (id: string, title: string, extra: Record<string, unknown> = {}) =>
    entry(id, "2026-09-24", { title, ...extra });
  const SURVIVOR =
    "U.S. International Transactions and Investment Position, Q2 2026 (current account + NIIP), 8:30 a.m. ET";
  const RESLUG =
    "U.S. International Transactions and Investment Position, Q2 2026 (current account), 8:30 a.m. ET";

  it("warns on a same-date near-title-match without failing the build", () => {
    const { ok, out } = validateFixture({
      "intl-transactions.json": bea("intl-transactions", SURVIVOR),
      "bea-intl-transactions.json": bea("bea-intl-transactions", RESLUG),
    });
    expect(ok).toBe(true);
    expect(out).toMatch(/⚠ 2026-09-24: "bea-intl-transactions" and "intl-transactions" share \d+%/);
  });

  // THE MEASURED FAILURE that motivated the whole issue: the pre-`supersededBy` convention was an
  // all-caps "DUPLICATE of …" tail appended to the re-slug's own title, which grew it from 6
  // identifying tokens to 14 and dropped a 0.857 pair to 0.400 — recording a duplicate removed it
  // from the census of duplicates. The annotation is stripped before scoring, so it cannot.
  it("still sees a pair whose title carries the old DUPLICATE annotation", () => {
    const { out } = validateFixture({
      "intl-transactions.json": bea("intl-transactions", SURVIVOR),
      "bea-intl-transactions.json": bea(
        "bea-intl-transactions",
        `${RESLUG} — DUPLICATE of intl-transactions, same BEA release; that slug is the survivor`,
      ),
    });
    expect(out).toMatch(/⚠ 2026-09-24: "bea-intl-transactions" and "intl-transactions" share 86%/);
  });

  it("says nothing once the re-slug is actually retired — the fix drains its own warning", () => {
    const { ok, out } = validateFixture({
      "intl-transactions.json": bea("intl-transactions", SURVIVOR, {
        status: "confirmed",
        source: "BEA: x",
      }),
      "bea-intl-transactions.json": bea("bea-intl-transactions", RESLUG, {
        supersededBy: "intl-transactions",
      }),
    });
    expect([ok, out.includes("share")]).toEqual([true, false]);
  });

  it("never pairs across dates, and leaves genuinely different releases alone", () => {
    const { out } = validateFixture({
      // Same words, different days: two editions of one recurring release are not a duplicate.
      "intl-transactions.json": bea("intl-transactions", SURVIVOR),
      "intl-transactions-q3.json": entry("intl-transactions-q3", "2026-12-18", {
        title: SURVIVOR,
      }),
      // Same day, same subject, different publishers — the false positive the threshold is set to
      // stay clear of (measured 0.41 on the committed ISM/S&P and Empire/Philly rows).
      "empire-state-mfg.json": entry("empire-state-mfg", "2026-10-15", {
        title:
          "Empire State Manufacturing Survey, October 2026 — the first regional Fed prices-paid read of the month",
      }),
      "philly-fed-mfg.json": entry("philly-fed-mfg", "2026-10-15", {
        title:
          "Philadelphia Fed Manufacturing Business Outlook Survey, October 2026 — the second regional Fed prices-paid read, published the same minute as the first",
      }),
    });
    expect(out).not.toMatch(/share \d+% of their title words/);
  });
});
