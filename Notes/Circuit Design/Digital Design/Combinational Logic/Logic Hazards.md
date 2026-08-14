---
title: Logic Hazards
description: "Static-1, static-0 and dynamic glitches on a single input change: artefacts of the netlist, not the function, and the reason a correct truth table can still burn 20-40% of its energy on transients."
kind: concept
source: "No book source — digital-design canon: Mano & Ciletti ch. 9; Wakerly ch. 4; Weste & Harris chs. 4, 9"
status: seed
spade: simulated
tags: [digital, combinational-logic, hazards, glitches, consensus, low-power]
aliases:
  - Hazards and Glitches
  - Logic Hazard
  - Static-1 Hazard
  - Static-0 Hazard
  - Dynamic Hazard
  - Function Hazard
  - Glitches
  - Consensus Term
---

# Logic Hazards

A logic hazard is a transient output value that the truth table does not contain, produced by a **single** input change; what separates it from every other timing defect is that it lives in the chosen gate netlist rather than in the function, and can therefore be removed by changing the cover without changing what the circuit computes.

```tikz title="Static-1 hazard in the 2:1 mux, and the consensus term that removes it"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \ctikzset{logic ports=ieee, logic ports origin=center}

  % ---------------- gate network ----------------
  \node[not port] (inv) at (2.4,4.3) {};
  \node[and port] (p1)  at (5.0,3.7) {};
  \node[and port] (p2)  at (5.0,2.1) {};
  \node[and port] (p3) at (5.0,0.5) {};
  \node[or port, number inputs=3] (y) at (8.0,2.1) {};

  % inputs: topmost drops rightmost, so the entry rails do not cross
  \draw (-0.4,5.6) node[anchor=east] {$S$} -- (1.1,5.6);
  \draw (-0.4,5.2) node[anchor=east] {$A$} -- (0.7,5.2);
  \draw (-0.4,4.8) node[anchor=east] {$B$} -- (0.3,4.8);

  \draw (1.1,5.6) |- (p2.in 2);
  \draw (1.1,4.3) -- (inv.in);          \fill (1.1,4.3) circle (1.6pt);
  \draw (inv.out) -- (3.2,4.3) |- (p1.in 1);

  \draw (0.7,5.2) |- (p1.in 2);
  \draw[dashed] (0.7,3.55) -- (0.7,0.65) -- (p3.in 1);
  \fill (0.7,3.55) circle (1.6pt);

  \draw (0.3,4.8) |- (p2.in 1);
  \draw[dashed] (0.3,2.25) -- (0.3,0.35) -- (p3.in 2);
  \fill (0.3,2.25) circle (1.6pt);

  \draw (p1.out) -- (6.6,3.7) |- (y.in 1);
  \draw (p2.out) -- (y.in 2);
  \draw[dashed] (p3.out) -- (6.6,0.5) |- (y.in 3);
  \draw (y.out) -- (9.4,2.1) node[anchor=west] {$Y$};

  \node[anchor=south] at (6.0,3.75) {$\bar S A$};
  \node[anchor=south] at (6.0,2.15) {$SB$};
  \node[anchor=south] at (6.0,0.55) {$AB$};
  \node[anchor=north, align=center, text=black!60] at (5.0,-0.25)
    {dashed: the consensus term, logically redundant,\\ added only to close the gap below};

  % ---------------- waveform ----------------
  \begin{scope}[yshift=-2.5cm]
    \draw[black!35] (2.0,0.1) -- (2.0,-4.9);
    \fill[black!12] (2.75,-3.55) rectangle (3.35,-3.1);

    \draw[thick] (0,-0.05) -- (2.0,-0.05) -- (2.1,-0.5) -- (5.6,-0.5);
    \draw[thick] (0,-1.5) -- (2.9,-1.5) -- (3.0,-1.05) -- (5.6,-1.05);
    \draw[thick] (0,-2.05) -- (2.4,-2.05) -- (2.5,-2.5) -- (5.6,-2.5);
    \draw[thick] (0,-3.1) -- (2.7,-3.1) -- (2.8,-3.55) -- (3.3,-3.55) -- (3.4,-3.1) -- (5.6,-3.1);
    \draw[thick] (0,-4.15) -- (5.6,-4.15);

    \node[anchor=east] at (-0.15,-0.28) {$S$};
    \node[anchor=east] at (-0.15,-1.28) {$\bar S A$};
    \node[anchor=east] at (-0.15,-2.28) {$SB$};
    \node[anchor=east] at (-0.15,-3.33) {$Y$ (no $AB$)};
    \node[anchor=east] at (-0.15,-4.38) {$Y$ (with $AB$)};
    \node[anchor=south, text=black!60] at (3.05,-3.02) {static-1 glitch};
    \node[anchor=south, text=black!60] at (3.05,-4.07) {held up by $AB$};
    \node[anchor=south] at (2.0,0.15) {$S:1\to0$, with $A=B=1$};
  \end{scope}
\end{circuitikz}
\end{document}
```

