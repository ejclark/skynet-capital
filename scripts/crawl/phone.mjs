// Phone checks — five things a 390px screen gets wrong that a desktop frame never shows, run by
// the persona crawl ONLY behind `--phone-audit` at the phone viewport (so run 0's ledger and maps
// stay byte-comparable, #3807) and by `npm run phone -- <path>` for one page in a few seconds.
// Mobile-first is the house discipline on every information surface (CLAUDE.md), and the crawl
// already walks every member at 390×844 — these are the phone-specific questions it never asked.
//
//  - page-sideways-scroll: the document is wider than the window (the thumb finds a sideways drag).
//  - overflow: an element whose content spills past its own box with `overflow-x: visible` — the
//    predicate is COPIED from scripts/layout-resize-scan.mjs (`controlsFindings`), not imported,
//    because that file is another lane's; only the outermost offender per subtree is reported.
//  - offscreen-left: a shown box with words or a control in it that starts left of x=0 — no
//    scroll reaches it, and the two checks above never see it, because scrollWidth only grows
//    rightward (#4046: the status popover hung 113px off a 390px screen with 0 findings). A box
//    wholly left of the page (a parked skip link, a closed drawer) is skipped, as is one an inner
//    `overflow-x` box clips back on screen (a ticker); only the outermost offender is reported.
//  - tap-target: a control under 24×24 CSS px (WCAG 2.2 SC 2.5.8, AA) with the SC's exceptions —
//    inline (a link in a sentence), spacing (a 24px circle on its centre touches no other target
//    and no other undersized target's circle), user-agent default (an unstyled checkbox), and
//    hidden / disabled / zero-size skipped. `tap-target-aaa` (low, advisory) is SC 2.5.5's 44×44
//    for every control that passes AA.
//  - input-zoom: a text field under 16px — iPhone Safari zooms the whole page when it takes
//    focus, and the house `--text-base` is 13px (docs/BRAND.md → type scale).
//
// The browser side only MEASURES (`snapshot`); every judgement is a pure function over plain data
// below, which is what tests/scripts/crawl-phone.spec.ts exercises. Findings follow the probe
// contract (probes.mjs): {kind, what, snippet, severity, fix} — `snippet` is visible text so
// locate.mjs can name a file:line. The crawl writes them to their own ledger (phone-ledger.mjs).

export const TOLERANCE = 4;
export const AA_TARGET = 24;
export const AAA_TARGET = 44;
export const ZOOM_FONT = 16;

const px = (n) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));
const clip = (s, n = 40) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Copied from layout-resize-scan.mjs: only `overflow-x: visible` can leak; auto/hidden contain. */
export function leaks({ scrollWidth, clientWidth, overflowX }, tolerance = TOLERANCE) {
  return scrollWidth - clientWidth > tolerance && overflowX === "visible";
}

/** The leaking boxes with no leaking ancestor — one row per subtree, not one per descendant. */
export function outermostLeaks(boxes, tolerance = TOLERANCE) {
  const leaking = new Set(boxes.filter((b) => leaks(b, tolerance)).map((b) => b.i));
  return boxes.filter((b) => leaking.has(b.i) && !b.ancestors.some((a) => leaking.has(a)));
}

/** SC 2.5.8 inline exception: an inline link whose p/li/td host carries other words around it. */
export function isInlineTarget({ display, hostText, ownText }) {
  if (display !== "inline" || !hostText) return false;
  const rest = hostText.replace(ownText ?? "", " ");
  return (rest.match(/\p{L}{2,}/gu) ?? []).length >= 2;
}

const UA_SIZED = new Set(["checkbox", "radio", "range", "color", "file"]);
/** SC 2.5.8 user-agent exception: a native control the author has not restyled. */
export function isUaDefault({ tag, type, appearance }) {
  return tag === "input" && UA_SIZED.has(type) && appearance !== "none";
}

/** Does a circle of `radius` centred on `c` overlap the rect (touching is not overlapping)? */
export function circleHitsRect(c, radius, r) {
  const dx = Math.max(r.x - c.x, 0, c.x - (r.x + r.width));
  const dy = Math.max(r.y - c.y, 0, c.y - (r.y + r.height));
  return dx * dx + dy * dy < radius * radius;
}

const centre = (r) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
const undersized = (r, min) => r.width < min || r.height < min;
const related = (a, b) => a.ancestors.includes(b.i) || b.ancestors.includes(a.i);

/** SC 2.5.8 spacing exception: false when the 24px circle hits another target or its circle. */
export function spacedEnough(t, all) {
  const c = centre(t.rect);
  const r = AA_TARGET / 2;
  for (const u of all) {
    if (u.i === t.i || related(t, u)) continue;
    if (circleHitsRect(c, r, u.rect)) return false;
    if (undersized(u.rect, AA_TARGET)) {
      const cu = centre(u.rect);
      if (Math.hypot(c.x - cu.x, c.y - cu.y) < AA_TARGET) return false;
    }
  }
  return true;
}

