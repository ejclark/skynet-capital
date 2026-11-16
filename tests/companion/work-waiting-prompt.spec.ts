import { COMPANION_SYSTEM_PROMPT } from "../../src/companion/companion-system-prompt.js";
import { COMPANION_TOOL_DEFS } from "../../src/companion/companion-tools.js";

/**
 * The Moneypenny operator plan, slice filing-wait-explained: she explains a stall from the
 * status's waiting field instead of repeating a badge, and a feedback draft ends with a line
 * triage can judge it by.
 */

const def = (name: string) => {
  const d = COMPANION_TOOL_DEFS.find((t) => t.name === name);
  if (!d) throw new Error(`no tool named ${name}`);
  return d;
};

describe("what a filing waits on, in her instructions", () => {
  it("tells her to say what it waits on and what would move it, never as a date", () => {
    expect(COMPANION_SYSTEM_PROMPT).toContain(
      "say what it is waiting on and what would move it, from the tool's waiting field",
    );
    expect(COMPANION_SYSTEM_PROMPT).toContain("never turn that into a date or a promise");
    expect(COMPANION_SYSTEM_PROMPT).toContain("it is not built automatically");
  });

  it("tells her to end a feedback draft's details with a 'Done when:' line", () => {
    expect(COMPANION_SYSTEM_PROMPT).toContain(
      "End the details with one line starting 'Done when:'",
    );
    const details = (
      def("draft_feedback").input_schema as {
        properties: { details: { description: string } };
      }
    ).properties.details.description;
    expect(details).toContain("End with one line starting 'Done when:'");
  });

  it("describes the waiting and openDays fields on get_work_status", () => {
    const d = def("get_work_status").description;
    expect(d).toContain("waiting (open issues only) says what it waits on");
    expect(d).toContain("openDays is how long it has been open");
  });
});
