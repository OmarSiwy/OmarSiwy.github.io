---
title: "Minimum Full-Adder Constant Multiplier"
description: "Picks among equal-adder-count graphs the one whose shifts and negative intermediates leave the most LSBs as bare wires — 16 FA cells instead of 25 for 49X."
kind: circuit
source: "ASA §12.1.6, pp. 381-382"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, adder-graph, bit-level-cost]
aliases:
  - Minimum Full Adder Constant Multiplier
  - Minimum-FA Constant Multiplier
  - Minimum Full-Adder SCM
  - Bit-Level Cost Adder Graph
---

# Minimum Full-Adder Constant Multiplier

A shift-and-add constant multiplier chosen by counting full-adder cells rather than adder nodes, so that among the many graphs achieving the minimal adder count the one whose shifts and negations leave the most low-order bits as bare wire is selected.

```tikz title="Bit-level cost of the minimum-full-adder graph for 49X with an 8-bit input"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\tikzset{cell/.style={draw,minimum width=0.46cm,minimum height=0.40cm,inner sep=0pt,font=\tiny}}
\tikzset{wcell/.style={draw,densely dashed,minimum width=0.46cm,minimum height=0.40cm,inner sep=0pt,font=\tiny}}
% ---------------- adder graph ----------------
\node[draw,minimum width=2.2cm,minimum height=0.6cm,font=\small] (na) at (-5.6,2.7) {$X-2^{4}X$};
\node[draw,minimum width=2.4cm,minimum height=0.6cm,font=\small] (nb) at (-1.9,2.7) {$-15X+2^{6}X$};
\draw[->] (-7.6,2.7) node[left,font=\small]{$X$, 8\,b} -- (na);
\draw[->] (na) -- node[above,font=\tiny]{$-15X$, 13\,b} (nb);
\draw[->] (nb) -- (-0.2,2.7) node[right,font=\small]{$49X$, 14\,b};
% ---------------- bit ruler ----------------
\foreach \i in {0,...,13} \node[font=\tiny] at ({-0.56*\i},1.6) {\i};
\node[anchor=west,font=\tiny] at (0.35,1.6) {bit position};
% ---------------- node A row ----------------
\foreach \i in {0,...,3}  \node[wcell] at ({-0.56*\i},0.9) {};
\foreach \i in {4,...,7}  \node[cell]  at ({-0.56*\i},0.9) {F};
\foreach \i in {8,...,11} \node[cell]  at ({-0.56*\i},0.9) {H};
\node[anchor=west,font=\tiny] at (0.35,0.9) {$X-2^{4}X$: 4F$+$4H $=8$};
\node[anchor=east,font=\tiny] at ({-0.56*12-0.28},0.9) {sign};
% ---------------- node B row ----------------
\foreach \i in {0,...,5}  \node[wcell] at ({-0.56*\i},-0.2) {};
\node[cell] at ({-0.56*6},-0.2) {H};
\foreach \i in {7,...,12} \node[cell]  at ({-0.56*\i},-0.2) {F};
\node[cell] at ({-0.56*13},-0.2) {H};
\node[anchor=west,font=\tiny] at (0.35,-0.2) {$-15X+2^{6}X$: 6F$+$2H $=8$};
% ---------------- annotations ----------------
\draw[<->,>=latex] (0.20,0.45) -- ({-0.56*3-0.20},0.45)
   node[midway,below,font=\tiny] {4 bare wires};
\draw[<->,>=latex] (0.20,-0.65) -- ({-0.56*5-0.20},-0.65)
   node[midway,below,font=\tiny] {6 bare wires};
\node[font=\tiny,anchor=west] at (-8.0,-1.25)
  {dashed $=$ no logic (wire) \quad F $=$ full adder \quad H $=$ half adder \quad total: 16 FA equivalents};
\end{circuitikz}
\end{document}
```

*after Fig. 12.8b, p. 382*

**Reject adder count as the cost function.** The adder-graph literature minimizes $N_{\mathrm A}$, the number of nodes, because that is what [[Minimum-Adder Constant Multiplier|graph enumeration]] and the ILP models can search over. But a node is not a fixed-price object: its two operands enter with different shifts, so they overlap only partially, and outside the overlap there is nothing for a full adder to do. Below the overlap the bits of one operand pass straight to the output — no logic at all — and above it, where only one operand still has bits, the cells degrade to half adders (p. 381). Two graphs with the same $N_{\mathrm A}$ can therefore differ by a third in real area, and among the many minimal-adder graphs for one constant these costs "differ widely" (p. 381).

