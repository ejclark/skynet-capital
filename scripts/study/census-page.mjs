// The census's page side (#4943) — functions serialised into the page, so each is self-contained
// (no imports, no closure over module scope). They only MEASURE; census-plan.mjs and
// harvest-plan.mjs judge what they return.
//
// The census reads controls from Chromium's accessibility tree (CDP), then hands each node's DOM
// element to the page with `adoptSelf` (called ON the element), so these measures run over exactly
// the tree's controls — never a CSS selector's idea of what a control is.

/** Called on an element (CDP `Runtime.callFunctionOn`): remember it; returns its index. */
export function adoptSelf() {
  window.__census = window.__census || [];
  window.__census.push(this);
  return window.__census.length - 1;
}

/** Forget every adopted element (before a fresh read of the tree). */
export function resetAdopted() {
  window.__census = [];
}

/**
 * Every adopted element as it stands at this scroll position: its box cut to every ancestor that
 * clips overflow (a fixed box escapes them), whether the browser shows it, where it sits in the
 * document, and the link it would follow.
 */
export function measureAdopted() {
  return (window.__census || []).map((el) => {
    if (!el?.isConnected) return { gone: true };
    const r = el.getBoundingClientRect();
    let [left, top, right, bottom] = [r.left, r.top, r.right, r.bottom];
    let fixed = false;
    for (let a = el; a; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.position === "fixed" || cs.position === "sticky") fixed = true;
      if (cs.position === "fixed") break;
      const p = a.parentElement;
      if (!p) break;
      const ps = getComputedStyle(p);
      const c = p.getBoundingClientRect();
      if (ps.overflowX !== "visible")
        [left, right] = [Math.max(left, c.left), Math.min(right, c.right)];
      if (ps.overflowY !== "visible")
        [top, bottom] = [Math.max(top, c.top), Math.min(bottom, c.bottom)];
    }
    const shown =
      typeof el.checkVisibility !== "function" ||
      el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
    const a = el.closest("a[href]");
    return {
      shown,
      pinned: fixed,
      box: {
        left: Math.round(left),
        top: Math.round(top),
        width: Math.max(0, Math.round(right - left)),
        height: Math.max(0, Math.round(bottom - top)),
      },
      doc: { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY) },
      link: a ? { href: a.getAttribute("href"), download: a.hasAttribute("download") } : null,
      tag: el.tagName.toLowerCase(),
    };
  });
}

/** The page's scroll extent and frame, for the screen-by-screen walk. */
export function pageExtent() {
  const se = document.scrollingElement || document.documentElement;
  return { scrollHeight: se.scrollHeight, innerHeight, innerWidth, scrollY: Math.round(scrollY) };
}

/** Scroll the page itself, instantly, to `y` (never a wheel: it goes to whatever is under it). */
export function scrollPageTo(y) {
  window.scrollTo({ top: y, behavior: "instant" });
  return Math.round(scrollY);
}

/** Bring adopted element `i` to the middle of the viewport (when its screen no longer shows it). */
export function centreAdopted(i) {
  window.__census?.[i]?.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
  return Math.round(scrollY);
}

/** What a tap at (x, y) would land on, relative to adopted element `i`. */
export function coverAt([i, x, y]) {
  const el = window.__census?.[i];
  const hit = document.elementFromPoint(x, y);
  if (!(el && hit)) return { inside: false, by: hit ? hit.tagName.toLowerCase() : "nothing" };
  const passThrough = getComputedStyle(el).pointerEvents === "none";
  const inside = el === hit || el.contains(hit) || (passThrough && hit.contains(el));
  const text = (hit.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40);
  const cls = typeof hit.className === "string" ? hit.className.split(/\s+/)[0] : "";
  return {
    inside,
    by: inside
      ? null
      : `${hit.tagName.toLowerCase()}${cls ? `.${cls}` : ""}${text ? ` "${text}"` : ""}`,
  };
}

/**
 * The visible text on this screen, in units a reader would read as one string: a heading, a
 * control, a label, or else the nearest block's own run of text. Each unit keeps one id for the
 * life of the document, so the walk can union screens. Text clipped away by an `overflow: hidden`
 * ancestor (a screen-reader-only label) is not visible text.
 */
export function visibleTextUnits() {
  if (!window.__censusUnits) window.__censusUnits = { map: new WeakMap(), next: 0 };
  const ids = window.__censusUnits;
  const HEAD = "h1,h2,h3,h4,h5,h6,[role=heading]";
  const CONTROL =
    "a[href],button,summary,select,[role=button],[role=link],[role=tab],[role=menuitem],[role=option],[role=switch],[role=checkbox],[role=radio]";
  const LABEL = "label,legend,caption,figcaption,th,dt,[role=columnheader],[role=rowheader]";
  const blockOf = (el) => {
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const d = getComputedStyle(a).display;
      if (!d.startsWith("inline") && d !== "contents") return a;
    }
    return document.body;
  };
  const clippedAway = (el, rect) => {
    let [l, t, r, b] = [rect.left, rect.top, rect.right, rect.bottom];
    for (let a = el; a; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (["hidden", "clip"].includes(cs.overflowX) || ["hidden", "clip"].includes(cs.overflowY)) {
        const c = a.getBoundingClientRect();
        [l, t, r, b] = [
          Math.max(l, c.left),
          Math.max(t, c.top),
          Math.min(r, c.right),
          Math.min(b, c.bottom),
        ];
      }
      if (cs.position === "fixed") break;
    }
    return !(r - l > 1 && b - t > 1) || b <= 0 || t >= innerHeight;
  };
  const units = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue.replace(/\s+/g, " ");
    if (!text.trim()) continue;
    const parent = node.parentElement;
    if (!parent || parent.closest("script,style,noscript,template")) continue;
    if (
      typeof parent.checkVisibility === "function" &&
      !parent.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    )
      continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    if (rect.width * rect.height <= 0 || clippedAway(parent, rect)) continue;
    const head = parent.closest(HEAD);
    const control = head ? null : parent.closest(CONTROL);
    const label = head || control ? null : parent.closest(LABEL);
    const unit = head || control || label || blockOf(parent);
    const kind = head ? "heading" : control ? "control" : label ? "label" : "text";
    if (!ids.map.has(unit)) ids.map.set(unit, ids.next++);
    const id = ids.map.get(unit);
    const u = units.get(id) || { id, kind, parts: [], last: null };
    // Two text nodes of one element run together ("$" + "962"); across elements they are two words.
    u.parts.push(u.last && u.last !== parent ? ` ${text}` : text);
    u.last = parent;
    units.set(id, u);
  }
  return [...units.values()].map((u) => ({
    id: u.id,
    kind: u.kind,
    text: u.parts.join("").replace(/\s+/g, " ").trim(),
  }));
}
