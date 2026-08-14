---
title: Wallace Tree
description: "The classic as-soon-as-possible full-adder schedule: compress every column the moment three bits exist, trading extra cells for the shallowest tree — the historical ASAP pole that Reduced Area occupies in this book."
kind: circuit
source: "Not in ASA; nearest treatment is §7.3.1 (Dadda, Reduced Area), pp. 176-180. Wallace's schedule itself is canon: Wallace, *A Suggestion for a Fast Multiplier*, IEEE TEC 13(1), 1964."
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, multiplier, compressor, carry-save]
aliases:
  - Wallace
  - Wallace tree
  - Wallace Multiplier
  - Wallace Tree Multiplier
  - Wallace Reduction
---

# Wallace Tree

A compressor tree whose full adders are scheduled **as soon as possible** — every column is compressed the instant it holds three bits — which reaches the minimum level count while spending the largest number of cells and the widest inter-level wiring.

```tikz title="Wallace ASAP schedule of a 4x4 multiplier bit heap, three levels down to height 2"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[scale=1,
  dot/.style={circle,fill=black,inner sep=1.2pt},
  fabox/.style={draw,rounded corners=2pt,thick},
  habox/.style={draw,rounded corners=2pt,thick,dashed}]

% ---- geometry: column w at x=(6-w)*0.62 ; dot k of a level at y = Y - 0.34k
% ================= level l=2 : the 16 partial products =================
\foreach \w/\n in {0/1,1/2,2/3,3/4,4/3,5/2,6/1}
  \foreach \k in {0,...,\n} { \ifnum\k<\n \node[dot] at ({(6-\w)*0.62},{-0.34*\k}) {}; \fi }
\node[habox] at ({(6-1)*0.62},-0.17) [minimum width=13pt,minimum height=20pt] {};
\node[fabox] at ({(6-2)*0.62},-0.34) [minimum width=13pt,minimum height=32pt] {};
\node[fabox] at ({(6-3)*0.62},-0.34) [minimum width=13pt,minimum height=32pt] {};
\node[habox] at ({(6-4)*0.62},-0.17) [minimum width=13pt,minimum height=20pt] {};
\node[anchor=west] at (4.5,-0.5) {$l=2$: 16 PP bits, $h_{\max}=4$};

% column ruler
\foreach \w in {0,...,6} \node[font=\scriptsize,gray] at ({(6-\w)*0.62},0.42) {\w};
\node[font=\scriptsize,gray,anchor=west] at (4.5,0.42) {column (weight $2^w$)};

% ================= level l=1 =================
\foreach \w/\n in {0/1,1/1,2/2,3/3,4/3,5/3,6/1}
  \foreach \k in {0,...,\n} { \ifnum\k<\n \node[dot] at ({(6-\w)*0.62},{-2.1-0.34*\k}) {}; \fi }
\node[habox] at ({(6-2)*0.62},-2.27) [minimum width=13pt,minimum height=20pt] {};
\node[fabox] at ({(6-3)*0.62},-2.44) [minimum width=13pt,minimum height=32pt] {};
\node[fabox] at ({(6-4)*0.62},-2.44) [minimum width=13pt,minimum height=32pt] {};
\node[fabox] at ({(6-5)*0.62},-2.44) [minimum width=13pt,minimum height=32pt] {};
\node[anchor=west] at (4.5,-2.6) {$l=1$: $h_{\max}=3$};

% ================= level l=0 =================
\foreach \w/\n in {0/1,1/1,2/1,3/2,4/2,5/2,6/2}
  \foreach \k in {0,...,\n} { \ifnum\k<\n \node[dot] at ({(6-\w)*0.62},{-4.2-0.34*\k}) {}; \fi }
\node[anchor=west] at (4.5,-4.4) {$l=0$: $h_{\max}=2$};
\node[font=\scriptsize,anchor=west] at (4.5,-5.35) {row C: 7 b, row D: 4 b, product: 8 b};

% final adder spans columns 6..3 only
\draw[thick] ({(6-6)*0.62-0.3},-4.75) rectangle ({(6-3)*0.62+0.3},-5.25);
\node[font=\small] at ({(6-4.5)*0.62},-5.0) {4-bit final adder};
\node[font=\scriptsize,anchor=west] at ({(6-2)*0.62-0.25},-5.0) {columns 2..0 already final};
\draw[->,>=latex] ({(6-6)*0.62-0.3},-5.0) -- ({(6-6)*0.62-0.9},-5.0)
  node[anchor=east,font=\scriptsize] {$c_{\mathrm{out}}\!=\!2^7$};

% arrows between levels
\draw[->,>=latex,gray] (2.2,-1.35) -- (2.2,-1.85);
\draw[->,>=latex,gray] (2.2,-3.35) -- (2.2,-3.95);

% legend
\node[fabox] at (0.0,-6.2) [minimum width=13pt,minimum height=13pt] {};
\node[anchor=west,font=\small] at (0.3,-6.2) {full adder $(3;2)$};
\node[habox] at (3.4,-6.2) [minimum width=13pt,minimum height=13pt] {};
\node[anchor=west,font=\small] at (3.7,-6.2) {half adder $(2;2)$};
\end{circuitikz}
\end{document}
```

