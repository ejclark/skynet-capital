// The pure half of the machine census (#4943) — which accessibility-tree nodes are controls, which
// screens a page has, what counts as "in the viewport", the cap, the controls that would leave the
// app, and the census's own findings. census.mjs measures in the browser; every decision it acts
// on is made here, so it is specced without one (tests/scripts/study-census.spec.ts).
//
// Area-agnostic: roles, rects, URLs and names — never a surface. The world's own surfaces list
// names the routes (`routesFor`); nothing here picks a control.

/** Chromium's accessibility roles (CDP `Accessibility.getFullAXTree`, lower-cased) that a member
 *  operates: tapped, toggled, typed into or opened. */
export const CONTROL_ROLES = new Set([
  "button",
  "togglebutton",
  "popupbutton",
  "disclosuretriangle",
  "link",
  "tab",
  "checkbox",
  "radio",
  "switch",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "treeitem",
  "combobox",
  "listbox",
  "textbox",
  "textfield",
  "searchbox",
  "slider",
  "spinbutton",
]);

/** Roles that own their descendants' operation: a native select's options are not separate taps. */
const OWNING_ROLES = new Set(["combobox", "listbox", "menulistpopup", "popupbutton"]);

/** The default cap on controls operated per route — anything past it is logged, never silent. */
export const DEFAULT_CAP = 60;

const squash = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
const lower = (r) => String(r ?? "").toLowerCase();

/** The unique routes a world's surfaces list names for one viewer, in list order. */
export function routesFor(surfaces, viewer) {
  const out = [];
  for (const s of surfaces) {
    if (s.viewer !== viewer || s.struck || out.includes(s.route)) continue;
    out.push(s.route);
  }
  return out;
}

/**
 * The routes a world names for this viewer only through struck surfaces — left out of the census,
 * and said so: `[{route, why}]`.
 */
export function struckRoutes(surfaces, viewer) {
  const live = new Set(routesFor(surfaces, viewer));
  const out = [];
  for (const s of surfaces) {
    if (s.viewer !== viewer || !s.struck || live.has(s.route)) continue;
    if (!out.some((r) => r.route === s.route)) out.push({ route: s.route, why: s.struck });
  }
  return out;
}

/**
 * The accessibility tree in document order (depth-first from the root) — CDP returns nodes in no
 * promised order. Each node: `{backendId, role, name, ignored, owned}`, `owned` when an ancestor
 * owns its operation (an option inside a closed select).
 * @param {{nodeId: string, parentId?: string, childIds?: string[], ignored?: boolean,
 *          role?: {value: string}, name?: {value: string}, backendDOMNodeId?: number}[]} nodes
 */
export function treeOrder(nodes) {
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const roots = nodes.filter((n) => !(n.parentId && byId.has(n.parentId)));
  const out = [];
  const stack = roots.reverse().map((n) => ({ n, owned: false }));
  while (stack.length > 0) {
    const { n, owned } = stack.pop();
    const role = lower(n.role?.value);
    out.push({
      backendId: n.backendDOMNodeId ?? null,
      role,
      name: squash(n.name?.value),
      ignored: Boolean(n.ignored),
      owned,
    });
    const owns = owned || (!n.ignored && OWNING_ROLES.has(role));
    const kids = (n.childIds ?? []).map((id) => byId.get(id)).filter(Boolean);
    for (let i = kids.length - 1; i >= 0; i--) stack.push({ n: kids[i], owned: owns });
  }
  return out;
}

/** The operable controls and the headings, in tree order. */
export function axPick(ordered) {
  const live = ordered.filter((n) => !n.ignored && n.backendId !== null);
  return {
    controls: live.filter((n) => CONTROL_ROLES.has(n.role) && !n.owned),
    headings: live.filter((n) => n.role === "heading" && n.name),
  };
}

/** A walk never takes more screens than this — a page that keeps growing is cut off, and says so. */
export const MAX_SCREENS = 40;

