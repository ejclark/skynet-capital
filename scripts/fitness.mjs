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
  ASSIGNED_MARKER,
  assignsAtOnce,
  OWNER,
  ownerDue,
  REOPEN_LINE,
  REOPENED_MARKER,
  reopenable,
  whatHappensNext,
  whoHearsBlind,
} from "./fitness-rungs.mjs";
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
const STAMP_FRESH_MS = 5 * 60_000;
// A push lags for the minutes its own deploy takes. Judged with no grace, healthy 10-15 to 10-22
// read red at 65 of 729 ticks; 20 minutes clears them all (#6470 study).
const DEPLOY_GRACE_MS = 20 * 60_000;
// How far ahead of this tick's clock a lag can be dated and still be aged as just begun. A tick takes
// its clock before any probe runs, so a merge landing during the tick is dated after it, and GitHub's
// clock and a runner's differ by seconds. Further ahead is a clock that cannot be trusted.
const CLOCK_LEAD_MS = 5 * 60_000;
// A read that fails once is retried after this pause before it counts as blind.
const RETRY_MS = Number(process.env.FITNESS_RETRY_MS ?? 15_000);
// What src/adapters/email-alert-delivery.ts needs. Read as names, never values. The boot line said the
// same thing, but it aged out of the log buffer within hours and the contract went blind.
const ALERT_SECRETS = ["SKYNET_ALERT_EMAIL_API_KEY", "SKYNET_ALERT_EMAIL_FROM"];
// The `reaches` values report() understands. Any other value files nothing.
const ISSUE_TO_OWNER = "an issue assigned to the owner";
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
// A bot is judged over its last five sessions placing paper orders, and only while the newest of
// them is recent: a bot the house moved to watching last month is not silent today.
const SILENT_SESSIONS = 5;
const SILENT_RECENT_MS = 10 * 24 * 60 * 60_000;
// The node .nvmrc names, and the one the session clock is proven on. The clock job's own pin is on a
// held platter PR, so until it lands this contract reads unknown and says why.
const SESSION_CLOCK_NODE = 24;
// A second start inside this is a machine that keeps dying, not one that just came back.
const RESTART_LOOP_MS = 60 * 60_000;
// How recent a bot's assignment must be for the assignment path to count as used. A longer quiet
// costs one test email, which is the drill: the failure's own issue is the fresh assignment.
const ASSIGNMENT_FRESH_MS = 30 * 24 * 60 * 60_000;
// What a read's failure says when only the owner can fix it. Not a bare 403: the shared REST bucket
// answers that when it runs out, which has happened twice in a day and is nobody's credential.
const DEAD_CREDENTIAL =
  /token[^.]*(expired|invalid|revoked)|unauthori[sz]ed|not authorized|must be authenticated|HTTP 401|bad credentials/i;

const pass = (detail) => ({ status: "pass", detail });
const fail = (detail) => ({ status: "fail", detail });
const unknown = (detail) => ({ status: "unknown", detail });
const quiet = (detail) => ({ status: "quiet", detail });
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
  // Two clocks differ by seconds; a stamp a whole window ahead of this one cannot be aged, and a
  // negative age would pass as fresh for as long as the skew lasts (the deploys judge's rule).
  if (ageMs < -STAMP_FRESH_MS) return unknown("the stamp is dated in the future");
  if (ageMs > STAMP_FRESH_MS)
    return fail(`last controls poll ${Math.round(ageMs / 60000)} min ago`);
  return stamp.bridge === "armed"
    ? pass(`polled ${Math.round(ageMs / 1000)}s ago, bridge armed`)
    : fail(`bridge is ${stamp.bridge}`);
}

