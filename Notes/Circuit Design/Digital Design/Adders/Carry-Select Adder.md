---
title: "Carry-Select Adder"
description: "Split into m-bit groups, compute both carry-in answers in parallel, select when the carry arrives: doubles the area to replace m carry stages with one mux delay."
kind: circuit
source: "ASA §5.3.2, p. 115"
status: seed
spade: simulated
tags: [digital, adders, carry, speculation, fpga]
aliases:
  - "Carry-Select Adders"
  - "Carry Select Adder"
  - "CSelA"
  - "Variable-Block Carry-Select Adder"
---

# Carry-Select Adder

A carry-select adder cuts the operands into $m$-bit groups and runs each group's carry-propagate adder **twice, speculatively** — once for each possible carry-in — so that the arrival of the real carry costs one multiplexer instead of $m$ carry stages.

```tikz title="16-bit carry-select adder, group size m = 4: the carry chain is a chain of muxes"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize,scale=0.92,transform shape]
  % ---- groups 3,2,1: two speculative CPAs each, then a 5-bit mux ----
  \foreach \g/\hi/\lo [evaluate=\g as \X using -4.5*\g] in {1/7/4,2/11/8,3/15/12} {
    \node at (\X,4.35) {$x_{\hi\ldots\lo},\;y_{\hi\ldots\lo}$};
    \draw[->] (\X,4.05) -- (\X,3.55);
    \node[anchor=west] at (\X+0.08,3.78) {\tiny $2{\times}4$};
    \draw (\X-1.0,3.55) -- (\X+1.0,3.55);
    \draw[->] (\X-1.0,3.55) -- (\X-1.0,3.12);
    \draw[->] (\X+1.0,3.55) -- (\X+1.0,3.12);
    \node[draw,fill=gray!8,align=center,minimum width=1.6cm,minimum height=0.92cm]
      at (\X-1.0,2.66) {CPA\\[-1pt]{\tiny $c_\text{in}\!=\!0$}};
    \node[draw,fill=gray!8,align=center,minimum width=1.6cm,minimum height=0.92cm]
      at (\X+1.0,2.66) {CPA\\[-1pt]{\tiny $c_\text{in}\!=\!1$}};
    \draw[->] (\X-1.0,2.20) -- (\X-1.0,1.73);
    \draw[->] (\X+1.0,2.20) -- (\X+1.0,1.73);
    \node[anchor=east] at (\X-1.06,1.97) {\tiny $5$};
    \node[anchor=west] at (\X+1.06,1.97) {\tiny $5$};
    \node[draw,fill=gray!8,minimum width=3.4cm,minimum height=0.64cm] at (\X,1.41) {MUX};
    \draw[->] (\X,1.09) -- (\X,0.42);
    \node[anchor=west] at (\X+0.08,0.80) {\tiny $4$};
    \node at (\X,0.16) {$s_{\hi\ldots\lo}$};
  }
  % ---- group 0: carry-in is known, so one CPA and no mux ----
  \node[draw,fill=gray!8,minimum width=1.6cm,minimum height=0.92cm] at (0,2.66) {CPA};
  \node at (0,4.35) {$x_{3\ldots0},\;y_{3\ldots0}$};
  \draw[->] (0,4.05) -- (0,3.12);
  \node[anchor=west] at (0.08,3.6) {\tiny $2{\times}4$};
  \draw[->] (2.55,2.66) -- (0.8,2.66);
  \node[anchor=west] at (2.62,2.66) {$c_\text{in}$};
  \draw[->] (0,2.20) -- (0,0.42);
  \node[anchor=west] at (0.08,0.80) {\tiny $4$};
  \node at (0,0.16) {$s_{3\ldots0}$};
  % ---- the carry chain: one wire per group, one mux delay per hop ----
  \draw[very thick,->] (-0.8,2.66) -- (-1.85,2.66) -- (-1.85,1.41) -- (-2.8,1.41);
  \node at (-2.28,1.66) {$c_4$};
  \draw[very thick,->] (-6.2,1.41) -- (-7.3,1.41);  \node at (-6.75,1.66) {$c_8$};
  \draw[very thick,->] (-10.7,1.41) -- (-11.8,1.41); \node at (-11.25,1.66) {$c_{12}$};
  \draw[very thick,->] (-15.2,1.41) -- (-16.55,1.41);
  \node[anchor=east] at (-16.6,1.41) {$c_\text{out}\!=\!s_{16}$};
  % ---- legend + critical path ----
  \node[align=center] at (-7.4,5.2)
    {$X,Y$ : $16$ bits each \quad|\quad $S=c_{16}s_{15}\ldots s_0$ : $17$ bits
     \quad|\quad every carry wire (thick) is $1$ bit};
  \draw[<->,thick] (-16.55,-0.45) -- (0.8,-0.45)
    node[midway,below] {critical path: $\tau_\text{CPA}(4)+3\,\tau_\text{mux}$, \emph{not} $16$ carry stages};
\end{circuitikz}
\end{document}
```

