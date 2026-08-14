---
title: "Muller C-Element"
description: "The rendezvous gate — output follows the inputs when they agree and holds when they disagree, giving asynchronous design its one state-holding primitive for free."
kind: circuit
source: "0.5) Asynchronous Sequential Logic, §Delay-insensitive and QDI, §FPGA mapping; Sparsø & Furber ch. 2; Weste & Harris ch. 10"
status: seed
spade: simulated
tags: [digital, asynchronous-sequential-logic, c-element, qdi, majority, handshake, hazard]
aliases:
  - Muller C-Element
  - Muller C Element
  - C-Element
  - C Element
  - C-Gate
  - Rendezvous Element
  - Join Element
---

# Muller C-Element

**One-line summary:** The one state-holding gate of asynchronous logic — it copies its inputs when they agree and freezes when they disagree — and the only element in this folder whose memory is a property of the *function it computes* rather than of a storage primitive bolted onto it.

```tikz title="Muller C-element: symbol with its hold behaviour, the complete-sum majority network with the output fed back, and the static CMOS realization with a weak keeper"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]

  %% =============== (a) complete-sum majority with the output fed back
  \node[and port] (A1) at (-1.0, 2.6) {};
  \node[and port] (A2) at (-1.0, 0.8) {};
  \node[and port] (A3) at (-1.0,-1.0) {};
  \node[or port, number inputs=3] (O1) at (2.6, 0.8) {};

  % a rail (inner)
  \draw (A1.in 1) -- ++(-1.1,0) coordinate (pa1);
  \draw (A2.in 1) -- ++(-1.1,0) coordinate (pa2);
  \draw (pa1) -- (pa2);
  \draw (pa1) -- ++(0,0.5) node[anchor=south] {$a$\,[1]};
  \fill (pa1) circle (0.06);
  % b rail (outer)
  \draw (A1.in 2) -- ++(-1.7,0) coordinate (pb1);
  \draw (A3.in 1) -- ++(-1.7,0) coordinate (pb2);
  \draw (pb1) -- (pb2);
  \draw (pb1) -- ++(0,1.9) node[anchor=south] {$b$\,[1]};
  \fill (pb1) circle (0.06);
  % y feedback rail (innermost)
  \draw (A2.in 2) -- ++(-0.5,0) coordinate (py1);
  \draw (A3.in 2) -- ++(-0.5,0) coordinate (py2);
  \draw (py1) -- (py2);
  \fill (py1) circle (0.06);

  \draw (A1.out) -- ++(0.6,0) |- (O1.in 1);
  \draw (A2.out) -- (O1.in 2);
  \draw (A3.out) -- ++(0.6,0) |- (O1.in 3);

  \node[font=\footnotesize,anchor=south] at ([xshift=0.3cm,yshift=0.05cm]A1.out) {$ab$};
  \node[font=\footnotesize,anchor=south] at ([xshift=0.3cm,yshift=0.05cm]A2.out) {$ay$};
  \node[font=\footnotesize,anchor=south] at ([xshift=0.3cm,yshift=0.05cm]A3.out) {$by$};

  \draw (O1.out) -- (5.6,0.8) node[anchor=west] {$Y=y$\,[1]};
  \draw (5.2,0.8) -- (5.2,-3.2) -- (py2 |- 0,-3.2) -- (py2);
  \fill (5.2,0.8) circle (0.06);
  \node[font=\footnotesize,anchor=north] at (2.2,-3.25) {feedback wire: the state lives here};

  % symbol inset
  \node[draw,circle,minimum size=0.85cm,inner sep=0pt] (CS) at (4.3,3.5) {C};
  \draw (3.35,3.68) -- (3.92,3.68);
  \draw (3.35,3.32) -- (3.92,3.32);
  \node[anchor=east,font=\footnotesize] at (3.3,3.68) {$a$};
  \node[anchor=east,font=\footnotesize] at (3.3,3.32) {$b$};
  \draw (CS.east) -- ++(0.6,0) node[anchor=west,font=\footnotesize] {$Y$};
  \node[font=\footnotesize,anchor=west,align=left] at (6.1,3.5)
    {$00\!\to\!0$,\ \ $11\!\to\!1$\\ $01,10\to$ hold};

  \node[font=\footnotesize,anchor=north,align=center] at (2.2,-4.0)
    {\textbf{(a)} $Y=ab+ay+by=\mathrm{maj}(a,b,y)$\\
     all three products are essential prime implicants};

  %% =============== (b) static CMOS C-element with keeper
  \begin{scope}[xshift=1.2cm,yshift=-10.2cm]
    \draw (0,4.6) node[vcc]{} -- (0,4.2);
    \node[pmos] (P1) at (0,3.6) {};
    \node[pmos] (P2) at (0,2.2) {};
    \node[nmos] (N1) at (0,0.6) {};
    \node[nmos] (N2) at (0,-0.8) {};
    \draw (P1.source) -- (0,4.2);
    \draw (P1.drain) -- (P2.source);
    \draw (P2.drain) -- (0,1.4) -- (N1.drain);
    \draw (N1.source) -- (N2.drain);
    \draw (N2.source) -- (0,-1.5) node[ground]{};

    \draw (P1.gate) -- ++(-0.9,0) node[anchor=east] {$a$};
    \draw (P2.gate) -- ++(-0.9,0) node[anchor=east] {$b$};
    \draw (N1.gate) -- ++(-0.9,0) node[anchor=east] {$a$};
    \draw (N2.gate) -- ++(-0.9,0) node[anchor=east] {$b$};

    \node[not port] (INV) at (2.3,1.4) {};
    \draw (0,1.4) -- (INV.in);
    \draw (INV.out) -- (4.4,1.4) node[anchor=west] {$Y$\,[1]};
    \node[font=\footnotesize,anchor=south] at (0.75,1.5) {$\overline{Y}$};

    \node[not port,xscale=-1] (K) at (2.3,-0.6) {};
    \draw (3.9,1.4) -- (3.9,-0.6) -- (K.in);
    \draw (K.out) -- (0.6,-0.6) -- (0.6,1.4);
    \fill (3.9,1.4) circle (0.06);
    \fill (0.6,1.4) circle (0.06);
    \node[font=\footnotesize,anchor=north] at (2.3,-1.15) {weak keeper};

    \node[font=\footnotesize,anchor=north,align=center] at (1.8,-2.6)
      {\textbf{(b)} series pMOS pull $\overline{Y}$ high only when $a\!=\!b\!=\!0$,\\
       series nMOS pull it low only when $a\!=\!b\!=\!1$;\\
       on disagreement neither stack conducts and the keeper holds};
  \end{scope}

\end{circuitikz}
\end{document}
```

