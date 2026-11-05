#!/usr/bin/env python3
"""Normalize ```tikz / ```circuitikz blocks to TikZJax form.

Obsidian's TikZJax plugin requires each block to be a complete document body:
\\usepackage lines, then \\begin{document} ... \\end{document}. The site's
generator (site/src/lib/remark-wiki-links.mjs) hoists \\usepackage out and
strips \\documentclass and the document environment, so the same block renders
in both places. Blocks are emitted as circuitikz, which is a superset of
tikzpicture and is bundled by both renderers.

Idempotent: a block that already carries \\begin{document} is left alone.

    python3 tikzjax-normalize.py [--check] FILE...
"""

import re
import sys

FENCE = re.compile(r"^```(tikz|circuitikz)([^\n]*)\n(.*?)^```[ \t]*$", re.S | re.M)
DROP = re.compile(r"^[ \t]*\\documentclass(\[[^\]]*\])?\{[^}]*\}[ \t]*$\n?", re.M)
USEPKG = re.compile(r"^[ \t]*\\usepackage(\[[^\]]*\])?\{[^}]*\}[ \t]*$\n?", re.M)
USELIB = re.compile(r"^[ \t]*\\usetikzlibrary\{[^}]*\}[ \t]*$\n?", re.M)
DOCENV = re.compile(r"\\(begin|end)\{document\}[ \t]*\n?")


def convert(body: str) -> str:
    if "\\begin{document}" in body:
        return body  # already normalized

    libs = [m.group(0).strip() for m in USELIB.finditer(body)]
    body = USELIB.sub("", DOCENV.sub("", USEPKG.sub("", DROP.sub("", body))))

    # tikzpicture is a strict subset of circuitikz; retarget so one environment
    # covers gate schematics and datapath block diagrams alike.
    body = re.sub(r"\\begin\{tikzpicture\}", r"\\begin{circuitikz}", body)
    body = re.sub(r"\\end\{tikzpicture\}", r"\\end{circuitikz}", body)
    body = body.strip("\n")

    if "\\begin{circuitikz}" not in body:
        body = "\\begin{circuitikz}\n" + body + "\n\\end{circuitikz}"

    head = ["\\usepackage{circuitikz}"] + libs
    return "\n".join(head) + "\n\\begin{document}\n" + body + "\n\\end{document}\n"


def main(argv: list[str]) -> int:
    check = "--check" in argv
    paths = [a for a in argv if not a.startswith("--")]
    changed = 0

    for path in paths:
        with open(path, encoding="utf-8") as fh:
            source = fh.read()

        def repl(m: re.Match) -> str:
            # Fence stays `tikz`: Obsidian's TikZJax only registers a processor for that
            # language, so a ```circuitikz fence renders as a plain code block in the
            # vault. The circuitikz *environment* inside still works — it is pulled in by
            # \usepackage{circuitikz}, and the site generator detects the environment
            # rather than trusting the fence language.
            return "```tikz%s\n%s```" % (m.group(2), convert(m.group(3)))

        updated = FENCE.sub(repl, source)
        if updated == source:
            continue
        changed += 1
        print(("would rewrite " if check else "rewrote ") + path)
        if not check:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(updated)

    print(f"{changed} file(s) {'need rewriting' if check else 'rewritten'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
