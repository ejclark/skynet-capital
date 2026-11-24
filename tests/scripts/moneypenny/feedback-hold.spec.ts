import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { staleInProgressFrom } from "../../../scripts/moneypenny/audit.mjs";
import { holdForSession, sessionHoldRefusal } from "../../../scripts/moneypenny/index.mjs";
import { notPullable } from "../../../scripts/moneypenny/labels.mjs";
import { leasedFromRefs, planPrInProgress } from "../../../scripts/moneypenny/pr-in-progress.mjs";
import { LANE_HOLDER, SESSION_HOLDER } from "../../../scripts/moneypenny/session-hold.mjs";

// A SESSION'S HOLD COVERS A MULTI-PR FEEDBACK ISSUE, NOT ONLY A PLAN (#8314). On 2026-11-24, in the
// #8161 surge, a child session took #8249 at 06:22 with a label only. Its first PR merged at 07:07,
// the PR-derived sync took `in-progress` off, and the feedback lane claimed #8249 at 07:16 and built
// the session's second PR beside it (#8300 merged, #8299 superseded). #8248 went the same way an
// hour later. #6065 had closed this for plans: `leasedFromRefs` asked `isSessionHeld` on `plan-<n>`
// only, and the feedback claim reclaimed a session's lease as stale at the 2h TTL from its stamp.
//
// These specs replay that order of events (session holds feedback-N; its first PR merges; the lane
// claims) with the hold the session now takes. The hold is stamped more than 2h before the merge,
// the case a multi-PR session reaches and the one the code alone got wrong: before the fix the sync
// removed the label and the claim reclaimed the lease; after it, both leave the session alone.

const TTL = 2 * 60 * 60 * 1000;
const at = (hhmm: string) => Date.parse(`2026-11-24T${hhmm}Z`);
const HELD_AT = "04:50:00"; // the session's --hold feedback-8249, 2h17m before PR 1 merged
const MERGED_AT = "07:07:56"; // PR 1 (#8281) merges; the sync handles its close
const CLAIM_AT = "07:16:28"; // the feedback lane's claim on #8249

/** The lease refs as GitHub would answer them at `nowMs`: one session hold on feedback-8249. */
const refsAt = (nowMs: number) => ({
  // `isClaimed`: a live lease is one younger than the TTL from its stamp.
  claimed: (slug: string) => slug === "feedback-8249" && nowMs - at(HELD_AT) < TTL,
  // `isSessionHeld`: blind to the stamp's age; the merge being handled is the activity.
  held: (slug: string) => slug === "feedback-8249",
});

describe("step 1 — the merge of the session's first PR keeps in-progress on", () => {
  it("counts the session's feedback hold as a lease, whatever the stamp's age", () => {
    expect(leasedFromRefs(8249, refsAt(at(MERGED_AT)))).toBe(true);
  });

  it("so the release plan keeps the label (the 07:07:56 removal does not happen)", () => {
    const leased = leasedFromRefs(8249, refsAt(at(MERGED_AT)));
    const [row] = planPrInProgress({
      event: "closed",
      facts: [{ number: 8249, isOpenIssue: true, hasLabel: true, leased }],
    });
    expect(row).toMatchObject({ action: "none", reason: "a live claim lease still holds it" });
  });

  it("keeps the plan hold it already had (#6065)", () => {
    expect(leasedFromRefs(5482, { claimed: () => false, held: (s) => s === "plan-5482" })).toBe(
      true,
    );
  });

  it("still removes the label when nothing holds the issue", () => {
    expect(leasedFromRefs(8249, { claimed: () => false, held: () => false })).toBe(false);
  });
});

describe("step 2 — the lane's claim honours a live session hold past the TTL", () => {
  const session = { takenMs: at(HELD_AT), holder: SESSION_HOLDER };

  it("refuses while the issue showed activity inside the TTL (a label or comment at 07:07:56)", () => {
    const reason = sessionHoldRefusal(
      { updated_at: "2026-11-24T07:07:56Z" },
      session,
      at(CLAIM_AT),
    );
    expect(reason).toBe("held by a live claim (a session's hold, last activity 9m ago)");
  });

  it("lets the claim through once the session has gone quiet for the TTL (a crashed session)", () => {
    const quiet = sessionHoldRefusal({ updated_at: "2026-11-24T05:00:00Z" }, session, at(CLAIM_AT));
    expect(quiet).toBeNull();
  });

  it("leaves a lane's own lease and a missing lease to claimHandoff, as before", () => {
    const lane = { takenMs: at(HELD_AT), holder: LANE_HOLDER };
    expect(
      sessionHoldRefusal({ updated_at: "2026-11-24T07:07:56Z" }, lane, at(CLAIM_AT)),
    ).toBeNull();
    expect(
      sessionHoldRefusal({ updated_at: "2026-11-24T07:07:56Z" }, null, at(CLAIM_AT)),
    ).toBeNull();
  });
});

