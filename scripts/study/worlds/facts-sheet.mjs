// The world-facts sheet's pure half (#4943) — the facts a blind task author may build a task on,
// taken MECHANICALLY from one viewer's composed payloads (the bytes the member's page is served),
// never from the inputs JSON, so a fact can only be one the page could show. Specced in
// tests/scripts/study-facts.spec.ts. It lives under worlds/ because it knows the profile payloads'
// shapes: the net-worth view, the desk, the bot heartbeat, the activity ledger and the calendar.
//
// Every fact: `{id, viewer, account, own, label, answer, display, answerRegion, weak}`.
//  - `id` is stable — `<account>.<subject>.<fact>`, from ids and symbols, never from wording.
//  - `answer` is the oracle's shape (task-file.mjs): a number with its tolerance, or a text.
//  - `answerRegion` is text the page prints where the fact is shown: the server's own formatted
//    strings, joined the way the app's components lay them out (see each builder below), so the
//    oracle can check the place was on screen. `weak` marks a region that is a bare short number
//    ("130"), which other text on a page may also contain — fine to grade, poor to build on.
//
// Formatting the app does itself (a verdict's words, a short date) comes in through `fmt`, so the
// CLI can hand in the app's own functions where the pin's app exports them (facts.mjs).

const MINUS = /^[-−–]/;

/** "$996,966" → 996966 · "+$1,056" → 1056 · "−$7,745" → −7745 · "+0.20%" → 0.2 · "—" → null. */
export function parseAmount(text) {
  const s = String(text ?? "").trim();
  const m = s.match(/^([+\-−–])?\s*\$?\s*([+\-−–])?\s*(\d[\d,]*(?:\.\d+)?)\s*%?/);
  if (!m) return null;
  const n = Number(m[3].replace(/,/g, ""));
  return MINUS.test(m[1] ?? "") || MINUS.test(m[2] ?? "") ? -n : n;
}

/** An OCC option symbol's parts: "CRWV261106P00080000" → {root, expiry: "2026-11-06", type, strike}. */
export function occParts(symbol) {
  const m = String(symbol ?? "").match(/^([A-Z.]+)(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/);
  if (!m) return null;
  return {
    root: m[1],
    expiry: `20${m[2]}-${m[3]}-${m[4]}`,
    type: m[5] === "P" ? "put" : "call",
    strike: Number(m[6]) / 1000,
  };
}

/** A calendar date ("2026-11-06") or an instant, as the app's short month-day: "Nov 6". Dates
 *  are calendar days (UTC); instants read on the world's New York clock, as the page does. */
export function shortDate(iso) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  return new Date(dateOnly ? `${iso}T12:00:00Z` : iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: dateOnly ? "UTC" : "America/New_York",
  });
}

/** An instant's calendar day on the world's New York clock — the day the page shows: "2026-10-05". */
export function nyDate(iso) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "America/New_York",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** An order's date and time as the activity ledger stamps it (activity-table.tsx → rowStamp, in
 *  the study browser's en-US locale on the New York clock): "Oct 5, 11:20 AM". */
