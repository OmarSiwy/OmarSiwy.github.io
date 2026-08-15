---
title: "Preload-and-Overflow Counter"
description: "Load 2^n - N and count up so the wrap condition is the incrementer's own carry-out — the comparator disappears entirely, at the price of the load mux."
kind: circuit
source: "2.8) Counters §Modulo-N counters — no book source"
status: seed
spade: simulated
tags: [digital, counters, modulo, carry]
aliases:
  - Preload Counter
  - Preload and Overflow Counter
  - Preload-and-Overflow
  - Overflow-Terminated Counter
---

# Preload-and-Overflow Counter

A modulo-$N$ counter that biases its state by $2^n-N$ so that the cycle ends on the natural binary overflow, making the terminal condition a wire the incrementer had already built rather than a comparator.

```tikz title="Preload-and-overflow modulo-N counter: the incrementer's carry-out is both the terminal count and the load select"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  \draw (0,1.0) rectangle (1.4,3.2);   \node at (0.7,2.1) {2:1};
  \draw (3.2,1.4) rectangle (4.8,2.8); \node at (4.0,2.1) {REG};
  \draw (6.6,1.4) rectangle (8.6,2.8); \node at (7.6,2.1) {$+1$};

  % preload constant into the mux
  \draw[->] (-2.9,2.8) -- (0,2.8);
  \node[anchor=south] at (-1.45,2.85) {$2^n-N$ \, / \, $n$};

  \draw[->] (1.4,2.1) -- (3.2,2.1);
  \node[anchor=south] at (2.3,2.15) {$n$};

  \draw[->] (4.8,2.1) -- (6.6,2.1);
  \node[anchor=south] at (5.7,2.15) {$Q$ \, / \, $n$};

  % count tap
  \fill (5.6,2.1) circle (1.6pt);
  \draw[->] (5.6,2.1) -- (5.6,0.0);
  \node[anchor=west] at (5.65,-0.3) {$Q$ \, / \, $n$};

  % sum feedback
  \draw[->] (8.6,1.8) -- (9.4,1.8) -- (9.4,-1.4) -- (-1.0,-1.4) -- (-1.0,1.6) -- (0,1.6);
  \node[anchor=south] at (4.2,-1.35) {$Q+1$ \, / \, $n$};

  % carry-out = terminal count, drives the mux select and leaves the block
  \draw (8.6,2.5) -- (9.0,2.5) -- (9.0,4.3) -- (0.7,4.3) -- (0.7,3.2);
  \draw[->] (0.7,3.6) -- (0.7,3.2);
  \fill (9.0,3.6) circle (1.6pt);
  \draw[->] (9.0,3.6) -- (11.3,3.6);
  \node[anchor=south] at (10.15,3.65) {TC $=c_n$ \, / \, $1$};
  \node[anchor=south] at (4.4,4.45) {load select};

  \draw[->] (4.0,0.6) -- (4.0,1.4);  \node[anchor=north] at (4.0,0.55) {clk};
  \draw[->] (7.6,0.6) -- (7.6,1.4);  \node[anchor=north] at (7.6,0.55) {EN $=c_0$};

  \node[anchor=west] at (-2.9,5.9) {$Q$ visits $2^n\!-\!N,\;2^n\!-\!N\!+\!1,\;\ldots,\;2^n\!-\!1$ --- exactly $N$ states, then $c_n$ reloads};
  \node[anchor=west] at (-2.9,5.35) {no comparator anywhere: the wrap condition is the incrementer's own carry-out};

\end{circuitikz}
\end{document}
```

**Bias the state so the cycle ends where the hardware already ends.** Fix a datapath width $n\ge\lceil\log_2 N\rceil$ and let the load constant be the $n$-bit word $M=2^n-N$. After $k$ enabled edges since a load, the $n$-bit state is

$$Q_k=M+k=2^n-N+k,\qquad 0\le k<N$$

which is monotone and never wraps for $k<N$, since $Q_{N-1}=2^n-1$ is the largest $n$-bit value. On the next enabled edge the incrementer's carry-out fires. From [[Incrementer]] the carry chain has the closed form $c_n=\text{EN}\cdot\prod_{j<n}q_j$, and an AND over every bit is $1$ exactly when $Q=2^n-1$, so

$$c_n=1\iff k=N-1$$

The terminal condition is therefore not computed — it is *read* off the top of a chain that the increment needed anyway. Feed $c_n$ back as the load select and the state returns to $M$, giving a cycle of exactly $N$ states. Everything else in the loop is the ordinary [[Synchronous Counters|synchronous counter]] structure: one $n$-bit register, one $n$-bit incrementer, one $n$-bit 2:1 mux, and the $1$-bit rails EN $=c_0$ and TC $=c_n$.

**The preload constant is the two's complement of the modulus.** By the negation identity of [[Number Formats]], $-N\equiv\overline{N}+1\pmod{2^n}$, and $2^n-N$ is that same residue, so

