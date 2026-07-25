import { randomBytes } from "node:crypto";
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
  #rain{ position:fixed; inset:0; width:100%; height:100%; z-index:0; pointer-events:none; opacity:.55; }
  #stage{ position:fixed; inset:0; width:100%; height:100%; z-index:1; pointer-events:none; }
  /* Faint CRT scanlines across the whole stage */
  .scanlines{ position:fixed; inset:0; z-index:2; pointer-events:none; mix-blend-mode:overlay; opacity:.5;
    background:repeating-linear-gradient(0deg, color-mix(in srgb,var(--accent) 9%,transparent) 0 1px, transparent 1px 3px); }
  /* Slow specular scan sweep */
  .scanbeam{ position:fixed; inset:0; z-index:2; pointer-events:none;
    background:linear-gradient(180deg, transparent 0%, color-mix(in srgb,var(--accent) 8%,transparent) 50%, transparent 100%);
    height:38%; animation:beam 7s linear infinite; }
  .vignette{ position:fixed; inset:0; z-index:3; pointer-events:none;
    background:radial-gradient(120% 90% at 50% 40%, transparent 45%, color-mix(in srgb,var(--bg) 82%,transparent) 100%); }

  @keyframes beam{ 0%{ transform:translateY(-40%); opacity:0; } 12%{ opacity:1; } 88%{ opacity:1; } 100%{ transform:translateY(240%); opacity:0; } }

  /* Top-center brand — primary real estate; the animation owns the rest of the screen */
  .topbrand{ position:fixed; z-index:6; top:clamp(20px,5vh,52px); left:0; right:0; text-align:center; pointer-events:none; }
  .topbrand .mark{ font-size:clamp(26px,5vw,42px); font-weight:700; letter-spacing:.16em; margin:0; }
  .topbrand .mark b{ color:var(--accent); text-shadow:0 0 20px color-mix(in srgb,var(--accent) 65%,transparent); }
  .topbrand .sub{ display:block; margin-top:10px; font-size:clamp(10px,1.4vw,12px); letter-spacing:.42em;
    text-transform:uppercase; color:var(--muted); }

  /* Cursor VFX — a light source that follows the pointer, tinting the stage (fine pointers only) */
  .cursorglow{ position:fixed; inset:0; z-index:2; pointer-events:none; opacity:0; transition:opacity .5s ease;
    background:radial-gradient(180px 180px at var(--cx,50%) var(--cy,40%),
      color-mix(in srgb,var(--accent) 16%,transparent), transparent 70%); mix-blend-mode:screen; }
  body.finepointer .cursorglow{ opacity:1; }

  /* Chromatic-aberration wordmark — split direction is driven by the cursor (--cax/--cay) */
  .mark[data-text]{ position:relative; }
  .mark[data-text]::before, .mark[data-text]::after{ content:attr(data-text); position:absolute; left:0; top:0;
    width:100%; opacity:.5; pointer-events:none; mix-blend-mode:screen; letter-spacing:inherit; }
  .mark[data-text]::before{ color:#FF4D9D; transform:translate(calc(var(--cax,-1px)*-1), calc(var(--cay,0px)*-1)); }
  .mark[data-text]::after{ color:#35D0BA; transform:translate(var(--cax,1px), var(--cay,0px)); }

  /* Enter beacon — the obvious affordance to reveal the sign-in card */
  .beacon{ position:fixed; z-index:6; left:50%; bottom:clamp(26px,7vh,64px); transform:translateX(-50%);
    display:flex; flex-direction:column; align-items:center; gap:12px; cursor:pointer;
    background:none; border:0; color:var(--text); font-family:var(--sans);
    transition:opacity .5s ease, transform .5s ease; }
  .beacon-label{ font-size:13px; letter-spacing:.18em; text-transform:uppercase; color:var(--muted);
    transition:color .2s ease; }
  .beacon:hover .beacon-label{ color:var(--text); }
  .beacon-ring{ position:absolute; top:-6px; left:50%; transform:translateX(-50%); width:54px; height:54px;
    border-radius:50%; border:1px solid color-mix(in srgb,var(--accent) 55%,transparent);
    box-shadow:0 0 24px -4px color-mix(in srgb,var(--accent) 70%,transparent); animation:beacon 2.4s ease-out infinite; }
  .beacon-chev{ width:14px; height:14px; border-right:2px solid var(--accent); border-bottom:2px solid var(--accent);
    transform:rotate(45deg); animation:chev 1.8s ease-in-out infinite; }
  @keyframes beacon{ 0%{ box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 45%,transparent); }
    70%{ box-shadow:0 0 0 16px transparent; } 100%{ box-shadow:0 0 0 0 transparent; } }
  @keyframes chev{ 0%,100%{ transform:rotate(45deg) translate(0,0); opacity:.6; }
    50%{ transform:rotate(45deg) translate(3px,3px); opacity:1; } }
  body.revealed .beacon{ opacity:0; pointer-events:none; transform:translate(-50%,20px); }

  /* Reveal wrapper — the card rises into view when the beacon is triggered */
  .authwrap{ position:fixed; z-index:5; left:0; right:0; bottom:0; display:flex; justify-content:center;
    padding:0 20px clamp(28px,8vh,80px); perspective:1200px;
    opacity:0; transform:translateY(40px); pointer-events:none;
    transition:opacity .6s cubic-bezier(.16,.84,.44,1), transform .6s cubic-bezier(.16,.84,.44,1); }
  body.revealed .authwrap{ opacity:1; transform:none; pointer-events:auto; }
  .authwrap .card{ width:100%; max-width:392px; transform-style:preserve-3d; }

  .card-close{ position:absolute; top:10px; right:12px; z-index:4; width:26px; height:26px; border-radius:8px;
    border:1px solid var(--border); background:var(--surface-2); color:var(--muted); cursor:pointer;
    font-size:14px; line-height:1; transition:color .2s ease, border-color .2s ease; }
  .card-close:hover{ color:var(--text); border-color:color-mix(in srgb,var(--accent) 50%,var(--border)); }
  .card-close:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }

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
  body.playing .projector .cone{ opacity:.34; }
  body.playing .projector .emitter{ opacity:1; width:70%; }

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
  .topbrand{ opacity:0; animation:rise .9s ease .35s both; }
  .beacon{ opacity:0; animation:rise .8s ease 1.1s both; }
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
<div class="scanlines" aria-hidden="true"></div>
<div class="scanbeam" aria-hidden="true"></div>
<div class="vignette" aria-hidden="true"></div>
<div class="cursorglow" id="cursorGlow" aria-hidden="true"></div>

