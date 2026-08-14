---
title: "Safe-State FSM Recovery"
description: "Reset coverage, a default arm that synthesis will delete unless attributed, and a decoded one-hot legality check — the four escalating costs of guaranteeing the machine leaves an unused code."
kind: circuit
source: "0.4) Synchronous Sequential Logic §Unreachable and unused states — no book source"
status: seed
spade: simulated
tags: [digital, fsm, safe-state, one-hot, seu, synchronous-sequential-logic]
aliases:
  - Safe FSM
  - Safe State Machine
  - Safe-State Machine
  - Illegal State Recovery
  - Unused State Recovery
  - fsm_safe_state
---

# Safe-State FSM Recovery

A state register augmented with a legality decode and a forced return to the reset code, so that a machine which lands on one of its unused codes provably leaves it — which the state graph alone does not guarantee, because the unused codes are exactly the rows synthesis was free to fill in arbitrarily.

```tikz title="Safe-state FSM: legality decode on the one-hot state register forcing the recovery mux back to the reset code"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % --- next-state logic ---
  \draw (-0.4,1.4) rectangle (1.6,3.2);
  \node at (0.6,2.3) {$\delta$};
  \draw[->] (-2.4,2.3) -- (-0.4,2.3);
  \node[above] at (-1.4,2.35) {$x$ \ ($k$)};

  % --- forced reset code ---
  \draw (-0.4,0.0) rectangle (1.6,1.0);
  \node at (0.6,0.72) {reset code};
  \node at (0.6,0.28) {$0\cdots01$};

  % --- wires into the mux ---
  \draw[->] (1.6,2.4) -- (3.0,2.4);
  \node[above] at (2.3,2.45) {$d$ \ ($N$)};
  \draw[->] (1.6,0.5) -- (3.0,0.5);
  \node[above] at (2.3,0.55) {($N$)};

  % --- recovery mux ---
  \draw (3.0,0.0) -- (3.0,2.9) -- (3.7,2.4) -- (3.7,0.5) -- cycle;
  \node[anchor=west] at (3.02,2.35) {$1$};
  \node[anchor=west] at (3.02,0.55) {$0$};

  % --- state register ---
  \draw[->] (3.7,1.45) -- (4.8,1.45);
  \draw (4.8,0.75) rectangle (7.2,2.15);
  \node at (6.0,1.68) {state reg};
  \node at (6.0,1.18) {$N$ flops};
  \draw[->] (6.0,-0.25) -- (6.0,0.75);
  \node[below] at (6.0,-0.3) {clk, rst};

  % --- state bus ---
  \draw (7.2,1.45) -- (10.0,1.45);
  \node[above] at (8.2,1.5) {$q$ \ ($N$)};
  \fill (9.0,1.45) circle (1.6pt);

  % --- feedback to delta ---
  \draw[->] (10.0,1.45) -- (10.0,4.3) -- (0.6,4.3) -- (0.6,3.2);
  \node[above] at (5.3,4.3) {state fed back to $\delta$ \ ($N$)};

  % --- legality decode ---
  \draw[->] (9.0,1.45) -- (9.0,-0.7);
  \draw (7.4,-1.9) rectangle (11.4,-0.7);
  \node at (9.4,-1.3) {$q \neq 0 \ \wedge\ q \wedge (q-1) = 0$};

  % --- legal back to the mux select ---
  \draw[->] (7.4,-1.3) -- (3.35,-1.3) -- (3.35,0.24);
  \node[above] at (5.4,-1.25) {\texttt{legal}};
  \node at (5.0,-1.8) {\emph{recovery path}};

\end{circuitikz}
\end{document}
```

**Count the codes that are not states.** A machine with $N$ states held in $s$ flops has $2^s$ codes and only $N$ of them mean anything, so the leftovers number $2^s - N$. Under [[Binary State Encoding]] with $s=\lceil\log_2 N\rceil$ that is $0$ when $N$ is a power of two and at most $N-2$ otherwise — the maximum is hit at $N=2^{s-1}+1$, where a single extra state forces a whole extra flop and $2^{s-1}-1$ codes go spare. Under [[One-Hot State Encoding]], $s=N$ and the leftovers are $2^N - N$: for $N=16$ that is $65\,520$ dead codes against $16$ live ones, so the state register spends essentially all of its code space outside the machine.

