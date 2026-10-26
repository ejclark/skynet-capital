// The authoring groups of the R&D → Playbooks shoot (`playbook-store.mjs`, #3623), moved out of it
// unchanged so that harness stays under the code-line cap: `author` (#5457 slice 1), `shadow` (slice 2)
// and `promote` (slice 3) — a draft, its shadow test and its promotion, on one screen.

import { AuthoredShadowRunner } from "../../src/autonomous/authored-shadow-runner.ts";
import { emptyForm, specFromForm } from "../../src/playbooks/authored-play-form.ts";
import { viewOf } from "../../src/server/authored-plays-api-routes.ts";
import { withForecasts } from "../../src/server/pair-forecast.ts";
import {
  JOE,
  PHONE,
  STORE,
  settings,
  TODAY,
  twoBots,
  underHeader,
  views,
} from "./playbook-store-world.mjs";

const groups = {};

// #5457 slice 1 — "Your playbooks" and the authoring form. The draft rows are the server's own
// `viewOf` over a record `specFromForm` made, and every refusal on a frame is the form's own
// sentence, so a frame cannot show a number or a reason the save would not send.
const DRAFT_FORM = {
  ...emptyForm("sauron"),
  name: "My NVDA run-up",
  symbol: "NVDA",
  thesis: "Long the drift into the print, out before the dead final week.",
};
const draftView = (form, at = "2026-10-16T15:00:00.000Z") => {
  const made = specFromForm(form, "Eric");
  if (!made.ok) throw new Error(`fixture form refused: ${JSON.stringify(made.refusals)}`);
  return viewOf({
    id: `U-${made.spec.authorAccountId}-${made.spec.slug}`,
    name: form.name,
    status: "draft",
    spec: made.spec,
    createdAt: at,
    updatedAt: at,
  });
};
const DRAFTS = [
  draftView(DRAFT_FORM),
  draftView({
    ...emptyForm("banker", "event-window"),
    name: "News pop",
    symbol: "DJT",
    thesis: "A named headline moves it for about an hour, then it gives it back.",
  }),
];
views.author = {
  ...views.fresh,
  strategies: withForecasts(views.fresh.strategies, TODAY),
};
// A frame waits for the drafts' read before it acts, so the count in the heading is never a race.
const authorFrame = (tag, { act, ...over } = {}, drafts = DRAFTS) => ({
  tag,
  view: views.author,
  expect: "Create scenarios, develop strategies, track results.",
  path: STORE,
  clockAt: TODAY,
  extraStubs: {
    "/api/settings": twoBots,
    "/api/authored-plays": { plays: drafts },
    "/api/authored-plays/save": { ok: true, play: DRAFTS[0] },
  },
  act: async (page) => {
    if (drafts.length > 0) await page.locator(".pba-row").first().waitFor();
    if (act) await act(page);
  },
  ...over,
});
const openForm = async (page) => {
  await page.getByRole("button", { name: /New playbook/ }).click();
  await page.getByRole("form", { name: "New playbook" }).waitFor();
};
const fillForm = async (page) => {
  await page.getByLabel("Ticker", { exact: true }).fill("NVDA");
  await page.getByLabel("Name", { exact: true }).fill("My NVDA run-up");
  await page
    .getByLabel("Why it should work")
    .fill("Long the drift into the print, out before the dead final week.");
};
const toForm = (page) => page.locator(".pba-form").evaluate(underHeader);
groups.author = [
  authorFrame("phone-1-your-playbooks", { viewport: PHONE }),
  authorFrame("phone-2-form", {
    viewport: PHONE,
    act: async (page) => {
      await openForm(page);
      await toForm(page);
    },
  }),
  authorFrame("phone-3-filled", {
    viewport: PHONE,
    act: async (page) => {
      await openForm(page);
      await fillForm(page);
      await page.locator(".pba-size").evaluate(underHeader);
    },
  }),
  authorFrame("phone-4-refused", {
    viewport: PHONE,
    act: async (page) => {
      await openForm(page);
      await fillForm(page);
      const days = page.getByLabel("Buy this many days before the report");
      await days.fill("90");
      await page.getByLabel("Aggressive", { exact: true }).fill("5");
      await page.getByRole("button", { name: "Save draft" }).click();
      await page.getByText(/past the 60 this strategy allows/).waitFor();
      await toForm(page);
    },
  }),
  authorFrame(
    "phone-5-no-bot",
    {
      viewport: PHONE,
      extraStubs: { "/api/settings": { ...settings, accounts: [JOE] } },
    },
    [],
  ),
  authorFrame("desktop-1-form", { quality: 60, act: openForm }),
  authorFrame("desktop-2-drafts", { quality: 60 }),
];

