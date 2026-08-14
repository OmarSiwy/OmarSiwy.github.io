---
title: Compound Adder
description: "Only the bottom row of a prefix adder depends on c0, so duplicating that one linear row yields X+Y and X+Y+1 at once — the standard significand adder for floating-point rounding."
kind: circuit
source: "ASA §5.3.7, p. 123 (Fig. 5.20); prefix background §5.3.6, pp. 118-123"
status: seed
spade: simulated
tags: [digital, adder, prefix, carry, floating-point, rounding, vlsi]
aliases:
  - Compound Fast Adder
  - Compound Prefix Adder
  - Compound Adders
  - Compound Addition
  - Dual-Output Prefix Adder
---

# Compound Adder

A parallel prefix adder in which the single carry-injection row — the only part of the structure that reads $c_0$ — is instantiated twice, so one tree delivers $X+Y$ and $X+Y+1$ at the same instant.

```tikz title="Compound adder: one shared prefix tree feeding two sum-completion rows, hard-wired to c0=0 and c0=1"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,
  blk/.style={draw,rounded corners=1pt,minimum height=8mm,align=center,fill=white}]

  % operands
  \draw[-latex] (-1.6,3.0) -- (-1.6,2.1);
  \node[anchor=south] at (-1.6,3.0) {$X$};
  \node[anchor=west] at (-1.55,2.55) {$w$};
  \draw[-latex] (1.6,3.0) -- (1.6,2.1);
  \node[anchor=south] at (1.6,3.0) {$Y$};
  \node[anchor=west] at (1.65,2.55) {$w$};

  % prefix tree
  \node[blk,minimum width=52mm] (tree) at (0,1.6) {parallel prefix tree\\ \scriptsize (Kogge-Stone / Sklansky / Brent-Kung)};

  % shared bus, independent of c_0
  \draw[line width=1pt] (0,1.1) -- (0,0.45);
  \draw[line width=1pt] (-2.5,0.45) -- (2.5,0.45);
  \draw[line width=1pt,-latex] (-2.5,0.45) -- (-2.5,-0.35);
  \draw[line width=1pt,-latex] (2.5,0.45) -- (2.5,-0.35);
  \node[anchor=west] at (0.12,0.78) {$(G_{i:0},A_{i:0})_{i=0\ldots w-1}$\ \ \ $2w$};

  % two sum completion rows
  \node[blk,minimum width=30mm] (l) at (-2.5,-0.8) {sum completion};
  \node[blk,minimum width=30mm] (r) at ( 2.5,-0.8) {sum completion};

  % carry-in constants
  \draw[-latex] (-4.9,-0.8) -- (-4.05,-0.8);
  \node[anchor=east] at (-4.95,-0.8) {$c_0=0$};
  \draw[-latex] (4.9,-0.8) -- (4.05,-0.8);
  \node[anchor=west] at (4.95,-0.8) {$c_0=1$};

  % outputs
  \draw[-latex] (-2.5,-1.25) -- (-2.5,-2.15);
  \node[anchor=north] at (-2.5,-2.2) {$X+Y$};
  \node[anchor=west] at (-2.45,-1.65) {$w{+}1$};
  \draw[-latex] (2.5,-1.25) -- (2.5,-2.15);
  \node[anchor=north] at (2.5,-2.2) {$X+Y+1$};
  \node[anchor=west] at (2.55,-1.65) {$w{+}1$};

  % annotations
  \node[anchor=west,gray!70] at (2.85,1.6) {$\Theta(w\log w)$ nodes, shared};
  \node[gray!70] at (0,-2.28) {$\Theta(w)$ gates, duplicated};
\end{circuitikz}
\end{document}
```

*after Fig. 5.20, p. 123.*

**Locate the one place the carry-in enters a prefix adder.** Each bit position of the $w$-bit operands $X,Y$ contributes a 2-bit tuple $X_i=(g_i,a_i)$ — generate $g_i=x_iy_i$ and *alive* $a_i=x_i\vee y_i$ — and the prefix tree composes them under $(g_L,a_L)\circ(g_R,a_R)=(g_L\vee a_Lg_R,\;a_La_R)$, associative by distributivity of AND over OR ([[Parallel Prefix Adders]], Eqs. 5.39-5.43, p. 120). The carry-in appears in that reduction only as the extra rightmost factor $X_{-1}=(c_0,c_0)$ (Eq. 5.48, p. 121). Pull it back out and the whole tree becomes a function of $X,Y$ alone, emitting the $2w$-bit bundle $(G_{i:0},A_{i:0})_{i=0\ldots w-1}$; $c_0$ re-enters afterwards through one composition per bit,

