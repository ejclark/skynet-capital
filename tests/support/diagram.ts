import { execFileSync } from "node:child_process";
import type { DiagramModel } from "../../scripts/mermaid-model.mjs";

// The diagram-as-data harness (plan #3748 slice 7a): a spec reads what a mermaid block SAYS — its
// nodes and edges as Mermaid parsed them — and holds that claim to the code it describes. Driven
// through the lint CLI, never an import: the parser needs a jsdom window on globalThis, which must
// not leak into the spec's own environment, and the CLI is the one path ship.sh and issue-lint use.

export type { DiagramEdge, DiagramModel, DiagramNode } from "../../scripts/mermaid-model.mjs";

/** Every block's model in a markdown text, in order. Throws on a block that does not parse: a claim
 *  that cannot be read is not an empty one. */
export function diagramModels(markdown: string): DiagramModel[] {
  let out: string;
  try {
    out = execFileSync("node", ["scripts/mermaid-lint.mjs", "--stdin", "--json", "--ast"], {
      input: markdown,
      encoding: "utf8",
    });
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string };
    const problems = e.stdout ? (JSON.parse(e.stdout).problems as string[]) : [e.stderr ?? ""];
    throw new Error(`diagram does not lint:\n${problems.join("\n")}`);
  }
  const report = JSON.parse(out) as { diagrams: { model?: DiagramModel }[] };
  return report.diagrams.map((d, i) => {
    if (!d.model) throw new Error(`block ${i + 1} carries no model`);
    return d.model;
  });
}

/** The model of one bare diagram source (no fence). */
export function diagramModel(source: string): DiagramModel {
  const [model] = diagramModels(`\n\`\`\`mermaid\n${source}\n\`\`\`\n`);
  if (!model) throw new Error("no mermaid block found");
  return model;
}
