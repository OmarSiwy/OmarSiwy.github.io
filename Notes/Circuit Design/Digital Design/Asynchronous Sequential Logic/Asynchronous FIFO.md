---
title: Asynchronous FIFO
description: "Gray-coded read and write pointers crossing into the other clock domain through synchronisers — race-free unit-distance assignment doing real work, and the only piece of this topic an FPGA actually runs."
kind: circuit
source: "0.5) Asynchronous Sequential Logic §Races and critical races, §FPGA mapping, §Trade-offs — no book source"
status: seed
spade: simulated
tags: [digital, asynchronous-sequential-logic, cdc, fifo, gray, fpga]
aliases:
  - Async FIFO
  - Asynchronous FIFOs
  - CDC FIFO
  - Clock-Domain-Crossing FIFO
  - Dual-Clock FIFO
---

# Asynchronous FIFO

A dual-port memory addressed by two independently clocked pointers, each published to the other domain in Gray code through a flop synchroniser, so that a pointer sampled mid-transition is always a legal count and the derived `full`/`empty` flags are never optimistic.

```tikz title="Asynchronous FIFO: binary pointers address the RAM, Gray copies cross the domain boundary through two-flop synchronisers, flags compare local Gray against synchronised Gray"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % --- domain labels and boundary (broken where the RAM straddles it) ---
  \node at (2.0,3.9) {write domain (wclk)};
  \node at (12.4,3.9) {read domain (rclk)};
  \draw[dashed] (7.0,3.5) -- (7.0,1.1);
  \draw[dashed] (7.0,-1.1) -- (7.0,-5.6);

  % --- pointer registers ---
  \draw (-0.8,2.1) rectangle (2.8,3.5);
  \node at (1.0,3.1) {$w_{\mathrm{bin}},\,w_{g}$ \ ($n{+}1$ b)};
  \node at (1.0,2.5) {clocked by wclk};

  \draw (11.2,2.1) rectangle (14.8,3.5);
  \node at (13.0,3.1) {$r_{\mathrm{bin}},\,r_{g}$ \ ($n{+}1$ b)};
  \node at (13.0,2.5) {clocked by rclk};

  % --- storage ---
  \draw (5.0,-1.1) rectangle (9.0,1.1);
  \node at (7.0,0.0) {dual-port RAM $2^{n}\!\times\!W$};

  % write address + data
  \draw (1.6,2.1) -- (1.6,0.5);
  \draw[->] (1.6,0.5) -- (5.0,0.5);
  \node[above] at (3.3,0.55) {$w_{\mathrm{bin}}[n{-}1{:}0]$ \ ($n$)};
  \draw[->] (2.9,-0.6) -- (5.0,-0.6);
  \node[above] at (4.0,-0.55) {wdata ($W$)};

  % read address + data
  \draw (12.4,2.1) -- (12.4,0.5);
  \draw[->] (12.4,0.5) -- (9.0,0.5);
  \node[above] at (10.7,0.55) {$r_{\mathrm{bin}}[n{-}1{:}0]$ \ ($n$)};
  \draw[->] (9.0,-0.6) -- (10.9,-0.6);
  \node[above] at (10.1,-0.55) {rdata ($W$)};

  % --- write Gray pointer crossing into the read domain ---
  \draw (0.5,2.1) -- (0.5,-2.7);
  \draw[->] (0.5,-2.7) -- (7.6,-2.7);
  \node[above] at (4.3,-2.65) {$w_{g}$ \ ($n{+}1$, one bit in flight)};
  \fill (0.5,-2.7) circle (1.6pt);
  \draw[->] (0.5,-2.7) -- (0.5,-3.8);

  \draw (7.6,-3.3) rectangle (10.2,-2.1);
  \node at (8.9,-2.45) {2-FF sync};
  \node at (8.9,-2.95) {(rclk)};
  \draw[->] (10.2,-2.7) -- (10.6,-2.7);

  \draw (10.6,-3.3) rectangle (12.6,-2.1);
  \node at (11.6,-2.45) {$=$};
  \node at (11.6,-2.95) {empty};
  \draw[->] (11.6,-3.3) -- (11.6,-3.75);
  \node[below] at (11.6,-3.78) {gates $r^{+}$};

  % --- read Gray pointer crossing into the write domain ---
  \draw (13.6,2.1) -- (13.6,-4.4);
  \fill (13.6,-2.7) circle (1.6pt);
  \draw[->] (13.6,-2.7) -- (12.6,-2.7);
  \draw[->] (13.6,-4.4) -- (6.4,-4.4);
  \node[above] at (9.8,-4.35) {$r_{g}$ \ ($n{+}1$)};

  \draw (3.8,-5.0) rectangle (6.4,-3.8);
  \node at (5.1,-4.15) {2-FF sync};
  \node at (5.1,-4.65) {(wclk)};
  \draw[->] (3.8,-4.4) -- (1.5,-4.4);

  \draw (-0.5,-5.0) rectangle (1.5,-3.8);
  \node at (0.5,-4.15) {$=$};
  \node at (0.5,-4.65) {full};
  \draw[->] (-0.5,-4.4) -- (-1.5,-4.4);
  \node[left] at (-1.55,-4.4) {gates $w^{+}$};

  % --- the two flag conditions ---
  \node at (6.0,-6.3) {$\mathrm{empty}:\ r_{g}=w_{g}^{s}$ \qquad
                       $\mathrm{full}:\ w_{g}=r_{g}^{s}\oplus\left(11\,0^{\,n-1}\right)$};

\end{circuitikz}
\end{document}
```

