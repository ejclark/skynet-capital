import { fireEvent, render, screen } from "@testing-library/react";
import { SymbolField } from "../../src/shell/symbol-field";

/**
 * The Symbol field's intellisense (#738 phase 10, slice 8a). BDD doctrine as everywhere in this
 * repo (docs/ENGINEERING.md): type what a member types, press what they press, assert what they
 * see and what the field commits. Free text is never blocked — a directory miss behaves exactly
 * as the raw `<input>` it replaces did.
 */
const noop = () => {
  // intentionally unused in specs that don't assert on this callback
};

describe("SymbolField", () => {
  it("renders a labeled combobox input", () => {
    render(<SymbolField id="sym" label="Symbol" value="" onChange={noop} onCommit={noop} />);

    const input = screen.getByLabelText("Symbol");
    expect(input).toHaveAttribute("role", "combobox");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("shows a listbox with 'NVDA - Nvidia' when typing NV", () => {
    let value = "";
    const onChange = (v: string) => {
      value = v;
    };
    const { rerender } = render(
      <SymbolField id="sym" label="Symbol" value={value} onChange={onChange} onCommit={noop} />,
    );

    fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "NV" } });
    rerender(
      <SymbolField id="sym" label="Symbol" value="NV" onChange={onChange} onCommit={noop} />,
    );

    const list = screen.getByRole("listbox");
    expect(list).toBeInTheDocument();
    expect(screen.getByText("NVDA - Nvidia")).toBeInTheDocument();
    expect(screen.getByLabelText("Symbol")).toHaveAttribute("aria-expanded", "true");
  });

  it("commits NVDA when ArrowDown then Enter is pressed", () => {
    let value = "";
    let committed = "";
    const onChange = (v: string) => {
      value = v;
    };
    const onCommit = (s: string) => {
      committed = s;
    };
    const { rerender } = render(
      <SymbolField id="sym" label="Symbol" value={value} onChange={onChange} onCommit={onCommit} />,
    );

    fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "NV" } });
    rerender(
      <SymbolField id="sym" label="Symbol" value="NV" onChange={onChange} onCommit={onCommit} />,
    );

    const input = screen.getByLabelText("Symbol");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(committed).toBe("NVDA");
    expect(value).toBe("NVDA");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("commits free text on Enter when the query isn't in the directory", () => {
    let committed = "";
    const onCommit = (s: string) => {
      committed = s;
    };
    render(
      <SymbolField id="sym" label="Symbol" value="ZZZQ" onChange={noop} onCommit={onCommit} />,
    );

    fireEvent.keyDown(screen.getByLabelText("Symbol"), { key: "Enter" });

    expect(committed).toBe("ZZZQ");
  });

  it("closes without committing on Escape", () => {
    let committed: string | undefined;
    const onCommit = (s: string) => {
      committed = s;
    };
    const { rerender } = render(
      <SymbolField id="sym" label="Symbol" value="" onChange={noop} onCommit={onCommit} />,
    );

    fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "NV" } });
    rerender(
      <SymbolField id="sym" label="Symbol" value="NV" onChange={noop} onCommit={onCommit} />,
    );
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByLabelText("Symbol"), { key: "Escape" });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(committed).toBeUndefined();
  });

  it("selecting an option with the mouse commits it", () => {
    let value = "";
    let committed = "";
    const onChange = (v: string) => {
      value = v;
    };
    const onCommit = (s: string) => {
      committed = s;
    };
    const { rerender } = render(
      <SymbolField id="sym" label="Symbol" value={value} onChange={onChange} onCommit={onCommit} />,
    );

    fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "NV" } });
    rerender(
      <SymbolField id="sym" label="Symbol" value="NV" onChange={onChange} onCommit={onCommit} />,
    );

    fireEvent.mouseDown(screen.getByText("NVDA - Nvidia"));

    expect(committed).toBe("NVDA");
    expect(value).toBe("NVDA");
  });

  it("carries role=option rows inside the listbox", () => {
    const { rerender } = render(
      <SymbolField id="sym" label="Symbol" value="" onChange={noop} onCommit={noop} />,
    );

    fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "NV" } });
    rerender(<SymbolField id="sym" label="Symbol" value="NV" onChange={noop} onCommit={noop} />);

    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
  });
});
