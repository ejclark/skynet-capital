import type { IncomingMessage } from "node:http";

/** The base reset every server-rendered page starts from. */
export const PAGE_STYLE =
  "*{margin:0;padding:0;box-sizing:border-box}html{color-scheme:dark}body{margin:0}";

/** Matrix design-system styles for the /add, /rotate, /welcome, and /feedback pages. */
const ADD_STYLE = `${PAGE_STYLE}
  :root{ --bg:#0B0F14; --surface:#131A22; --surface-2:#0F151C; --border:#223041; --text:#E6EDF3; --muted:#8B9AAB; --accent:#35D0BA; --pos:#3FB950; --neg:#F85149;
    --mono:ui-monospace,"JetBrains Mono","SF Mono",Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  body{ background:var(--bg); color:var(--text); font-family:var(--sans); min-height:100vh; padding:40px clamp(16px,5vw,20px); }
  .wrap{ max-width:520px; margin:0 auto; }
  .brand{ font-weight:700; font-size:15px; letter-spacing:.14em; margin-bottom:26px; }
  .brand b{ color:var(--accent); }
  h1{ font-size:24px; font-weight:700; margin-bottom:10px; letter-spacing:-.01em; }
  .lede{ color:var(--muted); font-size:14px; line-height:1.55; margin-bottom:26px; }
  .lede b{ color:var(--text); }
  form{ display:flex; flex-direction:column; gap:2px; }
  label{ display:block; margin:14px 0 6px; font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); font-weight:600; }
  label small{ text-transform:none; letter-spacing:0; color:var(--muted); font-weight:400; opacity:.8; }
  input,select{ width:100%; padding:12px 13px; font-size:15px; font-family:var(--sans); color:var(--text); background:var(--surface-2); border:1px solid var(--border); border-radius:9px; transition:border-color .15s, box-shadow .15s; }
  input::placeholder{ color:color-mix(in srgb,var(--muted) 75%,transparent); }
  input:focus,select:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent); }
  textarea{ width:100%; padding:12px 13px; font:15px/1.5 var(--sans); color:var(--text); background:var(--surface-2); border:1px solid var(--border); border-radius:9px; resize:vertical; transition:border-color .15s, box-shadow .15s; }
  textarea::placeholder{ color:color-mix(in srgb,var(--muted) 75%,transparent); }
  textarea:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent); }
  input[name=apiKey],input[name=apiSecret]{ font-family:var(--mono); letter-spacing:.02em; }
  button{ margin-top:24px; padding:13px 18px; font-size:15px; font-weight:600; font-family:var(--sans); color:var(--bg); background:var(--accent); border:0; border-radius:9px; cursor:pointer; transition:filter .15s; }
  button:hover{ filter:brightness(1.08); }
  button:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .note{ margin-top:22px; font-size:12px; color:var(--muted); font-family:var(--mono); letter-spacing:.02em; }
  .res-icon{ font-size:34px; margin-bottom:6px; }
  a{ color:var(--accent); text-decoration:none; }
  a:hover{ text-decoration:underline; }
  .backrow{ margin-top:26px; font-size:14px; color:var(--muted); }
  .wrap.wide{ max-width:760px; }
  /* --- onboarding / welcome --- */
  .hero-eyebrow{ font-family:var(--mono); font-size:11px; letter-spacing:.24em; text-transform:uppercase; color:var(--accent); margin-bottom:14px; }
  .hero-title{ font-size:34px; font-weight:800; letter-spacing:-.02em; line-height:1.1; margin-bottom:14px; }
  .hero-title b{ color:var(--accent); }
  .hero-lede{ color:var(--muted); font-size:16px; line-height:1.6; margin-bottom:30px; max-width:60ch; }
  .hero-lede b{ color:var(--text); }
  .feat-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:14px; margin-bottom:36px; }
  .feat{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px 18px; }
  .feat-ic{ font-size:18px; margin-bottom:8px; }
  .feat-h{ font-size:14px; font-weight:700; margin-bottom:5px; }
  .feat-p{ font-size:13px; color:var(--muted); line-height:1.5; }
  .sec-label{ font-family:var(--mono); font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); margin:0 0 16px; }
  .steps{ display:flex; flex-direction:column; gap:12px; margin-bottom:32px; }
  .step{ display:flex; gap:16px; align-items:flex-start; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px; }
  .step-n{ flex:0 0 auto; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-weight:700; font-size:14px; color:var(--bg); background:var(--accent); }
  .step-b h3{ font-size:15px; font-weight:700; margin-bottom:4px; }
  .step-b p{ font-size:13px; color:var(--muted); line-height:1.55; }
  .cta{ display:inline-flex; align-items:center; gap:10px; padding:14px 22px; font-size:15px; font-weight:700; color:var(--bg); background:var(--accent); border-radius:10px; text-decoration:none; transition:filter .15s; }
  .cta:hover{ filter:brightness(1.08); text-decoration:none; }
  .cta:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
  .fineprint{ margin-top:22px; font-size:12px; color:var(--muted); line-height:1.6; }
  /* --- /add progressive-reveal stepper --- */
  .setup{ margin:0 0 26px; display:flex; flex-direction:column; gap:8px; }
  .step-d{ background:var(--surface); border:1px solid var(--border); border-radius:11px; overflow:hidden; }
  .step-d[open]{ border-color:color-mix(in srgb,var(--accent) 45%,var(--border)); }
  .step-d summary{ list-style:none; cursor:pointer; display:flex; align-items:center; gap:12px; padding:14px 16px; font-weight:600; font-size:14px; }
  .step-d summary::-webkit-details-marker{ display:none; }
  .step-d summary .step-n{ width:26px; height:26px; font-size:13px; }
  .step-d summary .chev{ margin-left:auto; color:var(--muted); transition:transform .18s; }
  .step-d[open] summary .chev{ transform:rotate(90deg); }
  .step-d .sd-body{ padding:2px 18px 18px 54px; font-size:13px; color:var(--muted); line-height:1.6; }
  .step-d .sd-body b{ color:var(--text); }
  .step-d .sd-body a{ font-weight:600; }
  /* --- /add persona class picker (character sheet) --- */
  .classpick{ margin:14px 0 4px; }
  .cp-label{ display:block; font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); font-weight:600; margin-bottom:10px; }
  .cp-label small{ text-transform:none; letter-spacing:0; font-weight:400; opacity:.8; }
  .cp-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px; }
  .cp-card{ position:relative; display:block; margin:0; padding:14px 15px; background:var(--surface); border:1px solid var(--border); border-radius:11px; cursor:pointer; text-transform:none; letter-spacing:normal; transition:border-color .15s, background .15s; }
  .cp-card:hover{ border-color:color-mix(in srgb,var(--accent) 45%,var(--border)); }
  .cp-card input{ position:absolute; opacity:0; width:0; height:0; }
  .cp-card:has(input:checked), .cp-card.sel{ border-color:var(--accent); background:color-mix(in srgb,var(--accent) 9%,var(--surface)); }
  .cp-card:focus-within{ outline:2px solid var(--accent); outline-offset:2px; }
  .cp-name{ display:block; font-size:14px; font-weight:700; color:var(--text); }
  .cp-id{ display:block; font-family:var(--mono); font-size:10px; letter-spacing:.08em; color:var(--accent); margin:2px 0 7px; }
  .cp-thesis{ display:block; font-size:12.5px; color:var(--muted); line-height:1.5; }
  .cp-legend{ display:block; font-size:11.5px; color:color-mix(in srgb,var(--muted) 85%,transparent); line-height:1.5; margin-top:7px; font-style:italic; }`;

/** The shared page chrome for /add, /rotate, /welcome, and /feedback — brand mark + one card. */
export function addShell(title: string, inner: string, wide = false): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${ADD_STYLE}</style>
</head>
<body><div class="wrap${wide ? " wide" : ""}">
<div class="brand">SKYNET<b>·</b>CAPITAL</div>
${inner}
</div></body>
</html>`;
}

/** Reads a request body as text, capped at 1MB — every POST form on this server is tiny. */
export function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

/** Minimal HTML document shell for a server-rendered view (the body already carries its styles). */
export function shellDocument(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${PAGE_STYLE}</style>
</head>
<body>${body}</body>
</html>`;
}
