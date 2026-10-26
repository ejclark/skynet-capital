// COPY AS TEXT — inlined by render.mjs ahead of page-client.js, which takes `textOf` from
// `globalThis.steerCopy` and hands it what the page holds. Never run by node.
//
// The page's answers as plain lines to paste in chat, for a view whose store won't save. Pure: the
// state, the round and what each picture says arrive as arguments, and nothing here reads the
// page, the store or the DOM. `said` is `{ pins, marks, outcomes, optionNotes }`, each `(key, r)`
// → the entries that picture says for one decision (their `said`, pins-client.js and kin).
globalThis.steerCopy = (() => {
  const { blank } = globalThis.steerRecord;
  const line = (s) => (s || "").trim().replace(/\s+/g, " ");
  /** One decision as a line: its pick, verdict, reactions, pins, marks, outcomes and notes. */
  function decisionText(d, record, said) {
    const r = record || blank();
    // A round-0 pick chooses a problem to fix first; it is never a build (docs/process/REDESIGN.md).
    const bits = [r.pick && `${d.problems ? "fix first" : "build"} ${r.pick}`, r.verdict].filter(
      Boolean,
    );
    for (const o of Object.keys(r.react).sort()) bits.push(`${r.react[o]} ${o}`);
    for (const [id, v, n] of said.pins(d.key, r) ?? [])
      bits.push(["pin", id, v, n && `“${line(n)}”`].filter(Boolean).join(" "));
    for (const [id, v, n] of said.marks(d.key, r) ?? []) {
      const m = r.marks[id];
      const at = `${Math.round(m.x)}% across ${Math.round(m.y)}% down`;
      bits.push(["mark", id, at, v, n && `“${line(n)}”`].filter(Boolean).join(" "));
    }
    for (const [, t] of said.outcomes(d.key, r) ?? []) bits.push(`outcome “${line(t)}”`);
    bits.push(...said.optionNotes(d.key, r).map(([o, t]) => `note on ${o} “${line(t)}”`));
    const note = line(r.note);
    return `#${d.issue} ${d.title}: ${bits.join(", ") || "—"}${note ? ` | ${note}` : ""}`;
  }
  /** The whole page as text: every decision, each queue and reel verdict, and whether Done. */
  function textOf({ id, decisions, state, meta, said }) {
    const lines = [
      `Decisions page ${id}`,
      ...decisions.map((d) => decisionText(d, state.decisions[d.key], said)),
    ];
    for (const sec of ["queue", "reel"]) {
      for (const [k, r] of Object.entries(state[sec])) {
        if (r.verdict) lines.push(`${sec} #${k}: ${r.verdict}${r.note ? ` | ${r.note}` : ""}`);
      }
    }
    lines.push(meta.doneAt ? `Done at ${meta.doneAt}` : "Not marked done");
    return lines.join("\n");
  }
  return { textOf };
})();
