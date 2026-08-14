---
title: "Two-Level SOP Network"
description: "AND-plane feeding one OR gate: minimum logic depth 2 for any function, paid for in unbounded fan-in and literal count."
kind: circuit
source: "0.1) Boolean Algebra §Specification, §Canonical forms, §Cost metrics, §Trade-offs — no book source"
status: seed
spade: simulated
tags: [digital, boolean-algebra, sop, pla, minimization]
aliases:
  - Sum of Products
  - Sum-of-Products
  - SOP
  - SOP Network
  - AND-OR Network
  - Two-Level SOP
  - PLA
---

# Two-Level SOP Network

A disjunction of conjunctions of literals, realized as one plane of AND gates feeding a single OR gate — the one structure whose logic depth is $2$ for *every* Boolean function, and whose price for that is fan-in and literal count that both grow without bound.

```tikz title="Two-level SOP network drawn as a PLA: literal rails, three product lines, one OR"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % ---- inputs into the inverter band -------------------------------------
  \foreach \x/\lbl in {0.325/a, 1.625/b, 2.925/c, 4.225/d} {
    \draw[->] (\x,1.75) -- (\x,1.05);
    \node[anchor=south] at (\x,1.8) {$\lbl$};
  }
  \draw[dashed,rounded corners] (-0.45,0.45) rectangle (5.0,1.05);
  \node at (2.28,0.75) {$n$ inverters};
  \node[anchor=west] at (5.15,0.75) {$n=4$ inputs $\to$ $2n=8$ literal rails};

  % ---- literal rails ------------------------------------------------------
  \foreach \x/\lbl in {0/{a}, 0.65/{\bar a}, 1.3/{b}, 1.95/{\bar b},
                       2.6/{c}, 3.25/{\bar c}, 3.9/{d}, 4.55/{\bar d}} {
    \draw[gray!70] (\x,0.45) -- (\x,-3.4);
    \node[anchor=north,inner sep=2pt] at (\x,-3.45) {$\lbl$};
  }

  % ---- product lines (the AND plane) --------------------------------------
  \foreach \y/\lbl in {-1.1/{c\bar d}, -2.0/{\bar b\bar c}, -2.9/{\bar a b d}} {
    \draw[thick] (-1.55,\y) -- (6.15,\y);
    \node[anchor=east] at (-1.65,\y) {$\lbl$};
  }

  % ---- crosspoints: one dot per literal in the cube -----------------------
  \foreach \x/\y in {2.6/-1.1, 4.55/-1.1,
                     1.95/-2.0, 3.25/-2.0,
                     0.65/-2.9, 1.3/-2.9, 3.9/-2.9}
    \fill (\x,\y) circle (2.4pt);

  % ---- OR plane -----------------------------------------------------------
  \draw[fill=gray!8] (6.15,-3.25) rectangle (7.45,-0.75);
  \node[align=center] at (6.8,-2.0) {OR\\ fan-in\\ $p=3$};
  \draw[->] (7.45,-2.0) -- (9.0,-2.0);
  \node[anchor=south] at (8.25,-1.95) {$f$};
  \node[anchor=north] at (8.25,-2.1) {1 bit};

  % ---- annotations --------------------------------------------------------
  \node[anchor=west,align=left] at (5.15,-0.1)
    {AND plane: $p$ product lines,\\ fan-in $|c_j|$ each};
  \node[anchor=west,align=left] at (-1.65,-4.05)
    {$f=c\bar d+\bar b\bar c+\bar a b d$ \quad
     $L=\sum_j|c_j|=2+2+3=7$ literals \quad $D=2$ \quad
     every wire is 1 bit};
  \node[anchor=west,align=left] at (-1.65,-4.55)
    {under a fan-in limit $k$ the two levels become trees:
     $D=\lceil\log_k n\rceil+\lceil\log_k p\rceil$};

\end{circuitikz}
\end{document}
```

*Drawn from the canonical PLA structure; there is no book figure for this note.* A dot at a crosspoint means that literal rail participates in that product line; no dot means the variable is absent from that cube, which is exactly what "fewer literals" buys. Every wire in the drawing is $1$ bit — the annotations count *wires*, not bit widths, because Boolean algebra assigns no weights to bits ([[Number Formats]] is where weights enter).

**The truth table already contains a two-level network, so depth $2$ is a theorem rather than a design choice.** A **minterm** $m_k$ of $n$ variables is a product containing every variable exactly once, true for exactly one assignment $k$; the **canonical SOP** is the sum of the minterms on which $f$ is $1$,

$$f=\sum_{k:\,f(k)=1} m_k$$

