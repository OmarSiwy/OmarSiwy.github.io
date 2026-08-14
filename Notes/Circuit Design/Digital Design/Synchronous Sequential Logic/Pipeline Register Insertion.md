---
title: Pipeline Register Insertion
description: "Cutting a feed-forward path with p register stages trades p cycles of latency for a p-fold cycle-time reduction — and is exactly what you cannot do to next-state logic, because a register inside the loop builds a different machine."
kind: circuit
source: "0.4) Synchronous Sequential Logic §Pipelining and retiming, §The synchronous discipline, §Datapath plus control, §FPGA mapping — no book source"
status: seed
spade: simulated
tags: [digital, synchronous-sequential-logic, pipelining, throughput, latency, fpga]
aliases:
  - Pipelining
  - Pipeline Registers
  - Pipeline Stage
  - Feed-Forward Cutset
  - Pipeline Register Insertion
---

# Pipeline Register Insertion

Adding registers to a *feed-forward* combinational path so that the clock sees one short stage instead of one long one — legal exactly when the added registers form a cutset that every input-to-output path crosses the same number of times.

```tikz title="One 4.8 ns combinational path before and after insertion of three registers: the cut points, the resulting cycle time, and the four balancing registers a logic-free bypass needs"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex,
  blk/.style={draw,minimum width=1.5cm,minimum height=0.95cm,align=center},
  ff/.style={draw,fill=black!12,minimum width=0.3cm,minimum height=0.95cm}]

% ================= unpipelined =================
\node[anchor=west,font=\small] at (-1.6,4.9) {\textbf{one path, one cycle}};

\node[ff] (fa) at (-1.0,3.6) {};
\node[blk] (u1) at (0.35,3.6) {$L_1$\\$1.2$};
\node[blk] (u2) at (2.35,3.6) {$L_2$\\$1.5$};
\node[blk] (u3) at (4.35,3.6) {$L_3$\\$1.1$};
\node[blk] (u4) at (6.35,3.6) {$L_4$\\$1.0$};
\node[ff] (fb) at (7.7,3.6) {};

\draw[->] (-2.1,3.6) -- (fa.west) node[midway,above,font=\tiny]{$8$};
\draw[->] (fa.east) -- (u1.west);
\draw[->] (u1.east) -- (u2.west) node[midway,above,font=\tiny]{$9$};
\draw[->] (u2.east) -- (u3.west) node[midway,above,font=\tiny]{$10$};
\draw[->] (u3.east) -- (u4.west) node[midway,above,font=\tiny]{$11$};
\draw[->] (u4.east) -- (fb.west) node[midway,above,font=\tiny]{$12$};
\draw[->] (fb.east) -- (8.7,3.6) node[midway,above,font=\tiny]{$12$};

\draw[|-|,black!55] (-0.45,2.95) -- (7.15,2.95);
\node[anchor=north] at (3.35,2.85)
  {$t_{pd}=4.8$\,ns \; $\Rightarrow$ \; $T_c\ge 4.8+t_{ovh}$, \; latency $1$ cycle};

% ================= pipelined =================
\node[anchor=west,font=\small] at (-1.6,1.75) {\textbf{same path, cut into $p=4$ stages}};

\node[ff] (ga) at (-1.0,0.45) {};
\node[blk] (p1) at (0.35,0.45) {$L_1$\\$1.2$};
\node[ff]  (g1) at (1.35,0.45) {};
\node[blk] (p2) at (2.35,0.45) {$L_2$\\$1.5$};
\node[ff]  (g2) at (3.35,0.45) {};
\node[blk] (p3) at (4.35,0.45) {$L_3$\\$1.1$};
\node[ff]  (g3) at (5.35,0.45) {};
\node[blk] (p4) at (6.35,0.45) {$L_4$\\$1.0$};
\node[ff]  (gb) at (7.7,0.45) {};

\draw[->] (-2.1,0.45) -- (ga.west) node[midway,above,font=\tiny]{$8$};
\draw[->] (ga.east) -- (p1.west);
\draw[->] (p1.east) -- (g1.west);
\draw[->] (g1.east) -- (p2.west);
\draw[->] (p2.east) -- (g2.west);
\draw[->] (g2.east) -- (p3.west);
\draw[->] (p3.east) -- (g3.west);
\draw[->] (g3.east) -- (p4.west);
\draw[->] (p4.east) -- (gb.west);
\draw[->] (gb.east) -- (8.7,0.45) node[midway,above,font=\tiny]{$12$};

% cutsets
\foreach \x in {1.35,3.35,5.35} {
  \draw[dashed,black!55] (\x,1.35) -- (\x,-0.55);
  \draw[dashed,black!55] (\x,-1.35) -- (\x,-2.3);
}
\node[anchor=south,font=\tiny,black!55] at (1.35,1.35) {cut $1$};
\node[anchor=south,font=\tiny,black!55] at (3.35,1.35) {cut $2$};
\node[anchor=south,font=\tiny,black!55] at (5.35,1.35) {cut $3$};

% balancing path
\node[ff] (b1) at (1.35,-1.7) {};
\node[ff] (b2) at (3.35,-1.7) {};
\node[ff] (b3) at (5.35,-1.7) {};
\node[ff] (b4) at (7.7,-1.7) {};
\draw[->] (-2.1,-1.7) -- (b1.west) node[midway,above,font=\tiny]{$\textit{tag}$, $1$};
\draw[->] (b1.east) -- (b2.west);
\draw[->] (b2.east) -- (b3.west);
\draw[->] (b3.east) -- (b4.west);
\draw[->] (b4.east) -- (8.7,-1.7) node[midway,above,font=\tiny]{$1$};
\node[anchor=west,font=\small] at (-2.1,-0.95)
  {a bypass carries no logic, so it still needs $4$ balancing registers};

\draw[|-|,black!55] (-0.45,-2.55) -- (7.15,-2.55);
\node[anchor=north,align=center] at (3.35,-2.65)
  {$T_c\ge \max_i t_{pd}(L_i)+t_{ovh}=1.5+t_{ovh}$, \; latency $4$ cycles\\
   the slowest stage sets the clock, so the $1.0$\,ns stage wastes $0.5$\,ns every cycle};

\end{circuitikz}
\end{document}
```

