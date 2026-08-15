---
title: "Exponential Special-Case Unit"
description: "Three threshold comparisons on the exponent field alone that dispose of +0, +inf and the exact-1.0 region before any arithmetic — coarse enough to be two magnitude compares, with the leftover cases caught later in the packer."
kind: circuit
source: "ASA §22.2.3, pp. 643-645"
status: seed
spade: simulated
tags: [digital, floating-point-exponential, floating-point, exceptions, comparator]
aliases:
  - Exponential Input Filtering
  - Input Filtering
  - FPExp Special-Case Unit
  - Exponential Special Cases
---

# Exponential Special-Case Unit

The front end of a floating-point exponential: two constant-magnitude comparisons on the exponent field decide whether the answer is $+0$, $+\infty$ or exactly $1.0$, and it is the only block in the operator that is allowed to be *deliberately too coarse*, because everything it misses is caught downstream.

```tikz title="Special-case regions of the exponential and the comparator front end that detects them"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ================= top panel: the specification (regions of X) =================
  \begin{scope}
    \fill[blue!25] (-4.6,0) rectangle (-3.0,0.32);
    \fill[blue!25] (2.0,0) rectangle (4.6,2.35);
    \fill[blue!25] (-0.22,0.52) rectangle (0.22,0.92);
    \begin{scope}
      \clip (-4.6,0) rectangle (4.6,2.35);
      \draw[red,thick,domain=-4.6:1.9,samples=80] plot (\x,{0.7*exp(0.9*\x)});
    \end{scope}
    \draw[->] (-4.8,0) -- (4.9,0) node[anchor=west] {$X$};
    \draw[->] (0,-0.15) -- (0,2.6) node[anchor=south] {$e^X$};
    \draw[dashed] (-3.0,0) -- (-3.0,0.32);
    \draw[dashed] (2.0,0) -- (2.0,2.35);
    \node[anchor=north] at (-3.0,-0.05) {$X_{\min}$};
    \node[anchor=north] at (0.0,-0.05) {$|X|<X_1$};
    \node[anchor=north] at (2.0,-0.05) {$X_{\max}$};
    \node[anchor=east]  at (-3.15,0.6) {return $+0$};
    \node[anchor=east]  at (-0.32,0.72) {return $1.0$};
    \node at (3.3,1.5) {return $+\infty$};
  \end{scope}

  % ================= bottom panel: the unit =================
  \begin{scope}[yshift=-3.4cm]
    % input taps
    \draw[->] (-4.4,0.75) -- (-4.4,-2.6);
    \node[anchor=south] at (-4.4,0.8) {$exn_X$};
    \node[anchor=east]  at (-4.45,-0.5) {$2$};
    \draw[->] (-3.4,0.75) -- (-3.4,-2.6);
    \node[anchor=south] at (-3.4,0.8) {$s_X$};
    \node[anchor=east]  at (-3.45,-0.5) {$1$};
    \draw (-2.3,0.75) -- (-2.3,-1.5);
    \node[anchor=south] at (-2.3,0.8) {$E_X$};
    \node[anchor=east]  at (-2.35,0.15) {$w_E$};

    % two constant comparators
    \draw (-1.6,-0.75) rectangle (2.6,-0.15);
    \node at (0.5,-0.45) {$E_X > 2^{w_E-1}\!+w_E\!-2$};
    \draw (-1.6,-1.8) rectangle (2.6,-1.2);
    \node at (0.5,-1.5) {$E_X < 2^{w_E-1}\!-w_F\!-3$};
    \draw[->] (-2.3,-0.45) -- (-1.6,-0.45);
    \draw[->] (-2.3,-1.5)  -- (-1.6,-1.5);

    % comparator outputs into the decoder
    \draw[->] (2.6,-0.45) -- (3.4,-0.45) -- (3.4,-2.6);
    \node[anchor=west] at (3.45,-1.0) {\emph{huge}, $1$};
    \draw[->] (2.6,-1.5) -- (3.0,-1.5) -- (3.0,-2.6);
    \node[anchor=east] at (2.95,-2.2) {\emph{tiny}, $1$};

    % decoder
    \draw (-4.9,-3.2) rectangle (3.9,-2.6);
    \node at (-0.7,-2.9) {special-case decode};

    % outputs
    \draw[->] (-2.6,-3.2) -- (-2.6,-3.9);
    \node[anchor=east] at (-2.65,-3.55) {$exn_R$};
    \node[anchor=west] at (-2.55,-3.55) {$2$};
    \draw[->] (1.4,-3.2) -- (1.4,-3.9);
    \node[anchor=west] at (1.45,-3.55) {\emph{force\_one}, $1$};
  \end{scope}
\end{circuitikz}
\end{document}
```

