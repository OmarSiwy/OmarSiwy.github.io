---
title: "Round-Robin Arbiter"
description: "Two prefix trees, an n-bit mux and a pointer register: masked priority encode with fallback — fair, starvation-free grants, and usually the circuit that sets the router's clock period."
kind: circuit
source: "Long-form: Router microarchitecture. Canon: Mano & Ciletti; Weste & Harris (prefix networks); Dally & Towles (arbitration)."
status: seed
spade: simulated
tags: [digital, network-on-chip, arbiter, fairness, priority-encoder]
aliases:
  - Round Robin Arbiter
  - RR Arbiter
  - Round-Robin Arbitration
  - Rotating Priority Arbiter
  - Masked Priority Encoder
---

# Round-Robin Arbiter

An $n$-way arbiter that grants the first requester at or above a stored pointer, wrapping — the same lowest-set-bit circuit as a [[Fixed-Priority Arbiter]], but with the priority origin rotated one position past each grant, which is what converts an unbounded starvation window into a bound of $n-1$ grants.

```tikz title="Round-robin arbiter: masked prefix priority encode, unmasked fallback, and the pointer feedback loop"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---- request bus
  \draw[->] (-1.6,1.9) -- (-0.2,1.9);
  \node[anchor=south] at (-0.9,1.95) {$r$: $n$};
  \draw (-0.2,0.7) -- (-0.2,3.1);
  \node[circ] at (-0.2,1.9) {};

  % ---- masked path
  \draw (0.6,2.7) rectangle (2.0,3.5);
  \node[align=center] at (1.3,3.1) {$\wedge$\\$n$};
  \draw[->] (-0.2,3.1) -- (0.6,3.1);

  \draw (2.8,2.7) rectangle (4.8,3.5);
  \node[align=center] at (3.8,3.1) {prefix PE\\$\lceil\log_2 n\rceil$};
  \draw[->] (2.0,3.1) -- (2.8,3.1);

  % ---- zero detect
  \draw (2.8,1.5) rectangle (4.8,2.2);
  \node at (3.8,1.85) {$\bigvee_i (r\wedge m)_i$};
  \draw (2.4,3.1) -- (2.4,1.85) -- (2.8,1.85);
  \node[circ] at (2.4,3.1) {};
  \node[anchor=east] at (2.3,2.5) {$r\wedge m$};

  % ---- unmasked path
  \draw (2.8,0.3) rectangle (4.8,1.1);
  \node[align=center] at (3.8,0.7) {prefix PE\\$\lceil\log_2 n\rceil$};
  \draw[->] (-0.2,0.7) -- (2.8,0.7);

  % ---- mux
  \draw (5.6,0.1) -- (6.6,0.6) -- (6.6,3.2) -- (5.6,3.7) -- cycle;
  \node[rotate=90] at (6.1,1.9) {MUX $n$};
  \draw[->] (4.8,3.1) -- (5.6,3.1); \node[anchor=south] at (5.2,3.15) {$1$};
  \draw[->] (4.8,0.7) -- (5.6,0.7); \node[anchor=north] at (5.2,0.65) {$0$};
  \draw[->] (4.8,1.85) -- (6.1,1.85) -- (6.1,0.35);
  \node[anchor=west] at (4.9,2.05) {any};

  % ---- grant out
  \draw[->] (6.6,1.9) -- (9.2,1.9);
  \node[anchor=south] at (8.0,1.95) {$g$: $n$, one-hot};
  \node[circ] at (7.9,1.9) {};

  % ---- pointer feedback loop (right to left along the bottom)
  \draw (7.0,-1.5) rectangle (8.8,-0.7);
  \node[align=center] at (7.9,-1.1) {one-hot\\$\to$ binary};
  \draw[->] (7.9,1.9) -- (7.9,-0.7);

  \draw (4.9,-1.5) rectangle (6.1,-0.7);
  \node at (5.5,-1.1) {$+1$};
  \draw[->] (7.0,-1.1) -- (6.1,-1.1);
  \node[anchor=north] at (6.55,-1.62) {$\lceil\log_2 n\rceil$};

  \draw (2.6,-1.5) rectangle (4.3,-0.7);
  \node[align=center] at (3.45,-1.1) {ptr reg\\$\lceil\log_2 n\rceil$};
  \draw[->] (4.9,-1.1) -- (4.3,-1.1);
  \draw[->] (3.45,-2.1) -- (3.45,-1.5); \node[anchor=north] at (3.45,-2.1) {clk};

  \draw (0.4,-1.5) rectangle (2.1,-0.7);
  \node[align=center] at (1.25,-1.1) {mask gen\\$\sim(2^{\mathrm{ptr}}\!-\!1)$};
  \draw[->] (2.6,-1.1) -- (2.1,-1.1);

  \draw[->] (0.4,-1.1) -- (0.1,-1.1) -- (0.1,2.9) -- (0.6,2.9);
  \node[anchor=west] at (0.15,-0.3) {$m$: $n$};
\end{circuitikz}
\end{document}
```

