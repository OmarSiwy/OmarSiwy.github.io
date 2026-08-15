---
title: "Dual-Clock Asynchronous FIFO"
description: "Gray-coded write/read pointers cross-sampled through two-flop synchronizers — safe full/empty across unrelated clocks because one bit changes per increment, at 2-3 cycles of added credit round-trip."
kind: circuit
source: "6.3) Network-On-Chip §Clocking: synchronous, mesochronous, GALS — no book source"
status: seed
spade: simulated
tags: [digital, network-on-chip, cdc, gals, gray-code, synchronizer, fifo, fpga]
aliases:
  - Asynchronous FIFO
  - Async FIFO
  - Dual-Clock FIFO
  - CDC FIFO
  - Clock Domain Crossing FIFO
  - Gray-Code Pointer FIFO
---

# Dual-Clock Asynchronous FIFO

A queue whose write and read ports are clocked by unrelated oscillators, made safe not by synchronizing the data but by Gray-coding the two pointers so that a mid-transition sample of either one can only return the value before the increment or the value after it.

```tikz title="Dual-clock asynchronous FIFO: Gray-coded pointers cross through two-flop synchronizers, data does not cross at all"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]
  % ---- domain enclosures ----
  \draw[dashed,gray] (-0.4,-3.3) rectangle (6.6,2.4);
  \node[anchor=east,gray,align=center] at (-0.6,0.6) {write\\domain\\(\texttt{wclk})};
  \draw[dashed,gray] (8.6,-3.3) rectangle (15.6,2.4);
  \node[anchor=west,gray,align=center] at (15.8,0.6) {read\\domain\\(\texttt{rclk})};

  % ---- storage ----
  \draw (5.0,3.3) rectangle (11.0,4.3);
  \node[align=center] at (8.0,3.8) {dual-port RAM, $2^{N}\times w$\\[-2pt]\scriptsize write on \texttt{wclk}, read combinational};

  % ---- write domain blocks ----
  \draw (0.2,0.9) rectangle (3.0,2.1);
  \node[align=center] at (1.6,1.5) {write pointer\\[-2pt]\scriptsize $w_{bin}\!+\!1$ when $\overline{\text{full}}$};

  \draw (3.8,0.9) rectangle (5.8,2.1);
  \node[align=center] at (4.8,1.5) {Gray encode\\[-2pt]\scriptsize $b\oplus(b\!\gg\!1)$};

  \draw (3.8,-0.7) rectangle (5.8,0.3);
  \node at (4.8,-0.2) {$w_g$ reg};

  \draw (0.2,-2.5) rectangle (3.2,-1.1);
  \node[align=center] at (1.7,-1.8) {full detect\\[-2pt]\scriptsize top two bits differ,\\[-2pt]\scriptsize rest equal};

  % ---- read domain blocks ----
  \draw (12.2,0.9) rectangle (15.0,2.1);
  \node[align=center] at (13.6,1.5) {read pointer\\[-2pt]\scriptsize $r_{bin}\!+\!1$ when $\overline{\text{empty}}$};

  \draw (9.6,0.9) rectangle (11.6,2.1);
  \node[align=center] at (10.6,1.5) {Gray encode\\[-2pt]\scriptsize $b\oplus(b\!\gg\!1)$};

  \draw (9.6,-0.7) rectangle (11.6,0.3);
  \node at (10.6,-0.2) {$r_g$ reg};

  \draw (12.0,-2.5) rectangle (15.0,-1.1);
  \node[align=center] at (13.5,-1.8) {empty detect\\[-2pt]\scriptsize all bits equal};

  % ---- synchronizers in the channel ----
  \draw (6.8,1.0) rectangle (8.5,2.0);
  \node[align=center] at (7.65,1.5) {2-FF sync\\[-2pt]\scriptsize in \texttt{rclk}};

  \draw (6.8,-2.4) rectangle (8.5,-1.4);
  \node[align=center] at (7.65,-1.9) {2-FF sync\\[-2pt]\scriptsize in \texttt{wclk}};

  % ---- write side wiring ----
  \draw[->] (3.0,1.5) -- (3.8,1.5);
  \node[anchor=south] at (3.4,1.55) {\scriptsize $N{+}1$};
  \draw[->] (4.8,0.9) -- (4.8,0.3);
  \fill (4.8,0.6) circle (1.4pt);
  \draw (4.8,0.6) -- (1.7,0.6);
  \draw[->] (1.7,0.6) -- (1.7,-1.1);
  \node[anchor=west] at (1.8,0.32) {\scriptsize $w_g^{+}$ / $N{+}1$};
  \draw (5.8,-0.2) -- (6.5,-0.2) -- (6.5,1.5);
  \draw[->] (6.5,1.5) -- (6.8,1.5);
  \node[anchor=west] at (6.62,0.66) {\scriptsize $w_g$ / $N{+}1$};
  \draw[->] (6.8,-1.9) -- (3.2,-1.9);
  \node[anchor=south] at (5.0,-1.85) {\scriptsize sampled $r_g$ / $N{+}1$};
  \draw[->] (0.2,-1.8) -- (-1.4,-1.8);
  \node[anchor=south] at (-0.95,-1.68) {\scriptsize full / $1$};

  % ---- read side wiring ----
  \draw[->] (12.2,1.5) -- (11.6,1.5);
  \node[anchor=south] at (11.9,1.55) {\scriptsize $N{+}1$};
  \draw[->] (10.6,0.9) -- (10.6,0.3);
  \fill (10.6,0.6) circle (1.4pt);
  \draw (10.6,0.6) -- (13.5,0.6);
  \draw[->] (13.5,0.6) -- (13.5,-1.1);
  \node[anchor=east] at (13.4,0.32) {\scriptsize $r_g^{+}$ / $N{+}1$};
  \draw[->] (15.0,-1.8) -- (16.6,-1.8);
  \node[anchor=south] at (16.05,-1.68) {\scriptsize empty / $1$};

  % rg register out, down and back to the wclk-side synchronizer
  \draw (10.6,-0.7) -- (10.6,-2.75) -- (7.65,-2.75);
  \draw[->] (7.65,-2.75) -- (7.65,-2.4);
  \node[anchor=south] at (10.0,-2.72) {\scriptsize $r_g$ / $N{+}1$};

  % sampled wg into the read domain; crosses the rg return once, no connection
  \draw (8.5,1.5) -- (9.05,1.5) -- (9.05,-3.1) -- (13.5,-3.1);
  \draw[->] (13.5,-3.1) -- (13.5,-2.5);
  \node[anchor=south] at (11.4,-3.07) {\scriptsize sampled $w_g$ / $N{+}1$};

  % ---- memory ports ----
  \draw[<-] (5.0,3.8) -- (2.8,3.8);
  \node[anchor=south] at (3.9,3.85) {\scriptsize wdata / $w$};
  \draw (1.6,2.1) -- (1.6,2.9) -- (5.5,2.9);
  \draw[->] (5.5,2.9) -- (5.5,3.3);
  \node[anchor=south] at (3.5,2.93) {\scriptsize waddr $=w_{bin}[N{-}1{:}0]$ / $N$};

  \draw[->] (11.0,3.8) -- (13.2,3.8);
  \node[anchor=south] at (12.1,3.85) {\scriptsize rdata / $w$};
  \draw (14.4,2.1) -- (14.4,2.9) -- (10.5,2.9);
  \draw[->] (10.5,2.9) -- (10.5,3.3);
  \node[anchor=south] at (12.5,2.93) {\scriptsize raddr $=r_{bin}[N{-}1{:}0]$ / $N$};

  % ---- caption line ----
  \node[anchor=north,align=center] at (7.6,-3.5)
    {only the two Gray-coded pointers cross the boundary: one bit changes per increment,\\[-2pt]
     so a mid-flight sample returns the old value or the new one, never a third};
\end{circuitikz}
\end{document}
```

