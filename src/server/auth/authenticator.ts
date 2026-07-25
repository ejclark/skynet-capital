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
    display:flex; align-items:center; justify-content:center; padding:24px;
    background:
      radial-gradient(80% 60% at 50% -10%, color-mix(in srgb,var(--accent) 15%,transparent), transparent 65%),
      radial-gradient(60% 50% at 85% 110%, color-mix(in srgb,var(--pos) 10%,transparent), transparent 60%),
      var(--bg);
    perspective:1200px;
  }

  /* Living market backdrop */
  #stage{ position:fixed; inset:0; width:100%; height:100%; z-index:0; pointer-events:none; }
  .vignette{ position:fixed; inset:0; z-index:1; pointer-events:none;
    background:radial-gradient(120% 90% at 50% 40%, transparent 45%, color-mix(in srgb,var(--bg) 82%,transparent) 100%); }

  /* Depth stage — parallax layers ride inside this */
  .scene{ position:relative; z-index:2; width:100%; max-width:392px; transform-style:preserve-3d; }

  .legend{
    display:flex; justify-content:center; gap:22px; margin-bottom:20px;
    font-family:var(--mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase;
    transform:translateZ(38px);
  }
  .legend span{ display:inline-flex; align-items:center; gap:7px; color:var(--muted); }
  .legend i{ width:22px; height:2px; border-radius:2px; display:inline-block; }
  .legend .lz{ box-shadow:0 0 8px 1px currentColor; }
  .legend .human i{ background:var(--pos); color:var(--pos); }
  .legend .machine i{ background:var(--accent); color:var(--accent); }
  .legend b{ color:var(--text); font-weight:600; }

  .card{
    position:relative; width:100%; text-align:center; padding:38px 32px 30px;
    border-radius:20px; transform:translateZ(0);
    background:
      linear-gradient(180deg, color-mix(in srgb,var(--surface) 92%,transparent), color-mix(in srgb,var(--surface-2) 96%,transparent));
    border:1px solid var(--border);
    box-shadow:
      0 1px 0 0 color-mix(in srgb,#fff 8%,transparent) inset,
      0 40px 90px -40px rgba(0,0,0,.75),
      0 8px 30px -18px color-mix(in srgb,var(--accent) 45%,transparent);
    backdrop-filter:blur(14px) saturate(1.2); -webkit-backdrop-filter:blur(14px) saturate(1.2);
  }
  /* Lit top edge */
  .card::before{ content:""; position:absolute; inset:0 0 auto 0; height:1px; border-radius:20px 20px 0 0;
    background:linear-gradient(90deg, transparent, color-mix(in srgb,var(--accent) 70%,transparent), transparent); }

  .brand{ transform:translateZ(26px); }
  .brand .mark{ display:block; font-weight:700; font-size:23px; letter-spacing:.16em; }
  .brand .mark b{ color:var(--accent); text-shadow:0 0 14px color-mix(in srgb,var(--accent) 60%,transparent); }
  .brand .sub{ display:block; margin-top:8px; font-size:11px; letter-spacing:.3em;
    text-transform:uppercase; color:var(--muted); }

  .tag{ display:inline-flex; align-items:center; gap:8px; margin:22px 0 4px;
    font-family:var(--mono); font-size:11px; letter-spacing:.14em; color:var(--accent);
    border:1px solid color-mix(in srgb,var(--accent) 55%,var(--border)); border-radius:999px;
    padding:5px 13px; background:color-mix(in srgb,var(--accent) 8%,transparent); }
  .tag .live{ width:6px; height:6px; border-radius:50%; background:var(--accent);
    box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 70%,transparent); animation:pulse 2.4s ease-out infinite; }

  .sub-copy{ color:var(--text); font-size:15px; margin:16px auto 4px; line-height:1.5; max-width:30ch; }
  .sub-copy .em{ color:var(--muted); }
  .ticker{ font-family:var(--mono); font-size:12px; letter-spacing:.1em; color:var(--muted);
    margin:8px 0 24px; }
  .ticker b{ color:var(--pos); font-weight:600; }
  .ticker .m{ color:var(--accent); }

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
  .legend{ opacity:0; animation:rise .7s ease .95s both; }
  .brand{ opacity:0; animation:rise .7s ease .5s both; }
  .tag{ opacity:0; animation:rise .7s ease .68s both; }
  .sub-copy{ opacity:0; animation:rise .7s ease .8s both; }
  .ticker{ opacity:0; animation:rise .7s ease .9s both; }
  .error{ opacity:0; animation:rise .6s ease .6s both; }
  .btn{ opacity:0; animation:rise .6s ease calc(1s + var(--i,0) * .12s) both; }
  .foot{ opacity:0; animation:rise .7s ease 1.3s both; }

  @media (prefers-reduced-motion:reduce){
    *{ animation:none !important; transition:none !important; }
    .card,.legend,.brand,.tag,.sub-copy,.ticker,.error,.btn,.foot{ opacity:1 !important; }
    .tag .live{ animation:none; }
  }
</style>
</head>
<body>
<canvas id="stage" aria-hidden="true"></canvas>
<div class="vignette" aria-hidden="true"></div>
<div class="scene" id="scene">
  <div class="legend" aria-hidden="true">
    <span class="human"><i class="lz"></i><b>Human</b></span>
    <span class="machine"><i class="lz"></i><b>Machine</b></span>
  </div>
  <main class="card">
    <div class="brand">
      <span class="mark">SKYNET<b>·</b>CAPITAL</span>
      <span class="sub">Observatory</span>
    </div>
    <span class="tag"><span class="live"></span>PAPER · SANDBOX</span>
    <p class="sub-copy">The board is live. <span class="em">Take your seat in the race.</span></p>
    <p class="ticker" aria-hidden="true">HUMANS <b id="tHuman">+0.00%</b> &nbsp;·&nbsp; MACHINES <span class="m" id="tMachine">+0.00%</span></p>
    ${banner}
    <div class="btns">
      ${buttons}
    </div>
    <p class="foot">Invite-only · access is limited to the league's guest list.</p>
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
  function resize(){
    DPR = Math.min(window.devicePixelRatio||1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(W*DPR));
    canvas.height = Math.max(1, Math.floor(H*DPR));
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }

  // Two seeded, gently diverging equity walks scrolling right→left.
  var human = { color:"--pos", seed:11.7, pts:[], v:0, val:0 };
  var machine = { color:"--accent", seed:4.2, pts:[], v:0, val:0 };
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
    for(var i=0;i<SPAN;i++){ t=i; step(human,0.045); step(machine,0.05); }
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
    var baseY = H*0.5, amp = H*0.30;
    function project(v){ return baseY + amp - ((v-lo)/(hi-lo))*(amp*2); }

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
      // soft area fill under the curve
      ctx.lineTo((n-1)*dx, H); ctx.lineTo(0, H); ctx.closePath();
      var grad = ctx.createLinearGradient(0, baseY-amp, 0, H);
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

  resize();
  window.addEventListener("resize", resize);

  if(reduce){ draw(); updateTicker(); return; }   // one static frame, no loop

  var last=0, running=true;
  document.addEventListener("visibilitychange", function(){ running=!document.hidden; if(running) requestAnimationFrame(loop); });
  function loop(now){
    if(!running) return;
    if(now-last > 55){ last=now; t++; step(human,0.045); step(machine,0.05); draw();
      if(t%6===0) updateTicker(); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Pointer-reactive parallax (fine pointers only).
  var scene=document.getElementById("scene");
  if(scene && window.matchMedia && window.matchMedia("(pointer:fine)").matches){
    var rx=0,ry=0,tx=0,ty=0, raf=0;
    window.addEventListener("pointermove", function(e){
      var nx=(e.clientX/window.innerWidth)-0.5, ny=(e.clientY/window.innerHeight)-0.5;
      tx = -ny*6; ty = nx*8;
      if(!raf) raf=requestAnimationFrame(ease);
    });
    window.addEventListener("pointerleave", function(){ tx=0; ty=0; if(!raf) raf=requestAnimationFrame(ease); });
    function ease(){ rx+=(tx-rx)*0.08; ry+=(ty-ry)*0.08;
      scene.style.transform="rotateX("+rx.toFixed(2)+"deg) rotateY("+ry.toFixed(2)+"deg)";
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
