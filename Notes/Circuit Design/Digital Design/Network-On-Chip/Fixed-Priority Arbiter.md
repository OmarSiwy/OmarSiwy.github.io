---
title: "Fixed-Priority Arbiter"
description: "Grants the lowest set request via g = r AND (-r), reassociated as a prefix-OR so depth falls from n to log2(n) — cheapest possible grant, at the cost of unbounded starvation."
kind: circuit
source: "6.3) Network-On-Chip §Router microarchitecture — no book source"
status: seed
spade: simulated
tags: [digital, network-on-chip, arbiter, prefix, priority]
aliases:
  - Fixed Priority Arbiter
  - Static Priority Arbiter
  - Priority Arbiter
  - Daisy-Chain Arbiter
  - Fixed-Priority Arbiters
---

# Fixed-Priority Arbiter

An $n$-way arbiter whose grant is a pure function of the current request vector — the lowest-numbered requester wins, always, with no state anywhere in the circuit.

```tikz title="8-bit fixed-priority arbiter: prefix-OR smear by doubling, then one INV and one AND2 per lane"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % ---- request bus, bit 7 leftmost, bit 0 (highest priority) rightmost ----
  \node[anchor=west] at (-2.8,7.75) {$r$: 8 request lines, $r_i=1$ = port $i$ wants the resource};
  \draw[->] (-2.8,7.0) -- (0.2,7.0);
  \draw (0.2,7.0) -- (5.7,7.0);
  \foreach \i/\lbl in {0/7, 1/6, 2/5, 3/4, 4/3, 5/2, 6/1, 7/0} {
    \draw (0.35+0.75*\i,7.0) -- (0.35+0.75*\i,6.7);
    \node[anchor=south,inner sep=1pt] at (0.35+0.75*\i,7.03) {\tiny $r_{\lbl}$};
  }

  % ---- prefix-OR doubling stages ----
  \draw (0.2,5.8) rectangle (5.7,6.5);
  \node at (2.95,6.15) {$u_1 = r \vee (r \ll 1)$};
  \draw (0.2,4.6) rectangle (5.7,5.3);
  \node at (2.95,4.95) {$u_2 = u_1 \vee (u_1 \ll 2)$};
  \draw (0.2,3.4) rectangle (5.7,4.1);
  \node at (2.95,3.75) {$u\ \, = u_2 \vee (u_2 \ll 4)$};
  \draw (0.2,2.2) rectangle (5.7,2.9);
  \node at (2.95,2.55) {$h = u \ll 1$};

  \foreach \y in {5.8, 4.6, 3.4} {
    \draw[->] (2.95,\y) -- (2.95,\y-0.5);
    \node[anchor=west,inner sep=1pt] at (3.02,\y-0.25) {\tiny 8};
  }

  \node[anchor=west] at (5.95,6.15) {\tiny 8 OR2, depth 1};
  \node[anchor=west] at (5.95,4.95) {\tiny 8 OR2, depth 2};
  \node[anchor=west] at (5.95,3.75) {\tiny 8 OR2, depth 3 $=\lceil\log_2 8\rceil$};
  \node[anchor=west] at (5.95,2.55) {\tiny rewire, 0 gates};

  % ---- h bus down and across ----
  \draw[->] (2.95,2.2) -- (2.95,1.5) -- (7.0,1.5);
  \node[anchor=south] at (4.6,1.54) {$h$ \ (8 bits, \ $h_i=\bigvee_{j<i} r_j$)};

  % ---- request bus tapped down the left for the AND row ----
  \fill (-1.3,7.0) circle (1.4pt);
  \draw (-1.3,7.0) -- (-1.3,0.35) -- (7.0,0.35);
  \node[anchor=east] at (-1.38,3.7) {\tiny $r$ (8)};

  % ---- one lane of the grant row, drawn as gates ----
  \draw[dashed] (7.0,-0.5) rectangle (11.4,2.15);
  \node[anchor=north west] at (7.0,-0.62) {\tiny one lane $i$ of 8: the grant row is 8 INV $+$ 8 AND2, depth 2};
  \node[not port,scale=0.8] (nv) at (8.2,1.5) {};
  \draw (7.0,1.5) -- (nv.in);
  \node[and port,scale=0.8] (ag) at (10.0,1.05) {};
  \draw (nv.out) -- (9.1,1.5) -- (9.1,1.24) -- (ag.in 1);
  \draw (7.0,0.35) -- (9.1,0.35) -- (9.1,0.86) -- (ag.in 2);
  \node[anchor=south,inner sep=1pt] at (7.5,1.54) {\tiny $h_i$};
  \node[anchor=south,inner sep=1pt] at (7.7,0.39) {\tiny $r_i$};
  \draw[->] (ag.out) -- (11.3,1.05);
  \node[anchor=south] at (10.9,1.09) {$g_i$};

  % ---- result ----
  \node[anchor=west] at (-2.8,-0.9) {$g = r \wedge \overline{h} = r \wedge (\overline r + 1)$ \ : one-hot, 8 bits, \ $g\neq 0 \iff r\neq 0$};
  \node[anchor=west] at (-2.8,-1.5) {\tiny $r=10010100 \ \Rightarrow\ h=11111000 \ \Rightarrow\ g=00000100$: port 2 wins, ports 4 and 7 wait};

\end{circuitikz}
\end{document}
```

