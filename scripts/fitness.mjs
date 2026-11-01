#!/usr/bin/env node
// Fitness: what must stay true about the running system, checked from outside it (#6470).
//
// Eric, 2026-11-01: fitness functions define "the test that needs to pass", and AI must be able to
// detect, correct and maintain when they don't; they define self-healing systems. Every coach in
// docs/COACHES.md watches the code, so this watches outcomes. The bots outage is why each contract
// carries the parts it does:
//
//   mustBeTrue   an outcome, not a proxy. A green deploy step reported "current" over a dead fleet.
//   probe        reads the real thing, from outside it. A check inside the process dies with it.
//   reads        the source the probe depends on. One issue per source that cannot be read, so a
//                Fly outage opens one issue and not three.
//   home         where the probe can see: clock (the scheduled job), push (a push-driven job) or
//                session (a person's machine). Away from home it reports not-here, which is
//                neither health nor blindness; a contract is never hidden, only placed.
//   corrector    what fixes it, or null. A check with no corrector is only an alarm.
//   budget       how often the corrector may act before it must stop and ask.
//   reaches      who hears a failure, read by report(): only a contract that reaches an issue
//                files one. The market-hours stall alert detected correctly from 10-18 and
//                reached nobody, because its mail credential was never set.
//
// A probe that cannot run reports "unknown", never a pass: an unknown is not health. A blip is
// retried once inside the tick; an unknown that persists opens one quiet, unassigned issue per
// unreadable source, whose age is how long the checks were blind. Each probe runs in its own
// try/catch with a ::warning:: line, so one malformed reply cannot blind the others. Every spawn
// has a deadline: a hung read must cost one contract, not the tick.
//
// This script detects and reports, and calls no corrector. `--json` for machines. `--report`
// keeps one issue per failing contract, assigned to the owner: GitHub already delivers that to a
// phone and inbox, so reaching them needs no new credential. It writes only when GITHUB_ACTIONS is
// true (a session running it under the owner's login filed #6501, and a self-assignment sends no
// notice); elsewhere it prints what it would do. The repo is public, so an issue carries only the
// contract's own words and never a log line.
//
// Exit codes: 0 all passing, unknown or not-here, or --report · 1 something fails, or a probe
// crashed. A write that GitHub refused is printed, not fatal: the next tick retries it.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
// Deadlines. The exec also gets flyctl's own --timeout, because its session can outlive ours.
// deploy-lag makes up to a few dozen GitHub reads of its own, so it gets a longer one.
const SPAWN_TIMEOUT_MS = Number(process.env.FITNESS_SPAWN_MS ?? 60_000);
const DEPLOY_LAG_TIMEOUT_MS = SPAWN_TIMEOUT_MS * 3;
const EXEC_TIMEOUT_S = 30;
// CI installs the binary as flyctl; a laptop usually has fly.
const FLY =
  process.env.FLY_BIN ??
  (spawnSync("fly", ["version"], { timeout: SPAWN_TIMEOUT_MS }).status === 0 ? "fly" : "flyctl");
const GH = process.env.GH_BIN ?? "gh";
const OWNER = "ejclark";
const BOTS_APP = "skynet-capital-bots";
const DASHBOARD_APP = "skynet-capital";
const STAMP_FRESH_MS = 5 * 60_000;
// A push lags for the minutes its own deploy takes. Judged with no grace, healthy 10-15 to 10-22
// read red at 65 of 729 ticks; 20 minutes clears them all (#6470 study).
const DEPLOY_GRACE_MS = 20 * 60_000;
// A read that fails once is retried after this pause before it counts as blind.
const RETRY_MS = Number(process.env.FITNESS_RETRY_MS ?? 15_000);
// What src/adapters/email-alert-delivery.ts needs. Read as names, never values. The boot line said the
// same thing, but it aged out of the log buffer within hours and the contract went blind.
const ALERT_SECRETS = ["SKYNET_ALERT_EMAIL_API_KEY", "SKYNET_ALERT_EMAIL_FROM"];
// The `reaches` values report() understands. Any other value files nothing.
const ISSUE_TO_OWNER = "an issue assigned to the owner";
const HOMES = ["clock", "push", "session"];