*after Fig. 5.12, p. 115.* The thick wires are the carry chain; note that it now passes **through the muxes**, not through the adders.

**Speculate on the one input you do not have yet.** Cut $X$ and $Y$ into $\lceil w/m\rceil$ groups of $m$ bits. Every input of group $j$ is available at time zero — $x_{jm+m-1\ldots jm}$ and $y_{jm+m-1\ldots jm}$, $m$ bits each — *except* its carry-in $c_{jm}$, which is $1$ bit and is the output of everything to its right. A missing input over a domain of size $2^1$ is not much of a mystery: enumerate it. Group $j$ instantiates two $m$-bit carry-propagate adders on the same operands, one wired with $c_\text{in}=0$ producing $(s^0, c^0)$ and one with $c_\text{in}=1$ producing $(s^1,c^1)$, each $m+1$ bits wide. Both start at time zero and run concurrently with every other group's pair. When $c_{jm}$ finally arrives it does not enter an adder at all; it steers an $(m+1)$-bit 2:1 multiplexer:

$$s_{jm+i}=\overline{c_{jm}}\,s^0_i\vee c_{jm}s^1_i\quad(0\le i<m),\qquad c_{(j+1)m}=\overline{c_{jm}}\,c^0\vee c_{jm}c^1$$

Group $0$ is the exception: its carry-in *is* $c_\text{in}$, known from the start, so it needs one CPA and no mux — visible as the rightmost column of the figure.

**The two speculative carries are the group's prefix pair, computed by brute force.** This is why the trick is principled and not a hack. Carry-out under $c_\text{in}=0$ is $1$ exactly when the group generates a carry internally, so $c^0=G$, the group generate. Carry-out under $c_\text{in}=1$ additionally fires when the group is transparent, so $c^1=G\vee A$ with $A=\prod_i a_i$ the group **alive** signal of [[Parallel Prefix Adders]]. The pair therefore cannot take the value $c^0c^1=10$ — a group that generates is also alive — which the book confirms as Table 5.2, p. 139. Substitute into the carry mux, write $c=c_{jm}$, distribute AND over OR, and collapse $\overline{c}G\vee cG$ **by complementation** $\overline{c}\vee c=1$:

$$c_{(j+1)m}=\overline{c}\,c^0\vee c\,c^1=\overline{c}\,G\vee c(G\vee A)=\underbrace{(\overline{c}\vee c)}_{=1}G\vee A\,c=G\vee A\,c_{jm}$$

which is Eq. (5.13) verbatim, at group granularity. So a carry-select group is a **[[CLA, Carry-Lookahead Adder|carry-lookahead]] group whose $G$ and $A$ are computed by running a whole spare adder** instead of by a two-level AND-OR network. That is the entire architectural trade: CLA spends irregular wide-fan-in logic to get $(G,A)$ cheaply in area; carry-select spends a duplicate CPA to get them with zero new logic *types* and perfectly regular layout. It is also why the pair of speculative sums is exactly a [[Compound Adder]] — the operator that emits $X+Y$ and $X+Y+1$ at once.