*Upper panel after Fig. 22.2, p. 644; the comparator front end below it is my own construction.*

**Read the outer thresholds straight off the format's extremes.** The exponential is strictly increasing, so the set of inputs with a representable answer is a single interval $[X_{\min}, X_{\max}]$, and its ends are fixed by nothing but the output format ([[Floating-Point Formats]]). $X_{\max} = \ln\bigl((2-2^{-w_F})\cdot 2^{2^{w_E-1}-1}\bigr)$ is the log of the largest finite IEEEfloat$(w_E,w_F)$; $X_{\min} = \ln\bigl(2^{-2^{w_E-1}+2-w_F}\bigr)$ is the log of the smallest *subnormal*, because that is the smallest value the operator may still return instead of $+0$. For IEEEfloat$(8,23)$ this is $[-103.28,\,88.72]$. Nfloat has no subnormals and no reserved exponent codes, so both ends move — $X_{\min}=\ln 2^{-2^{w_E-1}+1}$ and $X_{\max}=\ln\bigl((2-2^{-w_F})\cdot 2^{2^{w_E-1}}\bigr)$, giving $[-88.03,\,89.42]$ for Nfloat$(8,23)$ (Table 22.1, p. 644). The asymmetry between the two rows is entirely the subnormal range extending IEEE's underflow threshold downwards.

> [!warning] Table 22.1 prints $X_{\min}$ with a leading minus *and* a floor of a negative logarithm, which makes the printed expression positive — read that row as a magnitude. The prose on the same page ($-103.3$, $-88.03$) carries the sign. The rounding directions are not decoration: $X_{\min}$ is rounded **down** and $X_{\max}$ **up**, i.e. outward, so a rounded threshold never fires on an input the datapath could have handled correctly.

**Read the inner threshold off the power series, not off the format.** The third region is the one a naive design misses: inputs so small that the answer is $1.0$ exactly. From $e^X = \sum_{k\ge 0} X^k/k!$ (22.3) the tail obeys $|e^X - 1| \le |X|\,e^{|X|}$, so with $|X| \le X_1 = 2^{-w_F-2}$ we get $|e^X-1| \le 2^{-w_F-2}e^{2^{-w_F-2}} < 2^{-w_F-1}$. And $2^{-w_F-1}$ is exactly the half-ulp of $1.0$, whose ulp is $2^{-w_F}$ ([[Error Accuracy]]), so under round-to-nearest the correctly rounded result *is* $1.0$ — not approximately, exactly. The whole datapath can be bypassed for those inputs, and unlike the outer two thresholds this one is a clean power of two, which is what makes it testable on the exponent field alone.

**Do not hardwire the thresholds — compare exponents instead.** $X_{\min}$ and $X_{\max}$ are irrational; comparing $X$ against them means a full $(1+w_E+w_F)$-bit floating-point comparison against two hardwired constants, and the book's advice is not to bother (p. 644). Test the unbiased exponent $E_X$ alone instead. Since $|X| \in [2^{E_X}, 2^{E_X+1})$ for a normal input, two implications hold with no reference to $F_X$ at all:

$$E_X \le -w_F-3 \;\Longrightarrow\; |X| < 2^{-w_F-2} = X_1, \qquad E_X \ge w_E \;\Longrightarrow\; |X| \ge 2^{w_E} > X_{\max}$$

The second holds because $X_{\max} < \ln\bigl(2^{2^{w_E-1}}\bigr) = 2^{w_E-1}\ln 2 < 2^{w_E-1}$ for every $w_E \ge 2$ — the logarithm of a $2^{w_E-1}$-scale exponent range is itself only $w_E$-ish in size, which is the whole reason this test is cheap. Both implications are one-directional: an input that fails them may still be special, and that is accepted.

