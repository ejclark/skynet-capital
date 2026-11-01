import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { digestLines, memoryClaims, redact } from "../../scripts/dream-digest.mjs";

const row = (value: unknown) => JSON.stringify(value);
const typed = (text: string) =>
  row({ type: "user", timestamp: "2026-11-01T00:00:00Z", message: { content: text } });

describe("memory review digest", () => {
  it("keeps what a person typed and drops what the harness injected", () => {
    const digest = digestLines([
      typed("why does this keep failing"),
      typed("<task-notification>done</task-notification>"),
      typed("  <system-reminder>noise</system-reminder>"),
      row({ type: "user", isSidechain: true, message: { content: "a sub-agent prompt" } }),
    ]);
    expect(digest.typed.map((t: { text: string }) => t.text)).toEqual([
      "why does this keep failing",
    ]);
  });

  it("keeps tool errors and counts tools, because bad configuration shows up there first", () => {
    const digest = digestLines([
      row({
        type: "assistant",
        message: {
          content: [
            { type: "tool_use", name: "Bash", input: {} },
            { type: "tool_use", name: "Bash", input: {} },
            { type: "tool_use", name: "Skill", input: { skill: "ship" } },
          ],
        },
      }),
      row({
        type: "user",
        timestamp: "2026-11-01T00:00:01Z",
        message: {
          content: [{ type: "tool_result", is_error: true, content: "command not found: timeout" }],
        },
      }),
    ]);
    expect(digest.tools).toEqual({ Bash: 2, Skill: 1 });
    expect(digest.skills).toEqual({ ship: 1 });
    expect(digest.errors[0].text).toBe("command not found: timeout");
  });

  it("removes credentials before text leaves the transcript", () => {
    expect(redact("token ghp_abcdefghijklmnop123 here")).not.toContain("ghp_abcdefghijklmnop123");
    expect(redact("API_KEY=abcdefghijklmnopqrstuvwx")).toContain("[redacted]");
    expect(redact("ordinary words stay")).toBe("ordinary words stay");
    expect(digestLines([typed("my key is sk-ant-abcdefghijklmnop")]).typed[0].text).toContain(
      "[redacted]",
    );
  });

  it("survives a corrupt line and counts compactions", () => {
    const digest = digestLines([
      "not json",
      row({ subtype: "compact_boundary", timestamp: "2026-11-01T00:00:00Z" }),
    ]);
    expect(digest.compactions).toBe(1);
    expect(digest.first).toBe("2026-11-01T00:00:00Z");
  });

  it("finds the paths and issues a memory cites", () => {
    expect(
      memoryClaims("See `scripts/steer/pins.mjs` and `README.md`, after #5135 (#51 is too short)"),
    ).toEqual({
      paths: ["scripts/steer/pins.mjs"],
      issues: [5135],
    });
  });
});