*All nets 1 bit. Drawn on the $S{:}1\to0$ edge, the one where the surviving product has to wait for the inverter; the rising edge is the mirror image. My own construction.*

**Separate the waveform from the value the contract actually promises.** A combinational block promises that after $t_{pd}$ from the last input change the output equals $f$ of the present inputs. It promises nothing whatsoever about the interval in between, and every hazard is an exploitation of that silence. Three shapes exist, all defined for one input bit changing while the rest are held:

| Hazard | Output should | Output actually does | Where it lives |
| --- | --- | --- | --- |
| Static-1 | stay $1$ | $1\to0\to1$ | two-level SOP (AND-OR) |
| Static-0 | stay $0$ | $0\to1\to0$ | two-level POS (OR-AND) |
| Dynamic | go $0\to1$ (or $1\to0$) once | $0\to1\to0\to1$ | $\ge3$ levels with reconvergent fanout |

**Diagnose the static-1 hazard as a covering failure, not as a delay problem.** Take the 2:1 multiplexer, $Y = \bar S A + S B$, with $A$, $B$, $S$ and $Y$ each 1 bit. Hold $A = B = 1$ and toggle $S$; the truth table says $Y = 1$ throughout. The netlist says otherwise: the $\bar S A$ product turns off the moment $S$ rises, while $S B$ turns on only after $S$ has propagated, so if the inverter on $S$ is slow both products are momentarily $0$ and $Y$ dips. On the Karnaugh map the two ON-cells $(S{=}0, A{=}1, B{=}1)$ and $(S{=}1, A{=}1, B{=}1)$ are **adjacent** — they differ in exactly the bit that is changing — yet they are covered by **different** product terms, so the input vector must leave one implicant before it enters the other. That is the whole diagnosis, and it generalises without reference to any delay value:

> A two-level SOP is free of static-1 hazards **iff every pair of adjacent ON-set cells is covered by some single product term.**

**Close the gap with the consensus term, and name the law that makes it free.** The missing cover for a pair of adjacent cells straddling $S$ is precisely the **consensus** of the two products with respect to $S$. By the consensus theorem of [[Boolean Algebra]], $XY + \bar X Z = XY + \bar X Z + YZ$, that term is logically redundant — it can be added without changing $f$ — so

$$Y = \bar S A + S B + \underbrace{AB}_{\text{consensus}}$$

computes the same function on all $8$ input vectors while holding the output up for the entire time $S$ is in flight. The redundancy is not a wart to be tolerated, it is the mechanism: **you are paying area to buy a timing property.** It is also why the term does not survive by default — a logic optimiser is entitled to apply the same theorem in the shrinking direction and delete it, so a hazard-free cover has to be marked as protected in the flow. [[Hazard-Free Two-Level Cover]] carries the systematic construction.

**Static-0 is the exact dual, obtained by dualising every word in the sentence.** Work in POS instead of SOP, look at adjacency in the **OFF**-set rather than the ON-set, and add the consensus **sum** rather than the consensus product — by De Morgan duality the argument transposes term for term. For the same multiplexer, $Y = (S + B)(\bar S + A)$ glitches *high* at $A = B = 0$, and appending the factor $(A + B)$ removes it. Note what this does and does not buy: a two-level network can be made free of static hazards of one polarity by covering, and freedom from both at once requires a network that is simultaneously a hazard-free SOP and a hazard-free POS, which is why hazard-free logic is normally specified against one polarity at a time.

