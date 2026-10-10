/**
 * "WORTH A LOOK FIRST" AT LOAD (#5070; round 2 of #5037, Eric picked R2 over V1, which drew the
 * sort off). The positions list opens sorted, rows worth a look first, unless this viewer turned
 * the sort off — then it stays off until they turn it back on. The sort is the `sort:look` token
 * in the one query model, so the default is simply the query a page starts with when its URL
 * carries none. Per viewer, in this browser: a way of looking, never a record.
 */

export const LOOK_TOKEN = "sort:look";

const KEY = "skynet.positions.look-sort";

function storedOff(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "off";
  } catch {
    return false;
  }
}

/** Remember the viewer's last choice of the sort chip. */
export function rememberLookSort(on: boolean): void {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Without storage the sort is simply on at the next load.
  }
}

/** The query a positions page starts with: the URL's when it carries one, else the sort. */
export function initialPositionsQuery(q?: string): string {
  if (q !== undefined) return q;
  return storedOff() ? "" : LOOK_TOKEN;
}
