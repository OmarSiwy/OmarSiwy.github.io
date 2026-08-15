---
title: Mesochronous Link FIFO
description: "A 2-4 flit phase-tolerant buffer with a strobe trained once at reset — crosses a constant-phase clock boundary with no synchronizer latency, freeing the design from a global skew budget."
kind: circuit
source: "6.3) Network-On-Chip §Clocking: synchronous, mesochronous, GALS — no book source"
status: seed
spade: simulated
tags: [digital, network-on-chip, clocking, cdc, fifo, timing, fpga]
aliases:
  - Mesochronous FIFO
  - Mesochronous Synchronizer
  - Phase-Tolerant FIFO
  - Phase-Compensation FIFO
  - Mesochronous Link
---

# Mesochronous Link FIFO

A depth-$N$ ring buffer whose write and read pointers free-run in two clock domains of *identical frequency and fixed unknown phase*, never compare themselves against each other, and are simply released with a whole-cycle offset trained once at reset — which is what removes both the synchronizer and its latency from the crossing.

```tikz title="Mesochronous link FIFO: free-running write and read ring pointers with a trained offset, and the sampling window the offset has to land in"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]
  % ================= datapath ($N=4$ drawn) =================
  % domain boundary: the only wires crossing it are the four cell read buses
  \draw[dashed,gray] (5.25,-0.15) -- (5.25,5.7);
  \node[anchor=south east] at (5.15,5.7) {transmit domain, $\mathrm{clk_{tx}}$};
  \node[anchor=south west] at (5.35,5.7) {receive domain, $\mathrm{clk_{rx}}$, phase $\phi$};

  \draw (2.4,1.5) rectangle (3.0,5.1);
  \node[rotate=90] at (2.7,3.3) {1:$N$ write demux};

  \foreach \k/\y in {3/4.3, 2/3.4, 1/2.5, 0/1.6} {
    \draw (3.3,\y) rectangle (5.1,\y+0.7);
    \node at (4.2,\y+0.35) {cell $\k$ \ / \ $w$};
    \draw[->] (3.0,\y+0.35) -- (3.3,\y+0.35);
    \draw[->] (5.1,\y+0.35) -- (5.4,\y+0.35);
  }

  \draw (5.4,1.5) rectangle (6.0,5.1);
  \node[rotate=90] at (5.7,3.3) {$N$:1 read mux};

  \draw[->] (0.4,3.3) -- (2.4,3.3);
  \node[anchor=south] at (1.4,3.4) {flit in \ / \ $w$};
  \draw[->] (6.0,3.3) -- (6.8,3.3);
  \draw (6.8,2.95) rectangle (8.0,3.65);
  \node at (7.4,3.3) {reg $q$};
  \draw[->] (8.0,3.3) -- (9.6,3.3);
  \node[anchor=south] at (9.0,3.4) {flit out \ / \ $w$};

  % pointers
  \draw (1.5,0.2) rectangle (3.9,0.95);
  \node at (2.7,0.575) {$wp \leftarrow wp{+}1$};
  \draw[->] (2.7,0.95) -- (2.7,1.5);
  \node[anchor=west] at (2.78,1.25) {$\lceil\log_2 N\rceil$};

  \draw (5.4,0.2) rectangle (7.8,0.95);
  \node at (6.6,0.575) {$rp \leftarrow rp{+}1$};
  \draw[->] (5.7,0.95) -- (5.7,1.5);
  \node[anchor=west] at (5.78,1.25) {$\lceil\log_2 N\rceil$};

  \draw[->] (0.4,0.575) -- (1.5,0.575);
  \node[anchor=south] at (0.95,0.64) {$\mathrm{clk_{tx}}$};
  \draw[->] (9.6,0.575) -- (7.8,0.575);
  \node[anchor=south] at (8.7,0.64) {$\mathrm{clk_{rx}}$};

  \draw[->] (6.6,-0.5) -- (6.6,0.2);
  \node[anchor=north] at (6.6,-0.55) {reset value $=(N-m)\bmod N$};

  % ================= timing =================
  \node[anchor=west] at (-0.2,-2.575) {$\mathrm{clk_{tx}}$};
  \draw (0.8,-2.85) \foreach \x in {0,1,2,3,4}
     { -- (0.9+1.5*\x,-2.85) -- (0.9+1.5*\x,-2.30) -- (1.65+1.5*\x,-2.30) -- (1.65+1.5*\x,-2.85) }
     -- (7.9,-2.85);
  \node[anchor=west] at (-0.2,-4.075) {$\mathrm{clk_{rx}}$};
  \draw (0.8,-4.35) \foreach \x in {0,1,2,3,4}
     { -- (1.4+1.5*\x,-4.35) -- (1.4+1.5*\x,-3.80) -- (2.15+1.5*\x,-3.80) -- (2.15+1.5*\x,-4.35) }
     -- (7.9,-4.35);

  \draw[dotted] (2.4,-2.30) -- (2.4,-5.6);
  \draw[dotted] (4.4,-3.80) -- (4.4,-5.6);
  \draw[dotted] (6.9,-2.30) -- (6.9,-5.6);
  \node[anchor=south,align=center] at (2.4,-2.25) {write\\cell $k$};
  \node[anchor=south,align=center] at (4.4,-3.75) {read\\cell $k$};
  \node[anchor=south,align=center] at (6.9,-2.25) {overwrite\\cell $k$};

  \draw[<->] (2.4,-3.45) -- (2.9,-3.45);
  \node[anchor=west] at (2.95,-3.45) {$\phi$};

  \draw[<->] (2.4,-4.85) -- (4.4,-4.85);
  \node[anchor=south] at (3.4,-4.82) {$\Delta=mT+\phi$};
  \draw[<->] (2.4,-5.45) -- (6.9,-5.45);
  \node[fill=white,inner sep=1.5pt] at (4.65,-5.45) {$NT$};

  \node[anchor=north,align=center] at (4.3,-5.8)
    {$t_{cq}+t_{su}+t_j \ \le\ \Delta \ \le\ NT-t_h-t_j$
     \qquad $\Longrightarrow$ \qquad $N \ \ge\ m+1+\dfrac{t_h+t_j}{T}$};
\end{circuitikz}
\end{document}
```

