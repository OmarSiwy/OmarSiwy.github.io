---
title: "Hazard-Free Two-Level Cover"
description: "Add the consensus term for every adjacent pair of ON-set cells: logically redundant area bought purely for a timing property, and the only hazard repair with a clean K-map criterion."
kind: circuit
source: "No book source — digital-design canon: Mano & Ciletti chs. 3-4; Wakerly ch. 4; Weste & Harris ch. 4"
status: seed
spade: simulated
tags: [digital, combinational-logic, hazards, consensus, k-map, fpga]
aliases:
  - Consensus Term
  - Hazard-Free Cover
  - Hazard-Free SOP
  - Hazard-Free Two-Level Logic
  - Redundant Prime Implicant
---

# Hazard-Free Two-Level Cover

A two-level SOP is free of static-1 hazards exactly when every pair of adjacent ON-set cells lies inside some **single** product term, and the terms you add to make that true are consensus terms — logically redundant by construction, which is the whole trade.

```tikz title="K-map of the 2:1 mux: the adjacency the minimal cover splits, and the consensus loop that closes it"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- K-map grid: rows S = 0,1 ; columns AB in Gray order 00 01 11 10 ----
  \foreach \c in {0,1,2,3} {
    \foreach \r in {0,1} {
      \draw[black!55] ({\c*1.4},{-\r*1.3}) rectangle ({\c*1.4+1.4},{-\r*1.3-1.3});
    }
  }

  % column headers
  \foreach \c/\lbl in {0/00, 1/01, 2/11, 3/10} {
    \node[anchor=south] at ({\c*1.4+0.7},0.08) {\lbl};
  }
  \node[anchor=south] at (2.8,0.62) {$AB$};
  \node[anchor=east] at (-0.12,-0.65) {$S=0$};
  \node[anchor=east] at (-0.12,-1.95) {$S=1$};

  % cell values of Y = !S.A + S.B
  \foreach \c/\v in {0/0, 1/0, 2/1, 3/1} {
    \node at ({\c*1.4+0.7},-0.65) {$\v$};
  }
  \foreach \c/\v in {0/0, 1/1, 2/1, 3/0} {
    \node at ({\c*1.4+0.7},-1.95) {$\v$};
  }

  % ---- the two products of the minimal cover ----
  \draw[rounded corners=8pt, line width=1pt] (2.9,-0.1) rectangle (5.5,-1.2);
  \draw[rounded corners=8pt, line width=1pt] (1.5,-1.4) rectangle (4.1,-2.5);

  % ---- the consensus term, logically redundant, added for timing only ----
  \draw[rounded corners=8pt, line width=1pt, dashed] (3.06,-0.26) rectangle (3.94,-2.34);

  % loop labels
  \node[anchor=west] at (5.62,-0.65) {$\bar S A$};
  \node[anchor=north] at (2.05,-2.62) {$SB$};
  \draw[dashed] (3.5,-2.34) -- (3.5,-2.9) -- (5.55,-2.9);
  \node[anchor=west, align=left] at (5.6,-2.9)
    {$AB$ \ (consensus)};

  \node[anchor=north west, align=left, font=\footnotesize] at (-1.15,-3.45)
    {The two cells in column $11$ differ in $S$ alone, and no \emph{single} product of the
     minimal cover\\ contains both --- so $\bar SA$ releases before $SB$ takes over and
     $Y$ dips. The dashed loop covers\\ that adjacency by itself, which is the criterion,
     and it is the consensus of the other two.};
  \node[anchor=north west, align=left, font=\footnotesize, text=black!60] at (-1.15,-4.6)
    {$S$, $A$, $B$, $Y$: 1 bit each. Cost of the repair: $+1$ AND2, OR widened
     $2\to3$ inputs, $+0$ levels.};
\end{circuitikz}
\end{document}
```

*All nets 1 bit. Values are $Y=\bar SA+SB$, the minimal cover of the 2:1 multiplexer. My own construction.*

**The criterion is about the cover, not about the function.** Two ON-set cells are *adjacent* when their input vectors differ in exactly one variable — they are neighbours on the Boolean cube, and the only single-input change that can move you between them. While that one variable is in flight, every product term whose literals it appears in is momentarily in an undefined state, because the variable and its complement both pass through the gate at different times. A product that does **not** mention the changing variable is immune: its literals are constant across the transition, so if it evaluates to $1$ at both endpoints it evaluates to $1$ throughout. That immunity is the entire mechanism, and it gives the criterion in one line:

