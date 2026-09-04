#!/usr/bin/env node
// Workflow-meta scan — the eye for .claude/workflows/*.js.
//
//   node scripts/workflow-meta-scan.mjs            # check .claude/workflows (exit 1 on a problem)
//   node scripts/workflow-meta-scan.mjs <dir>      # check another directory (specs)
//
// WHAT HAPPENED (2026-09-04): /grind was fully built, documented, and routed from CLAUDE.md — and
// un-invokable by name. `Workflow({name: "grind"})` answered "not found" while the sibling
// symbol-sweep resolved fine. The Workflow tool's registry parses each script's
// `export const meta = {...}` STATICALLY, and the harness's own contract for it is strict: "a PURE
// LITERAL — no variables, function calls, spreads, or template interpolation." A meta that breaks
// that rule doesn't error; the workflow silently vanishes from the registry. Nothing in this repo
// checked the rule, so nothing caught it. This scan is that check.
//
// It parses each script as a module (top-level `await`/`return` allowed — that is the harness's
// dialect, see the NOTE atop grind.js), finds the `meta` export, and walks its initializer: every
// node must be an object/array/property/literal. It also checks the things the registry needs to
// find the file at all — meta is the FIRST statement, `name` is a string and matches the file's
// basename, `description` is a string, `phases` (if present) is an array of {title: string}.
//
// Enforced in CI via tests/arch/workflow-meta.spec.ts (blocking — a dropped workflow is a broken
// contract, not debt to ratchet).
import { readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as acorn from "acorn";

const LITERAL_NODES = new Set(["ObjectExpression", "ArrayExpression", "Property", "Literal"]);

/** The dotted-path segment for an object property (`?` for anything that isn't a plain key). */
function propertyKey(p) {
  if (p.type !== "Property" || p.computed) return "?";
  return p.key.type === "Identifier" ? p.key.name : String(p.key.value);
}

/** Walk a meta initializer; call visit(node, dottedPath) for every node. */
function walk(node, path, visit) {
  visit(node, path);
  if (node.type === "ObjectExpression") {
    for (const p of node.properties) {
      const key = propertyKey(p);
      const childPath = path ? `${path}.${key}` : key;
      walk(p, childPath, visit);
      if (p.type === "Property") walk(p.value, childPath, visit);
    }
  } else if (node.type === "ArrayExpression") {
    for (const [i, el] of node.elements.entries()) {
      if (el) walk(el, `${path}[${i}]`, visit);
    }
  }
}

/** Evaluate a pure-literal AST node to a plain value (only called after the walk found no problems). */
function literalValue(node) {
  if (node.type === "Literal") return node.value;
  if (node.type === "ArrayExpression")
    return node.elements.map((el) => (el ? literalValue(el) : null));
  if (node.type === "ObjectExpression") {
    const out = {};
    for (const p of node.properties) {
      const key = p.key.type === "Identifier" ? p.key.name : String(p.key.value);
      out[key] = literalValue(p.value);
    }
    return out;
  }
  return undefined;
}

/**
 * Scan one workflow script's source. Returns a list of problem strings (empty = clean).
 * @param {string} source
 * @param {string} file  display name, e.g. ".claude/workflows/grind.js"
 */
export function scanWorkflowMeta(source, file) {
  const problems = [];
  let ast;
  try {
    ast = acorn.parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      locations: true,
    });
  } catch (err) {
    return [`${file}: does not parse as a workflow script — ${err.message}`];
  }

  const isMetaExport = (n) =>
    n.type === "ExportNamedDeclaration" &&
    n.declaration?.type === "VariableDeclaration" &&
    n.declaration.declarations.some((d) => d.id.type === "Identifier" && d.id.name === "meta");
  const exp = ast.body.find(isMetaExport);
  if (!exp) return [`${file}: no \`export const meta = {...}\` — the registry cannot list it`];

  const first = ast.body[0];
  if (first !== exp) {
    problems.push(
      `${file}:${first.loc.start.line} \`export const meta\` must be the first statement (found ${first.type} before it; comments are fine, code is not)`,
    );
  }
  if (exp.declaration.kind !== "const") {
    problems.push(
      `${file}:${exp.loc.start.line} meta must be declared with \`const\`, not \`${exp.declaration.kind}\``,
    );
  }

  const decl = exp.declaration.declarations.find((d) => d.id.name === "meta");
  if (decl.init?.type !== "ObjectExpression") {
    problems.push(`${file}:${exp.loc.start.line} meta must be an object literal`);
    return problems;
  }

  let impure = false;
  walk(decl.init, "", (node, path) => {
    const where = `${file}:${node.loc.start.line} meta${path ? `.${path}` : ""}`;
    if (!LITERAL_NODES.has(node.type)) {
      impure = true;
      problems.push(
        `${where} is a ${node.type}, not a literal — the registry parses meta statically and silently drops the workflow`,
      );
      return;
    }
    if (node.type === "Property" && (node.computed || node.kind !== "init" || node.method)) {
      impure = true;
      problems.push(
        `${where} must be a plain \`key: value\` property (no computed keys, getters, or methods)`,
      );
    }
    if (node.type === "Literal" && (node.regex || node.bigint !== undefined)) {
      impure = true;
      problems.push(
        `${where} is a ${node.regex ? "regex" : "bigint"} literal — only strings, numbers, booleans, and null belong in meta`,
      );
    }
  });
  if (impure) return problems;

  const meta = literalValue(decl.init);
  const expectedName = basename(file).replace(/\.js$/, "");
  if (typeof meta.name !== "string" || !meta.name) {
    problems.push(`${file}: meta.name must be a non-empty string`);
  } else if (meta.name !== expectedName) {
    problems.push(
      `${file}: meta.name is "${meta.name}" but the file is ${expectedName}.js — the registry keys on the name; keep them identical`,
    );
  }
  if (typeof meta.description !== "string" || !meta.description) {
    problems.push(
      `${file}: meta.description must be a non-empty string (shown in the permission dialog)`,
    );
  }
  if (meta.whenToUse !== undefined && typeof meta.whenToUse !== "string") {
    problems.push(`${file}: meta.whenToUse must be a string when present`);
  }
  if (meta.phases !== undefined) {
    if (!Array.isArray(meta.phases)) {
      problems.push(`${file}: meta.phases must be an array of {title, detail?}`);
    } else {
      meta.phases.forEach((p, i) => {
        if (!p || typeof p !== "object" || typeof p.title !== "string" || !p.title) {
          problems.push(`${file}: meta.phases[${i}] needs a non-empty string title`);
        }
      });
    }
  }
  return problems;
}

/** Scan every *.js in a directory. Returns {files, problems}. */
export function scanWorkflowDir(dir) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".js"))
    .sort();
  const problems = files.flatMap((f) =>
    scanWorkflowMeta(readFileSync(join(dir, f), "utf8"), join(dir, f)),
  );
  return { files, problems };
}

function main() {
  const dir = resolve(process.argv[2] ?? ".claude/workflows");
  const { files, problems } = scanWorkflowDir(dir);
  if (problems.length === 0) {
    console.log(
      `workflow-meta-scan: ${files.length} workflow script(s) have a pure-literal meta the registry can read.`,
    );
    return;
  }
  console.error("✗ workflow-meta-scan — a meta the Workflow registry would silently drop:");
  for (const p of problems) console.error(`  ${p}`);
  console.error(
    "\nFix: make `export const meta` a pure literal (strings, numbers, booleans, arrays, objects — no `+`, template strings, identifiers, calls, or spreads) and keep it the first statement.",
  );
  process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