*Own construction; the dot placement and cell assignment are exactly the RTL below.*

**Fix the object the schedule acts on.** The input is a [[Bit Heaps|bit heap]]: a multiset of one-bit signals, each tagged with a weight $2^w$, whose value is $\sum_w 2^w h_w$ summed over the $h_w$ bits in column $w$. A $4\times4$ unsigned multiplier gives $N=16$ bits with column heights $(1,2,3,4,3,2,1)$ from $w=0$ to $w=6$. Compression is any rewriting that preserves that weighted sum; a [[Full Adder]] is the $(3;2)$ rewrite $a+b+c = 2c_{\text{out}} + s$, replacing three weight-$2^w$ bits by one weight-$2^w$ bit and one weight-$2^{w+1}$ bit, and a [[Half Adder]] is the $(2;2)$ rewrite $a+b = 2c_{\text{out}}+s$. Neither rewrite reads a carry from its neighbour, so a whole level is a row of [[Carry-Save Adder|carry-save adders]] with **no carry propagation at all** — the entire delay of a level is one cell, independent of the heap's width.

**State the schedule as a greedy rule.** Wallace's rule is: at every level, in every column, apply $\lfloor h_w/3 \rfloor$ full adders, and apply a half adder to the two-bit remainder if one is left. Nothing is deferred and nothing waits for a partner — hence *as soon as possible*. The sums stay in column $w$, the carries land in column $w+1$ and are counted at the **next** level, which is what keeps a level free of internal propagation. The complementary rule, [[Dadda Tree|Dadda's]], is *as late as possible*: compress a column only down to the height the next level can still absorb, never further.

**Derive why ASAP does not buy a shallower tree.** Take a level in which every column has height $h$. ASAP emits $\lfloor h/3\rfloor$ sums into that column, passes $h \bmod 3$ bits through, and receives $\lfloor h/3\rfloor$ carries from the column below, so the next height is
$$h' \;=\; \Big\lfloor \tfrac{h}{3} \Big\rfloor + (h \bmod 3) + \Big\lfloor \tfrac{h}{3} \Big\rfloor \;=\; \Big\lceil \tfrac{2h}{3} \Big\rceil \quad\text{(exact for } h \equiv 0 \bmod 3\text{)}.$$
Inverting the map $h \mapsto \lceil 2h/3 \rceil$ gives $h = \lfloor \tfrac32 h' \rfloor$, which is precisely the Dadda sequence $m_l = \lfloor 1.5\,m_{l-1}\rfloor$, $m_0 = 2$ of Table 7.1 (p. 176). That sequence is an *upper bound on what any FA-only level can absorb*, so it bounds Wallace exactly as it bounds Dadda: both need
$$L \;=\; \min\{\,l : m_l \ge h_{\max}\,\} \;=\; \Theta(\log_{1.5} h_{\max})$$
levels. **Wallace is not shallower than Dadda.** The folklore that it is comes from comparing against a linear reduction, not against a well-scheduled ALAP tree.

