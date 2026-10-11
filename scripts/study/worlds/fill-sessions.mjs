// EVERY FILL LANDS IN A SESSION (#5208) — a study world never shows a fill production could not
// hold. Reads a composed book (book.mjs → buildBook), never a server. Specced in
// tests/scripts/study-fill-sessions.spec.ts.
//
// WHY: profile-today's first inputs put two of Eric's buys on Saturdays (AAPL Sep 26, MSFT Oct 3),
// counted back from a Thursday instant with no calendar in the way. market.mjs skips weekends for
// price bars, but nothing checked fills, and the Activity frame showed a member trading while the
// market was shut. The test is the app's own clock — the regular New York session, holidays and
// early closes included (`market-session.ts`) — so a fill at 16:00 or on Thanksgiving is refused
// too.

import { regularSessionOpen } from "../../../src/domain/market-session.ts";

/** Every fill in the book, human or bot, that falls outside a regular New York session. */
export function offSessionFills(book) {
  return Object.values(book.activity)
    .flat()
    .filter((f) => !regularSessionOpen(new Date(f.at)));
}

/** One line per off-session fill, for the composer's refusal. */
export const describeFill = (f) =>
  `${f.participantId} ${f.side} ${f.symbol} (${f.orderId}) at ${f.at} — no New York session is open`;
