import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Visual harness for the owner ops-status panel (#666 slice 1) — rendered offline from a fixed
// `OpsStatus` (no server, no credentials) at a phone-first viewport, since "glanceable from a
// phone" is the whole point of the surface.
// Usage: npm run shoot:ops-status [-- outdir]
import { chromium } from "playwright-core";
import { renderShell } from "../src/observatory/dashboard-shell.ts";
import { renderOpsStatusBody } from "../src/observatory/ops-status-view.ts";
import { shellDocument } from "../src/server/page-shell.ts";

const OUT = process.argv[2] || join(tmpdir(), "skynet-ops-status-shots");
mkdirSync(OUT, { recursive: true });
const CANDIDATES = [
  process.env.PW_CHROME,
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);
const EXE = CANDIDATES.find((p) => existsSync(p));

const nav = { active: "board", canAdd: true, authed: true, canOpsStatus: true };
const AT = "2026-08-28T14:32:00.000Z";

const HEALTHY = {
  generatedAt: AT,
  degraded: false,
  signals: [
    {
      id: "deploy-app",
      label: "App deploy",
      verdict: "ok",
      detail: "main (dc2ddd2) is the deployed commit.",
    },
    {
      id: "deploy-bots",
      label: "Bots deploy",
      verdict: "ok",
      detail: "Bots app is current — nothing bot-relevant merged since its last deploy.",
    },
    {
      id: "bridge",
      label: "Controls bridge",
      verdict: "ok",
      detail:
        "Bots process polled Mission Control 12s ago — armed, suspend toggles reach it within ~30s.",
    },
    { id: "activity", label: "Bot activity", verdict: "ok", detail: "Last bot order 2h ago." },
  ],
};

const ATTENTION = {
  generatedAt: AT,
  degraded: false,
  signals: [
    {
      id: "deploy-app",
      label: "App deploy",
      verdict: "ok",
      detail: "main (dc2ddd2) is the deployed commit.",
    },
    {
      id: "deploy-bots",
      label: "Bots deploy",
      verdict: "attention",
      detail:
        "Bots app is STALE — 2 bot-relevant path(s), e.g. src/bots/runner.ts since its last deploy. Recover via Pipeline → Run workflow → force_bots_deploy.",
      link: {
        href: "https://github.com/ejclark/skynet-capital/actions/workflows/pipeline.yml",
        label: "Open Actions",
      },
    },
    {
      id: "bridge",
      label: "Controls bridge",
      verdict: "attention",
      detail:
        "No poll from the bots process in 240s (expected every ~30s) — it may be down, restarting, or unreachable.",
      link: {
        href: "https://github.com/ejclark/skynet-capital/actions/workflows/pipeline.yml",
        label: "Open Actions",
      },
    },
    {
      id: "activity",
      label: "Bot activity",
      verdict: "unknown",
      detail:
        "No bot order in 2d — could be a quiet market or a weekend, not necessarily a problem. Cross-check the controls bridge signal above.",
    },
  ],
};

const DEGRADED = {
  generatedAt: AT,
  degraded: true,
  signals: [
    {
      id: "deploy-app",
      label: "App deploy",
      verdict: "unknown",
      detail:
        "No GitHub token configured for this app (SKYNET_FEEDBACK_GITHUB_TOKEN) — deploy lag isn't computed here. Check Actions directly.",
      link: {
        href: "https://github.com/ejclark/skynet-capital/actions/workflows/pipeline.yml",
        label: "Open Actions",
      },
    },
    {
      id: "deploy-bots",
      label: "Bots deploy",
      verdict: "unknown",
      detail:
        "No GitHub token configured for this app (SKYNET_FEEDBACK_GITHUB_TOKEN) — deploy lag isn't computed here. Check Actions directly.",
      link: {
        href: "https://github.com/ejclark/skynet-capital/actions/workflows/pipeline.yml",
        label: "Open Actions",
      },
    },
    {
      id: "bridge",
      label: "Controls bridge",
      verdict: "ok",
      detail:
        "Bots process polled Mission Control 8s ago — armed, suspend toggles reach it within ~30s.",
    },
    { id: "activity", label: "Bot activity", verdict: "ok", detail: "Last bot order 40m ago." },
  ],
};

const pages = [
  { name: "ops-status-healthy", status: HEALTHY },
  { name: "ops-status-attention", status: ATTENTION },
  { name: "ops-status-degraded", status: DEGRADED },
];

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
// Phone-first: the panel's own framing ("glanceable from a phone") is the thing to judge.
const page = await browser.newPage({
  viewport: { width: 420, height: 900 },
  reducedMotion: "reduce",
});
for (const { name, status } of pages) {
  const body = renderShell(nav, renderOpsStatusBody(status), status.generatedAt);
  const file = join(OUT, `${name}.html`);
  writeFileSync(file, shellDocument(`${name} — shoot`, body));
  await page.goto(`file://${file}`);
  // Collapse the drawer, same as a returning phone visitor whose last toggle stuck (the app
  // remembers it via localStorage) — the panel content, not the app-wide nav, is what this shoot
  // is judging. Reload so the collapsed state applies from first paint, same as the real page.
  await page.evaluate(() => localStorage.setItem("obs-drawer", "closed"));
  await page.reload();
  // JPEG at this quality — the ceiling every shoot script here carries so a screenshot committed
  // to `docs/shots/pr-<n>/` stays under the ship gate's 100KB cap (docs/PICTURES.md).
  const out = join(OUT, `${name}.jpg`);
  await page.screenshot({ path: out, fullPage: true, type: "jpeg", quality: 80 });
  console.log(`shot ${out}`);
}
await browser.close();