**Reduce the whole problem to one question about pointers.** A FIFO of $2^{N}$ words is a RAM plus two pointers. The write side owns $w_{bin}$, the read side owns $r_{bin}$, occupancy is $w_{bin}-r_{bin}$, and the two flags are $\text{empty}\Leftrightarrow w_{bin}=r_{bin}$ and $\text{full}\Leftrightarrow w_{bin}-r_{bin}=2^{N}$. Each pointer is $N+1$ bits: the low $N$ bits address the RAM, and the extra most-significant *wrap* bit exists solely to break the tie, because with $N$-bit pointers $w_{bin}=r_{bin}$ describes both an empty and a completely full queue and no comparator can tell them apart. Data words are $w$ bits and never leave their own domain — they are written by `wclk` and read out of the RAM by an address that is already in the read domain. **Everything that must actually cross the boundary is the two $(N{+}1)$-bit pointers**, so the CDC problem shrinks to: how does one domain read a multi-bit counter that another domain is incrementing?

**Count what a binary pointer can decay into and the answer is "anything".** Sampling a multi-bit bus with a clock that has no defined phase relationship to it means sampling each bit independently at an arbitrary point in its transition. Take the increment $0111\to1000$ on a 4-bit binary pointer: four bits change at once, each flip-flop resolves independently, and the sampled word can be **any** of the $2^4=16$ patterns — most of them, such as $1111$ or $0000$, are neither the old value nor the new one. A comparator fed that word produces a full or empty flag that corresponds to no state the FIFO has ever been in, which is how these designs overrun and drop a word rather than merely stalling. The failure is not rare-and-metastable, it is a plain logic failure that happens on every wrap.

