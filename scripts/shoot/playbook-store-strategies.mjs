// The strategy-card groups of the R&D → Playbooks shoot (`playbook-store.mjs`, #3623), moved out of it
// unchanged so that harness stays under the code-line cap: `strategies` (#4469 slice 3b), `picker`
// (slice 3b part 2), `conviction` (slice 3c part 3b), `scorecard` (#5482 slice 5) and `window` (#5432)
// — every frame that reads one strategy card, mostly on the shared `strategyFrame` shape.

import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.ts";
import {
  COUNTS,
  PHONE,
  STORE,
  subscription,
  underHeader,
  views,
  withCounts,
} from "./playbook-store-world.mjs";

const groups = {};

// #4469 slice 3b: the Store by strategy. Sauron holds the wheel on CRWV (the owner's conviction) and
// the run-up on NVDA, so those two strategy cards lead with his pairs; the catalog frame is the same
// deck with no account. The wheel and run-up rows, then Sauron's own rules' folded "? not studied".
views.byStrategy = withCounts(
  playbookStoreView([
    subscription("CRWV-WHEEL", {
      mode: "aggressive",
      capitalAllocated: 75_000,
    }),
    subscription("S1-NVDA", {
      capitalAllocated: 50_000,
      compoundAllocation: true,
    }),
  ]),
  { ...COUNTS, "CRWV-WHEEL": 1 },
);
const toStrategy = (name) => (page) =>
  page.locator(".pb-strategy").filter({ hasText: name }).first().evaluate(underHeader);
const strategyFrame = (tag, over = {}) => ({
  tag,
  view: views.byStrategy,
  expect: "The wheel",
  viewport: PHONE,
  path: STORE,
  ...over,
});
groups.strategies = [
  strategyFrame("phone-1-owner-pairs", {
    path: undefined,
    act: toStrategy("The wheel"),
  }),
  strategyFrame("phone-2-rows-by-evidence", {
    path: undefined,
    expect: "The pre-print run-up",
    act: toStrategy("The pre-print run-up"),
  }),
  strategyFrame("phone-3-folded-line", {
    view: views.catalog,
    expect: "Sauron's own rules",
    act: toStrategy("Sauron's own rules"),
  }),
  strategyFrame("phone-4-catalog", {
    view: views.catalog,
    act: toStrategy("The wheel"),
  }),
  strategyFrame("desktop-owner-pairs", {
    path: undefined,
    viewport: undefined,
    quality: 55,
  }),
];

// #4469 slice 3b part 2: the ticker picker. The run-up's list is the richest one (Sauron holds NVDA,
// GOOG can be taken, DJT can't run); the wheel's frame picks CRWV, types the budget and checks first.
// The preflight answer is a fixture (its shape is `PreflightAnswer`); the wheel's $8,000 is the
// figure the 3a spec measures on the CRWV wheel's own fixtures.
const inCard = (page, name) => page.locator(".pb-strategy").filter({ hasText: name }).first();
const openPicker = (name) => async (page) => {
  await inCard(page, name)
    .getByRole("button", { name: /Pick a ticker/ })
    .click();
  await page.locator("dialog[open]").waitFor();
  // The sheet rises over 180ms (`pb-sheet-rise`); a frame taken inside it is translucent.
  await page.waitForTimeout(400);
};
const checkCrwv = async (page) => {
  await openPicker("The wheel")(page);
  const sheet = page.locator("dialog[open]");
  await sheet.getByRole("button", { name: /CRWV/ }).click();
  await sheet.getByLabel("Capital to delegate ($)").fill("75000");
  await sheet.getByRole("button", { name: "Check first" }).click();
  await sheet.getByText(/One contract ties up/).waitFor();
};
const PREFLIGHT = {
  "/api/playbook-store/preflight": {
    ok: true,
    options: true,
    oneContractCash: 8000,
    idleShare: 0.893,
  },
};
groups.picker = [
  strategyFrame("phone-1-picker-list", {
    path: undefined,
    expect: "The pre-print run-up",
    act: openPicker("The pre-print run-up"),
  }),
  strategyFrame("phone-2-check-first", {
    view: views.fresh,
    path: undefined,
    act: checkCrwv,
    extraStubs: PREFLIGHT,
  }),
];

