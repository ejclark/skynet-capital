import type { ServerResponse } from "node:http";
import { refusalPage, resultRedirect } from "../../src/server/trade-response-pages.js";
import type { TradeRouteDeps } from "../../src/server/trade-ticket-route.js";

function fakeResponse(): {
  res: ServerResponse;
  out: { status?: number; headers?: Record<string, string>; body: string };
} {
  const out: { status?: number; headers?: Record<string, string>; body: string } = { body: "" };
  const res = {
    writeHead(status: number, headers?: Record<string, string>) {
      out.status = status;
      out.headers = headers;
      return res;
    },
    end(chunk?: string) {
      out.body = chunk ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

describe("refusalPage", () => {
  it("writes the given status wrapped in the deps' document shell, with the reason visible", () => {
    const { res, out } = fakeResponse();
    const deps: TradeRouteDeps = {
      document: (title, body) => `<title>${title}</title>${body}`,
    } as TradeRouteDeps;

    refusalPage(deps, res, 403, "Training wheels are on.");

    expect(out.status).toBe(403);
    expect(out.body).toContain("Order refused — Skynet Capital");
    expect(out.body).toContain("Training wheels are on.");
    expect(out.body).toContain("Back to the board");
  });
});

describe("resultRedirect", () => {
  it("redirects to the account's positions tab, marked submitted on success", () => {
    const { res, out } = fakeResponse();

    resultRedirect(res, "acct-1", true);

    expect(out.status).toBe(303);
    expect(out.headers?.location).toContain("acct-1");
    expect(out.headers?.location).toContain("tab=positions");
    expect(out.headers?.location).toContain("n=submitted");
  });

  it("marks the redirect refused on failure", () => {
    const { res, out } = fakeResponse();

    resultRedirect(res, "acct-1", false);

    expect(out.headers?.location).toContain("n=refused");
  });
});
