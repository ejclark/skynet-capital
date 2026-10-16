// A ROUND'S FOCUS on its own page (focus.mjs) — inlined by render.mjs ahead of page-client.js,
// which calls `steerFocus(api)` once and its `paint()` after the marks and pins paint. Never run by
// node.
//
// Eric, 2026-10-14: "I liked the outline of the sections under the microscope to narrow focus" and
// "[I] prefer simple and elegant design that is free of distraction". A picture with a focus opens
// cropped to it (`data-view="focus"`, the default); its one button switches it to the whole screen
// (`data-view="whole"`), where the focus is drawn as a dashed outline with its label, and back.
// The button's words name what a press shows next; aria-pressed says the whole screen is showing.
//
// WHAT THE CROP HIDES. CSS does the crop on the same image (page.css, A ROUND'S FOCUS), so a pin or
// a mark past its edge would only be clipped — still focusable, still read out. In the focused view
// each one whose spot lies outside the crop (`data-crop`, % of the frame) is `hidden`, so neither
// eye nor screen reader meets it; the whole view shows them all again. A mark he places in the crop
// is inside it by construction; one painted back from the record may not be, hence `paint()`.
//
// THE CROP'S SHAPE comes from the picture's proportions (`--fa`), which render.mjs writes when
// design.mjs could read the file; when it couldn't, this measures the picture once it loads.
globalThis.steerFocus = (api) => {
  const WORDS = api.focus; // { whole, part } from focus.mjs; only on a round's own page
  if (!(WORDS && document.querySelector(".shot[data-view]"))) return null;
  const nums = (s) =>
    String(s ?? "")
      .split(",")
      .map(Number);

  /** Does a pin or mark (placed by its style's left/top, in %) sit inside the crop? */
  function inside(pin, crop) {
    const x = Number.parseFloat(pin.style.left);
    const y = Number.parseFloat(pin.style.top);
    const [cx, cy, cw, ch] = crop;
    return x >= cx && x <= cx + cw && y >= cy && y <= cy + ch;
  }

  /** One picture in its view: the button's words and state, and the pins and marks it shows. */
  function paintShot(shot) {
    const whole = shot.dataset.view === "whole";
    const btn = shot.querySelector(".ftoggle");
    if (btn) {
      btn.textContent = whole ? WORDS.part : WORDS.whole;
      btn.setAttribute("aria-pressed", whole ? "true" : "false");
    }
    const crop = nums(shot.dataset.crop);
    for (const pin of shot.querySelectorAll(".pin")) pin.hidden = !(whole || inside(pin, crop));
  }

  function paint() {
    for (const shot of document.querySelectorAll(".shot[data-view]")) paintShot(shot);
  }

  /** The crop's width over its height, from the picture itself, when render.mjs couldn't say. */
  function measure(shot) {
    const img = shot.querySelector(".frame img");
    const [, , cw, ch] = nums(shot.dataset.crop);
    const fit = () => {
      if (!(img?.naturalWidth > 0 && ch > 0)) return;
      const ratio = img.naturalHeight / img.naturalWidth;
      shot.style.setProperty("--fa", String(Math.round((cw / (ch * ratio)) * 1000) / 1000));
    };
    if (img?.complete) fit();
    else img?.addEventListener("load", fit, { once: true });
  }
  for (const shot of document.querySelectorAll(".shot[data-view]"))
    if (!shot.style.getPropertyValue("--fa")) measure(shot);

  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest?.(".ftoggle");
    const shot = btn?.closest(".shot[data-view]");
    if (!shot) return;
    shot.dataset.view = shot.dataset.view === "whole" ? "focus" : "whole";
    paintShot(shot);
  });

  paint();
  return { paint };
};
