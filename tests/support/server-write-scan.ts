/**
 * A static read of one src/server file for GitHub writes that would steer a plan lane or the work
 * dial (#7286, named next slice 7). The app server's token posts as the owner's login, so its label
 * and comment writes read as his hand; `tests/arch/server-label-guard.spec.ts` runs this over every
 * file and over fixtures.
 *
 * Why a hand-rolled reader and not the TypeScript AST: the repo's `typescript` is the native
 * compiler, which ships no JS API. So comments are blanked first (strings, templates and regex
 * literals kept, line numbers unchanged), then each call that passes a write method is read with
 * the `const` initialisers of the names it uses, one level deep — enough to see the usual
 * `const url = \`…/labels\`; doFetch("POST", url, …)` shape. It is a tripwire, not a proof: a URL
 * built three hops away can slip past, which is why a writer must also be listed by name.
 */

export interface ServerWriteFinding {
  readonly rule: "work-mode-label" | "plan-label" | "ready-unguarded" | "unknown-writer";
  readonly line: number;
  readonly message: string;
}

export interface ServerWriteScan {
  readonly findings: readonly ServerWriteFinding[];
  /** Each call that writes a comment or a label onto GitHub, by line. */
  readonly writes: readonly { readonly line: number; readonly target: "comment" | "label" }[];
  /** Whether the file asks `hasPlanLabel` (scripts/moneypenny/plan-claim.mjs, the plan lane's own
   *  test for a plan) anywhere. */
  readonly callsPlanGuard: boolean;
}

const KEYWORDS_BEFORE_REGEX = new Set(["return", "typeof", "case", "in", "of", "void", "yield"]);

/** Blank a slash that starts a regex literal through its end; returns the index after it. */
function skipRegex(src: string, start: number): number {
  let j = start + 1;
  let inClass = false;
  while (j < src.length && src[j] !== "\n") {
    const ch = src[j];
    if (ch === "\\") j += 2;
    else if (ch === "[") inClass = true;
    else if (ch === "]") inClass = false;
    else if (ch === "/" && !inClass) break;
    if (ch !== "\\") j += 1;
  }
  j += 1;
  while (j < src.length && /[a-z]/i.test(src[j] ?? "")) j += 1;
  return j;
}

