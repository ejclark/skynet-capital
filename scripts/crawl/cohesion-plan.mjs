// The pure half of the cohesion census (#8005 slice 1) — text in, rows out, no file or git access,
// so tests/scripts/crawl-cohesion.spec.ts drives every rule over fixture strings. The impure half
// (`cohesion.mjs`) reads the repo and hands these functions its text.
//
// Five measures, each the scorecard row of plan #8005 that needs no model:
//   1. label collisions — one word naming places in different IA groups, one place under many words
//   2. concepts with more than one home — docs/IA.md §2f's concepts × the screens that hold them
//   3. links that drop the key — a door into a keyed page that lands keyless while its source holds
//      the key (#7167, docs/IA.md §3)
//   4. member-facing features with no IA home — screens triage.json places nowhere, parts added since
//      the study that docs/IA.md never cites, and member routes the server serves that nothing reads
//   5. open IA ledger rows — docs/IA.md §10

/** The IA's groups, slug → its §5 heading number. `home` in triage.json is one of these slugs, or
 *  `pre-auth` for a page a signed-out visitor sees (the IA models a signed-in member only). */
export const HOMES = {
  book: "5.1",
  loop: "5.2",
  workbench: "5.3",
  rd: "5.4",
  ladder: "5.5",
  me: "5.6",
  league: "5.7",
  shell: "5.8",
  landing: "5.9",
};
export const OUTSIDE_THE_MODEL = "pre-auth";

/** Throws unless every §5 group the HOMES table names still has its heading in docs/IA.md. */
export function checkHomes(iaSrc) {
  for (const [slug, num] of Object.entries(HOMES)) {
    if (!new RegExp(`^### ${num.replace(".", "\\.")} `, "m").test(iaSrc)) {
      throw new Error(`cohesion: docs/IA.md has no "### ${num}" heading for home "${slug}"`);
    }
  }
}

// ── 1. names ────────────────────────────────────────────────────────────────────────────────────

const LEAD_WORDS = new Set(["the", "your", "my", "full", "all", "open", "see", "view", "go", "to"]);
/** Trailing words that say what kind of place it is, not which: "the onboarding page" = "Onboarding". */
const KIND_WORDS = new Set(["page", "section", "tab", "chapter"]);
/** A first word that makes a phrase an action ("Sell these shares", "Connect one in Onboarding"):
 *  a door that says what it does is not a name for where it goes. A one-word door is always a name. */
const ACTION_WORDS = new Set([
  "add",
  "ask",
  "back",
  "buy",
  "change",
  "check",
  "claim",
  "compare",
  "connect",
  "discard",
  "edit",
  "file",
  "find",
  "get",
  "go",
  "hand",
  "hide",
  "learn",
  "link",
  "open",
  "read",
  "run",
  "save",
  "see",
  "sell",
  "set",
  "show",
  "start",
  "subscribe",
  "take",
  "talk",
  "try",
  "use",
  "view",
]);

/** Is this door text a name for a place (a noun phrase of at most three words), not an action? */
export function isName(text) {
  const words = String(text)
    .replace(/&amp;/g, "&")
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w));
  if (words.length === 0) return false;
  if (words.length > 1 && ACTION_WORDS.has(words[0].toLowerCase())) return false;
  return normalizeName(text).split(" ").filter(Boolean).length <= 3;
}

/**
 * A name as a member reads it, folded so two spellings of one word meet: entities decoded, glyphs
 * and punctuation dropped (a `›` or `◆` is a shape, not a word), lower case, leading filler ("the",
 * "your", "open the", "full") dropped, and a plural `s` folded ("Playbooks" = "Playbook"). Empty
 * when nothing word-like is left.
 */
