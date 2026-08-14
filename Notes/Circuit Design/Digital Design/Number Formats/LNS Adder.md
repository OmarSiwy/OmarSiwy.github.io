---
title: LNS Adder
description: "Addition turns transcendental: one subtractor, one evaluation of log2(1 + 2^r) over the whole word, one adder — and the table for it has 2^(wE+wF) entries, which is why LNS lives only in small formats."
kind: circuit
source: "ASA §2.6, pp. 56-59"
status: seed
spade: simulated
tags: [digital, number-formats, lns, table, transcendental]
aliases:
  - LNS Addition
  - LNS Add
  - Logarithmic Number System Adder
---

# LNS Adder

The one operation a logarithmic number system cannot make cheap: adding two numbers whose logarithms you hold requires evaluating a transcendental function of their difference over the full word.

```tikz title="LNS adder datapath: subtract, order, look up log2(1+2^r), add"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex,
  blk/.style={draw,rounded corners=1pt,align=center,inner sep=4pt,minimum height=0.85cm}]

% ---- inputs ----
\node[anchor=east] at (-0.15,4.4) {$L_X$};
\node[anchor=east] at (-0.15,3.6) {$L_Y$};
\draw[->] (0,4.4) -- (1.6,4.4);
\draw[->] (0,3.6) -- (1.6,3.6);
\node[anchor=south] at (0.9,4.42) {$w$};
\node[anchor=south] at (0.9,3.62) {$w$};

% taps down to the max selector
\draw[fill] (0.6,4.4) circle (0.05);
\draw[fill] (0.6,3.6) circle (0.05);
\draw[->] (0.6,4.4) -- (0.6,1.5) -- (1.6,1.5);
\draw[->] (0.6,3.6) -- (0.6,0.9) -- (1.6,0.9);

% ---- subtractor ----
\node[blk,minimum width=1.2cm] at (2.2,4.0) {$-$};
\draw[->] (2.8,4.0) -- (4.4,4.0);
\node[anchor=south] at (3.6,4.02) {$d$,\; $w{+}1$};

% sign fan-out to the selector
\draw[fill] (3.4,4.0) circle (0.05);
\draw[->] (3.4,4.0) -- (3.4,1.2) -- (2.78,1.2);
\node[anchor=west] at (3.5,2.6) {$\mathrm{sign}(d)$};

% ---- magnitude ----
\node[blk,minimum width=1.2cm] at (5.0,4.0) {$|\cdot|$};
\draw[->] (5.6,4.0) -- (6.9,4.0);
\node[anchor=south] at (6.25,4.02) {$-r$,\; $w$};

% ---- table ----
\node[blk,minimum width=3.2cm,minimum height=1.3cm] at (8.5,4.0)
  {$f_\oplus(r)=\log_2(1+2^{r})$\\[2pt] $2^{w}$ entries\\[1pt] $\times\ (w_F{+}1)$ bits};
\draw[->] (10.1,4.0) -- (12.0,4.0) -- (12.0,3.25);
\node[anchor=south] at (11.05,4.02) {$w_F{+}1$};
\node[anchor=north,align=center] at (8.5,3.25) {$d=L_X-L_Y$,\quad $r=-|d|\le0$,\quad $f_\oplus\in[0,1]$};

% ---- max selector ----
\draw (1.6,0.6) -- (1.6,1.8) -- (2.78,1.5) -- (2.78,0.9) -- cycle;
\node at (2.1,1.2) {\scriptsize mux};
\draw[->] (2.78,1.2) -- (12.0,1.2) -- (12.0,2.35);
\node[anchor=south] at (7.0,1.22) {$L_{\max}=\max(L_X,L_Y)$,\; $w$ bits};

% ---- final adder ----
\node[blk,minimum width=1.2cm] at (12.0,2.8) {$+$};
\draw[->] (12.6,2.8) -- (13.9,2.8);
\node[anchor=south] at (13.25,2.82) {$w{+}1$};
\node[anchor=west] at (13.95,2.8) {$L_{X+Y}$};

\end{circuitikz}
\end{document}
```

**Factor the larger operand out of the logarithm.** An LNS number carries $X=(-1)^s2^{L_X}$ with $L_X$ a two's-complement fixed-point value in $\mathrm{sfix}(w_E-1,-w_F)$, so $L_X$ is $w=w_E+w_F$ bits wide ([[Number Formats]], [[Signed Fixed-Point Format]]). To add, you must produce $L_{X+Y}=\log_2(2^{L_X}+2^{L_Y})$. Take $L_X>L_Y$ and pull $2^{L_X}$ out of the sum — the only step is distributivity of multiplication over addition inside the argument, followed by $\log_2(ab)=\log_2 a+\log_2 b$:

$$L_{X+Y}=\log_2\!\big(2^{L_X}(1+2^{L_Y-L_X})\big)=L_X+f_\oplus(L_Y-L_X),\qquad f_\oplus(r)=\log_2(1+2^r)$$