**Separate the two failure modes before designing anything.** Handing an $(n{+}1)$-bit word to an unrelated clock can go wrong in two independent ways. *Metastability* is a per-flop event: a receiving flop whose setup/hold window is violated leaves its output undefined for a resolution time that is unbounded in principle, and the cure is time — a second flop that samples only after the first has almost certainly resolved ([[Synchronizer Chain]]). *Incoherence* is a per-word event: each bit of the bus resolves on its own coin flip, so if $m$ bits changed at the source edge the destination can latch any of the $2^m$ mixtures of old and new bits, several of which were never a value the source held. Adding flops does nothing to $m$; a flop chain filters metastability and faithfully delivers the corrupted word.

> [!important] The two mechanisms are orthogonal and each fix addresses exactly one.
> Gray coding drives $m$ to 1, which makes the mixture set $\{\text{old},\text{new}\}$ — but a Gray-coded bus sampled without a synchroniser still delivers metastable levels into downstream logic, where different gates may interpret the same undecided node differently. The synchroniser makes the sampled bit *decided*; the encoding makes the decided word *legal*. A design with one and not the other is broken in a way that passes RTL simulation, because a zero-delay simulator models neither.

**Reduce coherence to the race-free-assignment theorem.** The pointer is a state machine whose transition graph is the cycle $0 \to 1 \to \cdots \to 2^{n+1}-1 \to 0$, and the receiving flops are its secondary variables. That is exactly the setting of [[Race-Free State Assignment]]: a transition $S_i \to S_j$ is race-free iff $d_H(\text{code}(S_i),\text{code}(S_j)) = 1$, i.e. iff the transition graph embeds in the hypercube $Q_{s}$. Here the graph is a $2^{n+1}$-cycle and $s = n{+}1$, so the required embedding is a Hamiltonian cycle on $Q_{n+1}$ — and the reflected binary code is precisely such a cycle. The FIFO does not merely *resemble* the classical theorem; it is the theorem's one surviving industrial application, with the asynchronous "races" being the receiver's independently resolving flops rather than a feedback loop's unequal $\Delta_i$. The encoding and its one-bit proof are in [[Gray Code Counter]]; nothing below re-derives them.

**Size the pointer one bit wider than the address so that full and empty are distinguishable.** With depth $2^n$ the RAM address is $n$ bits, but an $n$-bit pointer makes $w = r$ ambiguous: it holds when the FIFO is empty and again when it has wrapped exactly once and is full. Carry one extra bit, so the pointers are $(n{+}1)$-bit counters over $2^{n+1}$ and the RAM sees $w_{\mathrm{bin}}[n{-}1{:}0]$ and $r_{\mathrm{bin}}[n{-}1{:}0]$. The occupancy is $w_{\mathrm{bin}} - r_{\mathrm{bin}} \bmod 2^{n+1} \in [0,2^n]$, so

$$\text{empty} \iff w_{\mathrm{bin}} = r_{\mathrm{bin}}, \qquad
\text{full} \iff w_{\mathrm{bin}} = r_{\mathrm{bin}} + 2^{n} \ (\bmod\ 2^{n+1})$$