const pass = (detail) => ({ status: "pass", detail });
const fail = (detail) => ({ status: "fail", detail });
const unknown = (detail) => ({ status: "unknown", detail });
const notHere = (home, here) => ({
  status: "not-here",
  detail: `runs in the ${home}, and this is the ${here}`,
});

/** Judge the primary bots machine. A marked stop is a person's decision, so it passes. */
export function judgeMachine(machines) {
  const primary = machines.find((m) => (m.config?.standbys ?? []).length === 0);
  if (!primary) return fail("no primary machine");
  if (primary.config?.metadata?.["skynet-halt"]) {
    return pass(`deliberately halted: ${primary.config.metadata["skynet-halt"]}`);
  }
  return primary.state === "started" ? pass("started") : fail(`machine is ${primary.state}`);
}

/** Judge the process's own stamp: alive, polling recently, and reachable by Mission Control. */
export function judgeStamp(stamp, nowMs) {
  const ageMs = nowMs - Date.parse(stamp.lastControlsPollAt ?? "");
  if (!Number.isFinite(ageMs)) return fail("the stamp has no controls poll");
  if (ageMs > STAMP_FRESH_MS)
    return fail(`last controls poll ${Math.round(ageMs / 60000)} min ago`);
  return stamp.bridge === "armed"
    ? pass(`polled ${Math.round(ageMs / 1000)}s ago, bridge armed`)
    : fail(`bridge is ${stamp.bridge}`);
}

/**
 * Judge main's deploys on what is running, never on a run's colour: a run reads green on a bots
 * debounce skip, and keeps reading green forever with no pushes. `lag` is what
 * scripts/deploy-lag.mjs --json prints. Each half is red only once its oldest undeployed commit
 * has waited past the grace; a lag with no date cannot be aged, so it is unknown, not a pass.
 */
export function judgeDeploys(lag, nowMs) {
  // deploy-lag's reasons go to the run log through the probe, never into this detail: an issue
  // carries the contract's words only.
  if (!lag || lag.known === false) return unknown("cannot read GitHub");
  if (lag.bots?.known === false) return unknown("cannot read the bots deploys");
  const halves = [
    ["dashboard", lag.lagging, lag.since],
    ["bots", lag.bots?.lagging, lag.bots?.since],
  ];
  const late = [];
  const young = [];
  for (const [name, lagging, since] of halves) {
    if (!lagging) continue;
    const waitedMs = nowMs - Date.parse(since ?? "");
    if (!Number.isFinite(waitedMs)) return unknown(`the ${name} lag carries no date`);
    // A date ahead of this clock cannot be aged either: the API has read an hour ahead of a
    // runner, and a negative wait would pass as young for as long as the skew lasts.
    if (waitedMs < 0) return unknown(`the ${name} lag is dated in the future`);
    const line = `${name} undeployed ${Math.round(waitedMs / 60000)} min`;
    (waitedMs > DEPLOY_GRACE_MS ? late : young).push(line);
  }
  if (late.length) return fail(late.join(", "));
  return pass(young.length ? `${young.join(", ")}: inside the deploy grace` : "both apps current");
}

/** Judge whether an alert can reach anyone, from the app's own secret names. */
export function judgeAlertReach(secretNames) {
  const missing = ALERT_SECRETS.filter((name) => !secretNames.includes(name));
  return missing.length
    ? fail(`alerts reach nobody: ${missing.join(" and ")} not set`)
    : pass("delivery is configured");
}

/**
 * Where this run is: a scheduled or hand-run Actions job is the clock, a push job the push,
 * anything else a session. `--here clock` lets a session read the clock's contracts for a live
 * receipt; it never makes a session write.
 */
export function whereAmI(env = process.env, argv = process.argv) {
  const asked = argv[argv.indexOf("--here") + 1];
  if (argv.includes("--here") && HOMES.includes(asked)) return asked;
  if (env.GITHUB_ACTIONS !== "true") return "session";
  return env.GITHUB_EVENT_NAME === "push" ? "push" : "clock";
}

// Why the last read failed, for the ::warning:: beside an unknown. Cleared before every probe.
const readFailures = [];
const firstLine = (text) =>
  String(text ?? "")
    .trim()
    .split("\n")[0]
    .slice(0, 200);

