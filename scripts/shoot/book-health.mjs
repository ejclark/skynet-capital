// Visual harness for the book's health (#5493) — the head line (slice 2) and the Balance section
// it opens (slice 3). PHONE FIRST (docs/PICTURES.md): the 390px frames come first and prove the
// curation; the 1280 frames prove the same section expanded instead of floating.
//
// The page is the Profile shoot's own fixture (`accounts-fixture.mjs`) with a `health` field added
// to each desk, in the shape `src/server/book-health-payload.ts` serves: the owner's copy carries
// the findings and each play's numbers beside the counts by level and detector.
//
// Frames, slice 2 — the head line: `head-bot-*` (the bot: 1 gate, 2 signals), `head-human-*` (the
// human: one idle signal), `u-bot-phone` (the any-account page's head), each clipped to the head.
// Frames, slice 3 — the Balance section: `balance-bot-phone` (the first screen: the head, then the
// findings, gate first), `balance-bot-phone-full` (the whole section: findings, plays by idle
// share, the closed trades moved here from R&D → Playbooks), `balance-bot-desktop`, and
// `balance-human-phone` (a book with no plays: one idle finding, then the closed trades).
// JPEG ≤100KB.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/book-health.mjs [outdir]  (pr-5493: the plan)

import { resolve } from "node:path";
import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const stubs = await accountsFixture();

/** A desk stub with the book's health riding beside it, as `/api/desk/:id` serves it. */
const withHealth = (stub, health) => (path) => ({
  ...(typeof stub === "function" ? stub(path) : stub),
  health,
});

/** The server lists gates before signals (`bookHealthView`'s `ordered`). */
const gateFirst = (list) => [
  ...list.filter((f) => f.level === "gate"),
  ...list.filter((f) => f.level === "signal"),
];

// Sauron: CRWV over 40% of equity (a gate), the long call refused every cycle for the account's
// options level (looping), and cash above the idle line — the shapes slice 1's detectors produce —
// plus slice 4's imbalance against a play's target: the long call has nothing deployed against a 70%
// target (the stronger level), the wheel 62% against its 70% (8 points under, a signal).
const sauronHealth = {
  available: true,
  counts: {
    gate: 2,
    signal: 3,
    byDetector: { concentrated: 1, looping: 1, idle: 1, imbalanced: 2 },
  },
  equity: 98_240,
  uncommittedCash: 60_200,
  idleShare: 0.613,
  findings: gateFirst([
    {
      detector: "concentrated",
      level: "gate",
      symbol: "CRWV",
      reading: 0.46,
      threshold: 0.4,
      words:
        "CRWV is 46% of this account's equity, counting its shares, its contracts and the cash held to secure puts sold on it — over the 40% line.",
    },
    {
      detector: "looping",
      level: "signal",
      playbookId: "CRWV-LONG-CALL",
      reading: 6,
      threshold: 6,
      loop: "options-level",
      words:
        "The long call on CRWV asked to trade on 6 checks in its last session and was refused every time: the account's options level is too low.",
    },
    {
      detector: "idle",
      level: "signal",
      reading: 0.613,
      threshold: 0.6,
      words:
        "61% of this account's equity is cash nothing has claimed: no position holds it and no sold put has it set aside.",
    },
    {
      detector: "imbalanced",
      level: "gate",
      playbookId: "CRWV-LONG-CALL",
      reading: 0,
      threshold: 0.6,
      band: { target: 0.7, direction: "under", drift: -0.7, signal: 0.05, gate: 0.1 },
      words:
        "The long call on CRWV has 0% of its $20,000 budget deployed against a 70% target: 70 points under, past its gate at 10. That is the stronger level; nothing is blocked yet.",
    },
    {
      detector: "imbalanced",
      level: "signal",
      playbookId: "CRWV-WHEEL",
      reading: 0.6203,
      threshold: 0.65,
      band: { target: 0.7, direction: "under", drift: -0.0797, signal: 0.05, gate: 0.1 },
      words:
        "The wheel on CRWV has 62% of its $50,000 budget deployed against a 70% target: 8 points under, past its signal at 5. A heads-up; capital keeps flowing.",
    },
  ]),
  plays: [
    {
      playbookId: "CRWV-WHEEL",
      mode: "standard",
      enabled: true,
      allocation: 50_000,
      committed: 31_200,
      idle: 18_800,
      openPositions: 2,
      oldestOpenSessions: 3,
      lastEntryAt: "2026-10-14T15:00:00.000Z",
      // 62% of its budget deployed against the default 70% target: 8 points under, a signal.
      target: {
        share: 0.6203,
        target: 0.7,
        drift: -0.0797,
        level: "signal",
        signal: 0.05,
        gate: 0.1,
      },
      refusalsLastSession: {},
    },
    {
      playbookId: "CRWV-LONG-CALL",
      mode: "standard",
      enabled: true,
      allocation: 20_000,
      committed: 0,
      idle: 20_000,
      // Nothing deployed (every entry refused) against a 70% target: the stronger level.
      target: { share: 0, target: 0.7, drift: -0.7, level: "gate", signal: 0.05, gate: 0.1 },
      openPositions: 0,
      refusalsLastSession: { "options-level": 6 },
    },
    {
      playbookId: "NVDA-CALL-SPREAD",
      mode: "conservative",
      enabled: false,
      openPositions: 0,
      refusalsLastSession: {},
    },
  ],
};
// Eric: 81% of the book is cash, over the idle line (60%) — one signal, no playbook behind it.
const ericHealth = {
  available: true,
  counts: { gate: 0, signal: 1, byDetector: { idle: 1 } },
  equity: 1_047_832,
  uncommittedCash: 848_700,
  idleShare: 0.81,
  findings: [
    {
      detector: "idle",
      level: "signal",
      reading: 0.81,
      threshold: 0.6,
      words:
        "81% of this account's equity is cash nothing has claimed: no position holds it and no sold put has it set aside.",
    },
  ],
  plays: [],
};

