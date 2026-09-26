// The persona crawl — walks every member journey (e2e/journeys/*.journey.json) at phone then
// desktop against the real offline server, and writes the data the redesign's bets rest on:
// a JPEG per step (docs/shots/crawl-<date>/<member>/<journey>-<step>-<viewport>.jpg, ≤100KB), the
// dead-end probes, the contrast/name pass, and two documents — docs/members/friction-ledger.md
// and docs/members/maps.md. Run 0 is the baseline of today; every lift re-runs it, and "fewer dead
// ends per member than run 0" is the falsifier for "did the redesign plug the gap".
//
//   npm run crawl                              # everything, both boots, sequentially
//   npm run crawl -- --members eric,phone-only --viewports phone --date 2026-09-26
//
// Runs under tsx (it imports mint-session.ts). Boots the server itself, twice: once OPEN for the
// anonymous fixtures, once in OAuth mode for the session ones — never both at once. Never sets a
// feedback token, so nothing here can file a real issue. The judge line is NOT a model call: the
// ledger's judge cell reads "pending (grind)" until docs/grind/journey-judge.instructions.md runs.

import { mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";
import { resolveChromium, shooter } from "../shoot/lib.mjs";
import { contrastPass } from "./contrast.mjs";
import { writeLedger } from "./ledger.mjs";
import { locate } from "./locate.mjs";
import { writeMaps } from "./maps.mjs";
import { mintSession } from "./mint-session.ts";
import { linksIntoRedirects, probeDeadEnds, sameOriginLinks } from "./probes.mjs";
import { bootServer, CRAWL_SECRET } from "./server.mjs";
import {
  expectHolds,
  loadJourneys,
  performAct,
  sessionCookie,
  stepRunsAt,
  VIEWPORTS,
  viewportsFor,
} from "./steps.mjs";

const JPEG_CAP = 102_400;
const QUALITIES = [55, 40, 28];

function args(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const list = (v) => (v ? v.split(",").map((s) => s.trim()) : undefined);
  const date = get("--date") ?? new Date().toISOString().slice(0, 10);
  return {
    date,
    members: list(get("--members")),
    viewports: list(get("--viewports")),
    port: Number(get("--port") ?? 8787),
    bridgePort: Number(get("--bridge-port") ?? 8788),
    out: get("--out") ?? `docs/shots/crawl-${date}`,
    ledger: get("--ledger") ?? "docs/members/friction-ledger.md",
    maps: get("--maps") ?? "docs/members/maps.md",
  };
}

/** Take the frame under the cap, dropping quality until it fits (the shooter owns the format). */
async function frame(page, dir, tag) {
  let path;
  for (const quality of QUALITIES) {
    path = await shooter(page, dir, { quality })(tag);
    if (statSync(path).size <= JPEG_CAP) return path;
  }
  console.warn(`crawl: ${path} is over ${JPEG_CAP} bytes at the lowest quality`);
  return path;
}

async function settle(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {
    /* a page with a held-open SSE never idles — the settle below is the fallback */
  });
  await page.waitForTimeout(400);
}