/** Run a command to completion within its deadline. Keeps stderr: it names the cause. */
function run(bin, args, timeoutMs = SPAWN_TIMEOUT_MS) {
  const res = spawnSync(bin, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: timeoutMs,
  });
  const what = `${bin} ${args.slice(0, 2).join(" ")}`;
  if (res.error?.code === "ETIMEDOUT")
    return { ok: false, why: `${what} timed out after ${timeoutMs} ms` };
  if (res.error) return { ok: false, why: `${what}: ${res.error.message}` };
  if (res.status !== 0) {
    const said = firstLine(res.stderr);
    return { ok: false, why: `${what} exited ${res.status}${said ? `: ${said}` : ""}` };
  }
  return { ok: true, out: res.stdout, stderr: res.stderr };
}

/** Parsed stdout of a command, or null with the reason banked for the warning. */
function json(bin, args, timeoutMs) {
  const res = run(bin, args, timeoutMs);
  if (!res.ok) {
    readFailures.push(res.why);
    return null;
  }
  try {
    return JSON.parse(res.out);
  } catch {
    readFailures.push(
      `${bin} ${args.slice(0, 2).join(" ")} replied with something that is not JSON`,
    );
    return null;
  }
}

function memoryDirs() {
  const root = join(homedir(), ".claude", "projects");
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .map((name) => join(root, name, "memory"))
    .filter((dir) => existsSync(join(dir, "MEMORY.md")));
}

// One contract per thing that must stay true. Order is the order they matter.
export const CONTRACTS = [
  {
    id: "bots-running",
    mustBeTrue: "The bots machine is running, unless a person deliberately halted it",
    home: "clock",
    reads: "Fly",
    corrector: "scripts/bots-start-stopped.sh",
    budget: "3 starts in 6 hours, then stop",
    reaches: ISSUE_TO_OWNER,
    probe: () => {
      const machines = json(FLY, ["machine", "list", "-a", BOTS_APP, "--json"]);
      return machines ? judgeMachine(machines) : unknown("cannot read Fly");
    },
  },
  {
    id: "bots-responsive",
    mustBeTrue: "The bots process is alive, polling, and reachable from Mission Control",
    home: "clock",
    reads: "Fly",
    corrector: null,
    budget: "none: needs a named cause first",
    reaches: ISSUE_TO_OWNER,
    probe: (nowMs) => {
      const machines = json(FLY, ["machine", "list", "-a", BOTS_APP, "--json"]);
      const id = machines?.find((m) => (m.config?.standbys ?? []).length === 0)?.id;
      if (!id) return unknown("cannot read Fly");
      const stamp = json(FLY, [
        "machine",
        "exec",
        id,
        "cat /data/health.json",
        "-a",
        BOTS_APP,
        "--timeout",
        String(EXEC_TIMEOUT_S),
      ]);
      return stamp ? judgeStamp(stamp, nowMs) : unknown("cannot read the health stamp");
    },
  },
  {
    id: "main-deploys",
    mustBeTrue: "A merge to main reaches production",
    home: "clock",
    reads: "GitHub",
    corrector: "the Moneypenny repair lane",
    budget: "once per failure signature",
    reaches: ISSUE_TO_OWNER,
    // deploy-lag reads the deploy jobs and what the bots machine runs; bots-deploy-preflight is
    // not a judge, because it says skip on a debounce or after three failed deploys.
    probe: (nowMs) => {
      const lag = json(
        process.execPath,
        [join(HERE, "deploy-lag.mjs"), "--json"],
        DEPLOY_LAG_TIMEOUT_MS,
      );
      if (lag?.known === false && lag.reason) readFailures.push(`deploy-lag: ${lag.reason}`);
      return judgeDeploys(lag, nowMs);
    },
  },
  {
    id: "alerts-reach-owner",
    mustBeTrue: "A critical alert reaches the owner when they are not looking",
    home: "clock",
    reads: "Fly",
    corrector: null,
    budget: "none: a credential is the owner's to set",
    reaches: ISSUE_TO_OWNER,
    probe: () => {
      const secrets = json(FLY, ["secrets", "list", "-a", DASHBOARD_APP, "--json"]);
      return secrets
        ? judgeAlertReach(secrets.map((secret) => secret.name ?? secret.Name))
        : unknown("cannot read Fly");
    },
  },
  {
    id: "memory-has-history",
    mustBeTrue: "Any change to shared agent memory can be seen and undone",
    // Only a person's machine holds the memory folders. Nothing gathers this yet; the clock
    // prints it as not-here so the gap stays visible rather than hidden.
    home: "session",
    reads: "this machine",
    corrector: "scripts/hooks/memory-history.mjs",
    budget: "every write",
    reaches: "the session",
    probe: () => {
      const dirs = memoryDirs();
      if (!dirs.length) return unknown("no memory folder on this machine");
      const bare = dirs.filter((dir) => !existsSync(join(dir, ".git")));
      return bare.length
        ? fail(`${bare.length} of ${dirs.length} memory folders have no history`)
        : pass(`${dirs.length} folder(s) versioned`);
    },
  },
];

