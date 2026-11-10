import type { MpMessage } from "../../src/live/moneypenny";
import {
  linesOf,
  type MpThread,
  messageCount,
  rowLines,
  threadIndex,
  withThread,
} from "../../src/live/moneypenny-threads";

/**
 * Side threads on their row (#7167 criterion 11): one message list, each line tagged with the row
 * key of the thread it belongs to. These are the pure reads every surface shares — which lines a
 * conversation shows, which a row shows, and the rail's index of threads.
 */

const cw: MpThread = {
  key: "event-2026-11-10-coreweave-q3-results",
  title: "CoreWeave Q3 results",
  path: "/#event-2026-11-10-coreweave-q3-results",
};
const fed: MpThread = { key: "story-fed", title: "The Fed holds", path: "/#story-fed" };

const thread: MpMessage[] = [
  { role: "mp", text: "Moneypenny · hello" },
  { role: "user", text: "About CoreWeave: what's the setup?", thread: cw.key },
  { role: "sys", text: "sauron·ops · logged", thread: cw.key },
  { role: "mp", text: "Moneypenny · see its row", thread: cw.key },
  { role: "user", text: "what's moving today?" },
  { role: "user", text: "About the Fed: why?", thread: fed.key },
];

describe("a conversation's lines", () => {
  it("keeps the main conversation free of every side thread's lines", () => {
    expect(linesOf(thread, undefined).map((m) => m.text)).toEqual([
      "Moneypenny · hello",
      "what's moving today?",
    ]);
  });

  it("gives a thread only its own lines, system notes included", () => {
    expect(linesOf(thread, cw.key)).toHaveLength(3);
  });

  it("shows a row only the member's questions and her answers", () => {
    expect(rowLines(thread, cw.key).map((m) => m.role)).toEqual(["user", "mp"]);
  });
});

describe("the rail's index of threads", () => {
  it("lists each thread with lines, the one touched last first, with its count", () => {
    expect(threadIndex([cw, fed], thread)).toEqual([
      { thread: fed, count: 1 },
      { thread: cw, count: 2 },
    ]);
  });

  it("leaves out a thread whose row was asked about but holds no lines", () => {
    const empty: MpThread = { key: "story-x", title: "X", path: "/#story-x" };
    expect(threadIndex([empty], thread)).toEqual([]);
  });

  it("remembers a thread once, renamed when its row's words change", () => {
    const renamed = { ...cw, title: "CoreWeave reports Q3" };
    expect(withThread([cw, fed], renamed)).toEqual([fed, renamed]);
  });

  it("counts in words", () => {
    expect(messageCount(1)).toBe("1 message");
    expect(messageCount(3)).toBe("3 messages");
  });
});
