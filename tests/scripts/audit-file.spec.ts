import { describe, expect, it } from "@rstest/core";
import {
  bugCapsule,
  fastTrackable,
  fileAll,
  findExisting,
  lintAll,
  MAX_FAST_TRACK,
  main,
  planFilings,
  proposalCapsule,
  receiptFor,
  scopeOf,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/audit-file.mjs";
import { type Reply, runWorkflow } from "../support/run-workflow";

// #7311 slice 2. WHEN an audit returns confirmed findings, each SHALL be filed as a `bug` + `feedback`
// + `fast-track` capsule (duplicates commented, not refiled), and each prevention proposal as one
// `feedback` issue. And the marker moves last: only when everything filed and no PR came back unread.

type Finding = Record<string, unknown>;
const finding = (over: Finding = {}): Finding => ({
  pr: 7284,
  tier: "deep",
  lens: "correctness",
  severity: "high",
  file: "app/src/shell/position-thread.tsx",
  line: 26,
  summary: "A position thread's link opens the member's default account, not the thread's.",
  failure_scenario:
    "A member with a bot as default taps a thread link and lands on the bot's blotter.",
  trace: "position-thread.tsx:26 → accounts.tsx:199",
  repro: "expected 'Account: Sauron' to match /Eric/",
  ...over,
});
const proposal = {
  cause: "a record keyed on the original order id",
  kind: "reviewer line",
  target: ".claude/agents/reviewer.md",
  line: "List every broker lifecycle step that changes the id.",
  why: "replace and assignment are both such steps",
  findings: [
    { pr: 7269, file: "src/domain/quest-score.ts", summary: "assigned put reads as +100%" },
    { pr: 7269, file: "src/domain/quest-score.ts", summary: "replaced order never scored" },
  ],
};
const result = (over: Finding = {}) => ({
  confirmed: [finding()],
  prevention: { proposals: [], otherCauses: [] },
  reviewed: [7284],
  unreviewed: [],
  ...over,
});

describe("what earns fast-track (#6319)", () => {
  it("is product code, not the machinery that feeds the lanes", () => {
    expect(fastTrackable("app/src/shell/position-thread.tsx")).toBe(true);
    expect(fastTrackable("src/trading/orders.ts")).toBe(true);
    expect(fastTrackable("scripts/bots-start.sh")).toBe(true);
    for (const lane of [
      "tests/scripts/x.spec.ts",
      "package.json",
      "app/scripts/x.mjs",
      ".github/workflows/pipeline.yml",
      ".claude/workflows/grind.js",
      "scripts/moneypenny/labels.mjs",
    ])
      expect(fastTrackable(lane)).toBe(false);
  });

  it("is rationed per run, most severe first, the rest filed without it", () => {
    const many = Array.from({ length: MAX_FAST_TRACK + 3 }, (_, i) =>
      finding({
        pr: 100 + i,
        file: `src/trading/f${i}.ts`,
        severity: i === 7 ? "high" : "medium",
        summary: `defect number ${i}`,
      }),
    );
    const plan = planFilings(result({ confirmed: many }));
    const fast = plan.filter((p: { labels: string[] }) => p.labels.includes("fast-track"));
    expect(fast).toHaveLength(MAX_FAST_TRACK);
    expect(plan[7].labels).toContain("fast-track"); // the one high finding is never the one dropped
    expect(
      plan.every(
        (p: { labels: string[] }) => p.labels.includes("bug") && p.labels.includes("feedback"),
      ),
    ).toBe(true);
  });

  it("files a lane-machinery defect as bug + feedback only, and says why", () => {
    const [bug] = planFilings(
      result({ confirmed: [finding({ file: ".github/workflows/pipeline.yml" })] }),
    );
    expect(bug.labels).toEqual(["bug", "feedback"]);
    expect(bug.body).toContain("Not fast-tracked");
  });
});

describe("the capsules", () => {
  it("lint clean, lead with the ask, and name where it was found", () => {
    const plan = planFilings(result({ prevention: { proposals: [proposal] } }));
    expect(lintAll(plan)).toEqual([]);
    const [bug, prevent] = plan;
    expect(bug.title).toBe(
      "fix(shell): a position thread's link opens the member's default account, not the thread's",
    );
    expect(bug.body).toContain("Found in PR #7284");
    expect(bug.body).toContain("`app/src/shell/position-thread.tsx:26`");
    expect(prevent.labels).toEqual(["feedback"]);
    expect(prevent.body).toContain("No LESSONS.md entry named this");
  });

  it("stay inside the lint limits however long the agents ran on", () => {
    const long = (w: string) => `${w} `.repeat(400);
    const plan = planFilings(
      result({
        confirmed: [
          finding({
            summary: long("alpha"),
            failure_scenario: long("bravo"),
            trace: long("charlie"),
            repro: long("delta"),
          }),
        ],
        prevention: {
          proposals: [
            { ...proposal, cause: long("echo"), line: long("foxtrot"), why: long("golf") },
          ],
        },
      }),
    );
    expect(lintAll(plan)).toEqual([]);
    for (const p of plan) expect(p.title.length).toBeLessThanOrEqual(120);
  });

  it("marks a finding that only the trace stood behind", () => {
    expect(bugCapsule(finding({ singleLens: true }), { fastTrack: true }).body).toContain(
      "trace alone",
    );
  });

  it("undoes the HTML escaping and defuses an @mention", () => {
    const { body } = bugCapsule(
      finding({ failure_scenario: "&lt;b&gt;ping&lt;/b&gt; @someone and @types/node" }),
      { fastTrack: false },
    );
    expect(body).toContain("<b>ping</b>");
    expect(body).not.toMatch(/@someone|@types/);
  });

  it("keeps agent text from closing the fold or the table", () => {
    const { body } = bugCapsule(
      finding({
        file: "src/x|y`z.ts",
        summary: "a </details> b",
        trace: "```\n</details>\n## Heading",
        repro: "&lt;/details&gt;",
      }),
      { fastTrack: true },
    );
    expect(body.match(/<\/details>/g)).toHaveLength(1); // the capsule's own closing tag only
    expect(body).toContain("`src/x_y_z.ts:26`");
    expect(body).toContain("````text"); // a fence longer than the agent's own
  });

  it("reads a scope off the path", () => {
    expect(scopeOf("app/src/shell/x.tsx")).toBe("shell");
    expect(scopeOf("src/trading/x.ts")).toBe("trading");
    expect(scopeOf(".github/workflows/x.yml")).toBe("ci");
    expect(scopeOf("scripts/x.mjs")).toBe("scripts");
  });

  it("puts a lesson on the proposal when the grouper found one", () => {
    expect(
      proposalCapsule({ ...proposal, lesson: "exit status is lost in a pipe" }).body,
    ).toContain("LESSONS.md already names it");
  });
});

describe("duplicates are commented, not refiled", () => {
  const open = [
    {
      number: 7305,
      title: "fix(shell): a position thread's link opens the default account",
      labels: [{ name: "bug" }],
      body: "Found in PR #7284 app/src/shell/position-thread.tsx",
    },
  ];

  it("finds one by a similar title, or by the same PR and file with half the words shared", () => {
    const [same] = planFilings(result());
    expect(findExisting(same, open)?.number).toBe(7305);
    const reworded = {
      ...same,
      title: "fix(shell): a thread link lands on the default account, not the thread account",
    };
    expect(findExisting(reworded, open)?.number).toBe(7305);
    expect(findExisting({ ...reworded, pr: 1 }, open)).toBeUndefined();
  });

  it("files a second, different defect in the same PR and file", () => {
    const [other] = planFilings(
      result({ confirmed: [finding({ summary: "Rail threads vanish after a reload", line: 90 })] }),
    );
    expect(findExisting(other, open)).toBeUndefined();
  });

  it("does not read PR #12 as PR #123", () => {
    const [bug] = planFilings(result({ confirmed: [finding({ pr: 12 })] }));
    const reworded = { ...bug, title: "fix(shell): a thread link lands on the default account" };
    expect(findExisting(reworded, open)).toBeUndefined();
  });

  it("comments on the existing issue and files nothing", () => {
    const writes: string[] = [];
    const report = fileAll(planFilings(result()), {
      open,
      create: () => {
        writes.push("create");
        return { number: 1 };
      },
      comment: (n: number) => writes.push(`comment ${n}`),
    });
    expect(writes).toEqual(["comment 7305"]);
    expect(report[0]).toMatchObject({ did: "commented", n: 7305 });
  });

  it("treats two like findings in one run as one issue", () => {
    const made: string[] = [];
    const twice = result({ confirmed: [finding(), finding({ line: 40 })] });
    fileAll(planFilings(twice), {
      open: [],
      create: (i: { title: string }) => {
        made.push(i.title);
        return { number: 9000 + made.length };
      },
      comment: (n: number) => made.push(`comment ${n}`),
    });
    expect(made).toHaveLength(2);
    expect(made[1]).toBe("comment 9001");
  });
});

describe("the receipt and the marker", () => {
  it("moves the marker only when no PR came back unreviewed", () => {
    expect(receiptFor(result(), "abc1234")).toMatchObject({
      prs: "7284",
      confirmed: 1,
      through: "abc1234",
    });
    const held = receiptFor(
      result({ unreviewed: [{ pr: 7283, why: "no reviewer came back" }] }),
      "abc1234",
    );
    expect(held.through).toBeUndefined();
    expect(held.note).toContain("marker NOT moved");
  });

  it("records no through for a hand-picked batch, and nothing when no PR was reviewed", () => {
    expect(receiptFor(result(), undefined).through).toBeUndefined();
    expect(receiptFor(result({ reviewed: [] }), "abc1234").skip).toBeTruthy();
  });
});

describe("the CLI", () => {
  const io = (log: string[]) => ({
    open: [],
    create: (i: { title: string }) => {
      log.push(`create ${i.title}`);
      return { number: 8000 };
    },
    comment: () => undefined,
  });
  const run = (
    args: string[],
    res: unknown,
    log: string[],
    record = (r: unknown) => `recorded ${JSON.stringify(r)}`,
  ) => main(args, { read: () => JSON.stringify(res), io: io(log), record });

  it("files, then records the receipt with the marker", () => {
    const log: string[] = [];
    const out = run(["r.json", "--through", "abc1234"], result(), log);
    expect(log).toHaveLength(1);
    expect(out).toContain("filed #8000 [bug,feedback,fast-track]");
    expect(out).toContain('"through":"abc1234"');
  });

  it("leaves the marker where it was when filing throws", () => {
    let recorded = false;
    const boom = {
      ...io([]),
      create: () => {
        throw new Error("403");
      },
    };
    expect(() =>
      main(["r.json", "--through", "abc1234"], {
        read: () => JSON.stringify(result()),
        io: boom,
        record: () => {
          recorded = true;
          return "";
        },
      }),
    ).toThrow("403");
    expect(recorded).toBe(false);
  });

  it("writes nothing on --dry-run, and previews a duplicate as a comment", () => {
    const log: string[] = [];
    const seen = {
      ...io(log),
      open: [
        {
          number: 7305,
          title: "fix(shell): a position thread's link opens the default account",
          labels: [],
          body: "",
        },
      ],
    };
    const out = main(["r.json", "--dry-run", "--through", "abc1234"], {
      read: () => JSON.stringify(result()),
      io: seen,
      record: () => {
        throw new Error("recorded on a dry run");
      },
    });
    expect(log).toEqual([]);
    expect(out).toContain("would comment on #7305");
    expect(out).toContain("would record");
  });

  it("names what already landed when a write fails midway", () => {
    let made = 0;
    const flaky = {
      ...io([]),
      create: () => {
        made += 1;
        if (made === 2) throw new Error("403");
        return { number: 8000 + made };
      },
    };
    const two = result({
      confirmed: [finding(), finding({ pr: 7283, file: "src/a.ts", summary: "other defect here" })],
    });
    expect(() =>
      main(["r.json"], { read: () => JSON.stringify(two), io: flaky, record: () => "" }),
    ).toThrow("already landed before it failed: #8001");
  });

  it("refuses the whole run before a write on a result of the wrong shape", () => {
    const log: string[] = [];
    expect(() => run(["r.json"], { survivors: [] }, log)).toThrow("not a post-merge-audit result");
    expect(() => run(["r.json"], result({ confirmed: [{ pr: 1 }] }), log)).toThrow("lack pr, file");
    expect(log).toEqual([]);
  });

  it("says so when nothing was confirmed, and still records the receipt", () => {
    const out = run(["r.json"], result({ confirmed: [] }), []);
    expect(out).toContain("nothing confirmed");
    expect(out).toContain("recorded");
  });

  it("refuses a through that is not a commit sha", () => {
    expect(() => run(["r.json", "--through", "tomorrow"], result(), [])).toThrow("commit sha");
  });
});

describe("the audit workflow's file: true path", () => {
  const reply =
    (found: Finding[], filing: unknown = { ran: true, exit: 0, output: "filed #8000" }): Reply =>
    (_prompt, { label }) => {
      if (label === "work-mode")
        return { found: true, dispatch: true, position: "normal", grindWidth: 200 };
      if (label === "dead agents") return { left: [] };
      if (label === "prevention") return { causes: [] };
      if (label === "file") return filing;
      if (label?.startsWith("triage")) return { merged: true, files: ["x.ts"], protected: false };
      if (label?.startsWith("review")) return { merged: true, findings: found };
      return { refuted: false, evidence: "e" };
    };
  const high = [
    { severity: "high", file: "src/trading/x.ts", summary: "s", failure_scenario: "f" },
  ];
  const fileCall = (calls: { prompt: string; opts: { label?: string } }[]) =>
    calls.find((c) => c.opts.label === "file");

  it("files nothing by default", async () => {
    const { calls, result } = await runWorkflow("post-merge-audit", { prs: [6501] }, reply(high));
    expect(fileCall(calls)).toBeUndefined();
    expect(result).not.toHaveProperty("filing");
  });

  it("hands the confirmed findings to the script, through the sha, on a worker", async () => {
    const args = { prs: [6501], file: true, through: "abc1234" };
    const { calls, result, logs } = await runWorkflow("post-merge-audit", args, reply(high));
    const call = fileCall(calls);
    expect(call?.opts).toMatchObject({ agentType: "worker", phase: "File" });
    expect(call?.prompt).toContain("node scripts/audit-file.mjs");
    expect(call?.prompt).toContain("--through abc1234");
    expect(call?.prompt).toContain('"src/trading/x.ts"');
    expect(result).toMatchObject({ reviewed: [6501], filing: { exit: 0 } });
    expect(logs.join("\n")).not.toContain("record it:"); // the script records the receipt
  });

  it("says the marker did not move when the filing agent never came back", async () => {
    const { result, logs } = await runWorkflow(
      "post-merge-audit",
      { prs: [6501], file: true, through: "abc1234" },
      reply(high, null),
    );
    expect(result).toMatchObject({ filing: { exit: 1 } });
    expect(logs.join("\n")).toContain("FILING FAILED");
  });

  it("offers --through on the manual receipt line only when every PR was read", async () => {
    const read = await runWorkflow(
      "post-merge-audit",
      { prs: [6501], through: "abc1234" },
      reply([]),
    );
    expect(read.logs.join("\n")).toContain("--prs 6501 --confirmed 0 --through abc1234");
    const gone: Reply = (p, o) =>
      o.label?.startsWith("triage")
        ? { merged: false, files: [], protected: false }
        : reply([])(p, o);
    const held = await runWorkflow("post-merge-audit", { prs: [6501], through: "abc1234" }, gone);
    expect(held.logs.join("\n")).toContain("marker not moved");
    expect(held.logs.join("\n")).not.toContain("--confirmed 0 --through");
  });

  it("refuses a through that is not a commit sha before any agent runs", async () => {
    const { error, calls } = await runWorkflow(
      "post-merge-audit",
      { prs: [6501], through: "soon" },
      reply([]),
    );
    expect(error?.message).toContain("commit sha");
    expect(calls).toHaveLength(0);
  });
});
