---
title: TDM Slot Table Scheduler
description: "An offline-computed (slot, input) -> output table cycled by a modulo-S counter — a hard latency bound of (S-1)+H and exact n/S bandwidth, paid for by wasted idle reservations."
kind: circuit
source: "No book source — Dally & Towles ch. 15; Goossens et al., Æthereal; Mano & Ciletti ch. 6 (counters, ROM)"
status: seed
spade: simulated
tags: [digital, network-on-chip, tdm, qos, scheduler, counter]
aliases:
  - TDM
  - TDM Scheduler
  - Slot Table
  - Slot Table Scheduler
  - Time-Division Multiplexing
  - Guaranteed-Throughput Scheduler
---

# TDM Slot Table Scheduler

The one router scheduler that contains no arbiter: a modulo-$S$ counter indexes a table of pre-solved permutations, so contention is impossible by construction rather than resolved after the fact.

```tikz title="TDM slot table scheduler: modulo-S counter, slot table, crossbar; the table and the time base for S=6, p=5"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % ================= top: datapath =================
  \node[anchor=west,font=\bfseries] at (-1.5,5.6) {datapath: one counter, one table, no arbiter};

  \draw[fill=white] (0,2.3) rectangle (2.5,3.6);
  \node[font=\footnotesize] at (1.25,3.22) {mod-$S$ counter};
  \node[font=\footnotesize] at (1.25,2.72) {$s\!\leftarrow\!(s{+}1)\bmod S$};
  \draw[->] (-1.5,2.95) -- (0,2.95);
  \node[anchor=south,font=\footnotesize] at (-0.75,3.0) {clk};

  \draw[->] (2.5,2.95) -- (4.4,2.95);
  \node[anchor=south,font=\footnotesize] at (3.45,3.0) {$s$: $\lceil\log_2 S\rceil$};

  \draw[fill=white] (4.4,1.9) rectangle (7.4,4.0);
  \node[font=\footnotesize] at (5.9,3.60) {slot table};
  \node[font=\footnotesize] at (5.9,3.15) {$S\times p$ entries};
  \node[font=\footnotesize] at (5.9,2.70) {$S p\lceil\log_2 p\rceil$ bits};
  \node[font=\footnotesize] at (5.9,2.22) {(write port: config)};

  \draw[->] (5.9,4.0) -- (5.9,5.0) -- (11.0,5.0) -- (11.0,4.5);
  \node[anchor=south,font=\footnotesize] at (8.2,5.04)
    {$\mathrm{sel}[0..p{-}1]$: $p\lceil\log_2 p\rceil$};

  \draw[fill=white] (9.8,0.6) rectangle (12.2,4.5);
  \node[rotate=90,font=\footnotesize] at (11.0,2.55) {$p\times p$ crossbar};
  \foreach \y in {1.1,1.75,2.4,3.05,3.7}{
    \draw[->] (8.3,\y) -- (9.8,\y);
    \draw[->] (12.2,\y) -- (14.0,\y);}
  \node[anchor=south,font=\footnotesize] at (9.05,3.76) {$\mathrm{in}_i$: $w$};
  \node[anchor=south,font=\footnotesize] at (13.0,3.76) {$\mathrm{out}_j$: $w$};
  \node[anchor=west,font=\footnotesize,text width=6.0cm] at (-1.5,0.55)
    {No requests, no grants, no round-robin state: the schedule was solved
     offline, so the ``allocator'' is a counter and a memory read.};

  % ================= bottom left: the table, S=6, p=5 =================
  \begin{scope}[yshift=-5.4cm]
  \node[anchor=west,font=\bfseries] at (-1.5,3.5) {slot table, $S=6$, $p=5$ (entry = output port)};
  \foreach \p/\x in {N/0, E/1, S/2, W/3, L/4}{
    \node[font=\footnotesize] at (0.55+\x*0.95,2.85) {in $\p$};}
  \foreach \s in {0,1,2,3,4,5}{
    \node[anchor=east,font=\footnotesize] at (-0.15,2.35-\s*0.55) {slot \s};}
  % highlighted connection: input E -> output L, slots 0 and 3
  \draw[fill=black!12,draw=none] (1.03,2.13) rectangle (1.97,2.58);
  \draw[fill=black!12,draw=none] (1.03,0.48) rectangle (1.97,0.93);
  \foreach \s in {0,1,2,3,4,5}{ \draw[gray] (0.08,2.13-\s*0.55) rectangle (4.82,2.58-\s*0.55); }
  \foreach \x in {1,2,3,4}{ \draw[gray] (0.08+\x*0.95,2.58) -- (0.08+\x*0.95,-0.62); }
  \foreach \s/\a/\b/\c/\d/\e in {%
    0/E/L/W/{--}/N,
    1/{--}/N/L/E/{--},
    2/S/{--}/{--}/L/E,
    3/S/L/N/{--}/{--},
    4/{--}/S/E/N/W,
    5/W/{--}/{--}/{--}/S}{
    \node[font=\footnotesize] at (0.55,2.35-\s*0.55) {\a};
    \node[font=\footnotesize] at (1.50,2.35-\s*0.55) {\b};
    \node[font=\footnotesize] at (2.45,2.35-\s*0.55) {\c};
    \node[font=\footnotesize] at (3.40,2.35-\s*0.55) {\d};
    \node[font=\footnotesize] at (4.35,2.35-\s*0.55) {\e};}
  \node[anchor=west,font=\footnotesize,text width=6.2cm] at (-1.5,-1.55)
    {Every row is a partial permutation, so no two connections ever contend.
     $12$ of the $30$ entries are ``--'': reserved capacity nobody uses,
     and unrecoverable unless best-effort traffic scavenges it.};
  \end{scope}

  % ================= bottom right: the time base =================
  \begin{scope}[xshift=8.6cm,yshift=-5.4cm]
  \node[anchor=west,font=\bfseries] at (-0.5,3.5) {shaded connection $\mathrm{E}\!\to\!\mathrm{L}$, $n=2$ of $S=6$};
  \foreach \i in {0,...,11}{
    \pgfmathtruncatemacro{\m}{mod(\i,6)}
    \draw[gray] (\i*0.62,1.9) rectangle (\i*0.62+0.62,2.5);
    \node[font=\footnotesize] at (\i*0.62+0.31,2.2) {\m};}
  \foreach \i in {0,3,6,9}{
    \draw[fill=black!12,draw=gray] (\i*0.62,1.9) rectangle (\i*0.62+0.62,2.5);
    \node[font=\footnotesize] at (\i*0.62+0.31,2.2) {\pgfmathparse{int(mod(\i,6))}\pgfmathresult};}
  \node[anchor=north east,font=\footnotesize] at (7.44,1.82) {cycle $\rightarrow$};
  \draw[<->] (0.62,1.35) -- (3.72,1.35);
  \node[anchor=south,font=\footnotesize] at (2.17,1.36) {worst wait $S{-}1=5$};
  \draw[<->] (0.0,0.75) -- (3.72,0.75);
  \node[anchor=south,font=\footnotesize] at (1.86,0.78) {period $S=6$};
  \node[anchor=west,font=\footnotesize,text width=6.6cm] at (-0.5,-0.55)
    {Bandwidth $=\tfrac{n}{S}w=\tfrac{1}{3}w$ bits/cycle, exactly, every
     revolution. Latency $\le (S{-}1)+H$: at most $S{-}1$ cycles waiting for
     the reserved slot, then $H$ hops with zero contention. A hard bound,
     not a mean.};
  \end{scope}
\end{circuitikz}
\end{document}
```