/**
 * Judge main's deploys on which release landed, never on a run's colour: a run reads green on a bots
 * debounce skip, and keeps reading green forever with no pushes. `lag` is what
 * scripts/deploy-lag.mjs --json prints. Each half is red only once its oldest undeployed commit
 * has waited past the grace; a lag with no date cannot be aged, so it is unknown, not a pass. A bots
 * half with no landed release in the runs read is unknown too: it says nothing about what they run.
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
  const undated = [];
  for (const [name, lagging, since] of halves) {
    if (!lagging) continue;
    const waitedMs = nowMs - Date.parse(since ?? "");
    if (!Number.isFinite(waitedMs)) undated.push(unknown(`the ${name} lag carries no date`));
    // A date well ahead of this clock cannot be aged either: the API has read an hour ahead of a
    // runner, and a negative wait would pass as young for as long as the skew lasts.
    else if (waitedMs < -CLOCK_LEAD_MS) {
      undated.push(unknown(`the ${name} lag is dated in the future`));
    } else {
      const line = `${name} undeployed ${Math.round(Math.max(waitedMs, 0) / 60000)} min`;
      (waitedMs > DEPLOY_GRACE_MS ? late : young).push(line);
    }
  }
  if (lag.bots?.baseline === false && !lag.bots.lagging) {
    undated.push(unknown("no bots release landed in the runs read"));
  }
  // A half this cannot date never hides the other half's failure.
  if (late.length) return fail(late.join(", "));
  if (undated.length) return undated[0];
  return pass(young.length ? `${young.join(", ")}: inside the deploy grace` : "both apps current");
}

/**
 * Judge whether the mail credential is set, from the app's own secret names. A failure is proof: with
 * no credential nothing is mailed. A pass is not proof of the reverse, and its words say so, because
 * delivery is also opt-in per account and off by default. Reading the opt-in means reading the prefs
 * store, whose lines hold member addresses, so this contract states its limit instead of reading it.
 */
export function judgeAlertReach(secretNames) {
  const missing = ALERT_SECRETS.filter((name) => !secretNames.includes(name));
  return missing.length
    ? fail(`alerts reach nobody: ${missing.join(" and ")} not set`)
    : pass("the mail credential is set; each account still has to opt in");
}

/** Past the closures table's last year a holiday reads as an open market, so nothing there is sure. */
function outsideSession(nowMs, rule) {
  if (new Date(nowMs).getUTCFullYear() > Number(rule.calendarEnds.slice(0, 4))) {
    return unknown("the exchange calendar table ends before today");
  }
  return rule.sessionAt(nowMs) ? null : quiet("the regular session is closed");
}

/**
 * Judge the fleet's newest decision record with the app's own stall rule and session clock. `rule`
 * is what loadStallRule returns; `newest` is what parseDecisionLine returns, or null for no record,
 * which botAlerts itself would read as no claim. Only the stalled alert fails this: the halted alert
 * is a different question, a breaker, and a person may halt on purpose. The minutes come from the
 * alert but not its title, whose "12 min" and "1 h 5 min" would be a new cause every hour.
 */
export function judgeDecisionCycle(newest, nowMs, rule) {
  const outside = outsideSession(nowMs, rule);
  if (outside) return outside;
  if (!newest) return unknown("the decision journal holds no record");
  // The stamp's rule: two clocks differ by seconds, and a negative age would pass as fresh.
  if (newest.at - nowMs > STAMP_FRESH_MS)
    return unknown("the newest record is dated in the future");
  const read = `newest record ${new Date(newest.at).toISOString()}, halted ${newest.halted ? "yes" : "no"}, ${newest.bytes} bytes`;
  const stalled = rule
    .botAlerts([{ botId: "fleet", name: "The fleet", records: [newest] }], nowMs)
    .find((alert) => alert.dedupeKey.startsWith("stalled:"));
  if (stalled) {
    const minutes = Math.round(stalled.data.quietMs / 60_000);
    return fail(`no decision cycle finished in ${minutes} min of open market: ${read}`);
  }
  // The rule starts its count at the open, so a fleet dead since Friday is not yet stalled at 09:35.
  // That is no pass: it would close the open issue every morning and reopen it ten minutes later.
  if (newest.at < rule.sessionAt(nowMs).openAt) {
    return quiet("no cycle has finished since the open, and the stall window has not run out");
  }
  return newest.halted
    ? quiet(`cycles are running and the newest is halted, which this does not judge: ${read}`)
    : pass(read);
}

