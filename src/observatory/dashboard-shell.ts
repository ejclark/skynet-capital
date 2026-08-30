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
  | "wire"
  | "trade"
  | "research"
  | "collections"
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
  /**
   * Owner-only: link `/claim` — pick an unowned board account by name and attach it to a
   * member's email, no keys and no account id typed. Without this link the page existed but
   * nobody could find it (Eric, 2026-08-25: pointed at an env-var workaround instead, because
   * this — the actual zero-typing fix — had no way in from the app).
   */
  readonly canClaim?: boolean;
  /** Owner-only: link `/ops-status` — the read-only bots/deploy health panel (#666). Members
   *  see neither the link nor the page. */
  readonly canOpsStatus?: boolean;
}

export interface DashboardViewOptions {
  /** Render the shared top nav (logged-in shell). Omit for the bare embeddable body. */
  readonly nav?: NavContext;
}

/** In-app "Feedback" links point at the self-service form (no GitHub account needed). */
const FEEDBACK_URL = "/feedback";

const NAV_ICON: Record<string, string> = {
  board: "▦",
  wire: "▤",
  trade: "⇅",
  research: "◷",
  collections: "⬡",
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
  const links: string[] = [];
  // Portfolio leads the nav (consolidation study, 2026-08-25): the member's home is their own
  // accounts index (/u), one level above each desk — "You" renamed, the `"you"` discriminant kept.
  if (nav.currentId) {
    links.push(drawerLink("/u", "Portfolio", "you", nav.active === "you"));
  }
  links.push(drawerLink("/", "Standings", "board", nav.active === "board"));
  // The Wire (2026-08-25): who's trading, what's booked, what's open — the shared activity/status
  // board. Sits beside Standings — both are "what's happening" views, just sliced differently.
  links.push(drawerLink("/wire", "The Wire", "wire", nav.active === "wire"));
  // Trade is global chrome — one click from every screen (desk-v2 handoff). The ticket
  // renders honestly in every state, so the link never needs gating.
  links.push(drawerLink("/trade", "Trade", "trade", nav.active === "trade"));
  links.push(drawerLink("/research", "Research", "research", nav.active === "research"));
  // Collections: the browse surface for the bot and play catalogs — narrative shelves rather than
  // an alphabetical roster. Sits beside Research: both are "go and read" views.
  links.push(
    drawerLink("/collections", "Collections", "collections", nav.active === "collections"),
  );
  // "Milestones", not "Learn" (Eric, 2026-08-25): they're captured achievements, not homework.
  links.push(drawerLink("/learn", "Milestones", "learn", nav.active === "learn"));
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
  if (nav.canClaim) {
    foot.push(
      `<a class="dnav-link dnav-muted" href="/claim"><span class="dnav-ico" aria-hidden="true">⛓</span><span class="dnav-label">Account links</span></a>`,
    );
  }
  if (nav.canOpsStatus) {
    foot.push(
      `<a class="dnav-link dnav-muted" href="/ops-status"><span class="dnav-ico" aria-hidden="true">⚑</span><span class="dnav-label">Ops status</span></a>`,
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
