import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { CompanionTurn, CompanionTurnInput } from "../../src/companion/companion-chat.js";
import type { GameMasterPilot } from "../../src/companion/game-master-flag.js";
import { serveCompanionApi } from "../../src/server/companion-routes.js";

/**
 * WHO GETS A SCENE (#8191 criteria 1, 2, 3), proven at the route: a turn carrying
 * `mode: "game-master"` becomes a scene only when the committed pilot setting admits the
 * signed-in session; otherwise it runs as an ordinary turn, with no error. Nothing else in the
 * body can turn it on. `GET /api/companion` tells the dock the same answer. Harness copied from
 * `companion-routes-owner.spec.ts`.
 */

function fakeRes(sink: { body?: string } = {}) {
  const res = {
    writeHead: () => res,
    setHeader: () => res,
    write: () => true,
    end: (chunk?: string) => {
      sink.body = chunk;
    },
    once: () => res,
  } as unknown as ServerResponse;
  return res;
}

function request(method: string, body?: unknown): IncomingMessage {
  const req = Readable.from(
    body === undefined ? [] : [Buffer.from(JSON.stringify(body))],
  ) as unknown as IncomingMessage;
  req.method = method;
  req.headers = { "content-type": "application/json" };
  return req;
}

const OWNER = "owner@example.com";
const MEMBER = "member@example.com";
const sessionFor = (mail: string) => ({ email: mail, name: "A Member" }) as never;
const isOwnerEmail = (email: string) => email === OWNER;

function configFor(pilot: GameMasterPilot | undefined, seen: { input?: CompanionTurnInput }) {
  return {
    hub: { getState: () => ({ participants: [] }) },
    companion: ((input) => {
      seen.input = input;
      return Promise.resolve();
    }) as CompanionTurn,
    isOwnerEmail,
    ...(pilot ? { gameMasterPilot: pilot } : {}),
  } as never;
}

async function turnFor(
  mail: string,
  pilot: GameMasterPilot | undefined,
  extra: Record<string, unknown> = { mode: "game-master" },
): Promise<CompanionTurnInput | undefined> {
  const seen: { input?: CompanionTurnInput } = {};
  await serveCompanionApi(
    request("POST", { messages: [{ role: "user", content: "play a scene" }], ...extra }),
    fakeRes(),
    "/api/companion/chat",
    configFor(pilot, seen),
    sessionFor(mail),
  );
  return seen.input;
}

async function indexFor(mail: string, pilot: GameMasterPilot | undefined) {
  const sink: { body?: string } = {};
  await serveCompanionApi(
    request("GET"),
    fakeRes(sink),
    "/api/companion",
    configFor(pilot, {}),
    sessionFor(mail),
  );
  return JSON.parse(sink.body ?? "{}") as { gameMaster?: boolean; enabled?: boolean };
}

describe("the chat route admits a scene only where the pilot setting does", () => {
  it("members (the committed setting): any signed-in member's mode becomes a scene turn", async () => {
    expect((await turnFor(MEMBER, undefined))?.gameMaster).toBe(true);
    expect((await turnFor(MEMBER, "members"))?.gameMaster).toBe(true);
  });

  it("off: the mode is ignored and the turn runs as an ordinary one, no error (criterion 1)", async () => {
    const input = await turnFor(OWNER, "off");
    expect(input).toBeDefined();
    expect(input?.gameMaster).toBeUndefined();
  });

  it("owner: the owner gets a scene, another member an ordinary turn (criterion 2)", async () => {
    expect((await turnFor(OWNER, "owner"))?.gameMaster).toBe(true);
    const member = await turnFor(MEMBER, "owner");
    expect(member).toBeDefined();
    expect(member?.gameMaster).toBeUndefined();
  });

  it("only the exact mode turns it on; nothing else in the body does", async () => {
    for (const extra of [{}, { mode: "gm" }, { mode: true }, { gameMaster: true }]) {
      const input = await turnFor(MEMBER, "members", extra);
      expect(input?.gameMaster).toBeUndefined();
    }
  });
});

describe("GET /api/companion tells the dock whether to offer a scene", () => {
  it("true where the setting admits the session, false otherwise", async () => {
    expect(await indexFor(MEMBER, undefined)).toMatchObject({ enabled: true, gameMaster: true });
    expect((await indexFor(MEMBER, "owner")).gameMaster).toBe(false);
    expect((await indexFor(OWNER, "owner")).gameMaster).toBe(true);
    expect((await indexFor(OWNER, "off")).gameMaster).toBe(false);
  });
});
