/**
 * ONE CARD PER PLAYBOOK (#5073, R2 slice 1 of #5037's playbooks round). The Heartbeat section drew
 * the same playbooks twice — the roll call (can it fire?) and the verdict table (what did it
 * conclude?) — so HC-SAURON could read "⊘ Can't fire" in one list and "trading on live signals" in
 * the other. Both lists already arrive in one `/heartbeat` payload; this is the pure join that
 * turns them into one card each, with one state word, and the counted line that heads them.
 *
 * ONE STATE WORD PER CARD, the first that applies: can't fire → paused → off → starts next pass →
 * the verdict. Off playbooks are not cards: they are named once in the section's footer, so a
 * house playbook nobody switched on is still said out loud without padding the list.
 *
 * Every state is a glyph and a word, never hue alone (`docs/BRAND.md` → Accessibility), and every
 * glyph on the counted line is its own.
 */

import {
  entryDateText,
  type Heartbeat,
  type PlaybookHeartbeat,
  type PlaybookVerdictState,
  ROLL_CALL_WORDS,
  type RollCallLine,
} from "./heartbeat";

/** A card's one state: the roll call's when it wins, else the playbook's verdict. "armed" is a
 *  roll-call line that is on with no verdict beside it — the server never sends one, but a card
 *  must still say something true if it ever does. */
export type CardState = "blocked" | "paused" | "starting" | "armed" | PlaybookVerdictState;

export interface PlaybookCard {
  /** Stable across refetches: the playbook's id, or the verdict's slot when the id is withheld. */
  readonly key: string;
  /** Absent on a bot the viewer does not own (#885) — the card reads by its state alone. */
  readonly playbookId?: string;
  readonly state: CardState;
  readonly mode?: string;
  /** The verdict this card's state was read from, when there is one — carries `since`. */
  readonly verdict?: PlaybookHeartbeat;
  /** The roll call's own sentence. Absent for a non-owner, who gets no roll call. */
  readonly reason?: string;
  /** `YYYY-MM-DD` its own rule would next open a position. */
  readonly nextEntry?: string;
}

export interface CountedState {
  readonly state: CardState;
  readonly count: number;
}

export interface BotPlaybooks {
  /** In the counted line's order; waiting ones by soonest window. */
  readonly cards: readonly PlaybookCard[];
  /** House playbooks nobody switched on for this bot, for the footer. */
  readonly off: readonly RollCallLine[];
  readonly counts: readonly CountedState[];
}

/** The counted line's order, which the cards follow: what is acting now first, then what is
 *  waiting, then what cannot act at all. */
const ORDER: readonly CardState[] = [
  "tactical",
  "long",
  "flat",
  "no-window",
  "starting",
  "armed",
  "paused",
  "blocked",
];

/** A glyph, the card's word, and the counted line's words for `n` of them. ◷ is new with this
 *  card (#5037 round 2): "waiting for its window" had no mark of its own. "Wants to hold" takes a
 *  bar and "wants out" an arrow, so neither borrows ▲/▼, which the lanes keep for bought and sold. */
export const CARD_WORDS: Record<
  CardState,
  { readonly glyph: string; readonly word: string; readonly counted: (n: number) => string }
> = {
  tactical: {
    glyph: "●",
    word: "Trading on live signals",
    counted: () => "trading on live signals",
  },
  long: {
    glyph: "▬",
    word: "Wants to hold",
    counted: (n) => `${n === 1 ? "wants" : "want"} to hold`,
  },
  flat: { glyph: "↓", word: "Wants out", counted: (n) => `${n === 1 ? "wants" : "want"} out` },
  "no-window": {
    glyph: "◷",
    word: "Waiting for its window",
    counted: () => "waiting for a window",
  },
  starting: {
    glyph: ROLL_CALL_WORDS.starting.glyph,
    word: ROLL_CALL_WORDS.starting.word,
    counted: (n) => `${n === 1 ? "starts" : "start"} next pass`,
  },
  armed: { glyph: "◉", word: ROLL_CALL_WORDS.armed.word, counted: () => "on" },
  paused: { glyph: ROLL_CALL_WORDS.paused.glyph, word: "Paused", counted: () => "paused" },
  blocked: {
    glyph: ROLL_CALL_WORDS.blocked.glyph,
    word: "Can't fire",
    counted: () => "can't fire",
  },
};

function cardFromLine(line: RollCallLine, verdict: PlaybookHeartbeat | undefined): PlaybookCard {
  // can't fire → paused → starts next pass win over the verdict; an armed line takes the verdict.
  const state: CardState =
    line.status === "blocked" || line.status === "paused" || line.status === "starting"
      ? line.status
      : (verdict?.state ?? "armed");
  const mode = line.mode ?? verdict?.mode;
  return {
    key: line.playbookId,
    playbookId: line.playbookId,
    state,
    ...(mode ? { mode } : {}),
    ...(verdict ? { verdict } : {}),
    reason: line.reason,
    ...(line.nextEntry ? { nextEntry: line.nextEntry } : {}),
  };
}