**Gray coding collapses the reachable sample set from $2^{k}$ to $2$.** The reflected binary code
$$g \;=\; b \oplus (b \gg 1),\qquad g_N = b_N,\quad g_i = b_i \oplus b_{i+1}\ \ (i<N)$$
has the defining property that consecutive integers differ in exactly one bit position, so an increment toggles exactly one flip-flop. A sample taken mid-transition therefore catches at most one bit unresolved, and the only two words it can return are $g(k)$ and $g(k{+}1)$ — the value before the increment and the value after it. That reduction is not merely a smaller error; it makes the error *conservative in the right direction*, and that is the entire justification for the scheme. A stale write pointer at the read side under-reports how much data has arrived, so the reader concludes "empty" and waits when it could have read: safe. A stale read pointer at the write side under-reports how much space has been freed, so the writer concludes "full" and stalls when it could have written: also safe. Both errors cost a cycle of throughput and neither can corrupt or lose a word. This is precisely why the *pointers* are Gray-coded and the *data* is not — data has no such monotone safety direction, which is why it must be kept out of the crossing entirely.

**The one bit that does cross is still a metastability problem, so pay for a two-flop synchronizer.** Gray coding removes the multi-bit ambiguity but not the physics: the single toggling flip-flop can still be sampled inside its setup/hold window and enter a metastable state. A [[Two-Flop Synchronizer]] gives that flip-flop most of a destination clock period to resolve before its value is used, and the mean time between failures is exponential in the resolution time granted:
$$\text{MTBF}=\frac{e^{t_r/\tau}}{T_0\,f_c\,f_d}$$
for resolution window $t_r$, source toggle rate $f_d$, sampling frequency $f_c$, and process constants $\tau$, $T_0$. Because $t_r$ sits in an exponent, the second flop is enormously cheap insurance and a third is normally pointless below a few hundred MHz. Note what makes the two-flop stage legal here at all: it is applied bit-by-bit to a bus, which is exactly the thing you may never do to an arbitrary multi-bit signal. It is only correct because Gray coding has already guaranteed that per-bit independent resolution yields a whole word that is one of two legal values.

**Translate the binary flag conditions into Gray, and the "invert the top two bits" folklore falls out of the encoding.** Empty is easy: equality is preserved by any bijection, and $b\mapsto g$ is one, so
$$\text{empty} \iff r_g = \text{sync}(w_g)$$
compares Gray words directly and needs no decoder. Full is the interesting one. In binary, full means the addresses match and the wrap bits differ:
$$b^{w}_{N-1..0}=b^{r}_{N-1..0}\ \ \wedge\ \ b^{w}_{N}\ne b^{r}_{N}$$
Push each Gray bit through its definition. The top bit is copied, $g_N=b_N$, so $g^{w}_N\ne g^{r}_N$. The next bit is $g_{N-1}=b_{N-1}\oplus b_N$; since $b_{N-1}$ agrees and $b_N$ differs, XOR with a differing operand flips the result, so $g^{w}_{N-1}\ne g^{r}_{N-1}$. Every lower bit $g_i=b_i\oplus b_{i+1}$ for $i\le N-2$ combines two bits that both agree, so $g^{w}_i=g^{r}_i$. Hence
$$\text{full} \iff \left(g^{w}_N\ne g^{r}_N\right)\wedge\left(g^{w}_{N-1}\ne g^{r}_{N-1}\right)\wedge\left(g^{w}_{N-2..0}=g^{r}_{N-2..0}\right)$$
which is the same $N{+}1$ XNOR-and-AND structure as the empty comparator with two bits inverted first — one extra inverter pair, no Gray-to-binary decoder anywhere in the design. The alternative, decoding the synchronized pointer back to binary with the XOR-prefix chain $b_i=\bigoplus_{j\ge i} g_j$ and comparing integers, is logically identical and costs an $N$-deep XOR chain in the flag's timing path; take it only if you also need a live occupancy count.