**The delay is a chain of muxes, not a chain of carries.** All $\lceil w/m\rceil$ CPA pairs finish at $\tau_\text{CPA}(m)$, in parallel. From then on each hop right-to-left costs exactly one mux, and there are $\lceil w/m\rceil-1$ hops:

$$\tau_\text{add}(w,m)=\tau_\text{CPA}(m)+\Big(\Big\lceil \frac{w}{m}\Big\rceil-1\Big)\tau_\text{mux} \tag{p. 115}$$

Still $O(w)$ — nothing about the topology is logarithmic — but the per-bit constant has changed from $\tau_\text{cp}$ to $\tau_\text{mux}/m$, and $m$ is yours to choose. The inner CPAs are a free parameter too: they can be [[RCA, Ripple-Carry Adder|RCAs]], CLA blocks, or prefix trees, because the construction only ever uses their $(\text{sum},c_\text{out})$ interface.

**Choosing $m$ turns the linear adder into a $\sqrt{w}$ one.** Take RCA groups, so $\tau_\text{CPA}(m)\approx m\,\tau_\text{cp}$, and relax the ceiling to get a differentiable cost:

$$\tau(m)=m\,\tau_\text{cp}+\Big(\frac{w}{m}-1\Big)\tau_\text{mux},\qquad \frac{d\tau}{dm}=\tau_\text{cp}-\frac{w\,\tau_\text{mux}}{m^2}$$

Setting the derivative to zero and taking the positive root gives $m^\star=\sqrt{w\,\tau_\text{mux}/\tau_\text{cp}}$, and $d^2\tau/dm^2=2w\tau_\text{mux}/m^3>0$ confirms a minimum. Back-substituting, $\tau^\star=2\sqrt{w\,\tau_\text{cp}\tau_\text{mux}}-\tau_\text{mux}$ — **$O(\sqrt w)$**, the classic result, and the reason the architecture survived the arrival of the $O(\log w)$ adders. At $\tau_\text{mux}\approx\tau_\text{cp}$ this is just $m^\star\approx\sqrt w$: four-bit groups at $w=16$, as drawn.

> [!warning] The $m^\star$ derivation is not in the source
> The book gives the delay formula and the qualitative advice but never optimises $m$. The two lines above are elementary calculus on its own equation, not a quotation; the closed form matches the standard textbook result (Weste & Harris), but treat the constants as a model, not a datasheet.

**Grow the groups leftward, because the leftmost ones have slack.** Group $j$'s mux cannot fire before $\max\!\big(\tau_\text{CPA}(m_j),\,t_j\big)$ where $t_j$ is its carry's arrival time — so any group whose CPA finishes early is simply idle. The book notes this as a "slight delay improvement" (p. 115); the balance condition that extracts it is to make every CPA finish exactly when its carry lands,

$$\tau_\text{CPA}(m_j)=\tau_\text{CPA}(m_1)+(j-1)\,\tau_\text{mux}\;\Longrightarrow\; m_j=m_1+(j-1)\frac{\tau_\text{mux}}{\tau_\text{cp}}$$

for RCA groups — an arithmetic progression in the group sizes. Summing it, $w=\sum_{j=1}^{k}m_j=k\,m_1+\tfrac{\tau_\text{mux}}{\tau_\text{cp}}\tfrac{k(k-1)}{2}$, so the number of groups $k$ still grows as $\sqrt{w}$ but with roughly half the constant of the uniform partition. This is the **variable-block** carry-select adder; sizes $1,2,3,4,\ldots$ are the $\tau_\text{mux}=\tau_\text{cp}$ special case.

**Area is the honest price: about two adders.** Every group above the least significant carries two $m$-bit CPAs, so the adder logic is $2w-m$ bit-slices instead of $w$ — a shade under $2\times$ — plus $w-m$ sum-select mux bits and $\lceil w/m\rceil-1$ carry-select mux bits. Nothing is shared between the two speculative CPAs, and that is deliberate: sharing would reintroduce a dependency between them and destroy the "both start at time zero" property the whole architecture rests on. Wiring, by contrast, stays local — operands fan out inside a group, and exactly one bit crosses each group boundary — which is what distinguishes carry-select from the prefix trees, where long spans across the full width are the dominant cost.

