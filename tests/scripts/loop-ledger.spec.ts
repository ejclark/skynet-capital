import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type LedgerRow,
  moved,
  parseLedger,
  pricePerUnit,
  readLedger,
  slugOf,
  unrecordedChecks,
  verdict,
} from "../../scripts/loop-ledger.mjs";

// The iteration record every loop writes (docs/process/LEARNING-LOOP.md, field 14). The rule under
// test is the one a loop stops on: two rows in a row that move the number less than the loop said an
// iteration was worth.
const baseline = (number: number, worth: number, aim?: "up"): LedgerRow => ({
  date: "2026-11-01",
  loop: "css",
  before: number,
  after: number,
  worth,
  ...(aim ? { aim } : {}),
  tokensM: null,
  usd: null,
  changed: "baseline",
});
const rep = (
  before: number,
  after: number,
  cost: { tokensM?: number | null; usd?: number | null } = {},
): LedgerRow => ({
  date: "2026-11-02",
  loop: "css",
  before,
  after,
  tokensM: cost.tokensM ?? null,
  usd: cost.usd ?? null,
  changed: "a swap",
});

describe("loop ledger — when a loop stops", () => {
  it("a baseline alone has no iteration to judge", () => {
    expect(verdict([baseline(100, 20)]).state).toBe("running");
  });

  it("reads stopped when the last two rows both move under the stated worth", () => {
    const v = verdict([baseline(100, 20), rep(100, 90), rep(90, 85)]);
    expect(v.state).toBe("stopped");
    expect(v.why).toContain("10 and 5");
    expect(v.why).toContain("worth 20");
  });

  it("one row under worth is not a stop, whichever side the good row falls", () => {
    expect(verdict([baseline(100, 20), rep(100, 90)]).state).toBe("running");
    expect(verdict([baseline(100, 20), rep(100, 90), rep(90, 60)]).state).toBe("running");
    expect(verdict([baseline(100, 20), rep(100, 70), rep(70, 60)]).state).toBe("running");
  });

  it("a row that moves exactly the worth has earned its keep", () => {
    expect(verdict([baseline(100, 20), rep(100, 80), rep(80, 60)]).state).toBe("running");
  });

  it("a stopped loop runs again once a row moves its worth", () => {
    const stopped = [baseline(100, 20), rep(100, 90), rep(90, 85)];
    expect(verdict(stopped).state).toBe("stopped");
    expect(verdict([...stopped, rep(85, 50), rep(50, 45)]).state).toBe("running");
  });

  it("a number that grew moved nothing, and counts toward the stop", () => {
    expect(moved({}, rep(100, 110))).toBe(-10);
    expect(verdict([baseline(100, 20), rep(100, 110), rep(110, 112)]).state).toBe("stopped");
  });

  it("closes when the number reaches zero, even on a small last row", () => {
    expect(verdict([baseline(10, 20), rep(10, 5), rep(5, 0)]).state).toBe("closed");
  });

  // A count of applied edits climbs, and its rounds still stop on the same rule. Zero is where it
  // starts, so zero never closes it.
  it("a loop whose number should climb moves upward and never closes at zero", () => {
    const up = baseline(0, 20, "up");
    expect(moved(up, rep(10, 40))).toBe(30);
    expect(verdict([up]).state).toBe("running");
    expect(verdict([up, rep(0, 40), rep(40, 90)]).state).toBe("running");
    expect(verdict([up, rep(0, 10), rep(10, 15)]).state).toBe("stopped");
  });

  it("never reads stopped for a loop that stated no worth", () => {
    const { worth: _none, ...unstated } = baseline(100, 20);
    expect(verdict([unstated, rep(100, 99), rep(99, 98)]).state).toBe("running");
  });
});

