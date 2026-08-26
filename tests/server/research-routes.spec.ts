import type { ServerResponse } from "node:http";
import type { NavContext, NavView } from "../../src/observatory/dashboard-shell.js";
import { serveResearchRoute } from "../../src/server/research-routes.js";

/** Capture-only stand-in for the node response — records status + body for assertions. */
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

describe("serveResearchRoute", () => {
  it("serves the shelf at /research", () => {
    const { res, out } = fakeResponse();
    serveResearchRoute(res, "/research", "/research", navFor);
    expect(out.status).toBe(200);
    expect(out.body).toContain("Research lab");
    expect(out.body).toContain("not investment advice");
  });

  it("serves a living symbol page at /research/symbol/:SYM", () => {
    const { res, out } = fakeResponse();
    serveResearchRoute(res, "/research/symbol/NVDA", "/research/symbol/NVDA", navFor);
    expect(out.status).toBe(200);
    expect(out.body).toContain("NVDA — living research");
  });

  it("renders a real shelf doc at /research/<slug>", () => {
    const { res, out } = fakeResponse();
    serveResearchRoute(
      res,
      "/research/events/nvda-2026-08-26-print",
      "/research/events/nvda-2026-08-26-print",
      navFor,
    );
    expect(out.status).toBe(200);
    expect(out.body).toContain("NVDA earnings print");
  });

  it("404s unknown slugs and traversal attempts alike", () => {
    for (const path of [
      "/research/no-such-doc",
      "/research/../package.json",
      "/research/events/../../.env",
      "/research/symbol/../../x",
    ]) {
      const { res, out } = fakeResponse();
      serveResearchRoute(res, path, path, navFor);
      expect(out.status).toBe(404);
    }
  });

  it("threads ?month= into the shelf's month-grid widget", () => {
    const { res, out } = fakeResponse();
    serveResearchRoute(res, "/research", "/research?month=2026-09", navFor);
    expect(out.status).toBe(200);
    expect(out.body).toContain("September 2026");
  });
});