// #4469 slice 3c part 3b: Sauron's CRWV wheel states its conviction, and the wheel has a $100,000
// allocation with $75,000 budgeted. Built by the server's own view, so the sentence is the real one.
views.conviction = withCounts(
  playbookStoreView(
    [
      subscription("CRWV-WHEEL", {
        mode: "aggressive",
        capitalAllocated: 75_000,
        conviction: {
          reason: "Premium is cheap, but I want the shares at this strike.",
          checkOn: "2027-01-29",
        },
      }),
    ],
    false,
    [],
    false,
    undefined,
    undefined,
    { wheel: { capitalAllocated: 100_000 } },
  ),
  { ...COUNTS, "CRWV-WHEEL": 1 },
);
const openConviction = async (page) => {
  await inCard(page, "The wheel").getByRole("button", { name: "Set a new date" }).click();
  await toStrategy("The wheel")(page);
};
groups.conviction = [
  strategyFrame("phone-1-conviction-and-allocation", {
    view: views.conviction,
    path: undefined,
    act: toStrategy("The wheel"),
  }),
  strategyFrame("phone-2-set-a-new-date", {
    view: views.conviction,
    path: undefined,
    act: openConviction,
  }),
];

// #5482 slice 5: the steered pairs' scorecard. The real view carries the record's own scorecard (the
// server builds it); the fixture frame rewrites three claims as decided to show the other states.
const scoredFixture = (view) => ({
  ...view,
  strategies: view.strategies.map((card) => ({
    ...card,
    pairs: card.pairs.map((pair) => {
      if (!pair.steeredBy) return pair;
      const decide = {
        7: {
          outcome: "pass",
          scoredOn: "2027-01-21",
          basis: "CRWV's lowest close was $52.10 on 2026-12-18, inside $41.00 to $60.90.",
        },
        8: {
          outcome: "fail",
          scoredOn: "2027-02-03",
          basis: "No CRWV close from 2026-10-16 to 2027-02-01 reached $63.15.",
        },
        "2a": {
          outcome: "pass",
          scoredOn: "2026-11-07",
          basis: "Fixture reading.",
        },
      };
      const claims = pair.steeredBy.claims.map((c) =>
        decide[c.label] ? { ...c, ...decide[c.label] } : c,
      );
      const count = (o) => claims.filter((c) => c.outcome === o).length;
      const scorecard = {
        pass: count("pass"),
        fail: count("fail"),
        pending: count("pending"),
        untestable: count("untestable"),
      };
      return { ...pair, steeredBy: { ...pair.steeredBy, claims, scorecard } };
    }),
  })),
});
const openSteered = async (page) => {
  const card = inCard(page, "The wheel");
  for (const d of await card.locator(".pb-steered").all())
    await d.evaluate((el) => (el.open = true));
  await card.locator(".pb-pair .pb-steered").first().evaluate(underHeader);
};
// The row as a member first meets it: the one line, closed, under the pair's evidence.
const closedSteered = async (page) => {
  const row = inCard(page, "The wheel")
    .locator(".pb-pair")
    .filter({ hasText: "steered by" })
    .first();
  await row.evaluate((el) =>
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 110),
  );
};
groups.scorecard = [
  strategyFrame("phone-1-steered-by-line", {
    view: views.conviction,
    path: undefined,
    act: closedSteered,
  }),
  strategyFrame("phone-2-steered-by-claims", {
    view: views.conviction,
    path: undefined,
    act: openSteered,
  }),
  strategyFrame("phone-3-fixture-decided", {
    view: scoredFixture(views.conviction),
    path: undefined,
    act: openSteered,
  }),
  strategyFrame("desktop-steered-by", {
    view: views.conviction,
    path: undefined,
    viewport: undefined,
    quality: 55,
    act: openSteered,
  }),
];

// #5432: the run-up's NVDA row drawn as one line, its dates counted on the real calendar from the
// study world's Thursday — Nov 18 est., so buy Oct 21, sell Nov 11.
const STUDY_DAY = "2026-10-08T19:00:00Z";
const toNvdaLine = (page) =>
  page
    .locator(".pbr-window")
    .first()
    .evaluate((el) => {
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 190);
    });
groups.window = [
  {
    tag: "phone-1-nvda-line",
    view: views.catalog,
    expect: "holds NVDA",
    viewport: PHONE,
    path: STORE,
    clockAt: STUDY_DAY,
    act: toNvdaLine,
  },
  {
    tag: "phone-2-nvda-bars",
    view: views.catalog,
    expect: "holds NVDA",
    viewport: PHONE,
    path: STORE,
    clockAt: STUDY_DAY,
    scrollTo: "Average move in each stretch",
  },
  {
    tag: "desktop-nvda-line",
    view: views.catalog,
    expect: "holds NVDA",
    path: STORE,
    clockAt: STUDY_DAY,
    act: toNvdaLine,
    quality: 55,
  },
];

export const strategyGroups = groups;