$$M=2^n-N=\overline{N}+1 \pmod{2^n}$$

Read the state as a signed $n$-bit integer and the counter runs $-N,-N+1,\ldots,-1$ and then overflows out of $-1+1=0$. This is the practical form when $N$ is programmable rather than a synthesis-time constant: the register holds $-N$, so software writes the negated modulus, or the hardware spends one bitwise NOT plus one $n$-bit increment to negate it on write. Never negate it on the fly inside the loop — that puts a second carry chain in series with the first.

**Preload-and-overflow is a zero-detect down counter under bit complement.** Let $R_k=N-1-k$ be the state of the down-counting sibling, which starts at $N-1$ and stops at $0$. Adding the two state sequences,

$$Q_k+R_k=(2^n-N+k)+(N-1-k)=2^n-1\quad\Longrightarrow\quad Q_k=\overline{R_k}$$

using $\overline{X}=2^n-1-X$. So the two circuits hold complementary words at every instant, and the complement is a bijection carrying one onto the other — which is the same statement as the incrementer's $\overline{\overline{R}+1}=R-1 \pmod{2^n}$, an increment in the barred coordinates *is* a decrement in the unbarred ones. Under that map the all-ones AND detecting $Q=2^n-1$ becomes the all-zeros NOR detecting $R=0$, and the carry-out becomes the borrow-out. Neither construction is cleverer than the other; they are one circuit in two coordinate systems, which is why both get their terminal condition for free. Choose on which word you want to publish: $Q$ if you want an ascending index, $R$ ([[Zero-Detect Down Counter]]) if you want ticks-remaining.

**Deleting the comparator buys area and $N$-independence, not depth.** Compare-and-clear ([[Modulo-N Counter]]) needs an equality test against $N-1$: an AND of $n$ literals, complemented on the bits where $N-1$ is zero, so depth $\lceil\log_2 n\rceil$ as a tree and — the part that hurts in practice — a literal-polarity map that is a *function of $N$*, regenerated by synthesis every time $N$ changes. Preload spends nothing there. The timing is a wash, though, and it is worth being precise about why: in both structures the mux data input $Q+1$ is only valid at $t_{\text{inc}}$, the full carry-chain delay, so

$$t_{\text{logic}}=t_{\text{inc}}+t_{\text{mux}}$$

either way. The comparator in the rival structure evaluates on $Q$ in parallel with the increment and $t_{\text{cmp}}<t_{\text{inc}}$, so it never sets the period. What you actually save is $n$ literals of AND tree and the resynthesis; what you actually spend is $n$ 2:1 muxes instead of $n$ clear gates. On an ASIC that is a real per-bit cost and the trade is close.

**On a LUT fabric the load mux costs nothing, and that is the whole argument.** When $N$ is a compile-time constant, every bit of $M$ is a constant $0$ or $1$, so "load $M$" is per-bit *set the flop* or *clear the flop* — and a synchronous set and a synchronous reset are ports on the flip-flop itself, not logic in front of it ([[FPGAs]]). The mux vanishes from the fabric, the flop's control net is driven by $c_n$, and the counter costs exactly the one LUT and one carry-chain multiplexer per bit that a bare [[Incrementer]] costs. Compare-and-clear cannot collapse the same way, because its select is a comparator that has to live in LUTs. The advantage evaporates the moment $M$ becomes a runtime register: the constant is gone, a genuine $n$-bit mux reappears between the carry chain and the flops, and the two structures cost the same again.

> [!note] The set/reset trick is what makes this construction worth knowing
> Everything else here — the bias, the negation identity, the complement duality — is arithmetic bookkeeping that any of the three modulo-$N$ constructions could match. The reason preload-and-overflow is the default in FPGA timer and prescaler RTL is narrower than that: a constant load is not logic, it is flip-flop control, so a constant-modulus preload counter has *literally the same fabric cost* as a free-running binary counter.

**Every unreachable state walks back into the cycle.** A modulo-$N$ counter with $N<2^n$ leaves $2^n-N$ states outside the legal cycle, and in general nothing guarantees an upset recovers rather than falling into a disjoint parasitic cycle ([[Synchronous Sequential Logic]]). Here the question is settled by inspection of the next-state function. With EN held high the map is

$$Q^{+}=\begin{cases}M,&Q=2^n-1\\Q+1,&\text{otherwise}\end{cases}$$

whose functional graph is the single path $0\to1\to\cdots\to2^n-1$ plus exactly one back edge, $2^n-1\to M$. A functional graph with one back edge has one cycle, namely $M,\ldots,2^n-1$, so the illegal states $\{0,\ldots,M-1\}$ form a transient tail that empties into it: from any of them the counter rejoins the legal cycle within $2^n-1-Q$ enabled edges. The counter is self-starting and needs no reset for *correctness* — but the output is a wrong count for the whole transient, which for a wide counter is most of $2^n$ cycles, so a timer still gets its reset.

