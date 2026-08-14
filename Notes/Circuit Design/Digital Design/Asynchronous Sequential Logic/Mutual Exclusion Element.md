---
title: Mutual Exclusion Element
description: "Grants exactly one of two competing requests and holds the grant until release, filtering the metastability that any genuinely unclocked arbitration must contain somewhere."
kind: circuit
status: seed
spade: simulated
tags: [digital, asynchronous-sequential-logic]
aliases:
  - Mutex
  - MUTEX
  - ME Element
  - Arbiter Cell
  - Mutual Exclusion Element
---

# Mutual Exclusion Element

A two-client arbiter built from a cross-coupled NAND latch followed by a threshold filter, which is the only asynchronous primitive that answers genuinely simultaneous requests by holding **both** grants low for as long as the resolution takes instead of guessing a winner.

```tikz title="Mutual exclusion element: cross-coupled NAND latch behind a metastability filter"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \node[nand port] (N1) at (0,3.2) {};
  \node[nand port] (N2) at (0,0) {};

  \draw (-3.6,3.5) node[anchor=east] {$R_1\;[1]$} -- (N1.in 1);
  \draw (-3.6,-0.3) node[anchor=east] {$R_2\;[1]$} -- (N2.in 2);

  \draw (N1.out) -- (1.5,3.2);
  \draw (1.5,3.2) -- (1.5,2.1) -- (-1.5,2.1) -- (-1.5,0.3) -- (N2.in 1);
  \draw (N2.out) -- (2.1,0);
  \draw (2.1,0) -- (2.1,1.2) -- (-2.1,1.2) -- (-2.1,2.9) -- (N1.in 2);

  \node[circ] at (1.5,3.2) {};
  \node[circ] at (2.1,0) {};
  \node[anchor=south] at (1.1,3.3) {$n_1$};
  \node[anchor=north] at (1.3,-0.1) {$n_2$};

  \draw (1.5,3.2) -- (3.6,3.2);
  \draw (2.1,0) -- (3.6,0);

  \draw[thick] (3.6,-0.7) rectangle (6.4,3.9);
  \node at (5.0,2.9) {metastability};
  \node at (5.0,2.4) {filter};
  \node at (5.0,1.2) {\footnotesize $G_i$ held low until};
  \node at (5.0,0.7) {\footnotesize $|n_1-n_2| > V_{\mathrm{th}}$};

  \draw[->] (6.4,3.2) -- (8.3,3.2) node[anchor=west] {$G_1\;[1]$};
  \draw[->] (6.4,0) -- (8.3,0) node[anchor=west] {$G_2\;[1]$};
\end{circuitikz}
\end{document}
```

*Own construction — Seitz's mutual exclusion element, in the arrangement given by Sparsø & Furber and by Weste & Harris.*

**Write the contract before the circuit, because one clause of it is deliberately missing.** Every signal here is 1 bit: two request inputs $R_1, R_2$, two grant outputs $G_1, G_2$, two internal latch nodes $n_1, n_2$. Each client runs a [[Four-Phase Handshake]] against its own pair — assert $R_i$, wait for $G_i$, use the shared resource, drop $R_i$, watch $G_i$ fall. Three obligations follow:

1. **Exclusion (safety).** $G_1 \wedge G_2 = 0$ at every instant, transients included.
2. **Hold.** Once $G_i$ rises it stays up until $R_i$ falls; the arbiter never revokes.
3. **Progress (liveness).** If some $R_i = 1$ and no grant is outstanding, some $G_j$ eventually rises.

What is *not* promised is a bound on "eventually". That omission is the entire subject of the note, and it is forced, not chosen.

**The core is an SR latch operated in the state its own datasheet warns you off.** The two NANDs give

$$n_1 = \overline{R_1 \wedge n_2}, \qquad n_2 = \overline{R_2 \wedge n_1}$$

or, by De Morgan, $n_1 = \overline{R_1} \vee \overline{n_2}$. Hold each input column fixed and solve for the fixed points, exactly as the [[Huffman Feedback Model]] prescribes with $s = 2$ secondary variables:

