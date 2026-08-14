---
title: "C-Slow Retiming"
description: "Replace every register with C in series and interleave C independent problem instances, dropping the iteration bound C-fold at C times the per-instance latency — the only way under an FSM's next-state floor."
kind: circuit
source: "0.4) Synchronous Sequential Logic, §Pipelining and retiming, §FPGA mapping; Leiserson & Saxe, Algorithmica 6 (1991)"
status: seed
spade: simulated
tags: [digital, synchronous-sequential-logic, retiming, pipelining, throughput, fpga, interleaving]
aliases:
  - C-Slow Retiming
  - C-Slow
  - C-Slowing
  - C-Slowed
  - C-slow retiming
---

# C-Slow Retiming

**One-line summary:** C-slow retiming multiplies the register count on *every* edge of the circuit graph by $C$ before retiming, which is the only transformation that lowers the iteration bound itself — at the price that the $C$ register slots must be filled by $C$ genuinely independent problem instances.

```tikz title="C-slow retiming of a feedback loop: three registers around the cycle instead of one"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---------- row A: the original loop, one register ----------
  \draw (0,3.0) rectangle (2.2,4.0);
  \node at (1.1,3.5) {$\delta$, \ $t_{pd}=T$};
  \draw (3.2,3.0) rectangle (4.0,4.0);
  \node at (3.6,3.5) {R};
  \draw[->] (2.2,3.5) -- (3.2,3.5);
  \node[anchor=south] at (2.7,3.55) {$s$};
  \draw[->] (1.1,4.9) -- (1.1,4.0);
  \node[anchor=west] at (1.2,4.7) {$x$ \ ($k$ bits)};
  \draw[->] (4.0,3.5) -- (5.9,3.5);
  \node[anchor=south] at (5.6,3.55) {$q$};
  \draw[->] (5.0,3.5) -- (5.0,2.4) -- (-1.0,2.4) -- (-1.0,3.5) -- (0,3.5);
  \filldraw (5.0,3.5) circle (1.6pt);
  \node at (8.0,3.5) {$W(\ell)=1 \ \Rightarrow \ T_c \ge T$};

  % ---------- transformation caption ----------
  \node at (4.0,1.75) {C-slow ($C=3$): $\times C$ registers on every edge, then retime them into $\delta$};

  % ---------- row B: C-slowed and retimed ----------
  \draw (0,0) rectangle (1.4,1.0);   \node at (0.7,0.5) {$\delta_1$};
  \draw (1.9,0) rectangle (2.5,1.0); \node at (2.2,0.5) {R};
  \draw (3.0,0) rectangle (4.4,1.0); \node at (3.7,0.5) {$\delta_2$};
  \draw (4.9,0) rectangle (5.5,1.0); \node at (5.2,0.5) {R};
  \draw (6.0,0) rectangle (7.4,1.0); \node at (6.7,0.5) {$\delta_3$};
  \draw (7.9,0) rectangle (8.5,1.0); \node at (8.2,0.5) {R};
  \draw[->] (1.4,0.5) -- (1.9,0.5);
  \draw[->] (2.5,0.5) -- (3.0,0.5);
  \draw[->] (4.4,0.5) -- (4.9,0.5);
  \draw[->] (5.5,0.5) -- (6.0,0.5);
  \draw[->] (7.4,0.5) -- (7.9,0.5);
  \draw[->] (8.5,0.5) -- (9.8,0.5);
  \node[anchor=south] at (9.5,0.55) {$q$};
  \node[anchor=south] at (1.65,0.55) {$s$};
  \draw[->] (0.7,1.5) -- (0.7,1.0);
  \node[anchor=west] at (0.85,1.35) {$x$ (phase-muxed, $k$ bits)};
  \draw[->] (9.2,0.5) -- (9.2,-0.9) -- (-1.0,-0.9) -- (-1.0,0.5) -- (0,0.5);
  \filldraw (9.2,0.5) circle (1.6pt);
  \node[anchor=south] at (4.0,-0.85) {$3s$ flip-flops total, holding instances $n$, $n-1$, $n-2$};
  \node at (4.0,-1.45) {$W(\ell)=3 \ \Rightarrow \ T_c \ge T/3$, \ one step per instance every 3 cycles};
\end{circuitikz}
\end{document}
```

*Own construction. The two rows are deliberately the same loop, so that the only visible difference is the number of registers the cycle contains — which is the entire content of the transformation.*

**Topic:**

**Start from the bound, because C-slowing is the only lever on its denominator.** [[Retiming]] leaves the register count around every directed cycle $\ell$ invariant, so no legal sequence of register moves escapes

