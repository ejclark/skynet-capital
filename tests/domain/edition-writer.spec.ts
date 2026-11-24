import type { NewsItem } from "../../src/domain/campaign-news.js";
import type { Campaign } from "../../src/domain/campaigns.js";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { parseEdition } from "../../src/domain/edition.js";
import {
  dayLabel,
  editionDue,
  type SessionClose,
  signedPct,
  type WriterInput,
  writeEdition,
} from "../../src/domain/edition-writer.js";
import type { MarketEvent } from "../../src/domain/market-events-types.js";

// #8252: the day's edition, written by code after each close. Every number on the page comes from
// the inputs; the words only wrap numbers the cards already carry, and parseEdition proves it.

const campaign: Campaign = {
  id: "ai-buildout",
  title: "The AI buildout",
  storyline: "A spec campaign.",
  sector: "Information Technology",
  cast: [
    { role: "Chips", symbols: ["NVDA", "AMD", "MRVL"], source: "spec" },
    { role: "Buyers", symbols: ["MSFT", "AMZN"], source: "spec" },
    { role: "Benchmarks", symbols: ["SMH"], source: "spec" },
  ],
  forces: [{ id: "rates", name: "Rates", why: "spec", kinds: ["macro-print"] }],
  openQuestions: [],
};

const closes: Record<string, SessionClose> = {
  NVDA: { prev: 200, close: 180 }, // −10.0%
  AMD: { prev: 100, close: 103 }, // +3.0%
  MRVL: { prev: 80, close: 81 }, // +1.25%
  MSFT: { prev: 400, close: 404 }, // +1.0%
  AMZN: { prev: 250, close: 245 }, // −2.0%
  SMH: { prev: 300, close: 288 }, // −4.0%
};

const print = (symbol: string, date: string, status: EarningsPrint["status"]): EarningsPrint => ({
  symbol,
  date,
  status,
  source: status === "estimate" ? "EST: auto cadence — spec" : "IR: spec",
});

const event = (id: string, date: string, extra: Partial<MarketEvent> = {}): MarketEvent => ({
  id,
  kind: "macro-print",
  title: `${id} — a research note the edition leaves off`,
  date,
  status: "confirmed",
  source: "BLS: spec release calendar",
  impact: "high",
  symbols: [],
  ...extra,
});

const news = (
  id: string,
  title: string,
  at: string,
  source = "NEWS: spec.com via GDELT",
): NewsItem => ({
  id,
  title,
  url: source.startsWith("SEC") ? "https://www.sec.gov/x" : "https://spec.com/x",
  at,
  source,
});

function input(over: Partial<WriterInput> = {}): WriterInput {
  return {
    date: "2026-11-24",
    campaign,
    closes,
    closesSource: "Yahoo daily closes for 2026-11-23 and 2026-11-24, fetched 2026-11-24T21:50Z",
    news: [],
    newsSource: "the news collector, run 2026-11-24T21:45:00Z",
    prints: [print("MRVL", "2026-11-27", "estimate"), print("NVDA", "2026-12-15", "confirmed")],
    events: [event("cpi-2026-11", "2026-11-25"), event("fomc-2026-12", "2026-12-09")],
    ...over,
  };
}

const judge = (e: unknown, date = "2026-11-24") => parseEdition(e, `${date}.json`, date);

describe("editionDue: the free scan before any fetch (criterion 1)", () => {
  const at = (iso: string) => new Date(iso);
  it("is due once a session has closed and no edition exists", () => {
    expect(editionDue("2026-11-24", at("2026-11-24T21:43:00Z"), false)).toEqual({ due: true });
  });
  it("is not due on a holiday, a weekend, before the close, or when the file exists", () => {
    expect(editionDue("2026-11-26", at("2026-11-26T21:43:00Z"), false).due).toBe(false);
    expect(editionDue("2026-11-28", at("2026-11-28T21:43:00Z"), false).due).toBe(false);
    expect(editionDue("2026-11-24", at("2026-11-24T20:59:00Z"), false).due).toBe(false);
    expect(editionDue("2026-11-24", at("2026-11-24T21:43:00Z"), true).due).toBe(false);
  });
  it("counts a 1:00 PM early close as closed by 1:00 PM", () => {
    expect(editionDue("2026-11-27", at("2026-11-27T18:01:00Z"), false)).toEqual({ due: true });
    expect(editionDue("2026-11-27", at("2026-11-27T17:59:00Z"), false).due).toBe(false);
  });
});

