import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Adoption, AdoptionLedger } from "../../src/playbooks/conviction-adoptions.js";
import type { Conviction } from "../../src/playbooks/conviction-record.js";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";
import { FENCE_CALLS, type FenceCall } from "../../src/playbooks/fence-studies.js";
import {
  adopt,
  listing,
  main,
  marketDay,
  prFor,
  proposalsOf,
  readCalls,
} from "../../src/scripts/claim-refine.js";
import { run } from "../support/ship-run.js";

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

  it("refuses a pass on CRWV-WHEEL, naming Study A and its call", () => {
    for (const label of ["1", "2a", "7"]) {
      const result = adopt(
        `ai-dip-2026-10/${label}/CRWV-WHEEL`,
        {},
        [scoredAs({ [label]: "pass" })],
        "2026-11-20",
      );
      expect(result).toMatchObject({ ok: false });
      if (result.ok) return;
      expect(result.error).toContain(
        "`docs/research/wheel-strike-cap-2026-11.md` says Don't (medium; proves it wrong 2027-01-29)",
      );
    }
  });

  it("refuses a pass on CRWV-LONG-CALL, naming Study B's call on each of its two fences", () => {
    for (const label of ["2b", "8", "9"]) {
      const result = adopt(
        `ai-dip-2026-10/${label}/CRWV-LONG-CALL`,
        {},
        [scoredAs({ [label]: "pass" })],
        "2026-11-25",
      );
      expect(result).toMatchObject({ ok: false });
      if (result.ok) return;
      expect(result.error).toContain(
        "no expiry before 2027-03-18: `docs/research/long-call-fences-2026-11.md` says Don't (medium",
      );
      expect(result.error).toContain(
        "6 sessions after the print: `docs/research/long-call-fences-2026-11.md` says Don't, yet (low",
      );
    }
  });

  it("refuses a pass whose fence no study has judged", () => {
    const result = adopt(
      "ai-dip-2026-10/7/CRWV-WHEEL",
      {},
      [scoredAs({ "7": "pass" })],
      "2026-11-20",
      { calls: [] },
    );
    expect(result).toMatchObject({ ok: false });
    if (result.ok) return;
    expect(result.error).toContain("no study has judged it, and it needs its own");
  });

  it("refuses a key no decided claim proposes, and a day that is not one", () => {
    expect(adopt(KEY, {}, [AI_DIP_2026_10], "2026-11-10")).toMatchObject({ ok: false });
    expect(adopt(KEY, {}, [FAILED_2A], "tomorrow")).toMatchObject({ ok: false });
  });
});

/** Study B with the wait's call flipped to adopt: the one shape no study states today. */
const QUIET_ADOPTED: readonly FenceCall[] = FENCE_CALLS.map((c) =>
  c.pair === "CRWV-LONG-CALL" && c.fence === "quiet"
    ? {
        ...c,
        call: "adopt" as const,
        words: "Adopt",
        rule: { kind: "quiet" as const, sessionsAfterPrint: 6 },
      }
    : c,
);
const PASSED_9 = scoredAs({ "9": "pass" });
const KEY_9 = "ai-dip-2026-10/9/CRWV-LONG-CALL";

