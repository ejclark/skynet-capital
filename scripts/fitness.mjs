#!/usr/bin/env node
// Fitness: what must stay true about the running system, checked from outside it (#6470).
//
// Eric, 2026-11-01: fitness functions define "the test that needs to pass", and AI must be able to
// detect, correct and maintain when they don't; they define self-healing systems. Every coach in
// docs/COACHES.md watches the code, so this watches outcomes. The bots outage is why each contract
// carries the parts it does:
//
//   mustBeTrue   an outcome, not a proxy. A green deploy step reported "current" over a dead fleet.
//                A contract that can only read a proxy says so in these words (alerts-reach-owner).
//   probe        reads the real thing, from outside it. A check inside the process dies with it.
//   reads        the source the probe depends on. One issue per source that cannot be read, so a
//                Fly outage opens one issue and not three.
//   home         where the probe can see: clock (the scheduled job), push (a push-driven job) or
//                session (a person's machine). Away from home it reports not-here, which is
//                neither health nor blindness; a contract is never hidden, only placed.
//   corrector    what fixes it, or null. A check with no corrector is only an alarm.
//   budget       how often the corrector may act before it must stop and ask.
//   rung         when a failure reaches the owner: scripts/fitness-rungs.mjs. Correcting comes
//                first and the email comes last, in his words of 11-01.
//   attempts     the budget in a form code reads, counted from marked bot comments on the issue.
//   reaches      who hears a failure, read by report(): only a contract that reaches an issue
//                files one. The market-hours stall alert detected correctly from 10-18 and
//                reached nobody, because its mail credential was never set.
//   gap          optional: the state of the world this can read well while its outcome fails,
//                printed on its issue so whoever reads a stall knows what the check cannot see.
//
// A probe that cannot run reports "unknown", never a pass: an unknown is not health. A blip is
// retried once inside the tick; an unknown that persists opens one issue per unreadable source,
// whose age is how long the checks were blind and which takes the same two-hour limit. A dead
// credential behind the read goes straight to the owner. A probe reads "quiet" when there is nothing
// here to judge (a closed market, a fault another contract owns): neither health nor a failure, so
// one stop is one report and a stall at 15:50 does not read as healed at 16:00. Each probe runs in
// its own try/catch with a ::warning:: line, so one malformed reply cannot blind the others. Every
// spawn has a deadline: a hung read must cost one contract, not the tick.
//
// This script detects and reports. The start script runs before it on the clock, so the correction
// has happened or been refused by the time this reads. `--json` for machines. `--report` keeps one
// issue per failing contract, unassigned until its rung says otherwise, and reopens a thread closed
// in the last 14 days rather than starting another. An assignment is what GitHub delivers to a phone
// and inbox, so reaching him needs no new credential, and a bot must make it. So it writes only when
// GITHUB_ACTIONS is true (a session running it under the owner's login filed #6501, and a
// self-assignment sends no notice); elsewhere it prints what it would do. The repo is public, so an
// issue carries only the contract's own words and never a log line.
//
// Exit codes: 0 all passing, unknown, quiet or not-here, or --report · 1 something fails, or a
// probe crashed. A write that GitHub refused is printed, not fatal: the next tick retries it.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import nodeModule, { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  filesIssue,
  ghWrites,
  ISSUE_TO_OWNER,
  issueTitle,
  reportActions,
} from "./fitness-issue-actions.mjs";
import {
  ASSIGNMENT_FRESH_MS,
  fail,
  judgeAlertReach,
  judgeAssignmentPath,
  judgeDecisionCycle,
  judgeDeploys,
  judgeLiveSilent,
  judgeMachine,
  judgeStamp,
  notHere,
  outsideSession,
  parseDecisionLine,
  parseTally,
  pass,
  quiet,
  STAMP_FRESH_MS,
  unknown,
} from "./fitness-judges.mjs";
import { OWNER } from "./fitness-rungs.mjs";
import { isMain } from "./is-main.mjs";

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
const BOTS_APP = "skynet-capital-bots";
const DASHBOARD_APP = "skynet-capital";
// A read that fails once is retried after this pause before it counts as blind.
const RETRY_MS = Number(process.env.FITNESS_RETRY_MS ?? 15_000);
const HOMES = ["clock", "push", "session"];
// Where the bots write one JSONL file per persona (SKYNET_AUDIT_DIR in fly.bots.toml). A name is
// checked before it is passed back to the machine. `<persona>.<stamp>.jsonl.gz` is a rotated archive
// and never matches. The same archive is plain `<persona>.<stamp>.jsonl` while its gzip runs, or for
// good if the gzip failed, and that one does: mid-rotation it holds the persona's newest record.
const JOURNAL_DIR = "/data/audit";
const JOURNAL_FILE = /^[\w.-]+\.jsonl$/;
// The scouts file records under their own persona ids when they pick or close. A scout writing says
// nothing about the bots' cycles, so its record must not read as the fleet deciding. Matched on the
// name before its first dot, which also covers a scout's plain archive.
const SCOUT_JOURNALS = new Set(["beta-scout", "cond-scout"]);
// The tally runs on the bots machine itself (scripts/journal-tally.mjs, shipped in the image), so
// five sessions of journal never cross flyctl as text. Its argument is the journal folder.
const TALLY_COMMAND = `node /app/scripts/journal-tally.mjs ${JOURNAL_DIR}`;
// The node .nvmrc names, and the one the session clock is proven on. The clock job's own pin is on a
// held platter PR, so until it lands this contract reads unknown and says why.
const SESSION_CLOCK_NODE = 24;
// A second start inside this is a machine that keeps dying, not one that just came back.
const RESTART_LOOP_MS = 60 * 60_000;
// What a read's failure says when only the owner can fix it. Not a bare 403: the shared REST bucket
// answers that when it runs out, which has happened twice in a day and is nobody's credential.
const DEAD_CREDENTIAL =
  /token[^.]*(expired|invalid|revoked)|unauthori[sz]ed|not authorized|must be authenticated|HTTP 401|bad credentials/i;

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

