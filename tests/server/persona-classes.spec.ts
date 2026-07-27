import { personaClasses } from "../../src/server/persona-classes.js";
import { createDefaultPersonas } from "../../src/personas/registry.js";
import { personaLore } from "../../src/observatory/persona-lore.js";

describe("personaClasses", () => {
  const classes = personaClasses();

  it("lists every registered persona in registry order", () => {
    const ids = createDefaultPersonas().map((p) => p.id);
    expect(classes.map((c) => c.id)).toEqual(ids);
  });

  it("mirrors each persona's name and thesis (no drift from the engine)", () => {
    for (const p of createDefaultPersonas()) {
      const c = classes.find((x) => x.id === p.id);
      expect(c?.name).toBe(p.name);
      expect(c?.thesis).toBe(p.thesis);
    }
  });

  it("carries the fantasy legend from the lore layer when present", () => {
    const duelist = classes.find((c) => c.id === "day-trader");
    expect(duelist?.legend).toBe(personaLore("day-trader")?.lore);
    expect(duelist?.legend).toContain("Duelist");
  });
});