describe("adopt — a study's adopt call", () => {
  it("reads only the fences the passed claim backs, never another claim's on the same pair", () => {
    // Claim 9 backs the quiet fence alone here; 2b's expiry floor is its own entry.
    const split: Conviction = {
      ...PASSED_9,
      narrowings: [
        {
          pair: "CRWV-LONG-CALL",
          fromClaims: ["9"],
          narrow: [{ kind: "quiet", sessionsAfterPrint: 6 }],
        },
        {
          pair: "CRWV-LONG-CALL",
          fromClaims: ["2b"],
          narrow: [{ kind: "expiry-from", day: "2027-03-18" }],
        },
      ],
    };
    const found = proposalsOf([split]).find((f) => f.key === KEY_9);
    if (!found) throw new Error("no proposal");
    expect(readCalls(found, QUIET_ADOPTED)).toMatchObject({ refused: [] });
    expect(readCalls(found, QUIET_ADOPTED).adoptable.map((c) => c.fence)).toEqual(["quiet"]);
  });

  it("writes the study's rule as the pair's own, and only the fences it adopts", () => {
    const result = adopt(KEY_9, {}, [PASSED_9], "2026-11-25", { calls: QUIET_ADOPTED });
    expect(result).toMatchObject({ ok: true, changed: true });
    if (!result.ok) return;
    expect(result.ledger[KEY_9]).toEqual({
      change: "pair-rule",
      adoptedOn: "2026-11-25",
      basis: "the 9 reading",
      rules: [{ kind: "quiet", sessionsAfterPrint: 6 }],
    });
  });

  it("refuses a rule that would widen the playbook's bounds", () => {
    const wide: readonly FenceCall[] = QUIET_ADOPTED.map((c) =>
      c.call === "adopt" ? { ...c, rule: { kind: "dte" as const, min: 30, max: 400 } } : c,
    );
    const result = adopt(KEY_9, {}, [PASSED_9], "2026-11-25", { calls: wide });
    expect(result).toMatchObject({ ok: false });
    if (result.ok) return;
    expect(result.error).toContain("wider than this playbook's");
  });

  it("writes nothing when the pair already holds that rule from another claim's line", () => {
    const first = adopt(KEY_9, {}, [PASSED_9], "2026-11-25", { calls: QUIET_ADOPTED });
    if (!first.ok) throw new Error(first.error);
    const both = scoredAs({ "9": "pass", "2b": "pass" });
    const second = adopt("ai-dip-2026-10/2b/CRWV-LONG-CALL", first.ledger, [both], "2026-11-26", {
      calls: QUIET_ADOPTED,
    });
    expect(second).toMatchObject({ ok: false });
  });

  it("opens a held PR body that cites the study and lists the fence left on the view", () => {
    const result = adopt(KEY_9, {}, [PASSED_9], "2026-11-25", { calls: QUIET_ADOPTED });
    if (!result.ok) throw new Error(result.error);
    const found = proposalsOf([PASSED_9]).find((f) => f.key === KEY_9);
    if (!found) throw new Error("no proposal");
    const { title, body } = prFor(found, result.ledger[KEY_9] as Adoption, QUIET_ADOPTED);
    expect(title).toBe(
      "feat(playbooks): adopt CRWV-LONG-CALL's own rule, claim 9 of ai-dip-2026-10 held",
    );
    expect(body).toMatch(/^## The picture\n/);
    expect(body).toContain("`docs/research/long-call-fences-2026-11.md` says Adopt");
    expect(body).toContain(
      "no expiry before 2027-03-18: `docs/research/long-call-fences-2026-11.md` says Don't",
    );
    expect(body).toContain("Part of #5482");
    const dir = mkdtempSync(join(tmpdir(), "refine-rule-"));
    try {
      const file = join(dir, "body.md");
      writeFileSync(file, body);
      expect(run(["checkbody", file])).toMatchObject({ code: 0 });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("listing", () => {
  it("names each proposal's key and whether it is open, adopted, or a pass's study", () => {
    const both = scoredAs({ "2a": "fail", "8": "pass" });
    const text = listing(proposalsOf([both]), {}, [both]);
    expect(text).toContain(`${KEY} · claim failed, open: npm run research:refine -- ${KEY}`);
    expect(text).toContain(
      "ai-dip-2026-10/8/CRWV-LONG-CALL · claim held, not adopted: no expiry before 2027-03-18: `docs/research/long-call-fences-2026-11.md` says Don't",
    );
  });

  it("says a pass's adopted rule is already the pair's own, instead of offering a dead end", () => {
    const first = adopt(KEY_9, {}, [PASSED_9], "2026-11-25", { calls: QUIET_ADOPTED });
    if (!first.ok) throw new Error(first.error);
    const both = scoredAs({ "9": "pass", "2b": "pass" });
    expect(listing(proposalsOf([both]), first.ledger, [both], QUIET_ADOPTED)).toContain(
      "ai-dip-2026-10/2b/CRWV-LONG-CALL · claim held: what a study adopts is already CRWV-LONG-CALL's own rule",
    );
  });

  it("tells a stale rule line to drop the rule, not to lift a hold", () => {
    const ledger: AdoptionLedger = {
      [KEY_9]: {
        change: "pair-rule",
        adoptedOn: "2026-11-25",
        basis: "x",
        rules: [{ kind: "quiet", sessionsAfterPrint: 6 }],
      },
    };
    expect(listing([], ledger, [AI_DIP_2026_10], QUIET_ADOPTED)).toBe(
      `${KEY_9} · adopted, but the claim now reads pending: review it, and delete the line to drop the pair's own rule\n`,
    );
  });

  it("offers the command for a pass a study adopts", () => {
    expect(listing(proposalsOf([PASSED_9]), {}, [PASSED_9], QUIET_ADOPTED)).toContain(
      `${KEY_9} · claim held, a study adopts quiet: npm run research:refine -- ${KEY_9}`,
    );
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
  const HOLD: Adoption = { change: "stop-new-entries", adoptedOn: "2026-11-10", basis: "x" };

  it("shows the pair's before and after, asks Eric to merge, and is part of the plan", () => {
    if (!found) throw new Error("no proposal");
    const { title, body } = prFor(found, HOLD);
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
    expect(prFor(long, HOLD).title).toBe(
      "feat(convictions): stop new entries on CRWV-WHEEL, claim 2a failed",
    );
  });

  it("passes the house body check", () => {
    if (!found) throw new Error("no proposal");
    const dir = mkdtempSync(join(tmpdir(), "refine-body-"));
    try {
      const file = join(dir, "body.md");
      writeFileSync(file, prFor(found, HOLD).body);
      expect(run(["checkbody", file])).toMatchObject({ code: 0 });
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