**Derive the cell count from a conservation law, not from the schedule.** Count bits, not cells. A full adder consumes 3 bits and emits 2, a net change of $-1$; a half adder consumes 2 and emits 2, a net change of $0$; a bit passed through is unchanged. Summing over the whole tree, with $N_{\text{in}}$ bits entering and $N_{\text{out}}$ bits surviving in the height-2 output heap,
$$\#\mathrm{FA} \;=\; N_{\text{in}} - N_{\text{out}} .$$
This holds for *every* FA/HA schedule — Wallace, Dadda, Reduced Area alike. So the schedule cannot choose its full-adder count freely: it chooses $N_{\text{out}}$, i.e. **how much work it leaves for the final adder**, and the FA count follows. Wallace and RA compress the low columns early, driving $N_{\text{out}}$ down, and pay for it in full adders; Dadda leaves the low columns tall, keeps $N_{\text{out}}$ high, and spends fewer cells. On the book's $8\times8$ example (Figs. 7.19–7.20, pp. 178–179) that shows up as a **14-bit final adder for Dadda against 10 bits for RA**. The half adder count is *not* fixed by the identity — a HA removes no bits — which is why HA-happy schedules waste area outright.

**Read the real cost where the identity is silent.** What separates the two poles is everything the bit count does not see: inter-level wiring, and flip-flops if the tree is pipelined. ALAP keeps columns maximally tall for as long as possible, so it carries the most bits between levels; ASAP thins them immediately. If a register is inserted after every level, the FF count is proportional to the bits crossing the level boundaries, and ASAP wins by a wide margin — the book's own argument for preferring RA to Dadda in a [[Pipelined Compressor Tree|pipelined]] design (pp. 179–180). The delay of the tree itself is $L$ cell delays plus the final adder, and since the heap's arrival profile is Gaussian-shaped (LSBs and MSBs finish first, middle last, p. 194), that final adder should be a [[Split Final Adder|split]] one rather than a uniform prefix tree.

**Do not carry this schedule onto an FPGA.** Wallace minimises full-adder *levels*, which presumes the full adder is the natural unit of cost. On a LUT6 fabric it is the worst unit available: Table 7.3 (p. 184) prices a $(3;2)$ at 1 LUT6 for efficiency $E = \delta/k = 1$, while a $(6,0,7;5)$ carry-chain GPC reaches $E=2$ on 4 LUT6, and a carry-chain 4:2 row compressor reaches $E = 2 - 1/k$ at shorter delay. Minimising FA count is simply not minimising area there, so the objective the Wallace rule optimises has no FPGA meaning; use the [[Efficiency-Driven Compression Heuristic]] instead. On ASIC, where an FA is a compact standard cell and routing is the scarce resource, the Wallace/Dadda axis is still the right one to reason on.

> [!warning] Wallace is not in de Dinechin & Kumm
> The string "Wallace" appears nowhere in *Application-Specific Arithmetic* (checked over the full text). The book presents Dadda (ALAP, p. 176) and the **Reduced Area** algorithm of Bickerstaff et al. (ASAP, §7.3.1.2, p. 177) as the two poles. RA is a refinement of the same ASAP idea, differing in that it applies the maximum number of FAs *such that all inputs are connected* and adds half adders only to respect the Dadda bound or to shorten the final adder — a Wallace tree with the half-adder policy tightened. Everything above about ASAP behaviour is grounded in the book's RA discussion; the Wallace rule itself, and the $\#\mathrm{FA}$ identity, are canon and derivation respectively, not quotations. Exact FA/HA counts for a *Wallace-scheduled* $8\times8$ heap are not available from this source — see the warning below for why the book's table cannot supply them either.