/**
 * Where a member walking the page screen by screen stops next: one viewport further down, clamped
 * to the bottom — or null when this screen already reached the bottom. Asked after every screen,
 * so a page that grows as it is scrolled (a lazy section) is walked to its new end.
 * @param {number} at  the scroll position the page actually took
 * @param {{scrollHeight: number, innerHeight: number}} extent  measured at that position
 */
export function nextScreen(at, { scrollHeight, innerHeight }) {
  const maxY = Math.max(0, Math.round(scrollHeight - innerHeight));
  if (at >= maxY - 1) return null;
  return Math.min(at + innerHeight, maxY);
}

/** A measured box (already cut to its clipping ancestors) is on screen when any of it is inside
 *  the viewport and the browser says it is shown. */
export function onScreen(m, viewport) {
  if (!(m?.shown && m.box)) return false;
  const { left, top, width, height } = m.box;
  if (!(width > 0 && height > 0)) return false;
  return left < viewport.width && left + width > 0 && top < viewport.height && top + height > 0;
}

/**
 * A control no screen of the walk showed, after the walk scrolled it into view (the page and
 * every box it sits in, sideways too):
 *  - `reached` — on screen now: a member gets there by swiping a scroller, so it is listed;
 *  - `clipped` — a box a member cannot scroll (`overflow: hidden`) keeps it out of view, or only
 *    a script's scroll of such a box showed it: a finding, never operated;
 *  - `offscreen` — still nowhere on screen (placed off the page until focused, a skip link).
 */
export function reachVerdict(m, viewport, forced) {
  if (!m || m.gone || !m.shown) return "offscreen";
  if (forced || (m.clipped && !onScreen(m, viewport))) return "clipped";
  return onScreen(m, viewport) ? "reached" : "offscreen";
}

/**
 * The walk screen a reached control belongs to: the first whose viewport holds its top in the
 * document (`starts` are the screens' scroll positions), else the nearest one.
 */
export function screenFor(docY, starts, innerHeight) {
  const at = starts.findIndex((y) => docY >= y && docY < y + innerHeight);
  if (at >= 0) return at;
  let best = 0;
  starts.forEach((y, i) => {
    if (Math.abs(y - docY) < Math.abs(starts[best] - docY)) best = i;
  });
  return best;
}

/** Where to tap a control: the centre of its part inside the viewport, rounded to the pixel. */
export function tapPoint(box, viewport) {
  const l = Math.max(box.left, 0);
  const t = Math.max(box.top, 0);
  const r = Math.min(box.left + box.width, viewport.width - 1);
  const b = Math.min(box.top + box.height, viewport.height - 1);
  if (r <= l || b <= t) return null;
  return { x: Math.round((l + r) / 2), y: Math.round((t + b) / 2) };
}

/**
 * Why operating this control would leave the app, or null. A link off the app's origin, a
 * non-web scheme (mailto:, tel:, javascript:) or a download leaves; a same-origin link stays.
 * @param {{href?: string|null, download?: boolean}} link
 */