*Own construction; the symbol and the two realizations are standard — cf. Sparsø & Furber ch. 2 and Weste & Harris ch. 10.*

**Specify it as a next-state function before drawing a single gate.** Inputs $a$ and $b$ are 1 bit each, the output $y$ is 1 bit, and there is no clock anywhere in the signature. The specification has three clauses: $y$ goes to $1$ when *all* inputs are $1$, goes to $0$ when *all* inputs are $0$, and **holds its previous value** otherwise. Written as a next-state function of the present state $y$ that is exactly

$$Y \;=\; \begin{cases} 1 & a=b=1\\ 0 & a=b=0\\ y & \text{otherwise}\end{cases}$$

Two of the four input combinations are transitions and two are self-loops, so this is a two-state machine whose state variable is $y$ itself. That last observation is the whole design: the element does not need a place to put its state, because its output already *is* its state.

**Fold the case split into one algebraic expression, then read the identity off it.** Combine the clauses as "set when $ab$, otherwise hold when not resetting", which as a Boolean sum of a set term and a hold term is

$$Y \;=\; ab \;+\; (a+b)\,y$$

and distributing AND over OR across the second product gives

$$Y \;=\; ab + ay + by$$

That expression is symmetric under every permutation of $\{a,b,y\}$ and is $1$ exactly when at least two of the three are $1$, so by inspection of its four true minterms $\{011,101,110,111\}$ it is the three-input **majority function**:

$$Y=\mathrm{maj}(a,b,y)$$

The C-element is therefore not "a majority gate plus some memory" — it is a majority gate with one of its three inputs wired to its own output, and the memory is that wire. This is the cleanest example in the whole vault of state produced by topology rather than by a primitive; the cross-coupled inverter pair is the other, and it is the degenerate case with no inputs at all.

**Check whether a minimizer can damage the cover, because for an asynchronous element that question is a correctness question.** Enumerate the prime implicants of $\mathrm{maj}(a,b,y)$: they are $ab$, $ay$, $by$, and nothing else. Minterm $110$ is covered only by $ab$, $101$ only by $ay$, and $011$ only by $by$, so **every product is an essential prime implicant** and the three-term cover is simultaneously the complete sum *and* the unique minimal SOP. This is not luck. $\mathrm{maj}$ is **unate** — no variable appears complemented anywhere in it — and a monotone Boolean function has a unique irredundant sum-of-products, namely the sum of all its prime implicants. A logic minimizer handed this cover has nothing to remove.

