---
title: Fast Carry Chain
description: "A dedicated wire handing one carry bit to the neighbouring BLE, bypassing the switch matrix: a carry crosses a bit 38x faster than it enters one, so below 32 bits carry propagation is not worth optimizing."
kind: circuit
source: "ASA §4.1.1 pp. 90-91 and §5.4, pp. 125-128"
status: seed
spade: simulated
tags: [digital, fpgas, carry, adder, routing]
aliases:
  - Fast Carry Logic
  - Carry Chain
  - Dedicated Carry Chain
  - Hard Carry Chain
  - Carry Chains
---

# Fast Carry Chain

The fast carry chain is a hardened, non-programmable wire plus multiplexer that carries one bit from a BLE to its immediate physical neighbour without touching the switch matrix, which is the only signal path on an FPGA whose per-stage delay is an order of magnitude below a LUT's.

```tikz title="One BLE of an AMD carry chain: the LUT computes the propagate, the hardened MUX and XOR do the rest"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex,line width=0.5pt]
% ---- BLE boundary
\draw[dashed,gray] (-2.1,-0.6) rectangle (7.4,5.3);
\node[gray,anchor=south west,font=\scriptsize] at (-2.05,-0.55) {one BLE};

% ---- LUT box
\draw[fill=black!4] (0.2,3.4) rectangle (2.6,4.7);
\node[align=center,font=\scriptsize] at (1.4,4.05)
  {fracturable LUT6\\[1pt] $p_i=x_i\oplus y_i$};

% ---- operand inputs
\draw[->] (0.8,5.6) -- (0.8,4.7);
\draw[->] (1.9,5.6) -- (1.9,4.7);
\node[anchor=south,font=\scriptsize] at (0.8,5.62) {$x_i$\,(1)};
\node[anchor=south,font=\scriptsize] at (1.9,5.62) {$y_i$\,(1)};

% ---- x_i tapped down the left to the MUX's second input
\fill (0.8,5.25) circle (1.4pt);
\draw (0.8,5.25) -- (-1.6,5.25) -- (-1.6,1.9) -- (4.4,1.9);
\node[anchor=south,font=\scriptsize] at (2.2,1.92) {$x_i$\,(1)};

% ---- carry in, on the dedicated wire
\draw[very thick] (-2.1,3.1) -- (4.4,3.1);
\node[anchor=south east,font=\scriptsize] at (0.15,3.12) {$c_i$\,(1)};

% ---- propagate rail out of the LUT
\draw (2.6,4.05) -- (3.6,4.05);
\fill (3.6,4.05) circle (1.4pt);
\node[anchor=south,font=\scriptsize] at (3.1,4.07) {$p_i$\,(1)};

% ---- carry MUX
\draw[fill=black!4] (4.4,1.4) -- (5.2,1.95) -- (5.2,3.05) -- (4.4,3.6) -- cycle;
\node[font=\scriptsize] at (4.78,2.5) {\textsf{MUX}};
\node[anchor=west,font=\tiny] at (4.42,3.1) {1};
\node[anchor=west,font=\tiny] at (4.42,1.9) {0};

% ---- p_i down to the MUX select and on to the sum XOR
\draw (3.6,4.05) -- (3.6,0.55) -- (4.8,0.55) -- (4.8,1.68);
\node[anchor=east,font=\tiny] at (4.72,0.9) {sel};

% ---- carry out, dedicated wire to the next BLE
\draw[very thick,->] (5.2,2.5) -- (7.4,2.5);
\node[anchor=south east,font=\scriptsize] at (7.35,2.52) {$c_{i+1}$\,(1)};
\node[anchor=north,font=\scriptsize,align=center] at (6.3,2.45)
  {dedicated wire,\\[-1pt] $\tau_{cp}=0.015$\,ns};

% ---- sum XOR
\node[xor port,scale=0.7] (SX) at (6.3,0.35) {};
\draw (3.6,0.55) -- (SX.in 1);
\fill (3.0,3.1) circle (1.4pt);
\draw (3.0,3.1) |- (SX.in 2);
\draw[->] (SX.out) -- (7.4,0.35);
\node[anchor=south east,font=\scriptsize] at (7.35,0.37) {$s_i$\,(1)};
\node[anchor=east,font=\scriptsize] at (7.3,-0.3) {$\tau_{\mathrm{XOR}}=0.21\ldots0.25$\,ns};

% ---- neighbours
\node[gray,anchor=east,font=\scriptsize] at (-2.15,3.1) {from BLE $i-1$};
\node[gray,anchor=west,font=\scriptsize] at (7.45,2.5) {to BLE $i+1$};
\end{circuitikz}
\end{document}
```