const issueTitle = (id) => `[fitness] ${id}`;
const blindTitle = (source) => `[fitness] cannot read ${source}`;
const filesIssue = (r) => r.reaches === ISSUE_TO_OWNER;
// Details carry running numbers (minutes ago, a streak), so the compare drops them: a standing
// failure is one state, not a new one every tick. A real-tick replay of the 10-22 outage posted 70
// comments before this.
const shape = (text) => String(text ?? "").replace(/\d+/g, "N");
const seen = (issue, detail) =>
  shape(issue.body).includes(shape(detail)) || shape(issue.lastComment).includes(shape(detail));

/**
 * What the issues should do, given results and the open fitness issues. Pure. A failure opens one
 * issue or comments only when its cause changed, so a standing failure does not pile up comments.
 * A pass closes the issue. Unknown and not-here touch a contract's own issue not at all: they
 * prove neither health nor failure. Instead, a source nobody at home could read gets one quiet
 * issue, closed once any contract reads it again. Only a contract whose `reaches` is an issue
 * takes part.
 */
export function reportActions(results, openIssues) {
  const actions = [];
  const find = (title) => openIssues.find((i) => i.title === title);
  const filing = results.filter(filesIssue);
  for (const r of filing) {
    const issue = find(issueTitle(r.id));
    if (r.status === "fail" && !issue) actions.push({ kind: "open", result: r });
    else if (r.status === "fail" && !seen(issue, r.detail)) {
      actions.push({ kind: "comment", number: issue.number, result: r });
    } else if (r.status === "pass" && issue)
      actions.push({ kind: "close", number: issue.number, result: r });
  }
  for (const source of new Set(filing.map((r) => r.reads))) {
    const blind = filing.filter((r) => r.reads === source && r.status === "unknown");
    const read = filing.some(
      (r) => r.reads === source && (r.status === "pass" || r.status === "fail"),
    );
    const issue = find(blindTitle(source));
    if (blind.length && !issue) actions.push({ kind: "open-blind", source, results: blind });
    else if (!blind.length && read && issue) {
      actions.push({ kind: "close-blind", number: issue.number, source });
    }
  }
  return actions;
}

function issueBody(r) {
  return [
    `**This must stay true:** ${r.mustBeTrue}.`,
    `**What failed:** ${r.detail}.`,
    `**What fixes it:** ${r.corrector ?? "nothing automatic yet"} (budget: ${r.budget}).`,
    "",
    "This issue closes itself once the check passes. Contract: `scripts/fitness.mjs`.",
  ].join("\n");
}

function blindBody(source, results) {
  return [
    `**These checks are blind:** ${results.map((r) => r.id).join(", ")} cannot read ${source}.`,
    `**What the probes said:** ${[...new Set(results.map((r) => r.detail))].join(" · ")}.`,
    "**Who hears:** nobody yet. This issue's age is how long the checks have been blind.",
    "",
    `This issue closes itself once ${source} can be read again. Contract: \`scripts/fitness.mjs\`.`,
  ].join("\n");
}

