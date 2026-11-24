import { describe, expect, it } from "@rstest/core";
import { parseAsk } from "../../../scripts/moneypenny/ask-card.mjs";
import {
  ASSIGN_CAP,
  ASSIGN_MARKER,
  askOnce,
  assignmentComment,
  batchStart,
  gather,
  graduatedClass,
  lastAskedAt,
  OPEN_CAP,
  plan,
  routeAssignments,
} from "../../../scripts/moneypenny/assignments.mjs";
import { CALLOUT, CALLOUT_WITH_OPTIONS, issue, NOW } from "./assignments-fixtures";

// #6953 slice 3: two batches a day, at most OPEN_CAP open, ranked, and his reply read back.
describe("the batch rhythm", () => {
  const AFTER_8 = Date.parse("2026-11-07T14:05:00Z");
  const many = [9, 7, 1, 5, 3].map((number) => issue({ number }));
  const route = (assignments: Record<string, unknown>, now = AFTER_8) =>
    routeAssignments({
      assignments: { issues: many, prs: [], markers: new Set(), ...assignments },
      now,
      issueCards: true,
    });

  it("starts a batch at 14:00Z and 21:30Z", () => {
    expect(new Date(batchStart(Date.parse("2026-11-07T14:05:00Z"))).toISOString()).toBe(
      "2026-11-07T14:00:00.000Z",
    );
    expect(new Date(batchStart(Date.parse("2026-11-07T21:31:00Z"))).toISOString()).toBe(
      "2026-11-07T21:30:00.000Z",
    );
    expect(new Date(batchStart(Date.parse("2026-11-07T03:00:00Z"))).toISOString()).toBe(
      "2026-11-06T21:30:00.000Z",
    );
  });

  it("sends nothing new once this window's batch has gone out", () => {
    expect(route({ lastAskAt: Date.parse("2026-11-07T14:01:00Z") })).toEqual([]);
    expect(route({ lastAskAt: Date.parse("2026-11-07T13:59:00Z") })).toHaveLength(ASSIGN_CAP);
  });

  it("still clears removals between batches", () => {
    const stale = issue({ number: 20, labels: [], assignees: [{ login: "ejclark" }] });
    const intents = route({ issues: [stale], markers: new Set([20]), lastAskAt: AFTER_8 });
    expect(intents.map((i) => i.kind)).toEqual(["unassign-eric"]);
  });

  it("never lets more than OPEN_CAP be open at once", () => {
    const held = [101, 102, 103, 104].map((number) =>
      issue({ number, assignees: [{ login: "ejclark" }] }),
    );
    const intents = route({ issues: [...held, ...many], markers: new Set([101, 102, 103, 104]) });
    expect(OPEN_CAP).toBe(5);
    expect(intents).toHaveLength(1);
  });

  it("ranks bot rules ahead of internal asks, then oldest first", () => {
    const internal = issue({ number: 1, title: "Raise the debt gates?" });
    const bots = issue({ number: 8, title: "Let the breaker re-arm?" });
    const intents = route({ issues: [internal, bots] });
    expect(intents.map((i) => i.number)).toEqual([8, 1]);
  });

  it("lets a stop go between batches and past the open cap", () => {
    const stop = issue({ number: 50, labels: [{ name: "needs-eric" }, { name: "fast-track" }] });
    const held = [101, 102, 103, 104, 105].map((number) =>
      issue({ number, assignees: [{ login: "ejclark" }] }),
    );
    const intents = route({
      issues: [stop, ...held, ...many],
      markers: new Set([101, 102, 103, 104, 105]),
      lastAskAt: AFTER_8,
    });
    expect(intents.map((i) => i.number)).toEqual([50]);
  });

  it("tells each card how many asks wait", () => {
    const [first] = route({});
    expect(first?.body).toContain("2 more asks next batch.");
  });
});

describe("lastAskedAt", () => {
  it("is the newest ask marker from a trusted comment", () => {
    const at = (iso: string, body: string, type = "Bot") => ({
      body,
      created_at: iso,
      user: { type },
      author_association: "NONE",
    });
    expect(
      lastAskedAt([
        at("2026-11-07T14:00:00Z", ASSIGN_MARKER),
        at("2026-11-07T21:30:00Z", "hello"),
        at("2026-11-08T01:00:00Z", ASSIGN_MARKER, "User"),
      ]),
    ).toBe(Date.parse("2026-11-07T14:00:00Z"));
  });
});

