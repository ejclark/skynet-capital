// Line classifier — how many lines of a source file are actually CODE.
//
// #1713 (Eric, 2026-09-06): "comments to bridge context are counted as code that competes just like
// executable source code." Every size gate here counted physical lines, so a file paid for the WHY
// comments CLAUDE.md asks it to co-locate — and PR #1361 records a session moving its rationale out
// of `//` lines into a module docstring purely to dodge the counter, because Biome's rule collapsed
// a block comment to one line but charged full price for `//`. Counting code lines prices structure
// without pricing intent, and stops the cap shaping how intent gets written.
//
// Deliberately a line classifier, not a parser: a line counts as a comment when its first
// non-whitespace characters open one. Known undercount — `//` and `/* … */` lines INSIDE a template
// literal (the GLSL in src/three/pieces/eye-shader.ts, the inline CSS/JS in the cinematic views)
// read as comments. Acceptable for an advisory smell, and it keeps the gate dependency-free (the
// arch-scan doctrine): a file whose size is dominated by one template literal is a grandfather-list
// case, not a decompose target.

/** Lines of `source` that are neither blank nor a whole-line comment. */
export function codeLineCount(source) {
  let count = 0;
  let inBlock = false;
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (inBlock) {
      if (line.includes("*/")) inBlock = false;
      continue;
    }
    if (line === "") continue;
    if (line.startsWith("//")) continue;
    if (line.startsWith("/*")) {
      if (!line.includes("*/")) inBlock = true;
      continue;
    }
    count++;
  }
  return count;
}
