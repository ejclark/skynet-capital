import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
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

// #6470. The judges are pure and seeded below; the wiring (what fly and gh are asked, what the
// script does with a bad reply, a hung read, a refused write, and where it writes at all) is driven
// through the real entrypoint against stub binaries that record their arguments, because a spec
// that only exercised the judges caught 0 of 15 deliberate bugs in the probes and the wiring. The
// wiring half now lives in fitness-wiring.spec.ts; the audit runs one spec per call, so the 30 bugs
// below are graded once against each (the same bug list and --with files, `--spec` swapped) and a
// bug is caught if either run catches it.
//
// Graded blind: tests/scripts/fixtures/fitness-heldout-bugs.json holds 30 deliberate bugs written
// by a pass that never saw this spec; it caught 29 before the never-polled stamp seed was added.
// That list is the regression list now (`node scripts/fitness-audit.mjs --bugs <it> --with ...`,
// the --with files are the ones named below, plus tests/scripts/fitness-harness.ts (the stub fly and
// gh this spec drives the entrypoint with), scripts/deploy-lag.mjs and
// scripts/bot-relevant.mjs, scripts/bots-start-stopped.sh, scripts/fitness-rungs.mjs and the four
// src/ files decision-cycle loads, listed in fitness-decision-cycle.spec.ts), so a new score needs
// bugs from a fresh blind pass. The 21 after the first 30 attack the owner's assignment and were
// written by the author of this spec, so they are a regression net and not a blind score.
const REPLAY = resolve("tests/fixtures/fitness/replay-2026-10-22.json");

const NOW = Date.parse("2026-11-01T06:00:00Z");
const standby = { state: "stopped", config: { standbys: ["m1"] } };

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

  it("fails every state that is not started, not only stopped", () => {
    for (const state of ["suspended", "replacing", "failed", "destroying", "created"]) {
      const verdict = judgeMachine([standby, { state, config: {} }]);
      expect(verdict.status).toBe("fail");
      expect(verdict.detail).toContain(state);
    }
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

  // A merge that lands during the tick is dated after this tick's clock, and GitHub's clock and a
  // runner's differ by seconds. Neither is blindness, so a small lead reads as a lag that just began.
  it("reads a lag dated a little ahead of its clock as just begun, not as blindness", () => {
    const lead = (ms: number) => judgeDeploys({ lagging: true, since: iso(NOW + ms) }, NOW);
    expect(lead(5000)).toEqual({
      status: "pass",
      detail: "dashboard undeployed 0 min: inside the deploy grace",
    });
    expect(lead(4 * MIN).detail).toBe("dashboard undeployed 0 min: inside the deploy grace");
    expect(lead(5 * MIN).status).toBe("pass");
    expect(lead(5 * MIN + 1000).status).toBe("unknown");
    const bots = judgeDeploys(
      { lagging: false, bots: { lagging: true, since: iso(NOW + 5000) } },
      NOW,
    );
    expect(bots.status).toBe("pass");
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

  it("never reads a bots half with no landed release as current", () => {
    const none = { known: true, baseline: false, lagging: false };
    expect(judgeDeploys({ lagging: false, bots: none }, NOW)).toEqual({
      status: "unknown",
      detail: "no bots release landed in the runs read",
    });
    // It never hides the dashboard's failure either, and a young dashboard does not make it a pass.
    const late = judgeDeploys({ lagging: true, since: iso(NOW - 45 * MIN), bots: none }, NOW);
    expect(late).toEqual({ status: "fail", detail: "dashboard undeployed 45 min" });
    const young = judgeDeploys({ lagging: true, since: iso(NOW - 5 * MIN), bots: none }, NOW);
    expect(young.status).toBe("unknown");
    // A dark fleet is a failure with a date, not a missing baseline.
    const dark = { known: true, baseline: false, lagging: true, since: iso(NOW - 90 * MIN) };
    expect(judgeDeploys({ lagging: false, bots: dark }, NOW).status).toBe("fail");
  });

  it("fails an alarm that can reach nobody, the 10-18 to 11-01 gap", () => {
    const key = "SKYNET_ALERT_EMAIL_API_KEY";
    const from = "SKYNET_ALERT_EMAIL_FROM";
    expect(judgeAlertReach(["OTHER"]).status).toBe("fail");
    expect(judgeAlertReach([key]).detail).toBe(`alerts reach nobody: ${from} not set`);
    expect(judgeAlertReach([key, from]).status).toBe("pass");
  });

  // Delivery is also opt-in per account and off by default, and this reads neither. Reproduced: both
  // secrets set, no opt-in, a market-hours stall mails nobody, so "delivery is configured" was false.
  it("claims only the credential when the secrets are set, not that an alert arrives", () => {
    const { detail } = judgeAlertReach(["SKYNET_ALERT_EMAIL_API_KEY", "SKYNET_ALERT_EMAIL_FROM"]);
    expect(detail).toBe("the mail credential is set; each account still has to opt in");
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
    // The second half narrows the same way: after the comma it is still not the whole detail.
    const botsOnly = { ...failing, id: "main-deploys", detail: "bots undeployed 60 min" };
    expect(reportActions([botsOnly], [both])).toEqual([
      { kind: "comment", number: 7, result: botsOnly },
    ]);
    // Once said, in any of the three lines that carry a detail, it stays said.
    for (const lastComment of [
      "Still failing, and it changed: bots undeployed 75 min.",
      "Assigned to the owner: why. Still failing: bots undeployed 75 min.",
      "Reopened. What failed: bots undeployed 75 min.",
    ]) {
      expect(reportActions([botsOnly], [{ ...both, lastComment }])).toEqual([]);
    }
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
      "decision-cycle": "wait",
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
