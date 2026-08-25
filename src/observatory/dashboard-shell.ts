import { escapeHtml } from "../ui/escape-html.js";
import { formatTimestamp, profileHref } from "./render-atoms.js";
import { SHELL_STYLE } from "./shell-style.js";

/**
 * The push-drawer APP SHELL shared by every logged-in observatory view: the drawer nav, the
 * design-token stylesheet, and the wrapper that either renders the bare embeddable body (Artifact
 * publishing) or the full drawer shell. Every `render*Body` view delegates its final wrap to
 * `renderShell` so the drawer/toggle/style stay identical across views.
 */

/** Which top-level view is active, for the shared nav. */
export type NavView =
  | "board"
  | "trade"
  | "leaderboard"
  | "bots"
  | "compare"
  | "research"
  | "you"
  | "add"
  | "learn"
  | "feedback";

export interface NavContext {
  readonly active: NavView;
  /** The signed-in viewer's participant id, if resolved — powers the "You" tab + self marker. */
  readonly currentId?: string;
  readonly canAdd: boolean;
  readonly authed: boolean;
  /** Owner-only: link Mission Control + show the desk's Settings tab. Members see neither. */
  readonly canControl?: boolean;
  /** Owner-only: link the guest list (`/invite`). Members see neither the link nor the page. */
  readonly canInvite?: boolean;
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
  trade: "⇅",
  compare: "⇄",
  research: "◷",
  leaderboard: "≣",
  bots: "◆",
  you: "◉",
  add: "＋",
  learn: "◈",
  feedback: "✎",
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
  // Trade is global chrome — one click from every screen (desk-v2 handoff). The ticket
  // renders honestly in every state, so the link never needs gating.
  links.push(drawerLink("/trade", "Trade", "trade", nav.active === "trade"));
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
  links.push(drawerLink("/research", "Research", "research", nav.active === "research"));
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
  if (nav.currentId) {
    foot.push(
      `<a class="dnav-link dnav-muted" href="/account"><span class="dnav-ico" aria-hidden="true">⚙</span><span class="dnav-label">Manage account</span></a>`,
    );
  }
  if (nav.canControl) {
    foot.push(
      `<a class="dnav-link dnav-muted" href="${nav.currentId ? `${profileHref(nav.currentId)}?tab=settings` : "/controls"}"><span class="dnav-ico" aria-hidden="true">⛭</span><span class="dnav-label">Mission Control</span></a>`,
    );
  }
  if (nav.canInvite) {
    foot.push(
      `<a class="dnav-link dnav-muted" href="/invite"><span class="dnav-ico" aria-hidden="true">✉</span><span class="dnav-label">Guest list</span></a>`,
    );
  }
  foot.push(drawerLink(FEEDBACK_URL, "Feedback", "feedback", nav.active === "feedback"));
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
    return `${SHELL_STYLE}
<div class="obs" id="root">${content}</div>`;
  }
  return `${SHELL_STYLE}
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