// #5457 slice 2 — a draft in its shadow test. The report on each row is what the REAL runner writes:
// `AuthoredShadowRunner` over a few passes at fixture prices (NVDA reports Nov 12 on this calendar),
// then the server's own `viewOf` — so a frame cannot show a count, a trade or a window the bots
// would not report. Only the quotes and the account's equity are fixtures.
const SHADOW_SINCE = "2026-10-20T13:00:00.000Z";
const SHADOW_CALENDAR = [
  {
    symbol: "NVDA",
    date: "2026-11-12",
    status: "confirmed",
    source: "IR: shoot fixture",
  },
];
const shadowReportFor = (spec, id, days, lastFor) => {
  let clock = 0;
  const runner = new AuthoredShadowRunner({
    risk: { maxPositionPct: 0.03 },
    blockedReason: () => null,
    portfolioOf: () => ({ cash: 250_000, positions: [] }),
    calendar: SHADOW_CALENDAR,
    now: () => clock,
  });
  runner.setOrders([{ id, since: SHADOW_SINCE, spec }]);
  for (const [day, last] of days) {
    clock = Date.parse(`${day}T14:35:00Z`);
    runner.runPass({
      asOf: `${day}T14:30:00Z`,
      quotes: {
        [spec.symbols[0]]: {
          symbol: spec.symbols[0],
          bid: last - 0.05,
          ask: last + 0.05,
          last,
          asOf: `${day}T14:30:00Z`,
        },
      },
      momentum: {},
      newsSentiment: {},
    });
  }
  return runner.report(lastFor).plays;
};
const shadowRecord = (form, at) => {
  const made = specFromForm(form, "Eric");
  if (!made.ok) throw new Error(`fixture form refused: ${JSON.stringify(made.refusals)}`);
  return {
    id: `U-${made.spec.authorAccountId}-${made.spec.slug}`,
    name: form.name,
    status: "shadow",
    shadowSince: SHADOW_SINCE,
    spec: made.spec,
    createdAt: at,
    updatedAt: SHADOW_SINCE,
  };
};
const nvdaRecord = shadowRecord(DRAFT_FORM, "2026-10-16T15:00:00.000Z");
const newsRecord = shadowRecord(
  {
    ...emptyForm("banker", "event-window"),
    name: "News pop",
    symbol: "DJT",
    thesis: "A named headline moves it for about an hour, then it gives it back.",
  },
  "2026-10-16T15:00:00.000Z",
);
const shadowFrame = (tag, days, over = {}) => {
  const plays = [
    ...shadowReportFor(nvdaRecord.spec, nvdaRecord.id, days, 1),
    ...shadowReportFor(newsRecord.spec, newsRecord.id, [["2026-10-21", 40]], 1),
  ];
  const report = { kind: "authored-shadow.v1", at: 1, plays };
  return authorFrame(tag, { ...over }, [viewOf(nvdaRecord, report), viewOf(newsRecord, report)]);
};
// Window opens Oct 23 (20 days before Nov 12); the first rows are mid-window, the last a round trip.
const MID_WINDOW = [
  ["2026-10-22", 180],
  ["2026-10-23", 181],
  ["2026-10-26", 184],
];
const ROUND_TRIP = [...MID_WINDOW, ["2026-11-09", 192]];
groups.shadow = [
  authorFrame("phone-6-shadow-offer", { viewport: PHONE }),
  shadowFrame("phone-7-shadow-running", MID_WINDOW, { viewport: PHONE }),
  shadowFrame("phone-8-shadow-round-trip", ROUND_TRIP, { viewport: PHONE }),
  shadowFrame("desktop-3-shadow-running", MID_WINDOW, { quality: 60 }),
];

// #5457 slice 3 — promoting a play that passed. The checks on each row are the server's own
// `promotionVerdict` over what the REAL runner reports (`viewOf`); the pass is 11 session days with
// one closed round trip, the not-yet frame is the same play three days in.
const PASSED = [
  ["2026-10-23", 181],
  ["2026-10-26", 182],
  ["2026-10-27", 183],
  ["2026-10-28", 184],
  ["2026-10-29", 185],
  ["2026-10-30", 186],
  ["2026-11-02", 187],
  ["2026-11-03", 188],
  ["2026-11-04", 189],
  ["2026-11-05", 190],
  ["2026-11-09", 192],
];
const toPromote = (page) => page.locator(".pba-promote").evaluate(underHeader);
const promoteFrame = (tag, days, over = {}, make = (r) => r) => {
  const report = {
    kind: "authored-shadow.v1",
    at: 1,
    plays: shadowReportFor(nvdaRecord.spec, nvdaRecord.id, days, 1),
  };
  return authorFrame(
    tag,
    { ...over },
    [make(nvdaRecord, report)].map((r) => viewOf(r, report, true)),
  );
};
const promotedRecord = (() => {
  const { shadowSince: _ended, ...kept } = nvdaRecord;
  return { ...kept, status: "promoted" };
})();
groups.promote = [
  promoteFrame("phone-9-promote-not-yet", MID_WINDOW, { viewport: PHONE }),
  promoteFrame("phone-10-promote-passed", PASSED, {
    viewport: PHONE,
    act: toPromote,
  }),
  promoteFrame("phone-11-promoted-trading", PASSED, { viewport: PHONE }, () => promotedRecord),
  promoteFrame("desktop-4-promote-passed", PASSED, {
    quality: 60,
    act: toPromote,
  }),
];

export const authoredGroups = groups;