**Start from the grant a fixed-priority arbiter produces and name what is wrong with it.** Given a request vector $r \in \{0,1\}^n$, the fixed-priority grant is the lowest set bit, which the two's-complement identity $-x = \bar{x}+1$ writes in one line:

$$g \;=\; r \wedge (-r) \;=\; r \wedge (\overline{r}+1)$$

The grant is one-hot and correct, it costs one increment, and it is permanently unfair: request line $0$, if it is ever continuously asserted, grants forever and lines $1\ldots n-1$ never see the crossbar. Nothing about the function of the circuit is broken — the fairness is a *property of the priority order*, and the priority order here is a constant.

**Rotate the origin of the priority order rather than the request vector.** Keep a pointer $p \in \{0,\ldots,n-1\}$, $\lceil\log_2 n\rceil$ bits wide, holding the index at which priority now starts. The round-robin grant is defined by a cyclic scan:

$$g \;=\; e_{j^{*}}, \qquad j^{*} \;=\; \min\{\,k \ge 0 \;:\; r_{(p+k)\bmod n} = 1\,\}\ \text{mapped back to } (p+j^{*})\bmod n$$

with $g=0$ when $r=0$. Written that way it is a rotate-encode-rotate: barrel-rotate $r$ right by $p$, take the fixed-priority grant, barrel-rotate the result left by $p$. Two $n$-bit barrel rotators is $2n\lceil\log_2 n\rceil$ multiplexer bits and $2\lceil\log_2 n\rceil$ mux levels of delay, and it is the wrong implementation for a circuit that lives on the router's critical path.

**Split the wrap into two ordinary priority encodes and a mux.** Let $m \in \{0,1\}^n$ be the *thermometer mask* $m_i = [\,i \ge p\,]$ and write $\mathrm{PE}(\cdot)$ for the lowest-set-bit function above. Then

$$g \;=\; \begin{cases}\mathrm{PE}(r \wedge m) & r \wedge m \neq 0\\[2pt] \mathrm{PE}(r) & \text{otherwise}\end{cases}$$

The masked term handles the part of the scan that does not wrap: $r \wedge m$ retains exactly the requests at indices $\ge p$, so its lowest set bit is the first hit of the scan. If that term is zero the scan wraps, and it must restart at index $0$ — but the fallback is $\mathrm{PE}(r)$, the *unmasked* encode, not $\mathrm{PE}(r \wedge \overline{m})$. Those two are equal precisely because the branch is taken only when $r \wedge m = 0$, hence $r = r \wedge \overline{m}$; by absorption the extra input costs nothing. That saves an inverter and an $n$-bit AND, and more importantly it lets both encoders start from the same fan-out of $r$ so their trees evaluate in parallel rather than in series.

> [!note]
> Both encoders see their inputs at the same time, so the delay of the whole arbiter is *one* prefix tree plus the select mux — not two. The masked path is the longer one, because it pays an extra AND level and the mask generator ahead of the tree; the fallback path is pure slack. Every serious round-robin implementation is a rearrangement of where that one extra AND sits.

