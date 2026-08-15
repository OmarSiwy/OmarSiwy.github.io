---
title: Number Formats
description: "Map of the 10 Number Formats notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, number-formats, hub]
aliases:
  - "Fixed-Point Representations"
  - "Floating-Point Formats"
  - Redundant Number Systems
  - Logarithmic Number Systems
  - Number Formats
  - "1.1) Number Formats"
  - "Two's Complement"
---

# Number Formats

**The specification every note below answers.** Input: a real $x$ known to lie in some interval $[a,b]$. Output: a $w$-bit word, plus a decoding rule. Accuracy: the format's *unit in the last place* fixes the quantum of representation, and a correctly rounded encoding is within $\tfrac12$ ulp of $x$. Optimised for: **bits**, because bits are the currency every downstream operator is billed in — a $w$-bit adder costs $O(w)$, a $w\times w$ multiplier $O(w^2)$, a $w$-bit table $2^w$ entries. Choosing a format is the first act of "computing just right": the smallest format whose ulp meets the accuracy budget over the range the application actually uses.

**The notation the whole vault runs on.** A fixed-point format is named by **two bit positions, not two bit counts**: $\mathrm{ufix}(m,\ell)$ has members $X=\sum_{i=\ell}^{m}2^{i}x_{i}$, so $i$ is a position, $2^i$ its weight, and both $m$ and $\ell$ may be negative (§2.2.1, p. 39). Hence $w=m-\ell+1$, $\mathrm{ulp}=2^{\ell}$, dynamic range $2^{w}-1$. Factoring $2^\ell$ out shows a fixed-point number *is* a $w$-bit integer times a compile-time constant — the scale lives in the wire names, never in the hardware. $m$ buys range and is set by a worst-case non-overflow analysis; $\ell$ buys accuracy and is the cursor of the area-versus-accuracy trade. Every operator in [[Adders]] and [[Multipliers]] is parameterised by exactly these two numbers, which is why no other note re-derives them.

Everything below is one of two answers to a single question — where do you spend your bits, on **range** or on **resolution**?

```tikz title="Bit-field layouts of the four format families: sfix, IEEEfloat, Nfloat and LNS"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=0.42cm,y=1cm,font=\footnotesize]

\newcommand{\field}[5]{%
  \draw[fill=#3] (#1,#5) rectangle ++(#2,0.42);
  \node at ({#1+#2/2},{#5+0.21}) {#4};
}
\newcommand{\wbrace}[4]{%
  \draw[|<->|] (#1,{#4+0.62}) -- node[above=-1pt,fill=white,inner sep=1pt] {#3} ({#1+#2},{#4+0.62});
}

\def\y{3.0}
\field{0}{2}{red!18}{$s$}{\y}
\field{2}{16}{green!12}{}{\y}
\wbrace{0}{18}{$w=m-\ell+1$}{\y}
\node[left] at (-0.4,{\y+0.21}) {$\mathrm{sfix}(m,\ell)$};
\node[below=1pt] at (1,\y) {$-2^{m}$};
\node[below=1pt] at (17,\y) {$2^{\ell}$};

\def\y{1.7}
\field{0}{2}{red!18}{$s$}{\y}
\field{2}{6}{violet!18}{$E$}{\y}
\field{8}{10}{green!12}{$F$}{\y}
\wbrace{0}{2}{$1$}{\y}
\wbrace{2}{6}{$w_E$}{\y}
\wbrace{8}{10}{$w_F$}{\y}
\node[left] at (-0.4,{\y+0.21}) {$\mathrm{IEEEfloat}(w_E,w_F)$};

\def\y{0.4}
\field{-3}{3}{orange!25}{\textsf{exn}}{\y}
\field{0}{2}{red!18}{$s$}{\y}
\field{2}{6}{violet!18}{$E$}{\y}
\field{8}{10}{green!12}{$F$}{\y}
\wbrace{-3}{3}{$2$}{\y}
\wbrace{2}{6}{$w_E$}{\y}
\wbrace{8}{10}{$w_F$}{\y}
\node[left] at (-3.4,{\y+0.21}) {$\mathrm{Nfloat}(w_E,w_F)$};

\def\y{-0.9}
\field{-3}{3}{orange!25}{\textsf{exn}}{\y}
\field{0}{2}{red!18}{$s$}{\y}
\field{2}{16}{blue!10}{}{\y}
\draw[very thick] (8,\y) -- (8,{\y+0.42});
\node at (5,{\y+0.21}) {int};
\node at (13,{\y+0.21}) {frac};
\wbrace{-3}{3}{$2$}{\y}
\wbrace{2}{16}{$L_X=\mathrm{sfix}(w_E-1,-w_F)$}{\y}
\node[left] at (-3.4,{\y+0.21}) {$\mathrm{LNS}(w_E,w_F)$};
\node[below=1pt] at (5,\y) {$w_E$};
\node[below=1pt] at (13,\y) {$w_F$};

\end{circuitikz}
\end{document}
```

*after Figs. 2.6, 2.11, 2.15 and 2.17, pp. 41, 49, 54, 57.*

### Start here