> A two-level SOP is free of static-1 hazards **iff every pair of adjacent ON-set cells is covered by some single product term.**

Read the failure mode off the K-map above. The ON-cells $(S{=}0,A{=}1,B{=}1)$ and $(S{=}1,A{=}1,B{=}1)$ are adjacent in $S$, and the minimal cover $Y=\bar SA+SB$ gives them to *different* products. Both products mention $S$. Hold $A=B=1$ and toggle $S$: $\bar SA$ turns off as soon as $S$ rises and $SB$ turns on only after $S$ propagates, so if the select inverter is slow both are $0$ at once and $Y$ dips. The truth table never contained that $0$; see [[Logic Hazards]] for the full taxonomy of what such a dip is called.

**The repairing product is forced, not chosen — it is the consensus.** A product covering both endpoints of an $S$-adjacency must contain neither $S$ nor $\bar S$, and must be implied by the function. For the two products $\bar SA$ and $SB$ that is exactly the **consensus** with respect to $S$, obtained by deleting the opposed literal from each and ANDing the remainders: $\mathrm{consensus}_S(\bar SA,\,SB)=AB$. It is logically redundant by the consensus theorem of [[Boolean Algebra]],

$$XY + \bar X Z + YZ \;=\; XY + \bar X Z,$$

which itself follows from $YZ = YZ(X+\bar X)$ by complementation and $X+\bar X = 1$, then distributivity of AND over OR, then absorption of $XYZ$ into $XY$ and of $\bar XYZ$ into $\bar XZ$. Adding $AB$ therefore changes no row of the truth table and cannot change one, so the repaired mux is

$$Y \;=\; \bar S A + S B + \underbrace{AB}_{\text{consensus}},$$

and while $S$ is in flight the $AB$ product holds the output up because neither of its literals is moving. The redundancy is not a side effect to be apologised for: **you are paying area to buy a timing property**, and the term's uselessness to the truth table is precisely what makes it safe to add.

**Covering with every prime implicant is the sledgehammer that always works.** Generalising the mux: for any adjacent ON-pair differing in variable $x_j$, the cube spanned by the two cells is an implicant of $f$ that omits $x_j$, so it is contained in some prime implicant, which then covers both cells. Hence the sum of **all** prime implicants of $f$ is always static-1-hazard-free, with no analysis required. It is also usually far larger than the minimal cover, and the minimum-cost hazard-free cover sits between the two: run the ordinary covering problem, but with one required-cube constraint per ON-adjacency instead of one per minterm. On the 2:1 mux the three prime implicants $\bar SA$, $SB$, $AB$ *are* the hazard-free cover, so the sledgehammer and the minimum coincide — which is why this example is the one everyone teaches.

**Static-0 is the exact dual, and you get it for free by dualising the whole argument.** Work in POS, look at adjacency of **OFF**-set cells, and add the consensus *sum* term. For the same mux, $Y=(S+B)(\bar S+A)$ glitches high at $A=B=0$ because the two OFF-cells adjacent in $S$ are covered by different sums; appending $(A+B)$ fixes it. Nothing in the reasoning changes except that AND and OR, ON and OFF, product and sum trade places. Note the consequence: a two-level network can be made free of static-1 **or** static-0 hazards, and an SOP is structurally incapable of a static-0 hazard on a single-input change, so choosing SOP-with-consensus removes both.

> [!warning] Function hazards are a different animal and cannot be removed at all
> Everything above assumes **one** input changes. When two or more change "simultaneously" — and simultaneity does not exist in hardware — the circuit traverses some intermediate vertex of the Boolean cube, and if $f$ differs at that vertex the output *must* glitch. That is a **function hazard**: a property of $f$, not of the implementation. No factoring, no consensus term, no delay balancing removes it. The criterion in this note is about **logic** hazards only.
>
> For a multi-input change that is *free* of function hazards, the criterion generalises: cover each **required cube** — the transition cube from start vertex to end vertex — by a single product, and admit no product that intersects the OFF-set of that cube. That is the constraint set used by burst-mode [[Asynchronous Sequential Logic]] synthesis, and it is strictly stronger than the single-variable version here.

**Dynamic hazards are out of reach of this repair entirely.** They need three or more levels plus reconvergent fanout with unequal delays, and no amount of adding redundant terms to *one* level removes them, because the glitch is manufactured downstream of the level you are fixing. Your three options are to flatten to a hazard-free two-level form, balance the path delays, or accept the glitch — and flattening is the only one with a proof attached, which is the main reason two-level form still matters in an era where nothing else is built flat.