export function rowStamp(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

/** The app's verdict words (app/src/live/heartbeat.ts → VERDICT_WORDS), mirrored for a pin whose
 *  app does not export them; the CLI prefers the app's own. */
export const VERDICT_WORDS_MIRROR = {
  long: "wants to hold",
  flat: "wants out",
  "no-window": "waiting for its window",
  tactical: "trading on live signals",
};

/** A region a page may print elsewhere too: a bare number of four characters or fewer. */
export function weakRegion(snippet) {
  const s = String(snippet ?? "").trim();
  return s.length <= 4 && /^[\d.,]+$/.test(s);
}

const num = (display, tol = { abs: 1 }) => {
  const value = parseAmount(display);
  return value === null ? null : { kind: "number", value, ...tol };
};
const txt = (value) => ({ kind: "text", value });

/** Assemble one fact; null when the payload had no usable value. */
function fact(base, id, label, answer, display, answerRegion) {
  if (!answer || answer.value === null || answer.value === undefined || answer.value === "")
    return null;
  const regions = answerRegion.filter((r) => typeof r === "string" && r.trim());
  return {
    ...base,
    id: `${base.account}.${id}`,
    label,
    answer,
    display,
    answerRegion: [...new Set(regions)],
    weak: regions.length > 0 && regions.every(weakRegion),
  };
}

/** Net-worth view (`/api/accounts/networth`): one account's headline numbers. */
function accountFacts(base, a) {
  const [dayAmount] = String(a.dayChange ?? "").split(" · ");
  const month = (a.windows ?? []).find((w) => w.label === "1M");
  return [
    fact(base, "net-worth", `${a.name}'s net worth`, num(a.value), a.value, [a.value]),
    fact(base, "cash", `${a.name}'s cash`, num(a.cash), a.cash, [a.cash]),
    fact(base, "day-change", `${a.name}'s change today`, num(dayAmount), a.dayChange, [dayAmount]),
    fact(
      base,
      "month-return",
      `${a.name}'s return this month`,
      num(month?.value, { abs: 0.01 }),
      month?.value,
      [month?.value],
    ),
    fact(base, "booked-pl", `${a.name}'s booked (realized) P/L`, num(a.bookedPl), a.bookedPl, [
      a.bookedPl,
    ]),
    fact(base, "unrealized-pl", `${a.name}'s P/L on open positions`, num(a.onPaper), a.onPaper, [
      a.onPaper,
    ]),
  ];
}

/** A share position, as the positions table (`cost $X · now $Y`) and the phone card print it. */
function shareFacts(base, p) {
  const s = p.display;
  return [
    fact(base, `${s}.quantity`, `shares of ${s} held`, num(p.quantity, { abs: 0 }), p.quantity, [
      p.quantity,
    ]),
    fact(
      base,
      `${s}.average-cost`,
      `average cost per ${s} share`,
      num(p.costPerShare, { abs: 0.01 }),
      p.costPerShare,
      [`cost ${p.costPerShare}`],
    ),
    fact(base, `${s}.price`, `${s}'s current price`, num(p.price, { abs: 0.01 }), p.price, [
      `now ${p.price}`,
    ]),
    fact(base, `${s}.total-pl`, `total P/L on ${s}`, num(p.totalPl), p.totalPl, [
      `${s} ${p.totalPl}`,
      p.totalPl,
    ]),
  ];
}

/** An option position: the contract, which side, the premium, the expiry, the P/L. */
function optionFacts(base, p) {
  const occ = occParts(p.symbol);
  const id = `option.${p.symbol}`;
  const sold = Number(p.quantity) < 0;
  const premium = Math.abs(parseAmount(p.costBasis) ?? Number.NaN);
  const premiumText = `$${premium.toLocaleString("en-US")}`;
  const side = String(p.plainName ?? "").split(" · ")[0];
  return [
    fact(base, `${id}.contract`, `the ${p.display} contract`, txt(p.display), p.display, [
      p.display,
    ]),
    fact(
      base,
      `${id}.side`,
      `whether ${p.display} was bought or sold`,
      txt(sold ? "sold" : "bought"),
      side,
      [side, p.plainName],
    ),
    fact(
      base,
      `${id}.premium`,
      `premium ${sold ? "received" : "paid"} for ${p.display}`,
      Number.isFinite(premium) ? { kind: "number", value: premium, abs: 1 } : null,
      premiumText,
      [premiumText],
    ),
    occ &&
      fact(
        base,
        `${id}.expiry`,
        `when ${p.display} expires`,
        txt(occ.expiry),
        shortDate(occ.expiry),
        [p.display, `Expires ${shortDate(occ.expiry)}`],
      ),
    fact(base, `${id}.total-pl`, `total P/L on ${p.display}`, num(p.totalPl), p.totalPl, [
      `${p.display} ${p.totalPl}`,
      p.totalPl,
    ]),
  ];
}

/** The next dated event a position carries (`nextEvent`: "CPI report Oct 14"). */
function eventFacts(base, positions) {
  const seen = new Set();
  return positions.flatMap((p) => {
    const e = p.nextEvent;
    if (!(e?.label && e.at) || seen.has(e.label)) return [];
    seen.add(e.label);
    const slug = e.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return [
      fact(base, `event.${slug}.date`, `when "${e.label}" falls`, txt(e.at), shortDate(e.at), [
        e.label,
      ]),
    ];
  });
}

/** Subscribed playbooks the viewer may see (a non-owner's copy carries no ids): mode and verdict,
 *  as the chip's table prints a row — id, mode, verdict words. */
function playbookFacts(base, heartbeat, words) {
  return (heartbeat?.playbooks ?? [])
    .filter((p) => p.playbookId)
    .flatMap((p) => {
      const said = words[p.state] ?? p.state;
      const row = `${p.playbookId} ${p.mode} ${said}`;
      return [
        fact(base, `playbook.${p.playbookId}.mode`, `${p.playbookId}'s mode`, txt(p.mode), p.mode, [
          row,
        ]),
        fact(
          base,
          `playbook.${p.playbookId}.verdict`,
          `what ${p.playbookId} says now`,
          txt(said),
          said,
          [row],
        ),
      ];
    });
}

/** The newest activity rows (date · symbol · BUY/SELL · Qty · price — the phone hides the price
 *  column, so a quantity's region stops at the Qty cell), with the playbook that
 *  placed the order when the viewer's copy carries it — the gate strips it for a non-owner.
 *  Every region of a row starts at its date-and-time cell, so two orders of one symbol and side
 *  (or one day) never share a region: the oracle can tell which row was on screen. */
function activityFacts(base, rows, max) {
  return rows.slice(0, max).flatMap((r) => {
    const id = `activity.${r.orderId}`;
    const side = String(r.side ?? "").toUpperCase();
    const pb = r.reasoning?.playbookId;
    const pbText = pb && r.reasoning.playbookMode ? `${pb} · ${r.reasoning.playbookMode}` : pb;
    // The ledger's Qty cell: "filled/ordered" for a partial fill (activity-table.tsx), else the count.
    const qty =
      r.filled > 0 && r.filled !== r.quantity ? `${r.filled}/${r.quantity}` : `${r.quantity}`;
    // A lifecycle row stamps its day in its own words; the row is pinned by the symbol alone then.
    const stamp = r.lifecycle ? "" : `${rowStamp(r.at)} `;
    const symbol = `${stamp}${r.display}${r.net ? ` net ${r.net}` : ""}`;
    const day = shortDate(r.at);
    return [
      fact(
        base,
        `${id}.side`,
        `whether the ${r.display} order of ${day} bought or sold`,
        txt(r.side),
        side,
        [`${symbol} ${side}`],
      ),
      fact(
        base,
        `${id}.quantity`,
        `how many ${r.display} the ${day} order ${r.side === "buy" ? "bought" : "sold"}`,
        { kind: "number", value: r.filled || r.quantity, abs: 0 },
        qty,
        [`${symbol} ${side} ${qty}`],
      ),
      fact(
        base,
        `${id}.price`,
        `the price of the ${r.display} order of ${day}`,
        num(r.price, { abs: 0.01 }),
        r.price,
        [`${symbol} ${side} ${qty} ${r.price}`],
      ),
      fact(
        base,
        `${id}.date`,
        `when the ${r.display} ${r.side} order filled`,
        txt(nyDate(r.at)),
        day,
        [`${symbol} ${side}`],
      ),
      pb
        ? fact(
            base,
            `${id}.playbook`,
            `which playbook placed the ${r.display} order of ${day}`,
            txt(pb),
            pbText,
            [pbText],
          )
        : null,
    ];
  });
}

/** Calendar events in the `days` after the instant: title and date. */
function calendarFacts(viewer, events, instant, days) {
  // Both ends are New York calendar days, as the page reads the instant.
  const from = nyDate(instant);
  const until = nyDate(new Date(Date.parse(instant) + days * 86_400_000).toISOString());
  const base = { viewer, account: "calendar", own: true };
  return (events ?? [])
    .filter((e) => e.date >= from && e.date <= until)
    .map((e) =>
      fact(base, `${e.id}.date`, `when "${e.title}" is`, txt(e.date), shortDate(e.date), [e.title]),
    );
}

/**
 * Every fact one viewer's payloads hold.
 * @param {{viewer: string, instant: string, payloads: Record<string, unknown>,
 *          verdictWords?: Record<string, string>, activityRows?: number, calendarDays?: number}} opts
 *   `payloads` maps a canonical request (payloads.mjs → canonicalUrl) to its body.
 */
export function factSheet({
  viewer,
  instant,
  payloads,
  verdictWords = VERDICT_WORDS_MIRROR,
  activityRows = 5,
  calendarDays = 7,
}) {
  const networth = payloads["/api/accounts/networth"];
  const own = new Set((networth?.accounts ?? []).map((a) => a.id));
  const out = [];
  for (const a of networth?.accounts ?? [])
    out.push(...accountFacts({ viewer, account: a.id, own: true }, a));
  if (own.size > 1 && networth?.total) {
    const t = networth.total;
    const base = { viewer, account: "all-accounts", own: true };
    out.push(
      fact(base, "net-worth", "net worth across every account", num(t.value), t.value, [t.value]),
    );
  }
  for (const key of Object.keys(payloads).sort()) {
    const m = key.match(/^\/api\/desk\/([^/?]+)$/);
    const desk = m ? payloads[key]?.desk : null;
    if (!desk) continue;
    const base = { viewer, account: desk.id, own: own.has(desk.id) };
    const positions = desk.positions ?? [];
    for (const p of positions)
      out.push(...(p.isOption ? optionFacts(base, p) : shareFacts(base, p)));
    out.push(...eventFacts(base, positions));
    out.push(...playbookFacts(base, payloads[`${key}/heartbeat`]?.heartbeat, verdictWords));
    out.push(...activityFacts(base, payloads[`${key}/activity`]?.activity ?? [], activityRows));
  }
  out.push(
    ...calendarFacts(viewer, payloads["/api/research/calendar"]?.events, instant, calendarDays),
  );
  return out.filter(Boolean);
}

/**
 * The world's own names in one viewer's payloads — accounts, desks, tickers, contracts, playbooks,
 * events — so the harvest can tell data printed on screen from the interface's words
 * (harvest-plan.mjs → setAsideWhy). Taken from the same payloads as the facts.
 * @param {Record<string, any>} payloads
 */
export function dataNames(payloads) {
  const out = new Set();
  const add = (...names) => {
    for (const n of names) if (typeof n === "string" && n.trim()) out.add(n.trim());
  };
  for (const a of payloads["/api/accounts/networth"]?.accounts ?? []) add(a.id, a.name);
  for (const key of Object.keys(payloads)) {
    const body = payloads[key];
    if (/^\/api\/desk\/[^/?]+$/.test(key) && body?.desk) {
      add(body.desk.id, body.desk.name);
      for (const p of body.desk.positions ?? []) {
        add(p.symbol, p.display, occParts(p.symbol)?.root, p.nextEvent?.label);
      }
    }
    for (const r of body?.activity ?? []) add(r.display, r.symbol, r.reasoning?.playbookId);
    for (const p of body?.heartbeat?.playbooks ?? []) add(p.playbookId);
  }
  for (const e of payloads["/api/research/calendar"]?.events ?? []) add(e.title);
  return [...out].sort();
}
