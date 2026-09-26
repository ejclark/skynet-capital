import { describe, expect, it } from "@rstest/core";
import {
  buildScreens,
  coverage,
  indexTriage,
  landingOf,
  matchRoute,
  parseChapters,
  parseRouteTree,
  parseSections,
  type Section,
  screenKey,
  sectionsOf,
  type TriageRow,
} from "../../scripts/crawl/coverage.mjs";

// The journey coverage table (scripts/crawl/coverage.mjs): which living screen does a member
// journey step visit at phone width? "Comprehensive" is the number it prints — every living
// page·section visited at phone, or triaged as nobody-needs-it — so the parsers that find the
// screens and the join that counts the visits are pinned here over fixture strings, never the
// real route tree (which moves every week).

const ROUTE_TREE = `
import { Route as AccountsRouteImport } from './routes/accounts'
import { Route as TradeRouteImport } from './routes/trade'
import { Route as IndexRouteImport } from './routes/index'
import { Route as LeaderboardRouteImport } from './routes/leaderboard'
import { Route as UIdRouteImport } from './routes/u.$id'
import { Route as UIdIndexRouteImport } from './routes/u.$id.index'
import { Route as UIdThesisRouteImport } from './routes/u.$id.thesis'
declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/accounts': {
      id: '/accounts'
      path: '/accounts'
      fullPath: '/accounts'
      preLoaderRoute: typeof AccountsRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/leaderboard': {
      fullPath: '/leaderboard'
      preLoaderRoute: typeof LeaderboardRouteImport
    }
    '/trade': {
      fullPath: '/trade'
      preLoaderRoute: typeof TradeRouteImport
    }
    '/u/$id': {
      fullPath: '/u/$id'
      preLoaderRoute: typeof UIdRouteImport
    }
    '/u/$id/': {
      fullPath: '/u/$id/'
      preLoaderRoute: typeof UIdIndexRouteImport
    }
    '/u/$id/thesis': {
      fullPath: '/u/$id/thesis'
      preLoaderRoute: typeof UIdThesisRouteImport
    }
  }
}`;

describe("parseRouteTree", () => {
  it("reads every fullPath and collapses /u/$id with /u/$id/ into one screen", () => {
    const routes = parseRouteTree(ROUTE_TREE);
    expect(routes.map((r) => r.path)).toEqual([
      "/",
      "/accounts",
      "/leaderboard",
      "/trade",
      "/u/$id",
      "/u/$id/thesis",
    ]);
    expect(routes.find((r) => r.path === "/u/$id")?.modules).toEqual([
      "routes/u.$id",
      "routes/u.$id.index",
    ]);
  });

  it("fails loudly when nothing parses", () => {
    expect(() => parseRouteTree("export const x = 1")).toThrow(/no fullPath/);
  });
});

describe("sections", () => {
  const PROFILE = `
const BOOK: readonly PageSection<AccountsSection>[] = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
];
const VIEWER: readonly PageSection<AccountsSection>[] = [{ id: "milestones", label: "Milestones" }];
export const ALL_SECTIONS: readonly PageSection<AccountsSection>[] = [...BOOK, ...VIEWER];`;

  it("takes the union of every literal, so a spread list is counted once", () => {
    expect(parseSections(PROFILE).map((s) => s.id)).toEqual(["overview", "activity", "milestones"]);
  });

  it("follows a relative import that declares a section list; a prop type is not a declaration", () => {
    const files: Record<string, string> = {
      "app/src/routes/accounts.tsx": `import { ALL_SECTIONS } from "../shell/profile-sections";
import { LENS } from "../shell/positions-lens";
interface P { readonly sections: readonly PageSection<AccountsSection>[]; }`,
      "app/src/shell/profile-sections.ts": PROFILE,
      "app/src/shell/positions-lens.tsx": `const LENS = [{ id: "cards", label: "Cards" }];`,
    };
    const read = (p: string) => files[p];
    expect(sectionsOf("app/src/routes/accounts.tsx", read).map((s) => s.id)).toEqual([
      "overview",
      "activity",
      "milestones",
    ]);
  });

  it("fails loudly when a file declares PageSection<…>[] and no section parses", () => {
    const read = (p: string) =>
      p === "r.tsx"
        ? `const SECTIONS: readonly PageSection<S>[] = [{ id: 'feed', label: 'Feed' }];`
        : undefined;
    expect(() => sectionsOf("r.tsx", read)).toThrow(/declares PageSection/);
  });

  it("reads the ?chapter= values and fails loudly on none", () => {
    const src = `export const MILESTONE_CHAPTERS: readonly MilestoneChapter[] = [
  "onboarding",
  "trading",
];`;
    expect(parseChapters(src, "MILESTONE_CHAPTERS")).toEqual(["onboarding", "trading"]);
    expect(() => parseChapters("const X = 1", "MILESTONE_CHAPTERS")).toThrow(/no MILESTONE/);
  });
});

