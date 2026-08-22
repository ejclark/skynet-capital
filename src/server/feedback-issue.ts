/**
 * What actually gets FILED — the labels, the title tag, the pseudonymous submitter marker, and the
 * markdown body (including a coach-written story capsule). Split out of feedback-service.ts, whose
 * job is the transport: "POST an issue". What an issue SAYS is a different concern, and the file
 * crossed its architecture budget the moment provenance arrived.
 *
 * Why provenance exists at all: before it, a filed issue recorded NOTHING about how it was written,
 * so a fully-interrogated capsule and a one-line paste looked identical to the build lane — and it
 * had to treat both as the vaguer one. That is what made the lane's triage rules conservative
 * enough to keep landing ordinary member feedback on Eric's queue.
 */
import { createHash } from "node:crypto";

import { type FeedbackCapsule, toCapsule } from "./feedback-coach.js";

export type FeedbackKind = "bug" | "feature" | "idea";

export interface FeedbackInput {
  readonly kind: FeedbackKind;
  readonly title: string;
  readonly details: string;
  readonly area?: string;
  readonly submitterEmail?: string;
  /**
   * The coach's story capsule, when the member came through the guided path. Its PRESENCE is the
   * provenance signal — it is what tells the build lane this ask was already interrogated against a
   * completeness bar, and may therefore be built unattended rather than escalated.
   */
  readonly capsule?: FeedbackCapsule;
}

// Labels match the .github/ISSUE_TEMPLATE forms so app + GitHub submissions triage the same way.
const LABELS: Record<FeedbackKind, readonly string[]> = {
  bug: ["bug", "feedback"],
  feature: ["enhancement", "feedback"],
  idea: ["idea", "feedback"],
};

const TITLE_TAG: Record<FeedbackKind, string> = {
  bug: "[bug]",
  feature: "[enhancement]",
  idea: "[idea]",
};

/** The issue title a submission gets — the tag mirrors the .github/ISSUE_TEMPLATE forms. */
export function titleFor(input: FeedbackInput): string {
  return `${TITLE_TAG[input.kind]} ${input.title.trim()}`;
}

/** The labels a submission is filed under — its kind, plus whatever its provenance earns. */
export function labelsFor(input: FeedbackInput): readonly string[] {
  return [...LABELS[input.kind], ...capsuleLabels(input.capsule)];
}

/**
 * The labels a submission earns beyond its kind. `curated` widens what the build lane will build
 * unattended; `needs-eric` is the envelope check moved to INTAKE — an ask that was always going to
 * need the owner now costs a sentence on the form instead of a whole build session discovering it.
 * `needs-info` waits on the MEMBER, never on Eric.
 */
function capsuleLabels(capsule: FeedbackCapsule | undefined): readonly string[] {
  if (!capsule) return [];
  return [
    "curated",
    ...(capsule.needsEric ? ["needs-eric"] : []),
    ...(capsule.readiness === "partial" ? ["needs-info"] : []),
  ];
}

/**
 * The machine-readable half of a curated issue. The build session reads this block instead of
 * re-interrogating a member who already answered the coach's questions — the capsule IS the spec.
 * Fenced and typed so it survives a human editing the prose around it.
 */
function capsuleBlock(capsule: FeedbackCapsule): readonly string[] {
  const bullets = (label: string, items: readonly string[]): readonly string[] =>
    items.length ? [`**${label}**`, ...items.map((i) => `- ${i}`), ""] : [];
  return [
    "",
    ...bullets("Acceptance criteria", capsule.criteria),
    ...bullets("Assumptions (unanswered — confirm before relying on these)", capsule.assumptions),
    ...bullets("Explicitly out of scope", capsule.outOfScope),
    ...(capsule.needsEric ? ["> [!IMPORTANT]", `> Needs Eric: ${capsule.needsEric}`, ""] : []),
    "```skynet-capsule",
    JSON.stringify(capsule),
    "```",
  ];
}

/**
 * The capsule as it comes back off the form. It rides a hidden field, so it is member-editable like
 * every other field — `toCapsule` re-normalizes it server-side (bounded strings, no backticks, and
 * `spec-complete` re-earned rather than asserted), so a hand-crafted POST cannot inject markdown
 * into a public issue body. What a forged capsule CAN do is claim curation; that is bounded by
 * `scripts/envelope-scan.mjs`, which no prompt or payload can argue past.
 */
export function capsuleFromForm(raw: string | null): { capsule: FeedbackCapsule } | undefined {
  if (!raw?.trim()) return undefined;
  try {
    return { capsule: toCapsule(JSON.parse(raw.slice(0, 8000)) as unknown) };
  } catch {
    return undefined;
  }
}

export function opaqueMemberId(email: string): string {
  return createHash("sha256")
    .update(`skynet-feedback:${email.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 10);
}

export function issueBody(input: FeedbackInput): string {
  const lines: string[] = [input.details.trim() || "_(no details provided)_", ""];
  if (input.area) lines.push(`**Area:** ${input.area}`);
  if (input.capsule) lines.push(...capsuleBlock(input.capsule));
  const who = input.submitterEmail?.trim()
    ? `member \`${opaqueMemberId(input.submitterEmail)}\``
    : "a league member";
  lines.push("", "---", `_Submitted from the app by ${who}._`);
  return lines.join("\n");
}
