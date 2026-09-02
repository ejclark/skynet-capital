/** Mirrors `GET /api/playbooks` (`playbooks-api-routes.ts`) — M·03, WIP: read-only, nothing arms. */

export interface HumanPlaybook {
  readonly id: string;
  readonly glyph: string;
  readonly title: string;
  readonly kind: string;
  readonly detail: string;
  readonly unlocksAfter: string;
  readonly unlocksAfterName: string;
  readonly seasonOneCriteria: string;
  readonly unlocked: boolean;
}

export interface Playbooks {
  readonly linked: boolean;
  readonly milestone: {
    readonly id: string;
    readonly code: string;
    readonly title: string;
    readonly desc: string;
  };
  readonly arming: "season-1";
  readonly playbooks: readonly HumanPlaybook[];
  readonly unlocked: number;
  readonly total: number;
}

export async function fetchPlaybooks(): Promise<Playbooks> {
  const res = await fetch("/api/playbooks", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`playbooks ${res.status}`);
  return (await res.json()) as Playbooks;
}
