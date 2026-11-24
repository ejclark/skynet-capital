// THE DECISIONS PAGE — #7939 slice 2. Every open ask for Eric reaches him as ONE touch per
// cadence, answerable in one reply, instead of one assignment card per issue.
//
// WHY. On 2026-11-21 four `needs-eric` feedback asks (#7669–#7673) each went out as their own card
// the same night: four taps for four letters. The tools for one touch existed; each leaked.
//
// WHY GITHUB-NATIVE, NOT #5056'S STEER PAGE. The plan's sketch said "take #5056 slice 4". That page
// is an Artifact a live session assembles and reads back, and it has been dormant since 2026-10-12
// because nothing assembles it without a session. This page is one standing issue the push sweep
// regenerates with the App token: no session, no Routine, and his reply lands where the lane
// already reads (`answer-readback.mjs`'s path, so each issue still gets its "Read as:" and its
// ledger row).
//
// WHAT IT IS. One open issue labelled `decisions-page`, found by its marker and a bot author. Its
// BODY is regenerated each tick: every ask on the one Needs-you selector (`assignments.mjs` →
// `plan().needsYou`, criterion 1), numbered, with its question, letters and prediction, plus every
// held PR due his merge (criterion 4), one line each: how long it has been green, what it blocks,
// what silence does (#7317). Merging stays his click on the PR; nothing here reads text as a merge.
// He is assigned to this ONE issue while it holds asks or held PRs; a ping comment goes out at most
// once per batch window (`batchStart`), and only for what he has not been pinged about — a held PR
// is pinged once a day at most, however often a push restarts its checks. The per-issue
// `Needs from you` callout stays the source of truth: the page is a view of it, never a copy.
//
// NUMBERS ARE STABLE. An ask keeps its number while it is on the page; a freed number is not reused
// for a day, and every entry records when it got its number, so a reply is read against the page
// as it stood when he wrote it (decisions-reply.mjs). Pure: no network, no clock.

import { blocksPhrase } from "../held-pr.mjs";
import { ledgerRows, readbackComment } from "./answer-readback.mjs";
import { askRank, cardTwin, parseAsk } from "./ask-card.mjs";
import { batchStart } from "./assignments.mjs";
import { ERIC } from "./decision-callout.mjs";
import { readDecisionsReply, saidOf } from "./decisions-reply.mjs";
import { trustedComment } from "./gh.mjs";
import { FOOTER, LABELS, labelNames, notPullableReason } from "./labels.mjs";
import { isClaudeComment } from "./plan-claim.mjs";

export const PAGE_MARKER = "<!-- moneypenny:decisions-page -->";
export const PAGE_TITLE = "Decisions for Eric";
export const PAGE_LABEL = LABELS.decisionsPage.name;
const STATE_OPEN = "<!-- moneypenny:decisions-state ";
export const RECEIPT_OPEN = "<!-- moneypenny:decisions-receipt ";
const PING_MARKER = "<!-- moneypenny:decisions-ping -->";
/** How long a number that left the page is remembered, so a late reply still reads right. */
export const KEEP_RETIRED_MS = 7 * 864e5;
/** How long a freed number waits before another ask may take it. */
export const REUSE_AFTER_MS = 864e5;
/** A held PR he was pinged about is not pinged again inside this (#7317: no repeat inside a day). */
export const HELD_PING_MS = 864e5;