describe("his reply is read back in the same tick", () => {
  const thread = [
    {
      body: assignmentComment({ items: parseAsk(CALLOUT_WITH_OPTIONS) }),
      user: { type: "Bot", login: "skynet-envoy[bot]" },
      author_association: "NONE",
      created_at: "2026-11-07T00:00:00Z",
    },
    {
      id: 9,
      body: "A",
      user: { type: "User", login: "ejclark" },
      author_association: "OWNER",
      created_at: "2026-11-07T01:00:00Z",
    },
  ];
  const asked = issue({ number: 4, body: CALLOUT_WITH_OPTIONS, assignees: [{ login: "ejclark" }] });
  const open = (comments: unknown[]) =>
    gather({
      now: NOW,
      rest: (path: string) => {
        if (path.startsWith("issues?state=open&labels=needs-eric")) return [asked];
        if (path.includes("/comments")) return comments;
        return [];
      },
    });

  it("gathers the reply, routes a read-back ahead of any new ask, and scores it", () => {
    const deps = open(thread);
    expect(deps.replies).toHaveLength(1);
    const [intent] = routeAssignments({ assignments: deps, now: NOW });
    expect(intent).toMatchObject({ kind: "readback-eric", number: 4 });
    expect(intent?.body).toContain("Read as: A.");
    expect(intent?.body).toContain("match");
  });

  it("reads nothing when the reply is not an answer", () => {
    const chatty = [thread[0], { ...thread[1], body: "why is this asked?" }];
    expect(open(chatty).replies).toEqual([]);
  });
});

describe("askOnce carries a read-back out under the lease, once", () => {
  const intent = {
    kind: "readback-eric",
    number: 4,
    body: "Read as: A.",
    criterion: 1,
    why: "x",
  } as const;
  const run = (calls: string[]) => (_cmd: string, args: readonly string[]) => {
    calls.push(args.join(" "));
    return "";
  };
  const ask = {
    body: ASSIGN_MARKER,
    user: { type: "Bot" },
    author_association: "NONE",
    created_at: "2026-11-07T00:00:00Z",
  };

  it("clears the label, the assignment and answers", () => {
    const calls: string[] = [];
    const line = askOnce(intent, {
      run: run(calls),
      retry: <T>(fn: () => T) => fn(),
      rest: () => [ask],
      read: () => ({ body: "x" }),
    } as never);
    expect(line).toContain("read #4");
    expect(calls).toHaveLength(3);
  });

  it("does nothing when another sweep already cleared it", () => {
    const calls: string[] = [];
    const line = askOnce(intent, {
      run: run(calls),
      retry: <T>(fn: () => T) => fn(),
      rest: () => [],
      read: () => ({ body: "x" }),
    } as never);
    expect(line).toContain("already cleared");
    expect(calls).toEqual([]);
  });
});

describe("a read-back and a stale unassign never double up", () => {
  it("plans the read-back only, for an issue whose label a failed read-back already took off", () => {
    const reply = {
      number: 4,
      title: "t",
      ask: {},
      card: null,
      reply: {},
      answer: { kind: "yes" },
    };
    const stale = issue({ number: 4, labels: [], assignees: [{ login: "ejclark" }] });
    const { actions, holding } = plan({
      issues: [stale],
      prs: [],
      markers: new Set([4]),
      replies: [reply as never],
      now: NOW,
    });
    expect(actions.map((a) => a.kind)).toEqual(["readback"]);
    expect(holding).toBe(0);
  });
});

