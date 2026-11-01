import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  activeIntents,
  forEvent,
  forIssue,
  INTENTS_DIR,
  loadIntents,
  parseIntent,
  publicHalfProblems,
  reserveToday,
  stateOf,
} from "../../scripts/intents.mjs";

// The rules docs/intents/README.md states. A record is what lets a date Eric named reach a lane, so
// a record that lapses late, or one a reader quietly mistakes for "none", is the failure to catch;
// so is a private word or a position landing in a public file.
const SAID = "**Said:** paraphrased 2026-11-01: hold back some points for a demo.";
const record = (until: string, { said = SAID, outcome = "", steers = "" } = {}) =>
  [
    "# demo — hold back points for a demo",
    "",
    `**Kind:** reservation · **Stated:** 2026-11-01 · **Until:** ${until}`,
    said,
    "",
    "| | |",
    "|---|---|",
    "| **Outcome** | 25 weekly points unspent by the lanes inside the window |",
    "| **Check** | node scripts/intents.mjs --reserve prints 25 inside the window and null after |",
    `| **Steers** | ${steers || "reserve:25 · `crwv-2026-11-10-print` · #6349"} |`,
    "",
    "## Outcome",
    outcome,
  ].join("\n");

const at = (iso: string) => Date.parse(iso);

describe("a declared intent's Until", () => {
  it("is required, loudly: no Until throws, an impossible date throws", () => {
    expect(() => parseIntent("x", record("").replace("· **Until:** ", ""))).toThrow(/Until/);
    expect(() => parseIntent("x", record("soon"))).toThrow(/Until/);
    expect(() => parseIntent("x", record("2026-02-31"))).toThrow(/Until/);
  });

  it("needs a real Stated date too, since a reader counts ledger rows from it", () => {
    expect(() =>
      parseIntent("x", record("2026-11-05").replace("**Stated:** 2026-11-01 · ", "")),
    ).toThrow(/Stated/);
  });

  it("holds through the end of that day in UTC and lapses the next instant", () => {
    const i = parseIntent("demo", record("2026-11-05"));
    expect(stateOf(i, at("2026-11-05T00:00:00Z"))).toBe("active");
    expect(stateOf(i, at("2026-11-05T23:59:59.999Z"))).toBe("active");
    expect(stateOf(i, at("2026-11-06T00:00:00Z"))).toBe("lapsed");
  });

  it("a written Outcome closes it whatever the date; an empty section does not", () => {
    const open = parseIntent("demo", record("2026-12-31"));
    const shut = parseIntent("demo", record("2026-12-31", { outcome: "Done 2026-11-04." }));
    expect(stateOf(open, at("2026-11-02T12:00:00Z"))).toBe("active");
    expect(stateOf(shut, at("2026-11-02T12:00:00Z"))).toBe("closed");
  });
});

describe("what a record steers", () => {
  it("sorts its steers into events, issues and the points held back", () => {
    const i = parseIntent("demo", record("2026-11-05"));
    expect(i.events).toEqual(["crwv-2026-11-10-print"]);
    expect(i.issues).toEqual([6349]);
    expect(i.reserve).toBe(25);
  });

  it("refuses a steer it cannot read, rather than dropping it", () => {
    expect(() => parseIntent("x", record("2026-11-05", { steers: "mix:cleanup" }))).toThrow(
      /steer/,
    );
  });

  it("refuses a record that steers nothing: a misspelled row must not reach no lane quietly", () => {
    const misspelled = record("2026-11-05").replace("**Steers**", "**Steer**");
    expect(() => parseIntent("x", misspelled)).toThrow(/Steers/);
  });

  it("answers for an event, an issue and the reserve only while the record is active", () => {
    const i = parseIntent("demo", record("2026-11-05"));
    const inside = at("2026-11-03T12:00:00Z");
    const after = at("2026-11-07T12:00:00Z");
    expect(forEvent([i], "crwv-2026-11-10-print", inside).map((x) => x.slug)).toEqual(["demo"]);
    expect(forEvent([i], "nvda-2026-11-18-print", inside)).toEqual([]);
    expect(forEvent([i], "crwv-2026-11-10-print", after)).toEqual([]);
    expect(forIssue([i], 6349, inside).map((x) => x.slug)).toEqual(["demo"]);
    expect(forIssue([i], 6349, after)).toEqual([]);
    expect(reserveToday([i], inside)).toBe(25);
    expect(reserveToday([i], after)).toBeNull();
    expect(activeIntents([i], after)).toEqual([]);
  });
});

describe("a public record", () => {
  it("says where its words came from: a bare quote from a private chat is refused", () => {
    const quoted = '**Said:** "hold back some points for a demo"';
    expect(() => parseIntent("x", record("2026-11-05", { said: quoted }))).toThrow(/Said/);
    expect(() => parseIntent("x", record("2026-11-05", { said: "" }))).toThrow(/Said/);
    const fromIssue = '**Said:** verbatim from #6349: "study the print"';
    expect(parseIntent("x", record("2026-11-05", { said: fromIssue })).said).toContain("#6349");
  });

  it.each([
    ["my primary position is the CRWV puts"],
    ["the primary position in CRWV"],
    ["he holds CRWV into the print"],
    ["I sold puts last week"],
    ["a position in CRWV"],
    ["the 55P expiring that week"],
    ["he holds 500 shares"],
    ["sold 10 contracts"],
    ["the 60 strike"],
    ["the Fidelity account"],
    ["$25,000 of premium"],
  ])("flags %s", (line) => {
    expect(publicHalfProblems(`# x\n\n${line}\n`)).not.toEqual([]);
  });

  it("does not flag a study goal that names symbols, events and a playbook's terms", () => {
    const line =
      "whether a cash-secured-put and covered-call playbook fits CRWV around its 2026-11-10 print";
    expect(publicHalfProblems(`# x\n\n${line}\n`)).toEqual([]);
  });
});

