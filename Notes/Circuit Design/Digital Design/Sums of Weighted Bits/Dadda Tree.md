---
title: Dadda Tree
description: "Schedules full adders as late as possible against the sequence m_l=⌊1.5·m_(l−1)⌋, which minimises FA and HA count; costs the longest final adder (14 bits on the 8×8 example), the widest interconnect and the most flip-flops if pipelined."
kind: circuit
source: "ASA §7.3.1.1, pp. 176-179 — (7.25), Table 7.1, Fig. 7.19"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, multiplier, compressor, carry-save]
aliases:
  - Dadda
  - Dadda tree
  - Dadda Multiplier
  - Dadda's Algorithm
  - Dadda Reduction
  - ALAP Compressor Tree
---

# Dadda Tree

A compressor tree whose full adders are scheduled **as late as possible** — a column is never compressed below the height the *next* level can still absorb — which reaches the minimum level count using the fewest cells of any full-adder schedule, and leaves the longest final adder.

```tikz title="Dadda schedule of an 8x8 unsigned multiplier bit heap, five levels"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \node[anchor=south,font=\footnotesize] at (-2.80,2.40) {$\leftarrow$ column $c$ (weight $2^c$), MSB on the left};
  % --- level-4 compressor groupings, drawn under the dots -------------------
  % blue = full adder (3 dots), pink = half adder (2 dots)
  \foreach \c/\a/\b in {7/6/8, 8/5/7, 9/4/6}
    \draw[rounded corners=1.6pt,fill=blue!15,draw=blue!45]
      (-0.40*\c-0.13,0.26*\a-0.13) rectangle (-0.40*\c+0.13,0.26*\b+0.13);
  \foreach \c/\a/\b in {6/6/7, 7/4/5, 8/3/4}
    \draw[rounded corners=1.6pt,fill=red!15,draw=red!45]
      (-0.40*\c-0.13,0.26*\a-0.13) rectangle (-0.40*\c+0.13,0.26*\b+0.13);

  % --- the five dot diagrams ------------------------------------------------
  \foreach \c/\h in {0/1,1/2,2/3,3/4,4/5,5/6,6/7,7/8,8/7,9/6,10/5,11/4,12/3,13/2,14/1}
    \foreach \r in {1,...,\h} \fill (-0.40*\c,0.26*\r) circle (2.0pt);
  \foreach \c/\h in {0/1,1/2,2/3,3/4,4/5,5/6,6/6,7/6,8/6,9/6,10/6,11/4,12/3,13/2,14/1}
    \foreach \r in {1,...,\h} \fill (-0.40*\c,-2.90+0.26*\r) circle (2.0pt);
  \foreach \c/\h in {0/1,1/2,2/3,3/4,4/4,5/4,6/4,7/4,8/4,9/4,10/4,11/4,12/4,13/2,14/1}
    \foreach \r in {1,...,\h} \fill (-0.40*\c,-5.20+0.26*\r) circle (2.0pt);
  \foreach \c/\h in {0/1,1/2,2/3,3/3,4/3,5/3,6/3,7/3,8/3,9/3,10/3,11/3,12/3,13/3,14/1}
    \foreach \r in {1,...,\h} \fill (-0.40*\c,-7.10+0.26*\r) circle (2.0pt);
  \foreach \c/\h in {0/1,1/2,2/2,3/2,4/2,5/2,6/2,7/2,8/2,9/2,10/2,11/2,12/2,13/2,14/2}
    \foreach \r in {1,...,\h} \fill (-0.40*\c,-8.80+0.26*\r) circle (2.0pt);

  % --- level labels, left ---------------------------------------------------
  \foreach \y/\lbl in {1.00/{$l=4$ (input), $m_4=9$},
                       -2.15/{$l=3$, $m_3=6$},
                       -4.55/{$l=2$, $m_2=4$},
                       -6.55/{$l=1$, $m_1=3$},
                       -8.35/{$l=0$, $m_0=2$}}
    \node[anchor=east,font=\footnotesize] at (-6.20,\y) {\lbl};

  % --- schedule counts, right ----------------------------------------------
  \foreach \y/\lbl in {1.00/{64 bits, $h_{\max}=8$ \ $\rightarrow$ \ 3 FA $+$ 3 HA},
                       -2.15/{61 bits \ $\rightarrow$ \ 12 FA $+$ 2 HA},
                       -4.55/{49 bits \ $\rightarrow$ \ 9 FA $+$ 1 HA},
                       -6.55/{40 bits \ $\rightarrow$ \ 11 FA $+$ 1 HA},
                       -8.35/{29 bits: two rows, total 35 FA $+$ 7 HA}}
    \node[anchor=west,font=\footnotesize] at (0.30,\y) {\lbl};

  % --- separators -----------------------------------------------------------
  \foreach \y in {-0.54,-3.40,-5.63,-7.56}
    \draw[gray!45,thin] (-5.90,\y) -- (-0.10,\y);

  % --- column axis and final adder -----------------------------------------
  \foreach \c in {0,...,14} \node[anchor=north,font=\tiny] at (-0.40*\c,-8.66) {\c};
  \draw[thick] (-5.78,-9.20) -- (-0.22,-9.20);
  \node[anchor=north,font=\footnotesize] at (-3.00,-9.32)
    {final adder: columns 1--14, \textbf{14 bits} wide (column 0 is $p_{00}$, it bypasses)};
  \node[anchor=north,font=\footnotesize] at (-3.00,-9.90)
    {blue $=$ full adder (3 dots in), pink $=$ half adder (2 dots in);
     a carry lands one column left, at the \emph{same} level};
\end{circuitikz}
\end{document}
```

