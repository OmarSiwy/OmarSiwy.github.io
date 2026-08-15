---
title: Pipeline Synchronization Delay Line
description: "The hardware the scheduler actually emits: a per-signal shift register sized by the cycle gap, so reconverging paths of a DAG meet in the same stage — effSub_d3 is effSub through three registers."
kind: circuit
source: "ASA §A.3.3, pp. 772-774; Fig. A.3, p. 769; §4.3.2, p. 96"
status: seed
spade: simulated
tags: [digital, flopoco, pipelining, registers, fpga]
aliases:
  - Pipeline Delay Line
  - Synchronization Delay Line
  - Pipeline Synchronization Registers
---

# Pipeline Synchronization Delay Line

A chain of $d$ registers carrying one signal unchanged across $d$ pipeline stages, inserted wherever a consumer was scheduled later than its producer — the only structure a DAG pipeliner adds beyond the stage registers that sit on the critical path.

```tikz title="A 4-stage floating-point adder: the add/sub control bit is born in stage 0 and read in stage 3, so three registers are inserted to carry it"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,every node/.style={font=\footnotesize},>=stealth,
   blk/.style={draw,thick,align=center,inner sep=2pt},
   ff/.style={draw,fill=black!10,minimum width=8pt,minimum height=13pt,inner sep=0pt}]

  % ---------- inputs ----------
  \node[anchor=south] at (-4.6,7.15) {\texttt{add/}$\overline{\texttt{sub}}$};
  \node[anchor=south] at (0.6,7.15) {$X_{\mathrm{in}}$};
  \node[anchor=south] at (2.6,7.15) {$Y_{\mathrm{in}}$};
  \node[anchor=west,font=\tiny] at (-4.35,6.85) {1\,b};
  \node[anchor=west,font=\tiny] at (0.75,6.85) {34\,b};
  \node[anchor=west,font=\tiny] at (2.75,6.85) {34\,b};
  \draw[->] (-4.6,7.1) -- (-4.6,6.6);
  \draw[->] (0.6,7.1) -- (0.6,6.6);
  \draw[->] (2.6,7.1) -- (2.6,6.6);

  % ---------- stage 0 ----------
  \node[blk,minimum width=10.6cm,minimum height=0.85cm] (unp) at (-0.2,6.15)
     {unpack \& exception handling, exponent difference \& swap};
  \node[blk,minimum width=1.1cm] (sh) at (3.5,4.95) {$\gg$};
  \draw[->] (3.5,5.72) -- (sh.north);
  \node[anchor=west,font=\tiny] at (3.6,5.4) {24\,b};

  % ---------- pipeline barriers ----------
  \foreach \y/\lab in {4.35/{stage 0 $\to$ 1}, 2.85/{stage 1 $\to$ 2}, 1.35/{stage 2 $\to$ 3}}{
    \draw[dashed,blue!60!black] (-5.8,\y) -- (5.6,\y);
    \node[anchor=west,font=\tiny,blue!60!black] at (5.65,\y) {\lab};
  }

  % ---------- stage 1 ----------
  \node[blk,minimum width=2.6cm] (mant) at (2.4,3.65) {$|M_x \pm M_{y_{\mathrm{sh}}}|$};
  \node[blk,minimum width=0.8cm] (inc)  at (-2.8,3.65) {$+1$};
  \draw[->] (-2.8,5.72) -- (-2.8,4.58);
  \draw[->] (-2.8,4.12) -- (-2.8,3.92);
  \node[anchor=west,font=\tiny] at (-2.72,5.15) {8\,b};
  \draw[->] (3.5,4.12) -- (3.5,3.94) -- (3.0,3.94) -- (3.0,3.92);
  \draw (1.6,5.72) -- (1.6,4.58);
  \draw[->] (1.6,4.12) -- (1.6,3.92);
  \node[anchor=west,font=\tiny] at (1.68,4.75) {24\,b};

  % ---------- stage 2 ----------
  \node[blk,minimum width=2.6cm,align=center] (lzc) at (2.4,2.15) {LZC $+$ shifter};
  \node[blk,minimum width=0.8cm] (sub) at (-2.8,2.15) {$-$};
  \draw[->] (2.4,3.38) -- (2.4,3.12); \draw[->] (2.4,2.62) -- (2.4,2.42);
  \draw[->] (-2.8,3.38) -- (-2.8,3.12); \draw[->] (-2.8,2.62) -- (-2.8,2.42);
  \draw[->] (1.1,2.15) -- (-2.4,2.15);

  % ---------- stage 3 ----------
  \node[blk,minimum width=2.6cm] (rnd) at (2.4,0.55) {rounding adder};
  \draw[->] (2.4,1.88) -- (2.4,1.62); \draw[->] (2.4,1.12) -- (2.4,0.82);
  \node[blk,minimum width=10.6cm,minimum height=0.6cm] (pk) at (-0.2,-0.55)
     {exception handling \& pack};
  \draw[->] (2.4,0.28) -- (2.4,-0.25);
  \draw[->] (-2.8,1.88) -- (-2.8,1.62); \draw[->] (-2.8,1.12) -- (-2.8,-0.25);
  \draw[->] (-0.2,-0.85) -- (-0.2,-1.35);
  \node[anchor=north] at (-0.2,-1.35) {$R$};
  \node[anchor=west,font=\tiny] at (-0.1,-1.15) {34\,b};

  % ---------- the delay line: effSub, produced in stage 0, used in stage 3 ----------
  \draw[very thick,red!70!black] (-5.2,5.72) -- (-5.2,-0.55) -- (-5.7,-0.55);
  \draw[very thick,red!70!black] (-5.7,-0.55) -- (-5.5,-0.55);
  \draw[->,very thick,red!70!black] (-5.2,-0.55) -- (-5.5,-0.55);
  \foreach \y in {4.35,2.85,1.35} \node[ff,fill=red!20] at (-5.2,\y) {};
  \node[ff] at (-2.8,4.35) {}; \node[ff] at (-2.8,2.85) {}; \node[ff] at (-2.8,1.35) {};
  \node[ff] at (2.4,2.85) {};  \node[ff] at (2.4,1.35) {};
  \node[ff] at (3.5,4.35) {}; \node[ff] at (1.6,4.35) {};

  \node[anchor=west,font=\tiny,red!70!black,align=left] at (-5.05,5.35)
     {\texttt{effSub}, 1\,b\\ born in stage 0};
  \node[anchor=west,font=\tiny,red!70!black,align=left] at (-5.05,0.35)
     {\texttt{effSub\_d3}\\ read in stage 3};
  \node[anchor=east,font=\tiny,red!70!black,align=right] at (-5.5,3.6)
     {cycle gap $d=3$\\ width $w=1$\\ $w\cdot d = 3$ FFs};
  \node[anchor=north,font=\tiny,align=center] at (-0.2,-1.95)
     {grey registers: inserted by the same rule on every other reconverging signal;\\
      a signal crossing $d$ barriers costs $w\cdot d$ flip-flops};
\end{circuitikz}
\end{document}
```