- [[Choosing a Number Format]] – the trade-off table, with the source's own numbers: four 8-bit formats side by side, the structural hardware cost of add/multiply/divide in each, and the admission that Chapter 2 contains no synthesis figures at all. Read it before any note below; nothing here duplicates it.

### Fixed point — the substrate everything else is built out of

- [[Signed Fixed-Point Format]] – **the definition, folded in here because it is notation rather than hardware.** $\mathrm{sfix}(m,\ell)$ negates the weight of the MSB only, $X=-2^{m}x_{m}+\sum_{i=\ell}^{m-1}2^{i}x_{i}$ (2.8, p. 40), giving the asymmetric range $[-2^{m},\,2^{m}-2^{\ell}]$ — one code deeper on the negative side, because zero occupies a positive code, so $-2^m$ has no opposite. Its payoff is that both interpretations are cosets of the same ring $\mathbb{Z}/2^{w}\mathbb{Z}$, so **one integer adder serves signed and unsigned alike** and only overflow detection differs. Read it first; the four notes that follow are its consequences.
- [[Two's Complement Negator]] – why $-X=\overline{X}+1$ is a row of inverters and an increment, and why the increment is usually free.
- [[Sign-Magnitude to Two's Complement Converter]] – the boundary circuit, for the one place sign-magnitude survives: floating-point significands.
- [[Sign Extension]] – read it for the reason two's complement is the only sane choice in a datapath whose widths grow: widening is fanout of one wire.
- [[Fixed-Point Format Narrowing]] – the other direction, and the only one that loses information: overflow at the MSB, rounding at the LSB, two independent failure modes with nothing in common.

Not worth a note of its own: **high-radix regrouping**, chunking a $w_X=k\alpha$-bit word into $k$ digits of $\alpha$ bits to read it in radix $2^{\alpha}$ (2.10, p. 45). In hardware this is free — a change of point of view on the same wires — but it is the standard lever for trading iteration count against per-iteration cost in [[Dividers]], and on FPGAs $\alpha$ is picked to match the LUT input count or the longest addition that closes timing ([[FPGAs]]).

### Redundant digits — buying $O(1)$ addition with extra bits

- [[Carry-Free Signed-Digit Adder]] – read it for the one idea that breaks the $O(w)$ carry chain outright: allow more digits than the radix needs, and every column can absorb its own incoming carry. It is also the ancestor of carry-save in [[Sums of Weighted Bits]] and of the quotient-digit sets in [[Dividers]].

### Floating point — spending bits on an exponent

- [[IEEE 754 Format]] – **the definition, folded in here.** Sign $s$, exponent $E$ read as an unsigned integer biased by $E_{0}=2^{w_E-1}-1$, and a fraction $F\in[0,1)$ whose significand $1+F$ is normalised — so its leading $1$ is known and never stored. That implicit bit is a free bit of precision *and* the reason representations are unique. The bias, not two's complement, is what makes a float comparator an integer comparator (p. 51). Extremal exponent codes are stolen for subnormals, zeros, infinities and NaN. binary32 spans $2^{277}$ of dynamic range; a fixed-point format with that range would need 277 bits (Table 2.2, p. 52).
- [[Nfloat Format]] – **the definition, folded in here.** The FloPoCo format: normal numbers only, with all four special cases moved into an explicit 2-bit `exn` field (`00` zero, `01` normal, `10` infinity, `11` NaN). Total width $w_E+w_F+3$, two bits *more* than IEEE 754 — but the extremal exponent codes are no longer stolen, so the normal range widens by one binade at each end (Table 2.4, p. 55). The trade is bits against logic: in a pipeline nothing is stored to memory between stages, so forwarding two exception wires is cheaper than encoding and decoding them at every operator boundary, and dropping subnormals deletes a shifter, a leading-zero counter and a MUX from every operator in [[Floating-Point Operators]].

### Logarithmic — spending all the bits on the exponent

- [[LNS Multiplier]] – read it for the payoff: with $X=(-1)^{s}2^{L_X}$, multiply is one adder, divide one subtractor, square a left shift and square root a right shift, all four exact.
- [[LNS Adder]] – read it immediately after, for the bill: addition becomes transcendental, $L_{X+Y}=L_X+f_{\oplus}(L_Y-L_X)$ with $f_{\oplus}(r)=\log_2(1+2^r)$ evaluated over the full $w_E+w_F$-bit word. That single function is the entire cost of LNS and the reason it is confined to small formats — see [[Table-Based Function Evaluation]].

### Where this topic sits

Nothing feeds this topic; it is the vocabulary layer, and every operator hub downstream is parameterised by a format chosen here. [[Error Accuracy]] is its immediate consumer and its complement: this topic fixes the ulp, that one quantifies what happens when values are rounded to it and how those errors compose through a datapath. [[Adders]], [[Multipliers]] and [[Floating-Point Operators]] are the three families of operator that spend the formats defined here, and [[FPGAs]] is where the granularity choices — digit size, table size, carry-chain length — stop being free.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 2 "Number Formats", pp. 33–60. §2.1 integers pp. 34–38; §2.2 fixed point pp. 38–44; §2.3 high radix pp. 44–46; §2.4 redundant systems pp. 46–48; §2.5 floating point pp. 48–56; §2.6 logarithmic number systems pp. 56–60.
