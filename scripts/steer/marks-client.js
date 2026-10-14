// MARKS AND THE REVEAL on a design round's own page (marks.mjs) — inlined by render.mjs ahead of
// page-client.js, which calls `steerMarks(api)` once with the page's own state. Never run by node.
//
// Eric, 2026-10-14: "doesn't this create bias through the process out of the gate?" — so he marks
// the frames himself first. A tap on any frame's picture, away from a pin, places a mark there: a
// small dot (the button stays a 32px tap target, what shows is a 12px dot) that opens the pins'
// own popover (pins-client.js asks `spot(ev)` for it), with 👍 Like · 👎 Don't like · ✏︎ Would
// change and "✎ Add a note". Its spot is in % of the picture, so it tracks the scaled image.
//
// SAVED WITH ITS FIRST WORD. A mark is held here (`pending`) until he says something on it; the
// first reaction or note `claim`s it into the decision's record, and page-client writes its
// `marks[<id>]` with that reaction or note in the same merge. A mark closed with nothing said goes:
// one never saved simply leaves the frame, one saved and then emptied is written as
// `marks[<id>]: null` (`api.changed`, page-client's one write path for a script beside it). On load,
// every mark the record holds is painted back on each frame it names — the clean Today frame and
// the pinned one show the same marks, so after the reveal his spots sit beside Claude's pins.
//
// THE REVEAL. An opening question folds Claude's problems under "Show what Claude found"
// (aria-expanded). The first press stamps `revealAt` on the decision's record, merged alone; the
// region opens on every later load while that stamp is there, and each mark records whether it was
// placed before it (`beforeReveal`). A locked page (no store, or view only) takes no marks and
// stamps nothing, but its reveal still opens, so the problems can be read.
globalThis.steerMarks = (api) => {
  const MARKS = api.marks; // { glyph, words, reveal } from marks.mjs; only on a round's own page
  if (!MARKS) return null;
  const ID = /^(.+):(phone|desk):m[a-z0-9]+$/;
  /** Marks placed in this view and not yet saved: id → { key, x, y, at, beforeReveal }. */
  const pending = new Map();
  /** The reveal as this view left it, by decision key; else the record's `revealAt` decides. */
  const shownHere = new Map();
  /** The frames each decision shows, as `<option>:<frame>`: a mark anywhere else never counts. */
  const FRAMES = new Map();
  for (const f of document.querySelectorAll(".markable")) {
    const set = FRAMES.get(f.dataset.key) ?? new Set();
    FRAMES.set(f.dataset.key, set.add(`${f.dataset.option}:${f.dataset.frame}`));
  }

  const mapOf = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
  const noteOf = (r, id) => {
    const v = r?.pinNotes?.[id];
    return typeof v === "string" && v.trim() ? v : null;
  };
  const reactionOf = (r, id) => (MARKS.glyph[r?.pins?.[id]] ? r.pins[id] : null);
  const round1 = (v) => Math.round(Math.min(100, Math.max(0, v)) * 10) / 10;
  const nameOf = (x, y) => `Your mark, ${Math.round(x)}% across, ${Math.round(y)}% down`;
  /** Has he pressed "Show what Claude found" on this decision (saved, or here)? */
  const revealed = (key) => shownHere.get(key) ?? Boolean(api.saved(key)?.revealAt);

  /** What a record says through marks on frames this decision shows, as [id, reaction, note] —
   *  what counts as an answer and what Copy as text carries. */
  const said = (key, r) =>
    Object.entries(mapOf(r?.marks))
      .filter(([id, m]) => {
        const hit = ID.exec(id);
        return m && hit && FRAMES.get(key)?.has(`${hit[1]}:${hit[2]}`);
      })
      .map(([id]) => [id, reactionOf(r, id), noteOf(r, id)])
      .filter(([, v, n]) => v || n);

  /** A mark's button, as a pin's is built (pins.mjs `pinnedShot`), with no number. */
  function button(id, x, y) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pin mark";
    b.dataset.pin = id;
    b.dataset.mark = "";
    b.dataset.name = nameOf(x, y);
    b.style.left = `${x}%`;
    b.style.top = `${y}%`;
    b.setAttribute("aria-label", b.dataset.name);
    b.setAttribute("aria-haspopup", "true");
    b.setAttribute("aria-expanded", "false");
    for (const [cls, text] of [
      ["pg", ""],
      ["pk", "✎"],
    ]) {
      const s = document.createElement("span");
      s.className = cls;
      s.setAttribute("aria-hidden", "true");
      s.textContent = text;
      b.append(s);
    }
    return b;
  }

  /** A tap on a frame's picture → a new mark there, held until he says something on it; null
   *  when the tap wasn't on a picture, or the page is locked. */
  function spot(ev) {
    if (api.locked()) return null;
    const pic = ev.target.closest?.(".markable .frame");
    if (!pic) return null;
    const frame = pic.closest(".markable");
    const box = pic.getBoundingClientRect();
    if (!(box.width > 0 && box.height > 0)) return null;
    const x = round1(((ev.clientX - box.left) / box.width) * 100);
    const y = round1(((ev.clientY - box.top) / box.height) * 100);
    const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const id = `${frame.dataset.option}:${frame.dataset.frame}:m${unique}`;
    const key = frame.dataset.key;
    const at = new Date().toISOString();
    pending.set(id, { key, x, y, at, beforeReveal: api.opening(key) && !revealed(key) });
    const b = button(id, x, y);
    frame.append(b);
    return b;
  }

  /** His first word on a held mark: it leaves `pending` and goes into the decision's record, and
   *  the field path to write with that word comes back. [] for a mark already saved (or a pin). */
  function claim(key, id) {
    const m = pending.get(id);
    if (!m) return [];
    pending.delete(id);
    const r = api.rec(key);
    r.marks = { ...r.marks, [id]: { x: m.x, y: m.y, at: m.at, beforeReveal: m.beforeReveal } };
    return [`marks.${id}`];
  }

  /** A mark's popover closed: with nothing said on it, it leaves every frame — and the record,
   *  when it was saved (`marks[<id>]: null`). */
  function closed(pin) {
    const id = pin.dataset.pin;
    const key = pin.closest(".shot")?.dataset.key ?? pending.get(id)?.key;
    const r = api.saved(key);
    if (reactionOf(r, id) || noteOf(r, id)) return;
    for (const b of document.querySelectorAll(".pin[data-mark]"))
      if (b.dataset.pin === id) b.remove();
    if (pending.delete(id) || !r?.marks?.[id]) return;
    r.marks = { ...r.marks };
    delete r.marks[id];
    api.changed(key, [`marks.${id}`]);
  }

  /** Every mark the records hold and every held one, on each frame it names; any other mark
   *  button goes (a view gone dark shows none). */
  function paintMarks() {
    const want = new Map(pending);
    for (const key of FRAMES.keys()) for (const [id, m] of savedMarks(key)) want.set(id, m);
    for (const b of document.querySelectorAll(".pin[data-mark]"))
      if (!want.has(b.dataset.pin)) b.remove();
    for (const [id, m] of want) for (const f of framesOf(id, m.key)) place(f, id, m);
  }
  /** The live marks one decision's record holds, as [id, { key, x, y }]. */
  const savedMarks = (key) =>
    Object.entries(mapOf(api.saved(key)?.marks))
      .filter(([id, m]) => m && ID.test(id))
      .map(([id, m]) => [id, { key, x: m.x, y: m.y }]);
  /** The frames a mark's id names, on its decision: the clean one and the pinned one alike. */
  function framesOf(id, key) {
    const [, option, size] = ID.exec(id);
    return [...document.querySelectorAll(".markable")].filter(
      (f) => f.dataset.key === key && f.dataset.option === option && f.dataset.frame === size,
    );
  }
  /** A mark's button on one frame, once. */
  function place(frame, id, m) {
    const there = [...frame.querySelectorAll(".pin[data-mark]")].some((b) => b.dataset.pin === id);
    if (!there) frame.append(button(id, m.x, m.y));
  }

  /** Each reveal button and its region, open or folded; the glyph turns with it. */
  function paintReveal() {
    for (const b of document.querySelectorAll(".revealer")) {
      const open = revealed(b.dataset.key);
      const region = document.getElementById(b.getAttribute("aria-controls"));
      if (region) region.hidden = !open;
      b.setAttribute("aria-expanded", open ? "true" : "false");
      b.querySelector(".rg").textContent = open ? "▾" : "▸";
      b.querySelector(".rw").textContent = open ? MARKS.reveal.hide : MARKS.reveal.show;
    }
  }

  function paint() {
    const off = api.locked();
    for (const f of document.querySelectorAll(".markable")) f.classList.toggle("off", off);
    paintMarks();
    paintReveal();
  }

  document.addEventListener("click", (ev) => {
    const b = ev.target.closest?.(".revealer");
    if (!b) return;
    const key = b.dataset.key;
    const open = !revealed(key);
    shownHere.set(key, open);
    // The first press is the one that counts: a later fold and unfold changes no stamp. It is
    // merged alone (page-client.js MERGED), never by rewriting the record.
    if (open && !api.locked() && !api.saved(key)?.revealAt) {
      api.rec(key).revealAt = new Date().toISOString();
      api.changed(key, ["revealAt"]);
    }
    paint();
  });

  return { spot, claim, closed, paint, said, revealed };
};
