/**
 * The Collections shapes shared beyond the (now-retired) `/collections` HTML page: the shell's
 * `/api/collections` (`collections-json-view.ts`) and the board dispatcher both need to know what
 * a "live desk running a persona" looks like.
 */

/** A live desk running a persona — the existing view a member row links to. */
export interface DeskLink {
  readonly participantId: string;
  readonly displayName: string;
}

/** personaId → the desk running it. Empty when the server has no participants wired. */
export type DeskIndex = ReadonlyMap<string, DeskLink>;
