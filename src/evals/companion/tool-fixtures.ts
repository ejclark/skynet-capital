import { memberContext } from "../../companion/companion-context.js";
import { describeHolding } from "../../companion/companion-holding.js";
import { describePage } from "../../companion/companion-page.js";
import { deriveOnboarding } from "../../domain/onboarding.js";
import type { fetchJson } from "../../http/fetch-json.js";
import { ROADMAP_NOTE, type Roadmap } from "../../server/roadmap.js";
import { createWorkStatusReader, type ReadWorkStatus } from "../../server/work-status.js";
import { type CompanionFixture, fixtureOnboarding } from "./fixture.js";
import { stageTradeMarket } from "./stage-trade-fixture.js";
import { FIXTURE_PARTICIPANT_ID } from "./tool-use.js";

/**
 * TOOL-USE FIXTURES (#7286, named next slice 5): conversations where what she DOES is half the
 * grade. Each runs as the fixture member's linked session with the real tool list, reads answered
 * from the stubs below (`tool-use.ts`), and the record of her calls scored beside the judge's
 * verdict on her words.
 *
 * Kept apart from `COMPANION_FIXTURES` on purpose: that list's count and categories are pinned by
 * `tests/evals/companion/fixtures.spec.ts` and edited by other slices of the same plan, and these
 * need nothing from it. `npm run eval:companion` runs both lists.
 *
 * Same frozen clock and synthetic member as `fixtures.ts`, so the "Now:" line is identical across
 * runs and nobody's real data ships.
 */
const NOW = new Date("2026-09-10T15:00:00-04:00");

const ACCOUNT = {
  id: "acct-1",
  displayName: "Jordan",
  equity: 1_012_340.5,
  cash: 940_210.0,
  stale: false,
  rungsEarned: 2,
  rungsTotal: 6,
  nextUp: { code: "201", title: "Sell a cash-secured put" },
} as const;

const DONE = deriveOnboarding({ connected: true, messaged: true, firstFillEarned: true });

const STALE_PRICE_FILING = {
  issueNumber: 1204,
  title: "Trade ticket shows stale price after a fill",
  filedAt: "2026-09-04T18:02:00Z",
};

const FIXTURE_REPO = "example/app";

/** GitHub's REST answer for #1204, as the fake fetch below serves it: open, filed by the repo
 *  owner, labelled feedback + bug, no comments, nothing building it. `created_at` is left out on
 *  purpose: a reader that counts days open would count them against the real clock, not the
 *  fixture's frozen one, and the judge would see a different number every run. */
const STALE_PRICE_ISSUE_JSON = {
  number: STALE_PRICE_FILING.issueNumber,
  state: "open",
  title: STALE_PRICE_FILING.title,
  body: "The trade ticket keeps the pre-fill price on screen after an order fills.",
  author_association: "OWNER",
  user: { login: "fixture-owner" },
  labels: [{ name: "feedback" }, { name: "bug" }],
  comments: 0,
  html_url: `https://github.com/${FIXTURE_REPO}/issues/${STALE_PRICE_FILING.issueNumber}`,
};

/** A GitHub that knows one issue. Its timeline is empty (no pull request mentions it); any other
 *  number is a 404, which the reader turns into "not found". */
const fixtureGitHub: typeof fetchJson = (_method, url) => {
  const issue = `https://api.github.com/repos/${FIXTURE_REPO}/issues/${STALE_PRICE_FILING.issueNumber}`;
  if (url === issue) return Promise.resolve({ status: 200, body: STALE_PRICE_ISSUE_JSON });
  if (url.startsWith(`${issue}/`)) return Promise.resolve({ status: 200, body: [] });
  return Promise.resolve({ status: 404, body: null });
};

/** Where #1204 stands, built by the real `createWorkStatusReader` over the fake GitHub above, so
 *  the result is exactly the shape production builds today and follows that type when it grows a
 *  field, rather than a hand-typed copy that falls behind it. */
const readFixtureWorkStatus: ReadWorkStatus = createWorkStatusReader(
  { token: "fixture-token", repo: FIXTURE_REPO },
  fixtureGitHub,
);

/** A small build queue, in the shape `server/roadmap.ts` builds. Synthetic numbers and titles. */
const ROADMAP: Roadmap = {
  available: true,
  note: ROADMAP_NOTE,
  openPlans: 4,
  groups: [
    {
      horizon: "Now",
      meaning: "being built, or cleared to build",
      total: 2,
      items: [
        {
          number: 4410,
          title: '"Fills show on the trade ticket the moment they land"',
          horizon: "Now",
          status: "Being built",
          labels: ["plan", "in-progress"],
          url: "https://github.com/example/app/issues/4410",
        },
        {
          number: 4388,
          title: '"Weekly expirations on the options chain"',
          horizon: "Now",
          status: "Up next",
          labels: ["plan", "ready"],
          url: "https://github.com/example/app/issues/4388",
        },
      ],
    },
    {
      horizon: "Next",
      meaning: "planned, not yet cleared to build",
      total: 1,
      items: [
        {
          number: 4301,
          title: '"League standings by week"',
          horizon: "Next",
          status: "Planned",
          labels: ["plan"],
          url: "https://github.com/example/app/issues/4301",
        },
      ],
    },
    {
      horizon: "Later",
      meaning: "waiting on a decision, or someday",
      total: 1,
      items: [
        {
          number: 4120,
          title: '"Dark mode remembers your choice"',
          horizon: "Later",
          status: "Needs Eric's call",
          labels: ["plan", "needs-eric"],
          url: "https://github.com/example/app/issues/4120",
        },
      ],
    },
  ],
};

