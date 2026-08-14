---
title: "FSMD Controller-Datapath Split"
description: "Wide data in registers and operators, narrow schedule in a control FSM, so an 8-bit accumulator is one register instead of 256 states — and the status-flag-to-control-word loop becomes the critical path."
kind: circuit
source: "0.4) Synchronous Sequential Logic §Datapath plus control, §Pipelining and retiming — no book source"
status: seed
spade: simulated
tags: [digital, synchronous-sequential-logic, fsmd, datapath, control]
aliases:
  - FSMD
  - Finite State Machine with Datapath
  - Controller-Datapath Split
  - Control-Datapath Partitioning
  - Datapath plus Control
---

# FSMD Controller-Datapath Split

A sequential design factored into a narrow control FSM holding only the schedule and a wide datapath holding only the numbers, coupled by an $m$-bit control word downward and a $k$-bit status vector upward, with $m$ and $k$ independent of the data width.

```tikz title="FSMD: control FSM and datapath coupled by an m-bit control word and a k-bit status vector, with the status loop marked"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % ===== control FSM =====
  \draw[thick] (-0.2,2.45) rectangle (5.4,4.45);
  \node[anchor=west] at (-0.15,4.2) {\bfseries control FSM};

  \draw (0.4,2.85) rectangle (1.7,3.65);
  \node at (1.05,3.25) {$\delta$};
  \draw (2.2,2.85) rectangle (3.4,3.65);
  \node at (2.8,3.25) {$q$};
  \draw (3.9,2.85) rectangle (4.9,3.65);
  \node at (4.4,3.25) {$\lambda$};

  \draw[->] (1.7,3.25) -- (2.2,3.25);
  \draw (3.4,3.25) -- (3.9,3.25);
  \node[anchor=south] at (2.85,3.68) {$\lceil\log_2 N\rceil$};

  % q feedback into delta
  \fill (3.65,3.25) circle (1.5pt);
  \draw[->] (3.65,3.25) -- (3.65,2.62) -- (0.15,2.62) -- (0.15,3.05) -- (0.4,3.05);

  % ===== datapath =====
  \draw[thick] (-0.2,-2.05) rectangle (10.5,1.05);
  \node[anchor=east] at (10.4,0.78) {\bfseries datapath};

  \draw (0.5,-1.5) rectangle (1.7,0.6);
  \node at (1.1,-0.45) {mux};
  \draw (2.6,-1.5) rectangle (3.9,0.6);
  \node at (3.25,-0.45) {$R$};
  \draw (4.9,-1.5) rectangle (6.4,0.6);
  \node at (5.65,-0.45) {$+\,/-$};
  \draw (7.6,-1.5) rectangle (9.2,0.6);
  \node at (8.4,-0.2) {$=0$, sign,};
  \node at (8.4,-0.7) {cmp};

  \draw[->] (-1.9,-0.45) -- (0.5,-0.45);
  \node[anchor=south] at (-1.0,-0.4) {$x$ \,($n$)};
  \draw[->] (1.7,-0.45) -- (2.6,-0.45);
  \draw[->] (3.9,-0.45) -- (4.9,-0.45);
  \node[anchor=south] at (4.4,-0.4) {$n$};
  \draw[->] (6.4,-0.45) -- (7.6,-0.45);

  % writeback loop inside the datapath
  \fill (7.1,-0.45) circle (1.5pt);
  \draw[->] (7.1,-0.45) -- (7.1,-1.78) -- (0.15,-1.78) -- (0.15,-1.05) -- (0.5,-1.05);

  % result out
  \fill (4.45,-0.45) circle (1.5pt);
  \draw[->] (4.45,-0.45) -- (4.45,-2.75);
  \node[anchor=north] at (4.45,-2.75) {result \,($n$)};

  % ===== control word, FSM -> datapath =====
  \draw[very thick] (4.9,3.25) -- (6.6,3.25) -- (6.6,0.85);
  \draw[very thick] (1.1,0.85) -- (6.6,0.85);
  \draw[very thick,->] (1.1,0.85) -- (1.1,0.6);
  \draw[very thick,->] (3.25,0.85) -- (3.25,0.6);
  \draw[very thick,->] (5.65,0.85) -- (5.65,0.6);
  \node[anchor=east] at (6.45,1.85) {$c$ \,($m$ bits): mux sel, reg enable, op mode};

  % ===== status, datapath -> FSM =====
  \draw[very thick] (9.2,-0.45) -- (11.3,-0.45) -- (11.3,5.0) -- (-1.5,5.0) -- (-1.5,3.45);
  \draw[very thick,->] (-1.5,3.45) -- (0.4,3.45);
  \node[anchor=south] at (4.9,5.05) {$s$ \,($k$ bits): zero, sign, comparison, done};

  % ===== the loop that sets fmax =====
  \draw[dashed] (12.0,-0.9) -- (12.0,5.45);
  \node[anchor=west,align=left] at (12.1,2.3)
    {critical loop\\ $s\to\delta\to q\to\lambda\to c\to$\\ datapath $\to s$\\ 2 registers, no\\ pipelining allowed};

  % ===== external control =====
  \draw[->] (-1.05,1.55) -- (-1.05,3.25) -- (0.4,3.25);
  \node[anchor=north] at (-1.05,1.5) {start, rst \,(2)};

\end{circuitikz}
\end{document}
```