function cardFromVerdict(verdict: PlaybookHeartbeat, slot: number, named: boolean): PlaybookCard {
  return {
    key: named && verdict.playbookId ? verdict.playbookId : `slot-${slot}:${verdict.mode}`,
    ...(named && verdict.playbookId ? { playbookId: verdict.playbookId } : {}),
    state: verdict.state,
    mode: verdict.mode,
    verdict,
  };
}

/** Sort key for one card: its state's place on the counted line, then — for waiting ones — the
 *  soonest window first, an undated one last. Ties keep the server's own order. */
function rank(card: PlaybookCard): [number, string] {
  return [ORDER.indexOf(card.state), card.state === "no-window" ? (card.nextEntry ?? "~") : ""];
}

/**
 * The join. `named` false (a bot the viewer does not own) ignores any roll call and any id that
 * reached the client anyway — the server withholds both (`desk-owner-gate.ts`), and this keeps
 * the page from drawing them if it ever did not.
 */
export function botPlaybooks(heartbeat: Heartbeat, named = true): BotPlaybooks {
  const verdicts = heartbeat.playbooks ?? [];
  const lines = named ? (heartbeat.rollCall ?? []) : [];
  const used = new Set<PlaybookHeartbeat>();
  const cards: PlaybookCard[] = [];
  const off: RollCallLine[] = [];
  for (const line of lines) {
    if (line.status === "off") {
      off.push(line);
      continue;
    }
    const verdict = verdicts.find((v) => !used.has(v) && v.playbookId === line.playbookId);
    if (verdict) used.add(verdict);
    cards.push(cardFromLine(line, verdict));
  }
  // A verdict the roll call did not name — every one, for a non-owner — is a card of its own.
  verdicts.forEach((verdict, slot) => {
    if (!used.has(verdict)) cards.push(cardFromVerdict(verdict, slot, named));
  });
  const sorted = cards
    .map((card, i) => ({ card, i }))
    .sort((a, b) => {
      const [sa, da] = rank(a.card);
      const [sb, db] = rank(b.card);
      // Code-unit order, not localeCompare: a collation sorts "~" (undated) before the digits.
      return sa - sb || (da < db ? -1 : da > db ? 1 : 0) || a.i - b.i;
    })
    .map(({ card }) => card);
  const counts = ORDER.flatMap((state) => {
    const count = sorted.filter((c) => c.state === state).length;
    return count > 0 ? [{ state, count }] : [];
  });
  return { cards: sorted, off, counts };
}

/** The roll call wrote its sentences beside an "On" that the card's own word now says, so a
 *  leading "On, …" clause is dropped and a "Paused: …" one too. A sentence that starts any other
 *  way is shown as the server wrote it. */
export function plainReason(reason: string): string {
  const trimmed = reason
    .replace(/^Paused:\s*/, "")
    .replace(/^On(?:,| and)\s+(?:and |but |with (?=no ))?/, "")
    // A calendar day reads as the card's own dates do ("Nov 18"), and an issue number written for
    // the code's readers is not the member's to parse.
    .replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (_, day: string) => entryDateText(day))
    .replace(/\s*\(#\d+\)/g, "");
  return capitalised(trimmed);
}

function capitalised(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Splits a reason at its first dash or full stop: what a closed card has room for, and the rest
 *  of the sentence the card opens to — said once, never the first clause twice. */
function splitClause(text: string): { readonly head: string; readonly rest?: string } {
  const cuts = [text.indexOf(" — "), text.indexOf(". ")].filter((i) => i > 0);
  if (cuts.length === 0) return { head: text.replace(/\.$/, "") };
  const cut = Math.min(...cuts);
  const rest = text
    .slice(cut)
    .replace(/^\s*(?:—|\.)\s*/, "")
    .trim();
  return { head: text.slice(0, cut), ...(rest ? { rest: capitalised(rest) } : {}) };
}

/**
 * What a card says closed (`short`), and what it adds when opened (`more`). A day its own rule
 * would next open a position leads, and the whole reason waits behind it; otherwise the reason's
 * first clause leads and the rest of that sentence waits. A non-owner has no reason to read, so
 * the card falls back to its mode and how long it has held its verdict.
 */
export function cardFact(card: PlaybookCard): { readonly short?: string; readonly more?: string } {
  const full = card.reason ? plainReason(card.reason) : undefined;
  if (card.nextEntry) {
    return { short: `Opens ${entryDateText(card.nextEntry)}`, ...(full ? { more: full } : {}) };
  }
  if (!full) return {};
  const { head, rest } = splitClause(full);
  return { short: head, ...(rest ? { more: rest } : {}) };
}

/** "1 playbook" / "7 playbooks" — the head line's link and the strip's join sentence. */
export function playbooksCount(n: number): string {
  return `${n} playbook${n === 1 ? "" : "s"}`;
}
