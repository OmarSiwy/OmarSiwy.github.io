---
title: Shannon Expansion Multiplexer
description: "Any function is a 2:1 mux on one variable selecting its two cofactors; recursing gives the mux tree and the LUT decomposition."
kind: circuit
status: seed
spade: simulated
tags: [digital, boolean-algebra]
aliases:
  - Shannon Expansion
  - Boole Expansion
  - Cofactor
  - Cofactors
  - Mux Tree
---

# Shannon Expansion Multiplexer

Every Boolean function is a 2:1 multiplexer whose select is any one of its variables and whose two data inputs are that variable's cofactors — the only decomposition that is exact for all $2^{2^n}$ functions of $n$ variables and says nothing about which gates the target technology provides.

```tikz title="One Shannon expansion step as a 2:1 multiplexer, and the same expansion recursed to constants as a three-input LUT"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ================= panel A: one expansion step =================
  \draw (0.85,7.75) rectangle (2.65,8.45);
  \node at (1.75,8.10) {$f|_{x_1=0}$};
  \draw (3.65,7.75) rectangle (5.45,8.45);
  \node at (4.55,8.10) {$f|_{x_1=1}$};
  \node[anchor=south,font=\footnotesize] at (3.15,8.55)
    {cofactors: functions of the remaining $n-1$ variables, 1 bit each};

  \draw (1.75,7.75) -- (1.75,7.35);
  \draw (4.55,7.75) -- (4.55,7.35);
  \draw (1.55,7.35) -- (4.75,7.35) -- (4.05,6.65) -- (2.25,6.65) -- cycle;
  \node at (3.15,7.02) {$2{:}1$};
  \draw (-1.45,7.02) -- (1.90,7.02);
  \node[anchor=east] at (-1.55,7.02) {$x_1$};
  \node[anchor=south,font=\footnotesize] at (0.20,7.06) {1 bit};
  \draw (3.15,6.65) -- (3.15,6.05);
  \node[anchor=west] at (3.25,6.25) {$f$, 1 bit};

  \node[anchor=west,font=\footnotesize] at (5.60,7.02)
    {$f=\bar x_1 f|_{x_1=0}+x_1 f|_{x_1=1}$};
  \node[font=\footnotesize] at (3.15,5.75)
    {recurse on $x_2$, then $x_3$: cofactors of constants are constants};

  % ================= panel B: recursion to a 3-LUT =================
  \foreach \i/\lbl in {0/0,1/1,2/2,3/3,4/4,5/5,6/6,7/7} {
    \node[anchor=south,font=\footnotesize] at ({0.9*\i},5.05) {$t_{\lbl}$};
    \draw ({0.9*\i},5.00) -- ({0.9*\i},4.05);
  }
  % level 1 muxes, select x1
  \foreach \x in {0.45,2.25,4.05,5.85} {
    \draw (\x-0.45,4.05) -- (\x+0.45,4.05) -- (\x+0.25,3.55)
       -- (\x-0.25,3.55) -- cycle;
  }
  \draw (-1.45,3.80) -- (0.10,3.80);
  \draw (0.80,3.80) -- (1.90,3.80);
  \draw (2.60,3.80) -- (3.70,3.80);
  \draw (4.40,3.80) -- (5.50,3.80);
  \node[anchor=east] at (-1.55,3.80) {$x_1$};
  % level 1 -> level 2
  \draw (0.45,3.55) -- (0.45,3.10) -- (0.90,3.10) -- (0.90,2.65);
  \draw (2.25,3.55) -- (2.25,3.10) -- (1.80,3.10) -- (1.80,2.65);
  \draw (4.05,3.55) -- (4.05,3.10) -- (4.50,3.10) -- (4.50,2.65);
  \draw (5.85,3.55) -- (5.85,3.10) -- (5.40,3.10) -- (5.40,2.65);
  % level 2 muxes, select x2
  \foreach \x in {1.35,4.95} {
    \draw (\x-0.45,2.65) -- (\x+0.45,2.65) -- (\x+0.25,2.15)
       -- (\x-0.25,2.15) -- cycle;
  }
  \draw (-1.45,2.40) -- (1.00,2.40);
  \draw (1.70,2.40) -- (4.60,2.40);
  \node[anchor=east] at (-1.55,2.40) {$x_2$};
  % level 2 -> level 3
  \draw (1.35,2.15) -- (1.35,1.70) -- (2.70,1.70) -- (2.70,1.25);
  \draw (4.95,2.15) -- (4.95,1.70) -- (3.60,1.70) -- (3.60,1.25);
  % level 3 mux, select x3
  \draw (2.70,1.25) -- (3.60,1.25) -- (3.40,0.75) -- (2.90,0.75) -- cycle;
  \draw (-1.45,1.00) -- (2.80,1.00);
  \node[anchor=east] at (-1.55,1.00) {$x_3$};
  \draw (3.15,0.75) -- (3.15,0.20);
  \node[anchor=west] at (3.25,0.40) {$f$, 1 bit};

  \node[anchor=west,font=\footnotesize] at (6.45,3.80) {4 muxes};
  \node[anchor=west,font=\footnotesize] at (6.45,2.40) {2 muxes};
  \node[anchor=west,font=\footnotesize] at (6.45,1.00) {1 mux};
  \node[anchor=west,font=\footnotesize] at (6.45,5.00)
    {$2^3$ constants, 1 bit each};
  \node[font=\footnotesize] at (2.0,-0.20)
    {$2^k-1$ muxes, depth $k$; at $k=n$ the leaves are the truth table $=$ a $k$-LUT};
\end{circuitikz}
\end{document}
```

