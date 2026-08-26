/**
 * COLLECTIONS (`/collections`) — the browse surface for the two house catalogs.
 *
 * Discovery organised around narratives ("Against the Crowd", "Ahead of the Print") rather than an
 * alphabetical roster: a member only ever met a persona by stumbling onto its desk card, and the
 * plays had no reader-facing surface at all. Two pages, both pure renderers over derived data:
 *
 *   /collections        — the shelves, each with its members' names above the fold
 *   /collections/:id    — one shelf: what membership MEANS, then every member with its receipt
 *
 * Honesty invariants. Every shelf states its `claim` — the mechanical rule that put those members
 * there — so an evocative name can never oversell the strategy. Every member carries the verbatim
 * evidence the probe observed. And nothing here re-renders persona detail: a persona links out to
 * the live desk running it, a play to the study it cites, and when no desk is running a persona
 * that renders as an explicit absence, never a dead link or an invented one.
 */
import type { CatalogKind, Collection, CollectionMember } from "../discovery/collection.js";
import { escapeHtml } from "../ui/escape-html.js";
import { type NavContext, renderShell } from "./dashboard-shell.js";
import { profileHref, tile } from "./render-atoms.js";

/** A live desk running a persona — the existing view a member row links to. */
export interface DeskLink {
  readonly participantId: string;
  readonly displayName: string;
}

/** personaId → the desk running it. Empty when the server has no participants wired. */
export type DeskIndex = ReadonlyMap<string, DeskLink>;

export interface CollectionsIndexOptions {
  readonly nav?: NavContext;
  readonly asOfIso: string;
  readonly collections: readonly Collection[];
  /** Catalog entries no shelf claimed — rendered as a named gap, never dropped. */
  readonly unshelved: readonly CollectionMember[];
  readonly desks?: DeskIndex;
}

export interface CollectionPageOptions {
  readonly nav?: NavContext;
  readonly asOfIso: string;
  readonly collection: Collection;
  readonly desks?: DeskIndex;
}

const LEDE =
  "Every shelf below is <em>derived</em>, never hand-listed: each bot is run against a hand-built tape and each play is walked day by day around a synthetic earnings date, so what you read here is what the code actually does. Retune a bot and its shelves move with it.";

const kindBadge = (member: CollectionMember): string =>
  member.kind === "persona"
    ? `<span class="cx-kind cx-bot">BOT</span>`
    : `<span class="cx-kind cx-play">PLAY</span>`;

/** The member's link OUT to its existing detail view — or the honest absence when there isn't one. */
function memberLink(member: CollectionMember, desks: DeskIndex): string {
  if (member.kind === "playbook") {
    return member.href
      ? `<a class="cx-go" href="${escapeHtml(member.href)}">the study behind it →</a>`
      : `<span class="cx-absent">no research citation on this play</span>`;
  }
  const desk = desks.get(member.id);
  return desk
    ? `<a class="cx-go" href="${profileHref(desk.participantId)}">${escapeHtml(desk.displayName)}'s desk →</a>`
    : `<span class="cx-absent">no desk is running this persona right now</span>`;
}

function memberRow(member: CollectionMember, desks: DeskIndex): string {
  const lore = member.lore ? `<p class="cx-lore">${escapeHtml(member.lore)}</p>` : "";
  return `<li class="cx-row">
    <div class="cx-rowhead">${kindBadge(member)}<span class="cx-name">${escapeHtml(member.name)}</span>${memberLink(member, desks)}</div>
    <p class="cx-thesis">${escapeHtml(member.thesis)}</p>
    ${lore}
    <p class="cx-evidence"><span class="cx-eyebrow">observed</span>${escapeHtml(member.evidence)}</p>
  </li>`;
}

function shelfCard(collection: Collection): string {
  const names =
    collection.members.map((m) => `<span class="cx-chip">${escapeHtml(m.name)}</span>`).join("") ||
    `<span class="cx-absent">nothing on this shelf yet</span>`;
  const count = collection.members.length;
  return `<a class="cx-card" href="/collections/${escapeHtml(collection.id)}">
    <span class="cx-cardhead"><span class="cx-cardname">${escapeHtml(collection.name)}</span><span class="cx-count">${count} ${count === 1 ? "entry" : "entries"}</span></span>
    <span class="cx-blurb">${escapeHtml(collection.blurb)}</span>
    <span class="cx-chips">${names}</span>
  </a>`;
}

function countOf(collections: readonly Collection[], kind: CatalogKind): number {
  const ids = new Set(
    collections.flatMap((c) => c.members.filter((m) => m.kind === kind).map((m) => m.id)),
  );
  return ids.size;
}

/** The gap section — present only when something really is unshelved (absence renders ABSENT). */
function unshelvedSection(members: readonly CollectionMember[], desks: DeskIndex): string {
  if (members.length === 0) {
    return `<p class="cx-allfiled">Every registered bot and play currently lands on at least one shelf.</p>`;
  }
  return `<section class="cx-sec"><h2>Not on a shelf</h2>
    <p class="cx-sub">Registered, but no shelf probe recognised its behaviour. Listed here rather than dropped — a gap you can see is a gap someone can close.</p>
    <ul class="cx-rows">${members.map((m) => memberRow(m, desks)).join("\n")}</ul></section>`;
}