**Register both flags, because computing them combinationally closes a loop.** The write pointer only increments when not full, and full is computed from the *next* pointer value, so a combinational `full` creates the cycle $\text{full}\to w_{bin}^{+}\to w_g^{+}\to\text{full}$. Breaking it by comparing the *current* pointer instead is the other obvious move and it is wrong — the flag then lags the write that filled the queue by a cycle and the next write overruns. The correct construction computes the flag from the next-state pointer and registers the *flag*:
$$\text{full}^{+} = F\!\left(w_g^{+},\ \text{sync}(r_g)\right),\qquad \text{empty}^{+} = \left(r_g^{+}=\text{sync}(w_g)\right)$$
so the flag lands in its register on the same edge that commits the word, and is already asserted when the next write is offered. `empty` resets to $1$ and `full` to $0$; both then carry the conservative bias of the previous paragraph for free, because the pointer they are compared against is the stale synchronized one.

**Price the crossing in cycles, because that is what it costs the network.** A pointer update becomes visible in the other domain after two destination-clock edges plus up to one source cycle of alignment, so **2-3 destination cycles each way**, and the write side does not learn that a word was consumed until a full round trip has elapsed. That round trip lands directly in the $t_{crt}$ of [[Credit-Based Flow Control]] and inflates the buffer depth $B$ needed to keep the link at full rate, which is the real reason a GALS link costs more buffering than a synchronous one — not the FIFO's own storage, but the latency of the flag that governs it. In steady state at matched rates the FIFO also acts as the rate-elastic element: the shallower it is, the more often the slower side's jitter shows up as a stall on the faster side.

**Map it, and notice that the FPGA gives you most of it as hard silicon.** On FPGA ([[FPGAs]]) the storage is free in the sense that matters: block RAM has genuinely independent write and read clock ports, so the dual-clock RAM is one primitive with no CDC logic of its own, and for shallow queues the LUT-based distributed RAM does the same job at one LUT per bit per depth-32. What is *not* free is telling the tools what you built: the synchronizer flip-flops must be marked (`ASYNC_REG` or equivalent) so they are packed into the same slice for maximum resolution time, and the pointer path across the boundary must be given a false path or a max-delay constraint or static timing analysis will either fail it or, worse, pass it after inserting a buffer that skews the bits. On ASIC the same applies with a hard-macro synchronizer cell from the library, plus one extra concern the FPGA hides: the $N{+}1$ Gray bits should be routed with matched delay so that skew between them stays below one destination clock period, since Gray's guarantee is about *when* bits change, not about arrival order after arbitrary routing.

> [!important] Gray coding is a statement about the encoding of *time*, not of *value*
> Nothing in this circuit corrects a wrong sample. The pointers are Gray-coded so that the set of wrong samples contains only values the FIFO has actually occupied, one increment apart, and both of them err toward "less room, less data". Every other property — the two-flop synchronizer, the registered flags, the extra wrap bit — is scaffolding around that one guarantee. Break the one-bit-per-increment property, by any means, and none of the scaffolding helps.

**Nothing here is arithmetic on the payload.** The word crosses bit-identical and in order, so the error contribution is exactly $0$ ulp and [[Error Accuracy]] has nothing to say; the data's [[Number Formats|format]] is irrelevant to the circuit, which is why the same FIFO carries flits, floats and bytes unchanged. The only quantities this circuit trades in are cycles and probability of failure.

$$\boxed{\ g = b\oplus(b\!\gg\!1),\quad \text{empty}^{+}\!=\!\left(r_g^{+}\!=\!\widetilde{w_g}\right),\quad \text{full}^{+}\!=\!\left(w^{+}_{g,N}\!\ne\!\widetilde{r}_{g,N}\right)\wedge\left(w^{+}_{g,N-1}\!\ne\!\widetilde{r}_{g,N-1}\right)\wedge\left(w^{+}_{g,N-2..0}\!=\!\widetilde{r}_{g,N-2..0}\right)\ }$$

with $\widetilde{x}$ the two-flop-synchronized copy of $x$ and pointers $N{+}1$ bits wide over a $2^{N}$-word RAM.

**When it breaks**