$$T_c \;\ge\; \max_{\text{loops } \ell} \frac{\sum_{v\in\ell} t_{pd}(v)}{W(\ell)}, \qquad W(\ell) = \#\text{registers in }\ell$$

Retiming can only redistribute delay so that the max over *paths* falls to the max over *loops*; once it has, the bound is hard. For a plain machine built to the [[Canonical FSM Structure]] template every loop passes through the one state register, so $W(\ell)=1$ and the bound is the full $t_{pd}(\delta)$. Restructuring $\delta$ shrinks the numerator and changes the logic; C-slowing is the one move that raises the denominator, and it does so without touching $\delta$ at all.

**The transformation is a graph rewrite: multiply the weight of every edge by $C$.** Write the circuit as a graph whose vertices are combinational nodes with delay $t_{pd}(v)$ and whose edges carry a non-negative register count $w(e)$. C-slowing produces $G^{C}$ by setting $w'(e) = C\,w(e)$ for every edge, so for every cycle $W'(\ell) = C\,W(\ell)$ while $\sum_{v\in\ell} t_{pd}(v)$ is untouched. The bound divides by $C$ exactly. Because the scaling is *uniform* — every edge, including edges with $w(e)=0$, which stay at $0$ — the relative register counts on all paths are preserved, and that uniformity is precisely what makes the result a correct circuit rather than a different one. Contrast [[Pipeline Register Insertion]], which adds registers to a chosen feed-forward cut only: that is non-uniform by construction, which is why it is legal across $\lambda$ and illegal across $\delta$.

**C-slowing alone buys nothing; the retiming afterwards is where $T_c$ actually falls.** Immediately after the rewrite the $C$ registers of a former single register sit back to back on the same edge, and the combinational cone between two consecutive registers is still the whole of $\delta$ — bottom row of the diagram before $\delta$ has been cut. Only then does ordinary retiming become useful: it now has $C$ registers to place around the cycle instead of one, and it slides $C-1$ of them backwards into the interior of $\delta$ until the largest register-to-register cone is about $t_{pd}(\delta)/C$. **The two steps are inseparable** — "C-slow" without "retiming" is a latency increase with no frequency gain, and it is a common way to measure a disappointment.

**What the registers hold is $C$ interleaved instances, and thread identity is carried by the cycle phase alone.** After the rewrite, a value launched at cycle $n$ reappears at the loop input at cycle $n+C$, so the machine advances instance $n \bmod C$ on cycle $n$ and no other. There is no thread ID field, no tag, and no arbitration: the phase counter is implicit in the pipeline position, which is why the transformation costs zero control logic. The state widths follow directly — a machine with an $s$-bit state register becomes $C\cdot s$ flip-flops, one $s$-bit context per instance, while $\delta$ itself is **not** replicated. That is the whole economic argument: $C$ copies of the machine would cost $C$ times the combinational area for the same $C\times$ aggregate throughput; C-slowing time-shares one $\delta$ and pays only in flops.

**The interface has to be phase-aware in both directions.** The input $x$ is $k$ bits as before, but on cycle $n$ it must carry instance $n \bmod C$'s input — a $C$-to-$1$ mux driven by a mod-$C$ counter — and the $m$-bit output must be demultiplexed to $C$ sinks on the matching phase. Reset is the sharp corner: a single synchronous reset asserted for one cycle initialises only the register slot that happens to be at that phase, so reset must be held for at least $C$ cycles, or each of the $C$ contexts loaded individually. The same applies to any broadcast enable or flush; a global signal that used to mean "this machine" now means "all $C$ instances", which is usually wrong.

**Latency in cycles goes up by $C$; latency in seconds, in the ideal case, does not.** A computation of $K$ steps took $K$ cycles at $T_c = T$, i.e. $KT$ seconds. C-slowed and retimed to $T_c = T/C$, each instance gets a step every $C$ cycles, so it takes $KC$ cycles $\times\ T/C = KT$ seconds — unchanged. What actually improved is aggregate throughput: $C$ instances complete in the wall-clock time one used to take, so $C\times$. The per-instance latency penalty is therefore real only to the extent the retiming falls short of a perfect $C$-way split of $\delta$; if the best achievable is $T_c = T/2$ at $C=4$, each instance now takes $2KT$ seconds and you have traded latency for throughput at a rate of $2$.

