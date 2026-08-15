---
title: Sequential Constant Divider
description: "One table plus a remainder register clocked m = ceil(w/k) times; table area constant in w, one operand in flight, remainder free because it is the state."
kind: circuit
source: "ASA §13.2.3, Fig. 13.2, pp. 430-434"
status: seed
spade: simulated
tags: [digital, division, constant-divisor, lut, sequential, fpga]
aliases:
  - Iterative Constant Divider
  - Sequential LinArch
  - Folded Constant Divider
  - Digit-Serial Constant Divider
---

# Sequential Constant Divider

The exact constant-division recurrence folded onto a single digit table and one $r$-bit register, clocked $m=\lceil w/k\rceil$ times — the only member of the family whose combinational cost does not grow with the dividend width at all.

```tikz title="Sequential constant divider: one digit table, one remainder register, m cycles"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\footnotesize,
  box/.style={draw, thick, minimum width=13mm, minimum height=9mm},
  sr/.style={draw, thick, minimum width=30mm, minimum height=8mm, align=center}]
  \node[box] (reg) at (2.6,0) {reg};
  \node[box, minimum width=15mm] (lut) at (5.4,0) {LUT};
  \node[sr] (xr) at (9.6,0) {$X$ shift register, $w$ bits\\ shifts out $X_{m-1}$ first};
  \node[sr] (qr) at (5.4,-2.2) {$Q$ shift register, $w$ bits\\ shifts in $Q_{m-1}$ first};
  \node[draw, thick, minimum width=26mm, minimum height=8mm, align=center] (ctr) at (9.6,-2.2)
        {counter mod $m$\\ $\lceil\log_2 m\rceil$ bits};
  % datapath
  \draw[->] (reg.east) -- node[above] {$R_{i+1}$} node[below] {$r$} (lut.west);
  \draw[->] (xr.west) -- node[above] {$X_i$} node[below] {$k$} (lut.east);
  \draw[->] (lut.south) -- node[left] {$Q_i$} node[right] {$k$} (qr.north);
  % feedback R_i -> reg
  \draw[->] (lut.north) -- (5.4,1.35) -- (1.3,1.35) -- (1.3,0) -- (reg.west);
  \node[anchor=south] at (3.9,1.4) {$R_i$, $r$ bits};
  \node[circ] at (2.3,1.35) {};
  \draw[->] (2.3,1.35) -- (2.3,2.25) node[above, align=center] {$R=R_0$\\ valid after $m$ cycles};
  % control
  \draw[->] (2.2,-1.25) node[below] {rst} -- (2.2,-0.45);
  \draw[->] (3.0,-1.25) node[below] {clk} -- (3.0,-0.45);
  \draw[->] (ctr.north) -- node[right] {shift} (xr.south);
  \draw[->] (ctr.west) -- node[above] {shift} (qr.east);
  \node[font=\scriptsize, align=center] at (5.4,-3.4)
    {table: $2^{r+k}$ entries of $r+k$ bits, $D\cdot 2^k$ of them live --- independent of $w$\\
     $m=\lceil w/k\rceil$ cycles per division, one operand in flight};
\end{circuitikz}
\end{document}
```

*after Fig. 13.2, p. 432 — the three shaded boxes there are `reg` and `LUT`; the shift registers and the counter are the sequencing the book leaves implicit and are drawn here because they are where the area actually goes.*