$$c_{i+1}=(G_{i:0},A_{i:0})\circ(c_0,c_0)\Big|_{g}=G_{i:0}\vee A_{i:0}\,c_0.$$

That last line is a **simplified** prefix row in the book's notation (Fig. 5.16, p. 121): no downstream node reads its alive component, so it degenerates from $2\times2\to2$ bits to $2\times1\to1$ bit. It is the entire $c_0$-dependent part of the adder, and it is one gate deep and $w$ wide.

**Asymmetry of cost is the whole idea: the expensive part is $c_0$-free and the $c_0$-dependent part is linear.** The tree costs $w\log_2 w-w+1$ nodes for [[Kogge-Stone Tree]], $(w/2)\log_2 w$ for [[Sklansky Tree]], $2w-2-\log_2 w$ for [[Brent-Kung Tree]] — superlinear or near-linear-with-a-big-constant, and in every case the dominant area. The injection row is $w$ AND-OR cells plus $w$ sum-completion XORs $s_i=p_i\oplus c_i$, where $p_i=x_i\oplus y_i$ is *propagate*, not alive (they differ exactly at $x_i=y_i=1$). Duplicating a $\Theta(w)$ row to avoid rebuilding a $\Theta(w\log w)$ tree is the trade the compound adder makes, and the relative overhead therefore decays like $1/\log_2 w$ — the wider the operand, the better the deal, which is the opposite of how most speculation scales.

**Specialise each copy, because in each copy $c_0$ is a literal.** The generic row is $G\vee Ac_0$; the two instances collapse by absorption over the constant:

$$c_{i+1}^{0}=G_{i:0}\vee A_{i:0}\cdot 0=G_{i:0},\qquad c_{i+1}^{1}=G_{i:0}\vee A_{i:0}\cdot 1=G_{i:0}\vee A_{i:0}.$$

The $c_0=0$ copy needs **no carry logic at all** — the generate prefix *is* the carry — and the $c_0=1$ copy needs one two-input OR per bit. Note that $G_{i:0}\vee A_{i:0}$ does **not** simplify to $A_{i:0}$: a group can generate without being alive (a generate high in the span, a kill at position $0$). So the true incremental cost over a plain prefix adder is $w$ OR gates, $w$ XOR gates and one inverter (position $0$ of the incremented sum is $\overline{p_0}$, since $s_0=p_0\oplus 1$). Both outputs are $w+1$ bits — $c_w^1 s_{w-1}^1\ldots s_0^1$ with $X+Y+1\le 2^{w+1}-1$, so no third format is needed; the exactness argument is the ordinary one in [[Number Formats]].

**Delay is unchanged, which is the point a gate count hides.** The two rows sit side by side at the same depth, so $\tau_\text{compound}=\tau_\text{tree}+\tau_\text{row}=\tau_\text{add}(w)$ exactly. The naive alternative — compute $S=X+Y$, then feed $S$ to an incrementer — puts two carry propagations *in series* and costs $2\tau_\text{add}(w)$ even if the incrementer is itself a prefix structure. The compound adder converts that serial dependence into a fan-out increase: every output of the last tree level now drives two loads instead of one, worth one extra unit of load capacitance on $2w$ nets and nothing on the critical path's logic depth.

**Floating-point rounding is why this circuit is standard rather than a curiosity.** Round-to-nearest of a significand sum returns either the truncated sum or its successor, decided by the guard/round/sticky bits ([[Rounding]]). Sequenced naively that is *add, inspect, increment* — the incrementer lands after the adder in the same cycle. A compound adder produces both candidates concurrently, the sticky logic runs concurrently with the tree, and rounding becomes a single $(w{+}1)$-bit multiplexer: one mux delay instead of one full carry propagation. The book cites [SE01] for this; see [[Floating-Point Operators]].

