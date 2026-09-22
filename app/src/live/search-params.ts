/**
 * CLEAN SEARCH PARAMS (#3407 P0) — the router's default serialiser JSON-quotes any string that
 * would parse as a number (`?play=%22201%22`, `?strike=%22175%22`) so the value round-trips as a
 * string, and its decoder coerces bare numerics to numbers. Every search param this shell reads
 * is a string by contract (each route's `validateSearch` checks `typeof === "string"`, and
 * `/trade` already normalises through `String()`), so both behaviours buy nothing and make every
 * shared link ugly. These two keep every value a plain string: parse hands back exactly what the
 * URL carried, stringify writes strings raw and JSON only for the objects nobody puts in a URL
 * here. Symmetric for scalar strings, which is the whole surface.
 */
export function parseSearch(searchStr: string): Record<string, unknown> {
  const raw = searchStr.startsWith("?") ? searchStr.slice(1) : searchStr;
  const out: Record<string, unknown> = {};
  for (const [key, value] of new URLSearchParams(raw)) out[key] = value;
  return out;
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) continue;
    params.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}
