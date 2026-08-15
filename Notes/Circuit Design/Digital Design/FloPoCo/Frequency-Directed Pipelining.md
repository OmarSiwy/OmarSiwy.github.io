---
title: "Frequency-Directed Pipelining"
description: "Inverts the usual flow: you state f, the tool solves for N. Splitting a combinatorial DAG into N stages of delay dt/N multiplies throughput by N at the cost of the registers between them."
kind: circuit
source: "ASA §A.2.5, pp. 766-769"
status: seed
spade: simulated
tags: [digital, flopoco, pipeline, timing, throughput]
aliases:
  - Automatic Pipelining
  - Pipelining a Combinatorial Operator
---

# Frequency-Directed Pipelining

A pipelining scheme in which the target frequency is an *input* to the generator and the number of pipeline stages is the *output*, so the designer never places a register by hand.

```tikz title="A combinatorial operator between input and output registers, and the same operator cut into four pipeline stages, with both clock waveforms"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,>=stealth,font=\footnotesize]
  % ================= (a) combinatorial =================
  \node[anchor=west,font=\small] at (-1.6,8.35) {(a) combinatorial: one result every $\overline{\Delta t}$};
  % input register
  \draw[fill=black!10] (0.1,6.05) rectangle (0.45,6.95);
  \draw (0.1,6.15) -- (0.275,6.05) -- (0.45,6.15);
  \draw[->] (0.45,6.5) -- (1.2,6.5);
  \node[anchor=south,font=\tiny] at (0.83,6.55) {$X$, $w$\,b};
  % combinatorial cloud
  \draw[fill=black!5] (1.2,5.85) rectangle (9.4,7.15);
  \foreach \i in {0,...,3}{
    \draw[fill=white] (1.5+2*\i,6.15) rectangle (2.7+2*\i,6.85);
  }
  \foreach \i in {0,...,2}{ \draw[->] (2.7+2*\i,6.5) -- (3.5+2*\i,6.5); }
  \draw[->] (1.2,6.5) -- (1.5,6.5);
  \draw[->] (8.7,6.5) -- (9.9,6.5);
  \draw[fill=black!10] (9.9,6.05) rectangle (10.25,6.95);
  \draw (9.9,6.15) -- (10.075,6.05) -- (10.25,6.15);
  \node[anchor=west,font=\tiny] at (10.35,6.5) {$Y$, $w$\,b};
  % critical path arrow
  \draw[->,thick] (1.35,7.45) -- (9.55,7.45);
  \node[anchor=south,font=\small] at (5.45,7.5) {$\overline{\Delta t}$};
  % waveforms (a): period 3
  \node[anchor=east] at (0.9,5.35) {$X$};
  \node[anchor=east] at (0.9,4.75) {$Y$};
  \node[anchor=east] at (0.9,4.05) {clk};
  \foreach \i/\l in {0/0,1/1,2/2}{
    \draw (1.05+3*\i,5.2) rectangle (3.95+3*\i,5.5);
    \node[font=\tiny] at (2.5+3*\i,5.35) {$X_\l$};
  }
  \foreach \i/\l in {0/0,1/1}{
    \draw (4.05+3*\i,4.6) rectangle (6.95+3*\i,4.9);
    \node[font=\tiny] at (5.5+3*\i,4.75) {$Y_\l$};
  }
  \draw (1.0,3.9) -- (2.5,3.9) -- (2.5,4.3) -- (4.0,4.3) -- (4.0,3.9)
     -- (5.5,3.9) -- (5.5,4.3) -- (7.0,4.3) -- (7.0,3.9)
     -- (8.5,3.9) -- (8.5,4.3) -- (10.0,4.3) -- (10.0,3.9) -- (10.3,3.9);
  \draw[|<->|] (1.05,3.55) -- node[fill=white,font=\tiny,inner sep=1pt] {$\overline{\Delta t}$} (3.95,3.55);
  \node[anchor=west,font=\tiny] at (-1.6,3.2) {throughput $f_{\mathrm{comb}}=1/\overline{\Delta t}$, latency 1 cycle};

  % ================= (b) pipelined =================
  \node[anchor=west,font=\small] at (-1.6,2.35) {(b) the same DAG cut into $N=4$ stages: one result every $\overline{\Delta t}/N$};
  \draw[fill=black!10] (0.1,0.55) rectangle (0.45,1.45);
  \draw (0.1,0.65) -- (0.275,0.55) -- (0.45,0.65);
  \draw[->] (0.45,1.0) -- (1.2,1.0);
  \node[anchor=south,font=\tiny] at (0.83,1.05) {$X$, $w$\,b};
  \draw[fill=black!5] (1.2,0.35) rectangle (9.4,1.65);
  \foreach \i in {0,...,3}{
    \draw[fill=white] (1.5+2*\i,0.65) rectangle (2.7+2*\i,1.35);
  }
  \draw[->] (1.2,1.0) -- (1.5,1.0);
  % pipeline registers between the stages
  \foreach \i/\n in {0/A,1/B,2/C}{
    \draw[->] (2.7+2*\i,1.0) -- (2.95+2*\i,1.0);
    \draw[fill=black!10] (2.95+2*\i,0.55) rectangle (3.3+2*\i,1.45);
    \draw (2.95+2*\i,0.65) -- (3.125+2*\i,0.55) -- (3.3+2*\i,0.65);
    \draw[->] (3.3+2*\i,1.0) -- (3.5+2*\i,1.0);
    \node[anchor=north,font=\tiny] at (3.125+2*\i,0.28) {$\n$, $w$\,b};
  }
  \draw[->] (8.7,1.0) -- (9.9,1.0);
  \draw[fill=black!10] (9.9,0.55) rectangle (10.25,1.45);
  \draw (9.9,0.65) -- (10.075,0.55) -- (10.25,0.65);
  \node[anchor=west,font=\tiny] at (10.35,1.0) {$Y$, $w$\,b};
  \draw[->,thick] (1.55,1.95) -- (2.65,1.95);
  \node[anchor=west,font=\small] at (2.7,1.95) {$\overline{\Delta t}/N$};
  % waveforms (b): period 0.75, 12 slots from x=1.0
  \foreach \r/\n in {0/$X$,1/$A$,2/$B$,3/$C$,4/$Y$}{
    \node[anchor=east,font=\footnotesize] at (0.9,-0.35-0.45*\r) {\n};
  }
  \foreach \i in {0,...,11}{
    \draw (1.02+0.75*\i,-0.5) rectangle (1.71+0.75*\i,-0.2);
    \node[font=\tiny] at (1.365+0.75*\i,-0.35) {$X_{\i}$};
  }
  \foreach \i in {0,...,10}{
    \draw (1.77+0.75*\i,-0.95) rectangle (2.46+0.75*\i,-0.65);
    \node[font=\tiny] at (2.115+0.75*\i,-0.8) {$A_{\i}$};
  }
  \foreach \i in {0,...,9}{
    \draw (2.52+0.75*\i,-1.4) rectangle (3.21+0.75*\i,-1.1);
    \node[font=\tiny] at (2.865+0.75*\i,-1.25) {$B_{\i}$};
  }
  \foreach \i in {0,...,8}{
    \draw (3.27+0.75*\i,-1.85) rectangle (3.96+0.75*\i,-1.55);
    \node[font=\tiny] at (3.615+0.75*\i,-1.7) {$C_{\i}$};
  }
  \foreach \i in {0,...,7}{
    \draw (4.02+0.75*\i,-2.3) rectangle (4.71+0.75*\i,-2.0);
    \node[font=\tiny] at (4.365+0.75*\i,-2.15) {$Y_{\i}$};
  }
  \node[anchor=east,font=\footnotesize] at (0.9,-2.8) {clk};
  \draw (1.0,-2.95) \foreach \i in {0,...,11}{ -- (1.0+0.75*\i,-2.95) -- (1.0+0.75*\i,-2.6)
        -- (1.375+0.75*\i,-2.6) -- (1.375+0.75*\i,-2.95) } -- (10.3,-2.95);
  \draw[|<->|] (1.02,-3.3) -- (1.71,-3.3);
  \node[anchor=west,font=\tiny] at (1.82,-3.3) {$\overline{\Delta t}/N$};
  \node[anchor=west,font=\tiny] at (-1.6,-3.75)
    {throughput $N/\overline{\Delta t}$; latency $N$ cycles $=\overline{\Delta t}$ still; cost $=3$ barriers $\times\,w$ flip-flops};
\end{circuitikz}
\end{document}
```

