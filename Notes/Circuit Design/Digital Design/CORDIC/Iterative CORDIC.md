---
title: Iterative CORDIC
description: "One stage folded back on itself: n cycles instead of n stages, much lower area, but it pays for two real barrel shifters and an arctan ROM and loses the reduced-Z trick."
kind: circuit
source: "ASA §20.7, p. 621; iteration (20.26)-(20.27), p. 607"
status: seed
spade: simulated
tags: [digital, cordic, iterative, sequential, fpga]
aliases:
  - Folded CORDIC
  - Sequential CORDIC
  - Iterative CORDIC Architecture
---

# Iterative CORDIC

A single copy of the CORDIC micro-rotation stage wrapped in three state registers and a counter, so that the $n$ iterations happen in $n$ clock cycles instead of $n$ pipeline stages — the only variant of the sin/cos operator that is small rather than fast.

```tikz title="Iterative CORDIC: one micro-rotation stage folded onto three state registers, with the counter and sign control that folding forces into existence"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------------- initialisation muxes
\node[draw,minimum width=1.4cm,minimum height=0.5cm,font=\tiny] (mc) at (1.6,7.0) {mux};
\node[draw,minimum width=1.4cm,minimum height=0.5cm,font=\tiny] (ms) at (5.4,7.0) {mux};
\node[draw,minimum width=1.4cm,minimum height=0.5cm,font=\tiny] (mz) at (9.4,7.0) {mux};
\draw[<-] (1.6,7.25) -- (1.6,7.8) node[above,font=\tiny] {$C_1=1/K$};
\draw[<-] (5.4,7.25) -- (5.4,7.8) node[above,font=\tiny] {$S_1=0$};
\draw[<-] (9.4,7.25) -- (9.4,7.8) node[above,font=\tiny] {$Z_1=Y'$};
% ---------------- state registers
\node[draw,fill=black!8,minimum width=1.5cm,minimum height=0.55cm,font=\tiny] (rc) at (1.6,6.0) {$C_i$ reg};
\node[draw,fill=black!8,minimum width=1.5cm,minimum height=0.55cm,font=\tiny] (rs) at (5.4,6.0) {$S_i$ reg};
\node[draw,fill=black!8,minimum width=1.5cm,minimum height=0.55cm,font=\tiny] (rz) at (9.4,6.0) {$Z_i$ reg};
\draw[->] (1.6,6.75) -- (1.6,6.28);
\draw[->] (5.4,6.75) -- (5.4,6.28);
\draw[->] (9.4,6.75) -- (9.4,6.28);
% ---------------- barrel shifters
\node[draw,minimum width=1.9cm,minimum height=0.6cm,font=\tiny,align=center] (bc) at (1.6,4.6)
  {barrel shifter\\ $\gg i$};
\node[draw,minimum width=1.9cm,minimum height=0.6cm,font=\tiny,align=center] (bs) at (5.4,4.6)
  {barrel shifter\\ $\gg i$};
\draw[->] (1.6,5.72) -- (1.6,4.9);
\draw[->] (5.4,5.72) -- (5.4,4.9);
\node[font=\tiny,anchor=west] at (1.75,5.5) {$-\ell{+}g{+}1$};
\node[font=\tiny,anchor=west] at (5.55,5.5) {$-\ell{+}g{+}1$};
\node[font=\tiny,anchor=west,align=left] at (9.55,5.5) {$-\ell{+}g{+}1$: full width,\\ no reduced-$Z$};
% ---------------- arctan ROM
\node[draw,minimum width=2.4cm,minimum height=0.6cm,font=\tiny,align=center] (rom) at (12.4,4.6)
  {ROM $\alpha_i=\tfrac1\pi\arctan 2^{-i}$\\ $n$ words of $-\ell{+}g$ bits};
\draw[->] (12.4,4.3) -- (12.4,2.9) -- (10.5,2.9);
% ---------------- the two shifted operands cross over
\draw (1.4,4.3) -- (1.4,3.95) -- (5.6,3.95);
\draw[->] (5.6,3.95) -- (5.6,3.2);
\draw (5.2,4.3) -- (5.2,3.65) -- (1.8,3.65);
\draw[->] (1.8,3.65) -- (1.8,3.2);
% ---------------- add / subtract
\node[draw,minimum width=2.0cm,minimum height=0.6cm,font=\tiny] (ac) at (1.6,2.9) {$C_i \mp 2^{-i}S_i$};
\node[draw,minimum width=2.0cm,minimum height=0.6cm,font=\tiny] (as) at (5.4,2.9) {$S_i \pm 2^{-i}C_i$};
\node[draw,minimum width=2.2cm,minimum height=0.6cm,font=\tiny] (az) at (9.4,2.9) {$Z_i \mp \alpha_i$};
\draw[->] (9.4,5.72) -- (9.4,3.2);
% ---------------- d_i : the only data-dependent control
\draw[dashed] (8.65,6.0) -- (8.0,6.0) -- (8.0,3.35) -- (0.9,3.35);
\draw[->,dashed] (0.9,3.35) -- (0.9,3.2);
\draw[->,dashed] (4.7,3.35) -- (4.7,3.2);
\draw[->,dashed] (8.7,3.35) -- (8.7,3.2);
\node[font=\tiny,anchor=west] at (8.1,4.95) {$d_i$, 1 bit};
% ---------------- iteration counter and its bus
\node[draw,minimum width=2.0cm,minimum height=0.6cm,font=\tiny,align=center] (cnt) at (15.4,7.0)
  {counter $i$\\ $1\ldots n$};
\draw[<-] (15.4,7.3) -- (15.4,7.85) node[above,font=\tiny] {\texttt{start}};
\draw[->] (16.4,7.0) -- (17.2,7.0) node[right,font=\tiny] {\texttt{done}};
\draw[dotted,thick] (15.4,6.7) -- (15.4,5.15) -- (0.95,5.15);
\draw[->,dotted,thick] (0.95,5.15) -- (0.95,4.9);
\draw[->,dotted,thick] (4.75,5.15) -- (4.75,4.9);
\draw[->,dotted,thick] (11.7,5.15) -- (11.7,4.9);
\node[font=\tiny,anchor=west] at (15.5,5.6) {$\lceil\log_2 n\rceil$ bits};
% ---------------- feedback returns
\draw[->] (1.6,2.6) -- (1.6,1.7) -- (-1.2,1.7) -- (-1.2,7.0) -- (0.9,7.0);
\draw[->] (5.4,2.6) -- (5.4,1.7) -- (7.3,1.7) -- (7.3,7.0) -- (6.1,7.0);
\draw[->] (9.4,2.6) -- (9.4,1.7) -- (13.6,1.7) -- (13.6,7.0) -- (10.1,7.0);
\node[font=\tiny,anchor=east] at (-1.3,4.6) {$C_{i+1}$};
\node[font=\tiny,anchor=west] at (7.4,2.4) {$S_{i+1}$};
\node[font=\tiny,anchor=west] at (13.7,2.4) {$Z_{i+1}$};
% ---------------- output
\node[draw,minimum width=4.0cm,minimum height=0.55cm,font=\tiny] (rnd) at (3.5,0.75)
  {round to $-\ell$, octant reconstruct};
\draw[->] (1.6,1.7) -- (1.6,1.03);
\draw[->] (5.4,1.7) -- (5.4,1.03);
\draw[->] (3.5,0.47) -- (3.5,-0.1) node[below,font=\tiny] {$(C,S)$, $-\ell+1$ bits each};
% ---------------- legend
\node[anchor=north west,font=\tiny,align=left] at (7.6,1.3)
  {one iteration, executed $n=-\ell+2$ times: $n$ \emph{cycles} per result, not $n$ stages\\
   dotted $=$ shift amount $i$, $\lceil\log_2 n\rceil$ bits --- runtime-variable, so the shifts\\
   \hspace{1em}are two real barrel shifters and the $\alpha_i$ are a ROM, not wiring\\
   dashed $=$ $d_i=\mathrm{sign}(Z_i)$, the only data-dependent control signal\\
   the loop-carried path $Z_i \to d_i \to$ all three adders sets the cycle time};
\end{circuitikz}
\end{document}
```