and it is unique. Its existence for arbitrary $f$ is the entire claim: any function whatsoever — of any $n$, however irregular — can be realized as an AND plane feeding one OR, so $D=2$ is a *universal upper bound* on logic depth. No other structure in this vault has a depth independent of $n$. What the canonical form is not is an implementation: a function with $t$ ones costs $t\cdot n$ literals and $t$ product lines, so the running example $f=\sum m(0,1,2,5,6,7,8,9,10,14)$ starts at $40$ literals across $10$ lines. Its job is to be a normal form for equivalence checking.

**Minimization shortens the cube list; it never touches the depth.** Generalize the minterm to a **cube** $c_j$ — any set of literals — and write the network the diagram actually draws,

$$f=\bigvee_{j=1}^{p}\ \bigwedge_{\ell\,\in\,c_j}\ell ,$$

with $p$ product lines and $L=\sum_j |c_j|$ literals. Merging is absorption on a Karnaugh adjacency: $ab+a\bar b=a(b+\bar b)=a\cdot 1=a$, by distributivity of AND over OR, then complement ($b+\bar b=1$), then identity — one literal gone, two lines become one. Repeat until every cube is *prime* (no literal can be dropped) and then pick a minimum-cost subset that still covers every one of $f$; that procedure is [[Karnaugh Map]]. On the running example it returns $f=c\bar d+\bar b\bar c+\bar a b d$: $40$ literals down to $7$, $10$ product lines down to $3$, and the depth unchanged at $2$. That last clause is the point — every knob two-level minimization has moves area, none of them moves depth.

**The two cost numbers, and why the depth one is the weaker claim.** **Literal count** $L$ is the area proxy: a static CMOS complex gate spends one NMOS and one PMOS per literal, so $2L$ transistors, plus the inverter band. **Logic depth** $D$ is the delay proxy, and it is honest only while fan-in is unbounded. Impose a fan-in limit of $k$ and each product of $|c_j|\le n$ literals becomes an AND tree of depth $\lceil\log_k |c_j|\rceil$, the $p$-input OR becomes a tree of depth $\lceil\log_k p\rceil$, and the network's real depth is

$$D_{\text{fan-in }k}=\lceil\log_k n\rceil+\lceil\log_k p\rceil .$$

Since $p$ can reach $2^{n-1}$ in the worst case, that second term is $\Theta(n/\log k)$ — **linear in $n$**. The structure that was advertised as constant-depth is constant-depth only in a cost model where a $2^{n-1}$-input OR gate is free.

> [!important] "Two-level" is an accounting convention, not a delay claim
> Quote $D=2$ and you have said only that the netlist has two *ranks*, not that it is fast. Four-input parity is the clean demonstration: its minimal SOP equals its canonical SOP, $p=8$ products of $4$ literals, nominal $D=2$; under a fan-in-$2$ library that is $\lceil\log_2 4\rceil+\lceil\log_2 8\rceil=5$ levels and $32$ literals, against $2$ levels and $6$ literals for the XOR tree $(a\oplus b)\oplus(c\oplus d)$. The two-level form loses on *both* metrics the moment the fan-in fiction is dropped.

**The physical AND plane is not built from AND gates.** Static CMOS has no non-inverting primitive — an AND gate is a NAND followed by an inverter — so the AND-OR drawing is never what gets fabricated. Double-negate the OR and push one negation into each product by De Morgan:

$$f=\sum_j c_j=\overline{\overline{\textstyle\sum_j c_j}}=\overline{\textstyle\prod_j \overline{c_j}}$$

Every AND becomes a NAND, the OR becomes a NAND, and gate count, depth and literal count are all unchanged, so the transform is free and deletes an inverter per gate: see [[NAND-NAND Network]]. The dual statement maps a [[Two-Level POS Network]] onto a [[NOR-NOR Network]], which is what a fabricated PLA's two planes physically are. Fan-in has a second, transistor-level cost the gate model hides: an $m$-literal product is an $m$-transistor series stack, whose resistance grows with $m$ while its own diffusion capacitance grows too, so stack delay grows faster than linearly in $m$ and wide products are punished twice.

**Read the PLA's area off the crosspoint grid, and the decoder falls out as a corner case.** For $m$ outputs sharing one AND plane the array is $2n\times p$ crosspoints below and $p\times m$ above, and the *personality* — which crosspoints are programmed — is data rather than gates, which is what made the structure attractive before synthesis tools existed. Sharing is where a PLA beats minimizing each output alone: a product line feeding several OR lines is paid for once. Push $p$ to its maximum $2^n$, populating the AND plane with every minterm, and the plane stops depending on $f$ at all — it is a [[Decoders|binary decoder]], and the OR plane above it is a ROM holding the truth table verbatim. That corner does no minimization whatsoever, costs exponential area, and in exchange accepts any $f$ as a memory image.

