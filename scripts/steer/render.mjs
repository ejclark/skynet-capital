// STEER RENDER — tp.json → the page's HTML (#5056). Pure: build.mjs does the file work, and the
// specs (tests/scripts/steer-page.spec.ts) assert on this string directly.
//
// Order at 390px, per the plan: the budget line · up to 3 "what shipped" pairs · the decisions ·
// queued until the next page · the 14-day strip · Done (in the fixed bar). Page text names each
// thing by what it does; no invented labels (CLAUDE.md → "No coined names").
import { readFileSync } from "node:fs";
import { FOCUS_CLIENT } from "./focus.mjs";
import { buttons, DAY, e, ext, note, plural, VERBS, when } from "./html.mjs";
import {
  cleanShots,
  isOpening,
  MARK_CLIENT,
  markableShot,
  OPENING_LINE,
  REVEAL_SHOW,
} from "./marks.mjs";
import { OUTCOME_CLIENT, outcomesControl } from "./outcomes.mjs";
import { PAGE_NOTE_CLIENT } from "./page-notes.mjs";
import { hasPins, PIN_CLIENT, pinnedShot } from "./pins.mjs";
import {
  COMMENTS_COUNT,
  HOW_SUMMARY,
  ROUND_INTRO,
  ROUND_LINE,
  roundHeaderHtml,
} from "./round-header.mjs";
import { scopeHtml, servesHtml } from "./scope.mjs";
import { queueHtml, reelHtml, stripHtml } from "./sections.mjs";

// The round page's header and its words live in round-header.mjs; the page's words stay readable
// from here, where the specs and the steer skill have always found them.
export { COMMENTS_COUNT, HOW_SUMMARY, ROUND_INTRO, ROUND_LINE };

/** The artifact's name: stable across every republish, so the gallery card never changes. */
export const TITLE = "Skynet Steering";
const CSS = readFileSync(new URL("./page.css", import.meta.url), "utf8");
// The pin reactions' script defines `steerPins`, the listening line's `steerEar`, the marks'
// `steerMarks`, a round's focus `steerFocus`, the added outcomes `steerOutcomes` and the page
// notes' `steerPageNotes`; the page script calls each (pins-client.js, ear-client.js,
// marks-client.js, focus-client.js, outcomes-client.js, page-notes-client.js).
const CLIENT = [
  "./pins-client.js",
  "./ear-client.js",
  "./marks-client.js",
  "./focus-client.js",
  "./outcomes-client.js",
  "./page-notes-client.js",
  "./page-client.js",
]
  .map((f) => readFileSync(new URL(f, import.meta.url), "utf8"))
  .join("\n");

/** The pictures of one holder. `at` names the holder (its decision key and option, or "today"),
 *  so a picture with pins gets a button on each badge (pins.mjs); on a design round's own page
 *  (`at.markable`) every frame is a box a tap marks (marks.mjs), never a link. */
function shots(pictures, img, issue, at) {
  const h = pictures
    .map((p) => {
      const src = img(p);
      if (!src) return "";
      if (p.pins?.length) return pinnedShot(p, src, at);
      const size = p.size === "phone" ? "phone" : "desk";
      if (at.markable)
        return markableShot(size, src, p.alt, {
          ...at,
          focus: p.focus,
          ratio: p.ratio,
          areas: p.areas,
        });
      return `<a class="shot ${p.size === "phone" ? "phone" : "desk"}" href="${e(src)}" ${ext}><img src="${e(src)}" alt="${e(p.alt)}" loading="lazy"></a>`;
    })
    .join("");
  return h || `<p class="muted">No picture for this one; the write-up is on #${issue}.</p>`;
}

/** A problem that names its pin on Today's frame (`pin`): a compact row, no pictures, labelled
 *  with its pin number. Only "Fix this first": the pin itself carries yes / not / partly. */
function pinRowHtml(d, o) {
  const tag = o.recommended ? ' <span class="tag">recommended</span>' : "";
  const delta = o.delta ? `<p class="delta"><b>The problem:</b> ${e(o.delta)}</p>` : "";
  return (
    `<article class="opt pinrow" id="d-${e(d.key)}-${e(o.key)}"><div class="side"><h4 class="oname">` +
    `<span class="okey">Pin ${e(o.pin)}</span>${e(o.name)}${tag}</h4>${delta}${servesHtml(o.serves)}` +
    `${buttons([VERBS.problems[0]], { sec: "decisions", key: d.key, opt: o.key })}</div></article>`
  );
}

