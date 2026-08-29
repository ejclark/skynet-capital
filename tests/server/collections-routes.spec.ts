import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { deskIndex } from "../../src/server/collections-routes.js";

const snapshot = (over: Partial<ParticipantSnapshot>): ParticipantSnapshot =>
  ({
    id: "bot-1",
    displayName: "Cassandra",
    kind: "bot",
    equity: 1_000_000,
    ...over,
  }) as ParticipantSnapshot;

describe("deskIndex", () => {
  it("maps a bot's persona id to its desk", () => {
    const index = deskIndex([snapshot({ id: "sauron", personaId: "sauron" })]);

    expect(index.get("sauron")).toEqual({ participantId: "sauron", displayName: "Cassandra" });
  });

  it("keeps the first desk registered for a persona when two run the same one", () => {
    const index = deskIndex([
      snapshot({ id: "first", personaId: "sauron" }),
      snapshot({ id: "second", personaId: "sauron", displayName: "Other" }),
    ]);

    expect(index.get("sauron")?.participantId).toBe("first");
  });

  it("ignores humans and bots with no persona — no invented mapping", () => {
    const index = deskIndex([
      snapshot({ id: "eric", kind: "human" }),
      snapshot({ id: "nameless", personaId: undefined }),
    ]);

    expect(index.size).toBe(0);
  });
});
