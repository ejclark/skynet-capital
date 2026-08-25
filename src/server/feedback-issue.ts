/**
 * What actually gets FILED — the labels, the title tag, the pseudonymous submitter marker, and the
 * markdown body. Split out of feedback-service.ts, whose job is the transport: "POST an issue".
 * What an issue SAYS is a different concern, and the file crossed its architecture budget the
 * moment provenance arrived.
 *
 * Two different things shape a filed issue and they compose rather than compete:
 *   • the CAPSULE (docs/ISSUES.md) — how it READS: talking points above one fold, a metadata table.
 *   • the BUILD SPEC (this file's fenced `skynet-spec` block) — what it COMMITS TO: acceptance
 *     criteria, assumptions, out-of-scope, readiness.
 *
 * Why the spec exists: before it, a filed issue recorded NOTHING about how it was written, so a
 * fully-interrogated ask and a one-line paste looked identical to the build lane — and it had to
 * treat both as the vaguer one. That is what made the lane's triage rules conservative enough to
 * keep landing ordinary member feedback on Eric's queue.
 */
import { createHash } from "node:crypto";

import type { FeedbackSpec } from "./feedback-coach.js";
import type { FeedbackImageInput } from "./feedback-images.js";

export type FeedbackKind = "bug" | "feature" | "idea";

export interface FeedbackInput {
  readonly kind: FeedbackKind;
  readonly title: string;
  readonly details: string;
  readonly area?: string;
  readonly submitterEmail?: string;
  /**
   * The coach's build spec, when the member came through the guided path. Its PRESENCE is the
   * provenance signal — it is what tells the build lane this ask was already interrogated against a
   * completeness bar, and may therefore be built unattended rather than escalated.
   */
  readonly spec?: FeedbackSpec;
  /** Screenshots the member attached, raw off the form — feedback-service.ts uploads these before
   *  filing and hands `issueBody` the resulting URLs, never these data URLs directly. */
  readonly images?: readonly FeedbackImageInput[];
}

/** The issue title a submission gets — the tag mirrors the .github/ISSUE_TEMPLATE forms. */
export function titleFor(input: FeedbackInput): string {
  return `${TITLE_TAG[input.kind]} ${input.title.trim()}`;
}

/**
 * The labels a submission is filed under — its kind, plus whatever its provenance earns. `curated`
 * widens what the build lane will build unattended; `needs-eric` is the envelope check moved to
 * INTAKE, so an ask that was always going to need the owner costs a sentence on the form instead of
 * a whole build session discovering it. `needs-info` waits on the MEMBER, never on Eric.
 */
export function labelsFor(input: FeedbackInput): readonly string[] {
  const spec = input.spec;
  if (!spec) return LABELS[input.kind];
  return [
    ...LABELS[input.kind],
    "curated",
    ...(spec.needsEric ? ["needs-eric"] : []),
    ...(spec.readiness === "partial" ? ["needs-info"] : []),
  ];
}

/**
 * The machine-readable half of a curated issue, appended inside the body. The build session reads
 * this instead of re-interrogating a member who already answered the coach's questions — the spec
 * IS the specification. Fenced and typed so it survives a human editing the prose around it.
 */
function specBlock(spec: FeedbackSpec): readonly string[] {
  const bullets = (label: string, items: readonly string[]): readonly string[] =>
    items.length ? [`**${label}**`, ...items.map((i) => `- ${i}`), ""] : [];
  return [
    "",
    ...bullets("Acceptance criteria", spec.criteria),
    ...bullets("Assumptions (unanswered — confirm before relying on these)", spec.assumptions),
    ...bullets("Explicitly out of scope", spec.outOfScope),
    ...(spec.needsEric ? ["> [!IMPORTANT]", `> Needs Eric: ${spec.needsEric}`, ""] : []),
    "```skynet-spec",
    JSON.stringify(spec),
    "```",
  ];
}

// Labels match the .github/ISSUE_TEMPLATE forms so app + GitHub submissions triage the same way.
const LABELS: Record<FeedbackKind, readonly string[]> = {
  bug: ["bug", "feedback"],
  feature: ["enhancement", "feedback"],
  idea: ["idea", "feedback"],
};
const FEEDBACK_KIND_LABEL: Record<FeedbackKind, string> = {
  bug: "🐞 Bug",
  feature: "✨ Feature",
  idea: "🗺️ Side quest",
};
const TITLE_TAG: Record<FeedbackKind, string> = {
  bug: "[bug]",
  feature: "[enhancement]",
  idea: "[idea]",
};

/**
 * Opaque, stable member marker for public issues. The repo is public, so the issue body must never
 * carry a name or email (Eric's attribution ruling, 2026-08-19: opaque id only — who-filed-what is
 * visible only inside the app). Truncated salted sha256: stable per member so their items
 * correlate, pseudonymous to readers. Not cryptographically unlinkable for a tiny guest list —
 * treated as pseudonymity, not secrecy.
 */
export function opaqueMemberId(email: string): string {
  return createHash("sha256")
    .update(`skynet-feedback:${email.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 10);
}

/**
 * The filed issue's body: the member's words first (the ask is what a human reads first), then the
 * metadata as a small table rather than a run of `**Key:** value` lines — repeated key/value facts
 * are scanned in a table and skipped as prose (docs/ISSUES.md). The pseudonymous footer is last
 * and unchanged.
 */
export function issueBody(input: FeedbackInput, imageUrls: readonly string[] = []): string {
  const lines: string[] = [input.details.trim() || "_(no details provided)_", ""];
  if (imageUrls.length)
    lines.push(...imageUrls.map((url, i) => `![attachment ${i + 1}](${url})`), "");
  if (input.spec) lines.push(...specBlock(input.spec), "");
  const meta: [string, string][] = [["Kind", FEEDBACK_KIND_LABEL[input.kind]]];
  if (input.area) meta.push(["Where", input.area]);
  lines.push("| | |", "|---|---|", ...meta.map(([k, v]) => `| **${k}** | ${v} |`));
  const who = input.submitterEmail?.trim()
    ? `member \`${opaqueMemberId(input.submitterEmail)}\``
    : "a league member";
  lines.push("", "---", `_Submitted from the app by ${who}._`);
  return lines.join("\n");
}
