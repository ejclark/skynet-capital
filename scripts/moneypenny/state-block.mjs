#!/usr/bin/env node
// THE STATE BLOCK, PARSED — split out of continuation.mjs (#3818 slice 8) when that file crossed the
// 300-code-line cap. Everything here is PURE text handling over a plan issue's comments: find the
// block, read its next-pickup line, fingerprint it, and read back the receipts the continuation lane
// leaves beside it. No network, no clock.
//
// WHY ITS OWN FILE, and not an arbitrary cut to get under a number: `docs/ISSUES.md` → *The state
// block* is a FORMAT, and a format deserves one parser. The continuation lane is its first consumer
// (the pickup line is its fallback target, the fingerprint is its proof that a slice did the work);
// a digest, a stall audit or a board sync reading the same block should import these rather than
// re-derive the regexes, which is how two readers of one format drift apart.
import { createHash } from "node:crypto";

/** The receipt the continuation lane leaves when it continues a plan — and its memory of it. */
export const CONTINUE_MARKER = "<!-- moneypenny:continued";
/** The marker on a criterion-10 stop, so an unparked plan is never re-stopped for the same run. */
export const STOP_MARKER = "<!-- moneypenny:continue-stopped -->";

/** Pickup text that names nothing to build — a block saying the plan is finished, not a slice. */
const NO_PICKUP = /^(none|n\/?a|nothing|done|-|—|–)\b/i;

const firstLine = (body) =>
  String(body ?? "")
    .trim()
    .split("\n")[0]
    .trim();

/**
 * The plan's state block — the newest comment whose first line is its heading (`docs/ISSUES.md` →
 * *The state block*). The block, never the thread, is what names the next slice; a plan with no
 * block is not continuable, because there is nothing to say what "the next slice" means.
 *
 * @returns {{ id?: number, body: string, updatedAt?: string } | null}
 */
export function stateBlockOf(comments = []) {
  const blocks = (comments ?? []).filter((c) => /^##\s+state block/i.test(firstLine(c?.body)));
  const newest = blocks[blocks.length - 1];
  return newest ? { id: newest.id, body: String(newest.body), updatedAt: newest.updated_at } : null;
}

/**
 * The block's next-pickup text, whitespace-collapsed — the fallback target when a plan has no open
 * sub-issues left (#4056's correction to this slice: "target the next open, unblocked sub-issue
 * when one exists; fall back to the state block otherwise").
 *
 * BOTH REAL SHAPES MATCH, and the looser pattern is why. `docs/ISSUES.md` writes the canonical form
 * with the bold spanning the whole line (`**Next pickup: slice 3, …. One PR.**`), while live blocks
 * (#3818's own, #4450's, #4469's) bold only the label (`**Next pickup:** slice 8 …`). A pattern
 * pinned to either one reads the other as "no pickup named", which is a refusal to continue a plan
 * that said exactly where to go — so the label is matched, its punctuation eaten, and the rest of
 * the paragraph taken as the text.
 */
export function nextPickupOf(blockBody) {
  const m = /\*\*next pickup\b[:*\s]*([\s\S]*?)(?:\n\s*\n|$)/i.exec(String(blockBody ?? ""));
  if (!m) return null;
  const text = m[1].replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  // "Next pickup: none — this closes the issue" names no slice. Matched at the START only: the
  // last slice's pickup line routinely ENDS with "this slice closes this issue", which is a slice.
  return !text || NO_PICKUP.test(text) ? null : text;
}

/**
 * A short, stable fingerprint of the state block — how criterion 10 answers "did the slice leave the
 * block unchanged?". A hash, not the comment's `updated_at`: the lane edits the block in place with
 * `gh api --method PATCH`, and an edit that rewrites the same text (a retry, a reformat) bumps the
 * timestamp while changing nothing a reader would call progress.
 */
export function blockFingerprint(blockBody) {
  const text = String(blockBody ?? "")
    .replace(/\r/g, "")
    .trim();
  return text ? createHash("sha256").update(text).digest("hex").slice(0, 12) : "";
}

/** The hidden data line on a receipt: the continuation lane's whole memory of a dispatch. */
export const receiptData = ({ runId, fingerprint, target }) =>
  `${CONTINUE_MARKER} ${JSON.stringify({ run: String(runId ?? ""), block: fingerprint, target })} -->`;

/** One receipt's data back out of a comment body, or `null` when it carries none. */
export function parseReceipt(body) {
  const m = new RegExp(`${CONTINUE_MARKER}\\s*(\\{.*?\\})\\s*-->`).exec(String(body ?? ""));
  if (!m) return null;
  try {
    const d = JSON.parse(m[1]);
    return { runId: String(d.run ?? ""), fingerprint: String(d.block ?? ""), target: d.target };
  } catch {
    return null;
  }
}

/** Every receipt this lane has left on one plan, oldest first — the daily cap's counter. */
export function allReceiptsOf(comments = []) {
  return (comments ?? [])
    .map((c) => ({
      createdAt: c?.created_at ?? c?.createdAt ?? "",
      body: String(c?.body ?? ""),
      data: parseReceipt(c?.body),
    }))
    .filter((r) => r.data)
    .map((r) => ({ createdAt: r.createdAt, ...r.data }));
}

/**
 * The receipts a criterion-10 judgment may look at: only those NEWER than the last stop. A stop
 * ends that chain — once Eric clears the parking label, the next continuation starts fresh rather
 * than re-judging the run he already saw and deliberately resumed past. (Without this, an unparked
 * plan would be stopped again on the same evidence forever.)
 *
 * The DAILY CAP deliberately reads `allReceiptsOf` instead, so a stop-then-unpark cycle still
 * counts against the dial's `continuationsPerDay` — otherwise clearing the label would also clear
 * the day's budget.
 */
export function receiptsOf(comments = []) {
  const stops = (comments ?? []).filter((c) => String(c?.body ?? "").includes(STOP_MARKER));
  const newestStop = stops[stops.length - 1];
  const since = newestStop
    ? Date.parse(newestStop.created_at ?? newestStop.createdAt ?? "")
    : -Infinity;
  return allReceiptsOf(comments).filter((r) => Date.parse(r.createdAt) > since);
}

/** The receipt a continuation leaves on the plan — and the data criterion 10 later reads back. */
export function receiptBody({ pickup, target, runId, runUrl, fingerprint, model, footer }) {
  return [
    "**Continuing this plan** — a slice landed, so the next one starts without a fresh ready-flip.",
    "",
    `- Taking: ${pickup}`,
    `- Build run: ${runUrl || "this run"}`,
    `- Model: \`${model}\` — below the top tier: a continued slice's scope is already written in the state block (#3818, criterion 9).`,
    "",
    "If that build fails or leaves the state block unchanged, this lane stops continuing this plan " +
      "and assigns Eric with the run link (#3818, criterion 10). Nothing needed from anyone here.",
    "",
    receiptData({ runId, fingerprint, target }),
    "",
    "— Moneypenny",
    "",
    footer,
  ].join("\n");
}
