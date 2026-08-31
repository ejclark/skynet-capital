// Design-system bundle generator (#738 — the Claude Design iteration loop).
//
// Reads the SHIPPED stylesheets (app/src/styles/*.css) and emits two things into an output dir:
//   cards/**  — standalone preview cards (`<!-- @dsCard group="…" -->` first line), the exact
//               bundle /design-sync pushes to a claude.ai/design design-system project
//   canvas.html — the same cards assembled as one browsable page for the Artifact lane
//
// The honesty rule that makes this worth keeping: every card inlines the production CSS
// VERBATIM with real component markup — the design system can never drift from the app,
// because it IS the app. Regenerate after any style change: `node scripts/design-cards.mjs [out]`.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const OUT = process.argv[2] ?? ".tmp-design-cards";
const cssDir = "app/src/styles";
const css = readdirSync(cssDir)
  .filter((f) => f.endsWith(".css"))
  .map((f) => `/* ─── ${f} ─── */\n${readFileSync(join(cssDir, f), "utf8")}`)
  .join("\n");

// Card-only helpers: neutralize fixed/sticky positioning so overlays render in-flow on a card.
const CARD_CSS = `
  body { padding: 20px; }
  .ds-note { font: 11px/1.5 var(--mono); color: var(--muted); margin: 14px 0 0; }
  .ds-static .drawer, .ds-static .kbd-scrim, .ds-static .kbd-help { position: static; width: auto; animation: none; }
  .ds-static .drawer { max-width: 420px; height: auto; border: 1px solid var(--border); border-radius: 12px; }
  .ds-static .kbd-scrim { background: none; display: block; }
  .ds-static .hovercard { position: static; animation: none; margin-top: 8px; }
  .ds-row { display: flex; gap: 14px; flex-wrap: wrap; align-items: flex-start; }
  .ds-swatch { width: 130px; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .ds-swatch i { display: block; height: 52px; }
  .ds-swatch b { display: block; font: 10.5px var(--mono); padding: 6px 8px; font-weight: 400; }
  .stage { animation: none; }
`;

const page = (card) => `<!-- @dsCard group="${card.group}" -->
<!doctype html><html lang="en"${card.theme ? ` data-theme="${card.theme}"` : ""}><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${card.name}</title>
<style>${css}\n${CARD_CSS}</style></head><body>${card.body}</body></html>`;

const chip = (kind) => `<span class="chip chip-${kind}">${kind === "bot" ? "BOT" : "HUMAN"}</span>`;
const swatches = ["bg", "surface", "surface-2", "border", "text", "muted", "accent", "pos", "neg"]
  .map((t) => `<div class="ds-swatch"><i style="background:var(--${t})"></i><b>--${t}</b></div>`)
  .join("");