*After Fig. A.2, p. 767.* $X$ and $Y$ are $w$ bits wide, $w$ being whatever the operator's format demands — $w_E+w_F+1$ for a binary floating-point operand, see [[Number Formats]]. The two panels compute the same function on the same inputs; only the time axis differs.

**Start from the fact that an operator has no history.** An operator here is a mathematical function composed with a well-defined rounding, so its output depends on the current input and nothing else. That makes the directed graph of its subcomponents — down to gates, LUTs, or whatever the fabric's elementary processing elements are — **acyclic** (p. 766). Acyclicity is the entire licence for what follows: a DAG can be cut anywhere by a horizontal line and the cut edges buffered, and no signal ever needs to travel backwards across the cut.

**Turn the delay into a frequency.** Let $\Delta t(x)$ be the propagation delay of the combinatorial operator on input $x$, measured in seconds, and let

$$\overline{\Delta t} = \max_x \Delta t(x)$$

be its **critical path delay** — the maximum over *all* inputs, which is what makes it a static property of the netlist rather than of the data. Sandwich the operator between input and output registers, as in panel (a). The input register may present a new operand only once the previous result has settled and been captured, i.e. once every $\overline{\Delta t}$, so the operator sustains

$$f_{\text{comb}} = \frac{1}{\overline{\Delta t}}.$$

