import type { ServerResponse } from "node:http";
import { serveLegacyRedirect } from "../../src/server/legacy-redirects.js";

/**
 * No dead exits: every legacy URL 302s into the shell (GET-only — there's no legacy POST handler
 * left to fall through to), and everything WITHOUT a twin — research documents — passes through
 * untouched.
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
    expect(target("/wire")).toBe("/app/activity");
    // The shell's own retired path — the page was renamed under a live bookmark.
    expect(target("/app/wire", "/app/wire?q=is%3Ahuman")).toBe("/app/activity?q=is%3Ahuman");
    expect(target("/research", "/research?q=NVDA")).toBe("/app/research?q=NVDA");
    // Collections retired into R&D → Playbooks (#3623); a shelf query has nothing left to address.
    expect(target("/collections")).toBe("/app/research?section=playbooks");
    expect(target("/collections/wheel-desks", "/collections/wheel-desks?x=1")).toBe(
      "/app/research?section=playbooks",
    );
    expect(target("/account")).toBe("/app/settings");
    expect(target("/add", "/add?key=abc")).toBe(
      "/app/accounts?section=milestones&chapter=onboarding&key=abc",
    );
    expect(target("/feedback")).toBe("/app/accounts?section=feedback");
    // The owner pages' cards live on app Settings (9e).
    expect(target("/invite")).toBe("/app/settings");
    expect(target("/claim")).toBe("/app/settings");
    // Ops status is the topbar pill now (#1296), on every route — so the bookmark lands on the app.
    expect(target("/ops-status")).toBe("/app/");
    // The retired Mission Control bookmark — the fleet switchboard for every viewer now.
    expect(target("/controls")).toBe("/app/settings");
    // The coach and preview are shared JSON endpoints, not pages — they keep serving.
    expect(target("/feedback/coach")).toBeUndefined();
    expect(target("/feedback/preview")).toBeUndefined();
    expect(target("/rotate", "/rotate?id=bot-sauron")).toBe("/app/settings?id=bot-sauron");
    expect(target("/u")).toBe("/app/settings");
    // The ticket joined in 10b — the shell gate speaks ?play=, so the learn links land preset.
    expect(target("/trade", "/trade?play=201")).toBe("/app/trade?play=201");
  });

  /** #3807 slice 2b: Milestones, its chapters and Feedback are viewer-level sections of the
   *  Profile page — the pre-shell page AND the shell's own retired route land on the final home in
   *  one hop (never `/app/learn`, itself a redirect now), the request's query riding after. */
  it("folds the Profile family into the Profile page's sections, one hop, query kept", () => {
    const milestones = "/app/accounts?section=milestones";
    expect(target("/learn")).toBe(milestones);
    expect(target("/app/learn")).toBe(milestones);
    expect(target("/learn/trading")).toBe(`${milestones}&chapter=trading`);
    // `TWINS` is exact-match — the chapter is a prefix rule, so a trailing slash still lands.
    expect(target("/app/learn/trading")).toBe(`${milestones}&chapter=trading`);
    expect(target("/app/learn/trading/")).toBe(`${milestones}&chapter=trading`);
    expect(target("/playbooks")).toBe(`${milestones}&chapter=playbooks`);
    expect(target("/app/playbooks")).toBe(`${milestones}&chapter=playbooks`);
    expect(target("/onboarding")).toBe(`${milestones}&chapter=onboarding`);
    expect(target("/app/onboarding", "/app/onboarding?moneypenny=intro")).toBe(
      `${milestones}&chapter=onboarding&moneypenny=intro`,
    );
    expect(target("/app/feedback")).toBe("/app/accounts?section=feedback");
    // Neither the page itself nor a look-alike is swallowed.
    expect(target("/app/accounts")).toBeUndefined();
    expect(target("/app/learning")).toBeUndefined();
  });

  it("keeps the pre-shell board folds working", () => {
    expect(target("/leaderboard", "/leaderboard?by=cash")).toBe("/app/leaderboard?by=cash");
    expect(target("/bots-vs-humans")).toBe("/app/leaderboard");
    expect(target("/compare", "/compare?a=x&b=y")).toBe("/app/leaderboard?a=x&b=y");
  });

  it("never redirects a POST — GET/HEAD only", () => {
    expect(target("/account", "/account", "POST")).toBeUndefined();
    expect(target("/u/sauron", "/u/sauron?tab=settings", "POST")).toBeUndefined();
    expect(target("/trade", "/trade", "POST")).toBeUndefined();
  });

  it("leaves everything without a twin alone", () => {
    // Research documents are server-rendered by design.
    expect(target("/research/nvda-aug-2026-print")).toBeUndefined();
  });
});
