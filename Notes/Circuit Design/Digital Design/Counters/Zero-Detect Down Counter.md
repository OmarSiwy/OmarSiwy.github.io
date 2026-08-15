---
title: "Zero-Detect Down Counter"
description: "The default timer: preload N-1, decrement, detect zero with an n-input NOR — terminal condition is the borrow-out, hardware is constant across every N, and N becomes a register value rather than a synthesis constant."
kind: circuit
source: "2.8) Counters §Modulo-N counters (construction 3) — no book source"
status: seed
spade: simulated
tags: [digital, counters, modulo, timer, carry-chain]
aliases:
  - Down Counter
  - Zero-Detect Counter
  - Zero Detect Down Counter
  - Countdown Timer
  - Zero-Detect Down Counters
---

# Zero-Detect Down Counter

A modulo-$N$ counter that reaches its terminal state by counting *down* to zero, so the terminal predicate is the constant pattern $0$ rather than a pattern derived from $N$ — and is therefore already computed inside the decrementer's carry chain.

```tikz title="Zero-detect down counter: reload mux, decrementer, n-input NOR whose output is the decrementer's borrow-out"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % --- load mux ---
  \draw (0,0.4) rectangle (1.2,2.4);
  \node at (0.6,1.4) {mux};
  \node[right] at (0.05,2.0) {\scriptsize 1};
  \node[right] at (0.05,0.8) {\scriptsize 0};

  % reload input
  \draw[->] (-2.7,2.0) -- (0,2.0);
  \node[above] at (-1.35,2.05) {$N-1$ \; ($n$)};

  % mux -> q register
  \draw[->] (1.2,1.4) -- (2.2,1.4);

  % --- q register ---
  \draw (2.2,0.8) rectangle (3.8,2.0);
  \node at (3.0,1.4) {$q$ reg};
  \draw[->] (3.0,2.7) -- (3.0,2.0);
  \node[above] at (3.0,2.72) {clk};

  % q bus out
  \draw (3.8,1.4) -- (5.0,1.4);
  \fill (4.4,1.4) circle (1.5pt);
  \fill (5.0,1.4) circle (1.5pt);
  \draw[->] (5.0,1.4) -- (5.9,1.4);
  \node[above] at (5.45,1.42) {$n$};

  % q published downwards
  \draw[->] (4.4,1.4) -- (4.4,-0.25);
  \node[right] at (4.5,-0.15) {$q$ \; ($n$)};

  % --- decrementer ---
  \draw (5.9,0.8) rectangle (7.5,2.0);
  \node at (6.7,1.4) {$-1$};

  % feedback  q-1 -> mux input 0
  \draw (7.5,1.4) -- (8.5,1.4) -- (8.5,-0.9) -- (-0.9,-0.9) -- (-0.9,0.8);
  \draw[->] (-0.9,0.8) -- (0,0.8);
  \node[above] at (1.9,-0.88) {$q-1 \bmod 2^{n}$ \; ($n$)};

  % --- zero detect ---
  \draw (5.0,1.4) -- (5.0,2.9);
  \draw (4.0,2.9) rectangle (6.6,3.7);
  \node at (5.3,3.3) {$n$-input NOR};

  % tc out
  \draw (6.6,3.3) -- (9.4,3.3);
  \draw[->] (9.4,3.3) -- (10.3,3.3);
  \node[above] at (9.9,3.32) {\texttt{tc}};
  \node[below] at (8.4,3.26) {$=$ borrow-out of $-1$};
  \fill (7.4,3.3) circle (1.5pt);

  % tc -> mux select
  \draw (7.4,3.3) -- (7.4,4.4) -- (0.6,4.4);
  \draw[->] (0.6,4.4) -- (0.6,2.4);
  \node[right] at (0.68,2.75) {sel};

\end{circuitikz}
\end{document}
```

**Move the modulus out of the logic and into a register.** Let $n=\lceil\log_2 N\rceil$ and let $q$ be an $n$-bit unsigned state, the reload port $N-1$ another $n$-bit input, and `en`, `rst`, `tc` one bit each. The recurrence is

$$q^{+} = \begin{cases} N-1 & q = 0\\ q-1 \bmod 2^{n} & \text{otherwise}\end{cases}
\qquad \texttt{tc} = [\,q = 0\,]$$

so the state visits $N-1,\,N-2,\,\ldots,\,1,\,0$ and then reloads: $N$ distinct values, hence a `tc` period of exactly $N$ cycles. Nothing in that description is a *gate* parameterised by $N$ — the only appearance of $N$ is as data on the reload port. Change $N$ at runtime and the netlist is unchanged, which is the entire reason this is what a timer peripheral looks like.

