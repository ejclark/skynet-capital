import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  CONTRACTS,
  HOMES,
  judgeAlertReach,
  judgeAssignmentPath,
  judgeDeploys,
  judgeMachine,
  judgeStamp,
  reportActions,
  whereAmI,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/fitness.mjs";
import {
  ASSIGNED_MARKER,
  OWNER_AFTER_MS,
  REOPEN_WITHIN_MS,
  REOPENED_MARKER,
  RUNGS,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/fitness-rungs.mjs";

// #6470. The judges are pure and seeded below; the wiring (what fly and gh are asked, what the
// script does with a bad reply, a hung read, a refused write, and where it writes at all) is driven
// through the real entrypoint against stub binaries that record their arguments, because a spec
// that only exercised the judges caught 0 of 15 deliberate bugs in the probes and the wiring.
//
// Graded blind: tests/scripts/fixtures/fitness-heldout-bugs.json holds 30 deliberate bugs written
// by a pass that never saw this spec; it caught 29 before the never-polled stamp seed was added.
// That list is the regression list now (`node scripts/fitness-audit.mjs --bugs <it> --with ...`,
// the --with files are the ones named below, plus scripts/deploy-lag.mjs and
// scripts/bot-relevant.mjs, scripts/bots-start-stopped.sh and scripts/fitness-rungs.mjs), so a new
// score needs bugs from a fresh blind pass. The 19 after the first 30 attack the owner's assignment
// and were written by the author of this spec, so they are a regression net and not a blind score.
const SCRIPT = resolve("scripts/fitness.mjs");
const START = resolve("scripts/bots-start-stopped.sh");
const REPLAY = resolve("tests/fixtures/fitness/replay-2026-10-22.json");
const WORKFLOW = resolve(".github/workflows/bots-catchup.yml");

const NOW = Date.parse("2026-11-01T06:00:00Z");
const MIN = 60_000;
const standby = { state: "stopped", config: { standbys: ["m1"] } };
const iso = (ms: number) => new Date(ms).toISOString();

const failing = {
  id: "bots-running",
  reads: "Fly",
  reaches: "an issue assigned to the owner",
  status: "fail",
  detail: "machine is stopped",
};

describe("fitness judges", () => {
  it("fails a stopped machine, whatever a standby is doing", () => {
    expect(judgeMachine([standby, { state: "stopped", config: {} }]).status).toBe("fail");
    expect(judgeMachine([standby, { state: "started", config: {} }]).status).toBe("pass");
    expect(judgeMachine([standby]).status).toBe("fail");
  });

  it("passes a stop a person marked", () => {
    const halted = {
      state: "stopped",
      config: { metadata: { "skynet-halt": "eric paused" } },
    };
    expect(judgeMachine([halted]).status).toBe("pass");
  });

  it("fails a stale or unreachable process that still reads as started", () => {
    const fresh = iso(NOW - MIN);
    expect(judgeStamp({ lastControlsPollAt: fresh, bridge: "armed" }, NOW).status).toBe("pass");
    expect(
      judgeStamp({ lastControlsPollAt: iso(NOW - 60 * MIN), bridge: "armed" }, NOW).status,
    ).toBe("fail");
    expect(judgeStamp({ lastControlsPollAt: fresh, bridge: "unreachable" }, NOW).status).toBe(
      "fail",
    );
    expect(judgeStamp({}, NOW).status).toBe("fail");
  });

  it("holds the stamp boundary: five minutes passes, a second more fails", () => {
    const at = (ms: number) =>
      judgeStamp({ lastControlsPollAt: iso(NOW - ms), bridge: "armed" }, NOW);
    expect(at(5 * MIN).status).toBe("pass");
    expect(at(5 * MIN + 1000).status).toBe("fail");
  });

  // The one bug of 30 the blind list got past the spec: a stamp that never polled has a NaN age,
  // which no size compare catches, so an armed bridge alone read as alive.
  it("fails a stamp that never polled, even with the bridge armed", () => {
    const never = judgeStamp({ bridge: "armed" }, NOW);
    expect(never).toEqual({ status: "fail", detail: "the stamp has no controls poll" });
    const garbled = judgeStamp({ lastControlsPollAt: "not a date", bridge: "armed" }, NOW);
    expect(garbled.status).toBe("fail");
  });

  it("cannot age a stamp dated ahead of its clock, but forgives the seconds two clocks differ by", () => {
    const ahead = (ms: number) =>
      judgeStamp({ lastControlsPollAt: iso(NOW + ms), bridge: "armed" }, NOW);
    expect(ahead(30_000).status).toBe("pass");
    expect(ahead(60 * MIN)).toEqual({
      status: "unknown",
      detail: "the stamp is dated in the future",
    });
  });

  it("reads deploys from what is running, and passes only when both apps are current", () => {
    const current = judgeDeploys({ lagging: false, bots: { known: true, lagging: false } }, NOW);
    expect(current.status).toBe("pass");
    expect(current.detail).toBe("both apps current");
  });

  it("gives a fresh push its deploy minutes, then fails the oldest undeployed commit", () => {
    const after = (ms: number) => judgeDeploys({ lagging: true, since: iso(NOW - ms) }, NOW);
    expect(after(5 * MIN).status).toBe("pass");
    expect(after(5 * MIN).detail).toContain("inside the deploy grace");
    expect(after(20 * MIN).status).toBe("pass");
    // The boundary is the millisecond, not the rounded minute.
    expect(after(20 * MIN + 1000).status).toBe("fail");
    expect(after(21 * MIN).status).toBe("fail");
    expect(after(45 * MIN).detail).toBe("dashboard undeployed 45 min");
  });

  it("cannot age a lag dated ahead of its own clock, which the API has done by an hour", () => {
    const ahead = judgeDeploys({ lagging: true, since: iso(NOW + 60 * MIN) }, NOW);
    expect(ahead.status).toBe("unknown");
    expect(ahead.detail).toBe("the dashboard lag is dated in the future");
  });

  it("judges the bots half by the same rule, not by a run's colour", () => {
    const bots = (ms: number) =>
      judgeDeploys({ lagging: false, bots: { lagging: true, since: iso(NOW - ms) } }, NOW);
    expect(bots(10 * MIN).status).toBe("pass");
    expect(bots(90 * MIN).status).toBe("fail");
    expect(bots(90 * MIN).detail).toBe("bots undeployed 90 min");
  });

  it("treats no evidence as unknown, never as a pass", () => {
    expect(judgeDeploys(null, NOW).status).toBe("unknown");
    // deploy-lag's reason stays out of the detail: an issue carries the contract's words only.
    const blind = judgeDeploys({ known: false, reason: "could not read GitHub state" }, NOW);
    expect(blind).toEqual({ status: "unknown", detail: "cannot read GitHub" });
    // The bots half unreadable is not a pass for the whole, even with the dashboard current.
    const halfBlind = judgeDeploys({ lagging: false, bots: { known: false } }, NOW);
    expect(halfBlind).toEqual({ status: "unknown", detail: "cannot read the bots deploys" });
    // A lag with no date cannot be aged, so it cannot be waved through as young.
    expect(judgeDeploys({ lagging: true }, NOW).status).toBe("unknown");
    // One half it cannot date never hides the other half's failure.
    const masked = judgeDeploys(
      { lagging: true, bots: { lagging: true, since: iso(NOW - 90 * MIN) } },
      NOW,
    );
    expect(masked).toEqual({ status: "fail", detail: "bots undeployed 90 min" });
  });

  it("fails an alarm that can reach nobody, the 10-18 to 11-01 gap", () => {
    const key = "SKYNET_ALERT_EMAIL_API_KEY";
    const from = "SKYNET_ALERT_EMAIL_FROM";
    expect(judgeAlertReach(["OTHER"]).status).toBe("fail");
    expect(judgeAlertReach([key]).detail).toBe(`alerts reach nobody: ${from} not set`);
    expect(judgeAlertReach([key, from]).status).toBe("pass");
  });

  it("knows where it is from the Actions environment, and takes --here as an override", () => {
    expect(whereAmI({}, [])).toBe("session");
    expect(whereAmI({ GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "schedule" }, [])).toBe("clock");
    expect(whereAmI({ GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "workflow_dispatch" }, [])).toBe(
      "clock",
    );
    expect(whereAmI({ GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "push" }, [])).toBe("push");
    expect(whereAmI({}, ["--here", "clock"])).toBe("clock");
    expect(whereAmI({ GITHUB_ACTIONS: "true" }, ["--here", "nowhere"])).toBe("clock");
  });

  it("makes every contract state an outcome, a home, a source, a corrector field, a budget and who hears it", () => {
    expect(new Set(CONTRACTS.map((c: { id: string }) => c.id)).size).toBe(CONTRACTS.length);
    for (const contract of CONTRACTS) {
      expect(contract.mustBeTrue.length).toBeGreaterThan(10);
      expect(HOMES).toContain(contract.home);
      expect(contract.reads.length).toBeGreaterThan(0);
      expect(contract).toHaveProperty("corrector");
      expect(contract.budget.length).toBeGreaterThan(0);
      expect(contract.reaches.length).toBeGreaterThan(0);
      expect(typeof contract.probe).toBe("function");
    }
  });

  it("no longer carries the startup size: config-audit prints that number", () => {
    expect(CONTRACTS.map((c: { id: string }) => c.id)).not.toContain("startup-size");
  });
});

describe("fitness reporting", () => {
  const issue = {
    number: 7,
    title: "[fitness] bots-running",
    body: "**What failed:** machine is stopped.",
    lastComment: "",
  };

  it("opens one issue for a new failure", () => {
    expect(reportActions([failing], [])).toEqual([
      { kind: "open", result: failing, assign: false },
    ]);
  });

  it("stays quiet about a failure it already reported", () => {
    expect(reportActions([failing], [issue])).toEqual([]);
  });

  it("comments once when a standing failure changes its cause", () => {
    const changed = { ...failing, detail: "no primary machine" };
    expect(reportActions([changed], [issue])).toEqual([
      { kind: "comment", number: 7, result: changed },
    ]);
    expect(
      reportActions([changed], [{ ...issue, lastComment: "it changed: no primary machine." }]),
    ).toEqual([]);
  });

  it("ignores a running number: a stale stamp is one failure, not one per tick", () => {
    const stale = (min: number) => ({
      ...failing,
      id: "bots-responsive",
      detail: `last controls poll ${min} min ago`,
    });
    const open = {
      ...issue,
      title: "[fitness] bots-responsive",
      body: "**What failed:** last controls poll 10 min ago.",
    };
    expect(reportActions([stale(25)], [open])).toEqual([]);
    const commented = {
      ...open,
      body: "",
      lastComment: "it changed: last controls poll 40 min ago.",
    };
    expect(reportActions([stale(25)], [commented])).toEqual([]);
    // Eight ticks of the same stale stamp through the judge: one open, no comments.
    const lastPoll = NOW - 10 * MIN;
    const tally = simulate(
      Array.from({ length: 8 }, (_, tick) => ({
        ...failing,
        id: "bots-responsive",
        ...judgeStamp(
          { lastControlsPollAt: iso(lastPoll), bridge: "armed" },
          NOW + tick * 15 * MIN,
        ),
      })),
    );
    expect(tally).toEqual({ opens: 1, comments: 0, closes: 0, reopens: 0, assigns: 0 });
  });

  it("comments when a cause narrows: one app still undeployed is not the two it reported", () => {
    const both = {
      ...issue,
      title: "[fitness] main-deploys",
      body: "**What failed:** dashboard undeployed 45 min, bots undeployed 30 min.",
    };
    const narrowed = { ...failing, id: "main-deploys", detail: "dashboard undeployed 60 min" };
    expect(reportActions([narrowed], [both])).toEqual([
      { kind: "comment", number: 7, result: narrowed },
    ]);
  });

  it("closes the issue when the check passes", () => {
    const ok = { ...failing, status: "pass", detail: "started" };
    expect(reportActions([ok], [issue])).toEqual([{ kind: "close", number: 7, result: ok }]);
    expect(reportActions([ok], [])).toEqual([]);
  });

  it("leaves a contract's own issue alone on an unknown, which proves neither health nor failure", () => {
    const blind = { ...failing, status: "unknown", detail: "cannot read Fly" };
    expect(
      reportActions([blind], [issue]).filter((a: { kind: string }) => a.kind !== "open-blind"),
    ).toEqual([]);
  });

  it("files nothing for a contract that reaches the session, whatever it says", () => {
    const memory = {
      ...failing,
      id: "memory-has-history",
      reads: "this machine",
      reaches: "the session",
    };
    expect(reportActions([memory], [])).toEqual([]);
    expect(reportActions([{ ...memory, status: "unknown" }], [])).toEqual([]);
  });

  it("never acts on not-here: a contract away from home is placed, not judged", () => {
    const away = {
      ...failing,
      status: "not-here",
      detail: "runs in the clock, and this is the session",
    };
    expect(reportActions([away], [issue])).toEqual([]);
    expect(reportActions([away], [])).toEqual([]);
  });

  it("opens one quiet issue per source nobody could read, not one per contract", () => {
    const blind = (id: string, detail = "cannot read Fly") => ({
      ...failing,
      id,
      status: "unknown",
      detail,
    });
    const tick = [
      blind("bots-running"),
      blind("bots-responsive", "cannot read the health stamp"),
      {
        ...failing,
        id: "main-deploys",
        reads: "GitHub",
        status: "pass",
        detail: "both apps current",
      },
      blind("alerts-reach-owner"),
    ];
    const actions = reportActions(tick, []);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ kind: "open-blind", source: "Fly" });
    expect(actions[0].results.map((r: { id: string }) => r.id)).toEqual([
      "bots-running",
      "bots-responsive",
      "alerts-reach-owner",
    ]);
    // Already open: nothing more, not even a comment. Its age is the signal.
    const open = { number: 12, title: "[fitness] cannot read Fly", body: "", lastComment: "" };
    expect(reportActions(tick, [open])).toEqual([]);
  });

  it("closes the blind issue once the source reads again, and only then", () => {
    const open = { number: 12, title: "[fitness] cannot read Fly", body: "", lastComment: "" };
    const readable = { ...failing, status: "pass", detail: "started" };
    expect(reportActions([readable], [open])).toEqual([
      { kind: "close-blind", number: 12, source: "Fly" },
    ]);
    // One contract still blind on that source keeps it open.
    const half = {
      ...failing,
      id: "alerts-reach-owner",
      status: "unknown",
      detail: "cannot read Fly",
    };
    expect(reportActions([readable, half], [open])).toEqual([]);
    // Nobody at home read the source this tick: it stays, because nothing was learned.
    const away = {
      ...failing,
      status: "not-here",
      detail: "runs in the clock, and this is the session",
    };
    expect(reportActions([away], [open])).toEqual([]);
  });

  // The 10-22 bots outage replayed on the clock's real tick times (228 ticks, 57 push runs, from
  // tests/fixtures/fitness/replay-2026-10-22.json). A run's success stands in for the dashboard
  // deploy job, as the study's simulation did. The unchanged script posted 70 comments over this
  // outage, one per change of its "N failed in a row" streak; the target is one per failure state.
  // The history holds two: a green run at 10-25 02:10 healed the first, and 02:16 broke it again.
  it("replays the 10-22 outage at the real tick times with one issue per failure state and no comment storm", () => {
    const { ticks, runs } = JSON.parse(readFileSync(REPLAY, "utf8")) as {
      ticks: string[];
      runs: Run[];
    };
    const verdicts = ticks.map((tick) => ({
      tick,
      at: Date.parse(tick),
      lag: lagAt(runs, Date.parse(tick)),
      ...judgeDeploys(lagAt(runs, Date.parse(tick)), Date.parse(tick)),
    }));
    const assignedAt: number[] = [];
    const tally = simulate(
      verdicts.map((v) => ({ ...contract("main-deploys"), ...v })),
      (at) => assignedAt.push(at),
    );
    // One thread: the second failure state reopens the first, with one line, instead of a new issue.
    expect(tally).toEqual({ opens: 1, comments: 0, closes: 1, reopens: 1, assigns: 2 });
    // Nobody is assigned until the failure has survived two hours, once per failure state. The
    // bound above is one clock gap: the first tick past two hours does it, never a later one.
    const reds = verdicts.filter((v) => v.status === "fail");
    const redStates = reds.filter(
      (v, i) => i === 0 || verdicts[verdicts.indexOf(v) - 1].status !== "fail",
    );
    expect(redStates).toHaveLength(2);
    expect(assignedAt).toHaveLength(2);
    redStates.forEach((red, i) => {
      const waited = (assignedAt[i] ?? Number.NaN) - red.at;
      expect(waited).toBeGreaterThanOrEqual(OWNER_AFTER_MS);
      expect(waited).toBeLessThan(OWNER_AFTER_MS + 60 * MIN);
    });
    // Detected within the grace plus one tick gap of the oldest undeployed commit landing.
    const firstRed = verdicts.find((v) => v.status === "fail");
    expect(firstRed).toBeDefined();
    const detectMs = Date.parse(firstRed?.tick ?? "") - Date.parse(firstRed?.lag.since ?? "");
    expect(detectMs).toBeLessThan(60 * MIN);
  });
});

