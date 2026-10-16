import { render, screen } from "@testing-library/react";
import type { EarningsPrint } from "../../../src/domain/earnings-calendar";
import { windowPlan } from "../../src/live/playbook-rule";
import type { PrintStretchesView } from "../../src/live/playbook-store";
import { gateLine, stepRows, WindowTimeline } from "../../src/shell/playbook-window";

/**
 * A pre-earnings play as one line (#5432, Eric's pick on #5163 round 4):
 *  - The line SHALL show today, ① the buy day, the held stretch filled, ② the sell day, the stretch
 *    it is out of hatched, and ◆ the earnings report, with a ruler in trading days to the report.
 *  - Every date SHALL say what it counts back from; member copy SHALL say "earnings report" and
 *    "trading days", never "print", "D-5" or "session".
 *  - WHILE the report date is an estimate, the picture SHALL say how far the dates could move and
 *    that only a confirmed date buys — a date confirmed inside the window still buys (the code).
 *  - WHERE the study measured stretches, one bar per stretch; a fall SHALL be hatched below the line.
 *    A pair with no stretches SHALL draw everything but the bars.
 */

// The study world: Thursday 2026-10-08, NVDA's Q3 report estimated Nov 18 (spread Nov 17–25).
const NOW = "2026-10-08T19:00:00Z";
const NVDA_NOV18: EarningsPrint[] = [
  {
    symbol: "NVDA",
    date: "2026-11-18",
    status: "estimate",
    source: "test",
    window: { start: "2026-11-17", end: "2026-11-25" },
  },
];
const S1_SPAN = "20 to 6 sessions before the print";
const STRETCHES: PrintStretchesView = {
  source: "docs/research/nvda-earnings-cycle.md F2",
  era: "2023–26",
  reports: 14,
  stretches: [
    { from: 20, to: 10, meanPct: 6.3, rose: 13 },
    { from: 10, to: 5, meanPct: 3.61, rose: 11 },
    { from: 5, to: 0, meanPct: -0.77, rose: 7 },
  ],
};

const nvdaPlan = () => {
  const plan = windowPlan("NVDA", S1_SPAN, NOW, NVDA_NOV18);
  if (!plan) throw new Error("no plan");
  return plan;
};