**The comparison this avoids is the one whose gate depends on its operand.** Compare-and-clear ([[Modulo-N Counter]]) tests $q = N-1$. As a fixed constant that is a single $n$-input AND with the literals matching the zero bits of $N-1$ complemented — cheap, but the *polarity map* is a function of $N$, so a runtime-variable modulus turns it into a real equality [[Comparators|comparator]]: $n$ XNORs feeding an $n$-input AND, a cone of depth $1+\lceil\log_k n\rceil$ that shares nothing with the increment. Testing $q = 0$ needs no literal map at all, because $0$ is the one constant whose complement pattern is uniform:

$$[\,q=0\,] \;=\; \bigwedge_{i=0}^{n-1} \overline{q_i} \;=\; \overline{\bigvee_{i=0}^{n-1} q_i}$$

by De Morgan — an $n$-input NOR, the same gate for every $N$.

**Now show that the NOR is already in the datapath.** Over $n$ bits the two's-complement identity gives $-1 \equiv 2^n-1$ ([[Number Formats]]), the all-ones word, so decrementing is adding all-ones with carry-in $0$: $q-1 \equiv q + (2^n-1) \pmod{2^n}$. Feed that through the generate/propagate form of the carry recurrence ([[Incrementer]], [[Adders]]) with the second operand $b_i = 1$ for every $i$:

$$g_i = q_i \wedge 1 = q_i, \qquad p_i = q_i \oplus 1 = \overline{q_i}, \qquad c_{i+1} = g_i \vee (p_i \wedge c_i) = q_i \vee (\overline{q_i} \wedge c_i)$$

Apply distributivity of OR over AND to $q_i \vee (\overline{q_i} \wedge c_i) = (q_i \vee \overline{q_i}) \wedge (q_i \vee c_i)$ and then complementation $x \vee \bar{x} = 1$: the recurrence collapses to the plain OR $c_{i+1} = q_i \vee c_i$. With $c_0 = 0$, induction on $i$ gives

$$c_n = \bigvee_{i=0}^{n-1} q_i$$

and the borrow-out of a subtraction is the complement of that carry-out, $\texttt{borrow} = \overline{c_n}$. That is the $n$-input NOR, bit for bit. The zero-detect is not an extra gate bolted onto the counter; it is the top node of the chain the decrementer must build anyway.

> [!important] The terminal condition is the borrow-out, so it costs one carry stage, not a reduction tree.
> The difference bits are $d_i = \overline{q_i} \oplus c_i$ and the last of them needs only $c_{n-1}$, so $c_n$ sits exactly one carry stage past the critical difference bit. The flag is therefore $\Theta(1)$ *additional* delay on a path that already pays the chain, against the $\lceil\log_k n\rceil$-deep independent cone that compare-and-clear needs. Area and delay both.

**The loop that limits $f_{\max}$ is the reload decision, not the decrement.** `tc` selects the mux that feeds $q$, so the cycle is $q \to$ chain $\to$ `sel` $\to$ mux $\to q$, costing $t_{cq} + t_{\text{chain}}(n) + t_{\text{mux}} + t_{su}$ — one mux longer than a free-running counter. If that becomes binding, detect $q = 1$ instead and register the flag: the registered version asserts on the cycle where $q = 0$, the modulus is unchanged, and the reduction now terminates at a flop's D input instead of closing a loop. The pattern stays $N$-independent — only the polarity of literal $0$ flips — which is the property being defended, so the retiming costs nothing structurally.

**Illegal states cannot trap, and the argument is a potential function rather than a state-graph search.** With $N < 2^n$ the states $N,\ldots,2^n-1$ are unreachable in normal operation, and the long-form note's standing warning is that an upset landing in one can sit in a disjoint parasitic cycle. Here it cannot: every transition out of a non-zero state strictly decreases the integer value of $q$, and the only edge that increases it is the reload, taken solely at $q=0$. A cycle among non-zero states would require a strictly decreasing sequence to return to its start, so no such cycle exists, and any state $s$ rejoins the legal cycle within $s \le 2^n-1$ enabled cycles. Self-starting is free; unlike a [[Ring Counter]] or an LFSR, no reset is needed to guarantee it. What a reset still buys is a *bounded* recovery time.

**Cost and FPGA mapping.** $n$ flops, one decrementer, $n$ 2:1 muxes ([[Multiplexers]]), and the flag as a tap. On an FPGA the decrement maps to the hard carry chain at one LUT per bit and the flag is the chain's carry-out pin — a dedicated route out of the top carry element, so the $n$-input NOR is never built in fabric at all ([[Lookup-Tables]], [[FPGAs]]). The reload mux is a function of $(q_i, \texttt{reload}_i, \texttt{sel})$: three inputs of a 6-LUT, which is why it usually folds into the same LUT that drives the chain and the whole operator lands in one $n$-tall slice column, the same footprint as a free-running counter. Whether the fold actually happens depends on how the vendor's carry primitive splits propagate and generate inputs, so read the mapped netlist rather than assuming it. On ASIC an $n$-input static NOR is not a real gate above about four inputs — series PMOS stacking — and would be built as a NOR/NAND tree of depth $\lceil\log_k n\rceil$; tapping $c_n$ is what makes that tree unnecessary.