**Start from the constraint the registers have to satisfy, not from the drawing.** The sequencing inequality of [[Introduction to Flip-Flops & Latches]] binds on each register-to-register path independently:

$$T_c \;\ge\; t_{pcq} + t_{pd} + t_{\text{setup}} + t_{\text{skew}}$$

Only $t_{pd}$ is a property of the logic; the other three are properties of the flops and the clock tree and are paid **once per stage, whatever the stage contains**. Collect them as the sequencing overhead $t_{ovh} = t_{pcq} + t_{\text{setup}} + t_{\text{skew}}$ and the whole design space is visible in one line: shortening a path shortens $T_c$, but never below $t_{ovh}$, and every new stage adds a fresh copy of $t_{ovh}$.

**Insert on a cutset, or you have not pipelined, you have desynchronised.** Take the combinational logic as a directed acyclic graph with the source registers as inputs. A stage boundary is a **cutset**: a set of edges whose removal disconnects inputs from outputs, with every edge in it oriented the same way (source side to sink side). Put one register on *every* edge of the cutset. The correctness argument is a counting argument — after the insertion, every input-to-output path crosses exactly one more register than before, so every signal reaching a given output arrives from the same input cycle, and the function computed is unchanged with all outputs shifted by one cycle. Miss a single edge and that edge's data is one cycle newer than its neighbours': the circuit still compiles, still meets timing, and computes a function of two different input vectors. In the diagram the $\textit{tag}$ bypass carries no logic at all, which is precisely why it is the edge that gets forgotten; it crosses all four cutsets and therefore needs four registers of its own. **Balancing registers are not overhead you can optimise away — they are the cutset condition.**

**The cycle-time arithmetic, and why it saturates.** Cut a path of delay $t_{pd}$ into $p$ stages of delays $t_1,\dots,t_p$ with $\sum_i t_i = t_{pd}$. The clock must satisfy every stage, so

$$T_c(p) \;=\; \max_i t_i + t_{ovh} \;\ge\; \frac{t_{pd}}{p} + t_{ovh}$$

with equality **only** for a balanced cut — the bound is a max, not a mean, so one fat stage costs the whole design. Throughput is one result per cycle once the pipe is full, so $f_{\max}=1/T_c$ and the speedup over the uncut path is

