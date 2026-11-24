import {
  type Capsule,
  capsuleIntents,
  carryOf,
  closeProvenCapsule,
  gatherCapsules,
  lookupsFor,
  openLinkedPr,
  PROVEN_MARKER,
  RECURRENCE,
  sinceReopen,
} from "../../../scripts/moneypenny/capsule-stall.mjs";
import { REOPEN_MARKER } from "../../../scripts/moneypenny/repair.mjs";
import { BODY, capsule, fakeRest, hoursAgo, NOW, run } from "./capsule-stall-fixtures";

describe("a red PR's capsule ends with the PR (#6605)", () => {
  const RED_PR_BODY = [
    "**`integration tests` failed on PR #6605, and the session that opened it has ended.**",
    "",
    "| | |",
    "|---|---|",
    "| **Workflow** | Pipeline |",
    "| **Job** | `integration tests` |",
    "| **Failing step** | Build app/ and run the e2e suite |",
    "| **Run** | [1](https://x/1) |",
    "| **PR** | #6605 |",
  ].join("\n");
  const redPrCapsule = (overrides: Partial<Capsule> = {}) =>
    capsule({ title: "[ci] Pipeline — PR #6605 is red", body: RED_PR_BODY, ...overrides });

  it("closes once the PR has closed, merged or not, and says which", () => {
    const merged = capsuleIntents({
      capsules: [redPrCapsule({ redPr: { number: 6605, state: "closed", merged: true } })],
    })[0];
    expect(merged?.kind).toBe("close-proven-capsule");
    expect(merged?.body).toContain("#6605 merged");
    expect(merged?.body).toContain(PROVEN_MARKER);
    const closed = capsuleIntents({
      capsules: [redPrCapsule({ redPr: { number: 6605, state: "closed", merged: false } })],
    })[0];
    expect(closed?.body).toContain("#6605 was closed");
  });

  it("takes needs-eric off with it: the decision was about a PR that is gone", () => {
    const [intent] = capsuleIntents({
      capsules: [
        redPrCapsule({
          labels: ["ci-failure", "needs-eric"],
          redPr: { number: 6605, state: "closed", merged: false },
        }),
      ],
    });
    expect(intent?.clearNeedsEric).toBe(true);
  });

  it("stays open while the PR is open, and leaves a capsule a person reopened alone", () => {
    const open = redPrCapsule({ redPr: { number: 6605, state: "open", merged: false } });
    expect(capsuleIntents({ capsules: [{ ...open, hasLinkedPr: true }] })).toEqual([]);
    const reopened = redPrCapsule({
      comments: [PROVEN_MARKER],
      hasLinkedPr: true,
      redPr: { number: 6605, state: "closed", merged: false },
    });
    expect(capsuleIntents({ capsules: [reopened] })).toEqual([]);
  });

  it("never reads main's runs for it: integration tests also run there, and prove nothing here", () => {
    const io = fakeRest({
      "issues?state=open&labels=ci-failure": [
        {
          number: 700,
          title: "[ci] Pipeline — PR #6605 is red",
          body: RED_PR_BODY,
          created_at: hoursAgo(2),
          labels: [{ name: "ci-failure" }],
        },
      ],
      "issues/700/comments": [],
      "pulls/6605": { number: 6605, state: "open", merged: false },
    });
    const [gathered] = gatherCapsules(NOW, io);
    expect(gathered?.redPr).toEqual({ number: 6605, state: "open", merged: false });
    expect(gathered?.recentRuns).toBeUndefined();
  });

  it("reports the close as what happened, not as a job passing again", () => {
    const said = closeProvenCapsule(
      {
        kind: "close-proven-capsule",
        issueNumber: 700,
        title: "[ci] Pipeline — PR #6605 is red",
        body: "b",
        said: "closed with #6605",
      },
      { run: () => "" },
    );
    expect(said).toContain("closed with #6605");
    expect(said).not.toContain("passing again");
  });
});