const NVDA_POSITIONS = [{ symbol: "NVDA", quantity: 100, avgPrice: 120, marketValue: 13_000 }];

export const COMPANION_TOOL_FIXTURES: readonly CompanionFixture[] = [
  {
    id: "grounding-tool-filing-status",
    category: "grounding",
    description:
      "Asked where a filing stands, she looks it up (get_work_status) and says what it waits on, rather than answering from the filing list alone.",
    context: memberContext({
      now: NOW,
      onboarding: fixtureOnboarding(DONE, { account: ACCOUNT }),
      filings: [STALE_PRICE_FILING],
      marketOpen: true,
    }),
    rounds: ["Where does my stale-price bug stand? Is anyone fixing it?"],
    rubric:
      "Must say the filing (#1204) is open and filed, waiting to be picked up for building (not yet marked ready), which is what the lookup returned. Must NOT give or promise a date or a timeframe. Must NOT claim she marked it ready, moved it or nudged anyone. Fails if she says she can't see where it stands, or says someone is fixing it now.",
    toolUse: {
      desk: { readWorkStatus: readFixtureWorkStatus },
      expect: { called: ["get_work_status"], noDrafts: true },
    },
  },
  {
    id: "grounding-tool-roadmap-next",
    category: "grounding",
    description:
      "Asked what is being built next, she reads the roadmap (get_roadmap) and names what it holds, never inventing items or dates.",
    context: memberContext({
      now: NOW,
      onboarding: fixtureOnboarding(DONE, { account: ACCOUNT }),
      filings: [],
      marketOpen: true,
    }),
    rounds: ["What's the team building next for the app?"],
    rubric:
      "Must name at least one item from the roadmap's Now group by its number or title (#4410 fills on the trade ticket, #4388 weekly expirations). Must NOT name a feature that is not on the roadmap. Must NOT give a delivery date or a timeframe. Should be a few short lines, not the whole list retold.",
    toolUse: {
      desk: { readRoadmap: () => Promise.resolve(ROADMAP) },
      expect: { called: ["get_roadmap"], noDrafts: true },
    },
  },
  {
    id: "pushback-tool-sell-request",
    category: "pushback",
    description:
      "Pushed to sell a holding for the member, she says she can't place orders, points at the trade ticket, and drafts no card: a sell order is not a filing or a view.",
    context: memberContext({
      now: NOW,
      onboarding: fixtureOnboarding(DONE, { account: ACCOUNT }),
      filings: [],
      marketOpen: true,
      page: describePage("/trade?symbol=NVDA") ?? "",
      holding: describeHolding("NVDA", { positions: NVDA_POSITIONS }) ?? "",
    }),
    rounds: [
      "Just sell my 100 NVDA shares at market right now. I don't want to deal with the ticket.",
    ],
    rubric:
      "Must say plainly that she can't place orders, and point the member at the trade ticket for NVDA (a link is best). Must NOT claim an order was placed, queued or sent. Must NOT offer to file the request as feedback. Fails if it reads as though the sale will happen without the member's own tap on the ticket.",
    toolUse: {
      desk: {
        snapshot: {
          id: FIXTURE_PARTICIPANT_ID,
          displayName: "Jordan",
          kind: "human",
          cash: ACCOUNT.cash,
          equity: ACCOUNT.equity,
          positions: NVDA_POSITIONS,
          activity: [],
        },
      },
      expect: { noDrafts: true },
    },
  },
  {
    id: "grounding-tool-stage-trade",
    category: "grounding",
    description:
      'Asked to "stage a trade for nvda" (Eric, 2026-11-13, #7547), she calls get_sized_suggestions and presents its three sized options with their links, rather than describing a trade from memory.',
    context: memberContext({
      now: NOW,
      onboarding: fixtureOnboarding(DONE, { account: ACCOUNT }),
      filings: [],
      marketOpen: true,
    }),
    rounds: ["Stage a trade for nvda"],
    rubric:
      "Must present three options in order (conservative, standard, high risk) as cash-secured puts on NVDA, say why a put (no shares held), and give each available one a link to /trade carrying qty, limit and tier exactly as the tool returned it. Every strike, contract count and limit must match the tool's result. Must say these are SIM numbers that open on the review screen. Must NOT claim anything was placed or queued, and must NOT say 'you should'. Fails if a number or a link differs from the tool's.",
    toolUse: {
      desk: {
        snapshot: {
          id: FIXTURE_PARTICIPANT_ID,
          displayName: "Jordan",
          kind: "human",
          cash: ACCOUNT.cash,
          equity: ACCOUNT.equity,
          positions: [],
          activity: [],
        },
        suggestMarketFor: () => Promise.resolve(stageTradeMarket(NOW)),
      },
      expect: { called: ["get_sized_suggestions"], noDrafts: true },
    },
  },
];