*after Fig. 7.19, p. 178.* Only the level-4 groupings are drawn; each later level is shown by the heap it produces, with its cell count on the right. Column 7 holds nine dots at level 4, not the eight drawn: the ninth is the half adder's carry arriving from column 6 at the same level.

**Run the compression bound backwards, and the schedule writes itself.** One level of full adders maps a column of height $h$ to $\lceil 2h/3 \rceil$ — three dots in, one sum staying and one carry leaving — so no level can shrink height by more than a factor $\tfrac32$. Inverting $h \mapsto \lceil 2h/3\rceil$ gives $h = \lfloor \tfrac32 h'\rfloor$, and iterating that from the target height $2$ yields the **Dadda sequence** (7.25, p. 176):

$$m_l = \lfloor 1.5\,m_{l-1}\rfloor,\qquad m_0 = 2 .$$

| $l$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $m_l$ | 2 | 3 | 4 | 6 | 9 | 13 | 19 | 28 | 42 | 63 | 94 | 141 | 211 | 316 | 474 |

*Table 7.1, p. 176.* Read $m_l$ as *the tallest heap that $l$ further levels can still flatten to height 2*. The stage count is therefore $L = \min\{l : m_l \ge h_{\max}\} = \Theta(\log_{1.5} h_{\max})$, which is 4 for an $8\times8$ multiplier ($h_{\max} = 8$, and $m_4 = 9 \ge 8 > 6 = m_3$) and never exceeds 6 even at 16 000 bits. All of that is a *lower bound argument*: it holds for [[Wallace Tree|any]] FA-only schedule. Dadda's contribution is a rule that meets it with the least hardware.

**Compress as late as possible, never further than the bound requires.** The algorithm (pp. 176–177) is three lines. Set $l = L$. At level $l$, scan the columns LSB to MSB; if column $i$ is taller than $m_{l-1}$, apply the minimal number of full adders and *at most one* half adder to bring it down to exactly $m_{l-1}$ — an FA lowers a column by 2, an HA by 1, so the counts are forced. Then decrement $l$ and repeat. The one subtle clause is the carry rule: a carry produced in column $i$ lands in column $i+1$ and **counts toward that column's height at the same level $l$**, but may not itself be compressed until level $l-1$. That is what keeps a level free of internal carry propagation and makes its delay one cell, not one chain. In the diagram, column 6 is height 7 at level 4 and needs only a single HA to reach $m_3 = 6$; its carry pushes column 7 from 8 to 9, which then needs $9-6 = 3$ of reduction, i.e. one FA plus one HA.

