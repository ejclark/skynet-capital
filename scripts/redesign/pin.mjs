// PIN PROBLEMS ON A FRAME (#5143) — numbered badges with a short label ON the spot, an optional
// tight dashed box, Eric's quote in a callout with a short leader, an "illustrative values" tag:
//
//   node scripts/redesign/pin.mjs --frame <jpg> --pins <json> --out <jpg> [--scheme dark|light] [--scale 2]
//   node scripts/redesign/pin.mjs --pins <json> --emit-manifest-pins   # the manifest's `pins`, printed
//
// pins JSON (every x, y, w, h is % of the frame):
//   { "pins": [{ "x": 50, "y": 12, "n": 1, "label": "Cash hides here", "side": "right",
//                "box": [4, 10, 92, 6] }],
//     "quote": { "text": "the total matters more than today", "who": "Eric, r1", "at": [50, 30] },
//     "tag": "illustrative values" }
//
// WHY: Eric's standing rule is annotations on the picture — the number sits on the element it
// describes, never a numbered list beside it — and the round-3 frames (#5037) settled the look.
// Hand-placing that look cost each session a Playwright page and several critic passes; here it
// is one command whose guards (pin-rules.mjs) refuse a frame that breaks it: text under 12px at
// 1x, contrast under AA in either scheme, anything past the frame edge, badges closer than 8px,
// one callout covering another. A refusal names the pin and the fix, and writes nothing.
//
// The frame is a shoot.mjs picture at 2x (--scale), so it is drawn at its CSS size and shot back
// at the same pixels. The scheme follows the frame's own brightness unless --scheme says.
//
// ONE PINS FILE, TWO READERS (#5143): the round page puts a 👍 / 👎 / ☯︎ reaction button on each
// badge, so the manifest names the same pins — `"pins": "<this pins file>"` on the option (or
// `pinsDesk` for the desktop frame), read as-is, with no second copy to keep in sync.
// `--emit-manifest-pins` checks the file and prints the list the page will place (n and side
// filled as drawn), for a manifest that wants it inline.

import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright-core";
import { resolveChromium } from "../shoot/lib.mjs";
import {
  imageSize,
  layoutProblems,
  manifestPins,
  PALETTE,
  paletteProblems,
  readPins,
} from "./pin-rules.mjs";

const CEILING = 200 * 1024;
const USAGE =
  "usage: node scripts/redesign/pin.mjs --frame <jpg> --pins <json> --out <jpg> [--scheme dark|light] [--scale 2]\n" +
  "       node scripts/redesign/pin.mjs --pins <json> --emit-manifest-pins";
const EMIT = "--emit-manifest-pins";

const CSS = `
html,body{margin:0;background:#000}#f{position:relative;overflow:hidden}#f>img{display:block;width:100%;height:100%}
.b{position:absolute;width:24px;height:24px;border-radius:50%;background:var(--accent);color:var(--on);
 font:800 13px/24px system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px var(--bg),0 2px 8px rgba(0,0,0,.45)}
.l{position:absolute;background:var(--bg);color:var(--text);border:1.5px solid var(--accent);border-radius:8px;
 padding:3px 8px;font:600 12.5px/1.3 system-ui,sans-serif;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,.35)}
.x{position:absolute;box-sizing:border-box;border:2px dashed var(--accent);border-radius:6px}
.q{position:absolute;box-sizing:border-box;border:1.5px solid var(--accent);border-radius:10px;background:var(--bg);
 padding:7px 10px;font:500 13px/1.35 system-ui,sans-serif;color:var(--text);box-shadow:0 4px 14px rgba(0,0,0,.35)}
.q q{font-style:italic}.q .who{display:block;margin-top:3px;font:700 12px ui-monospace,monospace;letter-spacing:.03em}
.t{position:absolute;top:10px;right:10px;font:700 12px ui-monospace,monospace;color:var(--text);
 border:1.5px dashed var(--text);background:var(--bg);padding:3px 8px;border-radius:6px;white-space:nowrap}
svg{position:absolute;left:0;top:0;overflow:visible}svg path{fill:none;stroke:var(--accent);stroke-width:1.75}
svg circle{fill:var(--accent)}`;

function args(all) {
  const argv = all.filter((a) => a !== EMIT);
  const out = { scale: 2, emit: argv.length !== all.length };
  for (let i = 0; i < argv.length; i += 2) {
    const key = {
      "--frame": "frame",
      "--pins": "pins",
      "--out": "out",
      "--scheme": "scheme",
      "--scale": "scale",
    }[argv[i]];
    if (!key || argv[i + 1] === undefined) throw new Error(USAGE);
    out[key] = key === "scale" ? Number(argv[i + 1]) : argv[i + 1];
  }
  if (out.emit) {
    if (!out.pins) throw new Error(USAGE);
    return out;
  }
  if (!(out.frame && out.pins && out.out)) throw new Error(USAGE);
  if (out.scheme && !PALETTE[out.scheme]) throw new Error("pin: --scheme is dark or light");
  if (!(out.scale >= 1))
    throw new Error("pin: --scale is the frame's pixel ratio (shoot.mjs frames are 2)");
  return out;
}

/** In the page: the mean brightness of the frame (0–1), to pick the annotation scheme. */
function brightness() {
  const img = document.querySelector("#f>img");
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0, 32, 32);
  const d = g.getImageData(0, 0, 32, 32).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4)
    sum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
  return sum / (d.length / 4);
}