*After Fig. A.3b, p. 769; the register chain on `add/`$\overline{\texttt{sub}}$ and the bit widths for $(w_E,w_F)=(8,23)$ are added.*

**Read the delay line off the schedule, never off the drawing.** The pipeliner works on a dependency graph whose nodes are signals and whose edges carry the designer-supplied delay $\delta t$ ([[Frequency-Directed Pipelining]]). Every node $s$ gets a *circuit time* $(c_s,\tau_s)$, where $c_s \in \mathbb{N}$ counts registers on the longest path from an input to $s$ and $\tau_s \in \mathbb{R}$ is the residual combinational delay in seconds since the last register, ordered lexicographically: $(c_1,\tau_1) > (c_2,\tau_2)$ iff $c_1 > c_2$, or $c_1 = c_2$ and $\tau_1 > \tau_2$ (p. 774). The scheduler assigns those times; the delay line is what makes them physically true. Nothing in the drawn datapath tells you a chain is needed — only the difference between two integers does.

**The gap between producer and consumer is an integer, and that integer is the length of the chain.** Let signal $s$ of width $w_s$ bits be scheduled at cycle $c_s$ and read by a statement scheduled at cycle $c_u \ge c_s$. In a combinational netlist the value of $s$ is simply present; in a pipelined netlist it is present for exactly one cycle and then the stage register in front of $s$ is overwritten by the next datum. If $c_u > c_s$ the consumer would read the *wrong operand set* — data belonging to a later input vector. The generation pass therefore rewrites every right-hand-side occurrence of $s$ in that statement with a delayed name and instantiates the registers to back it:

$$s\_d k[n] \;=\; s[n-k], \qquad k \;=\; c_u - c_s .$$

