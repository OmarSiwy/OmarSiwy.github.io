---
title: "Two-Level POS Network"
description: "OR-plane feeding one AND gate: the dual realization, natural when the function has few zeros."
kind: circuit
source: "0.1) Boolean Algebra §Canonical forms, §Distributive, §Functional completeness — no book source"
status: seed
spade: simulated
tags: [digital, boolean-algebra, pos, minimization]
aliases:
  - Product of Sums
  - Product-of-Sums
  - POS
  - POS Network
  - OR-AND Network
  - Two-Level POS
  - Maxterm Expansion
---

# Two-Level POS Network

A conjunction of disjunctions of literals, realized as one plane of OR gates feeding a single AND gate — the exact dual of the [[Two-Level SOP Network]], and the form that covers the assignments where $f$ is $0$ instead of the ones where it is $1$.

```tikz title="Two-level POS network: seven literal rails, three sum lines, one AND"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \ctikzset{logic ports=ieee, logic ports origin=center}

  % ---------------- OR plane (level 1) and the AND (level 2) ----------------
  \node[or port, number inputs=3]  (o1) at (7.0, 3.2) {};
  \node[or port, number inputs=3]  (o2) at (7.0,-0.4) {};
  \node[or port, number inputs=3]  (o3) at (7.0,-4.0) {};
  \node[and port, number inputs=3] (g)  at (12.0,-0.4) {};

  % ---------------- inverter bank -------------------------------------------
  \node[not port] (na) at (1.6,8.6) {};
  \node[not port] (nb) at (1.6,7.0) {};
  \node[not port] (nc) at (1.6,5.4) {};
  \node[not port] (nd) at (1.6,3.8) {};
  \draw (-1.4,8.6) node[anchor=east] {$a$} -- (na.in);
  \draw (-1.4,7.0) node[anchor=east] {$b$} -- (nb.in);
  \draw (-1.4,5.4) node[anchor=east] {$c$} -- (nc.in);
  \draw (-1.4,3.8) node[anchor=east] {$d$} -- (nd.in);

  % ---------------- literal rails: topmost source drops rightmost ----------
  \coordinate (rb) at (0.8,7.0);   \coordinate (rc) at (0.5,5.4);
  \coordinate (rd) at (0.2,3.8);
  \coordinate (ra') at (3.8,8.6);  \coordinate (rb') at (3.4,7.0);
  \coordinate (rc') at (3.0,5.4);  \coordinate (rd') at (2.6,3.8);

  \draw (rb) -- (rb |- o1.in 1);   \fill (rb) circle (1.6pt);
  \draw (rc) -- (rc |- o2.in 2);   \fill (rc) circle (1.6pt);
  \draw (rd) -- (rd |- o2.in 3);   \fill (rd) circle (1.6pt);
  \draw (na.out) -- (ra')  -- (ra' |- o3.in 1);
  \draw (nb.out) -- (rb')  -- (rb' |- o3.in 2);
  \draw (nc.out) -- (rc')  -- (rc' |- o1.in 2);
  \draw (nd.out) -- (rd')  -- (rd' |- o3.in 3);

  \node[anchor=south,font=\footnotesize] at (0.2,9.3) {$d$};
  \node[anchor=south,font=\footnotesize] at (0.5,9.3) {$c$};
  \node[anchor=south,font=\footnotesize] at (0.8,9.3) {$b$};
  \node[anchor=south,font=\footnotesize] at (2.6,9.3) {$\bar d$};
  \node[anchor=south,font=\footnotesize] at (3.0,9.3) {$\bar c$};
  \node[anchor=south,font=\footnotesize] at (3.4,9.3) {$\bar b$};
  \node[anchor=south,font=\footnotesize] at (3.8,9.3) {$\bar a$};

  % ---------------- rails into the OR plane --------------------------------
  \draw (rb  |- o1.in 1) -- (o1.in 1);
  \draw (rc' |- o1.in 2) -- (o1.in 2);
  \draw (rd' |- o1.in 3) -- (o1.in 3);  \fill (rd' |- o1.in 3) circle (1.6pt);
  \draw (rb' |- o2.in 1) -- (o2.in 1);  \fill (rb' |- o2.in 1) circle (1.6pt);
  \draw (rc  |- o2.in 2) -- (o2.in 2);
  \draw (rd  |- o2.in 3) -- (o2.in 3);
  \draw (ra' |- o3.in 1) -- (o3.in 1);
  \draw (rb' |- o3.in 2) -- (o3.in 2);
  \draw (rd' |- o3.in 3) -- (o3.in 3);

  % ---------------- OR outputs into the AND --------------------------------
  \draw (o1.out) -- (10.6,3.2) |- (g.in 1);
  \draw (o2.out) -- (g.in 2);
  \draw (o3.out) -- (10.6,-4.0) |- (g.in 3);
  \draw (g.out) -- (13.8,-0.4) node[anchor=west] {$f$};

  \node[anchor=west,font=\footnotesize] at (8.0, 3.75) {$T_1=b+\bar c+\bar d$};
  \node[anchor=west,font=\footnotesize] at (8.0, 0.15) {$T_2=\bar b+c+d$};
  \node[anchor=west,font=\footnotesize] at (8.0,-3.45) {$T_3=\bar a+\bar b+\bar d$};

  \node[font=\footnotesize] at (7.0,-5.6) {level 1: OR plane, 3 gates};
  \node[font=\footnotesize] at (12.0,-5.6) {level 2: one AND};
  \node[anchor=north west,align=left,font=\footnotesize] at (-1.4,-6.2)
    {$a,b,c,d$ and $f$ are $1$ bit each; every rail and every internal wire is $1$ bit.\\
     $L=9$ literals, $3+1$ gates, $D=2$ gate levels (inverters excluded, fan-in unbounded).};
\end{circuitikz}
\end{document}
```

