import { describe, expect, it } from "@rstest/core";
import { resolveBoardItem } from "../../../scripts/moneypenny/projects.mjs";
import {
  addIssueToBoardFromGh,
  readProjectShapeFromGh,
} from "../../../scripts/moneypenny/projects-sync.mjs";

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

// #5792 — THE ADD LEFT gh's OWNER LOOKUP TOO. Run 39184644834 lost `gh project item-add 2 --owner
// ejclark` for brand-new #5791 to the same masked `unknown owner type`, with the GraphQL probe on the
// same token green. #4933 had kept `item-add` on `gh project` on the theory that it rarely runs —
// but every new issue's first sync runs it. Every assertion below fails on the pre-fix code:
// `addIssueToBoardFromGh` did not exist, and the add shelled `gh project item-add --owner`.
const ISSUE = {
  number: 5791,
  node_id: "I_kwDOissue",
  html_url: "https://github.com/ejclark/skynet-capital/issues/5791",
};
const added = (id: string | null) =>
  JSON.stringify({ data: { addProjectV2ItemById: { item: id ? { id } : null } } });

describe("moneypenny projects: adding an issue to the board, without gh's owner lookup (#5792)", () => {
  it("sends addProjectV2ItemById with the board's id and the issue's node id — no `--owner`", () => {
    let argv: string[] = [];
    addIssueToBoardFromGh(
      { projectId: "PVT_board", issue: ISSUE },
      {
        gh: (a: string[]) => {
          argv = a;
          return added("PVTI_new");
        },
      },
    );

    const flat = argv.join(" ");
    expect(argv.slice(0, 2)).toEqual(["api", "graphql"]);
    expect(argv).not.toContain("project");
    expect(argv).not.toContain("--owner");
    expect(flat).toContain("addProjectV2ItemById(input:{projectId:$project,contentId:$content})");
    expect(flat).not.toContain("organization");
    expect(argv).toContain("project=PVT_board");
    expect(argv).toContain("content=I_kwDOissue");
  });

  it("returns the item shaped like an item-list row, so a cached board finds it next time", () => {
    const item = addIssueToBoardFromGh(
      { projectId: "PVT_board", issue: ISSUE },
      { gh: () => added("PVTI_new") },
    );
    expect(item).toEqual({ id: "PVTI_new", content: { type: "Issue", url: ISSUE.html_url } });
  });

  it("fails loudly on a missing id rather than writing Status to nothing", () => {
    const gh = () => added("PVTI_new");
    expect(() => addIssueToBoardFromGh({ projectId: "", issue: ISSUE }, { gh })).toThrow(
      "no project id",
    );
    expect(() =>
      addIssueToBoardFromGh({ projectId: "PVT_board", issue: { ...ISSUE, node_id: "" } }, { gh }),
    ).toThrow("no node_id");
    expect(() =>
      addIssueToBoardFromGh({ projectId: "PVT_board", issue: ISSUE }, { gh: () => added(null) }),
    ).toThrow("returned no item");
  });

  it("keeps a second add's `Content already exists` legible to resolveBoardItem's find path", () => {
    // `gh api graphql` words a GraphQL error as `gh: <message>` — the phrase #3954 keys on survives.
    const already = () =>
      addIssueToBoardFromGh(
        { projectId: "PVT_board", issue: ISSUE },
        {
          gh: () => {
            throw Object.assign(new Error("Command failed: gh api graphql"), {
              stderr: "gh: Content already exists in this project\n",
            });
          },
        },
      );
    const onBoard = { id: "PVTI_old", content: { type: "Issue", url: ISSUE.html_url } };
    const { item, added: wasAdded } = resolveBoardItem({
      issueUrl: ISSUE.html_url,
      addItem: already,
      listItems: () => ({ items: [onBoard], totalCount: 1 }),
      sleep: () => undefined,
    });
    expect(wasAdded).toBe(false);
    expect(item.id).toBe("PVTI_old");
  });
});