**Price the repair on a real block.** For a 4:1 multiplexer written flat as $Y=D_0\bar S_1\bar S_0 + D_1\bar S_1 S_0 + D_2 S_1\bar S_0 + D_3 S_1 S_0$, four pairs of products are adjacent under a single select change — $(00,01)$ and $(10,11)$ in $S_0$, $(00,10)$ and $(01,11)$ in $S_1$ — so four consensus terms are needed, and each retains the select literal the two products *agree* on:

$$D_0D_1\bar S_1,\quad D_2D_3S_1,\quad D_0D_2\bar S_0,\quad D_1D_3S_0.$$

Cost: $+4$ AND3 and the output OR widened from 4 to 8 inputs, taking design B from 18 gate inputs to 34 — an $89\%$ increase, not the $20\%$ one might guess from the 2:1 case, and the wider OR is a real delay penalty by [[Logical Effort]], since parasitic delay $p$ grows linearly with fan-in. A [[Multiplexer Tree]] pays far less: each MUX2 carries only the 2:1 hazard derived above, so the repair is the consensus $D_{2i}D_{2i+1}$ per mux — $3$ extra AND2 and three ORs widened $2\to3$, taking the tree from 20 gate inputs to 29, or $+45\%$. The tree is cheaper to make hazard-free for the same reason it is cheaper to build: nothing in it ever exceeds two inputs. For a $w$-bit datapath multiply all of it by $w$, since each bit lane is its own independent two-level function.

> [!warning] Correction to the long-form note
> The long-form Combinational Logic note gives the flat 4:1 repair as "4 extra consensus products $D_iD_j$" and "$+4$ AND2, $\approx 20\%$ area". Both are wrong. $D_0D_1$ is **not** an implicant of the 4:1 mux — take $D=(1,1,0,0)$ and $S_1S_0 = 10$: $D_0D_1 = 1$ but $Y = D_2 = 0$. The opposed literal is $S_0$, so only $S_0$ may be deleted and $\bar S_1$ must remain, giving the AND3 terms above. The area figure follows from the same slip; the true costs are $+89\%$ (flat) and $+45\%$ (tree) in gate inputs. The $D_{2i}D_{2i+1}$ AND2 form quoted there for the *tree* is correct, because inside a MUX2 there is no second select literal to keep.

> [!important] The optimiser will delete this term, and ATPG cannot test it.
> A redundant product is exactly what logic optimisation exists to remove, so a synthesiser strips consensus terms unless you fence them off (`keep` / `dont_touch` or equivalent). Worse, redundancy and stuck-at testability are the same property viewed from opposite ends: a fault on a redundant term produces no observable output difference on any input vector, so the consensus AND is **untestable by definition** and your stuck-at fault coverage can no longer reach $100\%$. Hazard-freedom and full testability are in genuine conflict; you choose, per net, which one the design needs.

**On an FPGA the criterion has nothing to attach to.** A function of $\le 6$ variables is one LUT, and a LUT is not a two-level network — it is a decoder driving a mux tree of configuration bits (see [[Lookup-Tables]]), whose internal skew you do not control and cannot add terms to. Adding the consensus product before synthesis just changes the truth table you programme, which is identical, so the repair is a no-op below the LUT boundary. LUT outputs glitch freely and the fabric's routing capacitance is large, so the FPGA answer to glitch energy is not a consensus term but a register, which the fabric gives you next to every LUT for free.

**Almost always, the right amount to pay is nothing.** Inside a synchronous pipeline the register samples after $t_{pd}$ and glitches are invisible to function; they are *not* invisible to power, where an ASIC datapath can burn $20$–$40\%$ of its switching energy on transients. Hazard-freedom becomes mandatory only when the signal feeds something **level-sensitive**: a clock, an asynchronous reset, a latch enable, a wired-OR bus, or the next-state logic of [[Asynchronous Sequential Logic]], where a single spurious pulse is a state transition and the machine is simply wrong afterwards.

$$\boxed{\ \text{SOP hazard-free} \iff \text{every adjacent ON-pair} \subseteq \text{some one product};\qquad XY+\bar XZ+YZ = XY+\bar XZ\ }$$

**When it breaks.**