*Own construction; the function drawn is the minimal POS of the running example derived below, and only $7$ of the $2n=8$ literal rails are used — $a$ appears nowhere uncomplemented.*

**Every zero of $f$ forbids exactly one input assignment, and a maxterm is that prohibition written as a gate.** A **maxterm** $M_k$ of $n$ variables is a sum containing every variable exactly once, complemented wherever assignment $k$ sets it to $1$; it evaluates to $0$ on $k$ and to $1$ on all $2^n-1$ other rows. Minterms and maxterms are complements of each other, $M_k=\overline{m_k}$, which is [[Boolean Algebra|De Morgan]] applied to a single product. Multiplying together one maxterm per zero of $f$ therefore gives a network that is $0$ on exactly the zero set and $1$ everywhere else — the **canonical POS**, unique like its dual:

$$f=\prod_{k:\,f(k)=0} M_k ,\qquad\text{notation } f=\prod M(3,4,11,12,13,15).$$

Every wire here is $1$ bit: $n$ inputs, $2n$ literal rails out of the inverter bank, $p$ sum lines, one output. Boolean algebra assigns no weights to those bits, so there is no ulp and nothing to round — weights and error budgets start at [[Number Formats]]. The canonical form costs $z\cdot n$ literals for a function with $z$ zeros, against $t\cdot n$ for the canonical SOP of the same function with $t=2^n-z$ ones. On the running example $f=\sum m(0,1,2,5,6,7,8,9,10,14)$ that is $6\times4=24$ literals against $40$: the polarity with fewer rows is $40\%$ cheaper before any minimization at all.

**Minimizing runs the same map with every rule dualized — circle the zeros, and complement the literal where the variable is $1$.** A rectangular group of $2^j$ adjacent zeros collapses to a sum term of $n-j$ literals, by the dual absorption $(a+b)(a+\bar b)=a+b\bar b=a$ — distributivity of OR over AND, then complement, then identity. The polarity convention inverts along with everything else: a variable held at $1$ across the group contributes $\bar x$, not $x$. On the running example's [[Karnaugh Map]] the six zeros $\{3,4,11,12,13,15\}$ admit exactly five maximal groups, the **prime implicates**:

| prime implicate | zeros covered | | prime implicate | zeros covered |
| --- | --- | --- | --- | --- |
| $b+\bar c+\bar d$ | $3,11$ | | $\bar a+\bar b+c$ | $12,13$ |
| $\bar a+\bar c+\bar d$ | $11,15$ | | $\bar a+\bar b+\bar d$ | $13,15$ |
| $\bar b+c+d$ | $4,12$ | | | |

Zero $3$ lies in only one of them and zero $4$ in only one, so $b+\bar c+\bar d$ and $\bar b+c+d$ are **essential**; they leave $13$ and $15$ uncovered and $\bar a+\bar b+\bar d$ takes both. The cover is unique and it is the network drawn above:

$$f=(b+\bar c+\bar d)(\bar b+c+d)(\bar a+\bar b+\bar d)\qquad L=9,\;p=3,\;D=2 .$$

**The cheap way to get there is not to dualize the algorithm but to complement the function.** Run an ordinary SOP minimizer on $\bar f=\sum m(3,4,11,12,13,15)$: its ones group as $\{3,11\}$, $\{4,12\}$ and $\{13,15\}$, giving $\bar f=\bar bcd+b\bar c\bar d+abd$. Complement that with the generalized De Morgan law — complement every literal, swap every operator — and the three products become the three sums above, term for term. Nothing about two-level POS minimization is a new algorithm, which is why [[Karnaugh Map]], Quine–McCluskey and Espresso are all quoted as SOP procedures and none of them ships a POS mode.

**Algebraic conversion between the two forms is available and almost never worth it.** Factoring an SOP into a POS is repeated application of distributivity of OR over AND, $a+bc=(a+b)(a+c)$ — the law with no arithmetic analogue, and the one direction of distributivity that surprises anyone reading $+$ as addition. Multiplying back out uses AND over OR. The asymmetry is in the cost: expanding $T_1T_2T_3$ gives $3^3=27$ products before absorption and idempotence delete all but the three of the minimal SOP, and in general $p$ sum terms of $q$ literals expand to $q^p$ products. Re-minimizing from the truth table is linear in what the expansion is exponential in.

**Fewer zeros than ones is a heuristic for choosing the polarity, and it is not a theorem.** The canonical bound above scales with the row count, but minimal covers do not: the running example has $10$ ones and $6$ zeros, yet the minimal SOP $c\bar d+\bar b\bar c+\bar abd$ wins at $7$ literals against the minimal POS's $9$, because the ones happen to merge into larger cubes than the zeros do. The prediction fails in the other direction just as easily. Cost both forms and compare — the derivation above is three map operations, not an afternoon. Where POS genuinely wins is where the zero set is small *and* structured: invalid-code detectors, "all inputs in range" checks, interlocks whose whole specification is a short list of forbidden patterns.

**Self-dual functions make the choice vacuous.** The full adder's carry-out is the majority function, and $f^D=f$ for it, so its minimal POS is its minimal SOP with the operators swapped and the literals untouched:

$$c_\text{out}=ab+ac+bc=(a+b)(a+c)(b+c)\qquad L=6,\;p=3,\;D=2\ \text{ either way.}$$

Both realizations cost three 2-input gates and one 3-input gate. Every symmetric threshold function behaves this way, and for them the polarity question is answered by the surrounding logic — which polarity is already on the rails, and whether the *output* wants inverting — not by the cover.

**Bubble pushing is free here too, and static CMOS is where the duality stops being symmetric.** Double-negate the AND and push one negation into each sum by De Morgan:

$$f=\prod_k T_k=\overline{\overline{\textstyle\prod_k T_k}}=\overline{\textstyle\sum_k \overline{T_k}}$$

Each $\overline{T_k}$ is a NOR of the same literals and the outer complemented sum is a NOR as well, so every OR becomes a NOR, the AND becomes a NOR, and gate count, depth and literal count are all unchanged — the [[NOR-NOR Network]]. That is exactly the transform the SOP form gets into NAND gates, but the two are not equally priced: a NOR puts its PMOS devices in series where a NAND puts them in parallel, so the OR-AND family is the slower of the two duals at equal drive on any static CMOS process. The compensation is the compound cell: a standard-cell library's **OAI** (OR-AND-Invert) gate is a two-level POS with one inversion in a *single* CMOS stage, so a POS whose consumer wants $\bar f$ costs one gate and one stage of delay rather than two ([[CMOS Logic Gates]]). That, and not the gate count, is where a POS earns its place in an ASIC flow.

