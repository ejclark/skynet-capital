import { checkBody, commandOf, dueChecks, markerOf, trackerOf } from "../../scripts/loop-check.mjs";

// The learning-loop registry checks itself (2026-10-18 loop census): a due row posts once per date.
const row = (
  loop: string,
  nextCheck: string | null,
  question = "Is it so?",
  state = "running",
) => ({
  loop,
  issue: "#1",
  state,
  nextCheck,
  question,
  nextCheckText: `${nextCheck} — wrong if it is not`,
});

describe("loop-check — the registry's due checks run themselves", () => {
  it("names the command a question carries, or none for a check done by hand", () => {
    expect(commandOf("Pass rates? `npm run research:scorecard`")).toBe("research:scorecard");
    expect(commandOf("Is ownership the limit?")).toBeNull();
  });

  it("reads the tracker issue from the registry's own text", () => {
    expect(trackerOf("…**Check results post to:** #5724")).toBe(5724);
    expect(trackerOf("no line")).toBeNull();
  });

  it("lists running rows whose date has come, minus ones already posted for that date", () => {
    const rows = [
      row("Scorecard", "2026-10-10", "`npm run research:scorecard`"),
      row("By hand", "2026-10-15"),
      row("Later", "2026-11-01"),
      row("Ended", "2026-10-01", "x", "killed"),
    ];
    const posted = [`old comment ${markerOf("By hand", "2026-10-15")}`];
    const due = dueChecks({ today: "2026-10-18", rows, posted });
    expect(due.map((d) => [d.loop, d.command])).toEqual([["Scorecard", "research:scorecard"]]);
  });

  it("posts again when the owner moves the date — a new date is a new check", () => {
    const posted = [markerOf("By hand", "2026-10-15")];
    expect(
      dueChecks({ today: "2026-10-25", rows: [row("By hand", "2026-10-22")], posted }),
    ).toHaveLength(1);
  });

  it("puts the command's output beside the falsifier it is judged against, and carries the marker", () => {
    const [check] = dueChecks({
      today: "2026-10-18",
      rows: [row("Scorecard", "2026-10-10", "`npm run research:scorecard`")],
    });
    if (!check) throw new Error("expected a due check");
    const body = checkBody(check, { ok: true, output: "high 69% · medium 72%" });
    expect(body).toContain("**Judged against:** 2026-10-10 — wrong if it is not");
    expect(body).toContain("high 69% · medium 72%");
    expect(body).toContain(check.marker);
    expect(checkBody(check, { ok: false, output: "timed out after 90s" })).toContain(
      "Run it by hand",
    );
  });
});
