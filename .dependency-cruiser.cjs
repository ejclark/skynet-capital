// Dependency-graph rules — the eye of the dep-graph Coach.
//
// ADOPTED detector: dependency-cruiser walks the real import graph. This config holds the rules;
// the crafted ratchet wrapper (scripts/dep-graph-scan.mjs + dep-graph-budget.json) counts total
// violations as one debt number and blocks growth — current state is grandfathered, not cleaned.
//
// Rules are deliberately conservative for a BASELINE adoption:
//   - no-circular      (error): import cycles — highest-value finding, especially post-decompose.
//   - no-orphans       (warn) : modules nobody imports (entry scripts/tests/configs excluded).
//   - hexagonal layering (error): the domain core must not reach outward into ports/adapters/
//     personas/engine/observatory/server/http; ports may only reach into the domain.
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "Circular import — A eventually imports itself. Break the cycle (extract the shared piece, " +
        "invert a dependency). Highest-leverage graph finding, especially after a decompose.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment:
        "Orphan module — imported by nothing and not an entry point. Wire it up or delete it.",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts)$", // dotfiles / configs
          "\\.d\\.ts$",
          "(^|/)tsconfig\\.json$",
          "^src/scripts/", // CLI entry points
          "^scripts/", // repo tooling entry points
          "\\.spec\\.ts$",
          "\\.test\\.ts$",
        ],
      },
      to: {},
    },
    {
      name: "domain-stays-pure",
      severity: "error",
      comment:
        "The domain core must not depend on outer layers (hexagonal architecture). Dependencies " +
        "point inward: adapters/server/etc depend on domain, never the reverse.",
      from: { path: "^src/domain/" },
      to: {
        path: "^src/(ports|adapters|personas|engine|observatory|server|http|alpaca|news|runtime)/",
      },
    },
    {
      name: "ports-depend-on-domain-only",
      severity: "error",
      comment:
        "A port is an interface owned by the core. It may reference the domain, but must not reach " +
        "out to adapters or delivery layers.",
      from: { path: "^src/ports/" },
      to: {
        path: "^src/(adapters|personas|engine|observatory|server|http|alpaca|news|runtime)/",
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".js", ".mjs", ".cjs"],
    },
  },
};