- **More than one input changes.** The criterion says nothing. If the transition has a function hazard, no cover exists; if it does not, you need the required-cube constraints in the warning above, not this one.
- **More than two levels.** Consensus terms are a two-level construction. In a factored or multi-level network there is no "adjacent cells covered by one product" to check, and dynamic hazards appear that no added term removes.
- **The synthesiser is allowed to touch it.** Unfenced, the term is deleted in the first optimisation pass and the note's entire point is gone from the netlist while remaining in your source.
- **You needed full stuck-at coverage.** Redundant logic is untestable; a design signed off on fault coverage cannot carry consensus terms on tested nets.
- **The output feeds a register.** Then the repair buys nothing but area, leakage and one extra input of OR delay on the critical path. Behind a flop, the glitch is a power number and nothing more — and a register is cheaper than the consensus term on an FPGA.
- **Wide flat functions.** The repair is defined only on a two-level form, and two-level forms stop being buildable well before the function gets interesting: a $2^n\!:\!1$ mux needs an OR of $2^n$ inputs before you add a single consensus product.

> [!warning] Not covered in the source — needs outside research
> Exact minimum-cost hazard-free two-level minimisation for multi-input changes (the Nowick–Dill covering formulation used in burst-mode asynchronous synthesis), and the conditions under which a hazard-free cover fails to exist, are outside both the long-form note and the elementary canon cited below.

```spade
/// Minimal two-level cover of the 2:1 mux: correct for every input,
/// and carrying a static-1 hazard at a = b = 1.
fn mux2_minimal(s: bool, a: bool, b: bool) -> bool {
    (!s && a) || (s && b)
}

/// Hazard-free two-level cover: the same ON-set, plus the consensus of the
/// two products with respect to s. Redundant by XY + !XZ + YZ = XY + !XZ,
/// and present only so that one single product covers the adjacent ON-cells
/// (s,a,b) = (0,1,1) and (1,1,1).
fn mux2_hazard_free(s: bool, a: bool, b: bool) -> bool {
    let p0 = !s && a;
    let p1 = s && b;
    let pc = a && b;
    p0 || p1 || pc
}

/// bit 0 = minimal cover, bit 1 = hazard-free cover. They agree on every
/// input; that agreement is the redundancy claim, stated as hardware.
entity cover_pair(s: bool, a: bool, b: bool) -> uint<2> {
    [mux2_minimal(s, a, b), mux2_hazard_free(s, a, b)].as_uint()
}
```

`s`, `a`, `b` are the three K-map axes; `p0`, `p1`, `pc` are the three loops — solid, solid, dashed — and the final `||` is the 3-input OR the drawing widens. Every signal is 1 bit, `[bool; 2].as_uint()` packs element 0 into the LSB, and the whole thing is a `fn`, which is the type system refusing to let a hazard repair contain state. What synthesis does differently from the drawing is the point of the note: `pc` is redundant, so an unconstrained optimiser proves `p0 || p1 || pc == p0 || p1` and deletes the dashed loop, restoring the glitch. The RTL can express the term but cannot, by itself, make it survive — the guarantee lives in a synthesis attribute, not in the language.

**Related notes.**

- [[Logic Hazards]] – depends-on: defines the static-1 dip this cover exists to remove, and the dynamic and function hazards it cannot.
- [[Boolean Algebra]] – supports: supplies the consensus theorem and the absorption steps that make the added product provably free.
- [[Multiplexer Tree]] – compares: the same repair distributed one consensus AND2 per MUX2 instead of concentrated in one wide OR.
- [[One-Hot Multiplexer]] – counter-example: its select lines come from a decoder that is transiently *not* one-hot, so its glitch is upstream of the cover and no consensus term on the mux itself repairs it.
- [[Asynchronous Sequential Logic]] – extends: the one place hazard-freedom is mandatory rather than an energy optimisation, and where the criterion is generalised to multi-input transitions.
- [[Logical Effort]] – supports: prices the widened OR, which is where the repair's delay cost actually appears.
- [[Choosing a Combinational Block]] – compares: places "provably hazard-free" among the axes on which a flat form is ever chosen over a tree.

## References

Established digital-design canon; this note has no assigned book source.

- Static-1 and static-0 hazards, K-map adjacency, the consensus term and the all-prime-implicants construction — Wakerly, *Digital Design: Principles and Practices*, ch. 4; Mano & Ciletti, *Digital Design*, chs. 3-4.
- Consensus theorem, absorption and the redundancy proof — Mano & Ciletti, ch. 2; also [[Boolean Algebra]].
- Fan-in cost of the widened OR — Weste & Harris, *CMOS VLSI Design*, ch. 4.
- The 2:1 and 4:1 mux worked repairs and the glitch-power range — sections "Glitches and hazards", "Worked example: a 4:1 multiplexer, two ways" and "Trade-offs" of the long-form Combinational Logic note. Its flat-4:1 consensus terms and area figure are corrected in the callout above.
