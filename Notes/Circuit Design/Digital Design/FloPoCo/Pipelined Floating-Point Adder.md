---
title: "Pipelined Floating-Point Adder"
description: "The canonical worked case: the FPAdd datapath cut by three synchronization barriers into four stages, with the shifter, LZC and rounding adder each landing in a different one."
kind: circuit
source: "ASA §A.2.5, pp. 766-769; §A.3.3, pp. 772-774"
status: seed
spade: simulated
tags: [digital, flopoco, floating-point, pipelining, fpga]
aliases:
  - Pipelined FPAdd
  - FPAdd Pipeline
  - Pipelined Floating-Point Addition
  - Automatically Pipelined Floating-Point Adder
---

# Pipelined Floating-Point Adder

`flopoco frequency=400 FPAdd wE=8 wF=23` is the reference case for automatic
pipelining: the same acyclic datapath, cut by three synchronization barriers
that no human placed and that no line of the operator's source code mentions.

```tikz title="FPAdd cut by three synchronization barriers into four pipeline stages, and the same graph with the registers FloPoCo inserts, including the three-deep delay line on the bypass"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm]
\footnotesize
% ---------- common datapath, drawn twice ----------
\foreach \dx in {0,9.6} {
  \begin{scope}[xshift=\dx cm]
    % blocks
    \draw (0,0) rectangle (7,0.7);
    \node[align=center,font=\tiny] at (3.5,0.35) {unpack \& exception handling,\\ exponent difference \& swap};
    \draw (4.3,-1.2) rectangle (5.6,-0.6); \node[font=\small] at (4.95,-0.9) {$\gg$};
    \draw (2.0,-2.6) rectangle (5.2,-2.0); \node[font=\tiny] at (3.6,-2.3) {$|M_X \pm M_{Y_\mathrm{a}}|$};
    \draw (0.2,-2.6) rectangle (1.1,-2.0); \node[font=\tiny] at (0.65,-2.3) {$+1$};
    \draw (2.6,-4.0) rectangle (4.8,-3.3); \node[font=\tiny] at (3.7,-3.65) {LZC $+$ shifter};
    \draw (0.2,-4.0) rectangle (1.1,-3.4); \node[font=\tiny] at (0.65,-3.7) {$-$};
    \draw (1.6,-5.3) rectangle (4.4,-4.7); \node[font=\tiny] at (3.0,-5.0) {rounding adder};
    \draw (0,-6.5) rectangle (7,-5.8);
    \node[font=\tiny] at (3.5,-6.15) {exception handling \& pack};
    % primary inputs / output
    \draw[<-] (0.9,0.7) -- (0.9,1.35) node[above,font=\tiny] {add$/\overline{\mathrm{sub}}$};
    \draw[<-] (2.6,0.7) -- (2.6,1.35) node[above,font=\tiny] {$X_\mathrm{in}$};
    \draw[<-] (4.4,0.7) -- (4.4,1.35) node[above,font=\tiny] {$Y_\mathrm{in}$};
    \draw[->] (3.5,-6.5) -- (3.5,-7.1) node[below,font=\tiny] {$R$};
    % significand path
    \draw[->] (4.95,0) -- (4.95,-0.6);
    \draw[->] (6.6,0) -- (6.6,-0.9) -- (5.6,-0.9);
    \draw[->] (4.95,-1.2) -- (4.95,-2.0);
    \draw[->] (2.4,0) -- (2.4,-2.0);
    \draw[->] (3.6,-2.6) -- (3.6,-3.3);
    \draw[->] (3.6,-4.0) -- (3.6,-4.7);
    % exponent path
    \draw[->] (0.65,0) -- (0.65,-2.0);
    \draw[->] (0.65,-2.6) -- (0.65,-3.4);
    \draw[->] (2.6,-3.65) -- (1.1,-3.65);
    \draw[->] (0.65,-4.0) -- (0.65,-5.0) -- (1.6,-5.0);
    \draw[->] (3.0,-5.3) -- (3.0,-5.8);
    % the bypass: sign and exception flags, stage 0 straight to stage 3
    \draw[->] (0,-0.2) -- (-0.75,-0.2) -- (-0.75,-6.15) -- (0,-6.15);
  \end{scope}
}
% ---------- panel (a): three synchronization barriers ----------
\draw[dashed] (-1.1,-1.55) -- (7.6,-1.55);
\draw[dashed] (-1.1,-2.95) -- (7.6,-2.95);
\draw[dashed] (-1.1,-4.35) -- (7.6,-4.35);
\node[anchor=west,font=\tiny] at (7.0,-0.9)  {stage 0};
\node[anchor=west,font=\tiny] at (7.0,-2.3)  {stage 1};
\node[anchor=west,font=\tiny] at (7.0,-3.65) {stage 2};
\node[anchor=west,font=\tiny] at (7.0,-5.0)  {stage 3};
% width annotations, binary32: wE = 8, wF = 23
\node[anchor=east,font=\tiny] at (4.85,-0.3) {$M_Y$: $w_F{+}1{=}24$};
\node[anchor=west,font=\tiny] at (5.7,-0.72)  {$d$: $5$ b};
\node[anchor=east,font=\tiny] at (4.85,-1.85) {$M_{Y_\mathrm{a}}$: $w_F{+}3{=}26$};
\node[anchor=west,font=\tiny] at (2.5,-1.3)   {$M_X$: $24$};
\node[anchor=west,font=\tiny] at (3.7,-2.78)  {$M_S$: $w_F{+}4{=}27$};
\node[anchor=west,font=\tiny] at (3.7,-4.55)  {$F_N$: $24$};
\node[anchor=south,font=\tiny] at (1.85,-3.62) {$\lambda$: $5$ b};
\node[anchor=west,font=\tiny] at (0.75,-0.75) {$E_X$: $w_E{=}8$};
\node[anchor=west,font=\tiny] at (0.75,-3.1)  {$9$};
\node[anchor=west,font=\tiny] at (0.75,-4.65) {$w_E{+}2{=}10$};
\node[anchor=east,font=\tiny] at (2.95,-5.55) {$w_E{+}2{+}w_F{=}33$};
\node[anchor=east,font=\tiny,align=right] at (-0.9,-3.3) {$s_R$, exception\\ flags: $4$ b};
\node[font=\tiny,align=center] at (3.2,-7.75) {(a) three barriers, ``pipeline depth 3''};
% ---------- panel (b): registers inserted ----------
\begin{scope}[xshift=9.6cm]
  \foreach \yb in {-1.55,-2.95,-4.35} { \draw[dashed,gray] (-1.1,\yb) -- (7.6,\yb); }
  % edges crossing barrier 1
  \foreach \xr in {-0.75,0.65,2.4,4.95} {
    \draw[fill=white] (\xr-0.17,-1.65) rectangle (\xr+0.17,-1.45);
    \draw (\xr-0.17,-1.62) -- (\xr-0.09,-1.55) -- (\xr-0.17,-1.48);
  }
  % edges crossing barrier 2
  \foreach \xr in {-0.75,0.65,3.6} {
    \draw[fill=white] (\xr-0.17,-3.05) rectangle (\xr+0.17,-2.85);
    \draw (\xr-0.17,-3.02) -- (\xr-0.09,-2.95) -- (\xr-0.17,-2.88);
  }
  % edges crossing barrier 3
  \foreach \xr in {-0.75,0.65,3.6} {
    \draw[fill=white] (\xr-0.17,-4.45) rectangle (\xr+0.17,-4.25);
    \draw (\xr-0.17,-4.42) -- (\xr-0.09,-4.35) -- (\xr-0.17,-4.28);
  }
  \node[anchor=west,font=\tiny,align=left] at (-0.9,-6.95) {leftmost column: a $0$-delay bypass wire\\ still costs one register per barrier};
  \node[font=\tiny,align=center] at (3.2,-7.75) {(b) the registers FloPoCo inserts for it};
\end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. A.3a and A.3b, p. 769.*

**The cut lands between blocks because that is where the delay model says a
cycle ends, not because the blocks are natural.** The floating-point adder is
five serial blocks on one path ([[Floating-Point Operators]]): unpack and
exponent difference, the alignment shifter $\gg$ ([[Barrel Shifters]]), the
significand add/subtract, the fused LZC and normalizing shifter
([[Leading Zero Counters]], [[Normalizers]]), and the rounding adder
([[Rounding]]). Three of those boundaries take a barrier at 400 MHz, and the
result reads as if a designer drew it — shifter alone in stage 0, significand
adder alone in stage 1, LZC and normalizer alone in stage 2, rounding adder and
pack together in stage 3. That coincidence is not architectural insight. It is
the accumulated arrival time crossing $T$ at those points and nowhere else: each
of those blocks is $O(\log w_F)$ deep on $w_F=23$, so each eats most of a cycle
on its own, and the ASAP scheduler has no choice about where the next one starts.
Change `frequency` and the picture changes; the operator's C++ does not.

**Depth counts barriers, and the difference costs you a measurement.** FloPoCo
reports "pipeline depth 3" for panel (a), and there are **four** stages, because
the tool inserts only the intermediate registers — no input registers, no output
registers (p. 768). The same information sits in a comment above each generated
entity. Two consequences follow immediately. First, a naive synthesis run
reports the $f_\max$ of a circuit whose inputs come from pads and whose outputs
go to pads, which is not the register-to-register frequency you asked for; the
fix is [[Register Sandwich]], which wraps the preceding operator on the command
line in exactly the missing two register banks (p. 769). Second, the latency you
must model in a surrounding design is $3$ cycles, not $4$.

**The register bill is columns, not barriers.** Panel (b) is the part of the
transformation that is easy to under-budget. Every edge crossing a dashed line
becomes a register of that edge's width, so barrier 1 alone buys registers for
$E_X$ ($w_E=8$ b), $M_X$ ($w_F{+}1=24$ b) and $M_{Y_\mathrm{a}}$ ($w_F{+}3=26$
b). Worse is the leftmost column: the result sign $s_R$, the effective-operation
bit and the exception flags are produced in stage 0 by wires of **zero** delay
and consumed in stage 3, so they cross all three barriers and need one register
each per crossing — a [[Pipeline Synchronization Delay Line]] whose only job is
to keep a $4$-bit bundle in step with a $27$-bit datapath. Nothing about the
delay model wanted those registers; correctness of synchronization did.

**Where the barriers actually come from is one lexicographic recurrence.** A
signal $s$ carries a scheduled pair $(c,\tau)$ — cycle and offset within the
cycle — and the scheduler ([[Frequency-Directed Pipelining]]) assigns

$$t(s)=\max_i t(p_i)\ \oplus\ \delta_s,$$

the maximum taken lexicographically over the predecessors $p_i$, and $\oplus$
adding $\delta_s$ to $\tau$ with a **carry into $c$ whenever the sum exceeds
$T=1/f$**. At $f=400$ MHz, $T=2.5$ ns. In the zoom of Fig. A.4a (p. 773),
`signX` and `signY` are bare bit selections of delay $0$ and both sit at
$(1,\,13\ \text{ps})$; `effSub <= signX xor signY` is declared with one
`logicDelay()` of $366$ ps, so

$$13\ \text{ps}+366\ \text{ps}=379\ \text{ps}<2.5\ \text{ns},$$

no carry, and `effSub` lands at $(1,\,379\ \text{ps})$ — the label in the figure.
One LUT is $366/2500\approx15\%$ of a cycle here, so about six levels of pure
LUT logic fit in a stage before a barrier is forced. Further down the same graph
a node with the identical $366$ ps delay appears at $(2,\,151\ \text{ps})$: its
predecessors had run the budget out, the $\oplus$ carried, and that single carry
*is* a pipeline register. Every dashed line in panel (a) is one such carry.

> [!important] The transformation contributes exactly zero ulp
> Pipelining rewrites *when* signals are available, never *what* they are: same
> acyclic graph, same widths, same rounding, same verdict from the
> [[Self-Checking Test Bench]], which adapts its own latency to the reported
> depth. This is why the timing model is allowed to be approximate — a wrong
> `logicDelay()` costs frequency or registers, and cannot cost accuracy
> ([[Error Accuracy]]). It is also why step 2 of operator design (add
> `target->` delay calls) provably cannot break step 1 (get the combinatorial
> datapath passing tests).

**On FPGA the same request yields a different cut than on ASIC, by
construction.** `adderDelay(n)` and `logicDelay()` are virtual methods on the
`Target`, so a slower device returns larger numbers and the identical
`frequency=400` produces a deeper pipeline ([[FPGAs]]). The register cost of
that extra depth is also asymmetric: an FPGA slice carries a flip-flop on every
LUT output, so the registers of panel (b) are frequently free in area and the
ASAP scheduler's non-optimality is cheap; on an ASIC every one of those bits is
paid for, and Leiserson–Saxe optimal retiming [LS91] — which FloPoCo does not
implement — would typically recover **20–30 %** of the register cost [Par22]
(p. 774, footnote 3).

$$\boxed{\ \text{reported depth } D \ \Longrightarrow\ D+1 \text{ stages},\quad
t(s)=\max_i t(p_i)\oplus\delta_s,\quad \oplus \text{ carries at } T=1/f\ }$$

$$\boxed{\ \text{registers} \;=\; \sum_{\text{barriers}}\ \sum_{\text{edges crossing it}} w_{\text{edge}}\ \Big|_{\text{FPAdd}(8,23),\,400\,\text{MHz}}\ \text{— including the }4\text{ b bypass, thrice}\ }$$

**When it breaks.**

- **The frequency is not guaranteed.** FloPoCo promises correct synchronization,
  not $f_\max$; the backend is where the circuit becomes a circuit and is the
  proper place for fine tuning (p. 768). Ask, synthesize, measure, re-ask.
- **The schedule is not optimal.** ASAP minimizes the *number of cycles*, not the
  number of registers. On a graph like this one — a wide datapath beside a
  4-bit bypass — that gap is exactly the delay line.
- **Requesting too high a frequency degrades gracefully but silently.** The
  scheduler will keep carrying; you get depth without throughput, and only the
  backend report will say so.
- **The technique assumes an acyclic graph.** It is the definition of an
  operator as a function composed with a rounding that makes the subcomponent
  graph a DAG (p. 766). Accumulators and IIR filters are the stated exceptions
  and are not pipelined this way.
- **If synthesis disagrees, suspect the timing model, not the schedule.** Dump
  `dependencyGraph=full`, find the stage whose accumulated $\tau$ is closest to
  $T$, and check the `Target` call on its longest edge — some `declare()`
  under-declared, and the scheduler faithfully packed too much into that stage.

> [!warning] Not covered in the source — needs outside research
> §A.2.5 gives no numbers for the pipelined FPAdd: no register count, no slice
> or LUT count, no achieved $f_\max$ against the $400$ MHz requested, and no
> comparison of pipeline depth across targets. The only quantitative claims in
> the whole appendix are the $(c,\tau)$ labels of Fig. A.4 and the 20–30 %
> retiming figure. Measuring your own is precisely what [[Register Sandwich]]
> plus the `tools/` synthesis scripts exist for.

**RTL.**

```spade
// Pipelined floating-point adder, toy format wE = 4, wF = 3, bias 7,
// round to nearest ties away, normals only.  bit 7 = sign, bits 6..3 = E,
// bits 2..0 = F.  The three `reg;` are the three barriers of panel (a).
pipeline(3) fp_add8(clk: clock, x: uint<8>, y: uint<8>) -> uint<8> {
    // ---- stage 0: unpack, exponent difference & swap, alignment shifter ----
        let xb = x.as_bits();
        let yb = y.as_bits();
        let ix: uint<7> = xb[0..7].as_uint();       // E_X : F_X read as one integer
        let iy: uint<7> = yb[0..7].as_uint();
        let swap = iy > ix;
        let hi = if swap { iy } else { ix };
        let lo = if swap { ix } else { iy };
        let sr = if swap { yb[7] } else { xb[7] };  // result sign, consumed in stage 3
        let sub = xb[7] != yb[7];                   // effective subtraction
        let hb = hi.as_bits();
        let lb = lo.as_bits();
        let e_hi: uint<4> = hb[3..7].as_uint();
        let one: uint<1> = 1;
        let m_hi: uint<4> = one.concat(hb[0..3].as_uint());
        let m_lo: uint<4> = one.concat(lb[0..3].as_uint());
        let d5 = e_hi - lb[3..7].as_uint();
        let d: uint<3> = if d5 > 6 { 6 } else { trunc(d5) };   // saturate at w_F+3
        let m_hi6: uint<6> = zext::<4, 6>(m_hi) << 2;
        let m_lo6: uint<6> = zext::<4, 6>(m_lo) << 2;
        let m_loa: uint<6> = m_lo6 >> zext::<3, 6>(d);
        let sticky = (m_loa << zext::<3, 6>(d)) != m_lo6;
    reg;
    // ---- stage 1: |M_X +- M_Ya|, and the +1 on the exponent path ----
        let s: uint<7> = if sub { (m_hi6 - m_loa) -. zext::<1, 7>(sticky.as_uint()) }
                         else   { m_hi6 + m_loa };
        let e_p1: int<6> = sext(e_hi.to_int()) +. 1;
    reg;
    // ---- stage 2: LZC + normalizing shifter, and the - on the exponent path ----
        let sb = s.as_bits();
        let lam: uint<3> =
            if sb[6] { 0 } else if sb[5] { 1 } else if sb[4] { 2 } else if sb[3] { 3 }
            else if sb[2] { 4 } else if sb[1] { 5 } else if sb[0] { 6 } else { 7 };
        let n: uint<7> = if lam == 0 { s >> 1 } else { s << zext::<3, 7>(lam -. 1) };
        let e_r: int<6> = e_p1 -. sext(lam.to_int());
    reg;
    // ---- stage 3: rounding adder, pack ----
        let f_n: uint<4> = n.as_bits()[1..5].as_uint();
        let rnd: uint<10> = e_r.as_uint().concat(f_n) +. 1;
        let rb = rnd.as_bits();
        sr.as_uint().concat(rb[4..8].as_uint()).concat(rb[1..4].as_uint())
}
```

The three `reg;` are the three dashed lines of panel (a), in order, and the
stage bodies are the four bands between them: `m_lo6 >> d` is the $\gg$ box,
`m_hi6 ± m_loa` the significand adder, `lam`/`n` the fused LZC and shifter,
`e_r.concat(f_n) +. 1` the rounding adder whose carry crosses the field boundary
into the exponent. `sr` and `sub` are written in stage 0 and read in stages 3
and 1: nothing in the source says "delay them", and the compiler emits the
delay-line flip-flops of panel (b) — that is the whole point of the note, and it
is the same rewriting FloPoCo's third pass performs on the `vhdl` stream.
Widths follow the diagram with $w_E=4,\,w_F=3$: $M_X,M_Y$ on $4$ b,
$M_{Y_\mathrm{a}}$ on $6$, $M_S$ on $7$, $F_N$ on $4$, exponent on $6$.
Synthesis will not build the two shifters written for `sticky` — they fold into
one barrel shifter with an OR tree per stage — and, unlike FloPoCo, Spade
places the barrier where the `reg;` is written rather than where a delay model
puts it.

Simulated in Icarus: 7 named vectors check the reference model itself
($1{+}8$ and $8{+}1$, $1{+}0.5$, the near case $1-1.125$, and the far case
$8+2^{-6}$ in both operand orders, which saturates the alignment shifter), then
all $65536$ input pairs are **streamed one per cycle** — which also checks that
the pipeline stays synchronized under back-to-back operands, not merely that a
single vector survives it. $64488$ produce an in-range normal result and are
compared against an exact-integer round-to-nearest-ties-away reference three
cycles later; $64488$ pass, $0$ fail. The remaining $1048$ land on zero,
subnormal or overflow.

**Related notes.**

- [[Frequency-Directed Pipelining]] – depends-on: supplies the $(c,\tau)$
  schedule and the $\oplus$ carry rule that decides where these three barriers
  fall.
- [[Pipeline Synchronization Delay Line]] – depends-on: the leftmost column of
  panel (b), and the register cost the delay model never asked for.
- [[Register Sandwich]] – supports: the only honest way to measure the $f_\max$
  of an operator FloPoCo deliberately left without input and output registers.
- [[Self-Checking Test Bench]] – supports: adapts to the reported depth, which is
  what makes "same function, different schedule" a checkable claim rather than
  an assertion.
- [[Floating-Point Operators]] – depends-on: the combinatorial datapath being
  cut, and the source of every width on the diagram.
- [[Barrel Shifters]] – depends-on: alone in stage 0; its $\lceil\log_2(w_F{+}2)\rceil$
  depth is most of a cycle at $400$ MHz.
- [[Leading Zero Counters]] – depends-on: with the normalizer it fills stage 2,
  and its saturation case is the one signal the bypass cannot carry.
- [[Normalizers]] – depends-on: fused with the LZC, which is what keeps stage 2
  to a single barrier's worth of delay.
- [[Rounding]] – depends-on: the stage-3 block, one wide increment whose carry
  into the exponent field is why the pack block needs no arithmetic.
- [[Shared Bit Heap]] – counter-example: the other FloPoCo global transformation,
  which *does* change the arithmetic and therefore cannot be applied blindly the
  way this one can.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024,
Appendix A, "Custom Arithmetic Datapath Design with FloPoCo":

- §A.2.5 "Automatic Pipelining, the User Point of View", pp. 766–769 — the
  acyclicity argument and its exceptions (p. 766, incl. footnote 1), the
  `frequency` parameter, Fig. A.2 (p. 767) for the $N$-stage speedup, the
  "no input or output registers / depth counts barriers" remark and the
  non-optimality and non-guarantee caveats (p. 768), Fig. A.3a and A.3b
  (p. 769, redrawn above) and the `RegisterSandwich` hands-on box (p. 769).
- §A.3.1 "Operators and Instances", p. 770 — `declare(delay, name, width)`,
  Listings A.1 and A.2, the source of the `signX`/`effSub` signals used above.
- §A.3.2 "The Target Class Hierarchy", pp. 771–772 — `logicDelay()`,
  `adderDelay(n)`, and why a slower target deepens the pipeline for the same
  request.
- §A.3.3 "Automatic Pipelining, the Implementation", pp. 772–774 — the three
  passes, Fig. A.4 (p. 773) and its $(c,\tau)$ zoom, the ASAP heuristic and the
  20–30 % retiming gap [LS91; Par22] (p. 774, footnote 3), and the "circuit
  time" box defining $\oplus$.
