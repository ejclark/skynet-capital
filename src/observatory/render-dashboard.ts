import type { DecisionRecord } from "../autonomous/decision-record.js";
import { COURSES, type Course, type Milestone, RANKS, totalPoints } from "../domain/curriculum.js";
import { escapeHtml } from "../ui/escape-html.js";
import {
  type DashboardViewOptions,
  type NavContext,
  type NavView,
  renderShell,
} from "./dashboard-shell.js";
import { renderEmpireSkyline } from "./empire-skyline.js";
import { equityChange, equityDrawdown, renderEquitySparkline } from "./equity-sparkline.js";
import type { EquitySample } from "./history-store.js";
import {
  activityFeed,
  participantInvested,
  participantUnrealized,
  positionsTable,
} from "./participant-card.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { personaLore } from "./persona-lore.js";
import {
  chip,
  formatCurrency,
  formatSigned,
  formatTimestamp,
  plClass,
  tile,
  tzAbbrev,
} from "./render-atoms.js";

/**
 * The INDIVIDUAL desk and the Academy — what's left of this module after Board + Leaderboard +
 * Bots vs Humans + Compare all moved to `standings-view.ts` (the Aug 2026 IA consolidation).
 * Pure: same data in, same HTML out — so it's unit-testable and safe to re-run on a schedule.
 */

// NavView / NavContext / DashboardViewOptions / renderShell now live in `dashboard-shell.ts`, the
// shared push-drawer app shell every view delegates to. Re-exported here so
// `dashboard-server.ts`/tests importing them from this module keep working unchanged.
export type { DashboardViewOptions, NavContext, NavView };

/**
 * The INDIVIDUAL view — one participant's own performance. Hero equity + a stat row, then the
 * full position detail and activity timeline, plus (for bots) the persona read. Deferred
 * history metrics (equity over time, realized P/L, win rate) show as reserved seams, never
 * fabricated numbers — they light up once the history layer lands.
 */