/** In the page: draw every part and return each one's box and smallest text, in CSS px. */
function draw({ pins, quote, tag, W, H }) {
  const f = document.getElementById("f");
  const add = (cls, html, css) => {
    const e = document.createElement("div");
    e.className = cls;
    e.innerHTML = html;
    Object.assign(e.style, css);
    f.appendChild(e);
    return e;
  };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const box = (e) => {
    const r = e.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  };
  const font = (e) =>
    Math.min(
      ...[e, ...e.querySelectorAll("*")].map((n) =>
        Number.parseFloat(getComputedStyle(n).fontSize),
      ),
    );
  const items = [];
  let leader = "";
  for (const p of pins) {
    if (p.box) {
      const [bx, by, bw, bh] = p.box;
      const e = add("x", "", {
        left: `${(bx * W) / 100}px`,
        top: `${(by * H) / 100}px`,
        width: `${(bw * W) / 100}px`,
        height: `${(bh * H) / 100}px`,
      });
      items.push({ kind: "box", n: p.n, rect: box(e) });
    }
  }
  for (const p of pins) {
    const cx = (p.x * W) / 100;
    const cy = (p.y * H) / 100;
    const b = add("b", String(p.n), { left: `${cx - 12}px`, top: `${cy - 12}px` });
    const l = add("l", esc(p.label), {});
    const lw = l.offsetWidth;
    const lh = l.offsetHeight;
    const at = {
      right: [cx + 18, cy - lh / 2],
      left: [cx - 18 - lw, cy - lh / 2],
      top: [cx - lw / 2, cy - 18 - lh],
      bottom: [cx - lw / 2, cy + 18],
    }[p.side];
    Object.assign(l.style, { left: `${at[0]}px`, top: `${at[1]}px` });
    items.push({ kind: "badge", n: p.n, rect: box(b), font: font(b) });
    items.push({ kind: "label", n: p.n, side: p.side, rect: box(l), font: font(l) });
  }
  if (quote) {
    const px = (quote.at[0] * W) / 100;
    const py = (quote.at[1] * H) / 100;
    const q = add("q", `<q>${esc(quote.text)}</q><span class="who">— ${esc(quote.who)}</span>`, {
      maxWidth: `${Math.min(W < 600 ? 300 : 360, W - 24)}px`,
    });
    const qw = q.offsetWidth;
    const qh = q.offsetHeight;
    const left = Math.max(8, Math.min(px - qw / 2, W - 8 - qw));
    const above = py - 26 - qh >= 8;
    const top = above ? py - 26 - qh : py + 26;
    Object.assign(q.style, { left: `${left}px`, top: `${top}px` });
    // The leader: from the callout's nearest edge to the spot, a dot where it lands.
    const lx = Math.max(left + 12, Math.min(px, left + qw - 12));
    leader = `<path d="M${lx} ${above ? top + qh : top}L${px} ${py}"/><circle cx="${px}" cy="${py}" r="3.5"/>`;
    items.push({ kind: "quote", rect: box(q), font: font(q), at: { x: px, y: py } });
  }
  if (tag) {
    const t = add("t", esc(tag), {});
    items.push({ kind: "tag", rect: box(t), font: font(t) });
  }
  if (leader) f.insertAdjacentHTML("beforeend", `<svg width="${W}" height="${H}">${leader}</svg>`);
  return items;
}

async function main() {
  const opt = args(process.argv.slice(2));
  const { pins, quote, tag, problems } = readPins(JSON.parse(readFileSync(opt.pins, "utf8")));
  problems.push(...paletteProblems());
  if (problems.length > 0) throw new Error(problems.join("\n"));
  if (opt.emit) {
    console.log(JSON.stringify(manifestPins(pins), null, 2));
    return;
  }
  const bytes = readFileSync(opt.frame);
  const px = imageSize(bytes);
  const W = Math.round(px.width / opt.scale);
  const H = Math.round(px.height / opt.scale);
  const exe = resolveChromium();
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  try {
    const page = await browser.newPage({
      viewport: { width: W, height: H },
      deviceScaleFactor: opt.scale,
    });
    const type = bytes[0] === 0x89 ? "png" : "jpeg";
    await page.setContent(
      `<style>${CSS}</style><div id="f" style="width:${W}px;height:${H}px"><img src="data:image/${type};base64,${bytes.toString("base64")}"></div>`,
    );
    await page.locator("#f>img").evaluate((img) => img.decode());
    const scheme = opt.scheme ?? ((await page.evaluate(brightness)) < 0.45 ? "dark" : "light");
    const p = PALETTE[scheme];
    await page.addStyleTag({
      content: `:root{--bg:${p.bg};--text:${p.text};--accent:${p.accent};--on:${p.onAccent}}`,
    });
    const items = await page.evaluate(draw, { pins, quote, tag, W, H });
    const broken = layoutProblems(items, { width: W, height: H });
    if (broken.length > 0) throw new Error(broken.join("\n"));
    const out = resolve(opt.out);
    for (const quality of [86, 78, 70, 62, 54, 46, 40]) {
      await page.screenshot({ path: out, type: "jpeg", quality });
      if (statSync(out).size <= CEILING) {
        console.log(out);
        console.error(
          `pin: ${pins.length} pin(s), ${scheme} scheme, ${Math.round(statSync(out).size / 1024)}KB q${quality}`,
        );
        return;
      }
    }
    throw new Error(`pin: ${out} stays over 200KB — shoot a shorter frame (maxH) first`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
