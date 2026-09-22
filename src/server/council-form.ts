import { findPlaybook, playbookRoster } from "../playbooks/registry.js";
import { type CouncilState, MAX_COUNCIL_TEXT_LENGTH, weekKey } from "./council-store.js";

/**
 * THE COUNCIL's action + read authority — the shared logic `council-api-routes.ts` calls, kept
 * separate from the HTTP layer the same way `controls-form.ts` splits from `controls-api-routes.ts`:
 * one place decides what a valid thesis is, one place decides how to answer a request.
 */
export interface CouncilDeps {
  readonly load: () => CouncilState;
  readonly submit: (
    week: string,
    opaqueMemberId: string,
    text: string,
    at: Date,
    playbookId?: string,
  ) => void;
  readonly now?: () => Date;
}

export interface CouncilEntryView {
  readonly id: string;
  readonly text: string;
  readonly at: string;
  /** A house playbook id from `src/playbooks/registry.ts`, when the member tagged one — the
   *  "and my bot's stance" half of `docs/THE-GAME.md:117`'s Sunday commit. */
  readonly playbookId?: string;
}

export interface CouncilPlayOption {
  readonly id: string;
  readonly symbol: string;
}

export interface CouncilWeekView {
  readonly week: string;
  readonly entries: readonly CouncilEntryView[];
  /** The viewer's own current line for this week, when signed in and already committed —
   *  undefined for a signed-out request or a week the viewer hasn't spoken in yet. */
  readonly mine?: CouncilEntryView;
  /** The house plays a line can be tagged with — the tag selector's own options, so the client
   *  never hardcodes the roster. */
  readonly plays: readonly CouncilPlayOption[];
}

/** Newest first — matches the Feedback pulse's own read ordering (`wire-json-view.ts`). */
export function councilWeekView(deps: CouncilDeps, viewerId?: string): CouncilWeekView {
  const at = deps.now?.() ?? new Date();
  const week = weekKey(at);
  const forWeek = deps.load().weeks[week] ?? {};
  const entries = Object.entries(forWeek)
    .map(([id, entry]) => ({
      id,
      text: entry.text,
      at: entry.at,
      ...(entry.playbookId ? { playbookId: entry.playbookId } : {}),
    }))
    .sort((a, b) => b.at.localeCompare(a.at));
  const mine = viewerId ? entries.find((e) => e.id === viewerId) : undefined;
  return { week, entries, ...(mine ? { mine } : {}), plays: playbookRoster() };
}

export type SubmitThesisResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

/** One line, bounded, trimmed — refuses empty and over-length rather than silently truncating (a
 *  member should see their own words come back, never a clipped surprise). Replaces the member's
 *  prior line for the same week; `council-store.ts`'s `submit` owns that upsert. An optional
 *  `playbookId` must name a real house play — an unknown id is refused rather than silently
 *  dropped, so a stale or hand-crafted id never looks like it saved. */
export function submitThesis(
  text: string,
  opaqueMemberId: string,
  deps: CouncilDeps,
  playbookId?: string,
): SubmitThesisResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Say something — even one line." };
  }
  if (trimmed.length > MAX_COUNCIL_TEXT_LENGTH) {
    return { ok: false, error: `Keep it to ${MAX_COUNCIL_TEXT_LENGTH} characters — one line.` };
  }
  if (playbookId !== undefined && !findPlaybook(playbookId)) {
    return { ok: false, error: "Unknown play — pick one from the list." };
  }
  const at = deps.now?.() ?? new Date();
  deps.submit(weekKey(at), opaqueMemberId, trimmed, at, playbookId);
  return { ok: true };
}