/** Every tap-target finding for one page's measured targets. */
export function tapFindings(targets) {
  const live = targets.filter((t) => t.rect.width > 1 && t.rect.height > 1);
  const out = [];
  for (const t of live) {
    if (isUaDefault(t) || isInlineTarget(t)) continue;
    const size = `${px(t.rect.width)}×${px(t.rect.height)}px`;
    const who = `${t.desc}${t.label ? ` "${clip(t.label)}"` : ""}`;
    if (undersized(t.rect, AA_TARGET) && !spacedEnough(t, live)) {
      out.push({
        kind: "tap-target",
        what: `${who} is ${size} — under 24×24 with another control inside its 24px circle (WCAG 2.2 SC 2.5.8, AA)`,
        snippet: t.label,
        severity: "medium",
        fix: "S",
      });
    } else if (undersized(t.rect, AAA_TARGET)) {
      out.push({
        kind: "tap-target-aaa",
        what: `${who} is ${size} — under 44×44 (SC 2.5.5, AAA — advisory)`,
        snippet: t.label,
        severity: "low",
        fix: "S",
      });
    }
  }
  return out;
}

/**
 * The boxes hung off the left edge with no hung ancestor. `left`/`right` are the box's visible
 * extent in page coordinates, already clipped by any inner `overflow-x` ancestor in the browser.
 */
export function outermostLeftSpills(lefts, tolerance = TOLERANCE) {
  const hung = new Set(lefts.filter((b) => b.left < -tolerance && b.right > 0).map((b) => b.i));
  return lefts.filter((b) => hung.has(b.i) && !b.ancestors.some((a) => hung.has(a)));
}

/** A box hung off the left edge: what spills there is out of reach of every scroll. */
export function leftFindings(lefts) {
  return outermostLeftSpills(lefts).map((b) => ({
    kind: "offscreen-left",
    what: `${b.name} starts ${px(-b.left)}px left of the screen — no scroll reaches that part${b.text ? ` "${clip(b.text, 60)}"` : ""}`,
    snippet: b.text,
    severity: "medium",
    fix: "S",
  }));
}

const ZOOM_TYPES = new Set(["text", "search", "number", "email", "password", "tel", "url"]);
/** A text field under 16px: iPhone Safari zooms the page when it is focused. */
export function zoomFindings(inputs) {
  return inputs
    .filter(
      (f) =>
        (f.tag === "textarea" || f.tag === "select" || ZOOM_TYPES.has(f.type)) &&
        f.fontSize < ZOOM_FONT,
    )
    .map((f) => ({
      kind: "input-zoom",
      what: `${f.desc}${f.label ? ` "${clip(f.label)}"` : ""} renders at ${px(f.fontSize)}px — under 16px, iPhone Safari zooms the page when it takes focus`,
      snippet: f.label,
      severity: "medium",
      fix: "S",
    }));
}

/** Identical findings on one page fold into one, with a count in the text. */
export function dedupe(findings) {
  const byKey = new Map();
  for (const f of findings) {
    const key = `${f.kind}|${f.what}`;
    const seen = byKey.get(key);
    if (seen) seen.n += 1;
    else byKey.set(key, { ...f, n: 1 });
  }
  return [...byKey.values()].map(({ n, ...f }) =>
    n > 1 ? { ...f, what: `${f.what} — ×${n}` } : f,
  );
}

/** Every phone finding for one measured page (the pure half of `probePhone`). */
export function phoneFindings(snap) {
  const out = [];
  if (snap.scrollWidth > snap.innerWidth + TOLERANCE) {
    out.push({
      kind: "page-sideways-scroll",
      what: `the page is ${snap.scrollWidth}px wide in a ${snap.innerWidth}px window — it scrolls sideways`,
      snippet: "",
      severity: "high",
      fix: "M",
    });
  }
  for (const b of outermostLeaks(snap.boxes)) {
    // The outermost box names the subtree; the element reaching furthest right inside it names
    // the cause (a wide table deep in a page-level wrapper), and its text is what locate greps.
    const by = b.culprit ? ` — widest inside: ${b.culprit.name}` : "";
    const text = b.culprit?.text || b.text;
    out.push({
      kind: "overflow",
      what: `${b.name} spills ${b.scrollWidth - b.clientWidth}px past its own box${by}${text ? ` "${clip(text, 60)}"` : ""}`,
      snippet: text,
      severity: "medium",
      fix: "S",
    });
  }
  out.push(...leftFindings(snap.lefts ?? []));
  out.push(...tapFindings(snap.targets), ...zoomFindings(snap.inputs));
  return dedupe(out);
}