**Write the specification down before choosing a circuit for it.** The request vector $r$ is $n$ bits, one per contender; the grant vector $g$ is $n$ bits and must be **one-hot or zero**, because two simultaneous grants to one crossbar output would drive two flits onto the same wire. The fixed order says contender $0$ outranks $1$ outranks $2$, so contender $i$ wins exactly when it asks and nobody below it does:

$$g_i \;=\; r_i \wedge \overline{h_i}, \qquad h_i \;=\; \bigvee_{j<i} r_j \quad (h_0 = 0)$$

Both safety and progress fall straight out. If $g_i = g_k = 1$ with $i<k$ then $r_i=1$ forces $h_k=1$ forces $g_k=0$, a contradiction — at most one grant, with no arbitration logic to trust. And $g = 0$ only when $r = 0$, since the lowest set index $k$ has $h_k=0$ by definition, so the arbiter never idles a free resource. The companion "somebody asked" flag is $\mathrm{any} = \bigvee_i r_i = h_{n-1} \vee r_{n-1}$, one bit, free from the same tree.

**That definition is an increment in disguise, which is where the cheapness comes from.** Let $k$ be the lowest set index, so $r = a\,1\,0^{k}$ for some prefix $a$. Complementing gives $\overline{r} = \overline{a}\,0\,1^{k}$; adding one propagates a carry through the $k$ trailing ones and stops at the first zero, giving $\overline{r}+1 = \overline{a}\,1\,0^{k}$. The two words agree in exactly one position — bit $k$ — because the prefixes $a$ and $\overline a$ are complementary. Hence

$$g \;=\; r \wedge (\overline{r}+1) \;=\; r \wedge (-r)$$

by the two's-complement identity $-x = \overline{x}+1$ of [[Number Formats]]. This is the whole arbiter in two operators, and it says the $h$ chain *is* a carry chain: $h_{i+1} = h_i \vee r_i$ is the carry recurrence $c_{i+1} = g_i \vee (p_i \wedge c_i)$ of [[Parallel Prefix Adders]] with $g_i = r_i$ and $p_i = 1$ — an increment is an addition whose propagate is always true. Implemented literally it is the classic daisy chain: $n-1$ OR2 in series, depth $\Theta(n)$, which is why a wide daisy-chained arbiter is slow for exactly the reason a ripple-carry adder is slow ([[Adders]]).

**Reassociate the OR chain and the depth collapses.** $h$ is a prefix computation over $(\{0,1\}, \vee)$, and $\vee$ is associative, so the linear bracketing may be regrouped into a tree. Doubling — Kogge-Stone — computes the *inclusive* smear $u_i = \bigvee_{j\le i} r_j$ in $\lceil\log_2 n\rceil$ steps,

$$u^{(0)} = r, \qquad u^{(t+1)} = u^{(t)} \vee (u^{(t)} \ll 2^{t}), \qquad h = u \ll 1$$

each step doubling the span of bits already folded into each lane, and the final left shift by one turning "at or below $i$" into "strictly below $i$" — a rewiring, not logic. Step $t$ needs $n-2^{t}$ OR2 gates, so the tree costs $\sum_{t<\log_2 n}(n-2^t) = n\log_2 n - (n-1)$ gates against the chain's $n-1$: for $n=8$, $17$ OR2 of depth $3$ versus $7$ OR2 of depth $7$. Total arbiter depth is $\lceil\log_2 n\rceil + 2$ counting the inverter and the AND.

