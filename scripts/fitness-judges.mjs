// The pure half of scripts/fitness.mjs: the verdicts and the judges that read what a probe brought back
// (#6470). No reads, no writes, no spawns, so each judge is tested with a plain value and a clock.
// Split out of fitness.mjs, which probes and reports; fitness.mjs re-exports every judge, so callers
// and specs import from it as before. A contract's words live here and nowhere else, because an
// issue carries only a contract's own words.
import { OWNER } from "./fitness-rungs.mjs";

export const STAMP_FRESH_MS = 5 * 60_000;
// A push lags for the minutes its own deploy takes. Judged with no grace, healthy 10-15 to 10-22
// read red at 65 of 729 ticks; 20 minutes clears them all (#6470 study).
const DEPLOY_GRACE_MS = 20 * 60_000;
// How far ahead of this tick's clock a lag can be dated and still be aged as just begun. A tick takes
// its clock before any probe runs, so a merge landing during the tick is dated after it, and GitHub's
// clock and a runner's differ by seconds. Further ahead is a clock that cannot be trusted.
const CLOCK_LEAD_MS = 5 * 60_000;
// What src/adapters/email-alert-delivery.ts needs. Read as names, never values. The boot line said the
// same thing, but it aged out of the log buffer within hours and the contract went blind.
const ALERT_SECRETS = ["SKYNET_ALERT_EMAIL_API_KEY", "SKYNET_ALERT_EMAIL_FROM"];

// A bot is judged over its last five sessions placing paper orders, and only while the newest of
// them is recent: a bot the house moved to watching last month is not silent today.
const SILENT_SESSIONS = 5;
const SILENT_RECENT_MS = 10 * 24 * 60 * 60_000;
// How recent a bot's assignment must be for the assignment path to count as used. A longer quiet
// costs one test email, which is the drill: the failure's own issue is the fresh assignment.
export const ASSIGNMENT_FRESH_MS = 30 * 24 * 60 * 60_000;

export const pass = (detail) => ({ status: "pass", detail });
export const fail = (detail) => ({ status: "fail", detail });
export const unknown = (detail) => ({ status: "unknown", detail });
export const quiet = (detail) => ({ status: "quiet", detail });
export const notHere = (home, here) => ({
  status: "not-here",
  detail: `runs in the ${home}, and this is the ${here}`,
});

// The transient states Fly lists that a rolling deploy moves the machine through on its way back to
// started (fly.io/docs/machines/machine-states). On 11-02 a tick read one mid-deploy, the start
// script left it alone as it does any state but stopped, and the report opened #6686 promising a
// start that script never makes (#6700). Fly calls a machine wedged past 5 to 10 minutes in these, so
// the deploy grace above covers a healthy deploy with room and still catches a wedged one.
const DEPLOY_TRANSIT = new Set(["replacing", "updating", "stopping", "starting"]);
// What fixes a machine wedged mid-change. The start script acts on stopped only, and a stop is
// state-destroying, so it stays a person's act and never a probe's.
const WEDGED = {
  corrector:
    "nothing automatic: stopping the machine, Fly's own step for one wedged mid-change, hands it to scripts/bots-start-stopped.sh, which starts it on the next tick",
  budget: "none: the start script acts only on a stopped machine, and a stop is a person's call",
  rung: "wait",
  attempts: undefined,
};

/**
 * When the machine entered the state it is in: the newest event Fly recorded with that status, else
 * the machine's own updated_at. NaN when neither can be read.
 */
function enteredStateAt(machine) {
  const stamps = (machine.events ?? [])
    .filter((e) => e.status === machine.state && Number.isFinite(e.timestamp))
    .map((e) => e.timestamp);
  return stamps.length ? Math.max(...stamps) : Date.parse(machine.updated_at ?? "");
}

/**
 * Judge the primary bots machine. A marked stop is a person's decision, so it passes. A state a
 * deploy passes through reads quiet for the deploy grace, then fails with the fix that acts on it;
 * one that cannot be dated, or is dated past the clock lead, cannot be shown young, so it fails.
 */
export function judgeMachine(machines, nowMs = Date.now()) {
  const primary = machines.find((m) => (m.config?.standbys ?? []).length === 0);
  if (!primary) return fail("no primary machine");
  if (primary.config?.metadata?.["skynet-halt"]) {
    return pass(`deliberately halted: ${primary.config.metadata["skynet-halt"]}`);
  }
  if (primary.state === "started") return pass("started");
  if (!DEPLOY_TRANSIT.has(primary.state)) return fail(`machine is ${primary.state}`);
  const graceMin = DEPLOY_GRACE_MS / 60_000;
  const inStateMs = nowMs - enteredStateAt(primary);
  if (inStateMs >= -CLOCK_LEAD_MS && inStateMs <= DEPLOY_GRACE_MS) {
    return quiet(`machine is ${primary.state}, inside the ${graceMin} min deploy grace`);
  }
  // No minutes in the words: a standing failure comments only when its detail changes.
  const why =
    inStateMs > DEPLOY_GRACE_MS
      ? `past the ${graceMin} min deploy grace`
      : "and when it began cannot be dated";
  return { ...fail(`machine is ${primary.state} ${why}`), ...WEDGED };
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
export function outsideSession(nowMs, rule) {
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
 * `threads` are the `[fitness]` threads updated in the window whoever holds them: a bot's assignment
 * on one he has since left still proves the path, and only that (#6701). Leaving is his answer, so a
 * left thread is never judged self-assigned or re-assigned.
 *
 * A person's own assignment does not count, and on an open fitness issue it fails, because that
 * issue's one notice never went out (#6501). report() re-assigns it under the bot, so that verdict
 * starts on the script rung rather than mailing him twice. Other work he took himself is his business.
 */
export function judgeAssignmentPath({ assignable, issues, threads = [] }, nowMs) {
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
    ...[...issues, ...threads]
      .flatMap(toOwner)
      .filter(byBot)
      .map((event) => Date.parse(event.createdAt)),
  );
  const ageMs = nowMs - newestMs;
  return ageMs <= ASSIGNMENT_FRESH_MS
    ? pass(`a bot assigned the owner ${Math.floor(ageMs / 86_400_000)} days ago`)
    : fail("no bot has assigned the owner in the last 30 days, so this issue is the test");
}
