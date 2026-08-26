import type { ServerResponse } from "node:http";
import type { NavContext, NavView } from "../../src/observatory/dashboard-shell.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { deskIndex, serveCollectionsRoute } from "../../src/server/collections-routes.js";

function fakeResponse(): {
  res: ServerResponse;
  out: { status?: number; body: string };
} {
  const out: { status?: number; body: string } = { body: "" };
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(chunk?: string) {
      out.body = chunk ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

const navFor = (active: NavView): NavContext => ({ active, canAdd: false, authed: true });

const snapshot = (over: Partial<ParticipantSnapshot>): ParticipantSnapshot =>
  ({
    id: "bot-1",
    displayName: "Cassandra",
    kind: "bot",
    equity: 1_000_000,
    ...over,
  }) as ParticipantSnapshot;

describe("serveCollectionsRoute", () => {
  it("serves the browse index with every derived shelf", () => {
    const { res, out } = fakeResponse();

    const handled = serveCollectionsRoute(res, "/collections", navFor, new Map());

    expect(handled).toBe(true);
    expect(out.status).toBe(200);
    expect(out.body).toContain("Collections — Skynet Capital");
    expect(out.body).toContain("Against the Crowd");
    expect(out.body).toContain("Ahead of the Print");
  });

  it("serves one shelf, with the claim that put its members there", () => {
    const { res, out } = fakeResponse();

    serveCollectionsRoute(res, "/collections/against-the-crowd", navFor, new Map());

    expect(out.status).toBe(200);
    expect(out.body).toContain("how membership was decided");
    expect(out.body).toContain("The News Fader");
  });

  it("marks Collections as the active nav view", () => {
    const { res, out } = fakeResponse();

    serveCollectionsRoute(res, "/collections", navFor, new Map());

    expect(out.body).toContain('<a class="dnav-link active" href="/collections"');
  });

  it("404s an unknown shelf id rather than guessing one", () => {
    const { res, out } = fakeResponse();

    const handled = serveCollectionsRoute(res, "/collections/nope", navFor, new Map());

    expect(handled).toBe(true);
    expect(out.status).toBe(404);
  });

  it("links a persona's members to the live desk when one is supplied", () => {
    const { res, out } = fakeResponse();
    const desks = deskIndex([snapshot({ personaId: "news-fader" })]);

    serveCollectionsRoute(res, "/collections/against-the-crowd", navFor, desks);

    expect(out.body).toContain('href="/u/bot-1"');
    expect(out.body).toContain("Cassandra's desk");
  });
});

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