**Separate the two failure modes, because synthesis treats them oppositely.** An *unreachable state* is a legal code with no path from the reset state in the [[State Transition Graph]]; it is dead logic and the tool prunes it, which is a size win and never a hazard. An *unused code* is not a state at all, so every row of $\delta$ indexed by it is a **don't-care**, and the tool does not prune it — it *exploits* it, choosing whatever value for $\delta$ on that row minimises literals. The consequence is the whole point of this note: the next-state behaviour on unused codes is not "undefined and probably harmless", it is a concrete function nobody chose and nobody inspected, and nothing forbids it from mapping a set of unused codes onto itself. A machine can therefore enter an unused code and cycle inside a closed orbit that contains no real state, forever, with a perfectly healthy clock.

**Note where the machine can enter such a code from, since the model says it cannot.** Every entry path is outside the transition relation: a single-event upset flipping a stored bit; an asynchronous reset that releases at different times on different flops, so the register is momentarily a mixture of reset and pre-reset values; a state bus crossing a clock domain without a [[Two-Flop Synchronizer]], where each bit resolves metastability independently and the sampled word is an arbitrary mixture of old and new; or a setup violation on part of the register when only some bits happen to make timing. All four give a code the graph has no arc out of.

**Level 1 — reset every state flop, and release the reset synchronously.** This is free and it is the baseline: if reset drives the register to the start code, the machine cannot be stuck *permanently*, only until the next reset. The qualification matters more than it looks, because an asynchronous reset whose de-assertion is not synchronised to the clock is itself entry path number two — the recovery mechanism becomes the fault. So level 1 is really "reset covers every flop **and** its release edge is retimed into the clock domain", which is a [[Two-Flop Synchronizer]] on the reset release, not on the state bus.

**Level 2 — a default arm, plus the attribute without which it does not exist.** In HDL the recovery is one line: a `default` (or `others`) arm on the state `case` that assigns the reset state. In the model that arm is unreachable, which makes its condition a don't-care, which means the logic optimiser is *entitled* to delete it and will. Marking the state register safe (`fsm_safe_state` on the state signal, `SAFE_IMPLEMENTATION`-style directives in other flows) is what removes that entitlement.

> [!important] RTL simulation cannot show you this bug; it is the wrong model.
> In RTL the state is a variable of an enumerated type that never holds an out-of-range value, so the `default` arm never fires and the testbench passes. In the netlist the state is $s$ real flops that can hold any of $2^s$ patterns, and the recovery logic the RTL described is no longer present. The two disagree precisely on the case the code was written for. Only a gate-level simulation with forced state values, or reading the netlist, distinguishes them.

**Level 3 — decode legality explicitly, and pick the cheap decode.** Under one-hot the legal set is "exactly one flop hot", which written directly is at-least-one AND no-two:

$$\text{legal} \;=\; \Big(\bigvee_{S} q_S\Big) \;\wedge\; \neg\!\!\bigvee_{S \neq T}\!\big(q_S \wedge q_T\big)$$

The second term is $\binom{N}{2}$ pairwise products, so $O(N^2)$ gates — at $N=32$ that is $496$ AND2s feeding a $496$-input OR, which is absurd for a check nobody expects to fire. The linear form replaces it with one borrow chain. Subtracting one from a nonzero $q$ clears its lowest set bit and sets every bit below it (the ripple-borrow rule, dual to the carry rule that stops at the first zero), so $q \wedge (q-1)$ is exactly $q$ with its lowest set bit deleted; that result is zero iff $q$ had **at most** one set bit. Adding back the $q \neq 0$ term — necessary, because at $q=0$ the subtraction wraps to all-ones and $0 \wedge 1\cdots1 = 0$ passes — gives exactly-one-hot in $O(N)$ gates:

$$\text{legal} \;=\; (q \neq 0) \;\wedge\; \big(q \wedge (q-1) = 0\big)$$

`legal` is one bit; $q$ and the forced reset code are $N$ bits; the recovery mux is $N$ bits wide. Under binary encoding the same job is a single magnitude comparison $q < N$ against the constant $N$, one $s$-bit comparator, and it is *vacuous* whenever $N=2^s$ — dense binary machines have nothing to detect and only level 4 helps them.

