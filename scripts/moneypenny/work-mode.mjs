// THE WORK SPIGOT'S READER (#3960 slice 1 — the carrier and the reader; no lane reads it yet).
//
// One dial, four positions, carried as exactly one `work-mode:<position>` label on tracking issue
// #4153: `halt` (dispatch nothing), `conserve` (caps drop), `normal` (today's numbers), `surge`
// (raised caps). The per-position numbers live in work-mode.json; the STATE lives on the issue.
// Modeled on the spend breaker (circuit-breaker.mjs) and copying its doctrine outright:
//   - the config file is loaded fail-closed — a missing or malformed file throws, never reads as
//     "no limit";
//   - state is an issue label, never a committed file (#915): a flip takes effect with no PR;
//   - `exec` is injectable, so specs fake `gh` and never touch the network.
//
// Where it DIFFERS from the breaker, deliberately: an unreadable STATE does not throw. The breaker
// guards one lane and refusing is its only safe answer; this dial is read by every lane, and
// #3960 criterion 5 settles the safe answer as "behave as conserve and warn" — throttled, not
// stopped, so a GitHub blip cannot halt the whole repo. A broken CONFIG still throws: without it
// there are no conserve numbers to fall back to, and refusing to dispatch is the honest reading.
//
// DECISIONS (slice 1, recorded so slices 2–3 don't re-litigate them):
//   - Zero, two or more, or an unknown `work-mode:*` label → `conserve` + a warning (criterion 5).
//   - Every non-normal position expires. The expiry is the NEWEST issue comment carrying
//     `until <YYYY-MM-DD>` (case-insensitive, backticks allowed). It is inclusive through the end
//     of that day in UTC; after that the lanes read `normal` (criterion 4).
//   - A non-normal position with NO expiry comment splits by direction: `halt` stays `halt` — a
//     brake never silently releases — while `conserve`/`surge` read `normal` with a warning, so a
//     forgotten throttle cannot starve the repo and a forgotten surge cannot keep spending.
//   - `normal` ignores comments entirely.
//   - Who may turn the dial (#3960, Eric 2026-09-30, "option C, tightened") is ACTOR_RULES below.
//     Nothing enforces it yet; the lanes call `mayActorSet` in slice 3. It lives here so it is
//     specced once.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CONFIG_FILE = join(process.cwd(), "work-mode.json");

/** The four positions, in order of how much work they let through. */
export const POSITIONS = ["halt", "conserve", "normal", "surge"];

/** The per-position numbers every position must carry. */
const CAP_KEYS = ["inFlightCap", "researchPerTick"];

const refuse = (file, what) => {
  throw new Error(
    `moneypenny: ${file} ${what} Refusing to run with no work-mode caps — see #3960.`,
  );
};

/** Every position must carry every cap as a non-negative integer. */
function readCaps(file, positions) {
  const caps = {};
  for (const pos of POSITIONS) {
    caps[pos] = {};
    for (const key of CAP_KEYS) {
      const n = positions[pos]?.[key];
      if (!(Number.isInteger(n) && n >= 0))
        refuse(
          file,
          `positions.${pos}.${key} must be a non-negative integer, got ${JSON.stringify(n)}.`,
        );
      caps[pos][key] = n;
    }
  }
  return caps;
}

/** halt is zero, and no position lets more through than the one above it. */
function checkOrdering(file, caps) {
  for (const key of CAP_KEYS) {
    if (caps.halt[key] !== 0) refuse(file, `positions.halt.${key} must be 0 — halt means halt.`);
    for (let i = 1; i < POSITIONS.length; i++) {
      const [lo, hi] = [POSITIONS[i - 1], POSITIONS[i]];
      if (caps[lo][key] > caps[hi][key])
        refuse(
          file,
          `positions.${lo}.${key} (${caps[lo][key]}) exceeds ${hi}'s (${caps[hi][key]}).`,
        );
    }
  }
}

/** Fail-closed read of work-mode.json, same doctrine as loadBreakerConfig: a missing or malformed
 *  file must never read as "no spigot". Also refuses numbers that contradict the positions' own
 *  meaning — a `halt` that dispatches, or a `conserve` looser than `normal` — because a typo there
 *  would silently turn the brake into an accelerator. */
export function loadWorkModeConfig(file = CONFIG_FILE) {
  if (!existsSync(file))
    throw new Error(
      `moneypenny: work-mode config missing at ${file}. Refusing to run with no work-mode caps — ` +
        "see #3960. Restore the file rather than removing the spigot.",
    );
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    refuse(file, "is not valid JSON.");
  }
  const { trackingIssue, labelPrefix, positions } = cfg ?? {};
  if (!(Number.isInteger(trackingIssue) && trackingIssue > 0))
    refuse(file, `trackingIssue must be a positive integer, got ${JSON.stringify(trackingIssue)}.`);
  if (!(typeof labelPrefix === "string" && labelPrefix.length > 0))
    refuse(file, `labelPrefix must be a non-empty string, got ${JSON.stringify(labelPrefix)}.`);
  if (!(positions && typeof positions === "object"))
    refuse(file, "positions must be an object keyed by halt/conserve/normal/surge.");
  const caps = readCaps(file, positions);
  checkOrdering(file, caps);
  return { trackingIssue, labelPrefix, positions: caps };
}

const UNTIL = /\buntil\s+`?(\d{4})-(\d{2})-(\d{2})`?/i;

/** The first instant AFTER the expiry day, in UTC ms — or null when the text carries no real date.
 *  Round-tripped through Date.UTC so `2026-02-31` is rejected rather than rolled into March. */