*after Fig. 5.23, p. 126.*

**Start from what programmable routing costs, because that is the whole reason this wire exists.** An FPGA's interconnect, not its logic, is what makes an emulated circuit roughly one order of magnitude slower than the same circuit in silicon: wires are longer than they need to be and every signal crosses the switch matrices that make reconfigurability possible, which is also where the bulk of the die area goes (pp. 5, 88). A carry bit is the worst possible customer for that network — it is one bit, it is needed by exactly one physically adjacent cell, and it sits on the critical path of every adder, subtractor, comparator and accumulator on the chip. So every commercial BLE since the mid-1990s hardens it: a non-programmable wire from BLE $i$ to BLE $i+1$, plus the minimum logic to advance the recurrence, all of it outside the reconfigurable fabric (p. 90). This is a resource of [[FPGAs]] in the same sense as a [[DSP Blocks|DSP block]] — free if you use it, silicon you paid for if you do not.

**Rewrite the carry recurrence as a multiplexer, because a mux is the cheapest thing hardened silicon can be.** The textbook carry recurrence of the [[RCA, Ripple-Carry Adder]] is $c_{i+1}=g_i\vee(p_i\wedge c_i)$ with $g_i=x_iy_i$, which needs an AND and an OR on the carry path. Apply **Shannon expansion** of $c_{i+1}$ about $p_i=x_i\oplus y_i$ instead:

$$c_{i+1}\;=\;p_i\,c_{i+1}\big|_{p_i=1}\;\vee\;\overline{p_i}\,c_{i+1}\big|_{p_i=0}.$$

On the branch $p_i=1$ the two operand bits differ, so exactly one of them is $1$ and the sum of the column is $1+c_i$: the carry out equals $c_i$. On the branch $p_i=0$ we have $x_i\oplus y_i=0$, hence $x_i=y_i$ by the **cancellation property of XOR**, so $g_i=x_iy_i=x_i$ and the kill condition $\overline{x_i}\,\overline{y_i}=\overline{x_i}$ — both branches collapse to the single bit $x_i$. Substituting gives the AMD carry-chain relations (eqs. 5.50–5.51, p. 126)

$$p_i=x_i\oplus y_i,\qquad s_i=p_i\oplus c_i,\qquad c_{i+1}=p_i c_i\vee\overline{p_i}\,x_i,$$

every one of $x_i,y_i,p_i,c_i,s_i$ being **1 bit** wide. The right-hand expression is literally `if p_i { c_i } else { x_i }` — a 2:1 multiplexer, which is the form the note's diagram draws and the reason the whole structure reads as a *switched* ripple-carry adder rather than a chain of full adders. Because $y_i$ is equally valid on the $p_i=0$ branch, either operand can be wired to the mux's data input; vendors pick whichever is cheaper to route.

**The mux wins on the only metric that matters here: when the select arrives.** $p_i$ depends on $x_i$ and $y_i$ alone, never on a carry, so all $w$ propagates are computed **in parallel** before the first carry moves. By the time the ripple starts, every select line is already settled and the carry path is a chain of pass gates whose inputs are stable — no gate ever has to wait for two of its inputs. The $g_i\vee p_ic_i$ form cannot do this: its OR gate takes one carry-dependent and one carry-independent input, so the carry sees an AND *and* an OR per stage. That structural difference, not the transistor count, is what buys the order of magnitude.