describe("screenKey · matchRoute", () => {
  it("drops a trailing note so a triage label joins its screen", () => {
    expect(screenKey("/accounts ?section=milestones (table of contents)")).toBe(
      "/accounts ?section=milestones",
    );
    expect(screenKey("server /research (listing), /trade, /ops-status")).toBe(
      "server /research (listing), /trade, /ops-status",
    );
  });

  it("matches a concrete path to its pattern", () => {
    const paths = ["/", "/u/$id", "/u/$id/thesis"];
    expect(matchRoute("/u/sauron/thesis", paths)).toBe("/u/$id/thesis");
    expect(matchRoute("/u/sauron", paths)).toBe("/u/$id");
    expect(matchRoute("/nope", paths)).toBeUndefined();
  });
});

// ── the join ──────────────────────────────────────────────────────────────────────────────────

const sec = (...ids: string[]): Section[] => ids.map((id) => ({ id, label: id }));
const SECTIONS = new Map<string, Section[]>([
  ["/accounts", sec("overview", "activity", "heartbeat", "milestones")],
  ["/trade", sec("ticket", "chart")],
]);
const ROUTE_PATHS = ["/", "/accounts", "/leaderboard", "/trade", "/u/$id", "/u/$id/thesis"];
const TRIAGE: TriageRow[] = [
  { screen: "/accounts ?section=overview", verdict: "keep", mustBeSeenBy: "member" },
  { screen: "/accounts ?section=activity", verdict: "keep" },
  { screen: "/accounts ?section=heartbeat", verdict: "keep" },
  {
    screen: "/accounts ?section=decisions",
    verdict: "redirect-only",
    target: "/accounts?section=heartbeat",
  },
  { screen: "/accounts ?section=milestones (table of contents)", verdict: "keep" },
  { screen: "/accounts ?section=milestones&chapter=onboarding", verdict: "keep" },
  { screen: "/leaderboard", verdict: "keep" },
  { screen: "/ (SPA index)", verdict: "redirect-only", target: "/leaderboard (keeps by/a/b)" },
  { screen: "/trade ?section=ticket", verdict: "keep" },
  { screen: "/trade ?section=chart", verdict: "keep" },
  { screen: "/u/$id (Overview)", verdict: "keep" },
  { screen: "/u/$id/thesis", verdict: "undecided", target: "fold into the account page?" },
  { screen: "unknown URL", verdict: "undecided", target: "404" },
];
const ctx = (linked: boolean) => ({
  linked,
  routePaths: ROUTE_PATHS,
  sections: SECTIONS,
  triage: indexTriage(TRIAGE),
});

describe("landingOf", () => {
  it("lands on the route's default section — Overview with an account, the door without", () => {
    expect(landingOf("/app/accounts", ctx(true))).toEqual(["/accounts ?section=overview"]);
    expect(landingOf("/app/accounts", ctx(false))).toEqual([
      "/accounts ?section=milestones",
      "/accounts ?section=milestones&chapter=onboarding",
    ]);
    expect(landingOf("/app/accounts?section=bogus", ctx(true))).toEqual([
      "/accounts ?section=overview",
    ]);
    expect(landingOf("/app/trade?desk=human-eric&symbol=EEM", ctx(true))).toEqual([
      "/trade ?section=ticket",
    ]);
  });

  it("follows a redirect-only row to where it lands", () => {
    expect(landingOf("/app/", ctx(false))).toEqual(["/", "/leaderboard"]);
    expect(landingOf("/app/accounts?section=decisions", ctx(true))).toEqual([
      "/accounts ?section=decisions",
      "/accounts ?section=heartbeat",
    ]);
  });

  it("maps a member id onto its pattern, and an unknown path onto the Not Found row", () => {
    expect(landingOf("/app/u/sauron/thesis", ctx(true))).toEqual(["/u/$id/thesis"]);
    expect(landingOf("/app/nowhere", ctx(true))).toEqual(["unknown URL"]);
  });
});