> [!warning] Correction to `0.5) Asynchronous Sequential Logic`
> The long-form note calls $ab+ay+by$ "the consensus-completed cover", says $ab+ay$ alone "glitches", and says "every synthesis tool wants to drop" the third term. All three claims are wrong, and the middle one is testable. The **consensus theorem** $xy+\bar{x}z+yz = xy+\bar{x}z$ requires some variable to appear in both polarities; $\mathrm{maj}(a,b,y)$ is unate, so it has no consensus term and no redundant product. And $ab+ay$ is not a hazardous cover of $\mathrm{maj}$ — it is not a cover of $\mathrm{maj}$ at all: at $(a,b,y)=(0,1,1)$, $\mathrm{maj}=1$ while $ab+ay=0$. Removing $by$ does not add a glitch, it changes the function, and the loop then *loses the stored $1$ permanently* rather than dipping. This is confirmed by simulation below (`c_dropped`), where the reduced cover drops to $0$ on the $a{:}1\!\to\!0$ transition with $b=y=1$ and never recovers. The place the consensus story genuinely applies is the transparent D latch, $Q = D\,\mathit{en} + Q\,\overline{\mathit{en}} + DQ$, where $DQ$ *is* redundant and its removal *is* a static-1 hazard.

**Verify hazard-freedom directly, since that is what "correct under arbitrary gate delays" buys.** A two-level SOP is free of **static-1 hazards** under single-input change iff every pair of adjacent true minterms lies inside a common product. Take the three adjacent pairs among the true minterms of $\mathrm{maj}$: $111\!\leftrightarrow\!011$ (only $a$ changes) both lie in $by$; $111\!\leftrightarrow\!101$ (only $b$ changes) both lie in $ay$; $111\!\leftrightarrow\!110$ (only $y$ changes) both lie in $ab$. Every adjacency is covered, so panel (a) is hazard-free for single-input changes, and the $y$ adjacency being covered by $ab$ is what makes the *feedback* transition safe as well — see [[Static Hazard]] for the general criterion. Nothing about this is optional: a glitch on $y$ in an asynchronous circuit is not a transient that the next clock edge cleans up, it is a spurious handshake event that the environment will act on.

**Read the feedback as a Huffman machine whose race-free assignment is free.** Panel (a) is literally the [[Huffman Feedback Model]] with a single feedback variable: excitation $Y$, state $y$, and the delay in the loop unspecified. One feedback variable cannot have a critical race — a race needs two state bits changing — so the C-element is race-free by construction, and with the hazard-free cover above it is correct for arbitrary finite delays in every gate. That is the entire reason it is the primitive of choice: it is the largest useful thing you can build in the Huffman model without incurring a state-assignment problem ([[Race-Free State Assignment]]).

**Build it in CMOS as one gate, because the SOP network is a bad implementation of it.** Panel (b) is the conventional static C-element: two pMOS in series from $V_{DD}$, two nMOS in series to ground, both stacks gated by $a$ and $b$. When $a=b=0$ only the pull-up conducts; when $a=b=1$ only the pull-down conducts; on disagreement **neither stack conducts** and the internal node $\overline{Y}$ is floating, which is precisely the hold clause — the specification's "otherwise" is realized by the absence of a path rather than by extra logic. A weak cross-coupled keeper (staticizer) holds the floating node against leakage, and an output inverter restores the level, giving $2n+4$ transistors for $n$ inputs against roughly three times that for the two-level network of panel (a). Variants trade the keeper for something better acknowledged: the *weak-feedback* form (Sutherland) drives the keeper from the output, while the *symmetric* form (Van Berkel / Martin) splits the stacks so each input is separately acknowledged on each transition, which is what a strict [[Dual-Rail Encoding]] proof of QDI correctness needs.

**Understand why this one gate is the whole of delay-insensitive design.** Martin's result is that a circuit built from single-output gates and correct under arbitrary gate *and* wire delays computes essentially nothing beyond what C-elements and inverters give you: pure DI is a dead end, and QDI buys the design space back with the single **isochronic fork** assumption. Whatever is left of the DI world, the C-element is it. Operationally it is the **rendezvous** or **join** operator — the output event happens only after events have arrived on both inputs — which is exactly the synchronisation primitive a [[Four-Phase Handshake]] needs, and chaining them with each stage taking its successor's *inverted* output gives the [[Muller Pipeline]]. The generalization to $n$ inputs is immediate from the same fold: with $A=\prod_i a_i$,