The same factoring on a difference gives $L_{X-Y}=L_X+f_\ominus(L_Y-L_X)$ with $f_\ominus(r)=\log_2(1-2^r)$. Nothing here is an approximation: both identities are exact on the reals, and every bit of the cost sits inside $f_\oplus$ and $f_\ominus$.

**Order the operands, because the identity is not symmetric.** The derivation assumed $L_X>L_Y$, and it must: $f_\oplus$ is only tabulated for $r\le0$, and $f_\ominus(r)$ is not even real-valued for $r>0$. Hardware therefore computes $d=L_X-L_Y$ once as a $(w{+}1)$-bit two's-complement subtraction, and uses it twice — its sign selects $L_{\max}$ through a $w$-bit mux, and its magnitude supplies $r=-|d|\le0$. This is the same "compare, then swap" skeleton a sign-magnitude float adder uses before alignment, except that the exponent-difference here drives a table rather than a barrel shifter ([[Floating-Point Operators]]). $|d|$ needs only $w$ bits, not $w+1$: both operands lie in $[-2^{w-1},2^{w-1}-1]$ ulps, so $|d|\le2^w-1$.

**Read the output widths off the two functions' ranges.** For $r\le0$, $f_\oplus(r)=\log_2(1+2^r)$ is monotone with $f_\oplus(0)=1$ and $f_\oplus(-\infty)=0$, so the table's output is confined to $[0,1]$ — one integer bit and $w_F$ fraction bits, $w_F+1$ bits total, unsigned, *for any format*. $f_\ominus$ is the opposite: it is unbounded below, and the worst case a real datapath can present is $r=-2^{-w_F}$, one ulp of separation, where

$$f_\ominus(-2^{-w_F})=\log_2\!\big(1-2^{-2^{-w_F}}\big)\approx\log_2\!\big(2^{-w_F}\ln 2\big)=-w_F+\log_2(\ln 2)\approx-(w_F+0.53)$$

using $1-2^{-\varepsilon}\approx\varepsilon\ln 2$ for small $\varepsilon$. So the subtraction table's output grows like $\lceil\log_2(w_F+1)\rceil$ integer bits while the addition table's stays at one — the two functions are not interchangeable, and a shared table is not an option.

**Count the table, then shrink it.** Indexed directly by $r$ at the format's own resolution, $f_\oplus$ needs one entry per representable $r$, and $r$ spans the full $w$-bit difference range: $2^{w}=2^{w_E+w_F}$ entries. That is 32 entries at $(w_E,w_F)=(3,2)$ and $2^{31}$ at binary32-like $(8,23)$. But most of those entries are zero. Correctly rounding to the format's ulp, $f_\oplus(r)$ vanishes as soon as $\log_2(1+2^r)<2^{-w_F-1}$, i.e. $2^r<2^{2^{-w_F-1}}-1\approx2^{-w_F-1}\ln 2$, so

$$r<\log_2(\ln 2)-w_F-1\approx-(w_F+1.53)$$

and every index past $\lceil(w_F+1.53)2^{w_F}\rceil$ can be replaced by a hardwired zero. The table is $O(w_F 2^{w_F})$ entries — **independent of $w_E$**. At $(3,2)$ that is 14 live entries out of 32; at $(8,23)$ it is $\approx25\cdot2^{23}\approx2\cdot10^8$ entries of 24 bits, about 630 MB, still hopeless. The exponential in $w_F$ is what confines LNS to small formats, and it is why the format only becomes viable at all through [[Table-Based Function Evaluation]], [[Multipartite Methods]] and [[Polynomial Approximation]].

> [!important]
> The saving above is not free accuracy — it is the statement that beyond $\approx w_F+1.5$ octaves of separation, $X+Y$ rounds to $X$. That is the LNS analogue of the alignment shifter running out of significand bits in a float adder, and it lands at the same place for the same reason ([[Error Accuracy]]).

**Exceptions cost nothing extra.** $r=0$ under subtraction means $X=Y$, whose logarithm is $-\infty$; zero is not expressible by $X=(-1)^s2^{L_X}$ at all and lives in the 2-bit `exn` field, exactly as in [[Nfloat Format]]. So the only special case addition introduces is a zero-detect on $d$, feeding the same exception logic every other LNS operator already carries. The result's sign is the sign of the larger-magnitude operand, i.e. the sign already selected by the $L_{\max}$ mux; the effective operation ($f_\oplus$ vs $f_\ominus$) is the XOR of the two sign bits with the requested op.

**On an FPGA the question stops being LUTs.** The table is a ROM, so it maps to [[Block Memory]] rather than logic, and the cost metric becomes BRAM count and BRAM latency — a $2^{w}\times(w_F{+}1)$-bit table fits one 18 Kb block (the Xilinx 7-series and later granularity) up to about $w=11$ at $w_F=5$. That also forces the operator to be registered: a block RAM read is synchronous, so the table stage is a pipeline register whether you wanted one or not, while the surrounding subtractor and adder are pure combinational carry chains ([[Adders]], [[FPGAs]]). On an ASIC the same table is either a compiled ROM macro or synthesised multi-level logic, and for small $w$ the synthesised form wins because most entries are the same constant — the trailing zeros above collapse to nothing.

