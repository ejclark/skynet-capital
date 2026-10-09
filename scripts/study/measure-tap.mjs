// The member study's tap measures — in-page functions (serialised by `page.evaluate`, so each is
// self-contained) for what a tap lands on, where that control went afterwards, and how far the
// member landed from the answer a navigating control promised. Split from `measure.mjs` so each
// file holds one question; judgements on the numbers live in `metrics.mjs` (`tapOutcome`,
// `displacement`, `landingScreens`).
//
// The role and accessible name are an APPROXIMATION of the accessibility tree (explicit role, else
// the tag's implicit one; aria-label, labelledby, text, title, alt, placeholder, label) — enough to
// say which control a thumb hit, not a conformance check.

/**
 * What a tap at (x, y) lands on: the operable control under the point, else the nearest one and its
 * distance (0 = the point is inside its box but something else is on top). Remembers the element so
 * `tapRect` can measure where it went after the action.
 */
export function probeTap([x, y]) {
  const SEL =
    "a[href], button, input, select, textarea, summary, label, [role=button], [role=link], [role=tab], [role=menuitem], [role=option], [role=checkbox], [role=radio], [role=switch], [tabindex]:not([tabindex='-1'])";
  const IMPLICIT = {
    A: "link",
    BUTTON: "button",
    SELECT: "combobox",
    TEXTAREA: "textbox",
    SUMMARY: "button",
    LABEL: "label",
  };
  const INPUTS = {
    checkbox: "checkbox",
    radio: "radio",
    search: "searchbox",
    range: "slider",
    number: "spinbutton",
    button: "button",
    submit: "button",
  };
  const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();
  const roleOf = (el) =>
    el.getAttribute("role") ||
    (el.tagName === "INPUT" ? INPUTS[el.type] || "textbox" : IMPLICIT[el.tagName]) ||
    el.tagName.toLowerCase();
  const describe = (el) => {
    const byIds = (el.getAttribute("aria-labelledby") ?? "")
      .split(/\s+/)
      .map((id) => (id ? document.getElementById(id)?.innerText : ""))
      .join(" ");
    const name =
      clean(el.getAttribute("aria-label")) ||
      clean(byIds) ||
      clean(el.innerText) ||
      clean(el.getAttribute("title")) ||
      clean(el.getAttribute("alt")) ||
      clean(el.getAttribute("placeholder")) ||
      clean(el.labels?.[0]?.innerText) ||
      (el.tagName === "INPUT" ? clean(el.value) : "");
    const r = el.getBoundingClientRect();
    return {
      role: roleOf(el),
      name: name.slice(0, 80),
      tag: el.tagName.toLowerCase(),
      rect: { x: r.x, y: r.y, width: r.width, height: r.height },
    };
  };
  const at = document.elementFromPoint(x, y);
  const control = at?.closest(SEL) ?? null;
  window.__study.tapEl = control;
  const under = at ? at.tagName.toLowerCase() : null;
  if (control) return { hit: describe(control), nearest: null, under };
  // What the thumb DID land on, as visible text locate.mjs can grep: an unlabelled control's tell.
  const underText = clean(at?.innerText).slice(0, 60);
  let nearest = null;
  for (const el of document.querySelectorAll(SEL)) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const dx = Math.max(r.left - x, 0, x - r.right);
    const dy = Math.max(r.top - y, 0, y - r.bottom);
    const distance = Math.round(Math.hypot(dx, dy));
    if (!nearest || distance < nearest.distance) nearest = { ...describe(el), distance };
  }
  return { hit: null, nearest, under, underText };
}

/** Where the tapped control is now, or null if it left the document. */
export function tapRect() {
  const el = window.__study?.tapEl;
  if (!el?.isConnected) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

/**
 * The document top (px) of the first heading or named region whose text matches `name` — where a
 * member who tapped "<name>" is looking for the answer. A match is the same words, or one side's
 * words appearing whole inside the other's, the shorter side at least 4 characters: "Overview"
 * never lands on "View", "Show all positions" never on "All". Navigation chrome is skipped.
 */
export function landingTop(name) {
  const norm = (s) =>
    (s ?? "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  const want = norm(name);
  if (want.length < 3) return null;
  const within = (inner, outer) => inner.length >= 4 && ` ${outer} `.includes(` ${inner} `);
  const sel = "h1, h2, h3, h4, h5, h6, [role=heading], [role=region], section[aria-label]";
  for (const el of document.querySelectorAll(sel)) {
    if (el.closest("nav, header, [role=tablist], [role=navigation]")) continue;
    if (el === window.__study?.tapEl) continue;
    const text = norm(el.getAttribute("aria-label") || (el.innerText ?? "").split("\n")[0]);
    if (text.length < 3 || !(text === want || within(want, text) || within(text, want))) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    return Math.round(r.top + scrollY);
  }
  return null;
}
