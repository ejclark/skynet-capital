// Visual harness for "Your convictions" on R&D → Playbooks (#5482 slice 6b) from the REAL built shell
// over stub APIs. Phone frame first (docs/PICTURES.md → mobile-first), then desktop.
//
// Every conviction answer is built by the server's own code, never hand-written: the steerable pairs
// from the pair table and the playbooks' bounds, the preview from `draftConviction` over the very
// draft the frame types, a refusal from the same judge. So a frame cannot show a card, a setting or
// a sentence the server would not send (the `heartbeat-roll-call.mjs` rule).
//
// Frames: the door and a saved draft · the form open · filled · the preview card (before → after,
// SIM) · a refusal placed under its pair · the door closed with no ◆ pair · the form wide · the
// hand-over ask, naming what it takes over from the seeded view (slice 6c) · a view steering.
// `ONLY=phone-7,phone-8` shoots just the frames whose tag starts with one of those.
// JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npx tsx scripts/shoot/convictions.mjs [outdir]

import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.ts";
import { convictionCard, draftConviction } from "../../src/playbooks/conviction-draft.ts";
import { CONVICTIONS, playbookBounds } from "../../src/playbooks/conviction-store.ts";
import { findPair, pairName } from "../../src/playbooks/pair-table.ts";
import { pointedPairs, takesOver } from "../../src/server/conviction-hand-over.ts";
import {
  DRAFT_NOTE,
  MINE_NOTE,
  STEERING_NOTE,
} from "../../src/server/member-convictions-api-routes.ts";
import { performance } from "./playbook-store-fixture.mjs";
import { openShell } from "./shell.mjs";

const SAURON = { id: "sauron", name: "Sauron", kind: "bot", hostConfigured: true, profile: null };
const settings = {
  authConfigured: true,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [SAURON],
};

const TODAY = "2026-10-19";
const steerableOf = (ids) =>
  ids.map((id) => {
    const pair = findPair(id);
    return { pair: id, name: pairName(pair), strategy: pair.strategy, bounds: playbookBounds(id) };
  });
const STEERABLE = steerableOf(["CRWV-LONG-CALL", "CRWV-WHEEL"]);
const context = {
  owner: "Eric",
  statedOn: TODAY,
  takenIds: new Set(),
  subscribed: new Set(STEERABLE.map((p) => p.pair)),
};

// What the frame types, as the form sends it.
const CLAIM = {
  tag: "underrated",
  statement: "CRWV's backlog outlasts the selloff: the floor holds near $55.",
  bucket: "forward",
  evidence: "The 2026-10-16 premium-fit re-run: implied vol at the 63rd percentile.",
  falsifier: "CRWV closes under $50.",
  scoreBy: "2026-12-18",
};
const DRAFT = {
  title: "CRWV floor holds",
  checkOn: "2027-02-26",
  claims: [CLAIM],
  steers: ["CRWV-WHEEL"],
  narrowings: [
    {
      pair: "CRWV-WHEEL",
      fromClaims: [],
      narrow: [
        { kind: "strike-ceiling", ceiling: 55 },
        { kind: "contracts", max: 1 },
      ],
    },
  ],
};
const drafted = draftConviction(DRAFT, context);
if (!drafted.ok) throw new Error(`the frame's draft is refused: ${drafted.problems.join("; ")}`);
const preview = { ...drafted, label: "SIM", saved: false, note: DRAFT_NOTE };
const wide = draftConviction(
  {
    ...DRAFT,
    narrowings: [{ pair: "CRWV-WHEEL", fromClaims: [], narrow: [{ kind: "dte", max: 90 }] }],
  },
  context,
);
if (wide.ok) throw new Error("a widening the frame shows refused was accepted");
const refused = { ok: false, label: "SIM", problems: wide.problems };

const SAVED_VIEW = {
  status: "draft",
  conviction: drafted.conviction,
  createdAt: `${TODAY}T15:00:00.000Z`,
  updatedAt: `${TODAY}T15:00:00.000Z`,
  card: convictionCard(drafted.conviction),
};
const mine = (convictions, steerable = STEERABLE) => ({
  label: "SIM",
  note: MINE_NOTE,
  convictions,
  steerable,
});

// Slice 6c: Sauron's wheel points at the seeded AI-dip view, so handing this one over takes over
// from it; once handed over, the wheel points here. Both read by the server's own functions.
const id = drafted.conviction.id;
const subsBefore = {
  sauron: [{ playbookId: "CRWV-WHEEL", convictionId: "ai-dip-2026-10" }],
};
const subsAfter = { sauron: [{ playbookId: "CRWV-WHEEL", convictionId: id }] };
const ASKING_VIEW = {
  ...SAVED_VIEW,
  takesOver: takesOver(drafted.conviction, ["sauron"], subsBefore, CONVICTIONS),
};
const steering = pointedPairs(id, ["sauron"], subsAfter);
const STEERING_VIEW = { ...SAVED_VIEW, status: "steering", accounts: ["sauron"], steering };

