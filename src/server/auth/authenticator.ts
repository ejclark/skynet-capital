import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  type FetchFn,
  type OAuthProvider,
  type ProviderId,
  githubProvider,
  googleProvider,
} from "./providers.js";
import {
  type Session,
  clearSessionCookie,
  cookie,
  parseCookies,
  sessionCookie,
  sessionTokenFromCookies,
  signSession,
  verifySession,
} from "./session.js";

type Env = Readonly<Record<string, string | undefined>>;

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const STATE_COOKIE = "skynet_oauth_state";

/**
 * App version, read from package.json at startup (semantic-release bumps it). Shown subtly on the
 * login page. The repo is private, so it stays plain text — no link to a changelog/release yet.
 */
const APP_VERSION: string = (() => {
  try {
    const url = new URL("../../../package.json", import.meta.url);
    const parsed: unknown = JSON.parse(readFileSync(url, "utf8"));
    const v = (parsed as { version?: unknown }).version;
    return typeof v === "string" ? v : "";
  } catch {
    return "";
  }
})();

export interface AuthDeps {
  readonly fetchFn?: FetchFn;
  readonly now?: () => number;
}

/**
 * In-app OAuth login. Replaces the shared `?key=` gate with real per-user sign-in
 * (Google/GitHub) plus an email/login allowlist, backed by a signed session cookie.
 * Enabled only when a session secret and at least one provider are configured — otherwise
 * `resolveAuth` returns undefined and the server keeps its legacy behavior (localhost/offline).
 */
export class Authenticator {
  private readonly providers: Map<ProviderId, OAuthProvider>;
  private readonly secret: string;
  private readonly allowedEmails: Set<string>;
  private readonly allowedLogins: Set<string>;
  private readonly fetchFn: FetchFn;
  private readonly now: () => number;

  constructor(config: {
    providers: OAuthProvider[];
    secret: string;
    allowedEmails: Set<string>;
    allowedLogins: Set<string>;
    deps?: AuthDeps;
  }) {
    this.providers = new Map(config.providers.map((p) => [p.id, p]));
    this.secret = config.secret;
    this.allowedEmails = config.allowedEmails;
    this.allowedLogins = config.allowedLogins;
    this.fetchFn = config.deps?.fetchFn ?? fetch;
    this.now = config.deps?.now ?? Date.now;
  }

  get providerIds(): ProviderId[] {
    return [...this.providers.keys()];
  }

  /** True when nobody can actually get in — surfaced as a startup warning. */
  get allowlistEmpty(): boolean {
    return this.allowedEmails.size === 0 && this.allowedLogins.size === 0;
  }

  /** The signed-in session on this request, or undefined. */
  sessionFrom(req: IncomingMessage): Session | undefined {
    const token = sessionTokenFromCookies(req.headers.cookie);
    return token ? verifySession(token, this.secret, this.now()) : undefined;
  }

  /**
   * Handle `/auth/<provider>` (start) and `/auth/<provider>/callback` (finish). Returns
   * true when it owned the request. `base` is the external origin, e.g. https://host.
   */
  async handleAuthRoute(
    req: IncomingMessage,
    res: ServerResponse,
    path: string,
    base: string,
  ): Promise<boolean> {
    const match = /^\/auth\/(google|github)(\/callback)?$/.exec(path);
    if (!match) {
      return false;
    }
    const provider = this.providers.get(match[1] as ProviderId);
    if (!provider) {
      redirect(res, "/login");
      return true;
    }
    const secure = base.startsWith("https");
    const redirectUri = `${base}/auth/${provider.id}/callback`;

    if (!match[2]) {
      // Start: set a state cookie and bounce to the provider.
      const state = randomBytes(16).toString("hex");
      res.setHeader(
        "set-cookie",
        cookie(STATE_COOKIE, state, {
          maxAgeMs: 10 * 60 * 1000,
          secure,
          httpOnly: true,
          sameSite: "Lax",
        }),
      );
      redirect(res, provider.authorizeUrl(redirectUri, state));
      return true;
    }

    // Callback: validate state, exchange the code, check the allowlist, set the session.
    const url = new URL(req.url ?? "/", base);
    const state = url.searchParams.get("state") ?? "";
    const code = url.searchParams.get("code") ?? "";
    const expected = parseCookies(req.headers.cookie)[STATE_COOKIE];
    if (!code || !state || !expected || state !== expected) {
      res.writeHead(400, { "content-type": "text/html; charset=utf-8" });
      res.end(this.loginPage("Sign-in expired or was tampered with. Please try again."));
      return true;
    }

    let identity: Awaited<ReturnType<OAuthProvider["exchange"]>>;
    try {
      identity = await provider.exchange(code, redirectUri, this.fetchFn);
    } catch {
      res.writeHead(502, { "content-type": "text/html; charset=utf-8" });
      res.end(this.loginPage(`Couldn't complete ${provider.label} sign-in. Please try again.`));
      return true;
    }

    if (!this.isAllowed(identity.email, identity.login)) {
      res.writeHead(403, { "content-type": "text/html; charset=utf-8" });
      res.end(
        this.loginPage(
          `${identity.email ?? "That account"} isn't on the guest list. Ask Eric to add you.`,
        ),
      );
      return true;
    }

    const session: Session = {
      email: (identity.email ?? identity.login ?? "unknown").toLowerCase(),
      provider: provider.id,
      ...(identity.name ? { name: identity.name } : {}),
      exp: this.now() + SESSION_TTL_MS,
    };
    res.writeHead(302, {
      location: "/",
      "set-cookie": sessionCookie(signSession(session, this.secret), SESSION_TTL_MS, secure),
    });
    res.end();
    return true;
  }

  clearCookie(secure: boolean): string {
    return clearSessionCookie(secure);
  }

  private isAllowed(email?: string, login?: string): boolean {
    if (email && this.allowedEmails.has(email.toLowerCase())) {
      return true;
    }
    return Boolean(login && this.allowedLogins.has(login.toLowerCase()));
  }

