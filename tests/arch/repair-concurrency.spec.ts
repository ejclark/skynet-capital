import { readFileSync } from "node:fs";

// #6728: the repair lane's concurrency group must never put a red PR's repair session in the
// group a red `main` uses. A session holds its group for its whole run and GitHub keeps only one
// pending run per group, so a red `main` queued behind a PR session was replaced by the next
// Pipeline completion and never triaged. These specs evaluate the REAL `group:` line against the
// event payloads each entry point delivers, with a tiny evaluator for the expression subset it uses
// (`||`, `&&`, `==`, `!=`, parentheses, string literals, property paths, `format()`).

const workflow = readFileSync(".github/workflows/moneypenny-repair.yml", "utf8");
const groupLine = /^ {2}group:\s*(.+)$/m.exec(workflow)?.[1] ?? "";

type Value = string | number | boolean | null | Record<string, unknown>;

function evaluate(expr: string, ctx: Record<string, unknown>): Value {
  const tokens = expr.match(/'(?:[^']|'')*'|==|!=|&&|\|\||[(),]|[A-Za-z_][\w.-]*|\S/g) ?? [];
  let i = 0;
  const peek = () => tokens[i];
  const take = (t?: string): string => {
    const tok = tokens[i++];
    if (tok === undefined || (t !== undefined && tok !== t))
      throw new Error(`expected ${t ?? "a token"}, got ${tok}`);
    return tok;
  };
  const truthy = (v: Value) => v !== null && v !== false && v !== "" && v !== 0;
  const lookup = (path: string): Value => {
    let cur: unknown = ctx;
    for (const key of path.split(".")) {
      cur = cur != null && typeof cur === "object" ? (cur as Record<string, unknown>)[key] : null;
    }
    return (cur ?? null) as Value;
  };
  const primary = (): Value => {
    const tok = take();
    if (tok === "(") {
      const v = or();
      take(")");
      return v;
    }
    if (tok.startsWith("'")) return tok.slice(1, -1).replace(/''/g, "'");
    if (tok === "format") {
      take("(");
      const args: Value[] = [or()];
      while (peek() === ",") {
        take(",");
        args.push(or());
      }
      take(")");
      const [fmt, ...rest] = args;
      return String(fmt).replace(/\{(\d+)\}/g, (_, n) => String(rest[Number(n)] ?? ""));
    }
    return lookup(tok);
  };
  const equality = (): Value => {
    let left = primary();
    while (peek() === "==" || peek() === "!=") {
      const op = take();
      const right = primary();
      const same = String(left ?? "").toLowerCase() === String(right ?? "").toLowerCase();
      left = op === "==" ? same : !same;
    }
    return left;
  };
  const and = (): Value => {
    let left = equality();
    while (peek() === "&&") {
      take();
      const right = equality();
      left = truthy(left) ? right : left;
    }
    return left;
  };
  const or = (): Value => {
    let left = and();
    while (peek() === "||") {
      take();
      const right = and();
      left = truthy(left) ? left : right;
    }
    return left;
  };
  const v = or();
  if (i !== tokens.length) throw new Error(`unparsed tail: ${tokens.slice(i).join(" ")}`);
  return v;
}

const groupFor = (event: Record<string, unknown>) =>
  groupLine.replace(/\$\{\{(.+?)\}\}/g, (_, e: string) =>
    String(evaluate(e, { github: { event } })),
  );

const pipelineRun = (over: Record<string, unknown>) => ({
  workflow_run: { name: "Pipeline", conclusion: "failure", ...over },
});

describe("moneypenny-repair concurrency (#6728)", () => {
  it("reads a group line from the workflow", () => {
    expect(groupLine).toContain("moneypenny-repair-");
  });

  it("keys a pull_request Pipeline run by its head branch, apart from main", () => {
    const pr = groupFor(pipelineRun({ event: "pull_request", head_branch: "fix/thing" }));
    const main = groupFor(pipelineRun({ event: "push", head_branch: "main" }));
    expect(pr).toContain("fix/thing");
    expect(pr).not.toBe(main);
  });

  it("keeps a red main in the per-workflow group it always had", () => {
    expect(groupFor(pipelineRun({ event: "push", head_branch: "main" }))).toBe(
      "moneypenny-repair-Pipeline",
    );
  });

  it("never lets two different PRs share a group", () => {
    const a = groupFor(pipelineRun({ event: "pull_request", head_branch: "a" }));
    const b = groupFor(pipelineRun({ event: "pull_request", head_branch: "b" }));
    expect(a).not.toBe(b);
  });

  it("leaves the dispatch keys as they were", () => {
    expect(groupFor({ inputs: { pr_number: "12", issue_number: "" } })).toBe(
      "moneypenny-repair-pr-12",
    );
    expect(groupFor({ inputs: { pr_number: "", issue_number: "34" } })).toBe(
      "moneypenny-repair-issue-34",
    );
  });
});
