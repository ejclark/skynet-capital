import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AdoptionLedger } from "../../src/playbooks/conviction-adoptions.js";
import type { Conviction } from "../../src/playbooks/conviction-record.js";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";
import {
  adopt,
  listing,
  main,
  marketDay,
  prFor,
  proposalsOf,
} from "../../src/scripts/claim-refine.js";

/** #5482 criterion 6, its second half — `npm run research:refine` turns a failed claim's proposal
 *  into one ledger line and the body of its own held PR. It never adopts a pass. */

const scoredAs = (labels: Record<string, "pass" | "fail">): Conviction => ({
  ...AI_DIP_2026_10,
  claims: AI_DIP_2026_10.claims.map(({ score: _, ...c }) => {
    const label = c.statement.match(/^(\d+[a-z]?)\./)?.[1] ?? "";
    const outcome = labels[label];
    if (!outcome) return c;
    return {
      ...c,
      score: {
        outcome,
        basis: `the ${label} reading`,
        dueOn: c.scoreBy ?? "2026-11-06",
        scoredOn: "2026-11-09",
      },
    };
  }),
});

const FAILED_2A = scoredAs({ "2a": "fail" });
const KEY = "ai-dip-2026-10/2a/CRWV-WHEEL";

describe("adopt", () => {
  it("writes option 1 of a failed claim's proposal as one line, with the score's basis", () => {
    const result = adopt(KEY, {}, [FAILED_2A], "2026-11-10");
    expect(result).toMatchObject({ ok: true, changed: true });
    if (!result.ok) return;
    expect(result.ledger).toEqual({
      [KEY]: { change: "stop-new-entries", adoptedOn: "2026-11-10", basis: "the 2a reading" },
    });
  });

  it("changes nothing for a key already adopted", () => {
    const ledger: AdoptionLedger = {
      [KEY]: { change: "stop-new-entries", adoptedOn: "2026-11-10", basis: "x" },
    };
    expect(adopt(KEY, ledger, [FAILED_2A], "2026-11-12")).toMatchObject({
      ok: true,
      changed: false,
      ledger,
    });
  });

  it("refuses a pass: carrying a fence into the pair's own settings needs its own study", () => {
    const result = adopt(
      "ai-dip-2026-10/7/CRWV-WHEEL",
      {},
      [scoredAs({ "7": "pass" })],
      "2026-11-10",
    );
    expect(result).toMatchObject({ ok: false });
    if (result.ok) return;
    expect(result.error).toContain("needs its own study");
  });

  it("refuses a key no decided claim proposes, and a day that is not one", () => {
    expect(adopt(KEY, {}, [AI_DIP_2026_10], "2026-11-10")).toMatchObject({ ok: false });
    expect(adopt(KEY, {}, [FAILED_2A], "tomorrow")).toMatchObject({ ok: false });
  });
});

describe("listing", () => {
  it("names each proposal's key and whether it is open, adopted, or a pass's study", () => {
    const both = scoredAs({ "2a": "fail", "8": "pass" });
    const text = listing(proposalsOf([both]), {}, [both]);
    expect(text).toContain(`${KEY} · claim failed, open: npm run research:refine -- ${KEY}`);
    expect(text).toContain("ai-dip-2026-10/8/CRWV-LONG-CALL · claim held");
  });

  it("flags an adopted line whose claim no longer reads failed, once", () => {
    const ledger: AdoptionLedger = {
      [KEY]: { change: "stop-new-entries", adoptedOn: "2026-11-10", basis: "x" },
    };
    expect(listing([], ledger, [AI_DIP_2026_10])).toBe(
      `${KEY} · adopted, but the claim now reads pending: review it, and delete the line to lift the hold\n`,
    );
    // Re-read as a pass, the claim proposes under the same key; the line still says it once.
    const passed = scoredAs({ "2a": "pass" });
    const text = listing(proposalsOf([passed]), ledger, [passed]);
    expect(text.split("\n").filter((l) => l.startsWith(KEY))).toEqual([
      `${KEY} · adopted, but the claim now reads pass: review it, and delete the line to lift the hold`,
    ]);
  });

  it("says an adopted key is adopted", () => {
    const ledger: AdoptionLedger = {
      [KEY]: { change: "stop-new-entries", adoptedOn: "2026-11-10", basis: "x" },
    };
    expect(listing(proposalsOf([FAILED_2A]), ledger, [FAILED_2A])).toContain(
      `${KEY} · adopted 2026-11-10: stops new entries`,
    );
  });
});

describe("prFor — the held PR's body", () => {
  const found = proposalsOf([FAILED_2A])[0];

  it("shows the pair's before and after, asks Eric to merge, and is part of the plan", () => {
    if (!found) throw new Error("no proposal");
    const { title, body } = prFor(found, "2026-11-10");
    expect(title).toBe(
      "feat(convictions): stop new entries on CRWV-WHEEL, claim 2a of ai-dip-2026-10 failed",
    );
    expect(title).toMatch(/^feat\(convictions\): [a-z]/);
    expect(body).toMatch(/^## The picture\n/);
    expect(body).toContain("| New entries | inside the view's fence");
    expect(body).toContain("| Exits | run | run |");
    expect(body).toContain("Part of #5482");
    expect(body).not.toMatch(/\b(closes|fixes|resolves) #/i);
  });

  it("keeps the title within 100 characters for a long view id", () => {
    if (!found) throw new Error("no proposal");
    const long = { ...found, conviction: { ...found.conviction, id: "x".repeat(64) } };
    expect(prFor(long, "2026-11-10").title).toBe(
      "feat(convictions): stop new entries on CRWV-WHEEL, claim 2a failed",
    );
  });

  it("passes the house body check", () => {
    if (!found) throw new Error("no proposal");
    const dir = mkdtempSync(join(tmpdir(), "refine-body-"));
    try {
      const file = join(dir, "body.md");
      writeFileSync(file, prFor(found, "2026-11-10").body);
      expect(() =>
        execFileSync("bash", ["scripts/ship.sh", "checkbody", file], { stdio: "pipe" }),
      ).not.toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("marketDay", () => {
  it("is New York's day, so an evening run never writes tomorrow's date", () => {
    expect(marketDay(new Date("2026-11-11T01:00:00Z"))).toBe("2026-11-10");
    expect(marketDay(new Date("2026-11-10T15:00:00Z"))).toBe("2026-11-10");
  });
});

describe("main", () => {
  let dir: string;
  let path: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "refine-"));
    path = join(dir, "adoptions.json");
    writeFileSync(path, "{}\n");
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("writes the ledger line and the body file for one key", () => {
    const bodyFile = join(dir, "body.md");
    const code = main([KEY, "--on", "2026-11-10", "--body-file", bodyFile], {
      path,
      convictions: [FAILED_2A],
    });
    expect(code).toBe(0);
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({
      [KEY]: { change: "stop-new-entries", adoptedOn: "2026-11-10", basis: "the 2a reading" },
    });
    expect(readFileSync(bodyFile, "utf8")).toContain("## The picture");
  });

  it("leaves the ledger alone when it refuses, and takes one key per run", () => {
    expect(main([KEY], { path, convictions: [AI_DIP_2026_10] })).toBe(1);
    expect(main([KEY, KEY], { path, convictions: [FAILED_2A] })).toBe(1);
    expect(main([KEY, "--on"], { path, convictions: [FAILED_2A] })).toBe(1);
    expect(readFileSync(path, "utf8")).toBe("{}\n");
  });
});
