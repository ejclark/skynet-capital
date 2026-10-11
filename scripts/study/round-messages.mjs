// What each blind role of a round reads (#4943) — PURE text, built only from the packets a script
// made (member cards, the area's roles and page list, the job map, the facts sheet, traces, the
// census, the harvest). Nothing here reaches for the repo, the answer key or a route the packet
// did not carry. The experts and the words pass read the roles, never a member card (#5099): a
// card's own words can hint at an item, and the grader counts their finds as unprimed.
// The images go beside the text through sealed.mjs → userMessage. Specced in
// tests/scripts/study-round.spec.ts.

const json = (v) => JSON.stringify(v, null, 1);
const cardsBlock = (cards) =>
  Object.entries(cards)
    .map(([, text]) => text.trim())
    .join("\n\n---\n\n");

/** The framer: every card, then the area's pages in plain words. */
export function framerText({ cards, pages }) {
  return [
    "## The people who use this app (member cards)",
    cardsBlock(cards),
    "## The pages in this area of the app",
    pages.map((p) => `- ${p}`).join("\n"),
    "## Your answer",
    "Frame what these people hire this area to do, per your instructions.",
  ].join("\n\n");
}

/** One fact as the task author reads it: id · what it is · how the page shows it. */
const factLine = (f) => `- ${f.id} · ${f.label} · shown as ${f.display}${f.weak ? " (weak)" : ""}`;

/**
 * The task author, for one member in one world: that member's card, the job map, the facts that
 * member's view holds. On a rewrite, its own previous tasks and ONLY the lint's lines.
 */
export function taskAuthorText({ card, jobMap, facts, tasksPer, previous, feedback }) {
  const parts = [
    "## The member",
    card.trim(),
    "## The job map",
    json(jobMap),
    "## The fact sheet (true facts about this member's test data)",
    facts.map(factLine).join("\n"),
    "## Your answer",
    `Write ${tasksPer} tasks for this member. answerRegion is the fact's id, exactly as listed.`,
  ];
  if (previous) {
    parts.push(
      "## Your previous tasks",
      json(previous),
      "## Rewrite these items",
      feedback.join("\n"),
      "Rewrite only the items named; keep the others as they were.",
    );
  }
  return parts.join("\n\n");
}

/**
 * A recorder finding as an analyst reads it: what kind, how bad, and the on-screen text it sat
 * near. Never its `what` (which names the box by its CSS selector, text from the source, not the
 * screen) or its fix size.
 */
export const recorderView = (f) => ({
  kind: f.kind,
  severity: f.severity,
  ...(f.snippet ? { near: f.snippet } : {}),
});

/** One session as an analyst reads it: label, task, outcome, measurements, then every turn. */
function sessionBlock(s) {
  const turns = s.turns.map((t) => {
    const a = t.action ?? {};
    const keep = {
      n: t.n,
      as_member: t.as_member,
      noticed: t.noticed,
      expect: t.expect,
      last_expectation: t.last_expectation,
      confusion: t.confusion,
      action: a,
    };
    return t.refused ? { ...keep, refused: t.refused } : keep;
  });
  const sum = s.summary;
  return [
    `### ${s.label} — ${s.viewport}, task "${s.scenario}"`,
    `Outcome: ${sum.oracle?.success ? "success" : "not a success"} (${sum.oracle?.reason}); ended by ${sum.oracle?.endedBy}; ease ${sum.ease?.score ?? "none"}${sum.ease?.reason ? ` — "${sum.ease.reason}"` : ""}.`,
    `Measurements: ${json(sum.metrics)}`,
    `Recorder findings: ${json((sum.findings ?? []).map(recorderView))}`,
    `Frames shown below for this session: ${s.frames.map((f) => `${f.label} (${f.why.join(", ")}${f.turns.length ? `; turn ${f.turns.join(", ")}` : ""})`).join(" · ") || "none"}`,
    `Turns:\n${turns.map((t) => json(t)).join("\n")}`,
  ].join("\n");
}

/** An analyst, over one member's sessions. */
export function analystText({ card, sessions, dropped, coreDropped = 0 }) {
  const firstLast =
    coreDropped > 0
      ? `${coreDropped} first or last frame(s) are among them.`
      : "every first and last frame is here.";
  return [
    "## The member",
    card.trim(),
    "## Their sessions",
    sessions.map(sessionBlock).join("\n\n"),
    dropped > 0
      ? `(${dropped} further key frame(s) were left out to keep this message under the image limit; ${firstLast})`
      : "",
    "## Your answer",
    "Turn these sessions into findings, per your instructions. Cite sessions by label (S1…) and frames by label (F1…).",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** An expert's batch: the area's roles, the page and width, the census entries verbatim, the frames. */
export function expertBatchText({ roles, batch, frames, n, of }) {
  return [
    "## Who uses this area",
    roles.trim(),
    `## Batch ${n} of ${of}: page ${batch.route} at ${batch.viewport} width`,
    "Every control on this page was operated once by machine, in the order listed. The census entries, verbatim:",
    json(batch.entries),
    "## Frames",
    frames.map((f) => `${f.label} = control #${f.order} "${f.name}", ${f.which}`).join("\n") ||
      "(no control in this batch was operated)",
    "## Your answer",
    `Review this batch per your instructions. Name the page as "${batch.route}". Cite frames by label.`,
  ].join("\n\n");
}

/** An expert's consolidation: every batch finding it wrote, with ids, and nothing else new. */
export function expertConsolidationText({ roles, batchFindings, impressions }) {
  return [
    "## Who uses this area",
    roles.trim(),
    "## Your first impressions, page by page",
    json(impressions),
    "## Every finding you wrote, batch by batch",
    batchFindings.map((f) => `${f.id}: ${json(f.finding)}`).join("\n"),
    "## Your answer",
    "Merge duplicates across batches, re-rank by severity, and add the excise audit and posture per page. Each finding lists the batch findings it came from by id.",
  ].join("\n\n");
}

/** The words pass: the harvested strings, by page and kind, and the area's roles. */
export function wordsText({ roles, strings }) {
  return [
    "## Who reads these words",
    roles.trim(),
    "## The visible text, by page and by where it sits",
    json(strings.routes),
    "## Your answer",
    "Judge the text per your instructions. Quote each text exactly and name its page as given.",
  ].join("\n\n");
}

/** The member-type audit: the cards, as a set. */
export function auditText({ cards }) {
  return [
    "## The member cards this team designs with",
    cardsBlock(cards),
    "## Your answer",
    "Say who is missing, per your instructions.",
  ].join("\n\n");
}