$$\boxed{\ c_n = \bigvee_{i<n} q_i \;\Longrightarrow\; \texttt{tc} = \overline{c_n} = \operatorname{NOR}(q) = [\,q=0\,],\qquad \text{period} = N \ }$$

**When it breaks**

- **The off-by-one is in the preload, and it is the classic one.** Loading $N-1$ (not $N$) gives a period of $N$, because the terminal cycle is itself counted. Load $N$ and every timer in the system runs one tick slow.
- **A runtime modulus only takes effect at the next `tc`.** Writing the reload register mid-count does not shorten the period in flight; that needs a separate synchronous load port, which is a second mux input and a second select.
- **Degenerate moduli.** $N=1$ means reload $=0$: `tc` asserts every enabled cycle and $q$ is pinned at zero. Correct, but it is a wire, not a counter. $N=0$ is not representable.
- **The count runs downward.** If the consumer wants an address sweeping $0 \ldots N-1$ upward, this delivers the reverse and you either subtract or switch to [[Modulo-N Counter]]. Timers do not care; memory sequencers do.
- **`tc` is combinational off $q$.** Cascading stages ([[Cascaded Counter Chain]]) by feeding one stage's `tc` into the next stage's enable ripples the chain delay across stages, and the enable of stage $k$ is the AND of all lower `tc`s. Past two or three stages that enable tree, not the counters, is the critical path.
- **The sharing is a synthesis assumption.** Writing `q == 0` and trusting the tool to recognise it as the decrementer's carry-out is exactly the kind of sharing that silently does not happen. If it did not, you paid for a log-depth reduction tree and the note's central claim is false in your netlist.

**RTL (Spade)**

```spade
entity zero_detect_down_counter<#uint W>(
    clk: clock,
    rst: bool,
    en: bool,
    reload: uint<W>,
) -> (uint<W>, bool) {
    decl q_next;
    reg(clk) q: uint<W> reset(rst: reload) = q_next;

    let zero = !q.as_bits().reduce_or();
    let tc = en && zero;

    let q_next: uint<W> = if en {
        if zero { reload } else { trunc(q - 1) }
    } else {
        q
    };

    (q, tc)
}
```

`reload` is the diagram's $N-1$ bus, `zero` is the NOR output and `tc` the same signal gated by `en` — a paused timer must not emit a pulse train, and gating the flag rather than the mux keeps one enable term in the design. `!q.as_bits().reduce_or()` is written as the explicit OR-reduction and complement, i.e. as $\overline{c_n}$, not as `q == 0`: same function, but it is the form the derivation produced. `q - 1` widens to `uint<{W+1}>`, so `trunc` performs the $\bmod\,2^n$ wrap explicitly; that branch is unreachable at $q=0$, but the wrap is what makes an upset-induced illegal state walk down instead of sticking. Reset loads `reload` rather than $0$, so the first period after reset is a full $N$. Synthesis will build the decrement and the flag from one carry chain, which the two `if`s in series do not show — the drawn mux is one level, the written nesting is not.

**Related Notes**

- [[Modulo-N Counter]] – compares: the compare-and-clear sibling, whose terminal gate is a function of $N$ and whose count runs upward.
- [[Preload-and-Overflow Counter]] – compares: the other construction with a free flag, taking the incrementer's carry-out instead of the decrementer's borrow-out, at the price of preloading $2^n-N$.
- [[Up-Down Counter]] – extends: the same datapath with a direction bit; this circuit is its down half, and the up half's terminal condition is the carry rather than the borrow.
- [[Incrementer]] – depends-on: the generate/propagate carry recurrence that the borrow-out derivation collapses.
- [[Leading Zero Counters]] – compares: the other all-bits reduction over a word; zero-detect is its degenerate case, where only "no ones anywhere" is wanted and the position is discarded.
- [[Comparators]] – counter-example: the equality comparator this construction exists to delete.
- [[Cascaded Counter Chain]] – extends: staging these for long periods, and where the enable ripple takes over as the critical path.
- [[Choosing a Counter]] – compares: where this sits against every sibling.

## References

- [[2.8) Counters]] — §Modulo-$N$ counters, construction 3 ("count down to zero") and the paragraph establishing it as the default for timers; §Modulo-$N$ counters' warning on unused states, answered here by the potential-function argument.
- No textbook source for this topic. Standard in Mano & Ciletti, *Digital Design* (synchronous counters with parallel load), Wakerly, *Digital Design: Principles and Practices* (modulus control and terminal count), and Weste & Harris, *CMOS VLSI Design* (carry-chain structure and the series-stack limit on wide static gates). Page numbers are deliberately omitted — no copy was consulted for this note.