| $R_1R_2$ | fixed points $(n_1,n_2)$ | reading |
| --- | --- | --- |
| $00$ | $(1,1)$ only | idle, both nodes released |
| $10$ | $(0,1)$ only | client 1 pulls its node down |
| $01$ | $(1,0)$ only | client 2 pulls its node down |
| $11$ | $(0,1)$ **and** $(1,0)$ | bistable — the latch remembers |

The last row is the one that matters. Under contention the excitation collapses to $n_1 = \overline{n_2}$, $n_2 = \overline{n_1}$, which is the [[SR Latch]] hold equation and has *two* solutions. A textbook flow table would call that a defect; here it is the mechanism. The circuit is bistable in column $11$ precisely so that whichever request arrived first has already driven the loop into its half of the bistability, and the second request cannot dislodge it — raise $R_2$ while $(n_1,n_2) = (0,1)$ and $n_2 = \overline{1 \wedge 0} = 1$ is unchanged, so the state is a fixed point of the new column too. Memory of "who was first" *is* the ambiguity of that column, put to work.

**Decode the grants as a difference, not as a level.** The obvious decode $G_1 = \overline{n_1}$ is correct in all four settled columns and is still wrong, because it reads one node in isolation. The element uses

$$G_1 = \overline{n_1} \wedge n_2, \qquad G_2 = \overline{n_2} \wedge n_1$$

so a grant asserts only when the two nodes have *separated*. Multiply them out and the safety clause is not a timing argument at all:

$$G_1 \wedge G_2 = (\overline{n_1} \wedge n_2) \wedge (\overline{n_2} \wedge n_1) = (n_1 \wedge \overline{n_1}) \wedge (n_2 \wedge \overline{n_2}) = 0$$

by complementation, for **every** assignment of $(n_1, n_2)$ — including assignments the latch never settles into.

> [!important] Exclusion is an identity, liveness is a hope
> The safety property falls out of Boolean algebra alone and holds during every transient, at every process corner, for arbitrary gate delays. The progress property does not: it depends on the latch actually leaving its balance point, and no argument bounds when that happens. A mutex is a circuit that has traded a bound on latency — the thing designers normally insist on — for a guarantee of correctness they could not otherwise have at all.

**No bounded-time arbiter exists, so the design goal is containment.** Chaney and Molnar's measurements and Marino's 1981 impossibility result settle this: a device with two stable states, a continuous internal state space and two independent inputs necessarily has input timings that leave it between the states for arbitrarily long. There is no cleverer gate arrangement, no faster process, and no amount of margin that removes the case — the balance point is a real point in the state space and inputs can land on it. What the mutex does instead is confine the excursion. While $n_1 \approx n_2$ the filter cuts off both grant drivers, so the outside world sees $G_1 = G_2 = 0$: the resource is simply not yet awarded. The latch's small-signal loop gain then pulls the nodes apart with a regeneration time constant $\tau$, and the probability that the separation is still under threshold at time $t$ decays as

$$\Pr[\text{unresolved at } t] \ \propto\ e^{-t/\tau}$$

Exponential, never zero. $\tau$ is the regenerative time constant of the cross-coupled pair — the same quantity that sets synchroniser MTBF in the clocked world, see [[Flip-Flops and Latches]]; the difference is only what the circuit does while it waits.

**The filter is analog, and that is not an implementation detail.** In CMOS, each grant driver is an inverter stage whose pull-up path is in series with a device gated by the *opposite* node, so $G_1$ cannot rise until $n_2$ exceeds $n_1$ by roughly a device threshold $V_{\mathrm{th}}$. The filter is therefore a differential threshold detector, deliberately not a bistable — if it had its own positive feedback it would have its own metastable state and the problem would merely be relocated. Two consequences follow that no Boolean model shows. First, the element cannot be built out of logic gates: full-swing gates have no vocabulary for "these two nodes are still too close", and a mutex assembled from two LUTs is not a mutex but a combinational loop that exports metastability to whatever it drives. Second, the filter's threshold costs delay on *every* arbitration, contended or not, because the nodes must cross $V_{\mathrm{th}}$ before anything is granted.

