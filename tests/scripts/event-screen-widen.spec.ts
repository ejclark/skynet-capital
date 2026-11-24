import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  researchBranchIds,
  SCREEN_SUBJECT,
  screenLandedOn,
  widenedRows,
} from "../../scripts/event-screen-widen.mjs";

// One screen pass a day (#8202). Before this, the dispatch cap trimmed the due list to ~6 before
// the screen saw it, so the date flip's pulses landed as a chain of screen PRs (87 from 11-01 to
// 11-23, up to 12 in a day). These specs pin the widened pass and the daily hold, every read from
// a fixture: prices from a preloaded fetch stub, the due list, branch names and history from files.

const at = (iso: string) => Math.floor(Date.parse(iso) / 1000);
const screenLine = (iso: string) =>
  `${at(iso)}\t${SCREEN_SUBJECT} — 3 pulse(s), no session needed (#1)`;

describe("screenLandedOn — the daily hold's test", () => {
  it("is true for a screen commit that landed today, UTC", () => {
    expect(screenLandedOn(screenLine("2026-11-24T00:10:00Z"), "2026-11-24")).toBe(true);
  });

  it("is false for yesterday's screen, or a commit today that is not a screen", () => {
    const log = [
      screenLine("2026-11-23T23:59:59Z"),
      `${at("2026-11-24T01:00:00Z")}\tfeat(app): something else`,
      `${at("2026-11-24T02:00:00Z")}\tdocs(research): gdp pulse — quotes ${SCREEN_SUBJECT}`,
    ].join("\n");
    expect(screenLandedOn(log, "2026-11-24")).toBe(false);
  });

  it("reads the UTC day, not a local one", () => {
    // 23:30 on the 23rd in New York is 04:30Z on the 24th.
    expect(screenLandedOn(screenLine("2026-11-24T04:30:00Z"), "2026-11-24")).toBe(true);
  });

  it("is false on an empty or malformed log", () => {
    expect(screenLandedOn("", "2026-11-24")).toBe(false);
    expect(screenLandedOn(`not-a-number\t${SCREEN_SUBJECT}`, "2026-11-24")).toBe(false);
  });
});

describe("widenedRows — what the widened pass adds", () => {
  const due = [
    { id: "a", reason: "interval-elapsed" },
    { id: "b", reason: "interval-elapsed" },
    { id: "c", reason: "interval-elapsed" },
    { id: "d", reason: "never-assessed" },
    { id: "e", reason: "event-passed-unscored" },
  ];

  it("adds only interval pulses not handed in and with no research branch", () => {
    const rows = widenedRows([{ id: "a" }], due, new Set(["c"]));
    expect(rows).toEqual([{ id: "b", reason: "interval-elapsed" }]);
  });

  it("reads research branch ids from ls-remote output", () => {
    const out = "abc123\trefs/heads/research/nvda-2026-11-19-print\ndef\trefs/heads/main\n";
    expect([...researchBranchIds(out)]).toEqual(["nvda-2026-11-19-print"]);
  });
});