$$S(p)=\frac{T_c(1)}{T_c(p)}=\frac{t_{pd}+t_{ovh}}{t_{pd}/p+t_{ovh}} \;\xrightarrow[p\to\infty]{}\; 1+\frac{t_{pd}}{t_{ovh}}$$

Half of that asymptote is already reached at $p=t_{pd}/t_{ovh}$; past there each new register buys a shrinking fraction of a fixed budget. Put $t_{ovh}=0.3$ ns into the drawn example — an assumed figure, chosen only to make the arithmetic concrete — and the uncut path runs at $1/5.1\,\text{ns}=196$ MHz, the drawn cut at $1/1.8\,\text{ns}=556$ MHz ($2.83\times$, not $4\times$, because the $1.5$ ns stage sets the clock), and a perfectly balanced four-way cut at $1/1.5\,\text{ns}=667$ MHz ($3.4\times$). Rebalancing is free speedup; adding a fifth register is not.

**Latency in time always gets worse, and this is the trade, not a side effect.** Time from input to result is $p$ cycles of $T_c(p)$:

$$L(p)=p\,T_c(p)=t_{pd}+p\,t_{ovh}$$

strictly increasing in $p$. Pipelining does not make anything faster in the sense a first-time reader expects — the first result comes out *later* than it would have from the uncut logic, by $t_{ovh}$ per inserted stage. What it buys is that results $2,3,4,\dots$ come out at one per $T_c(p)$ instead of one per $T_c(1)$. So the transformation is only ever a win when there is a **stream** of independent inputs to fill the stages; a single isolated operation is strictly slower pipelined. It is also exactly bit-preserving: sequential logic has no ulp to spend ([[Error Accuracy]]), the same function is computed on the same widths, and unlike truncation or [[Number Formats]] changes there is no accuracy axis in this trade at all — only latency, area and power.

**Widths do not change under insertion, and that is the check.** A register is $w$ flip-flops for a $w$-bit edge, so the cost of a cutset is $\sum_{e\in\text{cut}} w_e$ flops, and the total for $p$ stages is $\sum_{\text{cuts}}\sum_{e} w_e$ — the drawn path costs $9+10+11=30$ flops for the datapath plus $4$ for the one-bit $\textit{tag}$ bypass. Widths grow along the chain because each addition is $N\to N+1$ ([[Adders]]), and the cut therefore gets more expensive the further right it is placed: cutting after $L_1$ costs 9 flops, after $L_3$ costs 11. **Where a cut is cheapest and where it is timing-optimal are different questions**, and on a wide datapath they conflict routinely.

> [!important] $\delta$ is the one path this transformation does not apply to.
> The next-state logic of a finite-state machine sits in a directed **cycle** $q\to\delta\to d\to q$, and a cycle has no cutset: any set of edges you cut is re-entered by the loop. Insert a register there anyway and the result compiles, meets timing, and implements a *different machine* — one whose state now lags its own transition function by a cycle. [[Retiming]] makes this precise with an invariant: register count around any directed cycle is conserved, so the iteration bound $T_c \ge \max_\ell \big(\sum_{v\in\ell} t_{pd}(v)\big)/\#\text{reg}(\ell)$ pins a plain FSM at the full delay of $\delta$ forever. The only ways under that floor change the problem rather than the placement — restructure $\delta$ (re-encode, factor, precompute), or run $C$ independent instances interleaved with [[C-Slow Retiming]], which raises $\#\text{reg}(\ell)$ from 1 to $C$ legitimately.

**The one FSM path that *is* feed-forward is the output logic.** $\lambda$ hangs off the state register and appears in no cycle, so a register may be inserted on it freely — and doing so is not a new idea but the [[Moore Machine]] itself, one cycle late: $z^{n+1}_{\text{Moore}}=\lambda_{\text{Mealy}}(q^n,x^n)$. The same insight applies in reverse to a system built from FSMs. Cascaded [[Mealy Machine]] outputs chain into a single combinational path spanning several modules; a register on each boundary cuts it, at one cycle per boundary. In an [[FSMD Controller-Datapath Split]] the datapath is entirely feed-forward and pipelines without reservation, while the loop **status flag $\to\delta\to$ control word $\to$ datapath $\to$ status flag** does not — which is why a comparator output steering a control decision so often ends up the critical path of a design whose datapath is far deeper.