export function renderIndividualBody(
  snapshot: ParticipantSnapshot,
  options: DashboardViewOptions & {
    isSelf?: boolean;
    generatedAt?: string;
    history?: readonly EquitySample[];
    decisions?: readonly DecisionRecord[];
    /** Landmark dial from the standings producer — honest rank, never defaulted to full power. */
    prominence?: number;
  } = {},
): string {
  const isSelf = Boolean(options.isSelf);
  const asOf = options.generatedAt ?? new Date().toISOString();
  const who = isSelf ? "Your desk" : `${escapeHtml(snapshot.displayName)}'s desk`;
  const lore = snapshot.kind === "bot" ? personaLore(snapshot.personaId) : undefined;
  const persona = lore
    ? `<div class="persona"><span class="persona-label">Persona</span><span class="persona-id">${escapeHtml(
        lore.name,
      )}</span></div>`
    : snapshot.kind === "bot" && snapshot.personaId
      ? `<div class="persona"><span class="persona-label">Strategy</span><span class="persona-id">${escapeHtml(
          snapshot.personaId,
        )}</span></div>`
      : "";
  const personaCard = lore
    ? `<section class="persona-card">
    <span class="persona-eyebrow">Persona · ${escapeHtml(lore.name)}</span>
    <p class="persona-thesis">${escapeHtml(lore.thesis)}</p>
    ${lore.lore ? `<p class="persona-legend">${escapeHtml(lore.lore)}</p>` : ""}
  </section>`
    : "";

  if (snapshot.error) {
    const rotateHint = isSelf
      ? ` <a href="/rotate">Regenerated your key? Rotate your credentials</a>.`
      : "";
    return renderShell(
      options.nav,
      `<section class="indiv indiv-error">
    <h1 class="indiv-name">${escapeHtml(snapshot.displayName)} ${chip(snapshot)}</h1>
    <p class="error-msg">Account unreachable — check this participant's API keys.${rotateHint}</p>
  </section>`,
      asOf,
    );
  }

  const pl = participantUnrealized(snapshot);
  const invested = participantInvested(snapshot);
  const buyingPower = snapshot.cash;
  const plPct = invested > 0 ? (pl / invested) * 100 : 0;

  return renderShell(
    options.nav,
    `<section class="indiv">
    <header class="indiv-head">
      <div class="indiv-title">
        <span class="indiv-eyebrow">${who}</span>
        <h1 class="indiv-name">${escapeHtml(snapshot.displayName)} ${chip(snapshot)}${
          isSelf ? `<span class="you-mark">YOU</span>` : ""
        }</h1>
      </div>
      ${persona}
    </header>
    <div class="empire-band">${renderEmpireSkyline(
      snapshot,
      options.prominence !== undefined ? { personaProminence: options.prominence } : {},
    )}</div>
    ${
      isSelf && snapshot.positions.length === 0 && snapshot.cash > 0
        ? `<div class="founding-cta">
      <p class="founding-cta-text">Your reserve is staged — <strong>${formatCurrency(
        snapshot.cash,
      )}</strong> of dry powder, an empire about to rise. Found your first position to break ground.</p>
      <a class="obs-cta obs-cta-primary" href="/learn">Begin the Wheel — your first play</a>
    </div>`
        : ""
    }
    <div class="indiv-hero">
      <div class="hero-equity">
        <span class="tile-label">Equity</span>
        <span class="hero-num num">${formatCurrency(snapshot.equity)}</span>
        <span class="hero-sub num ${plClass(pl)}">${formatSigned(pl)} unrealized · ${
          plPct >= 0 ? "+" : ""
        }${plPct.toFixed(2)}%</span>
      </div>
      <div class="summary indiv-tiles">
        ${tile("Cash", formatCurrency(snapshot.cash))}
        ${tile("Invested", formatCurrency(invested))}
        ${tile("Unrealized P/L", formatSigned(pl), { cls: plClass(pl) })}
        ${tile("Buying Power", formatCurrency(buyingPower))}
      </div>
    </div>
    ${personaCard}
    ${decisionsPanel(snapshot, options.decisions)}
    <div class="indiv-cols">
      <div class="indiv-col">
        <h2 class="col-head">Positions</h2>
        ${positionsTable(snapshot)}
      </div>
      <div class="indiv-col">
        <h2 class="col-head">Activity <span class="tzlabel">${escapeHtml(
          tzAbbrev(snapshot.timezone),
        )}</span></h2>
        ${activityFeed(snapshot) || `<p class="empty">No recent activity.</p>`}
      </div>
    </div>
    ${historyPanel(snapshot, options.history)}
  </section>`,
    asOf,
  );
}

/**
 * The PORTFOLIO index (`/u`) — the member's home, one level above their desks: every account they
 * own, with a combined-equity hero answering "how am I doing overall" before the per-account split.
 * The server resolves ownership (session email → `Participant.ownerEmail`) and passes only the owned
 * snapshots in, so this stays pure and never sees an email. Today most members own exactly one
 * account; the view renders honestly for any count, including zero.
 */
