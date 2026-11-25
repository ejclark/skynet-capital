// Mermaid model — the parsed diagram as data: its type, its nodes, its edges. `mermaid-lint --ast`
// prints one of these per block; tests/support/diagram.ts hands them to specs.
//
// WHY (plan #3748 slice 7a, #4341). A diagram this repo checks in or posts is a claim: the storybook's
// Rel lines say which container calls which, a plan's state diagram says which transitions exist, a
// held PR's picture says how many changes it carries. The lint already proves a block draws on
// GitHub; it could not say what the block SAYS, so no spec could hold the claim to the code. This
// exports what Mermaid itself parsed, so a parity spec compares two sets of facts instead of
// regex-reading diagram text — the harness slices 7c (generated pictures), 8 (diagram → import
// boundary) and 9 (lifecycle → EARS) build on.
//
// THE SHAPE IS MERMAID'S, READ FROM THE PINNED PACKAGE (11.17.2, 2026-11-24), NEVER GUESSED. Seven
// types expose the same layout model through `db.getData()` (flowchart, state, class, ER,
// requirement, mindmap, kanban) and are read through it, so one reader covers them. Four graph types
// keep their own db and get one small reader each: gitGraph (commits, parent edges), C4 (shapes and
// boundaries, Rel edges), sequence (participants, messages), architecture (services, groups,
// junctions, edges). Everything else — pie, xychart, quadrant, timeline, sankey, block… — is not a
// node/edge picture: it gets `nodes: null, edges: null`, never an empty list, so a spec that asks
// "which nodes?" of a pie fails loudly instead of reading "none" (the loud-failure doctrine).
//
// Labels are Mermaid's own strings: `<br/>`, markdown and entity escapes stay as the author wrote
// them (a requirement edge reads `&lt;&lt;satisfies&gt;&gt;`). A spec compares what it means to
// compare; this file does not interpret.
//
// The db is a per-type singleton that the next getDiagramFromText clears, so a model is read out
// immediately after its own parse and holds no reference into Mermaid.

/** Edge `stroke` on a flowchart — the delta grammar's channel (docs/PICTURES.md: thick = new, dotted
 *  = removed). Read from the layout model's `pattern`, which is Mermaid's own name for it. */
const STROKES = new Set(["normal", "thick", "dotted", "invisible"]);

/** gitGraph commit types, from the pinned db's commitType enum. */
const COMMIT_KIND = ["commit", "reverse", "highlight", "merge", "cherry-pick"];