**Neither the FPGA nor the PLA sees the distinction the way the algebra does.** A $k$-input lookup table implements any function of $k$ variables at one LUT and depth $1$, so a minimal POS, a minimal SOP and a canonical form over the same four variables map to the identical 4-LUT; support size is the only cost that survives ([[Lookup-Tables]], [[FPGAs]]). A programmable array is the opposite case — it has a physical AND plane feeding a physical OR plane, so a POS is *not* what it implements natively. The standard realization programs $\bar f$ as an SOP into the array and inverts the output, which is why PAL and PLA parts ship with active-low or programmable-polarity outputs: the inverter is the array's only way to reach the product-of-sums side of the duality.

> [!important] Don't-cares break the equality between the two derivations
> A don't-care row may be swept into a group of ones when minimizing the SOP and into a group of zeros when minimizing the POS — both are legal, and each is taken to enlarge a cube. The two networks are then equal on the care set and *different* on that row, so they are not interchangeable implementations of the same netlist, only of the same specification. If anything downstream depends on the don't-care rows — a hazard argument, an equivalence check, a testbench sweeping all $2^n$ inputs — pin the don't-cares to concrete values first and minimize afterwards.

$$\boxed{\ f=\prod_{k:\,f(k)=0}M_k,\qquad M_k=\overline{m_k},\qquad \text{minPOS}(f)=\overline{\text{minSOP}(\bar f)}\ }$$

**When it breaks**

- **The zero-count heuristic.** Fewer zeros predicts a cheaper *canonical* form and nothing more. The running example is the counterexample in the note: $6$ zeros against $10$ ones, and the SOP still wins $7$ literals to $9$.
- **Self-dual functions.** Majority, and every symmetric threshold function, costs the same either way; there is nothing to choose and no reason to compute both.
- **Functions with no adjacencies.** Four-input parity has $8$ zeros, no two of which differ in one bit, so its minimal POS equals its canonical POS at $32$ literals — identical to the SOP failure mode, and for the identical reason. Look for an XOR structure before minimizing in either polarity.
- **Fan-in.** $D=2$ counts ranks, not delay. Under a fan-in limit $k$ the network is $\lceil\log_k n\rceil+\lceil\log_k p\rceil$ deep, the same correction derived in [[Two-Level SOP Network]], and $p$ can reach $2^{n-1}$.
- **Static-0 hazards.** The dual of the SOP's static-1 glitch: if two adjacent zeros of $f$ are covered by *different* sum terms, then while the input crosses between them the first term rises to $1$ before the second falls to $0$, all terms are momentarily $1$, and the output glitches to $1$ when it should hold $0$. The repair is the redundant consensus factor a minimum cover has just deleted — $(a+b)(\bar a+c)(b+c)=(a+b)(\bar a+c)$ read backwards ([[Static Hazards]]).
- **FPGA targets.** The whole polarity question is invisible to the fabric; the cover you hand a LUT mapper changes nothing about what it builds.

**RTL (Spade)**

```spade
/// One sum term (a clause) of the OR plane. Variable i takes part iff
/// `care[i]`, and when it does it satisfies the term iff it equals `pol[i]`.
/// The whole sum is true as soon as one cared-about variable agrees.
fn clause<#uint N>(x: uint<N>, care: uint<N>, pol: uint<N>) -> bool {
    (care & ~(x ^ pol)) != 0
}

/// The AND at level 2: one unbounded-fan-in AND over the P sum lines.
fn pos<#uint N, #uint P>(x: uint<N>, care: [uint<N>; P], pol: [uint<N>; P]) -> bool {
    gen if P == 0 {
        true
    } else {
        clause(x, care[0], pol[0]) && pos(x, care[1..P], pol[1..P])
    }
}

/// f = (b+!c+!d)(!b+c+d)(!a+!b+!d) over x = (a,b,c,d), bit 3 = a, bit 0 = d.
entity pos_example(x: uint<4>) -> bool {
    pos::<4, 3>(x, [0b0111, 0b0111, 0b1101], [0b0100, 0b0011, 0b0000])
}
```