- **Depth is not a power of two.** The whole construction rests on the pointer being a Gray counter that wraps cleanly. Truncate the sequence at 12 and the wrap $g(11)\to g(0)$ changes several bits at once, reintroducing exactly the multi-bit sample the code was chosen to prevent. Non-power-of-two depths need a different pointer encoding, or a power-of-two FIFO with an artificially early full threshold.
- **Something reads the raw occupancy $w_{bin}-r_{bin}$.** The difference of a local pointer and a synchronized foreign one is a *conservative estimate*, not a count, and it is only monotone-safe for the flag it was designed for. An almost-full watermark computed from it on the write side is safe (it under-counts free space); the same expression exported as "how many words are in the FIFO" to a scheduler is not, because it is stale by the full round trip.
- **The two domains reset independently.** Each pointer register and each synchronizer lives in its own reset domain, and a FIFO reset on one side only comes up with mismatched pointers — flags that say empty while the RAM holds words, or full while it holds none, permanently. Either drive both sides from one asynchronously-asserted, synchronously-deasserted reset, or hold both sides in reset until both have seen it.
- **The frequency ratio is extreme.** Nothing breaks logically, but a source pulse narrower than one destination clock period can be missed. Pointers are levels, not pulses, so they survive; any *side-band* signal added later — an error flag, a flush request — will not, and needs a handshake or a toggle-synchronizer instead.
- **The clocks are actually related.** If they are the same frequency at fixed phase, this circuit is over-engineered: a [[Mesochronous Link FIFO]] of 2-4 entries with a trained strobe has no metastability risk in principle and none of the round-trip latency. Use the asynchronous FIFO only when the frequencies are genuinely unrelated.
- **The link would be better with no receiver clock at all.** Where the crossing is a single point-to-point channel rather than a rate-elastic buffer, a [[Bundled-Data Handshake Link]] replaces the whole structure with request/acknowledge sequencing and a C-element, trading the fixed 2-3 cycle synchronizer cost for data-dependent latency that standard timing analysis cannot sign off.
- **Someone "optimises" the synchronizer away.** Retiming, register duplication and logic replication all happily destroy a two-flop synchronizer, and the resulting design simulates perfectly. The constraint file is part of the circuit here in a way it is not for ordinary logic.

**RTL (Spade)**

```spade
/// Dual-clock asynchronous FIFO: 2^N words of DW bits (C = 2^N).
/// Pointers are N+1 bits; the extra MSB is the wrap bit that separates full
/// from empty. Only the Gray-coded pointers cross, each through two flops.
entity async_fifo<#uint N, #uint DW, #uint C>(
    wclk: clock, wrst: bool, winc: bool, wdata: uint<DW>,
    rclk: clock, rrst: bool, rinc: bool,
) -> (bool, bool, uint<DW>) {
    decl wg; decl rg; decl wbin_next; decl rbin_next; decl full; decl empty;

    let rg_s = unsafe { inst std::cdc::sync2(wclk, rg) };
    let wg_s = unsafe { inst std::cdc::sync2(rclk, wg) };

    // ---- write domain
    reg(wclk) wbin: uint<{N + 1}> reset(wrst: 0) = wbin_next;
    let wen = winc && !full;
    let wbin_next: uint<{N + 1}> = if wen { trunc(wbin + 1) } else { wbin };
    let wg_next = gray(wbin_next);
    reg(wclk) wg: uint<{N + 1}> reset(wrst: 0) = wg_next;

    // full: top two Gray bits both differ, the remaining N-1 agree
    let wl:  uint<N>       = trunc(wg_next);
    let rl:  uint<N>       = trunc(rg_s);
    let wll: uint<{N - 1}> = trunc(wg_next);
    let rll: uint<{N - 1}> = trunc(rg_s);
    let full_next = (wg_next.msb() != rg_s.msb()) && (wl.msb() != rl.msb()) && (wll == rll);
    reg(wclk) full reset(wrst: false) = full_next;

    // ---- read domain
    reg(rclk) rbin: uint<{N + 1}> reset(rrst: 0) = rbin_next;
    let ren = rinc && !empty;
    let rbin_next: uint<{N + 1}> = if ren { trunc(rbin + 1) } else { rbin };
    let rg_next = gray(rbin_next);
    reg(rclk) rg: uint<{N + 1}> reset(rrst: 0) = rg_next;
    let empty_next = rg_next == wg_s;
    reg(rclk) empty reset(rrst: true) = empty_next;

    // ---- storage: written on wclk, read combinationally at raddr
    let waddr: uint<N> = trunc(wbin);
    let raddr: uint<N> = trunc(rbin);
    let mem: Memory<uint<DW>, C> = inst std::mem::clocked_memory(wclk, [(wen, waddr, wdata)]);
    let rdata = inst std::mem::read_memory(mem, raddr);

    (full, empty, rdata)
}

fn gray<#uint M>(b: uint<M>) -> uint<M> { (b >> 1) ^ b }
```

