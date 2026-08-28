// Event material-scan — the DECISION half (pure). scripts/event-material-scan.mjs is the CLI/fetch
// shell; this file holds everything that can be reasoned about and tested without the network or
// the filesystem, matching the event-scan.mjs / event-scan-validation.mjs split.
//
// Answers ONE question for an `interval-elapsed` pulse: did anything the probe can measure move
// enough to be worth a Claude research session, or was this pulse quiet? See
// docs/process/EVENT-RESEARCH.md ("Deterministic screening") for the protocol and
// docs/research/events/TEMPLATE.md for the ledger header contract this reads and writes.
//
// DEFAULTS CHOSEN (issue #724's open question 1 — documented here AND in the PR body, since Eric
// approved "use the proposed defaults" before a concrete proposal existed):
//   - PRICE_MOVE_THRESHOLD  5%   — a single-session move in one of the event's own tracked symbols
//     since the last recorded reference price. 5% is comfortably past ordinary daily noise for the
//     mega-cap/AI-semi names this calendar tracks (for scale: NVDA -9.23% and MRVL -7.6% are the
//     tail moves already called out as material in this repo's own ledgers) while still catching a
//     real single-session dislocation. Peer-symbol moves are NOT probed in v1 (peers are supplied
//     ad hoc to the research instruments, not tracked per event in the calendar tables) — a
//     documented simplification, not an oversight; a full session's adjacency sweep still checks
//     peers by hand.
//   - VIX_MOVE_THRESHOLD    3 points  — an absolute move since the last recorded VIX reading. This
//     calendar's own ledgers treat the ~14-16 range as "calm" and call out moves of a few points as
//     regime-relevant (e.g. the jackson-hole ledger's VIX 15.8 -> 14.56 -> 15.21 band); 3 points is
//     large enough to skip ordinary day-to-day drift and small enough to catch a real regime shift.
//   - ADJACENCY_WINDOW_DAYS 5 calendar days either side of the event's own date — matches the
//     "corridor" framing this repo's own pulse checks already use (NVDA/MRVL/Jackson-Hole reads as
//     one 3-day corridor); a new dated entry landing inside that window is exactly the kind of find
//     a human adjacency sweep would flag.
//   - STALENESS_CEILING     3  — every 3rd consecutive pulse is forced material regardless of the
//     readings (the issue's own suggested default), so an event can never coast on screens forever;
//     a real session re-establishes the baseline at least that often.
// All four are constants, not config — same "tune here, on the record" doctrine as
// digest-scan.mjs's COMMIT_THRESHOLD/HEARTBEAT_DAYS.
//
// REFERENCE-LEVEL STORAGE (open question 2): a machine-readable `<!-- probe-ref: {...} -->` block
// embedded in the ledger header, right after `**Last assessed:**` — NOT a sidecar JSON file. Chosen
// because the ledger is already this system's one source of truth per event (event-scan.mjs reads
// nothing else), and a sidecar would need to stay in sync with a file it has no other tie to. The
// probe-ref block is free-standing state (current readings + streak), not an assessment row, so it
// is REPLACED in place on every pulse (screen or material) rather than appended — unlike the
// assessment ledger table, which stays strictly append-only.
export const PRICE_MOVE_THRESHOLD = 0.05;
export const VIX_MOVE_THRESHOLD = 3;
export const ADJACENCY_WINDOW_DAYS = 5;
export const STALENESS_CEILING = 3;

