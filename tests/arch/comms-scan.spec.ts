import { execFileSync } from "node:child_process";
import { gitSince, harvestPictures, unwrapRows } from "../../scripts/comms-scan.mjs";
import {
  carryingPictureSlot,
  digestFiles,
  latestDigestSince,
  missingPictureSlot,
  RATCHET_AFTER,
} from "../../scripts/digest-scan.mjs";

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

describe("the landing meter — a window that starts at an exact moment (#5056)", () => {
  it("keeps a date's meaning: merged after the end of that day", () => {
    expect(gitSince("2026-10-09")).toBe("2026-10-09T23:59:59Z");
  });

  it("takes an instant with a zone, so a page answered at 16:42 starts the next reel at 16:42", () => {
    expect(gitSince("2026-10-10T16:42:00-05:00")).toBe("2026-10-10T21:42:00Z");
    expect(gitSince("2026-10-10T21:42:07.123Z")).toBe("2026-10-10T21:42:07Z");
  });

  it("refuses a time with no zone, which git would read in whatever zone the runner is in", () => {
    expect(() => gitSince("2026-10-10T16:42:00")).toThrow(/ISO instant with a zone/);
  });

  it("refuses an impossible instant on the command line before reading anything", () => {
    expect(() =>
      execFileSync("node", ["scripts/comms-scan.mjs", "--since=2026-10-10T25:99Z", "--offline"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).toThrow();
  });
});

// The digest's picture slot (#3748 slice 7c): the harvest of each merged PR's `## The picture`
// block. Driven through the same fixture, so the cases pin what a digest would print.
describe("the digest picture slot — what it harvests", () => {
  it("prints each PR's picture block newest first and skips the waived and the missing", () => {
    const out = run("--pictures");
    const heads = out.split("\n").filter((l) => l.startsWith("### "));
    expect(heads.map((h) => h.split(" ")[1])).toEqual(["#601", "#602", "#605"]);
    expect(out).toContain("```mermaid");
    expect(out).not.toContain("#603"); // waived: nothing to look at
    expect(out).not.toContain("#604"); // no picture section at all
  });

  it("caps at the newest N and says how many it left out, never silently truncating", () => {
    const out = run("--pictures", "--limit=2");
    expect(out.split("\n").filter((l) => l.startsWith("### "))).toHaveLength(2);
    expect(out).toContain("1 older picture(s) not shown");
  });

  it("refuses a --limit that is not a positive integer", () => {
    expect(() => run("--pictures", "--limit=0")).toThrow();
  });

  it("emits a block the mermaid gate accepts", () => {
    const out = run("--pictures");
    const lint = execFileSync("node", ["scripts/mermaid-lint.mjs", "--stdin"], {
      cwd: process.cwd(),
      input: out,
      encoding: "utf8",
    });
    expect(lint).not.toMatch(/✗|error/i);
  });

  it("keeps the harvested block out of the meter's own JSON rows", () => {
    expect(Object.keys(report().rows[0] ?? {})).not.toContain("block");
  });
});

describe("the digest picture slot — squash bodies wrap, the slot must not show it", () => {
  it("re-joins a table row the squash body wrapped, and nothing else", () => {
    const wrapped = [
      "| a | b |",
      "|---|---|",
      "| the long first",
      "cell | second |",
      "",
      "_Caption._",
    ].join("\n");
    expect(unwrapRows(wrapped)).toBe(
      ["| a | b |", "|---|---|", "| the long first cell | second |", "", "_Caption._"].join("\n"),
    );
  });

  it("leaves a fenced diagram untouched, even a line that starts with a pipe", () => {
    const fence = ["```mermaid", "flowchart LR", "| not a row", "  A --> B", "```"].join("\n");
    expect(unwrapRows(fence)).toBe(fence);
  });

  it("is what the harvest prints", () => {
    const rows = [
      {
        number: 9,
        subject: "feat: x",
        picture: "table",
        block: "| k | v |\n|---|---|\n| one\ntwo | 3 |",
      },
    ];
    expect(harvestPictures(rows)).toContain("| one two | 3 |");
  });

  // #8225: a wrap right after a pipe leaves a line that LOOKS finished. #8068's 5-column header
  // was stored like this, so the slot printed loose text where a table should be.
  it("re-joins a header wrapped right after a pipe, so the delimiter sits under one header row", () => {
    const wrapped = [
      "| Where it runs | Browser before | Browser after |",
      "Result before | Result after |",
      "|---|---|---|---|---|",
      "| Cloud | rev 1243 | rev 1234 | 16 failed | 17 passed |",
    ].join("\n");
    expect(unwrapRows(wrapped).split("\n")).toEqual([
      "| Where it runs | Browser before | Browser after | Result before | Result after |",
      "|---|---|---|---|---|",
      "| Cloud | rev 1243 | rev 1234 | 16 failed | 17 passed |",
    ]);
  });

  it("re-joins a body row wrapped right after a pipe, by the delimiter's column count", () => {
    const wrapped = [
      "| a | b | c |",
      "|---|---|---|",
      "| one | two |",
      "three |",
      "| four | five | six |",
    ].join("\n");
    expect(unwrapRows(wrapped).split("\n")).toEqual([
      "| a | b | c |",
      "|---|---|---|",
      "| one | two | three |",
      "| four | five | six |",
    ]);
  });

  it("keeps a genuinely short row apart from the next, rather than overshooting the columns", () => {
    const table = ["| a | b | c |", "|---|---|---|", "| short |", "| x | y | z |"].join("\n");
    expect(unwrapRows(table)).toBe(table);
  });

  it("counts an escaped pipe as cell text, not a column", () => {
    const wrapped = ["| a | b |", "|---|---|", "| x \\| y |", "z |"].join("\n");
    expect(unwrapRows(wrapped).split("\n").at(-1)).toBe("| x \\| y | z |");
  });

  it("leaves a caption paragraph after the blank line alone", () => {
    const table = ["| a | b |", "|---|---|", "| 1 | 2 |", "", "_A caption | with a pipe._"].join(
      "\n",
    );
    expect(unwrapRows(table)).toBe(table);
  });
});

// #8225: digests land ~13:25Z on their own date; a date-only window started at 23:59:59Z that day,
// so every PR merged between the digest and midnight UTC fell into no digest's slot.
describe("the digest picture slot — the window starts when the last digest landed", () => {
  const latest = digestFiles()[0];
  const date = latest?.slice(0, 10) ?? null;

  it("is the instant of the commit that added the newest digest, not the end of its day", () => {
    const calls: string[][] = [];
    const since = latestDigestSince((args: string[]) => {
      calls.push(args);
      return args[0] === "rev-parse" ? "false\n" : "2026-11-23T13:25:05Z\n";
    });
    if (!latest) return expect(since).toBeNull();
    expect(since).toBe("2026-11-23T13:25:05Z");
    expect(calls[1]).toEqual(
      expect.arrayContaining(["--diff-filter=A", "--", `docs/digests/${latest}`]),
    );
    expect(gitSince(since as string)).toBe("2026-11-23T13:25:05Z");
  });

  it("falls back to the date when the digest is not committed yet", () => {
    const since = latestDigestSince((args: string[]) => (args[0] === "rev-parse" ? "false" : ""));
    expect(since).toBe(date);
  });

  it("falls back to the date in a shallow clone, which would date every file at the graft", () => {
    const since = latestDigestSince((args: string[]) =>
      args[0] === "rev-parse" ? "true" : "2026-11-24T02:00:00Z",
    );
    expect(since).toBe(date);
  });

  it("falls back to the date when git itself fails", () => {
    const since = latestDigestSince(() => {
      throw new Error("not a git repository");
    });
    expect(since).toBe(date);
  });
});

describe("the digest picture slot — the advisory ratchet has a reader", () => {
  const files = ["2026-11-23.md", "2026-11-25.md", "2026-11-26.md", "2026-11-27.md"];
  const text = (f: string) => (f === "2026-11-26.md" ? "## The picture\n" : "no slot");

  it("names a digest from the advisory day on that lacks the slot, and never an older one", () => {
    expect(missingPictureSlot(files, text)).toEqual(["2026-11-25.md", "2026-11-27.md"]);
  });

  it("counts the digests that carry it, so the ratchet fires on a number", () => {
    expect(carryingPictureSlot(files, text)).toEqual(["2026-11-26.md"]);
    expect(RATCHET_AFTER).toBe(2);
  });
});
