import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { NavContext } from "../../src/observatory/dashboard-shell.js";
import { handleAccountRotate, rotateBlock } from "../../src/server/account-rotate-block.js";
import type { RotateCredentialsInput, RotateResult } from "../../src/server/participant-service.js";

/**
 * The rotate fold-in (Eric, 2026-08-27: every real entry point to /rotate carries an explicit
 * ?id=, which locks the field by design — the widened picker on #676 was never actually
 * reachable). Rotate now lives inline on `/account`, acting on whichever account the switcher
 * there already points to. Authorization is entirely `rotateCredentials`
 * (participant-service.ts's `refuseRotation`) — this layer only refuses a stale/mismatched id.
 */
const nav: NavContext = { active: "add", canAdd: true, authed: true };

describe("rotateBlock", () => {
  it("renders nothing when no account is resolved", () => {
    expect(rotateBlock({ ownedAccounts: [], key: "", nav })).toBe("");
  });

  it("renders a form for whichever account is resolved, key/secret fields included", () => {
    const html = rotateBlock({ ownedAccounts: [], requesterId: "human-eric", key: "", nav });
    expect(html).toContain('action="/account/rotate"');
    expect(html).toContain('type="hidden" name="id" value="human-eric"');
    expect(html).toContain('name="apiKey"');
    expect(html).toContain('name="apiSecret"');
  });

  it("carries the ?key= password suffix into the form action", () => {
    const html = rotateBlock({ ownedAccounts: [], requesterId: "human-eric", key: "pw", nav });
    expect(html).toContain('action="/account/rotate?key=pw"');
  });
});

async function withRotate(
  requesterId: string | undefined,
  rotateCredentials: ((input: RotateCredentialsInput) => Promise<RotateResult>) | undefined,
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server = createServer((req, res) => {
    void handleAccountRotate(
      req,
      res,
      req.method ?? "GET",
      { ownedAccounts: [], requesterId, key: "", nav },
      rotateCredentials,
      { email: "eric@example.com", provider: "google", name: "Eric", exp: 1 },
    );
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("handleAccountRotate", () => {
  it("refuses any method besides POST", async () => {
    await withRotate(
      "human-eric",
      async () => ({ ok: true, id: "human-eric", displayName: "Eric" }),
      async (base) => {
        const res = await fetch(base, { method: "GET" });
        expect(res.status).toBe(405);
      },
    );
  });

  it("rotates the resolved account, passing requester identity through", async () => {
    const calls: RotateCredentialsInput[] = [];
    await withRotate(
      "human-eric",
      (input) => {
        calls.push(input);
        return Promise.resolve({ ok: true, id: input.id, displayName: "Eric" });
      },
      async (base) => {
        const res = await fetch(base, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "id=human-eric&apiKey=PKnew&apiSecret=shh",
        });
        expect(res.status).toBe(200);
        expect(await res.text()).toContain("Credentials rotated");
        expect(calls[0]).toMatchObject({
          id: "human-eric",
          apiKey: "PKnew",
          apiSecret: "shh",
          requesterId: "human-eric",
          requesterEmail: "eric@example.com",
        });
      },
    );
  });

  it("refuses a submitted id that doesn't match the resolved account", async () => {
    const calls: RotateCredentialsInput[] = [];
    await withRotate(
      "human-eric",
      (input) => {
        calls.push(input);
        return Promise.resolve({ ok: true, id: input.id, displayName: "Eric" });
      },
      async (base) => {
        const res = await fetch(base, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "id=sauron&apiKey=PKnew&apiSecret=shh",
        });
        expect(res.status).toBe(400);
        expect(await res.text()).toContain("isn't the account this page is showing");
        expect(calls).toHaveLength(0);
      },
    );
  });

  it("refuses when rotateCredentials isn't wired", async () => {
    await withRotate("human-eric", undefined, async (base) => {
      const res = await fetch(base, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "id=human-eric&apiKey=PKnew&apiSecret=shh",
      });
      expect(res.status).toBe(400);
    });
  });

  it("refuses when no account is resolved at all", async () => {
    await withRotate(
      undefined,
      async (input) => ({ ok: true, id: input.id, displayName: "?" }),
      async (base) => {
        const res = await fetch(base, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "id=human-eric&apiKey=PKnew&apiSecret=shh",
        });
        expect(res.status).toBe(400);
      },
    );
  });
});
