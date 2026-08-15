---
title: Johnson Counter
description: "Twisted ring feeding back the complement: 2n states from n flops, one bit changing per step (so it is a Gray code), decoded by one 2-input gate per state — the 2-bit case is quadrature clock phases."
kind: circuit
source: "2.8) Counters §Ring and Johnson counters, §FPGA mapping, §Trade-offs — no book source"
status: seed
spade: simulated
tags: [digital, counters, shift-register, gray, clocking]
aliases:
  - Twisted Ring Counter
  - Twisted-Ring Counter
  - Switch-Tail Ring Counter
  - Möbius Counter
  - Johnson Counters
---

# Johnson Counter

A shift register whose feedback path inverts the bit falling off the end, so $n$ flops walk a cycle of $2n$ states with exactly one bit changing per step and no arithmetic anywhere in the loop.

```tikz title="4-bit Johnson counter: shift register, complementing feedback, and one two-input decode of state 1100"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % --- four D flip-flops, data flows left to right: q3 -> q2 -> q1 -> q0 ---
  \foreach \x/\n in {0/3, 2.6/2, 5.2/1, 7.8/0} {
    \draw (\x,0) rectangle (\x+1.6,1.3);
    \node at (\x+0.85,0.72) {$q_{\n}$};
    \node[anchor=west] at (\x+0.06,1.12) {\tiny D};
    \node[anchor=east] at (\x+1.54,1.12) {\tiny Q};
    \draw (\x,0.18) -- (\x+0.26,0.36) -- (\x,0.54);
  }

  % --- shift path ---
  \foreach \a/\b in {1.6/2.6, 4.2/5.2, 6.8/7.8} {
    \draw[->] (\a,0.65) -- (\b,0.65);
  }
  \node[above] at (2.1,0.68) {\tiny 1};
  \node[above] at (4.5,0.68) {\tiny 1};
  \node[above] at (7.1,0.68) {\tiny 1};

  % --- twisted feedback: complement of q0 into q3 ---
  \draw (9.4,0.65) -- (10.4,0.65) -- (10.4,3.6) -- (-1.0,3.6) -- (-1.0,0.65);
  \draw[->] (-1.0,0.65) -- (0,0.65);
  % inverter, pointing left along the return path
  \draw[fill=white] (3.9,3.3) -- (3.9,3.9) -- (3.2,3.6) -- cycle;
  \draw (3.08,3.6) circle (0.12);
  \node[above] at (6.6,3.62) {$q_{n-1}^{+}=\overline{q_0}$ \ \ (1 bit)};
  \node[above] at (1.1,3.62) {\tiny 1};

  % --- output bus ---
  \fill (9.4,0.65) circle (1.6pt);
  \draw[->] (9.4,0.65) -- (9.4,-0.75) -- (12.6,-0.75);
  \node[above] at (11.1,-0.71) {$q$ \ ($n$ bits, $2n$ states)};

  % --- two-bit decode of one state ---
  \draw (4.9,0.65) -- (4.9,1.9);
  \fill (4.9,0.65) circle (1.6pt);
  \draw (7.5,0.65) -- (7.5,1.9);
  \fill (7.5,0.65) circle (1.6pt);
  \draw (4.2,1.9) rectangle (8.0,2.9);
  \node at (6.1,2.4) {$q_2 \wedge \overline{q_1}$};
  \node[anchor=west] at (4.98,2.02) {\tiny $q_2$};
  \node[anchor=east] at (7.42,2.02) {\tiny $q_1$};
  \draw[->] (4.2,2.4) -- (2.4,2.4);
  \node[above] at (3.3,2.44) {state $1100$};
  \node[below] at (3.3,2.36) {\tiny glitch-free};

  % --- clock ---
  \draw (-1.0,-1.4) -- (8.65,-1.4);
  \node[left] at (-1.05,-1.4) {clk};
  \foreach \x in {0.85, 3.45, 6.05, 8.65} {
    \draw[->] (\x,-1.4) -- (\x,0);
    \fill (\x,-1.4) circle (1.6pt);
  }

  % --- the cycle ---
  \node[anchor=west] at (-1.0,-2.3) {\footnotesize $0000 \to 1000 \to 1100 \to 1110 \to 1111 \to 0111 \to 0011 \to 0001 \to 0000$};

\end{circuitikz}
\end{document}
```

