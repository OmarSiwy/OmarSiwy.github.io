---
title: Gray Code State Encoding
description: "Same width as binary with single-bit transitions, worth the effort only for chain-shaped machines or a state bus sampled from another clock domain where at most one bit may be metastable."
kind: circuit
source: "0.4) Synchronous Sequential Logic — State assignment; Mano & Ciletti ch. 5"
status: seed
spade: simulated
tags: [digital, synchronous-sequential-logic, fsm, encoding, gray-code, cdc]
aliases:
  - Gray Encoding
  - Gray Code Encoding
  - Gray State Assignment
  - Gray-Coded FSM
---

# Gray Code State Encoding

A minimum-width state assignment, $s=\lceil\log_2 N\rceil$ flops like binary, in which consecutive states are one Hamming step apart so a chain transition toggles exactly one flop.

```tikz title="A 5-state chain under Gray and binary encoding, with the Hamming distance on each edge"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\small]
  % --- Gray-coded chain
  \node[anchor=west, font=\footnotesize\bfseries] at (-1.9,0.95) {Gray, $s=3$};
  \foreach \i/\x/\c in {0/0/000, 1/2.3/001, 2/4.6/011, 3/6.9/010, 4/9.2/110} {
    \node[draw, circle, minimum size=0.85cm, inner sep=0pt] (g\i) at (\x,0) {$S_\i$};
    \node[anchor=north, font=\scriptsize] at (\x,-0.55) {$\c$};
  }
  \foreach \a/\b/\l in {0/1/{b_0}, 1/2/{b_1}, 2/3/{b_0}, 3/4/{b_2}} {
    \draw[->] (g\a) -- (g\b);
    \node[anchor=south, font=\scriptsize] at ($(g\a)!0.5!(g\b) + (0,0.18)$) {$\Delta{=}1$};
    \node[anchor=north, font=\scriptsize, text=gray] at ($(g\a)!0.5!(g\b) + (0,-0.16)$) {$\l$};
  }

  % --- Binary-coded chain, same graph
  \node[anchor=west, font=\footnotesize\bfseries] at (-1.9,-2.45) {Binary, $s=3$};
  \foreach \i/\x/\c in {0/0/000, 1/2.3/001, 2/4.6/010, 3/6.9/011, 4/9.2/100} {
    \node[draw, circle, minimum size=0.85cm, inner sep=0pt] (b\i) at (\x,-3.4) {$S_\i$};
    \node[anchor=north, font=\scriptsize] at (\x,-3.95) {$\c$};
  }
  \foreach \a/\b/\d in {0/1/1, 1/2/2, 2/3/1, 3/4/3} {
    \draw[->] (b\a) -- (b\b);
    \node[anchor=south, font=\scriptsize] at ($(b\a)!0.5!(b\b) + (0,0.18)$) {$\Delta{=}\d$};
  }

  \node[anchor=west, font=\scriptsize] at (-1.9,-4.8)
    {Same 5-state chain, same 3 flops: only the labelling differs.};
\end{circuitikz}
\end{document}
```

*Own construction; the encoding table is the standard reflected binary code.*

**Build the code by reflection, not by a lookup table.** Number the states along the chain $0,1,\dots,N-1$ and let $b\in\{0,1\}^s$ be that index in binary, $s=\lceil\log_2 N\rceil$ bits. The reflected binary (Gray) code is the one-line map

$$g \;=\; b \oplus (b \gg 1),$$

an $s$-bit-in, $s$-bit-out function costing $s-1$ two-input XORs — bit $j$ is $g_j = b_j \oplus b_{j+1}$ with $g_{s-1}=b_{s-1}$, because the shifted-in bit is $0$. No table, no per-state hand assignment, and it extends to any $s$ without re-deriving.

**Prove the single-bit property from the carry structure of $b+1$.** Let $b$ end in exactly $k$ ones, i.e. bit $k$ is its lowest zero. Incrementing propagates a carry through that run: $b+1$ clears bits $0..k-1$ and sets bit $k$, so $b \oplus (b{+}1) = 2^{k+1}-1$, a mask of $k+1$ ones. Because XOR is associative and commutative, and a logical shift distributes over it ($(x\oplus y)\gg 1 = (x\gg 1)\oplus(y\gg 1)$),