**Pin down what "mesochronous" grants you, because one word is carrying the entire design.** Two domains are mesochronous when they run at *exactly* the same frequency — physically the same oscillator, so the frequencies are equal by construction and not merely by specification — while the phase offset $\phi$ between the two clock arrivals is unknown at design time and constant at run time. That is the regime you land in when a chip-wide clock is distributed by a set of unbalanced local trees instead of one balanced global grid: the insertion delay differs per tile, so $\phi$ differs per tile, but nothing about $\phi$ moves once the PLL has locked. Contrast the two neighbours it is easy to confuse it with. *Plesiochronous* domains have nominally equal frequencies from two independent sources, so $\phi$ drifts at the ppm difference and eventually walks through every value; *heterochronous* (the GALS case) domains have unrelated frequencies. Only the mesochronous case makes $\phi$ a **constant**, and constancy is what turns a probabilistic problem into an arithmetic one.

**Reduce the unknown skew to a fraction of a period, because that is the only part the buffer has to pay for.** The receiver's clock arrives $\phi_{\text{raw}}$ later than the transmitter's, and $\phi_{\text{raw}}$ can be many periods on a die-spanning route. But the receiver clock is periodic, so its edge positions are invariant under a shift by $T$: nothing downstream can distinguish a lag of $\phi$ from a lag of $\phi + T$. Write $\phi_{\text{raw}} = \lfloor \phi_{\text{raw}}/T \rfloor\,T + \phi$ with $\phi \in [0,T)$. The integer part is a *whole number of cycles of latency*, and a whole number of cycles is exactly what a pointer offset is — it costs one more ring cell and nothing else. The fractional part $\phi$ is the only piece that can put a data edge on top of a clock edge, and it is the only piece the timing argument has to survive. **A mesochronous FIFO is the circuit that converts unbounded skew into bounded skew plus latency.** That decomposition is why the buffer is 2–4 flits deep instead of proportional to the die.