That is one result per clock period and one clock period per critical path. Nothing in the datapath is busy for more than a fraction of that window — at any instant only one level of logic is switching, and the rest of the DAG is idle waiting.

**Cut the DAG to reclaim the idle levels.** Divide the circuit graph into $N$ slices, called **pipeline stages**, chosen so that each slice has critical path $\approx \overline{\Delta t}/N$, and insert a register on every edge crossing a slice boundary — $A$, $B$, $C$ in panel (b), each $w$ bits wide. Every slice now completes within $\overline{\Delta t}/N$, so if the pipeline is *balanced* and the registers themselves are free, the clock period shrinks by $N$ and

$$f_{\text{pipe}} = \frac{N}{\overline{\Delta t}} = N \cdot f_{\text{comb}}.$$

Throughput is multiplied by $N$; the **latency is unchanged**, since $N$ cycles of $\overline{\Delta t}/N$ is still $\overline{\Delta t}$. What is paid is registers: one $w$-bit bank per barrier per crossing edge, plus the routing to reach them (p. 768).

**The inversion is the whole idea.** In a hand-written RTL flow, or in HLS, you place the registers (or a schedule) and then *measure* what frequency the backend gives you; $N$ is the input and $f$ is the output. Frequency-directed pipelining runs that backwards. The user supplies one global parameter,

```sh
flopoco frequency=400 FPAdd wE=8 wF=23
```

and the generator solves for $N$ by walking the dependency graph accumulating declared delays and inserting a barrier whenever the accumulated delay would exceed the cycle budget $T = 1/f$. That accumulation is [[Pipeline Synchronization Delay Line|circuit time]] — a lexicographic pair (cycle count, delay-since-last-register) — and the carry out of the delay field into the cycle field *is* the register insertion. Ask for a low enough $f$ and no carry ever fires, so $N=1$ and the combinatorial circuit comes back unchanged.