`wg`/`rg` are the two pointer registers in the drawing and `rg_s`/`wg_s` are the outputs of the two synchronizer boxes; `sync2` is instantiated once per side and Spade replicates it bitwise over the $N{+}1$-bit word, which is legal here for the reason argued above and for no other. Width arithmetic: `wbin + 1` grows to $N{+}2$ bits and `trunc` returns it to $N{+}1$, deliberately wrapping — the pointer is meant to wrap and the wrap bit is meant to toggle. The three `trunc` results are the field extractions the full comparator needs, `wl.msb()` being bit $N{-}1$ and `wg_next.msb()` bit $N$, so no bit slicing is required at all. Note `full`/`empty` are registered from `*_next` while `waddr`/`raddr` come from the *current* `wbin`/`rbin`: that pairing is the whole timing argument, and swapping either one produces RTL that compiles and fails in simulation. Synthesis will do two things the drawing does not show — it maps the RAM onto a true dual-clock block RAM whose read port is registered rather than combinational (adding one read-latency cycle, or requiring a first-word-fall-through bypass), and it will happily retime or duplicate the synchronizer flops unless the constraint file forbids it.

**Related Notes**

- [[Gray Code Counter]] – depends-on: the counter whose one-bit-per-increment property this circuit is built entirely around; here it is a binary counter plus an encoder, which is the cheaper of the two constructions.
- [[Two-Flop Synchronizer]] – depends-on: the per-bit resolution stage, and the source of the $\text{MTBF}=e^{t_r/\tau}/(T_0 f_c f_d)$ budget quoted above.
- [[Counters]] – depends-on: the $N{+}1$-bit binary up-counters that hold the pointers, gated by the flags.
- [[Credit-Based Flow Control]] – compares: the same producer/consumer bound solved with a mirror counter inside one clock domain; its $t_{crt}$ absorbs this FIFO's 2-3 cycle synchronizer latency, and its multi-bit credit count is exactly what may not be sent across a boundary raw.
- [[Mesochronous Link FIFO]] – counter-example: when the two clocks share a frequency at fixed phase, a 2-4 entry phase-tolerant FIFO with a trained strobe replaces all of this and has no metastability risk in principle.
- [[Bundled-Data Handshake Link]] – compares: removes the receiver clock from the link entirely, trading fixed synchronizer latency for a data-dependent one that static timing analysis cannot sign off.
- [[Virtual Channel Buffer]] – supports: the per-VC storage this FIFO becomes when a router port sits on a clock-domain boundary.
- [[Virtual-Channel Router]] – supports: the router whose input ports instantiate one of these per link in a GALS design.
- [[Choosing a Router Architecture]] – compares: where a GALS link with asynchronous FIFOs sits against the synchronous and mesochronous alternatives in a whole-NoC budget.

## References

- [[6.3) Network-On-Chip]] — §Clocking: synchronous, mesochronous, GALS (the three clocking regimes; the $0111\to1000$ sixteen-value binary-sample argument; the single-bit-change justification for Gray pointers and the safe direction of both stale-pointer errors; the $\text{MTBF}=e^{t_r/\tau}/(T_0 f_c f_d)$ expression; the 2-3 destination cycles per crossing and their effect on $t_{crt}$ and buffer depth $B$), §FPGA mapping (distributed RAM versus block RAM for shallow per-VC queues, and the observation that GALS links are effectively free once a design already spans clock domains).
- No textbook source for this topic. Standard treatments: Cummings, *Simulation and Synthesis Techniques for Asynchronous FIFO Design* (SNUG 2002) — the $N{+}1$-bit pointer, the inverted-top-two-bits full comparator and the registered-flag construction used here; Dally & Towles, *Principles and Practices of Interconnection Networks* — GALS links and the synchronizer's place in the flow-control round trip; Weste & Harris, *CMOS VLSI Design* — metastability, resolution time constants and synchronizer MTBF; Wakerly, *Digital Design: Principles and Practices* — Gray code and synchronous counter construction. Page numbers are deliberately omitted; no copy was consulted while writing.
