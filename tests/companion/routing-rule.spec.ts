import { COMPANION_SYSTEM_PROMPT } from "../../src/companion/companion-system-prompt.js";
import { COMPANION_TOOL_NAMES } from "../../src/companion/companion-tools.js";
import { ROUTING_RULE } from "../../src/companion/routing-rule.js";

/**
 * The size-up-and-route rule (the Moneypenny operator plan, slice size-up-and-route): she sorts
 * each message into one of four kinds and, for the three the record cannot answer, writes the
 * brief the member sends. These specs pin the words the rule depends on, not its whole prose.
 */
describe("the size-up-and-route rule", () => {
  describe("when the system prompt is built", () => {
    it("carries the rule as its own paragraph", () => {
      expect(COMPANION_SYSTEM_PROMPT).toContain(`\n\n${ROUTING_RULE}\n\n`);
    });

    it("states four jobs where the job statement used to stop at quick answers", () => {
      expect(COMPANION_SYSTEM_PROMPT).toContain("Your job has four parts");
      expect(COMPANION_SYSTEM_PROMPT).not.toContain("be the self-service desk");
    });

    it("turns a bare refusal into an offer to hand the question on", () => {
      expect(COMPANION_SYSTEM_PROMPT).toContain('Say "I don\'t have that yet"');
      expect(COMPANION_SYSTEM_PROMPT).toContain("then offer the hand-off that fits");
      expect(COMPANION_SYSTEM_PROMPT).toContain("never invent a figure, a route, or a rule");
    });
  });

  describe("when she sorts a message", () => {
    it("names the four kinds of ask", () => {
      expect(ROUTING_RULE).toContain("The record answers it");
      expect(ROUTING_RULE).toContain("It needs research nobody has done");
      expect(ROUTING_RULE).toContain("Something to build or fix");
      expect(ROUTING_RULE).toContain("A change to how the app or the league works");
    });

    it("leaves every write to the member's own tap or reply", () => {
      expect(ROUTING_RULE).toContain("you write the brief and the member sends it");
      expect(ROUTING_RULE).toContain("never say something is asked, filed or started");
      expect(ROUTING_RULE).toContain("one draft at a time");
    });

    it("gives a change proposal four labelled lines", () => {
      for (const label of [
        "Outcome members are after:",
        "What the app does today:",
        "Proposed change:",
        "How we would know it worked:",
      ]) {
        expect(ROUTING_RULE).toContain(label);
      }
    });

    it("never recommends a trade when sizing up where a member stands", () => {
      expect(ROUTING_RULE).toContain("Never a recommendation.");
    });
  });

  describe("when the rule names a tool", () => {
    it("names only tools she has on main", () => {
      const named = ROUTING_RULE.match(/\b(?:get|draft)_[a-z_]+/g) ?? [];
      expect(named.length).toBeGreaterThan(0);
      for (const tool of named) {
        expect(COMPANION_TOOL_NAMES as readonly string[]).toContain(tool);
      }
    });

    it("names no tool another slice has yet to ship", () => {
      expect(ROUTING_RULE).not.toContain("draft_research_ask");
      expect(ROUTING_RULE).not.toContain("get_research_on");
    });
  });

  describe("when the rule is read as a single paragraph", () => {
    it("has no line break and no trailing whitespace", () => {
      expect(ROUTING_RULE).not.toContain("\n");
      expect(ROUTING_RULE).toBe(ROUTING_RULE.trim());
    });
  });
});