export function renderPortfolioIndexBody(
  accounts: readonly ParticipantSnapshot[],
  options: DashboardViewOptions & { generatedAt?: string } = {},
): string {
  const asOf = options.generatedAt ?? new Date().toISOString();
  const readable = accounts.filter((a) => !a.error);
  const head = `<div class="ladder-head">
      <div>
        <span class="indiv-eyebrow">Portfolio</span>
        <h1 class="view-title">Your accounts</h1>
        <p class="view-sub">${accountCountLine(accounts)}</p>
      </div>
    </div>`;

  if (accounts.length === 0) {
    const cta = options.nav?.canAdd
      ? `<a class="obs-cta obs-cta-primary" href="/add">Connect an account</a>`
      : "";
    return renderShell(
      options.nav,
      `<section class="portfolio">${head}
      <div class="founding-cta">
        <p class="founding-cta-text">No accounts linked yet — connect a free Alpaca paper account to take the field.</p>
        ${cta}
      </div>
    </section>`,
      asOf,
    );
  }

  const combined = readable.reduce((sum, a) => sum + a.equity, 0);
  const cash = readable.reduce((sum, a) => sum + a.cash, 0);
  const invested = readable.reduce((sum, a) => sum + participantInvested(a), 0);
  const pl = readable.reduce((sum, a) => sum + participantUnrealized(a), 0);
  const unreachable = accounts.length - readable.length;
  const hero = `<div class="indiv-hero">
      <div class="hero-equity">
        <span class="tile-label">Combined equity</span>
        <span class="hero-num num">${formatCurrency(combined)}</span>
        <span class="hero-sub num ${plClass(pl)}">${formatSigned(pl)} unrealized</span>
      </div>
      <div class="summary indiv-tiles">
        ${tile("Cash", formatCurrency(cash))}
        ${tile("Invested", formatCurrency(invested))}
        ${tile("Unrealized P/L", formatSigned(pl), { cls: plClass(pl) })}
      </div>
    </div>`;
  const maxEquity = Math.max(...readable.map((a) => a.equity), 1);
  const rows = accounts
    .map((a, i) => {
      const value = a.error
        ? `<span class="rank-val num neg">unreachable</span>`
        : `<span class="rank-val num">${formatCurrency(a.equity)}</span>`;
      const width = a.error ? 0 : Math.max((a.equity / maxEquity) * 100, 2).toFixed(1);
      return `<li class="rank-row rank-plain">
        <span class="rank">${i + 1}</span>
        <a class="rank-name" href="/u/${encodeURIComponent(a.id)}">${escapeHtml(a.displayName)} ${chip(a)}${
          a.id === options.nav?.currentId ? `<span class="you-mark">YOU</span>` : ""
        }</a>
        <span class="rank-bar"><i class="bar-flat" style="width:${width}%"></i></span>
        ${value}
      </li>`;
    })
    .join("\n      ");
  const note =
    unreachable > 0
      ? `<p class="seam-note">${unreachable} account${unreachable === 1 ? "" : "s"} unreachable — excluded from the combined figures above.</p>`
      : "";
  return renderShell(
    options.nav,
    `<section class="portfolio">${head}
    ${hero}
    <ol class="ladder">
      ${rows}
    </ol>
    ${note}
  </section>`,
    asOf,
  );
}

