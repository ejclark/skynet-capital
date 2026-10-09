// The native picker's stand-in, page side (#4943) — draws what the OS would show when a member taps
// a <select>, because headless Chromium never paints a native popup into a page screenshot. The
// RULES (what opens, what a row tap does, where the dropdown goes) are picker.mjs's pure functions,
// composed into this init script by their source; this file only draws and wires events.
//
// FAITHFUL, NOT BRANDED: a phone gets a bottom sheet over a dimmed page, the current row checked;
// a desktop gets a plain list anchored under the select, the current row in the system highlight.
// Both use the system font and CSS system colours (Canvas, Highlight, GrayText…), never the app's
// tokens, so the frame shows the platform's control, not a new piece of the app's design.
//
// WHAT IT DOES TO THE PAGE: the native popup is suppressed (pointerdown/mousedown on the select are
// default-prevented); a tap on a row sets selectedIndex and dispatches input then change, as a
// person's choice does; a tap elsewhere, Escape, Tab, or a page scroll closes it with no change.
// While it is open the page hears nothing a native popup would take: a press, tap or click on the
// overlay stops at the window's capture phase (the init script's listener runs before any of the
// app's), and every key stops there too, so a focused select's arrow keys and type-ahead never
// change its value under the open list. GOOD-ENOUGH ON PURPOSE: there is no keyboard highlight —
// the arrows move nothing and Enter takes the row that was current; a member chooses by tapping.
// Each moment is logged on `window.__study.picker` (measure.mjs → `since` hands it to the recorder).
//
// KEPT OUT OF THE RECORDER'S OWN MEASUREMENTS: the overlay is appended to <html>, OUTSIDE <body>,
// and marked `data-study-overlay`. The recorder's walks are rooted at body (the visible text,
// sideways overflow, the sticky head); the text hash's document-wide control-state scan skips the
// mark, and the layout-shift log drops entries whose sources all sit inside it. Three look inside
// it: the scripted finger (`textTarget`), the tap probe, and watched text (`seenText`) — an option
// label a member reads in the list IS seen. A desktop dropdown's full-frame host is marked
// `data-study-backdrop="clear"`: it only catches the tap outside, and `seenText` looks through it,
// because the page beside a dropdown is in plain view (a phone sheet's dimmed backdrop covers).

import { dropdownPlacement, opensPicker, pickerStep } from "./picker.mjs";