> [!warning] The parenthetical on p. 644 gives the coarse underflow test as "exponent smaller than $-w_E+1$". That bound is dimensionally wrong — the return-$1.0$ region is set by $X_1 = 2^{-w_F-2}$, so the threshold must be in $w_F$, not $w_E$. The book's own FloPoCo cross-check on the same page restricts random test exponents to $[-w_F-3,\,w_E-2]$, which is the $w_F$-based pair. This note uses $E_X < -w_F-2$.

**A comparison against a compile-time constant is a different circuit from a comparator.** The stored field is the biased exponent $E_X^{\mathrm{b}} = E_X + E_0$ with $E_0 = 2^{w_E-1}-1$, so in hardware the two tests read

$$\textit{tiny}: \quad E_X^{\mathrm{b}} < 2^{w_E-1}-w_F-3, \qquad\qquad \textit{huge}: \quad E_X^{\mathrm{b}} > 2^{w_E-1}+w_E-2$$

both $w_E$-bit unsigned. A general two-operand magnitude comparison needs a subtraction and therefore a carry chain ([[Magnitude Comparator]]); against a *constant* the comparison degenerates into a fixed AND-OR tree over the $w_E$ bits, because every bit position's contribution is decided at synthesis time. On a 6-input LUT fabric that is one LUT for $w_E \le 6$ and two LUT levels for $w_E = 8$; on ASIC it is a handful of gates. Either way there is no carry chain and no adder, and since the unit runs in parallel with the entire datapath and is consumed only at the packer, its latency is free.

**Subnormal and zero inputs fall out for free.** A subnormal has $E_X^{\mathrm{b}} = 0$, and $0 < 2^{w_E-1}-w_F-3$ for every sane format, so every subnormal input trips *tiny* and returns $1.0$ without a leading-zero counter or a normalising shifter anywhere in the operator. This is why [[Exponential Fixed-Point Converter]] needs no subnormal path: the special-case unit has already removed them.

**Fold the input exception code into the same decode.** With FloPoCo's two-bit $exn$ tag (`00` zero, `01` normal, `10` infinity, `11` NaN — see [[FloPoCo]]) the remaining cases are forced by the mathematics rather than chosen: $e^{\pm 0}=1$, $e^{+\infty}=+\infty$, $e^{-\infty}=+0$, and NaN propagates. Infinity and coarse overflow produce the *same* output, both selected by $s_X$, so the decode is a single four-way case whose saturating arm is shared. The sign bit is used exactly once, and never to decide *whether* an input is special — only *which* saturation it saturates to, because both magnitude tests are on $|X|$.

$$\boxed{\ \textit{tiny} = \bigl[\,E_X^{\mathrm{b}} < 2^{w_E-1}-w_F-3\,\bigr], \qquad \textit{huge} = \bigl[\,E_X^{\mathrm{b}} > 2^{w_E-1}+w_E-2\,\bigr] \ }$$

**Where it breaks.**

- **Narrow exponent, wide fraction.** The *tiny* constant $2^{w_E-1}-w_F-3$ is only positive when $2^{w_E-1} > w_F+3$. That holds comfortably for IEEEfloat$(8,23)$ ($128>26$) and BFloat$(8,7)$, but a format such as $(4,23)$ makes it non-positive, and the comparison degenerates to *never true* — or wraps, if built in unsigned arithmetic without checking. The return-$1.0$ case then has to be caught entirely in the packer.
- **The leftover band is not optional.** Inputs with $X_{\max} < X < 2^{w_E}$, or with $E_X \ge -w_F-2$ but $|X| \le X_1$, pass the coarse filter and enter the datapath. The tentative exponent and the packer must be dimensioned to represent them without wrapping and to detect the true overflow — see [[Exponential Normalize-Round-Pack]]. Coarse filtering is only cheap because that downstream check exists; without it the coarse thresholds are simply wrong.
- **Round-to-nearest only.** The $1.0$ shortcut is a half-ulp argument. Under a directed rounding mode $e^X$ for small positive $X$ must round *up*, to the successor of $1.0$, and the shortcut returns the wrong answer ([[Rounding]]).
- **The asymptotics never matter here.** This block is $O(w_E)$ gates inside an operator that is $O(w_F^2)$ multiplier and $O(2^k)$ table; growing the format never makes the special-case unit the thing to optimise. It is worth exactly two comparators and not one gate more.
- **Format tagging is assumed.** The unit consumes a decoded $exn$ tag. Feeding it raw IEEE-754 bit patterns needs an all-ones/all-zeros exponent decoder in front, which is not part of this block.

