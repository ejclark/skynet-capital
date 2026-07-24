import type { AddressInfo } from "node:net";
import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import { createDashboardServer } from "../../src/server/dashboard-server.js";
import { ObservatoryHub } from "../../src/server/observatory-hub.js";
import type { AddParticipantInput, AddResult } from "../../src/server/participant-service.js";

const board = (): DashboardData => ({ generatedAt: "t", participants: [] });

async function withServer(
  config: Parameters<typeof createDashboardServer>[0],
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server = createDashboardServer(config);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("dashboard-server /add", () => {
  it("serves the form on GET and registers on POST", async () => {
    const calls: AddParticipantInput[] = [];
    const addParticipant = (input: AddParticipantInput): Promise<AddResult> => {
      calls.push(input);
      return Promise.resolve({ ok: true, id: "human-joe", displayName: "Joe" });
    };
    await withServer({ hub: new ObservatoryHub(board()), addParticipant }, async (base) => {
      const form = await fetch(`${base}/add`);
      expect(form.status).toBe(200);
      expect(await form.text()).toContain("Add your Alpaca account");

      const post = await fetch(`${base}/add`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ displayName: "Joe", apiKey: "k", apiSecret: "s" }).toString(),
      });
      expect(post.status).toBe(200);
      expect(await post.text()).toContain("on the board");
      expect(calls[0]).toMatchObject({ displayName: "Joe", apiKey: "k", kind: "human" });
    });
  });

  it("returns 400 with the error when the handler rejects", async () => {
    const addParticipant = (): Promise<AddResult> => Promise.resolve({ ok: false, error: "nope" });
    await withServer({ hub: new ObservatoryHub(board()), addParticipant }, async (base) => {
      const post = await fetch(`${base}/add`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ displayName: "x", apiKey: "k", apiSecret: "s" }).toString(),
      });
      expect(post.status).toBe(400);
      expect(await post.text()).toContain("nope");
    });
  });

  it("gates /add behind the password and 404s when the feature is off", async () => {
    await withServer(
      {
        hub: new ObservatoryHub(board()),
        password: "pw",
        addParticipant: () => Promise.resolve({ ok: true, id: "a", displayName: "a" }),
      },
      async (base) => {
        expect((await fetch(`${base}/add`)).status).toBe(401);
        expect((await fetch(`${base}/add?key=pw`)).status).toBe(200);
      },
    );
    // No handler wired → /add is not a route.
    await withServer({ hub: new ObservatoryHub(board()) }, async (base) => {
      expect((await fetch(`${base}/add`)).status).toBe(404);
    });
  });
});