/**
 * One read on the bots machine, with no shell, for the journal. Its reason keeps only flyctl's exit
 * and leaves out what it said on stderr, because that may repeat what the command read.
 */
function journalRead(id, command) {
  const res = run(FLY, [
    "machine",
    "exec",
    id,
    command,
    "-a",
    BOTS_APP,
    "--timeout",
    String(EXEC_TIMEOUT_S),
  ]);
  if (!res.ok) {
    readFailures.push(res.why.split(":")[0]);
    return null;
  }
  // flyctl prints a remote command's failure as this line on stdout and exits 0.
  if (!/^Exit code: \d+/m.test(res.out)) return res.out;
  readFailures.push("the command failed on the machine");
  return null;
}

/** The newest live journal's last record, null for no record, or the unknown that stopped the read. */
function newestDecision(id) {
  const cannotRead = unknown("cannot read the decision journal");
  const listing = journalRead(id, `ls -t ${JOURNAL_DIR}`);
  if (listing === null) return cannotRead;
  const newestFile = listing
    .split("\n")
    .map((name) => name.trim())
    .find((name) => JOURNAL_FILE.test(name) && !SCOUT_JOURNALS.has(name.split(".")[0]));
  if (!newestFile) return null;
  // Two lines: a crash or a full disk tears the newest first, and a stall must not hide behind that.
  const lines = journalRead(id, `tail -n 2 ${JOURNAL_DIR}/${newestFile}`);
  if (lines === null) return cannotRead;
  if (!lines.trim()) return null;
  const newest = lines.trim().split("\n").reverse().map(parseDecisionLine).find(Boolean);
  if (newest) return newest;
  // A short file whose only line is torn may be mid-append, so this is worth the retry a blip gets.
  readFailures.push("unreadable");
  return unknown("the newest decision record is unreadable");
}

let stallRule;

/**
 * The app's stall rule and calendar, loaded from its TypeScript with no install: plain node 24
 * strips the types, and this hook maps the source's `./x.js` imports to `./x.ts`. There is no second
 * session clock here, which is the point. An older node gets a reason rather than a crash.
 */
