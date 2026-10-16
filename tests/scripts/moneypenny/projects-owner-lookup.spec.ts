import { describe, expect, it } from "@rstest/core";
import { readProjectShapeFromGh } from "../../../scripts/moneypenny/projects-sync.mjs";

// #4933 — THE PER-RUN BOARD READS NO LONGER GO THROUGH gh's OWNER LOOKUP.
//
// `gh project field-list 2 --owner ejclark` failed three times in ~8s on run 37881706331 with the
// bare `unknown owner type`, while a direct GraphQL call on the same token succeeded. The string
// comes from gh's `UserOrgOwner` query, which asks for both `user` and `organization` and maps any
// error shape other than an exact NOT_FOUND on the org half to that one line. These reads now ask
// `user(login)` directly, so a GitHub fault keeps its own words and the shared retry can see it.
// Every assertion below fails on the pre-fix code: `readProjectShapeFromGh` did not exist, and the
// fields/project reads shelled `gh project field-list` / `gh project list --owner`.

const field = (over: Record<string, unknown>) => ({ __typename: "ProjectV2Field", ...over });
const ok = (nodes: unknown[]) =>
  JSON.stringify({
    data: { user: { projectV2: { id: "PVT_board", number: 2, fields: { nodes } } } },
  });

describe("moneypenny projects: the board's id and fields, without gh's owner lookup (#4933)", () => {
  it("asks GraphQL about the user's project directly — never `gh project … --owner`", () => {
    let argv: string[] = [];
    readProjectShapeFromGh({
      gh: (a: string[]) => {
        argv = a;
        return ok([]);
      },
    });

    const flat = argv.join(" ");
    expect(argv.slice(0, 2)).toEqual(["api", "graphql"]);
    expect(argv).not.toContain("project");
    expect(argv).not.toContain("--owner");
    expect(flat).toContain("user(login:$owner){ projectV2(number:$project)");
    expect(flat).not.toContain("organization");
    expect(flat).toContain("owner=ejclark");
    expect(flat).toContain("project=2");
  });

  it("shapes the fields like field-list rows, options only where the field has them", () => {
    const { project, fields } = readProjectShapeFromGh({
      gh: () =>
        ok([
          field({ id: "PVTF_title", name: "Title" }),
          field({
            __typename: "ProjectV2SingleSelectField",
            id: "PVTSSF_status",
            name: "Status",
            options: [
              { id: "opt_ready", name: "Ready" },
              { id: "opt_done", name: "Done" },
            ],
          }),
        ]),
    });

    expect(project).toEqual({ id: "PVT_board", number: 2 });
    expect(fields).toEqual([
      { id: "PVTF_title", name: "Title", type: "ProjectV2Field" },
      {
        id: "PVTSSF_status",
        name: "Status",
        type: "ProjectV2SingleSelectField",
        options: [
          { id: "opt_ready", name: "Ready" },
          { id: "opt_done", name: "Done" },
        ],
      },
    ]);
  });

  it("drops a node GitHub returned without an id or name rather than inventing a field", () => {
    const { fields } = readProjectShapeFromGh({
      gh: () => ok([null, { __typename: "ProjectV2Field" }, field({ id: "PVTF_x", name: "X" })]),
    });
    expect(fields.map((f) => f.id)).toEqual(["PVTF_x"]);
  });

  it("fails loudly when the token cannot see the project — never an empty field list", () => {
    const blind = JSON.stringify({ data: { user: { projectV2: null } } });
    expect(() => readProjectShapeFromGh({ gh: () => blind })).toThrow(
      "project #2 not found under ejclark",
    );
    expect(() => readProjectShapeFromGh({ gh: () => "" })).toThrow("not found");
  });
});