**Define the cofactor first, because the identity is only a case split dressed up.** The **cofactor** (or *restriction*) of $f(x_1,\dots,x_n)$ with respect to $x_i$ is $f$ with that variable frozen at a constant:

$$f|_{x_i=1}=f(x_1,\dots,1,\dots,x_n),\qquad f|_{x_i=0}=f(x_1,\dots,0,\dots,x_n).$$

Both are 1-bit functions of the remaining $n-1$ variables — the support has shrunk by exactly one, which is the entire point. Notation elsewhere writes $f_{x_i}$ and $f_{\bar x_i}$; they are the same objects.

**Derive the expansion from the complement axiom, not from a truth table.** Start from the complement axiom $x_i+\bar x_i=1$ and the identity element for AND:

$$f=1\cdot f=(x_i+\bar x_i)\,f=x_i f+\bar x_i f$$

by distributivity of AND over OR. Now the substitution step: for any $g$, $x_i\,g=x_i\,g|_{x_i=1}$, because the product is $0$ wherever $x_i=0$ and wherever $x_i=1$ the two factors of $g$ agree by definition. Applying it to both terms gives the expansion, and applying $\bar x_i\,g=\bar x_i\,g|_{x_i=0}$ to the other. The two product terms are **disjoint** — $x_i\bar x_i=0$ by the complement axiom — so the OR is an exclusive OR at no cost, which is the door to the XOR form below.

**Read the identity literally and a multiplexer falls out with no design step in between.** Select $x_i$ (1 bit), data inputs $f|_{x_i=0}$ and $f|_{x_i=1}$ (1 bit each), output $f$ (1 bit). Nothing has been assumed about $f$: the same three-terminal primitive realizes all $2^{2^n}$ functions of $n$ variables provided something supplies the cofactors, which is why multiplexers are functionally complete on their own (tie a data input to a constant and a 2:1 mux is an inverter, an AND, or an OR — see [[Multiplexers]]).

**The dual and the XOR variant are the same identity in the other two algebras.** Dualizing — swap $+$ with $\cdot$ and $0$ with $1$, which the duality principle licenses on any identity — gives the product form

$$f=\big(x_i+f|_{x_i=0}\big)\big(\bar x_i+f|_{x_i=1}\big),$$

the shape a [[NOR-NOR Network]] realizes directly. Substituting $\bar x_i=1\oplus x_i$ into the sum form and expanding over $\oplus$ (legal because the terms are disjoint) gives the **positive Davio expansion**

