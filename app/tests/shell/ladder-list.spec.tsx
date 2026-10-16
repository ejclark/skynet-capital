import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Journey, JourneyMilestone } from "../../src/live/learn";
import type { PlayInfo, PlaysIndex } from "../../src/live/options";
import { LadderList } from "../../src/shell/ladder-list";

/**
 * The trading chapter's ladder, drawn once (#5242; Eric's pick on #5176 round 2). WHEN a level is
 * finished, THE list SHALL show one line per rung with its earned date; WHEN a rung is the server's
 * `nextUp`, its row SHALL be open with the Trade link; WHEN the desk locks a rung, its row SHALL
 * name what opens it and offer no Trade link; no rung SHALL link to the page it is on.
 */

// The Trade link is a router Link; no router here, so render the address it builds.
rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    className,
    to,
    search,
  }: {
    children: ReactNode;
    className?: string;
    to: string;
    search: Record<string, string>;
  }) => (
    <a href={`${to}?${new URLSearchParams(search).toString()}`} className={className}>
      {children}
    </a>
  ),
}));

const rung = (code: string, earned?: JourneyMilestone["earned"]): JourneyMilestone => ({
  id: `m-${code}`,
  code,
  title: `Title ${code}`,
  detail: `Why ${code} matters`,
  points: 25,
  ticket: `/app/trade?play=${code}`,
  ...(earned ? { earned } : {}),
});

// Round 2's state: training wheels on, 101 and 102 earned, 201 next, 202 opens after 201 fills.
const journey: Journey = {
  linked: true,
  points: 50,
  totalPoints: 200,
  rank: "Apprentice",
  courses: [
    {
      level: 100,
      title: "Stock basics",
      subtitle: "",
      locked: false,
      done: 2,
      total: 2,
      milestones: [
        rung("101", { on: "2026-09-26", orderId: "ord-101" }),
        rung("102", { on: "2026-10-06", orderId: "ord-102" }),
      ],
    },
    {
      level: 200,
      title: "The Wheel",
      subtitle: "",
      locked: false,
      done: 0,
      total: 2,
      milestones: [rung("201"), rung("202")],
    },
    {
      level: 300,
      title: "Directional longs",
      subtitle: "",
      locked: true,
      done: 0,
      total: 2,
      milestones: [rung("301"), rung("302")],
    },
  ],
  celebrating: [],
  engagementCelebrating: [],
  pendingChecks: 0,
};

const play = (code: PlayInfo["code"], over: Partial<PlayInfo> = {}): PlayInfo => ({
  code,
  id: `p-${code}`,
  name: `Play ${code}`,
  tldr: "",
  kind: "stock",
  gloss: "",
  locked: false,
  earned: false,
  ...over,
});

const plays: PlaysIndex = {
  linked: true,
  wheels: true,
  nextUp: "201",
  plays: [
    play("101", { earned: true }),
    play("102", { earned: true }),
    play("201"),
    play("202", { locked: true, opensAfter: { code: "201", name: "Play 201" } }),
    play("301", { locked: true }),
    play("302", { locked: true }),
  ],
};

const rowOf = (code: string): HTMLElement => {
  const row = screen.getAllByText(code)[0]?.closest("li");
  if (!row) throw new Error(`no row for ${code}`);
  return row;
};

describe("LadderList", () => {
  it("counts the ladder once, as earned", () => {
    render(<LadderList journey={journey} plays={plays} deskId="eric" />);
    expect(screen.getByText("2 / 6 earned")).toBeInTheDocument();
    expect(screen.queryByText(/complete/)).not.toBeInTheDocument();
  });

  it("draws a finished level as one line per rung with its earned date, the order one tap deep", () => {
    render(<LadderList journey={journey} plays={plays} deskId="eric" />);
    const row = rowOf("101");
    expect(within(row).getByText("earned 2026-09-26")).toBeInTheDocument();
    expect(within(row).getByText("✓")).toBeInTheDocument();
    expect(within(row).queryByText("Title 101")).not.toBeInTheDocument();
    expect(within(row).queryByText("Why 101 matters")).not.toBeInTheDocument();
    expect(row.querySelector("a")).toBeNull();
    const order = within(row).getByText("order ord-101");
    expect(order.closest("details")).not.toHaveAttribute("open");
    expect(within(rowOf("102")).getByText("earned 2026-10-06")).toBeInTheDocument();
  });

  it("opens the next rung's row: title, explanation and the Trade link preset to it", () => {
    render(<LadderList journey={journey} plays={plays} deskId="eric" />);
    const row = rowOf("201");
    expect(row.querySelector("details")).toBeNull();
    expect(within(row).getByText("Title 201")).toBeInTheDocument();
    expect(within(row).getByText("Why 201 matters")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "open Trade →" })).toHaveAttribute(
      "href",
      "/trade?desk=eric&play=201",
    );
  });

  it("gives a locked rung no Trade link and says what opens it", () => {
    render(<LadderList journey={journey} plays={plays} deskId="eric" />);
    const row = rowOf("202");
    expect(within(row).getByText("opens after 201 fills")).toBeInTheDocument();
    expect(row.querySelector("a")).toBeNull();
    // Every other rung is one line, its explanation one tap deep.
    expect(within(row).getByText("Why 202 matters").closest("details")).not.toHaveAttribute("open");
  });

  it("keeps a locked level listed with its lock line and a line per rung", () => {
    render(<LadderList journey={journey} plays={plays} deskId="eric" />);
    const level = screen.getByRole("region", { name: /Level 300/ });
    expect(within(level).getByText("🔒 finish the level below")).toBeInTheDocument();
    expect(within(level).getAllByRole("listitem")).toHaveLength(2);
    expect(level.querySelector("a")).toBeNull();
  });

  it("never links a rung to the page it is on", () => {
    const { container } = render(<LadderList journey={journey} plays={plays} deskId="eric" />);
    for (const a of container.querySelectorAll("a")) {
      expect(a.getAttribute("href")).toMatch(/^\/trade\?/);
    }
    expect(container.querySelector("[aria-current]")).toBeNull();
  });

  it("offers Trade on no rung when the desk's plays have not answered", () => {
    const { container } = render(<LadderList journey={journey} deskId="eric" />);
    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByText("earned 2026-09-26")).toBeInTheDocument();
  });
});
