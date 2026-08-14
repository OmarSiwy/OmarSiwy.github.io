---
title: "NAND-NAND Network"
description: "Every AND and the OR of a two-level SOP replaced by NAND at identical gate count and depth, deleting one inverter per gate on a static CMOS target."
kind: circuit
status: seed
spade: simulated
tags: [digital, boolean-algebra]
aliases:
  - "NAND-NAND"
  - "NAND-NAND Networks"
  - "NAND-NAND Transform"
  - "NAND-Only Logic"
  - "Bubble Pushing"
  - "Sheffer Stroke"
---

# NAND-NAND Network

A NAND-NAND network is a [[Two-Level SOP Network]] with every AND and the final OR replaced by a NAND, which leaves the function, the gate count, the literal count and the depth all unchanged while removing an inverter from every gate on a static CMOS target.

```tikz title="Bubble pushing: an AND-OR-INVERT network and the NAND-NAND network it equals"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \ctikzset{logic ports=ieee, logic ports origin=center}
  % ============ left: AND-OR-INVERT, with a bubble pair inserted on each product wire
  \node[not port] (I0) at (-2.2,-2.6) {};
  \node[and port] (A1) at (0,1.3) {};
  \node[and port] (A2) at (0,-1.3) {};
  \node[or port]  (O1) at (3.4,0) {};
  \draw (A1.in 1) -- ++(-1.3,0) node[anchor=east] {$s$};
  \draw (A1.in 2) -- ++(-1.3,0) node[anchor=east] {$a$};
  \draw (A2.in 2) -- ++(-1.3,0) node[anchor=east] {$b$};
  \draw (I0.in) -- ++(-0.8,0) node[anchor=east] {$s$};
  \draw (I0.out) -- ++(0.7,0) node[midway,anchor=north,inner sep=1pt] {$\bar{s}$} |- (A2.in 1);
  \draw (A1.out) -- ++(1.2,0) |- (O1.in 1);
  \draw (A2.out) -- ++(1.2,0) |- (O1.in 2);
  \draw[red!75!black, fill=white] ([xshift=0.40cm]A1.out) circle (0.11);
  \draw[red!75!black, fill=white] ([xshift=0.72cm]A1.out) circle (0.11);
  \draw[red!75!black, fill=white] ([xshift=0.40cm]A2.out) circle (0.11);
  \draw[red!75!black, fill=white] ([xshift=0.72cm]A2.out) circle (0.11);
  \draw (O1.out) -- ++(0.8,0) node[anchor=south] {$f$};
  \node[font=\footnotesize, align=center] at (1.0,-3.9)
    {AND--OR--INVERT, $4$ gates, $D=3$\\ insert $\overline{\overline{c_k}}$ on each product wire (red)};
  % ============ transform arrow
  \draw[->, thick] (5.9,0.0) -- (7.6,0.0);
  \node[font=\footnotesize, anchor=south] at (6.75,0.1) {De Morgan};
  % ============ right: NAND-NAND
  \begin{scope}[xshift=9.6cm]
    \node[nand port] (J0) at (-2.2,-2.6) {};
    \node[nand port] (B1) at (0,1.3) {};
    \node[nand port] (B2) at (0,-1.3) {};
    \node[nand port] (N1) at (3.4,0) {};
    \draw (B1.in 1) -- ++(-1.3,0) node[anchor=east] {$s$};
    \draw (B1.in 2) -- ++(-1.3,0) node[anchor=east] {$a$};
    \draw (B2.in 2) -- ++(-1.3,0) node[anchor=east] {$b$};
    \draw (J0.in 1) -- ++(-0.45,0) coordinate (t1);
    \draw (J0.in 2) -- ++(-0.45,0) coordinate (t2);
    \draw (t1) -- (t2);
    \node[circ] at ($(t1)!0.5!(t2)$) {};
    \draw ($(t1)!0.5!(t2)$) -- ++(-0.75,0) node[anchor=east] {$s$};
    \draw (J0.out) -- ++(0.7,0) node[midway,anchor=north,inner sep=1pt] {$\bar{s}$} |- (B2.in 1);
    \draw (B1.out) -- ++(1.2,0) |- (N1.in 1);
    \draw (B2.out) -- ++(1.2,0) |- (N1.in 2);
    \draw (N1.out) -- ++(0.8,0) node[anchor=south] {$f$};
    \node[font=\footnotesize, align=center] at (1.0,-3.9)
      {NAND--NAND, $4$ gates, $D=3$\\ AND${}+{}$bubble is a NAND; OR with both inputs\\
       inverted is a NAND; NOT is a NAND with tied inputs};
  \end{scope}
  \node[font=\footnotesize] at (6.6,-5.2) {$f=s\,a+\bar{s}\,b$, a 2-to-1 multiplexer; every wire drawn is $1$ bit wide.};
\end{circuitikz}
\end{document}
```

**Double-negate the OR and De Morgan does the rest.** Write the SOP as a sum of products $f=\sum_k c_k$, where each $c_k$ is a product of literals. Apply **involution** ($\bar{\bar{x}}=x$) to the whole expression, then **De Morgan** to the inner complement:

$$f=\sum_k c_k=\overline{\overline{\textstyle\sum_k c_k}}=\overline{\textstyle\prod_k \overline{c_k}}$$

Each $\overline{c_k}$ is an AND of literals followed by a complement, which *is* a NAND. The outer $\overline{\prod_k(\cdot)}$ is an AND of those followed by a complement, which is also a NAND. In Sheffer-stroke notation the whole network is $f=\overline{c_1}\uparrow\overline{c_2}\uparrow\cdots$, one operator throughout. No term moved, no literal appeared or vanished: the transform is a relabelling of the gate symbols, so gate count, fan-in per gate, literal count and logic depth are bit-for-bit those of the SOP you started from. Every signal in the network is $1$ bit wide, at every level.

**Graphically it is bubble pushing, and the bookkeeping is involution.** Insert a *pair* of inversion bubbles on each product wire (red in the diagram). Involution says the function is untouched. Absorb the left bubble of each pair into its AND gate, turning it into a NAND. Absorb the right bubbles into the OR gate: an OR whose inputs are all complemented is, by De Morgan, exactly a NAND. Bubbles are conserved in pairs, which is the only invariant you have to track — an odd number of bubbles pushed across a node is a bug, not a style choice.

**A complemented literal costs no extra gate either.** The AND-OR form already needed an inverter to produce $\bar{s}$. In NAND-only that inverter becomes a NAND with its inputs tied: by **idempotence** $s\cdot s=s$, so $\overline{s\cdot s}=\bar{s}$. This is the first of the three identities that make $\{\text{NAND}\}$ **functionally complete** on its own — the whole reason the transform terminates:

$$\text{NOT}\;a=a\uparrow a,\qquad \text{AND}\;ab=(a\uparrow b)\uparrow(a\uparrow b),\qquad \text{OR}\;a+b=(a\uparrow a)\uparrow(b\uparrow b)$$

The last is De Morgan again, $a+b=\overline{\bar a\bar b}$. $\{\text{NOR}\}$ is complete by the dual argument, and those two are the only single-operator complete sets among the sixteen binary Boolean functions.

**The payoff is physical, not algebraic: static CMOS has no non-inverting primitive.** A CMOS gate's pull-down network conducts when the function is *true* and pulls the output *low*, so every complex gate is inherently inverting — see [[CMOS Logic Gates]]. An AND gate is not a primitive at all; it is a NAND followed by an inverter, and an OR is a NOR followed by an inverter. Building the AND-OR drawing literally therefore instantiates three inverters that the NAND-NAND drawing does not. Designing directly in NAND deletes one inverter per gate, and the inverters were pure area and delay: they compute nothing.

**Prefer NAND over NOR for the same reason at the transistor level.** The dual transform on a [[Two-Level POS Network]] gives a [[NOR-NOR Network]], which is equally correct and equally free in algebra. It is slower in CMOS: a $p$-input NAND puts $p$ NMOS devices in series and $p$ PMOS in parallel, while a $p$-input NOR does the reverse. PMOS is the weaker device, so series-stacking it is the expensive choice. Both series stacks also degrade superlinearly with $p$ — which is why "same depth" is only honest under a **bounded fan-in**; under a limit of $k$ inputs per gate a $p$-product SOP over $n$ variables costs $D=\lceil\log_k p\rceil+\lceil\log_k n\rceil$ levels, and the two-level claim quietly becomes logarithmic for both forms alike.

**Uniformity is worth as much as the inverter.** A NAND-only netlist draws from one cell type at a few fan-ins. That is one set of characterisation curves, one drive-strength ladder to size against, and one gate whose layout is worth hand-tuning — the same argument that makes foundries ship several tuned versions of one cell rather than one version of several. Verification also gets easier: a single-primitive netlist has no gate-polarity conventions left to get wrong.

> [!important] "Free" describes the transform, not NAND-only design in general
> The cost identity holds because you started from a two-level AND-OR network and rewrote it in place. It says nothing about building an *arbitrary* function out of NANDs. Rebuild a $4$-input parity tree in NAND-only and it goes from $6$ literals / $3$ gates / depth $2$ (as an XOR tree) to $24$ literals / $12$ NAND2 / depth $6$ — a $4\times$ area penalty and a $3\times$ depth penalty, because a $2$-input XOR needs four NAND2s at depth $3$. Real cell libraries ship XOR and XNOR as pass-transistor cells for exactly this reason, so "always use NAND on CMOS" is a claim about the AND/OR/NOT subset, not about the library.

**On an FPGA the transform is invisible.** A $k$-input lookup table implements *any* function of $\le k$ variables at a cost of one LUT and a depth of one, so gate count and literal count are not costs it can see — the AND-OR form and the NAND-NAND form of the same $\le k$-support cone map to the identical single LUT. The FPGA problem is decomposition to $\le k$ support, not gate-symbol choice; see [[FPGAs]]. Run the transform on an ASIC standard-cell target, where literals really do buy transistors, and skip it everywhere else.