*Own construction; the $\delta$–$q$–$\lambda$ interior is the structure of [[Canonical FSM Structure]].*

**Factor the state space instead of enumerating it.** A synchronous machine's state is the contents of every flop it owns. Flatten a design with a $N$-step schedule and datapath registers $R_1,\dots,R_j$ of widths $w_1,\dots,w_j$ into a single FSM and the state count is the product

$$|Q_{\text{flat}}| \;=\; N \cdot \prod_{r=1}^{j} 2^{w_r}$$

so an 8-bit accumulator alone, with $N=1$, is $256$ states, and adding a second 8-bit register makes it $65\,536$. Enumeration is hopeless not because the flops are many — $\lceil\log_2 |Q_{\text{flat}}|\rceil = \lceil\log_2 N\rceil + \sum_r w_r$ is a modest register — but because $\delta$ written as a transition *table* over that state is exponential in the data width. What rescues it is that the transition relation on the datapath component is not arbitrary. Each register's next value is $R_r^{+} = f_{c}(R_1,\dots,R_j,x)$ where $f_c$ ranges over a handful of operators selected by a control word $c$, and $c$ depends on the data only through a few reduced status bits. That is a *product* structure, and FSMD is the decision to encode the two factors separately rather than to encode their product.

**A bit belongs in the control FSM only when the logic branches on it.** This is the whole partitioning rule and it is sharper than "control is narrow, data is wide". An 8-bit accumulator sum is never a branch condition, so it is a register; the fact that the sum has reached zero *is* a branch condition, so it is a status bit and the zero-detect that produces it is the boundary. Concretely the two buses are