describe("coverage", () => {
  const routes = parseRouteTree(ROUTE_TREE);
  const screens = buildScreens({
    routes,
    sections: SECTIONS,
    chapters: ["onboarding"],
    serverPages: [{ screen: "unknown URL" }],
  });
  const journeys = [
    {
      member: "owner",
      fixture: { kind: "session", participant: "human-eric" },
      viewports: ["phone", "desktop"],
      journeys: [
        {
          id: "j1",
          steps: [
            { id: "s1", goto: "/app/accounts" },
            { id: "s2", goto: "/app/trade?section=chart", only: "desktop" },
            { id: "s3", goto: "/app/trade" },
            { id: "s4", goto: "/app/u/sauron", only: "desktop" },
          ],
        },
      ],
    },
    {
      member: "newcomer",
      fixture: { kind: "session" },
      viewports: ["phone"],
      journeys: [{ id: "j1", steps: [{ id: "s1", goto: "/app/" }] }],
    },
  ];
  const result = coverage({
    screens,
    triageRows: TRIAGE,
    journeys,
    routePaths: routes.map((r) => r.path),
    sections: SECTIONS,
  });
  const byKey = (k: string) => result.rows.find((r) => r.key === k);

  it("counts a phone step as covering, and a desktop-only visit as still a gap", () => {
    expect(byKey("/accounts ?section=overview")?.status).toBe("covered");
    expect(byKey("/accounts ?section=overview")?.phone).toEqual(["owner j1-s1"]);
    expect(byKey("/u/$id")?.status).toBe("gap");
    expect(byKey("/u/$id")?.desktop).toEqual(["owner j1-s4"]);
  });

  it("counts Trade's sections only from phone steps — at desktop they dock", () => {
    const chart = byKey("/trade ?section=chart");
    expect(chart?.status).toBe("gap");
    expect(chart?.docked).toBe(true);
    expect(chart?.desktop).toEqual([]);
    expect(byKey("/trade ?section=ticket")?.status).toBe("covered");
  });

  it("never counts a redirect-only row as a gap, and credits the page it lands on", () => {
    expect(byKey("/")?.status).toBe("never a gap");
    expect(byKey("/accounts ?section=decisions")?.status).toBe("never a gap");
    expect(byKey("/leaderboard")?.phone).toEqual(["newcomer j1-s1"]);
  });

  it("prints the headline over living rows only", () => {
    // living = 9 keep + 2 undecided; covered at phone = overview, ticket, leaderboard
    expect(result.headline).toBe("3 of 11 living rows covered at phone · 6 gaps · 2 undecided");
    expect(result.unjudged).toEqual([]);
    expect(result.stale).toEqual([]);
  });

  it("flags a screen the code has and triage does not, and a living row no screen matches", () => {
    const flagged = coverage({
      screens: [...screens, { key: "/trade ?section=orders", path: "/trade", section: "orders" }],
      triageRows: [...TRIAGE, { screen: "/gone", verdict: "keep" }],
      journeys: [],
      routePaths: routes.map((r) => r.path),
      sections: SECTIONS,
    });
    expect(flagged.unjudged.map((r) => r.key)).toEqual(["/trade ?section=orders"]);
    expect(flagged.stale.map((r) => r.key)).toEqual(["/gone"]);
  });

  it("rejects a verdict outside the five", () => {
    expect(() => indexTriage([{ screen: "/x", verdict: "maybe" as TriageRow["verdict"] }])).toThrow(
      /bad triage row/,
    );
  });
});
