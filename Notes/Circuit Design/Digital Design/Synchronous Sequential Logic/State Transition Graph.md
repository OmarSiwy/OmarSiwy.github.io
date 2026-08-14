---
title: State Transition Graph
description: "The machine as a labelled digraph and its state table; once encoded the table is literally a truth table, and the completeness and determinism checks are what stop synthesis inferring a latch."
kind: circuit
status: seed
spade: simulated
tags: [digital, synchronous-sequential-logic]
aliases:
  - State Table
---

# State Transition Graph

The encoding-independent form of a finite state machine: a labelled digraph whose nodes are states and whose edges are transitions, equivalent to a state table that becomes a literal truth table the moment an encoding is chosen.

```tikz title="State transition graph of the Mealy 1011 detector, with the outgoing-edge partition made explicit"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  \foreach \x/\n in {0/A, 3/B, 6/C, 9/D}
    \draw (\x,0) circle (0.55) node {$\n$};

  % reset entry
  \draw[->] (-1.9,0) -- (-0.55,0);
  \node[font=\scriptsize] at (-1.35,0.28) {rst};

  % forward edges
  \draw[->] (0.55,0.18) -- node[above]{$1/0$} (2.45,0.18);
  \draw[->] (3.55,-0.18) -- node[below]{$0/0$} (5.45,-0.18);
  \draw[->] (6.55,0.18) -- node[above]{$1/0$} (8.45,0.18);

  % self loops
  \draw[->] (-0.25,0.48) .. controls (-0.45,1.35) and (0.25,1.35) .. (0.12,0.54);
  \node at (-0.1,1.5) {$0/0$};
  \draw[->] (2.75,0.48) .. controls (2.55,1.35) and (3.25,1.35) .. (3.12,0.54);
  \node at (2.9,1.5) {$1/0$};

  % back edges
  \draw[->] (6,-0.55) .. controls (4,-2.1) and (2,-2.1) .. (0,-0.55);
  \node at (3,-2.0) {$0/0$};
  \draw[->] (9,-0.55) .. controls (8.7,-3.1) and (6.3,-3.1) .. (6,-0.55);
  \node at (7.5,-2.9) {$0/0$};
  \draw[->] (9,0.55) .. controls (8.6,2.9) and (4.6,2.6) .. (3.5,0.42);
  \node at (6.5,2.5) {$1/1$};

  \node[font=\scriptsize,anchor=west] at (-2.2,-3.9)
    {$A=\varepsilon$, $B=1$, $C=10$, $D=101$: the longest prefix of $1011$ that is a suffix of the input};
  \node[font=\scriptsize,anchor=west] at (-2.2,-4.35)
    {edge label $x/z$, $x$ 1 bit and $z$ 1 bit; every node has exactly $2^{k}=2$ outgoing edges, mutually exclusive};
\end{circuitikz}
\end{document}
```

**Fix what the picture is a picture of.** The machine is the 6-tuple $(X, Q, Z, \delta, \lambda, q_0)$ with $q^{n+1} = \delta(q^n, x^n)$; the graph is nothing more than $\delta$ and $\lambda$ drawn as a relation. A node is one element of $Q$, an edge $q \xrightarrow{c} q'$ asserts $\delta(q, x) = q'$ for every $x$ satisfying the guard $c$, and the output rides on whichever object carries it: a [[Moore Machine]] labels the *node* with $z = \lambda(q)$, a [[Mealy Machine]] labels the *edge* with `input/output`, $z = \lambda(q,x)$. Widths at this stage are $k$ bits of input $x$ and $m$ bits of output $z$; the state is still symbolic and has no width at all, which is the entire point of drawing the graph before encoding it.

**The table is the same object with the edges sorted.** Enumerate the graph by present state and input and you get the state table: $N$ rows of $2^k$ entries, or $N \cdot 2^k$ rows in flat form, each carrying a next state and an output. Nothing is lost and nothing is added — the transformation is a re-indexing. What it buys is that the table is already in the shape a [[Truth Table]] wants. Pick any encoding $\text{enc}: Q \to \{0,1\}^s$ with $s \ge \lceil \log_2 N\rceil$, substitute it into both the present-state and next-state columns, and the table becomes $s+m$ Boolean functions of $s+k$ variables, minimizable by the laws of [[Boolean Algebra]] or by dropping the columns onto a [[Karnaugh Map]]. From that point on the machine is pure [[Combinational Logic]] plus one register, exactly as [[Canonical FSM Structure]] draws it.

