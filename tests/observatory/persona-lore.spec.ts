import { PERSONA_LORE, personaLore } from "../../src/observatory/persona-lore.js";
import { createDefaultPersonas } from "../../src/personas/registry.js";

describe("persona lore registry", () => {
  const personas = createDefaultPersonas();

  it("covers every registered persona with a matching name and thesis (no drift)", () => {
    for (const p of personas) {
      const lore = PERSONA_LORE[p.id];
      expect(lore, `missing lore for persona ${p.id}`).toBeDefined();
      expect(lore?.name).toBe(p.name);
      expect(lore?.thesis).toBe(p.thesis);
    }
  });

  it("has no lore entries for personas that no longer exist", () => {
    const ids = new Set(personas.map((p) => p.id));
    for (const id of Object.keys(PERSONA_LORE)) {
      expect(ids.has(id), `orphaned lore entry ${id}`).toBe(true);
    }
  });

  it("gives Sauron a character legend (the lore layer seed)", () => {
    expect(personaLore("sauron")?.lore).toContain("order-imposer");
  });

  it("gives every registered persona a character legend (the fantasy lore layer)", () => {
    for (const p of personas) {
      const legend = PERSONA_LORE[p.id]?.lore;
      expect(legend, `missing legend for persona ${p.id}`).toBeTruthy();
    }
  });

  it("returns undefined for an unknown or missing id", () => {
    expect(personaLore(undefined)).toBeUndefined();
    expect(personaLore("nobody")).toBeUndefined();
  });
});