// #6953 slice 2: a close never takes the question with it. The breaker's ask was filed 9 times in
// 5 days because each green close took `needs-eric` off and nothing kept the question; the next trip
// filed it again under a new number. Before a close, the ask moves to the thing that answers it.
describe("a green close moves an escalated capsule's ask first (#6953)", () => {
  const ASK =
    "> [!IMPORTANT]\n> **Needs from you**\n> 1. Merge the fix on branch `fix/breaker` — protected.\n\n";
  const escalated = (overrides: Partial<Capsule> = {}) =>
    capsule({
      number: 6942,
      body: `${ASK}${BODY}`,
      labels: ["ci-failure", "needs-eric"],
      recentRuns: [run(303, 1), run(302, 5), run(301, 10)],
      ...overrides,
    });

  it("moves the ask onto the fix's open PR when one is linked, and says so in the close", () => {
    const [intent] = capsuleIntents({ capsules: [escalated({ openPr: 7001 })] });
    expect(intent).toMatchObject({
      kind: "close-proven-capsule",
      clearNeedsEric: true,
      carry: { pr: 7001, decision: "Merge the fix on branch `fix/breaker` — protected." },
    });
    expect(intent?.body).toContain("moves to #7001");
  });

  it("hands it to a session when no fix PR is open — the digest's needs-a-session line", () => {
    for (const openPr of [null, undefined]) {
      const [intent] = capsuleIntents({ capsules: [escalated({ openPr })] });
      expect(intent?.carry).toEqual({
        session: true,
        decision: "Merge the fix on branch `fix/breaker` — protected.",
      });
      expect(intent?.body).toContain("`needs-session`");
      expect(intent?.body).toContain("reopens this issue rather than filing a new one");
    }
  });

  it("carries nothing for a capsule that never asked", () => {
    const [intent] = capsuleIntents({
      capsules: [capsule({ recentRuns: [run(303, 1), run(302, 5), run(301, 10)] })],
    });
    expect(intent?.kind).toBe("close-proven-capsule");
    expect(intent).not.toHaveProperty("carry");
  });

  it("an escalated capsule with no callout still carries — with no decision to quote", () => {
    expect(carryOf({ body: BODY, openPr: null })).toEqual({ session: true, decision: null });
  });

  it("moves the ask before anything else: PR comment, then the label, then the close", () => {
    const calls: string[][] = [];
    const run = (_cmd: string, args: string[]) => {
      calls.push(args);
      return "";
    };
    const base = {
      kind: "close-proven-capsule" as const,
      issueNumber: 6942,
      title: "t",
      body: "b",
      clearNeedsEric: true,
    };
    const restAll = () => [] as unknown[];
    closeProvenCapsule({ ...base, carry: { pr: 7001, decision: "Merge it?" } }, { run, restAll });
    expect(calls[0]?.slice(0, 4)).toEqual([
      "api",
      "-X",
      "POST",
      "repos/{owner}/{repo}/issues/7001/comments",
    ]);
    expect(calls[0]?.[5]).toContain("> Merge it?");
    // A quote, never a callout: a `Needs from you` in a comment is one no list can see.
    expect(calls[0]?.[5]).not.toContain("[!IMPORTANT]");
    expect(calls.slice(1)).toEqual([
      ["api", "-X", "DELETE", "repos/{owner}/{repo}/issues/6942/labels/needs-eric"],
      ["issue", "close", "6942", "--reason", "not planned", "--comment", "b"],
    ]);

    calls.length = 0;
    const ensured: string[] = [];
    closeProvenCapsule(
      { ...base, carry: { session: true, decision: null } },
      { run, ensure: (l) => ensured.push(l.name) },
    );
    expect(ensured).toEqual(["needs-session"]);
    expect(calls[0]).toEqual([
      "api",
      "-X",
      "POST",
      "repos/{owner}/{repo}/issues/6942/labels",
      "-f",
      "labels[]=needs-session",
    ]);
    expect(calls.at(-1)?.[1]).toBe("close");

    // Strict: if the ask cannot move, nothing closes and no label comes off.
    calls.length = 0;
    const failing = (_cmd: string, args: string[]) => {
      calls.push(args);
      throw new Error("HTTP 502");
    };
    expect(() =>
      closeProvenCapsule(
        { ...base, carry: { pr: 7001, decision: null } },
        { run: failing, restAll },
      ),
    ).toThrow("HTTP 502");
    expect(calls).toHaveLength(1);

    // A retry after a failed close does not post on the PR twice: its marker is the memory.
    calls.length = 0;
    const posted = [
      {
        body: "<!-- moneypenny:ask-carried #6942 -->",
        author_association: "NONE",
        user: { type: "Bot" },
      },
    ];
    closeProvenCapsule(
      { ...base, carry: { pr: 7001, decision: null } },
      { run, restAll: () => posted },
    );
    expect(calls.map((c) => c.slice(0, 4).join(" "))).toEqual([
      "api -X DELETE repos/{owner}/{repo}/issues/6942/labels/needs-eric",
      "issue close 6942 --reason",
    ]);
  });

  it("takes only a held, open PR that says it closes this capsule — the newest one", () => {
    const pr = (number: number, over: Record<string, unknown> = {}) => ({
      event: "cross-referenced",
      source: {
        issue: {
          number,
          state: "open",
          body: "Closes #6942",
          labels: [{ name: "hold-merge" }],
          pull_request: { merged_at: null },
          ...over,
        },
      },
    });
    const timeline = [pr(7000), { event: "connected" }, pr(7001)];
    expect(openLinkedPr(timeline, 6942)).toBe(7001);
    expect(openLinkedPr([pr(1, { state: "closed" })], 6942)).toBeNull();
    // A digest or research PR that only mentions the number is not the fix.
    expect(openLinkedPr([pr(2, { body: "see #6942" })], 6942)).toBeNull();
    // An unheld PR auto-merges or sits where no list sees it: the ask goes to a session instead.
    expect(openLinkedPr([pr(3, { labels: [] })], 6942)).toBeNull();
    const issueRef = { event: "cross-referenced", source: { issue: { number: 5, state: "open" } } };
    expect(openLinkedPr([issueRef], 6942)).toBeNull();
  });

  it("a capsule reopened with its hand-off is never flagged orphaned", () => {
    const handedOff = capsule({ labels: ["ci-failure", "needs-session"], comments: [] });
    expect(capsuleIntents({ capsules: [handedOff] })).toEqual([]);
    expect(lookupsFor({ labels: ["needs-session"], createdAt: hoursAgo(48) }, NOW)).toEqual({
      orphan: false,
    });
  });

  it("the gather reads an escalated capsule's timeline for it", () => {
    const io = {
      asked: [] as string[],
      restAll(path: string): unknown[] {
        io.asked.push(path);
        if (path.startsWith("issues?state=open")) {
          return [
            {
              number: 6942,
              title: "[ci] x — route",
              body: "",
              created_at: hoursAgo(2),
              labels: [{ name: "ci-failure" }, { name: "needs-eric" }],
            },
          ];
        }
        if (path === "issues/6942/timeline") {
          return [
            {
              event: "cross-referenced",
              source: {
                issue: {
                  number: 7001,
                  state: "open",
                  body: "Fixes #6942",
                  labels: [{ name: "hold-merge" }],
                  pull_request: {},
                },
              },
            },
          ];
        }
        return [];
      },
      rest: () => ({}),
    };
    const [c] = gatherCapsules(NOW, io);
    expect(c?.openPr).toBe(7001);
  });
});

