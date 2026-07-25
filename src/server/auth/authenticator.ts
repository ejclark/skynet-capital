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

  /* Depth stage — parallax layers ride inside this */
  .scene{ position:relative; z-index:4; width:100%; max-width:392px; transform-style:preserve-3d; }
  @keyframes beam{ 0%{ transform:translateY(-40%); opacity:0; } 12%{ opacity:1; } 88%{ opacity:1; } 100%{ transform:translateY(240%); opacity:0; } }

  /* Caption slot above the card — cross-fades between the race legend and the Strategy Playbook */
  .stage-cap{ position:relative; height:52px; margin-bottom:16px; transform:translateZ(38px); }
  .stage-cap > *{ position:absolute; left:0; right:0; top:0; transition:opacity .5s ease; }
  .stage-cap .playbook{ opacity:0; }
  .stage-cap.pb .legend{ opacity:0; }
  .stage-cap.pb .playbook{ opacity:1; }

  .legend{
    display:flex; justify-content:center; align-items:center; gap:22px; padding-top:15px;
    font-family:var(--mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase;
  }
  .legend span{ display:inline-flex; align-items:center; gap:7px; color:var(--muted); }
  .legend i{ width:22px; height:2px; border-radius:2px; display:inline-block; }
  .legend .lz{ box-shadow:0 0 8px 1px currentColor; }
  .legend .human i{ background:var(--pos); color:var(--pos); }
  .legend .machine i{ background:var(--accent); color:var(--accent); }
  .legend b{ color:var(--text); font-weight:600; }

  .playbook{ display:flex; flex-direction:column; align-items:center; gap:3px; font-family:var(--mono); }
  .pb-eyebrow{ font-size:9px; letter-spacing:.22em; text-transform:uppercase; color:var(--muted); }
  .pb-cyc{ color:var(--accent); }
  .pb-name{ font-size:14px; letter-spacing:.16em; font-weight:700; color:var(--accent);
    text-shadow:0 0 14px color-mix(in srgb,var(--accent) 55%,transparent); }
  .pb-desc{ font-size:10.5px; letter-spacing:.02em; color:var(--muted); font-family:var(--sans);
    max-width:32ch; text-align:center; line-height:1.35; }

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
  .scene.playing .projector .cone{ opacity:.34; }
  .scene.playing .projector .emitter{ opacity:1; width:70%; }

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
  .brand .mark{ display:block; font-weight:700; font-size:23px; letter-spacing:.16em; position:relative;
    animation:glitch 6s steps(1) 1.6s infinite; }
  /* Chromatic-aberration split on the wordmark */
  .brand .mark::before, .brand .mark::after{ content:"SKYNET·CAPITAL"; position:absolute; left:0; top:0; width:100%;
    opacity:.55; pointer-events:none; }
  .brand .mark::before{ color:#FF4D9D; transform:translateX(-1px); mix-blend-mode:screen; }
  .brand .mark::after{ color:#35D0BA; transform:translateX(1px); mix-blend-mode:screen; }
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
  @keyframes cardIn{ from{ opacity:0; transform:translateY(26px) scale(.985); } to{ opacity:1; transform:none; } }
  .card{ opacity:0; animation:cardIn .8s cubic-bezier(.16,.84,.44,1) .35s both; }
  .stage-cap{ opacity:0; animation:rise .7s ease .95s both; }
  .brand{ opacity:0; animation:rise .7s ease .5s both; }
  .tag{ opacity:0; animation:rise .7s ease .68s both; }
  .sub-copy{ opacity:0; animation:rise .7s ease .8s both; }
  .hud{ opacity:0; animation:rise .7s ease .86s both; }
  .ticker{ opacity:0; animation:rise .7s ease .92s both; transition:opacity .5s ease; }
  .ticker.dim{ opacity:.28; }   /* recede while a Strategy Playbook diagram is showing */
  .error{ opacity:0; animation:rise .6s ease .6s both; }
  .btn{ opacity:0; animation:rise .6s ease calc(1s + var(--i,0) * .12s) both; }
  .foot{ opacity:0; animation:rise .7s ease 1.3s both; }

  @media (prefers-reduced-motion:reduce){
    *{ animation:none !important; transition:none !important; }
    .card,.stage-cap,.legend,.playbook,.brand,.tag,.sub-copy,.hud,.ticker,.error,.btn,.foot{ opacity:1 !important; }
    .stage-cap.pb .legend{ opacity:0 !important; }   /* static frame shows the playbook caption */
    .ticker.dim{ opacity:.28 !important; }
    .card::before{ opacity:.9; } .card::after{ display:none; }
    .scanbeam{ display:none; }
    #rain{ opacity:.35; }
    .tag .live, .hud .on i{ animation:none; }
  }
</style>
</head>
<body>
<canvas id="rain" aria-hidden="true"></canvas>
<canvas id="stage" aria-hidden="true"></canvas>
<div class="scanlines" aria-hidden="true"></div>
<div class="scanbeam" aria-hidden="true"></div>
<div class="vignette" aria-hidden="true"></div>
<div class="scene" id="scene">
  <div class="stage-cap" id="stageCap" aria-hidden="true">
    <div class="legend">
      <span class="human"><i class="lz"></i><b>Human</b></span>
      <span class="machine"><i class="lz"></i><b>Machine</b></span>
    </div>
    <div class="playbook" id="playbook">
      <span class="pb-eyebrow">STRATEGY PLAYBOOK · <span class="pb-cyc">LEARN</span></span>
      <span class="pb-name" id="pbName">IRON CONDOR</span>
      <span class="pb-desc" id="pbDesc">Bet the market stays calm between the strikes.</span>
    </div>
  </div>
  <main class="card">
    <div class="projector" aria-hidden="true"><span class="cone"></span><span class="emitter"></span></div>
    <span class="corner tl" aria-hidden="true"></span><span class="corner tr" aria-hidden="true"></span>
    <span class="corner bl" aria-hidden="true"></span><span class="corner br" aria-hidden="true"></span>
    <div class="brand">
      <span class="mark">SKYNET<b>·</b>CAPITAL</span>
      <span class="sub">Options Sandbox</span>
    </div>
    <span class="tag"><span class="live"></span>PAPER · LEARN · EXPERIMENT</span>
    <p class="sub-copy">Learn the plays on paper. <span class="em">With friends, family &amp; a few machines.</span></p>
    <div class="hud" aria-hidden="true">
      <span class="on"><i></i>SYS ONLINE</span>
      <span class="modes">SOLO · CO-OP · LEAGUE</span>
      <span>FEED IEX</span>
    </div>
    <p class="ticker" id="ticker" aria-hidden="true">HUMANS <b id="tHuman">+0.00%</b> <span class="sep">·</span> MACHINES <span class="m" id="tMachine">+0.00%</span> <span class="sim" title="Simulated preview — real standings unlock once you're signed in">SIM</span></p>
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
  // The "projection field": the band ABOVE the card's real top edge. All living viz (race +
  // payoff diagrams) renders here so the card at the bottom never occludes the focal point.
  var cardEl=null, field={ top:0, bottom:0 };
  function measureField(){
    cardEl = cardEl || document.querySelector(".card");
    var bottom = H*0.5;
    if(cardEl){ var r=cardEl.getBoundingClientRect(); bottom = r.top - 16; }
    bottom = Math.max(80, bottom);
    var top = Math.max(16, bottom - Math.min(360, bottom - 16));
    field.top = top; field.bottom = bottom;
  }
  function fieldMid(){ return (field.top + field.bottom) / 2; }
  function fieldAmp(){ return (field.bottom - field.top) / 2; }
  function resize(){
    DPR = Math.min(window.devicePixelRatio||1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(W*DPR));
    canvas.height = Math.max(1, Math.floor(H*DPR));
    ctx.setTransform(DPR,0,0,DPR,0,0);
    measureField();
  }

  // Two seeded, gently diverging equity walks scrolling right→left. "drift" is the upward
  // bias per step; it starts as a pleasant default and is retargeted from live /pulse data.
  var human = { color:"--pos", seed:11.7, pts:[], v:0, val:0, drift:0.045 };
  var machine = { color:"--accent", seed:4.2, pts:[], v:0, val:0, drift:0.05 };
  var SPAN = 220;                // sample points across width
  var t = 0;
  function noise(s){ var x=Math.sin(s)*43758.5453; return x-Math.floor(x); }
  function step(line, k){
    line.v += (noise(line.seed + t*0.013) - 0.5) * 0.6;
    line.v *= 0.94;               // damping
    line.v += k;                  // slight upward drift (paper gains)
    line.val += line.v;
    line.pts.push(line.val);
    if(line.pts.length > SPAN) line.pts.shift();
  }
  function seedFill(){
    human.pts=[]; machine.pts=[]; human.val=0; machine.val=0; human.v=0; machine.v=0;
    for(var i=0;i<SPAN;i++){ t=i; step(human,human.drift); step(machine,machine.drift); }
  }
  seedFill();

  function draw(){
    ctx.clearRect(0,0,W,H);
    // faint grid
    var grid = "color-mix(in srgb, " + (css("--border")||"#223041") + " 55%, transparent)";
    ctx.strokeStyle = grid; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    var gx = 64;
    for(var x=(t*0.4)%gx; x<W; x+=gx){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(var y=0; y<H; y+=gx){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.globalAlpha = 1;

    var all = human.pts.concat(machine.pts);
    var lo=Math.min.apply(null,all), hi=Math.max.apply(null,all);
    var pad=(hi-lo)*0.35 || 1; lo-=pad; hi+=pad;
    var baseY = fieldMid(), amp = fieldAmp()*0.9, fbot = field.bottom;
    function project(v){ return baseY - ((v-lo)/(hi-lo) - 0.5)*(amp*2); }

    [human, machine].forEach(function(line){
      var col = css(line.color) || "#35D0BA";
      var n = line.pts.length; if(!n) return;
      var dx = W/(SPAN-1);
      // glow line
      ctx.beginPath();
      for(var i=0;i<n;i++){ var px=i*dx, py=project(line.pts[i]); i?ctx.lineTo(px,py):ctx.moveTo(px,py); }
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineJoin="round";
      ctx.shadowColor = col; ctx.shadowBlur = 16; ctx.globalAlpha = 0.9; ctx.stroke();
      ctx.shadowBlur = 0;
      // soft area fill under the curve, down to the field's baseline
      ctx.lineTo((n-1)*dx, fbot); ctx.lineTo(0, fbot); ctx.closePath();
      var grad = ctx.createLinearGradient(0, baseY-amp, 0, fbot);
      grad.addColorStop(0, hexA(col, 0.16)); grad.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = grad; ctx.globalAlpha = 1; ctx.fill();
      // leading dot
      var lx=(n-1)*dx, ly=project(line.pts[n-1]);
      ctx.beginPath(); ctx.arc(lx,ly,3.4,0,7); ctx.fillStyle=col;
      ctx.shadowColor=col; ctx.shadowBlur=14; ctx.fill(); ctx.shadowBlur=0;
    });
  }
  // Convert a css color to rgba with alpha via an offscreen paint.
  var _c = document.createElement("canvas").getContext("2d");
  function hexA(color, a){ try{ _c.fillStyle=color; var s=_c.fillStyle;
    if(s[0]==="#"){ var r=parseInt(s.substr(1,2),16),g=parseInt(s.substr(3,2),16),b=parseInt(s.substr(5,2),16);
      return "rgba("+r+","+g+","+b+","+a+")"; } return s; }catch(e){ return color; } }

  function pct(line){ var n=line.pts.length; if(n<2) return 0;
    return (line.pts[n-1]-line.pts[0]) / (Math.abs(line.pts[0])+40) * 100; }
  function fmt(p){ return (p>=0?"+":"")+p.toFixed(2)+"%"; }
  var tH=document.getElementById("tHuman"), tM=document.getElementById("tMachine");
  function updateTicker(){ if(tH) tH.textContent=fmt(pct(human)); if(tM) tM.textContent=fmt(pct(machine)); }

  // --- Live cohort standings from the public /pulse endpoint ---
  // /pulse returns { humans, bots, humanEquity, botEquity } — cohort aggregates only.
  // When at least one account is live we show real return-on-seed and bias the curves so
  // the leading cohort visibly climbs; otherwise we stay on the labeled "SIM" simulation.
  var SEED=5000000, live=false, simEl=document.querySelector(".sim");
  function roi(equity,count){ return count>0 ? (equity - count*SEED)/(count*SEED)*100 : 0; }
  function bias(r){ return Math.max(0.005, Math.min(0.075, 0.03 + r*0.004)); }
  function applyPulse(d){
    if(!d || ((d.humans|0)+(d.bots|0))===0) return;   // no field yet → keep the sim
    live=true;
    var hr=roi(d.humanEquity, d.humans|0), br=roi(d.botEquity, d.bots|0);
    if(tH) tH.textContent=fmt(hr); if(tM) tM.textContent=fmt(br);
    human.drift=bias(hr); machine.drift=bias(br);
    if(simEl && simEl.textContent!=="LIVE"){ simEl.textContent="LIVE"; simEl.classList.add("on-air");
      simEl.title="Live league standings — return on the $5M seed, humans vs. bots"; }
  }
  function poll(){ if(!window.fetch) return;
    try{ fetch("/pulse",{cache:"no-store"}).then(function(r){ return r.ok?r.json():null; })
      .then(applyPulse).catch(function(){}); }catch(e){} }
  poll(); setInterval(poll, 5000);

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
  function rainDraw(){
    if(!rctx) return;
    var w=rcanvas.clientWidth, h=rcanvas.clientHeight;
    rctx.fillStyle="rgba(11,15,20,0.16)"; rctx.fillRect(0,0,w,h);   // fade for trails
    var col=css("--accent")||"#35D0BA";
    rctx.font="13px "+((css("--mono")||"monospace"));
    for(var i=0;i<cols.length;i++){
      var x=i*colW, y=cols[i], ch=RG[(Math.random()*RG.length)|0];
      rctx.fillStyle=hexA(col,0.85); rctx.fillText(ch,x,y);                 // bright head
      rctx.fillStyle=hexA(col,0.28); rctx.fillText(RG[(Math.random()*RG.length)|0],x,y-14); // dim trail
      cols[i]= y>h+Math.random()*140 ? 0 : y+ (10+Math.random()*6);
    }
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
  var pbGlyphT=0, lastPick=-1;
  var stageCap=document.getElementById("stageCap"), pbName=document.getElementById("pbName"),
      pbDesc=document.getElementById("pbDesc"), pbCyc=document.querySelector(".pb-cyc"),
      tickerEl=document.getElementById("ticker"), sceneEl=document.getElementById("scene");
  function setStrat(i){ var s=STRATS[i]; if(!s) return;
    if(pbName) pbName.textContent=s.name; if(pbDesc) pbDesc.textContent=s.desc;
    if(pbCyc) pbCyc.textContent=s.cue; }
  function clamp01(x){ return x<0?0:x>1?1:x; }
  // Regime detection — the race's own volatility / divergence / trend summons the matching play.
  function pickStrategy(){
    function tail(a){ return a.slice(Math.max(0,a.length-46)); }
    var hs=tail(human.pts), ms=tail(machine.pts); if(hs.length<6||ms.length<6) return 0;
    function std(a){ var m=0,i; for(i=0;i<a.length;i++) m+=a[i]; m/=a.length;
      var v=0; for(i=0;i<a.length;i++) v+=(a[i]-m)*(a[i]-m); return Math.sqrt(v/a.length); }
    function slope(a){ return a[a.length-1]-a[0]; }
    var scale=Math.max(1,(Math.abs(hs[hs.length-1])+Math.abs(ms[ms.length-1]))/2);
    var volN=(std(hs)+std(ms))/2/scale, diverg=Math.abs(hs[hs.length-1]-ms[ms.length-1])/scale,
        tr=((slope(hs)+slope(ms))/2)/scale;
    var s=[0,0,0,0,0,0];
    s[0]=1.1 - volN*3 - Math.abs(tr)*2;              // condor: calm
    s[3]=1.25 - volN*4 - Math.abs(tr)*3;             // butterfly: very pinned
    s[2]=0.85 - volN*2 - Math.abs(tr)*2.5;           // short straddle: range
    s[1]=volN*3 + diverg*2.2;                        // strangle: vol expanding
    s[5]=volN*2 + Math.max(0,tr)*3 + diverg;         // ladder: breakout
    s[4]=Math.max(0,tr)*4 - volN*1.5;                // bull spread: uptrend
    var best=0,bv=-1e9;
    for(var i=0;i<6;i++){ var sc=s[i]+Math.random()*0.5 - (i===lastPick?0.8:0);
      if(sc>bv){ bv=sc; best=i; } }
    lastPick=best; return best;
  }
  function payoffAt(pts,u){ if(u<=pts[0][0]) return pts[0][1];
    for(var i=1;i<pts.length;i++){ if(u<=pts[i][0]){ var a=pts[i-1],b=pts[i];
      var tt=(u-a[0])/((b[0]-a[0])||1); return a[1]+(b[1]-a[1])*tt; } }
    return pts[pts.length-1][1]; }
  // Telestrator draw-on. p = { on, strikes, curve, zones, out } progresses in 0..1.
  function drawPlaybook(strat, p){
    if(!strat) return;
    var padX=W*0.06, x0=padX, x1=W-padX, midY=fieldMid(), amp=fieldAmp()*0.86,
        yTop=field.top-6, yBot=field.bottom+6;
    function X(u){ return x0+u*(x1-x0); } function Y(v){ return midY - v*amp; }
    var accent=css("--accent")||"#35D0BA", pos=css("--pos")||"#3FB950", neg=css("--neg")||"#F85149",
        muted=css("--muted")||"#8B9AAB", A=(1-p.out);
    ctx.save(); ctx.globalAlpha=A;
    // shaded profit (green) / loss (red) zones, revealed left→right with the curve, alpha by p.zones
    if(p.zones>0){ var N=140, seg=(x1-x0)/N, zr=p.curve;
      for(var i=0;i<N;i++){ var u=i/(N-1); if(u>zr) break; var v=payoffAt(strat.pts,u), px=X(u), py=Y(v), zy=Y(0);
        ctx.fillStyle=hexA(v>=0?pos:neg, 0.14*p.zones);
        ctx.fillRect(px, Math.min(py,zy), seg+1, Math.abs(py-zy)); } }
    // strike verticals (revealed in sequence) + Matrix glyphs illuminating each leg
    ctx.font="12px "+(css("--mono")||"monospace"); ctx.textAlign="center";
    var shown=p.strikes*strat.strikes.length;
    for(var k=0;k<strat.strikes.length;k++){ var rev=clamp01(shown-k); if(rev<=0) break;
      var sx=X(strat.strikes[k]);
      ctx.setLineDash([3,6]); ctx.lineWidth=1; ctx.strokeStyle=hexA(accent,0.34*rev);
      ctx.beginPath(); ctx.moveTo(sx,yTop); ctx.lineTo(sx,yBot); ctx.stroke(); ctx.setLineDash([]);
      var gy=yTop+((pbGlyphT*4 + strat.strikes[k]*260) % ((yBot-yTop)+40));
      ctx.fillStyle=hexA(accent,0.85*rev); ctx.fillText(RG[(Math.random()*RG.length)|0], sx, gy);
      ctx.fillStyle=hexA(accent,0.3*rev); ctx.fillText(RG[(Math.random()*RG.length)|0], sx, gy-16);
    }
    ctx.textAlign="start";
    // breakeven (zero P/L) baseline, appears with the strikes
    if(p.strikes>0){ ctx.setLineDash([5,6]); ctx.lineWidth=1; ctx.strokeStyle=hexA(muted,0.55*p.strikes);
      ctx.beginPath(); ctx.moveTo(x0,Y(0)); ctx.lineTo(x1,Y(0)); ctx.stroke(); ctx.setLineDash([]); }
    // the payoff curve, drawn left→right to p.curve with a glowing "chalk tip"
    if(p.curve>0){ var f=p.curve, pts=strat.pts, started=false;
      ctx.beginPath();
      for(i=0;i<pts.length;i++){ if(pts[i][0]<=f){ var px=X(pts[i][0]), py=Y(pts[i][1]);
        started?ctx.lineTo(px,py):ctx.moveTo(px,py); started=true; }
        else { var ex=X(f), ey=Y(payoffAt(pts,f)); if(started) ctx.lineTo(ex,ey); else ctx.moveTo(ex,ey); started=true; break; } }
      ctx.strokeStyle=accent; ctx.lineWidth=2.4; ctx.lineJoin="round";
      ctx.shadowColor=accent; ctx.shadowBlur=18; ctx.stroke(); ctx.shadowBlur=0;
      if(f<1){ var tx=X(f), ty=Y(payoffAt(pts,f));   // chalk tip
        ctx.beginPath(); ctx.arc(tx,ty,4,0,7); ctx.fillStyle="#EAFBF7";
        ctx.shadowColor=accent; ctx.shadowBlur=16; ctx.fill(); ctx.shadowBlur=0; } }
    ctx.restore();
  }
  // Play controller: cooldown → fire a regime-picked play → telestrator timeline → resume.
  var PWR=450,STK=500,CRV=1000,ZON=500,LBL=400,HLD=2500,OUT=650;
  var HOLD_END=PWR+STK+CRV+ZON+LBL+HLD, TOTAL=HOLD_END+OUT;
  var playMode=false, playStart=0, curStrat=0, nextPlayAt=3600;
  function playProg(e){
    return { on:clamp01(e/PWR),
      strikes:clamp01((e-PWR)/STK), curve:clamp01((e-PWR-STK)/CRV),
      zones:clamp01((e-PWR-STK-CRV)/ZON), label:clamp01((e-PWR-STK-CRV-ZON)/LBL),
      out: e>HOLD_END ? clamp01((e-HOLD_END)/OUT) : 0 };
  }

  resize(); rainResize();
  window.addEventListener("resize", function(){ resize(); rainResize(); });

  if(reduce){ measureField(); draw();
    if(stageCap){ setStrat(0); stageCap.classList.add("pb"); }
    if(sceneEl) sceneEl.classList.add("playing");
    if(tickerEl) tickerEl.classList.add("dim");
    ctx.save(); ctx.fillStyle=hexA(css("--bg")||"#0B0F14",0.72);
    ctx.fillRect(0,0,W,field.bottom); ctx.restore();   // recede the race in the field only
    drawPlaybook(STRATS[0], { on:1,strikes:1,curve:1,zones:1,label:1,out:0 });  // one static diagram
    if(rctx){ rctx.fillStyle="rgba(11,15,20,1)"; rctx.fillRect(0,0,rcanvas.clientWidth,rcanvas.clientHeight);
      for(var s=0;s<26;s++) rainDraw(); }
    if(!live) updateTicker(); return; }

  var last=0, running=true;
  document.addEventListener("visibilitychange", function(){ running=!document.hidden; if(running) requestAnimationFrame(loop); });
  function loop(now){
    if(!running) return;
    if(now-last > 55){ last=now; t++; measureField();
      // Fire a play when the cooldown elapses; regime picks which one.
      if(!playMode && now>=nextPlayAt){ playMode=true; playStart=now; curStrat=pickStrategy(); setStrat(curStrat); }
      var p=null, recede=0;
      if(playMode){ var e=now-playStart; p=playProg(e); recede=Math.min(p.on,1)*(1-p.out);
        if(e>=TOTAL){ playMode=false; nextPlayAt=now+3400+Math.random()*1600; p=null; recede=0; } }
      var showing = recede>0.5;
      if(stageCap){ if(showing) stageCap.classList.add("pb"); else stageCap.classList.remove("pb"); }
      if(sceneEl){ if(recede>0.02) sceneEl.classList.add("playing"); else sceneEl.classList.remove("playing"); }
      if(tickerEl){ if(showing) tickerEl.classList.add("dim"); else tickerEl.classList.remove("dim"); }
      step(human,human.drift); step(machine,machine.drift); draw();
      if(p){ ctx.save(); ctx.fillStyle=hexA(css("--bg")||"#0B0F14", recede*0.74);
        ctx.fillRect(0,0,W,field.bottom); ctx.restore();   // recede the race inside the field
        drawPlaybook(STRATS[curStrat], p); pbGlyphT++; }
      rainDraw();
      if(t%6===0 && !live && !showing) updateTicker(); }   // live ticker shows real /pulse numbers
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Pointer-reactive parallax + holographic sheen tilt (fine pointers only).
  var scene=document.getElementById("scene"), card=scene&&scene.querySelector(".card");
  if(scene && window.matchMedia && window.matchMedia("(pointer:fine)").matches){
    var rx=0,ry=0,tx=0,ty=0,nxG=0, raf=0;
    window.addEventListener("pointermove", function(e){
      var nx=(e.clientX/window.innerWidth)-0.5, ny=(e.clientY/window.innerHeight)-0.5;
      tx = -ny*6; ty = nx*8; nxG=nx;
      if(!raf) raf=requestAnimationFrame(ease);
    });
    window.addEventListener("pointerleave", function(){ tx=0; ty=0; if(!raf) raf=requestAnimationFrame(ease); });
    function ease(){ rx+=(tx-rx)*0.08; ry+=(ty-ry)*0.08;
      scene.style.transform="rotateX("+rx.toFixed(2)+"deg) rotateY("+ry.toFixed(2)+"deg)";
      if(card) card.style.setProperty("--sheen", (115 + nxG*70).toFixed(0)+"deg");
      if(Math.abs(tx-rx)>0.01||Math.abs(ty-ry)>0.01){ raf=requestAnimationFrame(ease); } else { raf=0; } }
  }
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
