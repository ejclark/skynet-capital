import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { NavContext } from "../../src/observatory/dashboard-shell.js";
import {
  type AccountAdmin,
  handleAccountRoute,
  sessionNameCandidates,
} from "../../src/server/account-forms.js";
import type { UpdateProfileInput } from "../../src/server/account-service.js";
import type { Session } from "../../src/server/auth/session.js";
import { BotControlsStore } from "../../src/server/bot-controls-store.js";
import type { ControlsDeps } from "../../src/server/controls-form.js";

const nav: NavContext = { active: "add", canAdd: true, authed: true };

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
      ownedAccounts: [],
      session: undefined,
      authConfigured: false,
      key: "",
      nav,
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
        // The id travels only in a hidden field — Eric, 2026-08-26: "account id is made up by
        // you.. why do you even bother showing it?" — never as a visible, readonly value.
        expect(html).toContain('type="hidden" name="id" value="human-ann"');
        expect(html).not.toContain('value="human-ann" required readonly');
        expect(html).toContain("Remove this account");
        // Eric, 2026-08-27: rotate lives inline now, acting on whichever account the switcher
        // points to — not a link out to a separate page that locks the field again.
        expect(html).toContain('action="/account/rotate"');
        expect(html).toContain('type="hidden" name="id" value="human-ann"');
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
      expect(html).not.toContain('type="hidden" name="id"');
    });
  });

  // Eric, 2026-08-26: "fold mission control into account" — a claimed bot's suspend/resume
  // toggle lives here now, not behind a link to Mission Control's separate page.
  it("shows the suspend/resume toggle for a claimed bot when bot controls are wired", async () => {
    const dir = await mkdtemp(join(tmpdir(), "skynet-account-forms-"));
    try {
      const store = new BotControlsStore(join(dir, "bot-controls.json"));
      const controls: ControlsDeps = { store, isOwner: () => false, bots: () => [] };
      const calls = { updates: [], removals: [] };
      await withRoute(
        {
          admin: okAdmin(calls),
          requesterId: "sauron",
          ownedAccounts: [{ id: "sauron", displayName: "Sauron", kind: "bot" }],
          session,
          authConfigured: true,
          controls,
        },
        async (base) => {
          const html = await (await fetch(`${base}/account`)).text();
          expect(html).toContain("currently <b>active</b>");
          expect(html).toContain('action="/account/bot-control"');
          expect(html).not.toContain("Settings tab");
        },
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("shows nothing bot-related for a human account, even with controls wired", async () => {
    const dir = await mkdtemp(join(tmpdir(), "skynet-account-forms-"));
    try {
      const store = new BotControlsStore(join(dir, "bot-controls.json"));
      const controls: ControlsDeps = { store, isOwner: () => false, bots: () => [] };
      const calls = { updates: [], removals: [] };
      await withRoute(
        {
          admin: okAdmin(calls),
          requesterId: "human-ann",
          session,
          authConfigured: true,
          controls,
        },
        async (base) => {
          const html = await (await fetch(`${base}/account`)).text();
          expect(html).not.toContain("Suspend trading");
          expect(html).not.toContain("/account/bot-control");
        },
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  // #732: "that will help confirm which account belongs to the name". The board name alone can't
  // answer which BROKER account it is — the Alpaca account number is the value the member also
  // sees in Alpaca's own dashboard, so it's the one that matches by eye.
  it("shows the managed account's Alpaca account number beside its name", async () => {
    const calls = { updates: [], removals: [] };
    await withRoute(
      {
        admin: okAdmin(calls),
        requesterId: "human-ann",
        ownedAccounts: [
          { id: "human-ann", displayName: "Ann", kind: "human", accountNumber: "PA3ABCDEF" },
        ],
        session,
        authConfigured: true,
      },
      async (base) => {
        const html = await (await fetch(`${base}/account`)).text();
        expect(html).toContain("<b>Ann</b> · Alpaca account <code");
        expect(html).toContain(">PA3ABCDEF</code>");
      },
    );
  });

  it("shows the number for whichever account the switcher selected, not the first owned one", async () => {
    const calls = { updates: [], removals: [] };
    await withRoute(
      {
        admin: okAdmin(calls),
        requesterId: "sauron",
        ownedAccounts: [
          { id: "human-ann", displayName: "Ann", kind: "human", accountNumber: "PA3ABCDEF" },
          { id: "sauron", displayName: "Sauron", kind: "bot", accountNumber: "PA9ZZZZZZ" },
        ],
        session,
        authConfigured: true,
      },
      async (base) => {
        const html = await (await fetch(`${base}/account`)).text();
        expect(html).toContain("<b>Sauron</b> · Alpaca account <code");
        expect(html).toContain(">PA9ZZZZZZ</code>");
        expect(html).not.toContain("PA3ABCDEF");
      },
    );
  });

  // A missing number means the last board read didn't carry one — never "this account has none".
  // Silence would let the member draw the wrong conclusion, so the page says which it is.
  it("says the number hasn't been read rather than rendering nothing", async () => {
    const calls = { updates: [], removals: [] };
    await withRoute(
      {
        admin: okAdmin(calls),
        requesterId: "human-ann",
        ownedAccounts: [{ id: "human-ann", displayName: "Ann", kind: "human" }],
        session,
        authConfigured: true,
      },
      async (base) => {
        const html = await (await fetch(`${base}/account`)).text();
        expect(html).toContain("Alpaca account number not read yet");
        expect(html).not.toContain("Alpaca account <code");
      },
    );
  });

  it("renders no identity line when the caller owns nothing to manage", async () => {
    const calls = { updates: [], removals: [] };
    await withRoute({ admin: okAdmin(calls) }, async (base) => {
      const html = await (await fetch(`${base}/account`)).text();
      expect(html).not.toContain("Alpaca account <code");
      expect(html).not.toContain("Alpaca account number not read yet");
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

  // Eric, 2026-08-26: "there needs to be a clear path to regenerate API secrets... part of the
  // current process for managing accounts" — a host-configured refusal renders a real link to
  // /rotate for the exact account, not just a mention of it in the refusal prose.
  it("offers a real link to /rotate when the service names a rotateId", async () => {
    const admin: AccountAdmin = {
      updateProfile: () =>
        Promise.resolve({ ok: false, error: "configured on the host", rotateId: "human-eric" }),
      removeAccount: () => Promise.resolve({ ok: false, error: "no" }),
      profileFor: () => undefined,
    };
    await withRoute({ admin, key: "pw" }, async (base) => {
      const res = await fetch(`${base}/account`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "id=human-eric&displayName=X",
      });
      const html = await res.text();
      expect(html).toContain('href="/rotate?id=human-eric&key=pw"');
      expect(html).toContain("Rotate this account's Alpaca credentials");
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

// Eric, 2026-08-27, live: every real entry point to /rotate carries an explicit ?id=, which locks
// the field by design — the picker widened on #676 was never actually reachable. Rotate now lives
// inline on /account, acting on whichever account the switcher already points to.
describe("POST /account/rotate", () => {
  it("rotates the account the page is showing", async () => {
    const calls = { updates: [], removals: [] };
    const rotated: unknown[] = [];
    await withRoute(
      {
        admin: okAdmin(calls),
        requesterId: "human-ann",
        session,
        authConfigured: true,
        rotateCredentials: (input) => {
          rotated.push(input);
          return Promise.resolve({ ok: true, id: input.id, displayName: "Ann" });
        },
      },
      async (base) => {
        const res = await fetch(`${base}/account/rotate`, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "id=human-ann&apiKey=PKnew&apiSecret=shh",
        });
        expect(res.status).toBe(200);
        expect(await res.text()).toContain("Credentials rotated");
        expect(rotated[0]).toMatchObject({
          id: "human-ann",
          apiKey: "PKnew",
          apiSecret: "shh",
          requesterId: "human-ann",
          requesterEmail: "ann@gmail.com",
        });
      },
    );
  });

  it("refuses an id that doesn't match the account the page is showing", async () => {
    const calls = { updates: [], removals: [] };
    const rotated: unknown[] = [];
    await withRoute(
      {
        admin: okAdmin(calls),
        requesterId: "human-ann",
        session,
        authConfigured: true,
        rotateCredentials: (input) => {
          rotated.push(input);
          return Promise.resolve({ ok: true, id: input.id, displayName: "Ann" });
        },
      },
      async (base) => {
        const res = await fetch(`${base}/account/rotate`, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "id=human-victim&apiKey=PKnew&apiSecret=shh",
        });
        expect(res.status).toBe(400);
        expect(await res.text()).toContain("isn't the account this page is showing");
        expect(rotated).toHaveLength(0);
      },
    );
  });

  it("refuses other methods with 405", async () => {
    const calls = { updates: [], removals: [] };
    await withRoute({ admin: okAdmin(calls) }, async (base) => {
      const res = await fetch(`${base}/account/rotate`, { method: "GET" });
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
