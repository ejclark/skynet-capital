import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { PlaybooksChapter } from "../../src/shell/playbooks-chapter";

/**
 * M·03's playbook cards (#1119) — dead end 8 (#3807 slice 2e). WHEN an earned playbook's Arm is
 * disabled, THE card SHALL say why as visible text the button is described by — a title has no
 * hover on a phone. A locked playbook offers no Arm at all.
 */
const card = (id: string, unlocked: boolean) => ({
  id,
  glyph: "◆",
  title: `Playbook ${id}`,
  kind: "wheel",
  detail: "Fixture detail.",
  unlocksAfter: "201",
  unlocksAfterName: "Cash-secured put",
  seasonOneCriteria: "three clean cycles",
  unlocked,
});

rstest.mock("../../src/live/playbooks", () => ({
  fetchPlaybooks: () =>
    Promise.resolve({
      linked: true,
      milestone: { id: "playbooks", code: "M·03", title: "Playbooks", desc: "" },
      arming: "season-1",
      unlocked: 1,
      total: 2,
      playbooks: [card("earned", true), card("locked", false)],
    }),
}));

describe("PlaybooksChapter", () => {
  it("says why Arm is off in visible text the button is described by, never a title", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <PlaybooksChapter />
      </QueryClientProvider>,
    );
    const arm = await screen.findByRole("button", { name: "Arm · soon" });
    expect(arm).toBeDisabled();
    expect(arm).not.toHaveAttribute("title");
    expect(arm).toHaveAccessibleDescription("Arming opens to human accounts with Season 1.");
    expect(screen.getByText("Arming opens to human accounts with Season 1.")).toBeVisible();
    // Only the earned card offers Arm.
    expect(screen.getAllByRole("button", { name: "Arm · soon" })).toHaveLength(1);
  });
});
