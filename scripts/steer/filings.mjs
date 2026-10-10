// STEER FILINGS — the words the read-back posts: Eric's notes quoted exactly, and the bodies of
// the issues his taps file (#5056). Each body is a capsule `issues.mjs create` will lint and accept
// (tests/scripts/steer-readback.spec.ts runs the gate on both), ends with the lane FOOTER, and
// carries the marker the next reel reads to say "because you said …". Pure.
import { FOOTER } from "../moneypenny/labels.mjs";
import { steerMarker } from "./model.mjs";

/** Eric's words, quoted exactly: every line kept, blank lines kept as a bare `>`. */
export const quote = (text) =>
  String(text)
    .split("\n")
    .map((l) => (l.length ? `> ${l}` : ">"))
    .join("\n");

export const noteBlock = (note) =>
  String(note ?? "").trim() ? `Eric's note:\n\n${quote(note)}` : "";
export const cut = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function buildIssue(d, r, id) {
  const opt = d.options.find((o) => o.key === r.pick) ?? { key: r.pick, name: r.pick, delta: "" };
  const title = cut(`Build "${opt.name}" for ${d.title}`, 110);
  const body = [
    `**Build option ${opt.key}, "${cut(opt.name, 60)}", from #${d.issue} — Eric picked it on the decisions page.**`,
    "",
    "| | |",
    "|---|---|",
    "| **Type** | feedback build (a design pick) |",
    `| **Surface** | ${d.topic ?? `as in #${d.issue}`} |`,
    `| **Source** | #${d.issue}${d.round ? `, round ${d.round}` : ""} · page ${id} |`,
    "",
    "- Built phone-first: the first screenshot is the 390 frame.",
    `- The option's pictures and the round's notes are on #${d.issue}.`,
    "",
    `Picture: waived — the option's pictures live on #${d.issue}'s round.`,
    "",
    "<details><summary><strong>The brief</strong> — what changes, and Eric's words</summary>",
    "",
    opt.delta ? `What changes: ${opt.delta}` : "",
    "",
    noteBlock(r.note) || "_No note — the pick is the whole answer._",
    "",
    "</details>",
    "",
    steerMarker(id, d.key),
    "",
    FOOTER,
  ].join("\n");
  return { kind: "issue", title, body, labels: ["feedback", "ready"], why: `Build on ${d.key}` };
}

export function revisitIssue(h, r, id) {
  const body = [
    `**Look again at what #${h.number} shipped — Eric flagged it on the decisions page.**`,
    "",
    "| | |",
    "|---|---|",
    "| **Type** | feedback (a review after merge) |",
    `| **Surface** | as in #${h.number} |`,
    `| **Source** | page ${id} |`,
    "",
    `- Merged as: ${cut(h.subject, 100)}`,
    "- Eric reviews live after merge; this is that review coming back.",
    "",
    "Picture: waived — the PR carries its own screenshots.",
    "",
    "<details><summary><strong>Eric's words</strong></summary>",
    "",
    noteBlock(r.note) || "_No note — Revisit was the whole answer._",
    "",
    "</details>",
    "",
    steerMarker(id, `reel-${h.number}`),
    "",
    FOOTER,
  ].join("\n");
  return {
    kind: "issue",
    title: cut(`Revisit #${h.number}: ${h.subject}`, 110),
    body,
    labels: ["feedback"],
    why: `Revisit on #${h.number}`,
  };
}
