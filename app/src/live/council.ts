import { postJson } from "./post";

/**
 * The Sunday Council's client model (issue #2224 shape 1) — mirrors `/api/council`. Same
 * pseudonymous posture as the Feedback pulse: an entry carries an opaque `id`, never a name.
 */

export interface CouncilEntry {
  readonly id: string;
  readonly text: string;
  readonly at: string;
  /** A house playbook id (`CouncilPlayOption.id`), when the member tagged one. */
  readonly playbookId?: string;
}

export interface CouncilPlayOption {
  readonly id: string;
  readonly symbol: string;
}

export interface CouncilWeek {
  readonly enabled: boolean;
  readonly week?: string;
  readonly entries: readonly CouncilEntry[];
  /** The viewer's own current line, when signed in and already committed this week. */
  readonly mine?: CouncilEntry;
  /** The tag selector's own options — never hardcoded client-side. */
  readonly plays: readonly CouncilPlayOption[];
}

export async function fetchCouncil(): Promise<CouncilWeek> {
  const res = await fetch("/api/council", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`council ${res.status}`);
  const body = (await res.json()) as {
    enabled: boolean;
    week?: string;
    entries?: readonly CouncilEntry[];
    mine?: CouncilEntry;
    plays?: readonly CouncilPlayOption[];
  };
  return {
    enabled: body.enabled,
    week: body.week,
    entries: body.entries ?? [],
    mine: body.mine,
    plays: body.plays ?? [],
  };
}

export const submitThesis = (
  text: string,
  playbookId?: string,
): Promise<{ readonly ok: boolean; readonly error?: string }> =>
  postJson("/api/council", { text, ...(playbookId ? { playbookId } : {}) });