/**
 * The time, a flag and the size of a journal line, or null. Nothing else leaves this function: the
 * journal is production data and the clock's logs are public, and a halted record carries the
 * owner's reason verbatim, so the reason becomes a flag and a line that fails to parse says nothing.
 */
export function parseDecisionLine(text) {
  let record;
  try {
    record = JSON.parse(text);
  } catch {
    return null;
  }
  if (!Number.isFinite(record?.at) || record.at <= 0) return null;
  return { at: record.at, halted: Boolean(record.halted), bytes: Buffer.byteLength(text) };
}

/**
 * What journal-tally.mjs printed, or null for anything short of its exact shape. Only ids and counts
 * survive: a field this does not name never reaches a judge, a log or an issue.
 */
export function parseTally(text) {
  let raw;
  try {
    raw = JSON.parse(String(text ?? "").trim());
  } catch {
    return null;
  }
  if (raw?.tally !== 1 || !Array.isArray(raw.bots)) return null;
  const whole = (n) => Number.isInteger(n) && n >= 0;
  const bots = [];
  for (const bot of raw.bots) {
    if (typeof bot?.id !== "string" || !/^[\w-]{1,64}$/.test(bot.id)) return null;
    if (!Array.isArray(bot.sessions)) return null;
    const sessions = [];
    for (const day of bot.sessions) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day?.day ?? "")) return null;
      if (![day.proposed, day.placed, day.explained].every(whole)) return null;
      sessions.push({
        day: day.day,
        proposed: day.proposed,
        placed: day.placed,
        explained: day.explained,
      });
    }
    bots.push({ id: bot.id, sessions });
  }
  return { bots };
}

/**
 * Judge each bot placing paper orders on its last five sessions doing so (#6954 slice 1): it fails
 * when a bot proposed orders across them, placed none and recorded no reason, which is the live but
 * silent bot the decision-cycle contract passes. A guard's refusal, a broker rejection and a
 * cooldown skip are each a reason, so a bot held by the subscribed-only guard passes here and says
 * why on its decision records. A bot with fewer than five such sessions, or whose newest is older
 * than ten days, is not judged: a bot moved to watching is the paper-orders row's to report.
 */
export function judgeLiveSilent(tally, nowMs) {
  if (!tally) return unknown("the journal tally is unreadable");
  const judged = tally.bots.filter(
    (bot) =>
      bot.sessions.length >= SILENT_SESSIONS &&
      nowMs - Date.parse(`${bot.sessions[0].day}T00:00:00Z`) <= SILENT_RECENT_MS,
  );
  if (!judged.length) return quiet("no bot has five recent sessions placing paper orders");
  const sum = (bot, key) =>
    bot.sessions.slice(0, SILENT_SESSIONS).reduce((n, day) => n + day[key], 0);
  const silent = judged.filter(
    (bot) => sum(bot, "proposed") > 0 && sum(bot, "placed") === 0 && sum(bot, "explained") === 0,
  );
  if (silent.length) {
    const names = silent.map((bot) => `${bot.id} (${sum(bot, "proposed")} proposed)`).join(", ");
    return fail(
      `over five sessions placing paper orders, ${names} placed none and recorded no reason`,
    );
  }
  return pass(
    `${judged.length} bot(s) over five sessions placing paper orders: each placed or said why not`,
  );
}

/**
 * Judge the path that emails him when a contract fails: he can be assigned, a bot made the
 * assignment, and one exists from the last 30 days. It proves those three links and no more: no API
 * shows a delivered email or a buzzing watch, and #5955 was assigned at +10 minutes and first answered
 * at +90 hours. `issues` are the issues he holds, with their assigned events from GitHub's timeline.
 *
 * A person's own assignment does not count, and on an open fitness issue it fails, because that
 * issue's one notice never went out (#6501). report() re-assigns it under the bot, so that verdict
 * starts on the script rung rather than mailing him twice. Other work he took himself is his business.
 */
