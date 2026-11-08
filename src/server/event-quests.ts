import { isTradable } from "../domain/campaigns.js";
import type { MarketEvent } from "../domain/market-events-types.js";
import type { Quest } from "../domain/quest.js";
import { href } from "../options/conditions-quests.js";
import { dayText } from "../options/position-guidance-rules.js";
import { readLedger } from "./ledger-stance.js";

/**
 * QUESTS FROM A MARKET EVENT (#7028 slice 4). A calendar event a campaign links to a symbol
 * (#6949 slice 1) becomes a quest only when the house's written stance on it names a move the order
 * path can draft. The one move a ledger names today is its `- **Buy signal:** yes` bullet — the line
 * position guidance already reads to let the trade form grade a cash-secured put as a way in
 * (`ledger-stance.ts`) — so that is the one move offered: sell a cash-secured put on the event's
 * first tradable symbol. A ledger that says "no", says nothing, or does not exist offers nothing;
 * so does an event naming no symbol (691 of 730 name none). Nothing is read from the web.
 *
 * NO EDGE CLAIMED. No study has measured how a ledger's buy signal pays, so the base rate is
 * "untested" in words and the quest ranks below any tested one (AC 5). The ledger's own falsifier is
 * quoted, never paraphrased, and the put's worst case is named. Copy never says a time is good to buy.
 *
 * WHEN IT STOPS HOLDING. The quest expires on the event's date, or on the ledger's own `**Call:**
 * … until` date when that comes first; both are re-read on every request, so a stance flipped to
 * "no" or a day that has passed simply stops deriving it. An event whose date is only an estimate
 * says so beside the date (docs/process/EVENT-RESEARCH.md → date policy: an estimate may only widen
 * caution).
 *
 * THE BOOK GATE. Cash must cover one contract at the price the ledger was probed at, times 100 —
 * what a put struck at that price would need; the order path checks the real strike at the ticket.
 * A ledger with no recorded price for the symbol cannot be checked, so it offers nothing.
 *
 * PURE: no I/O, no clock — the loader (`event-stances.ts`) reads files and hands them in.
 */

/** One campaign-linked event with its ledger's markdown, as the loader read them. */
export interface EventStance {
  readonly event: MarketEvent;
  /** The ledger at `docs/research/events/<id>.md`, raw. */
  readonly md: string;
  /** Titles of the campaigns that link this event. */
  readonly campaigns: readonly string[];
}

/** Shares a put contract covers. */
const CONTRACT = 100;

const UNTESTED = {
  kind: "untested",
  note: "No study has measured how this ledger's buy signal pays yet. It is the house's written stance, not a tested rate.",
} as const;

function quest(
  deskId: string,
  { event, md, campaigns }: EventStance,
  today: string,
  cash: number,
): Quest | undefined {
  const symbol = event.symbols.find(isTradable);
  if (symbol === undefined) return undefined;
  if (event.date < today) return undefined;
  const ledger = readLedger(md, symbol);
  if (!ledger.buySignal) return undefined;
  const until = ledger.callLine?.until;
  if (until !== undefined && until < today) return undefined;
  if (ledger.probePrice === undefined || cash < ledger.probePrice * CONTRACT) return undefined;
  if (ledger.confidence === "none") return undefined;
  const expires = until !== undefined && until < event.date ? until : event.date;
  const dateText = `${dayText(event.date)} (${event.status})`;
  return {
    id: `event:${event.id}:${symbol}:sell-cash-secured-put`,
    source: "event",
    move: {
      kind: "sell-cash-secured-put",
      label: `Sell a cash-secured put on ${symbol}`,
      symbol,
      contracts: 1,
      href: href(deskId, symbol, "201"),
    },
    why: [
      {
        rule: `ledger:${event.id}:buy-signal`,
        text:
          `${event.title}: ${dateText}. The house's research ledger for it${ledger.assessed ? `, last assessed ${dayText(ledger.assessed)},` : ""} ` +
          `lists a buy signal on ${symbol}, which allows a cash-secured put as a way in` +
          `${campaigns.length > 0 ? ` (linked from ${campaigns.join(", ")})` : ""}.`,
      },
      ...(ledger.provesWrong
        ? [
            {
              rule: `ledger:${event.id}:falsifier`,
              text: `What would prove the ledger wrong, in its words: ${ledger.provesWrong}`,
            },
          ]
        : []),
      {
        rule: "cash-secured-put:worst-case",
        text: `The worst case is being assigned ${symbol} shares at the strike while they trade below it; the cash set aside covers the strike, and the premium is the only gain.`,
      },
    ],
    baseRate: UNTESTED,
    exits: [
      {
        kind: "time",
        text: `The ledger's view holds until ${dayText(expires)}; after that this quest leaves the page. Close or keep the put at the ticket.`,
      },
    ],
    expires: {
      date: expires,
      why:
        expires === event.date
          ? `the event happens on ${dateText}`
          : `the ledger's own call runs only until ${dayText(expires)}`,
    },
    houseCall: "take",
    confidence: ledger.confidence ?? "low",
    atOpen: false,
  };
}

/**
 * The event quests for one book. `today` is the UTC day (YYYY-MM-DD). Not ranked — the route ranks
 * across sources. One quest per event.
 */
export function eventQuests(
  deskId: string,
  stances: readonly EventStance[],
  book: { readonly cash: number },
  today: string,
): Quest[] {
  return stances.flatMap((s) => quest(deskId, s, today, book.cash) ?? []);
}