**No input or output registers are ever added.** FloPoCo inserts intermediate registers only; the sandwich of panel (a) is the user's responsibility, which is what [[Register Sandwich]] exists to supply when you want an honest register-to-register measurement. Consequently the reported **pipeline depth counts synchronization barriers, not stages**: depth 3 means 4 stages, which is exactly panel (b) and exactly the FPAdd of Fig. A.3 (p. 769). The same number appears in a comment before each generated entity declaration.

**The guarantee is synchronization, not timing.** Three disclaimers, all of them load-bearing (p. 768):

- The pipeline is **not optimal**. An optimal pipeline minimizes total register cost subject to the frequency constraint — Leiserson–Saxe retiming [LS91]. FloPoCo's scheduler is as-soon-as-possible, which minimizes the *number of cycles* but not the number of flip-flops.
- The frequency is **not guaranteed**. The VHDL becomes a circuit in the backend, and the backend's placement, routing, and its own retiming are where $f_{\max}$ is actually decided. Fine tuning belongs there.
- What *is* guaranteed is that the pipeline is **correctly synchronized** — every reconverging path is balanced to the same cycle — and that the generated [[Self-Checking Test Bench]] adapts to the pipeline depth, so you can check it.

The practical loop is therefore: ask for a frequency, synthesize, measure, adjust the request. Asking too high is as easy to fix as asking too low.

**On FPGAs the cut is nearly free; on ASICs it is not.** Every logic element in a Xilinx or Intel fabric already contains a flip-flop on its output, and it is unused in a combinatorial design. Registering a signal that a LUT already produces therefore costs **zero extra area** and no extra routing — it merely enables a flop that was going to be there anyway. This is why FPGA arithmetic is pipelined far more aggressively than its ASIC equivalent: the $N$ in $N/\overline{\Delta t}$ is bought with slack resources up to the point where a register bank falls somewhere other than a LUT output. In an ASIC standard-cell flow each flip-flop is real area and real clock-tree load, and the register cost in the expression above bites immediately.

$$\boxed{\ f_{\text{pipe}} = \frac{N}{\overline{\Delta t}}\ \text{ for }\ N \approx \left\lceil \overline{\Delta t}\, f \right\rceil,\quad \text{latency } N \text{ cycles} = \overline{\Delta t},\quad \text{error } 0\ \text{ulp}\ }$$

**When it breaks.**

- **Register delay is not zero.** Ignoring the setup and clock-to-output delay of the inserted flip-flops is what makes $f_{\text{pipe}} = N/\overline{\Delta t}$ linear. Add a fixed per-stage overhead $\delta_{\text{reg}}$ and the period becomes $\overline{\Delta t}/N + \delta_{\text{reg}}$, which saturates: past some $N$ you are clocking flip-flops, not logic. The classical optimum sits around 6–8 FO4 delays of logic per stage [Hri+02; SC02] (p. 768).
- **The DAG must actually be acyclic.** Operators with state fall outside this entirely — the exact accumulators of [[Exact Accumulators]] and the filters of [[LTI Filters]] are the book's stated exceptions.
- **Iterative algorithms are not pipelined, they are unrolled.** Dividers, [[CORDIC]], and digit recurrences in general are discussed in the book but FloPoCo ships only the *unrolled, combinatorial* variants (p. 767, footnote 1). If you came expecting a sequential iteration folded onto one datapath, that is a genuine gap, not a pipelining decision.
- **A balanced cut may not exist.** A single indivisible primitive — a hard DSP block, a block-RAM read, a hardened carry chain longer than $T$ — is an atom the scheduler cannot split, and it sets a floor on the achievable period regardless of $N$.
- **Only the timing model can be wrong, never the function.** Adding `target->logicDelay()` annotations does not touch the computed value; the worst a bad model does is miss the frequency or spend too many stages.

> [!note] Pipelining costs exactly zero ulp
> Cutting the graph is a purely *temporal* transformation: same DAG, same operations, same rounding, same [[Error Accuracy]] budget, same test-bench verdict. That is precisely why the timing model is allowed to be approximate — a wrong delay annotation can only make the circuit slow or fat, never wrong.

