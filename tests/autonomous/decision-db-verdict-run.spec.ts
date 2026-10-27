import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import { VERDICT_RUN_BREAK_SQL } from "../../src/autonomous/decision-db-verdict-run.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import type { PlaybookVerdict } from "../../src/domain/types.js";

/**
 * When a playbook's verdict began, read from the store (#4953) — the Playbooks cards' "since",
 * exact past the heartbeat's 30-pass page, breaking where `playbookLines` breaks a run.
 */

const T0 = Date.parse("2026-10-05T13:30:00Z"); // Mon 9:30 AM New York
const STEP = 15_000;
const at = (i: number): number => T0 + i * STEP;

const s1 = (state: PlaybookVerdict["state"]): PlaybookVerdict => ({
  playbookId: "S1-NVDA",
  mode: "standard",
  state,
});

function pass(
  i: number,
  verdicts?: readonly PlaybookVerdict[],
  personaId = "sauron",
): DecisionRecord {
  return {
    at: at(i),
    personaId,
    mode: "live",
    rawIntents: [],
    guardedIntents: [],
    outcomes: [],
    ...(verdicts ? { playbookVerdicts: verdicts } : {}),
  };
}

describe("DecisionDb.verdictRunStart", () => {
  let dir: string;
  let path: string;
  let db: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-verdict-run-"));
    path = join(dir, "decisions.db");
    db = openDecisionDb(path);
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("dates a run far past the heartbeat's page, at the first pass after the last different answer", () => {
    db.record(pass(0, [s1("flat")]));
    for (let i = 1; i <= 400; i++) db.record(pass(i, [s1("long")]));
    expect(db.verdictRunStart("sauron", at(400), s1("long"))).toEqual({
      at: at(1),
      reachesOldest: false,
    });
  });

  it("WHEN no pass ever broke the run, says it reaches the first recorded pass", () => {
    for (let i = 0; i < 50; i++) db.record(pass(i, [s1("long")]));
    expect(db.verdictRunStart("sauron", at(49), s1("long"))).toEqual({
      at: at(0),
      reachesOldest: true,
    });
  });

  it("breaks at a pass that ran no playbook, and at one that never said (records before capture)", () => {
    db.record(pass(0, [s1("long")]));
    db.record(pass(1, [])); // ran no playbook (#4773)
    db.record(pass(2, [s1("long")]));
    db.record(pass(3)); // said nothing about playbooks
    db.record(pass(4, [s1("long")]));
    db.record(pass(5, [s1("long")]));
    expect(db.verdictRunStart("sauron", at(5), s1("long"))?.at).toBe(at(4));
    expect(db.verdictRunStart("sauron", at(2), s1("long"))?.at).toBe(at(2));
  });

  it("keeps two modes apart, and ignores passes newer than the one asked about", () => {
    const aggressive: PlaybookVerdict = { ...s1("long"), mode: "aggressive" };
    db.record(pass(0, [s1("flat"), aggressive]));
    db.record(pass(1, [s1("long"), aggressive]));
    db.record(pass(2, [s1("long"), aggressive]));
    db.record(pass(3, [s1("flat"), aggressive]));
    expect(db.verdictRunStart("sauron", at(2), s1("long"))).toEqual({
      at: at(1),
      reachesOldest: false,
    });
    expect(db.verdictRunStart("sauron", at(3), aggressive)).toEqual({
      at: at(0),
      reachesOldest: true,
    });
  });

  it("reads only the persona asked about", () => {
    db.record(pass(0, [s1("long")]));
    db.record(pass(1, [s1("flat")], "beta-scout"));
    db.record(pass(2, [s1("long")]));
    expect(db.verdictRunStart("sauron", at(2), s1("long"))?.at).toBe(at(0));
  });

  it("WHEN the asked-about pass did not give that verdict, or is not on record, has no run to date", () => {
    db.record(pass(0, [s1("long")]));
    db.record(pass(1, [s1("flat")]));
    expect(db.verdictRunStart("sauron", at(1), s1("long"))).toBeUndefined();
    expect(db.verdictRunStart("nobody", at(1), s1("long"))).toBeUndefined();
  });

  it("walks the persona's index rather than scanning the table", () => {
    db.record(pass(0, [s1("long")]));
    const raw = new DatabaseSync(path);
    try {
      const plan = (
        raw
          .prepare(`EXPLAIN QUERY PLAN ${VERDICT_RUN_BREAK_SQL}`)
          .all("sauron", at(0), "S1-NVDA", "standard", "long") as { detail: string }[]
      ).map((r) => r.detail);
      expect(plan.some((d) => /USING (COVERING )?INDEX decisions_persona_at/.test(d))).toBe(true);
      expect(
        plan.some((d) => /USING (COVERING )?INDEX sqlite_autoindex_playbook_verdicts/.test(d)),
      ).toBe(true);
      expect(plan.some((d) => /^SCAN/.test(d))).toBe(false);
    } finally {
      raw.close();
    }
  });
});