> [!note] Any circuit whose answer is "the sum, or its successor" wants this shape.
> Rounding is the common case, but the pattern generalises: expose both candidates from one tree and let a late-arriving one-bit decision select. [[Absolute Difference Operator]] is the same trick on $(X,\overline{Y})$ — $X-Y=X+\overline{Y}+1$ and $Y-X=\overline{X+\overline{Y}}$, so the $c_0=1$ row gives one difference and the bitwise-negated $c_0=0$ row gives the other, selected on a sign bit (Fig. 5.21, p. 124). [[Compound Triple Sum]] prepends a half-adder row so that $X+Y+2$ joins the set at the cost of $w$ half adders and three muxes rather than a second tree (Eq. 5.49, p. 125).

**On an FPGA the decomposition does not exist and the overhead jumps to 100%.** The saving above requires *tapping the group generate and alive signals out of the middle of the adder*. On AMD and Intel fabrics the carry propagation runs on hardened, non-programmable carry logic with dedicated inter-BLE routing ([[FPGA Hard Carry Chain Adder]], pp. 125-128) — a fixed chain with no exposed intermediate $G/A$ bus to duplicate. A compound adder therefore instantiates two full chains, $\approx 2w$ LUT/FF pairs instead of $w$. What is free instead is the $+1$: the chain's $c_\text{in}$ is a dedicated input, so `X+Y` and `X+Y+1` are two identical instances differing only in a tied carry-in, at identical delay. Two chains at $\tau_\text{cp}\approx0.015$ ns/bit still beat one soft prefix tree well past 32 bits, so on FPGA the right reading is "buy a second adder", not "buy a second row".

> [!warning] Not covered in the source — needs outside research
> §5.3.7 is a VLSI section and the book never revisits compound adders in §5.4-5.5 on FPGAs. The $2\times$ figure above follows from the hardened-chain structure it does document (pp. 125-128), but no measured LUT counts or $f_\text{max}$ for a compound adder on any FPGA family appear in the text.

$$\boxed{\ c_{i+1}^{0}=G_{i:0},\qquad c_{i+1}^{1}=G_{i:0}\vee A_{i:0},\qquad s_i^{b}=p_i\oplus c_i^{b}\ }$$
$$\boxed{\ \text{overhead over one prefix adder}=w\ \text{OR}+w\ \text{XOR},\qquad \Delta\tau=0\ }$$

**When it breaks.** The structure is exhausted at two outputs: $c_0$ is one bit, so exactly two specialisations exist, and $X+Y+2$ needs the different construction of [[Compound Triple Sum]]. It also presupposes a *prefix* adder — an [[RCA, Ripple-Carry Adder]] has no separable injection row, since $c_0$ enters at the bottom and its effect ripples through every cell, so a compound RCA is literally two adders; the same holds for [[CLA, Carry-Lookahead Adder]] blocks whose $c_0$ threads the block chain. At the other extreme [[Carry-Select Adder]] and [[Conditional-Sum Adder]] already contain both candidate sums per group internally, so extracting a compound output from them is nearly free and the "duplicate one row" framing understates what they give you. If only one of the two results is ever consumed the duplicated row is dead logic that synthesis will delete — the circuit only pays for itself when a genuine late-arriving selector exists, and if that selector arrives *early*, feed it to $c_0$ of a single adder instead and save the row. Finally, both outputs share one tree and therefore one fault cone; this is not a redundancy scheme, and the doubled load on $2w$ nets is a real, if small, dynamic-power cost. Where the choice sits against the whole family: [[Choosing an Adder]].

**In Spade.** Written on the [[Kogge-Stone Tree]] word-level form, where "combine with the neighbour $t$ positions down" is a shift by $t$ on the $w$-bit generate and alive vectors.

```spade
fn compound_ks8(x: uint<8>, y: uint<8>) -> (uint<9>, uint<9>) {
    // shared prefix tree: 3 Kogge-Stone stages, independent of any carry-in
    let g0 = x & y;
    let a0 = x | y;
    let g1 = g0 | (a0 & (g0 << 1));
    let a1 = a0 & ((a0 << 1) | 0x01);
    let g2 = g1 | (a1 & (g1 << 2));
    let a2 = a1 & ((a1 << 2) | 0x03);
    let g3 = g2 | (a2 & (g2 << 4));
    let a3 = a2 & ((a2 << 4) | 0x0f);

    // the one duplicated row: c_{i+1} = G_{i:0} | A_{i:0} c_0, specialised
    let c_lo = g3;              // c_0 = 0  -> the AND-OR collapses away
    let c_hi = g3 | a3;         // c_0 = 1  -> one OR per bit

    // two sum completions: s_i = p_i ^ c_i
    let p = x ^ y;
    let s_lo = p ^ (c_lo << 1);
    let s_hi = p ^ ((c_hi << 1) | 0x01);

    (c_lo.as_bits()[7].as_uint().concat(s_lo),
     c_hi.as_bits()[7].as_uint().concat(s_hi))
}
```

