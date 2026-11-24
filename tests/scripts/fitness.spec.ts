import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  CONTRACTS,
  HOMES,
  judgeAlertReach,
  judgeDeploys,
  judgeMachine,
  judgeStamp,
  reportActions,
  whereAmI,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/fitness.mjs";
import {
  OWNER_AFTER_MS,
  whatHappensNext,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/fitness-rungs.mjs";
import { iso, MIN } from "./fitness-harness";
import { contract, lagAt, NOW, type Run, simulate } from "./fitness-tracker-sim";

// #6470. The judges are pure and seeded below; the wiring (what fly and gh are asked, what the
// script does with a bad reply, a hung read, a refused write, and where it writes at all) is driven
// through the real entrypoint against stub binaries that record their arguments, because a spec
// that only exercised the judges caught 0 of 15 deliberate bugs in the probes and the wiring. The
// wiring half now lives in fitness-wiring.spec.ts, and the owner-assignment half in
// fitness-owner.spec.ts; the audit runs one spec per call, so the 30 bugs
// below are graded once against each (the same bug list and --with files, `--spec` swapped) and a
// bug is caught if either run catches it.
//
// Graded blind: tests/scripts/fixtures/fitness-heldout-bugs.json holds 30 deliberate bugs written
// by a pass that never saw this spec; it caught 29 before the never-polled stamp seed was added.
// That list is the regression list now (`node scripts/fitness-audit.mjs --bugs <it> --with ...`,
// the --with files are the ones named below, plus tests/scripts/fitness-harness.ts (the stub fly and
// gh this spec drives the entrypoint with), scripts/deploy-lag.mjs and
// scripts/bot-relevant.mjs, scripts/bots-start-stopped.sh, scripts/fitness-rungs.mjs, scripts/fitness-judges.mjs and the four
// src/ files decision-cycle loads, listed in fitness-decision-cycle.spec.ts), so a new score needs
// bugs from a fresh blind pass. The 21 after the first 30 attack the owner's assignment and were
// written by the author of this spec, so they are a regression net and not a blind score.
const REPLAY = resolve("tests/fixtures/fitness/replay-2026-10-22.json");

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

  it("fails every settled state that is not started, not only stopped", () => {
    for (const state of ["suspended", "failed", "destroying", "created", "restarting"]) {
      const verdict = judgeMachine([standby, { state, config: {} }], NOW);
      expect(verdict).toEqual({ status: "fail", detail: `machine is ${state}` });
    }
  });

  // #6700: a tick mid-deploy opened #6686, promising a start the start script never makes.
  it("gives a state a deploy passes through the deploy grace, then fails it with a fix for it", () => {
    const at = (state: string, ms: number, field: "event" | "updated_at" = "event") =>
      judgeMachine(
        [
          standby,
          field === "event"
            ? {
                state,
                config: {},
                events: [
                  { type: "update", status: state, timestamp: NOW - 60 * MIN },
                  { type: "update", status: state, timestamp: NOW - ms },
                  { type: "exit", status: "stopped", timestamp: NOW - ms / 2 },
                ],
              }
            : { state, config: {}, updated_at: iso(NOW - ms) },
        ],
        NOW,
      );
    for (const state of ["replacing", "updating", "stopping", "starting"]) {
      expect(at(state, 2 * MIN)).toEqual({
        status: "quiet",
        detail: `machine is ${state}, inside the 20 min deploy grace`,
      });
    }
    // The newest event in that state ages it, and updated_at stands in when no event does.
    expect(at("replacing", 20 * MIN).status).toBe("quiet");
    expect(at("replacing", 20 * MIN + 1000).status).toBe("fail");
    expect(at("replacing", 5 * MIN, "updated_at").status).toBe("quiet");
    const wedged = at("replacing", 25 * MIN, "updated_at");
    expect(wedged).toMatchObject({
      status: "fail",
      detail: "machine is replacing past the 20 min deploy grace",
      rung: "wait",
      attempts: undefined,
    });
    expect(wedged.corrector).toContain("stopping the machine");
    expect(whatHappensNext(wedged)).toBe(
      "The owner is assigned if this still fails after 2 hours.",
    );
    // Two clocks differ by seconds; a date it cannot age is not young.
    expect(at("replacing", -30_000).status).toBe("quiet");
    expect(at("replacing", -60 * MIN).detail).toBe(
      "machine is replacing and when it began cannot be dated",
    );
    const undated = judgeMachine([standby, { state: "replacing", config: {} }], NOW);
    expect(undated).toMatchObject({
      status: "fail",
      detail: "machine is replacing and when it began cannot be dated",
    });
    expect(undated.corrector).toContain("stopping the machine");
    // A stopped machine is still the start script's, as before.
    const stopped = judgeMachine([standby, { state: "stopped", config: {} }], NOW);
    expect(stopped).toEqual({ status: "fail", detail: "machine is stopped" });
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