So in the emitted VHDL, `effSub_d3` reads as "signal `effSub`, delayed by 3 cycles" (p. 774). The suffix is not a comment: it names a wire that exists only because three flip-flops were added.

> [!note]
> The correctness argument is entirely local. Given a schedule, inserting $c_u-c_s$ registers on every edge $(s,u)$ makes *every* consumer see the operand set it was scheduled for, with no global reasoning about reconvergence. That is why FloPoCo can promise the pipeline is correctly synchronized while refusing to promise the frequency is met (p. 768) — synchronization is a graph property it fully controls, frequency depends on the backend.

**A chain, because the alternatives are worse.** Three ways to get a value from cycle $c_s$ to cycle $c_u$: hold it in a chain of registers, store it in a small memory addressed by a stage counter, or recompute it in the later stage from operands that happen to have survived. The memory costs an address generator and a read port and is only competitive when many signals share the same gap; recomputation duplicates logic *and* the operands it needs are themselves stale, so it recurses into the same problem. The chain costs $w_s$ flip-flops per cycle of gap and nothing else — no control, no enable, no reset. It is combinational-free, so it never lengthens $\tau$ and can never be the reason the frequency target is missed.

**Total register cost is a sum over signals, and the scheduler does not minimize it.** Since one chain per signal suffices for all of its consumers (the chain is tapped at the deepest one and shorter consumers tap it earlier — or, equivalently, each is a prefix of the same chain),

$$\text{FFs} \;=\; \sum_{s} w_s \left( \max_{u \in \operatorname{succ}(s)} c_u \;-\; c_s \right).$$

FloPoCo's current heuristic schedules **as soon as possible**, which minimizes the *number of cycles* but not this sum (p. 774, footnote 3). ASAP is exactly the policy that maximizes gaps: it pushes every producer as early as its dependences allow, so a control bit computed from the unpacked inputs lands in cycle 0 and then waits three cycles for the rounding stage. Leiserson–Saxe optimal retiming [LS91] would delay such producers to shorten their chains, typically cutting register cost by **20–30 %** [Par22], and is not implemented.

> [!warning] The 20–30 % figure is quoted for the *total* register cost of a retimed FloPoCo pipeline, not for delay lines in isolation. The book gives no breakdown of how much of an operator's register count is synchronization chain versus critical-path staging — needs outside research.

**Counting stages: depth 3 means four of them.** FloPoCo adds no input and no output registers, only the intermediate ones, so the reported pipeline depth counts *synchronization barriers*, and a depth of 3 gives 4 pipeline stages (Fig. A.3a, p. 769). A delay line spanning the whole operator therefore has length equal to the depth, not to the stage count — the red chain in the figure is 3 registers long across 4 stages. This is also why measuring the operator honestly needs [[Register Sandwich]]: without input and output registers there is no register-to-register path to measure.

**On FPGA the first cycle of delay is usually free and the rest is cheap; on ASIC neither is true.** An FPGA basic logic element pairs each LUT with a flip-flop on its output ([[FPGAs]]), so a one-cycle delay on a signal that is already a LUT output consumes a flip-flop that would otherwise sit idle — area zero, routing unchanged. Longer chains are absorbed differently: a LUT5 inside a SLICEM can be configured as a **shift register LUT**, in which the 32 configuration cells are chained as a 32-deep 1-bit shift register whose tap is selected at run time by the LUT inputs, and the book names pipeline synchronization as the motivating use (§4.3.2, p. 96). One LUT5 therefore covers up to 32 cycles of a 1-bit delay, so a $w$-bit line of depth $d$ costs roughly $w\lceil d/32 \rceil$ LUT5s instead of $wd$ flip-flops, at the price of losing reset and losing the synthesizer's freedom to retime through the chain. An ASIC flow has no such primitive: $wd$ flops are $wd$ flops, they burn clock power every cycle, and deep synchronization of wide signals is where a hand-retimed or memory-based design starts to beat the automatic one.

$$\boxed{\ \texttt{s\_d}k[n] = s[n-k],\quad k = c_u - c_s \ ;\qquad \text{FFs} = \sum_{s} w_s\!\left(\max_{u \in \operatorname{succ}(s)} c_u - c_s\right)\ }$$

## When it breaks

