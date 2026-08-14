/**
 * The DESK stylesheet — the trading-terminal layer of the observatory, kept out of
 * `dashboard-shell.ts` (which is at its size budget and shared by every view) and injected only by
 * the desk views that need it. Same tokens, same two type stacks, same green/red-means-market rule
 * as `docs/BRAND.md`; nothing here invents a parallel palette.
 *
 * Layout principles borrowed from the platforms that get this right: numbers are mono and
 * right-aligned so columns compare at a glance, the row is the unit of interaction (its actions
 * live at the end of the row, not in a hidden menu), and every destructive-ish action is a form
 * button that lands on a review screen rather than firing on click.
 */
export const DESK_STYLE = `<style>
  .desk{ display:flex; flex-direction:column; gap:22px; }
  .desk-head{ display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px; }
  .desk-eyebrow{ font-family:var(--mono); font-size:10px; letter-spacing:.24em; text-transform:uppercase; color:var(--accent); margin-bottom:6px; }
  .desk-title{ font-size:20px; letter-spacing:-.01em; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .desk-sub{ color:var(--muted); font-size:13px; margin-top:6px; max-width:70ch; line-height:1.55; }
  .desk-tabs{ display:flex; gap:4px; flex-wrap:wrap; border-bottom:1px solid var(--border); padding-bottom:0; margin-bottom:2px; }
  .desk-tab{ font-family:var(--mono); font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); text-decoration:none;
    padding:9px 14px; border-bottom:2px solid transparent; transition:color .15s, border-color .15s; }
  .desk-tab:hover{ color:var(--text); }
  .desk-tab.active{ color:var(--accent); border-bottom-color:var(--accent); }
  .desk-tab:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }

  .blotter{ width:100%; border-collapse:collapse; font-size:13.5px; }
  .blotter th{ font-family:var(--mono); font-size:9.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); font-weight:600;
    text-align:left; padding:0 10px 9px; border-bottom:1px solid var(--border); white-space:nowrap; }
  .blotter th.num, .blotter td.num{ text-align:right; }
  .blotter td{ padding:11px 10px; border-bottom:1px solid color-mix(in srgb,var(--border) 55%,transparent); vertical-align:middle; }
  .blotter tbody tr:last-child td{ border-bottom:none; }
  .blotter tbody tr:hover{ background:color-mix(in srgb,var(--accent) 4%,transparent); }
  .blotter .sym{ font-family:var(--mono); font-weight:700; letter-spacing:.02em; }
  .blotter .tcell{ text-align:left; font-family:var(--mono); white-space:nowrap; }
  .blotter-inline{ overflow-x:auto; margin-top:4px; }
  .blotter-wrap{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px 18px; overflow-x:auto; }
  .weight-bar{ display:block; height:3px; margin-top:5px; border-radius:2px; background:color-mix(in srgb,var(--muted) 22%,transparent); overflow:hidden; max-width:120px; }
  .weight-bar i{ display:block; height:100%; border-radius:2px; background:var(--accent); }

  .desk-tiles{ display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; }
  .desk-tile{ background:var(--surface); border:1px solid var(--border); border-radius:13px; padding:14px 16px; display:flex; flex-direction:column; gap:5px; }
  .desk-tile.lead{ border-color:color-mix(in srgb,var(--accent) 40%,var(--border)); }
  .desk-k{ font-family:var(--mono); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); }
  .desk-v{ font-size:21px; font-weight:700; letter-spacing:-.01em; font-family:var(--mono); font-variant-numeric:tabular-nums; }
  .desk-note{ font-size:11px; color:var(--muted); line-height:1.45; }

  .panel{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:18px 20px; }
  .panel-title{ font-size:14px; font-weight:700; margin-bottom:4px; }
  .panel-sub{ font-size:12px; color:var(--muted); line-height:1.5; margin-bottom:14px; max-width:74ch; }
  .desk-empty{ font-size:13px; color:var(--muted); line-height:1.6; padding:18px 0; }
  .caveat{ display:flex; gap:9px; align-items:flex-start; font-size:12px; color:var(--muted); line-height:1.5;
    background:var(--surface-2); border:1px solid var(--border); border-left:3px solid color-mix(in srgb,var(--accent) 60%,var(--border));
    border-radius:9px; padding:11px 14px; }
  .caveat b{ color:var(--text); font-weight:600; }
  .caveat a{ color:var(--accent); text-decoration:none; }
  .caveat a:hover{ text-decoration:underline; }

  .visually-hidden{ position:absolute; width:1px; height:1px; margin:-1px; padding:0; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
  .rowform{ display:flex; gap:6px; align-items:center; justify-content:flex-end; flex-wrap:wrap; }
  .qty{ width:62px; font-family:var(--mono); font-size:12.5px; text-align:right; padding:6px 8px; border-radius:7px;
    border:1px solid var(--border); background:var(--surface-2); color:var(--text); }
  .qty:focus-visible{ outline:2px solid var(--accent); outline-offset:1px; }
  .btn{ font-family:var(--mono); font-size:11px; letter-spacing:.06em; text-transform:uppercase; padding:7px 12px; border-radius:8px; cursor:pointer;
    border:1px solid var(--border); background:var(--surface-2); color:var(--text); transition:border-color .15s, background .15s; }
  .btn:hover{ border-color:color-mix(in srgb,var(--accent) 55%,var(--border)); }
  a.btn{ text-decoration:none; display:inline-flex; align-items:center; }
  .btn-primary{ background:var(--accent); border-color:var(--accent); color:var(--bg); font-weight:700; }
  .btn-primary:hover{ filter:brightness(1.08); }
  .btn-sell{ border-color:color-mix(in srgb,var(--neg) 45%,var(--border)); color:var(--neg); }
  .btn[disabled]{ opacity:.45; cursor:not-allowed; }
  .btn:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }

  .ticket{ display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:12px; align-items:end; }
  .field{ display:flex; flex-direction:column; gap:6px; }
  .field label{ font-family:var(--mono); font-size:9.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  .field input, .field select{ font-family:var(--mono); font-size:14px; padding:10px 12px; border-radius:9px; border:1px solid var(--border);
    background:var(--surface-2); color:var(--text); }
  .field input:focus-visible, .field select:focus-visible{ outline:2px solid var(--accent); outline-offset:1px; }

  .review{ display:flex; flex-direction:column; gap:14px; max-width:560px; }
  .review-line{ display:flex; justify-content:space-between; gap:16px; font-size:13.5px; padding:9px 0;
    border-bottom:1px solid color-mix(in srgb,var(--border) 55%,transparent); }
  .review-line:last-of-type{ border-bottom:none; }
  .review-line span:first-child{ color:var(--muted); }
  .review-line span:last-child{ font-family:var(--mono); font-variant-numeric:tabular-nums; }
  .review-actions{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
  .note-warn{ font-size:12.5px; line-height:1.5; color:var(--text); background:color-mix(in srgb,var(--accent) 8%,var(--surface-2));
    border:1px solid color-mix(in srgb,var(--accent) 35%,var(--border)); border-radius:9px; padding:10px 13px; }
  .note-stop{ font-size:12.5px; line-height:1.5; color:var(--text); background:color-mix(in srgb,var(--neg) 8%,var(--surface-2));
    border:1px solid color-mix(in srgb,var(--neg) 40%,var(--border)); border-radius:9px; padding:10px 13px; }

  .daystrip{ display:flex; gap:3px; flex-wrap:wrap; }
  .day{ width:15px; height:15px; border-radius:3px; background:color-mix(in srgb,var(--muted) 16%,transparent); }
  .day.pos{ background:var(--pos); } .day.neg{ background:var(--neg); }
  .daystrip-legend{ display:flex; gap:12px; align-items:center; font-family:var(--mono); font-size:10px; color:var(--muted); margin-top:10px; }

  .splitbar{ display:flex; height:10px; border-radius:6px; overflow:hidden; background:color-mix(in srgb,var(--muted) 16%,transparent); }
  .splitbar i{ display:block; height:100%; }
  .splitbar .win{ background:var(--pos); } .splitbar .loss{ background:var(--neg); } .splitbar .scratch{ background:var(--muted); }
  .splitbar-legend{ display:flex; gap:14px; flex-wrap:wrap; font-family:var(--mono); font-size:10.5px; color:var(--muted); margin-top:9px; }
  .swatch{ display:inline-block; width:9px; height:9px; border-radius:2px; margin-right:5px; vertical-align:baseline; }

  .progress{ height:9px; border-radius:6px; background:color-mix(in srgb,var(--muted) 16%,transparent); overflow:hidden; margin-top:10px; }
  .progress i{ display:block; height:100%; border-radius:6px; background:linear-gradient(90deg,var(--accent),var(--pos)); }
  .fills{ margin-top:16px; }
  .fills summary{ cursor:pointer; font-family:var(--mono); font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); padding:8px 0; }
  .fills summary:hover{ color:var(--text); }
  @media (max-width:640px){
    .desk-v{ font-size:18px; }
    .blotter{ font-size:12.5px; }
    .blotter td, .blotter th{ padding-left:6px; padding-right:6px; }
  }
</style>`;