// The wiring, under a fake `gh` (admission-race.spec.ts's pattern): the real feedback claim at
// 07:16:28 finds the session's lease from 04:50 on feedback-8249. Before the fix it read the lease
// as stale, deleted it and took its own; now it refuses and writes nothing.
describe("claimFeedback — the 2026-11-24 claim on a session-held issue", () => {
  let dir: string;
  let log: string;
  let out: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "feedback-hold-"));
    log = join(dir, "gh.log");
    out = join(dir, "output");
    writeFileSync(out, "");
    const curl = join(dir, "curl");
    writeFileSync(curl, "#!/bin/sh\nexit 22\n");
    chmodSync(curl, 0o755);
    const fake = join(dir, "gh");
    writeFileSync(
      fake,
      [
        "#!/bin/sh",
        `printf '%s\\n' "$*" >> "${log}"`,
        'case "$*" in',
        `  *git/ref/tags/claim/feedback-8249*) echo '{"object":{"sha":"leasesha"}}' ;;`,
        `  *git/tags/leasesha*) printf '%s' '{"tagger":{"date":"2026-11-24T04:50:00Z"},"message":"lease taken 2026-11-24T04:50:00.000Z\\nholder: session"}' ;;`,
        `  *git/tags*) echo '{"sha":"stamp"}' ;;`,
        "  *comments?per_page=100*) ;;",
        `  *"api repos/{owner}/{repo}/issues/4153 "*) echo '{"labels":[{"name":"work-mode:normal"}]}' ;;`,
        "  *labels=in-progress*) echo '[]' ;;",
        "  *issues/*/events*) ;;",
        `  *"api repos/{owner}/{repo}/issues/"[0-9]*) echo '{"number":8249,"state":"open","labels":[{"name":"feedback"},{"name":"ready"}]}' ;;`,
        "  *) echo '{}' ;;",
        "esac",
        "",
      ].join("\n"),
    );
    chmodSync(fake, 0o755);
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("refuses the claim, and never deletes or takes the session's lease", () => {
    const issue = {
      number: 8249,
      state: "open",
      body: "",
      labels: [{ name: "feedback" }, { name: "ready" }],
      updated_at: "2026-11-24T07:07:56Z",
    };
    const stdout = execFileSync(
      "node",
      [
        "-e",
        `import("./scripts/moneypenny/index.mjs").then((m) => { const r = m.claimFeedback({ payload: { issue: ${JSON.stringify(issue)} } }, ${at(CLAIM_AT)}, "abc"); console.log(JSON.stringify(r)); })`,
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, GITHUB_OUTPUT: out },
      },
    );
    const calls = readFileSync(log, "utf8").trim().split("\n");
    expect(calls.some((c) => c.includes("-X DELETE"))).toBe(false);
    expect(calls.some((c) => c.includes("git/refs") && c.includes("-X POST"))).toBe(false);
    expect(calls.some((c) => c.includes("--add-label in-progress"))).toBe(false);
    expect(readFileSync(out, "utf8")).not.toContain("number=");
    expect(JSON.parse(stdout.trim().split("\n").at(-1) ?? "{}")).toEqual({
      claimed: false,
      reason: "held by a live claim (a session's hold, last activity 9m ago)",
    });
  }, 20_000);
});