**Twist the ring's feedback and the period doubles for free.** The state $q=q_{n-1}\dots q_0$ is $n$ bits; the feedback wire, `en` and `rst` are 1 bit each. A [[Ring Counter]] closes the shift register with a plain wire, $q^{+}=\mathrm{rot}(q)$; the Johnson counter closes it through an inverter:

$$q_{n-1}^{+}=\overline{q_0},\qquad q_i^{+}=q_{i+1}\ \ (i<n-1)$$

Write that map as an operator $T$ on $\{0,1\}^n$. Applying it $n$ times pushes every bit out of the low end and refills the word entirely from the feedback, so $T^{n}(q)=\bar q$ bitwise — check on $0000\to1000\to1100\to1110\to1111$. Complementation is an involution, hence $T^{2n}=\mathrm{id}$: the period divides $2n$ for *every* state, and on the cycle through $0$ it is exactly $2n$ because $T^{k}(0)\ne 0$ for $0<k<2n$. So $n$ flops give $2n$ states against a ring's $n$, at a cost of one inverter and no change to the clock period.

> [!important] Every reachable state is a thermometer word.
> Starting from $0$, the reachable set is exactly $\{1^k0^{\,n-k}\}\cup\{0^k1^{\,n-k}\}$ — a block of ones sliding in from the MSB end, then a block of zeros doing the same. That single structural fact is the whole note: it forces the one-bit-per-step property, it makes two adjacent bits a unique state identifier, and it is what fails when the counter powers up in one of the other $2^n-2n$ words.

**One bit changes per step, so the sequence is a Gray code.** Extend the state to the $(n{+}1)$-bit sequence $r_0=q_0,\ \dots,\ r_{n-1}=q_{n-1},\ r_n=\overline{q_0}$. By construction $q_i^{+}=r_{i+1}$ for every $i$, so the Hamming distance is the number of *boundaries* in $r$:

$$d_H(q^{+},q)=\#\{i<n:\ r_i\neq r_{i+1}\}$$

A thermometer word has at most one internal boundary. If $0<k<n$ the word $1^k0^{\,n-k}$ has exactly one, at the block edge, and its ends agree with the appended bit ($q_0=0\Rightarrow r_n=1=q_{n-1}$), so the appended bit adds none — total $1$. If $k=0$ or $k=n$ the word is uniform with no internal boundary, but then $r_n=\overline{q_0}\ne q_{n-1}$ and the appended bit supplies the single boundary — total $1$ again. The same argument transposed covers $0^k1^{\,n-k}$. Hence $d_H=1$ for all $2n$ states, and the counter inherits the clock-domain-crossing safety derived in [[Gray Counter]] — restricted to $2n$ states, and with the caveat that the receiving side gets a thermometer word, not a number. It also fixes the clock power: exactly one flop toggles per cycle regardless of $n$, against two in a ring and an average of two (worst case $n$) in a binary [[Synchronous Counters|synchronous counter]].

**Decode any state with one two-input gate, and get no glitch with it.** The boundary is unique, so its *position* names the state. For $0<k<n$, the word $1^k0^{\,n-k}$ is the only reachable state with $q_{n-k}\wedge\overline{q_{n-k-1}}$, and $0^k1^{\,n-k}$ the only one with $\overline{q_{n-k}}\wedge q_{n-k-1}$; the two uniform words have no internal boundary and are separated by the ends instead, $\overline{q_{n-1}}\wedge\overline{q_0}$ for all-zeros and $q_{n-1}\wedge q_0$ for all-ones. For $n=4$:

| state | decode | state | decode |
| --- | --- | --- | --- |
| $0000$ | $\overline{q_3}\,\overline{q_0}$ | $1111$ | $q_3\,q_0$ |
| $1000$ | $q_3\,\overline{q_2}$ | $0111$ | $\overline{q_3}\,q_2$ |
| $1100$ | $q_2\,\overline{q_1}$ | $0011$ | $\overline{q_2}\,q_1$ |
| $1110$ | $q_1\,\overline{q_0}$ | $0001$ | $\overline{q_1}\,q_0$ |