**On an FPGA neither $L$ nor $p$ is the cost.** A $k$-input lookup table implements *any* function of $k$ variables at one LUT and depth $1$, so a $30$-literal minimal SOP and a $64$-literal canonical SOP over the same four variables map to the identical single 4-LUT. The metric that survives is **support size**, the number of distinct variables a logic cone depends on: any cone of $\le k$ variables is one LUT, full stop, and with $k=6$ on current devices every six-variable cone is free. The FPGA problem is therefore *decomposition* — splitting a function of $n>k$ variables into a network of $\le k$-support pieces — not minimization, and running an exact two-level minimizer before FPGA synthesis is wasted effort ([[Lookup-Tables]], [[FPGAs]]). Two-level minimization keeps its value on ASIC standard-cell flows, where literal count really does buy transistors.

**The trade-off, computed rather than quoted.** Inverters excluded from gate counts; XOR counted as one gate of depth $1$; the last column re-costs the same netlist under a fan-in-$2$ library.

| Function | Realization | $L$ | Gates | $D$ | $D$ at fan-in $2$ |
| --- | --- | --- | --- | --- | --- |
| $c_{out}=\sum m(3,5,6,7)$ | two-level SOP $ab+ac+bc$ | 6 | 3×AND2 + OR3 = 4 | 2 | 3 |
| | factored $ab+c(a+b)$ | 5 | 2×AND2 + 2×OR2 = 4 | 3 | 3 |
| | one 3-LUT | — | 1 | 1 | 1 |
| 4-input parity | minimal SOP $=$ canonical SOP | 32 | 8×AND4 + OR8 = 9 | 2 | 5 |
| | XOR tree $(a\oplus b)\oplus(c\oplus d)$ | 6 | 3 | 2 | 2 |
| | one 4-LUT | — | 1 | 1 | 1 |

The carry row is the case for the two-level form: three products, small fan-in, and the depth advantage survives the re-cost. The parity row is the case against it, and both rows are the same table entry — which realization wins is a property of $f$, not of the style.

> [!warning] No technology numbers here
> Absolute delays (ns), areas (µm² or slice counts) and energies need a process node and a cell library, and this note has no source for either. Everything above is a structural count. Where the source's own trade-off table gives no fan-in-$2$ column, the last column was recomputed here from the netlists directly.

$$\boxed{\ f=\bigvee_{j=1}^{p}\bigwedge_{\ell\in c_j}\ell,\qquad L=\sum_{j=1}^{p}|c_j|,\qquad D=2,\qquad D_{\text{fan-in }k}=\lceil\log_k n\rceil+\lceil\log_k p\rceil\ }$$

**When it breaks**

- **Functions with no adjacencies.** Parity and its relatives have $2^{n-1}$ minterms, no two of which differ in one bit, so every minterm is its own prime implicant and minimization achieves *literally nothing*. At $n=4$ that is $32$ literals against $6$ for the factored [[Multi-Level Factored Network|XOR tree]] — a $5.3\times$ gap at equal nominal depth. Check for an XOR structure before minimizing anything.
- **Real fan-in.** Past a handful of products the $\lceil\log_k p\rceil$ term dominates and the depth-$2$ claim is worth nothing. Below roughly a dozen products it is worth exactly what it says.
- **Hazards.** A minimum cover deletes precisely the consensus terms that hold the output steady through a transition, so a two-level *minimal* network is generally not static-hazard-free: minimality and glitch-freedom are opposed objectives. Asynchronous designs minimize deliberately less ([[Combinational Logic]]).
- **Multiple outputs.** Minimizing each output alone misses products shareable across the OR plane. Multi-output two-level minimization is a different and harder problem, and it is the one a PLA actually poses.
- **The wrong polarity.** If $f$ has far more ones than zeros its complement has the smaller cover, and the POS form is the cheaper netlist for the same function. Cost both forms; never assume SOP ([[Two-Level POS Network]]).
- **Scale.** The number of prime implicants of an $n$-variable function grows as $\Theta(3^n/n)$, and selecting a minimum cover from them is minimum unate covering, which is NP-hard. Exact minimization stops being available well before $n=16$; production tools accept a near-minimal cover from a heuristic instead.
- **FPGA targets.** See above — the metric the whole procedure optimizes is invisible to the fabric.

**RTL (Spade)**