**Charge the cost to the clock period, not to the area.** The legality decode reads $q$ and its output selects the mux in front of the register's D input, so it sits inside the $q \to q$ feedback loop alongside $\delta$:

$$T_c \;\ge\; t_{cq} + \max\big(t_{\delta},\, t_{\text{legal}}\big) + t_{\text{mux}} + t_{su}$$

$\delta$ and the check are parallel, so the decode is free in $f_{\max}$ terms until it exceeds $t_\delta$; the mux delay is not, and it is charged on every cycle of the machine's life for a fault that may never occur. That mux is the honest price of level 3. On FPGA the arithmetic is friendlier than the gate count suggests: $q-1$ maps onto the dedicated carry chain rather than LUTs, the $N$-input OR-reduce is $\lceil N/6 \rceil$ LUT6 in a tree of depth $\lceil\log_6 N\rceil$, and the recovery mux collapses into the LUTs already in front of the flops, since a 2:1 select is one extra input on a $\delta$-bit that rarely uses all six ([[FPGAs]]). Against that, the level-3 check is what *forbids* the tool from folding the $2^N-N$ don't-care rows into those same LUT equations, and on FPGA the state register additionally needs a `KEEP`/`fsm_safe_state` attribute or the absorption happens anyway. On ASIC the trade is the same shape with the comparator built from static gates and no free carry chain, so the $q<N$ binary form is usually the better buy there.

> [!warning] No area or delay figures for the decode itself
> The gate counts above are structural ($O(N)$ against $O(N^2)$, one LUT level per six inputs); the source note gives no measured LUT, cell or nanosecond numbers for a safe-state register, and neither does the vendor documentation in any portable form. Treat the timing inequality as the thing to check in your own report, not as a number to quote.

**Level 4 — buy distance instead of a check.** The legality decode detects a corrupt code but cannot repair it: the machine's progress is lost either way, only the lockup is prevented. Choosing an encoding with minimum Hamming distance $3$ makes any single flip both detectable and correctable, since the corrupted word is at distance $1$ from exactly one codeword — the single-error-correcting Hamming construction. The cost is extra flops — $r$ check bits for $s$ information bits with $2^r \ge s + r + 1$ — and, more expensively, the forfeit of the encoder's freedom to choose codes that simplify $\delta$, which is the entire lever [[Choosing an FSM Encoding]] pulls on. Reserve it for radiation environments and safety-critical parts.

> [!note] One-hot is already a distance-2 code, and level 3 is its error *detector*.
> Any two one-hot codewords differ in exactly two positions, so $d_{\min}=2$: a single flip always leaves the legal set and is therefore always caught by the exactly-one-hot decode, while no single flip can ever be silently mistaken for another state. That is a genuine reliability property one-hot has for free — and a matching genuine weakness, since $d_{\min}=2$ is one short of correction, so the recovery is always "restart", never "repair".

$$\boxed{\ q^{+} \;=\; \begin{cases} \delta(q,x) & \text{legal}(q) \\[2pt] q_{\text{rst}} & \text{otherwise}\end{cases}
\qquad \text{legal}(q) = (q \neq 0) \wedge \big(q \wedge (q-1) = 0\big)\ }$$

**When it breaks**

- **Level 3 detects nothing that stays legal.** Under binary encoding with $d_{\min}=1$, a single flip usually lands on another *valid* state code and the machine silently continues as a different machine — no decode of $q$ alone can see it. [[Gray Code State Encoding]] is the sharpest case: adjacent states differ in exactly one bit *by construction*, so a single flip is guaranteed to produce a legal neighbouring state. An encoding chosen to be safe against sampling during transitions is maximally unsafe against upsets.
- **A double flip defeats one-hot too.** $d_{\min}=2$ means two simultaneous flips can carry $q$ from one legal code to another. A single ion track crossing physically adjacent flops produces exactly that multi-bit upset, which is also what defeats a distance-3 code unless the state bits are placed apart.
- **One cycle of illegal output still escapes.** $\lambda$ is driven by the corrupted $q$ for the entire cycle before the recovery edge. If an output is irreversible — a memory write strobe, a bridge enable — gate it combinationally with `legal` as well; recovering the state register does not un-issue the write.
- **Recovery is not correctness.** Returning to the reset code abandons whatever transaction was in flight. A bus peer mid-handshake is now hung and no amount of state-register hardening reaches it; safe-state logic needs a matching protocol-level timeout to be worth anything.
- **Dense encodings have nothing to check.** At $N=2^s$ there are no unused codes, so levels 2 and 3 are vacuous and only level 4 applies. Small machines ($N \le 4$ binary) are usually in exactly this position.
- **The attribute is the whole of level 2 and it drifts.** Attribute spellings differ per tool and are silently ignored when misspelled, which fails in the safe-looking direction — the code still reads as protected. Confirm the recovery logic in the synthesised netlist, not in the source.