**"As late as possible" is what minimises cells, because every compressor placed early is placed twice.** A greedy schedule that fires a full adder whenever three dots exist drives a column below $m_{l-1}$, and the surplus reduction buys nothing — the next level was going to absorb that height anyway. Dadda spends a cell only when the bound would otherwise be violated, so at level 4 of a 64-dot heap it places **3 FA and 3 HA** and leaves the other eleven columns untouched. Compare the fully greedy pass, which would place $\lfloor h/3 \rfloor$ FAs in every column of height $\ge 3$ and reach the same level 3 having spent an order of magnitude more silicon.

**The fewer cells and the longer final adder are the same fact, not two independent trade-offs.** A full adder consumes 3 dots and emits 2, removing exactly one; a half adder consumes 2 and emits 2, removing none. Summing over the whole tree:

$$\#\mathrm{FA} = N_{\text{in}} - N_{\text{out}} ,$$

with $N_{\text{in}}$ the input dots and $N_{\text{out}}$ the dots surviving into the final adder — the identity derived in [[Compressor Trees]]. The schedule cannot choose its FA count; it chooses $N_{\text{out}}$, and the FA count follows. Dadda leaves the low columns tall for as long as it can, so $N_{\text{out}}$ is as large as a height-2 heap allows: $8\times8$ gives $N_{\text{in}} = 64$, an output of one dot in column 0 and two in each of columns 1–14, so $N_{\text{out}} = 29$ and $\#\mathrm{FA} = 35$, matching the diagram's level totals $3+12+9+11$. Those 29 dots are a **14-bit** final adder. [[Reduced Area Compressor Tree|Reduced Area]] spends extra half adders on the low columns to resolve them to height 1, which drives $N_{\text{out}}$ down to 25 and the adder down to **10 bits** — and, by the same identity, drives its full-adder count *up* to 39. Half adders are the only free variable the identity does not pin, which is exactly why Dadda's "at most one HA per column" clause is worth stating.

**Every level is exact, so the schedule has no error budget at all.** A compressor is by definition weighted-sum-preserving, $\sum_k 2^{p_k}\mathrm{in}_k = \sum_k 2^{q_k}\mathrm{out}_k$ for every input assignment, so $V(\mathcal{B})$ is invariant across all $L$ levels and the product is bit-exact regardless of which schedule ran. Nothing here rounds, and [[Error Accuracy]] enters the picture only if dots are deleted *before* the tree runs — see [[Truncated Bit Heap]]. Likewise the schedule is oblivious to [[Number Formats]]: it sees column indices, and whether those indices mean $2^c$ or $2^{c+\ell}$ is the caller's business.

**Where ALAP actually costs you is everything the dot count cannot see.** Columns stay maximally tall for as long as possible, so the number of bits crossing each level boundary is the highest of any schedule, and the inter-level routing is correspondingly wide and irregular — on ASIC, place-and-route, not cell count, usually decides the final area. The same property is fatal under pipelining: registering after every level prices each crossing bit at a flip-flop, so a [[Pipelined Compressor Tree]] built on a Dadda schedule carries the worst FF count, which is the book's stated reason for preferring RA there (pp. 179–180). And the 14-bit final adder sits on the critical path; because a multiplier heap's arrival profile is Gaussian-shaped, it should be a [[Split Final Adder]] rather than a uniform prefix tree.

> [!warning] The book's own numbers for this example are corrupt
> p. 177 closes the worked $8\times8$ Dadda example with "As a result, 0 full adders and 0 half adders are necessary for this example", two sentences after describing the half adder in column 6 and the FA+HA pair in column 7. Table 7.2 (p. 180) repeats `FA = 0`, `HA = 0` for both Dadda and RA and lists `FF = −80`. All four are impossible: $\#\mathrm{FA} = N_{\text{in}} - N_{\text{out}} \ge 64 - 2\cdot16 = 32$ forces at least 32 full adders, and a negative flip-flop count is meaningless. Only the final-adder lengths, 14 against 10, survive. The counts annotated in the diagram above (35 FA, 7 HA) are my own execution of the algorithm on the same heap; the level-4 and level-3 groupings were checked dot-for-dot against Fig. 7.19, which draws 3 FA + 3 HA and 12 FA + 2 HA respectively.

