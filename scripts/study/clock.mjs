// THE MEMBER'S CLOCK (#5009) — the timezone and locale a study world's page runs in. Specced in
// tests/scripts/study-clock.spec.ts.
//
// WHY: the page formats some times itself, in the browser's zone and language (an order's stamp on
// the activity ledger). The first worlds ran every member on New York's clock, a zone the owner does
// not keep, so their screens showed times his own phone never would; and an answer region is text
// on screen, so the facts sheet, the census and the session must read the page on ONE clock or a
// right answer fails (first full round, 2026-10-09: nine regions the page never printed). So a
// world runs on the member's own clock, declared once in their member file, and every tool that
// renders or describes the page takes that same clock. (A time the SERVER formats — the league
// feed's "Oct 1, 19:30", in UTC — is the app's own and reads the same on any clock.)
//
// WHERE IT IS DECLARED: a line in §2 of `docs/members/<member>.md` (the fixture section, which
// never enters a member card):
//
//     - Clock: **America/Chicago** · en-US — …
//
// A member whose file declares none keeps the owner's — the file titled "# <name> — the owner".
// DEFAULT_CLOCK is the owner's, for a tool run by hand without `--clock`; a spec holds it to the
// owner's file.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sections } from "./packets.mjs";

/** The owner's clock (their member file's §2), for a tool run without `--clock`. */
export const DEFAULT_CLOCK = Object.freeze({ timeZone: "America/Chicago", locale: "en-US" });

/** The owner's member name: the one file in `membersDir` whose title says "— the owner". */
export function ownerOf(membersDir) {
  const owners = readdirSync(membersDir)
    .filter((f) => f.endsWith(".md"))
    .filter((f) => /^# .+ — the owner\s*$/m.test(readFileSync(join(membersDir, f), "utf8")))
    .map((f) => f.slice(0, -3));
  if (owners.length !== 1) {
    throw new Error(`clock: ${membersDir} names ${owners.length} owners (want one "— the owner")`);
  }
  return owners[0];
}

const LINE =
  /^\s*-\s*Clock:\s*\*\*([A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+)\*\*\s*·\s*([a-z]{2,3}(?:-[A-Z]{2})?)\b/m;

/** True when the runtime knows `timeZone` and `locale`. */
function valid({ timeZone, locale }) {
  try {
    new Intl.DateTimeFormat(locale, { timeZone }).format(0);
    return Intl.DateTimeFormat.supportedLocalesOf([locale]).length === 1;
  } catch {
    return false;
  }
}

/** The clock a member file's §2 declares, or null when it declares none. Throws on a bad zone. */
export function declaredClock(markdown) {
  const m = LINE.exec(sections(markdown)["2"] ?? "");
  if (!m) return null;
  const clock = { timeZone: m[1], locale: m[2] };
  if (!valid(clock)) throw new Error(`clock: ${m[1]} · ${m[2]} is not a known zone and locale`);
  return clock;
}

/** `--clock America/Chicago,en-US` (the locale may be left off: en-US) → a clock. */
export function parseClock(text) {
  if (text === undefined) return DEFAULT_CLOCK;
  const [timeZone, locale = "en-US"] = String(text)
    .split(",")
    .map((s) => s.trim());
  const clock = { timeZone, locale };
  if (!(timeZone && valid(clock))) throw new Error(`--clock ${text}: not a known zone and locale`);
  return clock;
}

/** The `--clock` value for a clock. */
export const clockArg = (clock) => `${clock.timeZone},${clock.locale}`;

/** One member's clock: their own file's, else the owner's. */
export function memberClock(member, membersDir) {
  const read = (who) => declaredClock(readFileSync(join(membersDir, `${who}.md`), "utf8"));
  const own = read(member);
  if (own) return own;
  const who = ownerOf(membersDir);
  const owner = read(who);
  if (!owner)
    throw new Error(`clock: ${who}.md (the owner) declares no clock, so ${member} has none`);
  return owner;
}

/**
 * The one clock a round runs on. The census, the facts sheet and every session must read the page
 * on the same clock — an answer region is text on screen — so members who keep different clocks
 * cannot share a round; that is refused, naming them, never averaged.
 */
export function roundClock(members, membersDir) {
  const each = [...new Set(members)].map((m) => ({ m, clock: memberClock(m, membersDir) }));
  const kinds = [...new Set(each.map((e) => clockArg(e.clock)))];
  if (kinds.length > 1) {
    const who = each.map((e) => `${e.m} ${clockArg(e.clock)}`).join(" · ");
    throw new Error(`clock: one round reads the page on one clock, and these differ — ${who}`);
  }
  return each[0]?.clock ?? DEFAULT_CLOCK;
}
