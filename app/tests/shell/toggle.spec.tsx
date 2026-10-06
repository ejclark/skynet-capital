import { fireEvent, render, screen } from "@testing-library/react";
import { Toggle } from "../../src/shell/toggle";

// The React shell's first behavioral spec (app/ had zero test coverage before this — issue
// #738's UI layer, found in a 2026-08-30 Testing Trophy audit). Same BDD doctrine as the rest of
// the repo (docs/ENGINEERING.md): assert on what a user sees and can do, never on internals —
// render, click, check the resulting DOM and the callback's argument.
describe("Toggle", () => {
  const options = [
    ["light", "Light"],
    ["dark", "Dark"],
  ] as const;

  it("renders one button per option, with its label", () => {
    render(<Toggle label="Theme" value="light" options={options} onPick={() => undefined} />);

    expect(screen.getByRole("button", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark" })).toBeInTheDocument();
  });

  // #4046 item 2: at ≤860px shell.css hides the word and shows an aria-hidden initial, which left
  // the button with no name at all. The word has to ride on the button, not on its visible text.
  it("names each button with its full word, independent of the narrow-width initial", () => {
    render(<Toggle label="Theme" value="light" options={options} onPick={() => undefined} />);

    for (const word of ["Light", "Dark"])
      expect(screen.getByRole("button", { name: word })).toHaveAttribute("aria-label", word);
  });

  it("marks the current value as pressed, and no other option", () => {
    render(<Toggle label="Theme" value="dark" options={options} onPick={() => undefined} />);

    expect(screen.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Light" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onPick with the clicked option's key, not the currently-selected one", () => {
    const picks: string[] = [];
    render(
      <Toggle label="Theme" value="light" options={options} onPick={(next) => picks.push(next)} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Dark" }));

    expect(picks).toEqual(["dark"]);
  });

  it("names the control for assistive tech via a visually-hidden legend", () => {
    render(<Toggle label="Theme" value="light" options={options} onPick={() => undefined} />);

    expect(screen.getByText("Theme")).toBeInTheDocument();
  });
});