> [!note] This prefix tree is cheaper per node than an adder's, and that is not an accident.
> A carry prefix carries a *pair* $(G,P)$ and its node is $(G \vee P G', PP')$ — two ANDs and an OR — plus a propagate row before and an XOR row after. Here the propagate is identically $1$, so $P$ vanishes and the node degenerates to a single OR2 with no pre- or post-row. Idempotence ($x \vee x = x$) is shared by both operators and is what lets overlapping ranges be recombined without double-counting, so every tree topology in [[Kogge-Stone Tree]] transplants unchanged; you simply pay one gate per node instead of three.

**One-hot is the wrong format for a mux, so an encoder usually follows.** The crossbar of [[Crossbar Switch]] selects with a binary index of $\lceil\log_2 n\rceil$ bits, recovered from the one-hot grant by OR-ing the lanes whose index has a given bit set, $\mathrm{sel}_b = \bigvee_{i:\,i_b=1} g_i$ — one OR of fan-in $n/2$ per output bit, depth $\lceil\log_2 n\rceil$ more, and the composition of smear-plus-encode is precisely a [[Priority Encoder]]. Keep the one-hot form too: it is what gates the per-input buffer read and the credit decrement, which want a per-lane enable rather than a number.

**On FPGA the asymptotics stop mattering almost immediately.** A 6-LUT computes any function of six inputs in one level, and $g_i$ depends on $r_0 \dots r_i$, i.e. $i+1$ signals — so for $n \le 6$ every grant lane is **one LUT, depth one**, and the prefix tree is not merely unnecessary but harmful, since it forces intermediate $u^{(t)}$ signals that the LUT would have absorbed. The router of [[Virtual-Channel Router]] with $p=5$, $V=4$ needs $5$ arbiters of $4{:}1$ and $5$ of $5{:}1$ — every one of them inside that limit. Above six inputs the ripple form is still not the loser it looks like, because $\overline{r}+1$ maps onto the dedicated carry chain ([[FPGAs]]), whose per-bit delay is roughly an order below a LUT hop; the crossover where an explicit prefix tree wins sits in the tens of bits, and the same reversal is the whole story of hardened adder carry chains. On ASIC there is no such subsidy: standard-cell fan-in is 2–4, and the tree earns its area above roughly eight requesters.

**It is fast because it is unfair, and the unfairness is unbounded.** Nothing in $g = r \wedge (-r)$ mentions history, so a contender that requests every cycle at index $0$ starves every higher index *forever* — not with a large bound, with no bound. That is tolerable in exactly three situations: when the request pattern is known to be sparse; when the index genuinely encodes a service class, in which case starvation of the low class is the specification and [[Priority Aging Arbiter]] is how you buy it back with a bound; or when this circuit is a component inside a fair one. The last is the common case — [[Round-Robin Arbiter]] is two of these plus a mask and a pointer register, and the switch allocator of [[Separable Input-First Allocator]] runs $p$ of them per stage, on the critical path of every cycle, which is where the router's clock period is actually decided.

$$\boxed{\ g \;=\; r \wedge (\overline{r}+1) \;=\; r \wedge \overline{(u \ll 1)},\quad u^{(t+1)} = u^{(t)} \vee (u^{(t)} \ll 2^{t}),\quad d = \lceil\log_2 n\rceil + 2\ }$$

**When it breaks**

- **Starvation has no bound at all.** Not "unlikely", not "eventually": a persistent low-index requester holds the resource indefinitely. Any workload where all contenders must make progress needs [[Round-Robin Arbiter]] or [[Priority Aging Arbiter]] instead — this circuit only belongs there as their inner primitive.
- **Below about eight requesters the tree is dead weight**, and on a 6-LUT fabric below seven it is actively worse than letting one LUT swallow the whole lane. The chain and the tree differ by four gate delays at $n=8$ and by nothing a synthesis tool cares about at $n=4$.
- **The grant is combinational and hazard-prone.** $g$ is a two-level function of a $\lceil\log_2 n\rceil$-deep tree, so unequal arrival times inside the tree can pulse two lanes high transiently. If $g$ drives crossbar selects directly, that transient is two sources on one wire. Register the grant, or hold $r$ stable for the whole cycle and sample only at the edge.
- **One arbiter is not an allocator.** $n$ independent fixed-priority arbiters, one per crossbar output, can grant the same *input* to two different outputs; resolving that is a bipartite matching, which is why [[Separable Input-First Allocator]] arbitrates twice and [[Wavefront Allocator]] abandons the separable structure entirely for a better match rate.
- **`any` and the encoded index are not free of the zero case.** With $r=0$ the encoder emits index $0$, indistinguishable from a real grant to contender $0$; downstream logic must qualify the index with $\mathrm{any}$, and forgetting that is the standard priority-encoder bug.