$$\boxed{\ Q^{+}=c_n\,?\,(2^n-N):(Q+1),\qquad c_n=\text{EN}\cdot\!\!\prod_{j<n}q_j,\qquad Q_k=k-N \bmod 2^n\ }$$

**When it breaks**

- **$Q$ is not the count index.** The published state is $k-N \bmod 2^n$, offset by $M$. Anything decoding the count — a memory address, a state one-hot, a display — has to subtract the bias, and then you have paid for an adder to avoid a comparator. If you need $0,\ldots,N-1$ ascending, compare-and-clear is the right sibling.
- **$N$ must fit the datapath.** $N\le2^n$ is required, and $N=2^n$ makes $M=0$: the mux is dead logic and the circuit degenerates to a plain binary counter whose wrap is already modulo $N$. At $N=1$ the load fires every cycle and the register holds a constant.
- **Runtime $N$ costs a negation.** The loop wants $-N$, not $N$. Compute it once on write ($\overline{N}+1$), never inside the feedback path, or the second carry chain lands in series with the first and halves $f_{\max}$.
- **TC is combinational and it glitches.** $c_n$ is the top of the carry chain and settles through $n$ AND levels, so it is not a clean one-cycle pulse until the period ends. Do not drive an asynchronous load or clear with it, do not use it as a clock, and if a downstream domain needs it, register a copy computed from the next state.
- **The load must be synchronous.** An asynchronous load closes a combinational loop $c_n\to$ load $\to Q\to c_n$, which oscillates rather than counts. This is the one wiring mistake that turns the construction from cheap into unbuildable.
- **As a clock divider the duty cycle is $1/N$, not one half.** TC is high for one cycle in $N$. A symmetric $\div N$ output needs a toggle flop behind it, which divides again — period $2N$, so size the counter for $N/2$.
- **Cascading through TC serialises the carry.** Driving a wider slice's EN from this TC puts both carry chains end to end ([[Cascaded Counter Chain]]); a parallel-enable structure keeps the depth flat.

**RTL (Spade)**

```spade
entity preload_counter<#uint W>(clk: clock, rst: bool, en: bool, m: uint<W>) -> (uint<W>, bool) {
    decl nxt;
    reg(clk) q reset(rst: m) = nxt;
    let sum = q + (if en { 1 } else { 0 });
    let tc  = sum.msb();
    let nxt = if tc { m } else { trunc(sum) };
    (q, tc)
}
```

`m` is the preload constant $M=2^n-N$ entering the mux from the left, `q` is the register, and `sum` is the $+1$ block: `q + c0` is `uint<{W+1}>`, so `trunc(sum)` is the $n$-bit $Q+1$ on the feedback wire and `sum.msb()` is $c_n$ — the same expression yields both the load select and the published TC, which is the entire point of the structure. The enable is written as a value rather than a flag because Spade's `+` needs equal-width operands; constant propagation puts it back on the LSB slice as $c_0$. `decl nxt` is needed only because the mux is written after the register it feeds; it is one combinational net, not a stage. What synthesis does differently from the drawing: with `m` a constant it will not build the 2:1 mux at all, folding each bit into the flop's synchronous set or reset port.

**Related Notes**

- [[Modulo-N Counter]] – compares: the three constructions for $N\ne2^n$, of which this is the second.
- [[Zero-Detect Down Counter]] – compares: the same circuit in complemented coordinates, publishing ticks-remaining instead of a biased index.
- [[Incrementer]] – depends-on: supplies $c_n=\text{EN}\cdot\prod_{j<n}q_j$, the carry-out this construction reuses as its terminal condition.
- [[Synchronous Counters]] – depends-on: the register-plus-increment loop and the $T_{\text{clk}}$ constraint the mux delay enters.
- [[Number Formats]] – depends-on: $2^n-N=\overline{N}+1$ and the $\overline{X}=2^n-1-X$ identity behind the complement duality.
- [[Comparators]] – counter-example: the block this construction exists to delete, and the cost model it is measured against.
- [[Cascaded Counter Chain]] – extends: TC as the next slice's enable, and the depth that costs.
- [[FPGAs]] – supports: the synchronous set/reset ports that absorb a constant preload into the flops.
- [[Choosing a Counter]] – compares: where this sits against every sibling structure.

## References

- [[2.8) Counters]] — §Modulo-$N$ counters (the three constructions, the preload value $2^n-N$, the carry-out as terminal condition, and the unused-state warning) and §The increment is an adder with one operand tied to 1 (the closed-form carry $c_n$ and the complement identity).
- No textbook source for this topic. The construction is standard in Mano & Ciletti, *Digital Design* (counters with parallel load), Wakerly, *Digital Design: Principles and Practices* (the 74x163 load-on-carry modulus trick), and Weste & Harris, *CMOS VLSI Design*. Page numbers are omitted deliberately — no copy was consulted while writing.
