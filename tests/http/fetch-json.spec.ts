import { fetchJson } from "../../src/http/fetch-json.js";

function stubFetch(status: number, text: string): typeof fetch {
  return (() =>
    Promise.resolve({ status, text: () => Promise.resolve(text) })) as unknown as typeof fetch;
}

describe("fetchJson", () => {
  it("parses a JSON body", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = stubFetch(200, '{"ok":true}');
    try {
      const res = await fetchJson("GET", "https://example.com/v2/clock", {});
      expect(res).toEqual({ status: 200, body: { ok: true } });
    } finally {
      globalThis.fetch = original;
    }
  });

  it("returns a null body for an empty response", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = stubFetch(204, "");
    try {
      const res = await fetchJson("DELETE", "https://example.com/v2/orders/1", {});
      expect(res).toEqual({ status: 204, body: null });
    } finally {
      globalThis.fetch = original;
    }
  });

  it("names the status, method, url, and a body snippet on a non-JSON response", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = stubFetch(403, "<html>\n<head>blocked</head>\n</html>");
    try {
      await expect(fetchJson("GET", "https://example.com/v2/clock", {})).rejects.toThrow(
        "fetchJson: non-JSON response (status 403) from GET https://example.com/v2/clock: <html>",
      );
    } finally {
      globalThis.fetch = original;
    }
  });
});