which in bits reads: full when the top bits differ and all $n$ low bits agree. Every signal in the drawing: $w_{\mathrm{bin}}, w_g, r_{\mathrm{bin}}, r_g$ and their synchronised copies $w_g^{s}, r_g^{s}$ are $n{+}1$ bits; the two addresses are $n$ bits; `wdata`/`rdata` are $W$ bits; `wen`, `ren`, `full`, `empty` and the two resets are 1 bit.

**Push the full test through the Gray map so neither flag needs a decoder.** Both flags must be evaluated on the synchronised copy, which is Gray. Rather than convert back, rewrite the conditions in the Gray domain using $g_i = b_i \oplus b_{i+1}$ with $b_{n+1} \equiv 0$. Take the full condition, $b^{w}_{n} \ne b^{r}_{n}$ and $b^{w}_{i} = b^{r}_{i}$ for all $i < n$, and evaluate the map bit by bit:

| bit | expression | write vs. read |
| --- | --- | --- |
| $i=n$ | $g_n = b_n \oplus 0 = b_n$ | differ, since $b_n$ differ |
| $i=n-1$ | $g_{n-1} = b_{n-1} \oplus b_n$ | differ, since $b_{n-1}$ agree and $b_n$ differ |
| $i<n-1$ | $g_i = b_i \oplus b_{i+1}$ | agree, both operands agree |

by associativity and $x \oplus x = 0$. So full corresponds to "the top two Gray bits inverted, the rest equal", and because the Gray map is a bijection the implication runs both ways — no other pointer pair produces that pattern. Empty is easier: $w_{\mathrm{bin}} = r_{\mathrm{bin}}$ maps to $w_g = r_g$ by the same bijection. Written as a mask,

$$\text{full} \iff w_g = r_g^{s} \oplus \big(11\,\underbrace{0\cdots0}_{n-1}\big), \qquad
\text{empty} \iff r_g = w_g^{s}$$

Both flags are therefore one $(n{+}1)$-bit equality comparator, with two constant inversions in front of one of them — the XOR with a constant is free, it is a pair of inverters or nothing at all once folded into the comparator's LUTs. The alternative, converting $r_g^{s}$ back to binary first, costs a suffix-XOR prefix network of depth $\lceil \log_2 (n{+}1)\rceil$ ([[Gray Code Counter]]) sitting directly in the path that gates the pointer increment, i.e. in the $f_{\max}$ loop of both domains.

**The stale pointer errs only in the safe direction, and that is the whole correctness argument.** Each synchroniser delivers a value that is two destination edges old, plus up to one source period of quantisation, so a flag is always computed against a pointer that is *behind* the truth. Because pointers only increment, "behind" means "fewer transactions have happened than the other side believes". On the write side, an old $r_g^{s}$ under-reports how many slots the reader has freed, so `full` asserts early and deasserts late — the write pointer is never allowed to overtake a slot the reader has not actually finished with. On the read side, an old $w_g^{s}$ under-reports how many words the writer has committed, so `empty` asserts early and deasserts late — the read pointer never addresses a location whose write has not landed. Both errors cost throughput and neither costs correctness. The flags are conservative *by construction*, not by margin, which is why the design survives an arbitrary and time-varying clock ratio with no timing relationship to close between the domains.

**Note what does not cross a synchroniser: the data.** Only two $(n{+}1)$-bit pointers are hardened; the $W$-bit payload goes into the RAM on `wclk` and comes out on `rclk` with nothing in between. This is safe precisely because of the previous paragraph — `empty` guarantees that the word now being read was committed at least a full synchroniser round-trip ago, so its bit lines settled several source cycles before the read port sampled them. Sending the payload through $W$ parallel flop chains would be both expensive and *wrong*: per-bit resolution is the incoherence mechanism, so a wide bus through parallel synchronisers is exactly the failure the Gray pointers exist to avoid. The economy of the whole structure is that one hardened path of $n{+}1$ bits per direction licenses an arbitrarily wide, arbitrarily fast data path beside it.

