import { describe, expect, it } from "@rstest/core";
import {
  FIELDS,
  HORIZON_OPTIONS,
  isBacklogCandidate,
  PRIORITY_OPTIONS,
  STATUS_FIELD_OPTIONS,
  STATUS_OPTIONS,
  statusForIssue,
  statusOptionsMatch,
} from "../../../scripts/moneypenny/projects.mjs";

// #3818 slice B: the sync rule as a pure decision, so the mapping is proven without ever calling
// GitHub (which this session can't do for Projects anyway — GraphQL is blocked from interactive
// Claude Code sessions; the live `gh project` calls in projects-setup.mjs are only exercised by a
// real Actions run).
describe("moneypenny projects: statusForIssue", () => {
  it("closed always reads Done, even if it would otherwise be Blocked or In Progress", () => {
    expect(statusForIssue({ state: "closed", labels: ["needs-eric"], hasOpenLinkedPr: true })).toBe(
      "Done",
    );
  });

  it("needs-eric or needs-info reads Blocked ahead of an open linked PR", () => {
    expect(statusForIssue({ labels: ["needs-eric"], hasOpenLinkedPr: true })).toBe("Blocked");
    expect(statusForIssue({ labels: ["needs-info"] })).toBe("Blocked");
  });

  it("an open linked PR reads In Progress ahead of ready", () => {
    expect(statusForIssue({ labels: ["ready"], hasOpenLinkedPr: true })).toBe("In Progress");
  });

  it("ready with no linked PR reads Ready", () => {
    expect(statusForIssue({ labels: ["ready"] })).toBe("Ready");
  });

  it("an open issue with none of the above reads Backlog", () => {
    expect(statusForIssue({ labels: ["feedback"] })).toBe("Backlog");
    expect(statusForIssue()).toBe("Backlog");
  });
});

describe("moneypenny projects: isBacklogCandidate", () => {
  it("excludes ci-failure trackers — the event-research queue, not product backlog", () => {
    expect(isBacklogCandidate({ labels: ["ci-failure"] })).toBe(false);
    expect(isBacklogCandidate({ labels: ["ci-failure", "enhancement"] })).toBe(false);
  });

  it("admits everything else, including an untagged issue", () => {
    expect(isBacklogCandidate({ labels: ["enhancement", "plan"] })).toBe(true);
    expect(isBacklogCandidate()).toBe(true);
  });
});

describe("moneypenny projects: field/option constants", () => {
  it("Status carries the five kanban columns, in column order", () => {
    expect(STATUS_OPTIONS).toEqual(["Backlog", "Ready", "In Progress", "Blocked", "Done"]);
  });

  it("Priority and Horizon are the backlog-sort and roadmap-group option sets", () => {
    expect(PRIORITY_OPTIONS).toEqual(["P0", "P1", "P2", "P3"]);
    expect(HORIZON_OPTIONS).toEqual(["Now", "Next", "Later"]);
  });

  it("FIELDS names every field the setup script must create, each with its data type", () => {
    const byName = new Map(FIELDS.map((f) => [f.name, f]));
    expect(byName.get("Status")?.dataType).toBe("SINGLE_SELECT");
    expect(byName.get("Priority")?.dataType).toBe("SINGLE_SELECT");
    expect(byName.get("Horizon")?.dataType).toBe("SINGLE_SELECT");
    expect(byName.get("Target date")?.dataType).toBe("DATE");
    expect(byName.get("Target date")?.options).toBeUndefined();
  });
});

describe("moneypenny projects: statusOptionsMatch", () => {
  it("matches the same five names in any order", () => {
    expect(statusOptionsMatch(["Done", "Backlog", "Blocked", "Ready", "In Progress"])).toBe(true);
  });

  it("does not match GitHub's own default Status options (Todo/In Progress/Done)", () => {
    expect(statusOptionsMatch(["Todo", "In Progress", "Done"])).toBe(false);
  });

  it("does not match a superset or a subset of the five", () => {
    expect(
      statusOptionsMatch(["Backlog", "Ready", "In Progress", "Blocked", "Done", "Extra"]),
    ).toBe(false);
    expect(statusOptionsMatch(["Backlog", "Ready"])).toBe(false);
  });

  it("does not match nothing", () => {
    expect(statusOptionsMatch()).toBe(false);
    expect(statusOptionsMatch([])).toBe(false);
  });

  it("STATUS_FIELD_OPTIONS carries the same five names STATUS_OPTIONS does, each with a color", () => {
    expect(STATUS_FIELD_OPTIONS.map((o) => o.name)).toEqual(STATUS_OPTIONS);
    for (const option of STATUS_FIELD_OPTIONS) {
      expect(typeof option.color).toBe("string");
      expect(option.color.length).toBeGreaterThan(0);
    }
  });
});
