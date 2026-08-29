import type { ServerResponse } from "node:http";
import { serveLegacyRedirect } from "../../src/server/legacy-redirects.js";

/**
 * No dead exits: every twinned legacy URL 302s into the shell, POSTs still reach the old
 * handlers, and everything WITHOUT a twin — research documents, the escape hatch — passes
 * through untouched.
 */

function fakeRes() {
  const out: { status?: number; location?: string } = {};
  const res = {
    writeHead: (status: number, headers?: Record<string, string>) => {
      out.status = status;
      out.location = headers?.location;
      return res;
    },
    end: () => undefined,
  } as unknown as ServerResponse;
  return { res, out };
}

function target(path: string, url = path, method = "GET"): string | undefined {
  const { res, out } = fakeRes();
  return serveLegacyRedirect(res, path, url, method) ? out.location : undefined;
}

describe("serveLegacyRedirect", () => {
  it("sends the legacy desk to its shell twin, tabs mapped", () => {
    expect(target("/u/sauron")).toBe("/app/u/sauron");
    expect(target("/u/sauron", "/u/sauron?tab=overview")).toBe("/app/u/sauron");
    expect(target("/u/sauron", "/u/sauron?tab=active")).toBe("/app/u/sauron");
    // Performance's twin is Pulse; the settings tab moved to app Settings (Mission Control).
    expect(target("/u/sauron", "/u/sauron?tab=performance")).toBe("/app/u/sauron/pulse");
    expect(target("/u/sauron", "/u/sauron?tab=settings")).toBe("/app/settings");
  });

  it("renames the twinned pages, queries riding along", () => {
    expect(target("/learn")).toBe("/app/learn");
    expect(target("/wire")).toBe("/app/wire");
    expect(target("/research", "/research?q=NVDA")).toBe("/app/research?q=NVDA");
    expect(target("/collections")).toBe("/app/collections");
    expect(target("/collections/wheel-desks")).toBe("/app/collections/wheel-desks");
    expect(target("/account")).toBe("/app/settings");
    expect(target("/add", "/add?key=abc")).toBe("/app/join?key=abc");
    expect(target("/feedback")).toBe("/app/feedback");
    // The owner pages' cards live on app Settings (9e).
    expect(target("/invite")).toBe("/app/settings");
    expect(target("/claim")).toBe("/app/settings");
    expect(target("/ops-status")).toBe("/app/settings");
    // The coach and preview are shared JSON endpoints, not pages — they keep serving.
    expect(target("/feedback/coach")).toBeUndefined();
    expect(target("/feedback/preview")).toBeUndefined();
    expect(target("/rotate", "/rotate?id=bot-sauron")).toBe("/app/settings?id=bot-sauron");
    expect(target("/u")).toBe("/app/settings");
    // The ticket joined in 10b — the shell gate speaks ?play=, so the learn links land preset.
    expect(target("/trade", "/trade?play=201")).toBe("/app/trade?play=201");
  });

  it("keeps the pre-shell board folds working", () => {
    expect(target("/leaderboard", "/leaderboard?by=cash")).toBe("/?by=cash");
    expect(target("/bots-vs-humans")).toBe("/");
    expect(target("/compare", "/compare?a=x&b=y")).toBe("/?a=x&b=y");
  });

  it("never redirects a POST — the legacy write handlers stay reachable", () => {
    expect(target("/account", "/account", "POST")).toBeUndefined();
    expect(target("/u/sauron", "/u/sauron?tab=settings", "POST")).toBeUndefined();
    expect(target("/trade", "/trade", "POST")).toBeUndefined();
  });

  it("leaves everything without a twin alone", () => {
    // Research documents are server-rendered by design; /classic is the escape hatch.
    expect(target("/research/nvda-aug-2026-print")).toBeUndefined();
    expect(target("/classic")).toBeUndefined();
  });
});