$$f=f|_{x_i=0}\;\oplus\;x_i\big(f|_{x_i=0}\oplus f|_{x_i=1}\big),$$

the Reed–Muller counterpart. Shannon costs one mux per step; Davio costs one AND and one XOR, and wins whenever the two cofactors differ by something simpler than either of them.

**Recursing $k$ times gives $2^k$ cofactors and a binary tree of $2^k-1$ muxes.** Expanding $f$ on $x_1$, then each cofactor on $x_2$, and so on, produces after $k$ steps a complete binary tree of depth $k$: $2^k$ leaves, each a function of the $n-k$ untouched variables, and $2^0+2^1+\dots+2^{k-1}=2^k-1$ 2:1 multiplexers. Level $j$ of the tree is driven entirely by $x_j$, so the tree has $k$ distinct 1-bit selects and $2^k$ 1-bit data leaves, exactly the diagram above. Delay is $k$ mux delays, independent of $f$.

**Run it to $k=n$ and the leaves are the truth table.** Each leaf is now a function of zero variables — a constant $f(v)$ for one input assignment $v$. Multiplying out the tree, the path to leaf $v$ is guarded by the product of $x_j$ or $\bar x_j$ according to $v_j$, which is the minterm $m_v$, so

$$f=\sum_{v\in\{0,1\}^n} m_v\,f(v)=\sum_{v:\,f(v)=1} m_v ,$$

