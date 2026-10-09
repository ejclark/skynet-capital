// Page-side text measurements for the member study (#4943) — run inside the page via
// `page.evaluate`, MEASURE only; the oracle (oracle.mjs) judges what they return.
//
// WHY: a task is graded on a fact the member reports AND on the place that fact lives having been
// on screen — not in the DOM, not under the sticky head, not past a clipped box's edge. So every
// frame records, for each watched snippet (a task's `answerRegion`), how much of it was inside the
// viewport. `textTarget` is the scripted actor's finger: the on-screen centre of a visible text,
// so a no-model script survives a layout change between two builds where pixel taps would not.
//
// Matching is case-blind and WHITESPACE-blind: "ABC" and "-$12" in two inline spans read as one
// "ABC -$12" to a person, and their textContent joins them with no space at all. The match is the
// DEEPEST element whose text holds the snippet. Self-contained functions: they are serialised into
// the page, so no imports and no closure over module scope.

/**
 * For each snippet: the best `ratio` (0–1) of its text's line boxes inside the viewport, cut to
 * every ancestor that clips overflow, and whether what sits at the visible part's centre is
 * something else (`covered` — a sticky bar or an overlay on top of it). A hidden match counts 0.
 * The native picker's stand-in (measure-picker.mjs, outside <body>) is searched too — an option a
 * member reads in its list is seen — and a desktop dropdown's clear backdrop is looked through.
 */
export function seenText(snippets) {
  const squash = (s) => (s ?? "").toLowerCase().replace(/\s+/g, "");
  // The matched element's OWN overflow clips its text too: a screen-reader-only label
  // (`.visually-hidden` — a 1px box, overflow hidden) holds its text in line boxes far wider than
  // the 1px it shows, so skipping the element itself would measure the label as fully seen.
  const clipBoxes = (el) => {
    const boxes = [{ left: 0, top: 0, right: innerWidth, bottom: innerHeight }];
    for (let a = el; a; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible")
        boxes.push(a.getBoundingClientRect());
      if (cs.position === "fixed") break;
    }
    return boxes;
  };
  /** One line box cut to every clip: its visible area and that part's centre. */
  const cut = (r, clips) => {
    let [l, t, rr, b] = [r.left, r.top, r.right, r.bottom];
    for (const c of clips) {
      [l, t] = [Math.max(l, c.left), Math.max(t, c.top)];
      [rr, b] = [Math.min(rr, c.right), Math.min(b, c.bottom)];
    }
    return { vis: Math.max(0, rr - l) * Math.max(0, b - t), x: (l + rr) / 2, y: (t + b) / 2 };
  };
  const measureOne = (el) => {
    const shown =
      typeof el.checkVisibility !== "function" ||
      el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
    if (!shown) return { ratio: 0, covered: false };
    const range = document.createRange();
    range.selectNodeContents(el);
    const clips = clipBoxes(el);
    let total = 0;
    let inside = 0;
    let best = null;
    for (const r of range.getClientRects()) {
      if (r.width * r.height <= 0) continue;
      total += r.width * r.height;
      const part = cut(r, clips);
      inside += part.vis;
      if (part.vis > 0 && (!best || part.vis > best.vis)) best = part;
    }
    if (total === 0) return { ratio: 0, covered: false };
    const hit = best
      ? document
          .elementsFromPoint(best.x, best.y)
          .find((h) => !h.matches('[data-study-backdrop="clear"]'))
      : null;
    const covered = Boolean(best) && !(hit && (el.contains(hit) || hit.contains(el)));
    return { ratio: Math.round((inside / total) * 100) / 100, covered };
  };
  return snippets.map((text) => {
    const want = squash(text);
    let found = { ratio: 0, covered: false, matched: false };
    if (!want) return { text, ...found };
    const deepest = [...document.querySelectorAll("body *, [data-study-overlay] *")].filter(
      (el) =>
        !el.closest("script, style, noscript") &&
        squash(el.textContent).includes(want) &&
        ![...el.children].some((c) => squash(c.textContent).includes(want)),
    );
    for (const el of deepest) {
      const m = { ...measureOne(el), matched: true };
      const better = (m.covered ? 0 : m.ratio) > (found.covered ? 0 : found.ratio);
      if (!found.matched || better) found = m;
    }
    return { text, ...found };
  });
}

/**
 * The scripted actor's finger: the centre of the visible, uncovered on-screen box of the deepest
 * element whose text is exactly `text` (case- and whitespace-blind), or null when none is fully on
 * screen. `nth` picks among several (0 = first in document order).
 */
export function textTarget([text, nth = 0]) {
  const squash = (s) => (s ?? "").toLowerCase().replace(/\s+/g, "");
  const want = squash(text);
  const hits = [];
  // The native picker's stand-in sits outside <body> (measure-picker.mjs): a script taps its rows.
  for (const el of document.querySelectorAll("body *, [data-study-overlay] *")) {
    if (squash(el.textContent) !== want) continue;
    if ([...el.children].some((c) => squash(c.textContent) === want)) continue;
    const r = el.getBoundingClientRect();
    const inside =
      r.width > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
    if (!inside) continue;
    const x = Math.round(r.left + r.width / 2);
    const y = Math.round(r.top + r.height / 2);
    const top = document.elementFromPoint(x, y);
    if (top && (el.contains(top) || top.contains(el))) hits.push({ x, y });
  }
  return hits[nth] ?? null;
}