- **control word $c \in \{0,1\}^m$** — one select field of $\lceil\log_2(\text{fan-in})\rceil$ bits per [[Multiplexers|mux]], one enable per register, a few operator-mode bits (add/subtract, shift direction, carry-in). $m$ is $O(j + \#\text{muxes})$ and does not grow with $n$.
- **status vector $s \in \{0,1\}^k$** — a zero flag (an OR-reduce of $n$ bits, depth $\lceil\log_2 n\rceil$ by associativity of $\vee$), a sign bit (the MSB, a wire, per the two's-complement weighting in [[Number Formats]]), a [[Magnitude Comparator]] output, a counter-terminal flag, handshake ready/valid. $k$ is typically single-digit.

Every one of those status producers is a *reduction* from $n$ bits to one, and every one of them is drawn inside the datapath. That placement is not cosmetic: let a raw data bit reach $\delta$ and $\delta$'s fan-in starts growing with $n$, the state encoding stops being separable from the data, and the factorisation that made the design tractable is gone. The narrowness of $s$ is what is being bought.

**The status loop is the one cycle neither pipelining nor retiming can shorten.** Follow the drawing: $R \to$ status logic $\to \delta \to q \to \lambda \to c \to$ mux and operator $\to R$. That is a directed cycle in the circuit graph, and [[Retiming]] conserves register count around any directed cycle, so the iteration bound

$$T_c \;\ge\; \frac{t_{s} + t_{\delta} + t_{\lambda} + t_{\text{mux}} + t_{\text{op}}}{2}$$

holds no matter where the tool moves flops — the $2$ being the two registers $q$ and $R$ that the cycle contains. [[Pipeline Register Insertion]] does not apply at all: pipelining cuts *feed-forward* paths, and inserting a register into a cycle builds a different machine rather than a faster one. This is why a three-gate comparator can be the critical path of a design whose multiplier is thirty gates deep. The multiplier sits feed-forward between two registers and can be cut into as many stages as you like; the comparator sits in the loop and cannot be cut at all.

> [!important] The loop is the design's clock period, and its length is a partitioning decision, not a synthesis one.
> Everything a synthesiser is good at — balancing logic, retiming, restructuring — is powerless here, because the bound above is invariant under all of it. The only levers are the two below, and both are exercised when the RTL is written, not when it is compiled.

**Registering the control word halves the bound, and that is the entire case for Moore control.** Let $\lambda$ be *Mealy* and read $s$ directly. Then a second, shorter cycle exists — $R \to s \to \lambda \to c \to \text{mux/op} \to R$ — which passes through $R$ only, one register, so the bound on that cycle is the full $t_s + t_\lambda + t_{\text{mux}} + t_{\text{op}}$ with no division. Make $\lambda$ *Moore*, a function of $q$ alone ([[Moore Machine]]), and that shortcut does not exist in the graph: every path from $s$ to $c$ must pass through the state register, so the shortest control cycle is the two-register one and the bound halves. What it costs is exactly one cycle — the control word reacts to a status bit one cycle after the datapath produced it — which the schedule absorbs by evaluating the branch condition one step early. That is the same trade as the Moore/Mealy latency row in [[Choosing an FSM Encoding]], relocated from an output port to a control bus.

**Speculate when the schedule has no idle cycle to spend.** Compute both control words in parallel with the datapath, $c_0 = \lambda(q, s{=}0)$ and $c_1 = \lambda(q, s{=}1)$, and select between them with $s$ at the last moment. The loop becomes $R \to s \to \text{2:1 mux} \to \text{mux/op} \to R$, replacing $t_\lambda$ with a single mux delay while keeping Mealy's zero-cycle response. The cost is $2^{k'}$ copies of $\lambda$ for the $k'$ status bits speculated on, so it is routinely worth it at $k'=1$, marginal at $k'=2$, and essentially never worth it at $k'=3$ — the $\lambda$ logic outgrows the datapath it was meant to control. [[C-Slow Retiming]] is the third option and the only one that genuinely adds registers to the loop: replace each register with $C$ in series and interleave $C$ independent problem instances, dropping the bound by $C\times$, but only if $C$ independent streams actually exist.

**On FPGA the split is nearly free on the control side and the status hop is where the time goes.** The control FSM is a few LUTs plus flops that the fabric was going to waste anyway, since each LUT in a slice comes paired with a flip-flop ([[FPGAs]], [[Lookup-Tables]]) — with [[One-Hot State Encoding]] the control word often degenerates to a wire, $c_i = q_S$, costing no logic at all. The datapath, meanwhile, lands in hard resources: carry chains for the adder, DSP blocks for the multiplier, block RAM for the register file. The status bit is precisely the signal that must *leave* a hard block and re-enter general routing to reach the control LUTs, and the source note's LUT-level model already says routing dominates a $0.1$–$0.3$ ns LUT6 delay. So placement wants the control FSM physically beside its status producers, not beside the datapath's bulk. On ASIC the same asymmetry exists and is milder, since there are no hard-block boundaries to cross.

> [!warning] No numeric figure for the status-to-control routing hop appears in the source, and none is invented here. The ordering claim (routing $\gg$ LUT delay) is the source's; the magnitude is device- and placement-specific and needs a timing report, not a note.

$$\boxed{\ |Q_{\text{flat}}| = N\prod_{r} 2^{w_r},\qquad
T_c \;\ge\; \frac{t_{s}+t_{\delta}+t_{\lambda}+t_{\text{mux}}+t_{\text{op}}}{\#\text{registers in the control loop}}\ }$$

**When it breaks**

- **Data-dependent addressing puts control back in the datapath.** A variable shift amount, a computed RAM address, or a register file indexed by a data field is a mux whose select comes from data, not from $c$. It is legal and often correct, but those bits are no longer schedule, and the clean claim "$\delta$'s fan-in is independent of $n$" now needs a caveat for every such path.
- **Below about four states and four data bits the split loses.** The control word bus and the status reduction are overhead a merged truth table would have absorbed into the same LUT level. A [[1011 Sequence Detector]] is the honest form of a tiny machine; splitting it would add two buses to save nothing.
- **A single central FSM does not scale outward.** Broadcasting $m$ bits to every corner of a large chip makes $c$'s fan-out the critical path instead of the status loop. The replacement is distributed control — one small FSM per unit, coupled by [[Handshake Ready-Valid]] — which is latency-insensitive design and gives up the fixed cycle-accurate schedule in exchange.
- **Pipelining the status producer breaks the schedule silently.** If the comparator sits behind a three-stage subtractor, the FSM samples a flag describing state from three cycles ago. Nothing in the FSMD model detects this; you must either stall the control FSM or bake the latency into the schedule by hand. This is the hazard problem of pipelined processors in miniature.
- **Variable-latency operators dissolve the schedule.** A divider or a cache whose completion time depends on the operands turns the FSM from a fixed cycle count into a polling loop on a done flag. The split survives, the cycle-count reasoning does not.

**RTL (Spade)**

```spade
struct Ctl { load: bool, step: bool, done: bool }

enum St { Idle, Load, Run, Done }

entity mul_ctrl(clk: clock, rst: bool, start: bool, last: bool) -> Ctl {
    decl st_next;
    reg(clk) st: St reset(rst: St::Idle) = st_next;
    let st_next = match st {
        St::Idle => if start { St::Load } else { St::Idle },
        St::Load => St::Run,
        St::Run  => if last { St::Done } else { St::Run },
        St::Done => St::Idle,
    };
    match st {                                   // Moore: c is a function of q only
        St::Idle => Ctl$(load: false, step: false, done: false),
        St::Load => Ctl$(load: true,  step: false, done: false),
        St::Run  => Ctl$(load: false, step: true,  done: false),
        St::Done => Ctl$(load: false, step: false, done: true),
    }
}

entity mul_dp(clk: clock, rst: bool, c: Ctl, a: uint<8>, b: uint<8>) -> (uint<16>, bool) {
    decl acc_n, m_n, q_n, i_n;
    reg(clk) acc: uint<16> reset(rst: 0) = acc_n;
    reg(clk) m:   uint<16> reset(rst: 0) = m_n;
    reg(clk) q:   uint<8>  reset(rst: 0) = q_n;
    reg(clk) i:   uint<4>  reset(rst: 0) = i_n;

    let sum: uint<16> = if q.as_bits()[0] { trunc(acc + m) } else { acc };

    let acc_n: uint<16> = if c.load { 0 }        else { if c.step { sum }     else { acc } };
    let m_n:   uint<16> = if c.load { zext(a) }  else { if c.step { m << 1 }  else { m } };
    let q_n:   uint<8>  = if c.load { b }        else { if c.step { q >> 1 }  else { q } };
    let i_n:   uint<4>  = if c.load { 0 }        else { if c.step { trunc(i + 1) } else { i } };

    (acc, i == 7)                                // status: the only bit control ever sees
}

entity mul_fsmd(clk: clock, rst: bool, start: bool, a: uint<8>, b: uint<8>) -> (uint<16>, bool) {
    decl last;
    let c = inst mul_ctrl(clk, rst, start, last);
    let (p, s) = inst mul_dp(clk, rst, c, a, b);
    let last = s;
    (p, c.done)
}
```

`Ctl` is the $m$-bit control word of the diagram, three bits wide here and independent of the $8$-bit operands; `last` is the entire $k$-bit status vector, $k=1$, and `decl last` is the forward declaration that closes the status loop — the loop is real in the netlist, not a drawing convention. Widths: `acc` and `m` are $16$ bits because $255\times255 < 2^{16}$, `q` is $8$, and the schedule counter `i` is $4$ so that `i == 7` is expressible; `acc + m` is `uint<17>` by the growth rule and `trunc` discards the carry that cannot occur. Everything in `mul_dp` outside the four `reg` declarations is combinational, and everything in `mul_ctrl` outside `st` likewise — the design has exactly two register *layers*, which is the $2$ in the iteration bound. Synthesis will not build shifters: `m << 1` and `q >> 1` are constant shifts and lower to rewiring, and on FPGA the whole controller collapses into one or two LUT/flop pairs while `acc + m` claims a carry chain.

Simulated against `x * y` for the ten named vectors (including the asymmetric $1\times128$ and $128\times1$, which a bit-reversed operand order would fail) plus a 600-case random sweep: 610/610 pass, product correct and `done` asserted at cycle 11 of every transaction.

**Related Notes**

- [[Canonical FSM Structure]] – depends-on: the $\delta$/$q$/$\lambda$ interior of the control box, taken here as given and then wrapped in two buses.
- [[Moore Machine]] – supports: registering the control word *is* the Moore choice, and it is what halves the loop bound.
- [[Mealy Machine]] – counter-example: the shorter one-register cycle that makes the same design slower despite responding a cycle earlier.
- [[Retiming]] – depends-on: the register-conservation invariant and the iteration bound the whole timing argument rests on.
- [[Pipeline Register Insertion]] – counter-example: unlimited on the feed-forward datapath, inapplicable to the control loop, which is why the two are drawn as separate boxes.
- [[C-Slow Retiming]] – extends: the only transformation that legally raises the register count inside the status loop.
- [[Magnitude Comparator]] – depends-on: the canonical status producer, the $n\to1$ reduction that defines the datapath/control boundary.
- [[Ripple-Carry Adder]] – depends-on: the datapath operator in the drawing; its carry-out is the second-most-common status bit after the zero flag.
- [[One-Hot State Encoding]] – extends: makes the control word a wire, $c_i = q_S$, removing $\lambda$ from the loop entirely.
- [[Handshake Ready-Valid]] – extends: replaces the single central controller with per-unit control once the control word's fan-out beats the status loop.
- [[Choosing an FSM Encoding]] – compares: the encoding half of the same cost model, applied to $q$ rather than to $c$.

## References

- [[0.4) Synchronous Sequential Logic]] — §Datapath plus control (the split, the 256-state accumulator argument, the status loop and its two mitigations), §Pipelining and retiming (the iteration bound and the register-conservation invariant), §FPGA mapping (LUT-level delay model, one-hot output decoding as a wire), §Trade-offs (Moore vs. Mealy latency).
- No textbook source for this topic. Standard treatments: Weste & Harris, *CMOS VLSI Design*, ch. 1.4 (FSMD, control/datapath partitioning); Mano & Ciletti, *Digital Design*, ch. 8 (register transfer level, the shift-and-add multiplier used as the RTL example); Wakerly, *Digital Design: Principles and Practices*, ch. 7 (state machine structure and Moore/Mealy timing); Leiserson & Saxe, "Retiming Synchronous Circuitry", *Algorithmica* 6 (1991), for the bound quoted above. No copy was consulted for this note, so no page numbers are given.
