import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { audit } from "../../../scripts/moneypenny/audit.mjs";
import {
  DRIFT_CHORE_DOC,
  DRIFT_CHORE_PREFIX,
  DRIFT_CHORE_TITLE,
  type DriftScan,
  driftChoreBody,
  driftChoreIntent,
  stepsBlockFrom,
} from "../../../scripts/moneypenny/drift-chore.mjs";

// #5729 — the push tick files the instruction-drift chore when `instruction-drift-scan --due` says a
// run is owed, keeps one ticket open (refreshing its counts), and closes it once a run is stamped.

const dueScan = (overrides: Partial<DriftScan> = {}): DriftScan => ({
  state: "known",
  due: true,
  reason: "changed",
  stamp: { commit: "05c7b94491aa3f5d9212d8f46eaf3f6fad6784f0", date: "2026-10-05", run: "full" },
  daysSince: 13,
  files: ["CLAUDE.md", "docs/BRAND.md"],
  items: [{}, {}],
  protectedItems: [{}],
  ...overrides,
});

/** The capsule lint's problems for a body, via its CLI (issue-lint.mjs ships no type surface). */
const lintProblems = (title: string, body: string): string[] => {
  const args = ["scripts/issue-lint.mjs", "--stdin", "--json", "--title", title];
  try {
    return JSON.parse(execFileSync("node", args, { input: body, encoding: "utf8" })).problems;
  } catch (error) {
    return JSON.parse((error as { stdout?: string }).stdout || '{"problems":["no output"]}')
      .problems;
  }
};

const STEPS = stepsBlockFrom(readFileSync(DRIFT_CHORE_DOC, "utf8"));

describe("driftChoreIntent — file, refresh, close", () => {
  it("WHEN the scan is due and no ticket is open, files one needs-session ticket", () => {
    const intent = driftChoreIntent({ scan: dueScan(), stepsBlock: STEPS });
    expect(intent?.kind).toBe("open-issue");
    expect(intent?.title).toBe(DRIFT_CHORE_TITLE);
    expect(intent?.label?.name).toBe("needs-session");
  });

  it("WHILE a ticket is open, never files another — it refreshes the body when a number moved", () => {
    const open = { number: 9001, title: DRIFT_CHORE_TITLE, body: "an older body" };
    const intent = driftChoreIntent({ scan: dueScan(), open, stepsBlock: STEPS });
    expect(intent?.kind).toBe("edit-issue-body");
    expect(intent?.issueNumber).toBe(9001);
  });

  it("does nothing while the open ticket already shows the current counts", () => {
    const body = driftChoreBody(dueScan(), STEPS);
    const open = { number: 9001, title: DRIFT_CHORE_TITLE, body: `${body}\n` };
    expect(driftChoreIntent({ scan: dueScan(), open, stepsBlock: STEPS })).toBeNull();
  });

  it("closes the open ticket once the scan is no longer due (the run recorded its stamp)", () => {
    const open = { number: 9001, title: DRIFT_CHORE_TITLE };
    const intent = driftChoreIntent({ scan: dueScan({ due: false, reason: "fresh" }), open });
    expect(intent?.kind).toBe("close-receipt");
    expect(intent?.issueNumber).toBe(9001);
  });

  it("does nothing when not due and nothing is open", () => {
    expect(driftChoreIntent({ scan: dueScan({ due: false, reason: "unchanged" }) })).toBeNull();
  });

  it("files nothing on an UNKNOWN scan — it cannot tell due from not due", () => {
    const scan: DriftScan = { state: "unknown", unknown: "the stamp is not reachable" };
    const open = { number: 9001, title: DRIFT_CHORE_TITLE };
    expect(driftChoreIntent({ scan, open })).toBeNull();
  });
});

describe("the ticket body", () => {
  it("passes the issue capsule lint", () => {
    expect(lintProblems(DRIFT_CHORE_TITLE, driftChoreBody(dueScan(), STEPS))).toEqual([]);
  });

  it("carries the chore's three-role steps block, read from the chore doc", () => {
    expect(STEPS).toContain('"Role: check."');
    expect(STEPS).toContain('"Role: refute."');
    expect(STEPS).toContain('"Role: apply."');
    expect(driftChoreBody(dueScan(), STEPS)).toContain(STEPS);
  });

  it("tells the session to re-run the scan rather than trust a frozen item list", () => {
    const body = driftChoreBody(dueScan(), STEPS);
    expect(body).toContain("node scripts/instruction-drift-scan.mjs --json");
    expect(body).not.toContain('"branch"');
  });

  it("names the stamp and the counts above the fold", () => {
    const body = driftChoreBody(dueScan(), STEPS);
    expect(body).toContain("`05c7b94` · 2026-10-05, 13d old");
    expect(body).toContain("2 instruction files changed");
    expect(body).toContain("2 items for grind · 1 for the platter");
  });

  it("falls back to pointing at the chore doc when its steps block cannot be found", () => {
    expect(driftChoreBody(dueScan(), null)).toContain(`\`steps\` block in \`${DRIFT_CHORE_DOC}\``);
  });
});

describe("audit() carries the drift ticket intent", () => {
  it("appends it after the other checks", () => {
    const driftChore = driftChoreIntent({ scan: dueScan(), stepsBlock: STEPS });
    const intents = audit({ driftChore });
    expect(intents.map((i) => i.kind)).toEqual(["open-issue"]);
    expect(intents[0]?.title.startsWith(DRIFT_CHORE_PREFIX)).toBe(true);
  });

  it("adds nothing when there is no drift intent", () => {
    expect(audit({ driftChore: null })).toEqual([]);
  });
});