/** One step: expects → frame → probes → contrast → act. Returns the ledger rows it produced. */
async function walkStep({ page, member, journey, step, viewport, dir, redirectCache, tally }) {
  const at = {
    member: member.member,
    journey: `${journey.id} ${journey.name}`,
    step: step.id,
    viewport,
  };
  const row = (r) => ({ ...at, judge: "pending (grind)", ...r });
  const rows = [];
  await page.goto(step.goto, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await settle(page);

  const misses = [];
  for (const e of step.expect ?? []) {
    const r = await expectHolds(page, e);
    if (!r.ok) misses.push(r.detail);
  }
  if (step.known_gap && misses.length > 0) {
    rows.push(
      row({
        kind: "known gap",
        what: `known gap — ${step.known_gap}`,
        where: step.where ?? "—",
        severity: step.severity ?? "high",
        fix: step.fix ?? "?",
      }),
    );
  } else if (step.known_gap) {
    tally.fixed.push([`${member.member}/${journey.id}-${step.id}`, true]);
    rows.push(
      row({
        kind: "fixed?",
        what: `fixed? — known gap passed, remove its known_gap: ${step.known_gap}`,
        where: step.where ?? "—",
        severity: "low",
        fix: "S",
      }),
    );
  } else if (misses.length > 0) {
    rows.push(
      row({
        kind: "NEW",
        what: `NEW — ${misses.join("; ")}`,
        where: step.where ?? "—",
        severity: "high",
        fix: "?",
      }),
    );
  }

  await frame(page, dir, `${journey.id}-${step.id}-${viewport}`);
  tally.frames += 1;

  const probes = await probeDeadEnds(page).catch((err) => {
    console.warn(`crawl: probes failed on ${step.goto}: ${err.message}`);
    return [];
  });
  const redirects = await linksIntoRedirects(page, await sameOriginLinks(page), redirectCache);
  const contrast = await contrastPass(page).catch((err) => {
    console.warn(`crawl: contrast failed on ${step.goto}: ${err.message}`);
    return { available: true, findings: [] };
  });
  tally.contrast = contrast.available;
  for (const f of [...probes, ...redirects, ...contrast.findings]) {
    rows.push(
      row({
        kind: f.kind,
        what: f.what,
        where: locate(f.snippet),
        severity: f.severity,
        fix: f.fix,
      }),
    );
  }

  if (step.act)
    await performAct(page, step.act).catch((err) =>
      console.warn(`crawl: act failed on ${step.goto}: ${err.message}`),
    );
  return rows;
}

async function walkMode(mode, members, opts, tally) {
  const server = await bootServer({ mode, port: opts.port, bridgePort: opts.bridgePort });
  const exe = resolveChromium();
  const browser = await chromium.launch({
    ...(exe ? { executablePath: exe } : {}),
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const redirectCache = new Map();
  const rows = [];
  try {
    for (const member of members) {
      const dir = join(opts.out, member.member);
      mkdirSync(dir, { recursive: true });
      for (const journey of member.journeys) {
        for (const viewport of viewportsFor(member, journey)) {
          if (opts.viewports && !opts.viewports.includes(viewport)) continue;
          const context = await browser.newContext({
            ...VIEWPORTS[viewport],
            colorScheme: "dark",
            baseURL: server.origin,
          });
          if (member.fixture.kind === "session") {
            await context.addCookies([
              sessionCookie(mintSession(member.fixture.email, CRAWL_SECRET), server.origin),
            ]);
          }
          const page = await context.newPage();
          for (const step of journey.steps) {
            if (!stepRunsAt(step, viewport)) continue;
            console.log(
              `crawl: ${member.member} ${journey.id}/${step.id} @${viewport} ${step.goto}`,
            );
            tally.steps += 1;
            try {
              rows.push(
                ...(await walkStep({
                  page,
                  member,
                  journey,
                  step,
                  viewport,
                  dir,
                  redirectCache,
                  tally,
                })),
              );
            } catch (err) {
              rows.push({
                member: member.member,
                journey: `${journey.id} ${journey.name}`,
                step: step.id,
                viewport,
                kind: "NEW",
                what: `NEW — the step could not run: ${err.message.split("\n")[0]}`,
                where: "—",
                severity: "high",
                fix: "?",
                judge: "pending (grind)",
              });
            }
          }
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
  return rows;
}

async function main() {
  const opts = args(process.argv.slice(2));
  const all = loadJourneys().filter((m) => !opts.members || opts.members.includes(m.member));
  if (all.length === 0) throw new Error("crawl: no journey files matched");
  const tally = { steps: 0, frames: 0, contrast: false, fixed: [] };
  const rows = [];
  for (const mode of ["open", "session"]) {
    const members = all.filter((m) => (m.fixture.kind === "session") === (mode === "session"));
    if (members.length === 0) continue;
    console.log(`crawl: booting the ${mode} server for ${members.map((m) => m.member).join(", ")}`);
    rows.push(...(await walkMode(mode, members, opts, tally)));
  }
  const run = {
    date: opts.date,
    rows,
    steps: tally.steps,
    frames: tally.frames,
    contrast: tally.contrast,
    members: all.map((m) => m.member),
    fixed: tally.fixed,
  };
  const { rows: folded, found, missing } = writeLedger(opts.ledger, run);
  writeMaps(opts.maps, all, run);
  console.log(
    `crawl: ${folded.length} findings over ${tally.steps} steps, ${tally.frames} frames → ${opts.ledger}, ${opts.maps}`,
  );
  console.log(
    `crawl: dead ends found ${found.join(", ") || "none"}${missing.length ? ` — MISSING ${missing.join(", ")} (fix the probe, not the ledger)` : " — all eight"}`,
  );
  if (tally.fixed.length)
    console.log(
      `crawl: ${tally.fixed.length} known gap(s) passed — remove their known_gap lines: ${tally.fixed.map(([k]) => k).join(", ")}`,
    );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