/** The diagram title from YAML frontmatter, which getDiagramFromText does not apply (render does). */
function frontmatterTitle(source) {
  const fm = /^\s*---\n([\s\S]*?)\n---\n/.exec(source.replace(/\r\n?/g, "\n"))?.[1] ?? "";
  const raw = /^title:\s*(.*)$/m.exec(fm)?.[1]?.trim() ?? "";
  return raw.replace(/^(["'])(.*)\1$/, "$2");
}

/** Drop undefined/empty keys so the JSON reads as the facts, not the schema. */
function compact(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== "" && v !== null),
  );
}

/** Classes Mermaid adds for its own renderer (state and mindmap), never an author's. */
const RENDER_CLASS = /^(?:statediagram|mindmap-node$|section-)/;

/** The class names an author set on a node (`class a new`), without Mermaid's own render classes. */
function authorClasses(css) {
  return String(css ?? "")
    .split(/\s+/)
    .filter((c) => c && c !== "default" && !RENDER_CLASS.test(c));
}

function fromLayoutData(db) {
  const { nodes = [], edges = [] } = db.getData();
  return {
    nodes: nodes.map((n) =>
      compact({
        id: n.id,
        label: n.label,
        shape: n.shape,
        parent: n.parentId,
        group: n.isGroup || undefined,
        classes: authorClasses(n.cssClasses).length ? authorClasses(n.cssClasses) : undefined,
      }),
    ),
    edges: edges.map((e) =>
      compact({
        id: e.id,
        from: e.start,
        to: e.end,
        label: e.label,
        stroke: STROKES.has(e.pattern) ? e.pattern : undefined,
        arrow: e.arrowTypeEnd,
        animate: e.animate || undefined,
      }),
    ),
  };
}

function fromGitGraph(db) {
  const commits = db.getCommitsArray();
  return {
    direction: db.getDirection(),
    branches: db.getBranchesAsObjArray().map((b) => b.name),
    nodes: commits.map((c) =>
      compact({
        id: c.id,
        label: c.message,
        kind: COMMIT_KIND[c.type] ?? String(c.type),
        branch: c.branch,
        tags: c.tags?.length ? c.tags : undefined,
      }),
    ),
    // One edge per parent link, parent → child: a merge commit has two. A commit with no `id:` gets
    // a random one from Mermaid on every parse — a parity spec names the commits it compares.
    edges: commits.flatMap((c) =>
      (c.parents ?? []).map((p) => ({ from: p, to: c.id, kind: "parent" })),
    ),
  };
}

const text = (field) => field?.text ?? (typeof field === "string" ? field : undefined);

function fromC4(db) {
  const boundaries = db
    .getBoundaries()
    .filter((b) => b.alias !== "global")
    .map((b) =>
      compact({
        id: b.alias,
        label: text(b.label),
        kind: `boundary:${String(text(b.type) ?? "").toLowerCase()}`,
        parent: b.parentBoundary === "global" ? undefined : b.parentBoundary,
        group: true,
      }),
    );
  const shapes = db.getC4ShapeArray().map((s) =>
    compact({
      id: s.alias,
      label: text(s.label),
      kind: text(s.typeC4Shape),
      technology: text(s.techn),
      description: text(s.descr),
      parent: s.parentBoundary === "global" ? undefined : s.parentBoundary,
    }),
  );
  return {
    title: db.getTitle() || undefined,
    level: db.getC4Type(),
    nodes: [...boundaries, ...shapes],
    edges: db.getRels().map((r) =>
      compact({
        from: r.from,
        to: r.to,
        label: text(r.label),
        kind: r.type,
        technology: text(r.techn),
      }),
    ),
  };
}

function fromSequence(db) {
  const kinds = Object.fromEntries(Object.entries(db.LINETYPE ?? {}).map(([k, v]) => [v, k]));
  const actors = db.getActors();
  return {
    nodes: [...actors.values()].map((a) =>
      compact({ id: a.name, label: a.description, kind: a.type }),
    ),
    // A message has both ends; notes (a placement), activations and block markers are not edges.
    edges: db
      .getMessages()
      .filter((m) => m.from && m.to && m.placement === undefined)
      .map((m) =>
        compact({
          from: m.from,
          to: m.to,
          label: m.message,
          kind: kinds[m.type]?.toLowerCase(),
        }),
      ),
  };
}

function fromArchitecture(db) {
  const node = (kind) => (n) =>
    compact({ id: n.id, label: n.title, kind, icon: n.icon, parent: n.in });
  return {
    nodes: [
      ...db.getGroups().map((g) => ({ ...node("group")(g), group: true })),
      ...db.getServices().map(node("service")),
      ...db.getJunctions().map(node("junction")),
    ],
    edges: db.getEdges().map((e) =>
      compact({
        from: e.lhsId,
        to: e.rhsId,
        label: e.title,
        fromSide: e.lhsDir,
        toSide: e.rhsDir,
      }),
    ),
  };
}

const READERS = {
  gitGraph: fromGitGraph,
  c4: fromC4,
  sequence: fromSequence,
  architecture: fromArchitecture,
};

/**
 * The parsed model of one diagram source that has already passed `mermaid.parse`.
 * @param {any} mermaid the loaded mermaid default export (mermaid-lint's loadMermaid)
 * @param {string} source the block's text, frontmatter included
 */
export async function diagramModel(mermaid, source) {
  const diagram = await mermaid.mermaidAPI.getDiagramFromText(source);
  const { db, type } = diagram;
  const read =
    READERS[type] ??
    (typeof db.getData === "function" ? fromLayoutData : () => ({ nodes: null, edges: null }));
  const { nodes, edges, ...rest } = read(db);
  const title = rest.title ?? (db.getDiagramTitle?.() || frontmatterTitle(source));
  // nodes/edges go back on after compact(): null is the "not a node/edge picture" answer, kept.
  return { ...compact({ type, ...rest, title }), nodes, edges };
}
