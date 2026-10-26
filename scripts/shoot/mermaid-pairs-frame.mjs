// The frame a before/after pair is photographed in — palette, type, markup and the in-page layout
// pass for `./mermaid-pairs.mjs`. Kept apart from the pipeline so "how it looks" is one file and
// "how it runs" is another; nothing here launches a browser or touches the disk.
//
// WHAT THE FRAME PROMISES (the polish bar, 2026-09-26 — these images leave the team):
//  - **GitHub's own canvas, not ours.** The diagrams are shown the way github.com shows them: on
//    #ffffff / #0d1117 with Primer's current text, border and subtle colours, Mermaid's `default`
//    theme in light and `dark` in dark. A brand palette here would be a flourish that implies
//    something false about how the diagram looks where it will actually be read.
//  - **Hue never carries meaning alone** (docs/BRAND.md → Accessibility). BEFORE is a hollow ring,
//    muted weight; AFTER is a filled accent dot, full weight — the shape and the word carry it, the
//    teal only agrees. A failure is a dashed box, a ✕ and the words "Did not render".
//  - **Nothing under ~11px at scale 1** (docs/READERS.md: a phone browser is the reading
//    condition). The smallest type is the 11.5px mode tag and 12px code.
//  - **No dead whitespace.** Columns are sized to the widest side's natural width (clamped), the
//    frame to its columns, and the screenshot is of the frame element — so the image IS the frame.

/** Primer's current (2025+) functional colours on each canvas, plus the house accent for AFTER. */
export const PALETTE = {
  light: {
    canvas: "#ffffff",
    subtle: "#f6f8fa",
    fg: "#1f2328",
    muted: "#59636e",
    border: "#d1d9e0",
    codeBg: "rgba(129,139,152,0.12)",
    accent: "#0e9f8c",
    danger: "#d1242f",
    dangerBg: "#ffebe9",
    mermaidTheme: "default",
  },
  dark: {
    canvas: "#0d1117",
    subtle: "#151b23",
    fg: "#f0f6fc",
    muted: "#9198a1",
    border: "#3d444d",
    codeBg: "rgba(101,108,118,0.2)",
    accent: "#35d0ba",
    danger: "#f85149",
    dangerBg: "#25171c",
    mermaidTheme: "dark",
  },
};

/** Column widths at scale 1. A side wider than SIDE_MAX sends an `auto` pair to the stacked layout
 *  (at ~560px a two-up frame is already ~1220px, the widest image that still reads on a laptop). */
export const WIDTHS = { sideMin: 320, sideMax: 560, stackMin: 480, stackMax: 880, gutter: 24 };

const SANS = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
const MONO = `ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace`;

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

/** The explicit panel a side gets instead of an empty box. Self-contained (it is also serialised
 *  into the page for render-time failures), so it carries its own escaper. A parser's "Expecting"
 *  list can run to a dozen tokens; the panel keeps the first ~260 characters and the sidecar keeps
 *  the whole reason. */
export function failPanel(reason) {
  const e = (s) =>
    String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  const why = reason.length > 260 ? `${reason.slice(0, 259).trimEnd()}…` : reason;
  return `<div class="fail"><div class="fail-head"><span class="fail-glyph">✕</span>Did not render</div><div class="fail-why">${e(why)}</div></div>`;
}

