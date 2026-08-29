import type { DeskIndex, DeskLink } from "../observatory/collections-view.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";

/**
 * personaId → the live desk running it. First registered bot per persona wins; a persona nobody is
 * running is simply absent from the index, which callers render as an explicit absence rather
 * than a link to nowhere. Shared by the shell's `/api/collections` (`content-api-routes.ts`) and
 * the board dispatcher (`dashboard-server.ts`).
 */
export function deskIndex(participants: readonly ParticipantSnapshot[]): DeskIndex {
  const index = new Map<string, DeskLink>();
  for (const participant of participants) {
    const personaId = participant.personaId;
    if (participant.kind === "bot" && personaId && !index.has(personaId)) {
      index.set(personaId, {
        participantId: participant.id,
        displayName: participant.displayName,
      });
    }
  }
  return index;
}
