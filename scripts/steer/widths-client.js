// ONE PICTURE, TWO WIDTHS on a page (widths.mjs) — inlined by render.mjs ahead of page-client.js,
// which calls `steerWidths()` once. Never run by node.
//
// Each holder with both widths sits in a `.wsw` slot: `data-width` (phone · desk) says which
// picture page.css shows, and its two buttons' aria-pressed follow it. Every slot opens on Phone
// and nothing is remembered: the switch answers "what does this look like wide?" for one picture,
// not a page-wide mode. Nothing here moves on its own; every change follows a press.
globalThis.steerWidths = () => {
  const slots = [...document.querySelectorAll(".wsw")];
  if (!slots.length) return null;

  function paint(slot) {
    for (const btn of slot.querySelectorAll(".wsw-b .cmp-b"))
      btn.setAttribute("aria-pressed", btn.dataset.width === slot.dataset.width ? "true" : "false");
  }

  document.addEventListener("click", (ev) => {
    const t = ev.target.closest?.(".wsw-b .cmp-b");
    if (!t) return;
    const slot = t.closest(".wsw");
    slot.dataset.width = t.dataset.width;
    paint(slot);
  });

  for (const slot of slots) paint(slot);
  return null;
};