**On FPGA the flops are already paid for, and the balancing chains are nearly free.** Every LUT in a slice is paired with a flip-flop that is otherwise wasted, so if the logic already occupies the slices, a cutset placed at LUT outputs costs zero extra area ([[FPGAs]], [[Lookup-Tables]]) — a fabric with that property makes pipelining the default rather than an optimisation, and Vivado and Quartus both retime into those flops automatically. Two fabric-specific facts change the accounting further. A logic-free balancing chain maps into an SRL (a LUT reconfigured as a 16- or 32-deep 1-bit shift register), so those four $\textit{tag}$ flops become a fraction of one LUT — **but only if the chain has no reset**, since an SRL cannot be reset, and a blanket synchronous reset on a pipeline silently converts every balancing chain back into discrete flops. And the hard carry chain is not cuttable at an arbitrary bit: it is a dedicated vertical path with no register taps inside it, so a pipelined [[Ripple-Carry Adder]] may only be cut at carry-block boundaries, and each cut needs balancing registers on all the already-computed low-order sum bits. On ASIC none of this holds: every flop is a real 20–30 transistor cell with real clock-tree power, the cut is free to land anywhere, and $p$ is chosen against a power budget rather than an area one.

$$\boxed{\ T_c(p)=\frac{t_{pd}}{p}+t_{ovh},\qquad L(p)=t_{pd}+p\,t_{ovh},\qquad t_{ovh}=t_{pcq}+t_{\text{setup}}+t_{\text{skew}}\ }$$

**When it breaks**

- **A cycle in the graph.** Next-state logic, accumulators, IIR filter loops, any handshake whose `ready` feeds back combinationally. There is no cutset, so there is no insertion — only [[C-Slow Retiming]], restructuring, or accepting the iteration bound.
- **An unbalanced cut wastes everything below the max.** $T_c$ is set by the slowest stage, so a $p$-stage pipeline with one fat stage is a 1-stage pipeline with extra flops. Rebalance before adding.
- **Overhead-dominated stages.** Once $t_{pd}/p \approx t_{ovh}$ the speedup curve is flat and each new stage costs area, clock power and a cycle of latency for a few percent of $f_{\max}$. Weste & Harris put the power-aware optimum at roughly 6–8 FO4 of logic per stage, well short of the frequency-optimal depth.
- **A missed edge on the cutset.** The failure is silent: it compiles, it meets timing, and it computes on mismatched cycles. This is what the simulation below actually tests, and the only structural defence is a language or a review rule that forces the count.
- **Stalls turn one enable into a high-fanout net.** A pipeline that can be back-pressured needs an enable on every stage register, and that enable is combinationally derived from the far end ([[Handshake Ready-Valid]]). The enable net can itself become the critical path; the standard repairs are skid buffers or a credit scheme, both of which cost more registers than the pipeline did.
- **Latency inside a control loop is not free.** Pipelining a datapath that sits inside a decision loop moves $p$ cycles into that loop's iteration bound. The datapath got faster and the machine got slower.
- **Flush and reset.** A $p$-deep pipeline holds $p$ in-flight results; on reset, branch misprediction or mode change they must be invalidated, which means a valid bit shadowing the whole depth — and, per the SRL note above, a reset on that chain is the thing that stops the balancing registers being free.

**RTL (Spade)**

```spade
pipeline(4) sum5(
    clk: clock,
    a: uint<8>, b: uint<8>, c: uint<8>, d: uint<8>, e: uint<8>,
    tag: bool,
) -> (uint<12>, bool) {
    'in
        let s1: uint<9> = a + b;
    reg;
        let s2: uint<10> = s1 + zext::<8, 9>(c);
    reg;
        let s3: uint<11> = s2 + zext::<8, 10>(d);
    reg;
        let s4: uint<12> = s3 + zext::<8, 11>(e);
    reg;
        (s4, tag)
}
```