**Fold the space of the chain into time.** The loop body is the one established in [[Constant Division Digit Table]] and unrolled $m$ times in the [[LinArch Divider]]:
$$
\begin{aligned}
&R_m \leftarrow 0\\
&\textbf{for } i=m-1 \textbf{ down to } 0:\qquad Y_i \leftarrow X_i + 2^k R_{i+1},\qquad (Q_i,R_i)\leftarrow\bigl(\lfloor Y_i/D\rfloor,\;Y_i\bmod D\bigr)
\end{aligned}
\tag{Alg. 13.1}
$$
Widths, once and for all: the dividend $X$ is $w$ bits (a $\mathrm{ufix}(w-1,0)$, see [[Number Formats]]), each radix-$2^k$ digit $X_i$ is $k$ bits, every partial remainder is $r=\lceil\log_2(D-1)\rceil$ bits — also the width of $D$ itself, since $D$ is not a power of two — the table address $Y_i=R_{i+1}\Vert X_i$ is $k+r$ bits by Lemma 13.2 ($0\le Y_i\le 2^kD-1$), and each quotient digit $Q_i$ is $k$ bits, assembling to a $w$-bit $Q$ with no carry between digits. Nothing in that list mentions $w$ except $X$ and $Q$. **The loop body is therefore a fixed object**, and the only question is whether you instantiate it $m$ times in space or once in time. The unrolled and sequential architectures are the same recurrence under that one choice.

**The register holds an invariant, which is why the remainder costs nothing.** Every iteration writes $R_i = Y_i \bmod D$ back into the same $r$-bit register, so after the final iteration the register's input carries $R_0$ — and by the telescoping argument of [[LinArch Divider]], $R_0$ *is* the exact Euclidean remainder. There is no subtraction, no comparison and no correction step anywhere in the circuit. Contrast the whole general-divider family in [[Dividers]]: [[Restoring Division]] pays a full-width subtract-and-restore per bit, [[Non-Restoring Division]] hides the restore in the next step's sign, and even [[SRT Division]] carries the partial remainder in a redundant form that needs a final conversion. Here the partial remainder is $r$ bits wide — two, for $D=3$ — for the entire run, because Lemma 13.2 bounds it before the circuit is built rather than after.

**One iteration is a synchronous Mealy step, so the control is a counter and nothing else.** The datapath has exactly one loop-carried dependency, $R$, and it advances once per clock, which makes this the plainest possible [[Synchronous Sequential Logic]]: no state machine, no branch, no data-dependent iteration count. Load $X$, reset $R$ to $0$, clock $m=\lceil w/k\rceil$ times, read $Q$ and $R$. The sequencer is a mod-$m$ [[Counters|counter]] of $\lceil\log_2 m\rceil$ bits, one $w$-bit shift register presenting $X$ MSB digit first at $k$ bits per cycle, and one $w$-bit shift register catching $Q_i$ MSB digit first. Because the digit stream must arrive most-significant first and the quotient emerges in the same order, both shift registers shift in the same direction and neither needs a barrel shifter.

**Folding buys peak area, not area-time product — and that is the honest reason the book keeps only the unrolled form.** The book's cost for this architecture is the table alone,
$$A_{\text{seq}} \sim 2^{r+k}(r+k)\ \text{bits}\qquad\text{against}\qquad A_{\text{LinArch}}\sim\left\lceil\frac{w}{k}\right\rceil2^{r+k}(r+k)$$
a factor $m$ smaller, at latency $m$ cycles instead of one combinational sweep and throughput $1/m$ instead of one division per cycle once LinArch is pipelined. Multiply area by time and the two are the same circuit: $m$ tables running $m$ divisions concurrently, or one table running them one after another. What the fold genuinely buys is a *bounded footprint* — the combinational core of a 128-bit divider is identical to that of a 16-bit one — and what it genuinely costs is the loop control, which the model above does not count. Add it back and the sequential operator holds $2w$ flip-flops of shift register plus $\lceil\log_2 m\rceil$ of counter plus $r$ of state: **linear in $w$ in flip-flops even though it is constant in $w$ in table bits.** On an FPGA that is cheap (shift registers map into LUT-based SRL primitives rather than fabric flip-flops, see [[FPGAs]]); in ASIC it is often the larger of the two terms.