**On FPGA the objective this schedule optimises stops being the right objective.** Dadda minimises full-adder count on the premise that the FA is the natural unit of area. On a LUT6 fabric it is the *worst* unit available: Table 7.3 (p. 184) prices a $(3;2)$ at 1 LUT6 for efficiency $E = \delta/k = 1$, while a $(6,0,7;5)$ carry-chain [[Generalized Parallel Counter|GPC]] reaches $E = 2$ on 4 LUT6 and a [[Carry-Chain 4-2 Compressor|carry-chain 4:2]] reaches $E = 2 - 1/k$ at shorter delay. Minimising FA count is simply not minimising LUTs, so the ALAP/ASAP axis has no FPGA meaning and the [[Efficiency-Driven Compression Heuristic]] takes over; the final adder should then be a carry-chain [[Ripple-Carry Adder|RCA]], not a prefix tree, because the hardened chain makes propagation nearly free.

$$\boxed{\ m_l = \lfloor 1.5\,m_{l-1}\rfloor,\ m_0 = 2,\qquad L = \min\{l : m_l \ge h_{\max}\},\qquad \text{compress column }i\text{ to exactly }m_{l-1},\text{ never below}\ }$$

**When it breaks.**

- **The moment the tree is pipelined.** ALAP maximises the bits crossing every level boundary, so it maximises flip-flops. RA wins outright; the cell-count advantage does not survive the register cost.
- **When the final adder is the critical path.** 14 bits versus 10 on the same heap. Buying the shorter adder costs full adders by the identity above, and if the adder is what closes timing, buy it.
- **$h_{\max} \le 2$, or $h_{\max} \le 3$ with a ternary final adder.** There is no level to schedule; the whole discussion collapses to picking an adder.
- **Any target with a non-uniform compressor library.** GPCs, 4:2 rows and DSP blocks all break the premise that a cell costs one unit. Above a few hundred bits per heap the FA-only formulation loses to an efficiency-ordered heuristic or an ILP covering model regardless of target.
- **Wiring-limited ASIC layouts.** The dot diagram is column-local and hides that the level-to-level routing is the widest of any schedule. At large $N$ the drawing flatters Dadda.
- **The bound is not a construction.** $L = \min\{l : m_l \ge h_{\max}\}$ is achievable by many schedules, so meeting it is not evidence that a tree is Dadda-scheduled — only the per-column height targets are.

**RTL (Spade).**

```spade
/// One full adder: three dots of weight 2^k in, (sum at 2^k, carry at 2^(k+1)) out.
fn fa(a: bool, b: bool, c: bool) -> (bool, bool) {
    let p = a != b;
    (p != c, (a && b) || (p && c))
}

/// One half adder: two dots in, (sum, carry) out. Removes no bit, lowers the column by one.
fn ha(a: bool, b: bool) -> (bool, bool) {
    (a != b, a && b)
}

/// Dadda-scheduled 4x4 unsigned multiplier: h_max = 4 = m_2, so L = 2 levels,
/// targeting m_1 = 3 then m_0 = 2. Cost: 16 AND, 3 FA, 3 HA, one 6-bit final adder.
entity dadda4(x: uint<4>, y: uint<4>) -> uint<8> {
    let xb = x.as_bits();
    let yb = y.as_bits();

    // partial products: p_ij = x_i AND y_j sits in column i + j
    let p00 = xb[0] && yb[0];
    let p10 = xb[1] && yb[0];  let p01 = xb[0] && yb[1];
    let p20 = xb[2] && yb[0];  let p11 = xb[1] && yb[1];  let p02 = xb[0] && yb[2];
    let p30 = xb[3] && yb[0];  let p21 = xb[2] && yb[1];
    let p12 = xb[1] && yb[2];  let p03 = xb[0] && yb[3];
    let p31 = xb[3] && yb[1];  let p22 = xb[2] && yb[2];  let p13 = xb[1] && yb[3];
    let p32 = xb[3] && yb[2];  let p23 = xb[2] && yb[3];
    let p33 = xb[3] && yb[3];

    // level l = 2, target m_1 = 3: only the two columns above 3 are touched
    let (h1s, h1c) = ha(p21, p30);       // column 3: 4     -> 3
    let (h2s, h2c) = ha(p31, h1c);       // column 4: 3 + 1 -> 3

    // level l = 1, target m_0 = 2
    let (h3s, h3c) = ha(p11, p20);       // column 2: 3     -> 2
    let (f1s, f1c) = fa(p03, p12, h1s);  // column 3: 3 + 1 -> 2
    let (f2s, f2c) = fa(p13, p22, h2s);  // column 4: 3 + 1 -> 2
    let (f3s, f3c) = fa(p23, p32, h2c);  // column 5: 3 + 1 -> 2

    // the two surviving rows of the l = 0 heap; array index 0 = column 0 = LSB
    let row0: uint<7> = [p00, p10, p02,  f1s, f2s, f3s, p33].as_uint();
    let row1: uint<7> = [false, p01, h3s, h3c, f1c, f2c, f3c].as_uint();
    row0 + row1
}
```