type Run = { sha: string; createdAt: string; updatedAt: string; conclusion: string };

/** deploy-lag's shape rebuilt from push runs at one moment: a run's success stands in for the deploy job. */
function lagAt(runs: Run[], now: number) {
  const seen = runs.filter((r) => Date.parse(r.createdAt) <= now);
  const head = seen.at(-1);
  const released = [...seen]
    .reverse()
    .find((r) => r.conclusion === "success" && Date.parse(r.updatedAt) <= now);
  const stranded = released
    ? seen.filter((r) => Date.parse(r.createdAt) > Date.parse(released.createdAt))
    : [];
  const lagging = Boolean(head && released && head.sha !== released.sha);
  return { lagging, since: stranded[0]?.createdAt, bots: { known: true, lagging: false } };
}

/** Feed one contract's results tick by tick through reportActions, playing GitHub's part. */
function simulate(
  ticks: { id: string; detail: string; at?: number }[],
  onAssign?: (at: number) => void,
) {
  const tally = { opens: 0, comments: 0, closes: 0, reopens: 0, assigns: 0 };
  type Thread = {
    number: number;
    title: string;
    body: string;
    lastComment: string;
    createdAt: string;
    assignees: { login: string }[];
    botComments: { type: string; body: string; at: string }[];
    state?: string;
    closedAt?: string;
  };
  let issue: Thread | null = null;
  let closed: Thread | null = null;
  ticks.forEach((r, i) => {
    const nowMs = r.at ?? NOW + i * 15 * MIN;
    const say = (body: string) => {
      issue?.botComments.push({ type: "Bot", body, at: iso(nowMs) });
    };
    const actions = reportActions([r], issue ? [issue] : [], {
      nowMs,
      closedIssues: closed ? [closed] : [],
    });
    for (const a of actions) {
      if (a.kind === "open") {
        tally.opens++;
        issue = {
          number: 1,
          title: `[fitness] ${r.id}`,
          body: `**What failed:** ${r.detail}.`,
          lastComment: "",
          createdAt: iso(nowMs),
          assignees: [],
          botComments: [],
        };
      }
      if (a.kind === "reopen" && closed) {
        tally.reopens++;
        issue = { ...closed, assignees: [], state: "OPEN" };
        closed = null;
        say(REOPENED_MARKER);
      }
      if (a.kind === "comment" && issue) {
        tally.comments++;
        issue.lastComment = `Still failing, and it changed: ${r.detail}.`;
      }
      if (a.kind === "assign" && issue) {
        tally.assigns++;
        onAssign?.(nowMs);
        issue.assignees = [{ login: "ejclark" }];
        issue.lastComment = `Assigned to the owner: ${a.why}. Still failing: ${a.detail}.`;
        say(ASSIGNED_MARKER);
      }
      if (a.kind === "close") {
        tally.closes++;
        if (issue) closed = { ...issue, state: "CLOSED", closedAt: iso(nowMs) };
        issue = null;
      }
    }
  });
  return tally;
}