/** The whole page shell for one mode: tokens, type, frame CSS, and an empty #root. */
export function shellHtml(mode) {
  const p = PALETTE[mode];
  const g = WIDTHS.gutter;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
:root{--canvas:${p.canvas};--subtle:${p.subtle};--fg:${p.fg};--muted:${p.muted};--border:${p.border};--code-bg:${p.codeBg};--accent:${p.accent};--danger:${p.danger};--danger-bg:${p.dangerBg};--sans:${SANS};--mono:${MONO};color-scheme:${mode}}
*{box-sizing:border-box}
html,body{margin:0;background:var(--canvas)}
body{color:var(--fg);font:14px/1.5 var(--sans);-webkit-font-smoothing:antialiased}
#root{display:inline-block}
.frame{background:var(--canvas);border:1px solid var(--border);border-radius:8px;overflow:hidden}
.strip{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 20px;background:var(--subtle);border-bottom:1px solid var(--border)}
.strip h1{margin:0;font-size:17px;line-height:1.35;font-weight:600;letter-spacing:-.005em}
.mode{flex:none;display:flex;align-items:center;gap:6px;font:600 11.5px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.mode i{width:10px;height:10px;border-radius:50%;border:1.5px solid var(--muted);background:linear-gradient(90deg,var(--muted) 50%,transparent 50%)}
.grid{display:grid;grid-template-columns:var(--col-w) 1px var(--col-w);column-gap:${g}px;padding:18px ${g}px 20px}
.stacked .grid{grid-template-columns:var(--col-w);row-gap:20px}
.md.probe{position:absolute;visibility:hidden;width:max-content;left:0;top:0}
.divider{position:relative;background:var(--border)}
.stacked .divider{height:1px}
.chip{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;border:1px solid var(--border);background:var(--canvas);color:var(--muted);display:grid;place-items:center;font:700 14px/1 var(--sans)}
.chip::after{content:"→"}
.stacked .chip::after{content:"↓"}
.col{min-width:0}
.eyebrow{display:flex;align-items:baseline;flex-wrap:wrap;gap:2px 10px;margin-bottom:14px}
.word{display:inline-flex;align-items:center;gap:7px;font:700 12px/1.2 var(--mono);letter-spacing:.1em;text-transform:uppercase}
.word::before{content:"";width:9px;height:9px;border-radius:50%;box-sizing:border-box}
.before .word{color:var(--muted)}
.before .word::before{border:2px solid var(--muted)}
.after .word::before{background:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.lab{font-size:13px;color:var(--muted)}
.body{display:flex;justify-content:center}
.diagram{width:100%}
.diagram svg{display:block;margin:0 auto;max-width:100%;height:auto}
.md{max-width:100%;font-size:13px;line-height:1.45}
.md>:first-child{margin-top:0}.md>:last-child{margin-bottom:0}
.md table{border-collapse:collapse;max-width:100%}
.md th,.md td{border:1px solid var(--border);padding:6px 10px;vertical-align:top;text-align:left}
.md th{font-weight:600}
.md tr:nth-child(2n) td{background:var(--subtle)}
code{font:12px/1.45 var(--mono);background:var(--code-bg);padding:.1em .35em;border-radius:5px;overflow-wrap:break-word}
.md p,.md ul,.md ol{margin:0 0 10px}
.md h1,.md h2,.md h3{margin:0 0 8px;font-size:15px;line-height:1.3}
.md pre{margin:0 0 12px;padding:12px 14px;background:var(--subtle);border:1px solid var(--border);border-radius:6px;white-space:pre-wrap;overflow-wrap:anywhere}
.md pre code{background:none;padding:0;border-radius:0}
.caption{padding:12px 20px 14px;border-top:1px solid var(--border);font-size:14px;line-height:1.5}
.fail{width:100%;border:1.5px dashed var(--danger);background:var(--danger-bg);border-radius:6px;padding:14px 16px}
.fail-head{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;color:var(--danger)}
.fail-glyph{font-size:15px}
.fail-why{margin-top:6px;font:12px/1.5 var(--mono);color:var(--fg);overflow-wrap:anywhere}
</style></head><body><div id="root"></div><script>window.failPanel=${failPanel.toString()}</script></body></html>`;
}

/**
 * One side's column. `body` is already decided by the pipeline: a diagram slot the page fills, a
 * rendered markdown block, or a failure panel.
 */
export function columnHtml(which, label, body) {
  const lab = label ? `<span class="lab">${esc(label)}</span>` : "";
  const word = which === "before" ? "Before" : "After";
  return `<section class="col ${which}"><div class="eyebrow"><span class="word">${word}</span>${lab}</div><div class="body">${body}</div></section>`;
}

/** The frame: title strip (title + mode tag), the two columns with the divider, the caption. */
export function frameHtml({ title, captionHtml, mode, mermaidVersion, before, after }) {
  const tag = `${mode} · mermaid ${esc(mermaidVersion)}`;
  return `<div class="frame" id="frame"><header class="strip"><h1>${esc(title)}</h1><span class="mode"><i></i>${tag}</span></header><div class="grid">${before}<div class="divider"><span class="chip"></span></div>${after}</div><footer class="caption">${captionHtml}</footer></div>`;
}

/**
 * Runs IN THE PAGE (serialised by `page.evaluate`): draw each diagram slot with the page's
 * Mermaid, replace a slot that throws with the failure panel, measure the natural widths, then
 * settle the layout and size the frame. Returns what the pipeline needs for the sidecar.
 */
export async function layoutInPage({ html, sources, layout, widths, key }) {
  const root = document.getElementById("root");
  root.innerHTML = html;
  const frame = document.getElementById("frame");
  const renderErrors = {};
  for (const slot of [...frame.querySelectorAll(".diagram")]) {
    const side = slot.dataset.side;
    try {
      const { svg } = await window.mermaid.render(`m-${key}-${side}`, sources[side]);
      slot.innerHTML = svg;
    } catch (error) {
      renderErrors[side] = String(error?.message ?? error).split("\n")[0];
      slot.outerHTML = window.failPanel(
        `parsed, but Mermaid could not draw it — ${renderErrors[side]}`,
      );
    }
  }
  const natural = (side) => {
    const col = frame.querySelector(`.col.${side}`);
    const svg = col.querySelector(".diagram svg");
    if (svg) return Math.ceil(svg.viewBox.baseVal?.width || svg.getBoundingClientRect().width);
    const md = col.querySelector(".md");
    if (!md) return 0; // a failure panel is fluid — it takes whatever the other side needs
    // A table's natural width is its max-content width, measured on an unconstrained clone.
    const probe = Object.assign(md.cloneNode(true), { className: "md probe" });
    document.body.append(probe);
    const wide = [...probe.querySelectorAll("table, pre")].map(
      (el) => el.getBoundingClientRect().width + 1,
    );
    probe.remove();
    return Math.ceil(Math.max(0, ...wide));
  };
  const nat = { before: natural("before"), after: natural("after") };
  const widest = Math.max(nat.before, nat.after);
  const chosen = layout === "auto" ? (widest > widths.sideMax ? "stacked" : "side") : layout;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const colW =
    chosen === "side"
      ? clamp(widest, widths.sideMin, widths.sideMax)
      : clamp(widest, widths.stackMin, widths.stackMax);
  const inner = chosen === "side" ? 2 * colW + 1 + 2 * widths.gutter : colW;
  frame.classList.add(chosen);
  frame.style.setProperty("--col-w", `${colW}px`);
  frame.style.width = `${inner + 2 * widths.gutter + 2}px`;
  await document.fonts.ready;
  const box = frame.getBoundingClientRect();
  return {
    layout: chosen,
    colW,
    natural: nat,
    renderErrors,
    width: Math.ceil(box.width),
    height: Math.ceil(box.height),
  };
}