**The soft LUT does exactly one gate's worth of work, and that is the opening everything else exploits.** The LUT6 computes $p_i$ using **2 of its 6 inputs** ([[Fracturable LUT]]); the XOR that forms $s_i$ and the mux that forms $c_{i+1}$ are hardened. Four LUT inputs per BLE sit idle in an ordinary adder, which is why adders on FPGAs are almost always merged with the logic feeding them at no extra cost. On Intel parts the split is different — the [[Intel ALM]] hardens a *complete* full adder with dedicated wires to its neighbours, leaving both LUT layers entirely free (p. 128) — but the consequence is identical.

**The numbers are what turn this from an architectural note into a design rule.** Virtex 6, speed grade 3, from the vendor datasheet [Xil14] (pp. 126–127):

| Path | Delay |
| --- | --- |
| carry-in → carry-out, whole slice (4 BLEs) | $\le 0.06$ ns |
| carry-in → carry-out, per BLE | $\tau_{cp}=0.015$ ns |
| LUT combinational | $\tau_{\text{LUT}}=0.14\ldots0.32$ ns |
| carry-in → BLE output through the XOR | $\tau_{\text{XOR}}=0.21\ldots0.25$ ns |
| worst-case full adder (in and out of the chain) | $\tau_{fa}=0.57$ ns $=38\,\tau_{cp}$ |

A carry crosses a bit **38 times faster than it enters or leaves one**. There is also a dedicated link carrying a chain from one CLB to the next, again much faster than generic routing, so the ratio does not collapse at slice boundaries. Worst-case adder delays land near **1 ns at $w=8$, 1.5 ns at $w=16$, 2.5 ns at $w=32$** (p. 127).

> [!important] The ripple is no longer the expensive part
> $O(w)$ carry propagation at $0.015$ ns per bit is dominated by the two $O(1)$ terms at either end of it until $w$ is in the hundreds. Below 32 bits, do not think about carry propagation at all — a [[CLA, Carry-Lookahead Adder]] or a [[Parallel Prefix Adders|prefix tree]] replaces cheap chain hops with expensive LUT levels *and* generic routing, and loses. This single fact is why the FPGA branch of [[Adders]] looks nothing like the ASIC branch.

**Two families deviate, and both deviations are about where the XOR lives.** AMD's Versal drops the XOR from the carry chain entirely and replaces the ripple with a `LOOKAHEAD8` unit that computes only the **even** carries $c_0,c_2,c_4,\dots$ of a slice's eight BLEs from the propagates and intermediate carries; the odd carries and all sums are computed in the LUT4s and passed to the neighbour through `cascin`/`cascout` (pp. 127–128). Carry propagation then only ever runs from an even-indexed BLE to the odd one above it. Intel goes the other way: the full adder is hardened outright, so no rewriting is needed, but the chain acquires a placement constraint — it may only start at the 1st or the 6th ALM of a LAB (p. 128). Both are reached transparently through a `+` in the HDL; neither is worth instantiating by hand.

**Worked example — 8-bit addition, $x=109=0110\,1101_2$, $y=54=0011\,0110_2$, $c_0=0$.** Each BLE's LUT holds $p_i=x_i\oplus y_i$, so $p=0101\,1011_2$, and the mux selects $c_i$ when $p_i=1$ and $x_i$ when $p_i=0$:

| $i$ | $x_i$ | $y_i$ | $p_i$ | MUX picks | $c_{i+1}$ | $s_i=p_i\oplus c_i$ |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 1 | 0 | 1 | $c_0=0$ | 0 | 1 |
| 1 | 0 | 1 | 1 | $c_1=0$ | 0 | 1 |
| 2 | 1 | 1 | 0 | $x_2=1$ | 1 | 0 |
| 3 | 1 | 0 | 1 | $c_3=1$ | 1 | 0 |
| 4 | 0 | 1 | 1 | $c_4=1$ | 1 | 0 |
| 5 | 1 | 1 | 0 | $x_5=1$ | 1 | 1 |
| 6 | 1 | 0 | 1 | $c_6=1$ | 1 | 0 |
| 7 | 0 | 0 | 0 | $x_7=0$ | 0 | 1 |