/** A real contract's fields, so a spec reads the rung the contract actually declares. */
function contract(id: string) {
  const found = CONTRACTS.find((c: { id: string }) => c.id === id);
  if (!found) throw new Error(`no contract ${id}`);
  const { probe: _probe, ...fields } = found;
  return fields;
}

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
      "main-deploys": "wait",
      "alerts-reach-owner": "owner",
      "owner-assignment-path": "owner",
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

  it("assigns once: not again while he holds it, nor after he took himself off", () => {
    const old = { createdAt: iso(NOW - 5 * 60 * MIN), botComments: starts(3) };
    const held = thread("machine is stopped", { ...old, assignees: [{ login: "ejclark" }] });
    expect(actionsFor(stopped(), [held])).toEqual([]);
    const asked = {
      ...old,
      botComments: [...starts(3), { type: "Bot", body: ASSIGNED_MARKER, at: iso(NOW - MIN) }],
    };
    expect(actionsFor(stopped(), [thread("machine is stopped", asked)])).toEqual([]);
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

    it("says in its own words that it does not prove the email or the watch", () => {
      const text = contract("owner-assignment-path").mustBeTrue;
      expect(text).toContain("does not prove");
      expect(text).toContain("watch");
    });
  });

  it("leaves the mail contract reading the mail outcome: this path does not satisfy it", () => {
    expect(contract("alerts-reach-owner").mustBeTrue).toBe(
      "A critical alert reaches the owner when they are not looking",
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
    },
  );
});

// ---- wiring: the real entrypoint against stub fly and gh ------------------------------------------