**Dynamic hazards are not a covering problem, and consensus does nothing for them.** They require three or more levels plus **reconvergent fanout** with unequal path delays: the changing input reaches the reconvergence point along paths of different length, so the output can settle, unsettle and settle again. There is no redundant term to add, because the extra transitions are produced by the depth structure rather than by a gap between implicants. The three available responses are to flatten to a two-level form and apply the covering rule, to balance the reconverging path delays, or to accept the glitch — and inside a clocked design the third is almost always right.

> [!warning] Function hazards are a different animal and cannot be removed at all
> Everything above assumes **one** input changes. When two or more change "simultaneously" — and simultaneity does not exist in hardware — the circuit traverses some intermediate vertex of the Boolean cube, and if $f$ differs at that vertex, the output *must* glitch. That is a **function hazard**: a property of $f$, not of the implementation. No factoring, no consensus term, no delay balancing removes it. The three hazards in the table are **logic hazards**, artefacts of the gate netlist, and those are the removable ones. Under a genuine multi-bit input change the only remedies are to re-encode so that consecutive values differ in one bit — the entire reason Gray codes exist — or to register the output.

**Ignore all of it inside a pipeline, except for the power bill.** A register samples after $t_{pd}$, so glitches are invisible to function in any properly timed synchronous block, which is why hazard analysis has all but disappeared from RTL practice. It has not disappeared from the energy budget. Every spurious transition charges and discharges a real load capacitance, and in a deep unbalanced structure such as a ripple-carry chain the same node can toggle several times per input vector: an ASIC adder can spend 20-40% of its switching energy on glitches. The lever there is path balancing and logic-depth reduction, not consensus terms — adding redundant gates to fix a glitch you were going to register anyway makes the power worse, not better.

**Hazard-freedom becomes mandatory the instant the signal feeds something level-sensitive.** A glitch on a clock is an extra clock edge. A glitch on an asynchronous reset resets. A glitch on a latch enable captures the wrong value. A glitch in the next-state logic of an [[Asynchronous Sequential Logic|asynchronous]] machine *is* a state transition, which is why that entire discipline is built on single-input-change assumptions and hazard-free covers rather than on setup and hold inequalities. The case a synchronous designer actually meets is clock gating: the enable must be glitch-free with respect to the clock, and that is why a gating cell is built as an integrated latch-plus-AND that samples the enable in the inactive phase, rather than as a bare AND of enable and clock.

**On an FPGA the classical repair is unavailable, because you do not own the cover.** A [[Lookup-Tables|LUT]] stores the truth table, not a sum of products; its internal $2^k{:}1$ multiplexer tree is steered by the input bits, so a single input change switches a whole level of that tree and the LUT output can still glitch on skew inside the cell. You cannot add a consensus term to a LUT — there is nowhere to put it, and the mapper absorbs any redundant term you write back into the same truth table. What the architecture does offer is depth: fewer cascaded LUTs means fewer levels for a transient to ripple through, the hard carry chain replaces a LUT cascade wherever the operation allows, and anything that must not glitch gets registered. The ASIC-side technique — write the redundant cover, then protect it from the optimiser — has no FPGA analogue.

$$\boxed{\;XY + \bar X Z \;=\; XY + \bar X Z + \underbrace{YZ}_{\text{consensus}}\;;\qquad \text{SOP static-1 hazard-free} \iff \text{every adjacent ON-cell pair shares one product}\;}$$

**When it breaks.**

- **More than one input changes.** The covering criterion is stated for a single-input change and says nothing otherwise; a function hazard is unremovable, see the callout.
- **Three or more levels.** The consensus repair applies to two-level forms only. Add depth and reconvergent fanout and you get dynamic hazards that no redundant term touches.
- **The optimiser runs after you.** Redundant terms are exactly what logic minimisation exists to delete. Without a protection attribute, the hazard-free cover is a hazard-carrying cover by the time it reaches layout.
- **Static timing analysis will not see it.** STA reports arrival at $t_{pd}$; the glitch happens strictly before that and is invisible to the tool. Only a delay-annotated gate-level simulation or a power-analysis run shows it.
- **RTL simulation will not see it either.** A zero-delay functional simulation evaluates the new value in one step, so the hazardous and hazard-free covers are literally indistinguishable — which is the exact limit of the block below.
- **The output is registered.** Then the analysis is moot for correctness and only glitch power remains, which is the common case and the reason this is a niche topic rather than a daily one.