describe("event-material-scan --screen-due — one pass covers the whole due list", () => {
  const TODAY = "2026-11-02";
  // Symbols no conviction doc proposes against, so the real proposals folder decides nothing here.
  const SYMS = ["ZZQA", "ZZQB", "ZZQC", "ZZQD", "ZZQE"];
  const idOf = (sym: string) => `${sym.toLowerCase()}-2026-11-10-print`;
  const A = idOf("ZZQA");
  const B = idOf("ZZQB");
  const C = idOf("ZZQC");
  const D = idOf("ZZQD");
  const E = idOf("ZZQE");
  const CADENCE = {
    bands: {
      critical: [
        { minDaysOut: 21, intervalDays: 3 },
        { minDaysOut: 8, intervalDays: 2 },
        { minDaysOut: 0, intervalDays: 1 },
      ],
    },
  };
  const root = mkdtempSync(join(tmpdir(), "screen-widen-"));
  afterAll(() => rmSync(root, { recursive: true, force: true }));
  const eventsDir = join(root, "events");
  const intentsDir = join(root, "intents");
  mkdirSync(eventsDir);
  mkdirSync(intentsDir);
  writeFileSync(
    join(root, "calendar.ts"),
    `export const UPCOMING_PRINTS: readonly EarningsPrint[] = [\n${SYMS.map(
      (s) => `  { symbol: "${s}", date: "2026-11-10", status: "confirmed" },`,
    ).join("\n")}\n];\n`,
  );
  writeFileSync(join(root, "cadence.json"), JSON.stringify(CADENCE));
  // Every price is 100, except ZZQE, whose fetch fails. Each request is logged, one line per URL.
  const stub = join(root, "stub-fetch.mjs");
  const stamp = at("2026-10-30T13:30:00Z");
  writeFileSync(
    stub,
    [
      `import { appendFileSync } from "node:fs";`,
      `globalThis.fetch = async (url) => {`,
      `  appendFileSync(process.env.FETCH_LOG, decodeURIComponent(String(url)) + "\\n");`,
      `  if (String(url).includes("ZZQE")) return { ok: false, status: 503, statusText: "down" };`,
      `  return { ok: true, json: async () => ({ chart: { result: [{ timestamp: [${stamp}], indicators: { quote: [{ close: [100] }] }, meta: { gmtoffset: 0 } }] } }) };`,
      `};`,
      "",
    ].join("\n"),
  );

  /** A ledger last assessed 10-31 (due on the 2nd at a 2-day interval) whose probe-ref reads
   *  `price` for its symbol: 100 is quiet against the stub, 50 is a 100% move, material. */
  const ledger = (sym: string, price: number) => {
    // The five prints share a date, so each is adjacent to the other four: recorded here already,
    // so the corridor is old news and only a price can make a pulse material.
    const others = SYMS.filter((o) => o !== sym)
      .map(idOf)
      .sort();
    const ref = {
      symbols: { [sym]: price },
      vix: 100,
      daysBand: "critical:8+",
      adjacentIds: others,
      adjacentStrongIds: others,
      screenStreak: 0,
    };
    return [
      `# ${sym} print — ${idOf(sym)}`,
      "",
      "**Kind:** earnings · **Date:** 2026-11-10 (confirmed, IR: x) · **Impact:** critical",
      "**Last assessed:** 2026-10-31",
      `<!-- probe-ref: ${JSON.stringify(ref)} -->`,
      "",
      "## Assessment ledger",
      "",
      "| Date | Days out | New info / adjacency findings | Stance change | Next check due |",
      "|---|---|---|---|---|",
      "| 2026-10-31 | D-10 | Initial pulse. | — (stance set) | 2026-11-02 |",
      "",
    ].join("\n");
  };

  type Run = {
    status: number | null;
    stderr: string;
    out: {
      stillDue: { id: string; materialReasons?: string[] }[];
      screened: { id: string; widened?: boolean }[];
    };
    changed: (id: string) => boolean;
    after: (id: string) => string;
    fetches: string[];
  };

  /** One --screen-due pass. `input` is the capped list; the fixtures default to "B, C, D and E
   *  are also due, C has a research branch, nothing landed today". */
  const pass = (
    input: { id: string; reason: string }[],
    opts: { prices?: Record<string, number>; mainLog?: string; dueFile?: string | null } = {},
  ): Run => {
    const dir = mkdtempSync(join(root, "pass-"));
    const ledgerDir = join(dir, "ledgers");
    mkdirSync(ledgerDir);
    const before: Record<string, string> = {};
    for (const sym of SYMS) {
      const text = ledger(sym, opts.prices?.[sym] ?? 100);
      before[idOf(sym)] = text;
      writeFileSync(join(ledgerDir, `${idOf(sym)}.md`), text);
    }
    const due = [A, B, C, D, E].map((id) => ({ id, reason: "interval-elapsed" }));
    due.push({ id: "never-assessed-x", reason: "never-assessed" });
    writeFileSync(join(dir, "due.json"), JSON.stringify(due));
    writeFileSync(join(dir, "main.log"), opts.mainLog ?? "");
    writeFileSync(join(dir, "heads.txt"), `abc\trefs/heads/research/${C}\n`);
    const fetchLog = join(dir, "fetches.txt");
    writeFileSync(fetchLog, "");
    const env: NodeJS.ProcessEnv = { ...process.env, INTENTS_DIR: intentsDir, FETCH_LOG: fetchLog };
    delete env.HTTPS_PROXY;
    delete env.https_proxy;
    const dueFile = opts.dueFile === undefined ? join(dir, "due.json") : opts.dueFile;
    const res = spawnSync(
      "node",
      [
        "--import",
        stub,
        "scripts/event-material-scan.mjs",
        "--screen-due",
        `--today=${TODAY}`,
        `--ledger-dir=${ledgerDir}`,
        `--events-dir=${eventsDir}`,
        `--calendar-file=${join(root, "calendar.ts")}`,
        `--cadence-file=${join(root, "cadence.json")}`,
        ...(dueFile ? [`--due-file=${dueFile}`] : []),
        `--main-log-file=${join(dir, "main.log")}`,
        `--research-heads-file=${join(dir, "heads.txt")}`,
      ],
      { encoding: "utf8", env, input: JSON.stringify(input) },
    );
    return {
      status: res.status,
      stderr: res.stderr,
      out: res.status === 0 ? JSON.parse(res.stdout) : null,
      changed: (id) => readFileSync(join(ledgerDir, `${id}.md`), "utf8") !== before[id],
      after: (id) => readFileSync(join(ledgerDir, `${id}.md`), "utf8"),
      fetches: readFileSync(fetchLog, "utf8").split("\n").filter(Boolean),
    };
  };
  const ids = (rows: { id: string }[]) => rows.map((r) => r.id).sort();
  const capped = [{ id: A, reason: "interval-elapsed" }];

  it("screens every due interval pulse, not only the rows it was handed", () => {
    const run = pass(capped);
    expect(run.status).toBe(0);
    expect(ids(run.out.screened)).toEqual([A, B, D].sort());
    expect(run.out.screened.find((s) => s.id === B)?.widened).toBe(true);
    expect(run.out.screened.find((s) => s.id === A)?.widened).toBeUndefined();
    for (const id of [B, D]) expect(run.changed(id)).toBe(true);
  });

  it("writes the same deterministic-screen row a capped-list screen writes", () => {
    const run = pass(capped);
    const row = (id: string) =>
      run
        .after(id)
        .split("\n")
        .find((l) => l.includes("Deterministic screen"));
    expect(row(B)).toContain("**Deterministic screen (no Claude session).**");
    // The same row, word for word, but for the symbol it names.
    expect(row(B)?.replaceAll("ZZQB", "ZZQA")).toBe(row(A));
  });

  it("skips an event with a research branch on origin", () => {
    const run = pass(capped);
    expect(ids(run.out.screened)).not.toContain(C);
    expect(run.changed(C)).toBe(false);
  });

  it("leaves a widened row that reads material, or whose probe fails, out of stillDue", () => {
    const run = pass(capped, { prices: { ZZQB: 50 } });
    expect(run.status).toBe(0);
    // B moved 100%, E's fetch failed: both stay due for a later tick's capped list.
    expect(run.out.stillDue).toEqual([]);
    expect(run.changed(B)).toBe(false);
    expect(run.changed(E)).toBe(false);
    expect(run.stderr).toContain(`widened pulse ${B} not screened`);
    expect(run.stderr).toContain(`widened pulse ${E} not screened`);
  });

  it("still buys a session for an input row whose probe fails (loud failure holds)", () => {
    const run = pass([{ id: E, reason: "interval-elapsed" }]);
    expect(ids(run.out.stillDue)).toEqual([E]);
    expect(run.out.stillDue[0]?.materialReasons?.[0]).toMatch(/^probe-error:/);
  });

  it("stillDue never holds an event that was not in the input", () => {
    const input = [
      { id: A, reason: "interval-elapsed" },
      { id: "never-assessed-x", reason: "never-assessed" },
    ];
    const run = pass(input, { prices: { ZZQA: 50, ZZQB: 50, ZZQD: 50 } });
    const handedIn = new Set(input.map((r) => r.id));
    expect(run.out.stillDue.every((r) => handedIn.has(r.id))).toBe(true);
    expect(ids(run.out.stillDue)).toEqual([A, "never-assessed-x"].sort());
  });

  it("fetches each symbol, ^VIX included, at most once per pass", () => {
    const run = pass(capped);
    const vix = run.fetches.filter((u) => u.includes("/chart/^VIX"));
    expect(vix).toHaveLength(1);
    expect(new Set(run.fetches).size).toBe(run.fetches.length);
  });

  it("screens only the input rows once a screen has landed on main today", () => {
    const run = pass(capped, { mainLog: screenLine(`${TODAY}T00:20:00Z`) });
    expect(ids(run.out.screened)).toEqual([A]);
    expect(run.changed(B)).toBe(false);
    expect(run.stderr).toContain("a screen already landed on main today");
  });

  it("widens again when the only screen that landed was yesterday's", () => {
    const run = pass(capped, { mainLog: screenLine("2026-11-01T23:50:00Z") });
    expect(ids(run.out.screened)).toEqual([A, B, D].sort());
  });

  it("screens nothing and writes no ledger on an empty list", () => {
    const run = pass([]);
    expect(run.out).toEqual({ stillDue: [], screened: [] });
    for (const id of [A, B, C, D, E]) expect(run.changed(id)).toBe(false);
    expect(run.fetches).toEqual([]);
    expect(run.stderr).not.toContain("::warning::");
  });

  it("warns once and screens the input rows only when the widened read fails", () => {
    const run = pass(capped, { dueFile: join(root, "no-such-due.json") });
    expect(run.status).toBe(0);
    expect(ids(run.out.screened)).toEqual([A]);
    expect(run.stderr.match(/::warning::/g)).toHaveLength(1);
    expect(run.stderr).toContain("widened read failed");
  });
});