describe("writeEdition", () => {
  it("writes an edition parseEdition accepts, naming every source (criterion 2)", () => {
    const e = writeEdition(input());
    expect(() => judge(e)).not.toThrow();
    expect(e.campaign).toBe("ai-buildout");
    expect(e.writtenBy).toMatch(/Yahoo daily closes .* fetched 2026-11-24T21:50Z/);
    expect(e.writtenBy).toMatch(/the news collector, run 2026-11-24T21:45:00Z/);
    expect(e.writtenBy).toMatch(/earnings-calendar\.ts/);
    expect(e.writtenBy).toMatch(/No model wrote it/);
  });

  it("leads with the session's biggest movers, each change computed from its two closes (criterion 3)", () => {
    const [movers] = writeEdition(input()).stories;
    expect(movers?.id).toBe("movers");
    expect(movers?.facts.map((f) => `${f.label} ${f.value} ${f.move}`)).toEqual([
      "NVDA −10.0% down",
      "SMH −4.0% down",
      "AMD +3.0% up",
      "AMZN −2.0% down",
    ]);
    expect(movers?.line).toBe("NVDA fell 10.0%");
    expect(movers?.headline).toBe(
      "3 of 6 names in the AI buildout rose on Tue Nov 24; NVDA moved most, falling 10.0%.",
    );
    expect(movers?.more[1]?.text).toBe(
      "NVDA closed at 180.00, −10.0% from 200.00 the session before.",
    );
  });

  it("lists what is dated in the next five sessions, the campaign's own names first", () => {
    const ahead = writeEdition(input()).stories.find((s) => s.id === "ahead");
    expect(ahead?.reports.map((r) => r.what)).toEqual(["cpi-2026-11", "MRVL quarterly results"]);
    expect(ahead?.headline).toBe(
      "Dated next for the AI buildout: MRVL quarterly results on Fri, our estimate.",
    );
    expect(ahead?.symbols).toEqual(["MRVL"]);
    expect(ahead?.facts[0]?.label).toBe("MRVL");
  });

  it("carries an estimate as an estimate, on the story and in what's next (criterion 6)", () => {
    const e = writeEdition(input());
    const mrvl = e.next.find((d) => d.what === "MRVL quarterly results");
    expect(mrvl?.status).toBe("estimate");
    const line = e.stories
      .find((s) => s.id === "ahead")
      ?.more.find((l) => l.text.startsWith("MRVL"));
    expect(line?.mark).toBe("modeled");
    expect(line?.text).toMatch(/our estimate, not yet confirmed/);
  });

  it("keeps what's next to the coming seven days, and leaves a record's note off its title", () => {
    const e = writeEdition(input());
    expect(e.next.map((d) => `${d.date} ${d.what}`)).toEqual([
      "2026-11-25 cpi-2026-11",
      "2026-11-27 MRVL quarterly results",
    ]);
  });

  it("writes the news story only from items linked to the campaign and dated that session", () => {
    const items = [
      news("sec-nvda-1", "NVIDIA files an 8-K (NVDA)", "2026-11-24T20:00:00Z", "SEC: EDGAR 8-K"),
      news("gdelt-a", "Nvidia shares slide as chips sell off", "2026-11-24T19:00:00Z"),
      news("gdelt-b", "Nvidia: a buying opportunity after the drop", "2026-11-24T18:00:00Z"),
      news("gdelt-c", "Nvidia news from the day before", "2026-11-23T19:00:00Z"),
      news("gdelt-d", "A story about bananas", "2026-11-24T19:00:00Z"),
    ];
    const story = writeEdition(input({ news: items })).stories.find((s) => s.id === "news");
    expect(story?.more.map((l) => `${l.mark} ${l.text}`)).toEqual([
      "measured NVIDIA files an 8-K (NVDA)",
      "reported Nvidia shares slide as chips sell off",
    ]);
    expect(story?.symbols).toEqual(["NVDA"]);
    expect(story?.facts[0]?.value).toBe("−10.0%");
    expect(() => judge(writeEdition(input({ news: items })))).not.toThrow();
  });

  it("writes no news story, and says so, when the run collected none", () => {
    const e = writeEdition(input({ newsSource: undefined }));
    expect(e.stories.some((s) => s.id === "news")).toBe(false);
    expect(e.writtenBy).toMatch(/no news collected on this run/);
  });

  it("writes only the movers when nothing is dated ahead and no news linked", () => {
    const e = writeEdition(input({ prints: [], events: [] }));
    expect(e.stories.map((s) => s.id)).toEqual(["movers"]);
    expect(e.next).toEqual([]);
    expect(() => judge(e)).not.toThrow();
  });

  it("can never put a number on the page that the cards do not carry (criterion 4)", () => {
    const e = writeEdition(input());
    const [lead] = e.stories;
    const tampered = { ...e, stories: [{ ...lead, headline: "NVDA fell 12.7% on the day." }] };
    expect(() => judge(tampered)).toThrow(/its headline says "12.7"/);
  });

  it("never counts a source's fetch stamp or a report's ISO date as a carried number", () => {
    const e = writeEdition(input());
    const [lead] = e.stories;
    // The closes source says "2026-11-23 … 21:50Z"; neither 21, 50 nor 23-as-"20%" is a figure.
    const tampered = { ...e, stories: [{ ...lead, narrator: "NVDA moved 50% on the day." }] };
    expect(() => judge(tampered)).toThrow(/its narrator says "50"/);
  });

  it("draws a tiny fall as a fall, its sign and its move agreeing", () => {
    const e = writeEdition(input({ closes: { MSFT: { prev: 100.04, close: 100 } } }));
    expect(e.stories[0]?.facts[0]).toMatchObject({ label: "MSFT", value: "−0.04%", move: "down" });
    expect(() => judge(e)).not.toThrow();
  });
});

describe("the formatting the cards use", () => {
  it("signs every change with the house minus, and never prints a negative zero", () => {
    expect(signedPct(3.14)).toBe("+3.1%");
    expect(signedPct(-11.25)).toBe("−11.3%");
    expect(signedPct(-0.04)).toBe("−0.04%");
    expect(signedPct(0)).toBe("+0.0%");
    expect(signedPct(-0.001)).toBe("+0.0%");
  });
  it("names a day the way the cards say it", () => {
    expect(dayLabel("2026-11-24")).toBe("Tue Nov 24");
  });
});