**On FPGA, do not build this — pay for an MTBF instead.** Three separate obstacles, and only the first is about tooling. The cross-coupled pair is a combinational loop, so Vivado needs `ALLOW_COMBINATORIAL_LOOPS` plus a `set_disable_timing` and then reports timing that means nothing. The grant decode's second term is exactly the kind of non-minimal product a logic optimiser deletes, taking the exclusion identity with it, so it would need `DONT_TOUCH`. And the filter has no FPGA equivalent at any effort level. The honest FPGA construction for the same problem is a two-flop synchroniser on each request feeding a synchronous [[Round-Robin Arbiter]] in one clock domain: two cycles of fixed latency and a finite MTBF, in exchange for bounded response and a design the tools can actually verify. The ASIC flow keeps the real element, as a hand-characterised standard cell that is instantiated and never synthesised.

**Scaling past two clients costs fairness.** A mutex arbitrates exactly 2. For $n$ clients the standard construction is a binary tree of $n-1$ elements of depth $\lceil \log_2 n \rceil$, each level adding one resolution stage to the worst-case path. The tree inherits the element's lack of bounded waiting and compounds it: a client that re-requests faster than the handover completes can hold its subtree indefinitely, and no local rule prevents it. Bounded waiting has to be layered on top — a rotating token, as in [[Round-Robin Arbiter]] — which is why real systems use the mutex for the clock-domain problem and something fairer for the scheduling problem.

**Result.**

$$\boxed{\ n_1 = \overline{R_1 n_2},\quad n_2 = \overline{R_2 n_1},\quad G_1 = \overline{n_1}n_2,\ G_2 = \overline{n_2}n_1 \ \Longrightarrow\ G_1G_2 \equiv 0\ }$$

**When it breaks.**

- **A consumer that needs a deadline.** There is none. Any protocol above the mutex that assumes a grant within $k$ gate delays is unsatisfiable in principle, not merely unverified.
- **A request narrower than the resolution time.** $R_i$ must be held until $G_i$ is observed; a pulsed request can be dropped, or can be withdrawn mid-resolution and produce a runt on $G_i$.
- **Uncontended traffic still pays.** The threshold crossing is on the critical path of every grant, so a mutex on a low-contention resource is pure overhead relative to a wire.
- **Fairness.** Not provided, at two clients or at $n$. Continuous $R_1$ with a fast release/re-request loop starves $R_2$.
- **Near-threshold supply.** The filter's margin *is* a device threshold; as $V_{DD}$ approaches $V_{\mathrm{th}}$ the window between "still balanced" and "resolved" narrows and the element needs recharacterisation, not just re-timing.
- **FPGA.** Not buildable, per above. This is the sharpest ASIC/FPGA divergence in asynchronous design — see [[Choosing an Asynchronous Style]].

> [!warning] No numbers quoted — needs outside research
> This note has no assigned book source, so no $\tau$, no MTBF coefficients, no filter delay and no cell area appear. Those are all process-specific measurements; inventing plausible ones would be worse than omitting them. Only the functional forms are stated.

**RTL (Spade).**

The naive transcription fails the same way every feedback circuit does — a `let` cannot mention the name it is binding:

```spade
let n1 = !(r1 && n2);   // error: Use of undeclared name n2
```

`decl` forward-declares both nodes before their defining `let`s, and does not require the definition to be a register, which is enough to close a genuinely combinational loop:

```spade
/// Cross-coupled NAND arbitration core plus the digital abstraction of the
/// metastability filter. n1/n2 are the latch nodes, active low; each grant
/// needs its own node low AND the other node high, so no assignment of
/// (n1, n2) can raise both.
entity mutex(r1: bool, r2: bool) -> (bool, bool) {
    decl n1, n2;
    let n1 = !(r1 && n2);
    let n2 = !(r2 && n1);
    (!n1 && n2, !n2 && n1)
}
```