/** The honest count line — never claims bots or a plural the member doesn't have. */
function accountCountLine(accounts: readonly ParticipantSnapshot[]): string {
  if (accounts.length === 0) return "Your home base — accounts you connect appear here.";
  const bots = accounts.filter((a) => a.kind === "bot").length;
  const humans = accounts.length - bots;
  const parts = [
    humans > 0 ? `${humans} human` : "",
    bots > 0 ? `${bots} bot${bots === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  return `${accounts.length} Alpaca paper account${accounts.length === 1 ? "" : "s"} — ${parts.join(", ")} · a row's name opens that account's desk`;
}

/**
 * The AUTONOMOUS DECISIONS panel (Phase 2.1 of the autonomy plan) — surfaces the bot's decision audit
 * trail so you can watch WHAT it decided and WHY. Bots only; shows the most recent cycles that did
 * something (placed / observed / halted / cooldown), newest first, each with its mode and rationale.
 * Absent for humans and when no trail is wired (the honest "not recorded yet" seam).
 */
function decisionsPanel(
  snapshot: ParticipantSnapshot,
  decisions?: readonly DecisionRecord[],
): string {
  if (snapshot.kind !== "bot") return "";
  if (!decisions) {
    return `<div class="history-seam">
      <span class="seam-label">Autonomous decisions</span>
      <p class="seam-note">Once this bot is running, every cycle it decides — observed or placed — shows here with its reasoning.</p>
    </div>`;
  }
  const active = decisions
    .filter((d) => d.halted || d.outcomes.length > 0)
    .slice(-12)
    .reverse();
  if (active.length === 0) {
    return `<section class="decisions-panel">
      <h2 class="col-head">Autonomous decisions</h2>
      <p class="empty">No decisions yet — the desk has been quiet.</p>
    </section>`;
  }
  const rows = active
    .map((d) => {
      const time = escapeHtml(formatTimestamp(new Date(d.at).toISOString()));
      if (d.halted) {
        return `<li class="dcn dcn-halt"><span class="dcn-t">${time}</span><span class="dcn-mode halt">HALTED</span><span class="dcn-body">circuit breaker: ${escapeHtml(d.halted)} — did not trade</span></li>`;
      }
      const modeCls = d.mode === "live" ? "live" : "observe";
      const items = d.outcomes
        .map((o) => {
          const verb =
            o.action === "placed"
              ? "placed"
              : o.action === "rejected"
                ? "rejected"
                : o.action === "cooldown-skipped"
                  ? "held (cooldown)"
                  : "would place";
          return `${escapeHtml(verb)} ${escapeHtml(o.intent.side)} ${o.intent.quantity} ${escapeHtml(o.intent.symbol)} — ${escapeHtml(o.intent.reason)}`;
        })
        .join("; ");
      return `<li class="dcn"><span class="dcn-t">${time}</span><span class="dcn-mode ${modeCls}">${d.mode.toUpperCase()}</span><span class="dcn-body">${items}</span></li>`;
    })
    .join("\n      ");
  return `<section class="decisions-panel">
      <h2 class="col-head">Autonomous decisions</h2>
      <ul class="dcn-list">
      ${rows}
      </ul>
    </section>`;
}

/**
 * The performance-history panel. Lights up the equity sparkline + realized P/L once ≥2 samples have
 * been recorded; otherwise shows the honest "still accruing" seam — never a fabricated line.
 */
function historyPanel(snapshot: ParticipantSnapshot, history?: readonly EquitySample[]): string {
  const spark = history ? renderEquitySparkline(history) : null;
  if (!spark) {
    return `<div class="history-seam">
      <span class="seam-label">Performance history</span>
      <p class="seam-note">Equity over time, realized P/L, and per-play win rate light up here once we've recorded your history.</p>
    </div>`;
  }
  const change = equityChange(history ?? []);
  const dd = equityDrawdown(history ?? []);
  const realized = snapshot.realizedPl;
  return `<section class="history-panel">
      <h2 class="col-head">Performance history</h2>
      <div class="history-spark">${spark}</div>
      <dl class="metrics history-metrics">
        ${
          change
            ? `<div><dt>Since first sample</dt><dd class="num ${plClass(change.abs)}">${formatSigned(
                change.abs,
              )} · ${change.pct >= 0 ? "+" : ""}${change.pct.toFixed(2)}%</dd></div>`
            : ""
        }
        ${
          realized !== undefined
            ? `<div><dt>Realized P/L</dt><dd class="num ${plClass(realized)}">${formatSigned(realized)}</dd></div>`
            : ""
        }
        ${dd ? `<div><dt>Peak equity</dt><dd class="num">${formatCurrency(dd.peak)}</dd></div>` : ""}
        ${
          dd
            ? `<div><dt>Max drawdown</dt><dd class="num ${dd.ddPct > 0 ? "neg" : ""}">${
                dd.ddPct > 0 ? `-${dd.ddPct.toFixed(2)}% · -${formatCurrency(dd.ddAbs)}` : "0.00%"
              }</dd></div>`
            : ""
        }
      </dl>
      <p class="seam-note">Per-play win rate lights up as more history accrues.</p>
    </section>`;
}

/** Milestones that are literally a trade map straight to the ticket, pre-set to the play. */
const MILESTONE_TICKET: Record<string, string> = {
  "buy-first-stock": "/trade?play=101",
  "first-cash-covered-put": "/trade?play=201",
  "first-covered-call": "/trade?play=202",
  "first-long-put": "/trade?play=301",
  "first-long-call": "/trade?play=302",
};

/** One milestone row — a self-marked achievement worth points. */
function milestoneRow(m: Milestone): string {
  const ticket = MILESTONE_TICKET[m.id];
  return `<label class="ms" data-ms="${m.id}">
        <input type="checkbox" class="ms-check" data-ms-check="${m.id}">
        <span class="ms-mark" aria-hidden="true">✓</span>
        <span class="ms-body"><span class="ms-title">${escapeHtml(m.title)}</span><span class="ms-detail">${escapeHtml(m.detail)}</span></span>
        ${ticket ? `<a class="ms-go" href="${ticket}">open the ticket →</a>` : ""}
        <span class="ms-pts">+${m.points}</span>
      </label>`;
}

/** One course card — a chapter of milestones with a progress bar; higher levels lock. */
function courseCard(course: Course, locked: boolean): string {
  return `<details class="course${locked ? " locked" : ""}" data-course="${course.level}"${locked ? "" : " open"}>
      <summary>
        <span class="course-badge">${course.level}</span>
        <span class="course-h">
          <span class="course-title">${escapeHtml(course.title)}</span>
          <span class="course-sub">${escapeHtml(course.subtitle)}</span>
          <span class="course-prog"><span class="course-bar"><i data-bar="${course.level}"></i></span><span class="course-count" data-count="${course.level}">0 / ${course.milestones.length}</span></span>
        </span>
        <span class="course-lock" data-lock>${locked ? "🔒 Finish the level below" : ""}</span>
        <span class="lvl-chev" aria-hidden="true">›</span>
      </summary>
      <div class="ms-list">
        ${course.milestones.map(milestoneRow).join("\n        ")}
      </div>
    </details>`;
}

/**
 * The ACADEMY (`/learn`) — a GAMIFIED trading journey, not a textbook. It opens with a points/rank
 * HUD and the Wheel (buy stock → cash-covered put → covered call → repeat), then a stack of courses
 * whose milestones are self-marked achievements worth points. Level 100 (the Wheel) is open from the
 * start; level 200 (directional long options) unlocks only when 100 is complete — and everything
 * riskier is intentionally not shown yet. The `src/domain/curriculum.ts` model is the single source
 * of truth; a future engine can auto-complete milestones from real Alpaca activity.
 */
export function renderAcademyBody(options: DashboardViewOptions = {}): string {
  const cards = COURSES.map((c, i) => courseCard(c, i > 0)).join("\n    ");
  const content = `<section class="academy">
    <div class="ladder-head">
      <div>
        <h1 class="view-title">Your trading journey</h1>
        <p class="view-sub">It's all paper money — the only thing at stake is bragging rights. Complete milestones, earn points, climb the ranks, and unlock the next play.</p>
      </div>
    </div>
    <div class="hud">
      <div class="hud-stat"><span class="hud-k">Rank</span><span class="hud-v" data-rank>Observer</span></div>
      <div class="hud-stat"><span class="hud-k">Points</span><span class="hud-v" data-points>0</span><span class="hud-of" data-total>/ ${totalPoints()}</span></div>
      <div class="hud-bar"><i data-hudbar></i></div>
    </div>
    <div class="wheel">
      <h2>The Wheel — your first playbook</h2>
      <p class="wheel-lede">The safest way to learn options income. Turn the wheel: own a stock you'd want anyway, get paid to buy it lower, get paid to cap your upside — then repeat.</p>
      <ol class="wheel-steps">
        <li><span class="wheel-n">1</span><span class="wheel-t">Buy the stock</span><span class="wheel-d">Own 100 shares of a company you'd be glad to hold.</span></li>
        <li><span class="wheel-n">2</span><span class="wheel-t">Sell a cash-covered put</span><span class="wheel-d">Get paid to set a price you'd happily buy more at.</span></li>
        <li><span class="wheel-n">3</span><span class="wheel-t">Sell a covered call</span><span class="wheel-d">Get paid to cap your upside while you hold.</span></li>
        <li><span class="wheel-n">↻</span><span class="wheel-t">Repeat</span><span class="wheel-d">Collect premium turn after turn — that's the Wheel.</span></li>
      </ol>
    </div>
    <div class="courses">
    ${cards}
    </div>
    <p class="more-soon">◆ More strategies — spreads, condors, and advanced plays — unlock as you climb. We keep the risky ones out of reach until you're ready.</p>
  </section>
  <footer class="obs-foot">Educational · paper trading only · nothing here is financial advice. Mark a milestone once you've done it in your account — progress saves on this device.</footer>
  ${ACADEMY_SCRIPT}`;
  return renderShell(options.nav, content, new Date().toISOString());
}

/**
 * Gamified progression, client-side. localStorage holds the set of completed milestone ids; checking
 * one awards points, advances the rank HUD + per-course bars, and unlocks the next course once the
 * current one is fully done. No-JS still gets a fully readable page (level 100 open).
 */
const ACADEMY_SCRIPT = `<script>
(function(){
  var KEY="skynet.academy.done";
  var RANKS=${JSON.stringify(RANKS)};
  var TOTAL=${totalPoints()};
  var COURSES=${JSON.stringify(
    COURSES.map((c) => ({
      level: c.level,
      ms: c.milestones.map((m) => ({ id: m.id, points: m.points })),
    })),
  )};
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||"[]"); }catch(e){ return []; } }
  function save(a){ try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} }
  var done={}; load().forEach(function(id){ done[id]=true; });
  function points(){ var p=0; COURSES.forEach(function(c){ c.ms.forEach(function(m){ if(done[m.id]) p+=m.points; }); }); return p; }
  function rankFor(p){ var r=RANKS[0]; RANKS.forEach(function(x){ if(p>=x.atPoints) r=x; }); return r; }
  function courseDone(c){ return c.ms.every(function(m){ return done[m.id]; }); }
  function unlocked(level){ for(var i=0;i<COURSES.length;i++){ if(COURSES[i].level===level){ return i===0 || courseDone(COURSES[i-1]); } } return false; }
  function set(el,v){ if(el) el.textContent=v; }
  function sync(){
    var p=points();
    set(document.querySelector("[data-points]"), String(p));
    set(document.querySelector("[data-rank]"), rankFor(p).title);
    var hb=document.querySelector("[data-hudbar]"); if(hb) hb.style.width=(TOTAL?Math.round(p/TOTAL*100):0)+"%";
    document.querySelectorAll("[data-ms-check]").forEach(function(cb){ cb.checked=!!done[cb.getAttribute("data-ms-check")]; });
    COURSES.forEach(function(c){
      var n=0; c.ms.forEach(function(m){ if(done[m.id]) n++; });
      var bar=document.querySelector('[data-bar="'+c.level+'"]'); if(bar) bar.style.width=Math.round(n/c.ms.length*100)+"%";
      set(document.querySelector('[data-count="'+c.level+'"]'), n+" / "+c.ms.length);
      var el=document.querySelector('.course[data-course="'+c.level+'"]'); if(!el) return;
      var lock=!unlocked(c.level); el.classList.toggle("locked", lock);
      var ll=el.querySelector("[data-lock]"); if(ll) ll.textContent=lock?"🔒 Finish the level below":"";
      if(lock){ el.open=false; el.querySelectorAll("[data-ms-check]").forEach(function(cb){ cb.disabled=true; }); }
      else el.querySelectorAll("[data-ms-check]").forEach(function(cb){ cb.disabled=false; });
    });
  }
  document.querySelectorAll("[data-ms-check]").forEach(function(cb){
    cb.addEventListener("change", function(){ var id=cb.getAttribute("data-ms-check");
      if(cb.checked) done[id]=true; else delete done[id];
      save(Object.keys(done)); sync();
    });
  });
  sync();
})();
</script>`;