**Delete the pointer comparison, because equal frequencies make the occupancy a constant.** In a [[Dual-Clock Asynchronous FIFO]] the write pointer must be sampled in the read domain and vice versa, because the two sides advance at different long-run rates and the occupancy is genuinely unknown to both. Here the rates are *identical*: over any window of $n$ cycles the writer performs exactly $n$ writes and the reader exactly $n$ reads, so the difference $wp - rp$ is fixed for all time at whatever value reset established. Full and empty never occur, there is nothing to compute, and consequently **nothing crosses the domain boundary except the data itself**. Both pointers are plain free-running modulo-$N$ counters ([[Counters]]) of $\lceil\log_2 N\rceil$ bits, or $N$-bit one-hot ring counters if the decode is on the critical path; no Gray coding is needed, because Gray coding exists to make a *sampled* multi-bit value safe and nothing samples these. The write side is a $1{:}N$ demultiplexed enable over $N$ registers of $w$ bits; the read side is one $N{:}1$ multiplexer of $w$ bits, combinational, followed by a capture register in the receive domain.

**Turn "the read must land safely" into one inequality on the trained offset.** Let $m$ be the number of cells the reader trails the writer by, so the reader's capture edge for cell $k$ occurs $m$ transmit periods plus the phase lag after that cell was written:

$$\Delta \;=\; mT + \phi, \qquad \phi \in [0,T)$$

Two things must hold at the capture register, and they are exactly the setup and hold constraints of an ordinary flip-flop applied to a launch and a capture on different clocks ([[Introduction to Flip-Flops & Latches]]). Setup: the cell's output must have settled — clock-to-Q of the write register plus the mux and wire delay, folded here into $t_{cq}$, plus the capture register's $t_{su}$ — before the read edge. Hold: the read edge must occur before the *writer comes back around and overwrites that cell*, which happens $NT$ after the write. Charging the peak-to-peak jitter $t_j$ of the two clocks against both ends:

$$t_{cq} + t_{su} + t_j \;\le\; \Delta \;\le\; NT - t_h - t_j$$

The lower bound is a normal launch-to-capture setup check; the upper bound is what makes this circuit specific — **the hold check is not against the next clock edge, it is against the next lap of the ring**, and that is precisely what the depth buys.

> [!important] This is a static timing check, not an MTBF calculation
> Because $\phi$ is constant, the inequality above is either satisfied for all time or violated for all time. There is no exponential resolution tail and no two-flop synchronizer because there is no *randomly-timed* event to synchronize: a mesochronous crossing that violates its window fails deterministically at bring-up, and one that satisfies it is as safe as any same-clock path. That is the entire benefit — the crossing is checkable by STA rather than by a probability argument, and it is checkable only if the constraint is actually written. Declaring the two clocks asynchronous in the constraint file, the reflex for anything called a "clock domain crossing", disables the one check that guarantees this circuit works, and the design then passes timing and fails silicon.

**Read the depth off the inequality by asking what a whole-cycle offset can and cannot fix.** The trained offset $m$ moves $\Delta$ only in steps of $T$, so as $\phi$ sweeps $[0,T)$ a fixed $m$ sweeps $\Delta$ over the half-open interval $[mT,\,(m+1)T)$. Requiring that whole interval to sit inside the safe window gives two conditions, $mT \ge t_{cq}+t_{su}+t_j$ and $(m+1)T \le NT - t_h - t_j$, and the first is satisfied by $m = 1$ at any frequency where a register-to-register hop fits in a cycle at all. Substituting $m=1$ into the second:

$$N \;\ge\; 2 + \frac{t_h + t_j}{T}$$

