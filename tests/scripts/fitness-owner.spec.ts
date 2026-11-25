import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import {
  CONTRACTS,
  judgeAlertReach,
  judgeAssignmentPath,
  reportActions,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/fitness.mjs";
import {
  ASSIGNED_MARKER,
  assignsAtOnce,
  OWNER_AFTER_MS,
  REOPEN_LINE,
  REOPEN_WITHIN_MS,
  REOPENED_MARKER,
  RUNGS,
  whatHappensNext,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/fitness-rungs.mjs";
import { iso, MIN, START } from "./fitness-harness";
import { contract, NOW } from "./fitness-tracker-sim";

// The owner-assignment half of fitness.spec.ts (#6470): the system corrects first, and an issue
// assigned to the owner is the last step. It holds the rung each contract declares, the tick-by-tick
// simulation of reportActions playing the issue tracker's part, and the assignment path judge. The
// judges and the report/dedupe rules stay in fitness.spec.ts. The audit runs one spec per call, so
// the 21 bugs that attack the owner's assignment (see fitness.spec.ts's header) are graded with
// `--spec` aimed here.

// Eric, 2026-11-01: the system corrects first and an issue assigned to him is the last step.
describe("fitness: the owner is assigned last", () => {
  const stopped = () => ({
    ...contract("bots-running"),
    status: "fail",
    detail: "machine is stopped",
  });
  const stale = () => ({
    ...contract("bots-responsive"),
    status: "fail",
    detail: "last controls poll 40 min ago",
  });
  const mail = () => ({
    ...contract("alerts-reach-owner"),
    status: "fail",
    detail: "alerts reach nobody: SKYNET_ALERT_EMAIL_FROM not set",
  });
  const MARKER = "<!-- bots-start-stopped:start -->";
  type Comment = { type: string; body: string | null; at: string };
  const thread = (detail: string, over: Record<string, unknown> = {}) => ({
    number: 7,
    title: "[fitness] bots-running",
    body: `**What failed:** ${detail}.`,
    lastComment: "",
    createdAt: iso(NOW - 10 * MIN),
    assignees: [],
    botComments: [] as Comment[],
    ...over,
  });
  const starts = (n: number, agoMs = MIN, type = "Bot"): Comment[] =>
    Array.from({ length: n }, () => ({ type, body: `start\n${MARKER}`, at: iso(NOW - agoMs) }));
  const actionsFor = (r: unknown, issues: unknown[], closedIssues: unknown[] = []) =>
    reportActions([r], issues, { nowMs: NOW, closedIssues });
  const kinds = (actions: { kind: string }[]) => actions.map((a) => a.kind);

  it("names each contract's rung in a field code reads", () => {
    const rungs = Object.fromEntries(
      CONTRACTS.map((c: { id: string; rung: string }) => [c.id, c.rung]),
    );
    expect(rungs).toEqual({
      "bots-running": "script",
      "bots-responsive": "wait",
      "decision-cycle": "wait",
      "live-bots-place": "wait",
      "main-deploys": "wait",
      "alerts-reach-owner": "owner",
      "owner-assignment-path": "owner",
      "misses-reach-profile": "wait",
      "memory-has-history": "session",
    });
    for (const c of CONTRACTS) expect(RUNGS).toContain(c.rung);
  });

  it("keeps the two-hour and fourteen-day numbers the issue text promises", () => {
    expect(OWNER_AFTER_MS).toBe(120 * MIN);
    expect(REOPEN_WITHIN_MS).toBe(14 * 24 * 60 * MIN);
  });

  it("opens unassigned while a script or the clock may still fix it, and assigned when only he can", () => {
    expect(actionsFor(stopped(), [])[0]).toMatchObject({ kind: "open", assign: false });
    expect(actionsFor(stale(), [])[0]).toMatchObject({ kind: "open", assign: false });
    expect(actionsFor(mail(), [])[0]).toMatchObject({ kind: "open", assign: true });
  });

  it("holds the owner back through the script's budget, and assigns on the attempt that spends it", () => {
    const at = (botComments: Comment[]) =>
      actionsFor(stopped(), [thread("machine is stopped", { botComments })]);
    expect(at(starts(2))).toEqual([]);
    const spent = at(starts(3));
    expect(kinds(spent)).toEqual(["assign"]);
    expect(spent[0]).toMatchObject({ number: 7, detail: "machine is stopped" });
    expect(spent[0].why).toBe("the automatic fix ran 3 times in 6 hours and this still fails");
  });

  it("counts only a bot's marked comment inside the window, because the repo is public", () => {
    const at = (botComments: Comment[]) =>
      actionsFor(stopped(), [thread("machine is stopped", { botComments })]);
    expect(at(starts(3, MIN, "User"))).toEqual([]);
    expect(at(starts(3, 6 * 60 * MIN + 1000))).toEqual([]);
    expect(at(starts(3, 6 * 60 * MIN))).toHaveLength(1);
    expect(at([{ type: "Bot", body: "unrelated", at: iso(NOW) }])).toEqual([]);
    expect(at([{ type: "Bot", body: null, at: iso(NOW) }])).toEqual([]);
  });

  it("assigns a failure with no script only once it has survived two hours", () => {
    const aged = (ms: number) =>
      thread("last controls poll N min ago", {
        title: "[fitness] bots-responsive",
        createdAt: iso(NOW - ms),
      });
    expect(actionsFor(stale(), [aged(OWNER_AFTER_MS - 1000)])).toEqual([]);
    const due = actionsFor(stale(), [aged(OWNER_AFTER_MS)]);
    expect(kinds(due)).toEqual(["assign"]);
    expect(due[0].why).toBe("it has not cleared on its own in 2 hours");
  });

  it("does not let a script that never acts hold the owner back forever", () => {
    // A machine in a state the start script leaves alone spends no budget and stays failing.
    const young = thread("machine is stopped");
    expect(actionsFor(stopped(), [young])).toEqual([]);
    const old = thread("machine is stopped", { createdAt: iso(NOW - OWNER_AFTER_MS) });
    expect(kinds(actionsFor(stopped(), [old]))).toEqual(["assign"]);
  });

  it("goes straight to him on a credential, on a thread opened earlier", () => {
    const due = actionsFor(mail(), [
      thread("alerts reach nobody: SKYNET_ALERT_EMAIL_FROM not set", {
        title: "[fitness] alerts-reach-owner",
      }),
    ]);
    expect(kinds(due)).toEqual(["assign"]);
    expect(due[0].why).toBe("only the owner can fix this");
  });

  it("moves a verdict to the owner when a dead credential is behind it, whatever its rung", () => {
    // The rungs file's own rule. No fail verdict carries `credential` today, since only a blind read
    // does and blindActions sets the owner rung itself, so this pins the rule for the next caller.
    expect(assignsAtOnce({ rung: "wait", credential: true })).toBe(true);
    expect(assignsAtOnce({ rung: "wait" })).toBe(false);
    expect(whatHappensNext({ rung: "script", credential: true })).toContain("assigned now");
  });

  it("assigns once: not again while he holds it, nor after he took himself off", () => {
    const old = { createdAt: iso(NOW - 5 * 60 * MIN), botComments: starts(3) };
    const held = thread("machine is stopped", { ...old, assignees: [{ login: "ejclark" }] });
    expect(actionsFor(stopped(), [held])).toEqual([]);
    const asked = {
      ...old,
      botComments: [...starts(3), { type: "Bot", body: ASSIGNED_MARKER, at: iso(NOW - MIN) }],
    };
    expect(actionsFor(stopped(), [thread("machine is stopped", asked)])).toEqual([]);
    // A thread that opened assigned carries the marker in its body, and it counts until a reopen.
    const opened = {
      title: "[fitness] alerts-reach-owner",
      body: `**What failed:** alerts reach nobody: SKYNET_ALERT_EMAIL_FROM not set.\n\n${ASSIGNED_MARKER}`,
    };
    const offAgain = thread("x", opened);
    expect(actionsFor(mail(), [offAgain])).toEqual([]);
    const reopened = thread("x", {
      ...opened,
      botComments: [{ type: "Bot", body: REOPENED_MARKER, at: iso(NOW - MIN) }],
    });
    expect(kinds(actionsFor(mail(), [reopened]))).toEqual(["assign"]);
    // A stranger's copy of the marker never stops the email.
    const forged = {
      ...old,
      botComments: [...starts(3), { type: "User", body: ASSIGNED_MARKER, at: iso(NOW - MIN) }],
    };
    expect(kinds(actionsFor(stopped(), [thread("machine is stopped", forged)]))).toEqual([
      "assign",
    ]);
  });

  it("holds on a thread whose comments could not be read: it cannot prove the rung changed", () => {
    const blindThread = thread("alerts reach nobody: SKYNET_ALERT_EMAIL_FROM not set", {
      title: "[fitness] alerts-reach-owner",
      botComments: undefined,
      createdAt: iso(NOW - 5 * 60 * MIN),
    });
    expect(actionsFor(mail(), [blindThread])).toEqual([]);
  });

  it("says a changed cause once, and the assignment's own comment carries it when both land", () => {
    const changed = { ...stopped(), detail: "no primary machine" };
    expect(kinds(actionsFor(changed, [thread("machine is stopped")]))).toEqual(["comment"]);
    const both = actionsFor(changed, [thread("machine is stopped", { botComments: starts(3) })]);
    expect(kinds(both)).toEqual(["assign"]);
    expect(both[0].detail).toBe("no primary machine");
  });

  it("reopens a thread closed within 14 days, and files a new one after", () => {
    const closed = (ago: number, over: Record<string, unknown> = {}) => ({
      ...thread("machine is stopped"),
      state: "CLOSED",
      closedAt: iso(NOW - ago),
      ...over,
    });
    const day = 24 * 60 * MIN;
    expect(actionsFor(stopped(), [], [closed(day)])[0]).toMatchObject({
      kind: "reopen",
      number: 7,
      removeOwner: false,
    });
    expect(kinds(actionsFor(stopped(), [], [closed(14 * day)]))).toEqual(["reopen"]);
    expect(kinds(actionsFor(stopped(), [], [closed(14 * day + 1000)]))).toEqual(["open"]);
    // Someone else's closed issue, or one with no close date, is not this thread.
    expect(
      kinds(actionsFor(stopped(), [], [closed(day, { title: "[fitness] main-deploys" })])),
    ).toEqual(["open"]);
    expect(kinds(actionsFor(stopped(), [], [closed(day, { closedAt: undefined })]))).toEqual([
      "open",
    ]);
    // Two closed threads: the newest holds the attempts.
    const newest = actionsFor(stopped(), [], [closed(2 * day, { number: 8 }), closed(day)]);
    expect(newest[0].number).toBe(7);
  });

  it("unassigns before a reopen, so a reopened thread does not mail him ahead of its rung", () => {
    const held = {
      ...thread("machine is stopped"),
      state: "CLOSED",
      closedAt: iso(NOW - MIN),
      assignees: [{ login: "ejclark" }],
    };
    expect(actionsFor(stopped(), [], [held])).toEqual([
      expect.objectContaining({ kind: "reopen", removeOwner: true }),
    ]);
    // An old assignment does not count against the new failure: this one starts its own clock.
    const open = {
      ...thread("last controls poll N min ago"),
      title: "[fitness] bots-responsive",
      createdAt: iso(NOW - 3 * 24 * 60 * MIN),
      botComments: [
        { type: "Bot", body: ASSIGNED_MARKER, at: iso(NOW - 2 * 24 * 60 * MIN) },
        { type: "Bot", body: REOPENED_MARKER, at: iso(NOW - OWNER_AFTER_MS + 1000) },
      ],
    };
    expect(actionsFor(stale(), [open])).toEqual([]);
    const later = {
      ...open,
      botComments: [
        { type: "Bot", body: ASSIGNED_MARKER, at: iso(NOW - 2 * 24 * 60 * MIN) },
        { type: "Bot", body: REOPENED_MARKER, at: iso(NOW - OWNER_AFTER_MS) },
      ],
    };
    expect(kinds(actionsFor(stale(), [later]))).toEqual(["assign"]);
  });

  it("reopens and assigns in one tick when the reopened thread's rung already says so", () => {
    const closed = {
      ...thread("machine is stopped"),
      state: "CLOSED",
      closedAt: iso(NOW - MIN),
      botComments: starts(3),
    };
    expect(kinds(actionsFor(stopped(), [], [closed]))).toEqual(["reopen", "assign"]);
    const mailThread = { ...closed, title: "[fitness] alerts-reach-owner", botComments: [] };
    expect(kinds(actionsFor(mail(), [], [mailThread]))).toEqual(["reopen", "assign"]);
    // A prior spent budget's comments unread: reopen now, decide on the next tick.
    const unread = { ...closed, botComments: undefined };
    expect(kinds(actionsFor(stopped(), [], [unread]))).toEqual(["reopen"]);
  });

  it("assigns a blind source at two hours, or at once on a dead credential", () => {
    const blind = (over = {}) => ({
      ...contract("bots-running"),
      status: "unknown",
      detail: "cannot read Fly",
      ...over,
    });
    const quietIssue = (ms: number, over = {}) => ({
      number: 12,
      title: "[fitness] cannot read Fly",
      body: "",
      lastComment: "",
      createdAt: iso(NOW - ms),
      assignees: [],
      botComments: [],
      ...over,
    });
    expect(actionsFor(blind(), [])[0]).toMatchObject({ kind: "open-blind", assign: false });
    expect(actionsFor(blind({ credential: true }), [])[0]).toMatchObject({
      kind: "open-blind",
      assign: true,
    });
    expect(actionsFor(blind(), [quietIssue(OWNER_AFTER_MS - 1000)])).toEqual([]);
    const due = actionsFor(blind(), [quietIssue(OWNER_AFTER_MS)]);
    expect(due).toEqual([
      expect.objectContaining({ kind: "assign", number: 12, detail: "cannot read Fly" }),
    ]);
    expect(kinds(actionsFor(blind({ credential: true }), [quietIssue(MIN)]))).toEqual(["assign"]);
    expect(
      actionsFor(blind(), [
        quietIssue(5 * 60 * MIN, {
          botComments: [{ type: "Bot", body: ASSIGNED_MARKER, at: iso(NOW - MIN) }],
        }),
      ]),
    ).toEqual([]);
  });

  it("never opens, closes or escalates on a quiet read", () => {
    const quiet = {
      ...contract("bots-responsive"),
      status: "quiet",
      detail: "machine is stopped: bots-running reports this",
    };
    const open = thread("x", {
      title: "[fitness] bots-responsive",
      createdAt: iso(NOW - 9 * 60 * MIN),
    });
    expect(actionsFor(quiet, [])).toEqual([]);
    expect(actionsFor(quiet, [open])).toEqual([]);
    const blindFly = { ...open, title: "[fitness] cannot read Fly" };
    expect(actionsFor(quiet, [blindFly])).toEqual([]);
  });

  it("re-assigns under the bot what a person assigned, and leaves the path's own thread unassigned", () => {
    const self = {
      ...contract("owner-assignment-path"),
      ...judgeAssignmentPath(
        {
          assignable: true,
          issues: [
            {
              number: 6501,
              title: "[fitness] alerts-reach-owner",
              state: "OPEN",
              timelineItems: {
                nodes: [
                  {
                    createdAt: iso(NOW - 60 * MIN),
                    actor: { __typename: "User", login: "ejclark" },
                    assignee: { login: "ejclark" },
                  },
                ],
              },
            },
          ],
        },
        NOW,
      ),
    };
    const actions = actionsFor(self, []);
    expect(actions).toEqual([
      expect.objectContaining({ kind: "open", assign: false }),
      { kind: "reassign", number: 6501 },
    ]);
  });

  describe("the assignment path judge", () => {
    const event = (type: string | null, ago: number, to = "ejclark") => ({
      createdAt: iso(NOW - ago),
      actor: type ? { __typename: type, login: type === "Bot" ? "skynet-envoy" : "ejclark" } : null,
      assignee: { login: to },
    });
    const held = (number: number, title: string, state: string, nodes: unknown[]) => ({
      number,
      title,
      state,
      timelineItems: { nodes },
    });
    const path = (issues: unknown[], assignable = true) =>
      judgeAssignmentPath({ assignable, issues }, NOW);
    const day = 24 * 60 * MIN;

    it("passes on a bot's assignment inside 30 days, and fails a day past it", () => {
      const at = (ago: number) => path([held(1, "work", "OPEN", [event("Bot", ago)])]);
      expect(at(day).status).toBe("pass");
      expect(at(30 * day).status).toBe("pass");
      expect(at(30 * day + 1000).status).toBe("fail");
      expect(at(30 * day + 1000).detail).toContain("no bot has assigned the owner");
    });

    it("fails when he cannot be assigned, whatever the history says", () => {
      const r = path([held(1, "work", "OPEN", [event("Bot", day)])], false);
      expect(r).toEqual({
        status: "fail",
        detail: "the owner cannot be assigned on this repository",
      });
    });

    it("does not count a person's assignment, another assignee, or an actor GitHub cannot name", () => {
      expect(path([]).status).toBe("fail");
      expect(path([held(1, "work", "OPEN", [event("User", day)])]).status).toBe("fail");
      expect(path([held(1, "work", "OPEN", [event("Bot", day, "someone")])]).status).toBe("fail");
      expect(path([held(1, "work", "OPEN", [event(null, day)])]).status).toBe("fail");
    });

    it("fails on an open fitness issue he assigned himself, and names it for the re-assign", () => {
      const r = path([
        held(4, "work", "OPEN", [event("Bot", day)]),
        held(6501, "[fitness] alerts-reach-owner", "OPEN", [event("User", MIN)]),
      ]);
      expect(r.status).toBe("fail");
      expect(r.detail).toBe("a person assigned #6501, which sends no notice");
      expect(r.reassign).toEqual([6501]);
      expect(r.rung).toBe("script");
    });

    it("judges a fitness issue by its newest assignment, and ignores a closed one or other work", () => {
      const after = held(9, "[fitness] x", "OPEN", [event("User", 2 * MIN), event("Bot", MIN)]);
      expect(path([after]).status).toBe("pass");
      const before = held(9, "[fitness] x", "OPEN", [event("Bot", 2 * MIN), event("User", MIN)]);
      expect(path([before]).reassign).toEqual([9]);
      const closed = held(9, "[fitness] x", "CLOSED", [event("Bot", day), event("User", MIN)]);
      expect(path([closed]).status).toBe("pass");
      const mine = [held(9, "my own task", "OPEN", [event("Bot", day), event("User", MIN)])];
      expect(path(mine).status).toBe("pass");
    });

    // #6701: GitHub's assignee filter drops a thread he left, so the read adds the fitness threads.
    it("counts a bot's assignment on a fitness thread he left, and only that", () => {
      const stale = held(1, "work", "OPEN", [event("Bot", 31 * day)]);
      const left = held(7, "[fitness] bots-running", "OPEN", [event("Bot", 120 * MIN)]);
      const both = (threads: unknown[]) =>
        judgeAssignmentPath({ assignable: true, issues: [stale], threads }, NOW);
      expect(both([left]).status).toBe("pass");
      // Nothing fresh anywhere, held or left: it still fails, and the drill opens as today.
      const oldLeft = held(7, "[fitness] bots-running", "CLOSED", [event("Bot", 31 * day)]);
      expect(both([oldLeft]).detail).toContain("no bot has assigned the owner");
      expect(both([]).status).toBe("fail");
      // A thread he left and had assigned himself is his answer, not a re-assign.
      const selfLeft = held(8, "[fitness] x", "OPEN", [event("Bot", day), event("User", MIN)]);
      const r = both([selfLeft]);
      expect(r.status).toBe("pass");
      expect(r.reassign).toBeUndefined();
      // A pull request the search returns comes back as an empty node.
      expect(both([{}]).status).toBe("fail");
    });

    it("says in its own words that it does not prove the email or the watch", () => {
      const text = contract("owner-assignment-path").mustBeTrue;
      expect(text).toContain("does not prove");
      expect(text).toContain("watch");
    });
  });

  it("leaves the mail contract reading the mail credential: this path does not satisfy it", () => {
    expect(contract("alerts-reach-owner").mustBeTrue).toBe(
      "The dashboard holds the mail credential a critical alert needs. This does not prove an alert reaches the owner: each account must also opt in, delivery is off by default, and nothing here reads that",
    );
    expect(judgeAlertReach(["OTHER"]).status).toBe("fail");
  });

  (existsSync(START) ? it : it.skip)(
    "keeps the start script and this contract on one thread with one budget",
    () => {
      const script = readFileSync(START, "utf8");
      const { attempts } = contract("bots-running");
      expect(script).toContain('ISSUE_TITLE="[fitness] bots-running"');
      expect(script).toContain(`START_MARKER='${attempts.marker}'`);
      expect(script).toContain(`MAX_STARTS=${attempts.max}`);
      expect(script).toContain(`WINDOW_HOURS=${attempts.windowHours}`);
      expect(script).toContain(REOPENED_MARKER);
      // The one line both scripts post when a fix did not hold.
      expect(script.replaceAll("$REOPEN_DAYS", "14")).toContain(REOPEN_LINE);
    },
  );
});
