import type { ServerResponse } from "node:http";
import { TOKEN_DECLS } from "../ui/tokens.js";
import { findResearchDoc } from "./research-service.js";

/**
 * `/research/<slug>` — the individual document page (a study, or `events/<id>` ledger).
 *
 * This is the classic-surface route legacy-redirects.ts's header comment already promises
 * ("`/research/<slug>` documents are server-rendered by design") but which got deleted alongside
 * the rest of the pre-shell HTML views during the classic-surface removal with
 * no replacement wired — `research-service.ts`'s `findResearchDoc` kept rendering correctly the
 * whole time, it just had zero callers. `/research` itself stays a 302 to `/app/research` (the
 * shelf listing lives in the React shell); only the per-document page is server-rendered, per the
 * module doc on `research-service.ts` — git stays the CMS, so the page is exactly the markdown.
 */

const STYLE = `*{margin:0;padding:0;box-sizing:border-box}html{color-scheme:dark}
  :root{ ${TOKEN_DECLS} }
  body{ background:var(--bg); color:var(--text); font-family:var(--sans); line-height:1.6; padding:32px clamp(16px,5vw,20px) 80px; }
  .wrap{ max-width:760px; margin:0 auto; }
  .back{ display:inline-block; margin-bottom:22px; font-size:13px; color:var(--muted); text-decoration:none; }
  .back:hover{ color:var(--accent); }
  h1,h2,h3{ font-weight:700; letter-spacing:-.01em; margin:28px 0 12px; }
  h1{ font-size:26px; margin-top:0; }
  h2{ font-size:19px; }
  p{ margin:0 0 14px; }
  a{ color:var(--accent); text-decoration:none; }
  a:hover{ text-decoration:underline; }
  table{ width:100%; border-collapse:collapse; margin:14px 0 20px; font-size:14px; }
  th,td{ text-align:left; padding:8px 10px; border-bottom:1px solid var(--border); vertical-align:top; }
  th{ font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
  code{ font-family:var(--mono); font-size:.92em; background:var(--surface-2); padding:1px 5px; border-radius:4px; }
  pre{ font-family:var(--mono); background:var(--surface-2); border-radius:8px; padding:14px; overflow-x:auto; margin:0 0 14px; }
  .rs-glance{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px; margin-bottom:26px; }
  .rs-glance h2:first-child{ margin-top:0; }
  .rs-fold{ margin:0 0 14px; border:1px solid var(--border); border-radius:10px; padding:4px 16px; }
  .rs-fold summary{ cursor:pointer; padding:12px 0; font-weight:600; }
  .rs-foldsize{ font-weight:400; color:var(--muted); font-size:12px; margin-left:8px; }`;

/** True for the document sub-paths — `/research` alone stays the shell-listing redirect. */
export function isResearchDocPath(path: string): boolean {
  return path.startsWith("/research/");
}

/** Serve one `/research/<slug>` request: the resolved doc, or a plain 404 for an unknown slug.
 *  `root` is injectable for specs; defaults to the real docs/research tree. */
export function serveResearchDoc(res: ServerResponse, path: string, root?: string): void {
  const slug = decodeURIComponent(path.slice("/research/".length));
  const doc = findResearchDoc(slug, root);
  if (!doc) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("no such research document");
    return;
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${doc.title} — Skynet Capital research</title>
<style>${STYLE}</style>
</head>
<body><div class="wrap">
<a class="back" href="/app/research">← Research</a>
${doc.glanceHtml ? `<div class="rs-glance">${doc.glanceHtml}</div>` : ""}
${doc.html}
</div></body>
</html>`);
}