const EMPTY = () => ({ entries: [], retired: [], pinged: [], pingedAt: 0, heldPinged: [] });
const safeJson = (o) => JSON.stringify(o).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e");
export const clip = (s, n) => {
  const t = String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
/** A question that asks for a merge — the click, not a letter, answers it. */
const MERGE_ASK = /\bmerge\b/i;
const isEric = (login) => String(login ?? "").toLowerCase() === ERIC;

/** The page's hidden state, or an empty one for a page that carries none (or a mangled one). */
export function stateOf(body = "") {
  const at = String(body ?? "").indexOf(STATE_OPEN);
  const end = at === -1 ? -1 : body.indexOf(" -->", at);
  if (end === -1) return EMPTY();
  try {
    const s = JSON.parse(body.slice(at + STATE_OPEN.length, end));
    const list = (x) => (Array.isArray(x) ? x : []);
    return {
      entries: list(s.entries),
      retired: list(s.retired),
      pinged: list(s.pinged),
      pingedAt: Number(s.pingedAt) || 0,
      heldPinged: list(s.heldPinged).filter((h) => Number.isFinite(h?.n)),
    };
  } catch {
    return EMPTY();
  }
}

/**
 * The page's numbering after this tick: asks still waiting keep their number; asks that left are
 * retired with the time they left; new asks take the lowest free number in rank order (`askRank`,
 * then oldest issue). `asks` is `[{ issue, rank }]`. Pure.
 */
export function nextState(prior, asks, now) {
  const want = new Set(asks.map((a) => a.issue));
  const entries = prior.entries.filter((e) => want.has(e.issue));
  const retired = [
    ...prior.retired.filter((r) => now - r.until < KEEP_RETIRED_MS),
    ...prior.entries.filter((e) => !want.has(e.issue)).map((e) => ({ ...e, until: now })),
  ];
  const taken = new Set([
    ...entries.map((e) => e.n),
    ...retired.filter((r) => now - r.until < REUSE_AFTER_MS).map((r) => r.n),
  ]);
  const fresh = asks
    .filter((a) => !entries.some((e) => e.issue === a.issue))
    .sort((a, b) => (a.rank ?? 4) - (b.rank ?? 4) || a.issue - b.issue);
  let n = 1;
  for (const a of fresh) {
    while (taken.has(n)) n++;
    entries.push({ n, issue: a.issue, since: now });
    taken.add(n);
  }
  entries.sort((a, b) => a.n - b.n);
  return { ...prior, entries, retired, pinged: prior.pinged.filter((i) => want.has(i)) };
}

/** One ask's lines on the page: number, issue, question, letters with the prediction marked. */
function entryLines(e, ask) {
  const many = ask.items.length > 1;
  const out = [`**${e.n} · #${e.issue}** ${clip(ask.title, 110)}`];
  for (const [i, it] of ask.items.entries()) {
    out.push(`${many ? `${i + 1}) ` : ""}${clip(it.question, 240)}`);
    for (const o of it.options) {
      const tag = o.predicted ? ` _(predicted${it.confidence ? `, ${it.confidence}` : ""})_` : "";
      out.push(`- **${o.key}**${tag} ${clip(o.text, 170)}`);
    }
    if (!it.options.length && it.forecast) out.push(`- Predicted: ${clip(it.forecast, 170)}`);
  }
  const keys = ask.items.map((it) => it.options.length);
  if (many)
    out.push(
      `_${ask.items.length} questions: one letter each, in order, e.g. \`${e.n} ${ask.items.map((it) => it.options[0]?.key ?? "A").join("")}\`._`,
    );
  else if (!keys[0])
    out.push(`_No letters: reply \`${e.n} yes\`, \`${e.n} no\` or \`${e.n} not now\`._`);
  const silence = ask.items.find((it) => it.onSilence)?.onSilence;
  if (silence) out.push(`_On silence: ${clip(silence.replace(/^[*_\s]+/, ""), 150)}_`);
  return out;
}

/** The page body, from the state and the asks it numbers. `held` is the held PRs; `answered` the
 *  asks his reply answered this tick, kept in the state but left off the list (#7957). Pure. */
