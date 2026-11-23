// Type surface for seal.mjs (`allowJs` is off).

export interface KeyFile {
  name: string;
  sha256: string;
  bytes: number;
  b64: string;
}
export function readKey(dir: string): KeyFile[];
export function bundleHash(files: KeyFile[]): string;
export function keyPage(args: { name: string; files: KeyFile[] }): string;
export function readPage(html: string): { name: string; hash: string; files: KeyFile[] };
export function unpack(args: {
  html: string;
  expect: string;
  out: string;
  checkout?: (dir: string) => boolean;
}): { name: string; hash: string; files: KeyFile[] };