  /** The sign-in page: one button per configured provider. */
  loginPage(error?: string): string {
    const buttons = this.providerIds
      .map((id, i) => {
        const label = this.providers.get(id)?.label ?? id;
        return `<a class="btn btn-${id}" href="/auth/${id}" style="--i:${i}">
        ${providerGlyph(id)}
        <span>Continue with ${escapeHtml(label)}</span>
        <svg class="btn-arrow" viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"/></svg>
      </a>`;
      })
      .join("\n      ");
    const banner = error ? `<p class="error" role="alert">${escapeHtml(error)}</p>` : "";
    // Subtle build stamp. Repo is private, so it's plain text for now (no changelog/release link yet).
    const versionTag = APP_VERSION ? `<div class="version">v${escapeHtml(APP_VERSION)}</div>` : "";
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in — Skynet Capital</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{
    --bg:#0B0F14; --surface:#131A22; --surface-2:#0F151C; --border:#223041;
    --text:#E6EDF3; --muted:#8B9AAB; --accent:#35D0BA; --pos:#3FB950; --neg:#F85149;
    --mono:ui-monospace,"JetBrains Mono","SF Mono",Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  }
  @media (prefers-color-scheme:light){
    :root{ --bg:#F7F9FB; --surface:#FFFFFF; --surface-2:#F0F4F8; --border:#DCE3EA;
      --text:#0B0F14; --muted:#5A6B7B; --accent:#0E9F8C; --pos:#1A7F37; --neg:#CF222E; }
  }
  :root[data-theme="dark"]{ --bg:#0B0F14; --surface:#131A22; --surface-2:#0F151C; --border:#223041;
    --text:#E6EDF3; --muted:#8B9AAB; --accent:#35D0BA; --pos:#3FB950; --neg:#F85149; }
  :root[data-theme="light"]{ --bg:#F7F9FB; --surface:#FFFFFF; --surface-2:#F0F4F8; --border:#DCE3EA;
    --text:#0B0F14; --muted:#5A6B7B; --accent:#0E9F8C; --pos:#1A7F37; --neg:#CF222E; }

  /* Reveal VFX: a grainy chromatic "hangar door" sweep, canvas-rendered above the scene but behind
     the title so the wordmark blooms through the opening light. Only lit during the ~1s reveal. */
  #vfx{ position:fixed; inset:0; width:100%; height:100%; z-index:5; pointer-events:none; opacity:0; }
  html,body{ height:100%; }
  body{
    font-family:var(--sans); color:var(--text); min-height:100vh; overflow:hidden;
    display:flex; align-items:flex-end; justify-content:center;
    padding:24px 24px clamp(26px,7vh,74px);   /* anchor the console to the lower third */
    background:
      radial-gradient(80% 60% at 50% -10%, color-mix(in srgb,var(--accent) 15%,transparent), transparent 65%),
      radial-gradient(60% 50% at 85% 110%, color-mix(in srgb,var(--pos) 10%,transparent), transparent 60%),
      var(--bg);
    perspective:1200px;
  }

  /* Ambient Matrix rain (deepest layer) + living market backdrop above it */
  #rain{ position:fixed; inset:0; width:100%; height:100%; z-index:0; pointer-events:none; opacity:.32; }
  #stage{ position:fixed; inset:0; width:100%; height:100%; z-index:1; pointer-events:none; }
  .vignette{ position:fixed; inset:0; z-index:3; pointer-events:none;
    background:radial-gradient(120% 90% at 50% 40%, transparent 45%, color-mix(in srgb,var(--bg) 82%,transparent) 100%); }

  @keyframes beam{ 0%{ transform:translateY(-40%); opacity:0; } 12%{ opacity:1; } 88%{ opacity:1; } 100%{ transform:translateY(240%); opacity:0; } }

  /* Top-center brand — primary real estate; the animation owns the rest of the screen */
  /* Single wordmark — top-center hero at rest; flies into the form on reveal (see .mark flight) */
  .topbrand{ position:fixed; z-index:6; top:clamp(20px,5vh,52px); left:0; right:0; text-align:center; pointer-events:none; }
  .topbrand .mark{ font-size:clamp(34px,6.4vw,58px); font-weight:700; letter-spacing:.15em; margin:0;
    transform-origin:center center; will-change:transform;
    transition:transform .66s cubic-bezier(.16,.84,.44,1); }
  .topbrand .mark b{ color:var(--accent); text-shadow:0 0 20px color-mix(in srgb,var(--accent) 65%,transparent); }
  /* Secondary (pill) + tertiary line — the idle identity below the title; fade out on reveal */
  .herosub{ margin-top:16px; display:flex; flex-direction:column; align-items:center; gap:10px;
    transition:opacity .4s ease, transform .4s ease; }
  .pill{ display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border-radius:999px;
    border:1px solid color-mix(in srgb,var(--accent) 34%,var(--border)); background:color-mix(in srgb,var(--surface) 60%,transparent);
    font-family:var(--mono); font-size:11px; letter-spacing:.28em; text-transform:uppercase; color:var(--text);
    backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); }
  .pill .live{ width:6px; height:6px; border-radius:50%; background:var(--accent);
    box-shadow:0 0 10px 1px var(--accent); animation:pulse 2.4s ease-out infinite; }
  .tertiary{ font-family:var(--mono); font-size:clamp(9px,1.2vw,11px); letter-spacing:.42em;
    text-transform:uppercase; color:var(--muted); }
  /* PLAY · EXPERIMENT · LEARN — the ethos triad, now with PLAY as the entry to the Playbook.
     EXPERIMENT / LEARN stay inert for now (seams for emergent buckets). */
  .modes{ display:flex; align-items:center; gap:.7em; }
  .modes .sep{ opacity:.5; }
  .mode{ font-family:var(--mono); font-size:inherit; letter-spacing:inherit; text-transform:uppercase;
    color:var(--muted); background:none; border:0; padding:0; }
  .mode.inert{ opacity:.62; }
  /* PLAY: subtle affordance — a low-key dotted underline that lights on hover/focus/open, so it
     invites without shouting "menu" and doesn't break the calm triad read. */
  .mode.call, .mode.learn{ pointer-events:auto; cursor:pointer; color:var(--muted); position:relative;
    border-bottom:1px dotted color-mix(in srgb,var(--muted) 60%,transparent);
    transition:color .2s ease, border-color .2s ease, text-shadow .2s ease; }
  .mode.call:hover, .mode.call:focus-visible, .modes.open .mode.call,
  .mode.learn:hover, .mode.learn:focus-visible, .learn[aria-expanded="true"]{
    color:var(--accent); border-bottom-color:var(--accent);
    text-shadow:0 0 12px color-mix(in srgb,var(--accent) 55%,transparent); }
  .mode.call:focus-visible, .mode.learn:focus-visible{ outline:2px solid var(--accent); outline-offset:3px; border-radius:2px; }
  /* Playbook popover — compact mono list of callable plays; hidden until PLAY invites it. */
  .playbook{ pointer-events:auto; display:flex; flex-wrap:wrap; justify-content:center; gap:6px 16px;
    max-width:min(92vw,560px); margin-top:2px; opacity:0; visibility:hidden; transform:translateY(-6px);
    transition:opacity .26s ease, transform .26s ease, visibility 0s linear .26s; }
  .playbook.open{ opacity:1; visibility:visible; transform:none; transition-delay:0s; }
  .play{ font-family:var(--mono); font-size:clamp(9px,1.1vw,11px); letter-spacing:.18em; text-transform:uppercase;
    color:var(--muted); background:none; border:0; padding:2px 3px; cursor:pointer;
    transition:color .18s ease, text-shadow .18s ease; }
  .play:hover, .play:focus-visible{ color:var(--accent);
    text-shadow:0 0 10px color-mix(in srgb,var(--accent) 55%,transparent); }
  .play:focus-visible{ outline:1px solid var(--accent); outline-offset:2px; border-radius:2px; }
  .play.active{ color:var(--accent); }
  .play.active::before{ content:"● "; }
  .play .tier{ display:inline-block; margin-right:.5em; font-size:.82em; letter-spacing:.1em; opacity:.55; }
  .play:hover .tier, .play:focus-visible .tier, .play.active .tier{ opacity:.9; }
  .learn[aria-expanded="true"]{ color:var(--accent); }
  .glossary{ pointer-events:auto; box-sizing:border-box; width:min(92vw,440px); margin:8px auto 0; text-align:left;
    padding:12px 16px; border:1px solid color-mix(in srgb,var(--accent) 32%,transparent); border-radius:10px;
    background:color-mix(in srgb,var(--bg) 88%,transparent); backdrop-filter:blur(4px);
    opacity:0; visibility:hidden; transform:translateY(-6px);
    transition:opacity .26s ease, transform .26s ease, visibility 0s linear .26s; }
  .glossary.open{ opacity:1; visibility:visible; transform:none; transition-delay:0s; }
  .glossary .gtitle{ font-family:var(--mono); font-size:10px; letter-spacing:.28em; color:var(--accent);
    margin:0 0 8px; text-transform:uppercase; }
  .glossary dl{ margin:0; display:grid; grid-template-columns:auto 1fr; gap:5px 12px; }
  .glossary dt{ font-family:var(--mono); font-size:9.5px; letter-spacing:.14em; color:var(--accent); opacity:.85; white-space:nowrap; }
  .glossary dd{ margin:0; font-family:var(--mono); font-size:10px; line-height:1.45; color:var(--muted); }
  /* Playcall transport — a minimal HUD stepper shown only during a manual playcall (where the user
     is deliberately engaging). Lets you pause and step act-by-act: signal → predict → realize → resolve. */
  .transport{ display:none; align-items:center; gap:12px; margin-top:2px; font-family:var(--mono); pointer-events:auto; }
  body.manualplay .transport{ display:flex; }
  body.manualplay .modes, body.manualplay .playbook{ display:none; }   /* transport takes the slot during a manual play */
  .tbtn{ background:none; border:1px solid color-mix(in srgb,var(--accent) 34%,var(--border)); color:var(--accent);
    width:26px; height:22px; border-radius:5px; font-size:9px; line-height:1; cursor:pointer;
    display:inline-flex; align-items:center; justify-content:center; transition:border-color .15s ease, color .15s ease; }
  .tbtn:hover{ border-color:var(--accent); color:var(--text); }
  .tbtn:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .tacts{ display:inline-flex; gap:10px; font-size:9px; letter-spacing:.24em; }
  .tacts b{ font-weight:700; color:color-mix(in srgb,var(--muted) 70%,transparent); transition:color .15s ease; }
  .tacts b.on{ color:var(--accent); text-shadow:0 0 8px color-mix(in srgb,var(--accent) 55%,transparent); }
  /* When the form is open the whole hero fades — make sure the menu can't catch clicks then. */
  body.revealed .modes, body.revealed .playbook, body.flying .modes, body.flying .playbook{ pointer-events:none; }
  body.revealed .herosub, body.flying .herosub{ opacity:0; transform:translateY(-8px); pointer-events:none; }

  /* Cursor VFX — dialed WAY back to ambient; the dramatic burst is reserved for one reveal moment */
  .cursorglow{ position:fixed; inset:0; z-index:2; pointer-events:none; opacity:0; transition:opacity .5s ease;
    background:radial-gradient(140px 140px at var(--cx,50%) var(--cy,40%),
      color-mix(in srgb,var(--accent) 7%,transparent), transparent 70%); mix-blend-mode:screen; }
  body.finepointer .cursorglow{ opacity:1; }

  /* Chromatic-aberration wordmark — subtle at rest; amps into the VFX-text-cursor on reveal. */
  .mark[data-text]{ position:relative; }
  .mark[data-text]::before, .mark[data-text]::after{ content:attr(data-text); position:absolute; left:0; top:0;
    width:100%; opacity:calc(.26 + var(--vfx,0)*.6); pointer-events:none; mix-blend-mode:screen; letter-spacing:inherit; }
  .mark[data-text]::before{ color:#FF2D95; transform:translate(calc(var(--cax,0px)*-1), calc(var(--cay,0px)*-1)); }
  .mark[data-text]::after{ color:#22E0C8; transform:translate(var(--cax,0px), var(--cay,0px)); }
  /* Title bloom, synced to the canvas hangar-door sweep: the wordmark flares white-hot with a brief
     chromatic split as the opening light passes it, then settles. */
  @property --vfx{ syntax:"<number>"; inherits:true; initial-value:0; }
  @property --cax{ syntax:"<length>"; inherits:true; initial-value:0px; }
  @property --cay{ syntax:"<length>"; inherits:true; initial-value:0px; }
  @keyframes vfxbloom{
    0%{ --vfx:0; --cax:0px; --cay:0px; text-shadow:none; }
    42%{ --vfx:1; --cax:-9px; --cay:1px;
      text-shadow:0 0 34px #EAFBF7, 0 0 70px color-mix(in srgb,var(--accent) 90%,transparent),
        14px 0 26px color-mix(in srgb,#FF2D95 45%,transparent),
        -14px 0 26px color-mix(in srgb,#22E0C8 45%,transparent); }
    70%{ --cax:6px; }
    100%{ --vfx:0; --cax:0px; --cay:0px; text-shadow:none; } }
  .mark.vfx{ animation:vfxbloom .95s cubic-bezier(.16,.84,.44,1) both; }

  /* Single toggle — dead-centered on the RING (fixed width, so the label never shifts it), and
     static when toggling: the button stays put, only the chevron flips (up = enter, down = close). */
  .beacon{ position:fixed; z-index:6; left:50%; bottom:clamp(22px,5vh,52px); transform:translateX(-50%);
    width:56px; display:flex; flex-direction:column; align-items:center; cursor:pointer;
    background:none; border:0; color:var(--text); font-family:var(--sans); }
  .beacon-label{ position:absolute; top:100%; left:50%; transform:translateX(-50%); margin-top:12px; white-space:nowrap;
    font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); transition:color .2s ease; }
  .beacon:hover .beacon-label{ color:var(--text); }
  .beacon-ring{ position:relative; display:flex; align-items:center; justify-content:center; width:52px; height:52px;
    border-radius:50%; border:1px solid color-mix(in srgb,var(--accent) 55%,transparent);
    box-shadow:0 0 24px -4px color-mix(in srgb,var(--accent) 70%,transparent); animation:beacon 2.4s ease-out infinite; }
  .beacon-chev{ display:block; width:22px; height:22px; color:var(--accent);
    transition:transform .35s cubic-bezier(.16,.84,.44,1); }
  @keyframes beacon{ 0%{ box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 45%,transparent); }
    70%{ box-shadow:0 0 0 16px transparent; } 100%{ box-shadow:0 0 0 0 transparent; } }
  body.revealed .beacon-chev{ transform:scaleY(-1); }   /* flip, not rotate — a truer read of the motion */
  body.revealed .beacon-ring{ animation:none; opacity:.32; }

  /* Build stamp — a quiet version marker, bottom-right. No link yet (private repo). */
  .version{ position:fixed; z-index:6; right:14px; bottom:11px; font-family:var(--mono);
    font-size:10px; letter-spacing:.12em; color:color-mix(in srgb,var(--muted) 60%,transparent);
    pointer-events:none; user-select:none; }

  /* Background recede — a scrim drops the live market back so the centered form owns focus */
  .stagescrim{ position:fixed; inset:0; z-index:3; pointer-events:none; opacity:0; transition:opacity .55s ease;
    background:color-mix(in srgb,var(--bg) 88%,transparent); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); }
  body.revealed .stagescrim{ opacity:1; }

  /* Reveal wrapper — larger form, seated low so the toggle's top third overlaps its bottom edge */
  .authwrap{ position:fixed; z-index:5; inset:0; display:flex; align-items:flex-end; justify-content:center;
    padding:clamp(56px,9vh,100px) 20px clamp(92px,13vh,124px); perspective:1200px;
    opacity:0; transform:translateY(30px); pointer-events:none;
    transition:opacity .6s cubic-bezier(.16,.84,.44,1), transform .6s cubic-bezier(.16,.84,.44,1); }
  body.revealed .authwrap{ opacity:1; transform:none; pointer-events:auto; }
  .authwrap .card{ width:100%; max-width:460px; transform-style:preserve-3d; }
  /* Momentary read of the slot's final position for the title FLIP. NOTE: no opacity here —
     forcing opacity:1 during the synchronous measure flashed the form for a frame on reveal. */
  body.measuring .authwrap{ transform:none !important; transition:none !important; }

  /* Reserved landing zone for the flown title + the sign-in sub beneath it */
  .brand-slot{ height:56px; }
  .signin-sub{ margin:6px 0 22px; font-family:var(--mono); font-size:12px; letter-spacing:.3em;
    text-transform:uppercase; color:var(--muted); }
  /* Form falls into place after the title lands — staggered, so it no longer pops all at once */
  .card .signin-sub, .card .btns, .card .foot, .card .error{ opacity:0; transform:translateY(9px);
    transition:opacity .45s ease, transform .45s ease; }
  body.revealed .card .signin-sub{ opacity:1; transform:none; transition-delay:.04s; }
  body.revealed .card .error{ opacity:1; transform:none; transition-delay:.04s; }
  body.revealed .card .btns{ opacity:1; transform:none; transition-delay:.12s; }
  body.revealed .card .foot{ opacity:1; transform:none; transition-delay:.2s; }

  /* Holographic projector — the card is the emitter base; the play projects up into the field */
  .projector{ position:absolute; left:50%; top:0; transform:translate(-50%,-6px);
    width:82%; height:0; pointer-events:none; z-index:1; }
  .projector .emitter{ position:absolute; left:50%; top:0; transform:translate(-50%,-50%);
    width:62%; height:10px; border-radius:50%;
    background:radial-gradient(closest-side, color-mix(in srgb,var(--accent) 85%,transparent), transparent);
    filter:blur(1px); opacity:.7; transition:opacity .5s ease, width .5s ease; }
  .projector .cone{ position:absolute; left:50%; bottom:0; transform:translateX(-50%);
    width:min(70vw,560px); height:min(46vh,340px);
    clip-path:polygon(46% 100%, 54% 100%, 96% 0, 4% 0);
    background:linear-gradient(0deg, color-mix(in srgb,var(--accent) 26%,transparent), transparent 78%);
    opacity:.14; transition:opacity .55s ease; mix-blend-mode:screen; }
  body.playing .projector .emitter{ opacity:1; width:70%; }
  /* The skylight now STEMS FROM the enter/close toggle — a cone rising from the button into the
     field (behind the card). The card's own cone is retired in favor of this. */
  .projector .cone{ display:none; }
  .skylight{ position:fixed; z-index:4; left:50%; bottom:clamp(20px,4.5vh,48px); transform:translateX(-50%);
    width:min(90vw,1060px); height:min(72vh,620px); pointer-events:none; mix-blend-mode:screen;
    clip-path:polygon(45% 100%, 55% 100%, 95% 0, 5% 0);   /* WIDE lens over the whole board (ambient) */
    background:
      linear-gradient(0deg, color-mix(in srgb,var(--accent) 22%,transparent), transparent 84%),
      radial-gradient(50% 44% at 50% 100%, color-mix(in srgb,var(--accent) 34%,transparent), transparent 72%);
    opacity:.26; transition:clip-path .6s cubic-bezier(.16,.84,.44,1), opacity .6s ease; }
  body.playing .skylight{ opacity:.42; }
  /* Reveal NARROWS the lens onto the form: same light over less area → higher intensity, which
     also feeds the title/hero VFX as the beam concentrates. */
  body.flying .skylight, body.revealed .skylight{ clip-path:polygon(45% 100%, 55% 100%, 67% 0, 33% 0); opacity:.52; }

  .card{
    position:relative; width:100%; text-align:center; padding:38px 32px 30px;
    border-radius:20px; transform:translateZ(0); isolation:isolate;
    background:
      linear-gradient(180deg, color-mix(in srgb,var(--surface) 92%,transparent), color-mix(in srgb,var(--surface-2) 96%,transparent));
    border:1px solid transparent;
    box-shadow:
      0 1px 0 0 color-mix(in srgb,#fff 8%,transparent) inset,
      0 40px 90px -40px rgba(0,0,0,.75),
      0 8px 34px -16px color-mix(in srgb,var(--accent) 55%,transparent);
    backdrop-filter:blur(14px) saturate(1.2); -webkit-backdrop-filter:blur(14px) saturate(1.2);
  }
  /* Iridescent holographic border (masked gradient ring) */
  .card::before{ content:""; position:absolute; inset:0; border-radius:20px; padding:1px; z-index:-1;
    background:conic-gradient(from var(--holo,0deg),
      color-mix(in srgb,var(--accent) 85%,transparent), #7CE7FF, color-mix(in srgb,var(--pos) 80%,transparent),
      #B69CFF, color-mix(in srgb,var(--accent) 85%,transparent));
    -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite:xor; mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite:exclude; opacity:.9; animation:holo 8s linear infinite; }
  /* Drifting holographic sheen across the glass */
  .card::after{ content:""; position:absolute; inset:0; border-radius:20px; pointer-events:none; z-index:1;
    background:linear-gradient(var(--sheen,115deg), transparent 38%, color-mix(in srgb,var(--accent) 14%,transparent) 48%,
      color-mix(in srgb,#fff 10%,transparent) 52%, transparent 62%);
    mix-blend-mode:screen; opacity:.7; animation:sheen 9s ease-in-out infinite; }
  .card > *{ position:relative; z-index:2; }
  @property --holo{ syntax:"<angle>"; inherits:false; initial-value:0deg; }
  @keyframes holo{ to{ --holo:360deg; } }
  @keyframes sheen{ 0%,100%{ transform:translateX(-16%); } 50%{ transform:translateX(16%); } }

  /* HUD corner brackets */
  .card .corner{ position:absolute; width:14px; height:14px; border:1.5px solid color-mix(in srgb,var(--accent) 70%,transparent);
    z-index:3; opacity:.8; }
  .card .corner.tl{ top:9px; left:9px; border-right:0; border-bottom:0; }
  .card .corner.tr{ top:9px; right:9px; border-left:0; border-bottom:0; }
  .card .corner.bl{ bottom:9px; left:9px; border-right:0; border-top:0; }
  .card .corner.br{ bottom:9px; right:9px; border-left:0; border-top:0; }

  .brand{ transform:translateZ(26px); }
  .brand .mark{ display:block; font-weight:700; font-size:23px; letter-spacing:.16em;
    animation:glitch 6s steps(1) 1.6s infinite; }
  .brand .mark b{ color:var(--accent); text-shadow:0 0 14px color-mix(in srgb,var(--accent) 60%,transparent); }
  .brand .sub{ display:block; margin-top:8px; font-size:11px; letter-spacing:.3em;
    text-transform:uppercase; color:var(--muted); }
  @keyframes glitch{ 0%,97%,100%{ text-shadow:none; transform:none; }
    97.5%{ transform:translateX(-1.5px); } 98%{ transform:translateX(1.5px); } 98.5%{ transform:none; } }

  .tag{ display:inline-flex; align-items:center; gap:8px; margin:22px 0 4px;
    font-family:var(--mono); font-size:11px; letter-spacing:.14em; color:var(--accent);
    border:1px solid color-mix(in srgb,var(--accent) 55%,var(--border)); border-radius:999px;
    padding:5px 13px; background:color-mix(in srgb,var(--accent) 8%,transparent); }
  .tag .live{ width:6px; height:6px; border-radius:50%; background:var(--accent);
    box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 70%,transparent); animation:pulse 2.4s ease-out infinite; }

  .sub-copy{ color:var(--text); font-size:15px; margin:16px auto 4px; line-height:1.5; max-width:30ch; }
  .sub-copy .em{ color:var(--muted); }
  .ticker{ display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap;
    font-family:var(--mono); font-size:12px; letter-spacing:.1em; color:var(--muted); margin:10px 0 22px; }
  .ticker b{ color:var(--pos); font-weight:600; }
  .ticker .m{ color:var(--accent); }
  .ticker .sep{ opacity:.5; }
  /* Honest "this is a simulated preview" marker; flips to a live badge when /pulse has data */
  .sim{ font-size:9px; letter-spacing:.18em; color:var(--muted); border:1px solid var(--border);
    border-radius:4px; padding:2px 5px; }
  .sim.on-air{ color:var(--accent); border-color:color-mix(in srgb,var(--accent) 55%,var(--border));
    background:color-mix(in srgb,var(--accent) 10%,transparent); }
  /* HUD telemetry row — sells the live command-console feel */
  .hud{ display:flex; align-items:center; justify-content:center; gap:14px; flex-wrap:wrap;
    font-family:var(--mono); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase;
    color:var(--muted); margin:0 0 18px; }
  .hud .on{ display:inline-flex; align-items:center; gap:6px; color:var(--accent); }
  .hud .on i{ width:5px; height:5px; border-radius:50%; background:var(--accent);
    box-shadow:0 0 6px 1px var(--accent); animation:blink 2.2s ease-in-out infinite; }
  @keyframes blink{ 0%,100%{ opacity:1; } 50%{ opacity:.35; } }

  .btns{ display:flex; flex-direction:column; gap:11px; }
  .btn{
    position:relative; display:flex; align-items:center; gap:12px; overflow:hidden;
    padding:13px 16px; border-radius:12px; text-decoration:none; font-weight:600;
    font-size:15px; color:var(--text); background:var(--surface-2);
    border:1px solid var(--border);
    transition:border-color .18s ease, transform .12s ease, box-shadow .18s ease;
  }
  .btn > span{ flex:1 1 auto; text-align:left; }
  .btn svg:not(.btn-arrow){ width:19px; height:19px; flex:0 0 auto; }
  .btn-arrow{ width:16px; height:16px; flex:0 0 auto; color:var(--muted);
    transform:translateX(-4px); opacity:0; transition:transform .2s ease, opacity .2s ease; }
  /* Sheen sweep on hover */
  .btn::after{ content:""; position:absolute; inset:0; border-radius:12px; pointer-events:none;
    background:linear-gradient(105deg, transparent 30%, color-mix(in srgb,var(--accent) 22%,transparent) 50%, transparent 70%);
    transform:translateX(-120%); transition:transform .6s ease; }
  .btn:hover{ border-color:color-mix(in srgb,var(--accent) 60%,var(--border)); transform:translateY(-2px);
    box-shadow:0 10px 24px -14px color-mix(in srgb,var(--accent) 60%,transparent); }
  .btn:hover::after{ transform:translateX(120%); }
  .btn:hover .btn-arrow{ transform:translateX(0); opacity:1; }
  .btn:active{ transform:translateY(0); }
  .btn:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }

  .error{ background:color-mix(in srgb,var(--neg) 16%,transparent); color:var(--neg);
    border:1px solid color-mix(in srgb,var(--neg) 40%,transparent);
    padding:10px 12px; border-radius:10px; margin-bottom:18px; font-size:13px; text-align:left; }
  .foot{ margin-top:24px; font-size:11px; letter-spacing:.04em; color:var(--muted); transform:translateZ(14px); }

  @keyframes pulse{ 0%{ box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 60%,transparent); }
    70%{ box-shadow:0 0 0 7px transparent; } 100%{ box-shadow:0 0 0 0 transparent; } }

  /* Orchestrated page-load sequence */
  @keyframes rise{ from{ opacity:0; transform:translateY(14px); } to{ opacity:1; transform:none; } }
  /* The beacon is centered with translateX(-50%); its rise MUST preserve that X translate, or the
     animation's end frame (transform:none) clobbers it and shoves the button 28px off-center. */
  @keyframes beaconrise{ from{ opacity:0; transform:translate(-50%,14px); } to{ opacity:1; transform:translate(-50%,0); } }
  .topbrand{ opacity:0; animation:rise .9s ease .35s both; }
  .beacon{ opacity:0; animation:beaconrise .8s ease 1.1s both; }
  .brand{ opacity:0; animation:rise .7s ease .1s both; }
  .tag{ opacity:0; animation:rise .7s ease .2s both; }
  .error{ opacity:0; animation:rise .6s ease .15s both; }
  .btn{ opacity:0; animation:rise .6s ease calc(.3s + var(--i,0) * .1s) both; }
  .foot{ opacity:0; animation:rise .7s ease .5s both; }

  @media (prefers-reduced-motion:reduce){
    *{ animation:none !important; transition:none !important; }
    .topbrand,.beacon,.card,.brand,.tag,.error,.btn,.foot{ opacity:1 !important; }
    .card::before{ opacity:.9; } .card::after{ display:none; }
    .scanbeam,.cursorglow{ display:none; }
    #rain{ opacity:.35; }
    .tag .live{ animation:none; }
  }
</style>
</head>
<body>
<canvas id="rain" aria-hidden="true"></canvas>
<canvas id="stage" aria-hidden="true"></canvas>
<canvas id="vfx" aria-hidden="true"></canvas>
<div class="vignette" aria-hidden="true"></div>
<div class="cursorglow" id="cursorGlow" aria-hidden="true"></div>
<div class="stagescrim" id="stagescrim" aria-hidden="true"></div>

<header class="topbrand" id="topbrand">
  <h1 class="mark" id="wordmark" data-text="SKYNET·CAPITAL">SKYNET<b>·</b>CAPITAL</h1>
  <div class="herosub" id="herosub">
    <div class="tertiary modes" id="modes">
      <button type="button" class="mode call" id="playMode" aria-haspopup="true" aria-expanded="false" aria-controls="playbook">PLAY</button>
      <span class="sep" aria-hidden="true">·</span>
      <span class="mode inert">EXPERIMENT</span>
      <span class="sep" aria-hidden="true">·</span>
      <button type="button" class="mode learn" id="learnMode" aria-haspopup="true" aria-expanded="false" aria-controls="glossary">LEARN</button>
    </div>
    <nav class="glossary" id="glossary" aria-label="Decode the system — how the pipeline reads the market" hidden>
      <p class="gtitle">DECODE THE SYSTEM</p>
      <dl>
        <dt>PIPELINE</dt><dd>Ingest → Detect → Forecast → Execute. The bots run the loop; you validate &amp; refine the plays.</dd>
        <dt>CANDLES</dt><dd>Open / high / low / close per slice — green up, red down.</dd>
        <dt>BANDS</dt><dd>Bollinger ±2σ. Squeeze = calm; expansion = a breakout is brewing.</dd>
        <dt>RSI</dt><dd>Momentum, 0–100. Above 70 overbought, below 30 oversold.</dd>
        <dt>GREEKS</dt><dd>Δ direction · Θ time-decay · V volatility · Γ acceleration.</dd>
        <dt>EVENTS</dt><dd>◆ scheduled (date known) vs ! surprise. ▲ bullish, ▼ bearish.</dd>
        <dt>PLAYS</dt><dd>Tiered 101→401 by complexity — each is an instruction set with a defined max profit &amp; loss.</dd>
        <dt>NORTH STAR</dt><dd>Refine the plays until the desk can deploy them autonomously — with safeguards.</dd>
      </dl>
    </nav>
    <nav class="playbook" id="playbook" aria-label="Playbook — call a play, easiest first">
      <button type="button" class="play" data-i="6"><span class="tier">101</span>Covered Call</button>
      <button type="button" class="play" data-i="7"><span class="tier">102</span>Cash-Covered Put</button>
      <button type="button" class="play" data-i="4"><span class="tier">201</span>Bull Call Spread</button>
      <button type="button" class="play" data-i="0"><span class="tier">301</span>Iron Condor</button>
      <button type="button" class="play" data-i="3"><span class="tier">301</span>Butterfly</button>
      <button type="button" class="play" data-i="1"><span class="tier">301</span>Long Strangle</button>
      <button type="button" class="play" data-i="2"><span class="tier">401</span>Short Straddle</button>
      <button type="button" class="play" data-i="5"><span class="tier">401</span>Call Ladder</button>
    </nav>
    <div class="transport" id="transport" role="group" aria-label="Playcall controls">
      <button type="button" class="tbtn" id="tPrev" aria-label="Previous act">◀◀</button>
      <button type="button" class="tbtn tplay" id="tPlay" aria-label="Pause playcall" aria-pressed="false">❚❚</button>
      <button type="button" class="tbtn" id="tNext" aria-label="Next act">▶▶</button>
      <span class="tacts" id="tActs" aria-hidden="true"><b data-a="0">SIGNAL</b><b data-a="1">PREDICT</b><b data-a="2">REALIZE</b><b data-a="3">RESOLVE</b></span>
    </div>
  </div>
</header>

<div class="skylight" id="skylight" aria-hidden="true"></div>
<button type="button" class="beacon" id="beacon" aria-expanded="false" aria-controls="authwrap">
  <span class="beacon-ring" aria-hidden="true"><svg class="beacon-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  <span class="beacon-label" id="beaconLabel">Enter the sandbox</span>
</button>
${versionTag}

<div class="authwrap" id="authwrap">
  <main class="card" id="card">
    <div class="projector" aria-hidden="true"><span class="cone"></span><span class="emitter"></span></div>
    <span class="corner tl" aria-hidden="true"></span><span class="corner tr" aria-hidden="true"></span>
    <span class="corner bl" aria-hidden="true"></span><span class="corner br" aria-hidden="true"></span>
    <div class="brand-slot" id="brandSlot" aria-hidden="true"></div>
    <p class="signin-sub">Sign in to the sandbox</p>
    ${banner}
    <div class="btns">
      ${buttons}
    </div>
    <p class="foot">Invite-only · a friendly paper league. Everybody's welcome to win.</p>
  </main>
</div>
<script>
(function(){
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.getElementById("stage");
  if(!canvas || !canvas.getContext) return;
  var ctx;
  try{ ctx = canvas.getContext("2d"); }catch(e){ return; }
  if(!ctx) return;

  var W=0,H=0,DPR=1;
  function css(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function clamp01(x){ return x<0?0:x>1?1:x; }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function easeIO(t){ return t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2; }

  // Reveal state: the animation owns the screen; the sign-in card lives behind the beacon.
  var revealed=false;
  var beaconEl=document.getElementById("beacon"), cardEl=document.getElementById("card");
  // The "field" = the band the market + playbook render into. When idle it fills most of the
  // screen (centered); when the card is revealed it shrinks to sit ABOVE the card (no overlap).
  // field is the live (eased) band; fieldT is its target. On reveal the target jumps to sit
  // above the card, but field glides toward it each frame so the market/play don't snap.
  var field={ top:0, bottom:0 }, fieldT={ top:0, bottom:0 }, fieldInit=false;
  function measureField(){
    var bottom;
    if(revealed && cardEl){ bottom = cardEl.getBoundingClientRect().top - 18; }
    else if(beaconEl){ bottom = beaconEl.getBoundingClientRect().top - 24; }
    else { bottom = H*0.82; }
    if(!(bottom>0)) bottom = H*0.72;
    bottom = Math.max(150, Math.min(bottom, H-20));
    var top = Math.max(H*0.16, bottom - Math.min(H*0.6, 430));
    fieldT.top=top; fieldT.bottom=bottom;
    if(!fieldInit){ field.top=top; field.bottom=bottom; fieldInit=true; }
  }
  function fieldSnap(){ field.top=fieldT.top; field.bottom=fieldT.bottom; }
  function fieldStep(){ field.top+=(fieldT.top-field.top)*0.16; field.bottom+=(fieldT.bottom-field.bottom)*0.16; }
  function fieldMid(){ return (field.top+field.bottom)/2; }
  function fieldAmp(){ return (field.bottom-field.top)/2; }
  function resize(){
    DPR = Math.min(window.devicePixelRatio||1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(W*DPR));
    canvas.height = Math.max(1, Math.floor(H*DPR));
    ctx.setTransform(DPR,0,0,DPR,0,0);
    vfxResize();
    measureField(); fieldSnap();
  }

  // ===== Reveal VFX: grainy chromatic "hangar door" sweep (canvas) =====
  // A horizontal chromatic band (teal→cyan→white-hot→magenta) opens like hangar doors from the
  // title's eye-line, light-streaks converge into a core flash, then it blooms and clears — the
  // "about to take you places" moment. Canvas-rendered so the dust/grain reads (CSS can't).
  var vcanvas=document.getElementById("vfx"), vctx=null;
  try{ vctx = vcanvas && vcanvas.getContext ? vcanvas.getContext("2d") : null; }catch(e){ vctx=null; }
  function vfxResize(){ if(!vctx) return;
    vcanvas.width=Math.max(1,Math.floor(vcanvas.clientWidth*DPR));
    vcanvas.height=Math.max(1,Math.floor(vcanvas.clientHeight*DPR));
    vctx.setTransform(DPR,0,0,DPR,0,0); }
  var noiseTile=document.createElement("canvas"); noiseTile.width=140; noiseTile.height=140;
  (function(){ try{ var nx=noiseTile.getContext("2d"), im=nx.createImageData(140,140), d=im.data, i;
    for(i=0;i<d.length;i+=4){ var v=(Math.random()*255)|0; d[i]=d[i+1]=d[i+2]=v; d[i+3]=255; } nx.putImageData(im,0,0); }catch(e){} })();
  var vfxActive=false, vfxT0=0, VFXD=1150, vfxTargetY=0;
  function vEase(x){ return 1-Math.pow(1-clamp01(x),3); }
  function drawVFX(q){
    var w=vcanvas.clientWidth, h=vcanvas.clientHeight; vctx.clearRect(0,0,w,h);
    // The core opens high, then DRIFTS DOWN to settle over the hero title as it lands — the light
    // pours onto the wordmark rather than hovering above it.
    var cy=lerp(h*0.28, vfxTargetY||h*0.5, vEase(q)), open=vEase(clamp01(q/0.55)), env=Math.sin(clamp01(q)*Math.PI);
    var bandH=lerp(h*0.015, h*1.3, open), top=cy-bandH/2, A=0.92*env;
    // chromatic horizontal gradient, feathered top/bottom
    var g=vctx.createLinearGradient(0,0,w,0);
    g.addColorStop(0,   "rgba(28,170,165,"+(A*0.66)+")");
    g.addColorStop(0.32,"rgba(70,225,215,"+(A*0.85)+")");
    g.addColorStop(0.5, "rgba(242,255,252,"+A+")");
    g.addColorStop(0.68,"rgba(255,78,175,"+(A*0.85)+")");
    g.addColorStop(1,   "rgba(150,34,120,"+(A*0.66)+")");
    vctx.save(); vctx.fillStyle=g; vctx.fillRect(0,top,w,bandH);
    var vg=vctx.createLinearGradient(0,top,0,top+bandH);
    vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(0.5,"rgba(0,0,0,1)"); vg.addColorStop(1,"rgba(0,0,0,0)");
    vctx.globalCompositeOperation="destination-in"; vctx.fillStyle=vg; vctx.fillRect(0,top,w,bandH); vctx.restore();
    // dust / grain, clipped to the band
    vctx.save(); vctx.beginPath(); vctx.rect(0,top,w,bandH); vctx.clip();
    vctx.globalAlpha=0.16*env; vctx.globalCompositeOperation="overlay";
    var jx=-((Math.random()*140)|0), jy=top-((Math.random()*140)|0), gx, gy;
    for(gx=jx;gx<w;gx+=140){ for(gy=jy;gy<top+bandH;gy+=140){ vctx.drawImage(noiseTile,gx,gy); } }
    vctx.restore();
    // light-streaks converging into the core (the spotlights rushing in), first ~45%
    var conv=1-clamp01(q/0.45);
    if(conv>0){ vctx.save(); vctx.globalCompositeOperation="lighter"; var cx=w*0.5; vctx.lineCap="round"; vctx.lineWidth=2;
      for(var s=0;s<8;s++){ var sy=cy+((s-3.5)/3.5)*bandH*0.42, fx=(s%2?-1:1)*w*0.62*conv;
        vctx.strokeStyle="rgba(224,255,250,"+(0.45*conv*env)+")";
        vctx.beginPath(); vctx.moveTo(cx+fx,sy); vctx.lineTo(cx+fx*0.28,cy); vctx.stroke(); }
      vctx.restore(); }
    // white-hot core flash, peaking LATE and on the lowered core so it pours onto the hero title.
    var flash=Math.max(0,1-Math.abs(q-0.78)/0.22);
    if(flash>0){ vctx.save(); vctx.globalCompositeOperation="lighter";
      var rg=vctx.createRadialGradient(w*0.5,cy,0,w*0.5,cy,w*0.5);
      rg.addColorStop(0,"rgba(255,255,255,"+(0.62*flash)+")"); rg.addColorStop(1,"rgba(255,255,255,0)");
      vctx.fillStyle=rg; vctx.fillRect(0,0,w,h); vctx.restore(); }
  }
  function vfxLoop(now){ if(!vfxActive) return; var q=(now-vfxT0)/VFXD;
    if(q>=1){ vfxActive=false; if(vctx) vctx.clearRect(0,0,vcanvas.clientWidth,vcanvas.clientHeight); if(vcanvas) vcanvas.style.opacity="0"; return; }
    drawVFX(q); requestAnimationFrame(vfxLoop); }
  function vfxPlay(){ if(!vctx||reduce) return; vfxResize();
    // Measure where the hero title will land (the form's brand slot) so the core drifts onto it.
    vfxTargetY = vcanvas.clientHeight*0.5;
    try{ if(brandSlot){ document.body.classList.add("measuring"); var r=brandSlot.getBoundingClientRect();
      document.body.classList.remove("measuring"); if(r.height>0) vfxTargetY=r.top+r.height/2; } }catch(e){}
    vfxActive=true; vfxT0=performance.now(); vcanvas.style.opacity="1"; requestAnimationFrame(vfxLoop); }

  // ===== Market engine: a live underlying with real technical overlays =====
  // Signals come from indicators that actually make sense — EMA cross, Bollinger squeeze/expansion,
  // and RSI overbought/oversold — which then summon the matching options play from the playbook.
  var SPAN=300, price=[], emaF=[], emaS=[], smaA=[], bU=[], bL=[], rsiV=50, t=0;
  var pv=0, regimeBias=0.02, regimeVol=1, regimeT=0, basePrice=100;
  function noise(s){ var x=Math.sin(s)*43758.5453; return x-Math.floor(x); }
  function cap(a){ if(a.length>SPAN) a.shift(); }
  function avg(a){ var m=0,i; for(i=0;i<a.length;i++) m+=a[i]; return m/a.length; }
  function sd(a,m){ var v=0,i; for(i=0;i<a.length;i++){ var d=a[i]-m; v+=d*d; } return Math.sqrt(v/a.length); }
  function rsi(a,n){ if(a.length<n+1) return 50; var g=0,l=0,i;
    for(i=a.length-n;i<a.length;i++){ var d=a[i]-a[i-1]; if(d>=0) g+=d; else l-=d; }
    if(l<=0) return 100; var rs=(g/n)/(l/n); return 100-100/(1+rs); }
  // Push one new price and roll the derived series (EMAs, Bollinger, RSI). Shared by the ambient
  // random walk and the scripted forecast walk so a play flows into and out of the trend seamlessly.
  function pushPrice(np){
    np = Math.max(5, np); price.push(np); cap(price);
    var kf=2/10, ks=2/22;
    var pf=emaF.length?emaF[emaF.length-1]:np, ps=emaS.length?emaS[emaS.length-1]:np;
    emaF.push(pf+kf*(np-pf)); cap(emaF); emaS.push(ps+ks*(np-ps)); cap(emaS);
    var win=price.slice(Math.max(0,price.length-20)), m=avg(win), s=sd(win,m);
    smaA.push(m); cap(smaA); bU.push(m+2*s); cap(bU); bL.push(m-2*s); cap(bL);
    rsiV = rsi(price,14);
  }
  function stepMarket(){ t++;
    if(t>regimeT){ regimeT=t+120+Math.floor(Math.random()*160);
      regimeBias=(Math.random()-0.5)*0.06; regimeVol=0.6+Math.random()*1.3; }
    var last=price.length?price[price.length-1]:basePrice;
    // Mean-reverting (Ornstein-Uhlenbeck-style) walk: a gentle pull back toward basePrice keeps the
    // tape roaming with real motion and prevents a runaway drift from slamming the price floor and
    // flat-lining. Reversion strengthens the farther price wanders, so it never sits dead-flat.
    var revert=(basePrice-last)*0.012;
    pv = pv*0.85 + (noise(t*0.017)-0.5)*0.9*regimeVol + regimeBias + revert;
    pushPrice(last + pv);
  }
  // Act 3 of a playcall: grow the REALIZED pen past the frozen history so its tip tracks walk
  // progress — reaching the target (prediction's right edge ~W·0.9) exactly as the trade resolves.
  // Reality thus draws rightward INTO the forecast, overtaking it, without scrolling the history.
  function fillRealized(walk){
    var dx=W/(SPAN-1), cap=Math.max(2, Math.floor((W*0.9-nowSX)/(dx*(zoom||1))));
    var want=Math.round(clamp01(walk)*cap);   // LINEAR advance → even, ambient-matched pace
    // The play UNFOLDS across the whole region: the realized line tracks a target that eases from the
    // entry price to the take-profit price over the full width (natural wiggle on top), reaching the
    // exit level only at the right edge. So plays traverse the frame and resolve there — never a
    // 3-point insta-close — while the booked amount still varies via where targetPrice sits.
    // Carry the market's OWN character: same momentum (0.88) as the ambient walk, a wiggle scaled to
    // the band so real deviations show (not a flat glide), only a GENTLE pull toward the moving target,
    // plus one-off event shocks. So the line dips and recovers like a real tape and still lands at the
    // exit price by the right edge.
    while(realized.length<want){ var i=realized.length, last=i?realized[i-1]:price[nowIdx], f=(i+1)/cap;
      var moving=signalPrice+(targetPrice-signalPrice)*easeIO(f);
      // Pull to target firms up over the walk so an event shock deviates mid-play but the tape still
      // converges to the profitable exit by the close (the happy-but-realistic path).
      t++; pvR = pvR*0.88 + (noise(t*0.017)-0.5)*volScale*0.03*playVol + (moving-last)*(0.10+0.24*f) + eventImpulse(i,cap);
      realized.push(Math.max(5, last+pvR)); }
    while(realized.length>want) realized.pop();   // trim if the walk was scrubbed back
  }
  for(var _i=0;_i<SPAN;_i++) stepMarket();

  function valRange(){ var lo=1e9,hi=-1e9,i;
    for(i=0;i<price.length;i++){ if(price[i]<lo)lo=price[i]; if(price[i]>hi)hi=price[i]; }
    for(i=0;i<bU.length;i++){ if(bU[i]>hi)hi=bU[i]; }
    for(i=0;i<bL.length;i++){ if(bL[i]<lo)lo=bL[i]; }
    // During a play, keep the forecast's profit/loss bands (signalPrice ± volScale) in frame so
    // the future projection never clips as the camera eases in.
    if(cam>0.01){ lo=Math.min(lo, signalPrice - volScale*0.72*cam); hi=Math.max(hi, signalPrice + volScale*0.72*cam); }
    // Ambient: modest headroom so the near bands aren't clipped — the forward cone fans to a fraction
    // of the visible span (see drawMarket), so it stays deep without flattening the trend here.
    if(cam<0.6 && smaA.length){ var _lm=smaA[smaA.length-1], _lhw=Math.max((bU[bU.length-1]-bL[bL.length-1])/2, 1);
      hi=Math.max(hi, _lm+_lhw*2.2); lo=Math.min(lo, _lm-_lhw*2.2); }
    var pad=(hi-lo)*0.12||1; return { lo:lo-pad, hi:hi+pad, mid:(lo+hi)/2, span:(hi-lo)+2*pad }; }
  function strokeSeries(arr,dx,Y,style,w){ ctx.beginPath();
    for(var i=0;i<arr.length;i++){ var px=i*dx,py=Y(arr[i]); i?ctx.lineTo(px,py):ctx.moveTo(px,py); }
    ctx.strokeStyle=style; ctx.lineWidth=w; ctx.lineJoin="round"; ctx.stroke(); }
  function drawGrid(){
    var grid="color-mix(in srgb, "+(css("--border")||"#223041")+" 55%, transparent)";
    ctx.strokeStyle=grid; ctx.lineWidth=1; ctx.globalAlpha=0.4; var gx=64;
    // static vertical rules — a fixed "paper" the pen draws across (less of a scrolling feel)
    for(var x=0;x<W;x+=gx){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(var y=0;y<H;y+=gx){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.globalAlpha=1; }
  function drawMarket(dim){
    ctx.clearRect(0,0,W,H); drawGrid();
    var n=price.length; if(!n) return;
    var r=valRange(), baseY=fieldMid(), amp=fieldAmp()*0.94, dx=W/(SPAN-1);
    function Y(v){ return baseY - ((v-r.mid)/(r.span||1))*amp*2; }
    var accent=css("--accent")||"#35D0BA", muted=css("--muted")||"#8B9AAB",
        pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149", txt=css("--text")||"#E6EDF3";
    ctx.save(); ctx.globalAlpha=dim;
    // Camera: during a play we ease the focal ("now") from the leading edge (right) toward mid-left
    // so the FUTURE region opens on the right for the forecast, and zoom in smoothly. Everything is
    // eased by cam (0 ambient to 1 framed) so nothing snaps. Export the on-screen "now" anchor +
    // the price→pixel scale so drawForecast can draw the future in the same coordinate frame.
    // During a play, "now" is the FROZEN nowIdx (history doesn't grow); ease it to ~W·0.30 so the
    // prediction + realized pen own the right ~2/3 of the frame. Ambient = leading edge at the right.
    // "Now" anchor: ambient sits at W·0.68 (leaving ~1/3 on the right for the forward vol cone), and a
    // playcall eases it further to W·0.30 for the forecast. Always translated so the present dot never
    // hugs the right edge — the future opens to its right in every state.
    var fpx=(n-1)*dx, fpy=Y(price[n-1]);
    var toX=lerp(W*0.78, W*0.30, cam), toY=lerp(fpy, baseY, cam);
    nowSX=toX; nowSY=toY; nowPrice=price[n-1];
    pxPerPrice=(amp*2/(r.span||1))*zoom;
    scBaseY=baseY; scMid=r.mid; scSpan=r.span; scAmp=amp;   // ambient price→screen-Y for the roaming scanners
    ctx.translate(toX,toY); ctx.scale(zoom,zoom); ctx.translate(-fpx,-fpy);
    // Bollinger envelope
    ctx.beginPath();
    for(var i=0;i<bU.length;i++){ var px=i*dx,py=Y(bU[i]); i?ctx.lineTo(px,py):ctx.moveTo(px,py); }
    for(i=bL.length-1;i>=0;i--){ ctx.lineTo(i*dx,Y(bL[i])); }
    ctx.closePath(); ctx.fillStyle=hexA(accent,0.06); ctx.fill();
    strokeSeries(bU,dx,Y,hexA(accent,0.20),1);
    strokeSeries(bL,dx,Y,hexA(accent,0.20),1);
    // Forward-projected Bollinger cone (ambient INGEST): carry the bands into the FUTURE right of "now",
    // widening AND breathing (expand/contract) like real vol as events unfold. The shaded above/below is
    // the band itself projected forward. Fades out as a playcall frames in.
    var coneA=clamp01(1-cam*1.8);
    if(coneA>0.01 && smaA.length){
      var lm=smaA[smaA.length-1], lp2=price[n-1], lhw=Math.max((bU[n-1]-bL[n-1])/2, lp2*0.02);
      // Center DRIFTS along the recent EMA slope so the projection adjusts course with the market
      // (recomputed every frame → it visibly re-aims as price moves), instead of a flat mean.
      var slope=(emaF.length>10?(emaF[emaF.length-1]-emaF[emaF.length-11])/10:0);
      var F=Math.ceil((W-(n-1)*dx)/dx)+4, gX0=(n-1)*dx, gX1=(n-1+F)*dx, fi, mono=css("--mono")||"monospace";
      // Build one cone edge that fans from the band half-width at "now" to a deep target at the right
      // edge — the target is a fraction of the VISIBLE span (not the tiny band width), so the cone is
      // always DEEP regardless of how calm the tape is, without flattening the history.
      function coneEdge(target){ var U=[],L=[];
        for(fi=0;fi<=F;fi++){ var tt=fi/F, fan=tt*tt*0.6+tt*0.4,
          breathe=1+0.14*Math.sin(rainT*0.028+tt*3.1)+0.08*Math.sin(rainT*0.015+tt*6.2);
          var hw=(lhw+(target-lhw)*fan)*breathe, cen=lm+slope*fi*0.7, px2=(n-1+fi)*dx;
          U.push([px2,Y(cen+hw)]); L.push([px2,Y(cen-hw)]); }
        return [U,L]; }
      ctx.save(); ctx.globalAlpha=dim*coneA;
      // Two tiers drawn outer→inner so they NEST and frame the bands: ±3σ (wide, faint) + ±2σ (core).
      var tiers=[{target:r.span*0.44,fa:0.05,ea:0.22,lab:"3σ"},{target:r.span*0.28,fa:0.075,ea:0.36,lab:"2σ"}];
      for(var ti=0;ti<tiers.length;ti++){ var T=tiers[ti], pr=coneEdge(T.target), U=pr[0], L=pr[1];
        var gF=ctx.createLinearGradient(gX0,0,gX1,0);
        gF.addColorStop(0,hexA(accent,T.fa)); gF.addColorStop(0.7,hexA(accent,T.fa*0.6)); gF.addColorStop(1,hexA(accent,T.fa*0.28));
        ctx.beginPath(); for(fi=0;fi<U.length;fi++){ fi?ctx.lineTo(U[fi][0],U[fi][1]):ctx.moveTo(U[fi][0],U[fi][1]); }
        for(fi=L.length-1;fi>=0;fi--){ ctx.lineTo(L[fi][0],L[fi][1]); } ctx.closePath(); ctx.fillStyle=gF; ctx.fill();
        var gE=ctx.createLinearGradient(gX0,0,gX1,0);
        gE.addColorStop(0,hexA(accent,T.ea)); gE.addColorStop(0.75,hexA(accent,T.ea*0.5)); gE.addColorStop(1,hexA(accent,T.ea*0.22));
        ctx.setLineDash([3,5]); ctx.lineWidth=1.1; ctx.strokeStyle=gE;
        ctx.beginPath(); for(fi=0;fi<U.length;fi++){ fi?ctx.lineTo(U[fi][0],U[fi][1]):ctx.moveTo(U[fi][0],U[fi][1]); } ctx.stroke();
        ctx.beginPath(); for(fi=0;fi<L.length;fi++){ fi?ctx.lineTo(L[fi][0],L[fi][1]):ctx.moveTo(L[fi][0],L[fi][1]); } ctx.stroke();
        ctx.setLineDash([]);
        ctx.font="700 8px "+mono; ctx.fillStyle=hexA(accent,T.ea); ctx.textAlign="right";
        ctx.fillText(T.lab, gX1-4, U[U.length-1][1]+9); ctx.fillText("−"+T.lab, gX1-4, L[L.length-1][1]-3); ctx.textAlign="left"; }
      // projected mean (drifting along the slope)
      var gMid=ctx.createLinearGradient(gX0,0,gX1,0); gMid.addColorStop(0,hexA(muted,0.34)); gMid.addColorStop(1,hexA(muted,0.05));
      ctx.setLineDash([2,5]); ctx.strokeStyle=gMid; ctx.beginPath();
      for(fi=0;fi<=F;fi++){ var px3=(n-1+fi)*dx, cy=Y(lm+slope*fi*0.7); fi?ctx.lineTo(px3,cy):ctx.moveTo(px3,cy); } ctx.stroke(); ctx.setLineDash([]);
      // "now" divider — the present line the history draws up to and the projection fans out from
      ctx.setLineDash([2,4]); ctx.strokeStyle=hexA(accent,0.22*coneA); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo((n-1)*dx, Y(lm)-amp*0.95); ctx.lineTo((n-1)*dx, Y(lm)+amp*0.95); ctx.stroke();
      ctx.setLineDash([]); ctx.restore(); }
    strokeSeries(emaS,dx,Y,hexA(muted,0.75),1.4);
    strokeSeries(emaF,dx,Y,hexA(accent,0.9),1.6);
    // price line — calm settled history
    ctx.beginPath();
    for(i=0;i<n;i++){ var qx=i*dx,qy=Y(price[i]); i?ctx.lineTo(qx,qy):ctx.moveTo(qx,qy); }
    ctx.strokeStyle=txt; ctx.lineWidth=1.6; ctx.lineJoin="round";
    ctx.shadowColor=accent; ctx.shadowBlur=8; ctx.stroke(); ctx.shadowBlur=0;
    // Act 3: the REALIZED line drawn as a continuation past nowIdx (indices n..) in the SAME frame,
    // reality overtaking the dotted forecast to its right. Fades on zoom-out (realizedAlpha).
    var rl=realized.length;
    function LP(k){ return k<n ? [k*dx, Y(price[k])] : [k*dx, Y(realized[k-n])]; }   // unified index→point
    // Act 3 zoomed in: render the realized tape as CANDLESTICKS (OHLC per group of ticks) — what a
    // trader actually watches. They form one at a time (slower cadence than the line), which adds the
    // fine detail and reinforces the time-dilation of the zoom. Green up / red down, wick = range.
    if(rl){ ctx.save(); ctx.globalAlpha=dim*realizedAlpha;
      var G=4, cw=dx*G*0.6, lw=1/zoom, cs, ce, cj;
      for(cs=0;cs<rl;cs+=G){ ce=Math.min(rl-1,cs+G-1);
        var o=realized[cs], c=realized[ce], chi=-1e9, clo=1e9;
        for(cj=cs;cj<=ce;cj++){ if(realized[cj]>chi)chi=realized[cj]; if(realized[cj]<clo)clo=realized[cj]; }
        var ccx=(n+cs+(ce-cs)/2)*dx, cup=c>=o, ccol=cup?pos:neg;
        ctx.strokeStyle=hexA(ccol,0.85); ctx.lineWidth=1.2*lw;
        ctx.beginPath(); ctx.moveTo(ccx,Y(chi)); ctx.lineTo(ccx,Y(clo)); ctx.stroke();            // wick
        var bt=Y(Math.max(o,c)), bh=Math.max(1.4*lw, Y(Math.min(o,c))-bt);
        ctx.fillStyle=hexA(css("--bg")||"#0B0F14",0.72); ctx.fillRect(ccx-cw/2,bt,cw,bh);           // dark backing so bodies separate from the green/red band
        ctx.fillStyle=hexA(ccol,cup?0.66:0.82); ctx.fillRect(ccx-cw/2,bt,cw,bh);                    // body
        ctx.strokeStyle=hexA(ccol,1); ctx.lineWidth=lw; ctx.strokeRect(ccx-cw/2,bt,cw,bh); }
      // Smoothed guide line traced THROUGH the candles — a short EMA that "smooths everything", so
      // the underlying trend stays legible beneath the noisy OHLC bodies. Seeded from the frozen now.
      var em=price[n-1], ka=2/9; ctx.beginPath(); ctx.moveTo((n-1)*dx, Y(em));
      for(var si=0;si<rl;si++){ em += ka*(realized[si]-em); ctx.lineTo((n+si)*dx, Y(em)); }
      ctx.strokeStyle=hexA(accent,0.9); ctx.lineWidth=1.7*lw; ctx.lineJoin="round";
      ctx.shadowColor=accent; ctx.shadowBlur=6; ctx.stroke(); ctx.shadowBlur=0;
      ctx.restore(); }
    // Glowing tip at the leading point. Ambient also gets the wet-ink pen segment; during a play the
    // candles carry the body, so just the tip dot.
    var lead = rl ? (n-1+rl) : (n-1), leadA = rl ? realizedAlpha : 1;
    ctx.save(); ctx.globalAlpha=dim*leadA;
    if(!rl){ var head=18; ctx.beginPath();
      for(i=Math.max(0,lead-head);i<=lead;i++){ var wp=LP(i); i===Math.max(0,lead-head)?ctx.moveTo(wp[0],wp[1]):ctx.lineTo(wp[0],wp[1]); }
      ctx.strokeStyle="#EAFBF7"; ctx.lineWidth=2.3; ctx.lineJoin="round"; ctx.shadowColor=accent; ctx.shadowBlur=16; ctx.stroke(); ctx.shadowBlur=0; }
    var lp=LP(lead);
    ctx.beginPath(); ctx.arc(lp[0],lp[1],3.8,0,7); ctx.fillStyle="#EAFBF7"; ctx.shadowColor=accent; ctx.shadowBlur=20; ctx.fill(); ctx.shadowBlur=0;
    ctx.restore();
    // (The aiming beam draws the reticle at the signal point during a playcall — see drawAimBeam.)
    ctx.restore();
    // RSI readout — idle only (during a play the playbook panel + callout carry the read; this would
    // just collide with the pipeline text top-left).
    if(cam<0.05){ var rc = rsiV<32?pos:(rsiV>68?neg:muted);
      ctx.save(); ctx.globalAlpha=dim; ctx.font="11px "+(css("--mono")||"monospace"); ctx.textAlign="left"; ctx.fillStyle=hexA(rc,0.92);
      ctx.fillText("RSI "+rsiV.toFixed(0)+(rsiV<32?" OVERSOLD":rsiV>68?" OVERBOUGHT":""), 16, field.top-6);
      ctx.textAlign="start"; ctx.restore(); }
  }
  // Projected-beam vignette: the trend + plays read as cast FROM the emitter (the button at
  // bottom-center) — brightest inside the light cone, fading toward the upper corners.
  function beamVignette(){
    var ax=W*0.5, ay=H+H*0.05;
    var g=ctx.createRadialGradient(ax,ay, H*0.30, ax,ay, H*1.1);
    g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(0.72,"rgba(0,0,0,0)");
    g.addColorStop(1, hexA(css("--bg")||"#0B0F14", 0.62));
    ctx.save(); ctx.globalAlpha=1; ctx.fillStyle=g; ctx.fillRect(0,0,W,H); ctx.restore();
  }
  // Convert a css color to rgba with alpha via an offscreen paint.
  var _c = document.createElement("canvas").getContext("2d");
  function hexA(color, a){ try{ _c.fillStyle=color; var s=_c.fillStyle;
    if(s[0]==="#"){ var r=parseInt(s.substr(1,2),16),g=parseInt(s.substr(3,2),16),b=parseInt(s.substr(5,2),16);
      return "rgba("+r+","+g+","+b+","+a+")"; } return s; }catch(e){ return color; } }
  function roundRect(x,y,w,h,r){ ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  // Signal → play mapping. Reads the latest indicators and returns the matching playbook entry
  // with a human-readable reason (the "why"), or null when nothing is set up.
  // Auto-plays deal from a shuffled bag so all six rotate before any repeats (variety over strict
  // realism — the user's call). Each carries a plausible indicator reason for the "why".
  // One signal reason per play — MUST stay index-aligned with STRATS (a missing entry renders as
  // "undefined" in the panel). Order: condor, strangle, straddle, butterfly, bull spread, ladder,
  // covered call, cash-covered put.
  var SIGS=["RSI OVERBOUGHT · RANGE HOLDS","BOLLINGER EXPANSION · BREAKOUT","BOLLINGER SQUEEZE · LOW VOL",
    "PRICE PINNED AT MEAN","EMA GOLDEN CROSS · UPTREND","MOMENTUM BREAKOUT",
    "CALM UPTREND · SELL PREMIUM","HOLDING SUPPORT · GET PAID TO WAIT"];
  var playBag=[];
  function dealPlay(){
    if(!playBag.length){ playBag=[0,1,2,3,4,5,6,7];
      for(var k=playBag.length-1;k>0;k--){ var j=(Math.random()*(k+1))|0, tmp=playBag[k]; playBag[k]=playBag[j]; playBag[j]=tmp; } }
    var i=playBag.shift(); return { i:i, sig:SIGS[i] };
  }

  // --- Ambient Matrix rain (deepest layer, faint) ---
  var rcanvas=document.getElementById("rain"), rctx=null, cols=[], colW=16, RG="0123456789$+-.%△▽ｦｱｲｳｴｵｶｷｸｹﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘ";
  // High-tech skyline anchoring the bottom of the matrix rain — a dark city the code falls behind,
  // with faint accent-lit windows and a few antennas. Generated once per resize (seeded by layout).
  var skyline=[], rainT=0;
  function buildSkyline(w,h){ skyline=[]; var x=-12;
    while(x<w+12){ var bw=26+Math.random()*52, bh=36+Math.random()*Math.min(150,h*0.20);   // shorter towers
      skyline.push({ x:x, w:bw, h:bh, seed:Math.random()*1000, ant:Math.random()<0.28?(10+Math.random()*22):0 });
      x += bw + (2+Math.random()*9); } }
  // Buildings are BUILT FROM the matrix code — like the walls of the hallway: dark structural masses
  // whose faces are a fine, mostly-dim field of glyphs, with a sparse scatter of brighter "lit window"
  // cells. Kept dim (atmosphere, not spectacle). Chars hold ~14 frames then flip so the code breathes.
  function drawSkyline(w,h){ if(!skyline.length||!rctx) return;
    var accent=css("--accent")||"#35D0BA", flip=Math.floor(rainT/14);
    rctx.font="9px "+(css("--mono")||"monospace");
    for(var i=0;i<skyline.length;i++){ var b=skyline[i], top=h-b.h;
      if(b.ant){ rctx.strokeStyle=hexA(accent,0.13); rctx.lineWidth=1;
        rctx.beginPath(); rctx.moveTo(b.x+b.w/2, top); rctx.lineTo(b.x+b.w/2, top-b.ant); rctx.stroke(); }
      rctx.fillStyle="#03060A"; rctx.fillRect(b.x, top, b.w, b.h);           // dark structural mass
      rctx.save(); rctx.beginPath(); rctx.rect(b.x, top, b.w, b.h); rctx.clip();
      var gx=7, gy=10, cxi=0;
      for(var cx=b.x+1; cx<b.x+b.w; cx+=gx, cxi++){ var cyi=0;
        for(var cy=top+9; cy<h; cy+=gy, cyi++){
          var cell=b.seed + cxi*12.9 + cyi*7.3;
          var lit=noise(cell)<0.14;                                          // sparse bright cells = lit windows
          var ch=RG[(noise(cell+flip*0.7)*RG.length)|0];                     // char holds ~14 frames then flips
          var fl=0.5+0.5*Math.sin(rainT*0.05 + cxi*1.3 + cyi*0.7 + b.seed);
          var a=lit ? (0.42+0.34*fl) : (0.11+0.07*noise(cell+1.3));
          rctx.fillStyle=hexA(accent,a); rctx.fillText(ch, cx, cy); } }
      rctx.restore();
      // Edge tracers: outline the hard surfaces so each structure reads out of the code field. The top
      // (skyline) edge is the strongest; the sides are fainter. A bright dash RUNS along the perimeter,
      // tracing the building like a live circuit — subtle, but it defines the form crisply.
      rctx.strokeStyle=hexA(accent,0.30); rctx.lineWidth=1;
      rctx.beginPath(); rctx.moveTo(b.x,top); rctx.lineTo(b.x+b.w,top); rctx.stroke();       // top edge (skyline)
      rctx.strokeStyle=hexA(accent,0.14);
      rctx.beginPath(); rctx.moveTo(b.x,h); rctx.lineTo(b.x,top); rctx.moveTo(b.x+b.w,top); rctx.lineTo(b.x+b.w,h); rctx.stroke();  // sides
      rctx.fillStyle=hexA(accent,0.5);                                                        // top corner accent ticks
      rctx.fillRect(b.x-1,top-1,4,2); rctx.fillRect(b.x-1,top-1,2,4);
      rctx.fillRect(b.x+b.w-3,top-1,4,2); rctx.fillRect(b.x+b.w-1,top-1,2,4);
      var L1=b.h, L2=b.w, P=2*L1+L2, d0=((rainT*2.4 + b.seed*40)%P+P)%P;                      // running tracer along the outline
      for(var seg=0; seg<9; seg++){ var dd=(d0+seg*2)%P, ep;
        if(dd<L1) ep=[b.x, h-dd]; else if(dd<L1+L2) ep=[b.x+(dd-L1), top]; else ep=[b.x+b.w, top+(dd-L1-L2)];
        rctx.fillStyle=hexA(accent, 0.55*(1-seg/9)); rctx.fillRect(ep[0]-0.8, ep[1]-0.8, 1.8, 1.8); } } }
  try{ rctx = rcanvas && rcanvas.getContext ? rcanvas.getContext("2d") : null; }catch(e){ rctx=null; }
  function rainResize(){
    if(!rctx) return;
    rcanvas.width=Math.max(1,Math.floor(rcanvas.clientWidth*DPR));
    rcanvas.height=Math.max(1,Math.floor(rcanvas.clientHeight*DPR));
    rctx.setTransform(DPR,0,0,DPR,0,0);
    var n=Math.ceil(rcanvas.clientWidth/colW);
    cols=[]; for(var i=0;i<n;i++){ cols.push(Math.random()*-rcanvas.clientHeight); }
    buildSkyline(rcanvas.clientWidth, rcanvas.clientHeight);
  }
  // boost = the rain reacts to a play (faster, brighter); tint = green flourish on a winning close.
  function rainDraw(boost,tint){
    if(!rctx) return;
    var w=rcanvas.clientWidth, h=rcanvas.clientHeight;
    rctx.fillStyle="rgba(11,15,20,0.16)"; rctx.fillRect(0,0,w,h);   // fade for trails
    var col = tint ? (css("--pos")||"#3FB950") : (css("--accent")||"#35D0BA");
    rctx.font="13px "+((css("--mono")||"monospace"));
    for(var i=0;i<cols.length;i++){
      var x=i*colW, y=cols[i], ch=RG[(Math.random()*RG.length)|0];
      rctx.fillStyle=hexA(col, boost?0.95:0.85); rctx.fillText(ch,x,y);    // bright head
      rctx.fillStyle=hexA(col,0.28); rctx.fillText(RG[(Math.random()*RG.length)|0],x,y-14); // dim trail
      cols[i]= y>h+Math.random()*140 ? 0 : y+ (10+Math.random()*6)*(boost?1.6:1);
    }
    if(boost){ for(var kk=0;kk<6;kk++){ var cxk=(Math.random()*cols.length)|0;
      rctx.fillStyle=hexA(col,0.95); rctx.fillText(RG[(Math.random()*RG.length)|0], cxk*colW, Math.random()*h); } }
    rainT++; drawSkyline(w,h);   // city sits in FRONT: the code falls behind the skyline
  }

  // --- Strategy Playbook: the race periodically recedes and a holographic option-payoff
  // diagram assembles center-stage, fully annotated, with Matrix glyphs lighting the strikes.
  // These are illustrative teaching diagrams (labeled STRATEGY PLAYBOOK), never live P/L.
  // pts: normalized payoff [ [x 0..1, y -1..1], ... ]; strikes: x positions of the legs.
  // maxP / maxL: realistic ASYMMETRIC risk-reward per play (illustrative $, per-contract feel).
  // why: the THESIS — the read of WHY the market should behave this way (evidence → expectation).
  // hold: the CONDITION that must persist for the play to pay. Surfaced in the signal + recap cards.
  var STRATS=[
    { name:"IRON CONDOR", cue:"LOW VOL", desc:"Range-bound — keep the credit while price holds the middle.",
      why:"RSI stretched at the band, vol compressed — momentum's spent, so price should oscillate inside the range.",
      hold:"Holds while price stays between the short strikes.",
      pts:[[0,-1],[0.2,-1],[0.34,1],[0.66,1],[0.8,-1],[1,-1]], strikes:[0.2,0.34,0.66,0.8], maxP:420, maxL:-1080, tier:301 },
    { name:"LONG STRANGLE", cue:"VOL EXPANDING", desc:"Volatility building — profit on a breakout either way.",
      why:"Bands squeezed and coiling — a volatility expansion is due; the break can come either way.",
      hold:"Pays once price breaks out past either strike.",
      pts:[[0,1],[0.3,-1],[0.7,-1],[1,1]], strikes:[0.3,0.7], maxP:2600, maxL:-720, tier:301 },
    { name:"SHORT STRADDLE", cue:"RANGE-BOUND", desc:"Dead calm — sell premium; best if price pins the strike.",
      why:"Tape pinned to the mean with vol rich — premium decays fastest if price simply stays put.",
      hold:"Best if price pins the strike; risk grows as it drifts.",
      pts:[[0,-1],[0.5,1],[1,-1]], strikes:[0.5], maxP:1180, maxL:-3400, tier:401 },
    { name:"BUTTERFLY", cue:"PINNED", desc:"Pinned — max profit if price lands on the center strike.",
      why:"Price magnetised to a level with low vol — it should land near the center strike at expiry.",
      hold:"Max profit if it expires on the center strike.",
      pts:[[0,-0.5],[0.35,-0.5],[0.5,1],[0.65,-0.5],[1,-0.5]], strikes:[0.35,0.5,0.65], maxP:1320, maxL:-340, tier:301 },
    { name:"BULL CALL SPREAD", cue:"UPTREND", desc:"Bullish reversal — capped upside at a lower cost.",
      why:"Fast EMA crossing up off support, momentum turning — a measured move higher.",
      hold:"Holds while the uptrend and support persist.",
      pts:[[0,-1],[0.35,-1],[0.65,1],[1,1]], strikes:[0.35,0.65], maxP:760, maxL:-540, tier:201 },
    { name:"CALL LADDER", cue:"BREAKOUT RISK", desc:"Breakout higher — limited risk with room to run.",
      why:"Breakout pressure building above resistance — room to run, with defined risk.",
      hold:"Pays as price breaks and runs higher.",
      pts:[[0,0.35],[0.4,0.35],[0.55,-1],[0.75,-1],[1,1]], strikes:[0.4,0.55,0.75], maxP:1900, maxL:-880, tier:401 },
    { name:"COVERED CALL", cue:"UPTREND", desc:"Own the stock, sell a call — collect income, cap the upside.",
      why:"Holding shares in a calm-to-rising tape — sell a call to harvest premium while it drifts up.",
      hold:"Keeps the premium while price stays below the short call.",
      pts:[[0,-1],[0.6,1],[1,1]], strikes:[0.6], maxP:640, maxL:-1900, tier:101 },
    { name:"CASH-COVERED PUT", cue:"RANGE-BOUND", desc:"Sell a put, hold the cash — get paid to set a buy price.",
      why:"Willing to own lower — sell a put to collect premium while price holds above your strike.",
      hold:"Keeps the premium while price stays above the short put.",
      pts:[[0,-1],[0.4,1],[1,1]], strikes:[0.4], maxP:520, maxL:-2600, tier:102 }
  ];
  // Greeks "fingerprint" — the net position's [Δ delta (direction), Θ theta (time decay),
  // V vega (vol exposure), Γ gamma (acceleration)] normalized -1..1. Teaches what each play is MADE
  // of: e.g. a condor is +theta / -vega (you want calm + time), a strangle is -theta / +vega.
  var _GK=[[0.0,0.8,-0.7,-0.5],[0.0,-0.8,0.9,0.7],[0.0,0.9,-0.9,-0.8],[0.0,0.6,-0.4,-0.3],
    [0.7,-0.1,0.15,0.2],[0.5,-0.2,0.3,0.3],[0.5,0.4,-0.3,-0.2],[0.45,0.4,-0.3,-0.2]];
  for(var _gi=0;_gi<STRATS.length;_gi++) STRATS[_gi].gk=_GK[_gi];
  // Map a normalized payoff v∈[minY,maxY] to asymmetric dollars using the play's own max P / max L.
  function dollarsAt(strat, e, v){ if(v>=0) return e.maxY>0?(v/e.maxY)*strat.maxP:0;
    return e.minY<0?(v/e.minY)*strat.maxL:0; }
  // Find the underlying u (between center and the max-profit side) whose payoff is frac-of-max —
  // the point we take profit at. Lets exits vary: scrape a favorable swing early, or let it ride.
  function exitU(strat, e, frac){ var tgt=e.maxY*frac, N=48, bestU=e.mxDir, bestD=9, i;
    for(i=0;i<=N;i++){ var u=lerp(0.5,e.mxDir,i/N), d=Math.abs(payoffAt(strat.pts,u)-tgt); if(d<bestD){ bestD=d; bestU=u; } }
    return bestU; }
  var pbGlyphT=0;
  function payoffAt(pts,u){ if(u<=pts[0][0]) return pts[0][1];
    for(var i=1;i<pts.length;i++){ if(u<=pts[i][0]){ var a=pts[i-1],b=pts[i];
      var tt=(u-a[0])/((b[0]-a[0])||1); return a[1]+(b[1]-a[1])*tt; } }
    return pts[pts.length-1][1]; }
  function extrema(strat){ var pts=strat.pts,maxY=-9,minY=9,i,xs=[],xl=[],be=[];
    for(i=0;i<pts.length;i++){ if(pts[i][1]>maxY)maxY=pts[i][1]; if(pts[i][1]<minY)minY=pts[i][1]; }
    for(i=0;i<pts.length;i++){ if(pts[i][1]===maxY)xs.push(pts[i][0]); if(pts[i][1]===minY)xl.push(pts[i][0]); }
    for(i=1;i<pts.length;i++){ var a=pts[i-1],b=pts[i]; if((a[1]<0)!==(b[1]<0)){ var tt=(0-a[1])/((b[1]-a[1])||1); be.push(a[0]+tt*(b[0]-a[0])); } }
    // Happy-path direction: if the play profits by price STAYING (center is a profit zone → condor,
    // straddle, butterfly) the target is the middle; otherwise it's a BREAKOUT (strangle, spread,
    // ladder) so pick the profit extreme farthest from center, preferring the upside branch.
    var mxDir; if(payoffAt(pts,0.5)>0.02) mxDir=0.5;
    else if(xs.length){ var best=xs[0]; for(i=0;i<xs.length;i++){ var d=Math.abs(xs[i]-0.5)-Math.abs(best-0.5);
      if(d>0.001 || (Math.abs(d)<=0.001 && xs[i]>best)) best=xs[i]; } mxDir=best; }
    else mxDir=0.5;
    return { maxY:maxY, minY:minY, mxX:xs.length?(xs[0]+xs[xs.length-1])/2:0.5, mxDir:mxDir,
      mnX:xl.length?(xl[0]+xl[xl.length-1])/2:0.5, be:be }; }
  function wrapText(s,x,y,maxW,lh){ var words=s.split(" "),line="",yy=y,i,n=0;
    for(i=0;i<words.length;i++){ var test=line?line+" "+words[i]:words[i];
      if(ctx.measureText(test).width>maxW && line){ ctx.fillText(line,x,yy); line=words[i]; yy+=lh; n++; } else line=test; }
    ctx.fillText(line,x,yy); return n+1; }
  function money(n){ n=Math.round(n); var s=Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");
    return (n<0?"−$":"+$")+s; }

  // The shared play anatomy — identical grammar across every strategy: green = profit region,
  // red = loss region, muted diamond = breakeven. Establishing this once builds the association.
  function drawAnatomy(px, y, A){
    var pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149", muted=css("--muted")||"#8B9AAB", mono=css("--mono")||"monospace";
    ctx.save(); ctx.globalAlpha=A; ctx.textAlign="left"; ctx.font="700 10px "+mono;
    ctx.fillStyle=hexA(pos,0.95); ctx.fillText("● PROFIT", px, y);
    ctx.fillStyle=hexA(neg,0.95); ctx.fillText("● LOSS", px+78, y);
    ctx.fillStyle=hexA(muted,0.95); ctx.fillText("◆ BREAKEVEN", px+142, y);
    ctx.restore();
  }
  // Greeks fingerprint: four signed mini-bars (Δ direction, Θ decay, V vol, Γ accel) — up/green for a
  // positive exposure, down/red for negative — so the play's "shape" is legible at a glance.
  function drawGreeks(px, y, A){ var g=STRATS[curStrat]&&STRATS[curStrat].gk; if(!g) return;
    var pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149", muted=css("--muted")||"#8B9AAB",
        txt=css("--text")||"#E6EDF3", mono=css("--mono")||"monospace", labs=["Δ","Θ","V","Γ"];
    ctx.save(); ctx.globalAlpha=A; ctx.textAlign="left";
    ctx.font="700 9px "+mono; ctx.fillStyle=hexA(muted,0.7); ctx.fillText("GREEKS", px, y);
    ctx.font="700 8px "+mono; ctx.fillStyle=hexA(muted,0.45); ctx.fillText("Δ dir · Θ decay · V vol · Γ accel", px+52, y);
    var bw=12, gap=30, bx=px, mid=y+22, H=13;
    for(var i=0;i<4;i++){ var v=g[i], col=v>=0?pos:neg, bh=Math.max(1,Math.abs(v)*H);
      ctx.strokeStyle=hexA(muted,0.22); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(bx,mid); ctx.lineTo(bx+bw,mid); ctx.stroke();
      ctx.fillStyle=hexA(col,0.82); if(v>=0) ctx.fillRect(bx,mid-bh,bw,bh); else ctx.fillRect(bx,mid,bw,bh);
      ctx.fillStyle=hexA(col,0.95); ctx.font="700 9px "+mono; ctx.textAlign="center"; ctx.fillText(labs[i], bx+bw/2, mid+22);
      bx+=gap; }
    ctx.textAlign="left"; ctx.restore();
  }

  // The bot's job, made visible: it INGESTS data, DETECTS a signal, builds a FORECAST, then
  // EXECUTES the play. This four-step pipeline lights up phase-by-phase so the machine's role reads
  // at a glance — the humans' role is the narrow one (validate the read, take the seat) shown below.
  var PIPE=["INGEST","DETECT","FORECAST","EXECUTE"];
  function pipeActive(p){ if(p.out>0||p.resolve>0) return 3; if(p.walk>0) return 3; if(p.project>0) return 2; if(p.aim>0) return 1; return 0; }
  function drawPipeline(px, y, p, A){
    var accent=css("--accent")||"#35D0BA", muted=css("--muted")||"#8B9AAB", mono=css("--mono")||"monospace";
    var act=pipeActive(p), x=px;
    ctx.save(); ctx.globalAlpha=A; ctx.textAlign="left"; ctx.font="700 10px "+mono;
    for(var i=0;i<PIPE.length;i++){
      var on=i<=act, live=i===act, a=on?(live?0.95:0.6):0.28;
      ctx.fillStyle=hexA(on?accent:muted, a);
      if(live){ ctx.shadowColor=accent; ctx.shadowBlur=8; }
      ctx.fillText(PIPE[i], x, y); ctx.shadowBlur=0;
      var w=ctx.measureText(PIPE[i]).width;
      if(i<PIPE.length-1){ ctx.fillStyle=hexA(muted, i<act?0.55:0.25); ctx.fillText("→", x+w+7, y); }
      x+=w+24;
    }
    ctx.restore();
  }

  // LEFT-UPPER: the play in words — the bot pipeline, the detected signal, the strategy name and
  // plain-English idea, the shared anatomy legend, pivot values, and the live trade status.
  function drawPanel(strat, sig, p, A){
    var e=extrema(strat), px=Math.round(W*0.045), pw=Math.min(W*0.2, 238), col=190;
    var accent=css("--accent")||"#35D0BA", pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149",
        muted=css("--muted")||"#8B9AAB", txt=css("--text")||"#E6EDF3", mono=css("--mono")||"monospace", sans=css("--sans")||"sans-serif";
    ctx.save(); ctx.globalAlpha=A*Math.min(1,p.on); ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    // live P/L tracks the realized pen (Act 3), not the frozen "now"
    var curP=realized.length?realized[realized.length-1]:nowPrice;
    var uNow=clamp01((curP-signalPrice)/(volScale||1)+0.5), pl=dollarsAt(strat,e,payoffAt(strat.pts,uNow));
    // Narrow / mobile: stack — pipeline + signal + name + desc centered on top, pivots at the bottom.
    if(W<820){
      var cx=W/2, ny=field.top+18; ctx.textAlign="center";
      drawPipeline(cx-96, ny, p, A*Math.min(1,p.on)); ny+=22;
      ctx.font="700 11px "+mono; ctx.fillStyle=hexA(accent,0.95); ctx.fillText("▸ "+(sig?sig.sig:""), cx, ny); ny+=16;
      ctx.font="700 9px "+mono; ctx.fillStyle=hexA(muted,0.7); ctx.fillText("TIER "+strat.tier, cx, ny); ny+=21;
      ctx.font="700 22px "+sans; ctx.fillStyle=txt; ctx.shadowColor=accent; ctx.shadowBlur=12; ctx.fillText(strat.name, cx, ny); ctx.shadowBlur=0; ny+=19;
      ctx.font="12px "+sans; ctx.fillStyle=hexA(muted,0.95); wrapText(strat.desc, cx, ny, Math.min(W*0.86,420), 16);
      var by=field.bottom-6; drawAnatomy(cx-116, by-22, A*Math.min(1,p.on));
      ctx.textAlign="left"; ctx.font="700 11px "+mono;
      var s1="MAX PROFIT "+money(strat.maxP), s2="MAX LOSS "+money(strat.maxL);
      var w1=ctx.measureText(s1).width, w2=ctx.measureText(s2).width, gap=22, lx=cx-(w1+gap+w2)/2;
      ctx.fillStyle=hexA(pos,0.95); ctx.fillText(s1, lx, by);
      ctx.fillStyle=hexA(neg,0.95); ctx.fillText(s2, lx+w1+gap, by);
      ctx.restore(); return;
    }
    // Information unfolds in step with the play: pipeline first, then the signal + strategy name as
    // the spotlight aims, then the plain-English idea + anatomy + pivots as the forecast projects.
    var aimA=clamp01(p.aim), prjA=easeIO(clamp01(p.project));
    // Hierarchy: the PLAY NAME is the hero of this panel. The pipeline is a quiet process indicator
    // and the signal reason is small supporting context — neither competes with the name.
    var y=field.top+22;
    drawPipeline(px, y, p, A*Math.min(1,p.on)*0.5); y+=23;
    ctx.globalAlpha=A*aimA;
    ctx.font="600 11px "+mono; ctx.fillStyle=hexA(accent,0.72);
    ctx.fillText("▸ "+(sig?sig.sig:""), px, y); y+=17;
    ctx.font="700 9px "+mono; ctx.fillStyle=hexA(muted,0.7); ctx.fillText("TIER "+strat.tier, px, y); y+=27;   // complexity tier (clear of the big name below)
    ctx.font="700 30px "+sans; ctx.fillStyle=txt; ctx.shadowColor=accent; ctx.shadowBlur=22;
    ctx.fillText(strat.name, px, y); ctx.shadowBlur=0; y+=25;
    ctx.globalAlpha=A*prjA;
    ctx.font="13px "+sans; ctx.fillStyle=hexA(muted,0.95);
    y += wrapText(strat.desc, px, y, pw, 18)*18 + 14;
    drawAnatomy(px, y, A*prjA); y+=26;
    // Totals sit right beside their labels (a tight column), not flung to the far right.
    ctx.font="12px "+mono;
    ctx.fillStyle=hexA(pos,0.95); ctx.fillText("MAX PROFIT", px, y);
    ctx.fillStyle=hexA(txt,0.9); ctx.textAlign="right"; ctx.fillText(money(strat.maxP), px+col, y); ctx.textAlign="left"; y+=19;
    ctx.fillStyle=hexA(neg,0.95); ctx.fillText("MAX LOSS", px, y);
    ctx.fillStyle=hexA(txt,0.9); ctx.textAlign="right"; ctx.fillText(money(strat.maxL), px+col, y); ctx.textAlign="left"; y+=24;
    drawGreeks(px, y, A*prjA); y+=58;   // the play's Greeks fingerprint (bars + letters need clearance)
    ctx.globalAlpha=A;
    if(p.resolve>0){ ctx.font="700 16px "+mono; ctx.fillStyle=pl>=0?pos:neg; ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=14;
      var pctOfMax = strat.maxP>0 ? Math.round(pl/strat.maxP*100) : 0;
      var tag = (pl>0 && pctOfMax<92) ? "  · "+pctOfMax+"% OF MAX" : (pl>0?"  · LET IT RIDE":"");
      ctx.fillText("✓ PLAYCALL CLOSED  "+money(pl)+tag, px, y); ctx.shadowBlur=0; }   // book where the market actually landed
    else if(p.walk>0){ ctx.font="700 15px "+mono; ctx.fillStyle=pl>=0?pos:neg; ctx.fillText("PLAYCALL LIVE · P/L "+money(pl), px, y); }
    else if(p.project>0){ ctx.font="700 13px "+mono; ctx.fillStyle=hexA(accent,0.95); ctx.fillText("▲ PLAYCALL LOCKED", px, y); }
    else { ctx.font="13px "+mono; ctx.fillStyle=hexA(muted,0.85); ctx.fillText("READING THE TAPE…", px, y); }
    ctx.restore();
  }

  // Small helpers for the forecast: direction chevrons along the happy path, Madden-style corner
  // brackets that frame the "enhanced" future region, and the aiming beam.
  function drawChevron(x,y,dir,col){ if(!dir) return;
    ctx.strokeStyle=col; ctx.lineWidth=2; ctx.lineCap="round"; ctx.lineJoin="round"; var s=5;
    ctx.beginPath(); ctx.moveTo(x-s, y-dir*s*0.2); ctx.lineTo(x, y-dir*s); ctx.lineTo(x+s, y-dir*s*0.2); ctx.stroke(); ctx.lineCap="butt"; }
  function drawBrackets(x0,y0,x1,y1,color){ var L=14; ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.beginPath();
    ctx.moveTo(x0,y0+L); ctx.lineTo(x0,y0); ctx.lineTo(x0+L,y0);
    ctx.moveTo(x1-L,y0); ctx.lineTo(x1,y0); ctx.lineTo(x1,y0+L);
    ctx.moveTo(x0,y1-L); ctx.lineTo(x0,y1); ctx.lineTo(x0+L,y1);
    ctx.moveTo(x1-L,y1); ctx.lineTo(x1,y1); ctx.lineTo(x1,y1-L); ctx.stroke(); }
  // The spotlight IS the bot's signal detector: it fans from the emitter (button, bottom-center)
  // and NARROWS to aim precisely at the point on the trend where the condition triggered.
  function drawAimBeam(tx,ty,p){ var aim=easeIO(clamp01(p.aim))*(1-clamp01(p.walk)); if(aim<=0.01) return;
    var ax=W*0.5, ay=H+10, accent=css("--accent")||"#35D0BA";
    var dx=tx-ax, dy=ty-ay, len=Math.sqrt(dx*dx+dy*dy)||1, nx=-dy/len, ny=dx/len;
    var hNear=lerp(96,10,aim), hFar=lerp(64,7,aim);
    ctx.save(); ctx.globalAlpha=1;
    var g=ctx.createLinearGradient(ax,ay,tx,ty); g.addColorStop(0,hexA(accent,0.015)); g.addColorStop(1,hexA(accent,0.16*aim));
    ctx.beginPath(); ctx.moveTo(ax+nx*hNear, ay+ny*hNear); ctx.lineTo(tx+nx*hFar, ty+ny*hFar);
    ctx.lineTo(tx-nx*hFar, ty-ny*hFar); ctx.lineTo(ax-nx*hNear, ay-ny*hNear); ctx.closePath(); ctx.fillStyle=g; ctx.fill();
    var rr=10+3*Math.sin(pbGlyphT*0.4);
    ctx.strokeStyle=hexA(accent,0.85*aim); ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(tx,ty,rr,0,7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx-rr*1.6,ty); ctx.lineTo(tx-rr,ty); ctx.moveTo(tx+rr,ty); ctx.lineTo(tx+rr*1.6,ty); ctx.stroke();
    ctx.restore(); }
  // The signal EVIDENCE + the THESIS, a callout ANCHORED to the aim point (not a right column): RSI +
  // a mini oversold/overbought gauge, the one-line reason, then WHY the market should behave this way
  // and the CONDITION that must hold. This is the "why we're calling it" beat. Fades in on AIM.
  function drawSignalCallout(sig, strat, x, y, A){ if(A<=0.01) return;
    var accent=css("--accent")||"#35D0BA", pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149",
        muted=css("--muted")||"#8B9AAB", txt=css("--text")||"#E6EDF3", mono=css("--mono")||"monospace", bg=css("--bg")||"#0B0F14";
    // Anchor to the RIGHT of the entry, up near the top of the frame — clear of the left playbook panel.
    var cw=228, ch=178, cx=Math.min(x+30, W-cw-16); var cy=field.top+4;
    ctx.save(); ctx.globalAlpha=A;
    ctx.setLineDash([2,4]); ctx.strokeStyle=hexA(accent,0.5); ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx+16, cy+ch); ctx.lineTo(x,y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=hexA(bg,0.9); roundRect(cx,cy,cw,ch,8); ctx.fill();
    ctx.strokeStyle=hexA(accent,0.55); ctx.lineWidth=1; roundRect(cx,cy,cw,ch,8); ctx.stroke();
    var px=cx+13, gw=cw-26, yy=cy+18; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    ctx.font="700 9px "+mono; ctx.fillStyle=hexA(accent,0.9); ctx.fillText("▣ SIGNAL DETECTED", px, yy); yy+=18;
    var rc=rsiV<30?pos:(rsiV>70?neg:txt);
    ctx.font="700 11px "+mono; ctx.fillStyle=hexA(muted,0.9); ctx.fillText("RSI", px, yy);
    ctx.fillStyle=hexA(rc,0.95); ctx.fillText(rsiV.toFixed(0), px+30, yy);
    var gx=px, gy=yy+8, gh=6;
    ctx.fillStyle=hexA(muted,0.16); ctx.fillRect(gx,gy,gw,gh);
    ctx.fillStyle=hexA(pos,0.22); ctx.fillRect(gx,gy,gw*0.3,gh);
    ctx.fillStyle=hexA(neg,0.22); ctx.fillRect(gx+gw*0.7,gy,gw*0.3,gh);
    var mp=gx+gw*clamp01(rsiV/100); ctx.fillStyle=rc; ctx.fillRect(mp-1.5,gy-2,3,gh+4);
    yy=gy+gh+14; ctx.font="9px "+mono; ctx.fillStyle=hexA(accent,0.85); yy+=wrapText((sig?sig.sig:""), px, yy, gw, 12)*12+6;
    ctx.strokeStyle=hexA(muted,0.25); ctx.beginPath(); ctx.moveTo(px,yy-8); ctx.lineTo(px+gw,yy-8); ctx.stroke();
    ctx.font="700 8px "+mono; ctx.fillStyle=hexA(muted,0.7); ctx.fillText("WHY", px, yy); yy+=12;
    ctx.font="9px "+mono; ctx.fillStyle=hexA(txt,0.9); yy+=wrapText(strat?strat.why:"", px, yy, gw, 12)*12+3;
    ctx.font="700 8px "+mono; ctx.fillStyle=hexA(muted,0.7); ctx.fillText("IF", px, yy); yy+=12;
    ctx.font="9px "+mono; ctx.fillStyle=hexA(accent,0.82); wrapText(strat?strat.hold:"", px, yy, gw, 12);
    ctx.restore(); }
  // RETROSPECTIVE recap, shown once the play resolves: restates the play, confirms the condition held,
  // names the events that moved it, and books the result — so the user's read of the animation is
  // confirmed against the outcome. Anchored where the signal card was (they never coexist).
  function drawRecap(strat, sig, x, y, A){ if(A<=0.01||!strat) return;
    var accent=css("--accent")||"#35D0BA", pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149",
        muted=css("--muted")||"#8B9AAB", txt=css("--text")||"#E6EDF3", mono=css("--mono")||"monospace", bg=css("--bg")||"#0B0F14";
    var cw=228, ch=162, cx=Math.min(x+30, W-cw-16), cy=field.top+4;
    var e=extrema(strat), uEx=clamp01((targetPrice-signalPrice)/(volScale||1)+0.5),
        pl=dollarsAt(strat,e,payoffAt(strat.pts,uEx)), pct=Math.round(pl/(strat.maxP||1)*100),
        win=pl>=0, rcol=win?pos:neg;
    ctx.save(); ctx.globalAlpha=A;
    ctx.fillStyle=hexA(bg,0.92); roundRect(cx,cy,cw,ch,8); ctx.fill();
    ctx.strokeStyle=hexA(rcol,0.5); ctx.lineWidth=1; roundRect(cx,cy,cw,ch,8); ctx.stroke();
    var px=cx+13, gw=cw-26, yy=cy+18; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    ctx.font="700 9px "+mono; ctx.fillStyle=hexA(rcol,0.9); ctx.fillText("▣ PLAYCALL RECAP", px, yy); yy+=18;
    ctx.font="700 12px "+mono; ctx.fillStyle=hexA(txt,0.95); ctx.fillText(strat.name, px, yy); yy+=16;
    ctx.font="9px "+mono; ctx.fillStyle=hexA(rcol,0.9); ctx.fillText((win?"✓ READ HELD":"✗ READ BROKE"), px, yy); yy+=14;
    ctx.fillStyle=hexA(txt,0.85); yy+=wrapText(strat.hold, px, yy, gw, 12)*12+3;
    var evl=""; for(var i=0;i<events.length;i++){ if(events[i].fired) evl+=(evl?" · ":"")+events[i].label; }
    if(evl){ ctx.font="8px "+mono; ctx.fillStyle=hexA(muted,0.75); yy+=wrapText("through "+evl, px, yy, gw, 11)*11+2; }
    ctx.strokeStyle=hexA(muted,0.25); ctx.beginPath(); ctx.moveTo(px,yy-4); ctx.lineTo(px+gw,yy-4); ctx.stroke(); yy+=12;
    ctx.font="700 12px "+mono; ctx.fillStyle=hexA(rcol,0.95); ctx.fillText("BOOKED "+money(pl), px, yy);
    ctx.font="700 9px "+mono; ctx.fillStyle=hexA(muted,0.8); ctx.fillText(pct+"% OF MAX", px, yy+15);
    ctx.restore(); }

  // FORECAST-ON-TREND: the called play is drawn into the FUTURE (right of "now", where there is no
  // data yet), anchored to the live trend. The bot's forecast = horizontal profit(green)/loss(red)
  // PRICE BANDS, dotted BREAKEVEN levels, a dotted happy-path PROJECTION with direction arrows, and
  // an entry→target track. During WALK the solid trend climbs into the band and the trade resolves.
  // Information unfolds phase-by-phase (aim → project → walk → resolve) so it reads at a digestible
  // pace rather than arriving all at once.
  function drawForecast(strat, sig, p){
    if(!strat) return;
    var A=1-p.out, proj=easeIO(clamp01(p.project));
    var accent=css("--accent")||"#35D0BA", pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149",
        muted=css("--muted")||"#8B9AAB", txt=css("--text")||"#E6EDF3", mono=css("--mono")||"monospace";
    var e=extrema(strat);
    var X0=nowSX, Xf=Math.min(W*0.93, X0+Math.max(180,(W-X0)-40)); if(Xf<X0+90) Xf=X0+90;
    function SY(P){ return nowSY-(P-nowPrice)*pxPerPrice; }
    function priceOf(u){ return signalPrice+(u-0.5)*volScale; }
    var loP=signalPrice-volScale*0.55, hiP=signalPrice+volScale*0.55;
    ctx.save(); ctx.globalAlpha=A;
    if(proj>0.01){
      // Opaque backing behind the whole play chart (bands + candles + RSI rail) so the tape reads
      // with strong contrast against the busy market/matrix behind it.
      var chTop=SY(hiP)-14, chBot=Math.min(field.bottom-4, SY(loP)+60);
      ctx.fillStyle=hexA(css("--bg")||"#0B0F14", 0.55*proj); ctx.fillRect(X0-6, chTop, (Xf+40)-(X0-6), chBot-chTop);
      // --- MARKET CONTEXT projected into the future (all dotted = tentative, drawn UNDER the play
      // so it frames the bigger picture without stealing focus). Which overlays lead depends on the
      // play's setup: vol cone for breakout plays, support/resistance for range plays, momentum for
      // directional plays. ---
      var cue=strat.cue, emVol=0.7, emSR=0.9, emMom=0.6;
      if(cue==="VOL EXPANDING"||cue==="BREAKOUT RISK"){ emVol=1; emSR=0.55; emMom=0.7; }
      else if(cue==="UPTREND"){ emVol=0.6; emSR=0.8; emMom=1; }
      else { emVol=0.7; emSR=1; emMom=0.55; }   // LOW VOL / RANGE-BOUND / PINNED
      var nn=price.length, lst=nn-1;
      var midP=(smaA[lst]!=null?smaA[lst]:signalPrice), bwHalf=Math.max((bU[lst]-bL[lst])/2, volScale*0.12);
      // Bollinger volatility cone — the expected dispersion, widening with sqrt(time).
      var CS=26; ctx.setLineDash([2,5]); ctx.lineWidth=1;
      ctx.beginPath();
      for(var cc=0;cc<=CS;cc++){ var t0=cc/CS, hw0=bwHalf*(1+0.9*Math.sqrt(t0)), cx0=X0+(Xf-X0)*t0; cc?ctx.lineTo(cx0,SY(midP+hw0)):ctx.moveTo(cx0,SY(midP+hw0)); }
      for(var cd=CS;cd>=0;cd--){ var t1=cd/CS, hw1=bwHalf*(1+0.9*Math.sqrt(t1)), cx1=X0+(Xf-X0)*t1; ctx.lineTo(cx1,SY(midP-hw1)); }
      ctx.closePath(); ctx.fillStyle=hexA(accent,0.05*proj*emVol); ctx.fill();
      for(var sd=-1;sd<=1;sd+=2){ ctx.strokeStyle=hexA(accent,0.3*proj*emVol); ctx.beginPath();
        for(var ce=0;ce<=CS;ce++){ var t2=ce/CS, hw2=bwHalf*(1+0.9*Math.sqrt(t2)), cx2=X0+(Xf-X0)*t2; ce?ctx.lineTo(cx2,SY(midP+sd*hw2)):ctx.moveTo(cx2,SY(midP+sd*hw2)); } ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.font="700 8px "+mono; ctx.textAlign="left"; ctx.fillStyle=hexA(accent,0.7*proj*emVol);
      ctx.fillText("VOL", X0+(Xf-X0)*0.5, SY(midP+bwHalf*1.9)-2);
      // Support / Resistance from recent swings — dotted levels extending into the forecast.
      var s0=Math.max(0,nn-80), hiSR=-1e9, loSR=1e9;
      for(var qq=s0;qq<nn;qq++){ if(price[qq]>hiSR)hiSR=price[qq]; if(price[qq]<loSR)loSR=price[qq]; }
      ctx.setLineDash([1,4]); ctx.lineWidth=1; ctx.font="700 8px "+mono; ctx.textAlign="left";
      var rY=SY(hiSR), sY=SY(loSR);
      ctx.strokeStyle=hexA(muted,0.4*proj*emSR); ctx.beginPath(); ctx.moveTo(X0-60,rY); ctx.lineTo(Xf,rY); ctx.stroke();
      ctx.fillStyle=hexA(muted,0.7*proj*emSR); ctx.fillText("R", Xf+5, rY+3);
      ctx.strokeStyle=hexA(muted,0.4*proj*emSR); ctx.beginPath(); ctx.moveTo(X0-60,sY); ctx.lineTo(Xf,sY); ctx.stroke();
      ctx.fillStyle=hexA(muted,0.7*proj*emSR); ctx.fillText("S", Xf+5, sY+3);
      ctx.setLineDash([]);
      // Momentum read — sign+strength of the fast EMA slope, near the entry.
      var mom=emaF[lst]-emaF[Math.max(0,lst-8)], mcol=mom>0.03?pos:(mom<-0.03?neg:muted), msym=mom>0.03?"▲":(mom<-0.03?"▼":"→");
      ctx.font="700 9px "+mono; ctx.textAlign="left"; ctx.fillStyle=hexA(mcol,0.85*proj*emMom);
      ctx.fillText("MOM "+msym, X0+7, SY(nowPrice)+15);
      // horizontal profit/loss PRICE BANDS across the future region
      var NB=72, sh=Math.abs(SY(hiP)-SY(loP))/(NB-1)+1;
      for(var i=0;i<NB;i++){ var P=loP+(hiP-loP)*(i/(NB-1)), u=(P-signalPrice)/(volScale||1)+0.5, v=payoffAt(strat.pts,u);
        if(Math.abs(v)<0.05) continue; ctx.fillStyle=hexA(v>0?pos:neg, 0.14*proj*Math.min(1,Math.abs(v)*1.6));
        ctx.fillRect(X0, SY(P)-sh/2, Xf-X0, sh); }
      // "now" divider — the boundary between recorded history and forecast
      ctx.setLineDash([2,5]); ctx.strokeStyle=hexA(txt,0.35*proj); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(X0,SY(hiP)); ctx.lineTo(X0,SY(loP)); ctx.stroke(); ctx.setLineDash([]);
      // dotted breakeven levels
      ctx.setLineDash([4,6]); ctx.font="700 9px "+mono; ctx.textAlign="left";
      for(var k=0;k<e.be.length;k++){ var by=SY(priceOf(e.be[k]));
        ctx.strokeStyle=hexA(muted,0.55*proj); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(X0,by); ctx.lineTo(Xf,by); ctx.stroke();
        ctx.fillStyle=hexA(muted,0.85*proj); ctx.fillText("B/E", Xf+5, by+3); }
      ctx.setLineDash([]);
      // Madden-style corner brackets that FRAME the enhanced future (the "enhance, zoom" read)
      drawBrackets(X0-6, SY(hiP)-12, Xf+40, SY(loP)+12, hexA(accent,0.45*proj));
    }
    // happy-path dotted PROJECTION from now → target, with direction arrows
    var up=targetPrice>signalPrice+volScale*0.03, dn=targetPrice<signalPrice-volScale*0.03;
    var acol=up?pos:(dn?neg:muted), dir=up?-1:(dn?1:0);
    var yNow=SY(nowPrice), yTgt=SY(targetPrice);
    if(proj>0.01){
      ctx.setLineDash([3,5]); ctx.strokeStyle=hexA(acol,0.85*proj); ctx.lineWidth=1.6; ctx.beginPath();
      var SEG=28; for(var s=0;s<=SEG;s++){ var tt=s/SEG, xx=X0+(Xf-X0)*tt, yy=yNow+(yTgt-yNow)*easeIO(tt); s?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy); }
      ctx.stroke(); ctx.setLineDash([]);
      for(var a=1;a<=3;a++){ var t2=a/4, ax2=X0+(Xf-X0)*t2, ay2=yNow+(yTgt-yNow)*easeIO(t2); drawChevron(ax2,ay2,dir,hexA(acol,0.95*proj)); }
      // entry marker (at now) + target marker (max-profit price)
      ctx.fillStyle=hexA(accent,0.95*proj); ctx.beginPath(); ctx.arc(X0,yNow,3.5,0,7); ctx.fill();
      ctx.font="700 9px "+mono; ctx.textAlign="left"; ctx.fillStyle=hexA(accent,0.9*proj); ctx.fillText("ENTRY", X0+7, yNow-7);
      var tpulse=p.resolve>0?(0.5+0.5*Math.sin(pbGlyphT*0.5)):0;
      ctx.strokeStyle=hexA(acol,0.9*proj); ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(Xf,yTgt,5+5*tpulse,0,7); ctx.stroke();
      var uT=clamp01((targetPrice-signalPrice)/(volScale||1)+0.5);
      ctx.textAlign="right"; ctx.fillStyle=hexA(acol,0.95*proj); ctx.fillText("TARGET "+money(dollarsAt(strat,e,payoffAt(strat.pts,uT))), Xf-6, yTgt-9);
    }
    // Macro-event callouts — a dotted tick + label at each event the tape has reached, naming the
    // abnormal deviation there (earnings, CPI, …). This is what explains the less-normal wiggles.
    if(proj>0.01){ ctx.textAlign="center";
      for(var ei=0;ei<events.length;ei++){ var ev=events[ei], ex=X0+(Xf-X0)*ev.f, eyTop=SY(hiP), ay=eyTop-9;
        if(!ev.fired){
          // Surprises can't be foreseen — stay hidden until they hit. Scheduled events are PRE-MARKED
          // faintly (a hollow diamond + dim label + SCHEDULED) since their date is known in advance.
          if(!ev.scheduled) continue;
          ctx.setLineDash([1,5]); ctx.strokeStyle=hexA(muted,0.28*proj); ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(ex,eyTop); ctx.lineTo(ex,SY(loP)); ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle=hexA(muted,0.55*proj); ctx.lineWidth=1;
          ctx.beginPath(); ctx.moveTo(ex,ay-6); ctx.lineTo(ex+4,ay-2); ctx.lineTo(ex,ay+2); ctx.lineTo(ex-4,ay-2); ctx.closePath(); ctx.stroke();
          ctx.font="700 9px "+mono; ctx.fillStyle=hexA(muted,0.7*proj); ctx.fillText(ev.label, ex, ay-11);
          ctx.font="700 7px "+mono; ctx.fillStyle=hexA(muted,0.45*proj); ctx.fillText("SCHEDULED", ex, ay-21);
          continue;
        }
        var bull=ev.mag>=0, ecol=bull?pos:neg;
        ctx.setLineDash([2,4]); ctx.strokeStyle=hexA(ecol,0.5*proj); ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(ex,eyTop); ctx.lineTo(ex,SY(loP)); ctx.stroke(); ctx.setLineDash([]);
        // Directional arrow: green triangle UP for a bullish surprise, red triangle DOWN for bearish.
        var ah=7, aw=5; ctx.fillStyle=hexA(ecol,0.95*proj); ctx.beginPath();
        if(bull){ ctx.moveTo(ex,ay-ah); ctx.lineTo(ex-aw,ay); ctx.lineTo(ex+aw,ay); }
        else { ctx.moveTo(ex,ay); ctx.lineTo(ex-aw,ay-ah); ctx.lineTo(ex+aw,ay-ah); }
        ctx.closePath(); ctx.fill();
        if(ei===warpIdx){ var pz=0.5+0.5*Math.sin(pbGlyphT*0.28);
          ctx.strokeStyle=hexA(ecol,(0.45+0.4*pz)*proj); ctx.lineWidth=1.4;
          ctx.beginPath(); ctx.arc(ex, ay-ah/2, 9+pz*5, 0, 7); ctx.stroke(); }
        // Unscheduled shocks are flagged with a "!" so they read as a surprise, not a calendar event.
        ctx.font="700 9px "+mono; ctx.fillStyle=hexA(ecol,(ei===warpIdx?1:0.9)*proj);
        ctx.fillText((ev.scheduled?"":"! ")+ev.label, ex, ay-ah-4);
        // Earnings cross-read note (big tech signals peers) under the label.
        if(ev.note){ ctx.font="700 7px "+mono; ctx.fillStyle=hexA(muted,0.7*proj); ctx.fillText("→ "+ev.note, ex, ay-ah-15); } }
      ctx.textAlign="start"; }
    ctx.textAlign="start"; ctx.restore();
    // RSI oscillator lane, parallel below the candles during the walk — the overbought/oversold read
    // that drives entries + profit-taking, aligned tick-for-tick with the realized tape above it.
    if(p.walk>0 && realized.length>3){
      var dxL=W/(SPAN-1), comb=price.slice(0,nowIdx+1).concat(realized), rl2=realized.length;
      var lt=SY(loP)+18, lh=40; if(lt+lh>field.bottom-6) lt=field.bottom-6-lh; var lb=lt+lh;
      // The RSI RAIL (backing, zones, guides, labels) is laid across the WHOLE region up front; only
      // the RSI LINE grows as the present advances. So the rail spans x0L..Xf; the line stops at xNL.
      var x0L=nowSX+dxL*zoom, xNL=nowSX+rl2*dxL*zoom, xR=Xf;
      function ryL(v){ return lb-(clamp01(v/100))*lh; }
      ctx.save(); ctx.globalAlpha=A*proj;
      ctx.fillStyle=hexA(css("--bg")||"#0B0F14",0.72); ctx.fillRect(x0L, lt-2, xR-x0L, lh+4);   // opaque backing for contrast
      ctx.fillStyle=hexA(neg,0.08); ctx.fillRect(x0L, ryL(100), xR-x0L, ryL(70)-ryL(100));   // overbought zone
      ctx.fillStyle=hexA(pos,0.08); ctx.fillRect(x0L, ryL(30), xR-x0L, ryL(0)-ryL(30));       // oversold zone
      ctx.setLineDash([2,4]); ctx.lineWidth=1;
      ctx.strokeStyle=hexA(neg,0.42); ctx.beginPath(); ctx.moveTo(x0L,ryL(70)); ctx.lineTo(xR,ryL(70)); ctx.stroke();
      ctx.strokeStyle=hexA(muted,0.25); ctx.beginPath(); ctx.moveTo(x0L,ryL(50)); ctx.lineTo(xR,ryL(50)); ctx.stroke();
      ctx.strokeStyle=hexA(pos,0.42); ctx.beginPath(); ctx.moveTo(x0L,ryL(30)); ctx.lineTo(xR,ryL(30)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      for(var rk=0;rk<rl2;rk++){ var rv=rsi(comb.slice(0,nowIdx+2+rk),14), rx=nowSX+(rk+1)*dxL*zoom;
        rk?ctx.lineTo(rx,ryL(rv)):ctx.moveTo(rx,ryL(rv)); }
      ctx.strokeStyle=hexA(accent,0.9); ctx.lineWidth=1.4; ctx.lineJoin="round";
      ctx.shadowColor=accent; ctx.shadowBlur=5; ctx.stroke(); ctx.shadowBlur=0;
      ctx.font="700 8px "+mono; ctx.textAlign="left";
      ctx.fillStyle=hexA(muted,0.7); ctx.fillText("RSI", x0L+2, lt-3);
      ctx.fillStyle=hexA(neg,0.6); ctx.fillText("70", xR+4, ryL(70)+3);
      ctx.fillStyle=hexA(pos,0.6); ctx.fillText("30", xR+4, ryL(30)+3);
      ctx.textAlign="start"; ctx.restore();
    }
    drawPanel(strat, sig, p, A);
    // The thesis + recap cards are desktop-only — on narrow screens they'd collide with the centered
    // stacked panel, which already carries the play's essentials.
    if(W>=820){
      // signal callout is anchored to the aim point and fades out once the walk takes over
      if(p.aim>0) drawSignalCallout(sig, strat, X0, yNow, A*clamp01(p.aim)*(1-clamp01(p.walk*1.4)));
      // Retrospective recap once the play resolves — confirms the thesis played out (bookends the WHY).
      var recapA=A*clamp01((p.resolve-0.45)/0.55)*(1-clamp01(p.out*1.7));
      if(recapA>0.01) drawRecap(strat, sig, X0, yNow, recapA);
    }
    drawAimBeam(X0, yNow, p);
  }
  // Play phases (ms): DETECT → AIM → ZOOM → PROJECT → WALK-forward → RESOLVE → HOLD → ZOOM-OUT.
  // Each phase is followed by a short DWELL so the last thing shown isn't rushed into the next step —
  // the reveal breathes. A longer HOLD after RESOLVE lets the "closed +$" land before we zoom out.
  var DET=640,AIM=760,DW_AIM=760,ZM=620,PRJ=880,DW_PRJ=320,WLK=4200,RES=700,HOLD=1900,OUT=820;
  var T_AIM=DET, T_ZM=T_AIM+AIM+DW_AIM, T_PRJ=T_ZM+ZM, T_WLK=T_PRJ+PRJ+DW_PRJ,
      T_RES=T_WLK+WLK, T_OUT=T_RES+RES+HOLD, T_END=T_OUT+OUT;
  var ACTB=[0, T_PRJ, T_WLK, T_RES];   // act boundaries (e-time): SIGNAL · PREDICT · REALIZE · RESOLVE
  function playProg(e){ return {
    on:clamp01(e/DET), aim:clamp01((e-T_AIM)/AIM), zoom:clamp01((e-T_ZM)/ZM),
    project:clamp01((e-T_PRJ)/PRJ), walk:clamp01((e-T_WLK)/WLK), resolve:clamp01((e-T_RES)/RES),
    out: e>T_OUT?clamp01((e-T_OUT)/OUT):0 }; }
  var playMode=false, playStart=0, curStrat=0, curSig=null, nextPlayAt=2400, rainBoost=0, rainTint=0;
  // Camera + time: cam (0 ambient → 1 framed), zoom eased; rate = eased time multiplier (slow-mo).
  var zoom=1, cam=0, rate=1, stepAcc=0, signalPrice=100, targetPrice=100, volScale=10;
  // Screen anchor for "now" (leading price) + price→pixel scale, exported by drawMarket so the
  // forecast draws the future in the same frame as the live trend.
  var nowSX=0, nowSY=0, nowPrice=100, pxPerPrice=1;
  var scBaseY=0, scMid=100, scSpan=1, scAmp=1;   // exported ambient Y-mapping (set in drawMarket)
  // User-called plays (the Playbook): requestedPlay queues a specific play; SUMMON steers the trend
  // to that play's setup before the enhance-zoom fires; manualPlay slows the pace + enables hold.
  var requestedPlay=null, manualPlay=false, paceScale=1, paused=false,
      summoning=false, summonEnd=0, summonIdx=0, zoomRippled=false, ripples=[];
  // Three-act playcall: on fire we FREEZE history at nowIdx (stop pushing price[]) so the trend
  // holds still; in Act 3 a separate realized[] pen draws rightward INTO the prediction, overtaking
  // the dotted forecast, then folds back into price[] on zoom-out so ambient continues from reality.
  var nowIdx=0, realized=[], realizedAlpha=1, pvR=0, stepTarget=null, exitFrac=1, events=[], playVol=1;
  var eventWarp=1, warpIdx=-1;   // time-dilation as the pen walks through a high-vol event (1 = real-time)
  // Macro events (earnings, CPI, …) that jolt the trend and get a callout — they explain the less
  // normal-looking deviations of the realized line, and add realism + a teaching moment.
  // SCHEDULED events are known in advance (their DATE is on the calendar; only the outcome surprises) —
  // so they're pre-marked on the timeline and the shock lands when the tape reaches them. SURPRISES
  // (geopolitical / black-swan) can't be foreseen, so they only pop in at the moment they hit.
  var MACRO=["CPI PRINT","FOMC","JOBS REPORT","PPI PRINT"];         // scheduled macro prints
  var TECH=["NVDA","GOOG","TSLA","MSFT","AAPL","AMD"];              // scheduled earnings, real tickers
  var SURPRISE=["GEOPOLITICAL","RATE SHOCK","HEADLINE RISK"];       // unscheduled shocks
  // Big tech drives the tape: one name's earnings is an early read on peers (AI capex, cloud, demand).
  var CROSS={ NVDA:"AI capex read", GOOG:"cloud + AI capex", TSLA:"demand read", MSFT:"Azure AI spend", AAPL:"consumer read", AMD:"AI silicon read" };
  function scheduleEvents(){ events=[]; var nE=Math.random()<0.4?2:1, k;
    // Bias the shock direction to mostly AGREE with the play's target move, so the arrow reinforces
    // the trend the trade is positioned for (directional plays); range plays stay random either way.
    var tdir=targetPrice>signalPrice+volScale*0.03?1:(targetPrice<signalPrice-volScale*0.03?-1:0);
    for(k=0;k<nE;k++){ var dir=tdir!==0?(Math.random()<0.72?tdir:-tdir):(Math.random()<0.5?-1:1);
      var r=Math.random(), sched=true, label="", note="";
      if(r<0.42){ var tk=TECH[(Math.random()*TECH.length)|0]; label=tk+" EARNINGS"; note=CROSS[tk]||""; }
      else if(r<0.76){ label=MACRO[(Math.random()*MACRO.length)|0]; }
      else { sched=false; label=SURPRISE[(Math.random()*SURPRISE.length)|0]; }
      events.push({ f:0.26+Math.random()*0.34, label:label, note:note, scheduled:sched,
        mag:dir*volScale*(0.12+Math.random()*0.16), fired:false }); } }   // mid-walk, time to recover
  function eventImpulse(i, cap){ var f=i/cap, s=0, k;
    for(k=0;k<events.length;k++){ if(!events[k].fired && f>=events[k].f){ events[k].fired=true; s+=events[k].mag; } }
    return s; }

  resize(); rainResize();
  window.addEventListener("resize", function(){ resize(); rainResize(); });

  // Reveal: one toggle opens/closes the form; the single wordmark flies into the form as its title.
  var wordmark=document.getElementById("wordmark"), brandSlot=document.getElementById("brandSlot"),
      beaconLabel=document.getElementById("beaconLabel");
  // Shared-element FLIP: measure the title's rest rect and the form slot's final rect, then glide.
  function flyTitle(on){
    if(!wordmark || !brandSlot) return;
    if(!on){ wordmark.style.transform=""; return; }
    wordmark.style.transform="none";
    var wr=wordmark.getBoundingClientRect();
    document.body.classList.add("measuring");      // read the slot at its final centered position
    var sr=brandSlot.getBoundingClientRect(), cw=cardEl?cardEl.getBoundingClientRect().width:sr.width;
    document.body.classList.remove("measuring");
    var dx=(sr.left+sr.width/2)-(wr.left+wr.width/2), dy=(sr.top+sr.height/2)-(wr.top+wr.height/2);
    var sc=Math.max(0.7, Math.min(1.5, (cw*0.84)/(wr.width||1)));   // land sized to fit the form
    void wordmark.offsetWidth;                      // commit before animating (instant under reduced motion)
    wordmark.style.transform="translate("+dx.toFixed(1)+"px,"+dy.toFixed(1)+"px) scale("+sc.toFixed(3)+")";
  }
  var seq=[];
  function clearSeq(){ for(var i=0;i<seq.length;i++) clearTimeout(seq[i]); seq=[]; }
  function focusForm(){ if(cardEl){ var b=cardEl.querySelector(".btn"); if(b) setTimeout(function(){ try{ b.focus(); }catch(e){} }, 120); } }
  // Sequenced reveal: (1) the title flies down alone with no VFX, (2) it lands and a left→right
  // sweep + chromatic flare fires, (3) THEN the form falls into place — no jarring simultaneous pop.
  function setReveal(on){ revealed=on; clearSeq(); var body=document.body;
    if(beaconEl) beaconEl.setAttribute("aria-expanded", on?"true":"false");
    if(cardEl) cardEl.style.transform="";          // stable form: drop any pointer tilt while open
    if(!on){ if(beaconLabel) beaconLabel.textContent="Enter the sandbox";
      body.classList.remove("revealed","flying"); if(wordmark) wordmark.classList.remove("vfx"); flyTitle(false); measureField();
      if(beaconEl){ try{ beaconEl.focus(); }catch(e){} } return; }
    if(reduce){ if(beaconLabel) beaconLabel.textContent="Close"; body.classList.add("revealed"); flyTitle(true); measureField(); focusForm(); return; }
    body.classList.remove("revealed"); body.classList.add("flying");   // beam starts narrowing immediately
    flyTitle(true); measureField();
    // As the narrowing beam reaches the hero, the single VFX-text-cursor effect fires on the title.
    if(wordmark){ wordmark.classList.remove("vfx"); void wordmark.offsetWidth; wordmark.classList.add("vfx"); }
    vfxPlay();   // canvas hangar-door sweep behind the blooming title
    // Form only falls into place once the title has landed and can be read.
    seq.push(setTimeout(function(){ body.classList.remove("flying"); body.classList.add("revealed");
      if(beaconLabel) beaconLabel.textContent="Close"; focusForm(); }, 760));
  }
  if(beaconEl) beaconEl.addEventListener("click", function(){ setReveal(!revealed); });
  document.addEventListener("keydown", function(e){ if(e.key==="Escape" && revealed) setReveal(false); });
  window.addEventListener("resize", function(){ if(revealed) flyTitle(true); });   // keep the landing aligned
  if(document.querySelector(".error")) setReveal(true);   // never hide an error behind the toggle

  // Cursor VFX: subtle ambient pointer glow + chromatic split; the card tilts only while at rest.
  var fine = window.matchMedia && window.matchMedia("(pointer:fine)").matches, root=document.documentElement;
  if(fine && !reduce){ document.body.classList.add("finepointer");
    window.addEventListener("pointermove", function(e){
      root.style.setProperty("--cx", e.clientX+"px"); root.style.setProperty("--cy", e.clientY+"px");
      var dx=(e.clientX/window.innerWidth)-0.5, dy=(e.clientY/window.innerHeight)-0.5;
      root.style.setProperty("--cax",(0.4+dx*1.4).toFixed(2)+"px"); root.style.setProperty("--cay",(dy*1.2).toFixed(2)+"px");
      if(cardEl && !revealed){ cardEl.style.transform="rotateX("+(-dy*6).toFixed(2)+"deg) rotateY("+(dx*8).toFixed(2)+"deg)";
        cardEl.style.setProperty("--sheen",(115+dx*70).toFixed(0)+"deg"); }
    }); }

  // Set the forecast anchors (signal price, vol scale, happy-path target) for a chosen strategy.
  function armForecast(idx){ var last=price.length-1;
    signalPrice=price[last];
    volScale=Math.max((bU[last]-bL[last])||0, signalPrice*0.05)*1.7;
    var ex=extrema(STRATS[idx]);
    // Exit varies: ~30% let it ride to (near) max, otherwise scrape a favorable swing at 55–90% of max.
    exitFrac = Math.random()<0.3 ? (0.94+Math.random()*0.06) : (0.55+Math.random()*0.35);
    var tU=exitU(STRATS[idx], ex, exitFrac);   // take-profit point (partway to max), not always the plateau
    targetPrice=signalPrice+(tU-0.5)*volScale; }

  // Steer the market toward the setup a play needs (from its cue) so the trend visibly transitions
  // into "ripe conditions" before the playcall fires — reuses the regime vars the walk already runs.
  function steerFor(idx){ var c=STRATS[idx].cue; regimeT=t+400;
    if(c==="UPTREND"){ regimeBias=0.11; regimeVol=0.8; }
    else if(c==="VOL EXPANDING"||c==="BREAKOUT RISK"){ regimeBias=(Math.random()<0.5?-1:1)*0.02; regimeVol=1.9; }
    else { regimeBias=0; regimeVol=0.4; }   // LOW VOL / RANGE-BOUND / PINNED → calm, tight
  }
  // A ripple in the matrix at the aim point — the "enhance, zoom in" flourish on playcall entry.
  function addRipple(x,y){ ripples.push({ x:x, y:y, t:0 }); }
  function drawRipples(){ var accent=css("--accent")||"#35D0BA";
    for(var i=ripples.length-1;i>=0;i--){ var r=ripples[i]; r.t++;
      var pr=r.t/24; if(pr>=1){ ripples.splice(i,1); continue; }
      var rad=8+pr*170, a=(1-pr)*0.5;
      ctx.strokeStyle=hexA(accent,a); ctx.lineWidth=2*(1-pr); ctx.beginPath(); ctx.arc(r.x,r.y,rad,0,7); ctx.stroke();
      ctx.strokeStyle=hexA(accent,a*0.5); ctx.lineWidth=1.5*(1-pr); ctx.beginPath(); ctx.arc(r.x,r.y,rad*0.58,0,7); ctx.stroke(); } }
  // Roaming spotlights: the bots hunt for signals from MANY vantage points. Each is a narrow beam
  // fired from a scattered emitter, aimed mostly FORWARD/up at the tape and slowly sweeping. Where a
  // beam's aim lands it lights the trend; when several beams converge on the same slice AND price
  // breaches a Bollinger band there, the signal is revealed (reticle) — triangulated from different
  // angles, the way you actually spot one. Angled cones (never vertical). Ambient only; composite 'lighter'.
  var scanners=[];
  function initScanners(){ scanners=[]; var N=6, fb=field.bottom;
    for(var i=0;i<N;i++){
      var ex=W*(0.06+0.88*i/(N-1)) + (Math.random()-0.5)*70;   // scattered vantage points across the base
      scanners.push({ ex:ex, ey:fb+18+Math.random()*70,
        base:-Math.PI/2 + (Math.random()-0.5)*0.9,             // aim mostly UP, tilted per vantage
        amp:0.28+Math.random()*0.30, sw:0.16+Math.random()*0.16, ph:Math.random()*6.28,
        spread:0.05+Math.random()*0.05, flare:0 }); } }
  function scanY(v){ return scBaseY - ((v-scMid)/(scSpan||1))*scAmp*2; }
  function drawScanners(vis){ if(vis<=0.02) return; if(!scanners.length) initScanners();
    var accent=css("--accent")||"#35D0BA", neg=css("--neg")||"#F85149", n=price.length, dx=W/(SPAN-1);
    var fmid=(field.top+field.bottom)/2, i, aims=[];
    ctx.save(); ctx.globalCompositeOperation="lighter";
    for(i=0;i<scanners.length;i++){ var s=scanners[i]; s.ph += s.sw*0.05*rate;
      var ang=s.base + Math.sin(s.ph)*s.amp;                   // sweeping aim from this vantage point
      var dx0=Math.cos(ang), dy0=Math.sin(ang); if(dy0>-0.18) dy0=-0.18;   // always aiming up into the field
      var t=(fmid-s.ey)/dy0; if(t<60)t=60;                     // reach the trend band
      var ax=s.ex+dx0*t; var axc=ax<0?0:(ax>W?W:ax);
      var idx=Math.round(axc/dx); if(idx<0)idx=0; else if(idx>n-1)idx=n-1; var py=scanY(price[idx]);
      var hit=(bU[idx]!=null&&price[idx]>bU[idx])||(bL[idx]!=null&&price[idx]<bL[idx]);
      s.flare += ((hit?1:0)-s.flare)*0.10;
      // narrow angled cone from the emitter
      var a1=ang-s.spread, a2=ang+s.spread, R=t*1.12;
      var g=ctx.createLinearGradient(s.ex,s.ey, s.ex+dx0*t, s.ey+dy0*t);
      g.addColorStop(0,hexA(accent, vis*(0.09+s.flare*0.14))); g.addColorStop(1,hexA(accent,0));
      ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(s.ex,s.ey);
      ctx.lineTo(s.ex+Math.cos(a1)*R, s.ey+Math.sin(a1)*R);
      ctx.lineTo(s.ex+Math.cos(a2)*R, s.ey+Math.sin(a2)*R); ctx.closePath(); ctx.fill();
      // pool where the beam lands on the tape
      var pr=ctx.createRadialGradient(ax,py,0,ax,py,54);
      pr.addColorStop(0,hexA(accent,vis*(0.12+s.flare*0.26))); pr.addColorStop(1,hexA(accent,0));
      ctx.fillStyle=pr; ctx.beginPath(); ctx.arc(ax,py,54,0,7); ctx.fill();
      aims.push({ ax:ax, py:py, hit:hit }); }
    // Convergence: a breach lit by 2+ beams from different vantage points = a revealed signal.
    ctx.globalCompositeOperation="source-over";
    for(i=0;i<aims.length;i++){ if(!aims[i].hit) continue; var cnt=1;
      for(var j=0;j<aims.length;j++){ if(j!==i && Math.abs(aims[j].ax-aims[i].ax)<46) cnt++; }
      if(cnt>=2){ var rr=vis*0.9, cx=aims[i].ax, cy=aims[i].py;
        ctx.strokeStyle=hexA(neg,rr); ctx.lineWidth=1.3;
        ctx.beginPath(); ctx.arc(cx,cy,8,0,7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-12,cy); ctx.lineTo(cx-5,cy); ctx.moveTo(cx+5,cy); ctx.lineTo(cx+12,cy);
        ctx.moveTo(cx,cy-12); ctx.lineTo(cx,cy-5); ctx.moveTo(cx,cy+5); ctx.lineTo(cx,cy+12); ctx.stroke(); } }
    ctx.restore(); }
  // Render one static, fully-projected forecast for a play (reduced-motion + initial paint).
  function renderStatic(idx){ curStrat=idx; armForecast(idx); cam=0.9; zoom=1.9;
    measureField(); fieldSnap(); drawMarket(0.7);
    drawForecast(STRATS[idx], { sig:STRATS[idx].cue+" · CALLED" }, { on:1,aim:1,zoom:1,project:1,walk:0,resolve:0,out:0 });
    beamVignette(); }
  // Call a play from the Playbook: queue it, ease any running playcall out first, then let the loop
  // steer + fire it. Under reduced motion, just repaint the static forecast for that play.
  function callPlay(idx){ if(reduce){ renderStatic(idx); highlightPlay(idx); return; }
    requestedPlay=idx; summoning=true; summonEnd=0;
    if(playMode) playStart = performance.now() - T_OUT;   // ease the current one out now
    else nextPlayAt = 0; }

  // --- Playbook menu wiring (PLAY reveals the plays; a click calls one) ---
  var modesEl=document.getElementById("modes"), playModeBtn=document.getElementById("playMode"),
      playbookEl=document.getElementById("playbook"), heroEl=document.getElementById("herosub");
  var learnBtn=document.getElementById("learnMode"), glossaryEl=document.getElementById("glossary");
  function openGlossary(o){ if(!learnBtn||!glossaryEl) return;
    if(o && glossaryEl.hasAttribute("hidden")) glossaryEl.removeAttribute("hidden");
    learnBtn.setAttribute("aria-expanded", o?"true":"false");
    if(o) openPlaybook(false);                                  // the two popovers are mutually exclusive
    glossaryEl.classList.toggle("open", o); }
  function openPlaybook(o){ if(!playModeBtn||!playbookEl) return;
    playModeBtn.setAttribute("aria-expanded", o?"true":"false");
    if(o) openGlossary(false);
    if(modesEl) modesEl.classList.toggle("open", o); playbookEl.classList.toggle("open", o); }
  if(learnBtn){
    learnBtn.addEventListener("click", function(){ openGlossary(learnBtn.getAttribute("aria-expanded")!=="true"); });
    learnBtn.addEventListener("mouseenter", function(){ openGlossary(true); }); }
  function highlightPlay(idx){ if(!playbookEl) return; var b=playbookEl.querySelectorAll(".play");
    for(var i=0;i<b.length;i++) b[i].classList.toggle("active", i===idx); }
  if(playModeBtn){
    playModeBtn.addEventListener("click", function(){ openPlaybook(playModeBtn.getAttribute("aria-expanded")!=="true"); });
    playModeBtn.addEventListener("mouseenter", function(){ openPlaybook(true); }); }
  if(heroEl) heroEl.addEventListener("mouseleave", function(){ openPlaybook(false); openGlossary(false); });
  if(playbookEl){ var plays=playbookEl.querySelectorAll(".play");
    for(var pi=0;pi<plays.length;pi++){ (function(btn){
      btn.addEventListener("click", function(){ var idx=parseInt(btn.getAttribute("data-i"),10)||0;
        highlightPlay(idx); callPlay(idx); openPlaybook(false); }); })(plays[pi]); } }
  document.addEventListener("keydown", function(e){ if(e.key==="Escape"){ openPlaybook(false); openGlossary(false); } });
  // Playcall transport: pause + step act-by-act through a manual playcall.
  var tPlayBtn=document.getElementById("tPlay"), tPrevBtn=document.getElementById("tPrev"),
      tNextBtn=document.getElementById("tNext"), tActsEl=document.getElementById("tActs");
  function setPaused(v){ paused=v; if(tPlayBtn){ tPlayBtn.textContent=v?"▶":"❚❚";
    tPlayBtn.setAttribute("aria-pressed", v?"true":"false"); tPlayBtn.setAttribute("aria-label", v?"Resume playcall":"Pause playcall"); } }
  function seekAct(dir){ if(!playMode) return; var e=(performance.now()-playStart)/paceScale, i;
    if(dir>0){ var nb=null; for(i=0;i<ACTB.length;i++){ if(ACTB[i]>e+1){ nb=ACTB[i]; break; } } stepTarget=(nb===null?T_RES:nb); setPaused(false); }
    else { var pb=0; for(i=0;i<ACTB.length;i++){ if(ACTB[i]<e-40) pb=ACTB[i]; }
      playStart=performance.now()-pb*paceScale; stepTarget=null; realized=[]; pvR=pv; setPaused(true); } }
  if(tPlayBtn) tPlayBtn.addEventListener("click", function(){ stepTarget=null; setPaused(!paused); });
  if(tNextBtn) tNextBtn.addEventListener("click", function(){ seekAct(1); });
  if(tPrevBtn) tPrevBtn.addEventListener("click", function(){ seekAct(-1); });
  // Space toggles pause during a manual playcall.
  document.addEventListener("keydown", function(e){ if(e.code==="Space" && playMode && manualPlay){ e.preventDefault(); stepTarget=null; setPaused(!paused); } });

  if(reduce){ renderStatic(4); highlightPlay(4);
    document.body.classList.add("playing");
    if(rctx){ rctx.fillStyle="rgba(11,15,20,1)"; rctx.fillRect(0,0,rcanvas.clientWidth,rcanvas.clientHeight);
      for(var s=0;s<26;s++) rainDraw(0,0); }
    return; }

  var last=0, running=true, SUMMON_MS=850;
  document.addEventListener("visibilitychange", function(){ running=!document.hidden; if(running) requestAnimationFrame(loop); });
  function startPlay(now, sig, manual){ playMode=true; playStart=now; curSig=sig; curStrat=sig.i;
    manualPlay=manual; paceScale=1; zoomRippled=false;   // even pace for auto + manual (transport lets you pause/step)
    nowIdx=price.length-1; realized=[]; pvR=pv;   // freeze history; seed realized momentum from the live move
    stepTarget=null; setPaused(false);            // fresh transport state each playcall
    armForecast(curStrat); playVol=1.0+Math.random()*0.7; scheduleEvents();   // lively, varied trace + macro events
    highlightPlay(manual?sig.i:-1); }
  function loop(now){
    if(!running) return;
    if(now-last > 50){ var dt=now-last; last=now; measureField(); fieldStep();
      // SUMMON: a called play first steers the trend into its setup, then fires the enhance-zoom.
      if(summoning && !playMode){ if(summonEnd===0){ summonEnd=now+SUMMON_MS; steerFor(summonIdx=requestedPlay); }
        if(now>=summonEnd){ summoning=false; var ri=requestedPlay; requestedPlay=null;
          startPlay(now, { i:ri, sig:STRATS[ri].cue+" · CALLED" }, true); } }
      // Auto-fire a play when a signal sets up and the cooldown has elapsed.
      if(!playMode && !summoning && now>=nextPlayAt){ startPlay(now, dealPlay(), false); }
      var p=null, camT=0, rateT=1;
      if(playMode){
        if(paused) playStart += dt;                 // hold-to-read: freeze the phase clock
        var e=(now-playStart)/paceScale; p=playProg(e);
        if(stepTarget!==null && e>=stepTarget){ stepTarget=null; setPaused(true); }   // step: pause at act boundary
        if(manualPlay && tActsEl){ var ai=0, aj; for(aj=0;aj<ACTB.length;aj++){ if(e>=ACTB[aj]-1) ai=aj; }
          var abs=tActsEl.children; for(aj=0;aj<abs.length;aj++) abs[aj].classList.toggle("on", aj===ai); }
        // Time never hard-stops: ease into slow-mo through detect/project, then ease back up as the
        // price walks the forecast forward, and back to real-time on zoom-out. This kills the jumps.
        if(p.out>0) rateT=1;
        else if(p.walk>0) rateT=lerp(0.16, 1.0, easeIO(clamp01(p.walk)));
        else if(p.aim>0) rateT=0.16;
        else rateT=lerp(1, 0.4, clamp01(p.on));
        if(paused) rateT=0.16;
        camT=clamp01(Math.max(p.zoom, p.aim*0.25))*(1-p.out);   // eased zoom/focal — no snap
        realizedAlpha=1-p.out;                                   // realized pen fades on zoom-out
        if(p.walk>0 && p.out<=0 && !paused) fillRealized(p.walk);   // unfold across the region to the exit level
        // Slow-mo THROUGH a high-vol event: as the pen crosses an event fraction, dilate the phase clock
        // so the tape crawls and the reaction candle forms slowly — the "watch the print land" beat that
        // real trades revolve around. One-frame-lagged off p.walk; imperceptible at this cadence.
        eventWarp=1; warpIdx=-1;
        if(p.walk>0 && p.out<=0 && !paused){ var wf=clamp01(p.walk);
          for(var wj=0;wj<events.length;wj++){ var wd=Math.abs(wf-events[wj].f);
            if(wd<0.07){ var wv=lerp(0.28,1,wd/0.07); if(wv<eventWarp){ eventWarp=wv; warpIdx=wj; } } }
          if(eventWarp<1) playStart += dt*(1-eventWarp); }
        if(p.zoom>0.4 && !zoomRippled){ zoomRippled=true; addRipple(nowSX, nowSY); }   // enhance-zoom ripple, centered once framed
        rainBoost=((p.walk>0 && p.resolve<1)||(p.zoom>0.4&&p.project<0.3))?1:0; rainTint=(p.resolve>0 && p.out<1)?1:0;
        if(e>=T_END){ playMode=false; manualPlay=false; paceScale=1; nextPlayAt=now+3400+Math.random()*2600;
          realized=[]; realizedAlpha=1; p=null; camT=0; rateT=1; rainBoost=0; rainTint=0; highlightPlay(-1); } }
      else { rainBoost=0; rainTint=0; }
      cam += (camT-cam)*0.09; rate += (rateT-rate)*0.09;
      zoom += ((1+1.05*cam)-zoom)*0.1;
      // Advance time. Ambient only: push the live market. During a play the history is FROZEN — the
      // realized pen (grown from p.walk above) is the only thing that advances; Acts 1/2 hold still.
      if(!playMode){ stepAcc += rate; var guard=0;
        while(stepAcc>=1 && guard++<8){ stepAcc-=1; stepMarket(); } }
      else stepAcc=0;
      document.body.classList.toggle("playing", cam>0.02);
      document.body.classList.toggle("manualplay", playMode && manualPlay);
      drawMarket(1 - cam*0.34);
      drawScanners(1 - cam);   // roaming signal-scan spotlights — ambient only, recede as a play frames
      if(p){ drawForecast(STRATS[curStrat], curSig, p); pbGlyphT++; }
      drawRipples();
      beamVignette();
      rainDraw(rainBoost, rainTint); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
</script>
</body>
</html>`;
  }
}

/** Inline brand glyph for a provider's sign-in button (self-contained, no external assets). */
function providerGlyph(id: ProviderId): string {
  if (id === "google") {
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.2-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.3-4.6 6.9l7.1 5.5c4.2-3.9 6.2-9.6 6.2-16.9z"/><path fill="#FBBC05" d="M10.4 28.7a14.6 14.6 0 0 1 0-9.3l-7.8-6.1a24 24 0 0 0 0 21.5l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.6 2.2-8.8 2.2-6.3 0-11.7-3.7-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 .5C5.6.5.5 5.6.5 12c0 5.1 3.3 9.4 7.9 11 .6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.6 7.9-5.9 7.9-11C23.5 5.6 18.4.5 12 .5z"/></svg>`;
}

/** Build the authenticator from the environment, or undefined when auth isn't configured. */
export function resolveAuth(env: Env, deps?: AuthDeps): Authenticator | undefined {
  const secret = env.SKYNET_SESSION_SECRET;
  if (!secret) {
    return undefined;
  }
  const providers: OAuthProvider[] = [];
  if (env.SKYNET_GOOGLE_CLIENT_ID && env.SKYNET_GOOGLE_CLIENT_SECRET) {
    providers.push(
      googleProvider({
        clientId: env.SKYNET_GOOGLE_CLIENT_ID,
        clientSecret: env.SKYNET_GOOGLE_CLIENT_SECRET,
      }),
    );
  }
  if (env.SKYNET_GITHUB_CLIENT_ID && env.SKYNET_GITHUB_CLIENT_SECRET) {
    providers.push(
      githubProvider({
        clientId: env.SKYNET_GITHUB_CLIENT_ID,
        clientSecret: env.SKYNET_GITHUB_CLIENT_SECRET,
      }),
    );
  }
  if (providers.length === 0) {
    return undefined;
  }
  return new Authenticator({
    providers,
    secret,
    allowedEmails: parseList(env.SKYNET_ALLOWED_EMAILS),
    allowedLogins: parseList(env.SKYNET_ALLOWED_GITHUB_LOGINS),
    deps,
  });
}

function parseList(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0),
  );
}

function redirect(res: ServerResponse, location: string): void {
  res.writeHead(302, { location });
  res.end();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