$$\boxed{\ L_{X\pm Y}=L_{\max}+f_{\oplus/\ominus}\!\big(-|L_X-L_Y|\big),\qquad f_\oplus(r)=\log_2(1+2^r),\ \ f_\ominus(r)=\log_2(1-2^r)\ }$$

**When it breaks.**

- **Subtraction of near-equal operands.** $f_\ominus(r)\to-\infty$ as $r\to0^-$, so its derivative is unbounded exactly where the arguments are densest. A table indexed uniformly in $r$ cannot hold accuracy there, and no amount of output width fixes it — the problem is the input grid.
- **$w_F$ above ~10.** The table is $O(w_F2^{w_F})$ even after range reduction; past a handful of block RAMs the direct table is finished and you are doing function approximation, not table lookup.
- **Addition-dominated workloads.** LNS wins by making multiply, divide, square and square root single adders and shifts ([[LNS Multiplier]]). A dot product of length $n$ has $n$ multiplies and $n-1$ adds, so the ratio is 1:1 and the table cost dominates; LNS pays off only where multiplies, divides and roots heavily outnumber additions.
- **Escaping to fixed point.** Converting out of the log domain to add and back costs a $2^x$ and a $\log_2$ — both transcendental, both at least as expensive as $f_\oplus$. There is no cheaper way around.
- **The gap around zero.** LNS has no subnormals and no exact zero, so an accumulation that should drift to zero instead underflows into `exn` ([[Choosing a Number Format]]).

> [!warning] Not covered in the source — needs outside research
> §2.6 is an overview and stops at the two identities. It gives no accuracy analysis of the tabulated $f_\oplus$/$f_\ominus$, no area or delay figures, and no treatment of the near-cancellation problem in $f_\ominus$ (the literature's answer is co-transformation, which this book does not cover).

```spade
// f_add table for wF = 2: entry k = round(2^wF * log2(1 + 2^(-k/2^wF)))
fn f_add_table(idx: uint<5>) -> uint<3> {
    let t: [uint<3>; 32] = [
        4, 4, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    t[idx]
}

// LNS(3,2) adder: lx, ly are sfix(2,-2) logarithms, 5 bits each.
entity lns_add(lx: int<5>, ly: int<5>) -> int<6> {
    let d: int<6> = lx - ly;
    let lmax: int<5> = if d < 0 { ly } else { lx };
    let idx: uint<5> = trunc(d.abs());   // |d| <= 2^5-1, so trunc is exact
    let f: int<5> = sext(f_add_table(idx).to_int());
    lmax + f
}
```

`d` is the subtractor, `lmax` the mux, `f_add_table` the ROM and the final `lmax + f` the output adder — one signal per block in the diagram. Widths grow exactly as drawn: `-` on two `int<5>` gives `int<6>`, and the table output is sign-extended from `uint<3>` (the $w_F{+}1=3$ bits of $f_\oplus\in[0,1]$ in ulps, $0..4$) before the final `int<5> + int<5> = int<6>`. All of it is combinational; on an FPGA the table becomes a synchronous block RAM read and the entity gains a pipeline stage that the drawing does not show. Trailing zeros in `t` are the range reduction made visible: entries 14 through 31 are the hardwired zeros the half-ulp bound predicts. The $f_\ominus$ path is the same skeleton with a second table, a wider signed output and a zero-detect on `d`, and is left out here.

**Related Notes**

- [[LNS Multiplier]] – compares: the operation LNS makes free, against the one it makes expensive; both use the same $L_X$ encoding.
- [[Table-Based Function Evaluation]] – extends: the $2^{w}$-entry ROM is only the naive implementation of $f_\oplus$.
- [[Multipartite Methods]] – extends: splits the $f_\oplus$ table into a table of initial values plus tables of offsets, trading a small adder for an exponential drop in ROM.
- [[Polynomial Approximation]] – extends: what replaces the table once $w_F$ makes any lookup impossible.
- [[Block Memory]] – depends-on: on an FPGA the table is BRAM, so the cost of this adder is counted in blocks, not LUTs.
- [[Floating-Point Operators]] – counter-example: the float adder pays for alignment and normalisation shifters but never needs a transcendental, and this is the one operation where floating point wins outright.
- [[Nfloat Format]] – supports: supplies the `exn` encoding this operator reuses for the zero it cannot represent.
- [[Choosing a Number Format]] – compares: where the multiply-to-add ratio has to sit before LNS is the right choice.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §2.6 "Logarithmic Number Systems", pp. 56–59 — format and Fig. 2.17 (p. 57), representable values Figs. 2.18–2.19 (pp. 57–58), operations (2.21)–(2.24) (p. 58), the $f_\oplus$/$f_\ominus$ derivation (p. 59), arbitrary base and Fig. 2.20 (p. 59).
- Long-form note: [[Number Formats]], §"Logarithmic Number Systems".
- Range-reduction bound, output-width bounds and the FPGA/ASIC remarks are derived here from the equations above; the book states none of them.
