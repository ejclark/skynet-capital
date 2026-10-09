// The member study's page side — functions that run INSIDE the page (via `addInitScript` or
// `page.evaluate`) and only MEASURE. Every judgement on what they return is a pure function in
// `metrics.mjs`; this is the split scripts/crawl/phone.mjs set (its `snapshot`), kept here so the
// recorder (`session.mjs`) stays orchestration. What a tap lands on lives in `measure-tap.mjs`.
//
// WHY AN INIT SCRIPT: the things a person feels between two frames — the page scrolling on its own
// 300ms after a tap, a layout shift as a tab re-renders, the URL being replaced — are over before a
// post-action `evaluate` could look. So listeners are installed before the app's own code runs, and
// keep every scroll sample, every layout-shift entry (including `hadRecentInput` ones, which CLS
// drops but which are exactly the shift a tap causes) and every history change, with a timestamp.
// `performance.now()` is used, never `Date`, because the session pins the clock.
//
// Each in-page function is serialised into the page, so it must be self-contained: no imports, no
// closure over module scope. `snapshot` is the one node-side function: it asks them in turn.

/** Init script: install the listeners once per document. */
export function instrument() {
  if (window.__study) return;
  const s = { doc: Math.random().toString(36).slice(2), scroll: [], shifts: [], urls: [] };
  window.__study = s;
  const now = () => Math.round(performance.now());
  addEventListener("scroll", () => s.scroll.push({ t: now(), y: scrollY, x: scrollX }), {
    passive: true,
  });
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        s.shifts.push({
          t: Math.round(e.startTime),
          value: e.value,
          hadRecentInput: e.hadRecentInput,
        });
    }).observe({ type: "layout-shift", buffered: true });
  } catch {
    s.shiftsUnsupported = true;
  }
  for (const k of ["pushState", "replaceState"]) {
    const orig = history[k];
    history[k] = function (...args) {
      const out = orig.apply(this, args);
      s.urls.push({ t: now(), href: location.href, kind: k });
      return out;
    };
  }
  addEventListener("popstate", () =>
    s.urls.push({ t: now(), href: location.href, kind: "popstate" }),
  );
}

/**
 * Where each log stands now, so `since` can return only what came after — plus the scroll position
 * and place at that instant, the start of the path a later `since` measures.
 */
export function marks() {
  const s = window.__study;
  return {
    doc: s.doc,
    scroll: s.scroll.length,
    shifts: s.shifts.length,
    urls: s.urls.length,
    y: Math.round(scrollY),
    at: location.pathname + location.search,
  };
}

/**
 * Everything logged after `mark`, and a fresh mark taken in the same tick (`next`) so consecutive
 * calls tile the log with no gap. A new document (a full load) means everything it holds.
 */
export function since(mark) {
  const s = window.__study;
  const same = s.doc === mark.doc;
  const from = (k) => (same ? mark[k] : 0);
  return {
    reloaded: !same,
    scroll: s.scroll.slice(from("scroll")).map(({ t, y }) => ({ t, y })),
    shifts: s.shifts.slice(from("shifts")),
    urls: s.urls.slice(from("urls")),
    next: {
      doc: s.doc,
      scroll: s.scroll.length,
      shifts: s.shifts.length,
      urls: s.urls.length,
      y: Math.round(scrollY),
      at: location.pathname + location.search,
    },
  };
}

/** Where the page is: URL, the search params (sorted — they carry identity), scroll and frame. */
function place() {
  const params = new URLSearchParams(location.search);
  params.sort();
  const search = params.toString();
  return {
    href: location.href,
    pathname: location.pathname,
    search: search ? `?${search}` : "",
    section: params.get("section"),
    scrollY: Math.round(scrollY),
    maxY: Math.max(0, document.documentElement.scrollHeight - innerHeight),
    innerWidth,
    innerHeight,
  };
}

/** The sticky head's height (sticky/fixed boxes at the top, ≥ half wide) + the first content top. */
function frameEdges() {
  let head = 0;
  for (const el of document.querySelectorAll("body *")) {
    const pos = getComputedStyle(el).position;
    if (pos !== "sticky" && pos !== "fixed") continue;
    const r = el.getBoundingClientRect();
    if (r.top <= 2 && r.bottom > 0 && r.width >= innerWidth / 2)
      head = Math.max(head, Math.round(r.bottom));
  }
  const main = document.querySelector("main") ?? document.body;
  const first = [...main.children].find((el) => {
    const pos = getComputedStyle(el).position;
    return el.getBoundingClientRect().height > 0 && pos !== "sticky" && pos !== "fixed";
  });
  const contentTop = first ? Math.round(first.getBoundingClientRect().top + scrollY) : null;
  return { head, contentTop };
}

/**
 * Visible text + the states a toggle changes, hashed (FNV-1a): equal hashes = nothing changed.
 * "Visible" walks the ancestors too: text inside a faded (opacity 0) or hidden container, or cut
 * off by an ancestor's overflow (a collapsed max-height accordion), is not counted — so revealing
 * it changes the hash.
 */