// #7939 slice 3: an ask whose class has graduated (docs/process/ALIGNMENT.md rule 3) is decided by a
// session at its predicted answer and reported in Headlines, never assigned. Rule 4's classes stay
// his even when a hand-edited table lists them.
describe("plan: a graduated class is decided, not asked", () => {
  const ARCHIVE = [
    "> [!IMPORTANT]",
    "> **Needs from you**",
    "> 1. Archive this session? — its PRs are closed",
    ">    - A (predicted, high): archive",
    ">    - B: keep it open",
  ].join("\n");
  const archiveAsk = issue({ number: 70, title: "archive check", body: ARCHIVE });

  it("routes a fresh ask of a graduated class to a session, with no assignment and no needs-you line", () => {
    const planned = plan({ issues: [archiveAsk], graduated: ["session housekeeping"], now: NOW });
    expect(planned.actions).toEqual([]);
    expect(planned.needsYou).toEqual([]);
    expect(planned.needsSession).toEqual([
      expect.objectContaining({
        number: 70,
        why: expect.stringContaining('graduated class "session housekeeping"'),
      }),
    ]);
  });

  it("asks as before when the class has not graduated, or the ask carries no prediction", () => {
    expect(plan({ issues: [archiveAsk], now: NOW }).actions.map((a) => a.number)).toEqual([70]);
    const unpredicted = issue({ number: 71, title: "archive check", body: CALLOUT });
    const planned = plan({ issues: [unpredicted], graduated: ["session housekeeping"], now: NOW });
    expect(planned.actions.map((a) => a.number)).toEqual([71]);
  });

  it("never lets rule 4's class past him, even listed as graduated", () => {
    const breaker = issue({ number: 72, body: CALLOUT_WITH_OPTIONS });
    const planned = plan({ issues: [breaker], graduated: ["bot safety rules"], now: NOW });
    expect(planned.actions.map((a) => a.number)).toEqual([72]);
    expect(planned.needsSession).toEqual([]);
  });

  it("reads the class the ask states, so an ask the keywords cannot place still graduates", () => {
    const stated = ARCHIVE.replace(
      ">    - A (predicted, high)",
      ">    - Class: session housekeeping\n>    - A (predicted, high)",
    ).replace("Archive this session?", "Close out the old branch?");
    const planned = plan({
      issues: [issue({ number: 74, title: "tidy", body: stated })],
      graduated: ["session housekeeping"],
      now: NOW,
    });
    expect(planned.needsSession.map((n) => n.number)).toEqual([74]);
  });

  it("lets the keywords veto a stated reversible class when they land on rule 4", () => {
    const lie = ARCHIVE.replace(
      ">    - A (predicted, high)",
      ">    - Class: session housekeeping\n>    - A (predicted, high)",
    ).replace("Archive this session?", "Raise the spend cap?");
    const planned = plan({
      issues: [issue({ number: 75, title: "tidy", body: lie })],
      graduated: ["session housekeeping"],
      now: NOW,
    });
    expect(planned.actions.map((a) => a.number)).toEqual([75]);
    expect(planned.needsSession).toEqual([]);
  });

  // #7959: the keyword guess reaches only three of the seven rule-4 classes, so a merge ask guessed
  // `unclassified` and its stated reversible class graduated it. The ask's own words now veto too.
  it("lets rule 4's own words veto a stated reversible class the keyword guess cannot place", () => {
    const merge = [
      "> [!IMPORTANT]",
      "> **Needs from you**",
      "> 1. Merge the platter PR #8100 now?",
      ">    - Class: screen design (taste)",
      ">    - A (predicted, high): merge it",
      ">    - B: hold it",
    ].join("\n");
    const ask = issue({ number: 76, title: "weekly tidy", body: merge });
    expect(graduatedClass(ask, ["screen design (taste)"])).toBeNull();
    const planned = plan({ issues: [ask], graduated: ["screen design (taste)"], now: NOW });
    expect(planned.actions.map((a) => a.number)).toEqual([76]);
    expect(planned.needsSession).toEqual([]);
  });

  // #8059: the words veto knew "merge" but not "land", and nothing for arming a Routine, showing
  // member data to the public, or giving someone a login. Each irreversible class now names its acts.
  it.each([
    ["member data sharing", "Show every member's open positions on the public /login page?"],
    ["review queue", "Land the held platter PR #8100 now?"],
    ["schedule (arming)", "Turn on the nightly research Routine?"],
    ["member onboarding", "Give my friend Dana a login to the app?"],
  ])("keeps a %s ask worded without the old keywords with him", (_cls, question) => {
    const body = [
      "> [!IMPORTANT]",
      "> **Needs from you**",
      `> 1. ${question}`,
      ">    - Class: screen design (taste)",
      ">    - A (predicted, high): yes",
      ">    - B: not yet",
    ].join("\n");
    const ask = issue({ number: 77, title: "weekly tidy", body });
    expect(graduatedClass(ask, ["screen design (taste)"])).toBeNull();
    const planned = plan({ issues: [ask], graduated: ["screen design (taste)"], now: NOW });
    expect(planned.actions.map((a) => a.number)).toEqual([77]);
    expect(planned.needsSession).toEqual([]);
  });

  it("still graduates a plain screen-design ask, so the veto is not a blanket", () => {
    const body = [
      "> [!IMPORTANT]",
      "> **Needs from you**",
      "> 1. Put the leaderboard's rank badge left of the name?",
      ">    - Class: screen design (taste)",
      ">    - A (predicted, high): left",
      ">    - B: right",
    ].join("\n");
    const ask = issue({ number: 78, title: "weekly tidy", body });
    expect(graduatedClass(ask, ["screen design (taste)"])).toBe("screen design (taste)");
  });

  it("leaves an ask he already holds with him", () => {
    const held = issue({
      number: 73,
      title: "archive check",
      body: ARCHIVE,
      assignees: ["ejclark"],
    });
    const planned = plan({ issues: [held], graduated: ["session housekeeping"], now: NOW });
    expect(planned.needsYou.map((n) => n.number)).toEqual([73]);
  });
});
