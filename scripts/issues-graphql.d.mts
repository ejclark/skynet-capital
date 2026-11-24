// Type surface for issues-graphql.mjs (#8289) — scripts/ is plain ESM with `allowJs` off.
type Vars = Record<string, unknown>;
export interface RestOp {
  method: string;
  path: string;
  payload?: Record<string, unknown>;
}
/** The REST-shaped answer a GraphQL write hands back. */
export interface RestAnswer {
  id?: number;
  node_id?: string;
  number?: number;
  title?: string;
  body?: string | null;
  state?: string;
  html_url?: string;
  labels?: Array<{ name: string }>;
}
export interface Ids {
  register(
    obj: { node_id?: string; number?: number; id?: number } | null,
    kind?: "issue" | "comment",
  ): void;
  hasComment(id: number | string): boolean;
  prepare(op: RestOp): void;
  repo(): string;
  issue(n: number): string;
  label(name: string): string;
  issueByDb(id: number): string;
  commentByDb(id: number): string;
}
export type Send = (query: string, variables: Vars) => Vars;
export function restShape(node: unknown): RestAnswer | null;
export function classify(op: { method: string; path: string }): {
  kind: string | null;
  n: number;
};
export function idsNeeded(op: RestOp): { repo: boolean; issues: number[]; labels: string[] };
export function mutationFor(
  op: RestOp,
  ids: Pick<Ids, "repo" | "issue" | "label" | "issueByDb" | "commentByDb">,
): {
  query: string;
  // biome-ignore lint/suspicious/noExplicitAny: a spec reads nested inputs; the shape varies per mutation
  variables: Record<string, any>;
  pick: (data: Vars) => RestAnswer | null;
};
export function resolveQuery(
  need: { repo: boolean; issues: number[]; labels: string[] },
  repo: string,
): { query: string; variables: Vars };
export function graphql(query: string, variables: Vars, opts?: Vars): Vars;
export function createIds(args?: { repo?: string; send?: Send }): Ids;
export function graphqlWrite(op: RestOp, ids: Ids, opts?: { send?: Send }): RestAnswer | null;