> [!warning] Table 7.2 (p. 180) is misprinted and cannot be used
> Its FA, HA and FF columns read `0`, `0`, `−80` for **both** Dadda and RA, and the body text on p. 177 repeats "0 full adders and 0 half adders are necessary for this example". Both are impossible: the identity $\#\mathrm{FA} = N_{\text{in}} - N_{\text{out}}$ with $N_{\text{in}} = 64$ for an $8\times8$ heap and $N_{\text{out}} \le 2\cdot 16 = 32$ forces $\#\mathrm{FA} \ge 32$, and a negative flip-flop count is meaningless. Only the final-adder lengths (14 vs 10) in that table survive scrutiny; the prose direction — Dadda fewer FA/HA, RA smaller final adder and far fewer FFs — is the usable content.

$$\boxed{\ \#\mathrm{FA} \;=\; N_{\text{in}} - N_{\text{out}},\qquad L \;=\; \min\{\,l : m_l \ge h_{\max}\,\},\quad m_l = \lfloor 1.5\,m_{l-1}\rfloor,\ m_0=2\ }$$

**When it breaks.**

- **It is not faster than Dadda.** Same $L$, by the bound above. Anyone quoting Wallace for depth is comparing against the wrong baseline.
- **Half adders are pure overhead when applied blindly.** A HA removes no bits ($\delta = 0$) and only shifts one up a column. Wallace's "compress the leftover pair" clause fires often; RA's rule — HA only for the Dadda bound or to shorten the final adder — is strictly better, and is why the book documents RA instead.
- **Below $h_{\max} = 3$ there is nothing to schedule.** The heap is already at the final-adder height, and the whole discussion collapses to picking an adder.
- **Above a few hundred bits per column the FA-only model stops paying.** $\Theta(\log_{1.5} h)$ is only 4–6 stages even at 16 000 bits, so depth is no longer the bottleneck — LUT or cell count is, and a GPC covering formulation takes over.
- **On FPGA the asymptotics reverse** (see above): the fast carry chain makes propagation nearly free, so row adders behave as compressors and the FA is the least efficient cell in the library.
- **The wiring is the real ASIC risk.** Column-local dot diagrams hide that level-to-level routing is irregular; at large $N$ the place-and-route result, not the cell count, decides the area.

```spade
fn ha(a: bool, b: bool) -> (bool, bool) {
    (a ^^ b, a && b)
}

fn fa(a: bool, b: bool, c: bool) -> (bool, bool) {
    (a ^^ b ^^ c, (a && b) || (b && c) || (a && c))
}

// Wallace-scheduled 4x4 unsigned multiplier heap.
entity wallace4(x: uint<4>, y: uint<4>) -> uint<8> {
    let xb = x.as_bits();
    let yb = y.as_bits();

    // partial product p[i][j] has weight i+j
    let p00 = xb[0] && yb[0];
    let p01 = xb[0] && yb[1];
    let p02 = xb[0] && yb[2];
    let p03 = xb[0] && yb[3];
    let p10 = xb[1] && yb[0];
    let p11 = xb[1] && yb[1];
    let p12 = xb[1] && yb[2];
    let p13 = xb[1] && yb[3];
    let p20 = xb[2] && yb[0];
    let p21 = xb[2] && yb[1];
    let p22 = xb[2] && yb[2];
    let p23 = xb[2] && yb[3];
    let p30 = xb[3] && yb[0];
    let p31 = xb[3] && yb[1];
    let p32 = xb[3] && yb[2];
    let p33 = xb[3] && yb[3];

    // level 1: compress rows 0,1,2 as soon as three bits exist
    let (s1, c1) = ha(p01, p10);        // weight 1
    let (s2, c2) = fa(p02, p11, p20);   // weight 2
    let (s3, c3) = fa(p03, p12, p21);   // weight 3
    let (s4, c4) = ha(p13, p22);        // weight 4

    // level 2: sums row, carries row, and the untouched row 3
    let (t2, d2) = ha(s2, c1);          // weight 2
    let (t3, d3) = fa(s3, c2, p30);     // weight 3
    let (t4, d4) = fa(s4, c3, p31);     // weight 4
    let (t5, d5) = fa(p23, c4, p32);    // weight 5

    let rowc: uint<7> = [p00, s1, t2, t3, t4, t5, p33].as_uint();
    let rowd: uint<7> = [false, false, false, d2, d3, d4, d5].as_uint();

    rowc + rowd
}
```

Each `let (s, c) = fa(...)` is one solid box in the diagram and each `ha(...)` one dashed box, in the same column and at the same level. `rowc` and `rowd` are the two surviving rows of the $l=0$ heap, both declared `uint<7>` so that the final `+` — the only carry-propagating element in the design — widens to the `uint<8>` product; `rowd`'s three zero LSBs are exactly the "columns 2..0 already final" annotation, so synthesis will collapse the low three bit-slices of that adder away and build the 4-bit adder the diagram draws. The whole entity is combinational (no `reg`, no `clk` port); a pipelined version would register the array between levels, which is where ASAP's flip-flop advantage over ALAP appears. Counting the block against the identity: $N_{\text{in}} = 16$, 5 FAs and 3 HAs used, $N_{\text{out}} = 7 + 4 = 11$, and indeed $16 - 11 = 5$.

**Related Notes**

- [[Compressor Trees]] – depends-on: supplies the height-2 target and the $\Theta(\log_{1.5} h)$ level count this schedule realises.
- [[Bit Heaps]] – depends-on: the weighted-multiset substrate the dot diagram draws.
- [[Full Adder]] – depends-on: the $(3;2)$ rewrite that every level is made of.
- [[Half Adder]] – depends-on: the $(2;2)$ rewrite that costs area without removing a bit.
- [[Carry-Save Adder]] – extends: one Wallace level *is* a carry-save adder; Wallace stacks them until the heap is height 2.
- [[Dadda Tree]] – compares: the ALAP pole, same level count, fewer cells, longer final adder.
- [[Reduced Area Compressor Tree]] – compares: the ASAP algorithm this book documents in Wallace's place, with a tighter half-adder rule.
- [[Pipelined Compressor Tree]] – extends: where ASAP's thinner inter-level heap turns into a real flip-flop saving.
- [[Split Final Adder]] – supports: consumes the two output rows, whose bits do not arrive together.
- [[Efficiency-Driven Compression Heuristic]] – counter-example: on FPGA, minimising full-adder levels is the wrong objective entirely.
- [[Choosing a Compressor Tree]] – compares: where this sits against every sibling schedule.
- [[Multipliers]] – supports: partial-product reduction is the canonical consumer of this schedule.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024. §7.3.1 Basic Compression Algorithms, Table 7.1, pp. 176–177; §7.3.1.2 Reduced Area Algorithm and Figs. 7.19–7.20, pp. 177–179; Table 7.2 (misprinted), p. 180; Table 7.3 FPGA compressor efficiencies, p. 184; final-adder arrival profile, p. 194. **Wallace is not treated in this book.**
- C. S. Wallace, "A Suggestion for a Fast Multiplier", *IEEE Trans. Electronic Computers* EC-13(1):14–17, 1964 — the original ASAP schedule.
- W. J. Bickerstaff, M. J. Schulte, E. E. Swartzlander, "Reduced Area Multipliers", 1993 [BSS93] — the RA refinement, as cited on p. 178.
- Long-form source: `2.3) Sums of Weighted Bits.md`, §§ Compressor Tree Synthesis, Trade-offs.