> [!important] C-slowing is not a speed-up, it is a latency-for-throughput trade with $C$ as the exchange rate
> Every statement that C-slowing "makes the design faster" is about $f_{\max}$, never about when any one answer arrives. If there is exactly one stream of work, C-slowing it is strictly worse than not: the clock rises $C\times$, the instance advances every $C$th cycle, and the wall-clock result is the same as before with $C\cdot s$ flops burned. The gain exists only when $C$ independent streams exist to fill the slots.

**On FPGAs the cost is close to free, which is why the technique is far more common there than in ASIC.** The fabric pairs each LUT with a flip-flop that is otherwise dead silicon, so if the design's LUT count already forces $N$ slices, the extra $(C-1)s$ flops may cost literally zero additional area — the same argument that makes [[One-Hot State Encoding]] the FPGA default. Better, a group of $j$ back-to-back registers left uncut on one edge maps into a single [[Lookup-Tables|LUT]] configured as a shift register (SRL), one LUT per bit rather than $j$ flops per bit — but only while the group *is* back to back and needs no reset, so the SRL saving and the retiming that splits the group apart are in direct competition. Cut $\delta$ into $C$ pieces and you get the frequency; leave the registers bunched and you get the area. The other FPGA-specific limit is granularity: depth is quantised to LUT levels, so a $\delta$ that is two LUT6 levels deep cannot usefully be C-slowed past $C=2$ — there is no place to put the third register.

**Where the $C$ streams come from decides whether the technique applies at all.** The natural sources are structural: per-flow state in a packet processor, virtual channels in a [[Network-On-Chip]] router, independent channels of a filter bank in [[LTI Filters]], contexts in a barrel-scheduled processor pipeline. What all of these share is that the instances never communicate through the C-slowed loop; the moment instance $i$'s next state depends on instance $j$'s current state, the interleaving is unsound, because that dependence is an edge whose weight the uniform $\times C$ rewrite has just multiplied along with everything else and the timing relationship it encoded is gone.

**Result.**