$$g(b)\oplus g(b{+}1) \;=\; \big(b\oplus(b{+}1)\big) \;\oplus\; \big(b\oplus(b{+}1)\big)\!\gg\!1 \;=\; (2^{k+1}-1)\oplus(2^{k}-1) \;=\; 2^{k}.$$

The low $k$ bits are $1$ in both operands and cancel; exactly bit $k$ survives. So an increment along the chain flips one flop, and *which* flop is the index of the lowest zero of the binary state number — that is what the grey labels on the diagram's top row record. At the wrap $b=2^s-1\to 0$ the same algebra gives $(2^s-1)\oplus(2^{s-1}-1)=2^{s-1}$, one bit again, which is why the code is cyclic **only when the cycle length is exactly $2^s$**.

**Invert it with a suffix XOR, not with the same shift.** Gray is not an involution. Solving $g_j = b_j \oplus b_{j+1}$ downward from $b_{s-1}=g_{s-1}$ gives

$$b_j \;=\; \bigoplus_{k \ge j} g_k,$$

a suffix-XOR scan over the $s$-bit code. Written naively that is $O(s^2)$ XOR2 gates; written as a scan it is $s-1$ gates in a chain of depth $s-1$, or depth $\lceil\log_2 s\rceil$ if you reassociate it into a parallel-prefix tree exactly as the carry chain is reassociated in [[Adders]]. For state counts that fit an FSM the linear chain is free.

**Charge the encoding to the right budget: switching energy, not area.** Flop count is identical to [[Binary State Encoding]] — the code is a permutation of the same $2^s$ points, so $s$ is unchanged and neither the register nor the reset cost moves. What changes is the toggle count on the $s$-bit state bus: one bit per transition instead of an expected $s/2$ for a binary counter-like walk, since binary's low bits toggle every cycle. On a wide, heavily loaded, or off-tile state bus that is real dynamic power. It is also the only thing Gray buys on an arbitrary state transition graph — **nothing**. If the [[State Transition Graph]] branches, most edges are not increments, the reflection has no meaning along them, and Gray degenerates into an arbitrary binary code with unhelpfully scrambled next-state logic.

> [!important] The single-bit property is a property of *edges*, not of the code.
> Gray guarantees $\Delta=1$ only between codes whose indices differ by one. A machine that can jump from $S_1$ to $S_4$, or that aborts to reset from anywhere, has multi-bit edges like any other encoding, and every guarantee below evaporates on exactly those edges.

**The load-bearing use is clock-domain crossing, not power.** When a state or pointer register is sampled by an unrelated clock, the sampling flops may resolve some bits to the old value and some to the new. Under binary, $S_1(001)\to S_2(010)$ has two bits changing, so the receiver can latch $000$ or $011$ — codes that are not the source's before-state or after-state, and possibly not legal states at all. Under Gray only one bit is in flight, so a receiver clocking through a [[Two-Flop Synchronizer]] resolves it to either $0$ or $1$ and therefore sees either the old code or the new code, never a third value. The worst case degrades from "arbitrary corruption" to "one cycle of latency", which is precisely why an [[Asynchronous FIFO]] carries its read and write pointers as a [[Gray Code Counter]] and never as plain binary.

**What Gray costs on the logic side.** The next-state function $\delta$ is re-expressed over a different code, and there is no reason for it to be cheaper — synthesis re-minimizes from scratch and typically lands within noise of binary, sometimes worse. Comparisons are the sharp edge: Gray order is not monotone in magnitude ($0011 = 2 < 0010 = 3$), so `<`, `>` and "distance between pointers" are wrong on the raw code and need a decode first, which is why an async FIFO compares only for *equality* (empty) and equality-with-two-inverted-MSBs (full) across the domain boundary. Output decoding is likewise no better than binary and far worse than [[One-Hot State Encoding]], where a Moore output is often a single flop with no logic at all.

**On FPGAs you must ask for it and then check you got it.** Vivado and Quartus both default to one-hot for FSMs they recognise, because a slice flop is nearly free and one-hot minimises LUT depth; a hand-written Gray assignment is re-encoded away unless you set the encoding attribute (`fsm_encoding = "gray"` / equivalent) or the tool declines to infer an FSM at all. For a CDC pointer this matters more than for an FSM: the register must survive as written, so pointer logic is normally kept outside anything the tool will treat as a state machine. On ASIC there is no such re-encoding, and the toggle-energy argument is the whole argument.