function skipQuoted(src: string, start: number, quote: string): number {
  let j = start + 1;
  while (j < src.length && src[j] !== quote && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1;
  return j + 1;
}

/** Could a `/` here start a regex? Yes after an operator, an opener, or a keyword like `return`. */
function regexMayStart(src: string, at: number): boolean {
  let k = at - 1;
  while (k >= 0 && /\s/.test(src[k] ?? "")) k -= 1;
  if (k < 0) return true;
  const prev = src[k] ?? "";
  if (/[(,=:[!&|?{};+\-*%<>~^]/.test(prev)) return true;
  if (!/[\w$]/.test(prev)) return false;
  const word = /[\w$]+$/.exec(src.slice(Math.max(0, k - 12), k + 1))?.[0] ?? "";
  return KEYWORDS_BEFORE_REGEX.has(word);
}

/** Each frame is code (with its own brace depth, so a `}` can close a `${`) or template text. */
type Frame = { kind: "code"; depth: number } | { kind: "tmpl" };

/** One step inside template text; returns the next index. */
function templateStep(src: string, i: number, stack: Frame[]): number {
  const c = src[i];
  const opens = c === "$" && src[i + 1] === "{";
  if (c === "`") stack.pop();
  if (opens) stack.push({ kind: "code", depth: 0 });
  return i + (c === "\\" || opens ? 2 : 1);
}

/** Where a comment starting at `i` ends, or -1 when none starts there. */
function commentEnd(src: string, i: number): number {
  if (src[i] !== "/") return -1;
  if (src[i + 1] === "/") {
    const end = src.indexOf("\n", i);
    return end === -1 ? src.length : end;
  }
  if (src[i + 1] === "*") {
    const end = src.indexOf("*/", i + 2);
    return end === -1 ? src.length : end + 2;
  }
  return -1;
}

/** One step in code that is not a comment; returns the next index. */
function codeStep(src: string, i: number, top: { depth: number }, stack: Frame[]): number {
  const c = src[i] ?? "";
  if (c === "'" || c === '"') return skipQuoted(src, i, c);
  if (c === "`") {
    stack.push({ kind: "tmpl" });
    return i + 1;
  }
  if (c === "/" && regexMayStart(src, i)) return skipRegex(src, i);
  if (c === "{") top.depth += 1;
  else if (c === "}" && top.depth === 0 && stack.length > 1) stack.pop();
  else if (c === "}") top.depth -= 1;
  return i + 1;
}

/** The source with every comment blanked to spaces; strings, templates and newlines kept. */
function blankComments(src: string): string {
  const out = src.split("");
  const stack: Frame[] = [{ kind: "code", depth: 0 }];
  let i = 0;
  while (i < src.length) {
    const top = stack[stack.length - 1] ?? { kind: "code", depth: 0 };
    if (top.kind === "tmpl") {
      i = templateStep(src, i, stack);
      continue;
    }
    const end = commentEnd(src, i);
    if (end === -1) {
      i = codeStep(src, i, top, stack);
      continue;
    }
    for (let k = i; k < end; k += 1) if (out[k] !== "\n") out[k] = " ";
    i = end;
  }
  return out.join("");
}

const lineAt = (code: string, index: number): number => code.slice(0, index).split("\n").length;

/** Back from `at` to the unmatched `(` or `[` it sits in, within 600 characters, or -1. */
function callStart(code: string, at: number): number {
  let depth = 0;
  for (let k = at - 1; k >= Math.max(0, at - 600); k -= 1) {
    const ch = code[k];
    if (ch === ")" || ch === "]") depth += 1;
    else if ((ch === "(" || ch === "[") && depth === 0) return k;
    else if (ch === "(" || ch === "[") depth -= 1;
  }
  return -1;
}

/** The call a write-method literal sits in: back to its unmatched `(`, forward to the match. */
function enclosingCall(code: string, at: number): string {
  const start = callStart(code, at);
  if (start === -1) return code.slice(at, at + 400);
  let depth = 0;
  for (let k = start; k < code.length; k += 1) {
    const ch = code[k];
    if (ch === "(" || ch === "[") depth += 1;
    if ((ch === ")" || ch === "]") && --depth === 0) return code.slice(start, k + 1);
  }
  return code.slice(start);
}

/** The call plus the `const`/`let` initialisers of every name it uses, one level deep. */
function withInitialisers(code: string, call: string): string {
  const names = new Set(call.match(/[A-Za-z_$][\w$]*/g) ?? []);
  const inits = [...names].flatMap((name) => {
    const decl = new RegExp(`\\b(?:const|let)\\s+${name.replace(/\$/g, "\\$")}\\s*=([^;]*);`, "g");
    return [...code.matchAll(decl)].map((m) => m[1] ?? "");
  });
  return [call, ...inits].join("\n");
}

const WRITE_METHOD = /["'`](POST|PUT|PATCH|DELETE)["'`]/g;
const NAMES_PLAN = /\/labels\/plan\b|["'`]plan["'`]|\bLABELS\.plan\b/;
const NAMES_READY = /\/labels\/ready\b|["'`]ready["'`]|\bLABELS\.ready\b/;
/** A label list naming `plan`: an array literal with the bare string or the registry entry. */
const PLAN_IN_LIST = /\[[^[\]]*(?:["'`]plan["'`]|\bLABELS\.plan\b)[^[\]]*\]/g;
const HAS_PLAN_LIST = new RegExp(PLAN_IN_LIST.source);

/** Read one src/server file (`file` relative to src/server) for steering writes. `known` is the
 *  set of files allowed to write comments and labels at all. */
export function scanServerFile(
  file: string,
  text: string,
  known: ReadonlySet<string>,
): ServerWriteScan {
  const code = blankComments(text);
  const at = (index: number) => `src/server/${file}:${lineAt(code, index)}`;
  const findings: ServerWriteFinding[] = [];
  const writes: { line: number; target: "comment" | "label" }[] = [];
  const callsPlanGuard = /\bhasPlanLabel\s*\(/.test(code);
  const flag = (rule: ServerWriteFinding["rule"], index: number, why: string) =>
    findings.push({ rule, line: lineAt(code, index), message: `${at(index)} ${why}` });

  for (const m of code.matchAll(/work-mode:/g)) {
    flag(
      "work-mode-label",
      m.index,
      "names a work-mode label: the work dial is never the app server's to turn (#7286)",
    );
  }
  for (const m of code.matchAll(PLAN_IN_LIST)) {
    flag(
      "plan-label",
      m.index,
      "lists the plan label: the app server never puts an issue in the plan lane (#7286)",
    );
  }
  for (const m of code.matchAll(WRITE_METHOD)) {
    const call = withInitialisers(code, enclosingCall(code, m.index));
    const target = /\/comments\b/.test(call)
      ? "comment"
      : /\/labels\b|\blabels\s*:/.test(call)
        ? "label"
        : undefined;
    if (!target) continue;
    writes.push({ line: lineAt(code, m.index), target });
    if (!known.has(file)) {
      flag(
        "unknown-writer",
        m.index,
        `writes a GitHub ${target}: add the file to KNOWN_WRITERS in tests/arch/server-label-guard.spec.ts with why it cannot reach a plan issue (#7286)`,
      );
    }
    // A list literal naming `plan` is already flagged above, once, at the list.
    if (target === "label" && NAMES_PLAN.test(call) && !HAS_PLAN_LIST.test(call)) {
      flag(
        "plan-label",
        m.index,
        "writes the plan label: the app server never puts an issue in the plan lane (#7286)",
      );
    }
    if (target === "label" && NAMES_READY.test(call) && !callsPlanGuard) {
      flag(
        "ready-unguarded",
        m.index,
        "writes the ready label without asking hasPlanLabel (scripts/moneypenny/plan-claim.mjs) first: an owner-login ready on a plan starts its build (#7286)",
      );
    }
  }
  return { findings, writes, callsPlanGuard };
}