<header class="topbrand" id="topbrand">
  <h1 class="mark" data-text="SKYNET·CAPITAL">SKYNET<b>·</b>CAPITAL</h1>
  <span class="sub">Options Sandbox</span>
</header>

<button type="button" class="beacon" id="beacon">
  <span class="beacon-ring" aria-hidden="true"></span>
  <span class="beacon-label">Enter the sandbox</span>
  <span class="beacon-chev" aria-hidden="true"></span>
</button>

<div class="authwrap" id="authwrap">
  <main class="card" id="card">
    <div class="projector" aria-hidden="true"><span class="cone"></span><span class="emitter"></span></div>
    <span class="corner tl" aria-hidden="true"></span><span class="corner tr" aria-hidden="true"></span>
    <span class="corner bl" aria-hidden="true"></span><span class="corner br" aria-hidden="true"></span>
    <button type="button" class="card-close" id="cardClose" aria-label="Back to the board">&#8595;</button>
    <div class="brand">
      <span class="mark" data-text="SKYNET·CAPITAL">SKYNET<b>·</b>CAPITAL</span>
      <span class="sub">Sign in to the sandbox</span>
    </div>
    <span class="tag"><span class="live"></span>PAPER · LEARN · EXPERIMENT</span>
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
  var beaconEl=document.getElementById("beacon"), cardEl=document.getElementById("card"),
      closeEl=document.getElementById("cardClose");
  // The "field" = the band the market + playbook render into. When idle it fills most of the
  // screen (centered); when the card is revealed it shrinks to sit ABOVE the card (no overlap).
  var field={ top:0, bottom:0 };
  function measureField(){
    var bottom;
    if(revealed && cardEl){ bottom = cardEl.getBoundingClientRect().top - 18; }
    else if(beaconEl){ bottom = beaconEl.getBoundingClientRect().top - 24; }
    else { bottom = H*0.82; }
    if(!(bottom>0)) bottom = H*0.72;
    bottom = Math.max(150, Math.min(bottom, H-20));
    var top = Math.max(H*0.16, bottom - Math.min(H*0.6, 430));
    field.top=top; field.bottom=bottom;
  }
  function fieldMid(){ return (field.top+field.bottom)/2; }
  function fieldAmp(){ return (field.bottom-field.top)/2; }
  function resize(){
    DPR = Math.min(window.devicePixelRatio||1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(W*DPR));
    canvas.height = Math.max(1, Math.floor(H*DPR));
    ctx.setTransform(DPR,0,0,DPR,0,0);
    measureField();
  }

  // ===== Market engine: a live underlying with real technical overlays =====
  // Signals come from indicators that actually make sense — EMA cross, Bollinger squeeze/expansion,
  // and RSI overbought/oversold — which then summon the matching options play from the playbook.
  var SPAN=200, price=[], emaF=[], emaS=[], smaA=[], bU=[], bL=[], rsiV=50, t=0;
  var pv=0, regimeBias=0.02, regimeVol=1, regimeT=0;
  function noise(s){ var x=Math.sin(s)*43758.5453; return x-Math.floor(x); }
  function cap(a){ if(a.length>SPAN) a.shift(); }
  function avg(a){ var m=0,i; for(i=0;i<a.length;i++) m+=a[i]; return m/a.length; }
  function sd(a,m){ var v=0,i; for(i=0;i<a.length;i++){ var d=a[i]-m; v+=d*d; } return Math.sqrt(v/a.length); }
  function rsi(a,n){ if(a.length<n+1) return 50; var g=0,l=0,i;
    for(i=a.length-n;i<a.length;i++){ var d=a[i]-a[i-1]; if(d>=0) g+=d; else l-=d; }
    if(l<=0) return 100; var rs=(g/n)/(l/n); return 100-100/(1+rs); }
  function stepMarket(){ t++;
    if(t>regimeT){ regimeT=t+120+Math.floor(Math.random()*160);
      regimeBias=(Math.random()-0.45)*0.14; regimeVol=0.5+Math.random()*1.4; }
    pv = pv*0.88 + (noise(t*0.017)-0.5)*0.8*regimeVol + regimeBias;
    var last = price.length?price[price.length-1]:100;
    var np = Math.max(5, last+pv); price.push(np); cap(price);
    var kf=2/10, ks=2/22;
    var pf=emaF.length?emaF[emaF.length-1]:np, ps=emaS.length?emaS[emaS.length-1]:np;
    emaF.push(pf+kf*(np-pf)); cap(emaF); emaS.push(ps+ks*(np-ps)); cap(emaS);
    var win=price.slice(Math.max(0,price.length-20)), m=avg(win), s=sd(win,m);
    smaA.push(m); cap(smaA); bU.push(m+2*s); cap(bU); bL.push(m-2*s); cap(bL);
    rsiV = rsi(price,14);
  }
  for(var _i=0;_i<SPAN;_i++) stepMarket();

  function valRange(){ var lo=1e9,hi=-1e9,i;
    for(i=0;i<price.length;i++){ if(price[i]<lo)lo=price[i]; if(price[i]>hi)hi=price[i]; }
    for(i=0;i<bU.length;i++){ if(bU[i]>hi)hi=bU[i]; }
    for(i=0;i<bL.length;i++){ if(bL[i]<lo)lo=bL[i]; }
    var pad=(hi-lo)*0.12||1; return { lo:lo-pad, hi:hi+pad, mid:(lo+hi)/2, span:(hi-lo)+2*pad }; }
  function strokeSeries(arr,dx,Y,style,w){ ctx.beginPath();
    for(var i=0;i<arr.length;i++){ var px=i*dx,py=Y(arr[i]); i?ctx.lineTo(px,py):ctx.moveTo(px,py); }
    ctx.strokeStyle=style; ctx.lineWidth=w; ctx.lineJoin="round"; ctx.stroke(); }
  function drawGrid(){
    var grid="color-mix(in srgb, "+(css("--border")||"#223041")+" 55%, transparent)";
    ctx.strokeStyle=grid; ctx.lineWidth=1; ctx.globalAlpha=0.4; var gx=64;
    for(var x=(t*0.4)%gx;x<W;x+=gx){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
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
    // Bollinger envelope
    ctx.beginPath();
    for(var i=0;i<bU.length;i++){ var px=i*dx,py=Y(bU[i]); i?ctx.lineTo(px,py):ctx.moveTo(px,py); }
    for(i=bL.length-1;i>=0;i--){ ctx.lineTo(i*dx,Y(bL[i])); }
    ctx.closePath(); ctx.fillStyle=hexA(accent,0.06); ctx.fill();
    strokeSeries(bU,dx,Y,hexA(accent,0.20),1);
    strokeSeries(bL,dx,Y,hexA(accent,0.20),1);
    strokeSeries(emaS,dx,Y,hexA(muted,0.75),1.4);
    strokeSeries(emaF,dx,Y,hexA(accent,0.9),1.6);
    // price line
    ctx.beginPath();
    for(i=0;i<n;i++){ var qx=i*dx,qy=Y(price[i]); i?ctx.lineTo(qx,qy):ctx.moveTo(qx,qy); }
    ctx.strokeStyle=txt; ctx.lineWidth=1.8; ctx.lineJoin="round";
    ctx.shadowColor=accent; ctx.shadowBlur=10; ctx.stroke(); ctx.shadowBlur=0;
    var lx=(n-1)*dx, ly=Y(price[n-1]);
    ctx.beginPath(); ctx.arc(lx,ly,3,0,7); ctx.fillStyle=txt; ctx.shadowColor=accent; ctx.shadowBlur=12; ctx.fill(); ctx.shadowBlur=0;
    // RSI readout — synthesizes overbought/oversold at a glance
    var rc = rsiV<32?pos:(rsiV>68?neg:muted);
    ctx.font="11px "+(css("--mono")||"monospace"); ctx.textAlign="left"; ctx.fillStyle=hexA(rc,0.92);
    ctx.fillText("RSI "+rsiV.toFixed(0)+(rsiV<32?" OVERSOLD":rsiV>68?" OVERBOUGHT":""), 16, field.top-6);
    ctx.textAlign="start"; ctx.restore();
  }
  // Convert a css color to rgba with alpha via an offscreen paint.
  var _c = document.createElement("canvas").getContext("2d");
  function hexA(color, a){ try{ _c.fillStyle=color; var s=_c.fillStyle;
    if(s[0]==="#"){ var r=parseInt(s.substr(1,2),16),g=parseInt(s.substr(3,2),16),b=parseInt(s.substr(5,2),16);
      return "rgba("+r+","+g+","+b+","+a+")"; } return s; }catch(e){ return color; } }

  // Signal → play mapping. Reads the latest indicators and returns the matching playbook entry
  // with a human-readable reason (the "why"), or null when nothing is set up.
  function detectSignal(){
    var n=price.length; if(n<25) return null;
    var p=price[n-1], f=emaF[n-1], s=emaS[n-1], fu=emaF[n-2], su=emaS[n-2],
        bu=bU[n-1], bl=bL[n-1], m=smaA[n-1];
    var width=(bu-bl)/(Math.abs(m)+1);
    if(rsiV<32 && p<=bl*1.004) return { i:4, sig:"RSI OVERSOLD · LOWER BAND" };
    if(rsiV>68 && p>=bu*0.996) return { i:0, sig:"RSI OVERBOUGHT · SELL PREMIUM" };
    if(fu<=su && f>s) return { i:4, sig:"EMA GOLDEN CROSS" };
    if(fu>=su && f<s) return { i:3, sig:"EMA CROSS DOWN" };
    if(width<0.02) return { i:2, sig:"BOLLINGER SQUEEZE · LOW VOL" };
    if(width>0.075) return { i:1, sig:"BOLLINGER EXPANSION" };
    return null;
  }
  function forceSignal(){ var pool=[
      { i:0, sig:"MEAN REVERSION SETUP" }, { i:1, sig:"VOLATILITY BID" },
      { i:3, sig:"PRICE PINNED AT MEAN" }, { i:5, sig:"MOMENTUM BREAKOUT" }];
    return pool[(Math.random()*pool.length)|0]; }

  // --- Ambient Matrix rain (deepest layer, faint) ---
  var rcanvas=document.getElementById("rain"), rctx=null, cols=[], colW=16, RG="0123456789$+-.%△▽ｦｱｲｳｴｵｶｷｸｹﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘ";
  try{ rctx = rcanvas && rcanvas.getContext ? rcanvas.getContext("2d") : null; }catch(e){ rctx=null; }
  function rainResize(){
    if(!rctx) return;
    rcanvas.width=Math.max(1,Math.floor(rcanvas.clientWidth*DPR));
    rcanvas.height=Math.max(1,Math.floor(rcanvas.clientHeight*DPR));
    rctx.setTransform(DPR,0,0,DPR,0,0);
    var n=Math.ceil(rcanvas.clientWidth/colW);
    cols=[]; for(var i=0;i<n;i++){ cols.push(Math.random()*-rcanvas.clientHeight); }
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
  }

  // --- Strategy Playbook: the race periodically recedes and a holographic option-payoff
  // diagram assembles center-stage, fully annotated, with Matrix glyphs lighting the strikes.
  // These are illustrative teaching diagrams (labeled STRATEGY PLAYBOOK), never live P/L.
  // pts: normalized payoff [ [x 0..1, y -1..1], ... ]; strikes: x positions of the legs.
  var STRATS=[
    { name:"IRON CONDOR", cue:"LOW VOL", desc:"Bet the market stays calm — keep the credit while price holds between the middle strikes.",
      pts:[[0,-1],[0.2,-1],[0.34,1],[0.66,1],[0.8,-1],[1,-1]], strikes:[0.2,0.34,0.66,0.8] },
    { name:"LONG STRANGLE", cue:"VOL EXPANDING", desc:"Bet on a big move either way — buy a call and a put, profit on a breakout.",
      pts:[[0,1],[0.3,-1],[0.7,-1],[1,1]], strikes:[0.3,0.7] },
    { name:"SHORT STRADDLE", cue:"RANGE-BOUND", desc:"Bet on calm — sell the call and put at one strike; best if price pins it.",
      pts:[[0,-1],[0.5,1],[1,-1]], strikes:[0.5] },
    { name:"BUTTERFLY", cue:"PINNED", desc:"Pin the target — max profit if price lands on the center strike, tiny risk on the wings.",
      pts:[[0,-0.5],[0.35,-0.5],[0.5,1],[0.65,-0.5],[1,-0.5]], strikes:[0.35,0.5,0.65] },
    { name:"BULL CALL SPREAD", cue:"UPTREND", desc:"Lean bullish with a cap — buy a call, sell a higher one to cut the cost.",
      pts:[[0,-1],[0.35,-1],[0.65,1],[1,1]], strikes:[0.35,0.65] },
    { name:"CALL LADDER", cue:"BREAKOUT RISK", desc:"Roll up the strikes — limited risk with room to run if the market takes off.",
      pts:[[0,0.35],[0.4,0.35],[0.55,-1],[0.75,-1],[1,1]], strikes:[0.4,0.55,0.75] }
  ];
  var pbGlyphT=0;
  function payoffAt(pts,u){ if(u<=pts[0][0]) return pts[0][1];
    for(var i=1;i<pts.length;i++){ if(u<=pts[i][0]){ var a=pts[i-1],b=pts[i];
      var tt=(u-a[0])/((b[0]-a[0])||1); return a[1]+(b[1]-a[1])*tt; } }
    return pts[pts.length-1][1]; }
  function extrema(strat){ var pts=strat.pts,maxY=-9,minY=9,i,xs=[],xl=[],be=[];
    for(i=0;i<pts.length;i++){ if(pts[i][1]>maxY)maxY=pts[i][1]; if(pts[i][1]<minY)minY=pts[i][1]; }
    for(i=0;i<pts.length;i++){ if(pts[i][1]===maxY)xs.push(pts[i][0]); if(pts[i][1]===minY)xl.push(pts[i][0]); }
    for(i=1;i<pts.length;i++){ var a=pts[i-1],b=pts[i]; if((a[1]<0)!==(b[1]<0)){ var tt=(0-a[1])/((b[1]-a[1])||1); be.push(a[0]+tt*(b[0]-a[0])); } }
    return { maxY:maxY, minY:minY, mxX:xs.length?(xs[0]+xs[xs.length-1])/2:0.5,
      mnX:xl.length?(xl[0]+xl[xl.length-1])/2:0.5, be:be }; }
  function wrapText(s,cx,y,maxW,lh){ var words=s.split(" "),line="",yy=y,i;
    for(i=0;i<words.length;i++){ var test=line?line+" "+words[i]:words[i];
      if(ctx.measureText(test).width>maxW && line){ ctx.fillText(line,cx,yy); line=words[i]; yy+=lh; } else line=test; }
    ctx.fillText(line,cx,yy); }
  function drawLabels(strat, sig, a){
    var cx=W/2, top=field.top, accent=css("--accent")||"#35D0BA", muted=css("--muted")||"#8B9AAB",
        txt=css("--text")||"#E6EDF3", mono=css("--mono")||"monospace", sans=css("--sans")||"sans-serif";
    ctx.save(); ctx.globalAlpha=a; ctx.textAlign="center";
    ctx.font="700 11px "+mono; ctx.fillStyle=hexA(accent,0.95);
    ctx.fillText("▸ SIGNAL · "+sig, cx, top+16);
    ctx.font="700 20px "+sans; ctx.fillStyle=txt; ctx.shadowColor=accent; ctx.shadowBlur=12;
    ctx.fillText(strat.name, cx, top+42); ctx.shadowBlur=0;
    ctx.font="12px "+sans; ctx.fillStyle=hexA(muted,0.95);
    wrapText(strat.desc, cx, top+62, W*0.6, 15);
    ctx.textAlign="start"; ctx.restore(); }
  function pivot(x,y,label,color,off){ ctx.fillStyle=hexA(color,0.95);
    ctx.beginPath(); ctx.arc(x,y,2.5,0,7); ctx.fill(); ctx.fillText(label,x,y+off); }

  // Full lifecycle telestrator: signal → strikes → curve → zones → pivot labels → entry markers
  // → underlying moves → take-profit close. p carries each phase's 0..1 progress.
  function drawPlaybook(strat, p, sig){
    if(!strat) return;
    var padX=W*0.07, x0=padX, x1=W-padX, midY=fieldMid()+24, amp=fieldAmp()*0.62,
        yTop=field.top+78, yBot=field.bottom-4, A=(1-p.out);
    function X(u){ return x0+u*(x1-x0); } function Y(v){ return midY - v*amp; }
    var accent=css("--accent")||"#35D0BA", pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149",
        muted=css("--muted")||"#8B9AAB", txt=css("--text")||"#E6EDF3", mono=css("--mono")||"monospace";
    ctx.save(); ctx.globalAlpha=A;
    if(p.zones>0){ var N=140, seg=(x1-x0)/N;
      for(var i=0;i<N;i++){ var u=i/(N-1); if(u>p.curve) break; var v=payoffAt(strat.pts,u), px=X(u), py=Y(v), zy=Y(0);
        ctx.fillStyle=hexA(v>=0?pos:neg, 0.15*p.zones); ctx.fillRect(px, Math.min(py,zy), seg+1, Math.abs(py-zy)); } }
    ctx.textAlign="center"; ctx.font="12px "+mono; var shown=p.strikes*strat.strikes.length;
    for(var k=0;k<strat.strikes.length;k++){ var rev=clamp01(shown-k); if(rev<=0) break; var sx=X(strat.strikes[k]);
      ctx.setLineDash([3,6]); ctx.lineWidth=1; ctx.strokeStyle=hexA(accent,0.3*rev);
      ctx.beginPath(); ctx.moveTo(sx,yTop); ctx.lineTo(sx,yBot); ctx.stroke(); ctx.setLineDash([]);
      var gy=yTop+((pbGlyphT*4+strat.strikes[k]*260)%((yBot-yTop)+40));
      ctx.fillStyle=hexA(accent,0.85*rev); ctx.fillText(RG[(Math.random()*RG.length)|0],sx,gy);
      ctx.fillStyle=hexA(accent,0.3*rev); ctx.fillText(RG[(Math.random()*RG.length)|0],sx,gy-16); }
    if(p.strikes>0){ ctx.setLineDash([5,6]); ctx.lineWidth=1; ctx.strokeStyle=hexA(muted,0.5*p.strikes);
      ctx.beginPath(); ctx.moveTo(x0,Y(0)); ctx.lineTo(x1,Y(0)); ctx.stroke(); ctx.setLineDash([]); }
    if(p.curve>0){ var f=p.curve, pts=strat.pts, started=false;
      ctx.beginPath();
      for(i=0;i<pts.length;i++){ if(pts[i][0]<=f){ var cx2=X(pts[i][0]), cy2=Y(pts[i][1]); started?ctx.lineTo(cx2,cy2):ctx.moveTo(cx2,cy2); started=true; }
        else { var ex=X(f), ey=Y(payoffAt(pts,f)); if(started) ctx.lineTo(ex,ey); else ctx.moveTo(ex,ey); started=true; break; } }
      ctx.strokeStyle=accent; ctx.lineWidth=2.4; ctx.lineJoin="round"; ctx.shadowColor=accent; ctx.shadowBlur=18; ctx.stroke(); ctx.shadowBlur=0;
      if(f<1){ var tx=X(f), ty=Y(payoffAt(pts,f)); ctx.beginPath(); ctx.arc(tx,ty,4,0,7); ctx.fillStyle="#EAFBF7"; ctx.shadowColor=accent; ctx.shadowBlur=16; ctx.fill(); ctx.shadowBlur=0; } }
    if(p.label>0){ var e1=extrema(strat); ctx.globalAlpha=A*p.label; ctx.textAlign="center"; ctx.font="700 10px "+mono;
      pivot(X(e1.mxX),Y(e1.maxY),"MAX PROFIT",pos,-12);
      pivot(X(e1.mnX),Y(e1.minY),"MAX LOSS",neg,16);
      for(i=0;i<e1.be.length;i++){ pivot(X(e1.be[i]),Y(0),"B/E",muted,-10); }
      ctx.globalAlpha=A; }
    if(p.enter>0){ ctx.globalAlpha=A*p.enter; ctx.textAlign="center"; ctx.font="700 9px "+mono;
      for(k=0;k<strat.strikes.length;k++){ var mkx=X(strat.strikes[k]);
        ctx.fillStyle=hexA(accent,0.95); ctx.fillText("▲", mkx, Y(0)+15);
        ctx.fillStyle=hexA(txt,0.8); ctx.fillText("ENTER", mkx, Y(0)+27); }
      ctx.globalAlpha=A; }
    if(p.move>0){ var e2=extrema(strat), sxp=lerp(0.5, e2.mxX, easeIO(p.move)), pl=payoffAt(strat.pts,sxp),
        mvx=X(sxp), mvy=Y(pl);
      ctx.setLineDash([2,5]); ctx.strokeStyle=hexA(txt,0.5); ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(mvx,yTop); ctx.lineTo(mvx,yBot); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(mvx,mvy,4.5,0,7); ctx.fillStyle=pl>=0?pos:neg; ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=14; ctx.fill(); ctx.shadowBlur=0;
      ctx.textAlign="center"; ctx.font="700 10px "+mono; ctx.fillStyle=hexA(txt,0.85); ctx.fillText("UNDERLYING", mvx, yTop-4);
      var dollars=Math.round(pl*1240); ctx.font="700 13px "+mono; ctx.fillStyle=pl>=0?pos:neg;
      ctx.fillText((dollars>=0?"+$":"-$")+Math.abs(dollars), mvx, mvy-12); }
    if(p.exit>0){ var e3=extrema(strat), fxp=X(e3.mxX), fyp=Y(e3.maxY), prof=Math.round(e3.maxY*1240);
      ctx.globalAlpha=A*p.exit; ctx.textAlign="center"; ctx.font="700 15px "+mono; ctx.fillStyle=pos;
      ctx.shadowColor=pos; ctx.shadowBlur=16; ctx.fillText("CLOSED +$"+prof, fxp, fyp-20); ctx.shadowBlur=0; ctx.globalAlpha=A; }
    ctx.textAlign="start"; ctx.restore();
    drawLabels(strat, sig?sig.sig:"", A*Math.min(1,p.on));
  }
  // Play timeline (ms): each phase chains into the next — the full trade lifecycle.
  var PWR=450,STK=550,CRV=1200,ZON=400,LBL=450,ENT=450,MOV=1600,EXT=550,OUT=650;
  var T_STK=PWR,T_CRV=T_STK+STK,T_ZON=T_CRV+CRV,T_LBL=T_ZON+ZON,T_ENT=T_LBL+LBL,
      T_MOV=T_ENT+ENT,T_EXT=T_MOV+MOV,T_OUT=T_EXT+EXT,T_END=T_OUT+OUT;
  function playProg(e){ return {
    on:clamp01(e/PWR), strikes:clamp01((e-T_STK)/STK), curve:clamp01((e-T_CRV)/CRV),
    zones:clamp01((e-T_ZON)/ZON), label:clamp01((e-T_LBL)/LBL), enter:clamp01((e-T_ENT)/ENT),
    move:clamp01((e-T_MOV)/MOV), exit:clamp01((e-T_EXT)/EXT), out: e>T_OUT?clamp01((e-T_OUT)/OUT):0 }; }
  var playMode=false, playStart=0, curStrat=0, curSig=null, nextPlayAt=2400, rainBoost=0, rainTint=0;

  resize(); rainResize();
  window.addEventListener("resize", function(){ resize(); rainResize(); });

  // Reveal: the beacon opens the sign-in card; close button / Esc returns to the animation.
  function setReveal(on){ revealed=on; document.body.classList.toggle("revealed", on); measureField();
    if(on && cardEl){ var b=cardEl.querySelector(".btn"); if(b) setTimeout(function(){ try{ b.focus(); }catch(e){} }, 640); }
    else if(!on && beaconEl){ try{ beaconEl.focus(); }catch(e){} } }
  if(beaconEl) beaconEl.addEventListener("click", function(){ setReveal(true); });
  if(closeEl) closeEl.addEventListener("click", function(){ setReveal(false); });
  document.addEventListener("keydown", function(e){ if(e.key==="Escape" && revealed) setReveal(false); });
  if(document.querySelector(".error")) setReveal(true);   // never hide an error behind the beacon

  // Cursor VFX: a light source + chromatic split that track the pointer; the card tilts in 3D.
  var fine = window.matchMedia && window.matchMedia("(pointer:fine)").matches, root=document.documentElement;
  if(fine && !reduce){ document.body.classList.add("finepointer");
    window.addEventListener("pointermove", function(e){
      root.style.setProperty("--cx", e.clientX+"px"); root.style.setProperty("--cy", e.clientY+"px");
      var dx=(e.clientX/window.innerWidth)-0.5, dy=(e.clientY/window.innerHeight)-0.5;
      root.style.setProperty("--cax",(1+dx*3).toFixed(2)+"px"); root.style.setProperty("--cay",(dy*2).toFixed(2)+"px");
      if(cardEl){ cardEl.style.transform="rotateX("+(-dy*6).toFixed(2)+"deg) rotateY("+(dx*8).toFixed(2)+"deg)";
        cardEl.style.setProperty("--sheen",(115+dx*70).toFixed(0)+"deg"); }
    }); }

  if(reduce){ measureField(); drawMarket(0.2);
    drawPlaybook(STRATS[0], { on:1,strikes:1,curve:1,zones:1,label:1,enter:1,move:1,exit:0,out:0 },
      { sig:"BOLLINGER SQUEEZE · LOW VOL" });
    document.body.classList.add("playing");
    if(rctx){ rctx.fillStyle="rgba(11,15,20,1)"; rctx.fillRect(0,0,rcanvas.clientWidth,rcanvas.clientHeight);
      for(var s=0;s<26;s++) rainDraw(0,0); }
    return; }

  var last=0, running=true;
  document.addEventListener("visibilitychange", function(){ running=!document.hidden; if(running) requestAnimationFrame(loop); });
  function loop(now){
    if(!running) return;
    if(now-last > 50){ last=now; measureField(); stepMarket();
      if(!playMode && now>=nextPlayAt){ var sig=detectSignal(); if(!sig && now>=nextPlayAt+5000) sig=forceSignal();
        if(sig){ playMode=true; playStart=now; curSig=sig; curStrat=sig.i; } }
      var p=null, recede=0;
      if(playMode){ var e=now-playStart; p=playProg(e); recede=Math.min(p.on,1)*(1-p.out);
        rainBoost=(p.enter>0 && p.exit<1)?1:0; rainTint=(p.exit>0 && p.out<1)?1:0;
        if(e>=T_END){ playMode=false; nextPlayAt=now+3000+Math.random()*2400; p=null; recede=0; rainBoost=0; rainTint=0; } }
      document.body.classList.toggle("playing", recede>0.02);
      drawMarket(1 - recede*0.82);
      if(p){ drawPlaybook(STRATS[curStrat], p, curSig); pbGlyphT++; }
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