export const daysBetween = (fromDate, toDate) =>
  Math.round(
    (Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86_400_000,
  );

export const addDays = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Which cadence band today's daysOut falls in, as event-scan.mjs's assessmentDue does — plus a
 *  stable label (so a screen can tell "still the same band" from "just crossed a boundary"). */
export function bandFor(impact, daysOut, cadence) {
  const bands = cadence?.bands?.[impact];
  if (!Array.isArray(bands) || bands.length === 0) {
    throw new Error(`event-material-scan: no cadence bands for impact "${impact}"`);
  }
  const b = bands.find((x) => daysOut >= x.minDaysOut);
  if (!b) throw new Error(`event-material-scan: no matching cadence band (daysOut=${daysOut})`);
  return { label: `${impact}:${b.minDaysOut}+`, intervalDays: b.intervalDays };
}

function daysBandReason(probeRef, band) {
  return probeRef.daysBand !== band.label
    ? [`days-band-transition:${probeRef.daysBand ?? "none"}->${band.label}`]
    : [];
}

function priceMoveReasons(symbols, probeRef, market) {
  const reasons = [];
  for (const sym of symbols) {
    const prev = probeRef.symbols?.[sym];
    const cur = market.symbols?.[sym];
    if (!(typeof prev === "number" && prev > 0 && typeof cur === "number")) continue;
    const pct = (cur - prev) / prev;
    if (Math.abs(pct) >= PRICE_MOVE_THRESHOLD) {
      reasons.push(`price-move:${sym}:${pct >= 0 ? "+" : ""}${(pct * 100).toFixed(1)}%`);
    }
  }
  return reasons;
}

function vixReason(probeRef, market) {
  if (!(typeof probeRef.vix === "number" && typeof market.vix === "number")) return [];
  const dv = market.vix - probeRef.vix;
  return Math.abs(dv) >= VIX_MOVE_THRESHOLD
    ? [`vix-regime-change:${dv >= 0 ? "+" : ""}${dv.toFixed(1)}pt`]
    : [];
}

function adjacencyReasons(probeRef, adjacentIds) {
  const prior = new Set(probeRef.adjacentIds ?? []);
  return adjacentIds.filter((id) => !prior.has(id)).map((id) => `new-adjacent-event:${id}`);
}

function stalenessReason(probeRef) {
  return (probeRef.screenStreak ?? 0) >= STALENESS_CEILING - 1 ? ["staleness-ceiling"] : [];
}

/** Every threshold check against the prior probe-ref, in one pass. Pushes a short machine-readable
 *  reason string per trip; an empty return means nothing tracked moved. Each check is its own tiny
 *  function so this stays a flat concatenation, not a branch tree. */
function tripReasons(event, probeRef, market, adjacentIds, band) {
  return [
    ...daysBandReason(probeRef, band),
    ...priceMoveReasons(event.symbols ?? [], probeRef, market),
    ...vixReason(probeRef, market),
    ...adjacencyReasons(probeRef, adjacentIds),
    ...stalenessReason(probeRef),
  ];
}

/**
 * The probe's verdict for one `interval-elapsed` pulse. Pure — every input is a plain value, so
 * this is fully exercisable through `--explain` (see event-material-scan.mjs).
 *
 * `state.ledger.probeRef` missing (an event whose ledger predates this contract, or whose initial
 * research never seeded one) is treated as "material" — `no-reference-baseline` — the safe default:
 * with nothing to diff against, a probe cannot honestly call anything quiet. That one full session
 * seeds the block for every screen after it.
 */
export function decide(state) {
  const { event, today, cadence, ledger, market = {}, adjacentIds = [] } = state;
  const daysOut = daysBetween(today, event.date);
  const band = bandFor(event.impact, daysOut, cadence);
  const probeRef = ledger?.probeRef ?? null;
  const reasons = probeRef
    ? tripReasons(event, probeRef, market, adjacentIds, band)
    : ["no-reference-baseline"];

  const verdict = reasons.length ? "material" : "screen";
  const screenStreak = verdict === "screen" ? (probeRef?.screenStreak ?? 0) + 1 : 0;
  return {
    verdict,
    reasons,
    intervalDays: band.intervalDays,
    daysOut,
    readings: {
      symbols: market.symbols ?? {},
      vix: market.vix ?? null,
      daysBand: band.label,
      adjacentIds: [...adjacentIds].sort(),
      screenStreak,
    },
  };
}

/** Other tracked events within ADJACENCY_WINDOW_DAYS of `event`'s date — the calendar-side half of
 *  the "new adjacent event" check. Pure given the full table; the live CLI supplies `allEvents`
 *  from the same TS-table extraction event-scan.mjs uses. */
export function computeAdjacentIds(event, allEvents, windowDays = ADJACENCY_WINDOW_DAYS) {
  return allEvents
    .filter((e) => e.id !== event.id && Math.abs(daysBetween(event.date, e.date)) <= windowDays)
    .map((e) => e.id)
    .sort();
}

function describeReadings(state, decision) {
  const prior = state.ledger?.probeRef;
  const bits = [];
  for (const sym of state.event.symbols ?? []) {
    const cur = decision.readings.symbols[sym];
    if (typeof cur !== "number") continue;
    const prev = prior?.symbols?.[sym];
    const delta =
      typeof prev === "number" && prev > 0
        ? ` (${(((cur - prev) / prev) * 100).toFixed(1)}% since last)`
        : "";
    bits.push(`${sym} $${cur.toFixed(2)}${delta}`);
  }
  if (typeof decision.readings.vix === "number") {
    const dv =
      typeof prior?.vix === "number"
        ? ` (${decision.readings.vix - prior.vix >= 0 ? "+" : ""}${(decision.readings.vix - prior.vix).toFixed(1)}pt since last)`
        : "";
    bits.push(`VIX ${decision.readings.vix.toFixed(1)}${dv}`);
  }
  bits.push(
    prior?.daysBand && prior.daysBand !== decision.readings.daysBand
      ? `band ${prior.daysBand} -> ${decision.readings.daysBand}`
      : `band unchanged (${decision.readings.daysBand})`,
  );
  bits.push(`${decision.readings.adjacentIds.length} adjacent event(s) tracked`);
  return `Readings — ${bits.join(", ")}. Nothing tracked crossed its threshold.`;
}

/** Splice a new row into the last table under `## Assessment ledger`, tolerant of stray blank
 *  lines inside the table (one committed ledger has one). Throws if the section or table is
 *  missing — a screen must never silently fail to record itself. */
function insertLedgerRow(text, row) {
  const headingIdx = text.indexOf("## Assessment ledger");
  if (headingIdx === -1) {
    throw new Error("event-material-scan: ledger is missing '## Assessment ledger'");
  }
  const startLine = text.slice(0, headingIdx).split("\n").length - 1;
  const lines = text.split("\n");
  let lastTableLine = -1;
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("|")) lastTableLine = i;
    else if (line.trim() !== "" && lastTableLine !== -1) break;
  }
  if (lastTableLine === -1) {
    throw new Error("event-material-scan: ledger's Assessment ledger has no table to append to");
  }
  lines.splice(lastTableLine + 1, 0, row);
  return lines.join("\n");
}