export function renderPage({ state, asks, held = [], answered = new Set() }) {
  const listed = state.entries.filter((e) => !answered.has(e.issue));
  const n = listed.length;
  const out = [PAGE_MARKER];
  if (!n && held.length)
    out.push(
      `**${held.length} held PR${held.length === 1 ? " waits" : "s wait"} on your merge.** No decision to reply to: each is one click on its PR.`,
    );
  else if (!n)
    out.push(
      "**Nothing waits on you.** This page fills when an issue needs a decision only you can make.",
    );
  else {
    const first = listed[0];
    out.push(
      `**${n} decision${n === 1 ? " waits" : "s wait"} on you. One reply answers ${n === 1 ? "it" : "all of them"}.**`,
      "",
      `Reply with the number and your letter, like \`1A 2B 3 not now\`, or by issue, like \`${first.issue} A\`. Anything I can't read unambiguously is echoed back, never guessed.`,
    );
    for (const e of listed) out.push("", ...entryLines(e, asks.get(e.issue)));
  }
  if (held.length) out.push("", ...heldLines(held));
  out.push(
    "",
    "<details><summary>How this page works</summary>",
    "",
    "- Rebuilt on every push to `main` from the open `needs-eric` issues with a *Needs from you* callout; the callout on each issue stays the source of truth.",
    '- Each answer is posted on its issue as "Read as: …", `needs-eric` comes off, and the alignment ledger scores it against the prediction (`docs/process/ALIGNMENT.md`).',
    "- A number stays with its ask until the ask leaves the page. #7939 slice 2.",
    "",
    "</details>",
    "",
    `${STATE_OPEN}${safeJson(state)} -->`,
    "",
    FOOTER,
  );
  return out.join("\n");
}

/**
 * The held section: one line per PR — its link, how long it has been green (or open, when its checks
 * are not green), what it blocks, and what his silence does. A merge ask filed as an issue carries
 * none of those facts and stays a bare link. Pure.
 */
function heldLines(held) {
  const out = [
    `**Held for your merge: ${held.length}.** Merging stays your click on the PR; no reply here is read as a merge.`,
  ];
  for (const p of held) {
    const title = p.title ? ` ${clip(p.title, 90)}` : "";
    if (typeof p.hours !== "number") {
      out.push(`- #${p.number}${title}`);
      continue;
    }
    const h = Math.floor(p.hours);
    const clock = p.green ? `green ${h}h` : `open ${h}h, ${checksWord(p)}`;
    const what = blocksPhrase(p.blocks);
    const silence = what
      ? `On silence: it stays open, and ${what} keeps waiting.`
      : "On silence: it stays open.";
    out.push(`- #${p.number}${title} — ${clock}${what ? ` · blocks ${what}` : ""} · _${silence}_`);
  }
  out.push("_No lane merges a held PR; each moves only on your click._");
  return out;
}

/** What a held PR that is not green says about its checks: "unknown" when nobody could read them,
 *  never "not green" about checks that were never seen (#8212). */
const checksWord = (p) => (p.unknown ? "checks unknown" : "checks not green");

const isHis = (c) => trustedComment(c) && isEric(c?.user?.login) && !isClaudeComment(c?.body);

/** Is this `issue_comment` payload his own reply on the page? Unfooted text by `ejclark` is the
 *  only authority signal (sessions post under his login too, with the footer). Pure. */
export function isDecisionsReply(payload) {
  const issue = payload?.issue;
  if (!issue || issue.pull_request || issue.user?.type !== "Bot") return false;
  if (!labelNames(issue.labels).includes(PAGE_LABEL)) return false;
  return isHis(payload?.comment);
}

/** Reply ids the lane has already answered with a receipt. Pure. */
export function receiptedIds(comments = []) {
  const ids = new Set();
  for (const c of comments) {
    if (c?.user?.type !== "Bot") continue;
    for (const m of String(c.body ?? "").matchAll(/<!-- moneypenny:decisions-receipt (\d+) -->/g))
      ids.add(Number(m[1]));
  }
  return ids;
}

/** Does an answer from the page also do what his reply on the issue would — put `ready` on? Only
 *  for a feedback or plan issue (reply-resume.mjs's lanes), only for a letter or a yes, and only if
 *  nothing else would still park it. "no" and "not now" never start a build. */
function readiesFor(issue, answer) {
  const names = labelNames(issue.labels);
  if (!names.some((n) => n === LABELS.feedback.name || n === LABELS.plan.name)) return false;
  if (!(answer.kind === "option" || answer.kind === "yes")) return false;
  const after = names.filter((n) => n !== LABELS.needsEric.name && n !== LABELS.inProgress.name);
  return (
    notPullableReason({ ...issue, labels: [...new Set([...after, LABELS.ready.name])] }) === null
  );
}

