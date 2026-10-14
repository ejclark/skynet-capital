// The primitives barrel: every part in app/src/ui is re-exported here, so a surface imports
// `from "../ui"` and never reaches into a file. Empty until the first primitive is extracted by the
// rule in ./README.md; each one also lands with its entry in ./CATALOG.md (`npm run ui:catalog`).
export {};
