/**
 * One call at a time per key, in arrival order (#4612 slice 7, #4619).
 *
 * A held fold advances by the lines appended since its last read. Two reads for one participant
 * landing together would each fold the same lines, and a line seen out of order could regress a
 * later one — so a fold's refresh runs through this: the second waits for the first, then asks
 * what is new since the first finished. A failed call does not poison the queue behind it.
 */
export function serialPerKey<T>(run: (key: string) => Promise<T>): (key: string) => Promise<T> {
  const queue = new Map<string, Promise<T>>();
  return (key) => {
    const prior = queue.get(key);
    const next = prior ? prior.then(noop, noop).then(() => run(key)) : run(key);
    queue.set(key, next);
    const settle = (): void => {
      if (queue.get(key) === next) queue.delete(key);
    };
    next.then(settle, settle);
    return next;
  };
}

function noop(): undefined {
  return undefined;
}
