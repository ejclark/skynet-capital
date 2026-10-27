/**
 * A file beside `path`, in the same directory — how the member-data stores (the Council, comments
 * on a filing, replies under a Council line) land on the volume the already-pinned controls file
 * names, with no new env var and no `fly.toml` change (envelope-protected).
 * Both separators count, so a Windows-style path works the same; a bare file name has no directory
 * and its sibling is bare too.
 */
export function siblingPath(path: string, fileName: string): string {
  const lastSlash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return `${lastSlash >= 0 ? path.slice(0, lastSlash + 1) : ""}${fileName}`;
}
