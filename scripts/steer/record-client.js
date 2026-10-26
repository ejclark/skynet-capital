// A DECISION RECORD'S SHAPE — inlined by render.mjs ahead of page-client.js, which takes these from
// `globalThis.steerRecord` and keeps the state, the store and the writes. Never run by node.
//
// What one answer's record holds and how its keyed fields read, merge and toggle: the fields
// merged one key at a time (`MAPS`) or alone (`MERGED`), a blank record, a stored one as the page
// holds it (`fromDoc`), a note or a keyed value as it is written, and a field path (`pins.B:phone:1`)
// read and put on a record. Pure: no page state, no store, no DOM.
globalThis.steerRecord = (() => {
  /** A decision record's fields keyed by pin (or mark) id, each merged one key at a time. */
  const MAPS = ["pins", "pinNotes", "marks", "outcomesAdded", "optionNotes"];
  /** A decision record's own fields merged alone, never with the whole record: `revealAt`. */
  const MERGED = ["revealAt"];
  const blank = () => ({
    pick: null,
    react: {},
    verdict: null,
    note: "",
    pins: {},
    pinNotes: {},
    marks: {},
    outcomesAdded: {},
    optionNotes: {},
    revealAt: null,
  });
  /** A stored `pins` or `pinNotes` that isn't a plain object (a hand-edited record) reads as none. */
  const mapOf = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
  /** A note as it is written: the text, or null for an empty one. */
  const noteValue = (v) => (typeof v === "string" && v.trim() ? v : null);
  /** One pin key's stored value: a reaction as it is, a note as noteValue, a mark as its spot
   *  (marks-client.js); a cleared one is null. */
  const keyValue = (field, v) => {
    if (field === "pinNotes" || field === "optionNotes") return noteValue(v);
    if (field === "marks") return v && typeof v === "object" ? v : null;
    // An added outcome (outcomes-client.js) is its words and when; a blank one is none.
    if (field === "outcomesAdded") return typeof v?.text === "string" && v.text.trim() ? v : null;
    return v || null;
  };
  /** The live entries of one keyed field, as a whole record writes them. */
  const liveOf = (field, m) =>
    Object.fromEntries(Object.entries(mapOf(m)).filter(([, v]) => keyValue(field, v)));
  /** A field path (`pick`, `react.A`, `pins.B:phone:1`) → [field, sub-key or undefined]. */
  const split = (p) => {
    const i = p.indexOf(".");
    return i < 0 ? [p] : [p.slice(0, i), p.slice(i + 1)];
  };
  const read = (r, p) => {
    const [f, k] = split(p);
    return k === undefined ? r?.[f] : r?.[f]?.[k];
  };
  function put(r, p, v) {
    const [f, k] = split(p);
    if (k === undefined) r[f] = v;
    else {
      r[f] = { ...mapOf(r[f]) };
      if (v == null) delete r[f][k];
      else r[f][k] = v;
    }
  }
  /** An option row's press: Build toggles the pick (and lifts a Not on it); More/Not toggles its
   *  mark (and a Not drops the pick). */
  function pressOption(r, opt, v) {
    if (v === "build") {
      r.pick = r.pick === opt ? null : opt;
      if (r.pick === opt && r.react[opt] === "not") delete r.react[opt];
      return;
    }
    if (r.react[opt] === v) delete r.react[opt];
    else r.react[opt] = v;
    if (v === "not" && r.pick === opt) r.pick = null;
  }
  /** One press: an option row toggles its pick or its More/Not mark; any other row its verdict.
   *  Returns the field paths it changed. */
  function toggle(r, opt, v) {
    if (!opt) {
      r.verdict = r.verdict === v ? null : v;
      return ["verdict"];
    }
    const was = { pick: r.pick, mark: r.react[opt] };
    pressOption(r, opt, v);
    const paths = [];
    if (r.pick !== was.pick) paths.push("pick");
    if (r.react[opt] !== was.mark) paths.push(`react.${opt}`);
    return paths;
  }
  const fromDoc = (v = {}) => ({
    pick: v.pick || null,
    react: v.react || {},
    verdict: v.verdict || null,
    note: v.note || "",
    // A cleared reaction or note is stored as null (saveKeys); the page holds only the live ones.
    pins: liveOf("pins", v.pins),
    pinNotes: liveOf("pinNotes", v.pinNotes),
    // Records saved before marks and the reveal existed read as none of either.
    marks: liveOf("marks", v.marks),
    outcomesAdded: liveOf("outcomesAdded", v.outcomesAdded),
    optionNotes: liveOf("optionNotes", v.optionNotes),
    revealAt: typeof v.revealAt === "string" ? v.revealAt : null,
  });
  return {
    MAPS,
    MERGED,
    blank,
    fromDoc,
    keyValue,
    liveOf,
    noteValue,
    put,
    read,
    split,
    toggle,
  };
})();
