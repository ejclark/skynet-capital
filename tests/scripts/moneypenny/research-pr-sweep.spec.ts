import { describe, expect, it } from "@rstest/core";
import { audit } from "../../../scripts/moneypenny/audit.mjs";
import {
  closeSupersededResearch,
  flagRedResearch,
  gatherResearchPrs,
  isSuperseded,
  lastAssessed,
  lastRedFlagSha,
  RESEARCH_PR_HOURS,
  RESEARCH_RED_MARKER,
  type ResearchPr,
  researchPrsOrNone,
  researchSweepIntents,
  researchSweepReport,
} from "../../../scripts/moneypenny/research-pr-sweep.mjs";

// #5689: an open `research/<id>` PR makes dueForResearch skip its event with no age limit. #5798 sat
// 177h CONFLICTING after #5787 landed the same 2026-10-19 pulse, and the apec pulse was dropped every
// tick. The sweep closes what `main` already carries, flags what is red, and counts each tick.

const NOW = Date.parse("2026-10-26T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 36e5).toISOString();
const EVENT = "apec-leaders-shenzhen-2026-11-18";
const SHA = "5798aaaa1";
const REPO = { full_name: "ejclark/skynet-capital" };

const ledger = (...dates: string[]) =>
  [`# APEC — ${EVENT}`, ...dates.map((d) => `**Last assessed:** ${d}`)].join("\n\n");
const b64 = (text: string) => ({
  content: Buffer.from(text).toString("base64"),
  encoding: "base64",
});

const listed = (over: Record<string, unknown> = {}) => ({
  number: 5798,
  title: `docs(research): ${EVENT} D-30 pulse`,
  draft: false,
  labels: [],
  created_at: hoursAgo(177),
  head: { ref: `research/${EVENT}`, sha: SHA, repo: REPO },
  base: { repo: REPO },
  ...over,
});
const check = (name: string, conclusion: string | null, h = 170) => ({
  name,
  status: "completed",
  conclusion,
  completed_at: hoursAgo(h),
  started_at: hoursAgo(h + 0.1),
  html_url: `https://github.com/x/actions/runs/1/job/${name}`,
});

/** A fake REST seam over one research PR's reads, recording every call. */
const fakeRest = (
  pr = listed(),
  {
    mergeable = false as boolean | null,
    head = ledger("2026-09-04", "2026-10-19") as string | null,
    checks = [check("verify", "success")],
    comments = [] as unknown[],
  } = {},
) => {
  const calls: string[] = [];
  const rest = (path: string) => {
    calls.push(path);
    if (path.startsWith("pulls?state=open")) return [pr];
    if (path === "pulls/5798") return { number: 5798, mergeable };
    if (path.startsWith(`contents/docs/research/events/${EVENT}.md?ref=${SHA}`)) {
      if (head === null) throw new Error("404 Not Found");
      return b64(head);
    }
    if (path.startsWith(`commits?path=docs/research/events/${EVENT}.md`)) return [{ sha: "c5787" }];
    if (path === "commits/c5787/pulls") return [{ number: 5787 }];
    if (path.startsWith(`commits/${SHA}/check-runs`)) return { check_runs: checks };
    if (path.startsWith("issues/5798/comments")) return comments;
    throw new Error(`unexpected read: ${path}`);
  };
  return { rest, calls };
};
const onMain = (text: string | null) => () => text;
const gather = (
  args: Parameters<typeof fakeRest> = [],
  main: string | null = ledger("2026-09-04", "2026-10-19"),
) => gatherResearchPrs(NOW, { rest: fakeRest(...args).rest, readMain: onMain(main) });

const candidate = (over: Partial<ResearchPr> = {}): ResearchPr => ({
  number: 5798,
  title: `docs(research): ${EVENT} D-30 pulse`,
  eventId: EVENT,
  branch: `research/${EVENT}`,
  hours: 177,
  headSha: SHA,
  superseded: null,
  red: null,
  flaggedSha: null,
  ...over,
});
const superseded = {
  prAssessed: "2026-10-19",
  mainAssessed: "2026-10-19",
  successor: { sha: "c5787", pr: 5787 },
};

describe("lastAssessed — the ledger's machine contract, last occurrence wins", () => {
  it("reads the newest appended date, never the header's first", () => {
    expect(lastAssessed(ledger("2026-09-04", "2026-10-19", "2026-10-27"))).toBe("2026-10-27");
  });
  it("is null for a ledger with no assessment, or none at all", () => {
    expect(lastAssessed("# nothing here")).toBeNull();
    expect(lastAssessed(null)).toBeNull();
  });
});

describe("isSuperseded — main must already carry the PR's assessment or a later one", () => {
  it("WHEN it conflicts and main is assessed the same day, it is superseded (#5798 vs #5787)", () => {
    expect(isSuperseded({ conflicting: true, ...superseded })).toBe(true);
  });
  it("WHEN main is assessed later, it is superseded", () => {
    const later = { prAssessed: "2026-10-19", mainAssessed: "2026-10-27" };
    expect(isSuperseded({ conflicting: true, ...later })).toBe(true);
  });
  // Two pulses on different dates are both wanted: a newer PR is the conflict repair's to merge.
  it("WHEN the PR carries a newer assessment than main, it is not", () => {
    const newer = { prAssessed: "2026-10-27", mainAssessed: "2026-10-19" };
    expect(isSuperseded({ conflicting: true, ...newer })).toBe(false);
  });
  it("WHEN it merges cleanly, it is the re-arm's to land, not this sweep's to close", () => {
    expect(isSuperseded({ conflicting: false, ...superseded })).toBe(false);
  });
  it("WHEN either ledger has no date, nothing is decided", () => {
    expect(isSuperseded({ conflicting: true, prAssessed: null, mainAssessed: "2026-10-19" })).toBe(
      false,
    );
    expect(isSuperseded({ conflicting: true, prAssessed: "2026-10-19", mainAssessed: null })).toBe(
      false,
    );
  });
});

describe("gatherResearchPrs — which research PRs have sat open past the floor", () => {
  it("reads a conflicting PR whose pulse main already carries as superseded, naming the PR that landed it", () => {
    expect(RESEARCH_PR_HOURS).toBe(6);
    expect(gather()).toEqual([
      expect.objectContaining({ number: 5798, eventId: EVENT, hours: 177, superseded, red: null }),
    ]);
  });

  it("leaves a conflicting PR with a newer pulse than main unsuperseded", () => {
    const head = ledger("2026-09-04", "2026-10-27");
    expect(gather([listed(), { head }])[0]?.superseded).toBeNull();
  });

  it("leaves a PR whose head has no ledger unsuperseded", () => {
    expect(gather([listed(), { head: null }])[0]?.superseded).toBeNull();
  });

  it("does not read the ledgers of a PR that merges cleanly", () => {
    const { rest, calls } = fakeRest(listed(), { mergeable: true });
    gatherResearchPrs(NOW, { rest, readMain: onMain(ledger("2026-10-19")) });
    expect(calls.some((c) => c.startsWith("contents/"))).toBe(false);
  });

  it("reads red from a failed check that holds it, with the head the last flag named", () => {
    const flagged = { body: `old <!-- moneypenny:research-red sha=${SHA} -->` };
    const [pr] = gather([
      listed(),
      { mergeable: true, checks: [check("verify", "failure")], comments: [flagged] },
    ]);
    expect(pr).toMatchObject({
      red: { name: "verify", url: "https://github.com/x/actions/runs/1/job/verify" },
      flaggedSha: SHA,
    });
  });

  it("costs one call on a tick with no research PR past the floor", () => {
    const { rest, calls } = fakeRest(listed({ created_at: hoursAgo(5) }));
    expect(gatherResearchPrs(NOW, { rest, readMain: onMain(null) })).toEqual([]);
    expect(calls).toEqual(["pulls?state=open&per_page=100&page=1"]);
  });

  it.each([
    ["a lane branch", { head: { ref: "feedback/5689", sha: SHA, repo: REPO } }],
    ["a draft", { draft: true }],
    ["a held PR", { labels: [{ name: "hold-merge" }] }],
    // The close deletes `research/<id>` here; a fork's same-named branch must never reach that.
    [
      "a fork's branch of the same name",
      { head: { ref: `research/${EVENT}`, sha: SHA, repo: { full_name: "someone/fork" } } },
    ],
  ])("skips %s", (_name, over) => {
    expect(gather([listed(over)])).toEqual([]);
  });
});

describe("researchPrsOrNone — soft, so one failed read costs this sweep and not the audit", () => {
  it("returns null and says so when the read fails", () => {
    const lines: string[] = [];
    const rest = () => {
      throw new Error("502 Bad Gateway");
    };
    expect(researchPrsOrNone(NOW, { rest, log: (l) => lines.push(l) })).toBeNull();
    expect(lines[0]).toContain("::warning::research PR sweep skipped — 502 Bad Gateway");
  });
});

describe("researchSweepIntents — close what main carries, flag red once per head", () => {
  it("closes a superseded PR, naming its successor and the event it was holding", () => {
    const [i] = researchSweepIntents([candidate({ superseded })]);
    expect(i).toMatchObject({
      kind: "close-superseded-research",
      prNumber: 5798,
      branch: `research/${EVENT}`,
      successor: { pr: 5787 },
    });
    expect(i?.body).toContain("landed by #5787");
    expect(i?.body).toContain(`the research lane skipped \`${EVENT}\``);
    expect(i?.body).toContain("git fetch origin pull/5798/head");
  });

  it("names the commit when GitHub links no PR to it", () => {
    const s = { ...superseded, successor: { sha: "c5787abcdef0", pr: null } };
    const [i] = researchSweepIntents([candidate({ superseded: s })]);
    expect(i?.body).toContain("landed by commit c5787abcd");
  });

  it("closes rather than flags a PR both superseded and red", () => {
    const red = { name: "verify", url: "u" };
    const kinds = researchSweepIntents([candidate({ superseded, red })]).map((i) => i.kind);
    expect(kinds).toEqual(["close-superseded-research"]);
  });

  it("flags a red PR with a marker naming its head", () => {
    const [i] = researchSweepIntents([candidate({ red: { name: "verify", url: "u" } })]);
    expect(i?.kind).toBe("flag-red-research");
    expect(RESEARCH_RED_MARKER.exec(i?.body ?? "")?.[1]).toBe(SHA);
    expect(lastRedFlagSha([{ body: i?.body }])).toBe(SHA);
  });

  it("flags the same head once", () => {
    const red = { name: "verify", url: "u" };
    expect(researchSweepIntents([candidate({ red, flaggedSha: SHA })])).toEqual([]);
  });

  it("flags again once a new head goes red", () => {
    const red = { name: "verify", url: "u" };
    expect(researchSweepIntents([candidate({ red, flaggedSha: "older" })])).toHaveLength(1);
  });

  it("leaves a PR that is neither alone", () => {
    expect(researchSweepIntents([candidate()])).toEqual([]);
  });
});

describe("researchSweepReport — the After for the issue's Before", () => {
  it("counts re-armed, closed, flagged and left among the research PRs past the floor", () => {
    const cs = [
      candidate({ number: 1, superseded }),
      candidate({ number: 2, red: { name: "verify" } }),
      candidate({ number: 3 }),
      candidate({ number: 4 }),
    ];
    const sweep = researchSweepIntents(cs);
    // #9 is a re-armed PR that is not a research PR past the floor: not ours to count.
    const report = researchSweepReport(cs, sweep, [{ prNumber: 3 }, { prNumber: 9 }]);
    expect(report).toMatchObject({ open: 4, rearmed: 1, closed: 1, flagged: 1, left: 1 });
    expect(report.line).toBe(
      "research PR sweep — 4 open past 6h: re-armed 1, closed 1 as superseded, flagged 1 red, left 1",
    );
  });
});

describe("audit — the research deps feed the intent list", () => {
  // A dial read at a working position: an unread one holds every act (#6887). A spec that sets its
  // own `workMode` (the halt case) overrides it.
  const normal = { trackingIssue: 1, title: null, mode: { position: "normal" } };
  const withDial = (deps: Parameters<typeof audit>[0]) =>
    ({ workMode: normal, ...deps }) as unknown as Parameters<typeof audit>[0];
  const kinds = (deps: Parameters<typeof audit>[0]) =>
    audit(withDial(deps)).map((i: { kind: string }) => i.kind);

  it("emits the acts and the count from deps.researchPrs", () => {
    expect(kinds({ researchPrs: [candidate({ superseded })] })).toEqual(
      expect.arrayContaining(["close-superseded-research", "report-research-sweep"]),
    );
  });

  it("reports a zero count on a tick that read no research PR past the floor", () => {
    const [report] = audit({ researchPrs: [] }).filter((i) => i.kind === "report-research-sweep");
    expect(report).toMatchObject({ open: 0, left: 0 });
  });

  it("reports nothing on a tick whose read failed", () => {
    expect(kinds({ researchPrs: null })).not.toContain("report-research-sweep");
  });

  it("counts a research PR the re-arm took this tick", () => {
    const stranded = [
      { number: 5798, title: "t", hours: 9, headSha: SHA, armRunId: 1, rearmedSha: null },
    ];
    const [report] = audit(withDial({ researchPrs: [candidate()], stranded })).filter(
      (i) => i.kind === "report-research-sweep",
    );
    expect(report).toMatchObject({ rearmed: 1, left: 0 });
  });

  it("acts on nothing at halt, and still reports", () => {
    // Only `position` matters here; the rest of the dial's shape is the work-mode spec's business.
    const workMode = { trackingIssue: 1, title: null, mode: { position: "halt" } };
    const out = kinds({
      researchPrs: [candidate({ superseded })],
      workMode,
    } as unknown as Parameters<typeof audit>[0]);
    expect(out).not.toContain("close-superseded-research");
    expect(out).toContain("report-research-sweep");
  });
});

describe("the acts", () => {
  it("closes the PR first, then deletes its branch", () => {
    const calls: string[][] = [];
    const [i] = researchSweepIntents([candidate({ superseded })]);
    const line = closeSupersededResearch(i as Parameters<typeof closeSupersededResearch>[0], {
      run: (cmd, args) => {
        calls.push([cmd, ...args]);
        return "";
      },
    });
    expect(calls[0]?.slice(0, 4)).toEqual(["gh", "pr", "close", "5798"]);
    expect(calls[1]).toEqual([
      "gh",
      "api",
      "-X",
      "DELETE",
      `repos/{owner}/{repo}/git/refs/heads/research/${EVENT}`,
    ]);
    expect(line).toContain("via #5787");
  });

  it("leaves the branch when the close fails, so nothing changed and the next push retries", () => {
    const calls: string[][] = [];
    const [i] = researchSweepIntents([candidate({ superseded })]);
    expect(() =>
      closeSupersededResearch(i as Parameters<typeof closeSupersededResearch>[0], {
        run: (cmd, args) => {
          calls.push([cmd, ...args]);
          throw new Error("403");
        },
      }),
    ).toThrow("403");
    expect(calls).toHaveLength(1);
  });

  it("flags with one PR comment", () => {
    const calls: string[][] = [];
    const [i] = researchSweepIntents([candidate({ red: { name: "verify", url: "u" } })]);
    flagRedResearch(i as Parameters<typeof flagRedResearch>[0], {
      run: (cmd, args) => {
        calls.push([cmd, ...args]);
        return "";
      },
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.slice(0, 4)).toEqual(["gh", "pr", "comment", "5798"]);
  });
});
