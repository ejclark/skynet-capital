import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { handleAdd, handleRotate } from "../../src/server/self-service-forms.js";

/**
 * `handleAdd`/`handleRotate` take real `IncomingMessage`/`ServerResponse` — a raw HTTP server
 * exercising them over the wire is the honest way to test their behavior (status codes, body
 * content) without peeking at their internals.
 */
async function withRoute(
  handler: (req: Parameters<typeof handleAdd>[0], res: Parameters<typeof handleAdd>[1]) => void,
  run: (base: string) => Promise<void>,
): Promise<void> {
  const server: Server = createServer((req, res) => handler(req, res));
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("handleAdd", () => {
  it("GET serves the onboarding form", async () => {
    await withRoute(
      (req, res) =>
        void handleAdd(req, res, "GET", "", undefined, () => Promise.reject(new Error("unused"))),
      async (base) => {
        const res = await fetch(base);
        expect(res.status).toBe(200);
        const body = await res.text();
        expect(body).toContain("Connect your Alpaca account");
        expect(body).toContain('name="displayName"');
      },
    );
  });

  it("POST submits the parsed form and renders success", async () => {
    await withRoute(
      (req, res) =>
        void handleAdd(req, res, "POST", "", undefined, (input) => {
          expect(input.displayName).toBe("Uncle Joe");
          expect(input.apiKey).toBe("PK123");
          return Promise.resolve({ ok: true, id: "human-uncle_joe", displayName: "Uncle Joe" });
        }),
      async (base) => {
        const res = await fetch(base, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "displayName=Uncle+Joe&apiKey=PK123&apiSecret=s",
        });
        expect(res.status).toBe(200);
        expect(await res.text()).toContain("You're on the board");
      },
    );
  });

  it("stamps the signed-in session's email as the owner — never a form field", async () => {
    await withRoute(
      (req, res) =>
        void handleAdd(req, res, "POST", "", "uncle_joe@example.com", (input) => {
          expect(input.ownerEmail).toBe("uncle_joe@example.com");
          return Promise.resolve({ ok: true, id: "human-uncle_joe", displayName: "Uncle Joe" });
        }),
      async (base) => {
        const res = await fetch(base, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          // The form carries no identity field at all — ownership can only come from the session.
          body: "displayName=Uncle+Joe&apiKey=PK123&apiSecret=s",
        });
        expect(res.status).toBe(200);
      },
    );
  });

  it("POST renders the error page with a 400 when the service refuses", async () => {
    await withRoute(
      (req, res) =>
        void handleAdd(req, res, "POST", "", undefined, () =>
          Promise.resolve({ ok: false, error: "That key was rejected." }),
        ),
      async (base) => {
        const res = await fetch(base, { method: "POST", body: "" });
        expect(res.status).toBe(400);
        expect(await res.text()).toContain("That key was rejected.");
      },
    );
  });

  it("refuses any method besides GET/POST", async () => {
    await withRoute(
      (req, res) =>
        void handleAdd(req, res, "DELETE", "", undefined, () =>
          Promise.reject(new Error("unused")),
        ),
      async (base) => {
        const res = await fetch(base, { method: "DELETE" });
        expect(res.status).toBe(405);
      },
    );
  });
});

describe("handleRotate", () => {
  it("GET serves the rotation form", async () => {
    await withRoute(
      (req, res) =>
        void handleRotate(req, res, "GET", "", "", {}, () => Promise.reject(new Error("unused"))),
      async (base) => {
        const res = await fetch(base);
        expect(res.status).toBe(200);
        const body = await res.text();
        expect(body).toContain("Rotate an account's Alpaca key");
        expect(body).toContain('name="id"');
      },
    );
  });

  it("POST submits id + new credentials and renders success", async () => {
    await withRoute(
      (req, res) =>
        void handleRotate(req, res, "POST", "", "", {}, (input) => {
          expect(input.id).toBe("day-trader");
          expect(input.apiKey).toBe("new-key");
          return Promise.resolve({ ok: true, id: "day-trader", displayName: "JARVIS" });
        }),
      async (base) => {
        const res = await fetch(base, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "id=day-trader&apiKey=new-key&apiSecret=new-secret",
        });
        expect(res.status).toBe(200);
        expect(await res.text()).toContain("Credentials rotated");
      },
    );
  });

  it("forwards the session's resolved id AND email — the roster owner-gate needs both", async () => {
    await withRoute(
      (req, res) =>
        void handleRotate(
          req,
          res,
          "POST",
          "",
          "",
          { id: "human-eric", email: "eric@example.com" },
          (input) => {
            expect(input.requesterId).toBe("human-eric");
            expect(input.requesterEmail).toBe("eric@example.com");
            return Promise.resolve({ ok: true, id: "human-eric", displayName: "Eric" });
          },
        ),
      async (base) => {
        const res = await fetch(base, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "id=human-eric&apiKey=new-key&apiSecret=new-secret",
        });
        expect(res.status).toBe(200);
      },
    );
  });

  it("POST renders the error page with a 400 when rotation is refused", async () => {
    await withRoute(
      (req, res) =>
        void handleRotate(req, res, "POST", "", "", {}, () =>
          Promise.resolve({ ok: false, error: "No existing self-service account." }),
        ),
      async (base) => {
        const res = await fetch(base, { method: "POST", body: "" });
        expect(res.status).toBe(400);
        expect(await res.text()).toContain("No existing self-service account.");
      },
    );
  });

  it("carries the ?key= password through both the form action and result links", async () => {
    await withRoute(
      (req, res) =>
        void handleRotate(req, res, "GET", "secret123", "", {}, () =>
          Promise.reject(new Error("unused")),
        ),
      async (base) => {
        const res = await fetch(base);
        expect(await res.text()).toContain("key=secret123");
      },
    );
  });

  // 2026-08-25: the id nobody remembers. A link that already names the account (the error card,
  // a profile page) locks it in rather than making the member retype an opaque slug.
  it("pre-fills and locks the account id when the link already names one", async () => {
    await withRoute(
      (req, res) =>
        void handleRotate(req, res, "GET", "", "human-uncle_joe", {}, () =>
          Promise.reject(new Error("unused")),
        ),
      async (base) => {
        const body = await (await fetch(base)).text();
        expect(body).toContain('value="human-uncle_joe" readonly');
        expect(body).toContain('type="hidden" name="id" value="human-uncle_joe"');
        expect(body).not.toContain('name="id" required');
      },
    );
  });

  it("submits the locked id even though the visible field is readonly, not name=id", async () => {
    await withRoute(
      (req, res) =>
        void handleRotate(req, res, "POST", "", "human-uncle_joe", {}, (input) => {
          expect(input.id).toBe("human-uncle_joe");
          return Promise.resolve({ ok: true, id: "human-uncle_joe", displayName: "Uncle Joe" });
        }),
      async (base) => {
        const res = await fetch(base, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "id=human-uncle_joe&apiKey=new-key&apiSecret=new-secret",
        });
        expect(res.status).toBe(200);
      },
    );
  });

  it("falls back to the free-text field when no id rides in the link", async () => {
    await withRoute(
      (req, res) =>
        void handleRotate(req, res, "GET", "", "", {}, () => Promise.reject(new Error("unused"))),
      async (base) => {
        const body = await (await fetch(base)).text();
        expect(body).toContain('name="id" required');
        expect(body).not.toContain("readonly");
      },
    );
  });
});