Each `reg;` is one cut of the diagram — $L_i$ is the addition above it, $s_i$ is the edge carrying $9,10,11,12$ bits, and the widths grow because `+` on `uint<N>` returns `uint<N+1>`, so every operand must be `zext`ed to the accumulated width before it is added. Note that the type system's $+1$ per addition is conservative: five 8-bit values need $8+\lceil\log_2 5\rceil = 11$ bits, so `s4`'s top bit is provably zero and synthesis will delete that flop and the logic feeding it. The interesting line is the last one: `tag` is read in stage 4 but written in stage 0, and the language inserts the four balancing registers for you — the emitted Verilog contains `s1_tag`, `s2_tag`, `s3_tag`, `s4_tag` and assigns the output as `{s4_s4, s4_tag}`. **That is the cutset condition promoted to a type rule**, and it is why a Spade pipeline cannot commit the silent desynchronisation described above, whereas the equivalent Verilog can. Synthesis will not keep this structure literally: it also emits stage copies of `a`…`e` that nothing reads (dead, swept in the first sweep pass), it will retime the adder chain across the register boundaries to balance the stages the drawing left uneven, and on FPGA the four chained adders collapse onto the hard carry chain whose internal carries are not cuttable at all.

Simulated against a behavioural 4-deep delay line of `a+b+c+d+e`: **3011 vectors, zero mismatches** — 7 directed, including the asymmetric `1 + 128` and its swap `128 + 1` (equal sums, different tags, which catches an operand-order or tag-phase error that a symmetric vector cannot), all-`255` (the maximum sum, $1275$, exercising every carry in the chain), and single-operand vectors isolating each stage, then 3000 random and a 4-cycle drain. Replacing `tag` with `stage(in).tag` — the bypass with its balancing registers deleted, the exact bug this note is about — produces **1498 mismatches** on the same 3011 vectors while still compiling cleanly and still meeting timing.

**Related Notes**

- [[Retiming]] – compares: moves registers that already exist instead of adding new ones, so the cycle count is preserved and the iteration bound applies; the two are usually run back to back, insert then rebalance.
- [[C-Slow Retiming]] – extends: the legal way to add registers to a cycle, by interleaving $C$ independent instances so the conservation invariant is satisfied rather than violated.
- [[Moore Machine]] – supports: the canonical single-stage pipeline of an FSM's output logic, and the proof that $\lambda$ is the only feed-forward path a plain FSM has.
- [[Mealy Machine]] – counter-example: outputs that chain combinationally across module boundaries, which is what a register on each boundary exists to cut.
- [[FSMD Controller-Datapath Split]] – depends-on: the decomposition that separates the freely pipelinable datapath from the status-flag loop that is not.
- [[Canonical FSM Structure]] – depends-on: the $\delta$/register/$\lambda$ partition that decides which paths here are cycles and which are cutsets.
- [[Ripple-Carry Adder]] – extends: the worked target for insertion — an $O(w)$ carry chain is the textbook long feed-forward path, and cutting it costs balancing registers on every low-order sum bit already computed.
- [[Introduction to Flip-Flops & Latches]] – depends-on: the sequencing inequality that defines $t_{ovh}$ and therefore the entire saturation argument.
- [[FPGAs]] – supports: LUT-paired flops, SRL-mapped balancing chains, and the uncuttable hard carry chain.

## References

- [[0.4) Synchronous Sequential Logic]] — §Pipelining and retiming (feed-forward vs. $\delta$, the $T_c\to T_c/p$ statement, register conservation and the iteration bound, C-slow), §The synchronous discipline (why a cutset argument is valid at all — every cycle contains a flop, so the combinational graph is a DAG by construction), §Datapath plus control (the status-flag loop that pipelining cannot break), §FPGA mapping (LUT-paired flops), §Trade-offs.
- No book source for this topic. Standard treatments: Weste & Harris, *CMOS VLSI Design*, ch. 10 (sequencing overhead, pipeline depth vs. FO4 logic depth, the power-aware optimum); Mano & Ciletti, *Digital Design*, ch. 9 (pipeline stage construction and latency/throughput accounting); Wakerly, *Digital Design: Principles and Practices*, ch. 8 (register insertion and synchronous timing analysis); Leiserson & Saxe, "Retiming Synchronous Circuitry", *Algorithmica* 6 (1991), for the cutset and conservation results this note leans on. No copy was consulted, so page numbers are deliberately omitted.