**Fan-out is bounded by $m$, not by $w$.** Each group carry drives $m+1$ mux select inputs and nothing else, so the load is set by the group size you chose and is independent of $w$. Turning the linear mux chain into a mux *tree* gives the [[Conditional-Sum Adder]] and buys $O(\log w)$ depth, but at the top of that tree one carry drives a $w/2$-bit multiplexer — $w/2$ gate inputs — and the combined capacitance quietly buys the delay back in buffers (p. 116). Carry-select is the point on that curve where fan-out is still free.

> [!important] On FPGAs the arithmetic reverses, and it is not close
> Speculation only pays when a mux is cheaper than $m$ carry stages, i.e. $\tau_\text{mux}<m\,\tau_\text{cp}$. On a Virtex 6 the hardened chain gives $\tau_\text{cp}=0.015$ ns per bit while a mux is general-fabric logic at $\tau_\text{LUT}\ge0.14$ ns *plus routing* (pp. 126–127), so the break-even group size is $m>0.14/0.015\approx9$ bits before routing is even counted — and at $m=9$ you have paid $2\times$ the BLEs to save nothing. Worse, the two speculative CPAs must occupy two distinct hard carry chains with their own placement constraints. Write `+` and take the [[FPGA Hard Carry Chain Adder]]. The one FPGA architecture that does exploit selection, the [[AAM Carry-Select Adder]], only works because it puts the *selection* back onto the fast carry chain rather than into the fabric — and only earns its keep past ~$256$ bits (p. 137).

$$\boxed{\ \tau_\text{add}(w,m)=\tau_\text{CPA}(m)+\Big(\Big\lceil\tfrac{w}{m}\Big\rceil-1\Big)\tau_\text{mux},\qquad m^\star=\sqrt{w\,\tau_\text{mux}/\tau_\text{cp}}\ \Rightarrow\ \tau^\star=O(\sqrt w)\ }$$

**When it breaks.**

- **$w$ small.** Below roughly $m^\star{}^2$ there are only one or two groups and the muxes are pure overhead; a plain [[RCA, Ripple-Carry Adder]] is smaller *and* faster.
- **$w$ large on an ASIC critical path.** $O(\sqrt w)$ loses to $O(\log w)$ eventually. The crossover is where a [[Parallel Prefix Adders|prefix tree]]'s wiring and node count stop being worse than $2\times$ the adder area — in practice tens of bits, after which [[Brent-Kung Tree]] or [[Kogge-Stone Tree]] takes over.
- **Any FPGA target under ~256 bits.** See the callout: the hardened chain makes $\tau_\text{cp}$ an order of magnitude cheaper than the mux you would replace it with.
- **Energy-bound designs.** Half the adder's switching activity is thrown away on every cycle by construction. Speculation is a latency instrument, not a power one.
- **The $\lceil\cdot\rceil$ and the residue.** With $m\nmid w$ the top group is short, so it finishes early and one of its two CPAs is doubly wasted; fold the remainder into the leftmost group, which has the most slack anyway.
- **The delay model.** $\tau_\text{CPA}(m)$ assumes each group regenerates its own carry chain. If the groups are [[Switched Ripple-Carry Adder|switched ripple-carry]] blocks, that is exactly the assumption that fails.

**RTL (Spade).**

