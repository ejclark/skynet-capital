// Type surface for platter-sweep.mjs, for its spec (scripts/ is plain ESM with `allowJs` off).
import type { AdoptVerdict, RebuildVerdict } from "./platter-sweep-decide.mjs";

export type Exec = (cmd: string, args: string[]) => string;
export interface PlatterInfo extends RebuildVerdict {
  number: number;
  branch: string;
}

export function everyPage(exec: Exec, path: string, pick?: (page: unknown) => unknown[]): unknown[];
export function protectedTest(root?: string): (path: string) => boolean;
export function sweep(opts?: {
  exec?: Exec;
  isProtected?: (path: string) => boolean;
  only?: number | null;
}): {
  platter: PlatterInfo | null;
  verdict?: AdoptVerdict;
  rebuild?: PlatterInfo | null;
  adoptable?: AdoptVerdict[];
  refused?: AdoptVerdict[];
  otherPlatters?: number[];
};
