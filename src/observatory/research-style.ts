/**
 * RESEARCH-SURFACE STYLES — split out of research-view.ts (2026-08-26) to keep that renderer under
 * the size cap, the same reason shell-style.ts, desk-style.ts and event-agenda.ts's AGENDA_STYLE
 * exist as their own modules.
 *
 * Covers the shelf header (the calendar + tiles block), the document/symbol reading surfaces, the
 * promoted decision header, and the reader-side folds. The month grid's own styles stay with the
 * widget (calendar-widget.ts); the agenda's stay with the agenda (event-agenda.ts).
 */
/** Research styles — kept out of dashboard-shell.ts (size budget doctrine, like desk-style.ts). */
export const RS_STYLE = `<style>
  .research{ display:flex; flex-direction:column; gap:14px; max-width:var(--col-read); }
  /* The merged shelf carries the wider event horizon alongside the reading sections, so it takes
     the calendar's former width rather than the narrower reading cap the doc/symbol pages keep. */
  .research.rs-wide{ max-width:var(--col-wide); }
  .research .summary{ margin-bottom:4px; }

  /* THE SHELF HEADER — the calendar sits here, in the main column, at every width.
     It used to be a sticky right rail that a container query hid under 860px, which is how it
     vanished on a phone in desktop mode (Eric, 2026-08-26). In the flow it simply stacks instead.
     The grid takes the slot the "today" tile used to hold; two tiles ride alongside it. */
  .rs-head{ display:grid; grid-template-columns:clamp(260px,26vw,320px) minmax(180px,240px); gap:16px;
    justify-content:start; align-items:start; }
  .rs-head .mg{ margin:0; }
  /* Compact stat cards stacked beside the grid. Deliberately NOT stretched to the calendar's
     height — two short facts in tall boxes reads as a layout bug, and the space to their right is
     ordinary page background, not an empty container. */
  .rs-tiles{ display:grid; grid-template-columns:1fr; gap:12px; margin-bottom:0; align-content:start; }
  .rs-headcount{ font-family:var(--mono); font-size:11px; font-weight:700; color:var(--accent);
    border:1px solid color-mix(in srgb,var(--accent) 35%,transparent); border-radius:6px; padding:1px 7px; margin-left:6px; }
  /* Stack before the two columns get cramped — the calendar leads, because it is the thing being
     navigated by. No width hides it. */
  @container stage (max-width:700px){
    .rs-head{ grid-template-columns:minmax(0,1fr); }
    .rs-tiles{ grid-template-columns:repeat(2,minmax(0,1fr)); grid-auto-rows:auto; }
  }
  .research a, .research .md-doc a{ color:var(--accent); text-decoration:none; border-bottom:1px solid color-mix(in srgb,var(--accent) 35%,transparent); }
  .research a:hover{ border-bottom-color:var(--accent); }
  .rs-banner{ font-size:12px; color:var(--muted); border:1px dashed var(--border); border-radius:10px; padding:8px 12px; margin:0; }
  .rs-crumb{ font-size:12.5px; margin:0; display:flex; gap:12px; align-items:baseline; }
  .rs-sec{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px 20px 12px; }
  .rs-sec h2{ margin:0 0 4px; font-size:14px; }
  .rs-sub{ margin:0 0 10px; font-size:12px; color:var(--muted); max-width:74ch; }
  .rs-cards{ display:flex; flex-wrap:wrap; gap:10px; padding:6px 0 10px; }
  .rs-card{ display:flex; flex-direction:column; gap:4px; min-width:150px; padding:10px 14px; border:1px solid var(--border); border-radius:12px; text-decoration:none; }
  .rs-card:hover{ border-color:color-mix(in srgb,var(--accent) 55%,var(--border)); }
  .rs-cardsym{ font-family:var(--mono); font-weight:700; font-size:15px; color:var(--accent); }
  .rs-cardwhen{ font-size:11.5px; color:var(--muted); }
  .rs-list{ list-style:none; margin:0; padding:0; }
  .rs-list li{ padding:7px 0; border-top:1px solid color-mix(in srgb,var(--border) 60%,transparent); font-size:13px; display:flex; gap:10px; flex-wrap:wrap; align-items:baseline; }
  .rs-list li:first-child{ border-top:0; }
  .rs-when{ font-family:var(--mono); font-size:10.5px; color:var(--muted); }
  .rs-ev .rs-count{ font-family:var(--mono); font-size:11px; color:var(--accent); min-width:70px; }
  .rs-evtitle{ font-weight:600; }
  .rs-date{ font-family:var(--mono); font-size:11px; color:var(--muted); }
  .rs-est{ font-family:var(--mono); font-size:9px; letter-spacing:.1em; color:var(--muted); border:1px dashed var(--muted); border-radius:5px; padding:1px 6px; }
  .rs-golink{ font-size:12px; }
  .rs-none{ font-size:11.5px; color:var(--muted); font-style:italic; }
  .rs-empty{ font-size:13px; color:var(--muted); font-style:italic; margin:4px 0; }
  .rs-stance{ border-left:2px solid var(--accent); padding-left:14px; }
  /* The decision surface earns more width than the reading column: it carries the five-column call
     sheet (call · confidence · why · dated falsifier), and squeezing that into 80ch is what made
     the old header hard to scan. The prose below keeps the narrower measure. */
  .rs-glance{ background:color-mix(in srgb,var(--accent) 8%,var(--surface)); border:1px solid color-mix(in srgb,var(--accent) 45%,var(--border)); border-radius:14px; padding:12px 18px 6px; margin:2px 0 4px; max-width:100%; }
  /* Both classes are on the same element, so this out-specifies .md-doc's 80ch reading cap. */
  .rs-glance.md-doc{ max-width:none; }
  .rs-glance table{ table-layout:auto; width:100%; }
  .rs-glance td:nth-child(3){ font-family:var(--mono); font-size:11px; text-transform:uppercase; letter-spacing:.06em; white-space:nowrap; }
  .rs-glance th:last-child, .rs-glance td:last-child{ color:var(--muted); }
  .rs-glance-tag{ font-family:var(--mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--accent); margin-bottom:2px; }
  .rs-glance > p:first-of-type{ margin-top:4px; }
  .rs-glance strong{ color:var(--text); }
  .rs-glance table{ width:100%; margin:8px 0; }
  .rs-glance th{ color:var(--accent); font-family:var(--mono); }
  .rs-glance td:first-child{ font-family:var(--mono); font-size:11.5px; white-space:nowrap; color:var(--accent); font-weight:700; }
  .rs-glance ul{ margin:4px 0; }
  .md-doc{ font-size:13.5px; line-height:1.65; max-width:80ch; }
  .md-doc h1{ font-size:19px; margin:6px 0 10px; }
  .md-doc h2{ font-size:15px; margin:20px 0 6px; }
  .md-doc h3{ font-size:13.5px; margin:14px 0 4px; }
  .md-doc p{ margin:8px 0; }
  .md-doc code{ font-family:var(--mono); font-size:12px; background:color-mix(in srgb,var(--border) 40%,transparent); border-radius:4px; padding:1px 5px; }
  .md-doc pre{ overflow-x:auto; background:color-mix(in srgb,var(--border) 30%,transparent); border-radius:8px; padding:10px 12px; }
  .md-doc pre code{ background:none; padding:0; }
  .md-doc table{ border-collapse:collapse; margin:10px 0; display:block; overflow-x:auto; font-size:12.5px; }
  .md-doc th, .md-doc td{ border:1px solid var(--border); padding:6px 9px; text-align:left; vertical-align:top; }
  .md-doc th{ font-family:var(--mono); font-size:11px; letter-spacing:.04em; }
  .md-doc blockquote{ margin:8px 0; padding:2px 14px; border-left:2px solid var(--border); color:var(--muted); }
  .md-doc ul, .md-doc ol{ padding-left:22px; margin:8px 0; }

  /* Reader-side folds — the method and the receipts are one click away, never the wall you land on.
     The content is unchanged and fully present; only its default disclosure differs. */
  .rs-fold{ border:1px solid var(--border); border-radius:10px; margin:10px 0; background:color-mix(in srgb,var(--border) 12%,transparent); }
  .rs-fold > summary{ cursor:pointer; list-style:none; padding:9px 14px; display:flex; align-items:baseline;
    gap:10px; flex-wrap:wrap; border-radius:10px; }
  .rs-fold > summary::-webkit-details-marker{ display:none; }
  .rs-fold > summary::before{ content:"▸"; color:var(--accent); font-size:11px; line-height:1.4; }
  .rs-fold[open] > summary::before{ content:"▾"; }
  .rs-fold > summary:hover{ background:color-mix(in srgb,var(--accent) 7%,transparent); }
  .rs-fold > summary:focus-visible{ outline:2px solid var(--accent); outline-offset:-2px; }
  .rs-foldname{ font-size:13.5px; font-weight:700; color:var(--text); }
  .rs-foldsize{ font-family:var(--mono); font-size:10px; letter-spacing:.06em; color:var(--muted); }
  .rs-fold[open] > summary{ border-bottom:1px solid var(--border); border-radius:10px 10px 0 0; }
  .rs-fold > :not(summary){ padding:0 14px; }
  .rs-fold > :last-child{ padding-bottom:10px; }

</style>`;
