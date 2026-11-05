// Type surface for rest.mjs: scripts/ is plain ESM.

/** A REST response: GitHub's parsed JSON, whose shape each caller knows from the endpoint it read. */
// biome-ignore lint/suspicious/noExplicitAny: one alias for GitHub's JSON, instead of a cast per read
export type Json = any;
export interface ReviewApi {
  get: (path: string) => Json;
  send: (method: string, path: string, body: unknown) => Json;
}
export function ghRestWrite(
  method: string,
  path: string,
  body: unknown,
  opts?: { token?: string; run?: (cmd: string, args: string[], opts?: object) => string },
): Json;
export function isNotFound(err: unknown): boolean;
export function isConflict(err: unknown): boolean;
export function defaultApi(): ReviewApi;
