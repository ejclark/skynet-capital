// THE DAY'S CHANGE ADDS UP (#5052) — a study world's header and its rows tell one story. PURE: it
// reads a composed book (book.mjs → buildBook), never a server. Specced in
// tests/scripts/study-day-change.spec.ts.
//
// WHY: the account header's "today" is equity − yesterday's closing equity
// (networth-json-view.ts → dayChangeView), and each position row's is its value − its quantity at
// yesterday's close (desk-json-view.ts). A world that typed yesterday's equity by hand showed Eric
// −$71 in the header beside rows adding to −$4, and Sauron +$1,951 beside +$53 — and once phone rows
// carried their own day's change (#5049), a member could see the gap and report it as the app's bug.
// So book.mjs derives yesterday's equity from the same marks the rows read, and this check holds
// every participant to it. The one honest gap — P/L booked today on positions already closed, which
// no row shows — is declared in the input (`closedToday`) and the world's comment, never typed in.

/** How far apart the header and its rows may sit: under a dollar, the header's own rounding. */
export const DAY_CHANGE_SLACK = 1;

/** Each participant's header day change, the sum of its rows', and what the input declares apart. */
export function dayChangeRows(book) {
  return book.participants.map((p) => {
    const header = p.equity - (book.lastEquity?.[p.id] ?? Number.NaN);
    const rows = p.positions.reduce((s, x) => s + x.marketValue - x.quantity * x.lastdayPrice, 0);
    const declared = book.closedToday?.[p.id] ?? 0;
    return { id: p.id, header, rows, declared, gap: header - rows - declared };
  });
}

/** The participants whose header and rows disagree by a dollar or more beyond what is declared. */
export function dayChangeGaps(book) {
  return dayChangeRows(book).filter((r) => !(Math.abs(r.gap) < DAY_CHANGE_SLACK));
}

/** One line per gap, for the composer's refusal. */
export const describeGap = (r) =>
  `${r.id}: header ${r.header.toFixed(2)} vs rows ${r.rows.toFixed(2)}` +
  (r.declared ? ` + declared ${r.declared.toFixed(2)}` : "") +
  ` — off by ${r.gap.toFixed(2)}`;