describe("a pre-earnings play as one line", () => {
  it("counts S1's buy, hold and sell back from NVDA's Nov 18 report", () => {
    expect(stepRows(nvdaPlan())).toEqual([
      "① Buy · Oct 21 · 20 trading days before",
      "Hold · Oct 21 – Nov 10",
      "② Sell · Nov 11 · 5 trading days before",
    ]);
  });

  it("draws the line, the ruler and the report, and says how far an estimate could move", () => {
    render(<WindowTimeline plan={nvdaPlan()} stretches={STRETCHES} />);
    const line = screen.getByRole("img", { name: /^NVDA's window: holds from Oct 21/ });
    expect(line.textContent).toContain("holds NVDA");
    expect(line.textContent).toContain("not held");
    expect(line.textContent).toContain("earnings report Nov 18 est.");
    expect(line.querySelector(".pbr-today")).not.toBeNull();
    expect(line.textContent).toContain("today");
    expect(line.querySelector(".pbr-print")?.textContent).toBe("◆");
    expect([...line.querySelectorAll(".pbr-ruler .pbr-fig")].map((t) => t.textContent)).toEqual([
      "−20",
      "−10",
      "−5",
      "0",
    ]);
    expect(line.textContent).toContain("trading days to the report");
    expect(
      screen.getByText("The dates move if the report date moves (buy Oct 20–28)."),
    ).toBeInTheDocument();
  });

  it("draws one bar per stretch, a fall hatched below the line and named as sold by then", () => {
    render(<WindowTimeline plan={nvdaPlan()} stretches={STRETCHES} />);
    const bars = screen.getByRole("img", { name: /^NVDA's average move before its last 14/ });
    const figures = [...bars.querySelectorAll("text")].map((t) => t.textContent);
    expect(figures).toEqual([
      "+6.3%",
      "13 of 14",
      "+3.6%",
      "11 of 14",
      "−0.8%",
      "7 of 14 went up",
      "sold by then",
    ]);
    const hatched = bars.querySelectorAll("rect.pbr-lose");
    expect(hatched).toHaveLength(1);
    expect(hatched[0]?.getAttribute("fill")).toBe("url(#pbr-hatch-b)");
    expect(
      screen.getByText(
        "Each bar: NVDA's average move in that stretch before its last 14 earnings reports, 2023–26.",
      ),
    ).toBeInTheDocument();
  });

  it("draws everything but the bars for a pair whose study measured no stretches", () => {
    render(<WindowTimeline plan={nvdaPlan()} />);
    expect(screen.getByRole("img", { name: /^NVDA's window/ })).toBeInTheDocument();
    expect(screen.getByText("① Buy · Oct 21 · 20 trading days before")).toBeInTheDocument();
    expect(screen.queryByText("Average move in each stretch")).toBeNull();
  });

  it("never says print, session or D-numbers in what a member reads", () => {
    const { container } = render(<WindowTimeline plan={nvdaPlan()} stretches={STRETCHES} />);
    const said = [
      container.textContent,
      ...[...container.querySelectorAll("[aria-label]")].map((e) => e.getAttribute("aria-label")),
    ].join(" ");
    expect(said).not.toMatch(/print|session|D-\d/i);
  });

  it("puts GOOG's ② on report day, before the close, with nothing hatched after it", () => {
    const goog: EarningsPrint[] = [
      { symbol: "GOOG", date: "2026-10-28", status: "estimate", source: "test" },
    ];
    const plan = windowPlan(
      "GOOG",
      "20 sessions before the print to the close of print day",
      NOW,
      goog,
    );
    if (!plan) throw new Error("no plan");
    expect(stepRows(plan)).toEqual([
      "① Buy · Sep 30 · 20 trading days before",
      "Hold · Sep 30 – Oct 28",
      "② Sell · Oct 28 · report day, before the close",
    ]);
    const { container } = render(<WindowTimeline plan={plan} />);
    expect(container.querySelector("rect.pbr-lose")).toBeNull();
    expect(screen.getByText("The dates move if the report date moves.")).toBeInTheDocument();
  });
});

describe("the gate while the report date is an estimate", () => {
  it("before the window: buys only once confirmed, as late as the last day it would hold", () => {
    expect(gateLine(nvdaPlan())).toBe(
      "It buys only once the report date is confirmed, as late as Nov 10. Unconfirmed by then, it skips to the next report.",
    );
  });

  it("inside the window: says it holds nothing yet, never that it waits for the window to open", () => {
    const plan = windowPlan("NVDA", S1_SPAN, "2026-10-29T15:00:00Z", NVDA_NOV18);
    expect(plan?.phase).toBe("inside");
    expect(plan && gateLine(plan)).toBe(
      "The report date isn't confirmed yet, so it holds nothing. Confirmed by Nov 10, it buys then; if not, it skips to the next report.",
    );
  });

  it("says nothing extra once the date is confirmed, and drops est.", () => {
    const confirmed: EarningsPrint[] = [
      { symbol: "NVDA", date: "2026-11-18", status: "confirmed", source: "IR: test" },
    ];
    const plan = windowPlan("NVDA", S1_SPAN, NOW, confirmed);
    if (!plan) throw new Error("no plan");
    expect(gateLine(plan)).toBeUndefined();
    render(<WindowTimeline plan={plan} />);
    expect(screen.getByRole("img", { name: /^NVDA's window/ }).textContent).toContain(
      "earnings report Nov 18",
    );
    expect(screen.queryByText(/est\./)).toBeNull();
    expect(screen.queryByText(/The dates move/)).toBeNull();
  });
});