function visibleHash() {
  const inView = (r) =>
    r.width >= 1 &&
    r.height >= 1 &&
    r.bottom > 0 &&
    r.top < innerHeight &&
    r.right > 0 &&
    r.left < innerWidth;
  // Each ancestor that clips its overflow, with its box: text outside any of them is cut off.
  const clips = new Map();
  const clipsOf = (el) => {
    if (!el || el === document.body) return [];
    if (clips.has(el)) return clips.get(el);
    const cs = getComputedStyle(el);
    const own =
      cs.overflowX !== "visible" || cs.overflowY !== "visible" ? [el.getBoundingClientRect()] : [];
    const all = [...own, ...clipsOf(el.parentElement)];
    clips.set(el, all);
    return all;
  };
  const insideClips = (r, el) =>
    clipsOf(el).every(
      (c) => r.right > c.left && r.left < c.right && r.bottom > c.top && r.top < c.bottom,
    );
  const shown = (el) =>
    typeof el.checkVisibility === "function"
      ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
      : getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).opacity !== "0";
  const parts = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.replace(/\s+/g, " ").trim();
    const p = n.parentElement;
    if (!(t && p) || p.closest("script, style, noscript")) continue;
    range.selectNodeContents(n);
    const r = range.getBoundingClientRect();
    if (inView(r) && shown(p) && insideClips(r, p)) parts.push(t);
  }
  const STATES = ["aria-pressed", "aria-selected", "aria-expanded", "aria-current", "aria-checked"];
  for (const el of document.querySelectorAll(`[${STATES.join("], [")}], input, select, textarea`)) {
    if (!inView(el.getBoundingClientRect())) continue;
    const states = STATES.map((a) => el.getAttribute(a) ?? "").join("|");
    parts.push(`§${states}|${el.value ?? ""}|${el.checked ?? ""}`);
  }
  let h = 0x811c9dc5;
  const joined = parts.join("\n");
  for (let i = 0; i < joined.length; i++) h = Math.imul(h ^ joined.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16);
}

/**
 * Sideways overflow at page level and inside every box that holds more than it shows — both halves
 * of what scripts/crawl/phone.mjs exempts as contained: auto/scroll boxes (reachable by a sideways
 * pan) and hidden/clip boxes (`reachable: false` — the cut-off content cannot be reached at all).
 * An ellipsis truncation, a form field (its text scrolls with the caret) or a sub-8px box (a
 * visually-hidden label) is a deliberate clip, skipped.
 * For a table inside one: whether its first (identity) column is cut off at the box edge at the
 * current scrollLeft, and whether it is pinned (sticky) so a pan keeps it in view.
 */
function sideways(tolerance) {
  const firstLine = (el) =>
    (el.innerText ?? "")
      .split("\n")
      .map((t) => t.trim())
      .find(Boolean) ?? "";
  const nameOf = (el) =>
    el.className && typeof el.className === "string"
      ? `.${el.className.trim().split(/\s+/)[0]}`
      : el.tagName.toLowerCase();
  const firstColumn = (tbl, r) => {
    const cells = [...tbl.rows].map((row) => row.cells[0]).filter(Boolean);
    const clipped = cells.some((c) => {
      const cr = c.getBoundingClientRect();
      return cr.width > 0 && (cr.left < r.left - 1 || cr.right > r.right + 1);
    });
    const sticky =
      cells.length > 0 && cells.every((c) => getComputedStyle(c).position === "sticky");
    return { clipped, sticky, label: cells[1] ? firstLine(cells[1]).slice(0, 80) : "" };
  };
  const containers = [];
  for (const el of document.querySelectorAll("body *")) {
    if (el.scrollWidth - el.clientWidth <= tolerance) continue;
    const cs = getComputedStyle(el);
    const ox = cs.overflowX;
    const r = el.getBoundingClientRect();
    if (ox === "visible" || r.width < 8 || r.height < 8) continue;
    const reachable = ox === "auto" || ox === "scroll";
    // A field scrolls its own text with the caret; an ellipsis is a deliberate, signalled clip.
    if (!reachable && (cs.textOverflow === "ellipsis" || el.matches("input, textarea, select")))
      continue;
    const tbl = el.querySelector("table");
    containers.push({
      name: nameOf(el),
      text: firstLine(el).slice(0, 80),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollLeft: Math.round(el.scrollLeft),
      reachable,
      inView: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
      table: tbl ? firstColumn(tbl, r) : null,
    });
  }
  return { page: { scrollWidth: document.documentElement.scrollWidth, innerWidth }, containers };
}

/**
 * Node side: the page as the member's frame shows it — where it is, the sticky head and first
 * content (for section switches), a hash of the visible text and control states, and every
 * sideways overflow. One evaluate per question keeps each in-page function small.
 */
export async function snapshot(page, tolerance) {
  const at = await page.evaluate(place);
  const edges = await page.evaluate(frameEdges);
  const textHash = await page.evaluate(visibleHash);
  const overflow = await page.evaluate(sideways, tolerance);
  return { ...at, ...edges, textHash, overflow };
}
