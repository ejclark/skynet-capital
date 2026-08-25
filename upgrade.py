"""Upgrade a ledger's 3-column horizon table to the 5-column call sheet.

Inserts Confidence after Call and appends "Proves it wrong", preserving the authored
Horizon/Call/Why cells verbatim. Falsifiers come from each doc's own kill switches.
"""
import pathlib, sys

def upgrade(slug, rows):
    """rows: list of (confidence, falsifier) in table order."""
    p = pathlib.Path(f"docs/research/events/{slug}.md")
    s = p.read_text()
    start = s.index("## At a glance")
    end = s.index("\n## ", start + 5)
    block = s[start:end]
    lines = block.split("\n")
    out, data_i, seen_sep = [], 0, False
    for ln in lines:
        t = ln.strip()
        if not t.startswith("|"):
            out.append(ln); continue
        cells = [c.strip() for c in t.strip("|").split("|")]
        if len(cells) != 3:
            out.append(ln); continue
        if not seen_sep and cells[0].lower() == "horizon":
            out.append("| Horizon | Call | Confidence | Why | Proves it wrong |"); continue
        if set("".join(cells)) <= set("-: "):
            out.append("|---|---|---|---|---|"); seen_sep = True; continue
        conf, wrong = rows[data_i]; data_i += 1
        out.append(f"| {cells[0]} | {cells[1]} | {conf} | {cells[2]} | {wrong} |")
    assert data_i == len(rows), f"{slug}: table has {data_i} data rows, got {len(rows)} specs"
    p.write_text(s[:start] + "\n".join(out) + s[end:])
    return slug