**Completeness is the check that has teeth.** Every node must carry an outgoing edge for each of the $2^k$ input combinations, so the flat table has exactly $N \cdot 2^k$ rows and no fewer. A missing row is not an error the graph will announce — it is a specification of "hold the current state", and holding state outside the register is precisely a level-sensitive [[Transparent D Latch]]. In HDL the mechanism is mechanical: an `if` without an `else`, or a `case` without a `default`, leaves the next-state signal with no assignment on some input combination, so the synthesizer must build storage to remember the old value, and that storage is transparent whenever the enclosing condition is true. The machine has silently left the synchronous discipline through a door nobody drew.

**Determinism is the second half of the same condition.** No two outgoing edges of a node may have overlapping guards, or $\delta$ is not a function. Together the two checks say that the outgoing guards of every node form a *partition* of $\{0,1\}^k$: exhaustive by completeness, disjoint by determinism. On the diagram above with $k=1$ the check is trivial by inspection — two edges per node, one labelled $0/\cdot$ and one labelled $1/\cdot$. It stops being trivial as soon as guards are predicates rather than literal input vectors, which is what every real machine uses: `req && !busy`, `count == LIMIT`, a `casez` pattern with don't-cares. Overlapping `casez` patterns with `parallel_case` asserted are the classic failure — the assertion tells synthesis to build a one-hot mux that never sees the overlap, while the simulator keeps priority semantics, so RTL and gates disagree on exactly the input the assertion promised could not occur.

**Encoding is deliberately deferred, because the graph is what you optimize first.** State minimization by partition refinement, checking for unreachable nodes, and reasoning about equivalent machines are all operations on the graph, and all of them are cheaper and better-defined there than on gates. The assignment problem — choosing $\text{enc}$ — is NP-hard and changes the logic dramatically without changing the graph at all, which is why [[Binary State Encoding]], [[One-Hot State Encoding]] and [[Choosing an FSM Encoding]] are separate decisions taken after the graph is settled.

**Encoding also creates rows the graph never had.** With $s$ flops the encoded truth table has $2^{s+k}$ rows, but the state table only specified $N \cdot 2^k$ of them. The difference, $(2^s - N)\cdot 2^k$ rows, belongs to unused codes, and synthesis reads every one as a don't-care and uses it to simplify $\delta$. That is a genuine and usually large win on ASIC, where two-level and multi-level minimizers convert don't-cares directly into removed literals; on FPGA the win is smaller and lumpier, because the metric is $\lceil \text{fan-in}/6 \rceil$ LUT levels rather than literal count, so shaving a product term is worth nothing unless it crosses a LUT boundary — see [[FPGAs]]. Either way the consequence is the same and it is the reason [[Safe-State FSM Recovery]] exists: an unused code, once entered, transitions wherever the minimizer's convenience sent it, which may be a closed loop containing no real state.

$$\boxed{\ \forall q \in Q:\quad \bigvee_{e \in \text{out}(q)} c_e \;=\; 1 \quad\wedge\quad \forall\, e \ne e' \in \text{out}(q):\ c_e \wedge c_{e'} \;=\; 0\ }$$

The outgoing guards of every node partition $\{0,1\}^k$. Violate the left conjunct and synthesis infers a latch; violate the right and $\delta$ is a relation, not a function, and simulation and synthesis are free to disagree.

**When it breaks.**

- **Incompletely specified machines are legitimate on paper and dangerous in HDL.** A spec that genuinely does not care what happens on some input is best left unspecified for a two-level minimizer, which will exploit the freedom. HDL has no way to express "don't care" in a next-state assignment, so the same omission becomes a latch. Write the `default` arm even when the value is arbitrary.
- **$2^k$ rows per state stops being enumerable fast.** At $k=8$ a four-state machine has 1024 rows. Real graphs use symbolic guards, and the completeness check becomes a tautology check on $\bigvee_e c_e$ over a BDD or a SAT solver rather than a row count. The graph stays the right mental object; the exhaustive table does not.
- **The graph carries no timing.** Two machines with identical graphs can differ by a factor of two in $f_{\max}$ purely through encoding, and the drawing shows neither $t_{pd}^{\delta}$ nor the extra $x \to \lambda \to z$ path a Mealy edge label quietly introduces.
- **Above roughly a dozen states a drawn STG stops being a design tool** and becomes documentation. That is where the machine wants splitting into a [[FSMD Controller-Datapath Split]] or into communicating smaller machines, not a larger sheet of paper.
- **Unused codes are not nodes.** The graph models only the reachable, encoded state set; nothing in it describes behaviour after an upset, a partial reset, or a state bus crossing a clock domain unsynchronized.

