import type { FastTrackEvent } from "../domain/fast-track.js";
import type { MarketEvent } from "../domain/market-events.js";
import { readLedger } from "./ledger-stance.js";
import { horizonRowsOf } from "./research-event-calls.js";

/**
 * WHAT A RESEARCH LEDGER GIVES A FAST TRACK'S CARDS (#7034 slice 1): the house's written stance for
 * the event list, and the kill switches the "What would prove you wrong?" card offers. Pure markdown
 * reading over the ledger contract (`docs/research/events/TEMPLATE.md` → *Stance & kill switches*);
 * the engine (`src/domain/fast-track.ts`) never reads a file.
 *
 * A KILL SWITCH WHOSE DAY HAS PASSED IS NO ANSWER. Ledgers keep every switch they ever wrote, and
 * most are dated ("a notice before 2026-10-21"); offering one whose every date is behind us would
 * hand the member a falsifier that can no longer fire. So a switch with dates, all of them past, is
 * dropped; an undated one stays. A ledger without a `**Kill switches:**` list (57 of 743 on
 * 2026-11-07) falls back to its horizon table's "Proves it wrong" cells, under the same rule.
 */

const KILL_HEADER = /^\*\*Kill switches[^*\n]*\*\*\s*$/m;
const BULLET = /^(?:[-*]|\d+\.)\s+/;
const ISO_DAY = /\b\d{4}-\d{2}-\d{2}\b/g;
/** A switch's own authoring stamp — "(new, 2026-08-31)" — is when it was written, not when it fires. */
const STAMP = /\((?:new|added|updated|revised)\b[^)]*\)/gi;

/** Markup stripped, the ledger's words kept: links to their text, emphasis and code marks gone. */
function plainText(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|__|`/g, "")
    .replace(/(^|\s)\*([^*]+)\*(?=[\s:,.)]|$)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

/** The bullets under the `**Kill switches:**` line, each joined onto one line, in order. */
export function killSwitchBullets(md: string): string[] {
  const at = KILL_HEADER.exec(md);
  if (!at) return [];
  const bullets: string[] = [];
  let current: string[] | undefined;
  for (const line of md.slice(at.index + at[0].length).split("\n")) {
    if (BULLET.test(line)) {
      current = [line.replace(BULLET, "")];
      bullets.push("");
    } else if (current && /^\s+\S/.test(line)) {
      current.push(line.trim());
    } else if (line.trim() === "") {
      continue;
    } else {
      break;
    }
    bullets[bullets.length - 1] = current.join(" ");
  }
  return bullets.map(plainText).filter(Boolean);
}

/** True while the switch can still fire on `asOf`: undated, or naming a day not yet past. */
export function stillLive(text: string, asOf: string): boolean {
  const days = text.replace(STAMP, "").match(ISO_DAY) ?? [];
  const today = asOf.slice(0, 10);
  return days.length === 0 || days.some((d) => d >= today);
}

/** The ledger's live kill switches, the list first, the horizon table only when there is none. */
export function liveKillSwitches(md: string, asOf: string): string[] {
  const listed = killSwitchBullets(md);
  const source =
    listed.length > 0
      ? listed
      : Object.values(horizonRowsOf(md))
          .map((row) => plainText(row.provesWrong))
          .filter((text) => /[a-z]/i.test(text));
  return [...new Set(source)].filter((text) => stillLive(text, asOf));
}

/** One calendar event with what its ledger says, or with nothing when it has no ledger yet. */
export function fastTrackEventOf(
  event: MarketEvent,
  ledger: string | undefined,
  asOf: string,
): FastTrackEvent {
  if (ledger === undefined) return { event, killSwitches: [] };
  const { stance } = readLedger(ledger, event.symbols[0] ?? "");
  return {
    event,
    ...(stance ? { stance } : {}),
    killSwitches: liveKillSwitches(ledger, asOf),
  };
}