so $N = 3$ is the smallest depth that tolerates an *arbitrary* phase, and $N = 4$ is the usual choice because it makes $\lceil\log_2 N\rceil = 2$ pointers exact and leaves a full period of slack at both ends. $N = 2$ is legal only when the skew is known to be bounded — it needs $\phi \le T - t_h - t_j$, i.e. the receiver's edge must not creep to within a hold time of the writer's next edge — which is the bounded-skew case, and is why the range quoted for these buffers is 2–4 flits rather than a single number. Note the direction of the trade: adding a cell buys hold margin and costs one cycle of latency only if $m$ is also increased; increasing $N$ alone widens the window for free.

**Train $m$ once, and accept that the one-time training is where the synchronizer went.** The steady state has no synchronizer, but the *release* of the two pointers is a genuine asynchronous event and cannot conjure its own safety. Two standard mechanisms, and real links use both. A **reset-time handshake** brings the two counters out of reset with a known relationship: a single reset-release pulse crosses through a two-flop synchronizer, and because it happens once and can be given hundreds of cycles to resolve, its failure probability is negligible even at a resolution time that would be unacceptable per-flit — this is metastability paid once instead of per transfer. A **phase detector**, the "strobe" of the classic bring-up sequence, samples the transmitter's clock or a training pattern with the receiver's clock and reports which part of the period the incoming edge occupies, from which the receiver picks $m$ to centre $\Delta$ in the window rather than merely to fit it inside. Centring is what converts the surviving margin into jitter and drift tolerance, so it is the difference between a link that works and a link that works at one temperature.

> [!warning] The lock sequence itself is not covered by any source in this vault
> The long-form note states only that there is "a strobe positioned in the receiver's safe window, plus one-time training at reset". The detector topology, the training pattern, the number of cycles the lock takes, and whether re-training may be attempted without dropping traffic are all design-specific and are not given here or in the standard textbooks. Treat the two mechanisms above as the shape of the answer, not as a specification.

**Account for what the link pays, in cycles and in area.** Latency added by the crossing is $\lceil \Delta/T \rceil = m+1$ receive cycles in the worst case — $m$ from the pointer offset plus the capture register — and every one of those cycles lands in the credit round trip $t_{crt}$ of [[Credit-Based Flow Control]], in *both* directions, so a mesochronous link raises the buffer floor $B \ge t_{crt}$ by roughly $2(m+1)$. Area is $Nw$ flip-flops, two $\lceil\log_2 N\rceil$-bit counters, an $N$-bit enable decode and one $w$-bit $N{:}1$ multiplexer: for $N=4$, $w=64$ that is 256 flops and 64 four-input muxes, essentially the same storage as the [[Virtual Channel Buffer]] it can be merged into. Against a dual-clock FIFO of the same depth it saves $2\lceil\log_2 N\rceil$ synchronizer flip-flops per pointer, the Gray encode and decode, the full/empty comparators, and 2–3 cycles of latency in each direction. Note also what it is *not*: this is a phase adapter, not a queue, and it performs no flow control at all. It has no full and no empty, so a valid bit must ride alongside the data through the same cells and idle cycles must propagate as idle flits — an ordinary write-enable would break the constant-offset invariant that the whole scheme rests on.

**Note that the payload is untouched, so the accuracy chapter has nothing to say.** No arithmetic is performed: each flit emerges bit-identical and in order, contributing exactly $0$ ulp, so neither [[Number Formats]] nor [[Error Accuracy]] enters the analysis. The only quantity traded is cycles. What *does* have to be exact is the pointer arithmetic — a single dropped or duplicated pointer increment permanently changes $m$, and since nothing ever re-checks $m$, a link that silently loses one increment does not corrupt one flit, it corrupts every flit from then on.