describe("loop ledger — price per unit moved", () => {
  it("divides what the rows cost by what they moved, in dollars and in tokens", () => {
    const rows = [
      baseline(100, 20),
      rep(100, 80, { usd: 4, tokensM: 2 }),
      rep(80, 70, { usd: 2, tokensM: 1 }),
    ];
    expect(pricePerUnit(rows)).toMatchObject({ usdPerUnit: 0.2, tokensMPerUnit: 0.1 });
  });

  it("a script's real zero is a price; an unknown cost is not", () => {
    expect(pricePerUnit([baseline(100, 20), rep(100, 80, { usd: 0 })]).usdPerUnit).toBe(0);
    expect(pricePerUnit([baseline(100, 20), rep(100, 80)]).usdPerUnit).toBeNull();
  });

  // Dividing every row's cost by every row's move would flatter the loop with moves nobody priced.
  it("leaves an unpriced row out of both sides of the division", () => {
    const rows = [baseline(100, 20), rep(100, 90, { usd: 5 }), rep(90, 40)];
    expect(pricePerUnit(rows).usdPerUnit).toBe(0.5);
  });

  it("says what was spent when nothing moved, rather than a negative price", () => {
    const price = pricePerUnit([baseline(100, 20), rep(100, 105, { usd: 3 })]);
    expect(price.usdPerUnit).toBeNull();
    expect(price.spentUsd).toBe(3);
  });
});

describe("loop ledger — reading the record", () => {
  it("names the line it cannot read, such as a conflict marker", () => {
    const text = `${JSON.stringify(baseline(1, 1))}\n<<<<<<< HEAD\n`;
    const { rows, problems } = parseLedger(text, "css.jsonl");
    expect(rows).toHaveLength(1);
    expect(problems).toEqual(["css.jsonl:2 is not JSON"]);
  });

  it("names a first row that states no worth, since the stop rule has nothing to read", () => {
    const { worth: _none, ...unstated } = baseline(1, 1);
    const { problems } = parseLedger(`${JSON.stringify(unstated)}\n`, "css.jsonl");
    expect(problems).toEqual(["css.jsonl:1 is the baseline and states no worth"]);
  });

  it("names a row whose numbers are missing or text, and leaves it out of the reading", () => {
    const text = `${JSON.stringify(baseline(5, 1))}\n{"before":"9","after":1}\n`;
    const { rows, problems } = parseLedger(text, "css.jsonl");
    expect(rows).toHaveLength(1);
    expect(problems).toEqual(["css.jsonl:2 has no before and after numbers"]);
  });

  it("makes a loop's name the same slug the registry's name gives", () => {
    expect(slugOf("Did the fix hold?")).toBe("did-the-fix-hold");
  });
});

// A warning on all 20 registry rows on day one measures nothing, so the line is drawn at the ledger's
// own start: only a check that came due with the record available has any reason to have written one.
describe("loop ledger — a due check with no iteration on record", () => {
  const registry = (loop: string, nextCheck: string | null, state = "running") => ({
    loop,
    issue: "#1",
    state,
    nextCheck,
    question: "?",
    nextCheckText: `${nextCheck}`,
  });
  const ledger = [{ ...baseline(5, 1), loop: "seeded", date: "2026-11-01" }];
  const names = (rows: ReturnType<typeof registry>[], today = "2026-11-20") =>
    unrecordedChecks({ today, registry: rows, ledger }).map((c) => c.loop);

  it("warns on a check due after the ledger began with no row for its loop", () => {
    expect(names([registry("No row", "2026-11-10")])).toEqual(["No row"]);
  });

  it("stays quiet for every check dated on or before the ledger's start", () => {
    expect(names([registry("Older", "2026-10-31"), registry("Same day", "2026-11-01")])).toEqual(
      [],
    );
  });

  it("stays quiet for a check not yet due", () => {
    expect(names([registry("Later", "2026-12-01")])).toEqual([]);
  });

  it("stays quiet once the loop has a row, matched by slug", () => {
    expect(names([registry("Seeded", "2026-11-10")])).toEqual([]);
  });

  it("stays quiet for an ended loop or a row with no date", () => {
    expect(names([registry("Ended", "2026-11-10", "closed"), registry("Event", null)])).toEqual([]);
  });

  it("warns on nothing when the ledger holds no rows to date a start from", () => {
    const rows = [registry("No row", "2026-11-10")];
    expect(unrecordedChecks({ today: "2026-11-20", registry: rows, ledger: [] })).toEqual([]);
  });
});

