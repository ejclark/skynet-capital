// THE PLAN'S SCORECARD ROWS (#8005) — the three rows of the cross-feature plan's scorecard that a
// blind round sets, read from the round's own sessions, so a re-run on the fixed build (slice 8)
// prints the same rows from the same files and the two can be laid side by side:
//
//   - task success by viewport (phone first: the profile round's 47% is where it breaks), with
//     Wilson 95% ranges — the oracle's verdict on each session, never the member's claim;
//   - lostness and backtracks per task (metrics.mjs, the recorder's), the middle session's value
//     by viewport, so one wild session does not move the row;
//   - chat sensor recall: of the things members told Moneypenny that were the app getting in their
//     way, how many she turned into a filing or follow-up draft in that session. "Getting in their
//     way" is a judgement on each member message, so it is read from `<round>/chat-labels.json`
//     (`[{session, n, friction, why}]`, an aware read of every member message, written before this
//     runs) and never guessed here; without that file the row says it was not labelled.
//
// Pure: readout.mjs gathers the sessions and their chat logs; specced in
// tests/scripts/study-plan-scorecard.spec.ts.

import { wilson } from "./grade-core.mjs";

/** The draft kinds that are friction turned into a request (world-chat.mjs → draftsOf). */
const FRICTION_DRAFTS = new Set(["filing", "followup"]);

const pct = (x) => (x === null || x === undefined ? "n/a" : `${Math.round(x * 100)}%`);
const range = (w) => (w ? `${pct(w.lo)}–${pct(w.hi)}` : "n/a");

/** The middle value of the numbers given (the mean of the two middle ones on an even count). */
export function median(values) {
  const xs = values
    .filter((v) => typeof v === "number" && Number.isFinite(v))
    .sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = xs.length >> 1;
  const m = xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
  return Math.round(m * 100) / 100;
}

/**
 * One viewport's sessions → success (with its range), the right answers wherever they came from,
 * middle lostness and middle backtracks. Success is the oracle's: the fact AND the place it lives
 * seen on screen. With the chat in hand a member can get the fact right from Moneypenny without
 * ever seeing its place (the cross-feature round, 11 of 24 failures), so `answered` counts the
 * oracle's answer match alone, beside it, never in its place.
 */
function viewportRow(sessions) {
  const succeeded = sessions.filter((s) => s.success).length;
  return {
    sessions: sessions.length,
    succeeded,
    answered: sessions.filter((s) => s.answered).length,
    rate: sessions.length ? Math.round((succeeded / sessions.length) * 1000) / 1000 : null,
    wilson: sessions.length ? wilson(succeeded, sessions.length) : null,
    lostness: median(sessions.map((s) => s.lostness)),
    backtracks: median(sessions.map((s) => s.backtracks)),
  };
}

/**
 * Chat sensor recall over the labelled member messages. A message voiced friction when its label
 * says so; it was caught when that exchange, or a later one in the same session, carried a filing
 * or follow-up draft. A member message with no label is counted apart, never guessed.
 */
export function chatRecall(sessions, labels) {
  const said = sessions.flatMap((s) =>
    (s.chat ?? [])
      .filter((c) => c.kind === "chat" && String(c.said ?? "").trim())
      .map((c) => ({ session: s.rel, n: c.n })),
  );
  if (labels === null || labels === undefined) return { messages: said.length, labelled: false };
  const byKey = new Map(labels.map((l) => [`${l.session}#${l.n}`, l]));
  const caught = (s, n) =>
    (s.chat ?? []).some(
      (c) =>
        c.kind === "chat" && c.n >= n && (c.drafts ?? []).some((d) => FRICTION_DRAFTS.has(d.kind)),
    );
  let voiced = 0;
  let drafted = 0;
  let unlabelled = 0;
  for (const m of said) {
    const label = byKey.get(`${m.session}#${m.n}`);
    if (!label) {
      unlabelled += 1;
      continue;
    }
    if (!label.friction) continue;
    voiced += 1;
    if (caught(sessions.find((s) => s.rel === m.session) ?? {}, m.n)) drafted += 1;
  }
  return {
    messages: said.length,
    labelled: true,
    unlabelled,
    voiced,
    drafted,
    rate: voiced ? Math.round((drafted / voiced) * 1000) / 1000 : null,
    wilson: voiced ? wilson(drafted, voiced) : null,
  };
}

/**
 * The plan's rows from a round's sessions: `[{rel, viewport, success, answered, lostness, backtracks,
 * chat}]`
 * (chat = the session's chat.jsonl lines) and the chat labels (null when not written).
 */
export function planScorecard({ sessions, labels = null }) {
  const viewports = [...new Set(sessions.map((s) => s.viewport))].sort((a, b) =>
    a === "phone" ? -1 : b === "phone" ? 1 : a < b ? -1 : 1,
  );
  return {
    byViewport: Object.fromEntries(
      viewports.map((v) => [v, viewportRow(sessions.filter((s) => s.viewport === v))]),
    ),
    chat: chatRecall(sessions, labels),
  };
}

/** The rows as the readout's scorecard section prints them. */
export function planScorecardLines(card) {
  const vs = Object.keys(card.byViewport);
  if (vs.length === 0) return [];
  const row = (name, fn) => `| ${name} | ${vs.map((v) => fn(card.byViewport[v])).join(" | ")} |`;
  const lines = [
    "### The plan's scorecard (#8005): the baselines this round sets",
    "",
    `| Row | ${vs.join(" | ")} |`,
    `|---|${vs.map(() => "---").join("|")}|`,
    row(
      "Task success (the answer graded, not the member's word)",
      (r) => `${r.succeeded} of ${r.sessions} (${pct(r.rate)}, ${range(r.wilson)})`,
    ),
    row(
      "Answered right, from the page or the chat (the place unseen is allowed)",
      (r) => `${r.answered ?? "n/a"} of ${r.sessions}`,
    ),
    row("Lostness, middle session (0 is a straight path)", (r) => r.lostness ?? "n/a"),
    row("Backtracks, middle session", (r) => r.backtracks ?? "n/a"),
    "",
  ];
  const c = card.chat;
  if (!c.labelled) {
    lines.push(
      `Chat sensor recall: not labelled yet (${c.messages} member messages to Moneypenny; the labels go in chat-labels.json).`,
    );
  } else {
    lines.push(
      `Chat sensor recall: of ${c.voiced} things members told Moneypenny that were the app getting in their way, ${c.drafted} became a filing or follow-up draft (${pct(c.rate)}, ${range(c.wilson)}). ${c.messages} member messages in all` +
        (c.unlabelled ? `; ${c.unlabelled} not labelled and left out.` : "."),
    );
  }
  return lines;
}