**Move the nondeterminism out of the hardware and into a solver.** Every other scheduler in this topic — the [[Round-Robin Arbiter]], the [[Separable Input-First Allocator]], the [[Wavefront Allocator]] — answers the same question at run time: several inputs want the same output this cycle, who gets it? TDM refuses the question. Fix a period of $S$ cycles, call cycle $t$'s residue $s = t \bmod S$ the *slot*, and precompute a function

$$\sigma:\ \{0,\dots,S-1\}\times\{0,\dots,p-1\}\ \longrightarrow\ \{0,\dots,p-1\}\cup\{\perp\}$$

mapping (slot, input port) to an output port, or $\perp$ for idle. Impose exactly one constraint on $\sigma$, that every row be **injective on its non-$\perp$ entries** — for fixed $s$, $\sigma(s,i)=\sigma(s,i')\Rightarrow i=i'$. That is precisely the legality condition the [[Crossbar Switch]] cannot check for itself ($\sum_i x_{ij}\le 1$ per output column), and if it holds in the table it holds in every cycle of every execution. Contention is then not resolved; it is *absent*. The hardware left over is a counter, a memory read and the crossbar's select wires.

**Read the bandwidth straight off the period.** A connection $c$ occupying $n_c$ of the $S$ rows transmits one $w$-bit flit in each of those rows and nothing in the others, so over one revolution it moves $n_c w$ bits in $S$ cycles:

$$\text{bandwidth}(c) = \frac{n_c}{S}\,w \quad\text{bits/cycle}.$$

Two properties follow that no work-conserving scheduler can offer. First the figure is *exact and time-invariant*, not a long-run average: the connection gets $n_c w$ bits in **every** window of $S$ consecutive cycles, regardless of what any other connection does, because no other connection can even name those rows. Second, allocation is **quantised** to $w/S$ bits/cycle — a request for $0.31w$ with $S=6$ must round up to $2/6 = 0.33w$ and the excess is burned. Raising $S$ refines the quantum linearly and, as the next paragraph shows, inflates the latency bound by the same factor. That trade is the entire design space of the parameter $S$.

**The latency bound is a wait plus a walk, and the walk has no queueing term.** Decompose the end-to-end latency of one flit into injection wait plus network transit. Transit is $H$ router traversals ([[Dimension-Order Routing Unit]] fixes the path, so $H$ is known offline), and *each* traversal is contention-free by the row-injectivity property, so transit contributes exactly $H$ with no distribution around it — the term that is a queueing integral in every other scheduler is a constant here. The wait is bounded by the gap between consecutive reserved slots: a flit that becomes ready one cycle after its slot has passed waits for the counter to come round. With $n_c=1$ that gap is $S$, so the wait is at most $S-1$ and

$$\text{latency} \le (S-1) + H .$$

Spacing $n_c>1$ slots as evenly as the table allows shrinks the worst gap to $\lceil S/n_c\rceil$ and the bound to $\lceil S/n_c\rceil - 1 + H$; the diagram's $\mathrm{E}\!\to\!\mathrm{L}$ connection holds slots $\{0,3\}$, which is the even placement for $n_c=2$, $S=6$, and still shows $S-1=5$ because the arrow measures the un-spaced worst case. Nothing in either expression is statistical, which is why this is the only NoC scheduler usable behind a hard real-time deadline.

**Count the configuration and the counter, in bits.** An entry names an output port or idle: $\lceil\log_2 (p+1)\rceil$ bits if $\perp$ needs its own code, $\lceil\log_2 p\rceil$ if idle is folded into a separate valid bit or into an unused code of a non-power-of-two $p$. Taking the compact encoding, one input port's column of the table is $S\lceil\log_2 p\rceil$ bits — the figure quoted in [[Network-On-Chip]] — and the full per-router table is

$$S\,p\,\lceil\log_2 p\rceil\ \text{bits},$$

so a $4\times4$ mesh with $p=5$, $S=64$ carries $16 \times 64 \times 5 \times 3 = 15{,}360$ bits of schedule, comparable to a single router's entire buffer budget. The slot index is a plain unsigned integer of $\lceil\log_2 S\rceil$ bits ([[Number Formats]]) and its counter is the only sequential element in the scheduler: a $\lceil\log_2 S\rceil$-bit register, an incrementer, and — because $S$ is almost never a power of two — an equality comparator against $S$ and a mux back to zero ([[Synchronous Counters]]). Choosing $S=2^k$ deletes the comparator and the mux and lets the register wrap for free, at the cost of forcing every bandwidth request onto a dyadic grid.

> [!important] The counter is global state that no wire carries
> All $N$ routers must agree on $s$ at every cycle, or a flit arrives at hop $i+1$ during a slot that was reserved for someone else and the injectivity guarantee — which is a *per-router, per-row* property — stops composing into an end-to-end guarantee. Nothing in the datapath enforces the agreement: the routers are only in phase because they were reset together and share a clock. That is a synchronous-network assumption, and it is why TDM and GALS are hard to combine — a [[Dual-Clock Asynchronous FIFO]] on a link deliberately decouples the two ends, which is exactly the coupling TDM depends on. Mesochronous is survivable (constant phase, so the slot boundary is merely shifted by a known amount); unrelated frequencies are not.

**The cost is written on the face of the table: the dashes.** Utilisation is $\sum_c n_c / (Sp)$, and every entry not claimed by a connection is bandwidth that physically exists and cannot be used, because the crossbar select for that slot is a constant no request can override. The diagram's table wastes $12/30 = 40\%$, which is unremarkable for a real schedule. This is the precise inverse of the [[Deficit Round Robin Scheduler]]'s property: DRR is work-conserving and therefore never idles a busy output, but its guarantee is a long-run share with no bound on any individual flit. The standard resolution is neither — it is a hybrid, where the TDM table drives the guaranteed class and a best-effort [[Virtual Channel Buffer]] scavenges every slot whose reserved owner has nothing to send, using a conventional arbiter that is only ever consulted on idle slots. The guaranteed class keeps its hard bound because a scavenger by construction never occupies a claimed slot.

**On FPGA the table is small enough to be logic, and on ASIC it usually should be.** At $S=64$, $p=5$ a router's table is $960$ bits: a BRAM is 18 Kb, so committing one to the schedule wastes 95% of it and the right primitive is distributed RAM or a small LUT-based ROM ([[Lookup-Tables]]); move to [[Block Memory]] only if $S$ runs into the hundreds or the table must be reconfigured while traffic flows and you want a true dual-port write. Notice what the ASIC version becomes if the schedule is frozen at tapeout: the "memory" is a function of $\lceil\log_2 S\rceil$ address bits producing $p\lceil\log_2 p\rceil$ output bits, i.e. $15$ Boolean functions of $6$ variables, which synthesis will collapse into random logic far smaller than any array — the table disappears entirely and the scheduler is a counter plus two levels of gates. Conversely the FPGA case makes reconfigurability nearly free, since the LUT contents are already writable, which is why FPGA NoC work leans on TDM more than ASIC work does.

$$\boxed{\ \text{bw}=\frac{n_c}{S}w,\qquad \text{lat}\le\Bigl\lceil\frac{S}{n_c}\Bigr\rceil-1+H,\qquad \sigma(s,\cdot)\ \text{injective},\qquad S p\lceil\log_2 p\rceil\ \text{config bits}\ }$$

**When it breaks.**

- **The offline problem is the hard part, and it is not hardware.** Finding $\sigma$ for a given demand matrix is a joint routing-and-scheduling assignment; even ignoring paths, decomposing a demand matrix into $S$ permutations is a bipartite edge-colouring, and adding fixed multi-hop paths that must line up slot-by-slot along the route makes it a constraint problem solved by heuristics.
- **It cannot react.** Traffic whose rate is unknown at compile time gets either a reservation it does not use or no reservation at all. A burst that exceeds $n_c w/S$ does not slow down gracefully — it queues at the source indefinitely, because the network will not give it a cycle it did not book.
- **Raising $S$ has a floor and a ceiling.** Below $S \approx p$ there are not enough rows to give every port a turn; above a few hundred the $(S-1)$ latency term dominates the $H$ term entirely and the "guaranteed" latency is worse than the *mean* latency of a plain [[Wormhole Flow Control]] router under light load. TDM wins on the tail, never on the mean.
- **Slot skew ruins composition.** The bound assumes a flit leaving router $k$ in slot $s$ arrives at router $k{+}1$ in time for slot $s{+}1$. Insert a pipeline register in a long link — the standard fix for FPGA routing delay — and every downstream row of every table on that path must shift by one, or the reservation is missed and the guarantee is silently gone. A schedule is only valid for the exact pipeline depth it was compiled against.
- **One flit per slot per port, no more.** The table reserves a crossbar path, not a buffer; a multi-flit packet occupies $L$ slots of the same connection and therefore $L\cdot S/n_c$ cycles, so packetisation overhead scales with the reservation's sparsity, not with $L$ alone.

> [!warning] Choosing $S$ and assigning slots is not covered in the source
> The long-form note gives the bandwidth and latency formulas but no method for picking $S$ from a set of rate requirements, and no slot-assignment heuristic. Both are needed to build a real TDM NoC and neither is derived here.

**RTL (Spade).**

```spade
/// Modulo-S slot counter: the time base every TDM router must agree on.
entity slot_counter<#uint S, #uint B>(clk: clock, rst: bool) -> uint<B> {
    reg(clk) s reset(rst: 0) = if s + 1 == S { 0 } else { trunc(s + 1) };
    s
}

/// Slot table scheduler: the counter indexes one row, and that row is this
/// cycle's crossbar select vector. No requests, no grants, no arbitration.
entity tdm_sched<#uint S, #uint P, #uint B, #uint SW>(
    clk: clock,
    rst: bool,
    slot_table: [[uint<SW>; P]; S],
) -> [uint<SW>; P] {
    let s = inst slot_counter::<S, B>(clk, rst);
    slot_table[s]
}
```

`slot_table` is the drawn grid — outer index the slot, inner index the input port — and the returned `[uint<SW>; P]` is the bundle of $p$ select fields feeding the crossbar's top edge, so this entity is everything in the diagram *except* the crossbar. Widths: $B=\lceil\log_2 S\rceil$ for the slot, $SW=\lceil\log_2 P\rceil$ per entry, $S\cdot P\cdot SW$ bits of table. The comparison is written `s + 1 == S` rather than `s == S - 1` because `+` widens to $B{+}1$ bits, which is also the honest hardware: the wrap test needs the incrementer's carry-out, and only when $S=2^B$ does it vanish. Exactly one register exists here — the slot — and the table read is combinational, so synthesis will infer distributed RAM or, given a constant table, dissolve the lookup into gates on $s$; either way the timing path from counter to crossbar select is what limits the clock, not the table's nominal "memory" latency.

Verified by simulating the monomorphisation `tdm_sched::<6, 5, 3, 3>` — $S=6$ so the wrap is a real comparator and not a free power-of-two roll-over — against a behavioural model over 3030 vectors: 18 cycles on a fixed asymmetric table where entry $(s,i) = (5s+i)\bmod 8$, a one-hot table with a single non-zero entry at slot 3, and 3000 cycles with the whole 90-bit table re-randomised each cycle. Zero mismatches. As a negative control, changing the wrap constant from 6 to 8 produces 2269 mismatches, which is the bug the asymmetric table exists to catch.

**Related Notes.**

- [[Crossbar Switch]] – depends-on: the table's row *is* that switch's select vector, and the per-row injectivity condition is the $\sum_i x_{ij}\le 1$ constraint the crossbar assumes but cannot enforce.
- [[Synchronous Counters]] – depends-on: the modulo-$S$ counter is the entire time base; whether $S$ is a power of two decides if the wrap costs a comparator and a mux or nothing.
- [[Block Memory]] – depends-on: where the table lives once $S$ is large or must be rewritten under traffic; below a few thousand bits, distributed RAM or plain logic wins.
- [[Deficit Round Robin Scheduler]] – compares: work-conserving and never idles an output, but offers a long-run share instead of a per-flit bound — the exact opposite trade.
- [[Priority Aging Arbiter]] – compares: the other route to bounded latency, statistical and run-time, with no offline solver and no wasted reservation.
- [[Separable Input-First Allocator]] – counter-example: computes a matching every cycle at run time; TDM is the same matching computed once, offline, and replayed.
- [[Wormhole Flow Control]] – counter-example: lower mean latency at light load and no configuration at all, but a tail that no deadline can be written against.
- [[Virtual Channel Buffer]] – supports: the best-effort class that scavenges idle slots needs its own VC so it can never block the guaranteed class.
- [[Dual-Clock Asynchronous FIFO]] – counter-example: deliberately decouples the two ends of a link, destroying the global slot phase this scheduler's end-to-end bound rests on.
- [[Network-On-Chip]] – supports: the QoS section this note re-cuts, and the source of the $\lambda_{\max}$ and $H$ terms the latency bound composes with.

## References

- Local: [[Network-On-Chip]] §"Quality of service and virtual channels" (the $n/S$ bandwidth and $(S-1)+H$ latency expressions, the $S\lceil\log_2 p\rceil$ per-port configuration figure, and the hybrid guaranteed/best-effort compromise); §"Clocking: synchronous, mesochronous, GALS" (why a global slot phase survives mesochronous links and not GALS); §"FPGA mapping" (BRAM-versus-distributed-RAM crossover and LUT arity).
- Dally & Towles, *Principles and Practices of Interconnection Networks* (Morgan Kaufmann, 2004) — ch. 15 on non-interfering networks and time-division scheduling, ch. 19 for the allocator this circuit replaces.
- Goossens, Dielissen & Rădulescu, "Æthereal Network on Chip: Concepts, Architectures, and Implementations", *IEEE Design & Test* 22(5), 2005 — the canonical slot-table router, contention-free routing and the guaranteed/best-effort split.
- Mano & Ciletti, *Digital Design* — synchronous modulo-$N$ counters with terminal-count wrap, and the ROM-as-combinational-function equivalence used in the ASIC paragraph.