export function judgeAssignmentPath({ assignable, issues }, nowMs) {
  if (!assignable) return fail("the owner cannot be assigned on this repository");
  const toOwner = (issue) =>
    (issue.timelineItems?.nodes ?? [])
      .filter((event) => event.assignee?.login === OWNER)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const byBot = (event) => event.actor?.__typename === "Bot";
  const selfAssigned = issues.filter((issue) => {
    const newest = toOwner(issue)[0];
    return (
      issue.state === "OPEN" && issue.title.startsWith("[fitness] ") && newest && !byBot(newest)
    );
  });
  if (selfAssigned.length) {
    const names = selfAssigned.map((issue) => `#${issue.number}`).join(", ");
    return {
      ...fail(`a person assigned ${names}, which sends no notice`),
      rung: "script",
      reassign: selfAssigned.map((issue) => issue.number),
    };
  }
  const newestMs = Math.max(
    ...issues
      .flatMap(toOwner)
      .filter(byBot)
      .map((event) => Date.parse(event.createdAt)),
  );
  const ageMs = nowMs - newestMs;
  return ageMs <= ASSIGNMENT_FRESH_MS
    ? pass(`a bot assigned the owner ${Math.floor(ageMs / 86_400_000)} days ago`)
    : fail("no bot has assigned the owner in the last 30 days, so this issue is the test");
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
const ASSIGNMENTS_QUERY = `query($owner: String!, $name: String!, $who: String!, $since: DateTime!) {
  repository(owner: $owner, name: $name) {
    issues(first: 100, orderBy: { field: UPDATED_AT, direction: DESC },
           filterBy: { assignee: $who, since: $since, states: [OPEN, CLOSED] }) {
      nodes {
        number title state
        timelineItems(itemTypes: [ASSIGNED_EVENT], last: 10) {
          nodes { ... on AssignedEvent { createdAt actor { __typename } assignee { ... on User { login } } } }
        }
      }
    }
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
        `since=${new Date(nowMs - ASSIGNMENT_FRESH_MS).toISOString()}`,
        "-f",
        `query=${ASSIGNMENTS_QUERY}`,
      ]);
      if (!reply) return unknown("cannot read GitHub");
      return judgeAssignmentPath(
        { assignable: can.ok, issues: reply.data.repository.issues.nodes },
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

const issueTitle = (id) => `[fitness] ${id}`;
const blindTitle = (source) => `[fitness] cannot read ${source}`;
const filesIssue = (r) => r.reaches === ISSUE_TO_OWNER;
// Details carry running numbers (minutes ago, a streak), so the compare drops them: a standing
// failure is one state, not a new one every tick. A real-tick replay of the 10-22 outage posted 70
// comments before this. The detail is matched whole, from the label's colon to the full stop the body
// and the comments all put after it, so a cause that narrows (either app still undeployed of the two
// reported) is a change and not a substring of the old one: a leading space alone also matches after
// the comma that joins them.
const shape = (text) => String(text ?? "").replace(/\d+/g, "N");
const said = (text, detail) => {
  const shaped = shape(text);
  const whole = shape(detail);
  return shaped.includes(`:** ${whole}.`) || shaped.includes(`: ${whole}.`);
};
const seen = (issue, detail) => said(issue.body, detail) || said(issue.lastComment, detail);

const assignAction = (number, title, why, detail) => ({
  kind: "assign",
  number,
  title,
  why,
  detail,
});

/** A failure with no open issue: reopen its recent thread if there is one, else open a new one. */
function firstFailureActions(r, closedIssues, nowMs) {
  const closed = reopenable(closedIssues, issueTitle(r.id), nowMs);
  if (!closed) return [{ kind: "open", result: r, assign: assignsAtOnce(r) }];
  const heldByOwner = (closed.assignees ?? []).some((a) => a.login === OWNER);
  const actions = [{ kind: "reopen", number: closed.number, result: r, removeOwner: heldByOwner }];
  // This reopening starts a new failure, and the assignment below is judged on that basis.
  const reopened = closed.botComments && {
    ...closed,
    assignees: [],
    botComments: [
      ...closed.botComments,
      { type: "Bot", body: REOPENED_MARKER, at: new Date(nowMs).toISOString() },
    ],
  };
  const why = reopened && ownerDue(r, reopened, nowMs);
  if (why) actions.push(assignAction(closed.number, issueTitle(r.id), why, r.detail));
  return actions;
}

/** A failure with an open issue. The assignment's comment carries the detail, so one comment says both. */
function standingFailureActions(r, issue, nowMs) {
  const why = ownerDue(r, issue, nowMs);
  if (why) return [assignAction(issue.number, issueTitle(r.id), why, r.detail)];
  return seen(issue, r.detail) ? [] : [{ kind: "comment", number: issue.number, result: r }];
}

/** One issue per source nobody at home could read, on the same order as a failure with no script. */
function blindActions(source, filing, issue, nowMs) {
  const blind = filing.filter((r) => r.reads === source && r.status === "unknown");
  const read = filing.some(
    (r) => r.reads === source && (r.status === "pass" || r.status === "fail"),
  );
  const credential = blind.some((r) => r.credential);
  if (blind.length && !issue) {
    return [{ kind: "open-blind", source, results: blind, assign: credential }];
  }
  if (blind.length) {
    const why = ownerDue({ rung: credential ? "owner" : "wait" }, issue, nowMs);
    return why
      ? [assignAction(issue.number, blindTitle(source), why, `cannot read ${source}`)]
      : [];
  }
  return read && issue ? [{ kind: "close-blind", number: issue.number, source }] : [];
}

/**
 * What the issues should do, given results and the open fitness issues. Pure. A failure opens one
 * issue, reopening a thread closed in the last 14 days rather than starting another, and comments
 * only when its cause changed, so a standing failure does not pile up comments. The owner is
 * assigned when its rung says so (scripts/fitness-rungs.mjs), and that assignment is the one comment
 * for moving up. A pass closes the issue. Unknown, quiet and not-here touch a contract's own issue
 * not at all: they prove neither health nor failure. Instead, a source nobody at home could read
 * gets one issue, closed once any contract reads it again. Only a contract whose `reaches` is an
 * issue takes part.
 *
 * `botComments` on a thread are its comments in the REST shape's fields, or undefined when they
 * could not be read, which holds the assignment for a tick that can.
 */
export function reportActions(results, openIssues, { nowMs = Date.now(), closedIssues = [] } = {}) {
  const actions = [];
  const find = (title) => openIssues.find((i) => i.title === title);
  const filing = results.filter(filesIssue);
  for (const r of filing) {
    const issue = find(issueTitle(r.id));
    if (r.status === "fail" && !issue) {
      actions.push(...firstFailureActions(r, closedIssues, nowMs));
    } else if (r.status === "fail") {
      actions.push(...standingFailureActions(r, issue, nowMs));
    } else if (r.status === "pass" && issue)
      actions.push({ kind: "close", number: issue.number, result: r });
    for (const number of r.reassign ?? []) actions.push({ kind: "reassign", number });
  }
  for (const source of new Set(filing.map((r) => r.reads))) {
    actions.push(...blindActions(source, filing, find(blindTitle(source)), nowMs));
  }
  return actions;
}

function issueBody(r) {
  return [
    `**This must stay true:** ${r.mustBeTrue}.`,
    `**What failed:** ${r.detail}.`,
    `**What fixes it:** ${r.corrector ?? "nothing automatic yet"} (budget: ${r.budget}).`,
    `**What happens next:** ${whatHappensNext(r)}`,
    ...(r.gap ? [`**What this cannot see:** ${r.gap}.`] : []),
    "",
    "This issue closes itself once the check passes, and reopens if it fails again within 14 days. Contract: `scripts/fitness.mjs`.",
    ...(assignsAtOnce(r) ? ["", ASSIGNED_MARKER] : []),
  ].join("\n");
}

function blindBody(source, results) {
  const credential = results.some((r) => r.credential);
  return [
    `**These checks are blind:** ${results.map((r) => r.id).join(", ")} cannot read ${source}.`,
    `**What the probes said:** ${[...new Set(results.map((r) => r.detail))].join(" · ")}.`,
    `**Who hears:** ${whoHearsBlind(credential)} This issue's age is how long the checks have been blind.`,
    "",
    `This issue closes itself once ${source} can be read again. Contract: \`scripts/fitness.mjs\`.`,
    ...(credential ? ["", ASSIGNED_MARKER] : []),
  ].join("\n");
}

