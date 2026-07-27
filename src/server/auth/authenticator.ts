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
  /* Dark-only by design: the cityscape reads as a nation, and nations only compare cleanly when every
     one is lit the same. No light mode — daytime vs. nighttime cities can't be reconciled side by side,
     so we remove the choice. color-scheme:dark stops mobile UAs auto-lighting form controls/scrollbars. */
  :root{
    color-scheme: dark;
    --bg:#0B0F14; --surface:#131A22; --surface-2:#0F151C; --border:#223041;
    --text:#E6EDF3; --muted:#8B9AAB; --accent:#35D0BA; --pos:#3FB950; --neg:#F85149;
    --mono:ui-monospace,"JetBrains Mono","SF Mono",Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  }

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
  /* Film grain: a fine fractal-noise texture over the whole scene (blended in) that unifies the
     composition and adds a filmic / rendered level-of-detail — subtle, never a spectacle. */
  .grain{ position:fixed; inset:-60%; z-index:3; pointer-events:none; opacity:.06; mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:150px 150px; animation:grain 1.1s steps(3) infinite; will-change:transform; }
  @keyframes grain{ 0%{transform:translate(0,0);} 33%{transform:translate(-5%,4%);} 66%{transform:translate(4%,-5%);} 100%{transform:translate(-3%,3%);} }

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
    .grain{ animation:none; }
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
<div class="grain" aria-hidden="true"></div>
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
        <dt>PLAYS</dt><dd>Classed 101→401 by difficulty — each is an instruction set with a defined max profit &amp; loss.</dd>
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
      <span class="tacts" id="tActs" aria-hidden="true"><b data-a="0">SIGNAL</b><b data-a="1">INSIGHT</b><b data-a="2">PREDICT</b><b data-a="3">REALIZE</b><b data-a="4">RESOLVE</b></span>
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

  // ===== Reveal VFX: the KEY TO THE CITY — a grainy chromatic door unlocking (canvas) =====
  // Signing in is the one door only you can open (Neo turning the Maker's key). A lock ring turns a
  // quarter and disengages, a chromatic band (teal→cyan→white-hot→magenta) opens like a door from the
  // title's eye-line, and a keyhole of light pours down onto the wordmark as it lands — then it blooms
  // and clears into the empire beyond. Canvas-rendered so the dust/grain reads (CSS can't).
  var vcanvas=document.getElementById("vfx"), vctx=null;
  try{ vctx = vcanvas && vcanvas.getContext ? vcanvas.getContext("2d") : null; }catch(e){ vctx=null; }
  function vfxResize(){ if(!vctx) return;
    vcanvas.width=Math.max(1,Math.floor(vcanvas.clientWidth*DPR));
    vcanvas.height=Math.max(1,Math.floor(vcanvas.clientHeight*DPR));
    vctx.setTransform(DPR,0,0,DPR,0,0); }
  var noiseTile=document.createElement("canvas"); noiseTile.width=140; noiseTile.height=140;
  (function(){ try{ var nx=noiseTile.getContext("2d"), im=nx.createImageData(140,140), d=im.data, i;
    for(i=0;i<d.length;i+=4){ var v=(Math.random()*255)|0; d[i]=d[i+1]=d[i+2]=v; d[i+3]=255; } nx.putImageData(im,0,0); }catch(e){} })();
  var vfxActive=false, vfxT0=0, VFXD=880, vfxTargetY=0;   // short + punchy — a power surge, not a slow bloom
  function vEase(x){ return 1-Math.pow(1-clamp01(x),3); }
  function drawVFX(q){
    var w=vcanvas.clientWidth, h=vcanvas.clientHeight; vctx.clearRect(0,0,w,h);
    // The core opens high, then DRIFTS DOWN to settle over the hero title as it lands — the light
    // pours onto the wordmark rather than hovering above it.
    var cy=lerp(h*0.30, vfxTargetY||h*0.5, vEase(q)), open=vEase(clamp01(q/0.5)), env=Math.sin(clamp01(q)*Math.PI);
    var bandH=lerp(h*0.015, h*1.35, open), top=cy-bandH/2, A=Math.min(1,1.05*env);
    // electric horizontal gradient — HIGH-fluorescence matrix energy: charged teal-green → white-hot →
    // electric chartreuse → lime, feathered top/bottom. Saturated + bright so it reads as raw power.
    var g=vctx.createLinearGradient(0,0,w,0);
    g.addColorStop(0,   "rgba(30,255,150,"+(A*0.8)+")");
    g.addColorStop(0.3, "rgba(120,255,150,"+A+")");
    g.addColorStop(0.5, "rgba(255,255,240,"+A+")");
    g.addColorStop(0.7, "rgba(200,255,60,"+A+")");
    g.addColorStop(1,   "rgba(150,255,40,"+(A*0.8)+")");
    // additive so the band GLOWS (fluorescent energy) rather than just painting a stripe
    vctx.save(); vctx.globalCompositeOperation="lighter"; vctx.fillStyle=g; vctx.fillRect(0,top,w,bandH);
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
        vctx.strokeStyle="rgba(198,255,180,"+(0.45*conv*env)+")";
        vctx.beginPath(); vctx.moveTo(cx+fx,sy); vctx.lineTo(cx+fx*0.28,cy); vctx.stroke(); }
      vctx.restore(); }
    // POWER SURGE — a sharp, BLINDING electric discharge. Quick attack/decay (squared window) so it
    // reads as a flash, not a glow: a full-viewport fluorescent-green energy wash charges the frame,
    // then a near-full-screen white blast blinds at the peak. Energy/power is the brand's core.
    var flash=Math.max(0,1-Math.abs(q-0.58)/0.13); flash=flash*flash;
    if(flash>0){ vctx.save(); vctx.globalCompositeOperation="lighter";
      // fluorescent electric-green energy filling the whole frame (the charge)
      var eg=vctx.createRadialGradient(w*0.5,cy,0,w*0.5,cy,Math.max(w,h)*0.8);
      eg.addColorStop(0,   "rgba(180,255,120,"+(0.85*flash)+")");
      eg.addColorStop(0.45,"rgba(90,255,150,"+(0.5*flash)+")");
      eg.addColorStop(1,   "rgba(50,235,120,0)");
      vctx.fillStyle=eg; vctx.fillRect(0,0,w,h);
      // blinding white blast — near full-screen at the peak, edges still hot so it truly blinds
      var rg=vctx.createRadialGradient(w*0.5,cy,0,w*0.5,cy,Math.max(w,h)*0.72);
      rg.addColorStop(0,  "rgba(255,255,255,"+flash+")");
      rg.addColorStop(0.6,"rgba(255,255,255,"+(0.72*flash)+")");
      rg.addColorStop(1,  "rgba(236,255,180,"+(0.32*flash)+")");
      vctx.fillStyle=rg; vctx.fillRect(0,0,w,h); vctx.restore(); }
    // ===== KEY TO THE CITY: this is the ONE door only you can open. A lock ring TURNS a quarter and
    // disengages, key-turn rays rotate, then a keyhole of light pours down onto the landing wordmark —
    // the auth moment as Neo turning the Maker's key. =====
    var turn=vEase(clamp01(q/0.6))*Math.PI*0.5;                 // the key rotates a quarter-turn
    // key-turn rays sweeping around the core
    vctx.save(); vctx.globalCompositeOperation="lighter"; vctx.translate(w*0.5,cy); vctx.rotate(turn);
    var rr=lerp(12, w*0.32, open), kr;
    for(kr=0;kr<6;kr++){ var ka=kr/6*Math.PI*2; vctx.strokeStyle="rgba(200,255,140,"+(0.42*env)+")"; vctx.lineWidth=2; vctx.lineCap="round";
      vctx.beginPath(); vctx.moveTo(Math.cos(ka)*rr*0.22,Math.sin(ka)*rr*0.22); vctx.lineTo(Math.cos(ka)*rr,Math.sin(ka)*rr); vctx.stroke(); }
    vctx.restore();
    // lock ring — two arcs that rotate apart as the lock releases, fading once disengaged
    var ringA=Math.max(0,1-clamp01(q/0.55))*env;
    if(ringA>0){ vctx.save(); vctx.globalCompositeOperation="lighter"; vctx.strokeStyle="rgba(160,255,150,"+(0.85*ringA)+")"; vctx.lineWidth=2.4;
      var rad=lerp(16,58,open), gp=0.16+turn*0.5;
      vctx.beginPath(); vctx.arc(w*0.5,cy,rad, gp, Math.PI-gp); vctx.stroke();
      vctx.beginPath(); vctx.arc(w*0.5,cy,rad, Math.PI+gp, Math.PI*2-gp); vctx.stroke();
      vctx.restore(); }
    // keyhole beam — light floods DOWN through the opened door onto the hero title
    var beamA=Math.max(0,1-Math.abs(q-0.62)/0.28)*0.62;
    if(beamA>0){ vctx.save(); vctx.globalCompositeOperation="lighter";
      var bg2=vctx.createLinearGradient(0,cy,0,cy+h*0.42); bg2.addColorStop(0,"rgba(232,255,200,"+beamA+")"); bg2.addColorStop(1,"rgba(160,255,140,0)");
      var bw=lerp(w*0.02,w*0.15,open); vctx.fillStyle=bg2;
      vctx.beginPath(); vctx.moveTo(w*0.5-bw*0.32,cy); vctx.lineTo(w*0.5+bw*0.32,cy); vctx.lineTo(w*0.5+bw,cy+h*0.42); vctx.lineTo(w*0.5-bw,cy+h*0.42); vctx.closePath(); vctx.fill();
      vctx.restore(); }
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
      // Ink vs. script: the wiggle is the DOMINANT term through the middle of the walk (the tape
      // wanders, dips through the plan, recovers), and the pull to the moving target stays gentle
      // until the final ~12%, where it firms so the close still lands on the exit level.
      var snap=f>0.88?(f-0.88)/0.12*0.55:0;
      t++; pvR = pvR*0.88 + (noise(t*0.017)-0.5)*volScale*0.055*playVol + (moving-last)*(0.06+0.12*f+snap) + eventImpulse(i,cap);
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
    // Ambient present at W·0.78; a play eases the focal to W·0.20 (framed, tower visible). On CLOSE, once
    // the walk is folded in, the focal eases from the tip's own spot (foldFromX) back to ambient — a short
    // settle, not a full traversal — so the trend doesn't look re-drawn across the page.
    var toX=lerp(W*0.78, folding?foldFromX:W*0.20, cam), toY=lerp(fpy, baseY, cam);
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
    // The ambient cone hands off to the PLAYCALL forecast: it stays full through detect/aim/zoom (so
    // the forecast grows OUT of the already-present projection — a seamless segue), then fades only as
    // the forecast's own bands project in. Ambient (no play) → fcastProj 0 → full cone.
    var coneA=clamp01(1-fcastProj*1.35);
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
        ctx.strokeStyle=hexA(ccol,1); ctx.lineWidth=1.5*lw;
        ctx.beginPath(); ctx.moveTo(ccx,Y(chi)); ctx.lineTo(ccx,Y(clo)); ctx.stroke();            // wick
        var bt=Y(Math.max(o,c)), bh=Math.max(1.4*lw, Y(Math.min(o,c))-bt);
        ctx.fillStyle=hexA(css("--bg")||"#0B0F14",0.72); ctx.fillRect(ccx-cw/2,bt,cw,bh);           // dark backing so bodies separate from the green/red band
        // Brighter, bolder bodies to match the darker playcall backdrop — with a soft same-colour glow.
        ctx.shadowColor=ccol; ctx.shadowBlur=4;
        ctx.fillStyle=hexA(ccol,cup?0.88:0.95); ctx.fillRect(ccx-cw/2,bt,cw,bh);                    // body
        ctx.shadowBlur=0;
        ctx.strokeStyle=hexA(ccol,1); ctx.lineWidth=1.4*lw; ctx.strokeRect(ccx-cw/2,bt,cw,bh); }
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
    // Present marker — brighter + bolder to hold its own on the darker backdrop: a bright core, a
    // crisp ring, and a stronger glow.
    var lp=LP(lead);
    ctx.beginPath(); ctx.arc(lp[0],lp[1],4.6,0,7); ctx.fillStyle="#F4FEFB"; ctx.shadowColor=accent; ctx.shadowBlur=26; ctx.fill();
    ctx.shadowBlur=0; ctx.lineWidth=1.4; ctx.strokeStyle=hexA(accent,0.95);
    ctx.beginPath(); ctx.arc(lp[0],lp[1],6.6,0,7); ctx.stroke();
    ctx.restore();
    // (During a playcall a glint flashes on the trend, then the Eye locks + pulls — see drawGravityBeam.)
    ctx.restore();
    // RSI readout — idle only (during a play the playbook panel + callout carry the read; this would
    // just collide with the pipeline text top-left).
    // Anchored to the leading dot (the present price), not floating top-left — the read sits where the
    // market actually is, so it reads as instrumentation rather than orphaned debug text.
    if(cam<0.05){ var rc = rsiV<32?pos:(rsiV>68?neg:muted);
      ctx.save(); ctx.globalAlpha=dim*0.9; ctx.font="10px "+(css("--mono")||"monospace"); ctx.textAlign="right"; ctx.textBaseline="alphabetic"; ctx.fillStyle=hexA(rc,0.9);
      ctx.fillText("RSI "+rsiV.toFixed(0)+(rsiV<32?" OVERSOLD":rsiV>68?" OVERBOUGHT":""), nowSX-12, nowSY-11);
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
  var skyline=[], rainT=0, cityLayers=[], cityPX=0, cityPXt=0;
  // Market-hours lighting: the city wakes when the market opens and rests when it's closed. A single
  // liveliness factor (0..1) computed from New York time scales the lit windows, crowns, and signage
  // so the skyline visibly breathes with the trading session. Refreshed once a minute, eased.
  var cityLife=1, cityLifeTarget=1;
  var weatherDrops=[], boltFlash=0, boltPath=null, nextBoltAt=140;   // storm: rain streaks + blue lightning
  var eyeWake=0;   // 0..1 — the Eye of Sauron opens/blazes as the gravity beam hauls the present forward
  function marketLife(){
    try{ var et=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
      var day=et.getDay(), min=et.getHours()*60+et.getMinutes();
      if(day===0||day===6) return 0.4;                 // weekend — the city rests
      if(min>=570&&min<960) return 1;                  // 9:30–16:00 regular hours — full life
      if(min>=240&&min<570) return 0.72;               // 4:00–9:30 pre-market — waking up
      if(min>=960&&min<1200) return 0.72;              // 16:00–20:00 after-hours — winding down
      return 0.45;                                     // overnight — dim
    }catch(e){ return 1; }
  }
  cityLifeTarget=marketLife(); cityLife=cityLifeTarget;
  function _genLayer(w,h,o){ var arr=[], x=-20-Math.random()*40;
    while(x<w+40){ var bw=o.bw0+Math.random()*o.bwR, bh=o.bh0+Math.random()*o.bhR;
      // Silhouette variety (Dubai/Tokyo high-tech): most sleek towers TAPER toward the top; a share get
      // a fine SPIRE (Burj/Skytree). Far/hazy layer stays boxy — detail there would be lost anyway.
      var r=Math.random(), taper=1, spire=0, shape="box";
      if(o.fancy){
        if(r<0.36){ shape="taper"; taper=0.40+Math.random()*0.26; }              // sleek tapering supertall
        else if(r<0.56){ shape="spire"; taper=0.55+Math.random()*0.22; spire=14+Math.random()*26; } // spired
        else if(r<0.68){ shape="box"; taper=0.86+Math.random()*0.1; }            // slight batter
      }
      arr.push({ x:x, w:bw, h:bh, seed:Math.random()*1000, ant:Math.random()<o.antP?(8+Math.random()*o.antR):0,
        crown:false, taper:taper, spire:spire, shape:shape });
      x += bw + o.gap0 + Math.random()*o.gapR; }
    return arr; }
  function buildSkyline(w,h){
    // Three depth layers for a real 3D read: FAR (small/dim/hazy/high, moves least) → MID → NEAR
    // (tall/crisp/full-detail, moves most under pointer parallax). Painter's order, back to front.
    var far=_genLayer(w,h,{bw0:12,bwR:22,bh0:16,bhR:h*0.09,antP:0.14,antR:10,gap0:1,gapR:4});
    var mid=_genLayer(w,h,{bw0:20,bwR:36,bh0:30,bhR:h*0.14,antP:0.20,antR:14,gap0:2,gapR:6,fancy:true});
    var near=_genLayer(w,h,{bw0:28,bwR:52,bh0:44,bhR:Math.min(150,h*0.20),antP:0.28,antR:22,gap0:2,gapR:9,fancy:true});
    // Empire towers — crown the two tallest of the NEAR layer (the wealth built from capital).
    var t1=-1,t2=-1,si;
    for(si=0;si<near.length;si++){ if(t1<0||near[si].h>near[t1].h){ t2=t1; t1=si; }
      else if(t2<0||near[si].h>near[t2].h){ t2=si; } }
    // The Eye of Sauron takes a LEFT-side tower so its tractor beam reaches in from the left to haul
    // the present forward. Prefer the tallest tower in the left third; fall back to the tallest overall.
    var eyeI=-1; for(si=0;si<near.length;si++){ if(near[si].x < w*0.34 && (eyeI<0||near[si].h>near[eyeI].h)) eyeI=si; }
    if(eyeI<0) eyeI=t1;
    // Barad-dûr: a broad, jagged fortress-tower, not a needle — bigger footprint + a gentler taper so
    // the stepped tiers and buttresses read; the summit prongs + Eye crown it (see drawBaradDur/drawEye).
    // DOMINANT hero: the primary character's tower carries the weight of the whole party/nation, so it
    // stands NOTICEABLY taller + broader than everything around it — a true landmark, not just the widest
    // of a uniform row. Now that the playcall no longer renders in the left window, the summit is free to
    // rise well above its neighbours (near towers cap ~0.20h; Sauron reaches ~0.56h + a tall spire).
    if(eyeI>=0){ var BE=near[eyeI]; BE.h=Math.min(h*0.56,BE.h*1.8+90); BE.w=Math.max(BE.w,112); BE.crown=true; BE.eye=true; BE.shape="spire"; BE.taper=0.56; BE.spire=Math.max(BE.spire,42+Math.random()*14); BE.ant=Math.max(BE.ant,16+Math.random()*8);
      // PIN the primary player's tower to a STABLE central-left anchor — centred in the window between
      // the browser's left edge and where the playcall renders (~0.30w) — so it's a reliable render point
      // every session rather than wherever a random tower fell. (Per-user personal touches on this fixed
      // anchor are TBD — see IDEAS.) The Eye's gaze then reaches in from here to the signal on the right.
      BE.x=Math.round(w*0.09-BE.w/2); }   // pushed further LEFT + back so the full-width playcall renders in front, its summit high above the chart
    // Second empire tower (no Eye): the tallest that isn't the Eye tower.
    var t2i=(t1>=0&&t1!==eyeI)?t1:t2;
    if(t2i>=0&&t2i!==eyeI){ var B2=near[t2i]; B2.h=Math.min(h*0.32,B2.h*1.4+34); B2.crown=true; B2.shape="spire"; B2.taper=0.38; B2.spire=Math.max(B2.spire,30+Math.random()*16); B2.ant=Math.max(B2.ant,16+Math.random()*12); }
    cityLayers=[
      { b:far,  dim:0.4,  par:0.20, base:h*0.055, depth:0, code:false, haze:0.05 },   // distant, hazy, higher base
      { b:mid,  dim:0.68, par:0.5,  base:h*0.02,  depth:3, code:false, haze:0.03 },
      { b:near, dim:1.0,  par:1.0,  base:0,       depth:6, code:true,  haze:0 }        // foreground, full detail
    ];
    skyline=near;   // keep the near layer as the skyline reference for the empire-aura pass
    // Marquee signage — the skyline as a live market surface: mount ticker billboards on the widest
    // near-layer towers (not the crowned spires, which read cleaner bare). The real tickers threaded
    // through the plays light the city, each with a seeded base price that ticks green/red over time.
    var pool=[["NVDA",178],["CRWV",92],["TSLA",340],["AMD",165],["MSFT",430],["GOOG",195],["AVGO",240],["AAPL",232],["META",620]];
    var cand=[]; for(si=0;si<near.length;si++){ var nb=near[si]; if(!nb.crown && nb.w>=58 && nb.h>70) cand.push(si); }
    cand.sort(function(a,b){ return near[b].w-near[a].w; });
    var boards=Math.min(3, cand.length), pk=(Math.random()*pool.length)|0;
    for(si=0;si<boards;si++){ var bb=near[cand[si]], pr=pool[(pk+si)%pool.length];
      bb.board={ sym:pr[0], base:pr[1], cur:pr[1], dir:1, nextT:20+si*13, fy:0.16+noise(bb.seed)*0.16 }; }
  }
  // Buildings are BUILT FROM the matrix code — like the walls of the hallway: dark structural masses
  // whose faces are a fine, mostly-dim field of glyphs, with a sparse scatter of brighter "lit window"
  // cells. Kept dim (atmosphere, not spectacle). Chars hold ~14 frames then flip so the code breathes.
  // Draw one building with 3D block faces (right side + top), then its front detail. dim = atmospheric
  // perspective (far = fainter); L.code = full matrix-code face + tracers + crown (near layer only).
  // The Eye of Sauron — a lidless fiery eye atop the tallest empire tower, ever-watchful and drawn
  // in the app's red accent. It sits half-lidded at rest and OPENS (widens, blazes brighter) as the
  // gravity beam hauls the present forward (eyeWake), tying the watcher to the pull it commands.
  function drawEye(cx,cy,dim){
    var wake=0.5+0.5*eyeWake, flk=0.82+0.18*Math.sin(rainT*0.22)+0.07*(noise(rainT*0.9)-0.5);
    var eh=(30+14*eyeWake), ew=(11+5*eyeWake);   // a strong beacon at rest; opens wider as it wakes
    var almond=function(sx){ rctx.beginPath(); rctx.moveTo(cx,cy-eh/2*sx);
      rctx.quadraticCurveTo(cx+ew*sx,cy, cx,cy+eh/2*sx); rctx.quadraticCurveTo(cx-ew*sx,cy, cx,cy-eh/2*sx); rctx.closePath(); };
    // 1) Barad-dûr summit — two dark clawed prongs flanking the Eye, with fire-lit inner edges.
    rctx.save();
    for(var pr=-1;pr<=1;pr+=2){ var bx0=cx+pr*(ew+2), by0=cy+eh*0.5, tipx=cx+pr*(ew*2.1), tipy=cy-eh*0.72;
      rctx.beginPath(); rctx.moveTo(bx0,by0); rctx.quadraticCurveTo(cx+pr*(ew*2.4),cy, tipx,tipy);
      rctx.lineTo(tipx-pr*2.4,tipy+3); rctx.quadraticCurveTo(cx+pr*(ew*1.3),cy+2, bx0-pr*3,by0); rctx.closePath();
      rctx.fillStyle=hexA("#05070B",0.9*dim); rctx.fill();
      rctx.strokeStyle=hexA("#FF7A2E",0.35*wake*dim*flk); rctx.lineWidth=1;   // fire-lit inner edge
      rctx.beginPath(); rctx.moveTo(bx0,by0); rctx.quadraticCurveTo(cx+pr*(ew*1.5),cy, tipx,tipy); rctx.stroke(); }
    rctx.restore();
    rctx.save(); rctx.globalCompositeOperation="lighter";
    // 2) radiating flame corona — licking tongues that flicker around the lid
    for(var i=0;i<12;i++){ var a=(i/12)*6.2832+noise(i*1.7)*0.4, rr=eh*(0.62+0.5*noise(i+Math.floor(rainT*0.18)));
      var ox=cx+Math.cos(a)*ew*1.15, oy=cy+Math.sin(a)*eh*0.55, lx=cx+Math.cos(a)*rr, ly=cy+Math.sin(a)*rr*0.9;
      var fg=rctx.createLinearGradient(ox,oy,lx,ly); fg.addColorStop(0,hexA("#FFC24D",0.16*wake*dim*flk)); fg.addColorStop(1,hexA("#F85149",0));
      rctx.strokeStyle=fg; rctx.lineWidth=1.5; rctx.beginPath(); rctx.moveTo(ox,oy); rctx.lineTo(lx,ly); rctx.stroke(); }
    // 3) flame halo
    var hg=rctx.createRadialGradient(cx,cy,0,cx,cy,eh*1.9);
    hg.addColorStop(0,hexA("#FF9E3D",0.55*wake*dim*flk)); hg.addColorStop(0.42,hexA("#F85149",0.24*wake*dim)); hg.addColorStop(1,hexA("#F85149",0));
    rctx.fillStyle=hg; rctx.beginPath(); rctx.arc(cx,cy,eh*1.9,0,7); rctx.fill();
    // 4) layered iris — cool-white core → amber → molten-orange → red rim
    almond(1);
    var eg=rctx.createRadialGradient(cx,cy,0,cx,cy,eh/2);
    eg.addColorStop(0,hexA("#FFF3D6",0.98*wake*flk)); eg.addColorStop(0.34,hexA("#FFC24D",0.92*wake));
    eg.addColorStop(0.68,hexA("#FF7A2E",0.82*wake)); eg.addColorStop(1,hexA("#F85149",0.55*wake));
    rctx.fillStyle=eg; rctx.fill();
    // faint concentric striations in the iris (grain of the burning eye)
    rctx.strokeStyle=hexA("#FFE7B0",0.16*wake); rctx.lineWidth=0.6; almond(0.7); rctx.stroke(); almond(0.4); rctx.stroke();
    // ELECTRIC energy resonating WITH the volcanic fire — jagged blue-white arcs crackle across the lid,
    // flickering in and out so the gaze reads as both molten AND charged (its pull is gravity→EM).
    rctx.globalCompositeOperation="lighter";
    for(var ea=0;ea<3;ea++){ var lit=noise(rainT*0.4+ea*3.3+cx*0.01); if(lit<0.45) continue;
      var a0=noise(ea*1.9+Math.floor(rainT*0.3))*6.28, ax=cx+Math.cos(a0)*ew*0.9, ay=cy+Math.sin(a0)*eh*0.42;
      var bxp=cx-Math.cos(a0)*ew*0.9, byp=cy-Math.sin(a0)*eh*0.42;
      rctx.strokeStyle=hexA("#CFF3FF",(0.5*(lit-0.45)/0.55)*wake*flk); rctx.lineWidth=1; rctx.beginPath(); rctx.moveTo(ax,ay);
      for(var es=1;es<5;es++){ var et=es/5, jx=(noise(ea+es*2.1+rainT*0.5)-0.5)*ew*0.7; rctx.lineTo(ax+(bxp-ax)*et+jx, ay+(byp-ay)*et); }
      rctx.lineTo(bxp,byp); rctx.stroke(); }
    rctx.restore();
    // 5) the cat-slit pupil — a void with a hot molten rim. AMBIENT GAZE: at rest the pupil slowly
    // WANDERS (the Eye is forever scanning the city); as it WAKES to a signal the wander fades and the
    // pupil re-centres + locks — the clear visual difference between watching and detecting.
    rctx.save();
    var gazeX=(Math.sin(rainT*0.06)*1.3+Math.sin(rainT*0.028+2.1)*0.7)*(1-eyeWake);
    var gazeY=(Math.cos(rainT*0.045)*0.8)*(1-eyeWake);
    var pupil=function(sc){ var pcx=cx+gazeX, pcy=cy+gazeY; rctx.beginPath(); rctx.moveTo(pcx,pcy-eh*0.46*sc);
      rctx.quadraticCurveTo(pcx+(1.7+2.2*eyeWake)*sc,pcy, pcx,pcy+eh*0.46*sc);
      rctx.quadraticCurveTo(pcx-(1.7+2.2*eyeWake)*sc,pcy, pcx,pcy-eh*0.46*sc); rctx.closePath(); };
    rctx.globalCompositeOperation="lighter"; rctx.strokeStyle=hexA("#FFE7B0",0.5*wake*flk); rctx.lineWidth=1.1; pupil(1.06); rctx.stroke();
    rctx.globalCompositeOperation="source-over"; rctx.fillStyle=hexA("#140300",0.9*wake); pupil(1); rctx.fill();
    rctx.restore();
  }
  // Barad-dûr — the Dark Tower under the Eye. A stone fortress, not a glass office: stepped battlemented
  // tiers, heavy buttress ribs, and forge-slit windows that glow hotter toward the summit, crowned by a
  // row of iron horns at the shoulder. Squeezes the totem for detail while staying on the app's red/amber.
  function drawBaradDur(b,bx,top,bottom,midx,edgeL,edgeR,dim){
    var H=bottom-top, flk=0.8+0.2*Math.sin(rainT*0.2+b.seed), i, u;
    rctx.save();
    // 1) stepped tiers — jutting battlemented cornices with merlon notches, the fortress read
    for(i=1;i<6;i++){ var y=top+H*(i/6), lL=edgeL(y), rR=edgeR(y);
      rctx.fillStyle=hexA("#04060A",0.92*dim); rctx.fillRect(lL-2,y,(rR-lL)+4,3);
      rctx.strokeStyle=hexA("#FF7A2E",0.14*flk*dim); rctx.lineWidth=1; rctx.beginPath(); rctx.moveTo(lL-2,y); rctx.lineTo(rR+2,y); rctx.stroke();
      rctx.fillStyle=hexA("#02040A",0.9*dim); for(var mx=lL;mx<rR-2;mx+=5) rctx.fillRect(mx,y-2,2.4,2); }
    // 2) heavy buttress ribs following the taper, faint fire-lit edge
    for(i=0;i<=4;i++){ u=i/4; var xB=bx+b.w*u, xT=edgeL(top)+(edgeR(top)-edgeL(top))*u;
      rctx.strokeStyle=hexA("#070A10",0.85*dim); rctx.lineWidth=(i===2?3:2); rctx.beginPath(); rctx.moveTo(xB,bottom); rctx.lineTo(xT,top+4); rctx.stroke();
      rctx.strokeStyle=hexA("#FF7A2E",(i===2?0.10:0.06)*flk*dim); rctx.lineWidth=1; rctx.beginPath(); rctx.moveTo(xB,bottom); rctx.lineTo(xT,top+4); rctx.stroke(); }
    // 3) forge-slit windows — inner fire, denser + hotter toward the summit
    rctx.globalCompositeOperation="lighter";
    for(i=0;i<26;i++){ var sn=noise(b.seed+i*4.7), fy=top+H*(0.12+0.86*sn), lE=edgeL(fy)+3, rE=edgeR(fy)-3; if(rE<=lE) continue;
      var fx=lE+(rE-lE)*noise(b.seed+i*2.3+1.1), up=1-(fy-top)/H, glow=(0.12+0.5*up)*(0.6+0.4*Math.sin(rainT*0.09+i+b.seed))*flk*dim;
      rctx.fillStyle=hexA("#FF9E3D",glow); rctx.fillRect(fx,fy,1.4,3.2+3*up); }
    rctx.globalCompositeOperation="source-over";
    // 4) shoulder crown — small jagged iron horns flanking the summit prongs
    var shY=top+H*0.16, sL=edgeL(shY), sR=edgeR(shY);
    for(i=-3;i<=3;i++){ if(i===0) continue; var hx=midx+i*((sR-sL)/8), hh=6+3*(i<0?-i:i);
      rctx.fillStyle=hexA("#04060A",0.92*dim); rctx.beginPath(); rctx.moveTo(hx-2,shY); rctx.lineTo(hx,shY-hh); rctx.lineTo(hx+2,shY); rctx.closePath(); rctx.fill();
      rctx.strokeStyle=hexA("#FF7A2E",0.12*flk*dim); rctx.lineWidth=0.8; rctx.stroke(); }
    // 5) THE MASSIF + fortified skirt the tower rises FROM — finer detail on the character's surroundings:
    // a jagged black-rock base spreading wider than the foot, small horned turrets flanking it, and fire
    // pooling in the crevices (Barad-dûr sits on a crag, not a flat plaza).
    var mW=b.w*0.92;
    rctx.fillStyle=hexA("#04060B",0.96*dim); rctx.beginPath(); rctx.moveTo(bx-mW,bottom);
    for(i=0;i<=11;i++){ var mf=i/11, mxp=(bx-mW)+((bx+b.w+mW)-(bx-mW))*mf, centre=1-Math.min(1,Math.abs(mf-0.5)*1.7);
      rctx.lineTo(mxp, bottom-(H*0.21)*(0.22+0.78*centre)*(0.72+0.5*noise(b.seed+i*2.9))); }
    rctx.lineTo(bx+b.w+mW,bottom); rctx.closePath(); rctx.fill();
    // small horned turrets flanking the base (mini dark towers)
    for(var ts=-1;ts<=1;ts+=2){ var ttx=midx+ts*(b.w*0.6+mW*0.28), tby=bottom-H*0.015, tth=H*0.12, ttw=6;
      rctx.fillStyle=hexA("#05070C",0.95*dim); rctx.beginPath(); rctx.moveTo(ttx-ttw,tby); rctx.lineTo(ttx-ttw*0.55,tby-tth); rctx.lineTo(ttx,tby-tth-5); rctx.lineTo(ttx+ttw*0.55,tby-tth); rctx.lineTo(ttx+ttw,tby); rctx.closePath(); rctx.fill(); }
    // fire pooling at the foot + turret tips
    rctx.globalCompositeOperation="lighter";
    for(i=0;i<8;i++){ var gfx=(bx-mW*0.7)+(b.w+mW*1.4)*noise(b.seed+i*5.1), gfy=bottom-3-7*noise(b.seed+i*3.3);
      var gg=rctx.createRadialGradient(gfx,gfy,0,gfx,gfy,11); gg.addColorStop(0,hexA("#FF7A2E",0.42*flk*dim)); gg.addColorStop(1,hexA("#F85149",0));
      rctx.fillStyle=gg; rctx.beginPath(); rctx.arc(gfx,gfy,11,0,7); rctx.fill(); }
    rctx.globalCompositeOperation="source-over";
    rctx.restore();
  }
  function drawBuilding(L, b, bx, top, bottom, accent, bg, flip){ var dim=L.dim, d=L.depth, lifeK=0.5+0.5*cityLife;
    // Silhouette geometry: sleek towers TAPER, so the top width narrows. Per-row edges are lerped
    // between the base rect and the (centered) top width — used for the outline, windows, and mullions.
    var tp=b.taper||1, tw=b.w*tp, txL=bx+(b.w-tw)/2, txR=txL+tw, tapered=tp<0.985;
    var edgeL=function(y){ var f=(y-top)/(b.h||1); return txL+(bx-txL)*f; };
    var edgeR=function(y){ var f=(y-top)/(b.h||1); return txR+(bx+b.w-txR)*f; };
    var outline=function(){ rctx.beginPath(); rctx.moveTo(bx,bottom); rctx.lineTo(bx+b.w,bottom); rctx.lineTo(txR,top); rctx.lineTo(txL,top); rctx.closePath(); };
    // 3D block side/top faces — only for boxy masses; sleek glass towers read cleaner without them.
    if(d>0 && !tapered){
      rctx.fillStyle="#01040A"; rctx.beginPath();
      rctx.moveTo(bx+b.w,top); rctx.lineTo(bx+b.w+d,top-d); rctx.lineTo(bx+b.w+d,bottom-d); rctx.lineTo(bx+b.w,bottom); rctx.closePath(); rctx.fill();
      rctx.beginPath(); rctx.moveTo(bx,top); rctx.lineTo(bx+d,top-d); rctx.lineTo(bx+b.w+d,top-d); rctx.lineTo(bx+b.w,top); rctx.closePath();
      rctx.fillStyle="#060D12"; rctx.fill(); rctx.strokeStyle=hexA(accent,0.12*dim); rctx.lineWidth=1; rctx.stroke(); }
    rctx.fillStyle="#03060A"; if(tapered){ outline(); rctx.fill(); } else rctx.fillRect(bx, top, b.w, b.h);   // front silhouette
    // antenna + fine SPIRE (Burj/Skytree) with a blinking aircraft beacon at the tip
    var midx=bx+b.w/2, antTop=top-b.ant;
    if(b.ant){ rctx.strokeStyle=hexA(accent,(b.crown?0.22:0.13)*dim); rctx.lineWidth=1;
      rctx.beginPath(); rctx.moveTo(midx,top); rctx.lineTo(midx,antTop); rctx.stroke(); }
    var tipY=antTop;
    if(b.spire>0){ tipY=antTop-b.spire; rctx.strokeStyle=hexA(accent,0.42*dim); rctx.lineWidth=1.3;
      rctx.beginPath(); rctx.moveTo(midx,antTop); rctx.lineTo(midx,tipY); rctx.stroke(); }
    if((b.crown||b.spire>0)){ var pulse=0.4+0.6*Math.pow(0.5+0.5*Math.sin(rainT*0.13+b.seed),3);
      rctx.save(); rctx.globalCompositeOperation="lighter";
      var cg=rctx.createRadialGradient(midx,tipY,0,midx,tipY,b.crown?15:9);
      cg.addColorStop(0,hexA(b.crown?"#EAFFFA":accent,(b.crown?0.42:0.5)*pulse*dim*lifeK)); cg.addColorStop(1,hexA(accent,0));
      rctx.fillStyle=cg; rctx.beginPath(); rctx.arc(midx,tipY,b.crown?15:9,0,7); rctx.fill(); rctx.restore();
      // ~40% of tips are red aircraft-warning beacons with a sharp on/off blink; the rest stay white.
      // Beacons run 24/7, so red ones ignore the day/night dimming (they read even when the city rests).
      var red=noise(b.seed+9.1)<0.4, bl=red?(Math.sin(rainT*0.11+b.seed)>0.55?1:0.16):(0.5+0.4*pulse)*dim;
      if(red){ rctx.save(); rctx.globalCompositeOperation="lighter";   // small red halo so the beacon pops
        var bg2=rctx.createRadialGradient(midx,tipY,0,midx,tipY,7); bg2.addColorStop(0,hexA("#F85149",0.6*bl)); bg2.addColorStop(1,hexA("#F85149",0));
        rctx.fillStyle=bg2; rctx.beginPath(); rctx.arc(midx,tipY,7,0,7); rctx.fill(); rctx.restore(); }
      rctx.fillStyle=hexA(red?"#F85149":"#EAFFFA",bl); rctx.beginPath(); rctx.arc(midx,tipY,red?1.9:1.5,0,7); rctx.fill(); }
    if(b.eye){   // Barad-dûr: fortress detailing over the silhouette, then the Eye crowns the summit
      drawBaradDur(b,bx,top,bottom,midx,edgeL,edgeR,dim);
      drawEye(midx, tipY+8, dim);
    } else if(L.code){
      rctx.save(); if(tapered){ outline(); rctx.clip(); } else { rctx.beginPath(); rctx.rect(bx,top,b.w,b.h); rctx.clip(); }
      // MICRO facade: a fine field of code glyphs; a sparse scatter of lit "windows", some warm-white
      // for micro-variation, over a very dim base grain so the surface reads textured, not flat.
      var gx=6,gy=8,cxi=0;
      for(var cx=bx+1; cx<bx+b.w; cx+=gx,cxi++){ var cyi=0;
        for(var cy=top+8; cy<bottom; cy+=gy,cyi++){ var cell=b.seed+cxi*12.9+cyi*7.3, nv=noise(cell);
          var lit=nv<0.13, ch=RG[(noise(cell+flip*0.7)*RG.length)|0], fl=0.5+0.5*Math.sin(rainT*0.05+cxi*1.3+cyi*0.7+b.seed);
          // Sparse red/amber windows among the green — the up/down pulse of a market city (refs 2/5).
          var col=accent; if(lit){ var m=noise(cell+3.1); if(m<0.12) col="#EAFFFA"; else if(m<0.26) col="#8DFBE9"; else if(m<0.34) col="#F85149"; else if(m<0.38) col="#FF9E3D"; }
          rctx.fillStyle=hexA(col,(lit?(0.40+0.36*fl)*lifeK:(0.085+0.06*noise(cell+1.3)))*dim); rctx.fillText(ch,cx,cy); } }
      // vertical structural mullions, following the taper — fine pinstripes catching the light
      rctx.strokeStyle=hexA(accent,0.09*dim); rctx.lineWidth=1;
      for(var mi=1;mi<=3;mi++){ var u=mi/4; rctx.beginPath(); rctx.moveTo(bx+b.w*u,bottom); rctx.lineTo(txL+tw*u,top); rctx.stroke(); }
      rctx.restore();
      // top rim + lit slanted edges + corner ticks + a couple of tracer sparks climbing each side
      rctx.strokeStyle=hexA(accent,0.30*dim); rctx.lineWidth=1; rctx.beginPath(); rctx.moveTo(txL,top); rctx.lineTo(txR,top); rctx.stroke();
      rctx.strokeStyle=hexA(accent,0.14*dim); rctx.beginPath(); rctx.moveTo(bx,bottom); rctx.lineTo(txL,top); rctx.moveTo(bx+b.w,bottom); rctx.lineTo(txR,top); rctx.stroke();
      rctx.fillStyle=hexA(accent,0.5*dim); rctx.fillRect(txL-1,top-1,3,2); rctx.fillRect(txR-2,top-1,3,2);
      var t0=((rainT*0.9+b.seed)%1+1)%1;
      for(var sp=0;sp<2;sp++){ var f=(t0+sp*0.5)%1, yy=bottom-(bottom-top)*f;
        rctx.fillStyle=hexA("#EAFFFA",0.5*(1-f)*dim); rctx.fillRect(edgeL(yy)-0.8,yy-0.8,1.8,1.8); rctx.fillRect(edgeR(yy)-1,yy-0.8,1.8,1.8); }
    } else {   // far / mid: cheaper — lit top rim, faint windows within the (possibly tapered) edges
      rctx.fillStyle=hexA(accent,0.24*dim); rctx.fillRect(txL,top,tw,1);
      for(var wy=top+6; wy<bottom-2; wy+=8){ var lE=edgeL(wy)+2, rE=edgeR(wy)-2;
        for(var wx=lE; wx<rE; wx+=6){ var wc=b.seed+wx*1.7+wy*0.9;
          if(noise(wc)<0.18){ var wf=0.5+0.5*Math.sin(rainT*0.04+wx+wy), mm=noise(wc+2.2);
            var wcol=mm<0.1?"#F85149":(mm<0.28?"#8DFBE9":accent); rctx.fillStyle=hexA(wcol,(0.12+wf*0.20)*dim*lifeK); rctx.fillRect(wx,wy,2,2); } } }
    }
  }
  // Ticker billboards mounted on the near-layer towers — the skyline reads as a live market.
  // Each sign ticks its seeded price on a slow, seeded walk and glows green/red on the move.
  function drawBillboards(w,h,accent){
    var pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149", mono=css("--mono")||"monospace";
    var L=cityLayers[cityLayers.length-1], ox=cityPX*L.par, bottom=h-L.base, i;
    rctx.save(); rctx.textBaseline="middle"; rctx.textAlign="center";
    for(i=0;i<L.b.length;i++){ var b=L.b[i], bd=b.board; if(!bd) continue;
      if(rainT>=bd.nextT){ var chg=bd.base*(noise(b.seed+rainT*0.31)*2-1)*0.006;
        var nx=bd.cur+chg; if(Math.abs(nx-bd.base)>bd.base*0.045) nx=bd.cur-chg;   // reflect at ±4.5%
        bd.dir=(nx>=bd.cur)?1:-1; bd.cur=nx; bd.nextT=rainT+30+((noise(b.seed+i)*46)|0); }
      var up=bd.dir>0, col=up?pos:neg, arw=up?"▲":"▼";
      var bx=b.x+ox, top=bottom-b.h, pw=Math.min(b.w-8, 68), ph=15;
      var cx=bx+b.w/2, cy=top+b.h*bd.fy, px0=cx-pw/2, py0=cy-ph/2;
      var flick=(0.72+0.28*Math.pow(0.5+0.5*Math.sin(rainT*0.09+b.seed),2))*(0.55+0.45*cityLife);   // neon flicker, dimmed off-hours
      rctx.fillStyle=hexA("#01050A",0.82); rctx.fillRect(px0,py0,pw,ph);       // sign backing
      rctx.strokeStyle=hexA(col,0.55*flick); rctx.lineWidth=1; rctx.strokeRect(px0+0.5,py0+0.5,pw-1,ph-1);
      rctx.save(); rctx.globalCompositeOperation="lighter";                    // sign glow
      rctx.fillStyle=hexA(col,0.10*flick); rctx.fillRect(px0-2,py0-2,pw+4,ph+4); rctx.restore();
      var label=bd.sym+" "+bd.cur.toFixed(2);
      rctx.font="700 8px "+mono; rctx.fillStyle=hexA(accent,0.92*flick);
      rctx.fillText(label, cx-4, cy);                                          // ticker + price
      rctx.fillStyle=hexA(col,0.95*flick);
      rctx.fillText(arw, px0+pw-6, cy);                                        // up/down arrow
    }
    rctx.restore();
  }
  // A red neon rail crossing the lower skyline, with bright cars sweeping along it (ref 5).
  function drawNeonBridge(w,h){
    var neg=css("--neg")||"#F85149", y=h*0.9, life=0.8+0.2*cityLife;   // a train runs at night too
    rctx.save(); rctx.globalCompositeOperation="lighter";
    rctx.strokeStyle=hexA(neg,0.10*life); rctx.lineWidth=3; rctx.beginPath(); rctx.moveTo(0,y); rctx.lineTo(w,y); rctx.stroke();
    rctx.strokeStyle=hexA(neg,0.34*life); rctx.lineWidth=1; rctx.beginPath(); rctx.moveTo(0,y); rctx.lineTo(w,y); rctx.stroke();
    for(var t=0;t<2;t++){ var f=(rainT*0.0016+t*0.5)%1, cx=f*(w+180)-90;   // train cars streak across
      var g=rctx.createLinearGradient(cx-72,0,cx+12,0); g.addColorStop(0,hexA(neg,0)); g.addColorStop(1,hexA("#FFB0A8",0.85*life));
      rctx.strokeStyle=g; rctx.lineWidth=2; rctx.beginPath(); rctx.moveTo(cx-72,y); rctx.lineTo(cx+12,y); rctx.stroke(); }
    rctx.restore();
  }
  function drawSkyline(w,h){ if(!cityLayers.length||!rctx) return;
    var accent=css("--accent")||"#35D0BA", bg=css("--bg")||"#0B0F14", flip=Math.floor(rainT/14), i, li;
    if(rainT%180===0) cityLifeTarget=marketLife();   // re-check the session ~every few seconds
    cityLife += (cityLifeTarget-cityLife)*0.02;       // ease the day/night transition
    cityPX += (cityPXt-cityPX)*0.08;   // eased pointer parallax
    // Empire aura from the near layer.
    var skyTop=h; for(i=0;i<skyline.length;i++){ var st=h-skyline[i].h; if(st<skyTop) skyTop=st; }
    var ag=rctx.createLinearGradient(0,skyTop-96,0,skyTop+30); ag.addColorStop(0,hexA(accent,0)); ag.addColorStop(1,hexA(accent,0.05));
    rctx.save(); rctx.globalCompositeOperation="lighter"; rctx.fillStyle=ag; rctx.fillRect(0,skyTop-96,w,126); rctx.restore();
    // Volumetric light shafts raking DOWN through the skyline — god-rays that catch the towers and haze
    // for depth. Drawn BEHIND the tower layers (below), so the near towers occlude/silhouette against
    // them; drifting dust motes inside each shaft sell the volumetric read.
    rctx.save(); rctx.globalCompositeOperation="lighter";
    for(var sh=0;sh<3;sh++){
      var drift=Math.sin(rainT*0.006+sh*2.1)*w*0.05, sx=w*(0.22+0.29*sh)+drift+cityPX*0.3;
      var topY=skyTop-70, botY=h, wTop=7+sh*3, wBot=50+sh*18, lean=(sh-1)*90;
      var g2=rctx.createLinearGradient(sx,topY,sx,botY);
      g2.addColorStop(0,hexA(accent,0.11)); g2.addColorStop(0.55,hexA(accent,0.05)); g2.addColorStop(1,hexA(accent,0));
      rctx.fillStyle=g2; rctx.beginPath();
      rctx.moveTo(sx-wTop,topY); rctx.lineTo(sx+wTop,topY);
      rctx.lineTo(sx+wBot+lean,botY); rctx.lineTo(sx-wBot+lean,botY); rctx.closePath(); rctx.fill();
      for(var dm=0;dm<7;dm++){ var f=(rainT*0.004+dm/7+sh*0.3)%1, my=lerp(botY,topY,f), mw=lerp(wBot,wTop,f);
        var mx=sx+lean*(1-f)+(noise(sh*10+dm)-0.5)*mw*1.5;
        rctx.fillStyle=hexA(accent,0.16*(1-Math.abs(f-0.5))); rctx.fillRect(mx-0.8,my-0.8,1.7,1.7); } }
    rctx.restore();
    drawNeonBridge(w,h);   // red neon rail low in the scene; near towers draw over it
    rctx.font="9px "+(css("--mono")||"monospace");
    // Back to front: FAR → MID → NEAR, each shifted by pointer parallax, then veiled with haze to recede.
    for(li=0; li<cityLayers.length; li++){ var L=cityLayers[li], ox=cityPX*L.par, bottom=h-L.base, maxH=0;
      for(i=0;i<L.b.length;i++){ var b=L.b[i]; if(b.h>maxH)maxH=b.h; drawBuilding(L, b, b.x+ox, bottom-b.h, bottom, accent, bg, flip); }
      if(L.haze>0){ var vy=bottom-maxH-8; rctx.fillStyle=hexA(bg, L.haze*4.5); rctx.fillRect(0, vy, w, h-vy); }   // atmospheric haze veil
    }
    drawBillboards(w,h,accent);   // ticker marquees ride on top of the near towers — the market city
  }
  try{ rctx = rcanvas && rcanvas.getContext ? rcanvas.getContext("2d") : null; }catch(e){ rctx=null; }
  function rainResize(){
    if(!rctx) return;
    rcanvas.width=Math.max(1,Math.floor(rcanvas.clientWidth*DPR));
    rcanvas.height=Math.max(1,Math.floor(rcanvas.clientHeight*DPR));
    rctx.setTransform(DPR,0,0,DPR,0,0);
    var n=Math.ceil(rcanvas.clientWidth/colW);
    cols=[]; for(var i=0;i<n;i++){ cols.push(Math.random()*-rcanvas.clientHeight); }
    var cw=rcanvas.clientWidth, ch=rcanvas.clientHeight, nd=Math.round(cw/15);
    weatherDrops=[]; for(var wi=0;wi<nd;wi++){ weatherDrops.push({ x:Math.random()*(cw+90), y:Math.random()*ch, len:9+Math.random()*15, spd:9+Math.random()*7 }); }
    buildSkyline(cw, ch);
  }
  // Storm: cool-blue rain streaks fall in FRONT of the whole scene, punctuated by occasional blue
  // lightning that jags from the clouds and flashes the sky — the electric storm of refs 3/4. The
  // green matrix stays the identity; blue is only the weather accent.
  function spawnBolt(w,h){
    var x=w*(0.14+Math.random()*0.72), y=-4, endY=h*(0.42+Math.random()*0.22), path=[[x,y]];
    while(y<endY){ y+=13+Math.random()*22; x+=(Math.random()-0.5)*48; path.push([x,y]); }
    boltPath=path; boltFlash=1;
  }
  function drawWeather(w,h){
    if(!weatherDrops.length) return;
    rctx.save();
    rctx.strokeStyle="rgba(176,208,255,0.16)"; rctx.lineWidth=1; rctx.beginPath();
    for(var i=0;i<weatherDrops.length;i++){ var d=weatherDrops[i];
      rctx.moveTo(d.x,d.y); rctx.lineTo(d.x-2.4,d.y+d.len); d.y+=d.spd; d.x-=1.5;
      if(d.y>h){ d.y=-d.len-Math.random()*40; d.x=Math.random()*(w+90); } }
    rctx.stroke(); rctx.restore();
    if(rainT>=nextBoltAt){ spawnBolt(w,h); nextBoltAt=rainT+300+((Math.random()*560)|0); }
    if(boltFlash>0){
      rctx.save(); rctx.globalCompositeOperation="lighter";
      var fg=rctx.createLinearGradient(0,0,0,h*0.7); fg.addColorStop(0,hexA("#9FC8FF",0.15*boltFlash)); fg.addColorStop(1,hexA("#9FC8FF",0));
      rctx.fillStyle=fg; rctx.fillRect(0,0,w,h*0.7);
      if(boltPath){ rctx.strokeStyle=hexA("#DCEBFF",0.92*Math.min(1,boltFlash*1.7)); rctx.lineWidth=2;
        rctx.shadowColor="#8FB8FF"; rctx.shadowBlur=16; rctx.beginPath(); rctx.moveTo(boltPath[0][0],boltPath[0][1]);
        for(var j=1;j<boltPath.length;j++) rctx.lineTo(boltPath[j][0],boltPath[j][1]); rctx.stroke(); rctx.shadowBlur=0; }
      rctx.restore(); boltFlash-=0.055; if(boltFlash<0) boltFlash=0;
    }
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
    drawWeather(w,h);            // rain + lightning fall in front of the whole scene
  }

  // --- Strategy Playbook: the race periodically recedes and a holographic option-payoff
  // diagram assembles center-stage, fully annotated, with Matrix glyphs lighting the strikes.
  // These are illustrative teaching diagrams (labeled STRATEGY PLAYBOOK), never live P/L.
  // pts: normalized payoff [ [x 0..1, y -1..1], ... ]; strikes: x positions of the legs.
  // maxP / maxL: realistic ASYMMETRIC risk-reward per play (illustrative $, per-contract feel).
  // why: the THESIS — the read of WHY the market should behave this way (evidence → expectation).
  // hold: the CONDITION that must persist for the play to pay. Surfaced in the signal + recap cards.
  var STRATS=[
    { name:"IRON CONDOR", cue:"LOW VOL", desc:"Range-bound — keep the credit.",
      why:"RSI stretched at the band, vol compressed — momentum's spent, so price should oscillate inside the range.",
      hold:"Holds while price stays between the short strikes.",
      pts:[[0,-1],[0.2,-1],[0.34,1],[0.66,1],[0.8,-1],[1,-1]], strikes:[0.2,0.34,0.66,0.8], maxP:420, maxL:-1080, tier:301 },
    { name:"LONG STRANGLE", cue:"VOL EXPANDING", desc:"Vol coiling — win on a break either way.",
      why:"Bands squeezed and coiling — a volatility expansion is due; the break can come either way.",
      hold:"Pays once price breaks out past either strike.",
      pts:[[0,1],[0.3,-1],[0.7,-1],[1,1]], strikes:[0.3,0.7], maxP:2600, maxL:-720, tier:301 },
    { name:"SHORT STRADDLE", cue:"RANGE-BOUND", desc:"Dead calm — sell premium, pin the strike.",
      why:"Tape pinned to the mean with vol rich — premium decays fastest if price simply stays put.",
      hold:"Best if price pins the strike; risk grows as it drifts.",
      pts:[[0,-1],[0.5,1],[1,-1]], strikes:[0.5], maxP:1180, maxL:-3400, tier:401 },
    { name:"BUTTERFLY", cue:"PINNED", desc:"Pinned — max profit at the center strike.",
      why:"Price magnetised to a level with low vol — it should land near the center strike at expiry.",
      hold:"Max profit if it expires on the center strike.",
      pts:[[0,-0.5],[0.35,-0.5],[0.5,1],[0.65,-0.5],[1,-0.5]], strikes:[0.35,0.5,0.65], maxP:1320, maxL:-340, tier:301 },
    { name:"BULL CALL SPREAD", cue:"UPTREND", desc:"Bullish reversal — capped upside, lower cost.",
      why:"Fast EMA crossing up off support, momentum turning — a measured move higher.",
      hold:"Holds while the uptrend and support persist.",
      pts:[[0,-1],[0.35,-1],[0.65,1],[1,1]], strikes:[0.35,0.65], maxP:760, maxL:-540, tier:201 },
    { name:"CALL LADDER", cue:"BREAKOUT RISK", desc:"Breakout — limited risk, room to run.",
      why:"Breakout pressure building above resistance — room to run, with defined risk.",
      hold:"Pays as price breaks and runs higher.",
      pts:[[0,0.35],[0.4,0.35],[0.55,-1],[0.75,-1],[1,1]], strikes:[0.4,0.55,0.75], maxP:1900, maxL:-880, tier:401 },
    { name:"COVERED CALL", cue:"UPTREND", desc:"Own shares, sell a call — collect income.",
      why:"Holding shares in a calm-to-rising tape — sell a call to harvest premium while it drifts up.",
      hold:"Keeps the premium while price stays below the short call.",
      pts:[[0,-1],[0.6,1],[1,1]], strikes:[0.6], maxP:640, maxL:-1900, tier:101 },
    { name:"CASH-COVERED PUT", cue:"RANGE-BOUND", desc:"Sell a put — get paid to set a buy price.",
      why:"Willing to own lower — sell a put to collect premium while price holds above your strike.",
      hold:"Keeps the premium while price stays above the short put.",
      pts:[[0,-1],[0.4,1],[1,1]], strikes:[0.4], maxP:520, maxL:-2600, tier:102 }
  ];
  // Greeks "fingerprint" — the net position's [Δ delta (direction), Θ theta (time decay),
  // V vega (vol exposure), Γ gamma (acceleration)] normalized -1..1. Teaches what each play is MADE
  // of: e.g. a condor is +theta / -vega (you want calm + time), a strangle is -theta / +vega.
  var _GK=[[0.0,0.8,-0.7,-0.5],[0.0,-0.8,0.9,0.7],[0.0,0.9,-0.9,-0.8],[0.0,0.6,-0.4,-0.3],
    [0.7,-0.1,0.15,0.2],[0.5,-0.2,0.3,0.3],[0.5,0.4,-0.3,-0.2],[0.45,0.4,-0.3,-0.2]];
  // Realistic underlyings per play — so the sim only ever pairs a strategy with a name it actually
  // suits (accurate modelling, not "iron condor on NVDA"). Range/premium-selling plays get calmer
  // mega-caps; volatility/directional plays get the high-beta movers (CRWV, NVDA, TSLA, AMD).
  var _UN=[
    ["MSFT","GOOG","AAPL","AVGO"],      // IRON CONDOR — range-bound, low realized vol
    ["CRWV","NVDA","TSLA","AMD"],       // LONG STRANGLE — coiled, breakout either way
    ["MSFT","AAPL","GOOG"],             // SHORT STRADDLE — dead calm, pins the strike
    ["AAPL","MSFT","AVGO","GOOG"],      // BUTTERFLY — pinned to a level
    ["NVDA","CRWV","AVGO","MSFT"],      // BULL CALL SPREAD — momentum higher
    ["NVDA","CRWV","TSLA","AMD"],       // CALL LADDER — breakout, room to run
    ["MSFT","AAPL","AVGO","GOOG"],      // COVERED CALL — steady holding, harvest premium
    ["MSFT","AAPL","GOOG","AVGO","NVDA"]// CASH-COVERED PUT — quality you would own on a dip
  ];
  for(var _gi=0;_gi<STRATS.length;_gi++){ STRATS[_gi].gk=_GK[_gi]; STRATS[_gi].unders=_UN[_gi]; }
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
  // Line count wrapText WOULD produce for the given font/width — measured without drawing, so a card
  // can size its backing to its content before laying the text in.
  function wrapCount(s,maxW,lh,font){ if(!s) return 1; var pf=ctx.font; ctx.font=font; var words=s.split(" "),line="",n=0,i;
    for(i=0;i<words.length;i++){ var test=line?line+" "+words[i]:words[i];
      if(ctx.measureText(test).width>maxW && line){ line=words[i]; n++; } else line=test; }
    ctx.font=pf; return n+1; }
  function clamp(v,lo,hi){ return v<lo?lo:v>hi?hi:v; }
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
  // WATCHING: the influencing inputs the desk monitors to justify the play — the underlying, a
  // fear/greed read (VIX) with a mini gauge, and the option premium (implied-vol) rate. These are the
  // "conditions" side of the read; the Greeks above are the position's exposure to them.
  function drawWatching(px, y, A){
    var accent=css("--accent")||"#35D0BA", pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149",
        muted=css("--muted")||"#8B9AAB", txt=css("--text")||"#E6EDF3", mono=css("--mono")||"monospace";
    ctx.save(); ctx.globalAlpha=A; ctx.textAlign="left";
    ctx.font="700 9px "+mono; ctx.fillStyle=hexA(muted,0.7); ctx.fillText("WATCHING", px, y); y+=15;
    // Underlying — the real name being traded.
    ctx.font="700 10px "+mono; ctx.fillStyle=hexA(muted,0.7); ctx.fillText("UNDERLYING", px, y);
    ctx.fillStyle=hexA(accent,0.95); ctx.shadowColor=accent; ctx.shadowBlur=6; ctx.fillText("▸ "+playTicker, px+92, y); ctx.shadowBlur=0; y+=15;
    // Fear/Greed via VIX: low VIX = greed (complacent), high VIX = fear. Mini gauge from calm→fear.
    var fear=clamp01((playVix-12)/26), fg=playVix<16?"GREED":(playVix>24?"FEAR":"NEUTRAL"), fc=playVix<16?pos:(playVix>24?neg:txt);
    ctx.font="700 10px "+mono; ctx.fillStyle=hexA(muted,0.7); ctx.fillText("FEAR/GREED", px, y);
    ctx.fillStyle=hexA(txt,0.9); ctx.fillText("VIX "+playVix, px+92, y);
    ctx.fillStyle=hexA(fc,0.95); ctx.fillText(fg, px+140, y); y+=6;
    var gw=138, gh=4; ctx.fillStyle=hexA(muted,0.16); ctx.fillRect(px,y,gw,gh);
    ctx.fillStyle=hexA(pos,0.2); ctx.fillRect(px,y,gw*0.28,gh); ctx.fillStyle=hexA(neg,0.2); ctx.fillRect(px+gw*0.72,y,gw*0.28,gh);
    var mp=px+gw*fear; ctx.fillStyle=fc; ctx.fillRect(mp-1.5,y-2,3,gh+4); y+=15;
    // Premium (implied vol) rate: RICH premium favors selling plays, CHEAP favors buying.
    var prem=playIV>=52?"RICH":(playIV<=36?"CHEAP":"FAIR"), pcol=playIV>=52?pos:(playIV<=36?neg:txt);
    ctx.font="700 10px "+mono; ctx.fillStyle=hexA(muted,0.7); ctx.fillText("PREMIUM IV", px, y);
    ctx.fillStyle=hexA(txt,0.9); ctx.fillText(playIV+"%", px+92, y);
    ctx.fillStyle=hexA(pcol,0.95); ctx.fillText(prem, px+140, y);
    ctx.restore();
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

  // The panel reads as a live TERMINAL: the desk runs a sequence of well-named programs and each
  // prints its result as the playcall advances — ingest, detect, assess, recommend, place, scrape.
  // A single linear, progressively-revealed story that absorbs the INGEST→DETECT→FORECAST→EXECUTE
  // pipeline into the Matrix narrative. Font weights retained: program names 700, results lighter.
  function drawTerminal(px, y, p, sig, strat, A){
    var accent=css("--accent")||"#35D0BA", pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149",
        muted=css("--muted")||"#8B9AAB", txt=css("--text")||"#E6EDF3", mono=css("--mono")||"monospace";
    var e=extrema(strat), curP=realized.length?realized[realized.length-1]:nowPrice;
    var uNow=clamp01((curP-signalPrice)/(volScale||1)+0.5), pl=dollarsAt(strat,e,payoffAt(strat.pts,uNow));
    var fg=playVix<16?"greed":(playVix>24?"fear":"neutral");
    // program name, its printed result, and the phase threshold at which it runs — ordered = the story.
    var steps=[
      ["ingest_feed", playTicker+" · live tape", p.on>0.04],
      ["detect_signal", (sig?String(sig.sig).toLowerCase():""), p.aim>0.12],
      ["assess_conditions", "vix "+playVix+" "+fg+" · iv "+playIV+"%", p.project>0.08],
      ["recommend_play", strat.name.toLowerCase()+" · class "+strat.tier, p.project>0.55],
      ["place_bet", "entry set · max "+money(strat.maxP), p.walk>0.05],
      ["scrape_swings", (p.resolve>0.02?"closed "+money(pl):"riding the swing"), p.walk>0.35]
    ];
    var act=-1,i; for(i=0;i<steps.length;i++){ if(steps[i][2]) act=i; }
    ctx.save(); ctx.globalAlpha=A; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    for(i=0;i<steps.length;i++){ if(!steps[i][2]) continue;
      var live=(i===act), done=(p.resolve>0.02||p.out>0), lit=live&&!done;
      ctx.font="700 10px "+mono; ctx.fillStyle=hexA(muted,live?0.75:0.4); ctx.fillText("$", px, y);   // prompt glyph
      ctx.fillStyle=hexA(lit?accent:muted, live?0.95:0.5);                                            // program name (700 weight retained)
      if(lit){ ctx.shadowColor=accent; ctx.shadowBlur=6; }
      ctx.fillText(steps[i][0], px+11, y); ctx.shadowBlur=0;
      var cw=ctx.measureText(steps[i][0]).width, rx=px+11+cw+8;
      // printed result (lighter weight), colored by outcome on the final scrape line
      var rcol=(i===5&&p.resolve>0.02)?(pl>=0?pos:neg):(live?txt:muted);
      ctx.font="10px "+mono; ctx.fillStyle=hexA(rcol, live?0.85:0.4); ctx.fillText(steps[i][1], rx, y);
      if(lit&&(pbGlyphT%22)<13){ ctx.fillStyle=hexA(accent,0.9); ctx.fillRect(rx+ctx.measureText(steps[i][1]).width+3, y-8, 5, 9); }   // blinking cursor at line end
      y+=15;
    }
    ctx.restore(); return y;
  }

  // LEFT-UPPER: the play in words — the bot pipeline, the detected signal, the strategy name and
  // plain-English idea, the shared anatomy legend, pivot values, and the live trade status.
  // A contained terminal-window card behind the play panel, so the readout reads as its own panel and
  // never bleeds over the cityscape/trend. This clean edge is what lets the city scale behind it.
  function drawPanelBacking(x,y,w,h,A){
    if(A<=0.01) return;
    var bg=css("--bg")||"#0B0F14", accent=css("--accent")||"#35D0BA";
    ctx.save(); ctx.globalAlpha=A;
    roundRect(x,y,w,h,11); ctx.fillStyle=hexA(bg,0.9); ctx.fill();
    roundRect(x,y,w,h,11); ctx.strokeStyle=hexA(accent,0.28); ctx.lineWidth=1; ctx.stroke();
    // terminal titlebar: three dots + a hairline rule, top-left
    ctx.fillStyle=hexA(accent,0.5); for(var d=0;d<3;d++){ ctx.beginPath(); ctx.arc(x+12+d*8,y+11,1.7,0,7); ctx.fill(); }
    ctx.strokeStyle=hexA(accent,0.16); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x+10,y+20); ctx.lineTo(x+w-10,y+20); ctx.stroke();
    ctx.restore();
  }
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
      ctx.font="700 9px "+mono; ctx.fillStyle=hexA(muted,0.7); ctx.fillText(playTicker+" · CLASS "+strat.tier, cx, ny); ny+=21;
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
    // DESKTOP: the left card is gone entirely. Everything it carried now lives where it belongs — the
    // play name + one-liner + signal read on the chart itself, the max P/L + outcome at the TARGET, and
    // the detect→recommend→pull STORY told by the Tower of Sauron itself (Eye gaze → searchlight → the
    // Ring) rather than a terminal readout. Removing it also clears the left WINDOW as the tower's stage,
    // where it resides, detects the signal, and hauls the play into view. (drawTerminal / drawPipeline /
    // drawGreeks / drawWatching / drawPanelBacking are retained for the future left drawer, task #49.)
    ctx.restore();
  }
  // Totals + outcome live at the FAR RIGHT, by the TARGET — the destination the play unfolds toward.
  // Right-aligned at the projection's right edge, stacked in the clear zone above the profit band.
  function drawTotals(strat, p, A, Xf, SY){
    var pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149", accent=css("--accent")||"#35D0BA",
        muted=css("--muted")||"#8B9AAB", mono=css("--mono")||"monospace", bg=css("--bg")||"#0B0F14";
    var e2=extrema(strat), curP=realized.length?realized[realized.length-1]:nowPrice, hiP=signalPrice+volScale*0.55;
    var uNow=clamp01((curP-signalPrice)/(volScale||1)+0.5), pl=dollarsAt(strat,e2,payoffAt(strat.pts,uNow));
    // Live in the natural HEADROOM ABOVE the chart (never over the candles): stacked bottom-up so the
    // status sits just above the top band edge, max loss + max profit above it, right-aligned.
    var rx=Xf, prj=easeIO(clamp01(p.project));
    var syS=SY(hiP)-16, yLo=syS-21, yHi=yLo-16;
    ctx.save(); ctx.globalAlpha=A*prj; ctx.textAlign="right"; ctx.textBaseline="alphabetic";
    ctx.fillStyle=hexA(bg,0.5); roundRect(rx-210, yHi-13, 216, (syS-(yHi-13))+6, 6); ctx.fill();   // dark chip for contrast
    ctx.font="700 11px "+mono;
    ctx.fillStyle=hexA(pos,0.95); ctx.fillText("MAX PROFIT  "+money(strat.maxP), rx-6, yHi);
    ctx.fillStyle=hexA(neg,0.95); ctx.fillText("MAX LOSS  "+money(strat.maxL), rx-6, yLo);
    if(p.resolve>0){ ctx.font="700 15px "+mono; ctx.fillStyle=pl>=0?pos:neg; ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=12;
      var pct=strat.maxP>0?Math.round(pl/strat.maxP*100):0, tag=(pl>0&&pct<92)?" · "+pct+"% OF MAX":(pl>0?" · LET IT RIDE":"");
      ctx.fillText("✓ CLOSED "+money(pl)+tag, rx-6, syS); ctx.shadowBlur=0; }
    else if(p.walk>0){ ctx.font="700 14px "+mono; ctx.fillStyle=pl>=0?pos:neg; ctx.fillText("PLAYCALL LIVE · "+money(pl), rx-6, syS); }
    else { ctx.font="700 12px "+mono; ctx.fillStyle=hexA(accent,0.95); ctx.fillText("▲ PLAYCALL LOCKED", rx-6, syS); }
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
  // Not a tracking spotlight anymore: a brief GLINT catches the trend at the signal point — a specular
  // reflection that flashes as the condition surfaces, then fades. Its only job is to catch the Eye's
  // attention; it never follows the signal into the pull. The Eye (drawGravityBeam) does the locking.
  function drawGlint(tx,ty,p){
    var gl=easeIO(clamp01(p.aim))*(1-easeIO(clamp01(p.zoom)))*(1-clamp01(p.walk)); if(gl<=0.01) return;
    var accent=css("--accent")||"#35D0BA", flk=0.7+0.3*Math.sin(pbGlyphT*0.5);
    ctx.save(); ctx.globalCompositeOperation="lighter";
    // bright specular core on the trendline
    var r=16*gl+4, cg=ctx.createRadialGradient(tx,ty,0,tx,ty,r);
    cg.addColorStop(0,hexA("#EAFFFA",0.9*gl*flk)); cg.addColorStop(1,hexA(accent,0));
    ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(tx,ty,r,0,7); ctx.fill();
    // a horizontal lens-flare streak — the reflection glinting off the trend
    var sw=44*gl, lg=ctx.createLinearGradient(tx-sw,ty,tx+sw,ty);
    lg.addColorStop(0,hexA(accent,0)); lg.addColorStop(0.5,hexA("#EAFFFA",0.7*gl*flk)); lg.addColorStop(1,hexA(accent,0));
    ctx.strokeStyle=lg; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(tx-sw,ty); ctx.lineTo(tx+sw,ty); ctx.stroke();
    ctx.restore(); }
  // The handoff, made to feel CAUSED (not an unmotivated camera pan): when detection locks, the light
  // MARKS the spot with an imploding reticle; then a gravity WELL opens at the destination and a tractor
  // beam PULLS the present leftward into it (bright streaks flow toward the well) until the play unfolds.
  // THE HAND-OFF — event sequencing made visible: once a spotlight's glint marks a signal on the trend,
  // the signal TRAVELS UP to the Tower of Sauron (a bright mote runs the connecting line) — the Eye has
  // to receive it before it can act. This is the beat that makes detection take time: sparkle → relay to
  // the Eye → (the Eye then assesses + locks + pulls, below). Runs through the first ~70% of AIM.
  function drawHandoff(p){
    var t=easeIO(clamp01(p.aim/0.7))*(1-clamp01((p.zoom-0.05)/0.2))*(1-clamp01(p.walk));
    if(t<=0.02) return;
    var ex=-1,ey=-1,i; for(i=0;i<skyline.length;i++){ var tb=skyline[i]; if(tb.eye){ ex=tb.x+cityPX+tb.w/2; ey=H-tb.h-(tb.ant||0)-(tb.spire||0); break; } }
    if(ex<0) return;
    var accent=css("--accent")||"#35D0BA";
    ctx.save(); ctx.globalCompositeOperation="lighter";
    // the connecting line — signal associated to the Eye (fades in as the relay runs)
    var lg=ctx.createLinearGradient(nowSX,nowSY,ex,ey);
    lg.addColorStop(0,hexA(accent,0.02*t)); lg.addColorStop(0.55,hexA(accent,0.12*t)); lg.addColorStop(1,hexA("#FFB060",0.16*t));
    ctx.strokeStyle=lg; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(nowSX,nowSY); ctx.lineTo(ex,ey); ctx.stroke();
    // the signal itself, a bright mote travelling UP to the Eye — the hand-off in motion
    var hx=lerp(nowSX,ex,t), hy=lerp(nowSY,ey,t), r=5+2*Math.sin(pbGlyphT*0.5);
    var g=ctx.createRadialGradient(hx,hy,0,hx,hy,r+3); g.addColorStop(0,hexA("#EAFFFA",0.95*(1-0.25*t))); g.addColorStop(1,hexA(accent,0));
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(hx,hy,r+3,0,7); ctx.fill();
    ctx.restore();
  }
  // THE ONE RING — the easter egg on the Eye's character piece: the signal the gaze locks onto IS the
  // Ring of Power, caught in the searchlight. A gold band viewed at a tilt, with a specular glint and the
  // fiery Elvish inscription glowing as the gaze heats it. Rendered small + elegant — a reward for looking.
  function drawOneRing(x,y,r,heat,al){ if(al<=0.01) return;
    ctx.save(); ctx.translate(x,y); var ry=r*0.42;
    // the gold band — a metallic top-light→shadow gradient makes it read as a solid ring, not a circle
    var mg=ctx.createLinearGradient(0,-r,0,r);
    mg.addColorStop(0,hexA("#FFF0C4",al)); mg.addColorStop(0.5,hexA("#E7B24C",al)); mg.addColorStop(1,hexA("#8A591A",al));
    ctx.strokeStyle=mg; ctx.lineWidth=Math.max(2,r*0.3); ctx.lineCap="round";
    ctx.beginPath(); ctx.ellipse(0,0,r,ry,0,0,7); ctx.stroke();
    // a bright specular glint riding the upper-left of the band
    ctx.strokeStyle=hexA("#FFFDF2",0.92*al); ctx.lineWidth=Math.max(1,r*0.12);
    ctx.beginPath(); ctx.ellipse(0,0,r,ry,0,Math.PI*1.02,Math.PI*1.46); ctx.stroke();
    // the inscription — a warm ring of fire riding the band + drifting glimmers, lit only when heated
    if(heat>0.02){ ctx.globalCompositeOperation="lighter";
      ctx.shadowColor="#FFB060"; ctx.shadowBlur=8*heat;
      ctx.strokeStyle=hexA("#FF9E3D",0.55*heat*al); ctx.lineWidth=Math.max(1,r*0.14);
      ctx.beginPath(); ctx.ellipse(0,0,r*0.82,ry*0.82,0,0,7); ctx.stroke(); ctx.shadowBlur=0;
      for(var gi=0;gi<8;gi++){ var ga=gi/8*Math.PI*2+pbGlyphT*0.015, gx=Math.cos(ga)*r*0.82, gy=Math.sin(ga)*ry*0.82;
        ctx.fillStyle=hexA("#FFE7B0",0.75*heat*al*(0.4+0.6*Math.sin(pbGlyphT*0.28+gi*1.3)));
        ctx.beginPath(); ctx.arc(gx,gy,0.9,0,7); ctx.fill(); } }
    ctx.restore(); }
  function drawGravityBeam(p){
    var accent=css("--accent")||"#35D0BA";
    // 1) DETECTION MARK — an imploding lock on the signal point as AIM completes, before the pull.
    var mark=clamp01((easeIO(clamp01(p.aim))-0.45)/0.55)*(1-clamp01(p.zoom/0.18))*(1-clamp01(p.walk));
    if(mark>0.02){ ctx.save(); ctx.globalCompositeOperation="lighter";
      var rr=lerp(40,10,mark); ctx.strokeStyle=hexA(accent,0.9*mark); ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.arc(nowSX,nowSY,rr,0,7); ctx.stroke();
      var tk=lerp(20,7,mark); ctx.lineWidth=1.4;
      for(var a=0;a<4;a++){ var ca=a*Math.PI/2+Math.PI/4, cX=Math.cos(ca), cY=Math.sin(ca);
        ctx.beginPath(); ctx.moveTo(nowSX+cX*(tk+6),nowSY+cY*(tk+6)); ctx.lineTo(nowSX+cX*tk,nowSY+cY*tk); ctx.stroke(); }
      var mg=ctx.createRadialGradient(nowSX,nowSY,0,nowSX,nowSY,16);
      mg.addColorStop(0,hexA("#EAFFFA",0.8*mark)); mg.addColorStop(1,hexA(accent,0));
      ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(nowSX,nowSY,16,0,7); ctx.fill(); ctx.restore(); }
    // 2) THE GRAVITY BEAM — the Tower of Sauron alone seizes the present: its spire fires a single
    // highly-charged tractor beam (black-hole physics — infinite gravity, immense charge) that CRACKLES
    // with lightning and hauls the present into the framed position. No other tower pulls.
    // The Eye's GAZE first LOCKS on the signal (a reaching beam during AIM), then intensifies into the
    // full tractor PULL as it hauls the scenario into focus (ZOOM). The Eye — not a spotlight — does this.
    var lock=easeIO(clamp01(p.aim))*(1-easeIO(clamp01(p.zoom)));
    var pull=Math.max(easeIO(clamp01(p.zoom)), lock*0.55)*(1-clamp01(p.walk))*(1-p.out);
    eyeWake=Math.max(eyeWake, pull);   // the Eye blazes while it locks on + hauls the present forward
    if(pull>0.02){
      // The Tower of Sauron ALONE commands the tractor — the Eye is the single source of the gravity
      // beam (no other crowned tower pulls). Its spire tip is the emitter that hauls the present over.
      var emL=[], ei; for(ei=0;ei<skyline.length;ei++){ var tb=skyline[ei]; if(tb.eye){
        emL.push({ x:tb.x+cityPX+tb.w/2, y:H-tb.h-(tb.ant||0)-(tb.spire||0), seed:tb.seed, eye:true }); } }
      if(emL.length){ ctx.save(); ctx.globalCompositeOperation="lighter"; ctx.lineCap="round";
        var flick=0.6+0.4*noise(pbGlyphT*0.6);   // gentle energy flicker
        // a faint jittered filament for life — kept subtle so the smooth tractor cone leads.
        var bolt=function(x0,y0,x1,y1,amp,seed,col,al,wd){ var segs=11, ddx=x1-x0, ddy=y1-y0, nx=-ddy, ny=ddx, nl=Math.sqrt(nx*nx+ny*ny)||1; nx/=nl; ny/=nl;
          ctx.beginPath(); ctx.moveTo(x0,y0);
          for(var s=1;s<segs;s++){ var t=s/segs, j=(noise(seed+s*3.1+pbGlyphT*0.22)-0.5)*amp*Math.sin(t*Math.PI);
            ctx.lineTo(x0+ddx*t+nx*j, y0+ddy*t+ny*j); }
          ctx.lineTo(x1,y1); ctx.strokeStyle=hexA(col,al); ctx.lineWidth=wd; ctx.stroke(); };
        for(var k=0;k<emL.length;k++){ var e=emL[k];
          // charged node at the spire tip — the Eye's is fiery and larger (it commands the pull)
          var enode=e.eye?"#FFE7B0":"#EAFFFA", ecol=e.eye?"#FF9E3D":accent, ndR=e.eye?16:12;
          var ng=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,ndR); ng.addColorStop(0,hexA(enode,(e.eye?0.85:0.6)*pull*flick)); ng.addColorStop(1,hexA(ecol,0));
          ctx.fillStyle=ng; ctx.beginPath(); ctx.arc(e.x,e.y,ndR,0,7); ctx.fill();
          // THE GAZE AS A VOLUMETRIC SEARCHLIGHT — narrow at the Eye, spreading into a wide soft cone that
          // lands as a lit pool on the signal (like Barad-dûr's beam finding the ring). Gravity drives the
          // electromagnetism: the pull IS the light. Layered translucent cones fake the soft volumetric
          // edges — a warm core fading out to accent — brightest near the Eye, re-brightening at the pool.
          var dxb=nowSX-e.x, dyb=nowSY-e.y, bl=Math.sqrt(dxb*dxb+dyb*dyb)||1, pnx=-dyb/bl, pny=dxb/bl;
          var bwBase=lerp(20,64,pull), swav=1+0.05*Math.sin(pbGlyphT*0.5);   // wide spreading base, faint breathe
          var cone=function(tipH, baseH, col, a){ ctx.beginPath();
            ctx.moveTo(e.x+pnx*tipH, e.y+pny*tipH); ctx.lineTo(nowSX+pnx*baseH, nowSY+pny*baseH);
            ctx.lineTo(nowSX-pnx*baseH, nowSY-pny*baseH); ctx.lineTo(e.x-pnx*tipH, e.y-pny*tipH); ctx.closePath();
            var lg=ctx.createLinearGradient(e.x,e.y,nowSX,nowSY);
            lg.addColorStop(0,hexA(col,a*pull)); lg.addColorStop(0.55,hexA(col,a*0.5*pull)); lg.addColorStop(1,hexA(col,a*0.72*pull));
            ctx.fillStyle=lg; ctx.fill(); };
          cone(5, bwBase*swav, accent, 0.09);              // outer soft haze
          cone(4, bwBase*0.62*swav, "#FFD9A0", 0.14);      // warm mid body
          cone(3, bwBase*0.30*swav, "#FFF3DD", 0.22);      // bright inner core
          // the lit POOL where the gaze lands — the ring caught in the beam
          var poolR=bwBase*1.15, plg=ctx.createRadialGradient(nowSX,nowSY,0,nowSX,nowSY,poolR);
          plg.addColorStop(0,hexA("#FFF3DD",0.5*pull)); plg.addColorStop(0.35,hexA("#FFC98A",0.28*pull)); plg.addColorStop(1,hexA(accent,0));
          ctx.fillStyle=plg; ctx.beginPath(); ctx.arc(nowSX,nowSY,poolR,0,7); ctx.fill();
          // a single faint filament (much less lightning than before)
          // the beam resonates BOTH energies: a warm volcanic filament + jittering blue-white ELECTRIC
          // arcs that crackle down the cone (gravity driving the electromagnetism), flickering per frame.
          bolt(e.x,e.y,nowSX,nowSY, 12*pull, e.seed+11, "#FFB060", 0.30*pull*flick, 1.2);   // fire filament
          for(var eb=0;eb<2;eb++){ if(noise(pbGlyphT*0.5+eb*4.1+k)<0.4) continue;
            bolt(e.x,e.y,nowSX,nowSY, 22*pull, e.seed+eb*7.3+pbGlyphT*0.3, "#CFF3FF", 0.42*pull*flick, 1); }   // electric arcs
          // charge streaming FROM the present toward the tower — the matter being pulled in
          for(var s2=0;s2<6;s2++){ var f=(pbGlyphT*0.05+s2/6+k*0.17)%1, cxp=lerp(nowSX,e.x,f), cyp=lerp(nowSY,e.y,f);
            ctx.fillStyle=hexA("#EAFFFA",0.6*(1-f)*pull); ctx.fillRect(cxp-1.2,cyp-1.2,2.4,2.4); } }
        // the present, seized by the Eye's pull — a charged, imploding well
        var wp=0.6+0.4*Math.sin(pbGlyphT*0.4);
        var pg=ctx.createRadialGradient(nowSX,nowSY,0,nowSX,nowSY,24); pg.addColorStop(0,hexA("#EAFFFA",0.5*pull*wp)); pg.addColorStop(0.5,hexA(accent,0.3*pull)); pg.addColorStop(1,hexA(accent,0));
        ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(nowSX,nowSY,24,0,7); ctx.fill();
        ctx.restore();
        // the signal, revealed as the One Ring in the beam's pool (drawn in normal blend so the gold reads)
        drawOneRing(nowSX, nowSY, lerp(9,13,pull), pull, clamp01(pull*1.4)); }
    }
  }
  // The signal EVIDENCE + the THESIS, a callout ANCHORED to the aim point (not a right column): RSI +
  // a mini oversold/overbought gauge, the one-line reason, then WHY the market should behave this way
  // and the CONDITION that must hold. This is the "why we're calling it" beat. Fades in on AIM.
  function drawSignalCallout(sig, strat, x, y, A){ if(A<=0.01) return;
    var accent=css("--accent")||"#35D0BA", pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149",
        muted=css("--muted")||"#8B9AAB", txt=css("--text")||"#E6EDF3", mono=css("--mono")||"monospace", bg=css("--bg")||"#0B0F14";
    var rc=rsiV<30?pos:(rsiV>70?neg:txt);
    // A RETICLE marks the exact point on the tape where the condition tripped — the callout is an
    // annotation OF that point, not a slab floating over the forecast.
    ctx.save(); ctx.globalAlpha=A;
    ctx.strokeStyle=hexA(rc,0.8); ctx.lineWidth=1.3; ctx.beginPath(); ctx.arc(x,y,4.5,0,7); ctx.stroke();
    ctx.strokeStyle=hexA(rc,0.4); ctx.beginPath(); ctx.arc(x,y,8.5,0,7); ctx.stroke();
    // The card is COMPACT and sits over the CALM frozen history to the LEFT of the entry, clear of the
    // live bands on the right — essentials only (the RSI gauge, the condition, one-line why). Its height
    // hugs the content; a hairline leader connects it back to the reticle so the association is legible.
    var cw=196, gw=cw-26,
        cueLines=wrapCount(sig?sig.sig:"", gw, 13, "700 9px "+mono),
        ch=67+cueLines*13+10,
        cx=sigStackX, cy=sigStackY;   // docked directly beneath the play name + one-liner
    // a hairline leader runs DOWN from the read to the reticle on the tape — "this is the point"
    ctx.setLineDash([2,4]); ctx.strokeStyle=hexA(rc,0.42); ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(cx+16, cy+ch); ctx.lineTo(x, y-9); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle=hexA(bg,0.8); roundRect(cx,cy,cw,ch,7); ctx.fill();
    ctx.strokeStyle=hexA(rc,0.4); ctx.lineWidth=1; roundRect(cx,cy,cw,ch,7); ctx.stroke();
    // a thin accent spine on the left edge — reads as "wired into the signal", not a boxed panel
    ctx.fillStyle=hexA(rc,0.7); ctx.fillRect(cx,cy+7,2,ch-14);
    var px=cx+14, yy=cy+18; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    ctx.font="700 9px "+mono; ctx.fillStyle=hexA(accent,0.9); ctx.fillText("◈ SIGNAL DETECTED", px, yy); yy+=20;
    ctx.font="700 12px "+mono; ctx.fillStyle=hexA(muted,0.9); ctx.fillText("RSI", px, yy);
    ctx.fillStyle=hexA(rc,0.95); ctx.fillText(rsiV.toFixed(0), px+32, yy);
    var gx=px, gy=yy+8, gh=6;
    ctx.fillStyle=hexA(muted,0.16); ctx.fillRect(gx,gy,gw,gh);
    ctx.fillStyle=hexA(pos,0.22); ctx.fillRect(gx,gy,gw*0.3,gh);
    ctx.fillStyle=hexA(neg,0.22); ctx.fillRect(gx+gw*0.7,gy,gw*0.3,gh);
    var mp=gx+gw*clamp01(rsiV/100); ctx.fillStyle=rc; ctx.fillRect(mp-1.5,gy-2,3,gh+4);
    // The condition (cue) only — the play's rationale/description lives on the chart title, not repeated
    // here (that duplication was drift). This card is purely the SIGNAL: RSI gauge + what tripped.
    yy=gy+gh+15; ctx.font="700 9px "+mono; ctx.fillStyle=hexA(accent,0.9); wrapText((sig?sig.sig:""), px, yy, gw, 13);
    ctx.restore(); }
  // THE INSIGHT ACT — the beat between detecting the signal and predicting the play, where the machine
  // RECOGNISES what it's looking at. The watched facts (the signal + fear/greed + premium) snap together
  // as converging threads into the entry, collide in a synapse burst, and the recognition surfaces as a
  // plain-language line — which segues straight into the play name crystallising as the chart title.
  function drawInsight(strat, p){ if(!strat) return;
    var ins=clamp01(p.insight); if(ins<=0.01 || p.project>0.55) return;
    var accent=css("--accent")||"#35D0BA", muted=css("--muted")||"#8B9AAB", mono=css("--mono")||"monospace";
    var fx=nowSX, fy=nowSY, e=easeIO(ins);
    ctx.save(); ctx.globalCompositeOperation="lighter";
    // three input threads converging on the entry — separate facts becoming one conclusion
    var srcs=[[fx-158,fy-92],[fx-128,fy+74],[fx-196,fy-4]];
    for(var i=0;i<srcs.length;i++){ var sx=srcs[i][0], sy=srcs[i][1], hx=lerp(sx,fx,e), hy=lerp(sy,fy,e);
      var lg=ctx.createLinearGradient(sx,sy,hx,hy);
      lg.addColorStop(0,hexA(accent,0)); lg.addColorStop(1,hexA(accent,0.5*e));
      ctx.strokeStyle=lg; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(hx,hy); ctx.stroke();
      var r=2.4+1.4*Math.sin(pbGlyphT*0.4+i*2);
      var g=ctx.createRadialGradient(hx,hy,0,hx,hy,r+2); g.addColorStop(0,hexA("#EAFFFA",0.9)); g.addColorStop(1,hexA(accent,0));
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(hx,hy,r+2,0,7); ctx.fill(); }
    // synapse BURST at convergence — the aha lands
    if(ins>0.62){ var b=easeIO(clamp01((ins-0.62)/0.38)), br=6+34*b;
      ctx.strokeStyle=hexA(accent,0.55*(1-b)); ctx.lineWidth=2*(1-b)+0.4; ctx.beginPath(); ctx.arc(fx,fy,br,0,7); ctx.stroke();
      var fg=ctx.createRadialGradient(fx,fy,0,fx,fy,18); fg.addColorStop(0,hexA("#EAFFFA",Math.min(0.75,b*(1-b)*3))); fg.addColorStop(1,hexA(accent,0));
      ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(fx,fy,18,0,7); ctx.fill(); }
    ctx.restore();
    // the recognition, in plain words — what the convergence MEANS, handed off to the crystallising name
    var cue=strat.cue, cap="SIGNAL RECOGNISED";
    if(cue==="VOL EXPANDING"||cue==="BREAKOUT RISK") cap="COILED VOL · NEUTRAL TAPE → EXPANSION DUE";
    else if(cue==="UPTREND") cap="MOMENTUM CONFIRMED → RIDE IT HIGHER";
    else cap="TAPE PINNED · CALM → COLLECT THE RANGE";
    ctx.save(); ctx.globalAlpha=e*(1-clamp01((p.project-0.15)/0.4)); ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    ctx.font="700 7px "+mono; ctx.fillStyle=hexA(muted,0.7); ctx.fillText("INSIGHT", fx, fy+34);
    ctx.font="700 10px "+mono; ctx.fillStyle=hexA(accent,0.95); ctx.shadowColor=accent; ctx.shadowBlur=8;
    ctx.fillText("◇ "+cap, fx, fy+48); ctx.shadowBlur=0;
    ctx.restore(); }
  // RETROSPECTIVE recap, shown once the play resolves: restates the play, confirms the condition held,
  // names the events that moved it, and books the result — so the user's read of the animation is
  // confirmed against the outcome. Anchored where the signal card was (they never coexist).
  function drawRecap(strat, sig, x, y, A){ if(A<=0.01||!strat) return;
    var accent=css("--accent")||"#35D0BA", pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149",
        muted=css("--muted")||"#8B9AAB", txt=css("--text")||"#E6EDF3", mono=css("--mono")||"monospace", bg=css("--bg")||"#0B0F14";
    // Stripped to the one thing that's UNIQUE to the recap: did the thesis hold? The play name is the
    // chart title, the booked P/L lives at the TARGET, and the event that moved it is marked on the
    // timeline — none of that is repeated here. Same organic spine-card, docked beneath the name.
    var cw=196, ch=54, cx=sigStackX, cy=sigStackY;
    var e=extrema(strat), uEx=clamp01((targetPrice-signalPrice)/(volScale||1)+0.5),
        pl=dollarsAt(strat,e,payoffAt(strat.pts,uEx)), win=pl>=0, rcol=win?pos:neg;
    ctx.save(); ctx.globalAlpha=A;
    ctx.fillStyle=hexA(bg,0.8); roundRect(cx,cy,cw,ch,7); ctx.fill();
    ctx.strokeStyle=hexA(rcol,0.4); ctx.lineWidth=1; roundRect(cx,cy,cw,ch,7); ctx.stroke();
    ctx.fillStyle=hexA(rcol,0.7); ctx.fillRect(cx,cy+7,2,ch-14);
    var px=cx+14, yy=cy+18; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    ctx.font="700 9px "+mono; ctx.fillStyle=hexA(rcol,0.9); ctx.fillText("◈ PLAYCALL RECAP", px, yy); yy+=20;
    ctx.font="700 14px "+mono; ctx.fillStyle=hexA(rcol,0.95); ctx.fillText((win?"✓ READ HELD":"✗ READ BROKE"), px, yy);
    ctx.restore(); }

  // FORECAST-ON-TREND: the called play is drawn into the FUTURE (right of "now", where there is no
  // data yet), anchored to the live trend. The bot's forecast = horizontal profit(green)/loss(red)
  // PRICE BANDS, dotted BREAKEVEN levels, a dotted happy-path PROJECTION with direction arrows, and
  // an entry→target track. During WALK the solid trend climbs into the band and the trade resolves.
  // Information unfolds phase-by-phase (aim → project → walk → resolve) so it reads at a digestible
  // pace rather than arriving all at once.
  // --- Canvas label collision system: track occupied boxes per frame and nudge labels so intricate
  // overlays never stomp each other (critical on smaller viewports). reserveBox() marks fixed labels;
  // placeLabelC() places a CENTER-aligned label, nudging it away (default up) until it clears. ---
  var _lblBoxes=[];
  function resetLabels(){ _lblBoxes.length=0; }
  function reserveBox(x0,y0,x1,y1){ _lblBoxes.push([x0,y0,x1,y1]); }
  function _boxHit(x0,y0,x1,y1){ for(var i=0;i<_lblBoxes.length;i++){ var o=_lblBoxes[i];
    if(x0<o[2]&&x1>o[0]&&y0<o[3]&&y1>o[1]) return true; } return false; }
  // Search BOTH directions for a clear slot (preferring the requested dir, default up), so a label
  // boxed in above drops below instead of stacking into its neighbour. Falls back to the origin.
  function placeLabelC(cx, y, text, lh, dir){ var w=ctx.measureText(text).width, x0=cx-w/2-2, x1=cx+w/2+2, st=lh||11, d=dir||-1, step=st+2;
    for(var k=0; k<22; k++){ var m=Math.ceil(k/2)*step, ty=(k===0)?y:(k%2===1? y+d*m : y-d*m);
      if(!_boxHit(x0, ty-st, x1, ty+2)){ _lblBoxes.push([x0, ty-st, x1, ty+2]); return ty; } }
    _lblBoxes.push([x0, y-st, x1, y+2]); return y; }
  function drawForecast(strat, sig, p){
    if(!strat) return;
    resetLabels();
    var A=1-p.out, proj=easeIO(clamp01(p.project));
    var accent=css("--accent")||"#35D0BA", pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149",
        muted=css("--muted")||"#8B9AAB", txt=css("--text")||"#E6EDF3", mono=css("--mono")||"monospace";
    var e=extrema(strat);
    var X0=nowSX, Xf=Math.min(W*0.93, X0+Math.max(180,(W-X0)-40)); if(Xf<X0+90) Xf=X0+90;
    function SY(P){ return nowSY-(P-nowPrice)*pxPerPrice; }
    function priceOf(u){ return signalPrice+(u-0.5)*volScale; }
    var loP=signalPrice-volScale*0.55, hiP=signalPrice+volScale*0.55;
    // Reserve the top-right totals headroom so event labels (which stagger upward) steer clear of it.
    if(W>=820 && proj>0.01) reserveBox(Xf-212, SY(hiP)-66, Xf+4, SY(hiP)-12);
    // Reserve the signal-callout box (it's drawn later, top-center-right) so event labels dodge it too.
    if(W>=820 && p.aim>0.05 && p.walk<0.7){ var ccw=228, ccx=Math.min(X0+30, W-ccw-16), ccy=field.top+4;
      reserveBox(ccx, ccy, ccx+ccw, ccy+178); }
    ctx.save(); ctx.globalAlpha=A;
    if(proj>0.01){
      // Opaque backing behind the whole play chart (bands + candles + RSI rail) so the tape reads
      // with strong contrast against the busy market/matrix behind it.
      var chTop=SY(hiP)-14, chBot=Math.min(field.bottom-4, SY(loP)+60);
      ctx.fillStyle=hexA(css("--bg")||"#0B0F14", 0.55*proj); ctx.fillRect(X0-6, chTop, (Xf+40)-(X0-6), chBot-chTop);
      // EYE BACKLIGHT — the tower's gaze EVENLY backlights the play (not a left-side spill): a uniform
      // warm wash across the whole chart + a broad soft radial hotspot, additive, brightening as it wakes.
      var glow=proj*(0.7+0.35*eyeWake), cbx=(X0+Xf)/2, cby=SY(signalPrice);
      ctx.save(); ctx.globalCompositeOperation="lighter";
      ctx.fillStyle=hexA("#FF9A4A",0.05*glow); ctx.fillRect(X0-6, chTop, (Xf+40)-(X0-6), chBot-chTop);   // even warm wash
      var rg=ctx.createRadialGradient(cbx,cby,0,cbx,cby,(Xf-X0)*0.62);
      rg.addColorStop(0,hexA("#FFC078",0.08*glow)); rg.addColorStop(0.6,hexA(accent,0.04*glow)); rg.addColorStop(1,hexA(accent,0));
      ctx.fillStyle=rg; ctx.fillRect(X0-6, chTop, (Xf+40)-(X0-6), chBot-chTop); ctx.restore();
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
      var volx=X0+(Xf-X0)*0.5, voly=SY(midP+bwHalf*1.9)-2; ctx.fillText("VOL", volx, voly);
      reserveBox(volx-2, voly-9, volx+ctx.measureText("VOL").width+2, voly+2);   // event labels avoid VOL
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
      // horizontal profit/loss PRICE BANDS across the future region (a touch richer fill)
      var NB=72, sh=Math.abs(SY(hiP)-SY(loP))/(NB-1)+1;
      for(var i=0;i<NB;i++){ var P=loP+(hiP-loP)*(i/(NB-1)), u=(P-signalPrice)/(volScale||1)+0.5, v=payoffAt(strat.pts,u);
        if(Math.abs(v)<0.05) continue; ctx.fillStyle=hexA(v>0?pos:neg, 0.17*proj*Math.min(1,Math.abs(v)*1.6));
        ctx.fillRect(X0, SY(P)-sh/2, Xf-X0, sh); }
      // ENERGY FLARE — Sauron's two energies flicker THROUGH the zones: jagged ELECTRIC (blue-white) glints
      // in the green PROFIT band, rising FIRE embers in the red LOSS band. Faint so the tape stays legible.
      ctx.save(); ctx.globalCompositeOperation="lighter";
      for(var fz=0;fz<26;fz++){ var fux=X0+(Xf-X0)*noise(fz*2.7+1.3), fP=loP+(hiP-loP)*noise(fz*3.9+0.7),
          fv=payoffAt(strat.pts,(fP-signalPrice)/(volScale||1)+0.5); if(Math.abs(fv)<0.12) continue;
        var fyy=SY(fP), fl=0.35+0.65*Math.sin(pbGlyphT*0.4+fz*1.7); if(fl<0) fl=0;
        if(fv>0){ ctx.strokeStyle=hexA("#CFF3FF",0.16*proj*fl*Math.min(1,fv*1.5)); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(fux-7,fyy);
          for(var es=1;es<=3;es++){ ctx.lineTo(fux-7+14*(es/3), fyy+(noise(fz+es+Math.floor(pbGlyphT*0.3))-0.5)*6); } ctx.stroke(); }
        else { var eg=ctx.createRadialGradient(fux,fyy-3*fl,0,fux,fyy-3*fl,4.5); eg.addColorStop(0,hexA("#FF9E3D",0.30*proj*fl*Math.min(1,-fv*1.5))); eg.addColorStop(1,hexA("#F85149",0));
          ctx.fillStyle=eg; ctx.beginPath(); ctx.arc(fux,fyy-3*fl,4.5,0,7); ctx.fill(); } }
      ctx.restore();
      // NEON zone boundaries: fluorescent glowing edges on the top/bottom of the band, colored by the
      // payoff SIGN there (green if that extreme is profit, red if loss) — same tone, magnified contrast.
      var vHi=payoffAt(strat.pts,(hiP-signalPrice)/(volScale||1)+0.5), vLo=payoffAt(strat.pts,(loP-signalPrice)/(volScale||1)+0.5);
      ctx.save(); ctx.lineWidth=1.6;
      ctx.shadowColor=vHi>=0?pos:neg; ctx.shadowBlur=9; ctx.strokeStyle=hexA(vHi>=0?pos:neg,0.65*proj);
      ctx.beginPath(); ctx.moveTo(X0,SY(hiP)); ctx.lineTo(Xf,SY(hiP)); ctx.stroke();
      ctx.shadowColor=vLo>=0?pos:neg; ctx.shadowBlur=9; ctx.strokeStyle=hexA(vLo>=0?pos:neg,0.65*proj);
      ctx.beginPath(); ctx.moveTo(X0,SY(loP)); ctx.lineTo(Xf,SY(loP)); ctx.stroke();
      ctx.restore();
      // BOUNDARY ENERGY — Sauron's power SPILLS off the play's edges, matching the tile it borders: a
      // GREEN edge crackles with electric arcs (matrix energy escaping); a RED edge flares with fire /
      // molten tongues + rising embers. Hyper-exaggerated where the energy builds up, flickering per frame.
      var edgeEnergy=function(y,dir,green){ var cnt=Math.round((Xf-X0)/24);
        for(var ie=0;ie<cnt;ie++){ var ex=X0+(Xf-X0)*((ie+0.5)/cnt)+(noise(ie*3.1)-0.5)*10,
            fl=noise(ie*2.3+Math.floor(pbGlyphT*0.35)+dir*7); if(fl<0.5) continue; var amp=(fl-0.5)/0.5;
          if(green){ ctx.strokeStyle=hexA("#CFF3FF",0.55*proj*amp); ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(ex,y);
            var len=9+18*amp; for(var s=1;s<=3;s++){ ctx.lineTo(ex+(noise(ie+s+Math.floor(pbGlyphT*0.3))-0.5)*11, y+dir*len*(s/3)); } ctx.stroke();
            ctx.fillStyle=hexA("#EAFFFA",0.65*proj*amp); ctx.fillRect(ex-0.8,y-0.8,1.6,1.6); }
          else { var len2=11+22*amp, fgx=ex+(noise(ie+1)-0.5)*6;
            var fg=ctx.createLinearGradient(ex,y,fgx,y+dir*len2); fg.addColorStop(0,hexA("#FFD24D",0.6*proj*amp)); fg.addColorStop(0.5,hexA("#FF7A2E",0.42*proj*amp)); fg.addColorStop(1,hexA("#F85149",0));
            ctx.strokeStyle=fg; ctx.lineWidth=2.3; ctx.beginPath(); ctx.moveTo(ex,y); ctx.quadraticCurveTo(ex+(noise(ie+pbGlyphT*0.2)-0.5)*9, y+dir*len2*0.6, fgx, y+dir*len2); ctx.stroke();
            var ey=y+dir*(len2+7*amp), eg2=ctx.createRadialGradient(ex,ey,0,ex,ey,3.2); eg2.addColorStop(0,hexA("#FFB060",0.55*proj*amp)); eg2.addColorStop(1,hexA("#F85149",0));
            ctx.fillStyle=eg2; ctx.beginPath(); ctx.arc(ex,ey,3.2,0,7); ctx.fill(); } } };
      ctx.save(); ctx.globalCompositeOperation="lighter";
      edgeEnergy(SY(hiP), -1, vHi>=0);   // top edge — energy spills UP
      edgeEnergy(SY(loP), 1, vLo>=0);    // bottom edge — energy spills DOWN
      ctx.restore();
      // "now" divider — the boundary between recorded history and forecast
      ctx.setLineDash([2,5]); ctx.strokeStyle=hexA(txt,0.35*proj); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(X0,SY(hiP)); ctx.lineTo(X0,SY(loP)); ctx.stroke(); ctx.setLineDash([]);
      // NEON breakeven levels — the profit↔loss boundary, drawn as a bright fluorescent line with glow.
      ctx.save(); ctx.setLineDash([4,6]); ctx.font="700 9px "+mono; ctx.textAlign="left"; ctx.shadowColor="#6ff5e0"; ctx.shadowBlur=8;
      for(var k=0;k<e.be.length;k++){ var by=SY(priceOf(e.be[k]));
        ctx.strokeStyle=hexA("#8dfbe9",0.85*proj); ctx.lineWidth=1.3; ctx.beginPath(); ctx.moveTo(X0,by); ctx.lineTo(Xf,by); ctx.stroke();
        ctx.fillStyle=hexA("#8dfbe9",0.9*proj); ctx.fillText("B/E", Xf+5, by+3); }
      ctx.setLineDash([]); ctx.shadowBlur=0; ctx.restore();
      // Madden-style corner brackets that FRAME the enhanced future — neon glow (the "enhance, zoom" read)
      ctx.save(); ctx.shadowColor=accent; ctx.shadowBlur=7;
      drawBrackets(X0-6, SY(hiP)-12, Xf+40, SY(loP)+12, hexA(accent,0.6*proj)); ctx.restore();
    }
    // happy-path dotted PROJECTION from now → target, with direction arrows
    var up=targetPrice>signalPrice+volScale*0.03, dn=targetPrice<signalPrice-volScale*0.03;
    var acol=up?pos:(dn?neg:muted), dir=up?-1:(dn?1:0);
    var yNow=SY(nowPrice), yTgt=SY(targetPrice);
    if(proj>0.01){
      // The plan reads as a SCRIPT: true round dots on a perfectly smooth ease — deliberately too
      // clean to be a tape, so the realized ink (candles, wandering) is unmistakably "what happened".
      ctx.save(); ctx.setLineDash([0.1,8]); ctx.lineCap="round"; ctx.strokeStyle=hexA(acol,0.9*proj); ctx.lineWidth=2.6; ctx.beginPath();
      var SEG=56; for(var s=0;s<=SEG;s++){ var tt=s/SEG, xx=X0+(Xf-X0)*tt, yy=yNow+(yTgt-yNow)*easeIO(tt); s?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy); }
      ctx.stroke(); ctx.restore(); ctx.setLineDash([]);
      for(var a=1;a<=3;a++){ var t2=a/4, ax2=X0+(Xf-X0)*t2, ay2=yNow+(yTgt-yNow)*easeIO(t2); drawChevron(ax2,ay2,dir,hexA(acol,0.95*proj)); }
      // entry marker (at now) + target marker (max-profit price)
      ctx.fillStyle=hexA(accent,0.95*proj); ctx.beginPath(); ctx.arc(X0,yNow,3.5,0,7); ctx.fill();
      ctx.font="700 9px "+mono; ctx.textAlign="left"; ctx.fillStyle=hexA(accent,0.9*proj); ctx.fillText("ENTRY", X0+7, yNow-7);
      var tpulse=p.resolve>0?(0.5+0.5*Math.sin(pbGlyphT*0.5)):0;
      ctx.strokeStyle=hexA(acol,0.9*proj); ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(Xf,yTgt,5+5*tpulse,0,7); ctx.stroke();
      var uT=clamp01((targetPrice-signalPrice)/(volScale||1)+0.5);
      ctx.textAlign="right"; ctx.fillStyle=hexA(acol,0.95*proj); ctx.fillText("TARGET "+money(dollarsAt(strat,e,payoffAt(strat.pts,uT))), Xf-6, yTgt-9);
    }
    // PLAY NAME as the chart's OWN title — the graph is the play's visual representation, so it labels
    // itself here (headroom above the top band, at the entry), not in a detached panel. An eyebrow ties
    // it to the underlying + complexity class. Reserved so event labels steer clear.
    var ins=easeIO(clamp01(p.insight));
    if(W>=820){
      // The title anchor is computed EVERY frame the play is active (not just once the name shows), so the
      // signal read + recap dock beneath it consistently through AIM → INSIGHT → walk.
      var sans2=css("--sans")||"sans-serif", tnx=X0, tnY=SY(hiP)-12, tsz=(W>=1200?26:21), teY=tnY-(tsz+4);   // title scales up on wide viewports (full-width playcall has the room)
      var descLines=wrapCount(strat.desc, 380, 16, "13px "+sans2);
      sigStackX=tnx; sigStackY=tnY+19+descLines*16+8;
      if(ins>0.01){
        // The name CRYSTALLISES out of the insight beat — settling from slightly-large + hot glow into
        // place — then persists as the chart's title through the forecast + walk.
        var sc=1+0.16*(1-ins), gl=16+18*(1-ins);
        ctx.save(); ctx.globalAlpha=A*ins; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
        ctx.font="700 9px "+mono; ctx.fillStyle=hexA(accent,0.9); ctx.fillText(playTicker+" · CLASS "+strat.tier, tnx, teY);
        ctx.save(); ctx.translate(tnx, tnY); ctx.scale(sc, sc);
        ctx.font="700 "+tsz+"px "+sans2; ctx.fillStyle=txt; ctx.shadowColor=accent; ctx.shadowBlur=gl;
        ctx.fillText(strat.name, 0, 0); ctx.shadowBlur=0;
        var tnw=ctx.measureText(strat.name).width*sc; ctx.restore();
        reserveBox(tnx-2, teY-11, tnx+Math.max(tnw,120)+4, tnY+3);
        // The play's one-liner sits DIRECTLY under the name — the redesign opened the room for it (it used
        // to be crammed in the left card).
        ctx.globalAlpha=A*ins; ctx.font="13px "+sans2; ctx.fillStyle=hexA(muted,0.92);
        wrapText(strat.desc, tnx, tnY+19, 380, 16);
        ctx.restore();
      }
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
          ctx.font="700 9px "+mono; var sy=placeLabelC(ex, ay-11, ev.label, 11);
          ctx.fillStyle=hexA(muted,0.7*proj); ctx.fillText(ev.label, ex, sy);
          ctx.font="700 7px "+mono; var sy2=placeLabelC(ex, sy-10, "SCHEDULED", 9);
          ctx.fillStyle=hexA(muted,0.45*proj); ctx.fillText("SCHEDULED", ex, sy2);
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
        var elab=(ev.scheduled?"":"! ")+ev.label;
        ctx.font="700 9px "+mono; var ly=placeLabelC(ex, ay-ah-4, elab, 11);   // stagger so close events never overlap
        ctx.fillStyle=hexA(ecol,(ei===warpIdx?1:0.9)*proj); ctx.fillText(elab, ex, ly);
        // Earnings cross-read note (big tech signals peers) above the label.
        if(ev.note){ ctx.font="700 7px "+mono; var ny=placeLabelC(ex, ly-10, "→ "+ev.note, 9);
          ctx.fillStyle=hexA(muted,0.7*proj); ctx.fillText("→ "+ev.note, ex, ny); } }
      ctx.textAlign="start"; }
    ctx.textAlign="start"; ctx.restore();
    // RSI oscillator lane, parallel below the candles during the walk — the overbought/oversold read
    // that drives entries + profit-taking, aligned tick-for-tick with the realized tape above it.
    if(p.walk>0 && realized.length>3){
      var dxL=W/(SPAN-1), comb=price.slice(0,nowIdx+1).concat(realized), rl2=realized.length;
      var lt=SY(loP)+18, lh=(W>=1200?120:100); if(lt+lh>field.bottom-6) lt=field.bottom-6-lh; if(lt<SY(loP)+8) lt=SY(loP)+8; var lb=lt+lh;
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
    // Spotlight the most NOTEWORTHY candle: the bots flag an outsized move on the realized tape (the
    // biggest-range group, when it stands well above the recent norm) with a reticle + a significance
    // callout — tying it to an event print when one lines up. Only during the walk, desktop.
    if(W>=820 && p.walk>0 && p.out<=0 && realized.length>=10){
      var G=4, best=-1, bestR=0, bestHi=0, sumR=0, nR=0, gi, jj;
      for(gi=0; gi+G<=realized.length; gi+=G){ var chi=-1e9, clo=1e9;
        for(jj=gi;jj<gi+G;jj++){ if(realized[jj]>chi)chi=realized[jj]; if(realized[jj]<clo)clo=realized[jj]; }
        var rg=chi-clo; sumR+=rg; nR++; if(rg>bestR){ bestR=rg; best=gi; bestHi=chi; } }
      var avgR=nR?sumR/nR:0;
      if(best>=0 && bestR>avgR*1.7){
        var dxL2=W/(SPAN-1), n2=price.length, cx=nowSX+(best+(G-1)/2+1)*dxL2*zoom, cyH=SY(bestHi);
        // significance: tie to an event if this candle sits on one, else an outsized move
        var frac=realized.length?(best+G*0.5)/realized.length:0, tie="", wj2;
        for(wj2=0;wj2<events.length;wj2++){ if(events[wj2].fired && Math.abs(frac-clamp01(events[wj2].f))<0.09){ tie=events[wj2].label; break; } }
        var sig2 = tie ? ("◎ MOVE ON "+tie) : "◎ OUTSIZED MOVE";
        var pz2=0.5+0.5*Math.sin(pbGlyphT*0.3);
        ctx.save(); ctx.globalAlpha=A;
        ctx.strokeStyle=hexA(accent,0.5+0.4*pz2); ctx.lineWidth=1.3;
        ctx.beginPath(); ctx.arc(cx, cyH, 8+pz2*3, 0, 7); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-13,cyH); ctx.lineTo(cx-6,cyH); ctx.moveTo(cx+6,cyH); ctx.lineTo(cx+13,cyH);
        ctx.moveTo(cx,cyH-13); ctx.lineTo(cx,cyH-6); ctx.stroke();
        ctx.font="700 8px "+mono; ctx.textAlign="center";
        var cly=placeLabelC(cx, cyH-16, sig2, 10);
        ctx.fillStyle=hexA(accent,0.92); ctx.fillText(sig2, cx, cly);
        ctx.textAlign="start"; ctx.restore();
      }
    }
    drawPanel(strat, sig, p, A);
    if(W>=820 && proj>0.01) drawTotals(strat, p, A, Xf, SY);   // max P/L + outcome at the far right, by the TARGET
    // The thesis + recap cards are desktop-only — on narrow screens they'd collide with the centered
    // stacked panel, which already carries the play's essentials.
    if(W>=820){
      // signal callout is anchored to the aim point and fades out once the walk takes over
      // Signal modal removed — the dotted forecast trajectory (the ideal path the market should take
      // given the signal) now communicates the route, with the realized tape tracking it under variance.
      // Retrospective recap once the play resolves — confirms the thesis played out (bookends the WHY).
      var recapA=A*clamp01((p.resolve-0.45)/0.55)*(1-clamp01(p.out*1.7));
      if(recapA>0.01) drawRecap(strat, sig, X0, yNow, recapA);
    }
    drawGlint(X0, yNow, p);
  }
  // Play phases (ms): DETECT → AIM → ZOOM → PROJECT → WALK-forward → RESOLVE → HOLD → ZOOM-OUT.
  // Each phase is followed by a short DWELL so the last thing shown isn't rushed into the next step —
  // the reveal breathes. A longer HOLD after RESOLVE lets the "closed +$" land before we zoom out.
  // INSIGHT sits between ZOOM and PROJECT: the beat where the watched inputs SNAP together into the
  // recognised play (the "aha"), which then crystallises as the chart title and hands off to the forecast.
  var DET=640,AIM=760,DW_AIM=760,ZM=620,INS=960,DW_INS=280,PRJ=880,DW_PRJ=320,WLK=4200,RES=700,HOLD=1900,OUT=820;
  var T_AIM=DET, T_ZM=T_AIM+AIM+DW_AIM, T_INS=T_ZM+ZM, T_PRJ=T_INS+INS+DW_INS, T_WLK=T_PRJ+PRJ+DW_PRJ,
      T_RES=T_WLK+WLK, T_OUT=T_RES+RES+HOLD, T_END=T_OUT+OUT;
  var ACTB=[0, T_INS, T_PRJ, T_WLK, T_RES];   // act boundaries: SIGNAL · INSIGHT · PREDICT · REALIZE · RESOLVE
  function playProg(e){ return {
    on:clamp01(e/DET), aim:clamp01((e-T_AIM)/AIM), zoom:clamp01((e-T_ZM)/ZM),
    insight:clamp01((e-T_INS)/INS),
    project:clamp01((e-T_PRJ)/PRJ), walk:clamp01((e-T_WLK)/WLK), resolve:clamp01((e-T_RES)/RES),
    out: e>T_OUT?clamp01((e-T_OUT)/OUT):0 }; }
  var playMode=false, playStart=0, curStrat=0, curSig=null, nextPlayAt=2400, rainBoost=0, rainTint=0;
  // The influencing inputs the desk WATCHES for a play: the underlying it trades (real big-tech names,
  // weighted to the ones Eric actually runs), a fear/greed read (VIX), and the option premium (IV rate).
  var TRADES=["CRWV","CRWV","NVDA","NVDA","AMD","MSFT","GOOG","TSLA","AVGO","META"];
  var playTicker="NVDA", playVix=18, playIV=45;   // set per playcall in startPlay
  // Camera + time: cam (0 ambient → 1 framed), zoom eased; rate = eased time multiplier (slow-mo).
  var zoom=1, cam=0, rate=1, stepAcc=0, signalPrice=100, targetPrice=100, volScale=10, fcastProj=0;
  // Screen anchor for "now" (leading price) + price→pixel scale, exported by drawMarket so the
  // forecast draws the future in the same frame as the live trend.
  var nowSX=0, nowSY=0, nowPrice=100, pxPerPrice=1;
  // Where the on-chart play-name stack ENDS — the signal read + recap dock directly beneath the name
  // (set each frame while the title draws), so the play's identity + read read as one column.
  var sigStackX=0, sigStackY=0;
  var scBaseY=0, scMid=100, scSpan=1, scAmp=1;   // exported ambient Y-mapping (set in drawMarket)
  // User-called plays (the Playbook): requestedPlay queues a specific play; SUMMON steers the trend
  // to that play's setup before the enhance-zoom fires; manualPlay slows the pace + enables hold.
  var requestedPlay=null, manualPlay=false, paceScale=1, paused=false,
      summoning=false, summonEnd=0, summonIdx=0, zoomRippled=false, ripples=[];
  // Three-act playcall: on fire we FREEZE history at nowIdx (stop pushing price[]) so the trend
  // holds still; in Act 3 a separate realized[] pen draws rightward INTO the prediction, overtaking
  // the dotted forecast, then folds back into price[] on zoom-out so ambient continues from reality.
  var nowIdx=0, realized=[], realizedAlpha=1, pvR=0, stepTarget=null, exitFrac=1, events=[], playVol=1;
  // Close transition: at zoom-out the realized walk is FOLDED into price[] (time stays advanced) and the
  // camera eases the focal only from the tip's current spot to the ambient spot — a short settle — instead
  // of dragging the frozen present all the way back across the page. foldFromX = the tip's screen-x at fold.
  var folding=false, foldFromX=0;
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
  // Pointer parallax for the cityscape depth layers (near moves most, far least).
  window.addEventListener("pointermove", function(e){ cityPXt=((e.clientX/(window.innerWidth||1))-0.5)*36; });

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
    vfxPlay();   // canvas key-to-the-city unlock behind the blooming title
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
  function initScanners(){ scanners=[]; var N=3, fb=field.bottom;   // a few ambient scanners — their role is downgraded; the Eye does the detecting
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
    playTicker=(STRATS[idx].unders||TRADES)[0];   // a suitable underlying for this play (never a mismatch)
    measureField(); fieldSnap(); drawMarket(0.7);
    drawForecast(STRATS[idx], { sig:STRATS[idx].cue+" · CALLED" }, { on:1,aim:1,zoom:1,insight:1,project:1,walk:0,resolve:0,out:0 });
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
    // Candle volatility MATCHES the zoomed-out trend: derive it from the regime the cue steered into
    // (LOW VOL/RANGE stays calm, VOL EXPANDING is lively) instead of a free-floating random, so zooming
    // in never contradicts the ambient tape you just saw. Small jitter keeps two same-cue plays distinct.
    armForecast(curStrat); playVol=Math.max(0.45, regimeVol*(0.9+Math.random()*0.25)); scheduleEvents();
    // Snapshot the watched inputs for this playcall from the play's OWN profile, so the read is
    // accurate: pick an underlying that suits the strategy, and derive the fear/greed (VIX) + premium
    // (IV) from the play's cue — sellers fire into rich premium, vol plays fire when fear is spiking.
    var _u=STRATS[curStrat].unders||TRADES, _c=STRATS[curStrat].cue;
    playTicker=_u[(Math.random()*_u.length)|0];
    var _seller=(_c==="RANGE-BOUND"||_c==="PINNED"), _volp=(_c==="VOL EXPANDING"||_c==="BREAKOUT RISK");
    playIV=Math.round(_seller?(50+Math.random()*14):(_volp?(44+Math.random()*16):(32+Math.random()*14)));
    playVix=Math.round(_volp?(22+Math.random()*12):(_seller?(14+Math.random()*7):(16+Math.random()*8)));
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
        fcastProj=Math.max(clamp01(p.project), p.out);           // ambient cone hands off to the forecast bands
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
        // At zoom-out: FOLD the realized walk into price[] once, so the present continues from where reality
        // ended (time already pushed forward) and the camera only settles the short last step to ambient —
        // instead of dragging the frozen present all the way back. Captures the tip's current screen-x first.
        if(p.out>0 && !folding && realized.length){
          foldFromX = nowSX + realized.length*(W/(SPAN-1))*zoom;
          // Fold THROUGH pushPrice, never by direct concat: pushPrice rolls the derived series (EMAs,
          // Bollinger, RSI) and caps everything to SPAN. A raw concat left price[] longer than the
          // indicator arrays, so the NEXT play read bU[last]=undefined -> NaN geometry -> an invisible
          // forecast ("only one play ever shows"). Same-length series is a hard invariant.
          var fr; for(fr=0; fr<realized.length; fr++) pushPrice(realized[fr]);
          realized=[]; realizedAlpha=1; nowIdx=price.length-1; folding=true; }
        if(e>=T_END){ playMode=false; manualPlay=false; paceScale=1; nextPlayAt=now+3400+Math.random()*2600;
          realized=[]; realizedAlpha=1; p=null; camT=0; rateT=1; rainBoost=0; rainTint=0; highlightPlay(-1); } }
      else { rainBoost=0; rainTint=0; fcastProj=0; }
      cam += (camT-cam)*0.09; rate += (rateT-rate)*0.09;
      // The fold anchor must OUTLIVE the play: clearing it at T_END while cam is still easing down
      // flipped the focal target back to the play anchor (W*0.20), yanking the present leftward
      // before it eased home. Keep folding until the camera has actually settled at ambient.
      if(folding && !playMode && cam<0.02) folding=false;
      eyeWake*=0.94;   // the Eye relaxes toward its half-lidded rest; drawGravityBeam re-blazes it on a pull
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
      if(p){ drawHandoff(p); drawGravityBeam(p); drawForecast(STRATS[curStrat], curSig, p); drawInsight(STRATS[curStrat], p); pbGlyphT++; }
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