export function leaveReason(link, origin) {
  if (!link?.href) return null;
  if (link.download) return "starts a download";
  let url;
  try {
    url = new URL(link.href, origin);
  } catch {
    return `an unreadable link (${squash(link.href).slice(0, 60)})`;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    return `opens ${url.protocol} outside the app`;
  if (url.origin !== new URL(origin).origin) return `leaves the app for ${url.host}`;
  return null;
}

/** A control's identity on a page: role, name and its occurrence among same-named ones. */
export function keyed(controls) {
  const seen = new Map();
  return controls.map((c) => {
    const base = `${c.role}|${c.name}`;
    const nth = seen.get(base) ?? 0;
    seen.set(base, nth + 1);
    return { ...c, nth, key: `${base}|${nth}` };
  });
}

/** Keep the first `cap` controls (tree order); the rest are returned so they can be logged. */
export function capControls(controls, cap = DEFAULT_CAP) {
  const n = Number.isInteger(cap) && cap > 0 ? cap : DEFAULT_CAP;
  return { kept: controls.slice(0, n), dropped: controls.slice(n) };
}

/**
 * Of several same-named candidates on a fresh load, the one nearest where the walk saw the
 * control (document coordinates). Null when there is none.
 */
export function nearest(candidates, want) {
  let best = null;
  for (const c of candidates) {
    if (!c.doc) continue;
    const d = Math.abs(c.doc.y - want.y) + Math.abs(c.doc.x - want.x);
    if (!best || d < best.d) best = { ...c, d };
  }
  return best;
}

/** The census's own findings on one operated control, in the probe-finding shape. */
export function censusFindings({ name, role, cover, operated, reach }) {
  const out = [];
  const label = name || `(unnamed ${role})`;
  if (!name) {
    out.push({
      kind: "unnamed-control",
      what: `a ${role} has no accessible name`,
      snippet: "",
      severity: "medium",
      fix: "name it (visible text or aria-label)",
    });
  }
  if (cover && !cover.inside) {
    out.push({
      kind: "control-covered",
      what: `the centre of "${label}" is covered by ${cover.by || "another element"}`,
      snippet: name,
      severity: "high",
      fix: "keep overlays off the control, or move it clear",
    });
  }
  if (reach === "clipped") {
    out.push({
      kind: "control-clipped",
      what: `"${label}" sits in a box that cannot be scrolled, out of view`,
      snippet: name,
      severity: "high",
      fix: "let the box scroll (overflow: auto) or bring the control inside it",
    });
  }
  if (operated === "not-found") {
    out.push({
      kind: "control-unstable",
      what: `"${label}" was not on a fresh load where the walk saw it`,
      snippet: name,
      severity: "low",
      fix: "check what renders it late or conditionally",
    });
  }
  return out;
}

/** `/app/page?item=x&tab=y` → `app-page-item-x-tab-y` (a folder name). */
export function routeSlug(route) {
  return (
    String(route)
      .replace(/^\/+/, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "root"
  );
}

const USAGE =
  "usage: census.mjs --run <compose dir> --world <name> --viewer <who> --out <fresh dir>" +
  " [--viewport phone,desktop] [--cap 60] [--route <path> …  (replaces the world's routes)]";

/** Parse the census CLI. Viewports default to both frames; `--route` (repeatable) replaces the
 *  world's list with the paths given — any path of the app, a route outside the list included. */
export function censusArgs(argv) {
  const out = { viewports: ["phone", "desktop"], cap: DEFAULT_CAP, routes: [] };
  for (let i = 0; i < argv.length; i += 2) {
    const [flag, value] = [argv[i], argv[i + 1]];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`${flag} needs a value\n${USAGE}`);
    if (flag === "--run") out.run = value;
    else if (flag === "--world") out.world = value;
    else if (flag === "--viewer") out.viewer = value;
    else if (flag === "--out") out.out = value;
    else if (flag === "--route") out.routes.push(value);
    else if (flag === "--viewport") out.viewports = value.split(",").filter(Boolean);
    else if (flag === "--cap") out.cap = Number(value);
    else throw new Error(`unknown flag ${flag}\n${USAGE}`);
  }
  for (const k of ["run", "world", "viewer", "out"]) {
    if (!out[k]) throw new Error(`--${k} is required\n${USAGE}`);
  }
  if (!(Number.isInteger(out.cap) && out.cap > 0))
    throw new Error("--cap must be a positive integer");
  const bad = out.viewports.filter((v) => v !== "phone" && v !== "desktop");
  if (bad.length > 0 || out.viewports.length === 0)
    throw new Error(`--viewport: phone and/or desktop`);
  return out;
}

/**
 * The walk's controls in tree order: the order of the last tree read for those it still holds,
 * then any it no longer holds (rendered on one screen only) in the order they were found.
 * @param {{backendId: number}[]} found  in discovery order
 * @param {number[]} lastRead            backend ids of the last read, in tree order
 */
export function walkOrder(found, lastRead) {
  const pos = new Map(lastRead.map((id, i) => [id, i]));
  const held = found.filter((c) => pos.has(c.backendId));
  held.sort((a, b) => pos.get(a.backendId) - pos.get(b.backendId));
  return [...held, ...found.filter((c) => !pos.has(c.backendId))];
}
