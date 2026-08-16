import { escapeHtml } from "../ui/escape-html.js";
import { formatTimestamp, profileHref } from "./render-atoms.js";

/**
 * The push-drawer APP SHELL shared by every logged-in observatory view: the drawer nav, the
 * design-token stylesheet, and the wrapper that either renders the bare embeddable body (Artifact
 * publishing) or the full drawer shell. Every `render*Body` view delegates its final wrap to
 * `renderShell` so the drawer/toggle/style stay identical across views.
 */

/** Which top-level view is active, for the shared nav. */
export type NavView =
  | "board"
  | "leaderboard"
  | "bots"
  | "compare"
  | "calendar"
  | "you"
  | "add"
  | "learn";

export interface NavContext {
  readonly active: NavView;
  /** The signed-in viewer's participant id, if resolved — powers the "You" tab + self marker. */
  readonly currentId?: string;
  readonly canAdd: boolean;
  readonly authed: boolean;
  /** Views ship incrementally; only link the ones that exist so merged states have no dead links. */
  readonly hasLeaderboard?: boolean;
  readonly hasBots?: boolean;
  readonly hasCompare?: boolean;
}

export interface DashboardViewOptions {
  /** Render the shared top nav (logged-in shell). Omit for the bare embeddable body. */
  readonly nav?: NavContext;
}

/** In-app "Feedback" links point at the self-service form (no GitHub account needed). */
const FEEDBACK_URL = "/feedback";

const NAV_ICON: Record<string, string> = {
  board: "▦",
  compare: "⇄",
  calendar: "◷",
  leaderboard: "≣",
  bots: "◆",
  you: "◉",
  add: "＋",
  learn: "◈",
};

function drawerLink(href: string, label: string, view: NavView, active: boolean): string {
  return `<a class="dnav-link${active ? " active" : ""}" href="${href}"${
    active ? ' aria-current="page"' : ""
  }><span class="dnav-ico" aria-hidden="true">${NAV_ICON[view] ?? "•"}</span><span class="dnav-label">${label}</span></a>`;
}

/**
 * The left DRAWER — an insulated, full-height navigation container. It is a sibling of the main
 * stage (not an overlay): opening/closing it PUSHES the stage to make room. Holds the brand, the
 * vertical view nav, and the account actions. This shell is the template every logged-in view uses.
 */
function renderDrawer(nav: NavContext): string {
  const links = [drawerLink("/", "Board", "board", nav.active === "board")];
  if (nav.hasLeaderboard) {
    links.push(
      drawerLink("/leaderboard", "Leaderboard", "leaderboard", nav.active === "leaderboard"),
    );
  }
  if (nav.hasBots) {
    links.push(drawerLink("/bots-vs-humans", "Bots vs Humans", "bots", nav.active === "bots"));
  }
  if (nav.hasCompare) {
    links.push(drawerLink("/compare", "Compare", "compare", nav.active === "compare"));
  }
  links.push(drawerLink("/calendar", "Calendar", "calendar", nav.active === "calendar"));
  if (nav.currentId) {
    links.push(drawerLink(profileHref(nav.currentId), "You", "you", nav.active === "you"));
  }
  links.push(drawerLink("/learn", "Learn", "learn", nav.active === "learn"));
  const foot: string[] = [];
  if (nav.canAdd) {
    foot.push(
      `<a class="dnav-cta" href="/add"><span class="dnav-ico" aria-hidden="true">${NAV_ICON.add}</span><span class="dnav-label">${
        nav.currentId ? "Add account" : "Connect account"
      }</span></a>`,
    );
  }
  foot.push(
    `<a class="dnav-link dnav-muted" href="${FEEDBACK_URL}"><span class="dnav-ico" aria-hidden="true">✎</span><span class="dnav-label">Feedback</span></a>`,
  );
  if (nav.authed) {
    foot.push(
      `<a class="dnav-link dnav-muted" href="/logout"><span class="dnav-ico" aria-hidden="true">⏻</span><span class="dnav-label">Sign out</span></a>`,
    );
  }
  // The drawer is built from the same card language as the participant cards: titled sections in
  // bordered containers, all anchored top-left. New sections (e.g. a "Your standing" card, filters)
  // drop in as more `.dcard` blocks — the structure scales to more complexity without a redesign.
  return `<aside class="drawer" id="drawer" aria-label="Navigation">
      <div class="drawer-brand">
        <span class="mark">SKYNET<b>·</b>CAPITAL</span>
        <span class="sub">Observatory</span>
      </div>
      <section class="dcard">
        <h2 class="dcard-title">Views</h2>
        <nav class="drawer-nav" aria-label="Views">${links.join("")}</nav>
      </section>
      <section class="dcard">
        <h2 class="dcard-title">Account</h2>
        <div class="drawer-nav">${foot.join("")}</div>
      </section>
    </aside>`;
}