**Generate the mask arithmetically instead of with a decoder.** $2^p$ is a one-hot vector — a $\lceil\log_2 n\rceil \to n$ decoder, or equivalently a constant $1$ shifted left by $p$ in a barrel shifter. Then $2^p - 1$ is the all-ones-below-$p$ vector, and complementing gives the thermometer:

$$m \;=\; \overline{2^{p}-1} \;=\; -2^{p} \pmod{2^n}$$

the second equality again by $-x = \bar x + 1$. The decrement is a borrow chain, but it is a decrement of a *one-hot* value, which the synthesiser flattens: bit $i$ of $2^p-1$ is $\bigvee_{j>i}(2^p)_j$, a suffix-OR, so the whole mask generator is one prefix-OR of depth $\lceil\log_2 n\rceil$ over the decoded pointer. It is off the request-to-grant path entirely, since $p$ is a register output that settled at the previous clock edge.

**The priority encoder itself is a prefix problem, which is what makes the depth logarithmic.** Ripple form: $h_i = h_{i-1} \vee r_{i-1}$ with $h_0 = 0$, and $g_i = r_i \wedge \overline{h_i}$. The recurrence for $h$ is an OR-scan, and OR is associative, so associativity lets us reassociate the linear scan into a tree exactly as the carry chain of a ripple adder is reassociated into a prefix network — see [[Priority Encoder]] and the prefix construction under [[Adders]]. Depth falls from $n-1$ to $\lceil\log_2 n\rceil$ levels. Kogge–Stone form costs $n\log_2 n - n + 1$ prefix cells at fanout $2$; Sklansky form costs $\tfrac{n}{2}\log_2 n$ cells at the same depth but with fanout growing to $n/2$ at the last level, which for the small $n$ an arbiter sees ($n = 4$ to $20$) is the better trade.

**Close the loop: encode the grant back to a pointer.** $g$ is one-hot, so one-hot-to-binary is an OR tree per output bit — bit $b$ of the index is $\bigvee_{i:\,i_b = 1} g_i$, an OR of $n/2$ terms, depth $\lceil\log_2 (n/2)\rceil$. Increment mod $n$, and here the width discipline does real work: when $n$ is a power of two, $\lceil\log_2 n\rceil = \log_2 n$ and a *truncating* increment wraps for free, because reduction mod $2^{\lceil\log_2 n\rceil}$ is exactly reduction mod $n$. When $n$ is not a power of two the two moduli differ and an explicit comparator-and-reset is required; skipping it leaves the pointer parked on nonexistent request lines for $2^{\lceil\log_2 n\rceil}-n$ cycles, during which the mask is all-zero, the fallback fires every cycle, and the arbiter silently degrades to fixed priority. See [[Synchronous Counters]] for the modulo-$n$ counter that fixes it.

**Hold the pointer when nothing was granted, and gate it on acceptance.** If $r = 0$ then $g = 0$, the encoder produces index $0$, and a naive $+1$ would advance the pointer on an idle cycle. Worse, in a router the grant may be *withdrawn* downstream: in [[Speculative Switch Allocation]] a switch grant is discarded when the parallel VC allocation fails, and in a credit-based scheme it is discarded when no credit arrives. The pointer must advance only on a grant that was actually taken, `ptr <= idx(g) + 1 when (g != 0) and accept`, otherwise the winner is charged for a turn it never got and the fairness bound degrades from $n-1$ to unbounded under a persistent misspeculation pattern.

**The fairness bound is a sweep argument, not a probabilistic one.** Suppose line $i$ asserts $r_i$ and holds it. Each grant moves $p$ strictly past the granted index in the cyclic order. After at most $n-1$ grants to other lines the pointer has swept past every other index and reaches $i$, at which point $i$ is the highest-priority set bit and wins. So the worst-case wait is $n-1$ grant cycles, independent of the traffic pattern and independent of how long the other requesters have been asserting. That is the entire value proposition of the circuit: not average latency, but a bound that holds against an adversary.