**On FPGA this is the entire async story, and it is easy.** Every other structure in this topic fights the tools — combinational loops the static timing analyser cannot traverse, consensus terms the optimiser deletes, delay lines that collapse to a wire, isochronic forks the router will not honour. The CDC FIFO uses none of them. The RAM is a [[Block Memory]] primitive whose two ports are physically separate and separately clocked, so the dual-port drawing maps one-to-one; pointers, comparators and synchronisers are ordinary fabric flops and LUTs. The two constraints that matter are both mechanical: mark the synchroniser flops `ASYNC_REG` so the placer keeps the pair inside one slice — short routing means more of the destination period is available as resolution time, and mean time between failures is exponential in that — and put `set_max_delay -datapath_only` on the Gray pointer nets, which tells the tool not to attempt a setup check between unrelated clocks while still bounding inter-bit skew below one destination period. That skew bound is the one real timing requirement: if bits of the same Gray word arrive more than a destination period apart, the receiver can sample a word the source never held, and the $d_H = 1$ argument collapses. On ASIC the structure is identical; the differences are that the chain depth is chosen from a characterised metastability time constant rather than fixed at two, and that vendor macros (`XPM_FIFO_ASYNC`, `DCFIFO`) exist because nobody should rewrite this.

$$\boxed{\ \text{empty} \iff r_g = w_g^{s}, \qquad
\text{full} \iff w_g = r_g^{s} \oplus \big(11\,0^{\,n-1}\big), \qquad
d_H\big(g(b),g(b{+}1)\big) = 1\ }$$

**When it breaks**

- **Depth must be a power of two.** The argument needs a Hamiltonian cycle on $Q_{n+1}$, which exists only for $2^{n+1}$ codewords, and the two-bit-inversion full test needs the wrap to be a genuine binary wrap. Truncating the Gray sequence to reach an odd or non-power-of-two depth breaks unit distance exactly at the wrap, which is where pointers spend time when a FIFO is being used hard. Size up to the next power of two and bound occupancy elsewhere.
- **Only unit pointer steps are protected.** A burst interface that pushes two words per cycle, or a packet-mode FIFO that rewinds the write pointer on a bad frame, moves the pointer by more than one hypercube edge and forfeits the entire guarantee. The repairs are structural: several FIFOs in parallel each stepping by one, or a full handshake for the multi-step update.
- **Shallow FIFOs cannot stream.** Synchroniser latency is two destination cycles each way plus quantisation, so the credit round-trip is on the order of three to five cycles of the *slower* clock. A FIFO shallower than that round-trip spends most of its time asserting a stale `full` or `empty` and cannot sustain one word per cycle even when both domains could. Depth is set by the round-trip, not by the buffering the application asked for.
- **Occupancy readings are not measurements.** A fill level computed on either side subtracts one true pointer from one synchronised pointer, so it under-reports on both sides. That is safe for an almost-full threshold that gates writes and safe for an almost-empty threshold that gates reads; it is wrong as an instrument, and wrong in a way that changes with the clock ratio.
- **Flush and reset are outside the protocol.** Clearing the FIFO from one side changes a pointer by many bits while the other side is sampling it. Both domains must be reset together while quiescent, with the reset asserted asynchronously and released through a synchroniser in each domain — a released reset is itself a clock-domain crossing.
- **MTBF is large, not infinite.** Two stages is a default, not a theorem; a high destination-to-source frequency ratio, a slow process corner, or a wide pointer sampled every cycle can all push the required depth to three. The synchroniser is a design parameter ([[Synchronizer Chain]]), and the note it lives in is where that calculation belongs.
- **Nothing here detects a protocol violation.** A producer that writes while `full` overwrites an unread word and a consumer that reads while `empty` returns whatever the RAM happens to hold; both fail silently and neither is visible to the other domain. The flags are advisory to logic that must honour them.

> [!warning] No quantitative figures in this note
> This topic has no assigned textbook source, so no LUT counts, no gate delays, no metastability time constants and no MTBF numbers are quoted. Every cost statement above is an ordering or an asymptotic. The MTBF calculation in particular depends on a process-specific $\tau$ and $T_0$ and must come from a characterised library, never from a note.

**RTL (Spade)**

