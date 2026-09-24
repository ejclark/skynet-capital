/**
 * A squarified treemap (Bruls, Huizing & van Wijk, 2000) for the Map lens (#3689 slice 9). It lays
 * weighted items into a rectangle so tiles stay close to square, which keeps small positions
 * readable. Pure and unit-free: it works in whatever box it's given (the Map uses 100×100, then
 * places tiles by percentage, so the layout never needs to measure the DOM).
 */

export interface Tile<T> {
  readonly item: T;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The worst aspect ratio in a row of areas laid along a side of length `side`. */
function worst(row: readonly number[], side: number): number {
  const sum = row.reduce((a, b) => a + b, 0);
  if (sum === 0 || side === 0) return Number.POSITIVE_INFINITY;
  const max = Math.max(...row);
  const min = Math.min(...row);
  const s2 = side * side;
  const sum2 = sum * sum;
  return Math.max((s2 * max) / sum2, sum2 / (s2 * min));
}

export function squarify<T>(
  items: readonly T[],
  weight: (item: T) => number,
  box: { readonly w: number; readonly h: number } = { w: 100, h: 100 },
): Tile<T>[] {
  const total = items.reduce((s, it) => s + Math.max(0, weight(it)), 0);
  if (total <= 0) return [];
  const scale = (box.w * box.h) / total;
  const queue = items
    .map((item) => ({ item, area: Math.max(0, weight(item)) * scale }))
    .filter((e) => e.area > 0)
    .sort((a, b) => b.area - a.area);

  const out: Tile<T>[] = [];
  const free: Box = { x: 0, y: 0, w: box.w, h: box.h };
  let row: { item: T; area: number }[] = [];

  const layRow = () => {
    const sum = row.reduce((s, e) => s + e.area, 0);
    if (free.w >= free.h) {
      // Lay the row down the left side as a column.
      const colW = sum / free.h;
      let y = free.y;
      for (const e of row) {
        const h = e.area / colW;
        out.push({ item: e.item, x: free.x, y, w: colW, h });
        y += h;
      }
      free.x += colW;
      free.w -= colW;
    } else {
      // Lay it along the top as a row.
      const rowH = sum / free.w;
      let x = free.x;
      for (const e of row) {
        const w = e.area / rowH;
        out.push({ item: e.item, x, y: free.y, w, h: rowH });
        x += w;
      }
      free.y += rowH;
      free.h -= rowH;
    }
    row = [];
  };

  for (const e of queue) {
    const side = Math.min(free.w, free.h);
    const current = row.map((r) => r.area);
    if (row.length === 0 || worst([...current, e.area], side) <= worst(current, side)) {
      row.push(e);
    } else {
      layRow();
      row.push(e);
    }
  }
  if (row.length > 0) layRow();
  return out;
}