export function normalizeName(text) {
  const words = String(text)
    .replace(/&amp;/g, "&")
    .toLowerCase()
    .replace(/[^a-z0-9&' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  while (words.length > 0 && LEAD_WORDS.has(words[0])) words.shift();
  while (words.length > 1 && KIND_WORDS.has(words[words.length - 1])) words.pop();
  const singular = (w) =>
    w.length > 3 && w.endsWith("s") && !/(ss|is|us)$/.test(w) ? w.slice(0, -1) : w;
  return words.map(singular).join(" ");
}

/** The end of a JSX opening tag that starts at `from` (just past its name): the index of its `>`,
 *  skipping any `>` inside braces or quotes (`activeProps={{ … }}`, an arrow function). */
function tagEnd(src, from) {
  let depth = 0;
  let quote = null;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return i;
  }
  return -1;
}

const lineAt = (src, index) => src.slice(0, index).split("\n").length;

/** The search keys a `search=` attribute names, and whether it keeps the page's own (`...prev`). */
function searchOf(attrs) {
  const at = attrs.indexOf("search=");
  if (at === -1) return { keys: [], keepsPrev: false, values: {}, named: false, opaque: false };
  const body = attrs.slice(at);
  // Only an object literal (`{{ … }}`) or an arrow (`{(prev) => …}`) can be read from the text; a
  // helper's result (`{tradeSearch(…)}`, `{search}`) is opaque, so the link is never judged.
  const opaque = !/^search=\{\s*(\{|\(|\w+\s*=>)/.test(body);
  const keepsPrev = /\.\.\.\w+/.test(body.slice(0, 400));
  const values = {};
  const keys = [];
  for (const m of body.matchAll(/(?:[{,]\s*)(\w+)\s*(?::\s*("([^"]*)"|[^,}]+))?(?=\s*[,}])/g)) {
    if (m[1] === "search" || m[1] === "prev") continue;
    keys.push(m[1]);
    if (m[3] !== undefined) values[m[1]] = m[3];
  }
  return { keys, keepsPrev, values, named: true, opaque };
}

/**
 * Every in-app link in a TSX source whose target is a literal path: `<Link to="/x" …>` and
 * `<a href="/app/x…">`. Each carries its target, the search keys it names (or `keepsPrev` when it
 * spreads the page's own), its hash, its line, and `text` — its children when they are plain words
 * (a hidden glyph span allowed), else null: a sentence or an expression is not a name.
 */
export function scanLinks(src) {
  const out = [];
  for (const m of src.matchAll(/<(Link|a)\b/g)) {
    const end = tagEnd(src, m.index + m[0].length);
    if (end === -1) continue;
    const attrs = src.slice(m.index + m[0].length, end);
    const target = linkTarget(m[1], attrs);
    if (!target) continue;
    const search = searchOf(attrs);
    out.push({
      ...target,
      keys: [...search.keys, ...Object.keys(target.urlSearch)],
      values: { ...search.values, ...target.urlSearch },
      keepsPrev: search.keepsPrev,
      hasSearch: search.named,
      opaque: search.opaque,
      text: linkText(src, m[1], attrs, end),
      line: lineAt(src, m.index),
    });
  }
  return out.map(({ urlSearch, ...rest }) => rest);
}

/** A link's literal target: `{ to, hash, urlSearch }`, or undefined when it is not a literal
 *  in-app path. A hash built by the house's helper (`hash={positionAnchor(symbol)}`) counts. */
function linkTarget(tag, attrs) {
  if (tag === "Link") {
    const to = attrs.match(/\bto="([^"]+)"/)?.[1];
    if (!to?.startsWith("/")) return undefined;
    const hash =
      attrs.match(/\bhash="([^"]+)"/)?.[1] ??
      (/\bhash=\{[^}]*(positionAnchor|pos-)/.test(attrs) ? "pos-" : "");
    return { to, hash, urlSearch: {} };
  }
  const href = attrs.match(/\bhref="(\/app\/[^"]*)"/)?.[1];
  if (!href) return undefined;
  const u = new URL(href, "http://x");
  return {
    to: u.pathname.replace(/^\/app/, "") || "/",
    hash: u.hash.replace(/^#/, ""),
    urlSearch: Object.fromEntries(u.searchParams),
  };
}

/** A link's words when its children are plain words (a hidden glyph span allowed) of at most four
 *  words, else null: a sentence or an expression is not a name. */
function linkText(src, tag, attrs, end) {
  if (attrs.trimEnd().endsWith("/")) return null;
  const close = src.indexOf(tag === "Link" ? "</Link>" : "</a>", end);
  const inner = close === -1 ? "" : src.slice(end + 1, close);
  const plain = inner.replace(/<span aria-hidden="true">[^<]*<\/span>/g, " ").trim();
  return plain && !/[<{]/.test(plain) && plain.split(/\s+/).length <= 4 ? plain : null;
}

/** `const NAME… = { a: "A", b: "B" }` or `{ a: { …, label: "A" } }` → `{ a: "A", b: "B" }`. */
export function parseLabelRecord(src, name) {
  const head = new RegExp(`(?:const|let|var)\\s+${name}\\b[^=]*=\\s*\\{`).exec(src);
  if (head === null) throw new Error(`cohesion: no ${name} record parsed`);
  // The value's own brace — never one inside the type annotation before the `=`.
  const open = head.index + head[0].length - 1;
  let depth = 0;
  let close = open;
  for (; close < src.length; close++) {
    if (src[close] === "{") depth++;
    else if (src[close] === "}" && --depth === 0) break;
  }
  const body = src.slice(open + 1, close);
  const out = {};
  for (const m of body.matchAll(/(\w+):\s*(?:"([^"]+)"|\{[^}]*\blabel:\s*"([^"]+)"[^}]*\})/g)) {
    out[m[1]] = m[2] ?? m[3];
  }
  if (Object.keys(out).length === 0) throw new Error(`cohesion: ${name} parsed empty`);
  return out;
}

/** Moneypenny's place list (`src/companion/places.ts` PLACES): `[{ path, name }]`. */
export function parsePlaces(src) {
  const out = [...src.matchAll(/\{\s*path:\s*"([^"]+)",\s*name:\s*"([^"]+)"/g)].map((m) => ({
    path: m[1],
    name: m[2],
  }));
  if (out.length === 0) throw new Error("cohesion: no PLACES parsed from places.ts");
  return out;
}

/**
 * The two collision kinds over named places. `names` is `[{ word (normalized), raw, place, level,
 * home, source }]` — `level` is "page" (a tab, a door to a page, her place name) or "screen" (a
 * section, a window, a chapter, a door that names one), so a page's tab and its default section
 * are never compared. One word for many places: a word whose places sit in two or more IA groups.
 * One place under many words: a place named two or more different words at one level.
 */
export function labelCollisions(names) {
  const byWord = new Map();
  const byPlace = new Map();
  for (const n of names) {
    if (!n.word) continue;
    if (!byWord.has(n.word)) byWord.set(n.word, []);
    byWord.get(n.word).push(n);
    const pk = `${n.level}:${n.place}`;
    if (!byPlace.has(pk)) byPlace.set(pk, []);
    byPlace.get(pk).push(n);
  }
  const oneWordManyPlaces = [];
  for (const [word, list] of byWord) {
    const homes = new Set(list.map((n) => n.home ?? "no home"));
    if (homes.size < 2) continue;
    const places = [...new Set(list.map((n) => n.place))];
    oneWordManyPlaces.push({ word, homes: [...homes].sort(), places, names: list });
  }
  const onePlaceManyWords = [];
  for (const list of byPlace.values()) {
    const words = [...new Set(list.map((n) => n.word))];
    if (words.length < 2) continue;
    onePlaceManyWords.push({
      place: list[0].place,
      level: list[0].level,
      words: words.sort(),
      names: list,
    });
  }
  oneWordManyPlaces.sort((a, b) => b.homes.length - a.homes.length || (a.word < b.word ? -1 : 1));
  onePlaceManyWords.sort((a, b) => b.words.length - a.words.length || (a.place < b.place ? -1 : 1));
  return { oneWordManyPlaces, onePlaceManyWords };
}

// ── 2. concepts ─────────────────────────────────────────────────────────────────────────────────

/** The section of a markdown doc under `## <num>.` or `### <num> ` up to the next heading of the
 *  same or a higher level. */
export function sectionOf(src, heading) {
  const lines = src.split("\n");
  const at = lines.findIndex((l) => l.startsWith(heading));
  if (at === -1) return "";
  const level = heading.match(/^#+/)[0].length;
  const end = lines.findIndex(
    (l, i) => i > at && /^#+ /.test(l) && l.match(/^#+/)[0].length <= level,
  );
  return lines.slice(at, end === -1 ? undefined : end).join("\n");
}

/** A markdown table's body rows as cell arrays (header and the `---` rule dropped). */
export function tableRows(block) {
  return block
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|[\s:|-]+\|$/.test(l.trim()))
    .slice(1)
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/g, "")
        .split(/(?<!\\)\|/)
        .map((c) => c.trim()),
    );
}

const ticks = (cell) => [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

/**
 * docs/IA.md §2f's concepts: `[{ id, words, screens }]` — the id is the first cell's backticked
 * slug, the words the second cell, and the screens every backticked screen key in the last cell.
 */
export function parseConcepts(iaSrc) {
  const rows = tableRows(sectionOf(iaSrc, "### 2f."));
  if (rows.length === 0) throw new Error("cohesion: docs/IA.md §2f holds no concept rows");
  return rows.map((cells) => ({
    id: ticks(cells[0])[0] ?? cells[0],
    words: cells[1],
    screens: ticks(cells[cells.length - 1]),
  }));
}

/** Each concept's homes through its screens' triage homes; throws on a screen no triage row has. */
export function conceptHomes(concepts, homeOf) {
  return concepts.map((c) => {
    for (const s of c.screens) {
      if (!homeOf.has(s))
        throw new Error(`cohesion: concept ${c.id} names ${s}, which triage.json does not have`);
    }
    const homes = [...new Set(c.screens.map((s) => homeOf.get(s) ?? "no home"))].sort();
    return { ...c, homes };
  });
}

// ── 3. links that drop the key ──────────────────────────────────────────────────────────────────

/**
 * The keys a page takes and the search params (or hash prefix) that carry each — docs/IA.md §3. A
 * page whose sections differ lists, per section, the keys that section reads: the viewer-level
 * Milestones and Feedback read none (#888), a bot's Playbooks reads the account and no symbol.
 */
export const KEYED_ROUTES = {
  "/trade": { keys: { symbol: ["symbol"], account: ["desk"] } },
  "/accounts": {
    keys: { account: ["account"], symbol: ["#pos-", "symbol", "q"] },
    sections: {
      overview: ["account", "symbol"],
      ledger: ["account", "symbol"],
      events: ["account"],
      balance: ["account"],
      playbooks: ["account"],
      thesis: ["account"],
      milestones: [],
      feedback: [],
    },
  },
  "/research": {
    keys: { symbol: ["q"], date: ["on", "span", "q"] },
    sections: { board: ["symbol", "date"], coverage: [], playbooks: [] },
  },
  "/activity": { keys: { symbol: ["q"] } },
};

/** The words that mean the code around a link holds that key. */
const HOLDS = {
  symbol: /\bsymbol\b/,
  account: /\b(accountId|participantId|deskId)\b/,
  date: /\b(dateKey|isoDate|eventDate)\b|\.date\b/,
};
/** How far around a link "the code around it" reaches: the component it sits in, roughly. */
const WINDOW = { before: 25, after: 10 };

/**
 * The doors that land keyless: a link to a keyed page that carries none of a key's params while
 * the code around it holds that key. A link that spreads the page's own search keeps everything; a
 * search built by a helper can't be read, so it is never judged; the frame's own tabs (`appLevel`)
 * are app-level destinations and never count. Heuristic by design — each row is a candidate with
 * its file and line, for a person or slice 3's journeys to judge.
 */
export function keyDrops(files, { appLevel = new Set() } = {}) {
  const out = [];
  for (const { file, src, links } of files) {
    if (appLevel.has(file)) continue;
    const lines = src.split("\n");
    for (const l of links) {
      const route = KEYED_ROUTES[l.to];
      if (!route || l.keepsPrev || l.opaque) continue;
      const section = l.values.section ?? Object.keys(route.sections ?? {})[0];
      const accepted = route.sections?.[section] ?? Object.keys(route.keys);
      const near = lines
        .slice(Math.max(0, l.line - 1 - WINDOW.before), l.line + WINDOW.after)
        .join("\n");
      for (const key of accepted) {
        const carriers = route.keys[key];
        const carried = carriers.some((c) =>
          c.startsWith("#") ? l.hash.startsWith(c.slice(1)) : l.keys.includes(c),
        );
        if (!carried && HOLDS[key].test(near))
          out.push({ file, line: l.line, to: l.to, key, text: l.text });
      }
    }
  }
  return out;
}

// ── 4. homeless ─────────────────────────────────────────────────────────────────────────────────

/** Relative imports of a source, resolved against its own path (`.ts`/`.tsx`, no extension). */
export function importsOf(file, src, exists) {
  const dir = file.slice(0, file.lastIndexOf("/"));
  const out = [];
  for (const m of src.matchAll(/from "(\.\.?\/[^"]+)"/g)) {
    const parts = `${dir}/${m[1]}`.split("/");
    const stack = [];
    for (const p of parts) {
      if (p === "..") stack.pop();
      else if (p !== ".") stack.push(p);
    }
    const base = stack.join("/");
    const hit = [".tsx", ".ts", ""].map((e) => base + e).find(exists);
    if (hit) out.push(hit);
  }
  return out;
}

const basename = (f) => f.slice(f.lastIndexOf("/") + 1);
const isRoute = (f) => f.includes("/routes/");

/**
 * The parts added since the study, each placed or homeless. A part is placed when docs/IA.md cites
 * its file name, or cites a part above it (an importer that is not a route — a route is a page, and
 * citing a page is not placing what it newly holds). A part no route reaches is not on screen.
 * `graph` maps file → its imports; `added` is `[{ file, scope }]`.
 */
export function placeParts(added, graph, iaSrc) {
  const importers = new Map();
  for (const [f, deps] of graph)
    for (const d of deps) importers.set(d, [...(importers.get(d) ?? []), f]);
  const cited = (f) => iaSrc.includes(basename(f));
  const reachedFromRoute = (f) => {
    const seen = new Set([f]);
    const queue = [f];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (isRoute(cur)) return true;
      for (const up of importers.get(cur) ?? []) {
        if (seen.has(up)) continue;
        seen.add(up);
        queue.push(up);
      }
    }
    return false;
  };
  const citedAbove = (f) => {
    const seen = new Set([f]);
    const queue = [...(importers.get(f) ?? [])];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (seen.has(cur) || isRoute(cur)) continue;
      seen.add(cur);
      if (cited(cur)) return cur;
      queue.push(...(importers.get(cur) ?? []));
    }
    return undefined;
  };
  return added.map(({ file, scope }) => {
    if (!reachedFromRoute(file)) return { file, scope, status: "not mounted" };
    if (cited(file)) return { file, scope, status: "placed", via: basename(file) };
    const above = citedAbove(file);
    return above
      ? { file, scope, status: "placed", via: basename(above) }
      : { file, scope, status: "homeless" };
  });
}