- **The graph must be acyclic.** A delay line implements a schedule, and a schedule exists only for a DAG. Accumulators and IIR filters have feedback, no $(c,\tau)$ labelling exists, and FloPoCo does not pipeline them automatically (p. 767, footnote 1).
- **ASAP plus a wide, long-lived signal is the pathological case.** A 34-bit exception/sign bundle carried from stage 0 to stage $d$ costs $34d$ flip-flops for zero arithmetic work. This is where the missing retiming pass would pay.
- **A chain faithfully implements a wrong schedule.** If the designer's `logicDelay`/`adderDelay` model is off, the pipeline is still correctly synchronized — it is just deeper or slower than it should be (p. 772). Synchronization bugs and timing bugs are disjoint failure modes here.
- **No input registers means the caller owns the input timing.** At depth $d>0$ the operator expects a new vector every cycle and holds nothing; the surrounding design must present operands on the cycle the schedule assumes. [[Self-Checking Test Bench]] adapts to this automatically, hand-written harnesses do not.
- **Below $d = 1$ there is nothing to build.** Every consumer in the same cycle as its producer reads the plain wire; the whole construct disappears for a combinational operator, which is the `frequency` unset case.

## RTL (Spade)

```spade
/// One synchronization delay line: `x` delayed by exactly `D` cycles,
/// `W` bits wide. Costs W*D flip-flops and adds zero combinational delay.
entity delay<#uint W, #uint D>(clk: clock, x: uint<W>) -> uint<W> {
    gen if D == 0 {
        x
    } else {
        reg(clk) q = x;
        inst delay::<W, {D - 1}>(clk, q)
    }
}
```

`x` is the red wire leaving the unpack block, `clk` the barrier clock, and the return value is the tapped end feeding the pack block; `inst delay::<1, 3>(clk, eff_sub)` is `effSub_d3` exactly. Width is invariant — no `+`/`trunc` appears, because a delay line is the one datapath element that does not grow bits, which is also why `gen if D == 0` must return `x` unregistered rather than a zero-length chain of registers. The recursion is compile-time only: it unrolls to $D$ `reg(clk)` statements in the same clock domain, so synthesis sees one flat $W\times D$ shift register and is free to infer an SRL for it — the drawing's $D$ discrete boxes become one or two LUTs on an AMD FPGA and stay $W \cdot D$ discrete flops on an ASIC.

Verified by simulation on `delay::<8,3>`: 3005 vectors, including the asymmetric run `01, 80, FF, 00, 01, 02, 04` and a 3000-vector random sweep, each checked against `hist[i-2]` in the testbench. Instantiating `delay::<8,2>` instead fails 2989 of the same 3005, so the check does discriminate the chain length.

## Related Notes

- [[Frequency-Directed Pipelining]] – depends-on: produces the $(c,\tau)$ schedule whose integer gaps are the lengths of these chains.
- [[Pipelined Floating-Point Adder]] – supports: the operator the figure is drawn from, and the source of `effSub_d3`.
- [[Register Sandwich]] – compares: the other register insertion FloPoCo does, added around the operator rather than inside it, and for measurement rather than correctness.
- [[Self-Checking Test Bench]] – supports: adapts its expected-output timing to the depth these chains realize.
- [[Synchronous Sequential Logic]] – depends-on: the single-clock-domain edge-triggered discipline that makes a chain of registers a pure $z^{-d}$.
- [[Dual-Phase Latches]] – counter-example: moves a value across a stage boundary with transparency and time borrowing instead of a hard barrier, which trades away the clean integer $c$ this construct is built on.
- [[FPGAs]] – depends-on: the BLE flip-flop and the SLICEM shift-register LUT that set the real cost.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §A.2.5 *Automatic Pipelining*, pp. 767–769 — pipeline stages, no input/output registers, depth 3 means 4 stages; Fig. A.2, p. 767; Fig. A.3, p. 769.
  - §A.3.3 *Automatic Pipelining*, pp. 772–774 — the three passes, the `effSub_d3` rewriting rule, the *Circuit time* box defining $(c,\tau)$, and footnote 3 on ASAP vs. Leiserson–Saxe retiming.
  - §4.3.2 *Shift Register LUTs*, p. 96 — SRL mode of a SLICEM LUT5, named there as the resource for delaying a signal by several cycles for pipeline synchronization.
- [LS91] Leiserson & Saxe, retiming; [Par22]; [ID17] — cited by the book for the scheduling theory and the FloPoCo implementation respectively.