**Radix choice is the same optimisation as in the unrolled case, read for cycles instead of stages.** Larger $k$ means fewer iterations, $m=\lceil w/k\rceil$, but a table exponential in $k$. On a LUT$\alpha$ fabric the table costs nothing extra until $r+k$ exceeds $\alpha$, so take the smallest $k$ with $r+k\ge\alpha$, i.e. $k=\alpha-r$ when $r<\alpha$ — the identical argument, and the identical answer, as in [[LinArch Divider]]. For $D=3$ on a 6-LUT fabric that is $r=2$, $k=4$, radix 16: the book states outright that "implementing the core loop, i.e. the sequential part of Fig. 13.2, costs 6 LUT6 (for a 6 bits in, 6 bits out table)" (p. 434). Eight cycles then divide a 32-bit integer by 3 in six LUT6 of combinational logic; thirty-two cycles divide a 128-bit one in the same six.

$$\boxed{\ (Q_i,R_i)=\mathrm{tbl}\bigl(R_{i+1}\Vert X_i\bigr),\ R_m=0\ \ \text{clocked}\ m=\left\lceil\frac{w}{k}\right\rceil\ \text{times};\qquad A_{\text{table}}\sim2^{r+k}(r+k)\ \text{bits, independent of}\ w\ }$$

> [!warning] No synthesis numbers exist for this architecture
> Every measured figure in Chapter 13 — Tables 13.2 to 13.5 — is for LinArch, BTCD, Recip or a composite of them. The book gives the sequential form one paragraph (§13.2.3), one figure and the asymptotic $2^{r+k}(r+k)$, then explicitly focuses on the unrolled variant "because it enables high-throughput pipelined implementations" (p. 432). The 6-LUT6 core-loop figure above is the only concrete cost it publishes. Area and delay claims for this circuit are model-only; measure before you budget.

> [!warning] Index direction is inconsistent in Fig. 13.2
> The figure labels the register output $R_{i-1}$ and the table output $R_i$, an ascending-index convention, while Alg. 13.1 sweeps $i$ downwards and needs $R_{i+1}$ in, $R_i$ out. The circuit is the same either way — one register between two consecutive remainders — but reading the figure and the algorithm side by side, the loop appears to run backwards. This note uses the algorithm's direction throughout, matching Fig. 13.3 on the facing page.

When it breaks:

- **It cannot be pipelined.** The register is a genuine loop-carried dependency, so the clock period is bounded below by one full table lookup and no amount of retiming shortens the $m$-cycle latency. The only way to fill the pipeline is $m$-fold interleaving of independent dividends — which needs $m$ copies of the $r$-bit state (cheap) and $m$ copies of both shift registers (not cheap), at which point you have rebuilt a pipelined [[LinArch Divider]] with worse control.
- **It only pays off when $m$ is large.** For $w=32$, $D=3$, the entire unrolled divider measures 32 LUT on Kintex-7 (Table 13.2, p. 435) against a 6 LUT6 sequential core — but the counter and two 32-bit shift registers erase that margin, and you have given up a factor of eight in latency to break even. The fold is worth it at $w=128$ and up, or when the divider is a rare operation sharing a slow bus.
- **The dividend must be available MSB digit first.** A carry-propagate adder consumes a least-significant-first stream naturally; this recurrence runs from the top of the number instead. An LSB-first digit stream must therefore be buffered in full, which is the $w$-bit shift register and cancels the "constant in $w$" claim for streaming use.
- **$r\ge\alpha$, i.e. $D\ge 2^\alpha$.** The table's $2^{r+k-\alpha}$ term reappears and $k$ collapses to 1, so $m=w$: one cycle per input *bit*. Factor the divisor instead — [[Composite Constant Divider]] — noting that a composite divider folds into two sequential stages that can share a clock but not a table.
- **$D$ must be a synthesis-time constant that is not a power of two.** A power of two is a wire shift; a runtime divisor puts you back in [[Dividers]].

RTL (Spade) — one iteration, the whole circuit:

```spade
/// One iteration of Alg. 13.1: the digit table plus the remainder register.
/// D, K (radix digit width) and R (remainder width, ceil(log2(D-1))) are
/// synthesis-time constants. Clock this m = ceil(w/K) times per division.
entity div_step<#uint D, #uint K, #uint R>(
    clk: clock, rst: bool, xd: uint<K>,
) -> (uint<K>, uint<R>) {
    decl r_next;
    reg(clk) r_in: uint<R> reset(rst: 0) = r_next;   // holds R_{i+1}; rst gives R_m = 0
    let y: uint<{R + K}> = r_in.concat(xd);          // Y_i = X_i + 2^K R_{i+1}: pure wiring
    let d: uint<{R + K}> = D;
    let q:           uint<{R + K}> = y `std::ops::comb_div` d;
    let r_next_full: uint<{R + K}> = y `std::ops::comb_mod` d;
    let r_next: uint<R> = trunc(r_next_full);        // R_i, r bits by Lemma 13.2
    (trunc(q), r_next)                               // (Q_i, R_i), both combinational
}
```

`r_in` is the `reg` box of the diagram and `concat` is the wire that forms $Y_i$ — `concat` on integers puts its left operand high, so the remainder sits above the digit and no adder appears. `comb_div`/`comb_mod` by the constant `d` lower to Verilog `/` and `%` against a literal, which synthesis constant-folds into exactly the $(r{+}k)$-in, $(r{+}k)$-out table the drawing shows; the two `trunc`s are free, since $Q_i\le 2^k-1$ and $R_i\le D-1$ are both theorems, not assumptions. Note what is *not* in the entity: the counter and the two shift registers, because one iteration is the reusable object and the sequencing around it belongs to the caller — which is exactly the split the book's Fig. 13.2 draws and the reason its cost model stops at the table. Verified by monomorphising `div_step::<3, 4, 2>` and clocking it eight times per dividend against a behavioural reference: 3006 vectors pass, including $X=1$ and $X=2^{31}$, the asymmetric pair that fails immediately if the digits are fed least-significant first.

Related Notes:

- [[Constant Division Digit Table]] – depends-on: supplies the loop body, the bound $Y_i\le2^kD-1$ and the digit property that keeps $Q_i$ carry-free.
- [[LinArch Divider]] – compares: the same recurrence unrolled in space instead of time; identical area-time product, opposite peak-area and throughput trade.
- [[Binary Tree Constant Divider]] – counter-example: the dependency this note serialises can instead be reassociated into a tree, for $O(\log w)$ latency at $w\log w$ area.
- [[Composite Constant Divider]] – extends: factoring $D$ shortens each chain, and each factor's divider can be folded like this one.
- [[Restoring Division]] – compares: the general iterative divider, whose iteration is a full-width subtract-and-restore rather than a fixed-size lookup.
- [[Non-Restoring Division]] – compares: same digit-recurrence shape, but with a signed partial remainder and a final correction this circuit never needs.
- [[SRT Division]] – compares: a runtime divisor forces quotient-digit selection and redundancy; a constant divisor makes the selection a table read.
- [[Synchronous Sequential Logic]] – depends-on: the register, reset and mod-$m$ counter that turn the recurrence into a clocked loop.
- [[Choosing a Constant Divider]] – compares: where the folded form sits against every sibling on area, latency and throughput.
- [[Dividers]] – compares: the general operators this replaces when $D$ is known at synthesis time.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 13:

- §13.2.2 Algorithm 13.1, Eq. (13.3) for $r$, Theorem 13.1 and Lemmas 13.1–13.2 — pp. 431–432
- §13.2.3 Iterative or unrolled implementation of the basic recurrence; Fig. 13.2 — p. 432
- §13.2.4 Cost evaluation, $A_{\text{seq}}\sim2^{r+k}(r+k)$ — p. 433
- §13.2.5 FPGA-specific remarks; cost of the core loop as 6 LUT6 for $D=3$, $k=4$ — p. 434
- Table 13.2 (LinArch at $w=32$ on Kintex-7, used here only as the unrolled baseline) — p. 435
- §13.1, "some of them also provide the remainder of the division for free" — p. 429

Primary source: [DD12] de Dinechin & Didier, "Table-Based Division by Small Integer Constants", ARC 2012.