/** Today's row: its pictures, whether they are real, and its caption. Problems that name their
 *  pin on Today's frame (`pinRows`) sit in its side panel, so at desktop width each one reads
 *  beside the frame its pin is on, and at phone width right under it. */
function todayHtml(d, img, markable, pinRows = "") {
  const src = `<span class="tag plain">${d.today.real ? "real screenshot" : "mockup of today"}</span>`;
  const at = { key: d.key, option: "today", markable };
  const rows = pinRows ? `<div class="pinrows">${pinRows}</div>` : "";
  return (
    `<article class="opt today"><div class="pics">${shots(d.today.pictures, img, d.issue, at)}</div>` +
    `<div class="side"><h4 class="oname"><span class="okey">Today</span>${src}</h4><p>${e(d.today.caption)}</p>${rows}</div></article>`
  );
}

/** Is this option a problem drawn as a row on Today's frame, with no pictures of its own? */
const isPinRow = (d, o) => Boolean(d.problems && o.pin != null && !o.pictures?.length);

/** One option's row: its pictures (a design question's), its name and change, its buttons. */
function optionHtml(d, o, img, markable) {
  const verbs = VERBS[d.problems ? "problems" : d.kind === "design" ? "design" : "fork"];
  const said = d.problems ? "The problem:" : "Changes:";
  const tag = o.recommended ? ' <span class="tag">recommended</span>' : "";
  const at = { key: d.key, option: o.key, markable };
  const pics =
    d.kind === "design"
      ? `<div class="pics">${shots(o.pictures ?? [], img, d.issue, at)}</div>`
      : "";
  const delta = o.delta ? `<p class="delta"><b>${said}</b> ${e(o.delta)}</p>` : "";
  return (
    `<article class="opt" id="d-${e(d.key)}-${e(o.key)}">${pics}<div class="side"><h4 class="oname"><span class="okey">Option ${e(o.key)}</span>${e(o.name)}${tag}</h4>` +
    `${delta}${servesHtml(o.serves)}${d.irreversible ? "" : buttons(verbs, { sec: "decisions", key: d.key, opt: o.key })}</div></article>`
  );
}

function optionsHtml(d, img, markable) {
  // A problem that names its pin sits beside Today's frame; with no Today it keeps its own row.
  const beside = d.today ? d.options.filter((o) => isPinRow(d, o)) : [];
  const rows = [
    ...(d.today ? [todayHtml(d, img, markable, beside.map((o) => pinRowHtml(d, o)).join(""))] : []),
    ...d.options
      .filter((o) => !beside.includes(o))
      .map((o) => (isPinRow(d, o) ? pinRowHtml(d, o) : optionHtml(d, o, img, markable))),
  ];
  return rows.length ? `<div class="opts">${rows.join("")}</div>` : "";
}

/** The control row a decision gets: option buttons, one decision-level row, or a GitHub link. */
function controls(d) {
  if (d.irreversible) {
    const what = d.isPr ? "merge it" : "act on it";
    return `<p class="gh"><a href="${e(d.link)}" ${ext}>Open #${d.issue} on GitHub to ${what}</a> — this page never merges, sets surge or touches a protected path; that is yours to do there.</p>`;
  }
  if (d.options.length) return "";
  const set =
    d.kind === "approve" ? VERBS.approve : d.recommendation ? VERBS.forkRec : VERBS.forkWhole;
  return buttons(set, { sec: "decisions", key: d.key });
}

/** What a decision asks, as the page names it: its kind, or "problems" for a round-0 question. */
const asks = (d) => (d.problems ? "problems" : d.kind);

/** An opening question (marks.mjs): Today's frames clean, to mark first; Claude's problems — the
 *  pinned frame and the rows — folded under "Show what Claude found" until he presses it. The
 *  glyph turns with the region (▸ folded, ▾ open), so the state is a shape and words, not colour.
 *  Claude's call (`call`: the recommendation and its evidence) folds away with them — a
 *  "Recommended: …" above the clean frames would name a problem before he has looked. */
function openingHtml(d, img, call) {
  const k = e(d.key);
  return (
    `<div class="opening"><p class="stage">${OPENING_LINE}</p><div class="pics">${cleanShots(d, img)}</div></div>` +
    `<button type="button" class="revealer" id="reveal-${k}" data-key="${k}" aria-expanded="false" ` +
    `aria-controls="found-${k}"><span class="rg" aria-hidden="true">▸</span> <span class="rw">${REVEAL_SHOW}</span></button>` +
    `<div class="found" id="found-${k}" hidden>${call}${optionsHtml(d, img, true)}</div>`
  );
}