**RTL (Spade)**

```spade
fn onehot_legal<#uint N>(q: uint<N>) -> bool {
    (q != 0) && ((q & (q -. 1)) == 0)
}

entity safe_state<#uint N>(clk: clock, rst: bool, d: uint<N>) -> (uint<N>, bool) {
    decl q_next;
    reg(clk) q: uint<N> reset(rst: 1) = q_next;
    let legal = onehot_legal(q);
    let q_next = if legal { d } else { 1 };
    (q, legal)
}
```

`d` is the $N$-bit wire out of $\delta$ in the diagram, `q_next` is the mux output, and `legal` is the mux select; `decl` is required because the register is written above the mux that feeds it. `q -. 1` is the **truncating** subtract — plain `-` would widen to $N+1$ bits and the borrow out of $q=0$ would be visible instead of wrapping, which is the wrap the $q \neq 0$ guard is written against. Both `reset(rst: 1)` and the forced `1` are the same one-hot start code $0\cdots01$, so the recovery arm and the reset arm agree by construction rather than by review. Synthesis will build `q -. 1` on the carry chain and fold the mux into the LUTs in front of the flops, so the drawn mux is a wire in the netlist — but only if the state register carries a safe-state attribute, which Spade has no syntax for and which must be applied to the emitted Verilog.

Simulated through `.zettel/sim.sh` at $N=8$: $3272$ vectors pass, comprising all $256$ codes injected and checked one cycle later against a `$countones(q)==1` reference, the asymmetric illegal pairs `1000_0001` and `0000_0011`, the all-zero code, a bit-order check on the one-hot code `0000_1000`, and a $3000$-vector random sweep. Deleting the `q != 0` term fails $7$ vectors and replacing `-.` with `+.` fails $82$, so the testbench discriminates both of the plausible ways to get this expression wrong.

**Related Notes**

- [[One-Hot State Encoding]] – depends-on: the encoding whose $2^N-N$ unused codes make this check both necessary and, via exactly-one-hot, cheap.
- [[Binary State Encoding]] – compares: dense codes, where legality is one comparator $q<N$ and disappears entirely at $N=2^s$.
- [[Canonical FSM Structure]] – depends-on: the $\delta$/register/$\lambda$ split that the recovery mux is spliced into.
- [[State Transition Graph]] – supports: unreachable states are exactly the nodes with no path from reset in this graph, and unused codes are not nodes at all.
- [[Two-Flop Synchronizer]] – supports: closes two of the four entry paths — the unsynchronised state bus and the asynchronous reset release.
- [[Choosing an FSM Encoding]] – compares: the don't-care budget and encoder freedom spent here come straight out of that decision.
- [[Gray Code State Encoding]] – counter-example: an encoding whose $d_{\min}=1$ between adjacent states makes a single upset produce a legal state, which no decode of $q$ can detect.

## References

- [[0.4) Synchronous Sequential Logic]] — §Unreachable and unused states (code counts, the four escalating measures, the pairwise one-hot legality expression), §FPGA mapping (don't-care absorption and the `KEEP`/`fsm_safe_state` requirement), §Datapath plus control (the $q \to \delta \to q$ loop the check is charged to).
- No textbook source for this topic. The material is standard in Mano & Ciletti, *Digital Design* (unused states and state assignment), Wakerly, *Digital Design: Principles and Practices* (unused states, minimal-risk vs. minimal-cost assignment), and Weste & Harris, *CMOS VLSI Design* (soft errors and synchronisation failure). Page numbers are deliberately omitted — no copy was consulted for this note.
- The tightened bound $2^s - N \le N-2$ for binary encoding, and the $d_{\min}=2$ observation for one-hot, are derived here; the source note states the looser $N-1$ and does not mention the distance property.
