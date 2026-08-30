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
import { memberLabelFor, opaqueMemberId, submitterFor } from "./feedback-attribution.js";
import type { FeedbackSpec } from "./feedback-coach.js";
import type { FeedbackImageInput } from "./feedback-images.js";

// Re-exported so every existing consumer keeps one import site — the shapes and the transport
// live here; who-filed-this now lives in feedback-attribution.js.
export { opaqueMemberId };

export type FeedbackKind = "bug" | "feature" | "idea";

export interface FeedbackInput {
  readonly kind: FeedbackKind;
  readonly title: string;
  readonly details: string;
  readonly area?: string;
  readonly submitterEmail?: string;
  /** The signed-in member's OAuth profile name (Session.name) — may or may not be their real
   *  name, and is never their email. Shown alongside the opaque id so other contributors can
   *  recognize who filed an issue; the id remains the stable key (a rename doesn't break it). */
  readonly submitterName?: string;
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
 * a whole build session discovering it. `needs-info` waits on the MEMBER, never on Eric. The
 * per-member label (Eric, 2026-08-25) is what makes "everything from one member" filterable in
 * GitHub's own issue search the way `author:` would be — every issue on this repo is filed by the
 * same bot token, so `author:` can't do it; `label:member-<id>` can. Keyed by the opaque id, not
 * the name, so it survives a future rename.
 */
export function labelsFor(input: FeedbackInput): readonly string[] {
  const spec = input.spec;
  const memberLabel = input.submitterEmail ? [memberLabelFor(input.submitterEmail)] : [];
  if (!spec) return [...LABELS[input.kind], ...memberLabel];
  return [
    ...LABELS[input.kind],
    ...memberLabel,
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
  idea: "🗺️ Enhancement",
};
const TITLE_TAG: Record<FeedbackKind, string> = {
  bug: "[bug]",
  feature: "[enhancement]",
  idea: "[idea]",
};

/**
 * The filed issue's body: the member's words first (the ask is what a human reads first), then the
 * metadata as a small table rather than a run of `**Key:** value` lines — repeated key/value facts
 * are scanned in a table and skipped as prose (docs/ISSUES.md). The pseudonymous footer is last
 * (who-filed-this lives in feedback-attribution.js).
 */
export function issueBody(input: FeedbackInput, imageUrls: readonly string[] = []): string {
  const lines: string[] = [input.details.trim() || "_(no details provided)_", ""];
  if (imageUrls.length)
    lines.push(...imageUrls.map((url, i) => `![attachment ${i + 1}](${url})`), "");
  if (input.spec) lines.push(...specBlock(input.spec), "");
  const meta: [string, string][] = [["Kind", FEEDBACK_KIND_LABEL[input.kind]]];
  if (input.area) meta.push(["Where", input.area]);
  lines.push("| | |", "|---|---|", ...meta.map(([k, v]) => `| **${k}** | ${v} |`));
  lines.push("", "---", `_Submitted from the app by ${submitterFor(input)}._`);
  return lines.join("\n");
}