$$\boxed{\ f=\sum_k c_k=\overline{\textstyle\prod_k \overline{c_k}}\ \Longrightarrow\ \text{gates, literals and depth all unchanged; } \#\text{inverters} \downarrow \text{ by one per gate}\ }$$

**When it breaks.**

- **XOR-heavy functions.** Parity, comparators and adder sum bits are XOR-dominated, and XOR has no cheap NAND decomposition. Take the XOR cell from the library and stop.
- **Wide fan-in.** The "same depth" claim assumes the fan-in the SOP asked for is buildable. A $64$-input NAND is $64$ series NMOS; the real circuit is a tree of bounded-fan-in NANDs at $\lceil\log_k p\rceil$ levels, and the depth accounting above applies.
- **More than two levels.** In a [[Multi-Level Factored Network]] bubble pushing still works, but the bubbles no longer cancel automatically at every node — you must check the inversion parity along each path and insert an inverter where it comes out odd. The transform stops being free at the first node where it does.
- **The POS side.** A function whose minimal form is a product of sums maps to [[NOR-NOR Network|NOR-NOR]], not NAND-NAND; converting to SOP first to reach NAND may cost more product terms than the NOR penalty does.
- **On an FPGA.** No effect whatsoever; the effort is wasted.
- **It does not fix hazards.** The transform preserves the cover term-for-term, so a [[Static Hazards|static hazard]] present in the SOP is present in the NAND-NAND network and vice versa. Hazard-freedom is a property of the *cover*, decided before this step.

**RTL (Spade).** Two networks built from one primitive, checked against behavioural references.

```spade
/// The only primitive in the network.
fn nand2(a: bool, b: bool) -> bool { !(a && b) }
fn nand3(a: bool, b: bool, c: bool) -> bool { !(a && b && c) }

/// f = s*a + !s*b, a 2-to-1 mux, as NAND-NAND.
/// Tying a NAND's inputs gives the inverter for the complemented literal.
fn mux_nn(s: bool, a: bool, b: bool) -> bool {
    let sbar = nand2(s, s);
    nand2(nand2(s, a), nand2(sbar, b))
}

/// c_out = ab + ac + bc as NAND-NAND: 3 x NAND2 feeding one NAND3.
fn maj_nn(a: bool, b: bool, c: bool) -> bool {
    nand3(nand2(a, b), nand2(a, c), nand2(b, c))
}
```

`mux_nn` is the drawing, gate for gate: `sbar` is the tied-input NAND at the bottom left, the two inner `nand2` calls are the product gates, and the outer one is the OR that De Morgan turned into a NAND. `maj_nn` is the carry of a full adder, $c_\text{out}=ab+ac+bc$, and shows that the product gates and the sum gate need not share a fan-in — three NAND2 into one NAND3, matching the $6$ literals / $4$ gates / depth $2$ of its SOP exactly. Every signal is `bool`, i.e. $1$ bit; there is no width arithmetic here and nothing is clocked — `fn` means purely combinational. Synthesis will not preserve any of it: both bodies are inside one logic cone, so an ASIC mapper re-covers them with whatever library cells hit timing (very likely an AOI21 for `mux_nn`, a single complex gate, better than either drawing), and an FPGA mapper collapses each to one LUT.

**Related notes.**

- [[Two-Level SOP Network]] – depends-on: the network this transform consumes; its cost is the cost quoted here.
- [[CMOS Logic Gates]] – depends-on: why the inverter deletion is real and why NAND beats NOR.
- [[NOR-NOR Network]] – compares: the exact dual, applied to POS, correct and free in algebra but slower in silicon.
- [[Two-Level POS Network]] – compares: the starting point that maps to NOR-NOR instead.
- [[Shannon Expansion Multiplexer]] – extends: the $f=sa+\bar sb$ used above is one Shannon cofactor step, and the same four NANDs implement it.
- [[Multi-Level Factored Network]] – counter-example: bubble pushing survives past two levels, but inversion parity no longer cancels for free.
- [[Karnaugh Map]] – supports: fixes the product terms first; this step only relabels the gates that realise them.
- [[Choosing a Logic Realization]] – compares: where NAND-only sits against factored, MUX-based and LUT-based realisations.

## References

No textbook source for this note — it is outside *Application-Specific Arithmetic*. The material is standard canon and is cross-checked against the long-form note `0.1) Boolean Algebra` (sections *Functional completeness* and *Trade-offs*), whose cost table supplies the $c_\text{out}$ and $4$-input parity figures quoted above.

- Mano & Ciletti, *Digital Design* — NAND and NOR implementation, two-level transformations, universal gates.
- Wakerly, *Digital Design: Principles and Practices* — bubble-pushing notation and inversion-parity bookkeeping.
- Weste & Harris, *CMOS VLSI Design* — inherent inversion of static CMOS gates, NAND-versus-NOR stack asymmetry, complex-gate (AOI/OAI) mapping.