```spade
/// One product term (a cube) of the AND plane. Variable i takes part iff
/// `care[i]`, and then must match `pol[i]`. The whole product is true iff no
/// cared-about variable disagrees.
fn cube<#uint N>(x: uint<N>, care: uint<N>, pol: uint<N>) -> bool {
    (care & (x ^ pol)) == 0
}

/// The OR plane: one unbounded-fan-in OR over the P product lines.
fn sop<#uint N, #uint P>(x: uint<N>, care: [uint<N>; P], pol: [uint<N>; P]) -> bool {
    gen if P == 0 {
        false
    } else {
        cube(x, care[0], pol[0]) || sop(x, care[1..P], pol[1..P])
    }
}

/// f = c*!d + !b*!c + !a*b*d  over x = (a,b,c,d), bit 3 = a, bit 0 = d.
entity sop_example(x: uint<4>) -> bool {
    sop::<4, 3>(x, [0b0011, 0b0110, 0b1101], [0b0010, 0b0000, 0b0101])
}
```

`x` is the $n$-bit input vector, one bit per literal rail pair; `care` is the column of crosspoint dots for product line $j$ and `pol` says which rail of the pair the dot sits on, so the two arrays together *are* the PLA personality — the cover is data, exactly as in a real array. `cube` is one horizontal line in the drawing: `x ^ pol` marks disagreeing variables, `care &` discards the ones this cube does not mention, and `== 0` is the AND. `sop` is the OR box, recursive because there is no `gen for`; `||` on `bool` is the OR, and note `^` is bitwise on `uint<N>` here, not the bool XOR. Everything is `fn`, hence purely combinational — no clock, no state, $L$ and $p$ are compile-time constants. Synthesis will not build this literally: an ASIC tool re-factors the cover into whatever depth its timing wants, and an FPGA tool collapses all four variables into one 4-LUT and never sees the product lines at all.

Simulated with `.zettel/sim.sh`: **3022 vectors pass** — 6 named, all 16 assignments exhaustively against $\sum m(0,1,2,5,6,7,8,9,10,14)$, and 3000 random. The named set includes the asymmetric pair $x=1$ ($d$ alone, $f=1$) and $x=4$ ($b$ alone, $f=0$), which bit-reversal maps onto each other; reversing the personality masks does make the same testbench fail, so the check has teeth.

**Related Notes**

- [[Karnaugh Map]] – depends-on: where the cube list comes from, and the running example this note implements.
- [[Two-Level POS Network]] – compares: the exact dual, and the form that wins when $f$ has more ones than zeros.
- [[NAND-NAND Network]] – extends: the same graph with every gate a NAND, free on static CMOS.
- [[NOR-NOR Network]] – compares: what the POS form maps to, and what a fabricated PLA's planes physically are.
- [[Multi-Level Factored Network]] – counter-example: trades one level of depth for a literal count this form cannot reach; parity is the extreme case.
- [[Shannon Expansion Multiplexer]] – extends: the recursive cofactor form; applied $n$ times it *is* the canonical SOP of this note.
- [[Decoders]] – extends: an AND plane populated with all $2^n$ minterms stops depending on $f$ and becomes a decoder, plus an OR plane makes it a ROM.
- [[Lookup-Tables]] – counter-example: on FPGA neither literal count nor product count is a cost; support size is.
- [[Combinational Logic]] – supports: the hazard behaviour that minimum covers give up.
- [[Choosing a Logic Realization]] – compares: where this sits against every sibling realization.

## References

- [[0.1) Boolean Algebra]] — §Specification (the truth table as the only complete specification, literal count and logic depth as the two metrics), §Canonical forms (minterms, uniqueness, $t\cdot n$ cost), §Cost metrics ($2L$ transistors, the fan-in-$k$ depth formula), §Trade-offs (the carry and parity rows, recomputed here with a fan-in-$2$ column added).
- No textbook source for this topic. Standard material: Mano & Ciletti, *Digital Design*, ch. 2–3 (canonical forms, minterms, PLA and PAL structures); Wakerly, *Digital Design: Principles and Practices*, ch. 4 (two-level minimization, programmable arrays); Weste & Harris, *CMOS VLSI Design*, ch. 1 and 4 (literal count as a transistor proxy, series-stack delay, NAND versus NOR). Prime-implicant growth $\Theta(3^n/n)$: Chandra & Markowsky, *Discrete Mathematics* 24(1), 1978. Heuristic minimization: Brayton et al., *Logic Minimization Algorithms for VLSI Synthesis*, 1984. Page numbers are deliberately omitted — no copy was consulted for this note.
- The cover $f=c\bar d+\bar b\bar c+\bar a b d$ was verified against the full 16-row truth table by simulation, not taken on trust.
