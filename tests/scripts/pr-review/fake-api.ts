// An in-memory GitHub for the PR reviewer's specs: reads answer from a route table, writes are
// recorded, and nothing touches the network. A path with no route answers the way curl reports a
// 404, so a missing file, branch or day reads exactly as it does against the real API.
import type { Json, ReviewApi } from "../../../scripts/pr-review/rest.mjs";

export interface Sent {
  method: string;
  path: string;
  body: Json;
}

export const httpError = (code: number) =>
  Object.assign(new Error(`curl: (22) The requested URL returned error: ${code}`), {
    stderr: `curl: (22) The requested URL returned error: ${code}`,
  });

type Route = unknown | ((path: string) => unknown);

/**
 * `routes` maps a path (no paging params) to a value, or to a function of the full path. A list
 * route answers its rows on page 1 and nothing after, as ghRestAll expects.
 */
export function fakeApi(
  routes: Record<string, Route> = {},
  onSend: (s: Sent) => unknown = () => ({}),
): ReviewApi & { sent: Sent[]; reads: string[] } {
  const sent: Sent[] = [];
  const reads: string[] = [];
  return {
    sent,
    reads,
    get(path: string) {
      reads.push(path);
      const page = Number(/[?&]page=(\d+)/.exec(path)?.[1] ?? 1);
      const key = path.replace(/[?&]per_page=\d+&page=\d+$/, "");
      if (!(key in routes)) throw httpError(404);
      const route = routes[key];
      const value = typeof route === "function" ? (route as (p: string) => unknown)(path) : route;
      if (Array.isArray(value) && page > 1) return [];
      return value;
    },
    send(method: string, path: string, body: unknown) {
      const s = { method, path, body };
      sent.push(s);
      return onSend(s);
    },
  };
}

export const b64 = (text: string) => Buffer.from(text).toString("base64");
export const unb64 = (text: string) => Buffer.from(text, "base64").toString("utf8");
