"""Subset two OFL faces to the glyphs a diagram label uses, as WOFF2, for the owned ink render.

Run (fontTools 4.68 + brotli in any venv):
  python -I scripts/shoot/fonts/subset.py <dir with CharisSIL-*.ttf> <dir with Lato-*.ttf> scripts/shoot/fonts
Provenance and licence: ./README.md and ./OFL.txt. Keep UNICODES in step with COVERAGE in
../mermaid-pairs-ink.mjs: a label outside it fails the side by name rather than borrowing a glyph.
"""
import sys
from fontTools import subset

charis_dir, lato_dir, out_dir = sys.argv[1:4]

# Basic Latin, Latin-1, Latin Extended-A (ō in Yōtei), general punctuation, arrows, the ✕ glyph.
UNICODES = "U+0020-007E,U+00A0-00FF,U+0100-017F,U+2010-2027,U+2030-203A,U+2190-2199,U+2212,U+2715,U+00B7"

JOBS = [
    # (source, out file, family to present, reserved-name rename?)
    (f"{charis_dir}/CharisSIL-Regular.ttf", "ink-serif-regular.woff2", "Ink Serif", "Regular"),
    (f"{charis_dir}/CharisSIL-Bold.ttf", "ink-serif-bold.woff2", "Ink Serif", "Bold"),
    (f"{lato_dir}/Lato-Regular.ttf", "lato-regular.woff2", None, None),
    (f"{lato_dir}/Lato-Bold.ttf", "lato-bold.woff2", None, None),
]

for src, out, family, style in JOBS:
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.name_languages = ["*"]
    opts.notdef_outline = True
    opts.hinting = False
    font = subset.load_font(src, opts)
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=subset.parse_unicodes(UNICODES))
    sub.subset(font)
    if family:
        # OFL clause 3: a Modified Version may not present a Reserved Font Name ("Charis", "SIL").
        full = f"{family} {style}"
        ps = f"{family.replace(' ', '')}-{style}"
        names = font["name"]
        for rec in list(names.names):
            if rec.nameID in (1, 16):
                rec.string = family
            elif rec.nameID in (2, 17):
                rec.string = style
            elif rec.nameID == 4:
                rec.string = full
            elif rec.nameID == 6:
                rec.string = ps
            elif rec.nameID == 3:
                rec.string = f"{ps}; subset of Charis SIL 6.200"
    subset.save_font(font, f"{out_dir}/{out}", opts)
    print(out)