function expiryEnd(body) {
  const m = UNTIL.exec(body ?? "");
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const start = new Date(Date.UTC(y, mo, d));
  if (start.getUTCFullYear() !== y || start.getUTCMonth() !== mo || start.getUTCDate() !== d)
    return null;
  return { until: `${m[1]}-${m[2]}-${m[3]}`, endMs: Date.UTC(y, mo, d + 1) };
}

/** The newest comment's valid `until <date>`, or null. Sorted by `createdAt` when present
 *  (gh returns oldest-first, but the rule should not depend on that); array order otherwise. */
function newestExpiry(comments = []) {
  const ordered = (comments ?? [])
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      const [ta, tb] = [Date.parse(a.c?.createdAt ?? ""), Date.parse(b.c?.createdAt ?? "")];
      return Number.isNaN(ta) || Number.isNaN(tb) || ta === tb ? a.i - b.i : ta - tb;
    });
  for (let k = ordered.length - 1; k >= 0; k--) {
    const hit = expiryEnd(ordered[k].c?.body);
    if (hit) return hit;
  }
  return null;
}

const nameOf = (l) => (typeof l === "string" ? l : l?.name);

/**
 * Pure: turn an issue's labels and comments into the position every lane should act on.
 * Returns `{ position, until, caps, reason, warning? }` — `until` is the ISO date the position
 * holds through (null for `normal` and an unexpiring `halt`), `caps` the numbers from the config.
 */
export function resolveWorkMode({ labels = [], comments = [], now = Date.now(), config }) {
  const { labelPrefix, positions } = config;
  const settle = (position, reason, extra = {}) => ({
    position,
    until: null,
    caps: { ...positions[position] },
    reason,
    ...extra,
  });

  const dial = (labels ?? []).map(nameOf).filter((n) => n?.startsWith(labelPrefix));
  if (dial.length !== 1) {
    const what = dial.length === 0 ? "no" : `${dial.length} (${dial.join(", ")})`;
    const warning = `work-mode: ${what} ${labelPrefix}* labels on the tracking issue — acting as conserve until exactly one is set`;
    return settle("conserve", "fail-closed: the dial is not set to exactly one position", {
      warning,
    });
  }
  const position = dial[0].slice(labelPrefix.length);
  if (!POSITIONS.includes(position)) {
    const warning = `work-mode: unknown position "${dial[0]}" — acting as conserve`;
    return settle("conserve", "fail-closed: unknown position", { warning });
  }
  if (position === "normal") return settle("normal", "set to normal");

  const expiry = newestExpiry(comments);
  if (!expiry) {
    if (position === "halt")
      return settle("halt", "halted with no expiry — stays halted until changed");
    const warning = `work-mode: ${position} has no "until <YYYY-MM-DD>" comment — acting as normal`;
    return settle("normal", `${position} carries no expiry, so it is treated as expired`, {
      warning,
    });
  }
  if (now >= expiry.endMs)
    return settle("normal", `${position} expired at the end of ${expiry.until} (UTC)`);
  return { ...settle(position, `set to ${position} until ${expiry.until}`), until: expiry.until };
}

/** Real `gh` by default; injectable so specs never hit the network (same shape as the breaker's). */
function defaultExec(cmd, args, opts) {
  return execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, ...opts });
}

/** Impure: one `gh issue view` on the tracking issue, then `resolveWorkMode`. Never throws on a
 *  read failure — an unreadable dial is `conserve` plus a warning (criterion 5). A broken CONFIG
 *  does throw, from `loadWorkModeConfig`, per the header. */
export function readWorkMode(exec = defaultExec, config = loadWorkModeConfig(), now = Date.now()) {
  let issue;
  try {
    const out = exec("gh", [
      "issue",
      "view",
      String(config.trackingIssue),
      "--json",
      "labels,comments",
    ]);
    issue = JSON.parse(out);
    if (!issue || typeof issue !== "object") throw new Error("not a JSON object");
  } catch (err) {
    return {
      position: "conserve",
      until: null,
      caps: { ...config.positions.conserve },
      reason: "fail-closed: the tracking issue could not be read",
      warning: `work-mode: could not read issue #${config.trackingIssue} (${err.message}) — acting as conserve`,
    };
  }
  return resolveWorkMode({ labels: issue.labels, comments: issue.comments, now, config });
}

/** Who may turn the dial to each position (#3960, Eric 2026-09-30, "option C, tightened").
 *  `fast-track` is a label on a work issue rather than a position, but its rule is part of the
 *  same decision, so it is specced here too. */
export const ACTOR_RULES = {
  halt: "anyone", // a brake must never wait on one person
  normal: "anyone", // returning to normal is always safe
  "fast-track": "anyone", // lets an urgent bug/CVE build under conserve; never under halt
  conserve: "after-eric-phrase", // docs/COMPUTE.md: conservation is never inferred
  surge: "eric-only", // raising a cap is the spend class
};

/** Pure: may `actor` set `position`? Logins compare case-insensitively, as GitHub's do. */
export function mayActorSet(
  position,
  actor,
  { ericLogin = "ejclark", afterEricPhrase = false } = {},
) {
  const isEric = typeof actor === "string" && actor.toLowerCase() === ericLogin.toLowerCase();
  switch (ACTOR_RULES[position]) {
    case "anyone":
      return true;
    case "after-eric-phrase":
      return isEric || afterEricPhrase === true;
    case "eric-only":
      return isEric;
    default:
      return false;
  }
}

/** The one line every lane prints (#3960 → "Status at a glance"). */
export const noticeLine = (mode) =>
  `::notice::work-mode=${mode.position}${mode.until ? ` (until ${mode.until})` : ""}`;

function main() {
  const mode = readWorkMode();
  console.log(JSON.stringify(mode, null, 2));
  if (mode.warning) console.log(`::warning::${mode.warning}`);
  console.log(noticeLine(mode));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