/** `/api/…` paths in a source's string literals (query and trailing slash dropped). */
export function apiPaths(src) {
  return [
    ...new Set(
      [...src.matchAll(/["'`](\/api\/[a-z0-9/_-]+)/gi)].map((m) => m[1].replace(/\/$/, "")),
    ),
  ];
}

// ── 5. the ledger ───────────────────────────────────────────────────────────────────────────────

const CLOSED = /^(closed|resolved|built|fixed|done|retired|shipped)\b/i;

/** docs/IA.md §10's rows: `[{ id, root, status, open }]`. */
export function ledgerRows(iaSrc) {
  return tableRows(sectionOf(iaSrc, "## 10."))
    .filter((c) => /^U\d+$/.test(c[0]))
    .map((c) => {
      const status = c[c.length - 1].replace(/\*\*/g, "").trim();
      const root = (c[1].match(/\*\*([^*]+)\*\*/)?.[1] ?? c[1]).replace(/\s+—.*$/, "");
      return { id: c[0], root, status, open: !CLOSED.test(status) };
    });
}

// ── the ratchet ─────────────────────────────────────────────────────────────────────────────────

export const MEASURES = [
  "labelCollisions",
  "multiHomeConcepts",
  "keyDrops",
  "homeless",
  "openLedgerRows",
];

/** Each measure against its budget: `{ measure, now, budget, rose }`; a measure with no budget
 *  yet has budget null and never reads as risen. */
export function againstBudget(counts, budget) {
  return MEASURES.map((m) => {
    const b = budget?.[m];
    return {
      measure: m,
      now: counts[m],
      budget: typeof b === "number" ? b : null,
      rose: typeof b === "number" && counts[m] > b,
    };
  });
}

/** The ratchet: each budget falls to the count when the count is lower, and never rises — a new
 *  measure starts at its first count. */
export function lowered(counts, budget) {
  return Object.fromEntries(
    MEASURES.map((m) => [
      m,
      typeof budget?.[m] === "number" ? Math.min(budget[m], counts[m]) : counts[m],
    ]),
  );
}