export function loadStallRule(version = process.versions.node) {
  if (Number(version.split(".")[0]) < SESSION_CLOCK_NODE) {
    return {
      why: `this job runs node ${version}, and the session clock needs ${SESSION_CLOCK_NODE}`,
    };
  }
  if (stallRule) return stallRule;
  try {
    nodeModule.registerHooks({
      resolve(spec, context, next) {
        try {
          return next(spec, context);
        } catch (err) {
          if (!(spec.startsWith(".") && spec.endsWith(".js"))) throw err;
          return next(`${spec.slice(0, -3)}.ts`, context);
        }
      },
    });
    const load = createRequire(join(HERE, "fitness.mjs"));
    const { BOT_STALL_AFTER_MS, botAlerts, sessionAt } = load("../src/alerts/bot-watch.ts");
    const { MARKET_CLOSURES } = load("../src/domain/market-calendar.ts");
    stallRule = {
      botAlerts,
      sessionAt,
      stallAfterMs: BOT_STALL_AFTER_MS,
      calendarEnds: MARKET_CLOSURES.at(-1).date,
    };
  } catch (err) {
    // The code or name and not the message, which can print this machine's paths into a public issue.
    stallRule = {
      why: `node ${version} could not load the session clock (${err?.code ?? err?.name})`,
    };
  }
  return stallRule;
}

function memoryDirs() {
  const root = join(homedir(), ".claude", "projects");
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .map((name) => join(root, name, "memory"))
    .filter((dir) => existsSync(join(dir, "MEMORY.md")));
}

/**
 * Whether Fly started this machine once, inside the window. Once matters: a process that dies and
 * restarts every few minutes always has a young start and a stale stamp, and a grace for every
 * start would read that loop as quiet on every tick. No start event on record is not recent.
 */
function startedOnceWithin(machine, windowMs, nowMs) {
  const starts = (machine.events ?? [])
    .filter((e) => e.type === "start" && nowMs - e.timestamp < RESTART_LOOP_MS)
    .map((e) => e.timestamp);
  return starts.length === 1 && nowMs - starts[0] < windowMs;
}

// One read for the whole assignment path: REST would be one call per issue held, every tick, and the
// shared bucket has run out twice in a day. A person's assignment and a bot's differ only in the
// actor's type, which the issues list does not carry.
//
// GitHub's assignee filter matches who holds an issue now, so it drops a thread he took himself off,
// which is his documented answer (fitness-rungs.mjs), and the path then failed on his own answer
// (#6701). The search in the same call finds the `[fitness]` threads updated in the window whoever
// holds them: about 30 a month, where `bug` issues alone overflow one page of 100.
const ASSIGNMENTS_QUERY = `query($owner: String!, $name: String!, $who: String!, $since: DateTime!, $threads: String!) {
  repository(owner: $owner, name: $name) {
    issues(first: 100, orderBy: { field: UPDATED_AT, direction: DESC },
           filterBy: { assignee: $who, since: $since, states: [OPEN, CLOSED] }) {
      nodes { ...assignments }
    }
  }
  search(type: ISSUE, first: 100, query: $threads) {
    nodes { ...assignments }
  }
}
fragment assignments on Issue {
  number title state
  timelineItems(itemTypes: [ASSIGNED_EVENT], last: 10) {
    nodes { ... on AssignedEvent { createdAt actor { __typename } assignee { ... on User { login } } } }
  }
}`;

