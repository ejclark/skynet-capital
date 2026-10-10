// STEER SECTIONS — what shipped, the queue and the 14-day strip, as HTML (#5056). Pure.
//
// Hue never carries meaning alone here (docs/BRAND.md → Accessibility): the strip draws day
// builds solid and night builds hatched, and the legend says which is which in words.
import { buttons, e, ext, note, plural, VERBS, when } from "./html.mjs";

const KIND_WORDS = {
  feat: "feature",
  fix: "fix",
  docs: "docs change",
  chore: "chore",
  refactor: "refactor",
  test: "test change",
  ci: "CI change",
  perf: "speed-up",
};
const kindWords = (k, n) => plural(n, KIND_WORDS[k] ?? k, k === "fix" ? "fixes" : undefined);
/** "fix(profile): say a bot is running" → { kind: "fix · profile", text: "say a bot is running" }. */
function splitSubject(subject) {
  const m = /^([a-z]+)(?:\(([^)]+)\))?!?:\s*(.+)$/.exec(subject ?? "");
  return m
    ? { kind: m[2] ? `${m[1]} · ${m[2]}` : m[1], text: m[3] }
    : { kind: "", text: subject ?? "" };
}

function shipItem(h, img, withPictures) {
  const pics = withPictures
    ? h.shots
        .slice(0, 2)
        .map((s) => {
          const src = img(s);
          const name = s.path.split("/").at(-1);
          return src
            ? `<a class="shot desk" href="${e(s.url)}" ${ext}><img src="${e(src)}" alt="Screenshot ${e(name)} from #${h.number}" loading="lazy"></a>`
            : `<a href="${e(s.url)}" ${ext}>${e(name)}</a>`;
        })
        .join("")
    : "";
  const s = splitSubject(h.subject);
  return (
    `<div class="ship"><div class="row"><span class="num">#${h.number}</span><span class="kind">${e(s.kind)}</span><span>${e(s.text)}</span></div>` +
    (h.because ? `<p class="because">“${e(h.because)}”</p>` : "") +
    (pics ? `<div class="pics">${pics}</div>` : "") +
    buttons(VERBS.reel, { sec: "reel", key: h.number }) +
    note({ sec: "reel", key: h.number, label: "What to look at again", reveal: true }) +
    `</div>`
  );
}

export function reelHtml(reel, img) {
  const withPics = reel.headlines.filter((h) => h.shots.some((s) => img(s))).slice(0, 3);
  const rest = reel.headlines.filter((h) => !withPics.includes(h));
  const kinds = Object.entries(reel.more.byKind)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => kindWords(k, n))
    .join(" · ");
  const counts = [
    reel.more.total ? `${reel.more.total} more: ${kinds}.` : "",
    reel.research ? `${plural(reel.research, "research PR")}, counted and not shown.` : "",
    reel.builds
      ? `${plural(reel.builds, "build")} came from the build lanes.`
      : "None came from the build lanes.",
  ].filter(Boolean);
  const body = reel.merged
    ? `<div class="pairs">${withPics.map((h) => shipItem(h, img, true)).join("")}</div>` +
      (rest.length
        ? `<div class="shiplist">${rest.map((h) => shipItem(h, img, false)).join("")}</div>`
        : "") +
      `<p class="counts">${e(counts.join(" "))}</p>`
    : `<p class="muted">Nothing merged since then.</p>`;
  return `<section class="block" id="shipped"><h2>What shipped since ${e(when(reel.since))}</h2>${body}</section>`;
}

export function queueHtml(q, next) {
  const head = `<h2>Queued until ${e(next.label)}</h2>`;
  const dial = `<a href="${e(q.dialLink)}" ${ext}>change the dial on GitHub</a>`;
  if (q.halt) {
    return `<section class="block" id="queue">${head}<p class="halt">Work is halted: nothing builds and nothing is queued until the dial moves (${dial}).</p></section>`;
  }
  const pick = q.nextPick?.admit
    ? `next to start: #${q.nextPick.number}`
    : `nothing starts right now (${e(q.nextPick?.reason ?? "unknown")})`;
  const items = q.items
    .map(
      (it) =>
        `<li class="qi"><div class="row"><span class="num">#${it.number}</span><span>${e(it.title)}</span>` +
        `<span class="tag plain">${e(it.cls ?? "not ranked")}</span></div><p class="muted">${e(it.why)}</p>` +
        buttons(VERBS.queue, { sec: "queue", key: it.number }) +
        note({ sec: "queue", key: it.number, label: "Why (optional)", reveal: true }) +
        `</li>`,
    )
    .join("");
  return (
    `<section class="block" id="queue">${head}<p class="lede">${plural(q.items.length, "item")} ready to build over the next ~${next.hours}h · ` +
    `${q.inFlightCap} at a time at the dial's ${e(q.position)} setting · ${pick} · ${dial}.</p>` +
    (items
      ? `<ol class="queue">${items}</ol>`
      : `<p class="muted">Nothing is ready to build. A decision above is the way to queue more.</p>`) +
    `</section>`
  );
}

export function stripHtml(s) {
  const max = Math.max(1, ...s.days.map((d) => d.day + d.night));
  const px = (n) => Math.round((n / max) * 80);
  const cols = s.days
    .map((d) => {
      const seg = (n, cls) => (n ? `<div class="seg ${cls}" style="height:${px(n)}px"></div>` : "");
      return `<div class="col" title="${d.date}: ${d.day} by day, ${d.night} at night"><span class="n">${d.day + d.night}</span>${seg(d.night, "night")}${seg(d.day, "day")}<span class="d">${Number(d.date.slice(8))}</span></div>`;
    })
    .join("");
  const mins = s.pages.length ? s.pages.map((p) => p.minutes).join(" · ") : "—";
  const fact = (b, t) => `<div class="fact"><b>${e(b)}</b>${e(t)}</div>`;
  return (
    `<section class="block" id="progress"><h2>The last 14 days</h2>` +
    `<p class="lede">Plan and feedback builds the GitHub App merged: ${s.perDay} a day, ${s.perNight} of them at night.</p>` +
    `<div class="chart" role="img" aria-label="Builds merged per day for 14 days, split day and night">${cols}</div>` +
    `<div class="legend"><span><i class="key seg day"></i>Day, 8am–4pm (solid)</span><span><i class="key seg night"></i>Night, 4pm–8am (hatched)</span></div>` +
    `<div class="facts">${fact(s.needsYou, "decisions need you now")}${fact(s.medianWaitDays ?? "—", "median days a decision waited for your answer")}` +
    `${fact(mins, "your active minutes on recent pages")}${fact(s.unstated, "issues waiting on you with no stated decision")}</div></section>`
  );
}