/** The answers in one of his replies, as read-back intents plus what was not read. */
function answerIntent(reply, read, { page, askMap, issueBy, answered }) {
  const readbacks = [];
  const unread = [...read.unread];
  for (const a of read.applied) {
    if (answered.has(a.issue)) {
      unread.push({ raw: a.raw, why: `#${a.issue} was answered in an earlier reply` });
      continue;
    }
    answered.add(a.issue);
    const ask = askMap.get(a.issue);
    const issue = issueBy.get(a.issue);
    const card = { items: ask.items.map(cardTwin) };
    const rows = ledgerRows({ number: a.issue, title: ask.title, card, answer: a.answer, reply });
    const body = readbackComment({ answer: a.answer, rows, via: `#${page.number}` });
    readbacks.push({
      kind: "readback-eric",
      number: a.issue,
      n: a.n,
      title: ask.title,
      criterion: 1,
      why: `his reply on the decisions page #${page.number}`,
      said: saidOf(a.answer),
      body,
      ready: readiesFor(issue, a.answer),
    });
  }
  return {
    kind: "decisions-answer",
    page: page.number,
    replyId: reply.id,
    readbacks,
    unread,
    notes: read.notes,
    why: `reply ${reply.id}: ${readbacks.length} answer(s), ${unread.length} not read`,
  };
}

/**
 * Plan one tick of the page. Inputs are REST shapes: `needsYou` from `plan()`, the `issues` it was
 * planned from (bodies and labels), the `page` issue or null, its `comments`, and the numbers this
 * tick is `closing`. Returns `{ intents, body, state }`: his unread replies as `decisions-answer`
 * intents first, then one `decisions-open` or `decisions-sync`. Pure.
 */
export function planDecisions({
  needsYou = [],
  issues = [],
  page = null,
  comments = [],
  closing = new Set(),
  now,
}) {
  const issueBy = new Map(issues.map((i) => [i.number, i]));
  const askMap = new Map();
  const mergeAsks = [];
  for (const r of needsYou) {
    const issue = issueBy.get(r.number);
    if (r.criterion !== 1 || !issue || closing.has(r.number)) continue;
    const items = parseAsk(issue.body);
    if (!items.length) continue;
    // A merge ask is answered by the merge click, never by a letter here (#7548: "Merge held
    // platter #7424?"): it goes on the held line as a link, and nothing reads a reply as a merge.
    if (items.some((it) => MERGE_ASK.test(it.question))) {
      mergeAsks.push({ number: r.number, title: issue.title });
      continue;
    }
    const rank = askRank({ labels: issue.labels, title: issue.title, decision: r.decision });
    askMap.set(r.number, { issue: r.number, title: issue.title, items, rank });
  }
  const held = [...needsYou.filter((r) => r.criterion === 4), ...mergeAsks];
  const prior = page ? stateOf(page.body) : EMPTY();
  // Entries whose ask left since the page was drawn read as cleared, never as an answerable card.
  const readable = [
    ...prior.entries.map((e) => (askMap.has(e.issue) ? e : { ...e, until: now })),
    ...prior.retired,
  ].map((e) => ({
    ...e,
    card: askMap.has(e.issue) ? { items: askMap.get(e.issue).items.map(cardTwin) } : null,
  }));
  const intents = [];
  const answered = new Set();
  if (page) {
    const done = receiptedIds(comments);
    const since = Date.parse(page.created_at ?? "") || 0;
    const replies = comments
      .filter((c) => isHis(c) && !done.has(c.id) && Date.parse(c.created_at ?? "") >= since)
      .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
    for (const reply of replies) {
      const read = readDecisionsReply(reply.body, {
        entries: readable,
        replyAt: Date.parse(reply.created_at),
      });
      if (!read.referenced) continue; // a note with no number in it is not an answer to anything
      intents.push(answerIntent(reply, read, { page, askMap, issueBy, answered }));
    }
  }
  // An ask answered this tick keeps its number in the STATE until it actually leaves the selector:
  // nothing has confirmed the answer landed yet, and this tick's sync runs even if the answer
  // intent throws or finds its lease busy. Retiring it here made the next tick read his unreceipted
  // reply as "cleared before this was read" and lose the answer (#7957). It is only left off the
  // page he SEES this tick, so his reply clears what he answered at once.
  const state = nextState(prior, [...askMap.values()], now);
  const shown = state.entries.filter((e) => !answered.has(e.issue));
  const ericOn = (page?.assignees ?? []).some((u) => isEric(u?.login ?? u));
  const hasAsks = shown.length > 0 || held.length > 0;
  const assign = hasAsks && !ericOn;
  const unassign = Boolean(page) && !hasAsks && ericOn;
  const ping = pingFor({ state, prior, shown, held, askMap, assign, now });
  const body = renderPage({ state, asks: askMap, held, answered });
  if (!page) {
    if (hasAsks)
      intents.push({
        kind: "decisions-open",
        title: PAGE_TITLE,
        body,
        number: 0,
        why: `${shown.length} open ask(s), ${held.length} held PR(s)`,
      });
  } else if (body !== page.body || assign || unassign || ping) {
    intents.push({
      kind: "decisions-sync",
      number: page.number,
      body: body !== page.body ? body : null,
      assign,
      unassign,
      ping,
      why: `${shown.length} open ask(s), ${held.length} held PR(s)`,
    });
  }
  return { intents, body, state };
}