/** A decision's scope, and on a round's own page the outcomes he adds under it (outcomes.mjs) —
 *  there even with no scope, so he can say what the screen should reach. */
const scopeBlock = (d, markable) => scopeHtml(d.scope, markable ? outcomesControl(d) : "");

function decisionHtml(d, i, total, img, markable) {
  const rec = d.recommendation;
  const recLine = rec
    ? `<p class="recline">Recommended: <b>${e(rec.label)}</b>${rec.confidence ? ` <span class="muted">· ${e(rec.confidence)} confidence</span>` : ""}</p>`
    : "";
  const changes = d.changes
    ? `<p class="changes"><b>Changes an earlier call:</b> ${e(d.changes)}</p>`
    : "";
  const dflt = d.default && !d.irreversible ? `<p><b>Default:</b> ${e(d.default)}</p>` : "";
  const skip = String(d.skip ?? "").replace(/^If you skip:\s*/, "");
  const ev =
    rec && (rec.saw?.length || rec.wrongIf)
      ? `<details class="ev"><summary>What the evidence says, and what would prove the recommendation wrong</summary>` +
        `<ul>${(rec.saw ?? []).map((s) => `<li>${e(s)}</li>`).join("")}</ul>${rec.wrongIf ? `<p><b>Wrong if:</b> ${e(rec.wrongIf)}</p>` : ""}</details>`
      : "";
  const age = d.ageDays != null ? ` · waiting ${plural(d.ageDays, "day")}` : "";
  const opening = isOpening(d) && markable;
  return (
    `<section class="dec" id="d-${e(d.key)}" data-kind="${d.kind}">` +
    `<div class="dhead"><p class="eyebrow">Decision ${i + 1} of ${total} · ${asks(d)} · about ${d.minutes} min · ` +
    `<a href="${e(d.link)}" ${ext}>#${d.issue}</a>${d.cls ? ` · ${e(d.cls)}` : ""}${age}</p>` +
    `<h3>${e(d.title)}</h3>${scopeBlock(d, markable)}${d.ask ? `<p class="ask">${e(d.ask)}</p>` : ""}${opening ? "" : recLine}${changes}${dflt}` +
    `<p class="skip"><b>If you skip:</b> ${e(skip)}</p></div>` +
    `${opening ? openingHtml(d, img, recLine + ev) : optionsHtml(d, img, markable)}${controls(d)}${opening ? "" : ev}` +
    note({
      sec: "decisions",
      key: d.key,
      label: "Your note, in your words (optional) — it is quoted on the issue word for word",
    }) +
    `</section>`
  );
}

/** The page's summary line: the decisions asked now, and — counted apart — the ones being drawn. */
function headline(n, minutes, drawn) {
  const more = drawn ? ` <span class="muted">· ${drawn} more being drawn</span>` : "";
  if (n) return `${plural(n, "decision")}, about ${minutes} minutes${more}`;
  return drawn ? `Nothing to answer yet${more}` : "Nothing needs a decision this time";
}

