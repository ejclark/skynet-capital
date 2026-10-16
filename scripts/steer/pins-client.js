// PIN REACTIONS on a round page (#5143) — inlined by render.mjs ahead of page-client.js, which
// calls `steerPins(api)` once with the page's own state. Never run by node.
//
// Eric, 2026-10-11: "i wish the process had thumbs up/down and 'mixed' icons to give granular
// feedback at the comment level for the iterations." Each numbered pin baked into a round's
// picture has a button on its badge (pins.mjs). A tap opens ONE popover, set right after that pin
// inside its picture, offering three reactions as glyph AND word — he is red/green colourblind, so
// colour never carries the meaning. A choice goes to the page script, which saves it in the
// decision's own record (merged in one key at a time); the badge then shows the glyph with a
// heavier border, and the same choice again clears it. Escape, a tap outside or focus leaving
// closes it. It opens below the pin, or above it when the Done bar would cover it, clamped inside
// an 8px gutter — so it never covers its own pin and never scrolls the page sideways.
//
// A NOTE UNDER THE CHOICES (Eric, 2026-10-11: "i wish the thumbs up/down/mixed signal
// form/process also allowed for commentary to expand on context"). "✎ Add a note" opens a field
// (`noteMax` characters, a counter in its last 40). The page script holds the text as it is typed
// and saves it on a pause, on close and on Done. A choice tapped while the field is open saves and
// leaves the popover open, so the text stays in front of him; with no field open it closes, as
// before. A pin with a note wears ✎ on its badge, and reopening it shows the note.
//
// MARKS RIDE THIS POPOVER (Eric, 2026-10-14: his own spots, before Claude's — marks.mjs). A mark is
// a `.pin` button with `data-mark` that marks-client.js places where he tapped; it opens, saves and
// paints exactly as a pin does, with the marks' words and glyphs. Two hooks reach marks-client: a
// tap on a frame's picture with no popover open asks `api.spot(ev)` for a new mark to open, and a
// closed mark goes to `api.closed(pin)`, which takes it off the frame when nothing was said on it.
// Marks never join `said` — marks-client.js counts its own.
globalThis.steerPins = (api) => {
  const PINS = api.pins; // { glyph, words: { design, problems }, noteMax } from pins.mjs
  if (!PINS) return null;
  const REACTIONS = ["up", "down", "mixed"];
  const GUTTER = 8;
  const GAP = 8;
  /** The counter shows once this few characters are left. */
  const NEAR = 40;
  let pop = null;
  let choicesEl = null;
  let addBtn = null;
  let box = null;
  let field = null;
  let left = null;
  let openPin = null;

  /** A mark (marks-client.js) is a pin button he placed himself: it takes the marks' words and
   *  glyphs (👍 Like · 👎 Don't like · ✏︎ Would change) and everything else from here. */
  const MARKS = api.marks;
  const isMark = (pin) => pin.dataset.mark !== undefined;
  const keyOf = (pin) => pin.closest(".shot")?.dataset.key;
  const words = (pin) =>
    isMark(pin) ? MARKS.words : PINS.words[api.problems(keyOf(pin)) ? "problems" : "design"];
  const glyphs = (pin) => (isMark(pin) ? MARKS.glyph : PINS.glyph);
  const reactionOf = (r, id) => (REACTIONS.includes(r?.pins?.[id]) ? r.pins[id] : null);
  const noteOf = (r, id) => {
    const v = r?.pinNotes?.[id];
    return typeof v === "string" && v.trim() ? v : null;
  };
  const saved = (pin) => reactionOf(api.saved(keyOf(pin)), pin.dataset.pin);
  const savedNote = (pin) => noteOf(api.saved(keyOf(pin)), pin.dataset.pin);
  /** The pin ids this page shows, by decision key. A record may hold more: a round republished
   *  with fewer or renumbered pins keeps the old ids in the store, and those never count. */
  const SHOWN = new Map();
  for (const pin of document.querySelectorAll(".pin:not([data-mark])")) {
    const key = keyOf(pin);
    SHOWN.set(key, [...(SHOWN.get(key) ?? []), pin.dataset.pin]);
  }
  /** What a record says on the pins this page shows for its decision, as [id, reaction, note] in
   *  page order, either one possibly null — what counts as an answer and what Copy as text
   *  carries. */
  const said = (key, r) =>
    (SHOWN.get(key) ?? [])
      .map((id) => [id, reactionOf(r, id), noteOf(r, id)])
      .filter(([, v, n]) => v || n);

  /** The popover, built once: the choices, then the note's control and its field. */
  function build() {
    pop = document.createElement("div");
    pop.className = "pinpop";
    pop.id = "pinpop";
    pop.setAttribute("role", "group");
    choicesEl = document.createElement("div");
    choicesEl.className = "pcs";
    addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "pna";
    addBtn.textContent = "✎ Add a note";
    addBtn.setAttribute("aria-controls", "pinnote-box");
    box = document.createElement("div");
    box.className = "pnb";
    box.id = "pinnote-box";
    field = document.createElement("textarea");
    field.className = "pnt";
    field.id = "pinnote";
    field.rows = 3;
    field.maxLength = PINS.noteMax;
    field.placeholder = "What should change on this spot?";
    field.setAttribute("aria-describedby", "pinnote-left");
    left = document.createElement("p");
    left.className = "pcount";
    left.id = "pinnote-left";
    box.append(field, left);
    pop.append(choicesEl, addBtn, box);
  }

  /** The three choices for this pin, its saved one pressed. */
  function fillChoices(pin) {
    const w = words(pin);
    const now = saved(pin);
    choicesEl.replaceChildren(
      ...REACTIONS.map((v) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pc";
        b.dataset.r = v;
        b.setAttribute("aria-pressed", now === v ? "true" : "false");
        const glyph = document.createElement("span");
        glyph.setAttribute("aria-hidden", "true");
        glyph.textContent = glyphs(pin)[v];
        b.append(glyph, ` ${w[v]}`);
        return b;
      }),
    );
  }
  /** The note's field, open when it holds text, or behind its Add a note control. */
  function showNote(on) {
    box.hidden = !on;
    addBtn.hidden = on;
    addBtn.setAttribute("aria-expanded", on ? "true" : "false");
  }
  /** "N characters left", shown only near the limit. */
  function count() {
    const n = PINS.noteMax - field.value.length;
    left.hidden = n > NEAR;
    left.textContent = `${n} characters left`;
  }
  function fill(pin) {
    pop.setAttribute("aria-label", pin.dataset.name);
    fillChoices(pin);
    field.value = api.saved(keyOf(pin))?.pinNotes?.[pin.dataset.pin] ?? "";
    field.setAttribute(
      "aria-label",
      `Note on ${pin.dataset.name.replace(/^(Pin|Your)/, (w) => w.toLowerCase())}`,
    );
    field.placeholder = isMark(pin) ? "What about this spot?" : "What should change on this spot?";
    field.disabled = api.locked();
    showNote(Boolean(savedNote(pin)));
    count();
  }

  /** Below the pin, or above it when the bar would cover it; never past the 8px gutter. */
  function place(pin) {
    const frame = pin.closest(".shot").getBoundingClientRect();
    const r = pin.getBoundingClientRect();
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const bar = document.querySelector(".bar")?.getBoundingClientRect();
    const floor = bar && bar.top > 0 ? bar.top : window.innerHeight;
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    const left = Math.max(GUTTER, Math.min(r.left + r.width / 2 - w / 2, vw - GUTTER - w));
    const below = r.bottom + GAP + h <= floor || r.top - GAP - h < 0;
    pop.style.left = `${left - frame.left}px`;
    pop.style.top = `${(below ? r.bottom + GAP : r.top - GAP - h) - frame.top}px`;
    pop.dataset.side = below ? "below" : "above";
  }

  function open(pin) {
    close(false);
    if (!pop) build();
    fill(pin);
    // On a focused frame (focus.mjs) the pin sits in a clipped plane, and on one with areas
    // (areas.mjs) in a plane inset by its margins: the popover goes on the picture's own box
    // instead, where `place` measures from and nothing clips it.
    const plane = pin.closest(".fplane, .aplane");
    if (plane) plane.closest(".shot").append(pop);
    else pin.after(pop);
    pop.hidden = false;
    pin.setAttribute("aria-expanded", "true");
    pin.setAttribute("aria-controls", pop.id);
    openPin = pin;
    place(pin);
    (pop.querySelector('[aria-pressed="true"]') || pop.querySelector(".pc")).focus();
  }

  /** Close it; a note typed and not yet saved goes out now. A mark left with nothing said is
   *  then taken off the frame (marks-client.js `closed`), and focus has no button to return to. */
  function close(focusPin) {
    if (!openPin) return;
    const pin = openPin;
    openPin = null;
    pop.hidden = true;
    pin.setAttribute("aria-expanded", "false");
    api.flush();
    if (isMark(pin)) api.closed?.(pin);
    if (focusPin && pin.isConnected) pin.focus();
  }

  /** Each pin as the record has it: the chosen glyph on its badge, ✎ when it has a note, and its
   *  name with both. */
  function paint() {
    const off = api.locked();
    for (const pin of document.querySelectorAll(".pin")) {
      const v = saved(pin);
      if (v) pin.dataset.r = v;
      else delete pin.dataset.r;
      const noted = Boolean(savedNote(pin));
      if (noted) pin.dataset.noted = "";
      else delete pin.dataset.noted;
      pin.querySelector(".pg").textContent = v ? glyphs(pin)[v] : "";
      const bits = [v ? words(pin)[v] : "", noted ? "with a note" : ""].filter(Boolean);
      const name = pin.dataset.name;
      pin.setAttribute("aria-label", bits.length ? `${name} — ${bits.join(", ")}` : name);
      pin.disabled = off;
    }
    if (field) field.disabled = off;
    if (off) close(false);
  }

  /** A choice tapped: saved; the popover closes, unless he is writing a note in it — then it
   *  stays, the choice pressed, focus where he tapped. */
  function choose(choice) {
    const pin = openPin;
    if (api.locked()) return close(false);
    api.react(keyOf(pin), pin.dataset.pin, choice.dataset.r);
    if (box.hidden) return close(true);
    fillChoices(pin);
    pop.querySelector(`.pc[data-r="${choice.dataset.r}"]`)?.focus();
  }

  document.addEventListener("click", (ev) => {
    const t = ev.target;
    const choice = t.closest?.(".pc");
    if (choice && openPin && pop.contains(choice)) return choose(choice);
    if (t === addBtn && openPin) {
      showNote(true);
      place(openPin);
      return field.focus();
    }
    const pin = t.closest?.(".pin");
    if (pin) {
      if (api.locked()) return;
      return openPin === pin ? close(true) : open(pin);
    }
    away(ev);
  });
  /** A tap away from any pin: with a popover open it only closes it; with none open, a tap on a
   *  frame's picture may leave a new mark there (marks-client.js `spot`), which opens like a pin. */
  function away(ev) {
    if (openPin) {
      if (!pop.contains(ev.target)) close(false);
      return;
    }
    const made = api.spot?.(ev);
    if (made) open(made);
  }
  document.addEventListener("input", (ev) => {
    if (ev.target !== field || !openPin || api.locked()) return;
    count();
    api.note(keyOf(openPin), openPin.dataset.pin, field.value.slice(0, PINS.noteMax));
  });
  document.addEventListener("keydown", (ev) => {
    if (!openPin) return;
    // Escape closes and keeps the text: close() saves it.
    if (ev.key === "Escape") return close(true);
    if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
    // In the field the arrows move the caret; only on a choice do they step between choices.
    const all = [...pop.querySelectorAll(".pc")];
    const i = all.indexOf(document.activeElement);
    if (i < 0) return;
    const step = ev.key === "ArrowRight" ? 1 : all.length - 1;
    all[(i + step) % all.length].focus();
  });
  document.addEventListener("focusin", (ev) => {
    if (openPin && ev.target !== openPin && !pop.contains(ev.target)) close(false);
  });
  window.addEventListener("resize", () => {
    if (openPin) place(openPin);
  });
  return { paint, said };
};