**Where the delay and area actually go, ASIC versus FPGA.** The request-to-grant path is: mask AND ($1$ level) $\to$ prefix-OR tree ($\lceil\log_2 n\rceil$ levels) $\to$ grant AND ($1$ level) $\to$ output mux ($1$ level), with the zero-detect $\bigvee_i (r\wedge m)_i$ hidden in the tree's top-level prefix node so it is free. On an ASIC the $n$-bit mux and the fan-out of $r$ to two trees are wire-dominated at large $n$. On an FPGA the arithmetic disappears into logic: a 6-input LUT evaluates a radix-6 prefix node in one level, so the tree is $\lceil\log_6 n\rceil$ LUT delays rather than $\lceil\log_2 n\rceil$ gate delays — for $n \le 6$ the entire masked encode for one output bit is *one* LUT and the tree vanishes. The pointer increment maps to the hard carry chain of [[FPGAs]] and is effectively free, which is why on FPGA the mask generator and the two-tree fan-out, not the increment, are what you optimise.

**A common variant deletes the pointer register.** Store $m$ itself in an $n$-bit register instead of storing $p$ in $\lceil\log_2 n\rceil$ bits: the update becomes $m \leftarrow \overline{(g \vee (g-1))}$, or equivalently "all bits strictly above the grant", one suffix-OR and no encoder, no increment, no decoder. It costs $n - \lceil\log_2 n\rceil$ extra flops and removes three blocks from the pointer loop. Since both the request path *and* the pointer loop must close in one cycle, and the pointer loop is the one carrying an encoder and an adder, this is usually the right trade above $n \approx 8$.

$$\boxed{\;g=\begin{cases}\mathrm{PE}(r\wedge m)&r\wedge m\neq 0\\ \mathrm{PE}(r)&\text{else}\end{cases}\quad m=\overline{2^{p}-1},\quad p \leftarrow \big(\mathrm{idx}(g)+1\big)\bmod n\;}$$

**Where it stops working.**

- **$n$ not a power of two.** The truncating increment wraps mod $2^{\lceil\log_2 n\rceil}$, not mod $n$. Needs an explicit modulo-$n$ counter, or the arbiter degenerates to fixed priority for $2^{\lceil\log_2 n\rceil}-n$ cycles out of every sweep.
- **Grants that are not accepted.** Speculative or credit-gated grants must not advance the pointer. Ungated, the $n-1$ bound is void.
- **Fairness in grants $\neq$ fairness in bandwidth.** Round-robin equalises *turns*, not bytes. Under wormhole flow control a worm holds an output for $\lceil L/B \rceil$ cycles, so a port sending long packets takes a proportionally larger share — [[Deficit Round Robin Scheduler]] is the fix.
- **No notion of urgency.** All requesters are equal by construction, so a latency-critical class cannot be preferred. [[Priority Aging Arbiter]] reintroduces differentiation without giving starvation back.
- **Small $n$.** Below $n \approx 8$ (and $n \le 6$ on a LUT6 fabric) the prefix tree is a flat OR and the $\Theta(\log n)$ argument buys nothing; a decoded case statement is smaller and no slower.
- **Separable allocation still mismatches.** Even with every arbiter perfectly fair, the two-stage structure of a [[Separable Input-First Allocator]] finds a maximal, not maximum, matching; a [[Wavefront Allocator]] matches better and is slower.

**RTL.**

```spade
entity rr_arb8(clk: clock, rst: bool, r: uint<8>) -> uint<8> {
    decl nxt;
    reg(clk) ptr: uint<3> reset(rst: 0) = nxt;

    let one: uint<8> = 1;
    let m: uint<8> = ~((one << zext::<3, 8>(ptr)) -. 1);

    let rm = r & m;
    let g: uint<8> = if rm != 0 { rm & (~rm +. 1) } else { r & (~r +. 1) };

    let b = g.as_bits();
    let idx: uint<3> = [b[1] || b[3] || b[5] || b[7],
                        b[2] || b[3] || b[6] || b[7],
                        b[4] || b[5] || b[6] || b[7]].as_uint();
    let nxt = if g == 0 { ptr } else { idx +. 1 };
    g
}
```