$$Y = A + y\sum_i a_i$$

which is $n+1$ products, still unate, still all essential.

**On FPGA the term structure stops mattering and the loop starts mattering.** $\mathrm{maj}(a,b,y)$ is a three-input function, so it fits in one LUT3 slice of a 6-LUT — see [[Lookup-Tables]] — and the LUT stores the truth table, not a cover, so there is no product term for an optimizer to remove and no two-level hazard to reason about. What the fabric charges instead is the feedback route: the LUT output must come back to one of its own inputs through general routing, which is a **combinational loop**, a first-class error for static timing analysis. Vivado needs `ALLOW_COMBINATORIAL_LOOPS` on the net plus a `set_disable_timing`, Quartus an equivalent loop cut, and both need `DONT_TOUCH`/`KEEP` so the loop is not restructured; you are hand-certifying timing the tool declined to analyse. The isochronic fork is worse: routing delay dominates logic delay and is chosen by the router, and there is no constraint that forces two branches of a fork to match. That is why FPGA asynchronous work is overwhelmingly bundled-data with a [[Matched Delay Line]] rather than QDI ([[Choosing an Asynchronous Style]]).

> [!warning] LUT-internal hazard behaviour is not vendor-guaranteed
> A LUT is a multiplexer tree, so a single-input change steers one mux level whose two data inputs carry equal values whenever the function does not change, which *argues* that a LUT-based C-element is glitch-free for single-input change. No vendor datasheet commits to this, and no timing model exposes it. Treat it as an argument, not a guarantee.

**Result.**

$$\boxed{\ Y \;=\; ab + (a+b)\,y \;=\; ab+ay+by \;=\; \mathrm{maj}(a,b,y)\ }$$

All three products are essential prime implicants; the cover is simultaneously complete-sum, minimal, and free of static-1 hazards under single-input change.

**When it breaks.**

- **Power-up state is undefined.** With $a\neq b$ at reset the loop has two stable solutions and the specification says "hold" a value that was never established. Real C-elements add a reset transistor to the keeper. In simulation this shows up immediately: the emitted Verilog loop sits at `x` until the environment first drives $a=b$.
- **The environment must not leave a hold state through the wrong side.** From $(a,b)=(1,0)$ with $y=1$, a transition of $b$ to $1$ holds, but a transition of $a$ to $0$ resets. The gate is correct for either; the *protocol* is what guarantees only the intended one occurs, and that guarantee lives in the [[Four-Phase Handshake]], not here.
- **It joins, it never chooses.** Two genuinely concurrent, mutually exclusive requests need arbitration and therefore a metastability filter; a C-element will simply wait for both forever. Use the [[Mutual Exclusion Element]].
- **Fan-in does not scale.** $n$ series transistors per stack degrade drive roughly linearly and the stack's threshold spread grows, so beyond $n\approx3$–$4$ the practical construction is a *tree* of 2-input C-elements — which is exactly what a [[Completion Detection Tree]] is.
- **Asymmetric C-elements break the majority form.** When only some inputs must be acknowledged on the rising transition and others on the falling one, $Y$ is no longer symmetric in its inputs and the $\mathrm{maj}$ identity no longer holds; the cover has to be re-derived from the transition specification.
- **Synthesis from RTL.** Any tool that sees the loop will warn, cut it, or infer a latch. The reliable path on both FPGA and ASIC is to stop synthesising and instantiate a characterized cell.

**RTL (Spade).**

The prediction for this note was `not-expressible`. It is wrong: Spade expresses the loop natively, and the reason is worth being precise about. The naive transcription does fail, because `let` bindings are ordered and cannot refer forward —

```spade
fn c_naive(a: bool, b: bool) -> bool {
    let y = (a && b) || (a && y) || (b && y);   // error: Use of undeclared name y
    y
}
```

— but `decl` forward-declares a name without giving it a driver, which is exactly what a feedback wire is, and closes the cycle:

```spade
/// Muller C-element: complete-sum majority with the output fed back.
fn c_element(a: bool, b: bool) -> bool {
    decl y;
    let y = (a && b) || (a && y) || (b && y);
    y
}

/// Asymmetric stage form: one C-element per Muller-pipeline stage.
fn c_stage(req_in: bool, ack_out: bool) -> bool {
    c_element(req_in, !ack_out)
}
```