the canonical SOP of [[0.1) Boolean Algebra#Canonical forms]] — not a separate construction but this recursion run to exhaustion.

> [!important] Three objects, one recursion, three stopping depths
> Stop at $k=1$ and you have a multiplexer. Stop at $k=n$ and the leaves are constants: that is the canonical SOP, and it is also an $n$-LUT with the truth table in configuration memory. Stop in between and you have the FPGA decomposition problem. The mux tree, the canonical SOP and the lookup table are the *same object* read at different depths — which is why "minimize the literal count" and "map to LUTs" are answers to different questions.

**A $k$-input LUT is that tree with its leaves in SRAM, and that is why support size is the FPGA cost metric.** A $k$-LUT holds $2^k$ configuration bits and a fixed tree of $2^k-1$ 2:1 muxes with the $k$ function inputs as selects. The *structure* never changes; only the leaf values do. Consequently every function of $\le k$ variables costs exactly one LUT and one level of delay, whatever its literal count — a $64$-literal canonical SOP and a $7$-literal minimal SOP over the same four variables are the identical 4-LUT configuration ([[Lookup-Tables]], [[FPGAs]]). Literal count, the ASIC area proxy, is invisible here; what a mapper counts is **support size**, the number of distinct variables a cone depends on.

**Above $k$ variables the expansion becomes the decomposition step itself.** For $n=k+1$, one expansion on any variable leaves two $k$-variable cofactors: two LUTs plus one 2:1 mux, and FPGA families place a dedicated mux beside each LUT pair for exactly this, so the $(k{+}1)$-variable function costs two LUTs and no third. Expanding blindly does not scale — driving $n$ down to $k$ takes $2^{n-k}$ leaf LUTs and $2^{n-k}-1$ muxes, exponential in the excess variables. The mapper's real job is choosing the split variable so the cofactors *share* subfunctions, which is where the tree stops being a tree.

> [!warning] Device-specific mux primitives not verified here
> The dedicated LUT-combining muxes are real (Xilinx `MUXF7`/`MUXF8`, and the equivalent inside Intel's ALM), but this note has no datasheet source, so no primitive count, slice occupancy or delay figure is quoted for them. Confirm against the target device's configuration guide before costing a design on it.

**Sharing identical cofactors converts the tree into a DAG, which is a BDD.** Fix a variable order, expand every node in that order, then apply two reductions: merge structurally identical subtrees, and delete any node whose two children are the same (the variable is not in that cofactor's support). The result is the reduced ordered binary decision diagram, canonical for the chosen order — the standard equivalence-checking engine, and the reason canonical SOP is only ever a definition and never a data structure. Cost depends violently on the order: an adder output has a BDD linear in $n$ under the interleaved order $x_1y_1x_2y_2\dots$ and exponential under $x_1\dots x_ny_1\dots y_n$, and finding the best order is NP-hard.

**In CMOS the mux is cheap because it is a switch, not a gate.** A 2:1 mux is two transmission gates plus one inverter for $\bar s$ — four pass transistors and two more for the inverter — against a static-CMOS AOI22 realization of $\overline{\bar s a+s b}$ at eight transistors plus an output inverter plus the same select inverter. This is why mux-based datapaths and full adders built from expansion on the carry are standard cells in their own right. On an FPGA the comparison does not arise: the mux tree is already inside the LUT and the "cost" of a mux is whether the function's support still fits in $k$.

$$\boxed{\ f=\bar x_i\,f|_{x_i=0}\;\vee\;x_i\,f|_{x_i=1},\qquad x_i\bar x_i=0\ \Rightarrow\ \vee\ \text{may be}\ \oplus\ }$$

**When it breaks.**

- **Cofactors need not be simpler than $f$.** Parity is the worst case: $f|_{x=0}$ is the parity of the remaining variables and $f|_{x=1}$ is its complement, so neither branch has lost any structure and the recursion builds the full $2^n$-leaf tree. Davio sees it instantly — $f|_{x=0}\oplus f|_{x=1}=1$, so $f=f|_{x=0}\oplus x$, one XOR gate. Choosing the wrong expansion is a worse error than choosing the wrong variable.
- **Variable order dominates and is NP-hard to optimize.** The BDD blowup above is not pathological; integer multiplication has *no* order under which its output bits have subexponential BDD size.
- **Blind decomposition is exponential.** $2^{n-k}$ LUTs for an $n$-variable cone is only acceptable for $n-k$ of two or three; beyond that the mapper must find shared cofactors or the function must be restructured at the algorithm level.
- **The identity is a steady-state statement.** The mux $\bar s a+s b$ has a static-1 hazard: with $a=b=1$ and $s$ toggling, both product terms can be momentarily false and the output glitches, even though the algebra says $f=1$ throughout. Suppressing it needs the consensus term $ab$ — the redundant product that two-level minimization deletes ([[Static Hazards]]).
- **Transmission-gate trees do not restore logic levels.** A chain of pass transistors is a distributed RC network whose delay grows quadratically in chain length, so deep mux trees need a restoring buffer every few levels; the flat "$k$ mux delays" of the depth count is only honest with those buffers costed in.

**RTL (Spade).**

```spade
/// A 2:1 multiplexer: the physical form of one Shannon expansion step.
fn mux2(s: bool, lo: bool, hi: bool) -> bool {
    if s { hi } else { lo }
}

/// f(a,b,c) = majority(a,b,c), written flat as a two-level SOP.
fn maj_direct(a: bool, b: bool, c: bool) -> bool {
    (a && b) || (a && c) || (b && c)
}

/// The same f expanded once on `a`. The cofactors f|a=0 = b.c and
/// f|a=1 = b+c are functions of b,c only: one variable has left the support.
fn maj_shannon(a: bool, b: bool, c: bool) -> bool {
    mux2(a, b && c, b || c)
}

/// The recursion driven all the way to constants: a 3-LUT is a tree of
/// 2^3-1 = 7 two-input muxes whose leaves are the eight truth-table bits.
/// `cfg` index 0 = LSB = f(0,0,0); the select order is a, then b, then c.
fn lut3(cfg: uint<8>, x: uint<3>) -> bool {
    let t = cfg.as_bits();
    let s = x.as_bits();
    let l0 = mux2(s[0], t[0], t[1]);
    let l1 = mux2(s[0], t[2], t[3]);
    let l2 = mux2(s[0], t[4], t[5]);
    let l3 = mux2(s[0], t[6], t[7]);
    let m0 = mux2(s[1], l0, l1);
    let m1 = mux2(s[1], l2, l3);
    mux2(s[2], m0, m1)
}
```

`mux2` is one trapezoid of the diagram: `s` the select wire entering from the left, `lo`/`hi` the two 1-bit cofactors, and the `if`/`else` is the identity itself rather than a control-flow construct. `lut3` is panel B verbatim — `cfg.as_bits()` are the eight leaves $t_0\dots t_7$ (index $0$ is the LSB, so $t_0=f(0,0,0)$), the four `l*` muxes are the $x_1$ level, the two `m*` the $x_2$ level, the tail expression the $x_3$ root. Everything is a `fn`, hence purely combinational: Spade forbids `reg` and `inst` inside one, so the widths are all 1 bit and there is no clock anywhere. Synthesis will not build seven muxes — `maj_shannon` and `maj_direct` collapse to the same handful of gates on an ASIC target, and on an FPGA the whole of `lut3` disappears into one 3-input LUT configuration, which is precisely the claim the note is making.

Verified by simulation: **5054 vectors**, comprising an exhaustive sweep of all $256$ truth tables against all $8$ input assignments, six named one-hot configurations (`cfg=8'h02` with $(a,b,c)=(1,0,0)$ versus $(0,0,1)$ is the asymmetric pair that catches a reversed leaf or select order), and a $3000$-vector random sweep against a behavioural reference. `maj_direct` and `maj_shannon` agree on every vector, and `lut3` matches `cfg[a+2b+4c]` on every vector.

**Related Notes.**

- [[Two-Level SOP Network]] – extends: the expansion run to depth $n$ *is* the canonical SOP, which two-level minimization then shrinks.
- [[Multi-Level Factored Network]] – compares: factoring hunts for shared subexpressions, expansion commits to one variable and recurses; only expansion is guaranteed to terminate for every function.
- [[Karnaugh Map]] – supports: the two halves of a map split along one variable's axis are that variable's two cofactors, drawn side by side.
- [[NOR-NOR Network]] – compares: realizes the dual product form of the same identity.
- [[Lookup-Tables]] – extends: the expansion driven to constants with the leaves held in configuration SRAM, which is all a LUT is.
- [[Multiplexers]] – depends-on: the select primitive whose steady-state behaviour is the identity, and which is functionally complete because of it.
- [[Static Hazards]] – counter-example: the identity holds only between transitions; the mux glitches when the select toggles with both data inputs at $1$.
- [[Choosing a Logic Realization]] – compares: where the mux/LUT realization lands against the gate-level siblings on area, depth and technology fit.
- [[FPGAs]] – supports: the target on which support size replaces literal count as the cost metric.

## References

No book source; this is standard material outside *Application-Specific Arithmetic*.

- [[0.1) Boolean Algebra#Canonical forms]] — the expansion, its reading as a multiplexer, and the $2^{2^n}$ count; [[0.1) Boolean Algebra#FPGA mapping]] — support size versus literal count, and decomposition as the real FPGA problem.
- Shannon, "A symbolic analysis of relay and switching circuits", *Trans. AIEE* 57, 1938 — the expansion in its original form; Boole had it in 1854.
- Mux-based realization, functional completeness of the 2:1 mux, and multiplexer trees — Mano & Ciletti, *Digital Design*, ch. 4; Wakerly, *Digital Design: Principles and Practices*, ch. 6.
- Transmission-gate multiplexers, pass-transistor chain delay and level restoration — Weste & Harris, *CMOS VLSI Design*, ch. 1 and 9.
- Reduced ordered BDDs, canonicity, and order sensitivity — Bryant, "Graph-based algorithms for Boolean function manipulation", *IEEE Trans. Computers* C-35(8), 1986; exponential BDD size for multiplication, Bryant, *IEEE Trans. Computers* 40(2), 1991; NP-hardness of optimal ordering, Bollig & Wegener, *IEEE Trans. Computers* 45(9), 1996.
- Mux and LUT counts, tree depth, and the $2^k-1$ figure were derived from the recursion, not quoted.