const cards = [
  {
    file: "foundations/colors.html",
    group: "Foundations",
    name: "Color tokens",
    body: `
    <div class="ds-row">${swatches}</div>
    <p class="ds-note">docs/BRAND.md palette as CSS custom properties — dark is the default; every component reads tokens, never hex.</p>`,
  },
  {
    file: "foundations/colors-light.html",
    group: "Foundations",
    name: "Color tokens — light",
    theme: "light",
    body: `
    <div class="ds-row">${swatches}</div>
    <p class="ds-note">The same tokens under data-theme="light" — one palette definition per theme, zero per-component overrides.</p>`,
  },
  {
    file: "foundations/elevation.html",
    group: "Foundations",
    name: "Elevation ladder",
    body: `
    <div class="ds-row">
      ${["recessed", "base", "raised", "overlay", "sheet"]
        .map(
          (e) => `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;box-shadow:var(--elev-${e});padding:18px 22px;font:12px var(--mono)">--elev-${e}</div>`,
        )
        .join("")}
    </div>
    <p class="ds-note">Five steps toward the eye. Hover lifts exactly one step; the hovercard and the ? map live at overlay; the timeline drawer at sheet.</p>`,
  },
  {
    file: "foundations/motion.html",
    group: "Foundations",
    name: "Motion tokens",
    body: `
    <div class="ds-row">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:16px 20px;font:12px/1.8 var(--mono)">
        --dur-quick: 140ms<br>--dur-spatial: 260ms<br>--ease-spatial: cubic-bezier(.2,.8,.2,1)
      </div>
    </div>
    <p class="ds-note">Two speeds, one easing, five grammars (stage-enter · sheet-enter · fold-open · dot-in · hover lift). prefers-reduced-motion collapses both durations to 0ms at :root — no rule needs its own media query.</p>`,
  },
  {
    file: "foundations/ramp.html",
    group: "Foundations",
    name: "The green ramp",
    body: `
    <ul class="ladder" style="max-width:640px">
      ${[0, 1, 2, 3]
        .map(
          (i) => `
      <li class="rank-row" style="--g:${Math.round(100 - (i / 3) * 100)}%">
        <a class="rank-name" href="#">Desk ${i + 1} ${chip(i < 3 ? "bot" : "human")}</a>
        <span class="rank-bar"><i style="width:${92 - i * 22}%"></i></span>
        <span class="rank-val num">$${(1_006_000 - i * 280_000).toLocaleString()}</span>
      </li>`,
        )
        .join("")}
    </ul>
    <p class="ds-note">Eric's round-3 call: everyone is green — intensity carries the standing. --ramp-hi → --ramp-lo mixed per row via color-mix; no red below breakeven on the ladder (red stays on the blotter, where it's real P/L).</p>`,
  },
  {
    file: "chrome/topbar.html",
    group: "Chrome",
    name: "Topbar",
    body: `
    <header class="topbar" style="position:static">
      <span class="brand"><span class="brand-mark" aria-hidden="true">SC</span>Skynet Capital</span>
      <nav class="topnav"><a class="topnav-link" aria-current="page" href="#">Standings</a><a class="topnav-link" href="#">The Wire</a><a class="topnav-link" href="#">Research</a><a class="topnav-link" href="#">Collections</a><a class="topnav-link" href="#">Milestones</a></nav>
      <div class="topbar-actions">
        <fieldset class="toggle-group"><button type="button" aria-pressed="true"><span class="toggle-text">Comfortable</span></button><button type="button"><span class="toggle-text">Compact</span></button></fieldset>
        <span class="env-pill">SIM</span>
        <span class="status status-live"><span class="status-dot"></span>live · seq 1338</span>
      </div>
    </header>
    <p class="ds-note">App-level navigation dimension (Eric, live review): views ride the topbar; each view brings its own left-rail sub-nav. Underline marks current; the dot alone survives on mobile.</p>`,
  },
  {
    file: "chrome/rail.html",
    group: "Chrome",
    name: "Rail sub-nav",
    body: `
    <nav class="rail" style="position:static;max-width:200px">
      <p class="rail-label">Sauron's desk</p>
      <span class="rail-current" aria-current="page">Active</span>
      <a href="#">Decisions</a><a href="#">Pulse</a><a href="#">Overview</a><a href="#">Performance</a><a href="#">Settings</a>
      <hr><a href="#">← Standings</a>
    </nav>
    <p class="ds-note">The second navigation dimension — per-view sub-nav. In-shell links by router, server views by honest cross-link; current gets surface + accent.</p>`,
  },
  {
    file: "standings/hovercard.html",
    group: "Standings",
    name: "Desk hovercard",
    body: `
    <div class="ds-static" style="max-width:300px">
      <span class="hovercard-wrap"><a class="rank-name" href="#">Sauron ${chip("bot")}</a>
        <div class="hovercard" role="tooltip">
          <p class="hovercard-head"><strong>Sauron</strong> ${chip("bot")}</p>
          <dl class="hovercard-grid">
            <div><dt>Day P/L</dt><dd class="num tone-pos">+$4,092</dd></div>
            <div><dt>Unrealized</dt><dd class="num tone-pos">+$17,898</dd></div>
            <div><dt>Open positions</dt><dd class="num">2</dd></div>
            <div><dt>Cash</dt><dd class="num">$526,830</dd></div>
          </dl>
          <p class="hovercard-foot">Click through for the full desk</p>
        </div>
      </span>
    </div>
    <p class="ds-note">350ms intent delay, 200ms leave grace, opens on keyboard focus, hidden on coarse pointers. Reads the desk page's own query — hovering doubles as a prefetch.</p>`,
  },
  {
    file: "desk/tiles.html",
    group: "Desk",
    name: "Stat tiles",
    body: `
    <div class="desk-tiles">
      <div class="desk-tile"><span class="desk-k">Open positions</span><span class="desk-v num">2</span></div>
      <div class="desk-tile"><span class="desk-k">Invested</span><span class="desk-v num">$51,280</span></div>
      <div class="desk-tile"><span class="desk-k">Day P/L</span><span class="desk-v num tone-pos">+$3,892</span><span class="desk-note">today's move</span></div>
      <div class="desk-tile"><span class="desk-k">Unrealized</span><span class="desk-v num tone-pos">+$17,698</span><span class="desk-note">+34.51% on cost</span></div>
      <div class="desk-tile"><span class="desk-k">Cash</span><span class="desk-v num">$526,830</span><span class="desk-note">dry powder</span></div>
    </div>
    <p class="ds-note">Label-over-value, mono tabular figures, tones only where a sign is real. Hover lifts one elevation step.</p>`,
  },
  {
    file: "desk/filter-views.html",
    group: "Desk",
    name: "Saved views + filter bar",
    body: `
    <nav class="view-tabs" aria-label="Saved views">
      <button type="button" class="view-tab">All positions</button>
      <span class="view-tab-wrap"><button type="button" class="view-tab" aria-current="true">Winners<span class="view-dirty" title="Filter edited — not saved">●</span></button><button type="button" class="view-del" aria-label="Delete view">×</button></span>
      <button type="button" class="view-tab">Options book</button>
      <button type="button" class="view-tab view-add">+ New view</button>
      <button type="button" class="view-save-btn">Save to "Winners"</button>
    </nav>
    <div class="filter-bar">
      <div class="filter-query"><input type="text" value="pl:>0 NVDA" spellcheck="false"></div>
      <button type="button" class="filter-chip">Options only</button>
      <button type="button" class="filter-chip" aria-pressed="true">In profit</button>
      <button type="button" class="filter-chip">Under water</button>
    </div>
    <p class="ds-note">Chips ⇄ query text are ONE model; the URL keeps the query. A saved view is a named query; the unsaved dot appears the moment the live filter drifts (the Projects rule).</p>`,
  },
  {
    file: "desk/blotter.html",
    group: "Desk",
    name: "Blotter",
    body: `
    <div class="blotter-card"><div class="blotter-scroll"><table class="blotter">
      <thead><tr><th class="fold-col"></th><th>Symbol</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Value</th><th class="num">Day P/L</th><th class="num">Total P/L</th></tr></thead>
      <tbody>
        <tr><td class="fold-col"></td><td><button type="button" class="sym sym-link">META</button><span class="sym-sub">common shares</span></td><td class="num">60</td><td class="num">$622.00</td><td class="num">$37,320</td><td class="num tone-pos">+$420</td><td class="num tone-pos">+$13,194</td></tr>
        <tr><td class="fold-col"></td><td><button type="button" class="sym sym-link">NVDA</button><span class="sym-sub">common shares</span></td><td class="num">80</td><td class="num">$174.50</td><td class="num">$13,960</td><td class="num tone-neg">-$88</td><td class="num tone-pos">+$4,504</td></tr>
      </tbody>
    </table></div></div>
    <p class="ds-note">Responsive disclosure: detail columns visible wide, folded behind chevrons narrow. Red/green live here because the P/L is real. The symbol is the door to the fill timeline.</p>`,
  },
  {
    file: "desk/trade-gate.html",
    group: "Desk",
    name: "Pre-trade gate",
    body: `
    <section class="panel gate-panel">
      <h2 class="panel-title">New trade</h2>
      <p class="panel-sub">Paper account · market order · the gate reviews before anything is sent</p>
      <div class="gate">
        <div class="gate-head gate-ready"><span class="gate-icon"></span>All checks passed — ready to submit</div>
        <div class="gate-body">
          <dl class="gate-est">
            <div><dt>Est. price</dt><dd class="num">$174.50</dd></div>
            <div><dt>Est. cost</dt><dd class="num">$1,745.00</dd></div>
            <div><dt>Cash after</dt><dd class="num">$525,085</dd></div>
            <div><dt>Position after</dt><dd class="num">90</dd></div>
          </dl>
          <p class="gate-note">Editing the ticket re-arms this gate, and the desk re-checks the live account at submit — approval never outlives the thing it approved.</p>
        </div>
      </div>
      <button type="button" class="btn btn-primary">Submit order — $1,745.00</button>
    </section>
    <div class="gate" style="max-width:560px;margin-top:14px">
      <div class="gate-head gate-refused"><span class="gate-icon"></span>Refused — the gate explains why</div>
      <div class="gate-body"><p class="gate-row gate-refusal">✕ insufficient cash for this order</p></div>
    </div>
    <p class="ds-note">The merge-box state machine on a ticket: draft → reviewing → reviewed → submitting → done. Refusals are the server's own sentences; the service is the gate.</p>`,
  },
  {
    file: "decisions/run-rows.html",
    group: "Bot's mind",
    name: "Decision run rows",
    body: `
    <ul class="cycles" style="max-width:760px">
      <li class="cycle cycle-halted">
        <button type="button" class="cycle-row" aria-expanded="true"><span class="cycle-glyph"></span><span class="cycle-headline">circuit breaker: daily loss limit reached — no orders this cycle</span><span class="chip chip-human">LIVE</span><span class="cycle-when num">Aug 28, 05:02 PM</span></button>
        <div class="cycle-body"><p class="cycle-guards num">1 intent from the persona → 0 past the guards</p><p class="cycle-halt">⛔ circuit breaker: daily loss limit reached — no orders this cycle</p></div>
      </li>
      <li class="cycle cycle-placed">
        <button type="button" class="cycle-row" aria-expanded="true"><span class="cycle-glyph"></span><span class="cycle-headline">1 placed</span><span class="chip chip-human">LIVE</span><span class="cycle-when num">Aug 28, 04:37 PM</span></button>
        <div class="cycle-body"><p class="cycle-guards num">1 intent from the persona → 1 past the guards</p>
          <ul class="cycle-outcomes"><li class="cycle-outcome"><span class="cycle-action cycle-action-placed">placed</span><span class="cycle-intent num">BUY 25 NVDA</span><span class="chip chip-bot">S2-NVDA</span><span class="num cycle-fill">25 @ $176.42</span><span class="cycle-reason">"momentum confirmed above the 20-day"</span></li></ul>
        </div>
      </li>
      <li class="cycle cycle-quiet">
        <button type="button" class="cycle-row" aria-expanded="false"><span class="cycle-glyph"></span><span class="cycle-headline">no signals fired — watching</span><span class="chip chip-bot">OBSERVE</span><span class="cycle-when num">Aug 28, 04:07 PM</span></button>
      </li>
    </ul>
    <p class="ds-note">The Actions-run template on the audit trail: status glyph at a glance, halted/rejected arrive OPEN, reasons ride verbatim — the persona's own sentence is the record.</p>`,
  },
  {
    file: "pulse/pulse.html",
    group: "Pulse",
    name: "Equity curve + weekly P/L",
    body: `
    <section class="pulse-panel" style="max-width:680px">
      <h2 class="pulse-title">Equity curve</h2>
      <figure class="pulse-curve">
        <svg viewBox="0 0 640 160" role="img" aria-label="Equity curve sample">
          <path class="pulse-area" d="M6,120 L86,104 L166,60 L246,84 L326,110 L406,70 L486,40 L566,52 L634,14 L634,154 L6,154 Z"/>
          <path class="pulse-line" d="M6,120 L86,104 L166,60 L246,84 L326,110 L406,70 L486,40 L566,52 L634,14"/>
        </svg>
        <figcaption class="pulse-rails num"><span>Jul 6</span><span>$502,000 – $592,305</span><span>Aug 19</span></figcaption>
      </figure>
      <div class="pulse-race"><span class="pulse-race-k">The doubling race</span>
        <p class="pulse-race-line">18.0% of the way to 2× — $592,305 against a founding $502,000.</p>
        <div class="pulse-progress"><i style="width:18%"></i></div>
      </div>
    </section>
    <section class="pulse-panel" style="max-width:680px">
      <h2 class="pulse-title">Realized P/L by week</h2>
      <div class="pulse-weeks">
        ${[
          ["Jul 6", "+$520", "pos", 39],
          ["Jul 13", "+$210", "pos", 16],
          ["Jul 20", "-$1,040", "neg", 78],
          ["Jul 27", "-$175", "neg", 13],
          ["Aug 3", "+$900", "pos", 68],
          ["Aug 10", "+$720", "pos", 54],
          ["Aug 17", "+$1,330", "pos", 100],
        ]
          .map(
            ([l, v, t, h]) =>
              `<div class="pulse-week"><div class="pulse-week-track"><div class="pulse-week-up">${t === "pos" ? `<i style="height:${h}%"></i>` : ""}</div><div class="pulse-week-down">${t === "neg" ? `<i style="height:${h}%"></i>` : ""}</div></div><span class="pulse-week-pl num tone-${t}">${v}</span><span class="pulse-week-label num">${l}</span></div>`,
          )
          .join("")}
      </div>
    </section>
    <p class="ds-note">The Insights template: server sends normalized 0..1 geometry + formatted figures, the browser only draws. Every section owns its honest empty state.</p>`,
  },
  {
    file: "wire/feed.html",
    group: "Wire",
    name: "Trade feed",
    body: `
    <section class="wire-panel" style="max-width:620px">
      <h2 class="wire-h">Trading activity</h2>
      <ul class="wire-trades">
        <li class="wire-trade"><span class="wire-side tone-neg">SELL</span><span class="wire-sym">NVDA</span><span class="num wire-qty">200</span><span class="num wire-price">$131.25</span><a class="wire-who" href="#">Sauron</a>${chip("bot")}<span class="wire-recon" title="Recovered after the fact">reconstructed</span><span class="wire-when num">Aug 18, 15:20</span></li>
        <li class="wire-trade"><span class="wire-side tone-pos">BUY</span><span class="wire-sym">EEM</span><span class="num wire-qty">950</span><span class="num wire-price">$42.20</span><a class="wire-who" href="#">Eric</a>${chip("human")}<span class="wire-when num">Jul 23, 18:05</span></li>
      </ul>
    </section>
    <p class="ds-note">The Issues-list treatment on the league's pulse: is:buy/sell/bot/human + bare terms, URL-stateful; reconstructed provenance is labeled, never hidden.</p>`,
  },
  {
    file: "overlays/kbd-map.html",
    group: "Overlays",
    name: "Keyboard map",
    body: `
    <div class="ds-static"><div class="kbd-scrim"><dialog class="kbd-help" open aria-label="Keyboard shortcuts">
      <h2>Keyboard shortcuts</h2>
      <div class="kbd-cols">
        <div><h3>Go to</h3>
          <div class="kbd-row"><span class="kbd-keys"><kbd>g</kbd><kbd>s</kbd></span><span>Standings</span></div>
          <div class="kbd-row"><span class="kbd-keys"><kbd>g</kbd><kbd>w</kbd></span><span>The Wire</span></div>
          <div class="kbd-row"><span class="kbd-keys"><kbd>g</kbd><kbd>t</kbd></span><span>Trade ticket</span></div>
        </div>
        <div><h3>On the page</h3>
          <div class="kbd-row"><span class="kbd-keys"><kbd>/</kbd></span><span>Focus the filter</span></div>
          <div class="kbd-row"><span class="kbd-keys"><kbd>?</kbd></span><span>This map</span></div>
        </div>
      </div>
      <button type="button" class="kbd-close">Close</button>
    </dialog></div></div>
    <p class="ds-note">? IS the docs. Chords never fire while typing; the g prefix expires after a second; Escape always closes.</p>`,
  },
  {
    file: "overlays/timeline-drawer.html",
    group: "Overlays",
    name: "Timeline drawer",
    body: `
    <div class="ds-static"><div class="drawer">
      <div class="drawer-head"><h2>NVDA — fill timeline</h2><button type="button" class="drawer-close">×</button></div>
      <div class="drawer-body"><ul class="tl">
        <li class="tl-event"><span class="tl-side tl-buy">BUY</span><span class="num">80 @ $118.20</span><span class="tl-status">filled</span><span class="tl-when">Jul 24, 14:31</span></li>
        <li class="tl-event"><span class="tl-side tl-sell">SELL</span><span class="num">40 @ $131.25</span><span class="tl-status">filled</span><span class="tl-backfill">backfilled</span><span class="tl-when">Aug 18, 15:20</span></li>
      </ul></div>
    </div></div>
    <p class="ds-note">Right-edge sheet at elevation: sheet, sliding in on --dur-spatial. Backfilled provenance labeled.</p>`,
  },
];