**Cut one node into three bands by shift.** Take a node $c = (-1)^{\phi_{\mathrm L}}2^{s_{\mathrm L}}c_{\mathrm L} + (-1)^{\phi_{\mathrm R}}2^{s_{\mathrm R}}c_{\mathrm R}$ with $s_{\mathrm L}\le s_{\mathrm R}$, where $c_{\mathrm L}X$ is $w_{\mathrm L}$ bits wide and $c_{\mathrm R}X$ is $w_{\mathrm R}$ bits wide. Because multiplication by $2^{s}$ is a relabelling of wires, operand L occupies output positions $[s_{\mathrm L},\,s_{\mathrm L}+w_{\mathrm L})$ and operand R occupies $[s_{\mathrm R},\,s_{\mathrm R}+w_{\mathrm R})$. Three bands follow immediately:

- positions $[s_{\mathrm L},\,s_{\mathrm R})$ — **only L is present**, so by the identity $a+0=a$ each output bit *is* the corresponding L bit. Bare wire, zero cells.
- positions $[s_{\mathrm R},\,\min(s_{\mathrm L}+w_{\mathrm L},\,s_{\mathrm R}+w_{\mathrm R}))$ — **both present**, two operand bits plus an incoming carry, so a **full adder** ([[Full Adder]]).
- positions above that up to $\max(s_{\mathrm L}+w_{\mathrm L},\,s_{\mathrm R}+w_{\mathrm R})$ — **one operand plus a carry**, so a **half adder** ([[Half Adder]]). One further position holds only the carry-out or sign and costs no cell.

**Charge the two's-complement increment to whichever operand is negated.** Subtraction is not free at bit level even though it is free at node level. Realising $-Y$ uses the identity $-Y = \bar{Y} + 1$ from [[Number Formats]]: the inversion is a row of NOT gates, but the $+1$ has to enter the adder somewhere, and *where* is the whole story. If the **more-shifted** operand is the negated one ($\phi_{\mathrm R}=1$), the increment lands at position $s_{\mathrm R}$, which already has an adder cell — it simply becomes that cell's carry-in, and the wire band below is untouched. If instead the **less-shifted** operand is negated ($\phi_{\mathrm L}=1$), the increment lands at $s_{\mathrm L}$ and has to ripple all the way up to $s_{\mathrm R}$; every position of the would-be-free band becomes an incrementer cell. That converts $s_{\mathrm R}-s_{\mathrm L}$ bare wires into $s_{\mathrm R}-s_{\mathrm L}$ half adders.

> [!important]
> Negate the shifted operand, never the unshifted one. The sign is free to move — $A - 2^sB$ and $-(2^sB - A)$ are the same number — but only one of the two placements keeps the low band as wire.

**Collapse the three bands into one number.** Summing the bands, the cell count of a node is the width of the band starting at $s_{\mathrm R}$, plus the increment penalty:

$$\#\mathrm{FA_{eq}} \;=\; \underbrace{\max\!\left(s_{\mathrm L}+w_{\mathrm L},\; s_{\mathrm R}+w_{\mathrm R}\right)-s_{\mathrm R}}_{\text{adder band}} \;+\; \underbrace{\phi_{\mathrm L}\,(s_{\mathrm R}-s_{\mathrm L})}_{\text{misplaced increment}}$$

counting a half adder as one full-adder equivalent, which is the book's convention on p. 381 ("an FA can be used to compute an HA"). The first term says something blunt: **the adder band never starts below the larger shift**, so the cheapest node is the one whose *narrow* operand carries the *large* shift. That single expression reproduces all four boxes of Fig. 12.8 exactly, which is how it was checked.

**Read 49X off the model.** With $w_X=8$ and $X$ unsigned, both graphs use two adders and both are minimal in $N_{\mathrm A}$.

*Via the small positive intermediate $7X$ (Fig. 12.8a).* First $7X = 2^3X - X$: here $s_{\mathrm L}=0$, $s_{\mathrm R}=3$, $w_{\mathrm L}=w_{\mathrm R}=8$, and the negated operand is the unshifted one, so $\max(8,11)-3+3 = 11$ cells (3 H, 5 F, 3 H). Then $49X = 2^3\cdot7X - 7X$ with $w_{\mathrm L}=w_{\mathrm R}=11$, again negating the unshifted operand: $\max(11,14)-3+3 = 14$ cells (3 H, 8 F, 3 H). **Total 25.**