$$\boxed{\ w'(e) = C\,w(e)\ \forall e \ \Longrightarrow\ T_c \ \ge\ \max_{\ell}\frac{\sum_{v\in\ell} t_{pd}(v)}{C\,W(\ell)};\quad \text{flops } s \to C s,\quad \text{latency } K \to KC \text{ cycles}\ }$$

**When it breaks.**

- **Fewer than $C$ independent streams.** Throughput degrades linearly with the number of empty slots; at one stream, C-slowing is pure loss. This is the assumption that fails most often, and it fails silently — the circuit is still correct, just slower than the un-slowed original.
- **The largest indivisible node.** Retiming moves registers *between* nodes, never inside one, so the bound is also $T_c \ge \max_v t_{pd}(v)$. A loop containing one 32-bit adder cannot be C-slowed below that adder's delay however large $C$ is; you must first split the node, which is a logic change, not a retiming.
- **Sequencing overhead becomes the floor.** As $T_c \to T/C$ the $t_{pcq} + t_{\text{setup}} + t_{\text{skew}}$ term of [[Introduction to Flip-Flops & Latches|the register-to-register constraint]] stops being negligible. The useful $C$ ends roughly where $T/C \approx t_{pcq}+t_{\text{setup}}$; past that, adding registers adds only overhead.
- **Memory in the loop.** A [[Block Memory|BRAM]] holding machine state must now hold $C$ contexts, so its address widens by $\lceil \log_2 C\rceil$ bits and its capacity requirement multiplies by $C$. Unlike flops, block RAM is not free, and a memory whose read latency is fixed at one cycle is a node the retiming cannot split.
- **Any fixed cycle-count contract.** C-slowing is behaviour-preserving *per instance in instance-time*, not in cycles. A bus protocol, a fixed-latency handshake ([[Handshake Ready-Valid]]), a strobe with a specified pulse width, or anything with a same-cycle combinational response is broken by the transformation and must sit outside the C-slowed island.
- **Power.** $C\times$ the flops toggling at $C\times$ the clock is roughly $C^2$ the sequential switching power for the same work done, offset only by whatever the shorter logic cones save in glitch activity. C-slowing is a frequency technique, and it is priced like one.
- **Reset and safe states.** With $C$ contexts there are $C$ copies of every illegal code, and [[Safe-State FSM Recovery]] logic must run on every phase, not once.

**RTL (Spade).**

```spade
// C-slowed accumulator loop, C = 4: the single state register of
// `reg(clk) acc = acc + x` replaced by four in series.
entity cslow_acc4(clk: clock, rst: bool, x: uint<16>) -> uint<16> {
    decl next;
    reg(clk) s0 reset(rst: 0) = next;
    reg(clk) s1 reset(rst: 0) = s0;
    reg(clk) s2 reset(rst: 0) = s1;
    reg(clk) s3 reset(rst: 0) = s2;
    let next: uint<16> = trunc(s3 + x);
    next
}
```

`s0..s3` are the four R boxes of the bottom row and `trunc(s3 + x)` is the whole of $\delta$ — the un-retimed state, registers bunched on one edge, which is why this source text buys latency and no frequency. All five wires are $s = 16$ bits: `+` widens to `uint<17>` and `trunc` wraps it back, matching the modulo-$2^{16}$ accumulator the reference models. The four registers are the *entire* cost of C-slowing here; the adder is not replicated. What synthesis does differently from the drawing: on an FPGA the un-cut `s0→s1→s2→s3` chain is a shift register with no intermediate taps, so the tools will collapse all four into one SRL per bit — which is the area win described above and simultaneously the reason $T_c$ has not improved. Retiming into $\delta_1,\delta_2,\delta_3$ means giving that up.

Simulated: **3032 vectors, 0 failures** against a behavioural reference of four independent accumulators indexed by a mod-4 phase counter. The first 32 vectors are the asymmetric probe $x = 1,0,0,0,\dots$, which drives only instance 0 and so is sensitive to the chain *depth* in a way a symmetric or uniformly-random stimulus is not; mutating the feedback tap from `s3` to `s2` (i.e. $C=3$) is caught by that probe at vector 6, before the random sweep begins.

**Related Notes (with context):**

- [[Retiming]] – depends-on: supplies the register-conservation invariant and the iteration bound this note attacks, and is the second half of the transformation.
- [[Pipeline Register Insertion]] – compares: the feed-forward answer, which adds registers to a chosen cut and therefore cannot cross $\delta$; C-slowing adds them uniformly and therefore can.
- [[Canonical FSM Structure]] – depends-on: the $q \to \delta \to q$ loop with $W(\ell)=1$ is the floor C-slowing exists to get under.
- [[Choosing an FSM Encoding]] – compares: the other lever on $t_{pd}(\delta)$, acting on the numerator of the bound rather than the denominator.
- [[FSMD Controller-Datapath Split]] – supports: separating control from data is what produces a datapath loop worth C-slowing in the first place.
- [[Network-On-Chip]] – supports: virtual channels are the canonical supply of the $C$ independent instances the technique requires.
- [[One-Hot State Encoding]] – supports: shares the "flip-flops are free in an FPGA slice" argument that makes the $C s$ flop cost affordable.
- [[Safe-State FSM Recovery]] – counter-example: recovery logic that was correct once must now hold on all $C$ phases, and a single-cycle reset no longer initialises the machine.
- [[Synchronous Sequential Logic]] – supports: the topic whose $f_{\max}$ ceiling this note raises.

## References

- `0.4) Synchronous Sequential Logic`, §*Pipelining and retiming* — the pipelining/retiming distinction, the register-conservation invariant, the iteration bound $T_c \ge \max_\ell \sum t_{pd} / \#\text{regs}$, the $W(\ell)=1$ consequence for a plain FSM, and the statement of C-slow retiming as the $C\times$ relaxation of that bound.
- `0.4) Synchronous Sequential Logic`, §*FPGA mapping* — flip-flops being free in a slice already forced by LUT count, and depth quantisation to LUT levels; both are used here to price the $Cs$ flops and to bound useful $C$.
- Leiserson & Saxe, "Retiming Synchronous Circuitry", *Algorithmica* 6 (1991) — the retiming graph model $(t_{pd}(v), w(e))$, legality conditions, and C-slowing as the $w'(e) = C\,w(e)$ rewrite.
- Weste & Harris, *CMOS VLSI Design*, ch. 10 — sequencing overhead $t_{pcq} + t_{\text{setup}}$, which sets the floor at which further C-slowing stops paying.
- Mano & Ciletti, *Digital Design*, ch. 5; Wakerly, *Digital Design: Principles and Practices*, §*Sequential Logic Design Principles* — the baseline synchronous machine and its single-register loop.

> [!warning] Printed page numbers not verified
> This note has no book source in the project's primary text. The canon citations are chapter- and section-level; no copy was consulted, so no page numbers are given.

> [!warning] SRL depth limit not verified against a device datasheet
> The claim that a bunched register chain collapses into one LUT-based shift register per bit is the standard Xilinx SRL mapping, but the maximum depth a single LUT can absorb is device-family-specific and was not checked here. Treat "one LUT per bit" as valid only for small $C$ until confirmed against the target family's configuration guide.
