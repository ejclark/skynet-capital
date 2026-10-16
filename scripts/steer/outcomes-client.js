// OUTCOMES HE ADDS on a round's own page (outcomes.mjs) — inlined by render.mjs ahead of
// page-client.js, which calls `steerOutcomes(api)` once with the page's own state. Never run by
// node.
//
// Eric, 2026-10-14: "the redesign process must offer 'integrate this outcome' capabilities too."
// Under each question's scope, "＋ Add an outcome" opens a one-line field; Save (or Enter) puts his
// words in the decision's record as one key of `outcomesAdded` — `{ text, at }`, merged alone by
// page-client's one write path for a script beside it (`api.changed`), exactly as a mark is — and
// Cancel (or Escape) drops them. Each saved one reads "＋ <his words> (added by you)" with a × that
// removes it (written as null). The list is drawn from the record on every paint, so what another
// view added shows here too. A locked page disables the add button, the field and every ×.
globalThis.steerOutcomes = (api) => {
  const W = api.cfg; // OUTCOME_CLIENT from outcomes.mjs; only on a round's own page
  if (!(W && document.querySelector(".addout"))) return null;
  const ID = /^o[a-z0-9]+$/;
  const mapOf = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

  /** The outcomes a record holds, oldest first, as [id, { text, at }]. */
  const live = (r) =>
    Object.entries(mapOf(r?.outcomesAdded))
      .filter(([id, v]) => ID.test(id) && typeof v?.text === "string" && v.text.trim())
      .sort(([a, x], [b, y]) => String(x.at).localeCompare(String(y.at)) || a.localeCompare(b));
  /** What a record says through added outcomes, as [id, text] — what counts as an answer. */
  const said = (_key, r) => live(r).map(([id, v]) => [id, v.text]);

  /** One saved outcome's row: ＋, his words, whose they are, and its remove button. */
  function row(id, text, off) {
    const li = document.createElement("li");
    li.dataset.id = id;
    const plus = document.createElement("span");
    plus.setAttribute("aria-hidden", "true");
    plus.textContent = "＋";
    const words = document.createElement("span");
    words.className = "otx";
    const by = document.createElement("span");
    by.className = "oby";
    by.textContent = W.by;
    words.append(`${text} `, by);
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "orm";
    rm.textContent = "×";
    rm.setAttribute("aria-label", `${W.remove}: ${text}`);
    rm.disabled = off;
    li.append(plus, words, rm);
    return li;
  }

  /** The field of one control, open or folded behind its add button. */
  function show(box, on) {
    const form = box.querySelector(".oform");
    form.hidden = !on;
    box.querySelector(".oadd").setAttribute("aria-expanded", on ? "true" : "false");
    if (!on) form.querySelector(".otext").value = "";
  }

  function paint() {
    const off = api.locked();
    for (const box of document.querySelectorAll(".addout")) {
      const list = live(api.saved(box.dataset.key));
      box.querySelector(".added").replaceChildren(...list.map(([id, v]) => row(id, v.text, off)));
      // With no scope above it, the list gets its own heading once it has something in it.
      box.querySelector(".ohead").hidden = !(box.dataset.noscope !== undefined && list.length);
      box.querySelector(".oadd").disabled = off;
      for (const el of box.querySelectorAll(".otext, .osave")) el.disabled = off;
      if (off) show(box, false);
    }
  }

  /** Save what the field holds as a new outcome on its decision; an empty field saves nothing. */
  function save(box) {
    const field = box.querySelector(".otext");
    const text = field.value.slice(0, W.max);
    if (api.locked() || !text.trim()) return show(box, false);
    const key = box.dataset.key;
    const id = `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const r = api.rec(key);
    r.outcomesAdded = { ...mapOf(r.outcomesAdded), [id]: { text, at: new Date().toISOString() } };
    show(box, false);
    api.changed(key, [`outcomesAdded.${id}`]);
    box.querySelector(".oadd").focus();
  }

  /** Take one outcome off its decision: written as null, so every view drops it. */
  function remove(box, id) {
    if (api.locked()) return;
    const key = box.dataset.key;
    const r = api.rec(key);
    r.outcomesAdded = { ...mapOf(r.outcomesAdded) };
    delete r.outcomesAdded[id];
    api.changed(key, [`outcomesAdded.${id}`]);
    box.querySelector(".oadd").focus();
  }

  document.addEventListener("click", (ev) => {
    const box = ev.target.closest?.(".addout");
    if (!box) return;
    if (ev.target.closest(".oadd")) {
      if (api.locked()) return;
      show(box, true);
      return box.querySelector(".otext").focus();
    }
    if (ev.target.closest(".osave")) return save(box);
    if (ev.target.closest(".ocancel")) {
      show(box, false);
      return box.querySelector(".oadd").focus();
    }
    const rm = ev.target.closest(".orm");
    if (rm) remove(box, rm.closest("li").dataset.id);
  });
  document.addEventListener("keydown", (ev) => {
    if (!ev.target.matches?.(".addout .otext")) return;
    const box = ev.target.closest(".addout");
    if (ev.key === "Enter") {
      ev.preventDefault();
      save(box);
    } else if (ev.key === "Escape") {
      show(box, false);
      box.querySelector(".oadd").focus();
    }
  });

  return { paint, said };
};