/**
 * `npm run phone`'s argv, parsed (phone-one.mjs). Pure so the spec can pin it: a flag that takes a
 * value must be listed in `valued`, or its value — `.status`, a timestamp — reads as the path.
 *  - `--click <css>`: click it once the page settles, then measure — a popover, a drawer or a menu
 *    is only in the DOM while open (#3816 slice 5: the status popover hung 98px off the left edge
 *    of a phone and no closed-page check could see it).
 *  - `--at <ISO time>`: pin the page's clock before it loads, so a time-driven surface (the market
 *    clock's open / pre-market / closed rows) is measured in the state you name, not today's.
 */
/**
 * Pages the server renders only when sign-in is configured. In an open boot `/login` has no page to
 * serve, so a check there measured nothing and printed "0 findings" — the false all-clear that let
 * the login page's sideways scroll ship unseen (#4046, 2026-09-29). These always boot with sign-in
 * configured; `--session` still decides whether the viewer is signed in.
 */
export const AUTH_PAGES = ["/login"];

/** A page that didn't answer 2xx was never measured; say so as a finding instead of "0 findings". */
export function servedFinding(status, path) {
  if (status >= 200 && status < 300) return null;
  return {
    kind: "not-the-page",
    what: `the server answered ${status} for ${path} — nothing real was measured (try --session)`,
    snippet: "",
    severity: "high",
    fix: "S",
  };
}

export function phoneArgs(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const valued = new Set(["--port", "--bridge-port", "--click", "--at"]);
  const path = argv.find((a, i) => !(a.startsWith("--") || valued.has(argv[i - 1])));
  return {
    path: path ?? "/app",
    session: argv.includes("--session"),
    authBoot: argv.includes("--session") || AUTH_PAGES.includes(path ?? "/app"),
    strict: argv.includes("--strict"),
    all: argv.includes("--all"),
    click: get("--click"),
    at: get("--at"),
    // Not the crawl's 8787/8788, so a check can run beside a crawl or a dev server.
    port: Number(get("--port") ?? 8797),
    bridgePort: Number(get("--bridge-port") ?? 8798),
  };
}