describe("the skills take the hold for a multi-PR feedback issue (fix 3 and 4)", () => {
  it("/work-issues step 3 holds and releases feedback-<n>, not only plan-<n>", () => {
    const text = readFileSync(".claude/skills/work-issues/SKILL.md", "utf8");
    expect(text).toContain("--hold feedback-<n>");
    expect(text).toMatch(/--release plan-<n>` \(or `feedback-<n>`\)/);
  });

  it("/surge's child prompt names the hold for a multi-PR issue", () => {
    const text = readFileSync(".claude/skills/surge/SKILL.md", "utf8");
    expect(text).toContain("--hold feedback-<n>");
  });
});

// THE CLOUD CONSTRAINT (measured 2026-11-24, the same night): a cloud session's proxy refuses the
// claim-ref write with HTTP 403, but an issue-label write over REST goes through. So `--hold`
// falls back to the `session-held` label, which the one pull rule refuses, for every claim path.
describe("the cloud path — the ref write is refused, the label holds", () => {
  const refused = () => ({
    claimed: false,
    reason:
      "could not create the lease — gh: Write access to this GitHub API path is not permitted through this proxy. (HTTP 403)",
  });
  const recorder = (ok = true) => {
    const calls: [number | null, boolean][] = [];
    return {
      calls,
      label: (n: number | null, add: boolean) => {
        calls.push([n, add]);
        return ok;
      },
    };
  };
  const unlabelled = () => [] as string[];

  it("06:22 — --hold falls back to session-held and answers claimed", () => {
    const rec = recorder();
    const r = holdForSession("feedback-8249", at("06:22:03"), {
      claim: refused,
      label: rec.label,
      readLabels: unlabelled,
    });
    expect(rec.calls).toEqual([[8249, true]]);
    expect(r).toMatchObject({ claimed: true, label: true });
    expect(r.reason).toMatch(/session-held/);
  });

  it("--hold takes nothing when a live claim or a won race holds the issue", () => {
    for (const reason of ["held by a live claim (5m old)", "lost the race to a concurrent claim"]) {
      const rec = recorder();
      const r = holdForSession("feedback-8249", at("06:22:03"), {
        claim: () => ({ claimed: false, reason }),
        label: rec.label,
        readLabels: unlabelled,
      });
      expect(r.claimed).toBe(false);
      expect(rec.calls).toEqual([]);
    }
  });

  it("--hold refuses a second session when session-held is already on the issue", () => {
    const rec = recorder();
    let claimed = false;
    const r = holdForSession("feedback-8249", at("06:30:00"), {
      claim: () => {
        claimed = true;
        return { claimed: true, reason: "claimed" };
      },
      label: rec.label,
      readLabels: () => ["feedback", "session-held"],
    });
    expect(r.claimed).toBe(false);
    expect(r.reason).toMatch(/^held by a live claim/);
    expect(claimed).toBe(false);
    expect(rec.calls).toEqual([]);
  });

  it("--hold reports the refusal when the label write fails too", () => {
    const r = holdForSession("feedback-8249", at("06:22:03"), {
      claim: refused,
      label: recorder(false).label,
      readLabels: unlabelled,
    });
    expect(r).toMatchObject({ claimed: false, label: false });
  });

  it("07:07:56 — the merge keeps in-progress on a session-held issue with no lease", () => {
    const [row] = planPrInProgress({
      event: "closed",
      facts: [
        { number: 8249, isOpenIssue: true, hasLabel: true, leased: false, sessionHeld: true },
      ],
    });
    expect(row).toMatchObject({
      action: "none",
      reason: "a live session holds it (`session-held`)",
    });
  });

  // The retry sweep's rows (`readOpenIssues`) carry no `updated_at`, so the label must be refused by
  // the pull rule itself, not by an activity read: every claim path asks this rule first.
  it("07:16:28 — the pull rule refuses a session-held issue, even with in-progress gone", () => {
    const row = {
      number: 8249,
      state: "open",
      labels: [{ name: "feedback" }, { name: "ready" }, { name: "session-held" }],
    };
    expect(notPullable(row)).toMatchObject({ code: "in-progress" });
    expect(notPullable(row, { interactive: true })?.text).toMatch(/session-held/);
  });

  it("a crashed cloud session's label is cleared by the 6h stall sweep, even without in-progress", () => {
    const rows = staleInProgressFrom(
      [
        {
          number: 8249,
          title: "t",
          labels: [{ name: "session-held" }],
          updatedAt: "2026-11-24T00:00:00Z",
        },
      ],
      at("07:00:00"),
    );
    expect(rows).toEqual([{ number: 8249, title: "t", inProgress: false, hoursQuiet: 7 }]);
  });
});