// Each reply is tied to the app it belongs to, so a probe asking the wrong app reads nothing.
const STUB_FLY = `#!/usr/bin/env bash
S="$STUB"; echo "$*" >> "$S/fly-calls"
[[ -f "$S/fly-dead" ]] && { echo "Error: token expired" >&2; exit 1; }
app() { [[ "$*" == *"-a $1"* ]] || { echo "Error: app not found" >&2; exit 1; }; }
case "$1 $2" in
  "machine list") app "skynet-capital-bots --json" "$@"
    if [[ -f "$S/machines-first" ]]; then cat "$S/machines-first"; rm "$S/machines-first"; else cat "$S/machines"; fi ;;
  "machine exec") app "skynet-capital-bots --timeout" "$@"; [[ -f "$S/exec-hang" ]] && sleep 5; cat "$S/stamp" ;;
  "machine start") cp "$S/machines-up" "$S/machines" ;;
  "secrets list") app "skynet-capital --json" "$@"; cat "$S/secrets" ;;
esac
`;

// deploy-lag's gh api calls land here too, so the main-deploys contract is driven end to end.
const STUB_GH = `#!/usr/bin/env bash
S="$STUB"; echo "$*" >> "$S/gh-calls"
case "$1 $2" in
  "issue list")
    if [[ "$*" == *--search* ]]; then
      [[ -f "$S/closed-dead" ]] && { echo "HTTP 502" >&2; exit 1; }
      cat "$S/closed"
    else cat "$S/issues"; fi ;;
  "issue create") [[ -f "$S/gh-refuse" ]] && { echo "HTTP 502" >&2; exit 1; }; echo "https://github.com/x/y/issues/99" ;;
  "api --method") [[ -f "$S/edit-refuse" ]] && { echo "HTTP 403" >&2; exit 1; } ;;
  "issue comment"|"issue close"|"issue reopen") ;;
  api*)
    case "$2" in
      *assignees/*)
        [[ -f "$S/not-assignable" ]] && { echo "gh: Not Found (HTTP 404)" >&2; exit 1; }
        [[ -f "$S/assign-dead" ]] && { echo "gh: HTTP 502" >&2; exit 1; } ;;
      graphql) [[ -f "$S/graphql-dead" ]] && { echo "gh: HTTP 502" >&2; exit 1; }; cat "$S/graphql" ;;
      *issues/*/comments*)
        [[ -f "$S/comments-dead" ]] && { echo "gh: HTTP 502" >&2; exit 1; }
        [[ "$2" =~ issues/([0-9]+)/comments ]]; f="$S/comments-\${BASH_REMATCH[1]}"
        if [[ -f "$f" ]]; then jq -c "$5" "$f"; fi ;;
      *commits/main) cat "$S/api-head" ;;
      *pipeline.yml/runs*) cat "$S/api-runs" ;;
      *compare/*) cat "$S/api-compare" ;;
      *) [[ "$2" =~ runs/([0-9]+)/jobs ]] && cat "$S/api-jobs-\${BASH_REMATCH[1]}" ;;
    esac ;;
esac
exit 0
`;

// One GitHub that remembers, for the replay: both scripts read and write the same thread. Anything
// else (deploy-lag's reads, the assignment path) falls through to the plain stub above.
const STATEFUL_GH = `#!/usr/bin/env node
const fs = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");
const S = process.env.STUB;
const file = join(S, "threads.json");
const argv = process.argv.slice(2);
const db = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { issues: [] };
const save = () => fs.writeFileSync(file, JSON.stringify(db));
const flag = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const stamp = () => new Date().toISOString().replace(/\\.\\d{3}Z$/, "Z");
const find = () => db.issues.find((i) => i.number === Number(argv[2]));
const say = (issue, body) => issue.comments.push({ body, created_at: stamp() });
const shape = (i) => ({
  number: i.number,
  title: i.title,
  body: i.body,
  state: i.state,
  closedAt: i.closedAt,
  createdAt: i.createdAt,
  assignees: i.assignees.map((login) => ({ login })),
  comments: i.comments.map((c) => ({ body: c.body })),
});
const op = argv[0] + " " + argv[1];
if (op === "issue list") {
  const rows = flag("--search") ? db.issues : db.issues.filter((i) => i.state === "OPEN");
  console.log(JSON.stringify(rows.map(shape)));
} else if (op === "issue create") {
  const number = db.issues.length + 1;
  const assignee = flag("--assignee");
  db.issues.push({
    number,
    title: flag("--title"),
    body: flag("--body"),
    state: "OPEN",
    createdAt: stamp(),
    assignees: assignee ? [assignee] : [],
    assigned: assignee ? 1 : 0,
    comments: [],
  });
  save();
  console.log("https://github.com/o/r/issues/" + number);
} else if (op === "issue comment") {
  say(find(), flag("--body"));
  save();
} else if (op === "issue close" || op === "issue reopen") {
  const issue = find();
  issue.state = op === "issue close" ? "CLOSED" : "OPEN";
  issue.closedAt = op === "issue close" ? stamp() : undefined;
  say(issue, flag("--comment"));
  save();
} else if (op === "api --method") {
  const number = Number(argv[3].match(/issues\\/(\\d+)\\/assignees/)[1]);
  const issue = db.issues.find((i) => i.number === number);
  const login = argv[5].replace("assignees[]=", "");
  if (argv[2] === "DELETE") issue.assignees = issue.assignees.filter((a) => a !== login);
  else if (!issue.assignees.includes(login)) {
    issue.assignees.push(login);
    issue.assigned++;
  }
  save();
} else if (argv[0] === "api" && /issues\\/\\d+\\/comments/.test(argv[1])) {
  const number = Number(argv[1].match(/issues\\/(\\d+)\\/comments/)[1]);
  const issue = db.issues.find((i) => i.number === number);
  const rows = (issue ? issue.comments : []).map((c) => ({ ...c, user: { type: "Bot" } }));
  const res = spawnSync("jq", ["-c", flag("--jq")], { input: JSON.stringify(rows), encoding: "utf8" });
  process.stdout.write(res.stdout);
} else {
  const res = spawnSync(join(S, "gh-plain"), argv, { encoding: "utf8", env: process.env });
  process.stdout.write(res.stdout ?? "");
  process.stderr.write(res.stderr ?? "");
  process.exit(res.status ?? 1);
}
`;

const HEAD = "aaaaaaa0000000000000000000000000000000aa";
const NEXT = "bbbbbbb0000000000000000000000000000000bb";
const landed = `{"jobs":[{"name":"release · deploy","conclusion":"success"},{"name":"release · deploy bots","steps":[{"name":"Deploy bots","conclusion":"success"},{"name":"Smoke test the bots release","conclusion":"success"}]}]}`;
const skipped = `{"jobs":[{"name":"release · deploy","conclusion":"failure"},{"name":"release · deploy bots","steps":[{"name":"Deploy bots","conclusion":"skipped"}]}]}`;

/** The assignment-path reply: one piece of work a bot assigned him at `at`. */
function graphqlReply(at: number, extra: unknown[] = []) {
  const nodes = [
    {
      number: 4612,
      title: "some work",
      state: "OPEN",
      timelineItems: {
        nodes: [
          {
            createdAt: iso(at),
            actor: { __typename: "Bot", login: "skynet-envoy" },
            assignee: { login: "ejclark" },
          },
        ],
      },
    },
    ...extra,
  ];
  return { data: { repository: { issues: { nodes } } } };
}

type World = {
  machine?: string;
  machines?: string;
  stampAgeMs?: number;
  secrets?: string[];
  deploy?: "current" | "young" | "late" | "future" | "unreadable";
  issues?: unknown[];
  memoryHistory?: boolean | "none";
  closed?: unknown[];
  comments?: Record<number, unknown[]>;
  assignedAgoMs?: number;
};