**RTL (Spade).** Spade makes the barrier a first-class syntactic object, so the two panels of the diagram are two spellings of one function:

```spade
/// One level of combinatorial logic: roughly one LUT level of delay.
fn lvl(a: uint<8>, k: uint<8>) -> uint<8> {
    (a +. k) ^ (a >> 1)
}

/// Panel (a): four levels, critical path 4 x logicDelay().
fn chain(x: uint<8>, y: uint<8>) -> uint<8> {
    let a = lvl(x, y);
    let b = lvl(a, y);
    let c = lvl(b, y);
    lvl(c, y)
}

/// Panel (b): the same function, cut into N = 4 stages by 3 barriers.
pipeline(3) chain_p3(clk: clock, x: uint<8>, y: uint<8>) -> uint<8> {
        let a = lvl(x, y);
    reg;
        let b = lvl(a, y);
    reg;
        let c = lvl(b, y);
    reg;
        lvl(c, y)
}
```

Each `reg;` is one dashed line in panel (b): `a`, `b`, `c` are the 8-bit banks $A$, $B$, $C$, and `pipeline(3)` declares the depth as 3 barriers, matching FloPoCo's convention that depth 3 means four stages. `lvl` is a `fn`, hence purely combinatorial — Spade forbids `reg` inside a `fn`, which is the type system enforcing the acyclicity assumption. The width arithmetic stays at 8 bits throughout because `+.` is the truncating add and `>>` does not grow; the growing `+` would have forced `uint<9>` and a widening cast at every level. Note what happens to `y`: it is read in all four stages, so Spade silently builds it a three-deep delay line, and the register count is $3 \times 8$ bits for the datapath plus $3 \times 8$ more for `y` — the synchronization cost the diagram's "cost = 3 barriers × $w$ flip-flops" understates. Synthesis will absorb every one of these flops into the LUT output registers of the fabric, so on an FPGA the pipelined version and the combinatorial version occupy the same slices.

Simulated against a behavioural reference in Verilog with both entities instantiated side by side: 3010 combinatorial checks and 3008 pipelined checks, including the asymmetric named vectors $(1,128)$, $(128,1)$, $(255,1)$, $(1,255)$, $(170,85)$ and a 3000-vector random sweep — 6018 checks, zero failures. The pipelined output at cycle $t$ equals the combinatorial output of the operands presented at $t-3$, which is the zero-ulp claim made mechanical.

**Related Notes.**

- [[Synchronous Sequential Logic]] – depends-on: the single-clock, edge-triggered discipline that makes a barrier a barrier; without it "one result per cycle" is meaningless.
- [[Introduction to Flip-Flops & Latches]] – depends-on: the setup and clock-to-output delays that turn $\delta_{\text{reg}}$ from an idealization into the thing that caps $N$.
- [[Pipeline Synchronization Delay Line]] – extends: the hardware the scheduler actually emits once $N$ is known, including the delay line `y` needed above.
- [[Register Sandwich]] – supports: supplies the input and output registers of panel (a), which FloPoCo deliberately never inserts.
- [[Pipelined Floating-Point Adder]] – extends: this derivation applied to FPAdd at 400 MHz, with the real dependency graph and real delays.
- [[Self-Checking Test Bench]] – supports: adapts to the reported depth, which is how the "same function" claim gets checked rather than asserted.
- [[FPGAs]] – compares: the free output flip-flop per logic element is why $N$ can be pushed much further here than in a standard-cell flow.
- [[CORDIC]] – counter-example: an iterative algorithm, which this scheme handles only by unrolling it into a DAG first.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- A.2.5 Automatic Pipelining, the User Point of View, pp. 766–769; Fig. A.2 p. 767 (redrawn above), Fig. A.3 p. 769, footnote 1 p. 767
- A.3.3 Automatic Pipelining, pp. 772–774 (the scheduler that solves for $N$; "circuit time" box p. 774)

[Hri+02; SC02] on the FO4 optimum and [LS91] on optimal retiming are cited there, p. 768.
