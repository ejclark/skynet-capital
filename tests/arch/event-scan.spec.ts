import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { UPCOMING_PRINTS } from "../../src/domain/earnings-calendar.js";
import { earningsAsEvents, MARKET_EVENTS } from "../../src/domain/market-events.js";
import { loadMarketEvents } from "../../src/domain/market-events-data.js";

const entry = (id: string, date: string) => ({
  id,
  kind: "macro-print",
  title: id,
  date,
  status: "confirmed",
  source: "BLS: fixture",
  impact: "low",
  symbols: [],
});

/** A fixture events DIRECTORY (one JSON file per event, issue #1449) + a calendar and ledger dir,
 *  validated through the real CLI. `files` maps file name → entry, so a spec can put an entry
 *  under the wrong name on purpose. `prints` seeds earnings-calendar.ts, whose rows become DERIVED
 *  events that exist without any file in the directory — the case the proposal depth cap has to
 *  treat as established. */
function validateFixture(
  files: Record<string, object>,
  prints: readonly { symbol: string; date: string; status: string; source: string }[] = [],
): string {
  const dir = mkdtempSync(join(tmpdir(), "event-scan-"));
  try {
    mkdirSync(join(dir, "events", "proposals"), { recursive: true });
    for (const [name, event] of Object.entries(files))
      writeFileSync(join(dir, "events", name), `${JSON.stringify(event, null, 2)}\n`);
    writeFileSync(
      join(dir, "earnings-calendar.ts"),
      `export const UPCOMING_PRINTS: readonly EarningsPrint[] = ${JSON.stringify(prints)};\n`,
    );
    return execFileSync(
      "node",
      [
        "scripts/event-scan.mjs",
        "--validate",
        `--events-dir=${join(dir, "events")}`,
        `--calendar-file=${join(dir, "earnings-calendar.ts")}`,
        `--ledger-dir=${join(dir, "no-ledgers")}`,
      ],
      { cwd: process.cwd(), encoding: "utf8", stdio: "pipe" },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** A fixture calendar + ledger + forward-test register, read through the real CLI's `--due` mode
 *  on a pinned date. `ledgers` maps event id → ledger markdown, `fragments` maps event id →
 *  forward-test fragment markdown; omitting either models an event that has neither. */
function dueFixture(
  today: string,
  events: Record<string, object>,
  ledgers: Record<string, string> = {},
  fragments: Record<string, string> = {},
): { id: string; reason: string; forwardTestsBeyondWindow?: { id: string; scoreBy: string }[] }[] {
  const dir = mkdtempSync(join(tmpdir(), "event-scan-due-"));
  try {
    for (const sub of ["events/proposals", "ledgers", "forward-tests"])
      mkdirSync(join(dir, sub), { recursive: true });
    for (const [id, event] of Object.entries(events))
      writeFileSync(join(dir, "events", `${id}.json`), JSON.stringify(event, null, 2));
    for (const [id, md] of Object.entries(ledgers))
      writeFileSync(join(dir, "ledgers", `${id}.md`), md);
    for (const [id, md] of Object.entries(fragments))
      writeFileSync(join(dir, "forward-tests", `${id}.md`), md);
    writeFileSync(
      join(dir, "earnings-calendar.ts"),
      "export const UPCOMING_PRINTS: readonly EarningsPrint[] = [];\n",
    );
    return JSON.parse(
      execFileSync(
        "node",
        [
          "scripts/event-scan.mjs",
          "--due",
          `--today=${today}`,
          `--events-dir=${join(dir, "events")}`,
          `--calendar-file=${join(dir, "earnings-calendar.ts")}`,
          `--ledger-dir=${join(dir, "ledgers")}`,
          `--forward-tests-dir=${join(dir, "forward-tests")}`,
        ],
        { cwd: process.cwd(), encoding: "utf8", stdio: "pipe" },
      ),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** An un-closed-out ledger: the `**Last assessed:**` line the scanner contracts on, no `## Outcome`. */
const openLedger = (assessed: string) => `# fixture\n\n**Last assessed:** ${assessed}\n`;

/** One forward-test fragment row. `outcome` empty = unscored. */
const fragment = (rows: [id: string, scoreBy: string, outcome: string][]) =>
  `| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |\n|---|---|---|---|---|---|\n${rows
    .map(([id, scoreBy, outcome]) => `| ${id} | h | p | k | ${scoreBy} | ${outcome} |`)
    .join("\n")}\n`;

// THE FORWARD-TEST HOLD (#2988). A close-out is dispatched from D+1 and is never screened, but its
// contract is to score its own registered predictions from settled data — so a test whose score-by
// is later than D+1 makes every dispatch until that date a session that can only re-read state and
// leave. Measured on gastech-2026-09-14: three dispatches in 38 minutes, no new information
// available to any of them. The wait is clamped to closeOutWithinDays, because a close-out that
// ages out of its window is lost permanently (withinHorizon's note) — a wrong hold is far worse
// than a wrong dispatch, so every ambiguity here has to resolve toward dispatching.
describe("event-scan close-out hold", () => {
  const passed = { ...entry("alpha", "2026-09-14"), impact: "low" };
  const ledgers = { alpha: openLedger("2026-09-15") };

  it("holds the close-out until its own unscored test is scoreable, then dispatches", () => {
    const frag = { alpha: fragment([["FT-alpha-2026-09-14-1", "2026-09-18", "_open_"]]) };
    expect(dueFixture("2026-09-15", { alpha: passed }, ledgers, frag)).toEqual([]);
    expect(dueFixture("2026-09-17", { alpha: passed }, ledgers, frag)).toEqual([]);
    // 09-18 is the score-by itself: the window has closed, so the session can finally score it.
    expect(dueFixture("2026-09-18", { alpha: passed }, ledgers, frag).map((e) => e.reason)).toEqual(
      ["event-passed-unscored"],
    );
  });

  it("never holds past closeOutWithinDays — it names the test and dispatches instead", () => {
    // Score-by 2026-09-25 is D+11, past the 6-day close-out ceiling: waiting would destroy the
    // outcome record rather than delay it, so the session goes out now and is told why.
    const due = dueFixture("2026-09-15", { alpha: passed }, ledgers, {
      alpha: fragment([["FT-alpha-2026-09-14-1", "2026-09-25", "_open_"]]),
    });
    expect(due).toEqual([
      expect.objectContaining({
        id: "alpha",
        reason: "event-passed-unscored",
        forwardTestsBeyondWindow: [{ id: "FT-alpha-2026-09-14-1", scoreBy: "2026-09-25" }],
      }),
    ]);
  });

  it("dispatches exactly as before when there is nothing scoreable to wait for", () => {
    const cases: Record<string, string> = {
      "no fragment at all": "",
      "every row already scored": fragment([
        ["FT-alpha-2026-09-14-1", "2026-09-18", "**pass** — scored 2026-09-15"],
      ]),
      "score-by already past": fragment([["FT-alpha-2026-09-14-1", "2026-09-14", "_open_"]]),
      "no readable score-by": fragment([["FT-alpha-2026-09-14-1", "when it settles", "_open_"]]),
    };
    for (const [why, frag] of Object.entries(cases))
      expect([
        why,
        dueFixture("2026-09-15", { alpha: passed }, ledgers, frag ? { alpha: frag } : {}).map(
          (e) => e.reason,
        ),
      ]).toEqual([why, ["event-passed-unscored"]]);
  });

  it("reads the register's real row shapes — escaped pipes, date-led cells, trailing qualifiers", () => {
    // Every one of these appears in the committed register (measured 2026-09-15 over 1,700 rows):
    // `\|` inside a cell, a prediction cell that itself starts with a date, a score-by carrying an
    // `(est.)` qualifier, and rows of 5 and 8 cells against a 6-column header. Header-index
    // mapping breaks on all of it; "the last cell that starts with a date" survives it.
    const md =
      `| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |\n|---|---|---|---|---|---|\n` +
      `| FT-alpha-2026-09-14-1 | median \\|move\\| 1.95% | 2026-09-14 prints below p75 | k | 2026-09-18 (est.) | — |\n` +
      `| FT-alpha-2026-09-14-2 | h | p | k | 2026-09-16 |\n` +
      `| FT-alpha-2026-09-14-3 | h | c2c | extra | cell | k | 2026-09-14 | _open_ |\n`;
    expect(dueFixture("2026-09-15", { alpha: passed }, ledgers, { alpha: md })).toEqual([]);
    // Row 1 (em-dash outcome, qualified date) and row 2 (no outcome cell) both still pend at
    // 09-16; row 3's score-by is already past, so it never held anything.
    expect(dueFixture("2026-09-17", { alpha: passed }, ledgers, { alpha: md })).toEqual([]);
    expect(
      dueFixture("2026-09-18", { alpha: passed }, ledgers, { alpha: md }).map((e) => e.reason),
    ).toEqual(["event-passed-unscored"]);
  });

  it("leaves an already-closed-out event and an upcoming event untouched", () => {
    const frag = { alpha: fragment([["FT-alpha-2026-09-14-1", "2026-09-18", "_open_"]]) };
    // A ledger with `## Outcome` is silent forever — the hold must not resurrect it.
    expect(
      dueFixture(
        "2026-09-15",
        { alpha: passed },
        { alpha: `${openLedger("2026-09-15")}\n## Outcome\n\nscored.\n` },
        frag,
      ),
    ).toEqual([]);
    // An event that has not happened yet routes on cadence, never through the close-out branch.
    expect(
      dueFixture("2026-09-13", { alpha: passed }, { alpha: openLedger("2026-09-01") }, frag).map(
        (e) => e.reason,
      ),
    ).toEqual(["interval-elapsed"]);
  });
});

// Event-calendar contract gate — the committed calendar (src/domain/market-events/*.json +
// earnings-calendar.ts) and every assessment ledger (docs/research/events/) must satisfy the
// contract scripts/event-scan.mjs enforces, because the event lane acts on its word. Static
// analysis — no network, no session, no test recursion.
describe("event-scan contract", () => {
  it("the committed calendar and ledgers satisfy the contract", () => {
    expect(() =>
      execFileSync("node", ["scripts/event-scan.mjs", "--validate"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });

  // THE PLACEMENT GATE (#1449): one file per event, named by its id. That is the whole reason
  // concurrent research PRs stopped conflicting — a lane can only write the file its own event id
  // names — so a file whose name disagrees with its id has to go red and say which name is right.
  it("--validate rejects a file whose name is not its id and names the fix", () => {
    expect(() =>
      validateFixture({
        "alpha.json": entry("alpha", "2026-01-01"),
        "bravo.json": entry("charlie", "2026-02-01"),
      }),
    ).toThrow(/bravo\.json: file name must equal its id — rename it to "charlie\.json"/);
  });

  it("--validate accepts one well-named file per event, in any directory order", () => {
    expect(() =>
      validateFixture({
        "charlie.json": entry("charlie", "2026-02-01"),
        "alpha.json": entry("alpha", "2026-01-01"),
        "bravo.json": entry("bravo", "2026-02-01"),
      }),
    ).not.toThrow();
  });

  // PROPOSALS (#1717): the add/add the split left behind — two sweeps proposing the same event —
  // is gone once the proposer owns the file. The read-side rule must hold in both readers.
  it("--validate rejects a misnamed, non-estimate, or orphan-proposer proposal and names each", () => {
    const proposal = (id: string, status = "estimate") => ({
      ...entry(id, "2026-05-01"),
      status,
      source: status === "estimate" ? "EST: fixture" : "BLS: fixture",
    });
    expect(() =>
      validateFixture({
        "alpha.json": entry("alpha", "2026-01-01"),
        "proposals/bravo.from-alpha.json": proposal("bravo"),
      }),
    ).not.toThrow();
    expect(() =>
      validateFixture({
        "alpha.json": entry("alpha", "2026-01-01"),
        "proposals/bravo.json": proposal("bravo"),
      }),
    ).toThrow(/proposals\/bravo\.json: a proposal is named <id>\.from-<proposer-event-id>\.json/);
    expect(() =>
      validateFixture({
        "alpha.json": entry("alpha", "2026-01-01"),
        "proposals/bravo.from-alpha.json": proposal("bravo", "confirmed"),
      }),
    ).toThrow(/always status "estimate"/);
    expect(() =>
      validateFixture({
        "alpha.json": entry("alpha", "2026-01-01"),
        "proposals/bravo.from-zulu.json": proposal("bravo"),
      }),
    ).toThrow(/proposer "zulu" is not an event this calendar knows/);
  });

  // THE PROPOSAL DEPTH CAP (#2946). A proposal loads as a real event, so it becomes
  // never-assessed, buys its own opus session, and that session's adjacency sweep writes more
  // proposals — the loop that took the calendar to 641 canonical + 469 pending in two days and
  // spent a weekly token quota in ~24 hours. Requiring the proposer to be CANONICAL means each
  // generation must be paid for by real research before it can produce the next.
  it("--validate caps discovery at one generation — a proposal cannot parent another", () => {
    const proposal = (id: string) => ({
      ...entry(id, "2026-05-01"),
      status: "estimate",
      source: "EST: fixture",
    });
    // bravo exists only as a proposal, so charlie is a second generation — refused.
    expect(() =>
      validateFixture({
        "alpha.json": entry("alpha", "2026-01-01"),
        "proposals/bravo.from-alpha.json": proposal("bravo"),
        "proposals/charlie.from-bravo.json": proposal("charlie"),
      }),
    ).toThrow(/proposer "bravo" is itself only a proposal — discovery is capped at ONE generation/);

    // Once bravo has been researched into its canonical file, it may propose — the cycle is
    // broken by requiring real work between generations, not by forbidding depth outright.
    expect(() =>
      validateFixture({
        "alpha.json": entry("alpha", "2026-01-01"),
        "bravo.json": entry("bravo", "2026-05-01"),
        "proposals/charlie.from-bravo.json": proposal("charlie"),
      }),
    ).not.toThrow();

    // A shadowed proposal never loads, so the rule must not fire on it.
    expect(() =>
      validateFixture({
        "alpha.json": entry("alpha", "2026-01-01"),
        "bravo.json": entry("bravo", "2026-05-01"),
        "charlie.json": entry("charlie", "2026-05-01"),
        "proposals/bravo.from-alpha.json": proposal("bravo"),
        "proposals/charlie.from-bravo.json": proposal("charlie"),
      }),
    ).not.toThrow();
  });

  // THE DOCKET SLOT (#3058). Thirteen of thirteen court- and regulatory-sourced entries sat at
  // `estimate` with the court's own signed, checksummed order in hand, because the trusted-prefix
  // table had no slot for a federal court's filed document. `ECF:` is that slot; the error message
  // is read back off the regex so the two can never disagree again.
  it("--validate accepts ECF: as a trusted prefix, and names the real list when one is missing", () => {
    expect(() =>
      validateFixture({
        "docket.json": {
          ...entry("docket", "2026-10-02"),
          source: "ECF: storage.courtlistener.com/recap/… HTTP 200, 97,430 bytes, md5 ce42291a…",
        },
      }),
    ).not.toThrow();

    expect(() =>
      validateFixture({
        "docket.json": { ...entry("docket", "2026-10-02"), source: "PACER: a login-gated docket" },
      }),
    ).toThrow(/confirmed but source lacks a trusted prefix \(.*\/FHFA\/FRB\/ECF\)/);
  });

  // A DERIVED earnings print is established by earnings-calendar.ts and has no file in the events
  // directory, so a naive "proposer must be a canonical FILE" depth cap rejects anything a print
  // proposes — and the rejection is unfixable, because writing `<print-id>.json` by hand is itself
  // refused by the "earnings are derived" rule. Three print-parented proposals exist in the real
  // calendar today and pass only because all three happen to be shadowed.
  it("--validate lets a derived earnings print parent a proposal — it is established, not speculative", () => {
    const print = {
      symbol: "GOOG",
      date: "2026-10-28",
      status: "confirmed",
      source: "IR: fixture",
    };
    expect(() =>
      validateFixture(
        {
          "proposals/adtech-ruling-2026-10-02.from-goog-2026-10-28-print.json": {
            ...entry("adtech-ruling-2026-10-02", "2026-10-02"),
            status: "estimate",
            source: "EST: fixture",
          },
        },
        [print],
      ),
    ).not.toThrow();
  });

  it("the loader prefers the canonical file, else the first proposal by name, and rejects a bad proposal", () => {
    const dir = mkdtempSync(join(tmpdir(), "market-events-"));
    try {
      mkdirSync(join(dir, "proposals"));
      writeFileSync(join(dir, "alpha.json"), JSON.stringify(entry("alpha", "2026-01-01")));
      const proposal = (id: string, title: string) => ({
        ...entry(id, "2026-05-01"),
        title,
        status: "estimate",
        source: "EST: fixture",
      });
      writeFileSync(
        join(dir, "proposals", "alpha.from-bravo.json"),
        JSON.stringify(proposal("alpha", "shadowed")),
      );
      writeFileSync(
        join(dir, "proposals", "charlie.from-bravo.json"),
        JSON.stringify(proposal("charlie", "second")),
      );
      writeFileSync(
        join(dir, "proposals", "charlie.from-alpha.json"),
        JSON.stringify(proposal("charlie", "first")),
      );
      const loaded = loadMarketEvents(dir);
      expect(loaded.map((e) => e.id)).toEqual(["alpha", "charlie"]);
      expect(loaded.find((e) => e.id === "alpha")?.title).toBe("alpha");
      expect(loaded.find((e) => e.id === "charlie")?.title).toBe("first");
      writeFileSync(
        join(dir, "proposals", "delta.from-alpha.json"),
        JSON.stringify(entry("delta", "2026-06-01")),
      );
      expect(() => loadMarketEvents(dir)).toThrow(
        /proposals\/delta\.from-alpha\.json: a proposal is always status "estimate"/,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("the loader sorts the directory into (date, id) order and rejects a misnamed file loudly", () => {
    const dir = mkdtempSync(join(tmpdir(), "market-events-"));
    try {
      writeFileSync(join(dir, "charlie.json"), JSON.stringify(entry("charlie", "2026-02-01")));
      writeFileSync(join(dir, "alpha.json"), JSON.stringify(entry("alpha", "2026-03-01")));
      writeFileSync(join(dir, "bravo.json"), JSON.stringify(entry("bravo", "2026-02-01")));
      expect(loadMarketEvents(dir).map((e) => e.id)).toEqual(["bravo", "charlie", "alpha"]);
      writeFileSync(join(dir, "delta.json"), JSON.stringify(entry("echo", "2026-04-01")));
      expect(() => loadMarketEvents(dir)).toThrow(/delta\.json: id "echo" does not match/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The Routine and the detect workflow both read this one output. If its shape drifts, the
  // pickup silently stops working — exactly the failure a scheduled job hides best.
  it("--due emits the JSON shape both pickup layers consume", () => {
    const out = execFileSync("node", ["scripts/event-scan.mjs", "--due"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    const due = JSON.parse(out);
    expect(Array.isArray(due)).toBe(true);
    for (const event of due) {
      expect(event).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          kind: expect.any(String),
          title: expect.any(String),
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          status: expect.any(String),
          impact: expect.any(String),
          symbols: expect.any(Array),
          daysUntil: expect.any(Number),
          reason: expect.any(String),
          ledger: expect.any(String),
        }),
      );
    }
  });

  // THE DRIFT GATE: the scanner reads the calendar directory and the earnings TS table itself (it
  // must run without `npm ci`), which only stays honest while its read and the real modules agree.
  // If anyone reshapes either so the reads diverge, this goes red the same day.
  it("the scanner's read matches the real module exports byte for byte", () => {
    const out = execFileSync("node", ["scripts/event-scan.mjs", "--dump"], {
      cwd: process.cwd(),
      encoding: "utf8",
      // The dump grows with every event added, and its source/notes fields are long by design
      // (they carry the audit trail). It crossed Node's DEFAULT 1 MiB execFileSync buffer on
      // 2026-09-06 at 344 events — origin/main was 1,039,149 bytes, ~9 KB of headroom, and the
      // next research PR to merge spent it, failing as `spawnSync node ENOBUFS` rather than as
      // anything about the calendar. 64 MiB is ~60x today's size: the gate stays a gate, and it
      // fails on real drift instead of on the calendar's own growth.
      maxBuffer: 64 * 1024 * 1024,
    });
    const dumped = JSON.parse(out);
    expect(dumped.curated).toEqual(JSON.parse(JSON.stringify(MARKET_EVENTS)));
    expect(dumped.derived).toEqual(JSON.parse(JSON.stringify(earningsAsEvents(UPCOMING_PRINTS))));
  });
});