// The reopen (repair.mjs, #6953 slice 2) brings a capsule back to life with its old comments. The
// proven marker from its last close used to mean "a person reopened it — leave it"; it now belongs
// to a life that ended at the reopen, so a capsule proven green again closes again.
describe("a capsule the repair lane reopened is judged on its current life (#6953)", () => {
  const green = { recentRuns: [run(303, 1), run(302, 5), run(301, 10)] };

  it("closes again once green, though its last life ended with a proven comment", () => {
    const reopened = capsule({
      ...green,
      comments: [`🌤 closed\n${PROVEN_MARKER}`, `${RECURRENCE}run [9](u)\n${REOPEN_MARKER}`],
    });
    expect(capsuleIntents({ capsules: [reopened] }).map((i) => i.kind)).toEqual([
      "close-proven-capsule",
    ]);
  });

  it("a person's reopen, with no lane marker after the close, still stays his call", () => {
    const byHand = capsule({ ...green, comments: [`🌤 closed\n${PROVEN_MARKER}`] });
    const kinds = capsuleIntents({ capsules: [byHand] }).map((i) => i.kind);
    expect(kinds).not.toContain("close-proven-capsule");
  });

  it("sinceReopen keeps only what follows the newest reopen", () => {
    expect(sinceReopen(["a", `r1 ${REOPEN_MARKER}`, "b", `r2 ${REOPEN_MARKER}`, "c"])).toEqual([
      "c",
    ]);
    expect(sinceReopen(["a", "b"])).toEqual(["a", "b"]);
  });
});