$$s=1010\,0011_2=163=109+54\ \checkmark$$

Rows 2, 5 and 7 are the ones that matter: there $p_i=0$ and the mux breaks the chain, sourcing the carry from $x_i$ instead of from $c_i$. The cost is **8 BLEs** — one LUT6 (2 of 6 inputs used), one carry mux and one FF each, i.e. 2 slices on Virtex 6 or 1 on UltraScale — and the delay is $\tau\approx\tau_{\text{LUT}}+7\tau_{cp}+\tau_{\text{XOR}}=0.32+0.105+0.25\approx0.67$ ns, consistent with the book's $\sim1$ ns once routing to and from the chain is counted. The result is exact: $0$ ulp is introduced by the fabric, and any loss of accuracy is a format decision ([[Number Formats]], [[Error Accuracy]]), never a chain one.

$$\boxed{\ c_{i+1}=p_i c_i\vee\overline{p_i}\,x_i\quad\text{at}\quad \tau_{cp}=0.015\ \text{ns}=\tfrac{1}{38}\tau_{fa}\ }$$

**When it breaks.**

- **The chain is a straight physical line, not a graph.** It runs upward through consecutive BLEs of a column and cannot fork, reverse or skip. Any topology needing a carry to reach a non-adjacent bit — every [[Parallel Prefix Adders|prefix tree]], every carry-select boundary — must leave the chain and re-enter through generic routing, paying $\tau_{\text{XOR}}+\tau_{\text{LUT}}$ plus a routing hop at each transition. That is the real reason fast adders lose here, not the LUT count.
- **It also constrains placement.** A $w$-bit chain pins $w$ BLEs into one column in order; on Intel it may only start at the 1st or 6th ALM of a LAB. A very wide adder can therefore fail to place, or force the rest of the datapath to route around a tall rigid block.
- **You cannot register the middle of it.** The FFs are on the BLE *outputs*; cutting the chain to pipeline a wide adder means splitting it into separate chains joined through generic routing, so the pipelining is not free even though the flip-flops are ([[Basic Logic Element]]).
- **The $38\times$ is one speed grade of one family.** It excludes the routing that gets operands into the LUTs and results out of the BLEs, which is what separates the $0.67$ ns estimate above from the book's $\sim1$ ns measurement. Treat the ratio as an order of magnitude, not a number to compute with.
- **The asymptotics only reassert themselves near 256 bits.** The book's verdict on the classical fast adders is that they are "useless when targeting FPGAs for typical sizes (up to 32 bits)" (p. 134), and even the FPGA-tuned add-add-multiplex carry-select scheme shows a delay benefit only at "256 bits or more" (p. 137) — a width that essentially never occurs outside cryptography and multi-precision arithmetic.
- **The equations are family-specific.** They are the AMD series 4–7 / UltraScale(+) form; Versal has no XOR in the chain and Intel has no mux. Write `+` and let the mapper choose, or your design stops being portable ([[Choosing an FPGA Primitive]]).

**RTL (Spade).**

```spade
/// One BLE of the chain: LUT propagate, hardened sum XOR, carry MUX.
fn ble(x: bool, y: bool, cin: bool) -> (bool, bool) {
    let p = x ^^ y;
    let s = p ^^ cin;
    let cout = if p { cin } else { x };
    (s, cout)
}

fn chain8(x: uint<8>, y: uint<8>, cin: bool) -> uint<9> {
    let a = x.as_bits();
    let b = y.as_bits();
    let (s0, c1) = ble(a[0], b[0], cin);
    let (s1, c2) = ble(a[1], b[1], c1);
    let (s2, c3) = ble(a[2], b[2], c2);
    let (s3, c4) = ble(a[3], b[3], c3);
    let (s4, c5) = ble(a[4], b[4], c4);
    let (s5, c6) = ble(a[5], b[5], c5);
    let (s6, c7) = ble(a[6], b[6], c6);
    let (s7, c8) = ble(a[7], b[7], c7);
    [s0, s1, s2, s3, s4, s5, s6, s7, c8].as_uint()
}
```

