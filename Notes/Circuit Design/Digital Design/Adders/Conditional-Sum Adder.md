---
title: "Conditional-Sum Adder"
description: "Carry-select applied to itself — a mux tree instead of a mux chain gives the first O(log w) adder at linear CPA area, paid for with w/2 fan-out on the top select."
kind: circuit
source: "ASA §5.3.3, pp. 115-116"
status: seed
spade: simulated
tags: [digital, adder, carry, carry-select, logarithmic, fpga]
aliases:
  - Conditional Sum Adder
  - Conditional-Sum Adders
  - Recursive Carry-Select Adder
  - Conditional-Sum
---

# Conditional-Sum Adder

A carry-select adder whose selection network is a **binary tree of multiplexers rather than a linear chain**, making it the first adder architecture whose delay is logarithmic in the word size.

```tikz title="16-bit conditional-sum adder with 4-bit leaf groups: the mux tree that replaces carry-select's mux chain"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\scriptsize,>=latex]

% ---- leaf CPAs -------------------------------------------------------
\foreach \x/\lbl in {1.4/{15{:}12}, 4.6/{11{:}8}, 7.8/{7{:}4}, 11.0/{3{:}0}} {
  \draw[thick] (\x-0.8,4.6) rectangle (\x+0.8,5.5);
  \node at (\x,5.05) {CPA-4};
  \draw[->] (\x,6.2) -- (\x,5.5);
  \node[anchor=south] at (\x,6.25) {$x_{\lbl},\,y_{\lbl}$ (4+4)};
}
\draw[->] (12.3,5.05) -- (11.8,5.05);
\node[anchor=west] at (12.3,5.05) {$c_\text{in}$};

% ---- level-1 multiplexers -------------------------------------------
\foreach \x/\lbl in {0.7/{$M_B$}, 2.6/{$M_C$}, 7.8/{$M_A$}} {
  \draw[thick] (\x-0.8,2.6) rectangle (\x+0.8,3.4);
  \node at (\x,3.0) {\lbl\ MUX 5};
}

% ---- level-2 multiplexer --------------------------------------------
\draw[thick] (-0.2,0.9) rectangle (4.4,1.75);
\node at (2.1,1.32) {$M_D$\ \ MUX 9};

% ---- 15:12 speculative pair feeds both level-1 muxes -----------------
\draw[thick] (1.4,4.6) -- (1.4,3.7);
\draw[thick] (0.7,3.7) -- (2.6,3.7);
\draw[thick,->] (0.7,3.7) -- (0.7,3.4);
\draw[thick,->] (2.6,3.7) -- (2.6,3.4);
\node[anchor=west] at (1.5,3.88) {2$\times$5};

% ---- 11:8 carry candidates are the level-1 selects -------------------
\draw[thick,->] (4.2,4.6) -- (4.2,4.35) -- (-0.6,4.35) -- (-0.6,3.0) -- (-0.1,3.0);
\node[anchor=south west] at (0.1,4.4) {$c^{0}_{12}$};
\draw[thick,->] (4.35,4.6) -- (4.35,4.05) -- (3.65,4.05) -- (3.65,3.0) -- (3.4,3.0);
\node[anchor=west] at (3.7,3.6) {$c^{1}_{12}$};

% ---- 11:8 sum candidates skip level 1 and go to M_D ------------------
\draw[thick,->] (5.0,4.6) -- (5.0,2.1) -- (4.0,2.1) -- (4.0,1.75);
\node[anchor=west] at (5.05,3.35) {2$\times$4};

% ---- level-1 results into M_D ----------------------------------------
\draw[thick,->] (0.7,2.6) -- (0.7,1.75);
\draw[thick,->] (2.6,2.6) -- (2.6,1.75);
\node[anchor=west] at (0.78,2.15) {5};
\node[anchor=west] at (2.68,2.15) {5};

% ---- 7:4 pair and its select ------------------------------------------
\draw[thick,->] (7.5,4.6) -- (7.5,3.4);
\node[anchor=east] at (7.45,3.9) {2$\times$5};
\draw[thick,->] (10.6,4.6) -- (10.6,4.35) -- (8.9,4.35) -- (8.9,3.0) -- (8.6,3.0);
\node[anchor=south] at (9.75,4.35) {$c_4$};

% ---- c8: the level-2 select -------------------------------------------
\draw[thick,->] (7.0,3.0) -- (5.7,3.0) -- (5.7,1.32) -- (4.4,1.32);
\node[anchor=south] at (6.35,3.05) {$c_8$};
\node[anchor=west] at (5.8,2.2) {fan-out 9};

% ---- outputs ----------------------------------------------------------
\draw[thick,->] (2.1,0.9) -- (2.1,0.35);
\node[anchor=north] at (2.1,0.32) {$s_{15:8}$ (8)};
\draw[thick,->] (-0.2,1.32) -- (-1.0,1.32);
\node[anchor=east] at (-1.0,1.32) {$c_\text{out}$};
\draw[thick,->] (7.8,2.6) -- (7.8,0.35);
\node[anchor=north] at (7.8,0.32) {$s_{7:4}$ (4)};
\draw[thick,->] (11.0,4.6) -- (11.0,0.35);
\node[anchor=north] at (11.0,0.32) {$s_{3:0}$ (4)};

% ---- level annotation -------------------------------------------------
\node[anchor=west] at (9.0,2.6) {level 1};
\node[anchor=west] at (5.85,0.95) {level 2};

\end{circuitikz}
\end{document}
```