describe("loop ledger — the command", () => {
  const script = "scripts/loop-ledger.mjs";
  const inDir = (fn: (dir: string) => void) => {
    const dir = mkdtempSync(join(tmpdir(), "loop-ledger-"));
    try {
      fn(dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
  const run = (dir: string, ...args: string[]) =>
    spawnSync("node", [script, "--ledger", dir, ...args], { encoding: "utf8" });

  it("writes a baseline, then iterations, and reads stopped from what it wrote", () => {
    inDir((dir) => {
      const add = ["--add", "--loop", "CSS literals"];
      expect(
        run(dir, ...add, "--baseline", "100", "--worth", "20", "--changed", "the scan").status,
      ).toBe(0);
      expect(
        run(dir, ...add, "--after", "90", "--usd", "2", "--tokens-m", "unknown", "--changed", "a")
          .status,
      ).toBe(0);
      // --before is left out: it continues from the last row's after.
      expect(run(dir, ...add, "--after", "85", "--usd", "3", "--changed", "b").status).toBe(0);

      const rows = readFileSync(join(dir, "css-literals.jsonl"), "utf8")
        .trim()
        .split("\n")
        .map((l) => JSON.parse(l));
      expect(rows.map((r) => [r.before, r.after])).toEqual([
        [100, 100],
        [100, 90],
        [90, 85],
      ]);
      expect(rows[1]).toMatchObject({ loop: "css-literals", usd: 2, tokensM: null, changed: "a" });

      const out = run(dir);
      expect(out.status).toBe(0);
      expect(out.stdout).toContain("css-literals: baseline 100, latest 85, 2 iterations, stopped");
      expect(out.stdout).toContain("$0.333 per unit");
    });
  });

  it("--json carries the same reading for a script", () => {
    inDir((dir) => {
      run(dir, "--add", "--loop", "x", "--baseline", "3", "--worth", "1", "--changed", "seed");
      const [loop] = JSON.parse(run(dir, "--json").stdout);
      expect(loop).toMatchObject({ loop: "x", baseline: 3, latest: 3, iterations: 0 });
      expect(loop.verdict.state).toBe("running");
    });
  });

  it("refuses an iteration on a loop with no baseline, since nothing states its worth", () => {
    inDir((dir) => {
      const out = run(dir, "--add", "--loop", "x", "--after", "1", "--usd", "1", "--changed", "a");
      expect(out.status).toBe(2);
      expect(out.stderr).toContain("--baseline");
    });
  });

  it("refuses a baseline with no worth, and a second baseline over a first", () => {
    inDir((dir) => {
      const seed = ["--add", "--loop", "x", "--baseline", "3", "--changed", "seed"];
      expect(run(dir, ...seed).status).toBe(2);
      expect(run(dir, ...seed, "--worth", "1").status).toBe(0);
      expect(run(dir, ...seed, "--worth", "1").status).toBe(2);
    });
  });

  // "Unknown" has to be said out loud: a cost left off by accident must not read as free.
  it("refuses an iteration that says nothing about its cost", () => {
    inDir((dir) => {
      run(dir, "--add", "--loop", "x", "--baseline", "3", "--worth", "1", "--changed", "seed");
      const out = run(dir, "--add", "--loop", "x", "--after", "1", "--changed", "a");
      expect(out.status).toBe(2);
      expect(out.stderr).toContain("--usd");
    });
  });

  it("refuses an aim it does not know, which would read a climbing number as falling", () => {
    inDir((dir) => {
      const seed = ["--add", "--loop", "x", "--baseline", "0", "--worth", "1", "--changed", "seed"];
      expect(run(dir, ...seed, "--aim", "UP").status).toBe(2);
      expect(run(dir, ...seed, "--aim", "up").status).toBe(0);
    });
  });

  it("refuses a number it cannot read and a flag it does not know", () => {
    inDir((dir) => {
      run(dir, "--add", "--loop", "x", "--baseline", "3", "--worth", "1", "--changed", "seed");
      const add = ["--add", "--loop", "x", "--usd", "1", "--changed", "a"];
      expect(run(dir, ...add, "--after", "lots").status).toBe(2);
      expect(run(dir, ...add, "--after", "1", "--cost", "5").status).toBe(2);
      expect(run(dir, ...add, "--after", "1", "--usd", "free").status).toBe(2);
    });
  });

  it("exits 1 and names the line when a ledger file cannot be read", () => {
    inDir((dir) => {
      writeFileSync(join(dir, "x.jsonl"), "<<<<<<< HEAD\n");
      const out = run(dir);
      expect(out.status).toBe(1);
      expect(out.stderr).toContain("x.jsonl:1 is not JSON");
    });
  });
});

describe("loop ledger — the record in this repo", () => {
  it("every committed file reads cleanly, and the seeded loops each state a worth", () => {
    const { rows, problems } = readLedger();
    expect(problems).toEqual([]);
    const loops = new Set(rows.map((r) => r.loop));
    for (const loop of ["css-literal-swaps", "money-path-dupes", "playbook-spec-gap"]) {
      expect(loops).toContain(loop);
    }
  });

  it("npm run loop:ledger is wired to the script and prints every seeded loop", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.scripts["loop:ledger"]).toBe("node scripts/loop-ledger.mjs");
    const out = execFileSync("npm", ["run", "-s", "loop:ledger"], { encoding: "utf8" });
    expect(out).toContain("css-literal-swaps: baseline 1173");
    expect(out).toContain("money-path-dupes: baseline 155");
    expect(out).toContain("playbook-spec-gap: baseline 35");
  });

  // The field the study first asked for is a row on the owning issue's Log; this record replaced it.
  // Two homes for one rule is the drift this repo sweeps for, so the registry's field 14 points here.
  it("the registry's iteration field names this record, not a row on the issue", () => {
    const md = readFileSync("docs/process/LEARNING-LOOP.md", "utf8");
    const field = md.split("\n").find((l) => l.startsWith("| 14 |")) ?? "";
    expect(field).toContain("loop-iterations/");
    expect(field).toContain("npm run loop:ledger");
    expect(field).not.toContain("a row on the owning issue");
  });
});

describe("loop-check — warns on a due check with no iteration row", () => {
  it("names the row due after the ledger began, and leaves the older row alone", () => {
    const dir = mkdtempSync(join(tmpdir(), "loop-check-ledger-"));
    try {
      const ledgerDir = join(dir, "ledger");
      mkdirSync(ledgerDir);
      writeFileSync(
        join(ledgerDir, "seeded.jsonl"),
        `${JSON.stringify({ ...baseline(5, 1), loop: "seeded", date: "2020-01-05" })}\n`,
      );
      writeFileSync(
        join(dir, "LEARNING-LOOP.md"),
        [
          "## Loops running now",
          "",
          "| Loop | The question | Owning issue | State | Next check |",
          "|---|---|---|---|---|",
          "| Before the ledger | Is it so? | #1 | running | 2020-01-01 — wrong if |",
          "| After the ledger | Is it so? | #1 | running | 2020-02-01 — wrong if |",
          "| Seeded | Is it so? | #1 | running | 2020-02-01 — wrong if |",
          "",
        ].join("\n"),
      );
      const out = execFileSync(
        "node",
        [
          "scripts/loop-check.mjs",
          "--registry",
          join(dir, "LEARNING-LOOP.md"),
          "--ledger",
          ledgerDir,
        ],
        { encoding: "utf8", env: { ...process.env, GH_TOKEN: "", GITHUB_TOKEN: "" } },
      );
      const warned = out.split("\n").filter((l) => l.includes("no iteration row"));
      expect(warned).toHaveLength(1);
      expect(warned[0]).toMatch(/^::warning::loop-check — "After the ledger"/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("warns, rather than fails, when a ledger file cannot be read", () => {
    const dir = mkdtempSync(join(tmpdir(), "loop-check-ledger-"));
    try {
      const ledgerDir = join(dir, "ledger");
      mkdirSync(ledgerDir);
      writeFileSync(join(ledgerDir, "bad.jsonl"), "<<<<<<< HEAD\n");
      writeFileSync(
        join(dir, "LEARNING-LOOP.md"),
        "## Loops running now\n\n| Loop | Next check |\n|---|---|\n",
      );
      const out = execFileSync(
        "node",
        [
          "scripts/loop-check.mjs",
          "--registry",
          join(dir, "LEARNING-LOOP.md"),
          "--ledger",
          ledgerDir,
        ],
        { encoding: "utf8", env: { ...process.env, GH_TOKEN: "", GITHUB_TOKEN: "" } },
      );
      expect(out).toContain("::warning::loop-check — bad.jsonl:1 is not JSON");
      expect(out).toContain("loop-check: 0 due check(s) listed.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