`g3`/`a3` are the $2w$-bit bus leaving the tree block in the diagram; `c_lo` and `c_hi` are the two sum-completion rows, and the entire difference between them is the single `| a3` — one OR gate per bit, exactly the boxed identity. The `| 0x01` on `c_hi << 1` injects $c_0=1$ at position $0$, which is where the incremented sum's $\overline{p_0}$ comes from; the `| 0x01`, `| 0x03`, `| 0x0f` masks inside the tree instead force ones into the alive bits *below* each span so the low columns pass their prefix through untouched. Widths: `+` is never used, so nothing widens implicitly — the $w{+}1$-bit outputs are built explicitly by `concat`, MSB first for integers. It is a `fn`, hence purely combinational: the three stages are logic depth, not pipeline stages. Synthesis will not build the drawing's two symmetric blocks — it constant-folds the $c_0=0$ row into wires and shares the XOR inputs, which is precisely the $\Theta(w)$-versus-$\Theta(w\log w)$ asymmetry the note is about.

**Related notes.**

- [[Parallel Prefix Adders]] – depends-on: supplies the operator, its associativity, and the $X_{-1}=(c_0,c_0)$ factoring that this note pulls back out of the reduction.
- [[Kogge-Stone Tree]] – depends-on: the concrete tree the Spade block instantiates; its last row of simplified nodes is what gets duplicated here.
- [[Sklansky Tree]] – compares: same duplication applies unchanged, at $(w/2)\log_2 w$ tree nodes and fan-out $w/2$.
- [[Brent-Kung Tree]] – compares: the cheapest tree makes the overhead ratio worst, since $\Theta(w)$ duplicated against $\Theta(w)$ shared is no longer a bargain.
- [[Rounding]] – supports: the decision bit that selects between the two outputs, and why it arrives late.
- [[Floating-Point Operators]] – supports: the significand datapath where "sum or successor" is the specification [SE01].
- [[Absolute Difference Operator]] – extends: the same two rows on $(X,\overline{Y})$ give $X-Y$ and $Y-X$, selected on a sign bit.
- [[Compound Triple Sum]] – extends: a half-adder row in front adds $X+Y+2$ to the output set without a second tree.
- [[Carry-Select Adder]] – compares: already computes both carry-in cases per group, so its compound output is nearly free.
- [[Conditional-Sum Adder]] – compares: the recursive form of the same speculation, with the selection in a mux tree rather than a duplicated row.
- [[RCA, Ripple-Carry Adder]] – counter-example: no separable $c_0$ row exists, so a compound RCA costs two full adders.
- [[FPGA Hard Carry Chain Adder]] – counter-example: the hardened chain exposes no intermediate $G/A$ bus, so the FPGA compound adder is two chains at $2\times$ the area.
- [[Choosing an Adder]] – compares: when a second result is worth $\Theta(w)$ gates against just adding twice.
- [[Number Formats]] – supports: why both outputs fit in $w+1$ bits with no rounding anywhere in the adder.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.3.6 Parallel prefix adders, pp. 118-123 — Eqs. 5.44-5.48 (the carry as a prefix of $\circ$, with $g_{-1}=a_{-1}=c_0$); Fig. 5.16, p. 121 (prefix operator and its simplified $2\times1\to1$ version); Figs. 5.18-5.19, pp. 122-123 (Sklansky, Kogge-Stone).
- §5.3.7 Compound fast adder, p. 123 — Fig. 5.20; "the computation that actually depends on $c_0$ is only the bottom line of simplified prefix operators … its size is linear in $w$"; [SE01] for the floating-point significand application, p. 124.
- §5.3.8 Fast absolute difference operator, p. 124 — Fig. 5.21 and the footnote proof of $Y-X=\overline{X+\overline{Y}}$.
- §5.3.9 Fast compound triple sum, p. 125 — Fig. 5.22, Eq. 5.49.
- §5.4 Adders on FPGAs, pp. 125-128 — hardened carry logic and dedicated routing; $\tau_\text{cp}$ from [Xil14], pp. 126-127.
