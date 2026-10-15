// COMPARING AN OPTION WITH TODAY on a page (compare.mjs) — inlined by render.mjs ahead of
// page-client.js, which calls `steerCompare(api)` once. Never run by node.
//
// Each compared option's phone frame sits in a `.cmp` block: `data-mode` (flip · swipe · divider)
// sets its layout in page.css, `data-side` which picture Flip shows, `--split` where the divider
// sits. A mode pressed on one block is set on every block and kept for this viewer in localStorage
// (wrapped in try/catch: a sandboxed frame or a private window may refuse it), so his last angle
// opens next time. A block whose pictures differ in size can't take the divider; it shows Flip.
// Nothing here moves on its own: every change follows a press, a drag or his own swipe.
globalThis.steerCompare = (api) => {
  const CFG = api.compare; // { modes, store } from compare.mjs; only on a page that compares
  const blocks = [...document.querySelectorAll(".cmp")];
  if (!(CFG && blocks.length)) return null;

  function kept() {
    try {
      const m = localStorage.getItem(CFG.store);
      return CFG.modes.includes(m) ? m : null;
    } catch {
      return null;
    }
  }
  function keep(mode) {
    try {
      localStorage.setItem(CFG.store, mode);
    } catch {
      // nowhere to keep it: the page still switches, it just won't remember
    }
  }

  const pressed = (btn, on) => btn.setAttribute("aria-pressed", on ? "true" : "false");
  const stage = (b) => b.querySelector(".cmp-stage");

  /** Which picture the strip shows: the dot under it is the filled one (● here, ○ not). */
  function dots(b) {
    const strip = stage(b);
    const cells = [...strip.querySelectorAll(".cmp-cell")];
    const step = cells.length > 1 ? cells[1].offsetLeft - cells[0].offsetLeft : 0;
    const i = step > 0 ? Math.round(strip.scrollLeft / step) : 0;
    const all = [...b.querySelectorAll(".cmp-dot")];
    for (const d of all) d.setAttribute("aria-current", all.indexOf(d) === i ? "true" : "false");
  }

  function paint(b) {
    const mode = b.dataset.mode;
    for (const btn of b.querySelectorAll(".cmp-modes .cmp-b"))
      pressed(btn, btn.dataset.mode === mode);
    for (const btn of b.querySelectorAll(".cmp-flip .cmp-b"))
      pressed(btn, btn.dataset.side === b.dataset.side);
    b.querySelector(".cmp-flip").hidden = mode !== "flip";
    b.querySelector(".cmp-dots").hidden = mode !== "swipe";
    b.querySelector(".cmp-track").hidden = mode !== "divider";
    if (mode === "swipe") dots(b);
  }

  function setMode(b, mode) {
    b.dataset.mode = mode === "divider" && b.hasAttribute("data-nodivider") ? "flip" : mode;
    paint(b);
  }

  document.addEventListener("click", (ev) => {
    const t = ev.target.closest?.(".cmp .cmp-b, .cmp .cmp-dot");
    if (!t || t.disabled) return;
    const b = t.closest(".cmp");
    if (t.dataset.mode) {
      for (const x of blocks) setMode(x, t.dataset.mode);
      keep(t.dataset.mode);
    } else if (t.dataset.side) {
      b.dataset.side = t.dataset.side;
      paint(b);
    } else if (t.dataset.go) {
      const cell = b.querySelector(`.cmp-cell[data-cell="${t.dataset.go}"]`);
      stage(b).scrollTo({ left: cell?.offsetLeft ?? 0 });
      for (const d of b.querySelectorAll(".cmp-dot"))
        d.setAttribute("aria-current", d === t ? "true" : "false");
    }
  });

  document.addEventListener("input", (ev) => {
    const r = ev.target.closest?.(".cmp-split");
    if (!r) return;
    const v = Number(r.value);
    r.closest(".cmp").style.setProperty("--split", String(v));
    r.setAttribute("aria-valuetext", `${v}% Today, ${100 - v}% ${r.dataset.name}`);
  });

  for (const b of blocks) stage(b).addEventListener("scroll", () => dots(b), { passive: true });

  const first = kept() ?? "flip";
  for (const b of blocks) setMode(b, first);
  return {
    paint() {
      for (const b of blocks) paint(b);
    },
  };
};