$2n$ AND2 gates of depth 1 decode all $2n$ states — against a binary counter's $n$-input AND per state — and the outputs are hazard-free for free: only one state bit moves per edge, and a two-input AND with one input held constant is a monotone function of the other, which admits no static or dynamic hazard. A binary counter's decode has no such guarantee, because several bits arrive with clock-to-Q skew between them and the gate can pulse on an intermediate word.

**The decoded outputs are a $2n$-phase non-overlapping clock generator — which is the real reason this circuit survives.** Each $q_i$ is high for $n$ of the $2n$ states, so every state bit is a square wave at $f/2n$ with 50 % duty, and $q_i$ lags $q_{i+1}$ by exactly one clock, i.e. by $360^\circ/2n$ of its own period. At $n=2$ the cycle is $00\to10\to11\to01$: two square waves at $f/4$ a quarter period apart — quadrature, the standard I/Q clock pair, and the source of the two non-overlapping phases used by [[Dual-Phase Latches]] and by switched-capacitor sampling networks. The decoded lines are the complementary view: $2n$ pulses, each exactly one clock wide, each guaranteed disjoint from the others because the states are disjoint. Nothing else generates evenly spaced, glitch-free, provably non-overlapping phases at one inverter of logic depth.

**The loop is one inverter deep, so $f_{\max}$ is a flop parameter, not a counter parameter.** The critical path is $t_{cq}+t_{\text{INV}}+t_{su}$ — no carry, no prefix tree, no dependence on $n$ at all, which is the same claim an [[Fibonacci LFSR]] makes and one XOR cheaper. On FPGA the counter need not spend flops at all: an `SRL16`/`SRL32` turns a single LUT into a 16- or 32-deep shift register, so a Johnson counter of length $\le32$ fits in one LUT plus its feedback and is the cheapest sequencer on the die ([[FPGAs]]). The catch is that an SRL exposes only its addressed output, so the state bits needed by the decode gates are no longer all visible — the SRL form is for pure phase generation and division, and a decoded counter goes back into slice flops, where a synchronous reset is free on the `SR` port anyway.

**Neither form starts itself.** The $2^n-2n$ unreachable words are not idle: they sit on their own disjoint cycles under $T$, and a counter powering up in one of them runs forever without ever entering the intended sequence. Two cures. The cheap one is reset, which on FPGA costs nothing and is the right default. The self-correcting one perturbs the feedback on illegal states only, and for $n=4$

$$q_3^{+}=\overline{q_0}\ \vee\ (q_2\wedge\overline{q_1})$$

agrees with $\overline{q_0}$ on all eight legal states and drains every one of the remaining eight into the cycle, at a cost of one AND2 and one OR2 in the feedback path — one more gate delay on the only path that matters.

> [!warning] The correction above is my own exhaustive search, not a sourced result
> Verified by enumerating all $2^4$ states for $n=4$. The fan-in does not stay at three: no feedback function of $(q_2,q_1,q_0)$ alone self-corrects at $n=5$ or $n=6$ (checked exhaustively over all such functions), while functions of the four lowest bits do. Treat the general-$n$ patch as unsolved here and use a reset.

> [!warning] No sourced silicon numbers
> This topic has no book source. Every count above is structural — gates, depth, flops, toggles per cycle — and follows from the derivations. Absolute delays, LUT/slice counts and power depend on process and fabric and must come from synthesis.

$$\boxed{\ q^{+}=(\overline{q_0},\,q_{n-1},\dots,q_1),\qquad T^{n}=\overline{(\cdot\,)}\ \Rightarrow\ \text{period }2n,\qquad d_H(q^{+},q)=1\ }$$

**When it breaks**