```spade
/// Two-level SOP of a 2:1 multiplexer: Y = ~S&A | S&B.
/// Functionally correct, and carries a static-1 hazard at A = B = 1.
fn mux2_sop(s: bool, a: bool, b: bool) -> bool {
    (!s && a) || (s && b)
}

/// The same function with the consensus term A&B appended.
/// Logically redundant by the consensus theorem, hazard-free on a single-input change.
fn mux2_consensus(s: bool, a: bool, b: bool) -> bool {
    (!s && a) || (s && b) || (a && b)
}

/// Both covers side by side: bit 1 = plain SOP, bit 0 = consensus-augmented.
/// The two bits must agree for every input, which is the whole redundancy claim.
entity mux2_covers(s: bool, a: bool, b: bool) -> uint<2> {
    mux2_sop(s, a, b).as_uint().concat(mux2_consensus(s, a, b).as_uint())
}
```

`s`, `a` and `b` are the three input rails at the left of the drawing and each `fn` returns the single-bit $Y$ at the right; `mux2_sop` is the solid netlist, `mux2_consensus` is the same network with the dashed AND gate and its third OR input included. Every net is 1 bit and the whole block is combinational — a `fn` cannot contain a `reg`, so the type system enforces that a hazard analysis has no state to hide in. `concat` on integers puts its left operand in the **high** position, so `output__[1]` is the hazardous cover and `output__[0]` the hazard-free one; the wrapper exists only so that one testbench can compare them. What synthesis does differently from the drawing is the point of the note: the tool sees two Boolean expressions that are equal, is free to apply the consensus theorem in either direction, and will normally emit the *same* netlist for both — the difference the diagram shows is not expressible in RTL and must be forced with a synthesis attribute or by instantiating the gates structurally.

> [!important] Simulating this block proves the consensus term is free and proves nothing at all about the glitch. Exhaustive coverage of the 8 input vectors plus 3000 random ones confirms that both covers implement $s\,?\,b:a$ — the redundancy claim, and the only part that is a statement about *values*. A zero-delay simulator evaluates each vector in one step and can never show a transient, because the hazard is a statement about *delays between gates*. The tools that see it are delay-annotated gate-level simulation and the waveform above.

## Related Notes

- [[Hazard-Free Two-Level Cover]] – extends: turns the "cover every adjacent ON-cell pair" criterion here into the systematic prime-implicant construction.
- [[Boolean Algebra]] – depends-on: supplies the consensus theorem and the De Morgan duality that the SOP repair and its POS dual both rest on.
- [[Asynchronous Sequential Logic]] – depends-on: the design style in which these glitches are functional errors rather than power, and therefore the reason the theory was developed at all.
- [[Multiplexer Tree]] – counter-example: the same 2:1 cell cascaded, where depth and reconvergent fanout replace the two-level covering problem with dynamic hazards no consensus term can fix.
- [[Logical Effort]] – supports: prices the unequal path delays that decide whether a hazard window opens at all, and the depth reduction that shrinks glitch power.
- [[Binary Decoder]] – compares: a two-level AND array with no consensus terms, whose one-hot invariant is a steady-state claim that its own transients violate.
- [[Combinational Logic]] – compares: the contract about final values, whose silence about the interval before $t_{pd}$ is what makes every hazard on this page legal.

## References

Established digital-design canon; this note has no assigned book source.

- Static-1, static-0 and dynamic hazards, the adjacency covering criterion and the consensus repair — Mano & Ciletti, *Digital Design*, ch. 9 (hazards in asynchronous circuits); Wakerly, *Digital Design: Principles and Practices*, ch. 4 (timing hazards).
- Glitch power, path balancing and integrated clock-gating cells — Weste & Harris, *CMOS VLSI Design*, chs. 4 and 9.
- The hazard table, the mux worked example, the consensus derivation, the function-hazard distinction and the 20-40% glitch-energy figure — "Glitches and hazards" in [[0.2) Combinational Logic]].