describe("open-screen-pr --check-open — one screen PR a day", () => {
  const dir = mkdtempSync(join(tmpdir(), "check-open-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  /** No token, so the REST check cannot run: "open" can only come from the daily hold. */
  const check = (log: string) => {
    const file = join(dir, `main-${Math.random().toString(36).slice(2)}.log`);
    writeFileSync(file, log);
    const env: NodeJS.ProcessEnv = { ...process.env };
    delete env.GH_TOKEN;
    delete env.GITHUB_TOKEN;
    const res = spawnSync(
      "node",
      [
        "scripts/moneypenny/open-screen-pr.mjs",
        "--check-open",
        "--today=2026-11-24",
        `--main-log-file=${file}`,
      ],
      { encoding: "utf8", env },
    );
    return { status: res.status, out: res.stdout.trim(), stderr: res.stderr };
  };

  it("prints open, with no REST read, when a screen landed on main today", () => {
    const run = check(screenLine("2026-11-24T00:15:00Z"));
    expect(run.status).toBe(0);
    expect(run.out).toBe("open");
    expect(run.stderr).toContain("holding this one for tomorrow");
  });

  it("falls through to the PR check when today has no screen yet", () => {
    expect(check(screenLine("2026-11-23T00:15:00Z")).out).toBe("closed");
  });

  it("falls through to the PR check, with a warning, when the history read fails", () => {
    const env: NodeJS.ProcessEnv = { ...process.env };
    delete env.GH_TOKEN;
    delete env.GITHUB_TOKEN;
    const res = spawnSync(
      "node",
      [
        "scripts/moneypenny/open-screen-pr.mjs",
        "--check-open",
        "--today=2026-11-24",
        `--main-log-file=${join(dir, "missing.log")}`,
      ],
      { encoding: "utf8", env },
    );
    expect(res.stdout.trim()).toBe("closed");
    expect(res.stderr).toContain("history read failed");
  });
});

describe("the protocol says what the screen does", () => {
  it("names one pass over every due pulse and one screen PR a day", () => {
    const protocol = readFileSync("docs/process/EVENT-RESEARCH.md", "utf8");
    expect(protocol).toContain("every due `interval-elapsed` pulse");
    expect(protocol).toContain("at most one screen PR lands per UTC day");
  });
});