Each `ha`/`fa` binding is one shaded box of the drawing, in the column named by its comment and at the level named by its block; `h1c` feeding `ha(p31, h1c)` is the carry rule — a carry produced in column 3 counted at column 4 of the *same* level. `row0` and `row1` are the height-2 output heap, both `uint<7>` so that the single `+` — the only carry-propagating element in the design — widens to the `uint<8>` product with no `zext`. `row1`'s zero LSB is column 0 bypassing the adder, so synthesis collapses that bit-slice and builds the 6-bit adder the schedule predicts. Everything is combinational: no `reg`, no clock port, and pipelining it is where the flip-flop cost of ALAP would appear. Checking the block against the identity: $N_{\text{in}} = 16$, $N_{\text{out}} = 7 + 6 = 13$, and indeed $16 - 13 = 3$ full adders. The [[Wallace Tree]] note builds the same $4\times4$ heap ASAP and gets 5 FA and a 4-bit adder — two more cells, two fewer adder bits, the identity in miniature. Synthesis honours none of this structure: an FPGA tool will re-map the whole expression onto LUT6s and the carry chain, so read the block as a *specification of the schedule*, not a floorplan.

**Related Notes (with context).**

- [[Compressor Trees]] – depends-on: the substrate, the compressor invariant, and the $\#\mathrm{FA} = N_{\text{in}} - N_{\text{out}}$ identity this note spends.
- [[Bit Heaps]] – depends-on: the dot diagram the schedule operates on, and why column 0 always bypasses.
- [[Full Adder]] – depends-on: the $(3;2)$ cell; one blue box in the drawing.
- [[Half Adder]] – depends-on: the $(2;2)$ cell that lowers a column without removing a bit — the only quantity Dadda is free to minimise.
- [[Wallace Tree]] – compares: the ASAP pole, same $L$, more cells, shorter final adder.
- [[Reduced Area Compressor Tree]] – compares: the book's ASAP reference, 10-bit final adder against this note's 14 on the identical heap.
- [[Ripple-Carry Adder]] – supports: what the surviving height-2 heap is handed to, and the right choice on FPGA.
- [[Split Final Adder]] – extends: the 14-bit adder should not be uniform, because the heap's bits do not arrive together.
- [[Pipelined Compressor Tree]] – counter-example: registering every level inverts this schedule's advantage into its worst cost.
- [[Efficiency-Driven Compression Heuristic]] – counter-example: on a LUT fabric, minimising full adders is not minimising area, so this objective is the wrong one.
- [[Generalized Parallel Counter]] – extends: widening the library past $(3;2)$ and $(2;2)$ turns scheduling into a covering problem the Dadda rule cannot express.
- [[Truncated Multipliers]] – extends: deleting low-column dots before the schedule runs shrinks $h_{\max}$, $L$ and the final adder together.
- [[Truncated Bit Heap]] – extends: the same deletion stated as an error budget rather than as a multiplier.
- [[Choosing a Compressor Tree]] – compares: where this schedule sits against every sibling, by target and heap size.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 7.

- §7.3.1.1 Dadda's algorithm, pp. 176–177 — Eq. (7.25), Table 7.1, the three-step rule and the $8\times8$ worked example.
- Fig. 7.19, p. 178 — Dadda compressor tree for the $8\times8$ heap; source of the diagram above.
- §7.3.1.2 Reduced Area algorithm and Fig. 7.20, pp. 179–179 — the ASAP comparison point.
- Table 7.2, p. 180 — final-adder lengths 14 (Dadda) and 10 (RA); its FA, HA and FF columns are corrupt, see the warning above.
- §7.3.2, Table 7.3, p. 184 — compressor efficiencies that invert the objective on FPGA.
