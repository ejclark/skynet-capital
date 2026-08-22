import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Visual harness for the /feedback form's Write | Preview tabs: render the real view, type a real
// capsule into the details field, and screenshot both tabs with Chromium — the surface judged by
// eye (CLAUDE.md) without standing up a server or a GitHub token.
// The preview request is fulfilled in-process by the SAME renderer the route uses, so the frame
// shows real output, not a mock. Usage: node scripts/shoot-feedback.mjs [outdir]
import { chromium } from "playwright-core";
import { renderFeedbackFormBody } from "../src/observatory/feedback-view.ts";
import { shellDocument } from "../src/server/page-shell.ts";
import { renderMarkdownPreview } from "../src/ui/markdown-preview.ts";

const OUT = process.argv[2] || join(tmpdir(), "skynet-feedback-shots");
mkdirSync(OUT, { recursive: true });
const EXE = [
  process.env.PW_CHROME,
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
]
  .filter(Boolean)
  .find((p) => existsSync(p));

// A capsule in the house shape (docs/ISSUES.md) — talking points, a table, one fold.
const SAMPLE = `**The leaderboard shows my return as +0.00% while I hold open positions.**

| | |
|---|---|
| **Kind** | 🐞 Bug |
| **Where** | Leaderboard |

- Every row of mine reads +0.00%, sorted or not.
- My desk shows two open spreads, so the number is wrong, not empty.
- Started after Thursday's deploy — it was right on Wednesday.

<details>
<summary>The brief</summary>

**Expected vs. actual** — expected my real return (about +2.4%); saw +0.00%.

**Steps** — sign in, open Leaderboard, sort by Return %.

> it looked fine on wednesday and my phone shows the same thing as my laptop

</details>`;

const page = shellDocument(
  "Feedback — Skynet Capital",
  renderFeedbackFormBody({
    nav: { active: "feedback", canAdd: false, authed: true },
    enabled: true,
    coachEnabled: false,
  }),
);

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const ctx = await browser.newContext({ viewport: { width: 1180, height: 980 } });
const tab = await ctx.newPage();

// The route the Preview button calls — answered by the real renderer, in process.
await tab.route("**/feedback/preview", async (route) => {
  const { markdown } = JSON.parse(route.request().postData() ?? "{}");
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, html: renderMarkdownPreview(markdown ?? "") }),
  });
});

// Served from a real origin (intercepted, never a live server): the page's fetch of a relative
// URL needs a base, which about:blank does not have.
await tab.route("**/feedback", (route) =>
  route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: page }),
);
await tab.goto("http://skynet.local/feedback", { waitUntil: "load" });
await tab.fill("#fdbk-details", SAMPLE);
await tab.fill("#fdbk-title", "Leaderboard shows my return as 0.00%");

const shot = async (name) => {
  const path = join(OUT, `${name}.jpg`);
  await tab.locator(".fdbk-form").screenshot({ path, quality: 78, type: "jpeg" });
  console.log(`· ${path}`);
};

// Fill leaves the caret at the end; the frame should open on the top of the member's draft.
await tab.$eval("#fdbk-details", (el) => {
  el.scrollTop = 0;
});
await shot("feedback-write");
await tab.click("#fdbk-tab-preview");
await tab.waitForSelector("#fdbk-preview table");
await shot("feedback-preview");

await browser.close();
console.log(`✓ shots in ${OUT}`);