> [!warning] No sourced gate, delay or area numbers
> This topic has no book source. Every count above — $n\log_2 n-(n-1)$ OR2, depth $\lceil\log_2 n\rceil+2$, one LUT per lane for $n\le 6$ — is derived structurally from the recurrences and holds for any technology. Absolute delays, the exact chain-versus-tree crossover width, and LUT/slice totals depend on the fabric and must come from synthesis.

**RTL (Spade)**

```spade
/// Carry-chain form: grant the lowest set request as an increment.
fn fpa<#uint N>(r: uint<N>) -> uint<N> {
    r & (~r +. 1)
}

/// Same function, reassociated into a depth-3 prefix-OR for N = 8.
fn fpa8_prefix(r: uint<8>) -> uint<8> {
    let u1 = r  | (r  << 1);
    let u2 = u1 | (u1 << 2);
    let u  = u2 | (u2 << 4);
    r & ~(u << 1)
}
```

`r` and the returned `g` are both `uint<N>`; nothing is registered, so both bodies are the combinational cone between the request bus and the grant bus of the diagram. `+.` is the **truncating** add — the arbiter wants $\overline r + 1$ modulo $2^N$, not the $N{+}1$-bit sum, and the wrapped carry-out is exactly what makes $r=0$ return $g=0$ rather than a spurious grant. In `fpa8_prefix` the three `|` lines are the three drawn stage boxes and `u << 1` is the rewire box; `<<` keeps $N$ bits by definition in Spade, so the bits shifted past the top vanish, which is correct — they are the smear of requests that no higher lane exists to see. The two functions are the same Boolean function, and synthesis will not respect either structure: given `fpa`, a standard-cell tool infers an incrementer and flattens it, so the tree in the drawing is a *floor plan* argument, not something you get by writing it.

Simulated with `.zettel/sim.sh` at $N=8$: both forms checked against an independent behavioural lowest-set-bit reference over all $256$ request vectors plus $3000$ random ones, including the asymmetric cases $10000001$ and $10000010$ that a reversed bit order would fail — $3265$ vectors, zero mismatches, and the two forms agree everywhere.

**Related Notes**

- [[Priority Encoder]] – extends: appends the one-hot-to-binary OR row, giving the crossbar the select index this circuit does not produce.
- [[Parallel Prefix Adders]] – supports: the associativity argument reused here verbatim, on the carry operator instead of on $\vee$.
- [[Kogge-Stone Tree]] – supports: the doubling topology drawn above, at one OR2 per node instead of a $(G,P)$ cell.
- [[Round-Robin Arbiter]] – extends: two of these plus a mask and a pointer turn zero fairness into round-robin fairness.
- [[Priority Aging Arbiter]] – extends: bounds the starvation this circuit leaves unbounded, at a counter per waiting request.
- [[Separable Input-First Allocator]] – supports: instantiates $p$ of these per stage; their depth is what sets the router's clock period.
- [[Wavefront Allocator]] – counter-example: better matching comes from abandoning independent per-output arbiters altogether.
- [[Crossbar Switch]] – supports: consumes the encoded grant as its select, and is what makes the one-hot guarantee a correctness requirement rather than a convenience.
- [[Choosing a Router Architecture]] – compares: where fixed priority sits against every other arbitration policy in the router.

## References

- [[6.3) Network-On-Chip]] — §Router microarchitecture (the arbiter as a priority-encoder problem, $g = r \wedge (-r)$ as an increment and hence a prefix reassociation from depth $n$ to $\lceil\log_2 n\rceil$; the separable input-first allocator's $p$ arbiters of $V{:}1$ and $p$ of $p{:}1$; the $p=5$, $V=4$ router costs; arbiter depth setting the router's clock period).
- No textbook source for this topic. The material is standard in Mano & Ciletti, *Digital Design* (priority encoders and daisy-chain arbitration), Wakerly, *Digital Design: Principles and Practices* (arbiter fairness and starvation), and Weste & Harris, *CMOS VLSI Design* (prefix structures and their depth/area trade). Page numbers are deliberately omitted — no copy was consulted for this note.
