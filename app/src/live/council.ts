import { postJson } from "./post";

/**
 * The Sunday Council's client model (issue #2224 shape 1) — mirrors `/api/council`. Same
 * pseudonymous posture as the Feedback pulse: an entry carries an opaque `id`, never a name.
 */

export interface CouncilEntry {
  readonly id: string;
  readonly text: string;
  readonly at: string;
}

export interface CouncilWeek {
  readonly enabled: boolean;
  readonly week?: string;
  readonly entries: readonly CouncilEntry[];
  /** The viewer's own current line, when signed in and already committed this week. */
  readonly mine?: CouncilEntry;
}

export async function fetchCouncil(): Promise<CouncilWeek> {
  const res = await fetch("/api/council", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`council ${res.status}`);
  const body = (await res.json()) as {
    enabled: boolean;
    week?: string;
    entries?: readonly CouncilEntry[];
    mine?: CouncilEntry;
  };
  return { enabled: body.enabled, week: body.week, entries: body.entries ?? [], mine: body.mine };
}

export const submitThesis = (
  text: string,
): Promise<{ readonly ok: boolean; readonly error?: string }> => postJson("/api/council", { text });