/** Drawer toggle: push (not overlay), remembers state, and stays inert under reduced-motion. */
const DRAWER_SCRIPT = `<script>
(function(){
  var app=document.querySelector(".app"), btn=document.querySelector(".drawer-toggle");
  if(!app||!btn) return;
  try{ if(localStorage.getItem("obs-drawer")==="closed") app.setAttribute("data-drawer","closed"); }catch(e){}
  function sync(){ var open=app.getAttribute("data-drawer")!=="closed"; btn.setAttribute("aria-expanded",open?"true":"false"); }
  sync();
  btn.addEventListener("click",function(){
    var closed=app.getAttribute("data-drawer")==="closed";
    app.setAttribute("data-drawer",closed?"open":"closed");
    try{ localStorage.setItem("obs-drawer",closed?"open":"closed"); }catch(e){}
    sync();
  });
})();
</script>`;

/**
 * Wrap a view's content in the push-drawer app shell. The drawer is a sibling of the scrolling
 * stage, so toggling it slides the stage over (content is pushed, never covered). #root carries the
 * `.obs` design-token scope and is what the SSE stream swaps on the board. No-JS/reduced-motion safe:
 * the drawer starts open and the toggle simply flips a class (no animation under reduced-motion).
 */
export function renderShell(
  nav: NavContext | undefined,
  content: string,
  generatedAt: string,
): string {
  if (!nav) {
    // Bare embeddable body (e.g. Artifact publishing) — no shell, just the token-scoped content.
    return `${STYLE}
<div class="obs" id="root">${content}</div>`;
  }
  return `${STYLE}
<div class="app" data-drawer="open">
  ${renderDrawer(nav)}
  <main class="stage">
    <button class="drawer-toggle" type="button" aria-controls="drawer" aria-expanded="true" aria-label="Toggle navigation"><span aria-hidden="true">‹‹</span></button>
    <div class="stage-inner">
      <div class="stage-meta">
        <span class="tag">PAPER · SANDBOX</span>
        <span class="ts num">${escapeHtml(formatTimestamp(generatedAt))}</span>
      </div>
      <div class="obs" id="root">${content}</div>
    </div>
  </main>
</div>
${DRAWER_SCRIPT}`;
}

