/** Types for `proxy-reexec.mjs`: re-run this process with proxy-aware `fetch` when behind a proxy. */

/** Exits this process with the re-run child's status when `HTTPS_PROXY` is set and the child has
 *  not already been spawned; otherwise returns at once. */
export function reexecWithProxy(): void;