$$\boxed{\;g = b \oplus (b \gg 1),\qquad b_j=\bigoplus_{k\ge j} g_k,\qquad \big|\,g(b)\oplus g(b{+}1)\,\big| = 1\;}$$

**When it breaks.**

- **Non-power-of-two cycles.** $N < 2^s$ and the wrap $N-1 \to 0$ flips several bits, killing the CDC guarantee at exactly one edge — the edge a testbench that only walks forward from reset will hit last. Async FIFOs are power-of-two-deep for this reason.
- **Branching machines.** Any non-chain edge is multi-bit; on a general STG Gray is an arbitrary code with none of its benefits and none of one-hot's.
- **Unused codes remain.** $2^s-N$ illegal codes exist just as under binary, and Gray does nothing to detect entry into one — Hamming distance 1 between neighbours is the opposite of the distance-3 code you would want for detection. Recovery is still [[Safe-State FSM Recovery]]'s problem.
- **More than one bit ever in flight.** Two independent Gray fields packed in one bus, or a code changed twice within one receiver clock period, both restore the multi-bit hazard. The source must advance at most one step per destination clock.
- **Ordering and arithmetic.** Anything beyond equality — comparison, subtraction to get an occupancy count, increment by more than one — has to decode to binary first, paying the suffix XOR and its depth.

```spade
/// Binary state index -> Gray code. s = 4 bits, 16 states.
fn gray_enc(i: uint<4>) -> uint<4> {
    i ^ (i >> 1)
}

/// Gray code -> binary state index: b_j = XOR of all g_k for k >= j.
fn gray_dec(g: uint<4>) -> uint<4> {
    g ^ (g >> 1) ^ (g >> 2) ^ (g >> 3)
}

/// State register of a chain-shaped FSM, Gray-encoded.
/// `adv` walks one link along the chain; the code, not the index, is the flop state.
entity gray_chain(clk: clock, rst: bool, adv: bool) -> (uint<4>, uint<4>) {
    decl next;
    reg(clk) g reset(rst: 0) = next;
    let idx = gray_dec(g);
    let next = if adv { gray_enc(trunc(idx + 1)) } else { g };
    (g, idx)
}
```

`g` is the 4-bit flop bank — the code printed under each circle in the diagram; `idx` is purely combinational and never exists as state, so nothing here is stored in binary. `trunc(idx + 1)` is deliberate: `+` widens $4\to5$ bits and the truncation supplies the mod-$2^4$ wrap that the single-bit proof needs at $1111\to0000$. Written as three 4-bit XOR words, `gray_dec` looks like 12 XOR2 gates; synthesis common-subexpression-eliminates it to the 3-gate suffix chain, which is the one place the RTL and the gate netlist disagree.

**Related Notes**

- [[Binary State Encoding]] – compares: identical flop count and identical $2^s$ code space, differing only in which permutation of it you use.
- [[One-Hot State Encoding]] – compares: spends $N-s$ extra flops to buy the cheap decode and fan-in Gray does not.
- [[Choosing an FSM Encoding]] – compares: places this against every sibling, and says when a chain is chain-shaped enough to matter.
- [[Gray Code Counter]] – extends: the $\delta$ of this encoding when the chain is the whole machine and every state advances.
- [[Two-Flop Synchronizer]] – depends-on: the receiver that turns "one bit metastable" into "old value or new value".
- [[Asynchronous FIFO]] – supports: the canonical consumer, carrying both pointers in this code across the boundary.
- [[State Transition Graph]] – depends-on: whether the graph is a chain is the entire criterion for using this encoding.
- [[Safe-State FSM Recovery]] – counter-example: single-bit adjacency is exactly the wrong property for detecting a corrupted state.

## References

- [[Synchronous Sequential Logic#State assignment|Synchronous Sequential Logic — State assignment]], for the binary / Gray / one-hot comparison this note expands.
- Mano & Ciletti, *Digital Design*, ch. 5 — state assignment and the reflected binary code.
- Wakerly, *Digital Design: Principles and Practices* — Gray code construction and its use on asynchronously sampled buses.
- C. Cummings, "Simulation and Synthesis Techniques for Asynchronous FIFO Design", SNUG 2002 — the Gray-pointer CDC argument in full.