const readme = {
  file: "README.html",
  group: "Brand",
  name: "Skynet Capital Shell",
  body: `
  <h1 style="margin:0 0 6px">Skynet Capital — the shell design system</h1>
  <p style="max-width:60ch;color:var(--muted);font-size:13px;line-height:1.6">Generated from the shipped app (app/src/styles + real component markup) after the GitHub-modeled redesign (#738, PRs 739–758). Every card inlines the production CSS verbatim — edit here, and what changes is exactly what the app wears. Doctrine riding along: tokens only, dark-first, honest empties, red only where P/L is real, motion on two tokens with a single reduced-motion collapse.</p>
  <p class="ds-note">Source of truth: ejclark/skynet-capital · app/src/styles/*.css · issue #738</p>`,
};

// ── emit the cards ─────────────────────────────────────────────────────────
const all = [readme, ...cards];
for (const card of all) {
  const path = join(OUT, "cards", card.file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, page(card));
}

// ── assemble the canvas page (the Artifact lane's one-page view) ───────────
const GROUP_ORDER = [
  "Brand",
  "Foundations",
  "Chrome",
  "Standings",
  "Desk",
  "Bot's mind",
  "Pulse",
  "Wire",
  "Overlays",
];
const ordered = [...all].sort(
  (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group),
);
const groups = [...new Set(ordered.map((c) => c.group))];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const sections = groups
  .map(
    (g) => `
  <section class="dsp-group" id="${slug(g)}">
    <h2 class="dsp-group-h">${g}</h2>
    ${ordered
      .filter((c) => c.group === g)
      .map(
        (c) => `
    <article class="dsp-card">
      <h3 class="dsp-card-h">${c.name}</h3>
      <div class="dsp-card-body${c.theme === "light" ? " dsp-light" : ""}">${c.body}</div>
    </article>`,
      )
      .join("")}
  </section>`,
  )
  .join("");