/** Runs in the browser: measure, never judge. Plain data only — it crosses the evaluate boundary. */
function snapshot(tolerance) {
  const text = (el) => (el.innerText ?? el.textContent ?? "").replace(/\s+/g, " ").trim();
  const firstLine = (el) =>
    (el.innerText ?? "")
      .split("\n")
      .map((s) => s.trim())
      .find((s) => s.length > 0) ?? "";
  const nameOf = (el) =>
    el.className && typeof el.className === "string"
      ? `.${el.className.split(" ")[0]}`
      : el.tagName.toLowerCase();
  const describe = (el) => {
    const tag = el.tagName.toLowerCase();
    const type = tag === "input" ? ` type=${el.type}` : "";
    const role = el.getAttribute("role") ? ` role=${el.getAttribute("role")}` : "";
    const name = nameOf(el);
    return `<${tag}${type}${role}>${name === tag ? "" : ` ${name}`}`;
  };
  // A <select>'s innerText is every option; its name is its label, else what it shows now.
  const labelOf = (el) =>
    (el.tagName === "SELECT"
      ? el.getAttribute("aria-label") ||
        (el.labels?.[0] ? text(el.labels[0]) : "") ||
        (el.selectedOptions[0]?.text ?? "")
      : "") ||
    text(el) ||
    el.getAttribute("aria-label") ||
    el.getAttribute("title") ||
    (el.labels?.[0] ? text(el.labels[0]) : "") ||
    el.getAttribute("placeholder") ||
    (el.tagName === "INPUT" && el.type !== "text" ? el.value : "") ||
    "";
  const shown = (el) => {
    if (el.getClientRects().length === 0) return false;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.opacity === "0") return false;
    // ≤1px is a visually-hidden label; a box wholly above or left of the page (a skip link
    // parked off-canvas until focused) is out of a thumb's reach — no scroll gets there.
    const r = el.getBoundingClientRect();
    const onCanvas = r.right + window.scrollX > 0 && r.bottom + window.scrollY > 0;
    // Inside a closed <details> a control still has a layout box but no thumb can reach it, and
    // its sentence reads as "" (innerText of hidden content), so the inline exception misfired
    // on every link in a research page's folds (#3816 slice 5). checkVisibility() is false under
    // the fold's content-visibility: hidden; the summary itself stays visible.
    if (el.checkVisibility && !el.checkVisibility()) return false;
    return r.width > 1 && r.height > 1 && onCanvas && !el.closest("[inert], [aria-hidden='true']");
  };
  const off = (el) => el.matches(":disabled") || el.getAttribute("aria-disabled") === "true";
  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  };
  const indexed = (els) => {
    const index = new Map(els.map((el, i) => [el, i]));
    const ancestors = (el) => {
      const up = [];
      for (let p = el.parentElement; p; p = p.parentElement)
        if (index.has(p)) up.push(index.get(p));
      return up;
    };
    return { ancestors };
  };

  const doc = document.documentElement;
  const wide = [...document.querySelectorAll("body *")].filter(
    (el) => el.scrollWidth - el.clientWidth > tolerance,
  );
  const boxTree = indexed(wide);
  // The descendant reaching furthest right (the deepest on a tie) — only for boxes that can leak.
  const culpritOf = (el) => {
    let best = null;
    let right = el.getBoundingClientRect().right;
    for (const d of el.querySelectorAll("*")) {
      const r = d.getBoundingClientRect();
      if (r.width > 0 && r.right >= right) [best, right] = [d, r.right];
    }
    return best && { name: nameOf(best), text: firstLine(best).slice(0, 80) };
  };
  const boxes = wide.map((el, i) => {
    const overflowX = getComputedStyle(el).overflowX;
    return {
      i,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      overflowX,
      name: nameOf(el),
      text: firstLine(el).slice(0, 80),
      culprit: overflowX === "visible" ? culpritOf(el) : null,
      ancestors: boxTree.ancestors(el),
    };
  });

  // Boxes hung off the left edge. The visible left is clipped by every inner overflow-x box (a
  // ticker translating its row left inside a clipped strip is fine); body and html are not walked,
  // because their clip IS the screen edge this check is about. Words or a control only — a
  // decorative glow bleeding past the edge loses nothing.
  const visible = (el) => {
    if (el.getClientRects().length === 0) return false;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.opacity === "0") return false;
    if (el.checkVisibility && !el.checkVisibility()) return false;
    return !el.closest("[inert], [aria-hidden='true']");
  };
  const CONTROLS = "a, button, input, select, textarea, [role=button], [role=tab], [role=link]";
  const extentOf = (el) => {
    const r = el.getBoundingClientRect();
    let left = r.left;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement)
      if (getComputedStyle(p).overflowX !== "visible")
        left = Math.max(left, p.getBoundingClientRect().left);
    return { left: left + window.scrollX, right: r.right + window.scrollX, width: r.width };
  };
  const hungEls = [];
  const extents = new Map();
  for (const el of document.querySelectorAll("body *")) {
    if (el.getBoundingClientRect().left >= -tolerance) continue;
    const ext = extentOf(el);
    if (ext.width <= 1 || ext.left >= -tolerance || ext.right <= 0 || !visible(el)) continue;
    const carries = firstLine(el) || el.matches(CONTROLS) || el.querySelector(CONTROLS);
    if (!carries) continue;
    hungEls.push(el);
    extents.set(el, ext);
  }
  const hungTree = indexed(hungEls);
  const lefts = hungEls.map((el, i) => ({
    i,
    left: extents.get(el).left,
    right: extents.get(el).right,
    name: nameOf(el),
    text: (firstLine(el) || labelOf(el)).slice(0, 80),
    ancestors: hungTree.ancestors(el),
  }));

  const targetEls = [
    ...document.querySelectorAll(
      "a, button, input, select, textarea, [role=button], [role=tab], [role=link], summary",
    ),
  ].filter((el) => shown(el) && !off(el) && !(el.tagName === "INPUT" && el.type === "hidden"));
  const targetTree = indexed(targetEls);
  const targets = targetEls.map((el, i) => {
    const s = getComputedStyle(el);
    const host = el.parentElement?.closest("p, li, td");
    return {
      i,
      tag: el.tagName.toLowerCase(),
      type: el.tagName === "INPUT" ? el.type : "",
      appearance: s.appearance,
      display: s.display,
      hostText: host ? text(host) : "",
      ownText: text(el),
      desc: describe(el),
      label: labelOf(el).slice(0, 80),
      rect: rectOf(el),
      ancestors: targetTree.ancestors(el),
    };
  });

  const inputs = [...document.querySelectorAll("input, textarea, select")]
    .filter((el) => shown(el) && !off(el))
    .map((el) => ({
      tag: el.tagName.toLowerCase(),
      type: el.tagName === "INPUT" ? el.type : "",
      fontSize: Number.parseFloat(getComputedStyle(el).fontSize),
      desc: describe(el),
      label: labelOf(el).slice(0, 80),
    }));

  return {
    innerWidth: window.innerWidth,
    scrollWidth: doc.scrollWidth,
    boxes,
    lefts,
    targets,
    inputs,
  };
}

/** The five phone checks on the page as it stands. Never throws past the page's own errors. */
export async function probePhone(page) {
  return phoneFindings(await page.evaluate(snapshot, TOLERANCE));
}