*Via the negative intermediate $-15X$ (Fig. 12.8b).* First $-15X = X - 2^4X$, which is the run-of-ones identity $15 = 2^4-1$ read backwards: $s_{\mathrm R}=4$, $w_{\mathrm R}=8$, and the negated operand is the shifted one, so no penalty and $\max(8,12)-4 = 8$ cells. The four LSBs of $-15X$ are literally $X_{3..0}$ on a wire. Then $49X = -15X + 2^6X$, a pure addition with $w_{\mathrm L}=13$, $s_{\mathrm R}=6$, $w_{\mathrm R}=8$: $\max(13,14)-6 = 8$ cells, and six more free LSBs. **Total 16 — about $1/3$ less at identical adder count** (p. 381).

**Why negative intermediates keep winning.** A run of ones in $C$ costs $k-1$ adders in binary but one subtraction in signed-digit form (see [[CSD Constant Multiplier]]), and that one subtraction is $2^{p+k}-2^p$ — a *large* shift difference by construction. Large shift difference is exactly what widens the free-wire band. So the same identity that minimizes adder count also, when the sign is placed on the shifted operand, minimizes full adders. The book records this as a general observation rather than a coincidence of $49$: the beneficial use of negative constants at bit level was the point of Gustafsson et al. [GJD09] (p. 381).

**The search machinery does not change, only the objective.** Bit-level cost models go back to Johansson et al. [JGW05; JGW07] and were refined by Aksoy et al. [Aks+07] and Brisebarre et al. [BDM08], the finer ones counting half adders and even inverters separately instead of folding everything into FA equivalents (p. 381). Slotting the model above into the ILP of [[Minimum-Adder Constant Multiplier|the ILP formulation]] is mechanical, because the shifts $s_{a,i}$ and signs $\phi_{a,i}$ are *already* decision variables there — the extension of Garcia and Volkova [GVK22; GV23] does exactly this, adding constraints that express a detailed full-adder-level metric on top of the existing skeleton (p. 381). Lou et al. [LYM14; LYM15] use the same bit-level view to target critical path rather than area.

**On FPGAs the three bands are still three bands, but the prices differ.** The free-wire band is free on both technologies — routing only. The distinction between the F and H bands, however, largely evaporates: a Xilinx or Intel carry-chain element costs one slice position whether it is doing full-adder or half-adder work, so on FPGA the quantity to minimize is the *length of the adder band*, i.e. the first term alone, and the misplaced-increment penalty is charged at the same rate as a real full adder. On an ASIC an HA cell is genuinely about half an FA, so the FA-equivalent count overstates the H bands. Either way the ranking of the two $49X$ graphs is unchanged, since (b) wins on band length, not on the F/H split.

