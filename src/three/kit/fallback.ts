/**
 * WHEN THE GPU LETS GO (plan #3807 slice 3a-2; the design panel's §4, "`webglcontextlost` → still").
 * A browser can take a WebGL context back at any time — a GPU reset, too many contexts, a laptop
 * switching graphics. The canvas then goes blank, and three.js keeps being asked to draw into
 * nothing. So the scene keeps one still frame of itself from its first draw, and on a context loss
 * it stops the loop and shows that still in the canvas's place: the crest never goes to a black box.
 *
 * DOM-free policy: the scene hands in the canvas (any `EventTarget`), how to read the still, how to
 * show it, and how to stop. The spec drives it with a plain `EventTarget`.
 */

export interface FallbackDeps {
  /** The WebGL canvas — it is the one that fires `webglcontextlost`. */
  readonly canvas: EventTarget;
  /** The still kept from the first draw (a data URL), or `null` when none was kept. */
  readonly still: () => string | null;
  /** Put the still where the canvas was. */
  readonly show: (url: string) => void;
  /** Stop the animation loop for good. */
  readonly halt: () => void;
}

/** Arm the fallback. Fires at most once; returns a disarm for tests and teardown. */
export function armContextLoss(deps: FallbackDeps): () => void {
  let done = false;
  const onLost = (): void => {
    if (done) return;
    done = true;
    deps.halt();
    const url = deps.still();
    if (url) deps.show(url);
  };
  deps.canvas.addEventListener("webglcontextlost", onLost);
  return () => deps.canvas.removeEventListener("webglcontextlost", onLost);
}