const STYLE = `<style>
  /* Dark-only by design — nations only compare cleanly when every cityscape is lit the same (no light mode). */
  :root{ color-scheme: dark; }
  .obs { --bg:#0B0F14; --surface:#131A22; --surface-2:#0F151C; --border:#223041; --text:#E6EDF3; --muted:#8B9AAB; --accent:#35D0BA; --pos:#3FB950; --neg:#F85149;
    --mono:ui-monospace,"JetBrains Mono","SF Mono",Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    background:var(--bg); color:var(--text); font-family:var(--sans);
    min-height:100vh; padding:28px clamp(16px,4vw,48px) 64px; box-sizing:border-box; }
  .obs *{ box-sizing:border-box; }
  .obs .num{ font-family:var(--mono); font-variant-numeric:tabular-nums; }
  .obs .pos{ color:var(--pos); } .obs .neg{ color:var(--neg); } .obs .flat{ color:var(--muted); }
  .obs-bar{ display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px; padding-bottom:18px; border-bottom:1px solid var(--border); margin-bottom:24px; }
  .brand{ display:flex; flex-direction:column; gap:4px; }
  .brand .mark{ font-weight:700; font-size:20px; letter-spacing:.14em; }
  .brand .mark b{ color:var(--accent); font-weight:700; }
  .brand .sub{ font-size:11px; letter-spacing:.28em; text-transform:uppercase; color:var(--muted); }
  .obs-bar .meta{ display:flex; align-items:center; gap:12px; font-size:12px; color:var(--muted); }
  .tag{ font-family:var(--mono); font-size:11px; letter-spacing:.12em; color:var(--accent); border:1px solid var(--accent); border-radius:999px; padding:3px 10px; }
  .meta .ts{ font-family:var(--mono); }
  .observer-hero{ margin:0 0 26px; padding:22px 24px; border:1px solid color-mix(in srgb, var(--accent) 45%, var(--border)); border-radius:14px;
    background:linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface-2)), var(--surface-2)); }
  .obs-eyebrow{ font-family:var(--mono); font-size:10px; letter-spacing:.24em; color:var(--accent); margin-bottom:8px; }
  .obs-title{ font-size:19px; letter-spacing:.01em; margin-bottom:8px; }
  .obs-sub{ color:var(--muted); font-size:13.5px; max-width:64ch; margin-bottom:14px; }
  .obs-ctas{ display:flex; gap:10px; flex-wrap:wrap; }
  .obs-cta{ display:inline-block; padding:9px 16px; border-radius:9px; border:1px solid var(--border); color:var(--text);
    text-decoration:none; font-family:var(--mono); font-size:12px; letter-spacing:.06em; transition:border-color .15s ease, background .15s ease; }
  .obs-cta:hover{ border-color:var(--accent); }
  .obs-cta-primary{ background:var(--accent); border-color:var(--accent); color:#06251F; font-weight:700; }
  .obs-cta-primary:hover{ filter:brightness(1.08); }
  .summary{ display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:28px; }
  .tile{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; display:flex; flex-direction:column; gap:8px; }
  .tile-lead{ border-color:color-mix(in srgb,var(--accent) 45%,var(--border)); }
  .tile-label{ font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  .tile-num{ font-size:22px; font-weight:600; }
  .tile-lead .tile-num{ font-size:26px; }
  .tile .unit{ font-size:12px; color:var(--muted); font-family:var(--sans); }
  .grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:16px; }
  .card{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:18px 18px 8px; display:flex; flex-direction:column; }
  .card-head{ display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .card-head h3{ margin:0; font-size:15px; font-weight:600; flex:0 1 auto; }
  .chip{ font-family:var(--mono); font-size:10px; letter-spacing:.08em; padding:3px 8px; border-radius:6px; white-space:nowrap; }
  .chip-bot{ background:color-mix(in srgb,var(--accent) 16%,transparent); color:var(--accent); border:1px solid color-mix(in srgb,var(--accent) 40%,transparent); }
  .chip-human{ background:color-mix(in srgb,var(--muted) 16%,transparent); color:var(--muted); border:1px solid color-mix(in srgb,var(--muted) 34%,transparent); }
  .dot{ width:8px; height:8px; border-radius:50%; margin-left:auto; flex:0 0 auto; }
  .dot-live{ background:var(--pos); box-shadow:0 0 0 3px color-mix(in srgb,var(--pos) 22%,transparent); }
  .dot-error{ background:var(--neg); box-shadow:0 0 0 3px color-mix(in srgb,var(--neg) 22%,transparent); }
  .equity{ display:flex; align-items:baseline; justify-content:space-between; gap:10px; padding:6px 0 14px; border-bottom:1px solid var(--border); }
  .equity-label{ font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  .equity-num{ font-size:26px; font-weight:700; }
  .metrics{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:14px 0; }
  .metrics div{ display:flex; flex-direction:column; gap:3px; }
  .metrics dt{ font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
  .metrics dd{ margin:0; font-size:14px; font-weight:600; }
  .positions{ width:100%; border-collapse:collapse; font-size:13px; margin-top:4px; }
  .positions th{ text-align:left; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); font-weight:600; padding:6px 8px; border-bottom:1px solid var(--border); }
  .positions td{ padding:7px 8px; border-bottom:1px solid color-mix(in srgb,var(--border) 55%,transparent); }
  .positions .num{ text-align:right; }
  .positions th.num{ text-align:right; }
  .positions .sym{ font-family:var(--mono); font-weight:600; }
  .positions tbody tr:last-child td{ border-bottom:none; }
  .empty{ color:var(--muted); font-size:13px; font-style:italic; padding:10px 2px 16px; }
  .activity{ margin-top:14px; padding-top:12px; border-top:1px solid var(--border); }
  .activity-head{ font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; }
  .tzlabel{ font-family:var(--mono); font-size:10px; letter-spacing:.04em; color:var(--muted); }
  .acttable{ width:100%; border-collapse:collapse; font-size:12px; }
  .acttable td{ padding:5px 6px; border-bottom:1px solid color-mix(in srgb,var(--border) 40%,transparent); vertical-align:middle; }
  .acttable tr:last-child td{ border-bottom:none; }
  .act-time{ color:var(--muted); white-space:nowrap; font-size:11px; }
  .act-trade .sym{ font-family:var(--mono); font-weight:600; }
  .act-status{ text-align:right; color:var(--muted); font-family:var(--mono); font-size:11px; }
  .acttable .num{ text-align:right; }
  .card-error{ border-color:color-mix(in srgb,var(--neg) 45%,var(--border)); }
  .error-msg{ color:var(--neg); font-size:13px; margin:2px 0 12px; }
  .obs-foot{ margin-top:32px; padding-top:16px; border-top:1px solid var(--border); font-size:11px; color:var(--muted); letter-spacing:.04em; }
  /* --- shared top nav --- */
  .obs-nav{ display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin:-8px 0 24px; }
  .navviews{ display:flex; gap:6px; flex-wrap:wrap; }
  .navlink{ font-family:var(--mono); font-size:12px; letter-spacing:.06em; color:var(--muted); text-decoration:none; padding:7px 12px; border-radius:8px; border:1px solid transparent; transition:color .15s, border-color .15s, background .15s; }
  .navlink:hover{ color:var(--text); background:color-mix(in srgb,var(--surface) 70%,transparent); }
  .navlink.active{ color:var(--accent); border-color:color-mix(in srgb,var(--accent) 40%,var(--border)); background:color-mix(in srgb,var(--accent) 8%,transparent); }
  .navlink:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .navright{ display:flex; gap:8px; align-items:center; }
  .navmuted{ color:var(--muted); }
  .navcta{ font-family:var(--mono); font-size:12px; letter-spacing:.04em; color:var(--accent); text-decoration:none; padding:7px 13px; border-radius:8px; border:1px solid color-mix(in srgb,var(--accent) 45%,var(--border)); background:color-mix(in srgb,var(--accent) 10%,transparent); }
  .navcta:hover{ background:color-mix(in srgb,var(--accent) 18%,transparent); }
  .navcta:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  /* --- YOU marker + clickable / self cards --- */
  .you-mark{ font-family:var(--mono); font-size:9px; font-weight:700; letter-spacing:.14em; color:var(--bg); background:var(--accent); border-radius:5px; padding:2px 6px; }
  a.card{ text-decoration:none; color:inherit; transition:border-color .15s, transform .12s, box-shadow .15s; }
  a.card:hover{ border-color:color-mix(in srgb,var(--accent) 50%,var(--border)); transform:translateY(-2px); box-shadow:0 10px 30px -14px rgba(0,0,0,.6); }
  a.card:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .card-self{ border-color:color-mix(in srgb,var(--accent) 55%,var(--border)); box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 22%,transparent) inset; }
  /* --- individual view --- */
  .backlink{ display:inline-block; font-family:var(--mono); font-size:12px; color:var(--muted); text-decoration:none; margin-bottom:18px; }
  .backlink:hover{ color:var(--accent); }
  .indiv-head{ display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px; margin-bottom:20px; }
  .indiv-eyebrow{ display:block; font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); margin-bottom:6px; }
  .indiv-name{ margin:0; font-size:26px; font-weight:700; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .persona{ display:flex; flex-direction:column; gap:3px; text-align:right; }
  .persona-label{ font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  .persona-id{ font-family:var(--mono); font-size:14px; color:var(--accent); }
  .persona-card{ background:var(--surface); border:1px solid var(--border); border-left:2px solid var(--accent); border-radius:12px; padding:14px 18px; margin-bottom:24px; }
  .persona-eyebrow{ display:block; font-family:var(--mono); font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--accent); margin-bottom:6px; }
  .persona-thesis{ margin:0; font-size:14px; color:var(--text); line-height:1.5; }
  .persona-legend{ margin:8px 0 0; font-size:13px; color:var(--muted); line-height:1.5; font-style:italic; }
  .empire-band{ margin:0 0 24px; }
  /* Founding CTA — shown on your own funded-but-untraded desk: the reserve is staged, make the first play. */
  .founding-cta{ margin:-8px 0 24px; padding:16px 18px; display:flex; flex-wrap:wrap; align-items:center;
    justify-content:space-between; gap:12px; border:1px solid color-mix(in srgb, var(--accent) 40%, var(--border));
    border-radius:12px; background:color-mix(in srgb, var(--accent) 7%, var(--surface)); }
  .founding-cta-text{ margin:0; color:var(--muted); font-size:14px; line-height:1.5; max-width:60ch; }
  .founding-cta-text strong{ color:var(--text); font-family:var(--mono); }
  .empire-skyline{ display:block; width:100%; height:auto; max-height:150px; border:1px solid var(--border); border-radius:10px; }
  /* glanceable per-card thumbnail — the board reads as a region of cities */
  .empire-thumb{ margin:0 0 14px; }
  .empire-thumb .empire-skyline{ max-height:88px; }
  /* two cities — a labelled empire skyline per participant, side by side on /compare */
  .empire-cities{ display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:0 0 26px; }
  .empire-city{ display:flex; flex-direction:column; gap:8px; min-width:0; }
  .empire-city .empire-band{ margin:0; }
  .empire-city-name{ font-family:var(--mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  @media (max-width:720px){ .empire-cities{ grid-template-columns:1fr; } }
  .indiv-hero{ display:grid; grid-template-columns:minmax(220px,1fr) 2fr; gap:16px; margin-bottom:24px; align-items:stretch; }
  .hero-equity{ background:var(--surface); border:1px solid color-mix(in srgb,var(--accent) 45%,var(--border)); border-radius:14px; padding:20px 22px; display:flex; flex-direction:column; gap:8px; justify-content:center; }
  .hero-num{ font-size:40px; font-weight:700; line-height:1; }
  .hero-sub{ font-size:13px; font-weight:600; }
  .indiv-tiles{ margin-bottom:0; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); }
  .indiv-cols{ display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px; margin-top:8px; }
  .col-head{ font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); font-weight:600; margin:0 0 10px; display:flex; justify-content:space-between; align-items:center; }
  .history-seam{ margin-top:26px; padding:18px 20px; border:1px dashed color-mix(in srgb,var(--accent) 30%,var(--border)); border-radius:12px; background:color-mix(in srgb,var(--accent) 4%,transparent); }
  .seam-label{ font-family:var(--mono); font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--accent); }
  .seam-note{ margin:6px 0 0; font-size:13px; color:var(--muted); }
  .history-panel{ margin-top:26px; padding:18px 20px; border:1px solid var(--border); border-radius:12px; background:var(--surface); }
  .decisions-panel{ margin-top:26px; padding:18px 20px; border:1px solid var(--border); border-radius:12px; background:var(--surface); }
  .dcn-list{ list-style:none; margin:12px 0 0; padding:0; display:flex; flex-direction:column; }
  .dcn{ display:flex; align-items:baseline; gap:12px; padding:9px 0; border-top:1px solid color-mix(in srgb,var(--border) 70%,transparent); font-size:13px; }
  .dcn:first-child{ border-top:0; }
  .dcn-t{ font-family:var(--mono); font-size:11px; color:var(--muted); white-space:nowrap; flex:0 0 auto; }
  .dcn-mode{ font-family:var(--mono); font-size:9px; letter-spacing:.1em; padding:2px 7px; border-radius:999px; border:1px solid var(--border); white-space:nowrap; flex:0 0 auto; }
  .dcn-mode.live{ color:var(--pos); border-color:color-mix(in srgb,var(--pos) 50%,var(--border)); }
  .dcn-mode.observe{ color:var(--accent); border-color:color-mix(in srgb,var(--accent) 50%,var(--border)); }
  .dcn-mode.halt{ color:var(--neg); border-color:color-mix(in srgb,var(--neg) 55%,var(--border)); }
  .dcn-body{ color:var(--text); line-height:1.5; }
  .dcn-halt .dcn-body{ color:var(--neg); }
  .history-spark{ margin:12px 0 14px; }
  .equity-spark{ display:block; width:100%; height:64px; }
  .history-metrics{ grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); }
  @media (max-width:640px){ .indiv-hero{ grid-template-columns:1fr; } }
  /* --- leaderboard --- */
  .ladder-head{ display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px; margin-bottom:20px; }
  .view-title{ margin:0; font-size:24px; font-weight:700; }
  .view-sub{ margin:6px 0 0; font-size:13px; color:var(--muted); }
  .metricsel{ display:flex; gap:4px; background:var(--surface-2); border:1px solid var(--border); border-radius:10px; padding:4px; }
  .msel{ font-family:var(--mono); font-size:12px; letter-spacing:.03em; color:var(--muted); text-decoration:none; padding:7px 12px; border-radius:7px; transition:color .15s, background .15s; }
  .msel:hover{ color:var(--text); }
  .msel.active{ color:var(--accent); background:color-mix(in srgb,var(--accent) 12%,transparent); }
  .msel:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .ladder{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
  .rank-row{ display:grid; grid-template-columns:34px minmax(140px,1.4fr) 3fr auto; align-items:center; gap:14px; background:var(--surface); border:1px solid var(--border); border-radius:11px; padding:12px 16px; }
  .rank-self{ border-color:color-mix(in srgb,var(--accent) 55%,var(--border)); box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 22%,transparent) inset; }
  .rank{ font-family:var(--mono); font-size:14px; font-weight:700; color:var(--muted); text-align:center; }
  .rank-top .rank{ color:var(--accent); }
  .rank-1 .rank{ font-size:17px; }
  .rank-name{ display:flex; align-items:center; gap:9px; flex-wrap:wrap; color:inherit; text-decoration:none; font-weight:600; font-size:15px; }
  .rank-name:hover{ color:var(--accent); }
  .rank-name:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; border-radius:4px; }
  .rank-bar{ height:8px; background:color-mix(in srgb,var(--border) 60%,transparent); border-radius:999px; overflow:hidden; }
  .rank-bar i{ display:block; height:100%; border-radius:999px; }
  .bar-flat{ background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 40%,transparent),var(--accent)); }
  .bar-pos{ background:linear-gradient(90deg,color-mix(in srgb,var(--pos) 40%,transparent),var(--pos)); }
  .bar-neg{ background:linear-gradient(90deg,color-mix(in srgb,var(--neg) 40%,transparent),var(--neg)); }
  .rank-val{ font-size:15px; font-weight:700; text-align:right; min-width:96px; }
  @media (max-width:560px){ .rank-row{ grid-template-columns:28px 1fr auto; } .rank-bar{ display:none; } }
  /* --- push-drawer app shell --- */
  .app{ --bg:#0B0F14; --surface:#131A22; --surface-2:#0F151C; --border:#223041; --text:#E6EDF3; --muted:#8B9AAB; --accent:#35D0BA; --pos:#3FB950; --neg:#F85149;
    --mono:ui-monospace,"JetBrains Mono","SF Mono",Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    display:flex; min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--sans); }
  .app *{ box-sizing:border-box; }
  .drawer{ flex:0 0 250px; width:250px; height:100vh; position:sticky; top:0; overflow-y:auto; overflow-x:hidden;
    background:var(--surface-2); border-right:1px solid var(--border); display:flex; flex-direction:column; gap:10px; padding:20px 14px;
    transition:flex-basis .28s cubic-bezier(.4,0,.2,1), width .28s cubic-bezier(.4,0,.2,1), padding .28s, border-color .28s; white-space:nowrap; }
  .app[data-drawer="closed"] .drawer{ flex-basis:0; width:0; padding-left:0; padding-right:0; border-right-color:transparent; }
  .drawer-brand{ display:flex; flex-direction:column; gap:3px; padding:6px 10px 14px; margin-bottom:4px; border-bottom:1px solid var(--border); }
  .drawer-brand .mark{ font-weight:700; font-size:15px; letter-spacing:.13em; }
  .drawer-brand .mark b{ color:var(--accent); }
  .drawer-brand .sub{ font-size:10px; letter-spacing:.26em; text-transform:uppercase; color:var(--muted); }
  .drawer-nav{ display:flex; flex-direction:column; gap:3px; }
  /* Drawer sections use the participant-card language — bordered containers with a titled header —
     so the nav reads as the same design system and new sections stack without a redesign. */
  .dcard{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:8px 7px; }
  .dcard-title{ margin:0; font-family:var(--mono); font-weight:600; font-size:9.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); padding:3px 7px 8px; }
  .dnav-link,.dnav-cta{ display:flex; align-items:center; gap:11px; padding:9px 11px; border-radius:9px; text-decoration:none; color:var(--muted); font-size:13px; font-weight:600; transition:color .15s, background .15s; }
  .dnav-link:hover{ color:var(--text); background:color-mix(in srgb,var(--surface) 80%,transparent); }
  .dnav-link.active{ color:var(--accent); background:color-mix(in srgb,var(--accent) 12%,transparent); }
  .dnav-link:focus-visible,.dnav-cta:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .dnav-muted{ color:color-mix(in srgb,var(--muted) 85%,transparent); }
  .dnav-cta{ color:var(--accent); border:1px solid color-mix(in srgb,var(--accent) 40%,var(--border)); background:color-mix(in srgb,var(--accent) 8%,transparent); }
  .dnav-cta:hover{ background:color-mix(in srgb,var(--accent) 16%,transparent); }
  .dnav-ico{ width:18px; text-align:center; font-size:13px; flex:0 0 auto; }
  .stage{ flex:1 1 auto; min-width:0; height:100vh; overflow-y:auto; position:relative; }
  .stage-inner{ padding:60px clamp(16px,4vw,44px) 60px; }
  .stage-inner .obs{ min-height:0; padding:0; background:none; }
  .stage-meta{ display:flex; justify-content:flex-end; align-items:center; gap:12px; font-size:12px; color:var(--muted); margin-bottom:20px; }
  .stage-meta .tag{ font-family:var(--mono); font-size:11px; letter-spacing:.12em; color:var(--accent); border:1px solid var(--accent); border-radius:999px; padding:3px 10px; }
  .drawer-toggle{ position:absolute; top:16px; left:16px; z-index:5; width:36px; height:36px; border-radius:9px; border:1px solid var(--border); background:var(--surface); color:var(--muted); cursor:pointer; font-size:13px; line-height:1; display:flex; align-items:center; justify-content:center; transition:color .15s, border-color .15s; }
  .drawer-toggle:hover{ color:var(--accent); border-color:color-mix(in srgb,var(--accent) 45%,var(--border)); }
  .drawer-toggle:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .drawer-toggle span{ display:inline-block; transition:transform .28s; }
  .app[data-drawer="closed"] .drawer-toggle span{ transform:rotate(180deg); }
  @media (max-width:760px){
    .drawer{ position:fixed; left:0; top:0; z-index:30; flex-basis:250px; width:250px; box-shadow:0 0 40px -8px rgba(0,0,0,.6); transition:transform .28s cubic-bezier(.4,0,.2,1); }
    .app[data-drawer="closed"] .drawer{ transform:translateX(-100%); flex-basis:0; width:250px; padding:20px 14px; border-right-color:var(--border); }
    .app[data-drawer="open"] .drawer{ transform:translateX(0); }
    .app{ display:block; } .stage{ height:auto; min-height:100vh; }
  }
  @media (prefers-reduced-motion:reduce){ .drawer,.drawer-toggle span{ transition:none; } }
  /* --- bots vs humans --- */
  /* Live match scoreboard — a contested tug-of-war bar (human green vs bot accent). */
  .match{ margin:0 0 20px; padding:16px 18px 14px; background:var(--surface-2); border:1px solid var(--border); border-radius:14px; }
  .match-top{ display:flex; justify-content:space-between; align-items:baseline; margin-bottom:10px; font-family:var(--mono); }
  .match-eyebrow{ font-size:10px; letter-spacing:.18em; color:var(--accent); }
  .match-metric{ font-size:10px; letter-spacing:.08em; color:var(--muted); text-transform:uppercase; }
  .match-bar{ position:relative; display:flex; height:30px; border-radius:8px; overflow:hidden; border:1px solid var(--border); }
  .match-seg{ display:flex; align-items:center; min-width:0; transition:width .6s cubic-bezier(.2,.7,.2,1); }
  .match-human{ background:color-mix(in srgb, var(--pos) 30%, transparent); justify-content:flex-start; }
  .match-bot{ background:color-mix(in srgb, var(--accent) 30%, transparent); justify-content:flex-end; }
  .match-seg-label{ font-family:var(--mono); font-size:11px; font-weight:700; color:var(--text); padding:0 10px; white-space:nowrap; }
  .match-divider{ position:absolute; top:-3px; bottom:-3px; width:2px; background:var(--text); transform:translateX(-1px); box-shadow:0 0 8px color-mix(in srgb, var(--text) 60%, transparent); }
  .match-read{ margin:9px 0 0; font-size:13px; color:var(--muted); }
  .match-read strong{ color:var(--text); }
  .versus{ display:grid; grid-template-columns:1fr auto 1fr; align-items:stretch; gap:16px; margin-bottom:18px; }
  .cohort{ background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:22px 22px 10px; display:flex; flex-direction:column; }
  .cohort-lead{ border-color:color-mix(in srgb,var(--accent) 55%,var(--border)); box-shadow:0 0 0 1px color-mix(in srgb,var(--accent) 20%,transparent) inset; }
  .cohort-head{ display:flex; align-items:center; gap:10px; margin-bottom:16px; }
  .cohort-count{ font-size:13px; color:var(--muted); }
  .cohort-count .unit{ font-size:11px; }
  .cohort-badge{ margin-left:auto; font-family:var(--mono); font-size:9px; font-weight:700; letter-spacing:.14em; color:var(--bg); background:var(--accent); border-radius:5px; padding:3px 7px; }
  .cohort-equity{ font-size:34px; font-weight:700; line-height:1; }
  .cohort-eqlabel{ font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); margin:6px 0 18px; }
  /* the cohort as one nation — members' holdings aggregated into a single country skyline */
  .cohort-nation{ margin:0 0 18px; }
  .cohort-metrics{ display:grid; grid-template-columns:1fr 1fr; gap:14px 18px; margin:0; }
  .cohort-metrics div{ display:flex; flex-direction:column; gap:4px; }
  .cohort-metrics dt{ font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }
  .cohort-metrics dd{ margin:0; font-size:15px; font-weight:600; }
  .versus-mid{ display:flex; align-items:center; justify-content:center; }
  .vs{ font-family:var(--mono); font-size:13px; font-weight:700; letter-spacing:.1em; color:var(--muted); border:1px solid var(--border); border-radius:999px; width:44px; height:44px; display:flex; align-items:center; justify-content:center; }
  .versus-read{ display:flex; flex-wrap:wrap; gap:10px 28px; padding:16px 20px; background:var(--surface-2); border:1px solid var(--border); border-radius:12px; font-size:14px; color:var(--muted); }
  .versus-read strong{ color:var(--text); }
  @media (max-width:720px){ .versus{ grid-template-columns:1fr; } .versus-mid{ padding:4px 0; } }
  /* --- comparison --- */
  .cmp-vs{ color:var(--muted); font-weight:500; font-size:18px; }
  .cmp-grid{ display:grid; grid-template-columns:1fr minmax(160px,auto) 1fr; gap:16px; align-items:start; margin-bottom:26px; }
  .cmp-col{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:20px; }
  .cmp-who{ display:flex; align-items:center; gap:9px; margin-bottom:12px; flex-wrap:wrap; }
  .cmp-name{ font-size:16px; font-weight:700; color:var(--text); text-decoration:none; }
  .cmp-name:hover{ color:var(--accent); }
  .cmp-equity{ font-size:28px; font-weight:700; margin-bottom:14px; }
  .cmp-metrics{ display:grid; grid-template-columns:1fr 1fr; gap:12px 16px; margin:0; }
  .cmp-metrics div{ display:flex; flex-direction:column; gap:3px; }
  .cmp-metrics dt{ font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); }
  .cmp-metrics dd{ margin:0; font-size:14px; font-weight:600; }
  .cmp-mid{ display:flex; flex-direction:column; gap:10px; padding:16px 12px; background:var(--surface-2); border:1px solid var(--border); border-radius:14px; }
  .cmp-delta{ display:flex; flex-direction:column; gap:2px; text-align:center; }
  .cmp-dlabel{ font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted); }
  .cmp-dval{ font-size:14px; font-weight:700; }
  .cmp-legend{ margin-top:4px; font-size:10px; color:var(--muted); text-align:center; }
  .cmp-holdhead{ margin-top:6px; }
  .cmp-holdings{ width:100%; border-collapse:collapse; font-size:14px; }
  .cmp-holdings td{ padding:9px 10px; border-bottom:1px solid color-mix(in srgb,var(--border) 55%,transparent); }
  .cmp-holdings tr:last-child td{ border-bottom:none; }
  .cmp-sym{ text-align:center; font-family:var(--mono); font-weight:600; }
  .cmp-aval{ text-align:right; } .cmp-bval{ text-align:left; }
  .cmp-tag{ font-family:var(--mono); font-size:8px; letter-spacing:.1em; color:var(--accent); border:1px solid color-mix(in srgb,var(--accent) 40%,transparent); border-radius:4px; padding:1px 5px; margin-left:6px; vertical-align:middle; }
  .cmp-shared{ background:color-mix(in srgb,var(--accent) 5%,transparent); }
  .aheavy .cmp-aval{ color:var(--accent); font-weight:700; } .bheavy .cmp-bval{ color:var(--accent); font-weight:700; }
  .cmp-picker{ display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px; }
  .cmp-pick{ display:flex; align-items:center; gap:9px; padding:14px 16px; background:var(--surface); border:1px solid var(--border); border-radius:11px; text-decoration:none; color:var(--text); font-weight:600; transition:border-color .15s; }
  .cmp-pick:hover{ border-color:color-mix(in srgb,var(--accent) 50%,var(--border)); }
  @media (max-width:720px){ .cmp-grid{ grid-template-columns:1fr; } }
  /* --- Academy (/learn): the gamified trading journey --- */
  .academy{ max-width:900px; }
  .hud{ display:flex; align-items:center; gap:22px; flex-wrap:wrap; background:var(--surface); border:1px solid color-mix(in srgb,var(--accent) 35%,var(--border));
    border-radius:14px; padding:16px 22px; margin-bottom:22px; }
  .hud-stat{ display:flex; flex-direction:column; gap:2px; }
  .hud-k{ font-family:var(--mono); font-size:9px; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); }
  .hud-v{ font-size:22px; font-weight:800; letter-spacing:-.01em; }
  .hud-of{ font-family:var(--mono); font-size:11px; color:var(--muted); }
  .hud-bar{ flex:1; min-width:140px; height:8px; border-radius:5px; background:color-mix(in srgb,var(--muted) 18%,transparent); overflow:hidden; }
  .hud-bar i{ display:block; height:100%; width:0; border-radius:5px; background:var(--accent); transition:width .35s ease; }
  .wheel{ background:linear-gradient(135deg, color-mix(in srgb,var(--accent) 7%,var(--surface-2)), var(--surface-2));
    border:1px solid var(--border); border-radius:14px; padding:22px 24px; margin-bottom:24px; }
  .wheel h2{ font-size:16px; margin-bottom:6px; }
  .wheel-lede{ font-size:13px; color:var(--muted); line-height:1.55; max-width:66ch; margin-bottom:16px; }
  .wheel-steps{ list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; counter-reset:none; }
  .wheel-steps li{ background:var(--surface); border:1px solid var(--border); border-radius:11px; padding:14px 16px; display:flex; flex-direction:column; gap:5px; }
  .wheel-n{ width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-weight:700; font-size:13px; color:var(--bg); background:var(--accent); }
  .wheel-t{ font-size:13.5px; font-weight:700; } .wheel-d{ font-size:12px; color:var(--muted); line-height:1.5; }
  .courses{ display:flex; flex-direction:column; gap:16px; }
  .course{ border:1px solid var(--border); border-radius:14px; background:var(--surface-2); overflow:hidden; }
  .course[open]{ border-color:color-mix(in srgb,var(--accent) 35%,var(--border)); }
  .course.locked{ opacity:.6; }
  .course > summary{ list-style:none; cursor:pointer; display:flex; align-items:flex-start; gap:14px; padding:16px 20px; }
  .course > summary::-webkit-details-marker{ display:none; }
  .course-badge{ flex:0 0 auto; width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center;
    font-family:var(--mono); font-weight:700; font-size:14px; color:var(--bg); background:var(--accent); }
  .course.locked .course-badge{ background:var(--muted); }
  .course-h{ flex:1; display:flex; flex-direction:column; gap:4px; }
  .course-title{ font-size:15px; font-weight:700; }
  .course-sub{ font-size:12.5px; color:var(--muted); line-height:1.5; }
  .course-prog{ display:flex; align-items:center; gap:10px; margin-top:4px; }
  .course-bar{ flex:1; max-width:220px; height:6px; border-radius:4px; background:color-mix(in srgb,var(--muted) 18%,transparent); overflow:hidden; }
  .course-bar i{ display:block; height:100%; width:0; border-radius:4px; background:var(--pos); transition:width .3s ease; }
  .course-count{ font-family:var(--mono); font-size:10px; color:var(--muted); }
  .course-lock{ font-family:var(--mono); font-size:10px; letter-spacing:.08em; color:var(--muted); white-space:nowrap; }
  .lvl-chev{ color:var(--muted); transition:transform .2s; } .course[open] .lvl-chev{ transform:rotate(90deg); }
  .ms-list{ padding:2px 20px 18px; display:flex; flex-direction:column; gap:8px; }
  .ms{ display:flex; align-items:flex-start; gap:12px; background:var(--surface); border:1px solid var(--border); border-radius:11px; padding:13px 15px; cursor:pointer; transition:border-color .15s; }
  .ms:hover{ border-color:color-mix(in srgb,var(--accent) 40%,var(--border)); }
  .ms-check{ position:absolute; opacity:0; width:0; height:0; }
  .ms-mark{ flex:0 0 auto; width:22px; height:22px; border-radius:6px; border:1.5px solid var(--border); display:flex; align-items:center; justify-content:center;
    font-size:12px; color:transparent; transition:all .15s; margin-top:1px; }
  .ms:has(.ms-check:checked) .ms-mark{ background:var(--pos); border-color:var(--pos); color:var(--bg); }
  .ms:has(.ms-check:checked) .ms-title{ color:var(--muted); text-decoration:line-through; }
  .ms:focus-within{ outline:2px solid var(--accent); outline-offset:2px; }
  .ms-body{ flex:1; display:flex; flex-direction:column; gap:2px; }
  .ms-title{ font-size:13.5px; font-weight:700; }
  .ms-detail{ font-size:12px; color:var(--muted); line-height:1.5; }
  .ms-pts{ flex:0 0 auto; font-family:var(--mono); font-size:11px; font-weight:700; color:var(--accent); }
  .more-soon{ margin-top:20px; font-family:var(--mono); font-size:11px; letter-spacing:.06em; color:var(--muted); line-height:1.6; }
  @media (max-width:720px){ .hud-v{ font-size:19px; } }
</style>`;
