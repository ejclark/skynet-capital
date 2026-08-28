/**
 * FROM POSTED FORM TO `FeedbackInput` — the parsing half of the feedback POST, split out of
 * `feedback-routes.ts` (2026-08-26) when that file crossed the flat 300-line cap. Routing decides
 * WHAT to do with a request; this decides what the request actually SAYS, and the two drift apart
 * for different reasons.
 *
 * Everything here is defensive in the same direction: a field we cannot read is reported absent,
 * never guessed into a plausible value. `kindFromForm` is the case that earned the rule.
 */

import type { Session } from "./auth/session.js";
import type { FeedbackSpec } from "./feedback-coach.js";
import { toSpec } from "./feedback-coach.js";
import type { FeedbackImageInput } from "./feedback-images.js";
import { parseImages } from "./feedback-images.js";
import type { FeedbackInput, FeedbackKind } from "./feedback-service.js";

/**
 * The build spec as it comes back off the form. It rides a hidden field, so it is member-editable
 * like every other field — `toSpec` re-normalizes it server-side (bounded strings, no backticks,
 * and `spec-complete` re-earned rather than asserted), so a hand-crafted POST cannot inject
 * markdown into a public issue body. What a forged spec CAN do is claim curation; that is bounded
 * by `scripts/envelope-scan.mjs`, which no prompt or payload can argue past.
 */
function specFromForm(raw: string | null): { spec: FeedbackSpec } | undefined {
  if (!raw?.trim()) return undefined;
  try {
    return { spec: toSpec(JSON.parse(raw.slice(0, 8000)) as unknown) };
  } catch {
    return undefined;
  }
}

/**
 * The posted kind, or `undefined` when it is not one of the three we offer.
 *
 * STRICT, WHERE IT USED TO GUESS (#645, 2026-08-26). This read
 * `kindRaw === "bug" || kindRaw === "idea" ? kindRaw : "feature"` — so a missing, empty or
 * unrecognised kind became `feature` silently. Combined with `feature` being pre-selected in the
 * form, that produced a corpus where all ten member-filed issues were labelled `enhancement`,
 * including one that was plainly a broken capability. A fallback that renders identically to a
 * real answer is not a default, it is a fabricated one — and the build lane triages off it.
 *
 * Removing the client-side default alone would not have fixed this: any post that reached here
 * without a kind would still have been relabelled `feature` on the way in.
 */
export function kindFromForm(raw: string | null): FeedbackKind | undefined {
  return raw === "bug" || raw === "idea" || raw === "feature" ? raw : undefined;
}

/** Attached screenshots off the hidden `images` field — bounded/sanitized by `parseImages`
 *  (feedback-images.ts). Wrapped the same way as `specFromForm` so the spread below never
 *  branches on its own. */
function imagesFromForm(raw: string | null): { images: readonly FeedbackImageInput[] } | undefined {
  const images = parseImages(raw);
  return images.length ? { images } : undefined;
}

/** Assembles the submission from the posted form — pulled out of `handleFeedback` so its four
 *  optional fields (area, submitter, spec, images) don't inflate that function's own complexity. */
export function feedbackInputFromForm(
  form: URLSearchParams,
  session: Session | undefined,
  kind: FeedbackKind,
): FeedbackInput {
  return {
    kind,
    title: form.get("title") ?? "",
    details: form.get("details") ?? "",
    ...(form.get("area") ? { area: form.get("area") as string } : {}),
    ...(session?.email ? { submitterEmail: session.email } : {}),
    ...(session?.name ? { submitterName: session.name } : {}),
    ...(specFromForm(form.get("spec")) ?? {}),
    ...(imagesFromForm(form.get("images")) ?? {}),
  };
}
