// The pure half of the parity check (#4943 slice 2): judging a measurement, reading a blocked
// tap's culprit, and printing the table. No browser here — scripts/study/parity.mjs measures, this
// decides, and tests/scripts/study-parity.spec.ts pins the decisions.

/** At least this many pixels of a surface, each way, must be on screen to count as seen. */
const MIN_VISIBLE_PX = 4;

/**
 * Is a measured element visible in the viewport?
 * @param {{box: {left: number, top: number, width: number, height: number},
 *          viewport: {width: number, height: number}, hitInside: boolean}} m
 * @returns {{ok: true} | {ok: false, why: string}}
 */
export function judgeVisible(m) {
  const { box, viewport } = m;
  if (box.width <= 0 || box.height <= 0) return { ok: false, why: "has no size" };
  const visibleW = Math.min(box.left + box.width, viewport.width) - Math.max(box.left, 0);
  const visibleH = Math.min(box.top + box.height, viewport.height) - Math.max(box.top, 0);
  if (visibleW < MIN_VISIBLE_PX || visibleH < MIN_VISIBLE_PX) {
    return { ok: false, why: "is outside the viewport after scrolling to it" };
  }
  if (!m.hitInside) return { ok: false, why: "is covered by something else at its centre" };
  return { ok: true };
}

/**
 * The element that took a blocked click, from Playwright's call log line
 * `<div class="x">…</div> from <div class="y">…</div> subtree intercepts pointer events` —
 * as `div.x (in div.y)`. Undefined when the failure was anything else.
 */
export function interceptorOf(log) {
  const m =
    /<(\w+)(?: class="([^"]*)")?[^>]*>.*? from <(\w+)(?: class="([^"]*)")?[^>]*>.*? subtree intercepts pointer events/.exec(
      log,
    );
  if (!m) return undefined;
  const name = (tag, cls) => (cls ? `${tag}.${cls.split(" ")[0]}` : tag);
  return `${name(m[1], m[2])} (in ${name(m[3], m[4])})`;
}

/** A frame's word: not run there, missed, rendered with a note (`ok*`), or rendered. */
function cell(result, struck, skipped) {
  if (struck) return "STRUCK";
  if (skipped || result === undefined) return "n/a";
  if (result.miss) return "MISS";
  return result.notes.length > 0 ? "ok*" : "ok";
}

/**
 * One row per surface: world · surface · 390 · 1280 · detail.
 * @param {{world: string, surface: {label: string, struck?: string, only?: string},
 *          phone?: {miss: string | null, notes: string[]},
 *          desktop?: {miss: string | null, notes: string[]}}[]} rows
 */
export function parityTable(rows) {
  const lines = rows.map((r) => {
    const s = r.surface;
    const phone = cell(r.phone, s.struck, s.only === "desktop");
    const desktop = cell(r.desktop, s.struck, s.only === "phone");
    const said = [r.phone, r.desktop].flatMap((x) => (x ? [x.miss, ...x.notes] : []));
    const detail = s.struck ? `struck: ${s.struck}` : said.filter(Boolean).join(" · ");
    return [r.world, s.label, phone, desktop, detail];
  });
  const head = ["world", "surface", "390", "1280", "detail"];
  const widths = head.map((h, i) => Math.max(h.length, ...lines.map((l) => l[i].length)));
  const fmt = (l) =>
    `| ${l.map((c, i) => (i === l.length - 1 ? c : c.padEnd(widths[i]))).join(" | ")} |`;
  const rule = widths.map((w, i) => "-".repeat(i === head.length - 1 ? 6 : w));
  return [fmt(head), fmt(rule), ...lines.map(fmt)].join("\n");
}

/** 1 when any non-struck surface missed at a frame it ran at, or any read went unstubbed. */
export function worstExit(rows, unstubbed = []) {
  const missed = rows.some((r) => !r.surface.struck && (r.phone?.miss || r.desktop?.miss));
  return missed || unstubbed.length > 0 ? 1 : 0;
}