/** A stub world. Healthy by default: machine started, fresh stamp, secrets set, deploys current. */
function fixture(world: World = {}) {
  const stub = mkdtempSync(join(tmpdir(), "fitness-"));
  const now = Date.now();
  writeFileSync(
    join(stub, "machines"),
    world.machines ??
      `[{"id":"standby1","state":"stopped","config":{"standbys":["m1"]}},{"id":"m1","state":"${world.machine ?? "started"}","config":{"env":{"GIT_SHA":"${HEAD}"}}}]`,
  );
  writeFileSync(
    join(stub, "stamp"),
    JSON.stringify({ lastControlsPollAt: iso(now - (world.stampAgeMs ?? MIN)), bridge: "armed" }),
  );
  const secrets = world.secrets ?? ["SKYNET_ALERT_EMAIL_API_KEY", "SKYNET_ALERT_EMAIL_FROM"];
  writeFileSync(join(stub, "secrets"), JSON.stringify(secrets.map((name) => ({ Name: name }))));
  writeFileSync(join(stub, "issues"), JSON.stringify(world.issues ?? []));
  writeFileSync(join(stub, "closed"), JSON.stringify(world.closed ?? []));
  for (const [n, rows] of Object.entries(world.comments ?? {})) {
    writeFileSync(join(stub, `comments-${n}`), JSON.stringify(rows));
  }
  writeFileSync(
    join(stub, "graphql"),
    JSON.stringify(graphqlReply(now - (world.assignedAgoMs ?? 24 * 60 * MIN))),
  );
  const deploy = world.deploy ?? "current";
  if (deploy !== "unreadable") {
    const head = deploy === "current" ? HEAD : NEXT;
    writeFileSync(join(stub, "api-head"), JSON.stringify({ sha: head }));
    const runs =
      deploy === "current"
        ? [{ id: 1, head_sha: HEAD }]
        : [
            { id: 2, head_sha: NEXT },
            { id: 1, head_sha: HEAD },
          ];
    writeFileSync(join(stub, "api-runs"), JSON.stringify({ workflow_runs: runs }));
    writeFileSync(join(stub, "api-jobs-1"), landed);
    writeFileSync(join(stub, "api-jobs-2"), skipped);
    const since = iso(now - { current: 5, young: 5, late: 45, future: -60 }[deploy] * MIN);
    writeFileSync(
      join(stub, "api-compare"),
      JSON.stringify({
        commits: [
          {
            sha: NEXT,
            commit: { message: "docs: x", committer: { date: since } },
            author: { login: "ejclark" },
          },
        ],
        files: [{ filename: "docs/IDEAS.md" }],
      }),
    );
  }
  // A home with one memory folder, versioned or bare, for the session contract.
  const memory = join(stub, "home", ".claude", "projects", "p", "memory");
  if (world.memoryHistory !== "none") {
    mkdirSync(memory, { recursive: true });
    writeFileSync(join(memory, "MEMORY.md"), "# memory\n");
    if (world.memoryHistory !== false) mkdirSync(join(memory, ".git"));
  } else mkdirSync(join(stub, "home"), { recursive: true });
  for (const [name, body] of [
    ["fly", STUB_FLY],
    ["gh", STUB_GH],
  ] as const) {
    writeFileSync(join(stub, name), body);
    chmodSync(join(stub, name), 0o755);
  }
  return stub;
}

function run(stub: string, args: string[], env: Record<string, string> = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      STUB: stub,
      FLY_BIN: join(stub, "fly"),
      GH_BIN: join(stub, "gh"),
      PATH: `${stub}:${process.env.PATH}`,
      HOME: join(stub, "home"),
      FITNESS_RETRY_MS: "0",
      FITNESS_SPAWN_MS: "10000",
      GITHUB_ACTIONS: "true",
      GITHUB_EVENT_NAME: "schedule",
      ...env,
    },
  });
}

const calls = (stub: string, bin: string) =>
  existsSync(join(stub, `${bin}-calls`)) ? readFileSync(join(stub, `${bin}-calls`), "utf8") : "";
const lines = (text: string, needle: string) =>
  text.split("\n").filter((l) => l.includes(needle)).length;
// The JSON sits between ::warning:: lines above it and report lines below it.
type Result = { status: string; detail: string; home: string };
const results = (res: ReturnType<typeof run>) => {
  const list = JSON.parse(
    res.stdout.slice(res.stdout.indexOf("\n[") + 1, res.stdout.lastIndexOf("\n]") + 2),
  ) as (Result & { id: string })[];
  return (id: string): Result => {
    const r = list.find((x) => x.id === id);
    if (!r) throw new Error(`no result for ${id}: ${res.stdout}${res.stderr}`);
    return r;
  };
};

