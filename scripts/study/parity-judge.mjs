// The pure half of the parity check (#4943 slice 2): judging a measurement, reading a blocked
// tap's culprit, and printing the table. No browser here — scripts/study/parity.mjs measures, this
// decides, and tests/scripts/study-parity.spec.ts pins the decisions.

/** At least this many pixels of a surface, each way, must be on screen to count as seen. */
const MIN_VISIBLE_PX = 4;

/**
 * Is a measured element visible in the viewport? `box` is the element's rect already cut to every
 * clipping ancestor (`clipped` says the cut left nothing), `shown` is the browser's own
 * `checkVisibility` (display, visibility, opacity), and `hitInside` says whether the topmost box
 * at the centre of what is left is the element or one of its children.
 * @param {{box: {left: number, top: number, width: number, height: number},
 *          viewport: {width: number, height: number}, hitInside: boolean,
 *          shown?: boolean, clipped?: boolean}} m
 * @returns {{ok: true} | {ok: false, why: string}}
 */
export function judgeVisible(m) {
  const { box, viewport } = m;
  if (m.shown === false)
    return { ok: false, why: "is hidden by CSS (display, visibility or opacity)" };
  if (m.clipped) return { ok: false, why: "is clipped away by a container" };
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

/**
 * A frame's word. Failing: `MISS` (not rendered) and `FAIL` (rendered, but a member could not
 * reach it the way the surface says — a tap something else took). Passing: `bug` (a fault the
 * surface declared with its issue, `knownBug`), `ok*` (rendered, with a note), `ok`.
 */
function cell(result, struck, skipped) {
  if (struck) return "STRUCK";
  if (skipped || result === undefined) return "n/a";
  if (result.miss) return "MISS";
  if (result.faults?.length > 0) return "FAIL";
  if (result.known?.length > 0) return "bug";
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
    const said = [r.phone, r.desktop].flatMap((x) =>
      x ? [x.miss, ...(x.faults ?? []), ...(x.known ?? []), ...x.notes] : [],
    );
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

/**
 * 1 when any non-struck surface missed or failed at a frame it ran at, or any read went
 * unstubbed. `strict` also fails a note (`ok*`) and a declared bug — the bar before a study run.
 */
export function worstExit(rows, unstubbed = [], { strict = false } = {}) {
  const bad = (x) =>
    Boolean(
      x &&
        (x.miss || x.faults?.length > 0 || (strict && (x.notes.length > 0 || x.known?.length > 0))),
    );
  const failed = rows.some((r) => !r.surface.struck && (bad(r.phone) || bad(r.desktop)));
  return failed || unstubbed.length > 0 ? 1 : 0;
}

/**
 * A surface that exists only when the composed build serves it declares `strikeUnless: {read,
 * holds, why}` instead of a fixed `struck`. The world is composed from the checked-out tree, so the
 * same world may carry the thing at one commit and not at another (a pinned run, pin.mjs): the
 * composed answer to `read` decides. Struck with `why` when `holds(body)` is false, and when `read`
 * was never composed (said so) — a strike is always printed, never a silent skip.
 * @param {{struck?: string, strikeUnless?: {read: string, holds: (body: unknown) => boolean,
 *          why: string}}} surface
 * @param {(read: string) => unknown} bodyOf  the composed body for a read, undefined if none
 */
export function strikeFor(surface, bodyOf) {
  const rule = surface.strikeUnless;
  if (!rule || surface.struck) return surface;
  const body = bodyOf(rule.read);
  if (body === undefined) return { ...surface, struck: `${rule.why} (${rule.read} not composed)` };
  return rule.holds(body) ? surface : { ...surface, struck: rule.why };
}

/** `[--run <dir>] [--strict] [world …]` → what to check, and where the composed run lives. */
export function parityArgs(args) {
  const runAt = args.indexOf("--run");
  if (runAt >= 0 && !args[runAt + 1]) throw new Error("parity: --run needs a directory");
  const flags = new Set(["--run", "--strict"]);
  const names = args.filter((a, i) => !flags.has(a) && (runAt < 0 || i !== runAt + 1));
  return {
    runDir: runAt >= 0 ? args[runAt + 1] : undefined,
    strict: args.includes("--strict"),
    names,
  };
}
