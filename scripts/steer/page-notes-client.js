// NOTES ABOUT THE PAGE (page-notes.mjs) — inlined by render.mjs ahead of page-client.js, which
// calls `steerPageNotes(api)` once. Never run by node.
//
// Eric, 2026-10-14: "if i have an issue, I have the ability to organically provide feedback
// inline." The bar's "✎ Note about this page" (aria-pressed) arms ONE tap: the next tap anywhere
// opens a small note at that spot instead of doing what it would have done — it is caught on the
// way down (capture, on window) and stopped, so the button under his finger never fires. The note
// takes the pin notes' limit and counter; Save hands it to the page script, which merges it into
// the round's own document (`update`, never `set` — page-client.js header, DONE TELLS CLAUDE), and
// Cancel or Escape drops it. One note per press: the mode turns off as soon as the spot is chosen.
// The bar counts the notes already left ("2 notes"); nothing is drawn on the page where they were.
//
// `near` says, in a few plain words, what he tapped — the Done bar, a pin's name, a button's own
// words, a picture, or the nearest heading — so the note can be read without the page beside it.
// A locked page (no store, view only, still connecting) disables the button.
globalThis.steerPageNotes = (api) => {
  const CFG = api.cfg; // { label, armed, noteMax, nearMax } from page-notes.mjs
  const btn = document.getElementById("pnote");
  const countEl = document.getElementById("pnote-count");
  if (!(CFG && btn)) return null;
  const GUTTER = 8;
  /** The counter shows once this few characters are left, as the pins' does. */
  const NEAR = 40;
  /** The notes the round's document holds, and the ones saved here: id → entry. */
  const known = new Map();
  let armed = false;
  let pop = null;
  let field = null;
  let left = null;
  let nearEl = null;
  /** Where the note being written was placed: { near, x, y }. */
  let spot = null;

  const clip = (s) => {
    const t = String(s ?? "")
      .replace(/\s+/g, " ")
      .trim();
    return t.length > CFG.nearMax ? `${t.slice(0, CFG.nearMax - 1)}…` : t;
  };
  /** A control he tapped, by its own words — or null when the tap wasn't on one. */
  function controlOf(t) {
    if (t.closest(".bar")) return "the Done bar";
    const pin = t.closest(".pin");
    if (pin) return clip(pin.dataset.name);
    const c = t.closest("button, a, textarea, input");
    if (!c) return null;
    if (c.matches("textarea, input")) return "the note field";
    // Its words, not the glyph beside them (a glyph a screen reader skips is skipped here too).
    const words = [...c.childNodes]
      .filter((n) => !(n.nodeType === 1 && n.getAttribute("aria-hidden") === "true"))
      .map((n) => n.textContent)
      .join("")
      .trim();
    return words ? clip(`the “${words}” ${c.tagName === "A" ? "link" : "button"}`) : null;
  }
  /** What he tapped, in a few plain words: a control, a picture, an option, or a heading. */
  function describe(t) {
    const control = controlOf(t);
    if (control) return control;
    const option = t.closest(".shot")?.dataset.option;
    if (option)
      return clip(option === "today" ? "the Today picture" : `the option ${option} picture`);
    const heading =
      t.closest("article.opt")?.querySelector(".oname") ??
      t.closest("section.dec")?.querySelector("h3") ??
      t.closest("header")?.querySelector("h1") ??
      t.closest("section")?.querySelector("h2");
    return heading ? clip(heading.textContent) : "the page";
  }

  function build() {
    pop = document.createElement("div");
    pop.className = "pnpop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Note about this page");
    nearEl = document.createElement("p");
    nearEl.className = "pnnear";
    field = document.createElement("textarea");
    field.className = "pnt";
    field.rows = 3;
    field.maxLength = CFG.noteMax;
    field.placeholder = "What got in your way here?";
    field.setAttribute("aria-label", "Your note about this page");
    left = document.createElement("p");
    left.className = "pcount";
    const acts = document.createElement("div");
    acts.className = "pnacts";
    for (const [cls, text] of [
      ["pns", "Save"],
      ["pnc", "Cancel"],
    ]) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = cls;
      b.textContent = text;
      acts.append(b);
    }
    pop.append(nearEl, field, left, acts);
    pop.hidden = true;
    document.body.append(pop);
  }

  function arm(on) {
    armed = on;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.textContent = on ? CFG.armed : CFG.label;
    document.body.classList.toggle("noting", on);
  }
  /** "N characters left", shown only near the limit. */
  function remaining() {
    const n = CFG.noteMax - field.value.length;
    left.hidden = n > NEAR;
    left.textContent = `${n} characters left`;
  }
  /** The note field at the spot tapped, inside the 8px gutter. */
  function openAt(ev) {
    if (!pop) build();
    const doc = document.documentElement;
    const px = ev.pageX ?? ev.clientX + window.scrollX;
    const py = ev.pageY ?? ev.clientY + window.scrollY;
    const w = Math.max(doc.scrollWidth, 1);
    const h = Math.max(doc.scrollHeight, 1);
    spot = {
      near: describe(ev.target),
      x: Math.round((px / w) * 1000) / 10,
      y: Math.round((py / h) * 1000) / 10,
    };
    nearEl.textContent = `Near ${spot.near}`;
    field.value = "";
    remaining();
    pop.hidden = false;
    const vw = doc.clientWidth || window.innerWidth;
    const width = pop.offsetWidth;
    pop.style.left = `${Math.max(GUTTER, Math.min(px - width / 2, vw - GUTTER - width))}px`;
    pop.style.top = `${py + 12}px`;
    field.focus();
  }
  function close() {
    if (pop) pop.hidden = true;
    spot = null;
    btn.focus();
  }
  function save() {
    const note = field.value.slice(0, CFG.noteMax);
    const at = spot;
    close();
    if (!(at && note.trim()) || api.locked()) return;
    const id = `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const entry = { ...at, note, at: new Date().toISOString() };
    api.save(id, entry).then((ok) => {
      if (!ok) return;
      known.set(id, entry);
      count();
    });
  }
  function count() {
    const n = known.size;
    countEl.hidden = n === 0;
    countEl.textContent = n === 1 ? "1 note" : `${n} notes`;
  }

  /** The round's document as the store has it: its notes, counted. */
  function hear(meta) {
    const notes = meta?.pageNotes;
    if (!notes || typeof notes !== "object") return count();
    for (const [id, n] of Object.entries(notes)) {
      if (n && typeof n.note === "string" && n.note.trim()) known.set(id, n);
      else known.delete(id);
    }
    count();
  }
  /** The button follows the lock; a view gone dark drops a note half written. */
  function paint(off) {
    btn.disabled = off;
    if (!off) return;
    if (armed) arm(false);
    if (pop && !pop.hidden) close();
  }

  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    if (pop && !pop.hidden) close();
    arm(!armed);
  });
  // Caught on the way down, before any other listener: the tap places the note and does nothing
  // else — no answer pressed, no mark placed, no link followed.
  window.addEventListener(
    "click",
    (ev) => {
      const t = ev.target;
      if (pop && !pop.hidden && pop.contains(t)) {
        if (t.closest?.(".pns")) save();
        else if (t.closest?.(".pnc")) close();
        return;
      }
      if (!armed || btn.contains(t)) return;
      ev.preventDefault();
      ev.stopPropagation();
      arm(false);
      openAt(ev);
    },
    true,
  );
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (pop && !pop.hidden) close();
    else if (armed) arm(false);
  });
  document.addEventListener("input", (ev) => {
    if (ev.target === field) remaining();
  });

  return { paint, hear, count: () => known.size };
};
