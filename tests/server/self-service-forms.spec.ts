import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { handleSelfServiceForm, requireOwner } from "../../src/server/self-service-forms.js";

/**
 * The owner gate and GET/POST form dispatch `invite-form.ts`'s `handleInvite` stands on — real
 * `IncomingMessage`/`ServerResponse` traffic over the wire, since that's the honest way to test
 * status codes and body content without peeking at internals.
 */

async function withRoute(
  handler: (
    req: Parameters<typeof handleSelfServiceForm>[0],
    res: Parameters<typeof handleSelfServiceForm>[1],
  ) => void,
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

describe("requireOwner", () => {
  const page = (title: string, inner: string) => `<h1>${title}</h1>${inner}`;

  it("returns the lowercased email when the viewer is an owner", async () => {
    await withRoute(
      (_req, res) => {
        const email = requireOwner(res, "Ann@Example.com", (e) => e === "ann@example.com", page);
        res.end(String(email));
      },
      async (base) => {
        expect(await (await fetch(base)).text()).toBe("ann@example.com");
      },
    );
  });

  it("403s identically for signed-out and signed-in-but-not-owner — no shape tell", async () => {
    let anonBody = "";
    await withRoute(
      (_req, res) => {
        requireOwner(res, undefined, () => false, page);
      },
      async (base) => {
        const anon = await fetch(base);
        expect(anon.status).toBe(403);
        anonBody = await anon.text();
      },
    );
    await withRoute(
      (_req, res) => {
        requireOwner(res, "member@example.com", () => false, page);
      },
      async (base) => {
        const notOwner = await fetch(base);
        expect(notOwner.status).toBe(403);
        expect(await notOwner.text()).toBe(anonBody);
      },
    );
    expect(anonBody).toContain("isn't available on your account");
  });
});

describe("handleSelfServiceForm", () => {
  it("GET renders the form", async () => {
    await withRoute(
      (req, res) =>
        void handleSelfServiceForm(
          req,
          res,
          "GET",
          () => "<form></form>",
          () => Promise.reject(new Error("unused")),
          () => "unused",
        ),
      async (base) => {
        const res = await fetch(base);
        expect(res.status).toBe(200);
        expect(await res.text()).toBe("<form></form>");
      },
    );
  });

  it("POST parses the body, submits, and renders success at 200", async () => {
    await withRoute(
      (req, res) =>
        void handleSelfServiceForm(
          req,
          res,
          "POST",
          () => "unused",
          (form) => Promise.resolve({ ok: true, value: form.get("name") }),
          (result) => `hi ${result.value}`,
        ),
      async (base) => {
        const res = await fetch(base, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "name=Ann",
        });
        expect(res.status).toBe(200);
        expect(await res.text()).toBe("hi Ann");
      },
    );
  });

  it("POST renders a refusal at 400 when the submit result says so", async () => {
    await withRoute(
      (req, res) =>
        void handleSelfServiceForm(
          req,
          res,
          "POST",
          () => "unused",
          () => Promise.resolve({ ok: false, error: "nope" }),
          (result) => result.error,
        ),
      async (base) => {
        const res = await fetch(base, { method: "POST", body: "" });
        expect(res.status).toBe(400);
        expect(await res.text()).toBe("nope");
      },
    );
  });

  it("refuses any method besides GET/POST", async () => {
    await withRoute(
      (req, res) =>
        void handleSelfServiceForm(
          req,
          res,
          "DELETE",
          () => "unused",
          () => Promise.reject(new Error("unused")),
          () => "unused",
        ),
      async (base) => {
        const res = await fetch(base, { method: "DELETE" });
        expect(res.status).toBe(405);
      },
    );
  });
});