// The REST route the assignment lane uses, so the write is the one already on record under a bot.
const ownerOn = (method, number) => [
  "api",
  "--method",
  method,
  `repos/{owner}/{repo}/issues/${number}/assignees`,
  "-f",
  `assignees[]=${OWNER}`,
];
const addOwner = (number) => ownerOn("POST", number);
const removeOwner = (number) => ownerOn("DELETE", number);

/**
 * The gh commands one action needs, run in order and stopping at the first refusal, and the name the
 * log prints. The order carries meaning. An assignment comes before the comment marking it made, so
 * a refused assignment leaves no marker and the next tick tries again. The owner comes off before a
 * reopen, because reopening mails an assignee and this failure has not reached that rung yet.
 */
function ghWrites(a) {
  switch (a.kind) {
    case "open":
      return {
        name: issueTitle(a.result.id),
        commands: [
          [
            "issue",
            "create",
            "--title",
            issueTitle(a.result.id),
            "--label",
            "bug",
            ...(a.assign ? ["--assignee", OWNER] : []),
            "--body",
            issueBody(a.result),
          ],
        ],
      };
    case "reopen":
      return {
        name: issueTitle(a.result.id),
        commands: [
          ...(a.removeOwner ? [removeOwner(a.number)] : []),
          [
            "issue",
            "reopen",
            String(a.number),
            "--comment",
            `${REOPEN_LINE} What failed: ${a.result.detail}.\n\n${REOPENED_MARKER}`,
          ],
        ],
      };
    case "assign":
      return {
        name: a.title,
        commands: [
          addOwner(a.number),
          [
            "issue",
            "comment",
            String(a.number),
            "--body",
            `Assigned to the owner: ${a.why}. Still failing: ${a.detail}.\n\n${ASSIGNED_MARKER}`,
          ],
        ],
      };
    case "reassign":
      // He already holds it, so a plain add changes nothing and sends nothing: off first, then on.
      return {
        name: `#${a.number}`,
        commands: [
          removeOwner(a.number),
          addOwner(a.number),
          [
            "issue",
            "comment",
            String(a.number),
            "--body",
            `Re-assigned under the bot: an assignment made under the owner's own login sends no notice.\n\n${ASSIGNED_MARKER}`,
          ],
        ],
      };
    case "comment":
      return {
        name: issueTitle(a.result.id),
        commands: [
          [
            "issue",
            "comment",
            String(a.number),
            "--body",
            `Still failing, and it changed: ${a.result.detail}.`,
          ],
        ],
      };
    case "close":
      return {
        name: issueTitle(a.result.id),
        commands: [
          ["issue", "close", String(a.number), "--comment", `Passing again: ${a.result.detail}.`],
        ],
      };
    case "open-blind":
      return {
        name: blindTitle(a.source),
        commands: [
          [
            "issue",
            "create",
            "--title",
            blindTitle(a.source),
            "--label",
            "bug",
            ...(a.assign ? ["--assignee", OWNER] : []),
            "--body",
            blindBody(a.source, a.results),
          ],
        ],
      };
    case "close-blind":
      return {
        name: blindTitle(a.source),
        commands: [
          ["issue", "close", String(a.number), "--comment", `${a.source} can be read again.`],
        ],
      };
    default:
      throw new Error(`no gh command for ${a.kind}`);
  }
}

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

export { HOMES };