```spade
/// One carry-select group: two speculative M-bit CPAs and the mux that picks one.
/// Bit M of the result is the group's carry-out.
fn csel_group<#uint M>(x: uint<M>, y: uint<M>, cin: bool) -> uint<{M + 1}> {
    let s0 = x + y;                              // CPA speculating cin = 0
    let s1: uint<{M + 1}> = trunc(x + y + 1);    // CPA speculating cin = 1
    if cin { s1 } else { s0 }
}

/// 16-bit carry-select adder, group size m = 4 — the figure, bit for bit.
fn csel16(x: uint<16>, y: uint<16>, cin: bool) -> uint<17> {
    let xb = x.as_bits();
    let yb = y.as_bits();
    let g0 = csel_group::<4>(xb[0..4].as_uint(),   yb[0..4].as_uint(),   cin);
    let g1 = csel_group::<4>(xb[4..8].as_uint(),   yb[4..8].as_uint(),   g0.msb());
    let g2 = csel_group::<4>(xb[8..12].as_uint(),  yb[8..12].as_uint(),  g1.msb());
    let g3 = csel_group::<4>(xb[12..16].as_uint(), yb[12..16].as_uint(), g2.msb());
    let s0: uint<4> = trunc(g0);
    let s1: uint<4> = trunc(g1);
    let s2: uint<4> = trunc(g2);
    g3.concat(s2).concat(s1).concat(s0)
}
```

Each `csel_group` is one column of the drawing: `s0`/`s1` are the two CPA boxes, the `if` is the MUX, and `.msb()` taps bit $M$ of the selected result — the thick wire feeding the next group's select. Width arithmetic is the whole correctness argument: `x + y` on two `uint<4>` widens to `uint<5>` for free, but `x + y + 1` widens again to `uint<6>` and must be `trunc`ed back, which is safe because $x+y+1\le 2^{M+1}-1$; `trunc(g)` then drops the carry to leave the $4$ sum bits, and `concat` puts its left operand **high**, so `g3.concat(s2).concat(s1).concat(s0)` assembles $17$ bits MSB-first. Everything is `fn`, hence purely combinational — no clock, no state. Synthesis will *not* reproduce the drawing: common-subexpression elimination collapses the two `+` into one incrementer-plus-adder, and an FPGA tool discards the structure entirely for a single hard carry chain, so read this as the specification of the carry order rather than as a netlist.

**Related Notes (with context).**

- [[RCA, Ripple-Carry Adder]] – depends-on: the block each group instantiates twice, and the baseline whose $m$ carry stages the mux replaces.
- [[Compound Adder]] – depends-on: a speculative group is exactly the operator that emits $X+Y$ and $X+Y+1$ together.
- [[Conditional-Sum Adder]] – extends: same CPA blocks, mux *tree* instead of mux chain, $O(\log w)$ at $w/2$ fan-out.
- [[CLA, Carry-Lookahead Adder]] – compares: computes the same group $(G,A)$ with two-level logic instead of a duplicate adder.
- [[Parallel Prefix Adders]] – compares: $c^0=G$ and $c^1=G\vee A$ make the select mux an instance of the prefix operator at group granularity.
- [[AAM Carry-Select Adder]] – extends: the FPGA-viable descendant, which routes the selection through a ripple-carry chain instead of the fabric.
- [[Choosing an Adder]] – compares: where the $O(\sqrt w)$ point sits against every sibling, by width and target.
- [[FPGA Hard Carry Chain Adder]] – counter-example: hardened $\tau_\text{cp}=0.015$ ns/bit makes speculation a net loss below ~$256$ bits.
- [[Switched Ripple-Carry Adder]] – counter-example: group blocks whose delay is not $m\,\tau_\text{cp}$, which invalidates the choice of $m$.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.3.2 Carry-Select Adder, p. 115 — **Fig. 5.12** (16-bit, $m=4$), the delay formula, the growing-group remark.
- §5.3.3 Recursive Carry-Select Adder (Conditional-Sum), pp. 115–116 — Fig. 5.13, Eqs. 5.16–5.17, the $w/2$ fan-out caveat.
- §5.3.4 Carry-Lookahead Adder, p. 117 — Eqs. 5.18–5.23, the alternative route to $(G,A)$.
- §5.2.2, p. 108 — Eq. 5.7, the $\tau_\text{CPA}(m)$ used for the RCA-group case.
- §5.4 Adders on FPGAs, pp. 126–127 — Virtex 6 carry-chain and LUT timing from [Xil14].
- §5.5.2 Fast combinatorial adders, pp. 138–139 — Fig. 5.30, **Table 5.2** ($c^0c^1=10$ is impossible), Eqs. 5.63–5.66.
