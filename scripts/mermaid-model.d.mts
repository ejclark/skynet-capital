/** One node of a parsed diagram: a flowchart node, a state, a commit, a C4 element, a participant. */
export type DiagramNode = {
  id: string;
  label?: string;
  shape?: string;
  kind?: string;
  parent?: string;
  group?: true;
  classes?: string[];
  [extra: string]: unknown;
};
/** One edge: a link, a transition, a parent link, a Rel, a message. */
export type DiagramEdge = {
  id?: string;
  from: string;
  to: string;
  label?: string;
  stroke?: "normal" | "thick" | "dotted" | "invisible";
  kind?: string;
  [extra: string]: unknown;
};
/** What Mermaid parsed. nodes/edges are null for a type that is not a node/edge picture (pie, xychart…). */
export type DiagramModel = {
  type: string;
  title?: string;
  nodes: DiagramNode[] | null;
  edges: DiagramEdge[] | null;
  [extra: string]: unknown;
};
export function diagramModel(mermaid: unknown, source: string): Promise<DiagramModel>;