*after Fig. 5.13, p. 116.*

**Recurse on the architecture, not on the equation.** [[Carry-Select Adder]] splits a $w$-bit addition into $\lceil w/m\rceil$ groups, computes each upper group twice — once assuming $c_\text{in}=0$, once assuming $c_\text{in}=1$ — and resolves the speculation with one multiplexer per group boundary. Its delay is one $m$-bit CPA plus $\lceil w/m\rceil-1$ mux delays, still linear in $w$. The conditional-sum adder observes that the *same trick applies to the sub-adders*. Take $w=2^q$ and split once at the midpoint: three $w/2$-bit adders (one for the low half, whose carry-in is genuinely known, and two speculative copies for the high half) plus a $w/2$-bit-wide multiplexer. Because the multiplexer is bit-parallel, its delay does not depend on $w$, so (Eq. 5.16, p. 115)

$$\tau_\text{add}(w)=\tau_\text{add}(w/2)+\tau_\text{mux}.$$

**Unroll the recurrence.** Each of the three sub-adders is itself built the same way, and all three run concurrently, so the recursion contributes exactly one mux delay per level and nothing else. Substituting $\tau_\text{add}(w/2)=\tau_\text{add}(w/4)+\tau_\text{mux}$ repeatedly and stopping at width 1 gives (Eq. 5.17, p. 115)

$$\tau_\text{add}(w)=\tau_\text{add}(1)+q\,\tau_\text{mux},\qquad q=\log_2 w.$$

In practice you stop the recursion at a leaf width $m$ where a plain [[RCA, Ripple-Carry Adder]] is still cheap — the book suggests $m=4$ or $m=8$ (p. 116) — and the delay becomes $\tau_\text{CPA}(m)+\log_2(w/m)\,\tau_\text{mux}$. The 16-bit drawing above has $m=4$ and therefore $\log_2 4=2$ mux levels, against the $16/4-1=3$ of the equivalent carry-select chain.

**The $\times 3$ per level does not compound.** The naive reading of the recursion — three sub-adders per level, so $3^q$ adders — is wrong, and seeing why is the whole point of the architecture. Recursion multiplies the number of *logical* CPA instances, but at the leaves there are only ever **two distinct problems**: this $m$-bit slice added with carry-in $0$, and the same slice with carry-in $1$. Every ancestor that asks for a leaf's result asks for one of those two answers, so one physical dual-output leaf serves all of them. The leaf count is therefore $w/m$, exactly as in carry-select, and the CPA area stays **linear in $w$** (p. 116). Nothing changed but the multiplexer routing.