**RTL.**

```spade
/// exn: 00 = +/-0, 01 = normal, 10 = +/-inf, 11 = NaN
fn exp_special<#uint WE, #uint WF>(
    exn_x: uint<2>,
    s_x: bool,
    e_x: uint<WE>,
) -> (uint<2>, bool) {
    let sh: uint<WE> = WE - 1;
    let pow: uint<WE> = 1 << sh;        // 2^(WE-1) = E_0 + 1
    let up: uint<WE> = WE - 2;
    let dn: uint<WE> = WF + 3;

    let hi: uint<WE> = pow +. up;       // E_0 + WE - 1
    let lo: uint<WE> = pow -. dn;       // E_0 - WF - 2

    let huge = e_x > hi;
    let tiny = e_x < lo;
    let sat: uint<2> = if s_x { 0b00 } else { 0b10 };

    match exn_x {
        0b00 => (0b01, true),                        // exp(+/-0) = 1.0
        0b01 => if huge { (sat, false) }
                else if tiny { (0b01, true) }
                else { (0b01, false) },              // hand it to the datapath
        0b10 => (sat, false),                        // exp(+inf)=+inf, exp(-inf)=+0
        _    => (0b11, false),                       // NaN propagates
    }
}
```

`huge` and `tiny` are the two comparator boxes of the diagram and the `match` is the decode block. `e_x` is the *biased* field, so both constants are built from `pow` $=2^{w_E-1}$ rather than from a signed exponent: everything stays unsigned and both comparisons stay $w_E$ bits wide with no sign extension. It is a `fn`, hence purely combinational — there is no state to hold, though a real pipeline retimes `exn_R` and `force_one` forward to meet the packer. Synthesis will not build the two comparators the drawing shows: `hi` and `lo` constant-fold and each comparison collapses into the AND-OR tree described above, so the netlist contains no subtractor even though `-.` appears in the source.

Simulated at `float(8,23)`: 3012 vectors, including the boundary pairs $E_X^{\mathrm{b}} = 134/135$ and $101/102$, and the asymmetric pair $(s_X{=}0,\ E_X^{\mathrm{b}}{=}135) \mapsto +\infty$ against $(s_X{=}1,\ E_X^{\mathrm{b}}{=}135) \mapsto +0$, plus a 3000-vector random sweep over $(exn_X, s_X, E_X^{\mathrm{b}})$ checked against a behavioural reference.

**Related Notes.**

- [[FPExp Operator]] – supports: this is the operator's front end, and the reason every other block may assume a normal, in-range input.
- [[Exponential Normalize-Round-Pack]] – depends-on: consumes `exn_R` and `force_one`, and catches every special case this unit deliberately let through.
- [[Exponential Fixed-Point Converter]] – supports: needs no subnormal path because all subnormals trip *tiny* here.
- [[Direct Tabulation Exponential]] – compares: at small precisions the same filtering surrounds a single ROM instead of a datapath (Fig. 22.3, p. 645).
- [[Magnitude Comparator]] – depends-on: the general two-operand form, of which a constant comparison is the carry-chain-free degenerate case.
- [[Floating-Point Formats]] – depends-on: $X_{\min}$ and $X_{\max}$ are logarithms of the format's extremes, and IEEEfloat and Nfloat give different ones.
- [[Rounding]] – depends-on: the exact-$1.0$ region is a half-ulp argument, specific to round-to-nearest.
- [[FloPoCo]] – supports: the `FPExp` test-bench generator restricts random exponents to $[-w_F-3,\,w_E-2]$, which is this unit's complement.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §22.2.3 "Input filtering", pp. 643–644 — Table 22.1 (thresholds), Fig. 22.2 (special-case regions), the coarse-exponent test and the FloPoCo test-bench range.
- §22.2.4 "A first architecture: direct tabulation", p. 645 — Fig. 22.3, showing where the "special case handling" block sits relative to the table.
- §22.1, p. 642 — the power series (22.3) from which $X_1$ is derived.
