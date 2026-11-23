import {
  buildEndVerdict,
  closedIssueClaims,
  feedbackIssueOf,
  gatherExpiredClaims,
  gatherMergeReleases,
  mergedPrNumbers,
  mergeReleaseVerdict,
} from "../../../scripts/moneypenny/claim-release.mjs";
import { route } from "../../../scripts/moneypenny/index.mjs";
import { notPullable } from "../../../scripts/moneypenny/labels.mjs";

// RELEASE A BUILD'S LEASE WHEN ITS WORK IS DONE, NOT TWO HOURS LATER (#7313). Measured 2026-11-10:
// 141 min median from a feedback PR's merge to its `next-slice` remainder starting, because the
// lease (`claim/feedback-<n>`) only aged out at the 2h TTL. These specs replay the issue's five
// acceptance criteria against the pure verdicts and the injected gathers. No `gh`, no clock.

const TTL = 2 * 60 * 60 * 1000;
const at = (hhmm: string) => Date.parse(`2026-11-09T${hhmm}:00Z`);
const lane = (hhmm: string) => ({ takenMs: at(hhmm), holder: "lane" });

describe("which PR a push merged", () => {
  it("reads the trailing (#pr) off a squash commit's subject, not an issue it also cites", () => {
    const payload = {
      commits: [
        { message: "fix(meter): compare like with like (#6702) (#8050)\n\nBody (#1)" },
        { message: "test(meter): one spec per row (#8042)" },
      ],
    };
    expect(mergedPrNumbers(payload)).toEqual([8050, 8042]);
  });

  it("falls back to head_commit, and names nothing for a commit with no PR", () => {
    expect(mergedPrNumbers({ head_commit: { message: "chore: release 1.2.3 (#9)" } })).toEqual([9]);
    expect(mergedPrNumbers({ commits: [{ message: "chore: direct push" }] })).toEqual([]);
    expect(mergedPrNumbers(undefined)).toEqual([]);
  });

  it("frees only the feedback lane's own branch", () => {
    expect(feedbackIssueOf("feedback/7216")).toBe(7216);
    expect(feedbackIssueOf("plan/7216")).toBeNull();
    expect(feedbackIssueOf("feedback/7216-extra")).toBeNull();
  });
});

describe("criterion 1 — a lane build's PR merges: its claim goes within one tick", () => {
  it("releases a lane lease taken before the merge, once the build has ended", () => {
    expect(
      mergeReleaseVerdict({ mergedMs: at("05:10"), lease: lane("03:12"), inProgress: false }),
    ).toMatchObject({ action: "release" });
  });

  it("the push tick turns a merged feedback/<n> PR into a release, with no label read when unheld", () => {
    const labelReads: number[] = [];
    const releases = gatherMergeReleases(
      { commits: [{ message: "feat(x): first part (#8100)" }, { message: "fix: y (#8101)" }] },
      {
        readPr: (n) =>
          n === 8100
            ? { head: { ref: "feedback/7216" }, merged_at: "2026-11-09T05:10:00Z" }
            : { head: { ref: "feedback/7077" }, merged_at: "2026-11-09T05:11:00Z" },
        readLease: (slug) => (slug === "feedback-7216" ? lane("03:12") : null),
        readIssueLabels: (n) => {
          labelReads.push(n);
          return ["feedback", "ready", "next-slice"];
        },
      },
    );
    expect(releases).toEqual([{ slug: "feedback-7216", reason: "PR #8100 merged" }]);
    expect(labelReads).toEqual([7216]);
  });

  it("ignores a PR that is not merged, or not on a feedback branch", () => {
    const releases = gatherMergeReleases(
      { commits: [{ message: "a (#1)" }, { message: "b (#2)" }] },
      {
        readPr: (n) =>
          n === 1
            ? { head: { ref: "feedback/10" }, merged_at: null }
            : { head: { ref: "governor/cycle-3" }, merged_at: "2026-11-09T05:00:00Z" },
        readLease: () => lane("03:00"),
        readIssueLabels: () => [],
      },
    );
    expect(releases).toEqual([]);
  });
});

