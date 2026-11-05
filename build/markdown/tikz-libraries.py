#!/usr/bin/env python3
"""Declare the TikZ libraries each diagram block actually uses.

The site preamble (site/src/lib/remark-wiki-links.mjs) preloads a broad set of
libraries, so a block using `trapezium` compiles there even without declaring
`shapes.geometric`. Obsidian's TikZJax preloads far less, so the same block
renders on the site and silently fails in the vault.

This scans each ```circuitikz block for constructs that require a library and
inserts a matching \\usetikzlibrary line after \\usepackage. It only ever adds
libraries a block demonstrably uses — blanket-declaring everything would break
blocks whose libraries TikZJax does not bundle.

    python3 tikz-libraries.py [--check] FILE...
"""

import re
import sys

FENCE = re.compile(r"^```(?:tikz|circuitikz)[^\n]*\n(.*?)^```[ \t]*$", re.S | re.M)
USELIB = re.compile(r"^[ \t]*\\usetikzlibrary\{([^}]*)\}[ \t]*$", re.M)

# construct -> library. Ordered most-specific first; patterns are matched against
# the block body with the existing \usetikzlibrary lines stripped out.
RULES: list[tuple[str, str]] = [
    (r"\btrapezium\b|\bregular polygon\b|\bdiamond\b|\bstar\b|\bcylinder\b|\bsemicircle\b", "shapes.geometric"),
    (r"\brounded rectangle\b|\bcross out\b|\bstrike out\b|\bforbidden sign\b", "shapes.misc"),
    (r"\brectangle split\b|\bcircle split\b", "shapes.multipart"),
    (r"\bsingle arrow\b|\bdouble arrow\b|\barrow box\b", "shapes.arrows"),
    (r"\bbrace\b", "decorations.pathreplacing"),
    (r"\bsnake\b|\bcoil\b|\bzigzag\b|\brandom steps\b|\bbent\b", "decorations.pathmorphing"),
    (r"\bmarkings\b|\bpostaction=\{decorate\}", "decorations.markings"),
    (r"decoration\s*=\s*\{?\s*text along path|\btext effects along path\b", "decorations.text"),
    (r"\bname intersections\b|\bname path\b", "intersections"),
    (r"\bon background layer\b|\bshow background\b|\bframed\b", "backgrounds"),
    (r"\bpattern\s*=|\bpattern color\b", "patterns"),
    (r"\bfit\s*=", "fit"),
    (r"\\matrix\b|\bmatrix of (?:nodes|math nodes)\b", "matrix"),
    (r"\{Stealth\}|\{Latex\}|\{Bar\}|\{Circle\}|\{Square\}|\{Triangle\}", "arrows.meta"),
    # calc coordinates always open with "($ (" — plain "($w=3$)" is label prose.
    (r"\(\$\s*\(", "calc"),
    (r"\bangle\s*=\s*\(|\bpic\b.*\bangle\b", "angles"),
    (r"=\s*of\b", "positioning"),
]


def needed(body: str) -> list[str]:
    stripped = USELIB.sub("", body)
    found = []
    for pattern, library in RULES:
        if library in found:
            continue
        if re.search(pattern, stripped, re.S):
            found.append(library)
    return found


def convert(body: str) -> str:
    declared = {lib.strip() for m in USELIB.finditer(body) for lib in m.group(1).split(",")}
    missing = [lib for lib in needed(body) if lib not in declared]
    if not missing:
        return body
    line = "\\usetikzlibrary{" + ",".join(sorted(missing)) + "}\n"
    # after the last \usepackage, else before \begin{document}, else at the top
    anchor = list(re.finditer(r"^[ \t]*\\usepackage[^\n]*\n", body, re.M))
    if anchor:
        at = anchor[-1].end()
    elif (doc := re.search(r"^[ \t]*\\begin\{document\}", body, re.M)):
        at = doc.start()
    else:
        at = 0
    return body[:at] + line + body[at:]


def main(argv: list[str]) -> int:
    check = "--check" in argv
    changed = 0

    for path in [a for a in argv if not a.startswith("--")]:
        with open(path, encoding="utf-8") as fh:
            source = fh.read()

        report: list[str] = []

        def repl(m: re.Match) -> str:
            body = convert(m.group(1))
            if body != m.group(1):
                added = re.search(r"\\usetikzlibrary\{([^}]*)\}", body)
                report.append(added.group(1) if added else "?")
            return m.group(0).replace(m.group(1), body)

        updated = FENCE.sub(repl, source)
        if updated == source:
            continue
        changed += 1
        print(f"{'would add' if check else 'added'} {'; '.join(report)}  —  {path}")
        if not check:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(updated)

    print(f"{changed} file(s) {'need' if check else 'got'} library declarations")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