describe("the records on disk", () => {
  const slugs = () => loadIntents().map((i) => i.slug);

  it("every record parses, keeps the public half, and names a slug the file is called", () => {
    expect(INTENTS_DIR.endsWith(join("docs", "intents"))).toBe(true);
    for (const slug of slugs()) {
      const text = readFileSync(join(INTENTS_DIR, `${slug}.md`), "utf8");
      expect(text.startsWith(`# ${slug} — `), slug).toBe(true);
      expect(publicHalfProblems(text), slug).toEqual([]);
    }
  });

  it("the first record reaches both print events from its Stated date to the end of its Until", () => {
    // Read with any Outcome stripped and against its own dates, so closing or renewing the record
    // later is not a red here: what is pinned is that the file reaches the lanes, not its wording.
    const slug = "crwv-nvda-prints-2026-11";
    const text = readFileSync(join(INTENTS_DIR, `${slug}.md`), "utf8");
    const i = parseIntent(slug, text.replace(/## Outcome[\s\S]*/, ""));
    const stated = at(`${i.stated}T12:00:00Z`);
    for (const event of ["crwv-2026-11-10-print", "nvda-2026-11-18-print"]) {
      expect(forEvent([i], event, stated).map((x) => x.slug)).toEqual([slug]);
      expect(forEvent([i], event, i.untilEndMs)).toEqual([]);
    }
  });

  it("every active record's events are real, so a typo cannot quietly reach no lane", () => {
    const scan = execFileSync("node", ["scripts/event-scan.mjs"], { encoding: "utf8" });
    for (const i of activeIntents(loadIntents(), Date.now())) {
      for (const id of i.events) {
        const known = scan.includes(` ${id} `) || existsSync(`docs/research/events/${id}.md`);
        expect(known, `${i.slug} names ${id}`).toBe(true);
      }
    }
  });

  it("the route is wired: CLAUDE.md's idea routing names it, and /fitness starts from a record", () => {
    expect(readFileSync("CLAUDE.md", "utf8")).toMatch(/\*\*declare\*\*.*docs\/intents\/README\.md/);
    expect(readFileSync(".claude/skills/fitness/SKILL.md", "utf8")).toContain("docs/intents/");
  });
});

describe("node scripts/intents.mjs", () => {
  const dir = mkdtempSync(join(tmpdir(), "intents-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const run = (args: string[], intentsDir = dir) =>
    spawnSync("node", ["scripts/intents.mjs", ...args], {
      encoding: "utf8",
      env: { ...process.env, INTENTS_DIR: intentsDir },
    });
  writeFileSync(join(dir, "demo.md"), record("2026-11-05"));
  writeFileSync(join(dir, "README.md"), "# not a record, and it has no Until\n");

  it("prints the slug for an event through the last day and [] after it", () => {
    const event = "--event=crwv-2026-11-10-print";
    expect(JSON.parse(run([event, "--today=2026-11-05"]).stdout)).toEqual(["demo"]);
    expect(JSON.parse(run([event, "--today=2026-11-06"]).stdout)).toEqual([]);
  });

  it("answers --issue, --reserve and --json the same way", () => {
    expect(JSON.parse(run(["--issue=6349", "--today=2026-11-05"]).stdout)).toEqual(["demo"]);
    expect(JSON.parse(run(["--issue=6349", "--today=2026-11-06"]).stdout)).toEqual([]);
    expect(JSON.parse(run(["--reserve", "--today=2026-11-05"]).stdout)).toBe(25);
    expect(JSON.parse(run(["--reserve", "--today=2026-11-06"]).stdout)).toBeNull();
    const [row] = JSON.parse(run(["--json", "--today=2026-11-06"]).stdout);
    expect([row.slug, row.state]).toEqual(["demo", "lapsed"]);
  });

  it("exits non-zero on a bad --today, never reading every record as active", () => {
    const out = run(["--event=crwv-2026-11-10-print", "--today=2026-02-31"]);
    expect(out.status).not.toBe(0);
    expect(out.stdout).toBe("");
  });

  it("exits non-zero on a flag it cannot read, never answering [] or a table", () => {
    for (const flag of ["--issue=abc", "--issue=#6349", "--event=", "--issue="]) {
      const out = run([flag]);
      expect(out.status, flag).not.toBe(0);
      expect(out.stdout, flag).toBe("");
    }
  });

  it("answers from any working directory, never a silent exit 0", () => {
    const out = spawnSync("node", ["intents.mjs", "--reserve", "--today=2026-11-05"], {
      cwd: "scripts",
      encoding: "utf8",
      env: { ...process.env, INTENTS_DIR: dir },
    });
    expect(JSON.parse(out.stdout)).toBe(25);
  });

  it("exits non-zero on a malformed record, never printing [] as though there were none", () => {
    const bad = join(dir, "bad");
    mkdirSync(bad);
    writeFileSync(join(bad, "x.md"), "# x — no dates at all\n");
    const out = run(["--event=crwv-2026-11-10-print"], bad);
    expect(out.status).not.toBe(0);
    expect(out.stdout).toBe("");
    expect(out.stderr).toContain("Until");
  });

  it("a missing folder is no records, not an error", () => {
    const out = run(["--json"], join(dir, "nowhere"));
    expect(out.status).toBe(0);
    expect(JSON.parse(out.stdout)).toEqual([]);
  });
});
