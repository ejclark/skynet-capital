import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { CompanionTurn } from "../../src/companion/companion-chat.js";
import { serveCompanionApi } from "../../src/server/companion-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import type { OwnerQueue, ReadOwnerQueue } from "../../src/server/owner-queue.js";

/**
 * WHO SEES THE OWNER DESK (the Moneypenny operator plan, slice owner-desk-context), proven at the
 * route: the per-turn context names what waits on the owner ONLY when the server's own owner check
 * (`config.isOwnerEmail`) passes for the signed-in session. A non-owner's turn never calls the
 * reader at all, nothing in the request body can turn it on, and a slow or failed read costs the
 * turn its owner line, never the turn. Harness copied from `companion-routes.spec.ts`.
 */

function fakeRes() {
  const res = {
    writeHead: () => res,
    write: () => true,
    end: () => undefined,
    once: () => res,
  } as unknown as ServerResponse;
  return res;
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

const OWNER = "owner@example.com";
const MEMBER = "member@example.com";
const sessionFor = (mail: string) => ({ email: mail, name: "A Member" }) as never;

const QUEUE: OwnerQueue = {
  decisions: [{ number: 6007, title: '"Pick the season length"', openDays: 15 }],
  decisionsTotal: 1,
  heldPullRequests: [{ number: 7250, title: '"Rename the rail"', openDays: 2 }],
  heldTotal: 1,
};

function counting(read: ReadOwnerQueue = () => Promise.resolve(QUEUE)) {
  let calls = 0;
  const reader: ReadOwnerQueue = () => {
    calls++;
    return read();
  };
  return { reader, calls: () => calls };
}

async function contextFor(
  mail: string,
  over: Partial<DashboardServerConfig>,
  body: Record<string, unknown> = {},
): Promise<string | undefined> {
  let seen: string | undefined;
  const config = {
    hub: { getState: () => ({ participants: [] }) },
    companion: ((input) => {
      seen = input.context;
      return Promise.resolve();
    }) as CompanionTurn,
    ...over,
  } as never;
  await serveCompanionApi(
    post({ messages: [{ role: "user", content: "what needs me?" }], ...body }),
    fakeRes(),
    "/api/companion/chat",
    config,
    sessionFor(mail),
  );
  return seen;
}

const isOwnerEmail = (email: string) => email === OWNER;

describe("the owner desk in Moneypenny's context", () => {
  it("names what waits on the owner when the owner asks", async () => {
    const { reader } = counting();
    const context = await contextFor(OWNER, { isOwnerEmail, readOwnerQueue: reader });
    expect(context).toContain("Owner desk");
    expect(context).toContain('#6007 "Pick the season length" (15 days)');
    expect(context).toContain('#7250 "Rename the rail" (2 days)');
  });

  it("never shows it to another member, and never reads it for them", async () => {
    const { reader, calls } = counting();
    const context = await contextFor(MEMBER, { isOwnerEmail, readOwnerQueue: reader });
    expect(context).toBeDefined();
    expect(context).not.toContain("Owner desk");
    expect(calls()).toBe(0);
  });

  it("cannot be turned on from the request body", async () => {
    const { reader, calls } = counting();
    const context = await contextFor(
      MEMBER,
      { isOwnerEmail, readOwnerQueue: reader },
      { owner: true, isOwner: true, email: OWNER, ownerDesk: "everything" },
    );
    expect(context).not.toContain("Owner desk");
    expect(calls()).toBe(0);
  });

  it("drops the line, not the turn, when the read fails", async () => {
    const { reader } = counting(() => Promise.reject(new Error("GitHub down")));
    const context = await contextFor(OWNER, { isOwnerEmail, readOwnerQueue: reader });
    expect(context).toBeDefined();
    expect(context).not.toContain("Owner desk");
  });

  it("drops the line when the read answers undefined", async () => {
    const { reader } = counting(() => Promise.resolve(undefined));
    const context = await contextFor(OWNER, { isOwnerEmail, readOwnerQueue: reader });
    expect(context).toBeDefined();
    expect(context).not.toContain("Owner desk");
  });

  it("drops the line when the read takes longer than a second and a half", async () => {
    const { reader } = counting(() => new Promise<undefined>(() => undefined)); // never answers
    const started = Date.now();
    const context = await contextFor(OWNER, { isOwnerEmail, readOwnerQueue: reader });
    expect(Date.now() - started).toBeLessThan(3_000);
    expect(context).toBeDefined();
    expect(context).not.toContain("Owner desk");
  });

  it("shows nothing without the server's owner check", async () => {
    const { reader, calls } = counting();
    const context = await contextFor(OWNER, { readOwnerQueue: reader });
    expect(context).not.toContain("Owner desk");
    expect(calls()).toBe(0);
  });
});
