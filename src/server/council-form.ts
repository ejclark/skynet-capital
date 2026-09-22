import { type CouncilState, MAX_COUNCIL_TEXT_LENGTH, weekKey } from "./council-store.js";

/**
 * THE COUNCIL's action + read authority — the shared logic `council-api-routes.ts` calls, kept
 * separate from the HTTP layer the same way `controls-form.ts` splits from `controls-api-routes.ts`:
 * one place decides what a valid thesis is, one place decides how to answer a request.
 */
export interface CouncilDeps {
  readonly load: () => CouncilState;
  readonly submit: (week: string, opaqueMemberId: string, text: string, at: Date) => void;
  readonly now?: () => Date;
}

export interface CouncilEntryView {
  readonly id: string;
  readonly text: string;
  readonly at: string;
}

export interface CouncilWeekView {
  readonly week: string;
  readonly entries: readonly CouncilEntryView[];
  /** The viewer's own current line for this week, when signed in and already committed —
   *  undefined for a signed-out request or a week the viewer hasn't spoken in yet. */
  readonly mine?: CouncilEntryView;
}

/** Newest first — matches the Feedback pulse's own read ordering (`wire-json-view.ts`). */
export function councilWeekView(deps: CouncilDeps, viewerId?: string): CouncilWeekView {
  const at = deps.now?.() ?? new Date();
  const week = weekKey(at);
  const forWeek = deps.load().weeks[week] ?? {};
  const entries = Object.entries(forWeek)
    .map(([id, entry]) => ({ id, text: entry.text, at: entry.at }))
    .sort((a, b) => b.at.localeCompare(a.at));
  const mine = viewerId ? entries.find((e) => e.id === viewerId) : undefined;
  return { week, entries, ...(mine ? { mine } : {}) };
}

export type SubmitThesisResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

/** One line, bounded, trimmed — refuses empty and over-length rather than silently truncating (a
 *  member should see their own words come back, never a clipped surprise). Replaces the member's
 *  prior line for the same week; `council-store.ts`'s `submit` owns that upsert. */
export function submitThesis(
  text: string,
  opaqueMemberId: string,
  deps: CouncilDeps,
): SubmitThesisResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Say something — even one line." };
  }
  if (trimmed.length > MAX_COUNCIL_TEXT_LENGTH) {
    return { ok: false, error: `Keep it to ${MAX_COUNCIL_TEXT_LENGTH} characters — one line.` };
  }
  const at = deps.now?.() ?? new Date();
  deps.submit(weekKey(at), opaqueMemberId, trimmed, at);
  return { ok: true };
}