// Slice 5 — how long each finding has stood and which way it is going, in the served shape
// (`standing` on each finding: `src/observatory/book-health-history.ts`).
const DAY = 86_400_000;
const standing = (trend, days) => ({
  since: new Date(Date.parse("2026-10-17T12:00:00Z") - days * DAY).toISOString(),
  standingMs: days * DAY,
  trend,
});
const trends = {
  concentrated: standing("worse", 3),
  idle: standing("new", 0),
  "looping|CRWV-LONG-CALL": standing("steady", 5),
  "imbalanced|CRWV-LONG-CALL": standing("steady", 6),
  "imbalanced|CRWV-WHEEL": standing("better", 2),
};
for (const health of [sauronHealth, ericHealth]) {
  health.findings = health.findings.map((f) => ({
    ...f,
    standing: trends[`${f.detector}|${f.playbookId}`] ?? trends[f.detector] ?? standing("worse", 4),
  }));
}

stubs["/api/desk/bot-sauron"] = withHealth(stubs["/api/desk/bot-sauron"], sauronHealth);
stubs["/api/desk/human-eric"] = withHealth(stubs["/api/desk/human-eric"], ericHealth);

/** Who started the bots' closed trades (#4450) — the scoreboard that moved here from R&D → Playbooks. */
const row = (initiator, trades, wins, netRealized) => ({
  initiator,
  trades,
  wins,
  losses: trades - wins,
  winRate: trades ? (wins / trades) * 100 : null,
  netRealized,
});
stubs["/api/outpost/performance"] = {
  house: [],
  mine: [
    { playbookId: "CRWV-WHEEL", trades: 4, wins: 3, losses: 1, winRate: 75, netRealized: 412.5 },
  ],
  accounts: ["bot-sauron"],
  byInitiator: {
    house: {
      rows: [
        row("playbook", 9, 5, 140.5),
        row("forced", 31, 12, -212.4),
        row("persona", 18, 9, 61.2),
      ],
      untraced: 3,
    },
    mine: {
      rows: [row("playbook", 4, 3, 412.5), row("forced", 0, 0, 0), row("persona", 0, 0, 0)],
      untraced: 0,
    },
  },
};

const out = resolve(process.argv[2] ?? "docs/shots/pr-5493");
const { page, origin, close } = await openShell({ name: "book-health", stubs, out });

async function shootHead(selector, tag) {
  const head = page.locator(selector).first();
  await head.waitFor();
  await page.locator(".bh-line").first().waitFor();
  const path = resolve(out, `${tag}.jpg`);
  // The head's box with a margin round it, so a line at the box's right edge is shown whole.
  const box = await head.boundingBox();
  const width = page.viewportSize().width;
  const x = Math.max(0, box.x - 8);
  const clip = { x, y: Math.max(0, box.y - 8), width: Math.min(width - x, box.width + 16) };
  await page.screenshot({
    path,
    type: "jpeg",
    quality: 70,
    clip: { ...clip, height: box.height + 16 },
  });
  console.log(`shot ${path}`);
}

for (const [tag, viewport] of [
  ["phone", { width: 390, height: 844 }],
  ["desktop", { width: 1280, height: 900 }],
]) {
  await page.setViewportSize(viewport);
  await page.goto(`${origin}/app/accounts?account=bot-sauron`);
  await shootHead(".cockpit-head", `head-bot-${tag}`);
  await page.goto(`${origin}/app/accounts?account=human-eric`);
  await shootHead(".cockpit-head", `head-human-${tag}`);
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/u/bot-sauron`);
await shootHead(".acct-head", "u-bot-phone");

// Slice 3 — the Balance section, at the address the head line's counts open.
async function shootPage(tag, { fullPage = false, quality = 62, only } = {}) {
  const path = resolve(out, `${tag}.jpg`);
  // `only` cuts a full-page frame at one element's right and bottom edge (the wide frame leaves
  // the league rail out), keeping everything above and to its left, the head included.
  const box = only ? await page.locator(only).first().boundingBox() : undefined;
  const clip = box
    ? { x: 0, y: 0, width: box.x + box.width + 24, height: box.y + box.height + 12 }
    : {};
  await page.screenshot({ path, type: "jpeg", quality, fullPage, ...(box ? { clip } : {}) });
  console.log(`shot ${path}`);
}
async function openBalance(account) {
  await page.goto(`${origin}/app/accounts?account=${account}&section=balance`);
  await page.locator(".bal-finding, .bal-clear").first().waitFor();
  await page.locator(".bal-closed .pb-initiators").first().waitFor();
}

await page.setViewportSize({ width: 390, height: 844 });
await openBalance("bot-sauron");
await shootPage("balance-bot-phone");
await shootPage("balance-bot-phone-full", { fullPage: true, quality: 48 });
// A human account has no bot in scope, so the server serves no split of its own (`mine: null`).
const perf = stubs["/api/outpost/performance"];
stubs["/api/outpost/performance"] = {
  ...perf,
  mine: [],
  byInitiator: { house: perf.byInitiator.house, mine: null },
};
await openBalance("human-eric");
await shootPage("balance-human-phone", { fullPage: true, quality: 55 });
await page.setViewportSize({ width: 1280, height: 900 });
stubs["/api/outpost/performance"] = perf;
await openBalance("bot-sauron");
await shootPage("balance-bot-desktop", { fullPage: true, quality: 38, only: ".bal" });

await close();