**Map it differently on FPGA than on ASIC, because the phase is a different kind of unknown.** On an ASIC the designer chooses the clock tree and could in principle balance it; the mesochronous FIFO is the deliberate decision *not* to, trading a few flits per link for the $\Theta(N)$ wire and buffer power of a global grid ([[Clock Skew]]). On an FPGA the choice is not offered: several BUFG-driven clock regions fed from one MMCM at the same frequency have insertion delays set by the routing architecture, so $\phi$ is unknown and unbalanceable by construction, and this is the canonical case for the circuit. The ring maps to distributed RAM or a handful of LUT-register pairs — a depth-4 buffer is far too small to justify a block RAM ([[FPGAs]]), which would also force the read to be synchronous and add another cycle. The one FPGA-specific hazard is the write demux: at $N=4$ the enable decode is a single LUT level and free, but a design that grows $N$ to widen the window will find the $N{:}1$ read mux, not the storage, setting $f_{\max}$.

$$\boxed{\ \Delta = mT + \phi,\quad \phi\in[0,T),\quad t_{cq}+t_{su}+t_j \le \Delta \le NT - t_h - t_j \ \Longrightarrow\ N \ge 2 + \tfrac{t_h+t_j}{T}\ }$$

**When it breaks**

- **The phase is not actually constant.** Spread-spectrum clocking, a DVFS frequency step, a PLL relock, or slow thermal drift on a long clock route all move $\phi$ after training. Bounded slow drift can be handled by periodic re-training if the link can be quiesced; unbounded drift means the domains were plesiochronous all along and need a [[Dual-Clock Asynchronous FIFO]] with skip/insert, not this.
- **Two oscillators at the same nominal frequency.** A $\pm 100$ ppm mismatch slips one full cycle every $10^4$ cycles, so $wp - rp$ walks and the buffer eventually reads a cell mid-write. There is no depth that fixes this, because the failure is unbounded in time rather than in phase.
- **Jitter comparable to the margin.** $t_j$ appears at *both* ends of the window, and the two clocks' jitter is only partly common-mode after the trees diverge. At $N=2$ there is essentially no jitter budget left; this is the real argument for $N \ge 3$.
- **Independent reset of the two ends.** If the two counters can leave reset in an arbitrary relationship, $m$ is arbitrary and the window inequality is satisfied only by luck. A shared synchronous reset is not enough either — the release must be ordered consistently with respect to both clocks, which is exactly the job of the one-time handshake.
- **A write-enable added "for efficiency".** Gating writes on data-valid breaks the equal-rate argument, at which point $wp - rp$ is no longer constant and the circuit needs the full pointer comparison it was built to avoid. Valid must be carried *in* the flit.
- **The constraint file calls it asynchronous.** The crossing then has no timing check at all, and the failure mode is a link that works on one device and not the next.
- **Depth grown to widen the window at high $w$.** Past about $N=8$ the $N{:}1$ read mux of $w$ bits starts to cost more delay than the margin it bought, and re-timing the phase — a delay line or a selectable clock edge — becomes cheaper than more cells.

**RTL (Spade)**

```spade
/// Depth-4 phase-tolerant link FIFO for a mesochronous crossing.
/// Both pointers free-run and never talk to each other; `rp0` is the whole-cycle
/// offset trained once at reset, and it is the only thing that sets the margin.
entity meso_fifo4<#uint W>(
    wclk: clock,
    rclk: clock,
    rst: bool,
    d: uint<W>,
    rp0: uint<2>,
) -> uint<W> {
    // transmit domain: free-running 2-bit ring pointer, one cell enabled per cycle
    reg(wclk) wp: uint<2> reset(rst: 0) = trunc(wp + 1);
    reg(wclk) c0: uint<W> reset(rst: 0) = if wp == 0 { d } else { c0 };
    reg(wclk) c1: uint<W> reset(rst: 0) = if wp == 1 { d } else { c1 };
    reg(wclk) c2: uint<W> reset(rst: 0) = if wp == 2 { d } else { c2 };
    reg(wclk) c3: uint<W> reset(rst: 0) = if wp == 3 { d } else { c3 };

    // receive domain: identical counter, released rp0 cells behind the writer
    reg(rclk) rp: uint<2> reset(rst: rp0) = trunc(rp + 1);
    reg(rclk) q: uint<W> reset(rst: 0) = match rp {
        0 => c0,
        1 => c1,
        2 => c2,
        _ => c3,
    };
    q
}
```