/**
 * Write a screen's outcome into the ledger's raw markdown: bump `**Last assessed:**`, replace the
 * probe-ref block with fresh readings, and append ONE table row — worded as a mechanical check,
 * never as an assessment (the honesty invariant: "screened", never "no change" or a verdict). Only
 * ever called on a "screen" verdict; a "material" verdict writes nothing here — the full session
 * appends its own row, same as today.
 */
export function applyScreen(ledgerText, state, decision) {
  if (decision.verdict !== "screen") {
    throw new Error("event-material-scan: applyScreen called on a non-screen verdict");
  }
  const { today } = state;
  if (!/^\*\*Last assessed:\*\*\s*\S+/m.test(ledgerText)) {
    throw new Error("event-material-scan: ledger is missing the '**Last assessed:**' line");
  }
  let text = ledgerText.replace(/^\*\*Last assessed:\*\*\s*\S+/m, `**Last assessed:** ${today}`);
  const probeRefLine = `<!-- probe-ref: ${JSON.stringify(decision.readings)} -->`;
  text = /^<!-- probe-ref:.*-->$/m.test(text)
    ? text.replace(/^<!-- probe-ref:.*-->$/m, probeRefLine)
    : text.replace(/^(\*\*Last assessed:\*\*.*)$/m, `$1\n${probeRefLine}`);
  const row =
    `| ${today} | D-${decision.daysOut} | **Deterministic screen (no Claude session).** ` +
    `${describeReadings(state, decision)} | — (screen; no assessment made) | ` +
    `${addDays(today, decision.intervalDays)} |`;
  return insertLedgerRow(text, row);
}

/** `**Last assessed:**` + an optional `<!-- probe-ref: {...} -->` line right after it — the ledger
 *  contract event-material-scan.mjs reads on the live path (docs/process/EVENT-RESEARCH.md). A
 *  malformed probe-ref block parses as absent (falls back to `no-reference-baseline`, never a
 *  crash) — a hand-edited ledger must degrade safely, not break the pulse pipeline. */
export function parseLedgerHeader(text) {
  const lastAssessed = text.match(/^\*\*Last assessed:\*\*\s*(\S+)/m)?.[1] ?? null;
  const raw = text.match(/^<!-- probe-ref:\s*(\{.*\})\s*-->$/m)?.[1];
  let probeRef = null;
  if (raw) {
    try {
      probeRef = JSON.parse(raw);
    } catch {
      probeRef = null;
    }
  }
  return { lastAssessed, probeRef };
}
