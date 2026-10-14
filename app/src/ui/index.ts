// The primitives barrel: every part in app/src/ui is re-exported here, so a surface imports
// `from "../ui"` and never reaches into a file. Each primitive is extracted by the rule in
// ./README.md and lands with its entry in ./CATALOG.md (`npm run ui:catalog`).
export { EnvPill, PAPER_WORD } from "./env-pill";
export { KindChip } from "./kind-chip";
