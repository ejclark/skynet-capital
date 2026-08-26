import { execFileSync } from "node:child_process";

/**
 * The landing meter (#456) — the picture-first redesign's own scoreboard.
 *
 * The 2026-08-20 hat-team research found that format compliance tracks ENFORCEMENT, never
 * willingness. This scan is how we find out whether the enforced format is landing, so its own
 * numbers have to be trustworthy: a meter that quietly prints 0 where it means "we did not look"
 * would license exactly the false confidence it exists to remove.
 *
 * Driven through a fixture rather than live history, so the cases pin the parser against fixed
 * input instead of whatever merged this week.
 */

const FIXTURE = "tests/fixtures/comms/merged-prs.json";

type Row = {
  number: number;
  picture: string;
  waiver: string | null;
  lane: string;
  subject: string;
  mergedBy: string | null;
  hoursToMerge: number | null;
  ericComments: number | null;
  reactions: number | null;
};

type Report = {
  enriched: boolean;
  merged: number;
  withPicture: number;
  waived: number;
  missing: number;
  byLane: Record<string, { merged: number; waived: number; missing: number }>;
  rows: Row[];
};

const run = (...args: string[]): string =>
  execFileSync("node", ["scripts/comms-scan.mjs", `--fixture=${FIXTURE}`, "--offline", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

const report = (): Report => JSON.parse(run("--json"));
const rowFor = (n: number): Row => {
  const row = report().rows.find((r) => r.number === n);
  if (!row) throw new Error(`no row for #${n}`);
  return row;
};

describe("the landing meter — what it counts", () => {
  it("counts one row per merged pull request", () => {
    expect(report().merged).toBe(7);
  });

  it("ignores a commit that never came from a pull request", () => {
    // A direct push has no `(#N)` for GitHub to append, so there is no PR to measure.
    expect(report().rows.map((r) => r.subject)).not.toContain("chore: a squash with no PR number");
  });

  it("survives a body full of pipes and fences, which a naive delimiter would split on", () => {
    expect(rowFor(607).picture).toBe("waived");
    expect(rowFor(607).waiver).toBe("pure docs.");
  });
});

describe("the landing meter — how a picture was answered", () => {
  it("distinguishes the picture FORMS rather than flattening them to yes or no", () => {
    // Which form a lane reaches for is the question worth asking; a boolean cannot answer it.
    expect(rowFor(601).picture).toBe("shot");
    expect(rowFor(602).picture).toBe("mermaid");
    expect(rowFor(605).picture).toBe("table");
  });

  it("records a waiver as a waiver, and keeps the reason given", () => {
    expect(rowFor(603).picture).toBe("waived");
    expect(rowFor(603).waiver).toBe("lockfile bump, nothing to look at.");
  });

  it("flags a body with no picture section at all", () => {
    // `ship.sh checkbody` should make this impossible, so a hit here means a PR bypassed /ship.
    expect(rowFor(604).picture).toBe("missing");
    expect(report().missing).toBe(1);
  });

  it("splits waiver rates by lane, which is the comparison the meter exists for", () => {
    const { byLane } = report();
    expect(byLane.autonomous).toEqual({ merged: 3, waived: 1, missing: 1 });
    expect(byLane.dependabot).toEqual({ merged: 1, waived: 1, missing: 0 });
  });
});

describe("the landing meter — what it refuses to claim", () => {
  it("reads the un-fetched columns ABSENT, never as a zero", () => {
    // "0 reactions" and "we never asked GitHub" are different facts, and only one of them is
    // evidence that a picture did not land.
    const row = rowFor(601);
    expect(row.reactions).toBeNull();
    expect(row.hoursToMerge).toBeNull();
    expect(row.ericComments).toBeNull();
    expect(row.mergedBy).toBeNull();
  });

  it("says on the face of the table that those columns were never fetched", () => {
    const table = run("--table");
    expect(table).toContain("read ABSENT");
    expect(table).toContain("not the same as zero");
  });

  it("marks the report as un-enriched so a reader cannot mistake it for a full one", () => {
    expect(report().enriched).toBe(false);
  });
});

describe("the landing meter — loud failure", () => {
  it("errors on an unreadable fixture rather than reporting an empty week", () => {
    expect(() =>
      execFileSync("node", ["scripts/comms-scan.mjs", "--fixture=tests/fixtures/comms/nope.json"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).toThrow();
  });

  it("errors on a malformed --since rather than silently widening the window", () => {
    expect(() =>
      execFileSync("node", ["scripts/comms-scan.mjs", "--since=last-tuesday", "--offline"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).toThrow();
  });
});

describe("the landing meter — the table the digest folds in", () => {
  it("emits one markdown row per pull request, newest first as git ordered them", () => {
    const lines = run("--table").split("\n");

    expect(lines[0]).toContain("| PR | picture | lane |");
    expect(lines[2]).toContain("| #601 |");
    expect(lines.filter((l) => l.startsWith("| #"))).toHaveLength(7);
  });
});