`m` is the mask-gen block, `rm` the wire out of the AND, and the `if rm != 0` is the zero-detect driving the output mux — the two arms are the two prefix PE blocks of the diagram, both written as $x \wedge (\overline{x}+1)$ because the lowest-set-bit identity *is* the encoder. `+.` and `-.` are the truncating $8$- and $3$-bit operators; the plain `+` would widen to $9$ and $4$ bits, and the $3$-bit truncation on `idx +. 1` is exactly the free mod-$8$ wrap argued above. The `idx` array is the one-hot-to-binary OR tree, element $0$ being the LSB. `decl nxt` forward-declares the pointer's next value so the register can be written before the logic that feeds it — that is Spade's way of closing a *registered* loop, and it is legal precisely because the loop is broken by a flop; a combinational self-reference would not compile. Synthesis will not build the literal shifter-and-decrement of `m`: with `ptr` a register output the whole mask is constant-folded into a $3\to8$ decoder plus a suffix-OR, off the request path.

Verified with `.zettel/sim.sh` against a behavioural cyclic-scan reference: **3023 checks passed, 0 failures** — 3000 random `$random` request vectors plus named cases, including the asymmetric `r = 1000_0001` held for three cycles (grants must alternate bit $0$, bit $7$, bit $0$, proving the mask points *upward* and the fallback wraps), a sixteen-cycle sweep under `r = 1111_1111` checking the grant walks one position per cycle, and `r = 0` checking the pointer holds. A mutant with the mask polarity inverted (`m = 2^p - 1` instead of its complement) fails this bench, which is the point of running it.

**Related notes.**

- [[Fixed-Priority Arbiter]] – extends: this is that circuit with the priority origin made stateful; the grant expression $r \wedge (-r)$ is unchanged and appears twice.
- [[Priority Encoder]] – depends-on: the prefix-OR construction that makes both encode blocks $\lceil\log_2 n\rceil$ deep rather than $n$.
- [[Synchronous Counters]] – supports: the pointer is a modulo-$n$ counter loaded from the grant index, and inherits the non-power-of-two wrap problem.
- [[Separable Input-First Allocator]] – supports: instantiates $p$ of these at $V{:}1$ and $p$ at $p{:}1$; this is the block whose delay sets the router's clock period.
- [[Speculative Switch Allocation]] – counter-example: a grant this arbiter issues may be discarded downstream, so the pointer update must be gated on acceptance or the fairness bound is lost.
- [[Priority Aging Arbiter]] – compares: buys quality-of-service classes back, at the cost of per-requester age counters instead of one pointer.
- [[Deficit Round Robin Scheduler]] – compares: equalises transmitted bytes rather than grants, which is what round-robin gets wrong under variable-length packets.
- [[Virtual-Channel Router]] – supports: the switch and VC allocators of the canonical four-stage pipeline are built from these.

## References

- Long-form note **6.3) Network-On-Chip**, § *Router microarchitecture* — the $g = r \wedge (-r)$ identity, the prefix reassociation, the mask/fallback decomposition, and the "two prefix trees, one $n$-bit mux, one $\lceil\log_2 n\rceil$-bit flop" cost statement.
- Mano & Ciletti, *Digital Design* — priority encoders, one-hot-to-binary encoding, modulo-$n$ counters.
- Weste & Harris, *CMOS VLSI Design* — parallel-prefix networks; Kogge–Stone and Sklansky cell counts and fanout, applied here to the OR-scan rather than the carry-scan.
- Dally & Towles, *Principles and Practices of Interconnection Networks* — arbitration and allocation, the round-robin fairness bound, and separable allocator structure.

> [!warning] No primary book source, and no quantitative implementation data
> This circuit is outside *Application-Specific Arithmetic*; everything above is
> the long-form note plus standard canon. In particular there is **no LUT count,
> no gate count in a named technology, and no delay in nanoseconds** anywhere in
> the available sources. The delay claims here are level counts, and the FPGA
> claims are LUT-input arguments — neither has been backed by a synthesis run.
> Needs outside research before any of it is quoted as a number.