`ble` is exactly one dashed box of the diagram: `p` is the LUT6 output, `s` the hardened XOR, `cout` the carry mux with `p` on its select — `^^` is the boolean XOR, since `^` is bitwise and undefined on `bool`. `chain8` is eight of them wired `cN` to `cin`, the dedicated wire being nothing more than a `let` binding here. Widths: `as_bits()` gives `[bool; 8]` with index 0 the LSB, and the returned array is 9 elements — eight sums plus the final carry-out — so `as_uint()` yields the `uint<9>` that $8+8+1$ requires. All of it is combinational: these are `fn`s, so Spade forbids `reg` and `inst` inside them, and the eight-deep dependency on `cin` is a wire chain, not eight cycles. **What synthesis does differently:** nothing, if you write `x + y` instead. The vendor mapper infers `CARRY4`/`CARRY8` from a plain addition; spelling the mux out by hand as above risks the tool implementing `if p { cin } else { x }` in a *second LUT* and never reaching the hard chain at all — the code is a specification of the recurrence, not a recommended coding style.

**Related Notes.**

- [[RCA, Ripple-Carry Adder]] – depends-on: the recurrence this hardens, and the $g\vee pc$ form Shannon expansion converts into the mux.
- [[Adders]] – compares: where the $38\times$ ratio puts every adder topology once the target is an FPGA.
- [[CLA, Carry-Lookahead Adder]] – counter-example: buys $O(\log w)$ carry depth with LUT levels that each cost more than the whole chain it replaces.
- [[Parallel Prefix Adders]] – counter-example: the asymptotically right answer, and the one whose reassociation the chain's fixed physical topology cannot follow.
- [[Basic Logic Element]] – depends-on: the cell the chain threads through, and where its flip-flops sit.
- [[AMD BLE]] – supports: the family whose LUT6-plus-XOR-plus-MUX arrangement the equations above describe.
- [[Intel ALM]] – compares: the same speed reached by hardening the full adder instead of the mux, freeing both LUT layers.
- [[Fracturable LUT]] – supports: why only 2 of 6 LUT inputs are consumed, and what the other 4 are worth.
- [[Choosing an FPGA Primitive]] – compares: when to spend LUTs, a DSP block, or this chain on the same function.
- [[Error Accuracy]] – depends-on: the fabric contributes $0$ ulp, so every error in an adder chain is a format choice.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
- §1.2 "Trends in Digital Technology", pp. 5–6 — reconfigurable routing as the cause of the FPGA–ASIC performance gap.
- §4.1 and §4.1.1, pp. 88–91 — generic FPGA layout, routing as the bulk of the area, the fast carry chain as a BLE resource.
- §5.4 "Adders on FPGAs", p. 125 — fast carry logic named and motivated.
- §5.4.1 "Addition Support on AMD FPGAs", pp. 126–128 — eqs. 5.50–5.51, Fig. 5.23, the switched-RCA reading, Virtex 6 speed-grade-3 timing [Xil14], $\tau_{fa}=38\tau_{cp}$, worst-case delays at $w=8,16,32$, Versal `LOOKAHEAD8` and Fig. 5.24.
- §5.4.2 "Addition Support on Intel FPGAs", p. 128 — hardened FA, LAB chain-start constraint.
- §5.5 "Fast Adders on FPGAs", pp. 134, 137 — classical fast adders "useless" up to 32 bits; the AAM carry-select scheme pays off only at 256 bits or more.
- §5.5.1, p. 135 — LUT:FF ratio near 1, which is what makes pipelining around the chain cheap.
