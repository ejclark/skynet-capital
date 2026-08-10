import { CeremonyChannel } from "../../src/observatory/ceremony-channel.js";
import type { WorldTransition } from "../../src/observatory/world-transitions.js";

const transition: WorldTransition = {
  id: "took_profit:human-eric:t0:t1",
  type: "took_profit",
  participantId: "human-eric",
  realized: 500,
  at: "t1",
};

describe("when a ceremony transition is emitted", () => {
  it("reaches every subscriber", () => {
    const channel = new CeremonyChannel();
    const seen: string[] = [];
    channel.subscribe((t) => seen.push(t.id));
    channel.subscribe((t) => seen.push(`second:${t.type}`));

    channel.emit(transition);

    expect(seen).toEqual(["took_profit:human-eric:t0:t1", "second:took_profit"]);
  });

  it("stops delivering after unsubscribe", () => {
    const channel = new CeremonyChannel();
    let seen = 0;
    const unsubscribe = channel.subscribe(() => seen++);

    unsubscribe();
    channel.emit(transition);

    expect(seen).toBe(0);
  });

  it("delivers to nobody without a subscriber, rather than throwing", () => {
    expect(() => new CeremonyChannel().emit(transition)).not.toThrow();
  });
});
