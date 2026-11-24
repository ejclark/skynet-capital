# Faces for the owned ink render

The two faces `scripts/shoot/mermaid-pairs.mjs --look ink --face serif|sans` embeds, so a render
never falls back to whatever the container has (plan #3981; Verdana, the face the diagram snippets
name, is not installed in the cloud container, so every earlier render was judged in a fallback).

| File | Face | Source | Licence |
|---|---|---|---|
| `ink-serif-regular.woff2`, `ink-serif-bold.woff2` | "Ink Serif": a renamed subset of Charis SIL 6.200, SIL's OFL cut of Bitstream Charter | Ubuntu package `fonts-sil-charis` 6.200-1 | OFL 1.1; "Charis" and "SIL" are Reserved Font Names, so the subset carries neither (clause 3) |
| `lato-regular.woff2`, `lato-bold.woff2` | Lato, subset | Ubuntu package `fonts-lato` (the container's own install) | OFL 1.1, no Reserved Font Name |

- **Subset, not whole.** Basic Latin, Latin-1, Latin Extended-A, general punctuation, arrows and ✕:
  about 25–39 KB a file instead of 650–820 KB. `subset.py` here rebuilds them; its range and
  `COVERAGE` in `../mermaid-pairs-ink.mjs` are the same list, and a label outside it fails its side
  by name.
- **Every layout feature kept** (kerning, ligatures): the subset spaces a word the way the face does.
- **The licence travels with the files:** `OFL.txt`.