describe("fitness wiring", () => {
  it("reads every clock contract from the real things, with the arguments the apps need", () => {
    const stub = fixture();
    const res = run(stub, ["--json"]);
    expect(res.status).toBe(0);
    const r = results(res);
    expect(r("bots-running")).toMatchObject({ status: "pass", detail: "started" });
    expect(r("bots-responsive").status).toBe("pass");
    expect(r("main-deploys")).toMatchObject({ status: "pass", detail: "both apps current" });
    expect(r("alerts-reach-owner").status).toBe("pass");
    expect(r("owner-assignment-path").status).toBe("pass");
    expect(r("memory-has-history")).toMatchObject({ status: "not-here", home: "session" });
    const fly = calls(stub, "fly");
    expect(fly).toContain("machine list -a skynet-capital-bots --json");
    expect(fly).toContain(
      "machine exec m1 cat /data/health.json -a skynet-capital-bots --timeout 30",
    );
    expect(fly).toContain("secrets list -a skynet-capital --json");
    expect(fly).not.toContain("exec standby1");
    expect(calls(stub, "gh")).toContain("api repos/{owner}/{repo}/commits/main");
    expect(calls(stub, "gh")).toContain("api repos/{owner}/{repo}/assignees/ejclark");
    expect(calls(stub, "gh")).toMatch(
      /api graphql -F owner=\{owner\} -F name=\{repo\} -F who=ejclark -F since=\d{4}-\d\d-\d\dT/,
    );
  });

  it("runs only the session contract in a session, and reads nothing from Fly there", () => {
    const versioned = run(fixture(), ["--json"], { GITHUB_ACTIONS: "" });
    expect(versioned.status).toBe(0);
    const r = results(versioned);
    expect(r("memory-has-history")).toMatchObject({
      status: "pass",
      detail: "1 folder(s) versioned",
    });
    for (const id of [
      "bots-running",
      "bots-responsive",
      "main-deploys",
      "alerts-reach-owner",
      "owner-assignment-path",
    ]) {
      expect(r(id).status).toBe("not-here");
      expect(r(id).detail).toBe("runs in the clock, and this is the session");
    }
    const bare = fixture({ memoryHistory: false });
    const red = run(bare, ["--json"], { GITHUB_ACTIONS: "" });
    expect(red.status).toBe(1);
    expect(results(red)("memory-has-history").status).toBe("fail");
    expect(calls(bare, "fly")).toBe("");
    const none = run(fixture({ memoryHistory: "none" }), ["--json"], { GITHUB_ACTIONS: "" });
    expect(results(none)("memory-has-history").status).toBe("unknown");
  });

  it("lets a session read the clock's contracts with --here, without writing", () => {
    const stub = fixture({ machine: "stopped" });
    const res = run(stub, ["--here", "clock", "--report"], { GITHUB_ACTIONS: "" });
    expect(res.status).toBe(0);
    expect(res.stdout).toContain(
      "fitness: would open [fitness] bots-running (not on CI, so nothing is written)",
    );
    expect(calls(stub, "gh")).toContain(
      "issue list --state open --label bug --json number,title,body,comments,createdAt,assignees --limit 200",
    );
    expect(calls(stub, "gh")).not.toContain("issue create");
  });

  it("keeps reporting the others when one reply is malformed, and exits red for the crash", () => {
    const stub = fixture({ machines: '{"not":"a list"}' });
    const res = run(stub, ["--json"]);
    expect(res.status).toBe(1);
    const r = results(res);
    expect(r("bots-running")).toMatchObject({ status: "unknown", detail: "the probe crashed" });
    expect(r("main-deploys").status).toBe("pass");
    expect(r("alerts-reach-owner").status).toBe("pass");
    expect(res.stdout).toContain("::warning::fitness: bots-running probe crashed");
    // A blip is read twice before it counts: two contracts list machines, each twice.
    expect(lines(calls(stub, "fly"), "machine list")).toBe(4);
    // A crash on the first read is still a crash when the retry reads clean: the run stays red
    // so the malformed reply is seen, while the contract itself reports what the retry found.
    const once = fixture();
    writeFileSync(join(once, "machines-first"), '{"not":"a list"}');
    const recovered = run(once, ["--json"]);
    expect(recovered.status).toBe(1);
    expect(results(recovered)("bots-running").status).toBe("pass");
    expect(recovered.stdout).toContain("::warning::fitness: bots-running probe crashed");
  });

  it("reports a dead Fly token as unknown with the cause kept, and assigns its one issue at once", () => {
    const stub = fixture();
    writeFileSync(join(stub, "fly-dead"), "");
    const res = run(stub, ["--json", "--report"]);
    expect(res.status).toBe(0);
    const r = results(res);
    for (const id of ["bots-running", "bots-responsive", "alerts-reach-owner"]) {
      expect(r(id).status).toBe("unknown");
    }
    expect(r("main-deploys").status).toBe("pass");
    expect(res.stdout).toContain("::warning::fitness: bots-running cannot read Fly");
    expect(res.stdout).toContain("exited 1: Error: token expired");
    const gh = calls(stub, "gh");
    expect(lines(gh, "issue create")).toBe(1);
    // Only he can set a credential, so the blind issue goes straight to him.
    expect(gh).toContain(
      "issue create --title [fitness] cannot read Fly --label bug --assignee ejclark --body",
    );
    expect(gh).not.toContain("[fitness] bots-running");
    expect(res.stdout).toContain("fitness: open-blind [fitness] cannot read Fly");
  });

  it("opens a blind issue unassigned when the read failed for any other reason", () => {
    const stub = fixture();
    writeFileSync(
      join(stub, "fly"),
      '#!/usr/bin/env bash\necho "$*" >> "$STUB/fly-calls"\necho "Error: 503 service unavailable" >&2\nexit 1\n',
    );
    run(stub, ["--report"]);
    const gh = calls(stub, "gh");
    expect(gh).toContain("issue create --title [fitness] cannot read Fly --label bug --body");
    expect(gh).not.toContain("--assignee");
    expect(gh).toContain("the owner, once these have been blind for 2 hours");
  });

  it("closes the blind issue once Fly reads again", () => {
    const stub = fixture({
      issues: [{ number: 12, title: "[fitness] cannot read Fly", body: "", comments: [] }],
    });
    run(stub, ["--report"]);
    expect(calls(stub, "gh")).toContain("issue close 12 --comment Fly can be read again.");
  });

  it("gives a hung read a deadline so it costs one contract, not the tick", () => {
    const stub = fixture();
    writeFileSync(join(stub, "exec-hang"), "");
    const started = Date.now();
    const res = run(stub, ["--json"], { FITNESS_SPAWN_MS: "300" });
    // Two hung reads would be ten seconds; the bound leaves room for a slow runner's node starts.
    expect(Date.now() - started).toBeLessThan(8000);
    const r = results(res);
    expect(r("bots-responsive")).toMatchObject({
      status: "unknown",
      detail: "cannot read the health stamp",
    });
    expect(r("bots-running").status).toBe("pass");
    expect(res.stdout).toContain("timed out after 300 ms");
  });

  it("judges main-deploys through deploy-lag: a young push passes, an old one fails, no read is unknown", () => {
    const young = results(run(fixture({ deploy: "young" }), ["--json"]))("main-deploys");
    expect(young.status).toBe("pass");
    expect(young.detail).toContain("inside the deploy grace");
    const late = results(run(fixture({ deploy: "late" }), ["--json"]))("main-deploys");
    expect(late).toMatchObject({ status: "fail", detail: "dashboard undeployed 45 min" });
    const blind = results(run(fixture({ deploy: "unreadable" }), ["--json"]))("main-deploys");
    expect(blind.status).toBe("unknown");
    expect(blind.detail).toContain("cannot read GitHub");
  });

  it("retries only a read that failed: a judge's own unknown is not read twice", () => {
    const stub = fixture({ deploy: "future" });
    const r = results(run(stub, ["--json"]))("main-deploys");
    expect(r).toMatchObject({
      status: "unknown",
      detail: "the dashboard lag is dated in the future",
    });
    expect(lines(calls(stub, "gh"), "commits/main")).toBe(1);
    // A read that did fail is read twice before it counts as blind.
    const dead = fixture({ deploy: "unreadable" });
    run(dead, ["--json"]);
    expect(lines(calls(dead, "gh"), "commits/main")).toBe(2);
  });

  it("opens a failing contract's issue on the clock, unassigned, and exits 0 under --report", () => {
    const stub = fixture({ machine: "stopped" });
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("FAIL     bots-running: machine is stopped");
    expect(res.stdout).toContain("fitness: open [fitness] bots-running");
    const gh = calls(stub, "gh");
    expect(gh).toContain("issue create --title [fitness] bots-running --label bug --body");
    expect(gh).toContain("**What failed:** machine is stopped.");
    expect(gh).not.toContain("--assignee");
    expect(gh).toContain("The owner is assigned only once those are spent");
    expect(lines(gh, "issue create")).toBe(1);
    // Without --report the failure is the exit code.
    expect(run(fixture({ machine: "stopped" }), []).status).toBe(1);
  });

  it("opens a credential contract's issue assigned to the owner, in the same call", () => {
    const stub = fixture({ secrets: ["OTHER"] });
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(calls(stub, "gh")).toContain(
      "issue create --title [fitness] alerts-reach-owner --label bug --assignee ejclark --body",
    );
    expect(calls(stub, "gh")).toContain("Only the owner can fix this");
  });

  it("assigns under the clock's token, then says why once, with the marker the next tick reads", () => {
    const open = {
      number: 7,
      title: "[fitness] bots-running",
      body: "**What failed:** machine is stopped.",
      comments: [],
      createdAt: iso(Date.now() - 10 * MIN),
      assignees: [],
    };
    const mine = { user: { type: "Bot" }, body: "<!-- bots-start-stopped:start -->" };
    const stub = fixture({
      machine: "stopped",
      issues: [open],
      comments: {
        7: [1, 2, 3].map(() => ({ ...mine, created_at: iso(Date.now() - MIN) })),
      },
    });
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    const gh = calls(stub, "gh");
    expect(gh).toContain("api repos/{owner}/{repo}/issues/7/comments?per_page=100 --paginate --jq");
    const edit = gh.indexOf(
      "api --method POST repos/{owner}/{repo}/issues/7/assignees -f assignees[]=ejclark",
    );
    const said = gh.indexOf("issue comment 7 --body Assigned to the owner:");
    expect(edit).toBeGreaterThan(-1);
    expect(said).toBeGreaterThan(edit);
    expect(gh).toContain(ASSIGNED_MARKER);
    expect(res.stdout).toContain("fitness: assign [fitness] bots-running");
  });

  it("does not claim an assignment GitHub refused: the next tick tries again", () => {
    const open = {
      number: 7,
      title: "[fitness] alerts-reach-owner",
      body: "**What failed:** alerts reach nobody: SKYNET_ALERT_EMAIL_FROM not set.",
      comments: [],
      createdAt: iso(Date.now() - 10 * MIN),
      assignees: [],
    };
    const stub = fixture({ secrets: ["SKYNET_ALERT_EMAIL_API_KEY"], issues: [open] });
    writeFileSync(join(stub, "edit-refuse"), "");
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("fitness: COULD NOT assign [fitness] alerts-reach-owner");
    expect(calls(stub, "gh")).not.toContain("issue comment 7");
  });

  it("prints what it would assign in a session and writes nothing, since a self-assignment mails no one", () => {
    const open = {
      number: 7,
      title: "[fitness] alerts-reach-owner",
      body: "**What failed:** alerts reach nobody: SKYNET_ALERT_EMAIL_FROM not set.",
      comments: [],
      createdAt: iso(Date.now() - 10 * MIN),
      assignees: [],
    };
    const stub = fixture({ secrets: ["SKYNET_ALERT_EMAIL_API_KEY"], issues: [open] });
    const res = run(stub, ["--here", "clock", "--report"], { GITHUB_ACTIONS: "" });
    expect(res.stdout).toContain("fitness: would assign [fitness] alerts-reach-owner");
    const gh = calls(stub, "gh");
    expect(gh).not.toContain("--method");
    expect(gh).not.toContain("issue comment");
  });

  it("holds and warns when an unassigned thread's comments cannot be read", () => {
    const open = {
      number: 7,
      title: "[fitness] alerts-reach-owner",
      body: "**What failed:** alerts reach nobody: SKYNET_ALERT_EMAIL_FROM not set.",
      comments: [],
      createdAt: iso(Date.now() - 10 * MIN),
      assignees: [],
    };
    const stub = fixture({ secrets: ["SKYNET_ALERT_EMAIL_API_KEY"], issues: [open] });
    writeFileSync(join(stub, "comments-dead"), "");
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("::warning::fitness: cannot read the comments on #7");
    expect(calls(stub, "gh")).not.toContain("--method");
  });

  it("spends no comment read on a thread he already holds", () => {
    const open = {
      number: 7,
      title: "[fitness] alerts-reach-owner",
      body: "**What failed:** alerts reach nobody: SKYNET_ALERT_EMAIL_FROM not set.",
      comments: [],
      createdAt: iso(Date.now() - 10 * MIN),
      assignees: [{ login: "ejclark" }],
    };
    const stub = fixture({ secrets: ["SKYNET_ALERT_EMAIL_API_KEY"], issues: [open] });
    run(stub, ["--report"]);
    expect(calls(stub, "gh")).not.toContain("issues/7/comments");
    expect(calls(stub, "gh")).not.toContain("--method");
  });

  it("reopens a recently closed thread with one line, through gh, and unassigns first", () => {
    const thread = {
      number: 7,
      title: "[fitness] bots-responsive",
      state: "CLOSED",
      closedAt: iso(Date.now() - 60 * MIN),
      createdAt: iso(Date.now() - 90 * MIN),
      assignees: [{ login: "ejclark" }],
    };
    const stub = fixture({ stampAgeMs: 60 * MIN, closed: [thread] });
    run(stub, ["--report"]);
    const gh = calls(stub, "gh");
    expect(gh).toContain("issue list --state all --search");
    const removed = gh.indexOf(
      "api --method DELETE repos/{owner}/{repo}/issues/7/assignees -f assignees[]=ejclark",
    );
    const reopened = gh.indexOf("issue reopen 7 --comment The fix did not hold:");
    expect(removed).toBeGreaterThan(-1);
    expect(reopened).toBeGreaterThan(removed);
    expect(gh).toContain(REOPENED_MARKER);
    expect(gh).not.toContain("issue create");
    expect(gh).not.toContain("--method POST");
  });

  it("files a new issue with a warning when the closed threads cannot be read", () => {
    const stub = fixture({ stampAgeMs: 60 * MIN });
    writeFileSync(join(stub, "closed-dead"), "");
    const res = run(stub, ["--report"]);
    expect(res.stdout).toContain("::warning::fitness: cannot read closed fitness issues");
    expect(calls(stub, "gh")).toContain("issue create --title [fitness] bots-responsive");
  });

  it("looks for closed threads only when a failure has no open issue", () => {
    const quietWorld = fixture();
    run(quietWorld, ["--report"]);
    expect(calls(quietWorld, "gh")).not.toContain("--search");
  });

  it("reads bots-responsive as quiet while the machine is down, so one stop opens one issue", () => {
    const stub = fixture({ machine: "stopped" });
    const res = run(stub, ["--json", "--report"]);
    const r = results(res);
    expect(r("bots-responsive").status).toBe("quiet");
    expect(calls(stub, "fly")).not.toContain("machine exec");
    const gh = calls(stub, "gh");
    expect(lines(gh, "issue create")).toBe(1);
    expect(gh).toContain("issue create --title [fitness] bots-running");
  });

  it("gives a machine that just started until the stamp catches up, and no longer", () => {
    const started = (agoMs: number) =>
      `[{"id":"m1","state":"started","config":{},"events":[{"type":"exit","timestamp":${Date.now()}},{"type":"start","timestamp":${Date.now() - agoMs}}]}]`;
    const fresh = results(
      run(fixture({ machines: started(MIN), stampAgeMs: 60 * MIN }), ["--json"]),
    );
    expect(fresh("bots-responsive").status).toBe("quiet");
    const late = results(
      run(fixture({ machines: started(6 * MIN), stampAgeMs: 60 * MIN }), ["--json"]),
    );
    expect(late("bots-responsive").status).toBe("fail");
    // The grace answers a stale stamp only: a fresh stamp still passes.
    const ok = results(run(fixture({ machines: started(MIN) }), ["--json"]));
    expect(ok("bots-responsive").status).toBe("pass");
  });

  it("reads the assignment path: a 404 fails, any other failed read is unknown, never a pass", () => {
    const missing = fixture();
    writeFileSync(join(missing, "not-assignable"), "");
    expect(results(run(missing, ["--json"]))("owner-assignment-path")).toMatchObject({
      status: "fail",
      detail: "the owner cannot be assigned on this repository",
    });
    const dead = fixture();
    writeFileSync(join(dead, "assign-dead"), "");
    expect(results(run(dead, ["--json"]))("owner-assignment-path").status).toBe("unknown");
    const blind = fixture();
    writeFileSync(join(blind, "graphql-dead"), "");
    expect(results(run(blind, ["--json"]))("owner-assignment-path")).toMatchObject({
      status: "unknown",
      detail: "cannot read GitHub",
    });
  });

  it("files the assignment path's staleness as an issue assigned to him: that issue is the test", () => {
    const stub = fixture({ assignedAgoMs: 31 * 24 * 60 * MIN });
    run(stub, ["--report"]);
    expect(calls(stub, "gh")).toContain(
      "issue create --title [fitness] owner-assignment-path --label bug --assignee ejclark --body",
    );
  });

  it("re-assigns a person-made assignment through gh: off, then on, then one line", () => {
    const stub = fixture();
    const self = {
      number: 6501,
      title: "[fitness] alerts-reach-owner",
      state: "OPEN",
      timelineItems: {
        nodes: [
          {
            createdAt: iso(Date.now() - MIN),
            actor: { __typename: "User", login: "ejclark" },
            assignee: { login: "ejclark" },
          },
        ],
      },
    };
    writeFileSync(join(stub, "graphql"), JSON.stringify(graphqlReply(Date.now(), [self])));
    run(stub, ["--report"]);
    const gh = calls(stub, "gh");
    const off = gh.indexOf(
      "api --method DELETE repos/{owner}/{repo}/issues/6501/assignees -f assignees[]=ejclark",
    );
    const on = gh.indexOf(
      "api --method POST repos/{owner}/{repo}/issues/6501/assignees -f assignees[]=ejclark",
    );
    const said = gh.indexOf("issue comment 6501 --body Re-assigned under the bot");
    expect(off).toBeGreaterThan(-1);
    expect(on).toBeGreaterThan(off);
    expect(said).toBeGreaterThan(on);
    // The path's own thread opens unassigned: the re-assign is the one email.
    expect(gh).toContain("issue create --title [fitness] owner-assignment-path --label bug --body");
  });

  it("comments on a changed cause and closes on a pass, through gh", () => {
    const open = {
      number: 7,
      title: "[fitness] bots-running",
      body: "**What failed:** machine is stopped.",
      comments: [],
    };
    const changed = fixture({ machines: "[]", issues: [open] });
    run(changed, ["--report"]);
    expect(calls(changed, "gh")).toContain(
      "issue comment 7 --body Still failing, and it changed: no primary machine.",
    );
    const same = fixture({ machine: "stopped", issues: [open] });
    run(same, ["--report"]);
    expect(calls(same, "gh")).not.toContain("issue comment");
    // What was last said is the last comment: an older comment naming today's cause is history.
    const talked = {
      ...open,
      comments: [
        { body: "Still failing, and it changed: no primary machine." },
        { body: "Still failing, and it changed: machine is stopped." },
      ],
    };
    const back = fixture({ machines: "[]", issues: [talked] });
    run(back, ["--report"]);
    expect(calls(back, "gh")).toContain("issue comment 7 --body");
    const healed = fixture({ issues: [open] });
    run(healed, ["--report"]);
    expect(calls(healed, "gh")).toContain("issue close 7 --comment Passing again: started.");
  });

  // The oracle for this slice: the real start script and the real report, tick after tick, against
  // one GitHub that keeps state. The clock skips the report after the start script exits 3 until the
  // held workflow change lands, so this is the order that change gives it.
  (existsSync(START) ? it : it.skip)(
    "replays a machine that keeps stopping: one thread, no assignment until the budget is spent, one comment for it",
    () => {
      const stub = fixture({ machine: "stopped" });
      const plain = readFileSync(join(stub, "gh"), "utf8");
      writeFileSync(join(stub, "gh-plain"), plain);
      chmodSync(join(stub, "gh-plain"), 0o755);
      writeFileSync(join(stub, "gh"), STATEFUL_GH);
      chmodSync(join(stub, "gh"), 0o755);
      const down = readFileSync(join(stub, "machines"), "utf8");
      const up = down.replace(
        '"state":"stopped","config":{"env"',
        '"state":"started","config":{"env"',
      );
      expect(up).not.toBe(down);
      writeFileSync(join(stub, "machines-up"), up);
      const crash = () => writeFileSync(join(stub, "machines"), down);
      const db = () =>
        JSON.parse(readFileSync(join(stub, "threads.json"), "utf8")) as {
          issues: {
            number: number;
            title: string;
            state: string;
            assignees: string[];
            assigned: number;
            comments: { body: string }[];
          }[];
        };
      const tick = () => {
        const started = spawnSync("bash", [START, "skynet-capital-bots", "--report"], {
          encoding: "utf8",
          env: {
            ...process.env,
            STUB: stub,
            FLY_BIN: join(stub, "fly"),
            GH_BIN: join(stub, "gh"),
            BOTS_START_WAIT_SECS: "1",
            BOTS_POLL_SECS: "1",
          },
        });
        expect(run(stub, ["--report"]).status).toBe(0);
        return started.status;
      };
      const onlyThread = () => {
        const [thread, ...others] = db().issues;
        expect(others).toEqual([]);
        if (!thread) throw new Error("no thread was filed");
        return thread;
      };
      const said = (needle: string) =>
        db()
          .issues.flatMap((i) => i.comments)
          .filter((c) => c.body.includes(needle)).length;

      // Three crashes, three starts. Each heals in its own tick, so the thread opens and closes
      // three times, and he is never assigned.
      for (const i of [0, 1, 2]) {
        crash();
        expect(tick()).toBe(0);
        const thread = onlyThread();
        expect(thread.title).toBe("[fitness] bots-running");
        expect(thread.state).toBe("CLOSED");
        expect(thread.assigned).toBe(0);
        expect(said("<!-- bots-start-stopped:start -->")).toBe(i + 1);
        expect(said(REOPENED_MARKER)).toBe(i);
      }
      // The fourth: the budget is spent, the machine stays down, and now he hears, exactly once.
      crash();
      expect(tick()).toBe(3);
      const spent = onlyThread();
      expect(spent.state).toBe("OPEN");
      expect(spent.assignees).toEqual(["ejclark"]);
      expect(spent.assigned).toBe(1);
      expect(said(ASSIGNED_MARKER)).toBe(1);
      // A standing failure says nothing more.
      expect(tick()).toBe(3);
      const standing = onlyThread();
      expect(standing.comments).toHaveLength(spent.comments.length);
      expect(standing.assigned).toBe(1);
      expect(said(REOPENED_MARKER)).toBe(3);
      // A pass closes it.
      writeFileSync(join(stub, "machines"), up);
      expect(tick()).toBe(0);
      expect(onlyThread().state).toBe("CLOSED");
    },
  );

  it("prints a refused write and still exits 0, because the next tick retries it", () => {
    const stub = fixture({ machine: "stopped" });
    writeFileSync(join(stub, "gh-refuse"), "");
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain("fitness: COULD NOT open [fitness] bots-running");
    expect(res.stdout).toContain("HTTP 502");
  });

  it("reports nothing, with a warning, when the issue list is not a list", () => {
    const stub = fixture({ machine: "stopped" });
    writeFileSync(join(stub, "issues"), "{}");
    const res = run(stub, ["--report"]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain(
      "::warning::fitness: cannot read GitHub issues, so nothing was reported",
    );
    expect(res.stdout).toContain("not a list");
    expect(calls(stub, "gh")).not.toContain("issue create");
  });

  (existsSync(WORKFLOW) ? it : it.skip)("has a clock runner that really invokes the script", () => {
    expect(readFileSync(WORKFLOW, "utf8")).toContain("node scripts/fitness.mjs --report");
  });
});