`x` carries the $n$ input rails; `care` is one OR gate's input list and `pol` says which rail of each literal pair it taps, so the two arrays together are the drawing's crosspoint pattern as data. `clause` is one OR gate: `x ^ pol` marks the variables that *disagree* with the term, `~` flips that to agreement, `care &` discards variables the term does not mention, and `!= 0` is the OR — the dual of the SOP note's `== 0`, which is the whole duality compressed into one operator. The recursion is a `gen if` because Spade has no `gen for`, and the $P=0$ base case returns `true`, the identity of AND, where the SOP's returns `false`. Everything is `fn`, so the network is purely combinational, with no clock and no state; synthesis will not preserve it, since an ASIC mapper re-factors the cover into whatever its timing wants and an FPGA mapper collapses all four variables into one 4-LUT.

Simulated with `.zettel/sim.sh`: **3022 vectors pass** — 6 named, all 16 assignments exhaustively against $\prod M(3,4,11,12,13,15)$, and 3000 random, with the sibling note's SOP cover instantiated alongside in the same temp file and checked to agree on every vector. The named set includes the asymmetric pair $x=0100_2$ (a zero of $f$) and $x=0010_2$ (a one), which bit reversal maps onto each other; corrupting a single `pol` mask makes the same testbench report 1524 mismatches, so the check has teeth.

**Related Notes**

- [[Two-Level SOP Network]] – compares: the exact dual, and the form that wins whenever the ones group better than the zeros — which is not predictable from the row counts.
- [[NOR-NOR Network]] – extends: the same graph with every gate a NOR, free in gates, depth and literals, and slower in silicon.
- [[NAND-NAND Network]] – counter-example: the SOP's transform, and the faster of the two on any static CMOS process.
- [[Karnaugh Map]] – depends-on: the map is read for zeros here, but it is the same map and the same covering problem.
- [[Multi-Level Factored Network]] – extends: drops the depth-$2$ constraint that defines this form, and buys literals with it.
- [[Shannon Expansion Multiplexer]] – compares: the other canonical decomposition, recursive rather than flat.
- [[Static Hazards]] – supports: names the static-0 glitch a minimum POS cover admits, and the redundant factor that suppresses it.
- [[CMOS Logic Gates]] – supports: why the NOR plane costs more than the NAND plane, and what an OAI cell computes in one stage.
- [[FPGAs]] – counter-example: LUT mapping erases the SOP/POS distinction entirely.
- [[Choosing a Logic Realization]] – compares: where this sits against every sibling realization.
- [[Boolean Algebra]] – depends-on: duality, De Morgan and the two distributive laws every step above cites.

## References

- [[0.1) Boolean Algebra]] — §Canonical forms (maxterms, $M_k=\overline{m_k}$, the canonical POS and its $z\cdot n$ cost, the $\prod M(\cdot)$ notation), §Distributive (OR over AND, and the SOP↔POS conversion it licenses), §Functional completeness (the dual of the NAND-NAND transform), §Karnaugh-map minimization (the running example $f=\sum m(0,1,2,5,6,7,8,9,10,14)$ and its minimal SOP, used here as the comparison baseline).
- No textbook source for this topic. Standard material: Mano & Ciletti, *Digital Design*, ch. 2–3 (maxterms, canonical POS, minimization by grouping zeros, OR-AND to NOR-NOR); Wakerly, *Digital Design: Principles and Practices*, ch. 4–5 (two-level POS realizations, PAL output polarity); Weste & Harris, *CMOS VLSI Design*, ch. 1 and 4 (series PMOS stacks, AOI/OAI compound gates). Page numbers are deliberately omitted — no copy was consulted for this note.
- The five prime implicates, the uniqueness of the three-term cover, and the equality of the POS and SOP covers were all computed from the 16-row truth table rather than taken on trust, and the cover was then simulated.