const PHONE = { width: 390, height: 844 };
const underHeader = (el) =>
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 150);

async function frame({ tag, listed = [SAVED_VIEW], steerable, draft = preview, act, ...shell }) {
  const { page, origin, shoot, close } = await openShell({
    name: "convictions",
    ...shell,
    stubs: {
      "/api/playbook-store": playbookStoreView([]),
      "/api/settings": settings,
      "/api/outpost/performance": performance,
      "/api/authored-plays": { plays: [] },
      "/api/convictions/mine": mine(listed, steerable),
      "/api/convictions/draft": draft,
      "/api/convictions/save": { ...preview, saved: true },
      "/api/convictions/hand-over": { ok: true, label: "SIM", steering, note: STEERING_NOTE },
    },
  });
  await page.clock.setFixedTime(new Date(`${TODAY}T15:00:00Z`));
  await page.goto(`${origin}/app/research?section=playbooks`);
  await page.getByRole("heading", { name: /Your convictions/ }).waitFor();
  if (act) await act(page);
  else await page.locator(".cvf-section").evaluate(underHeader);
  await shoot(tag);
  await close();
}

const openForm = async (page) => {
  await page.getByRole("button", { name: "State a conviction" }).click();
  await page.getByRole("form", { name: "New conviction" }).waitFor();
};
const fill = async (page) => {
  await page.getByLabel("The view, in a few words").fill(DRAFT.title);
  await page.getByLabel("The claim").fill(CLAIM.statement);
  await page.getByLabel("What it rests on").fill(CLAIM.evidence);
  await page.getByLabel("Wrong if").fill(CLAIM.falsifier);
  await page.getByLabel("By", { exact: true }).fill(CLAIM.scoreBy);
  await page.getByRole("checkbox", { name: "the wheel on CRWV" }).check({ force: true });
  await page.getByLabel("Strike at or under, $").fill("55");
  await page.getByLabel("Contracts, at most").fill("1");
  await page.getByLabel("Checked on").fill(DRAFT.checkOn);
};
const to = (selector) => (page) => page.locator(selector).first().evaluate(underHeader);
const previewIt = async (page) => {
  await page.getByRole("button", { name: "Preview what it changes" }).click();
};

const frames = [
  { tag: "phone-1-your-convictions", viewport: PHONE },
  {
    tag: "phone-2-form",
    viewport: PHONE,
    act: async (page) => {
      await openForm(page);
      await to(".cvf")(page);
    },
  },
  {
    tag: "phone-3-filled",
    viewport: PHONE,
    act: async (page) => {
      await openForm(page);
      await fill(page);
      await to(".cvf-steers")(page);
    },
  },
  {
    tag: "phone-4-preview",
    viewport: PHONE,
    act: async (page) => {
      await openForm(page);
      await fill(page);
      await previewIt(page);
      await page.getByRole("button", { name: "Save draft" }).waitFor();
      await to(".cvf-card")(page);
    },
  },
  {
    tag: "phone-5-refused",
    viewport: PHONE,
    draft: refused,
    act: async (page) => {
      await openForm(page);
      await fill(page);
      await previewIt(page);
      await page.locator(".cvf-pair .cvf-problems").waitFor();
      await to(".cvf-pair")(page);
    },
  },
  { tag: "phone-6-no-pair", viewport: PHONE, listed: [], steerable: [] },
  {
    tag: "desktop-1-preview",
    quality: 60,
    act: async (page) => {
      await openForm(page);
      await fill(page);
      await previewIt(page);
      await page.getByRole("button", { name: "Save draft" }).waitFor();
      await to(".cvf-steers")(page);
    },
  },
  {
    tag: "phone-7-hand-over-ask",
    viewport: PHONE,
    listed: [ASKING_VIEW],
    act: async (page) => {
      await page.getByRole("button", { name: "Hand to my bots" }).click();
      await to(".cvf-section")(page);
    },
  },
  { tag: "phone-8-steering", viewport: PHONE, listed: [STEERING_VIEW] },
];

const only = process.env.ONLY?.split(",").filter(Boolean);
for (const spec of frames) {
  if (!only || only.some((prefix) => spec.tag.startsWith(prefix))) await frame(spec);
}