describe("criterion 3 — while a build of the issue runs, its claim stays (#4357)", () => {
  it("keeps the lease while the issue still carries in-progress", () => {
    expect(
      mergeReleaseVerdict({ mergedMs: at("05:10"), lease: lane("03:12"), inProgress: true }),
    ).toMatchObject({ action: "leave" });
  });

  it("keeps a lease taken AFTER the merge — that is a newer build's claim", () => {
    expect(
      mergeReleaseVerdict({ mergedMs: at("05:10"), lease: lane("05:11"), inProgress: false }),
    ).toMatchObject({ action: "leave", reason: expect.stringMatching(/newer claim/) });
  });

  it("keeps a live session's hold — the session ends its own (#6065)", () => {
    expect(
      mergeReleaseVerdict({
        mergedMs: at("05:10"),
        lease: { takenMs: at("03:12"), holder: "session" },
        inProgress: false,
      }),
    ).toMatchObject({ action: "leave" });
  });

  it("keeps the lease at build end while the build's own PR is still open", () => {
    expect(
      buildEndVerdict({
        lanePrs: [{ state: "open", createdMs: at("03:40") }],
        leaseTakenMs: at("03:12"),
        stillPullable: true,
      }),
    ).toMatchObject({ release: false });
  });

  it("keeps the lease when the PR read fails — an unread PR is never 'no PR'", () => {
    expect(buildEndVerdict({ lanePrs: null, leaseTakenMs: at("03:12") })).toMatchObject({
      release: false,
    });
  });
});

describe("criterion 2 — a build with no PR to wait for releases at its end", () => {
  it("releases when the build's PR already merged before the job finished", () => {
    expect(
      buildEndVerdict({
        lanePrs: [{ state: "closed", createdMs: at("03:40") }],
        leaseTakenMs: at("03:12"),
        stillPullable: true,
      }),
    ).toMatchObject({ release: true });
  });

  it("releases a hand-off to a session (no PR, not the lane's to pull)", () => {
    expect(
      buildEndVerdict({ lanePrs: [], leaseTakenMs: at("03:12"), stillPullable: false }),
    ).toMatchObject({ release: true });
  });

  it("still releases a build that ended waiting on the member (#3959)", () => {
    expect(buildEndVerdict({ waitingOnMember: true })).toMatchObject({ release: true });
  });

  it("does not count an earlier slice's merged PR as this build's", () => {
    // A next-slice issue: slice 1 merged on the same branch yesterday; this build opened nothing
    // and left the issue ready. Releasing would let the sweep re-run it every tick.
    expect(
      buildEndVerdict({
        lanePrs: [{ state: "closed", createdMs: at("01:00") }],
        leaseTakenMs: at("03:12"),
        stillPullable: true,
      }),
    ).toMatchObject({ release: false, reason: expect.stringMatching(/timeout paces a retry/) });
  });
});

describe("criterion 4 — a released ready + next-slice issue is admissible to the next sweep", () => {
  it("passes the one buildable test the sweep asks", () => {
    const issue = { number: 7216, state: "open", labels: ["feedback", "ready", "next-slice"] };
    expect(notPullable(issue)).toBeNull();
  });

  it("the push route carries the release as an intent, ahead of the same tick's peek", () => {
    const intents = route(
      { eventName: "push" },
      { claimReleases: [{ slug: "feedback-7216", reason: "PR #8100 merged" }] },
    );
    expect(intents).toContainEqual({
      kind: "release-claim-early",
      slug: "feedback-7216",
      reason: "PR #8100 merged",
    });
  });

  it("a skipped release read (null) routes nothing extra", () => {
    expect(route({ eventName: "push" }, { claimReleases: null })).toEqual(
      route({ eventName: "push" }, {}),
    );
  });
});

describe("criterion 5 — an expired claim tag on a closed issue is deleted", () => {
  const refs = [
    { ref: "refs/tags/claim/feedback-4410" },
    { ref: "refs/tags/claim/plan-4393" },
    { ref: "refs/tags/claim/feedback-7313" },
    { ref: "refs/tags/claim/update-branch-scan" },
    { ref: "refs/tags/claim/feedback-5000" },
  ];
  const open = new Set([7313]);

  it("lists only the two lanes' leases whose issue is not open", () => {
    expect(closedIssueClaims(refs, open)).toEqual(["feedback-4410", "plan-4393", "feedback-5000"]);
  });

  it("caps the candidates per tick", () => {
    expect(closedIssueClaims(refs, open, 2)).toEqual(["feedback-4410", "plan-4393"]);
  });

  it("deletes past the timeout, and leaves a young lease on a closed issue alone", () => {
    const now = at("06:00");
    const releases = gatherExpiredClaims({
      readRefs: () => refs,
      openNumbers: open,
      readLease: (slug) =>
        slug === "feedback-5000" ? lane("05:30") : slug === "plan-4393" ? null : lane("01:00"),
      nowMs: now,
      ttlMs: TTL,
      cap: 20,
    });
    expect(releases.map((r) => r.slug)).toEqual(["feedback-4410", "plan-4393"]);
  });
});