$$\boxed{\;\#\mathrm{FA_{eq}}(\text{node}) \;=\; \max\!\left(s_{\mathrm L}+w_{\mathrm L},\, s_{\mathrm R}+w_{\mathrm R}\right)-s_{\mathrm R} \;+\; \phi_{\mathrm L}\,(s_{\mathrm R}-s_{\mathrm L}),\qquad s_{\mathrm L}\le s_{\mathrm R}\;}$$

**When it breaks.**

- **Non-overlapping operands.** If $s_{\mathrm R}\ge s_{\mathrm L}+w_{\mathrm L}$ the two operands never meet and the node is pure wiring; the formula's adder band degenerates to $w_{\mathrm R}$ and the "adder" is a concatenation. This is the $C=2^a+2^b$ case with $|a-b|\ge w_X$.
- **HA $=$ FA is a deliberate overcharge.** The book folds half adders into full-adder equivalents because an FA can compute an HA; an ASIC standard-cell flow will not, and a finer model [Aks+07] separates HAs and inverters. The inverter row implied by every subtraction is not shown in Fig. 12.8 and is not counted here either.
- **Area only.** The minimum-FA graph can carry a longer critical path than the minimum-adder one — the bands are shorter but the ripple structure changes. Optimizing delay at bit level is a different objective [LYM14].
- **The metric is per-constant.** Nothing says the minimum-FA graph is also minimal in adders; restricting the search to minimal-adder graphs is a heuristic, and a graph with one extra adder can beat it in cells.
- **Truncation dissolves the advantage.** If the low output bits are going to be discarded anyway, the free-wire band was never a cost and the ranking must be recomputed against the truncated cost — see [[Truncated Multipliers]].
- **Large $w_X$.** All three bands scale with the operand widths, so on FPGA the whole shift-and-add family loses to table-based methods well before the FA metric matters; [[KCM, Table-Based Constant Multiplication]] takes over.

> [!warning] Not covered in the source — needs outside research
> The book quantifies the FA-metric saving with a single example ($49X$, about $1/3$). There is no distribution — no average or worst-case saving of minimum-FA over arbitrary minimal-adder graphs across a coefficient range, comparable to the $\approx 1/3$ average reported for ternary adders in Fig. 12.7b. Nor is a solve-time figure given for the [GVK22; GV23] extension.

**RTL.** The graph of Fig. 12.8b, written so that the wire bands really are wires.

```spade
/// 49*X by the minimum-full-adder adder graph of Fig. 12.8b.
///   node A:  -15X = X - 2^4 X      (4 LSBs are bare wire)
///   node B:   49X = -15X + 2^6 X   (6 LSBs are bare wire)
/// Written so the wire bands are wires, not adder inputs.
entity mul49(x: uint<8>) -> uint<14> {
    let xb = x.as_bits();
    let xl: uint<4> = xb[0..4].as_uint();   // node A wire band, positions 0..3
    let xh: uint<4> = xb[4..8].as_uint();   // the part of X inside node A's adder band

    // node A adder band, positions 4..11: 4 FA + 4 HA, 9 bits signed.
    // -15X = 2^4 * thi + xl
    let thi: int<9> = trunc(sext::<5, 9>(xh.to_int()) - x.to_int());

    // re-split -15X at position 6 for node B: r = positions 4..5, q = positions 6..12
    let tb = thi.as_bits();
    let r: uint<2> = tb[0..2].as_uint();
    let q: int<7> = tb[2..9].as_uint().as_int();

    // node B adder band, positions 6..13: 6 FA + 2 HA
    let hi: uint<8> = trunc((sext::<7, 9>(q) + x.to_int()).as_uint());

    hi.concat(r).concat(xl)                 // 8 + 2 + 4 = 14 bits
}
```

`xl` is the dashed band of the upper row in the diagram and `xl` concatenated with `r` is the dashed band of the lower row — they reach the output without passing through an operator, which is the entire claim of the note. `thi` is the 9-bit signed adder band of node A: `xh` (4 bits) zero-extended against the full 8-bit `x`, so the overlap is 4 positions and the top 4 are carry-only, matching 4 F $+$ 4 H. Node B's band is `q + x`, 9-bit signed, truncated to the 8 bits the result can actually reach. Everything is combinational; the two nodes are a ripple chain of 16 cells and synthesis will merge them onto one carry chain rather than keeping the drawn node boundary. The `trunc` calls are safe by range, not by luck: $-15X\in[-3825,0]$ fits `int<9>` after the $2^4$ factor is pulled out, and $\lfloor 49X/2^6\rfloor\le 195$ fits `uint<8>`.

**Related notes.**

- [[Minimum-Adder Constant Multiplier]] – compares: same graphs, coarser objective; this note re-scores its output set without changing the search.
- [[Full Adder]] – depends-on: the cell the whole metric counts.
- [[Half Adder]] – depends-on: what the adder band degrades to above the overlap, charged here at full price.
- [[CSD Constant Multiplier]] – supports: the run-of-ones rewriting that produces the large shift differences this metric rewards.
- [[Ternary-Adder Constant Multiplier]] – compares: an orthogonal $\approx 1/3$ saving obtained by changing the node, not the objective.
- [[Truncated Multipliers]] – counter-example: when the low bits are discarded, the free-wire band stops being a saving.
- [[Choosing a Constant Multiplier]] – compares: where a bit-level-optimal shift-and-add graph sits against the table-based and DSP-block families.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §12.1.6 "Minimizing Logic Resources Instead of Number of Adders", pp. 381-382, incl. Fig. 12.8 (bit-level cost of $49X$ with two adders).
- §12.1.4 (ILP formulation whose shift and sign variables the FA-level objective reuses), pp. 373-378.
- §12.1.5 (ternary-adder nodes, for the comparison of savings), pp. 378-380.