**Count what the tree actually costs.** Write $w=m\cdot 2^L$. At level $j\in\{1,\dots,L\}$ there are $w/(m2^{j})$ merge nodes, and each merge node contains *two* muxes — one for each carry-in case of the block being built — of width $m2^{j-1}+1$ bits (the high half's sum plus its carry-out). Level $j$ therefore costs

$$\frac{w}{m2^{j}}\cdot 2\left(m2^{j-1}+1\right)=w+\frac{w}{m2^{j-1}}\ \approx\ w \quad\text{mux bits},$$

independent of $j$: **every level costs about $w$ mux bits**, so the tree totals $\Theta\!\left(w\log_2(w/m)\right)$. The linear mux chain of carry-select costs $(\lceil w/m\rceil-1)(m+1)\approx w$ bits in total. Logarithmic depth is bought at $\log_2(w/m)\times$ the selection area — which is precisely the price a [[Parallel Prefix Adders|prefix tree]] pays too, and the right frame in which to compare them.

> [!warning] The book's "area grows linearly with $w$" (p. 116) covers the CPAs only
> The argument on p. 116 — leaf sharing, hence the same CPA blocks as Fig. 5.12 — is correct and is the non-obvious part. But the sentence "The area thus still grows linearly with $w$" is stated of the architecture as a whole, and the mux tree it just introduced is $\Theta(w\log w)$ by the count above. For the drawn 16-bit example: 24 mux bits ($M_A,M_B,M_C$ at 5 bits each, $M_D$ at 9) versus 15 for the 16-bit carry-select of Fig. 5.12. Total area is $\Theta(w\log w)$, not $\Theta(w)$.

**The top select is the bottleneck, and it is a fan-out bottleneck.** In the figure, $c_8$ is the select of $M_D$, a 9-bit multiplexer — so a single logic cone drives **nine** gate inputs, and in general the level-$L$ select drives $w/2+1$ of them (p. 116). Load capacitance is additive, so that node's transition time grows linearly with $w$ even though the *logic depth* is $\log_2 w$: the elegant recurrence quietly assumed $\tau_\text{mux}$ is a constant. Synthesis will not fail here — it will insert a buffer tree, which restores the timing by adding depth and area that never appear in the equation. That is the same pathology as the [[Sklansky Tree]], and not by coincidence: **the conditional-sum adder is Sklansky with multiplexers substituted for the prefix $\circ$-nodes**, which is why both have depth $\log_2 w$ and both peak at fan-out $w/2$.

**On FPGAs the recursion has almost nothing left to buy.** The leaf CPA is not a cost the way it is in ASIC — see [[FPGA Hard Carry Chain Adder]] — so the crossover width $m$ at which recursing beats rippling moves out to tens of bits, and below that width a conditional-sum tree spends LUTs and routing to beat a carry chain that was free. The architecture earns its keep on ASIC, or on an FPGA only past the point where one hard chain no longer fits the timing budget.

$$\boxed{\ \tau_\text{add}(w)=\tau_\text{CPA}(m)+\log_2\!\left(\tfrac{w}{m}\right)\tau_\text{mux},\qquad A_\text{mux}=\Theta\!\left(w\log_2\tfrac{w}{m}\right)\ }$$

**When it breaks.**

- **$\tau_\text{mux}$ is not constant.** The top mux carries $w/2+1$ selects; past $w\approx 32$ the buffer tree that fixes it adds back the levels the recursion removed.
- **Small $w$.** At $w=16$ the tree saves one mux level over carry-select and costs $1.6\times$ the mux bits. The asymptotics only pay from roughly $w\ge 32$.
- **The leaf width $m$ is a real knob, not a detail.** $m$ too small multiplies the mux tree; $m$ too large makes $\tau_\text{CPA}(m)$ dominate the whole $\log$ term.
- **Where a sibling takes over.** [[Sklansky Tree]] hits the same depth with $\circ$-nodes — two gates — instead of $(w/2+1)$-bit multiplexers, so it is strictly the cheaper way to buy the same latency; [[Brent-Kung Tree]] and [[Kogge-Stone Tree]] trade depth for bounded fan-out. Once you have read §5.3.6 there is little reason to build this circuit rather than choose a prefix graph — see [[Choosing an Adder]]. Its value is didactic: it is the shortest path from "select the carry" to "$O(\log w)$".

**RTL (Spade).**

```spade
/// Speculative leaf: both carry-in cases of a 4-bit slice at once.
fn leaf4(a: uint<4>, b: uint<4>) -> (uint<4>, bool, uint<4>, bool) {
    let r0: uint<5> = a + b;
    let r1: uint<5> = trunc(r0 + 1);
    (r0.as_bits()[0..4].as_uint(), r0.as_bits()[4],
     r1.as_bits()[0..4].as_uint(), r1.as_bits()[4])
}

/// The one non-speculative leaf: the LSB group, whose carry-in is known.
fn cpa4(a: uint<4>, b: uint<4>, c: bool) -> (uint<4>, bool) {
    let r: uint<5> = trunc((a + b) + zext::<1, 5>(c.as_uint()));
    (r.as_bits()[0..4].as_uint(), r.as_bits()[4])
}

/// A mux-tree node: two speculative halves -> one speculative whole.
fn merge<#uint L, #uint H>(
    lo: (uint<L>, bool, uint<L>, bool),
    hi: (uint<H>, bool, uint<H>, bool),
) -> (uint<{L + H}>, bool, uint<{L + H}>, bool) {
    let (ls0, lc0, ls1, lc1) = lo;
    let (hs0, hc0, hs1, hc1) = hi;
    let (t0, c0) = if lc0 { (hs1, hc1) } else { (hs0, hc0) };
    let (t1, c1) = if lc1 { (hs1, hc1) } else { (hs0, hc0) };
    (t0.concat(ls0), c0, t1.concat(ls1), c1)
}

/// Resolve a speculative block once its real carry-in arrives.
fn apply<#uint W>(d: (uint<W>, bool, uint<W>, bool), c: bool) -> (uint<W>, bool) {
    let (s0, c0, s1, c1) = d;
    if c { (s1, c1) } else { (s0, c0) }
}

entity csum16(x: uint<16>, y: uint<16>, cin: bool) -> uint<17> {
    let xb = x.as_bits();
    let yb = y.as_bits();

    let (s30, c4) = cpa4(xb[0..4].as_uint(), yb[0..4].as_uint(), cin);
    let d1 = leaf4(xb[4..8].as_uint(),   yb[4..8].as_uint());
    let d2 = leaf4(xb[8..12].as_uint(),  yb[8..12].as_uint());
    let d3 = leaf4(xb[12..16].as_uint(), yb[12..16].as_uint());

    let (s74, c8) = apply::<4>(d1, c4);   // M_A, 5 bits
    let hi        = merge::<4, 4>(d2, d3); // M_B and M_C, 5 bits each
    let (s158, c16) = apply::<8>(hi, c8);  // M_D, 9 bits, c8 drives all nine

    c16.as_uint().concat(s158).concat(s74).concat(s30)
}
```

The four-tuple `(s0, c0, s1, c1)` is the pair of 5-bit buses leaving each speculative CPA in the drawing; `merge` is the box pair $M_B,M_C$ and `apply` is $M_A$ and $M_D$, the muxes whose select is a resolved carry. Widths grow only at `concat`: $1+8+4+4=17$, and every `+` is truncated back to 5 bits because $15+15+1=31$ fits. The whole entity is combinational — there is no `clk` port — so the $\log_2$ depth is a *combinational* depth and the entire structure sits inside one clock period; pipelining it means cutting between mux levels, which the recursion makes easy and which no line of this code expresses. Synthesis will not preserve the drawing: `merge` and `apply` are adjacent muxes on the same data, and a mapper is free to flatten $M_B/M_C$ into $M_D$ into wider select logic, or to rebalance the leaf `+` into carry-lookahead — and, on the $c_8$ net, it will insert the buffer tree the delay model never charged for.

**Related Notes.**

- [[Carry-Select Adder]] – extends: the same CPA blocks with the linear mux chain reassociated into a tree; read it first, this note is one refinement of it.
- [[Sklansky Tree]] – compares: identical $\log_2 w$ depth and identical $w/2$ peak fan-out, with cheap $\circ$-nodes where this has wide muxes — the reason conditional-sum is a teaching architecture rather than a shipping one.
- [[Compound Adder]] – depends-on: `leaf4` is exactly a compound adder, emitting $X+Y$ and $X+Y+1$ together; every speculative leaf here is one.
- [[Parallel Prefix Adders]] – extends: the general frame in which "pick the mux routing" becomes "pick the prefix graph".
- [[FPGA Hard Carry Chain Adder]] – counter-example: hardened carry logic makes the leaf CPA nearly free, so the recursion's premise fails and the linear ripple wins at widths where the asymptotics say it should not.
- [[Choosing an Adder]] – compares: where this sits against every sibling.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
- §5.3.2 Carry-Select Adder, p. 115 (Fig. 5.12) — the architecture being recursed on.
- §5.3.3 Recursive Carry-Select Adder (Conditional-Sum Adder), pp. 115-116: Eqs. 5.16-5.17, Fig. 5.13 (p. 116), leaf-sharing and fan-out discussion (p. 116).
- §5.3.6 Parallel Prefix Adders, pp. 118-122 — where the fan-out this architecture cannot control becomes a design parameter.