`a` and `b` are the two input rails of panel (a) and `y` is the feedback wire, all `bool` = 1 bit; the three `&&` terms are the three AND gates and the `||` chain is the 3-input OR. There is no `clock` argument and no `reg`, which is the point — this is a `fn`, purely combinational by Spade's own typing, and the state exists only because the `decl` lets the expression name its own result. It lowers to a single self-referential continuous assignment, `assign \y = ((a & b) | (a & \y )) | (b & \y );`, so what synthesis sees is a genuine combinational cycle and *not* the two-transistor-stack cell of panel (b): the drawing is one gate, the netlist is four, and only cell instantiation closes that gap.

Simulation is what makes the correction above concrete. **3017 vectors pass**: nine named vectors covering both agreement transitions and — deliberately asymmetric, since a symmetric check passes on a gate with its inputs swapped — holding $0$ through `10` and then through `01`, and holding $1$ through `10` and then through `01`; three vectors on `c_stage`; five on the dropped-cover experiment; and a 3000-vector random sweep against a behavioural reference that models the hold clause directly.

```verilog
for (i = 0; i < 3000; i = i + 1) begin
  a = $random; b = $random;
  if (a && b)        exp = 1;
  else if (!a && !b) exp = 0;      // else: exp holds, which is the whole specification
  #1 if (y !== exp) fails = fails + 1;
end
```

The same testbench instantiates a second entity `c_dropped` with the `b && y` term deleted. From $(1,1)$ it sets to $1$ correctly; on $a{:}1\!\to\!0$ the correct C-element holds $1$ while `c_dropped` falls to $0$ and stays there — a functional error, not a glitch, exactly as the warning above claims.

**Related Notes (with context):**

- [[Muller Pipeline]] – extends: chains these, each stage taking its successor's inverted output, into a self-timed FIFO with no matched delays anywhere.
- [[Four-Phase Handshake]] – supports: supplies the protocol that guarantees inputs only ever leave a hold state on the intended side.
- [[Completion Detection Tree]] – extends: the $n$-input rendezvous built as a tree of these, because the series stacks of panel (b) do not scale past three or four inputs.
- [[Huffman Feedback Model]] – depends-on: the C-element is that model with exactly one feedback variable, which is why it is race-free for free.
- [[Static Hazard]] – depends-on: supplies the single-input-change adjacency criterion the cover is checked against.
- [[Boolean Algebra]] – depends-on: prime implicants, the complete sum, and the consensus theorem that — contrary to the long-form note — does *not* apply to a unate function.
- [[Mutual Exclusion Element]] – counter-example: the other asynchronous primitive, which chooses between inputs where this one waits for all of them, and pays metastability for it.
- [[SR Latch]] – compares: the synchronous world's cheapest state-from-topology element, storing on two inputs that must never both assert, where this one stores on two that must both assert.
- [[Lookup-Tables]] – compares: on FPGA the whole gate collapses into one LUT3 and the cover stops mattering, but the feedback route becomes a combinational loop the tools refuse to time.
- [[Choosing an Asynchronous Style]] – compares: where a QDI datapath built from these sits against bundled-data and synchronous.
- [[Dual-Rail Encoding]] – supports: the encoding whose completion detection and return-to-spacer phase are built from C-elements rather than ANDs.

## References

- `0.5) Asynchronous Sequential Logic`, §*Delay-insensitive and QDI* — the timing-assumption hierarchy, Martin's result, the isochronic fork, the C-element specification and the $ab+(a+b)y$ fold, and the Muller pipeline. §*FPGA mapping* — combinational loops, `ALLOW_COMBINATORIAL_LOOPS`, `DONT_TOUCH`, and the unenforceability of isochronic forks on FPGA. See the correction callout above for three claims in the first of these sections that do not survive checking.
- J. Sparsø & S. Furber, *Principles of Asynchronous Circuit Design*, ch. 2 — the C-element as rendezvous/join, the Muller pipeline, and asymmetric C-elements.
- N. Weste & D. Harris, *CMOS VLSI Design*, ch. 10 — the conventional, weak-feedback and symmetric static C-element circuit forms and the keeper.
- M. Mano & M. Ciletti, *Digital Design*, ch. on asynchronous sequential logic — the Huffman model, excitation versus state variables, races, and the hazard-free-cover criterion.

> [!warning] Printed page numbers not verified
> This circuit is outside the assigned textbook, so the citations above are chapter-level and no copy was consulted. Transistor counts are structural ($2n+4$ for the conventional form) rather than measured, and no delay, area or power figure is quoted.