/**
 * Who hears what this tick: updates `state`'s ping memory and returns the ping comment, or null.
 * The assignment is itself the push, so an `assign` tick records everything as told and posts no
 * ping. Otherwise only what is new — asks never pinged, held PRs not pinged inside a day — and only
 * once per batch window, unless an ask stops bots or production.
 *
 * A held PR due his merge is as much his as a lettered ask (#7317): it keeps him on the page, and a
 * new one is pinged with the next batch. It is remembered a day by PR, not only while listed, so a
 * push that restarts its checks never earns it a second ping the same day.
 */
function pingFor({ state, prior, shown, held, askMap, assign, now }) {
  const heldPinged = prior.heldPinged.filter((h) => now - (Number(h.at) || 0) < HELD_PING_MS);
  const newHeld = held.filter((p) => !heldPinged.some((h) => h.n === p.number));
  const newcomers = shown.filter((e) => !state.pinged.includes(e.issue));
  state.heldPinged = heldPinged;
  const window = batchStart(now) > prior.pingedAt;
  const urgent = newcomers.some((e) => askMap.get(e.issue)?.rank === 1);
  const fresh = newcomers.length > 0 || newHeld.length > 0;
  if (!(assign || (fresh && (urgent || window)))) return null;
  state.pinged = state.entries.map((e) => e.issue);
  heldPinged.push(...newHeld.map((p) => ({ n: p.number, at: now })));
  state.pingedAt = now;
  return assign ? null : pingComment(newcomers, newHeld);
}

/** "#7030 (green 26h, blocks plan #6871)" — a held PR as the ping names it. */
function heldPingItem(p) {
  if (typeof p.hours !== "number") return `#${p.number}`;
  const facts = [
    p.green ? `green ${Math.floor(p.hours)}h` : `open ${Math.floor(p.hours)}h, ${checksWord(p)}`,
  ];
  const what = blocksPhrase(p.blocks);
  if (what) facts.push(`blocks ${what}`);
  return `#${p.number} (${facts.join(", ")})`;
}

/** The once-per-window nudge: only the asks and held PRs he has not been pinged about. */
export function pingComment(newcomers, newHeld = []) {
  const k = newcomers.length;
  const lines = [];
  if (k) {
    const list = newcomers.map((e) => `${e.n} · #${e.issue}`).join(", ");
    lines.push(
      `@${ERIC} — ${k} new decision${k === 1 ? "" : "s"} on this page: ${list}. One reply answers every ask above.`,
    );
  }
  if (newHeld.length) {
    const list = newHeld.map(heldPingItem).join("; ");
    const lead = k ? "And" : `@${ERIC} —`;
    // "Ready" is a claim about checks: only when no PR in the list is known red or unread (#8212).
    const state = newHeld.some((p) => p.green === false) ? "waiting on" : "ready for";
    lines.push(
      `${lead} ${newHeld.length} held PR${newHeld.length === 1 ? "" : "s"} ${state} your merge: ${list}. Each is one click on its PR; on silence it stays open.`,
    );
  }
  return [lines.join("\n\n"), "", PING_MARKER, "", FOOTER].join("\n");
}
