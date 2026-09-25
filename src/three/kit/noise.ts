/**
 * CPU-side value noise for sculpting rock — the massif and the crags are displaced by it at build
 * time, so the silhouette is hewn rather than spherical. Ported from the Barad-dûr design handoff
 * (issue: "Barad-dûr tower + fire Eye rebuild"), where it drives the same two jobs in three.js.
 *
 * Deterministic by construction (a sin-hash, no Math.random), so the rock is identical on every load
 * and screenshot diffs stay meaningful. Pure math, no three.js — unit-testable without a browser.
 */

function hash(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
const fade = (t: number): number => t * t * (3 - 2 * t);

/** Smooth 3D value noise in [-1, 1]. */
export function vnoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = fade(x - xi);
  const v = fade(y - yi);
  const w = fade(z - zi);
  const c = (a: number, b: number, d: number): number => hash(xi + a, yi + b, zi + d);
  const bottom = mix(mix(c(0, 0, 0), c(1, 0, 0), u), mix(c(0, 1, 0), c(1, 1, 0), u), v);
  const top = mix(mix(c(0, 0, 1), c(1, 0, 1), u), mix(c(0, 1, 1), c(1, 1, 1), u), v);
  return mix(bottom, top, w) * 2 - 1;
}

/**
 * Ridged multifractal — 5 octaves, lacunarity 2.1. `1 - |noise|` folds each octave into sharp
 * crests, which is what makes displaced rock read as ridgelines instead of a lumpy potato.
 * Range is roughly [0, 1].
 */
export function ridged(x: number, y: number, z: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 5; i++) {
    sum += amp * (1 - Math.abs(vnoise(x * freq, y * freq, z * freq)));
    amp *= 0.5;
    freq *= 2.1;
  }
  return sum;
}
