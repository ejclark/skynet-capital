// COMPARING AN OPTION WITH TODAY on a page (compare.mjs) — inlined by render.mjs ahead of
// page-client.js, which calls `steerCompare(api)` once. Never run by node.
//
// Each compared option's phone frame sits in a `.cmp` block: `data-mode` (flip · side · divider)
// sets its layout in page.css, `data-side` which picture Flip shows, `--split` where the divider
// sits. A mode pressed on one block is set on every block and kept for this viewer in localStorage
// (wrapped in try/catch: a sandboxed frame or a private window may refuse it), so his last angle
// opens next time; a kept mode the switch no longer has opens as what replaced it (`CFG.was`).
// A block whose pictures differ in size can't take the divider; it shows Flip.
// A tap on a half in Side by side opens that picture full size: that block alone goes to Flip on
// its side, and nothing is kept — the angle he picked is still Side by side next time.
// Nothing here moves on its own: every change follows a press or a drag.
globalThis.steerCompare = (api) => {
  const CFG = api.compare; // { modes, store } from compare.mjs; only on a page that compares
  const blocks = [...document.querySelectorAll(".cmp")];
  if (!(CFG && blocks.length)) return null;

  function kept() {
    try {
      const k = localStorage.getItem(CFG.store);
      const m = CFG.was?.[k] ?? k;
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

  function paint(b) {
    const mode = b.dataset.mode;
    for (const btn of b.querySelectorAll(".cmp-modes .cmp-b"))
      pressed(btn, btn.dataset.mode === mode);
    for (const btn of b.querySelectorAll(".cmp-flip .cmp-b"))
      pressed(btn, btn.dataset.side === b.dataset.side);
    b.querySelector(".cmp-flip").hidden = mode !== "flip";
    b.querySelector(".cmp-hint").hidden = mode !== "side";
    for (const o of b.querySelectorAll(".cmp-open")) o.hidden = mode !== "side";
    b.querySelector(".cmp-track").hidden = mode !== "divider";
  }

  function setMode(b, mode) {
    b.dataset.mode = mode === "divider" && b.hasAttribute("data-nodivider") ? "flip" : mode;
    paint(b);
  }

  document.addEventListener("click", (ev) => {
    const t = ev.target.closest?.(".cmp .cmp-b, .cmp .cmp-open");
    if (!t || t.disabled) return;
    const b = t.closest(".cmp");
    if (t.dataset.mode) {
      for (const x of blocks) setMode(x, t.dataset.mode);
      keep(t.dataset.mode);
    } else if (t.dataset.side) {
      b.dataset.side = t.dataset.side;
      paint(b);
    } else if (t.dataset.open) {
      b.dataset.side = t.dataset.open;
      setMode(b, "flip");
      b.querySelector(`.cmp-flip .cmp-b[data-side="${t.dataset.open}"]`)?.focus();
    }
  });

  function split(b, v) {
    const r = b.querySelector(".cmp-split");
    b.style.setProperty("--split", String(v));
    if (!r) return;
    r.value = String(v);
    r.setAttribute("aria-valuetext", `${v}% Today, ${100 - v}% ${r.dataset.name}`);
  }

  document.addEventListener("input", (ev) => {
    const r = ev.target.closest?.(".cmp-split");
    if (r) split(r.closest(".cmp"), Number(r.value));
  });

  // The grip on the line: a drag moves the line to the pointer, wherever the picture has scrolled.
  document.addEventListener("pointerdown", (ev) => {
    const g = ev.target.closest?.(".cmp-grip");
    if (!g) return;
    ev.preventDefault();
    const b = g.closest(".cmp");
    const box = b.querySelector(".cmp-stage").getBoundingClientRect();
    const move = (e) => {
      const v = Math.round(((e.clientX - box.left) / box.width) * 100);
      split(b, Math.min(100, Math.max(0, v)));
    };
    const stop = () => {
      g.removeEventListener("pointermove", move);
      g.removeEventListener("pointerup", stop);
      g.removeEventListener("pointercancel", stop);
    };
    g.setPointerCapture?.(ev.pointerId);
    g.addEventListener("pointermove", move);
    g.addEventListener("pointerup", stop);
    g.addEventListener("pointercancel", stop);
  });

  const first = kept() ?? "flip";
  for (const b of blocks) setMode(b, first);
  return {
    paint() {
      for (const b of blocks) paint(b);
    },
  };
};