`r1`/`r2` are the two wires entering from the left, `n1`/`n2` are the two labelled nodes, and the returned tuple is $(G_1, G_2)$ — a tuple packs element 0 into the **high** bit, so the emitted port is `output__[1] = G1`, `output__[0] = G2`, the opposite of the array convention. Everything is 1 bit and nothing is registered: there is no `clock` in the signature because the memory is the loop, and the emitted Verilog is a real combinational cycle (`assign \n1 = ...` reading `\n2` and back). Synthesis will do one thing the drawing does not: it will refuse to time that cycle, and it will try to delete the `&& n2` term from each grant as redundant. The `entity` is the left two-thirds of the diagram only — the filter box is represented by the two-input decode, which is where the abstraction stops.

Simulated against a behavioural reference tracking the current owner: 13 named vectors plus a 3000-step random sweep that flips **one** request at a time, which is the fundamental-mode single-input-change assumption made literal. 3013 checks, 0 failures — covering uncontested grant, contention with the incumbent keeping the resource, handover on release with the rival already waiting, and both orders of arrival. Swapping $G_1$ and $G_2$ fails 2277 of the same 3013, so the vectors are sensitive to the asymmetry rather than passing on symmetry.

> [!warning] The one case that matters is the one that cannot be simulated
> Driving $R_1$ and $R_2$ high in the same delta cycle does not produce a winner and does not produce a failure — it makes `iverilog` oscillate the loop forever without advancing simulation time. Measured: the run had to be killed at a 40-second timeout, having reached time 0. That is the honest digital image of metastability, and it is why the random sweep is restricted to single-input change. `PASS` here certifies the exclusion identity, the hold behaviour and the handover; the arbitration decision itself is outside the reach of any event-driven simulator, because a zero-delay model has no notion of a node between the rails and therefore no notion of the filter that is the element's whole purpose.

**Related Notes (with context):**

- [[SR Latch]] – depends-on: the arbitration core *is* a NAND SR latch, run in the both-inputs-asserted column its own analysis normally excludes.
- [[Flip-Flops and Latches]] – depends-on: supplies the regenerative-latch physics — $e^{-t/\tau}$, MTBF, the balance point — that this element is built to survive rather than to avoid.
- [[Huffman Feedback Model]] – depends-on: the $s=2$ instance whose contended input column has two fixed points instead of one, which is what makes it a memory.
- [[Round-Robin Arbiter]] – compares: bounded latency and bounded waiting, purchased by requiring one clock domain — the synchronous answer to the same question.
- [[Asynchronous FIFO]] – compares: the other standard way two independently clocked domains meet; a FIFO moves data across, a mutex arbitrates a shared resource.
- [[Muller C-Element]] – compares: async design's other feedback primitive, and its dual — the C-element joins concurrent events, the mutex chooses between them.
- [[Four-Phase Handshake]] – supports: each $(R_i, G_i)$ pair is one four-phase cycle, which is what makes "hold until release" expressible at all.
- [[Choosing an Asynchronous Style]] – compares: where this element is mandatory (clock-domain crossing) versus where a synchronous arbiter is the better trade.

## References

No assigned book source; written from standard digital-design canon.

- C. L. Seitz, "System Timing" (in Mead & Conway, *Introduction to VLSI Systems*) — the mutual exclusion element and its metastability filter.
- J. Sparsø & S. Furber, *Principles of Asynchronous Circuit Design* — the MUTEX cell, arbitration in handshake circuits, mutex trees.
- N. Weste & D. Harris, *CMOS VLSI Design* — the CMOS filter arrangement, synchronisers, MTBF and the regeneration time constant.
- T. J. Chaney & C. E. Molnar, "Anomalous behavior of synchronizer and arbiter circuits" — the measurements.
- L. R. Marino, "General theory of metastable operation" (1981) — the impossibility of a bounded-time arbiter.
- M. M. Mano & M. D. Ciletti, *Digital Design* — NAND latch analysis, fixed points of the hold equation.
- *Asynchronous Sequential Logic* (this vault, "Trade-offs") — GALS interfaces as the place mutexes actually appear.