**Fold the recurrence, not the operator.** The CORDIC iteration $(C_{i+1},S_{i+1},Z_{i+1})=F_i(C_i,S_i,Z_i)$ of [[CORDIC Rotation Mode]] is *uniform in shape and non-uniform in constants*: every $i$ performs the same two shift-add pairs and the same angle subtraction, and only the shift distance $2^{-i}$ and the constant $\alpha_i=\frac1\pi\arctan 2^{-i}$ change. Uniformity of shape is exactly the precondition for time-multiplexing a datapath, so one physical copy of $F$ plus a register per state variable computes all $n$ iterations — the standard fold of a feed-forward chain into a [[Synchronous Sequential Logic]] loop. The state is three registers of $-\ell+g+1$ bits each ($C$, $S$, $Z$), the sequencer is a [[Counters]] instance of $\lceil\log_2 n\rceil$ bits, and the input muxes ([[Multiplexers]]) select between the initial values $(1/K,\,0,\,Y')$ and the feedback. All three state variables carry the fixed-point format of [[Number Formats]] unchanged from the unrolled operator — folding moves hardware in time, never in format. Latency becomes $n=-\ell+2$ **cycles**; throughput becomes one result every $n$ cycles instead of one per cycle.

> [!important] Folding converts the two things that were free into the two things that dominate
> In [[Unrolled CORDIC]] the shift distance $i$ is a compile-time constant per stage, so `>> i` is a relabelling of wires and costs zero logic, and $\alpha_i$ is a hardwired constant that disappears into the adder's LUT mask. Fold the stages together and $i$ becomes a *runtime signal*. A shift by a runtime amount is a barrel shifter; a constant selected by a runtime index is a memory. The book's verdict is blunt: those two structures "consume more logic than the three adders" they exist to serve (p. 621). Iterative CORDIC is therefore not "unrolled CORDIC, slower" — it is a structurally different circuit that happens to compute the same recurrence.

**Price the shifters.** Both $C_i$ and $S_i$ must be shifted right by $i\in[1,n]$, so the operator needs two independent [[Barrel Shifters]] of $-\ell+g+1$ bits, each covering $n$ distances. The canonical logarithmic construction of [[Shifters]] decomposes the distance into its binary digits — shift by $i=\sum_k b_k 2^k$ is a cascade of conditional shifts by $1,2,4,\dots$ — so the cost is $\lceil\log_2 n\rceil$ stages of $(-\ell+g+1)$ two-input multiplexers. On an FPGA a 2:1 mux is one LUT, giving roughly $(-\ell+g+1)\lceil\log_2 n\rceil$ LUTs per shifter, and crucially **none of it uses the fast carry chain**: the carry logic that makes the CORDIC adders cost one LUT per bit does nothing for a mux tree. This is the one place where FPGA and ASIC diverge in the same direction for once — a barrel shifter is expensive on both, but on an FPGA it is expensive *relative to the adders it sits next to*, which is what makes the ratio so unfavourable.

**Price the ROM.** The angle datapath needs $\alpha_i$ for the current $i$, i.e. a table of $n$ words of $-\ell+g$ bits addressed by the counter. Since $n=-\ell+2$, the table has as many entries as the operator has bits of precision — tiny. On an FPGA a 6-input LUT is a $64\times1$ ROM, so for any $n\le 64$ (that is, any $\ell\ge-62$) the whole table is $-\ell+g$ LUTs, one per output bit, in distributed memory; instantiating a [[Block Memory]] granule for $10\times 20$ bits would waste an entire BRAM on a table that fits in twenty LUTs. On an ASIC it synthesises as random logic, and a logic-synthesis tool will share the many identical leading zeros of the $\alpha_i$ (the constants shrink by one bit per $i$).

**Losing the reduced-$Z$ triangle.** [[Reduced-Z CORDIC Datapath]] exploits $|Z_{i+1}|\le\sum_{j>i}\alpha_j<2^{-i}$: the MSB of $Z_i$ has weight $-i$, so in an unrolled operator stage $i$'s angle adder can be $-\ell+g-i+1$ bits rather than $-\ell+g+1$, summing a triangle instead of a rectangle and cutting total area by about $1/6$ (p. 613). One folded adder must serve every $i$, so it must be sized for the widest case, $i=1$. The saving is unavailable — not merely unimplemented, but structurally impossible without a second, narrower adder, which would defeat the fold. The same argument kills any per-iteration width specialisation.

**Add it up.** Write $w=-\ell+g+1$ for the datapath width. Counting one LUT per adder bit (the book's own convention for the $C$/$S$ update on the carry chain, p. 613) and one LUT per mux bit:

$$A_{\text{iter}} \approx \underbrace{3w}_{\text{3 adders}} + \underbrace{2w\lceil\log_2 n\rceil}_{\text{2 barrel shifters}} + \underbrace{w}_{\text{arctan ROM}} + \underbrace{3w}_{\text{init muxes}} \;=\; \big(7+2\lceil\log_2 n\rceil\big)\,w$$

Two consequences fall straight out. First, the book's claim is arithmetic: shifters plus ROM cost $2w\lceil\log_2 n\rceil + w > 3w$ for every $n\ge3$, so the support logic really does outweigh the three adders. Second, against the unrolled cost $\approx2.5(-\ell+g)^2$ LUTs the ratio is $O(\log n / w)$ — at $\ell=-24$, $g=5$, $n=26$ we get $w=30$, $\lceil\log_2 n\rceil=5$, so $17\cdot30=510$ LUTs against $2.5\cdot29^2\approx2100$: about a quarter of the area for $1/26$ of the throughput. **Throughput per area is roughly $6\times$ worse, which is the whole of the chapter's verdict in one number.**

> [!warning] These are structural counts, not measurements
> Chapter 20 publishes no LUT/FF/ns table for any of its architectures, and none at all for the iterative variant beyond the qualitative statement on p. 621. The $2.5(-\ell+g)^2$ figure for unrolled CORDIC is the book's; the barrel-shifter and ROM terms above are the canonical mux-tree and distributed-ROM counts applied at one LUT per mux bit. Device-level numbers need outside research.

**The cycle time is set by a loop, not by a stage.** In the unrolled operator every stage is a pipeline stage, so the clock period is one carry propagation and the $Z_i\to d_i\to Z_{i+1}$ dependency is absorbed by registers between stages. Folded, that dependency becomes loop-carried inside one cycle: $Z_i$ must produce $d_i$, which selects add-or-subtract in all three adders, whose outputs must settle before the next edge. The period is therefore sign-extraction $+$ barrel-shift $+$ one full-width carry-propagate add, and **it cannot be pipelined away** — inserting a register inside the loop would delay $d_i$ past the iteration that needs it, halving throughput to one iteration every two cycles rather than raising $f_{\max}$ usefully. The sole retiming freedom is that $d_i$ depends only on the sign bit of $Z_i$, which is available from the register directly, so the sign path is a wire and not a comparison.

**When the fold is the right call.** Whenever the throughput requirement is below one result per $n$ cycles, the unrolled operator is $n$ copies of hardware sitting idle $(n-1)/n$ of the time, and no amount of arithmetic cleverness recovers that. The fold is also the only variant here whose area is *sub-quadratic* in the precision — linear in $w$ with a $\log$ factor, against $w^2$ for every unrolled architecture in [[Choosing a CORDIC Architecture]] — so at very high precision iterative CORDIC wins on absolute area by a growing margin, at a latency growing linearly in the same $w$.

$$\boxed{\ n=-\ell+2\ \text{cycles per result},\qquad A_{\text{iter}}\approx\big(7+2\lceil\log_2 n\rceil\big)(-\ell+g+1)\ \text{LUTs}\ }$$

**Where it stops being the right circuit.**

- **Any throughput above $1/n$ results per cycle.** There is no middle ground short of partial unrolling ($k$ stages folded $n/k$ times), which reintroduces $k$ barrel shifters and buys back only a factor $k$.
- **The reduced-$Z$ saving is gone**, so the $\approx1/6$ area cut of p. 613 does not apply, and neither does the critical-path benefit it brought (a shorter $Z_i$ making $d_i$ arrive early).
- **Small $\ell$.** At low precision $n$ is small, $\lceil\log_2 n\rceil$ is 2 or 3, and the shifters are cheap — but then the whole operator is small enough that [[Small-Angle Taylor Sine and Cosine]] or a plain tabulation beats every CORDIC variant anyway.
- **The multiplier shortcut does not compose cleanly.** [[Reduced-Iteration CORDIC]] halves $n$ by finishing with two multiplications; folded, those multipliers are used once per result and idle for the other $\lfloor-\ell/2\rfloor$ cycles, which is the same utilisation argument that motivated the fold, now working against it.
- **Where a sibling takes over:** if DSP blocks and block RAM are free, [[Table-and-Multiplier Sine and Cosine]] gives 2–3× the speed at comparable logic and a constant $g=4$; if you need throughput, [[Unrolled CORDIC]]; the folded variant is for the corner where absolute area is the binding constraint.

**RTL (Spade).** One iteration of (20.26)–(20.27), wrapped in the state that makes it iterate. Concrete at $\ell=-8$, $g=3$ — the ROM forces concrete widths — so the datapath is 12 bits and $n=10$.

```spade
fn atan_rom(i: uint<4>) -> int<12> {
    match i {
        1 => 302, 2 => 160, 3 => 81, 4 => 41, 5 => 20,
        6 => 10, 7 => 5,   8 => 3,  9 => 1,  _ => 1,
    }
}

entity cordic_iter(
    clk: clock,
    rst: bool,
    start: bool,
    y: int<12>,
) -> (int<12>, int<12>, bool) {
    decl c_n, s_n, z_n, i_n;

    reg(clk) c: int<12> reset(rst: 0) = c_n;
    reg(clk) s: int<12> reset(rst: 0) = s_n;
    reg(clk) z: int<12> reset(rst: 0) = z_n;
    reg(clk) i: uint<4>  reset(rst: 11) = i_n;

    let done = i == 11;
    let sh: int<12> = zext::<4, 12>(i).as_int();
    let neg = z < 0;
    let a   = atan_rom(i);
    let cs  = c >>> sh;
    let ss  = s >>> sh;

    let c_n = if start { 1759 } else if done { c } else if neg { c +. ss } else { c -. ss };
    let s_n = if start { 0 }    else if done { s } else if neg { s -. cs } else { s +. cs };
    let z_n = if start { y }    else if done { z } else if neg { z +. a }  else { z -. a };
    let i_n = if start { 1 }    else if done { i } else { trunc(i + 1) };

    (c, s, done)
}
```

`c`, `s`, `z` are the three shaded registers; `i` is the counter and is the *only* thing distinguishing one cycle from the next, which is the entire point of the note. `c >>> sh` and `s >>> sh` are the two barrel shifters — one runtime-variable arithmetic right shift each, which synthesis expands into the $\lceil\log_2 n\rceil$-deep mux tree the diagram draws as a box; write `>> 1` instead and the shifter vanishes into wiring, which is exactly the unrolled case. `atan_rom` is the $\alpha_i$ table, a `match` that maps to distributed ROM. `neg` is $d_i$, taken from the sign of the *registered* $Z_i$ so it is combinationally free. The adds use the truncating `+.` / `-.` because the datapath must stay 12 bits — plain `+` would grow to 13 and the fold would need a rounder per iteration; truncation is the correct choice here for the reason given in [[Rounding]] and re-derived for CORDIC in the long-form note. The literal `1759` is $\lfloor 2^{11}/K\rceil$, the pre-cancelled scale factor $1/K$ for $n=10$.

Synthesis will do one thing the drawing does not: the three initialisation muxes are absorbed into the register input LUTs together with the `done` hold, so the `start`/`done` muxing costs no separate level of logic on an FPGA.

Verified with `spade 0.19.0` and simulated through `.zettel/sim.sh` against `$cos`/`$sin` in the testbench: 519 vectors (7 named — including $Y'=0$, $Y'=1\,\mathrm{ulp}$ and $Y'=511$, one ulp below the octant limit $\tfrac14$, where $C$ and $S$ are nothing alike — plus a 512-vector random sweep over $[0,\tfrac14)$), all within 12 ulps of $2^{-11}$, against a modelled worst case of 9.22. Inverting the sign of the $S$ update makes the same testbench report `FAIL` on every vector.

**Related notes.**

- [[Unrolled CORDIC]] – compares: the same recurrence spread over $n$ stages; every cost difference in this note is the difference between "$i$ is a constant" and "$i$ is a signal".
- [[CORDIC Rotation Mode]] – depends-on: supplies the recurrence (20.26)–(20.27), the scale factor $K$ and the convergence argument that fixes $n=-\ell+2$.
- [[Reduced-Z CORDIC Datapath]] – counter-example: the one unrolled optimisation that folding structurally forbids.
- [[Barrel Shifters]] – depends-on: the two runtime shifters are the dominant term in the area formula above.
- [[Shifters]] – depends-on: the $\lceil\log_2 n\rceil$-stage mux-tree construction that the cost count assumes.
- [[Block Memory]] – counter-example: the $\alpha_i$ table is small enough that a BRAM granule is the wrong resource; distributed LUT ROM wins.
- [[Synchronous Sequential Logic]] – supports: the fold is a textbook feed-forward-to-state-machine transformation, and the loop-carried $Z_i\to d_i$ path is what its timing analysis is for.
- [[Choosing a CORDIC Architecture]] – compares: where this sits against the table-and-multiplier and polynomial architectures on throughput per area.
- [[Reduced-Iteration CORDIC]] – extends: halves $n$ with two multipliers, at the cost of multipliers that a folded operator cannot keep busy.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 20 "Fixed-Point Sine and Cosine".

- **20.7**, p. 621 — the iterative variant: several unpipelined cycles per result, two barrel shifters and an $\arctan(2^{-i})$ table, "more logic than the three adders", loss of the Sect. 20.4.5 reduction, and the conclusion that unrolled CORDIC is more efficient in throughput per area.
- **20.4.1**, pp. 606–608 — iteration (20.26)–(20.27), the constants of Table 20.1, p. 607, and Fig. 20.8, p. 608, which the diagram above folds.
- **20.4.3**, pp. 609–610 — $n=-\ell+2$. **20.4.4**, pp. 610–613 — guard bits $g$ and the truncate-don't-round argument. **20.4.5**, p. 613 — the reduced-$Z$ datapath and the $2.5(-\ell+g)^2$ LUT formula.