function headerHtml(tp) {
  const n = tp.decisions.length;
  const page = tp.slot === "am" ? "Morning page" : "Evening page";
  const date = DAY.format(new Date(`${tp.date}T18:00:00Z`));
  const toc = tp.decisions
    .map(
      (d) =>
        `<li><a href="#d-${e(d.key)}">${e(d.title)}</a> <span class="meta">${asks(d)} · ${d.minutes} min</span></li>`,
    )
    .join("");
  const rolled = tp.deferred.length
    ? `<p class="muted">${plural(tp.deferred.length, "more decision")} roll to the next page: ${tp.deferred.map((x) => `${e(x.title)} (#${x.issue})`).join(" · ")}.</p>`
    : "";
  const drawn = tp.needsPictures ?? [];
  const drawing = drawn.length
    ? `<p class="muted" id="drawing">${plural(drawn.length, "decision")} ${drawn.length === 1 ? "is" : "are"} being drawn and come${drawn.length === 1 ? "s" : ""} next page: ${drawn.map((x) => `${e(x.title)} (#${x.issue})`).join(" · ")}. Nothing is asked here without a picture.</p>`
    : "";
  const unstated = tp.unstated.count
    ? `<p class="muted">${plural(tp.unstated.count, "issue")} carry the waiting-on-you label but state no decision (${tp.unstated.numbers.map((x) => `#${x}`).join(", ")}). They are not asked here: each gets a stated decision or loses the label.</p>`
    : "";
  return (
    `<header class="top"><p class="eyebrow">${page} · ${e(date)} · next page ${e(tp.next.label)}</p>` +
    (tp.queue.halt
      ? `<p class="halt">Work is halted. Nothing is queued until the dial moves.</p>`
      : "") +
    `<h1>${headline(n, tp.budget.used, drawn.length)}</h1>` +
    `<p class="lede">${plural(tp.reel.merged, "PR")} merged since ${e(when(tp.reel.since))} · ${plural(tp.queue.items.length, "item")} queued until ${e(tp.next.label)} · the dial reads ${e(tp.queue.position)}</p>` +
    (n ? `<p class="lede" id="intro">${COMMENTS_COUNT}</p>` : "") +
    (toc ? `<ol class="toc">${toc}</ol>` : "") +
    rolled +
    drawing +
    unstated +
    `</header>`
  );
}

const emptyDecisions = (tp) =>
  tp.designOnly
    ? '<p class="muted">Every decision in this round is still being drawn. Press Done to say you looked.</p>'
    : tp.needsPictures?.length
      ? '<p class="muted">Every decision this time is still being drawn; they come next page. Press Done to say you looked.</p>'
      : '<p class="muted">Nothing waits on you. Press Done to say you looked.</p>';

/** The whole page. `img(picture)` returns the published path of a picture, or null for none.
 *  A design round's own page (`designOnly`, design.mjs `designRound`) carries its header, its
 *  questions and the bar — no reel, no queue, no strip. */
export function renderPage(tp, { img = (p) => p.local ?? null } = {}) {
  const round = Boolean(tp.designOnly);
  const data = {
    id: tp.id,
    shown: tp.decisions.map((d) => d.key),
    decisions: tp.decisions.map((d) => ({
      key: d.key,
      kind: d.kind,
      ...(d.problems ? { problems: true } : {}),
      ...(round && isOpening(d) ? { opening: true } : {}),
      issue: d.issue,
      title: d.title,
    })),
    // A design round's own page takes marks on every frame, and they ride the pins' popover, so
    // it carries the pins' words even with no pin drawn; and its bar takes notes about the page.
    ...(round || tp.decisions.some(hasPins) ? { pins: PIN_CLIENT } : {}),
    ...(round
      ? {
          marks: MARK_CLIENT,
          pageNotes: PAGE_NOTE_CLIENT,
          focus: FOCUS_CLIENT,
          outcomes: OUTCOME_CLIENT,
        }
      : {}),
  };
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  const decisions = tp.decisions
    .map((d, i) => decisionHtml(d, i, tp.decisions.length, img, round))
    .join("");
  // Notes about the page itself (page-notes.mjs): a toggle, then the count of notes already left.
  const pageNote = round
    ? `<button type="button" class="ghost" id="pnote" aria-pressed="false">${e(PAGE_NOTE_CLIENT.label)}</button>` +
      `<span class="pncount" id="pnote-count" aria-live="polite" hidden></span>`
    : "";
  return [
    `<title>${e(round ? tp.title : TITLE)}</title>`,
    `<style>\n${CSS}</style>`,
    `<div class="page">`,
    round ? roundHeaderHtml(tp) : headerHtml(tp),
    round ? "" : reelHtml(tp.reel, img),
    `<section class="block" id="decisions"><h2>Decisions</h2>${decisions || emptyDecisions(tp)}</section>`,
    round ? "" : queueHtml(tp.queue, tp.next),
    round ? "" : stripHtml(tp.strip),
    `</div>`,
    // The bar's two lines: what the store holds, then what became of Done — sent to Claude or not,
    // and the read-back once the session posts it (#5135). Reopen is its own control: Done is one way.
    // Under them, whether a Claude session is listening, from its own stamp (ear-client.js).
    `<div class="bar" role="region" aria-label="Save and finish"><div class="lines">` +
      `<output id="save-state" aria-live="polite" data-state="loading">Loading your answers…</output>` +
      `<p id="told" aria-live="polite" hidden></p>` +
      `<p id="ear" aria-live="polite" data-state="unknown" hidden></p></div><div class="acts">` +
      pageNote +
      `<button type="button" class="ghost" id="copy" hidden>Copy as text</button>` +
      `<button type="button" class="reopen" id="reopen" hidden>Reopen</button>` +
      `<button type="button" class="rb" id="done" data-v="done" aria-pressed="false">I'm done</button></div></div>`,
    `<script type="application/json" id="tp-data">${json}</script>`,
    `<script>\n${CLIENT.replace(/<\/script/gi, "<\\/script")}</script>`,
    "",
  ].join("\n");
}