```spade
fn gray<#uint N>(b: uint<N>) -> uint<N> {
    b ^ (b >>. 1)
}

entity async_fifo<#uint AW, #uint DEPTH, D>(
    wclk: clock, wrst: bool, wen: bool, wdata: D,
    rclk: clock, rrst: bool, ren: bool,
) -> (bool, bool, D) {
    decl full, empty;

    // write domain: binary pointer for the RAM, Gray copy for the boundary
    reg(wclk) wbin: uint<{AW + 1}> reset(wrst: 0) =
        if wen && !full { trunc(wbin + 1) } else { wbin };
    reg(wclk) wgray: uint<{AW + 1}> reset(wrst: 0) =
        gray(if wen && !full { trunc(wbin + 1) } else { wbin });

    // read domain, mirror image
    reg(rclk) rbin: uint<{AW + 1}> reset(rrst: 0) =
        if ren && !empty { trunc(rbin + 1) } else { rbin };
    reg(rclk) rgray: uint<{AW + 1}> reset(rrst: 0) =
        gray(if ren && !empty { trunc(rbin + 1) } else { rbin });

    // one two-flop synchroniser per direction
    let wgray_s = unsafe { inst std::cdc::sync2(rclk, wgray) };
    let rgray_s = unsafe { inst std::cdc::sync2(wclk, rgray) };

    let top2: uint<{AW + 1}> = 3 << (AW - 1);
    let full  = wgray == (rgray_s ^ top2);
    let empty = rgray == wgray_s;

    // payload: written in wclk, read in rclk, never synchronised
    let waddr: uint<AW> = trunc(wbin);
    let raddr: uint<AW> = trunc(rbin);
    let mem: Memory<D, DEPTH> = inst std::mem::clocked_memory(wclk, [(wen && !full, waddr, wdata)]);
    let rdata = inst std::mem::read_memory(mem, raddr);

    (full, empty, rdata)
}
```

`wbin`/`rbin` are the pointer registers at the top of the drawing and `wgray`/`rgray` are the wires leaving them for the boundary; `top2` is the constant $11\,0^{\,n-1}$ mask, emitted as `3 << (AW-1)` on `AW+1` bits. The Gray word is computed from the *next* binary value and registered, never taken combinationally off the binary register — a live XOR of two flop outputs with unequal clock-to-Q emits a hazard pulse, and a receiver that samples that pulse sees a word neither pointer ever held. `wbin + 1` is `uint<{AW+2}>`, so `trunc` performs the $\bmod\ 2^{n+1}$ wrap explicitly; the wrap is the design intent, not an overflow. `trunc(wbin)` drops the extra MSB to form the $n$-bit RAM address. Both flags are combinational and feed back into their own domain's increment enable, which is the only loop in the design and is a normal synchronous one. Synthesis differs from the drawing in one place: `sync2` becomes two ordinary flops that carry no special property until the placer is told to keep them together, so the `ASYNC_REG` attribute — invisible in this RTL — is what makes the picture true in silicon.

**Related Notes**

- [[Gray Code Counter]] – depends-on: the $b \to g$ map and the one-bit-per-increment proof both flags rest on.
- [[Synchronizer Chain]] – depends-on: the metastability filter on each crossing, and where the chain depth is chosen.
- [[Race-Free State Assignment]] – supports: the $d_H = 1$ embedding theorem, of which this circuit is the industrial case.
- [[Block Memory]] – supports: the dual-clock dual-port RAM the payload lives in, and the reason the drawing maps one-to-one onto FPGA.
- [[Network-On-Chip Link]] – extends: routers on either end of a long link need not share a clock, so every link terminates in one of these.
- [[Mutual Exclusion Element]] – compares: the other way two domains meet, for a single shared resource rather than a stream.
- [[Choosing an Asynchronous Style]] – compares: where this sits against the handshake styles, and why it is the one that survives on FPGA.

## References

- [[Asynchronous Sequential Logic]] — §Races and critical races (the $d_H = 1$ race-free condition and the Gray-pointer callout), §FPGA mapping (why the CDC FIFO is the only structure in the topic FPGAs actually run), §Trade-offs (GALS interfaces and NoC links as the places async survives).
- [[2.8) Counters]] — §Gray counters, for the encoding and the registered-conversion argument reused here.
- No textbook source for this topic. The material is standard in Weste & Harris, *CMOS VLSI Design* (synchronisers, metastability, clock-domain crossing), Wakerly, *Digital Design: Principles and Practices* (FIFOs and Gray code), and Mano & Ciletti, *Digital Design* (asynchronous sequential logic). The specific $n{+}1$-bit-pointer FIFO with the two-bit-inverted Gray full test is Cummings, "Simulation and Synthesis Techniques for Asynchronous FIFO Design", SNUG 2002. Page numbers are deliberately omitted — no copy was consulted for this note.
