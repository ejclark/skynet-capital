// STEER RENDER — tp.json → the page's HTML (#5056). Pure: build.mjs does the file work, and the
// specs (tests/scripts/steer-page.spec.ts) assert on this string directly.
//
// Order at 390px, per the plan: the budget line · up to 3 "what shipped" pairs · the decisions ·
// queued until the next page · the 14-day strip · Done (in the fixed bar). Page text names each
// thing by what it does; no invented labels (CLAUDE.md → "No coined names").
import { readFileSync } from "node:fs";
import { buttons, DAY, e, ext, note, plural, VERBS, when } from "./html.mjs";
import { queueHtml, reelHtml, stripHtml } from "./sections.mjs";

/** The artifact's name: stable across every republish, so the gallery card never changes. */
export const TITLE = "Skynet Steering";
const CSS = readFileSync(new URL("./page.css", import.meta.url), "utf8");
const CLIENT = readFileSync(new URL("./page-client.js", import.meta.url), "utf8");

function shots(pictures, img, issue) {
  const h = pictures
    .map((p) => {
      const src = img(p);
      if (!src) return "";
      return `<a class="shot ${p.size === "phone" ? "phone" : "desk"}" href="${e(src)}" ${ext}><img src="${e(src)}" alt="${e(p.alt)}" loading="lazy"></a>`;
    })
    .join("");
  return h || `<p class="muted">No picture for this one; the write-up is on #${issue}.</p>`;
}

function optionsHtml(d, img) {
  const rows = [];
  if (d.today) {
    const src = `<span class="tag plain">${d.today.real ? "real screenshot" : "mockup of today"}</span>`;
    rows.push(
      `<article class="opt today"><div class="pics">${shots(d.today.pictures, img, d.issue)}</div>` +
        `<div class="side"><h4 class="oname"><span class="okey">Today</span>${src}</h4><p>${e(d.today.caption)}</p></div></article>`,
    );
  }
  for (const o of d.options) {
    const tag = o.recommended ? ' <span class="tag">recommended</span>' : "";
    const pics =
      d.kind === "design" ? `<div class="pics">${shots(o.pictures ?? [], img, d.issue)}</div>` : "";
    const delta = o.delta ? `<p class="delta"><b>Changes:</b> ${e(o.delta)}</p>` : "";
    rows.push(
      `<article class="opt" id="d-${e(d.key)}-${e(o.key)}">${pics}<div class="side"><h4 class="oname"><span class="okey">Option ${e(o.key)}</span>${e(o.name)}${tag}</h4>` +
        `${delta}${d.irreversible ? "" : buttons(VERBS[d.kind === "design" ? "design" : "fork"], { sec: "decisions", key: d.key, opt: o.key })}</div></article>`,
    );
  }
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

function decisionHtml(d, i, total, img) {
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
  return (
    `<section class="dec" id="d-${e(d.key)}" data-kind="${d.kind}">` +
    `<div class="dhead"><p class="eyebrow">Decision ${i + 1} of ${total} · ${d.kind} · about ${d.minutes} min · ` +
    `<a href="${e(d.link)}" ${ext}>#${d.issue}</a> · ${e(d.cls ?? "")}${age}</p>` +
    `<h3>${e(d.title)}</h3>${d.ask ? `<p class="ask">${e(d.ask)}</p>` : ""}${recLine}${changes}${dflt}` +
    `<p class="skip"><b>If you skip:</b> ${e(skip)}</p></div>` +
    `${optionsHtml(d, img)}${controls(d)}${ev}` +
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
        `<li><a href="#d-${e(d.key)}">${e(d.title)}</a> <span class="meta">${d.kind} · ${d.minutes} min</span></li>`,
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
    (toc ? `<ol class="toc">${toc}</ol>` : "") +
    rolled +
    drawing +
    unstated +
    `</header>`
  );
}

const emptyDecisions = (tp) =>
  tp.needsPictures?.length
    ? '<p class="muted">Every decision this time is still being drawn; they come next page. Press Done to say you looked.</p>'
    : '<p class="muted">Nothing waits on you. Press Done to say you looked.</p>';

/** The whole page. `img(picture)` returns the published path of a picture, or null for none. */
export function renderPage(tp, { img = (p) => p.local ?? null } = {}) {
  const data = {
    id: tp.id,
    shown: tp.decisions.map((d) => d.key),
    decisions: tp.decisions.map((d) => ({
      key: d.key,
      kind: d.kind,
      issue: d.issue,
      title: d.title,
    })),
  };
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  const decisions = tp.decisions
    .map((d, i) => decisionHtml(d, i, tp.decisions.length, img))
    .join("");
  return [
    `<title>${TITLE}</title>`,
    `<style>\n${CSS}</style>`,
    `<div class="page">`,
    headerHtml(tp),
    reelHtml(tp.reel, img),
    `<section class="block" id="decisions"><h2>Decisions</h2>${decisions || emptyDecisions(tp)}</section>`,
    queueHtml(tp.queue, tp.next),
    stripHtml(tp.strip),
    `</div>`,
    `<div class="bar" role="region" aria-label="Save and finish"><output id="save-state" aria-live="polite">Loading your saved answers…</output>` +
      `<button type="button" class="ghost" id="copy" hidden>Copy as text</button>` +
      `<button type="button" class="rb" id="done" data-v="done" aria-pressed="false">I'm done</button></div>`,
    `<script type="application/json" id="tp-data">${json}</script>`,
    `<script>\n${CLIENT.replace(/<\/script/gi, "<\\/script")}</script>`,
    "",
  ].join("\n");
}