/** In-page init script: wire the stand-in once per document. `cfg`: {mode, step, opens, place}. */
export function installPicker({ mode, step, opens, place }) {
  if (window.__studyPicker) return;
  const P = { state: null, host: null, sel: null, armed: null };
  window.__studyPicker = P;
  const MARK = "data-study-overlay";
  const record = (m) => {
    if (!(m && window.__study)) return;
    window.__study.picker = window.__study.picker || [];
    window.__study.picker.push({ t: Math.round(performance.now()), ...m });
  };
  const targetOf = (node) => {
    const el = node instanceof Element ? node : node?.parentElement;
    if (!el || el.closest(`[${MARK}]`)) return null;
    const sel = el.closest("select");
    if (sel) return { kind: "select", sel };
    const ctl = el.closest("label")?.control;
    return ctl?.tagName === "SELECT" ? { kind: "label", sel: ctl } : null;
  };
  const opening = (e) => {
    const t = targetOf(e.target);
    if (!t) return null;
    const { sel } = t;
    const desc = { kind: t.kind, disabled: sel.matches(":disabled"), multiple: sel.multiple };
    return opens({ ...desc, size: sel.size }, mode) ? t : null;
  };
  const optionsOf = (sel) =>
    [...sel.options].map((o) => ({
      value: o.value,
      label: (o.label || o.text || "").replace(/\s+/g, " ").trim(),
      disabled: o.disabled || Boolean(o.parentElement?.disabled),
      hidden: o.hidden || getComputedStyle(o).display === "none",
    }));
  const nameOf = (sel) =>
    (sel.labels?.[0]?.innerText || sel.getAttribute("aria-label") || "")
      .replace(/\s+/g, " ")
      .trim();
  const css = (el, text) => {
    el.style.cssText = `all: initial; box-sizing: border-box; ${text}`;
    return el;
  };
  const FONT = "font-family: -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif;";
  const row = (o, i, s) => {
    const current = i === s.index;
    const sheet = s.mode === "sheet";
    const ink = o.disabled ? "GrayText" : current && !sheet ? "HighlightText" : "CanvasText";
    const r = css(
      document.createElement("div"),
      sheet
        ? `display: flex; align-items: center; justify-content: space-between; min-height: 50px; padding: 0 20px; font-size: 17px; ${FONT} color: ${ink}; background: Canvas; border-top: ${i ? "1px solid rgba(60,60,67,0.18)" : "none"}; cursor: default;`
        : `display: block; padding: 2px 24px 2px 8px; font-size: 13px; line-height: 18px; white-space: nowrap; ${FONT} color: ${ink}; background: ${current ? "Highlight" : "Canvas"}; cursor: default;`,
    );
    r.setAttribute("role", "option");
    r.setAttribute("aria-label", o.label);
    r.setAttribute("aria-selected", String(current));
    if (o.disabled) r.setAttribute("aria-disabled", "true");
    r.dataset.index = String(i);
    const text = css(document.createElement("span"), `${FONT} color: inherit; font-size: inherit;`);
    text.textContent = o.label;
    r.append(text);
    if (sheet && current) {
      const tick = css(document.createElement("span"), `${FONT} color: LinkText; font-size: 17px;`);
      tick.textContent = "✓";
      tick.setAttribute("aria-hidden", "true");
      r.append(tick);
    }
    return r;
  };
  const listStyle = (s) => {
    if (s.mode === "sheet")
      return "position: fixed; left: 0; right: 0; bottom: 0; display: block; max-height: 50vh; overflow-y: auto; background: Canvas; border-radius: 12px 12px 0 0; padding: 8px 0 24px; box-shadow: 0 -2px 12px rgba(0,0,0,0.25);";
    const b = P.sel.getBoundingClientRect();
    const rect = { left: b.left, top: b.top, bottom: b.bottom, width: b.width };
    const rows = s.options.filter((o) => !o.hidden).length;
    const p = place({ rect, vw: innerWidth, vh: innerHeight, rows });
    return `position: fixed; left: ${p.left}px; top: ${p.top}px; min-width: ${p.minWidth}px; max-height: ${p.maxHeight}px; display: block; overflow-y: auto; background: Canvas; border: 1px solid ButtonBorder; box-shadow: 0 2px 8px rgba(0,0,0,0.3); padding: 4px 0;`;
  };
  const draw = () => {
    P.host?.remove();
    P.host = null;
    const s = P.state;
    if (!s) return;
    const dim = s.mode === "sheet" ? "rgba(0,0,0,0.4)" : "transparent";
    const host = css(
      document.createElement("div"),
      `position: fixed; inset: 0; z-index: 2147483647; display: block; color-scheme: light; background: ${dim};`,
    );
    host.setAttribute(MARK, "native-picker");
    if (s.mode !== "sheet") host.setAttribute("data-study-backdrop", "clear");
    const list = css(document.createElement("div"), listStyle(s));
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", s.name);
    list.append(...s.options.flatMap((o, i) => (o.hidden ? [] : [row(o, i, s)])));
    host.append(list);
    document.documentElement.append(host);
    P.host = host;
  };
  const apply = (event) => {
    const r = step(P.state, event);
    if (!r.moment) return;
    P.state = r.state;
    if (r.set && P.sel) {
      P.sel.selectedIndex = r.set.index;
      P.sel.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      P.sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    draw();
    record(r.moment);
  };
  // A tap on a row chooses it; a tap on the select itself (under the clear backdrop, or the dimmed
  // one) closes it as re-tapping the native control does; anywhere else closes it too.
  const onOverlay = (e) => {
    e.preventDefault();
    const hit = e.target instanceof Element ? e.target.closest("[data-index]") : null;
    if (hit) return apply({ type: "choose", index: Number(hit.dataset.index) });
    const b = P.sel?.getBoundingClientRect();
    const across = b && e.clientX >= b.left && e.clientX <= b.right;
    const onSelect = across && e.clientY >= b.top && e.clientY <= b.bottom;
    apply(onSelect ? { type: "open", mode } : { type: "dismiss", via: "outside" });
  };
  // Nothing done on the overlay reaches the app: this capture listener on window is registered
  // before any page script runs, so stopping here stops the app's window and document capture
  // listeners too. A press never takes focus off the select.
  const POINTER = ["pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend"];
  for (const type of [...POINTER, "click", "dblclick", "auxclick", "contextmenu"])
    addEventListener(
      type,
      (e) => {
        if (!(e.target instanceof Element && e.target.closest(`[${MARK}]`))) return;
        e.stopImmediatePropagation();
        if (type === "click") onOverlay(e);
        else if (type !== "auxclick" && !type.startsWith("touch")) e.preventDefault();
      },
      true,
    );
  // The press arms the select it landed on; only the click that follows it opens the stand-in.
  // A desktop label's activation sends the select a click with no press on it, and a click with
  // no press opens no native popup either.
  const swallow = (e) => {
    const t = opening(e);
    if (e.type === "pointerdown") P.armed = t?.sel ?? null;
    if (t) e.preventDefault();
  };
  document.addEventListener("pointerdown", swallow, true);
  document.addEventListener("mousedown", swallow, true);
  document.addEventListener(
    "click",
    (e) => {
      const t = opening(e);
      if (!t || P.armed !== t.sel) return;
      P.armed = null;
      e.preventDefault();
      t.sel.focus({ preventScroll: true });
      if (!P.state) P.sel = t.sel;
      const options = optionsOf(t.sel);
      apply({ type: "open", mode, name: nameOf(t.sel), options, index: t.sel.selectedIndex });
    },
    true,
  );
  // Every key goes to the open list, never to the page or the focused select (whose arrows and
  // type-ahead would change its value under the list). Tab closes it and still moves focus on.
  const KEYS = {
    Escape: { type: "dismiss", via: "escape" },
    Enter: { type: "confirm" },
    Tab: { type: "dismiss", via: "tab" },
  };
  addEventListener(
    "keydown",
    (e) => {
      if (!P.state) return;
      e.stopImmediatePropagation();
      if (e.key !== "Tab") e.preventDefault();
      if (KEYS[e.key]) apply(KEYS[e.key]);
    },
    true,
  );
  for (const type of ["keypress", "keyup"])
    addEventListener(
      type,
      (e) => {
        if (!P.state) return;
        e.preventDefault();
        e.stopImmediatePropagation();
      },
      true,
    );
  // A phone's sheet is modal and a desktop list closes on scroll: either way a page scroll ends it.
  addEventListener("scroll", () => P.state && apply({ type: "dismiss", via: "scroll" }), {
    passive: true,
  });
  addEventListener("popstate", () => P.state && apply({ type: "dismiss", via: "navigation" }));
}

/**
 * Node side: the init script's source — `installPicker` called with picker.mjs's own rules, so the
 * page runs the specced functions themselves. `__name` is defined because a loader that keeps
 * function names (tsx/esbuild) may wrap nested functions in it, and the page has no such helper.
 */
export function pickerInitScript(mode) {
  const cfg = `{ mode: ${JSON.stringify(mode)}, step: ${pickerStep}, opens: ${opensPicker}, place: ${dropdownPlacement} }`;
  return `(() => { const __name = (f) => f; (${installPicker})(${cfg}); })();`;
}