// One contract per thing that must stay true. Order is the order they matter.
export const CONTRACTS = [
  {
    id: "bots-running",
    mustBeTrue: "The bots machine is running, unless a person deliberately halted it",
    home: "clock",
    reads: "Fly",
    corrector: "scripts/bots-start-stopped.sh",
    budget: "3 starts in 6 hours, then stop",
    rung: "script",
    // The same numbers as the script, which a spec holds equal: the script spends, this reads.
    attempts: { marker: "<!-- bots-start-stopped:start -->", max: 3, windowHours: 6 },
    reaches: ISSUE_TO_OWNER,
    probe: (nowMs) => {
      const machines = json(FLY, ["machine", "list", "-a", BOTS_APP, "--json"]);
      return machines ? judgeMachine(machines, nowMs) : unknown("cannot read Fly");
    },
  },
  {
    id: "bots-responsive",
    mustBeTrue: "The bots process is alive, polling, and reachable from Mission Control",
    home: "clock",
    reads: "Fly",
    corrector: null,
    budget: "none: needs a named cause first",
    rung: "wait",
    reaches: ISSUE_TO_OWNER,
    probe: (nowMs) => {
      const machines = json(FLY, ["machine", "list", "-a", BOTS_APP, "--json"]);
      const id = machines?.find((m) => (m.config?.standbys ?? []).length === 0)?.id;
      if (!id) return unknown("cannot read Fly");
      // One stop, one report: a machine that is down has no process to ask, and a deliberate halt
      // is no fault at all. bots-running reports the first and passes the second.
      const primary = machines.find((m) => m.id === id);
      if (primary.state !== "started") {
        return quiet(`machine is ${primary.state}: bots-running reports this`);
      }
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
      if (!stamp) return unknown("cannot read the health stamp");
      const verdict = judgeStamp(stamp, nowMs);
      // The start script ran moments ago, so the stamp on disk is the dead process's. Give it the
      // stamp's own window to write a new one, rather than a second issue about the same stop.
      return verdict.status === "fail" && startedOnceWithin(primary, STAMP_FRESH_MS, nowMs)
        ? quiet("the machine just started, so its stamp has not caught up")
        : verdict;
    },
  },
  {
    id: "decision-cycle",
    mustBeTrue:
      "While the regular session is open, the bots keep making decisions, unless a person halted them",
    home: "clock",
    // Its own source: a job whose node cannot load the clock has read Fly perfectly well.
    reads: "the decision journal",
    // A stall has no script: neither recorded one would be fixed by a restart, and a restart is a
    // state-destroying action, never a probe. Add a corrector only after a /retro names a hang.
    corrector: null,
    budget: "none: past restarts did not fix this class, so it needs a named cause first",
    rung: "wait",
    reaches: ISSUE_TO_OWNER,
    gap: "A fresh record from one bot passes for the whole fleet, a cycle that decided on frozen prices passes, a fleet in observe mode passes because it decides and places nothing (the fleet health card's paper-orders row now names it, and live-bots-place reads a live bot that proposes and never places), a fleet held by a breaker reads quiet, which includes every evaluation failing once five in a row trip the errors breaker, a running machine still carrying a person's halt mark reads quiet, a stall reads quiet for the first ten minutes of a session, and one in the session's last twenty minutes, which the 15-minute clock cannot read ten minutes on, stays quiet until ten minutes past the next open. A journal write that fails on a full volume reads as a stall while cycles run",
    // Reads the outcome's own trace, "every decision cycle is a durable line". The older reads pass
    // the 10-08 class: started and polling, with no decision for days. Class: an atomic read of a
    // fleet-wide outcome (the gap above is the difference), continual on the 15-minute clock, dynamic,
    // automated.
    //
    // Wrong if, between 2026-11-02 and 2026-11-30, this fails on a session where the machine's
    // [heartbeat] log line shows cycles running; or if, by 2026-12-15, a session shows a gap of 30
    // minutes or more in the journal with no issue within 45 minutes. Retires when a contract reads
    // both this and a breaker, or if the journal stops being written.
    probe: (nowMs) => {
      const rule = loadStallRule();
      if (rule.why) return unknown(rule.why);
      const outside = outsideSession(nowMs, rule);
      if (outside) return outside;
      const machines = json(FLY, ["machine", "list", "-a", BOTS_APP, "--json"]);
      // A Fly outage is charged to Fly, so it opens one issue and not a second for the journal.
      if (!Array.isArray(machines)) return { ...unknown("cannot read Fly"), reads: "Fly" };
      const primary = machines.find((m) => (m.config?.standbys ?? []).length === 0);
      // One stop, one report: bots-running reports the first two. The halt note is not echoed.
      if (!primary) return quiet("no primary machine: bots-running reports this");
      if (primary.config?.metadata?.["skynet-halt"]) return quiet("a person halted the machine");
      if (primary.state !== "started") {
        return quiet(`machine is ${primary.state}: bots-running reports this`);
      }
      const newest = newestDecision(primary.id);
      const verdict = newest?.status ? newest : judgeDecisionCycle(newest, nowMs, rule);
      // The start script ran moments ago, so the newest record is the dead process's. Give the new
      // one the stall window, rather than a second issue about the same stop.
      return verdict.status === "fail" && startedOnceWithin(primary, rule.stallAfterMs, nowMs)
        ? quiet("the machine just started, so it has not had the stall window yet")
        : verdict;
    },
  },
  {
    id: "live-bots-place",
    mustBeTrue:
      "A bot placing paper orders on its own places them, or records why it did not, within five sessions",
    home: "clock",
    reads: "the decision journal",
    // A silent bot has no script: the cause could be a guard, a broker or a playbook, and a restart
    // is a state-destroying action, never a probe. Add a corrector only after a /retro names one.
    corrector: null,
    budget: "none: a bot that proposes and never places needs a named cause first",
    rung: "wait",
    reaches: ISSUE_TO_OWNER,
    gap: "A bot that proposes nothing for five sessions passes, which is a quiet trigger and not a silent bot. A bot the house, its owner or its readiness gate holds to watching is not judged; the fleet health card's paper-orders row names that. One placed order or one recorded reason in five sessions passes the bot, however many proposals went unexplained beside it. It judges after the close only, so a bot that falls silent mid-session is read that evening",
    // Reads the outcome's own trace, the decision journal, through a tally run on the machine:
    // journal-tally.mjs prints ids and counts only. Class: an atomic read of a per-bot outcome,
    // continual on the 15-minute clock outside the session, automated.
    //
    // Wrong if, by 2026-12-31, this fails for a bot whose decision records in those five sessions
    // carry a placed order or a refusal (a tally that miscounts); or if a live bot proposes for five
    // sessions, places nothing and records no reason, and no [fitness] live-bots-place issue opens
    // by the next morning. Retires when the bots alert on a silent bot themselves, read from outside.
    probe: (nowMs) => {
      const rule = loadStallRule();
      if (rule.why) return unknown(rule.why);
      // Outside the session only: the tally reads megabytes on a one-CPU machine, and a trading
      // cycle must never wait on it. outsideSession is null in session and quiet when closed.
      const outside = outsideSession(nowMs, rule);
      if (!outside) return quiet("judged after the close, so the read never slows a trading cycle");
      if (outside.status === "unknown") return outside;
      const machines = json(FLY, ["machine", "list", "-a", BOTS_APP, "--json"]);
      if (!Array.isArray(machines)) return { ...unknown("cannot read Fly"), reads: "Fly" };
      const primary = machines.find((m) => (m.config?.standbys ?? []).length === 0);
      if (!primary) return quiet("no primary machine: bots-running reports this");
      if (primary.state !== "started") {
        return quiet(`machine is ${primary.state}: bots-running reports this`);
      }
      const out = journalRead(primary.id, TALLY_COMMAND);
      if (out === null) return unknown("cannot read the decision journal");
      const tally = parseTally(out);
      if (!tally) readFailures.push("the tally printed something it does not know");
      return judgeLiveSilent(tally, nowMs);
    },
  },
  {
    id: "main-deploys",
    mustBeTrue: "A merge to main reaches production",
    home: "clock",
    reads: "GitHub",
    corrector: "the Moneypenny repair lane",
    budget: "once per failure signature",
    rung: "wait",
    reaches: ISSUE_TO_OWNER,
    // deploy-lag reads which releases the deploy jobs landed, and never the machine's GIT_SHA;
    // bots-deploy-preflight is not a judge, because it says skip on a debounce or after three failed
    // deploys.
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
    // The id is the title of its open thread (#6501), so it keeps the outcome it was named for. The
    // words below say what it reads.
    id: "alerts-reach-owner",
    mustBeTrue:
      "The dashboard holds the mail credential a critical alert needs. This does not prove an alert reaches the owner: each account must also opt in, delivery is off by default, and nothing here reads that",
    home: "clock",
    reads: "Fly",
    corrector: null,
    budget: "none: a credential is the owner's to set",
    rung: "owner",
    reaches: ISSUE_TO_OWNER,
    probe: () => {
      const secrets = json(FLY, ["secrets", "list", "-a", DASHBOARD_APP, "--json"]);
      return secrets
        ? judgeAlertReach(secrets.map((secret) => secret.name ?? secret.Name))
        : unknown("cannot read Fly");
    },
  },
  {
    // Separate from alerts-reach-owner on purpose: that contract reads whether the mail credential is
    // set, and passing this one does not satisfy it (#6470 study, corrected finding).
    id: "owner-assignment-path",
    mustBeTrue:
      "The owner can be assigned, a bot made the assignment, and one exists from the last 30 days. This does not prove an email arrived or that a watch buzzed: no API shows that",
    home: "clock",
    reads: "GitHub",
    corrector: "the report re-assigns under the bot what a person assigned",
    budget: "once per failing tick, and only on an open fitness issue",
    rung: "owner",
    reaches: ISSUE_TO_OWNER,
    probe: (nowMs) => {
      const can = run(GH, ["api", `repos/{owner}/{repo}/assignees/${OWNER}`]);
      if (!(can.ok || /HTTP 404/.test(can.why))) {
        readFailures.push(can.why);
        return unknown("cannot read GitHub");
      }
      const since = new Date(nowMs - ASSIGNMENT_FRESH_MS).toISOString();
      const reply = json(GH, [
        "api",
        "graphql",
        "-F",
        "owner={owner}",
        "-F",
        "name={repo}",
        "-F",
        `who=${OWNER}`,
        "-F",
        `since=${since}`,
        "-F",
        // gh fills {owner} and {repo} inside a -F value, so the search names this repository.
        `threads=repo:{owner}/{repo} is:issue label:bug in:title fitness updated:>=${since.slice(0, 10)}`,
        "-f",
        `query=${ASSIGNMENTS_QUERY}`,
      ]);
      if (!reply) return unknown("cannot read GitHub");
      return judgeAssignmentPath(
        {
          assignable: can.ok,
          issues: reply.data.repository.issues.nodes,
          threads: reply.data.search.nodes,
        },
        nowMs,
      );
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
    rung: "session",
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

/**
 * A thread's comments in the fields ownerDue reads, or undefined with a warning. From the REST route
 * because it carries the author's type and the issues list carries only a login, and a marker counts
 * only from a bot.
 */
function threadComments(number) {
  const res = run(GH, [
    "api",
    `repos/{owner}/{repo}/issues/${number}/comments?per_page=100`,
    "--paginate",
    "--jq",
    ".[] | {type: .user.type, body: .body, at: .created_at}",
  ]);
  try {
    if (!res.ok) throw new Error(res.why);
    return res.out
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (err) {
    console.log(
      `::warning::fitness: cannot read the comments on #${number}, so its assignment waits (${firstLine(err.message)})`,
    );
    return undefined;
  }
}

/**
 * The closed threads a failure with no open issue might reopen. Read only then, so a healthy tick
 * spends nothing. A failed read files a new issue rather than nothing: a second thread is tidier to
 * lose than a failure is to hide.
 */
function closedThreads(titles) {
  readFailures.length = 0;
  const listed = json(GH, [
    "issue",
    "list",
    "--state",
    "all",
    "--search",
    '"[fitness]" in:title sort:updated-desc',
    "--json",
    "number,title,state,closedAt,createdAt,assignees",
    "--limit",
    "50",
  ]);
  if (!Array.isArray(listed)) {
    console.log(
      `::warning::fitness: cannot read closed fitness issues, so a new one may be filed (${readFailures.join("; ")})`,
    );
    return [];
  }
  return listed
    .filter((i) => i.state === "CLOSED" && titles.includes(i.title))
    .map((i) => ({ ...i, botComments: threadComments(i.number) }));
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
    "number,title,body,comments,createdAt,assignees",
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
  const open = listed.map((i) => {
    const thread = { ...i, lastComment: i.comments?.at(-1)?.body ?? "" };
    // Only a fitness thread nobody holds can still move up, so only that one spends a read.
    const unheld = i.title.startsWith("[fitness] ") && !i.assignees?.some((a) => a.login === OWNER);
    return unheld ? { ...thread, botComments: threadComments(i.number) } : thread;
  });
  const unfiled = results
    .filter((r) => filesIssue(r) && r.status === "fail")
    .map((r) => issueTitle(r.id))
    .filter((title) => !open.some((i) => i.title === title));
  const closedIssues = unfiled.length ? closedThreads(unfiled) : [];
  for (const a of reportActions(results, open, { nowMs: Date.now(), closedIssues })) {
    const { name, commands } = ghWrites(a);
    if (!write) {
      console.log(`fitness: would ${a.kind} ${name} (not on CI, so nothing is written)`);
      continue;
    }
    let done = { ok: true };
    for (const args of commands) {
      done = run(GH, args);
      if (!done.ok) break;
    }
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
      // The words stay in the log. The issue only learns that only the owner can act.
      if (DEAD_CREDENTIAL.test(readFailures.join(" "))) return { ...verdict, credential: true };
    }
    return verdict;
  } catch (err) {
    console.log(
      `::warning::fitness: ${contract.id} probe crashed: ${firstLine(err?.message ?? err)}`,
    );
    return { ...unknown("the probe crashed"), crashed: true };
  }
}

// An unknown worth a second read: a read failed or a reply crashed the probe. A judge's own
// unknown (no memory folder here, a lag dated in the future) reads the same twice, and the retry
// would repeat deploy-lag's dozens of GitHub reads for nothing.
const blip = (verdict) =>
  verdict.status === "unknown" && (verdict.crashed || readFailures.length > 0);

/** Every contract read once from here, blips read twice. Returns the results and whether one crashed. */
function probeAll(nowMs, here) {
  let crashed = false;
  const results = CONTRACTS.map(({ probe, ...contract }) => {
    if (contract.home !== here) return { ...contract, ...notHere(contract.home, here) };
    let verdict = attempt({ ...contract, probe }, nowMs);
    // A crash on either read is still a crash: the retry may read clean, the run stays red.
    crashed ||= Boolean(verdict.crashed);
    if (blip(verdict)) {
      sleep(RETRY_MS);
      verdict = attempt({ ...contract, probe }, nowMs);
      crashed ||= Boolean(verdict.crashed);
    }
    const { crashed: _, ...rest } = verdict;
    return { ...contract, ...rest };
  });
  return { results, crashed };
}

if (isMain(import.meta.url)) {
  const here = whereAmI();
  const { results, crashed } = probeAll(Date.now(), here);
  if (process.argv.includes("--json")) console.log(JSON.stringify(results, null, 2));
  else {
    for (const r of results) {
      console.log(`${r.status.toUpperCase().padEnd(9)}${r.id}: ${r.detail}`);
      if (r.status === "fail")
        console.log(
          `         corrects: ${r.corrector ?? "nothing yet"} · reaches: ${r.reaches} · rung: ${r.rung}`,
        );
    }
  }
  if (process.argv.includes("--report")) report(results, process.env.GITHUB_ACTIONS === "true");
  else if (results.some((r) => r.status === "fail")) process.exitCode = 1;
  if (crashed) process.exitCode = 1;
}

// The judges are pure and live in fitness-judges.mjs; they are re-exported so callers import them here.
export {
  HOMES,
  judgeAlertReach,
  judgeAssignmentPath,
  judgeDecisionCycle,
  judgeDeploys,
  judgeLiveSilent,
  judgeMachine,
  judgeStamp,
  parseDecisionLine,
  parseTally,
  reportActions,
};