`wp` and `rp` are the two counter boxes, the four `if wp == k` registers are the demux and the cells, and the `match rp` is the $N{:}1$ read mux feeding the capture register `q` — the only line in the entity that reads a `wclk` register from an `rclk` register, which is the dashed boundary in the drawing and the one path the window inequality governs. `trunc(wp + 1)` is the modulo-$N$ wrap: `+` grows to `uint<3>` by Spade's width rule and `trunc` discards the carry, which is the correct arithmetic here precisely because the counter is supposed to wrap. `rp0` is a port rather than a constant so that training can set it, and the offset it encodes is $m$ cells of trailing distance as $(N - m) \bmod N$; with `rp0 = 2` and $N = 4$ the reader trails by $m = 2$. Synthesis will do two things the drawing does not show: it will merge the four cells into one distributed-RAM or register-file macro, and it will not by itself constrain the `c*`-to-`q` paths — that constraint is written by hand and is the whole safety argument.

Simulated with two receivers at $+3$ ns and $+8$ ns on a $T = 10$ ns clock, i.e. $\Delta = 23$ ns and $28$ ns against a window upper bound of $NT = 40$ ns: 7995 reads checked against a behavioural reference (asymmetric named vectors `01 80 ff 00 55 aa` then a random sweep), zero mismatches, and the same testbench with `rp0` perturbed by one reports 7957 mismatches — the offset is exactly what the check is sensitive to.

**Related Notes**

- [[Dual-Clock Asynchronous FIFO]] – compares: the same ring with pointer comparison bolted on, which is what you must pay when the frequencies are not identical; this note is that circuit with every synchronizer removed.
- [[Clock Skew]] – depends-on: supplies the distinction between static skew, which the pointer offset absorbs, and jitter, which eats the window from both ends.
- [[Introduction to Flip-Flops & Latches]] – depends-on: the setup/hold pair that the $t_{cq}+t_{su} \le \Delta \le NT - t_h$ window is an instance of, with the hold check retargeted from the next edge to the next lap.
- [[Credit-Based Flow Control]] – supports: the $m+1$ cycles of crossing latency land in $t_{crt}$ in both directions and raise the buffer floor $B \ge t_{crt}$.
- [[Virtual Channel Buffer]] – compares: the per-VC storage this can be merged into, since both are small $w$-bit register rings on the same link.
- [[Bundled-Data Handshake Link]] – counter-example: drops the shared frequency entirely and pays with a data-dependent, un-timeable latency; the mesochronous FIFO keeps a single frequency and stays inside a standard STA flow.
- [[Choosing a Router Architecture]] – compares: where a mesochronous link sits against fully synchronous and GALS clocking in a whole-router budget.

## References

- [[6.3) Network-On-Chip]] — §Clocking: synchronous, mesochronous, GALS (the three clocking regimes, the $\Theta(N)$ clock-distribution cost of the fully synchronous grid, the 2–4 flit phase-tolerant buffer with a strobe in the receiver's safe window and one-time training at reset, and the contrast with the dual-clock FIFO's 2–3 cycle synchronizer cost landing in $t_{crt}$).
- No textbook source for this topic. Standard treatments: Dally & Towles, *Principles and Practices of Interconnection Networks* — mesochronous and plesiochronous link clocking and the phase-compensation buffer; Weste & Harris, *CMOS VLSI Design* — clock distribution, insertion delay, jitter budgeting and synchronizer failure; Wakerly, *Digital Design: Principles and Practices* — ring counters and the setup/hold formulation used here. Page numbers are deliberately omitted; no copy was consulted while writing.
