// THE TOP OF A DESIGN ROUND'S OWN PAGE (#5143) — the round, its issue, the question count, and one
// line saying what to do, with the how-to folded under it. Moved out of render.mjs (which re-exports
// these names) when the round page's intro was cut down, so render stays under the size cap.
//
// WHY ONE LINE: Eric, 2026-10-14: "I feel I have A.D.H.D. and am easily distracted thus will tend to
// prefer simple and elegant design that is free of distraction making it easier to remain focused
// and on task." The intro had grown to about 85 words before the first picture — how pins lead, what
// each button does, how marks work, that comments count. Now the page opens on ROUND_LINE (twenty
// words at most), and the rest sits under "How this page works", one tap away, word for word as it
// was, so nothing he relied on is gone.
//
// Pure: render.mjs calls roundHeaderHtml; the specs assert on the strings.
import { FOCUS_HOW, hasFocus } from "./focus.mjs";
import { DAY, e, ext, plural } from "./html.mjs";
import { isOpening, MARK_INTRO } from "./marks.mjs";
import { hasPins, pinIntro } from "./pins.mjs";

/** The page's intro line: a comment sent to Claude is read back and quoted beside the taps
 *  (.claude/skills/steer/SKILL.md step 7; readback.mjs --comments). */
export const COMMENTS_COUNT =
  "Comments you send to Claude count too — they're quoted on the issue with your answers.";

/** A round page's one line above its first picture: what to do, in twenty words or fewer. */
export const ROUND_LINE = {
  design: "Tap any spot on a picture to say what you think, then mark the shape closest to right.",
  problems: "Tap any spot on a picture to say what you think, then pick one problem to fix first.",
  opening:
    "Mark today's screen first, then show what Claude found and pick one problem to fix first.",
};
/** The folded how-to's summary, under the one line. */
export const HOW_SUMMARY = "How this page works";

/** How a round page asks (docs/process/REDESIGN.md): his pinned comments lead, the taps follow.
 *  Keyed like VERBS: a round of shapes, or round 0's problems, where a pick builds nothing. Folded
 *  under "How this page works", with the pins', marks', focus and comments' lines. */
export const ROUND_INTRO = {
  design:
    "Pin a comment on the spot a shape should change; your comments lead and the buttons follow. " +
    "Mark More of this on the one closest to right, or Build this when it is ready to build.",
  problems:
    "Pin a comment on the spot a problem shows; your comments lead and the buttons follow. " +
    "Mark Fix this first on one problem: a pick chooses what the next round draws, and nothing " +
    "is built from it.",
  // A round that opens on clean frames (marks.mjs): his eye first, Claude's list after.
  opening:
    "Start with today's screen as it is, before Claude's problems. Then show what Claude found " +
    "and mark Fix this first on one problem: a pick chooses what the next round draws, and " +
    "nothing is built from it.",
};

/** The folded how-to, in the order a first visit needs it: how the round asks, the pins, the
 *  marks, a focus when a picture has one, and that comments count. Every part is this module's or
 *  a sibling's own constant — no manifest text — so it is written as is. */
function howTo(tp, kind) {
  const first = tp.decisions[0];
  const pinned = tp.decisions.find(hasPins);
  // An opening round's intro already says how its pins come later; it adds only the marks' line.
  return [
    ROUND_INTRO[kind],
    pinned && !isOpening(first) ? pinIntro(pinned) : "",
    MARK_INTRO,
    tp.decisions.some(hasFocus) ? FOCUS_HOW : "",
    COMMENTS_COUNT,
  ]
    .filter(Boolean)
    .join(" ");
}

/** A design round's own page (#5143): the round, its issue, the question count — nothing else. */
export function roundHeaderHtml(tp) {
  const n = tp.decisions.length;
  const issues = tp.issues
    .map((x) => `<a href="https://github.com/${e(tp.repo)}/issues/${x}" ${ext}>#${x}</a>`)
    .join(" · ");
  const round = tp.round != null ? `Design round ${e(tp.round)}` : "Design round";
  // One page asks one kind (design.mjs `designRound` refuses a mix), so its first decision says.
  const first = tp.decisions[0];
  const kind = isOpening(first) ? "opening" : first?.problems ? "problems" : "design";
  const date = tp.generatedAt ? ` · ${e(DAY.format(new Date(tp.generatedAt)))}` : "";
  const drawn = tp.needsPictures ?? [];
  const drawing = drawn.length
    ? `<p class="muted" id="drawing">${plural(drawn.length, "decision")} ${drawn.length === 1 ? "is" : "are"} still being drawn: ${drawn.map((x) => e(x.title)).join(" · ")}. Nothing is asked here without a picture.</p>`
    : "";
  const toc =
    n > 1
      ? `<ol class="toc">${tp.decisions.map((d) => `<li><a href="#d-${e(d.key)}">${e(d.title)}</a></li>`).join("")}</ol>`
      : "";
  return (
    `<header class="top"><p class="eyebrow">${round} · ${issues}${date}</p>` +
    `<h1>${n ? `${plural(n, "decision")}, about ${tp.budget.used} minutes` : "Nothing to answer yet"}</h1>` +
    (n
      ? `<p class="lede" id="intro">${ROUND_LINE[kind]}</p>` +
        `<details class="how"><summary>${HOW_SUMMARY}</summary><p>${howTo(tp, kind)}</p></details>`
      : "") +
    toc +
    drawing +
    `</header>`
  );
}