export function renderCollectionsIndexBody(options: CollectionsIndexOptions): string {
  const { collections, asOfIso } = options;
  const desks = options.desks ?? new Map<string, DeskLink>();
  const content = `${CX_STYLE}
  <div class="cx">
    <div class="ladder-head"><div>
      <h1 class="view-title">Collections</h1>
      <p class="view-sub">${LEDE}</p>
    </div></div>
    <div class="summary">
      ${tile("Shelves", String(collections.length), { lead: true })}
      ${tile("Bots", String(countOf(collections, "persona")))}
      ${tile("Plays", String(countOf(collections, "playbook")))}
    </div>
    <div class="cx-cards">${collections.map(shelfCard).join("\n")}</div>
    ${unshelvedSection(options.unshelved, desks)}
  </div>
  <footer class="obs-foot">Browse only — no order originates on this page. Educational · paper trading only.</footer>`;
  return renderShell(options.nav, content, asOfIso);
}

export function renderCollectionBody(options: CollectionPageOptions): string {
  const { collection, asOfIso } = options;
  const desks = options.desks ?? new Map<string, DeskLink>();
  const rows =
    collection.members.map((m) => memberRow(m, desks)).join("\n") ||
    `<li class="cx-row"><span class="cx-absent">Nothing on this shelf right now.</span></li>`;
  const content = `${CX_STYLE}
  <div class="cx">
    <p class="cx-crumb"><a href="/collections">← collections</a></p>
    <div class="ladder-head"><div>
      <h1 class="view-title">${escapeHtml(collection.name)}</h1>
      <p class="view-sub">${escapeHtml(collection.blurb)}</p>
    </div></div>
    <section class="cx-claim">
      <span class="cx-eyebrow">how membership was decided</span>
      <p>${escapeHtml(collection.claim)}</p>
    </section>
    <ul class="cx-rows">${rows}</ul>
  </div>
  <footer class="obs-foot">Browse only — no order originates on this page. Educational · paper trading only.</footer>`;
  return renderShell(options.nav, content, asOfIso);
}

/** Collections styles — kept in this module, like every other view's stylesheet (size doctrine). */
const CX_STYLE = `<style>
  .cx{ display:flex; flex-direction:column; gap:14px; max-width:var(--col-wide); }
  .cx a{ color:var(--accent); text-decoration:none; border-bottom:1px solid color-mix(in srgb,var(--accent) 35%,transparent); }
  .cx a:hover{ border-bottom-color:var(--accent); }
  .cx-crumb{ font-size:12.5px; margin:0; }
  .cx-cards{ display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:12px; }
  .cx-card{ display:flex; flex-direction:column; gap:8px; padding:14px 16px; background:var(--surface);
    border:1px solid var(--border); border-radius:14px; border-bottom-width:1px; }
  .cx-card:hover{ border-color:color-mix(in srgb,var(--accent) 55%,var(--border)); }
  .cx-cardhead{ display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
  .cx-cardname{ font-size:15px; font-weight:700; color:var(--text); }
  .cx-count{ font-family:var(--mono); font-size:10px; letter-spacing:.08em; color:var(--muted); white-space:nowrap; }
  .cx-blurb{ font-size:12.5px; line-height:1.55; color:var(--muted); }
  .cx-chips{ display:flex; flex-wrap:wrap; gap:5px; }
  .cx-chip{ font-family:var(--mono); font-size:10.5px; color:var(--accent); border:1px solid color-mix(in srgb,var(--accent) 35%,var(--border));
    border-radius:6px; padding:1px 6px; }
  .cx-claim{ background:color-mix(in srgb,var(--accent) 8%,var(--surface)); border:1px solid color-mix(in srgb,var(--accent) 45%,var(--border));
    border-radius:14px; padding:10px 16px 4px; }
  .cx-claim p{ margin:2px 0 8px; font-size:13px; line-height:1.6; max-width:88ch; }
  .cx-eyebrow{ display:block; font-family:var(--mono); font-size:9.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--accent); }
  .cx-sec{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:16px 20px 12px; }
  .cx-sec h2{ margin:0 0 4px; font-size:14px; }
  .cx-sub{ margin:0 0 10px; font-size:12px; color:var(--muted); max-width:74ch; }
  .cx-rows{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; }
  .cx-row{ background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:12px 16px; }
  .cx-rowhead{ display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
  .cx-name{ font-size:14.5px; font-weight:700; }
  .cx-kind{ font-family:var(--mono); font-size:9px; letter-spacing:.12em; border-radius:5px; padding:1px 6px; }
  .cx-bot{ color:var(--accent); border:1px solid color-mix(in srgb,var(--accent) 45%,var(--border)); }
  .cx-play{ color:var(--muted); border:1px solid var(--border); }
  .cx-go{ font-size:12px; margin-left:auto; }
  .cx-absent{ font-size:11.5px; color:var(--muted); font-style:italic; margin-left:auto; }
  .cx-thesis{ margin:6px 0 0; font-size:13px; line-height:1.55; max-width:84ch; }
  .cx-lore{ margin:5px 0 0; font-size:12.5px; line-height:1.6; color:var(--muted); max-width:84ch; }
  .cx-evidence{ margin:8px 0 0; font-family:var(--mono); font-size:11px; line-height:1.5; color:var(--muted);
    border-left:2px solid color-mix(in srgb,var(--accent) 45%,var(--border)); padding-left:10px; }
  .cx-allfiled{ font-size:12px; color:var(--muted); margin:0; }
</style>`;
