/**
 * THE GAME-MASTER PILOT'S SETTING (#8191, #8161 point 16). A committed setting, not a Fly env var:
 * `fly*.toml` is protected (`envelope.json`), so moving the pilot is a one-line PR here instead.
 *
 *   off     — no scene move in the dock, and a chat turn carrying `mode: "game-master"` runs as an
 *             ordinary turn: no scene rules, no scene tool, no error.
 *   owner   — only the owner's own session gets scenes (`config.isOwnerEmail`).
 *   members — any signed-in member gets scenes (the chat route is members-only already).
 *
 * The route is the one place that reads it (`companion-routes.ts`); nothing in a request can widen it.
 */

export type GameMasterPilot = "off" | "owner" | "members";

export const GAME_MASTER_PILOT: GameMasterPilot = "members";

/** Whether this signed-in session may play a scene. `owner` is the server's own owner check. */
export function gameMasterAdmits(
  pilot: GameMasterPilot,
  session: { readonly owner: boolean },
): boolean {
  if (pilot === "members") return true;
  if (pilot === "owner") return session.owner;
  return false;
}
