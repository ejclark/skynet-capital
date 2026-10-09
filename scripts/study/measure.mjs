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

/** Where each log stands now, so `since` can return only what one action caused. */
export function marks() {
  const s = window.__study;
  return { doc: s.doc, scroll: s.scroll.length, shifts: s.shifts.length, urls: s.urls.length };
}

/** Everything logged after `mark`; a new document (a full load) means everything it holds. */
export function since(mark) {
  const s = window.__study;
  const same = s.doc === mark.doc;
  const from = (k) => (same ? mark[k] : 0);
  return {
    reloaded: !same,
    scroll: s.scroll.slice(from("scroll")).map(({ t, y }) => ({ t, y })),
    shifts: s.shifts.slice(from("shifts")),
    urls: s.urls.slice(from("urls")),
  };
}

/** Where the page is: URL, section, scroll and frame size. */
export function place() {
  return {
    href: location.href,
    pathname: location.pathname,
    section: new URLSearchParams(location.search).get("section"),
    scrollY: Math.round(scrollY),
    maxY: Math.max(0, document.documentElement.scrollHeight - innerHeight),
    innerWidth,
    innerHeight,
  };
}

/** The sticky head's height (sticky/fixed boxes at the top, ≥ half wide) + the first content top. */
export function frameEdges() {
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

/** Visible text + the states a toggle changes, hashed (FNV-1a): equal hashes = nothing changed. */
export function visibleHash() {
  const inView = (r) =>
    r.width >= 1 &&
    r.height >= 1 &&
    r.bottom > 0 &&
    r.top < innerHeight &&
    r.right > 0 &&
    r.left < innerWidth;
  const parts = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.replace(/\s+/g, " ").trim();
    const p = n.parentElement;
    if (!(t && p) || p.closest("script, style, noscript")) continue;
    range.selectNodeContents(n);
    if (!inView(range.getBoundingClientRect())) continue;
    const cs = getComputedStyle(p);
    if (cs.visibility !== "hidden" && cs.opacity !== "0") parts.push(t);
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
 * Sideways overflow at page level and inside every box that scrolls sideways on its own — the
 * auto/scroll boxes scripts/crawl/phone.mjs exempts as contained — with, for a table inside one,
 * whether its first (identity) column is cut off at the box edge, and whether it is pinned (sticky).
 */
export function sideways(tolerance) {
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
    const ox = getComputedStyle(el).overflowX;
    const r = el.getBoundingClientRect();
    if ((ox !== "auto" && ox !== "scroll") || r.width < 1 || r.height < 1) continue;
    const tbl = el.querySelector("table");
    containers.push({
      name: nameOf(el),
      text: firstLine(el).slice(0, 80),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollLeft: Math.round(el.scrollLeft),
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