- **Density is linear, and that is fatal past a handful of states.** $2n$ states from $n$ flops against $2^n$; at 16 states a Johnson counter costs 8 flops and a binary counter costs 4, at 256 states it costs 128 against 8. Use it where the *decoded* output is the product — phases, sequencers, small round-robin — and switch to [[Synchronous Counters]] or [[Gray Counter]] the moment you want a count.
- **The state is not a number.** It cannot be loaded, added to, or compared for magnitude; only equality and the two-bit decode are meaningful. There is no useful terminal-count compare beyond "am I in state $j$", and no [[Modulo-N Counter]] behaviour without truncating the cycle.
- **Only even moduli, and only $2n$ of them.** Any modulus other than $2n$ means splicing the cycle — feeding the feedback from a mid-chain tap or forcing a state — and the splice edge is the one transition where more than one bit moves, which forfeits both the Gray property and the glitch-free decode exactly there.
- **The cycle must not be entered from outside.** Loading a value, gating with a glitchy enable, or any asynchronous set/clear on a subset of flops can land the word off the thermometer set; with no correction logic it never comes back.
- **Illegal states also decode.** The two-bit decodes are unique *over the reachable set only*. In an unreachable word several decode gates can assert at once, so a Johnson-decoded sequencer without reset or correction can drive two mutually exclusive phases simultaneously — a failure mode that is silent in RTL simulation, which starts from the reset state.

**RTL (Spade)**

```spade
fn twist<#uint N>(q: uint<N>) -> uint<N> {
    let low: uint<{N - 1}> = trunc(q >> 1);
    let top: uint<1> = if q.lsb() { 0 } else { 1 };
    top.concat(low)
}

entity johnson<#uint N>(clk: clock, rst: bool, en: bool) -> uint<N> {
    reg(clk) q: uint<N> reset(rst: 0) = if en { twist(q) } else { q };
    q
}
```

`q` is the whole flop chain of the diagram, bit $0$ being the rightmost box; `twist` is the return path. `q >> 1` is the shift arrow between boxes and shifts in a zero at the top, so `trunc` to `uint<{N-1}>` drops that zero — it is a rewiring, not a shifter, and synthesis emits no logic for it. `q.lsb()` is the tap on $q_0$ and the `if` is the inverter, written as a select because `!` is bool-only in Spade; `top.concat(low)` puts `top` in the **high** position (integer `concat` is high-first, the opposite of array `concat`), which is what makes the feedback land on $q_{n-1}$ and not on $q_0$. Everything outside the `reg` is combinational and one gate deep; the enable becomes the slice flop's `CE` and the reset its `SR`, so on FPGA the drawn inverter is the only logic that survives synthesis.

**Related Notes**

- [[Ring Counter]] – compares: the same shift register with an uncomplemented feedback — half the states, but the decode is a wire instead of a gate.
- [[Gray Counter]] – compares: the other one-bit-per-step counter; $2^n$ states and a real count, paid for with an incrementer and a second register.
- [[Dual-Phase Latches]] – supports: the $n=2$ case is exactly the non-overlapping two-phase clock those latches need.
- [[Synchronous Counters]] – compares: exponential density and arithmetic state, at a carry chain's delay and a multi-input decode.
- [[Fibonacci LFSR]] – compares: the other $n$-flop sequencer with $n$-independent $f_{\max}$; $2^n-1$ states, one XOR of depth, no decode structure at all.
- [[Modulo-N Counter]] – counter-example: arbitrary moduli come from compare-and-clear on a binary count, which this structure cannot do.
- [[Choosing a Counter]] – compares: where this sits against every sibling.

## References

- [[2.8) Counters]] — §Ring and Johnson counters (the twisted-ring recurrence, the $2n$-state cycle, the two-bit decode, the quadrature case), §FPGA mapping (`SRL16`/`SRL32` and the free `CE`/`SR` ports), §Trade-offs (the Johnson row: $t_{cq}+t_{\text{INV}}+t_{su}$, one inverter of depth, one flop toggling per cycle, CDC-safe over $2n$ states).
- No textbook source for this topic. The material is standard in Mano & Ciletti, *Digital Design* (switch-tail ring counters and their decoding), Wakerly, *Digital Design: Principles and Practices* (ring, Johnson and self-correcting variants), and Weste & Harris, *CMOS VLSI Design* (non-overlapping clock generation). Page numbers are deliberately omitted — no copy was consulted for this note.
