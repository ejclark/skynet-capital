/**
 * MIN/MAX DOWNSAMPLE — bounds a time-ordered series to a fixed point budget regardless of how much
 * history has accrued (#4612 slice 7, defect #13: Pulse and Thesis sent every 5-minute sample, 0.8–
 * 0.9 MB at 56 days growing unboundedly). Each bucket keeps its lowest and highest value rather than
 * a plain stride sample, so a spike or dip inside a bucket is never silently smoothed away — only
 * the points between them are. A no-op under the cap.
 */
export function downsampleMinMax<T>(
  items: readonly T[],
  metric: (item: T) => number,
  maxPoints = 640,
): T[] {
  if (items.length <= maxPoints) return [...items];
  const bucketCount = Math.max(1, Math.floor(maxPoints / 2));
  const out: T[] = [];
  for (let b = 0; b < bucketCount; b++) {
    const start = Math.floor((b * items.length) / bucketCount);
    const end =
      b === bucketCount - 1 ? items.length : Math.floor(((b + 1) * items.length) / bucketCount);
    if (start >= end) continue;
    let minIdx = start;
    let maxIdx = start;
    for (let i = start + 1; i < end; i++) {
      if (metric(items[i] as T) < metric(items[minIdx] as T)) minIdx = i;
      if (metric(items[i] as T) > metric(items[maxIdx] as T)) maxIdx = i;
    }
    const firstIdx = Math.min(minIdx, maxIdx);
    const secondIdx = Math.max(minIdx, maxIdx);
    out.push(items[firstIdx] as T);
    if (secondIdx !== firstIdx) out.push(items[secondIdx] as T);
  }
  return out;
}
