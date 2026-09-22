import { act, fireEvent, render, screen } from "@testing-library/react";
import { SymbolField } from "../../src/shell/symbol-field";

/**
 * The Symbol field's intellisense (#738 phase 10, slice 8a; live tier-2 fallback, Phase 0.8b).
 * BDD doctrine as everywhere in this repo (docs/ENGINEERING.md): type what a member types, press
 * what they press, assert what they see and what the field commits. Free text is never blocked —
 * a directory miss behaves exactly as the raw `<input>` it replaces did.
 */
const noop = () => {
  // intentionally unused in specs that don't assert on this callback
};

/** Stubs `fetch` for the tier-2 client (`app/src/live/symbol-search.ts`), same idiom as
 *  `app/tests/live/wire.spec.ts`. Returns the call log so a test can assert whether/what it hit. */
function stubSymbolSearchFetch(hits: readonly { symbol: string; name: string }[]): {
  calls: string[];
} {
  const calls: string[] = [];
  globalThis.fetch = ((url: string) => {
    calls.push(url);
    return Promise.resolve(
      new Response(JSON.stringify({ hits }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof globalThis.fetch;
  return { calls };
}

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

  // Tier 2 (Phase 0.8b): a live Alpaca fallback that fires only on a curated-directory miss, only
  // once the query is 2+ characters, and only after a 300ms debounce — never per keystroke. "ZQ"
  // is confirmed absent from every corner of the curated directory (symbol AND name), so it's a
  // genuine tier-1 miss without accidentally tripping a name-contains/word-prefix tier-1 hit.
  describe("tier-2 live fallback", () => {
    afterEach(() => {
      rstest.useRealTimers();
    });

    it("fires a debounced tier-2 fetch on a tier-1 miss, and renders the hit once it lands", async () => {
      rstest.useFakeTimers();
      const { calls } = stubSymbolSearchFetch([{ symbol: "ZQVY", name: "Zaqville Corp" }]);
      let value = "";
      const onChange = (v: string) => {
        value = v;
      };
      const { rerender } = render(
        <SymbolField id="sym" label="Symbol" value={value} onChange={onChange} onCommit={noop} />,
      );

      fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "ZQ" } });
      rerender(
        <SymbolField id="sym" label="Symbol" value="ZQ" onChange={onChange} onCommit={noop} />,
      );

      // Not fired yet — the debounce window hasn't elapsed.
      expect(calls).toEqual([]);

      await act(async () => {
        await rstest.advanceTimersByTimeAsync(300);
      });

      expect(calls).toEqual(["/api/symbols/search?q=ZQ"]);
      expect(screen.getByText("ZQVY - Zaqville Corp")).toBeInTheDocument();
    });

    it("never fires a fetch for a sub-2-char query", async () => {
      rstest.useFakeTimers();
      const { calls } = stubSymbolSearchFetch([{ symbol: "ZQVY", name: "Zaqville Corp" }]);
      let value = "";
      const onChange = (v: string) => {
        value = v;
      };
      const { rerender } = render(
        <SymbolField id="sym" label="Symbol" value={value} onChange={onChange} onCommit={noop} />,
      );

      fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "Z" } });
      rerender(
        <SymbolField id="sym" label="Symbol" value="Z" onChange={onChange} onCommit={noop} />,
      );

      await act(async () => {
        await rstest.advanceTimersByTimeAsync(1_000);
      });

      expect(calls).toEqual([]);
    });

    it("never fires tier-2 when tier-1 already has a hit", async () => {
      rstest.useFakeTimers();
      const { calls } = stubSymbolSearchFetch([{ symbol: "ZQVY", name: "Zaqville Corp" }]);
      let value = "";
      const onChange = (v: string) => {
        value = v;
      };
      const { rerender } = render(
        <SymbolField id="sym" label="Symbol" value={value} onChange={onChange} onCommit={noop} />,
      );

      // "NV" is a curated-directory hit (NVDA) from the very first spec above.
      fireEvent.change(screen.getByLabelText("Symbol"), { target: { value: "NV" } });
      rerender(
        <SymbolField id="sym" label="Symbol" value="NV" onChange={onChange} onCommit={noop} />,
      );

      await act(async () => {
        await rstest.advanceTimersByTimeAsync(1_000);
      });

      expect(calls).toEqual([]);
    });

    it("discards a stale tier-2 response for a since-changed query", async () => {
      rstest.useFakeTimers();
      const resolvers = new Map<string, (hits: { symbol: string; name: string }[]) => void>();
      const calls: string[] = [];
      globalThis.fetch = ((url: string) => {
        calls.push(url);
        return new Promise<Response>((resolve) => {
          resolvers.set(url, (hits) => {
            resolve(
              new Response(JSON.stringify({ hits }), {
                status: 200,
                headers: { "content-type": "application/json" },
              }),
            );
          });
        });
      }) as typeof globalThis.fetch;

      let value = "";
      const onChange = (v: string) => {
        value = v;
      };
      const { rerender } = render(
        <SymbolField id="sym" label="Symbol" value={value} onChange={onChange} onCommit={noop} />,
      );
      const input = screen.getByLabelText("Symbol");

      fireEvent.change(input, { target: { value: "ZQ" } });
      rerender(
        <SymbolField id="sym" label="Symbol" value="ZQ" onChange={onChange} onCommit={noop} />,
      );
      await act(async () => {
        await rstest.advanceTimersByTimeAsync(300);
      });
      expect(calls).toContain("/api/symbols/search?q=ZQ");

      // The query moves on before the "ZQ" fetch's response has arrived.
      fireEvent.change(input, { target: { value: "ZQV" } });
      rerender(
        <SymbolField id="sym" label="Symbol" value="ZQV" onChange={onChange} onCommit={noop} />,
      );
      await act(async () => {
        await rstest.advanceTimersByTimeAsync(300);
      });
      expect(calls).toContain("/api/symbols/search?q=ZQV");

      // Resolve the stale "ZQ" response first — it must never render.
      await act(async () => {
        resolvers.get("/api/symbols/search?q=ZQ")?.([
          { symbol: "ZQOLD", name: "Should Never Render" },
        ]);
        await Promise.resolve();
      });
      expect(screen.queryByText("Should Never Render")).not.toBeInTheDocument();

      // The current "ZQV" response still applies once it lands.
      await act(async () => {
        resolvers.get("/api/symbols/search?q=ZQV")?.([{ symbol: "ZQVY", name: "Zaqville Corp" }]);
        await Promise.resolve();
      });
      expect(screen.getByText("ZQVY - Zaqville Corp")).toBeInTheDocument();
      expect(screen.queryByText("Should Never Render")).not.toBeInTheDocument();
    });
  });
});