**RTL (Spade).**

```spade
enum St { A, B, C, D }

entity stg1011(clk: clock, rst: bool, x: bool) -> bool {
    decl next;
    reg(clk) q reset(rst: St::A) = next;

    let (n, z) = match (q, x) {
        (St::A, false) => (St::A, false),
        (St::A, true)  => (St::B, false),
        (St::B, false) => (St::C, false),
        (St::B, true)  => (St::B, false),
        (St::C, false) => (St::A, false),
        (St::C, true)  => (St::D, false),
        (St::D, false) => (St::C, false),
        (St::D, true)  => (St::B, true),
    };

    let next = n;
    z
}
```

Every arm is one edge of the diagram, in the order the graph draws them: the scrutinee `(q, x)` is the state table's row index, and the arm's result `(n, z)` is its two columns. `x` and `z` are 1 bit each; `q` is symbolic in the source and lowers to a 2-bit encoding chosen by the compiler, which is the encoding decision deferred out of the note and into the tool. Everything but the `reg` is combinational — `z` depends on `x` in the same cycle, so this is the Mealy reading of the graph, and registering `z` would turn it into the Moore one a cycle later. Synthesis will not preserve the eight arms as eight rows: it folds them into two next-state equations plus $z = q_D x$ before it reaches gates.

> [!important] The compiler enforces completeness that a linter merely suggests
> Spade's `match` must be exhaustive or the file does not compile, and there is no latch primitive to infer even if it wanted one. Delete any single arm above and you get a type error, not a working circuit with a hidden latch. In Verilog the identical omission is legal, elaborates, simulates plausibly, and shows up as an inferred latch in a synthesis log that nobody reads. This is the whole completeness check moved from a design review into the type system.

Simulated against a behavioural reference — `z = (last three inputs == 101) && x`, which is a correct model because the four states are exactly a function of the last three bits — over 3027 vectors: the overlapping stream `1011011` fires in exactly two cycles, the reversed pattern `1101` never fires, runs of ones and zeros exercise the two self-loops, and 3000 random bits match. Corrupting the single `1/1` edge to `1/0` makes 184 vectors fail, so the check is live.

**Related Notes.**

- [[Truth Table]] – depends-on: the encoded state table is one, and every minimization move on $\delta$ is a truth-table move.
- [[Karnaugh Map]] – depends-on: the hand method for turning a small encoded state table into $\delta$.
- [[Transparent D Latch]] – counter-example: what an incomplete graph becomes in silicon, and the reason completeness is checked at all.
- [[Mealy Machine]] – extends: attaches the output to edges, which is what the `input/output` labels above mean.
- [[Moore Machine]] – extends: attaches the output to nodes, trading a state for a registered output.
- [[Canonical FSM Structure]] – supports: the three-block circuit the graph compiles into.
- [[1011 Sequence Detector]] – supports: the worked machine drawn here, carried through both output styles and both encodings.
- [[Choosing an FSM Encoding]] – compares: the decision this note deliberately postpones.
- [[Safe-State FSM Recovery]] – compares: covers the codes the graph has no nodes for.

## References

No book source. Written from standard digital-design canon:

- Mano & Ciletti, *Digital Design*, ch. 5.4–5.5 (state equations, state tables and state diagrams) and ch. 5.7 (design procedure from a state diagram).
- Wakerly, *Digital Design: Principles and Practices*, ch. 7.2–7.4 (state-machine structure, state tables, incompletely specified machines and unused states).
- Weste & Harris, *CMOS VLSI Design*, ch. 10 (sequencing, and the sequential-element requirement that makes an unspecified transition a latch).
- Encoding, minimization and unused-code arguments follow [[Synchronous Sequential Logic]]; the LUT-level cost model is that of [[FPGAs]]; Boolean rewriting laws are cited from [[Boolean Algebra]].