const canvas = `<title>The Skynet Shell</title>
<style>
${css}
${CARD_CSS.replace("body { padding: 20px; }", "")}
body { background: var(--bg); }
/* the one genuinely-light card re-scopes the light tokens locally (root-level data-theme
   selectors can't reach inside a dark page) — values verbatim from theme.css / BRAND.md */
.dsp-light { --bg:#f7f9fb; --surface:#ffffff; --surface-2:#f0f4f8; --border:#dce3ea; --text:#0b0f14;
  --muted:#5a6b7b; --accent:#0e9f8c; --pos:#1a7f37; --neg:#cf222e; --accent-contrast:#ffffff;
  --ramp-hi:#0b4621; --ramp-lo:#41815a;
  background: var(--bg); color: var(--text); border-radius: 10px; padding: 18px; }
.dsp-wrap { max-width: 1040px; margin: 0 auto; padding: 40px 24px 120px; }
.dsp-head h1 { font-size: 30px; letter-spacing: -0.02em; margin: 0 0 8px; }
.dsp-head p { max-width: 66ch; color: var(--muted); font-size: 13.5px; line-height: 1.65; margin: 0; }
.dsp-meta { display: flex; gap: 8px; flex-wrap: wrap; margin: 14px 0 0; }
.dsp-nav { position: sticky; top: 0; z-index: 5; display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none;
  background: var(--glass); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border);
  margin: 26px -24px 0; padding: 0 24px; }
.dsp-nav a { padding: 11px 12px; font-size: 12.5px; font-weight: 500; color: var(--muted);
  border-bottom: 2px solid transparent; white-space: nowrap; }
.dsp-nav a:hover { color: var(--text); border-bottom-color: var(--border); }
.dsp-group { padding-top: 34px; }
.dsp-group-h { font-size: 11px; text-transform: uppercase; letter-spacing: 0.09em; color: var(--accent);
  margin: 0 0 14px; font-weight: 600; }
.dsp-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
  box-shadow: var(--elev-base); padding: 22px 24px; margin-bottom: 18px; overflow-x: auto; }
.dsp-card-h { font-size: 14px; margin: 0 0 16px; font-weight: 700; }
</style>
<div class="dsp-wrap">
  <header class="dsp-head">
    <h1>The Skynet Shell</h1>
    <p>The shipped design system, alive on one canvas — every card inlines the production CSS verbatim
       (app/src/styles) with the real component markup, so what this page wears is exactly what the app
       wears. The doctrine rides along: tokens only · dark-first · honest empty states · red only where
       P/L is real · motion on two tokens with one reduced-motion collapse.</p>
    <div class="dsp-meta"><span class="env-pill">#738 · PRs 739–758</span><span class="env-pill">${all.length} cards</span><span class="env-pill">dark + light</span></div>
  </header>
  <nav class="dsp-nav">${groups.map((g) => `<a href="#${slug(g)}">${g}</a>`).join("")}</nav>
  ${sections}
</div>`;
writeFileSync(join(OUT, "canvas.html"), canvas);
console.log(`design cards: ${all.length} → ${OUT}/cards · canvas → ${OUT}/canvas.html`);