/** The gh command one action needs, and the name the log prints for it. */
function ghWrite(a) {
  switch (a.kind) {
    case "open":
      return {
        name: issueTitle(a.result.id),
        args: [
          "issue",
          "create",
          "--title",
          issueTitle(a.result.id),
          "--label",
          "bug",
          "--assignee",
          OWNER,
          "--body",
          issueBody(a.result),
        ],
      };
    case "comment":
      return {
        name: issueTitle(a.result.id),
        args: [
          "issue",
          "comment",
          String(a.number),
          "--body",
          `Still failing, and it changed: ${a.result.detail}.`,
        ],
      };
    case "close":
      return {
        name: issueTitle(a.result.id),
        args: [
          "issue",
          "close",
          String(a.number),
          "--comment",
          `Passing again: ${a.result.detail}.`,
        ],
      };
    case "open-blind":
      // Unassigned on purpose: who hears a blind check, and when, is a separate decision.
      return {
        name: blindTitle(a.source),
        args: [
          "issue",
          "create",
          "--title",
          blindTitle(a.source),
          "--label",
          "bug",
          "--body",
          blindBody(a.source, a.results),
        ],
      };
    case "close-blind":
      return {
        name: blindTitle(a.source),
        args: ["issue", "close", String(a.number), "--comment", `${a.source} can be read again.`],
      };
    default:
      throw new Error(`no gh command for ${a.kind}`);
  }
}

function report(results, write) {
  // Listed by label, not --search: the search index lags a new issue, which would open a duplicate.
  readFailures.length = 0;
  const listed = json(GH, [
    "issue",
    "list",
    "--state",
    "open",
    "--label",
    "bug",
    "--json",
    "number,title,body,comments",
    "--limit",
    "200",
  ]);
  if (!Array.isArray(listed)) {
    if (listed !== null)
      readFailures.push("gh issue list replied with something that is not a list");
    console.log(
      `::warning::fitness: cannot read GitHub issues, so nothing was reported (${readFailures.join("; ")})`,
    );
    return;
  }
  const open = listed.map((i) => ({
    ...i,
    lastComment: i.comments?.at(-1)?.body ?? "",
  }));
  for (const a of reportActions(results, open)) {
    const { name, args } = ghWrite(a);
    if (!write) {
      console.log(`fitness: would ${a.kind} ${name} (not on CI, so nothing is written)`);
      continue;
    }
    const done = run(GH, args);
    console.log(
      `fitness: ${done.ok ? "" : "COULD NOT "}${a.kind} ${name}${done.ok ? "" : ` (${done.why})`}`,
    );
  }
}

const sleep = (ms) => {
  if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

/** One probe, fenced: a thrown reply is this contract's unknown and a red exit, never the tick's. */
function attempt(contract, nowMs) {
  readFailures.length = 0;
  try {
    const verdict = contract.probe(nowMs);
    if (verdict.status === "unknown") {
      const why = readFailures.length ? ` (${readFailures.join("; ")})` : "";
      console.log(`::warning::fitness: ${contract.id} ${verdict.detail}${why}`);
    }
    return verdict;
  } catch (err) {
    console.log(
      `::warning::fitness: ${contract.id} probe crashed: ${firstLine(err?.message ?? err)}`,
    );
    return { ...unknown("the probe crashed"), crashed: true };
  }
}

/** Every contract read once from here, blips read twice. Returns the results and whether one crashed. */
function probeAll(nowMs, here) {
  let crashed = false;
  const results = CONTRACTS.map(({ probe, ...contract }) => {
    if (contract.home !== here) return { ...contract, ...notHere(contract.home, here) };
    let verdict = attempt({ ...contract, probe }, nowMs);
    // A crash on either read is still a crash: the retry may read clean, the run stays red.
    crashed ||= Boolean(verdict.crashed);
    if (verdict.status === "unknown") {
      sleep(RETRY_MS);
      verdict = attempt({ ...contract, probe }, nowMs);
      crashed ||= Boolean(verdict.crashed);
    }
    const { crashed: _, ...rest } = verdict;
    return { ...contract, ...rest };
  });
  return { results, crashed };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const here = whereAmI();
  const { results, crashed } = probeAll(Date.now(), here);
  if (process.argv.includes("--json")) console.log(JSON.stringify(results, null, 2));
  else {
    for (const r of results) {
      console.log(`${r.status.toUpperCase().padEnd(9)}${r.id}: ${r.detail}`);
      if (r.status === "fail")
        console.log(`         corrects: ${r.corrector ?? "nothing yet"} · reaches: ${r.reaches}`);
    }
  }
  if (process.argv.includes("--report")) report(results, process.env.GITHUB_ACTIONS === "true");
  else if (results.some((r) => r.status === "fail")) process.exitCode = 1;
  if (crashed) process.exitCode = 1;
}

export { HOMES };
