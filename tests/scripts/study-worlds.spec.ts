import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { answerFrom, canonicalUrl, writeViewer } from "../../scripts/study/payloads.mjs";
import { routeRequest, wantsEventStream } from "../../scripts/study/routing.mjs";
import { edgarAnswer } from "../../scripts/study/worlds/inputs.mjs";
import { dayFrom, INSTANT, msOf, resolveToken } from "../../scripts/study/worlds/instant.mjs";

/**
 * The study worlds' plumbing (#4943 slice 2): one pinned instant every time derives from, a
 * request key that tells filters apart, a router that records writes and flags what no world
 * answers — and the rule that only `scripts/study/worlds/` may know which area is being studied.
 */

describe("the pinned instant", () => {
  it("is a Thursday mid-session in New York", () => {
    const at = new Date(INSTANT);
    expect(at.toISOString()).toBe("2026-10-08T19:00:00.000Z");
    expect(at.getUTCDay()).toBe(4);
  });

  it("resolves every time token relative to it, never to the wall clock", () => {
    expect(resolveToken("@now")).toBe("2026-10-08T19:00:00.000Z");
    expect(resolveToken("@-20s")).toBe("2026-10-08T18:59:40.000Z");
    expect(resolveToken("@-2h")).toBe("2026-10-08T17:00:00.000Z");
    expect(resolveToken("@-2d 10:31")).toBe("2026-10-06T14:31:00.000Z");
    expect(resolveToken("@0d 09:31")).toBe("2026-10-08T13:31:00.000Z");
    expect(msOf("@-1d 16:00")).toBe(Date.parse("2026-10-07T20:00:00Z"));
    expect(dayFrom(-30)).toBe("2026-09-08");
  });

  it("passes plain strings through and refuses a malformed token", () => {
    expect(resolveToken("2026-11-06")).toBe("2026-11-06");
    expect(() => resolveToken("@yesterday")).toThrow(/unreadable time token/);
  });
});

describe("canonicalUrl", () => {
  it("keeps a filter distinct and ignores the paging knob", () => {
    expect(canonicalUrl("/api/desk/x/activity?per_page=30")).toBe("/api/desk/x/activity");
    expect(canonicalUrl("/api/desk/x/activity?playbook=P&per_page=50")).toBe(
      "/api/desk/x/activity?playbook=P",
    );
  });

  it("sorts parameters so their order never changes the key", () => {
    expect(canonicalUrl("/api/trade/bars?symbol=SPY&days=31")).toBe(
      canonicalUrl("/api/trade/bars?days=31&symbol=SPY"),
    );
  });
});

describe("a composed viewer on disk", () => {
  it("answers exactly the reads it holds, with their status, and nothing else", () => {
    const dir = mkdtempSync(join(tmpdir(), "study-spec-"));
    const rows = writeViewer(dir, "v", [
      { url: "/api/a?b=2&a=1", status: 200, body: { x: 1 }, source: "builder" },
      { url: "/api/gone", status: 404, body: { error: "no" }, source: "builder" },
    ]);
    expect(rows.map((r) => r.key)).toEqual(["/api/a?a=1&b=2", "/api/gone"]);
    expect(rows[0]?.sha256).toMatch(/^[0-9a-f]{64}$/);
    const answer = answerFrom(dir, "v");
    const req = (u: string, method = "GET") => {
      const url = new URL(u, "http://w");
      return { method, url, path: url.pathname, params: url.searchParams };
    };
    expect(answer(req("/api/a?a=1&b=2"))).toEqual({ status: 200, body: { x: 1 } });
    expect(answer(req("/api/gone"))).toEqual({ status: 404, body: { error: "no" } });
    expect(answer(req("/api/a?a=1"))).toBeUndefined();
  });
});

describe("routeRequest", () => {
  const url = (u: string) => new URL(u, "http://w");
  const world = (path: string) => (path === "/api/known" ? { body: { ok: 1 } } : undefined);
  const answer = (r: { path: string }) => world(r.path);

  it("hands event streams to the local server", () => {
    expect(wantsEventStream("/events")).toBe(true);
    expect(wantsEventStream("/api/trade/quote-stream", "text/event-stream")).toBe(true);
    expect(
      routeRequest({ method: "GET", url: url("/api/x"), accept: "text/event-stream" }, answer),
    ).toEqual({ kind: "stream" });
  });

  it("answers a known read and flags an unknown one", () => {
    expect(routeRequest({ method: "GET", url: url("/api/known") }, answer)).toEqual({
      kind: "json",
      status: 200,
      body: { ok: 1 },
    });
    expect(routeRequest({ method: "GET", url: url("/api/other") }, answer)).toEqual({
      kind: "unstubbed",
    });
  });

  it("treats every write as a write, answered benignly when the world has no answer", () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(routeRequest({ method, url: url("/api/trade/submit") }, answer)).toEqual({
        kind: "write",
        status: 200,
        body: { ok: true },
      });
    }
  });
});

describe("edgarAnswer", () => {
  const answer = edgarAnswer({
    edgar: { ABC: { cik: 42, eightKs: [{ date: "2026-08-01", items: "2.02" }] } },
  });

  it("answers the ticker map and a held company's recent 8-Ks", () => {
    expect(answer("https://www.sec.gov/files/company_tickers.json")).toEqual({
      "0": { cik_str: 42, ticker: "ABC" },
    });
    expect(answer("https://data.sec.gov/submissions/CIK0000000042.json")).toEqual({
      filings: { recent: { form: ["8-K"], filingDate: ["2026-08-01"], items: ["2.02"] } },
    });
  });

  it("answers nothing else, so the composer refuses it", () => {
    expect(answer("https://data.sec.gov/submissions/CIK0000000043.json")).toBeUndefined();
    expect(answer("https://example.com/")).toBeUndefined();
  });
});

describe("only scripts/study/worlds/ knows the area under study", () => {
  // The method must generalise: the router, the payload store, the server-read chain and the parity
  // check may not name a member, an account, a ticker or a route of the profile.
  const AREA = /\b(eric|sauron|jordan|casey|CRWV|NVDA|AAPL|MSFT)\b|\/app\/(accounts|u\/)/i;
  const dir = join(import.meta.dirname, "../../scripts/study");
  const files = readdirSync(dir).filter((f) => f.endsWith(".mjs") || f.endsWith(".d.mts"));

  it("finds the area-agnostic files", () => {
    expect(files).toEqual(expect.arrayContaining(["parity.mjs", "world-route.mjs", "routing.mjs"]));
  });

  for (const file of files) {
    it(`${file} names no profile specific`, () => {
      const code = readFileSync(join(dir, file), "utf8");
      expect(code.match(AREA)?.[0] ?? null).toBeNull();
    });
  }
});
