import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
  type AccountAdmin,
  handleAccountRoute,
  sessionNameCandidates,
} from "../../src/server/account-forms.js";
import type { UpdateProfileInput } from "../../src/server/account-service.js";
import type { Session } from "../../src/server/auth/session.js";

/**
 * Same posture as self-service-forms.spec.ts: real HTTP over a real socket, a bare inline
 * service, assertions on status + body substrings. The service rules are covered in
 * account-service.spec.ts — this file proves the HTTP surface: forms render, POSTs parse,
 * identity comes from the wiring (never the browser), and methods are enforced.
 */
async function withRoute(
  options: Partial<Parameters<typeof handleAccountRoute>[4]> & { admin: AccountAdmin },
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server = createServer((req, res) => {
    const path = (req.url ?? "/").split("?")[0] ?? "/";
    void handleAccountRoute(req, res, path, req.method ?? "GET", {
      requesterId: undefined,
      session: undefined,
      authConfigured: false,
      key: "",
      ...options,
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

const okAdmin = (calls: { updates: UpdateProfileInput[]; removals: unknown[] }): AccountAdmin => ({
  updateProfile: (input) => {
    calls.updates.push(input);
    return Promise.resolve({ ok: true, id: input.id, displayName: input.displayName ?? "Ann" });
  },
  removeAccount: (input) => {
    calls.removals.push(input);
    return Promise.resolve({ ok: true, id: input.id, displayName: "Ann" });
  },
  profileFor: () => ({ displayName: "Ann", timezone: "America/New_York" }),
});

const session: Session = { email: "ann@gmail.com", provider: "google", name: "Ann", exp: 1 };

describe("GET /account", () => {
  it("prefills the resolved member's own account and shows the danger zone", async () => {
    const calls = { updates: [], removals: [] };
    await withRoute(
      { admin: okAdmin(calls), requesterId: "human-ann", session, authConfigured: true },
      async (base) => {
        const res = await fetch(`${base}/account`);
        const html = await res.text();
        expect(res.status).toBe(200);
        expect(html).toContain('value="human-ann"');
        expect(html).toContain("readonly");
        expect(html).toContain("Remove this account");
        expect(html).toContain("/rotate");
      },
    );
  });

  it("falls back to a typed id when no identity resolves", async () => {
    const calls = { updates: [], removals: [] };
    await withRoute({ admin: okAdmin(calls) }, async (base) => {
      const res = await fetch(`${base}/account`);
      const html = await res.text();
      expect(res.status).toBe(200);
      expect(html).toContain('placeholder="human-uncle_joe"');
      expect(html).not.toContain("readonly");
    });
  });
});

describe("POST /account", () => {
  it("submits the profile edit with identity from the wiring, not the browser", async () => {
    const calls: { updates: UpdateProfileInput[]; removals: unknown[] } = {
      updates: [],
      removals: [],
    };
    await withRoute(
      { admin: okAdmin(calls), requesterId: "human-ann", session, authConfigured: true },
      async (base) => {
        const res = await fetch(`${base}/account`, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          // A hostile form claiming someone else's requesterId must be ignored — identity
          // is filled from the session wiring, and the posted field simply isn't read.
          body: "id=human-ann&displayName=ann&timezone=__keep&requesterId=human-victim",
        });
        expect(res.status).toBe(200);
        expect(await res.text()).toContain("Profile updated");
        expect(calls.updates).toHaveLength(1);
        expect(calls.updates[0]).toMatchObject({
          id: "human-ann",
          displayName: "ann",
          requesterId: "human-ann",
          authConfigured: true,
        });
        // "__keep" means the field is omitted entirely — not sent as a literal value.
        expect(calls.updates[0]?.timezone).toBeUndefined();
        expect(calls.updates[0]?.sessionNames).toEqual(["ann", "ann"]);
      },
    );
  });

  it("renders a 400 with the service's reason on refusal", async () => {
    const admin: AccountAdmin = {
      updateProfile: () =>
        Promise.resolve({ ok: false, error: "You can only edit your own account's profile." }),
      removeAccount: () => Promise.resolve({ ok: false, error: "no" }),
      profileFor: () => undefined,
    };
    await withRoute({ admin }, async (base) => {
      const res = await fetch(`${base}/account`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "id=human-ann&displayName=X",
      });
      expect(res.status).toBe(400);
      expect(await res.text()).toContain("only edit your own");
    });
  });
});

describe("POST /account/remove", () => {
  it("submits the removal with the typed confirmation", async () => {
    const calls = { updates: [], removals: [] as unknown[] };
    await withRoute(
      { admin: okAdmin(calls), requesterId: "human-ann", session, authConfigured: true },
      async (base) => {
        const res = await fetch(`${base}/account/remove`, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "id=human-ann&confirmName=Ann",
        });
        expect(res.status).toBe(200);
        expect(await res.text()).toContain("Account removed");
        expect(calls.removals[0]).toMatchObject({
          id: "human-ann",
          confirmName: "Ann",
          requesterId: "human-ann",
          authConfigured: true,
        });
      },
    );
  });

  it("redirects a bare GET back to /account — removal is never a link", async () => {
    const calls = { updates: [], removals: [] };
    await withRoute({ admin: okAdmin(calls), key: "pw" }, async (base) => {
      const res = await fetch(`${base}/account/remove`, { redirect: "manual" });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("/account?key=pw");
    });
  });

  it("refuses other methods with 405", async () => {
    const calls = { updates: [], removals: [] };
    await withRoute({ admin: okAdmin(calls) }, async (base) => {
      const res = await fetch(`${base}/account/remove`, { method: "DELETE" });
      expect(res.status).toBe(405);
    });
  });
});

describe("sessionNameCandidates", () => {
  it("lowercases the session name and email local-part, skipping what's absent", () => {
    expect(sessionNameCandidates(session)).toEqual(["ann", "ann"]);
    expect(
      sessionNameCandidates({ email: "Uncle.Joe@gmail.com", provider: "google", exp: 1 }),
    ).toEqual(["uncle.joe"]);
    expect(sessionNameCandidates(undefined)).toEqual([]);
  });
});
