---
title: SR Latch
description: "Cheapest writeable bistable: two cross-coupled NORs, one set input, one reset — and one forbidden input code whose release is an unarbitrated race."
kind: circuit
source: "0.3) Introduction to Flip-Flops & Latches, §SR latch; Mano & Ciletti ch. 5; Wakerly ch. 7; Weste & Harris ch. 10"
status: seed
spade: verified
tags: [digital, flip-flops-and-latches, latch, bistable, sr]
aliases:
  - SR Latch
  - RS Latch
  - Set-Reset Latch
  - NOR Latch
  - SR NOR Latch
  - Cross-Coupled NOR Latch
---

# SR Latch

**One-line summary:** The minimum circuit that makes a bistable *writeable* — two cross-coupled NOR gates, where each gate's spare input can overpower the loop from outside — at the price of one input code, $S=R=1$, for which no consistent state exists.

```tikz title="Cross-coupled NOR SR latch: each gate's second input overrides the feedback loop"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \node[nor port] (n1) at (2.6,2.2) {};
  \node[nor port] (n2) at (2.6,0.0) {};

  % external inputs
  \draw (n1.in 1) -- ++(-1.6,0) node[anchor=east] {$R$~[1]};
  \draw (n2.in 2) -- ++(-1.6,0) node[anchor=east] {$S$~[1]};

  % outputs
  \draw (n1.out) -- (5.5,2.2) node[anchor=west] {$Q$~[1]};
  \draw (n2.out) -- (5.5,0.0) node[anchor=west] {$\bar{Q}$~[1]};

  % feedback: Q -> lower gate's upper input
  \fill (4.7,2.2) circle (0.055);
  \draw (4.7,2.2) -- (4.7,1.35) -- (-0.45,1.35) |- (n2.in 1);

  % feedback: Qbar -> upper gate's lower input
  \fill (4.2,0.0) circle (0.055);
  \draw (4.2,0.0) -- (4.2,0.8) -- (-0.15,0.8) |- (n1.in 2);

  \node[anchor=north,align=center] at (2.6,-1.0)
    {$Q=\overline{R+\bar{Q}}$\qquad$\bar{Q}=\overline{S+Q}$};
\end{circuitikz}
\end{document}
```

*Own construction; the standard NOR-pair drawing, e.g. Mano & Ciletti ch. 5 and Wakerly ch. 7. The crossing at the left is a wire crossing, not a junction — only the two filled dots on $Q$ and $\bar{Q}$ are connections.*

**Topic:**

**Start from a loop that already works and ask what a write costs.** [[Cross-Coupled Inverter Bistable]] stores a bit forever for two inverters and zero control, because a monotone decreasing transfer curve with $|A|\gg 1$ crosses its own inverse at two stable points. It has no inputs. Every transistor added to it exists to overpower that loop for a controlled instant without destroying it, and the SR latch is the cheapest possible answer: promote each inverter to a two-input gate and hand the spare input to the outside world. All four signals $S$, $R$, $Q$, $\bar{Q}$ are 1 bit wide; there is no wider version of this circuit, only $n$ independent copies.

**A NOR is an inverter with an override, and the identity $x+0=x$ is why.** Write the loop as it is drawn:

$$Q=\overline{R+\bar{Q}},\qquad \bar{Q}=\overline{S+Q}$$

With $S=R=0$, **identity of OR** ($x+0=x$) collapses both gates: $Q=\overline{\bar{Q}}$ and $\bar{Q}=\overline{Q}$. The circuit *is* the cross-coupled inverter pair, unchanged, so it holds whatever it held. With $S=1$, **annihilator of OR** ($x+1=1$) forces $\bar{Q}=\bar{1}=0$ regardless of $Q$; that $0$ then feeds the upper gate, whose remaining input $R$ is $0$, so by identity again $Q=\bar{0}=1$. The loop has been driven to a consistent state from outside and, crucially, it *stays* there when $S$ returns to $0$, because at $S=R=0$ we are back in the holding case. NOR is the right gate precisely because its controlling value ($1$) is the asserted level and its non-controlling value ($0$) is the idle level — the control inputs are inert when unused.

**Solve the loop for a next-state function by Shannon expansion.** The loop equations are two simultaneous Boolean equations, not an assignment; the honest object is the *characteristic equation* relating the settled output $Q^{+}$ to the inputs and the previous value $Q$. Expand about $S$ and $R$ using [[Shannon Expansion]], $f = x f_{x} + \bar{x} f_{\bar{x}}$, and evaluate each cofactor by the two identities above: $f_{S=1,R=0}=1$, $f_{S=0,R=1}=0$, $f_{S=0,R=0}=Q$. Reassembling and absorbing the $S\bar{R}$ term into $S$ (legal only under the constraint below) gives

$$Q^{+}=S+\bar{R}\,Q \quad\text{subject to}\quad SR=0$$

The constraint is not decoration. It is the domain on which the expansion above is total; drop it and the equation is a fiction, because it silently claims set-dominance for a circuit that has no dominance at all.

**The fourth code has no solution, and the name $\bar{Q}$ is what breaks.** At $S=R=1$ both NORs see a controlling input, so $Q=\bar{Q}=0$. The circuit is perfectly well-behaved as *logic* — it settles, it is stable, nothing oscillates — and it is broken as *storage*, because the complementarity that the second output's name asserts is violated, and any downstream logic that uses $\bar{Q}$ as "not $Q$" now reads a lie. This is the first appearance of a pattern worth internalising: an invalid state in a sequential circuit is usually not a stuck node, it is a valid electrical state outside the encoding the rest of the design assumes.

**The real damage is at the release, and it is an arbitration, not a glitch.** Take $S,R:1\!\to\!0$ simultaneously. Both gates leave the controlling condition at the same instant and each begins to pull its output high; each rising output then re-asserts control over the other. The final state is decided by which NOR is physically faster — a manufacturing and PVT accident, not a logical one. Worse, if the two paths are close enough to matched, the loop is pushed toward the unstable intersection $V_M$ of [[Cross-Coupled Inverter Bistable]], where the same loop gain $|A|\gg1$ that makes the latch a good memory makes the escape time unbounded. Simultaneous release is therefore not merely "undefined output" but "undefined output after an unbounded delay". If you genuinely need to resolve two asynchronous requests, this circuit is the wrong one and a [[Mutual Exclusion Element]] — the same cross-coupled pair plus an explicit metastability filter on the outputs — is the right one.

**Two standard repairs, both of which cost the thing that made the latch cheap.** Making one input dominant is a one-gate change: $Q^{+}=S\bar{R}+\bar{R}Q=\bar{R}(S+Q)$ is reset-dominant, and $Q^{+}=S+\bar{R}Q$ with $R$ gated by $\bar{S}$ is set-dominant. Both remove the invalid *state* but not the release *race*, because two inputs can still change at once. The complete repair is to remove the second degree of freedom entirely: tie $R=\bar{S}$ so the input code $(1,1)$ is unreachable by construction, which is exactly [[Transparent D Latch]]. That is why the SR latch survives as a component and almost never as a top-level element.

**The NAND dual is the same circuit read through De Morgan.** Replacing both NORs with NANDs and cross-coupling identically gives $Q=\overline{\bar{S}\cdot\bar{Q}}$, $\bar{Q}=\overline{\bar{R}\cdot Q}$: an active-low $\bar{S}\bar{R}$ latch whose idle code is $\bar{S}=\bar{R}=1$ and whose forbidden code is $\bar{S}=\bar{R}=0$. **De Morgan's law** $\overline{a+b}=\bar{a}\bar{b}$ is the whole of the translation; the defect moves to the other corner of the input space and does not shrink. NAND is nevertheless the more common implementation in static CMOS, because a NAND2's series devices are NMOS and a NOR2's are PMOS, and PMOS in series is the slower, larger stack — see [[NAND-NAND Network]] for the same asymmetry driving two-level logic realisation.

**ASIC and FPGA disagree sharply about whether this circuit exists.** In static CMOS a NOR2 is 4 transistors, so the latch is 8 — genuinely the cheapest writeable storage, and it is used exactly there: as the storage core inside larger cells, and as a [[Switch Debouncer]], where an SPDT mechanical contact physically cannot ground both inputs at once and so the forbidden code is unreachable by construction rather than by promise. On an FPGA the picture inverts. The circuit becomes two LUTs with their outputs fed back, i.e. a **combinational loop**: a cycle in the timing graph. Static timing analysis cannot traverse it, synthesis will warn or error, and the routing delay in the feedback path is placement-dependent and not characterised. Every FPGA flip-flop already carries dedicated asynchronous set and reset pins that give the same $S/R$ semantics with a real timing model and a defined priority; inferring an SR latch out of LUTs instead is a design error, not a cost trade.

> [!important] The forbidden code must be made unreachable by *structure*, never by convention
> "The designer will not assert both" is not a constraint a tool can check and not one a physical input honours. Every durable use of this circuit — the debouncer, the D latch, the set/reset pins of a hard flop — removes the code from the input space rather than promising not to use it.

**Result.**

$$\boxed{\ Q^{+}=S+\bar{R}\,Q\quad\text{subject to}\quad SR=0;\qquad Q=\overline{R+\bar{Q}},\ \ \bar{Q}=\overline{S+Q}\ }$$

**When it breaks.**

- **$S=R=1$:** $Q=\bar{Q}=0$. Stable, legal electrically, outside the encoding. Any consumer of $\bar{Q}$ as $\lnot Q$ is now wrong.
- **Simultaneous release $S,R:1\!\to\!0$:** unarbitrated race between the two NORs; with matched paths the loop can enter metastability and the resolution time has no upper bound. Use a [[Mutual Exclusion Element]] when this must be safe.
- **Input pulse narrower than the loop delay:** a set pulse shorter than the time for $\bar{Q}$ to fall and $Q$ to rise back through the loop may not latch at all. Minimum pulse width is a real, characterised parameter of the cell — the asynchronous analogue of $t_{setup}$ in [[Setup and Hold Constraints]].
- **On an FPGA:** it is a combinational loop with no timing model. Use the flip-flop's async set/reset pins instead.
- **Above one bit of state or any need for a clock boundary:** the SR latch stops being the answer immediately — one input is enough ([[Transparent D Latch]]) and an edge is what you actually want ([[Master-Slave D Flip-Flop]]).

**RTL (Spade).**

The naive transcription does not compile, and the error is worth seeing because it is the general shape of the problem:

```spade
fn sr_latch(s: bool, r: bool) -> bool {
    let qb = !(s || q);   // error: Use of undeclared name q
    let q  = !(r || qb);
    q
}
```

`let` bindings are ordered and cannot refer forward. The loop closes with `decl`, which forward-declares a name without giving it a driver:

```spade
fn sr_latch(s: bool, r: bool) -> (bool, bool) {
    decl q;
    let qb = !(s || q);
    let q  = !(r || qb);
    (q, qb)
}
```

`s`/`r` are the two external gate inputs and `q`/`qb` the two output wires of the drawing, all `bool` = 1 bit; the function is purely combinational, with no `clock` in the signature and no `reg`, which is the point — the state lives in the topology, not in a storage primitive. This lowers to exactly two cross-coupled continuous assignments (`assign qb = ~(s | q); assign q = ~(r | qb);`), so the emitted Verilog is a genuine combinational loop and every downstream tool will treat it as one. Spade type-checks it; nothing in Spade or in the Verilog encodes the $SR=0$ contract, and the simulator's behaviour at $s=r=1$ followed by simultaneous release is a property of the event scheduler, not of the circuit.

**Related Notes (with context):**

- [[Cross-Coupled Inverter Bistable]] – depends-on: supplies the two stable points, the loop-gain criterion, and the unstable $V_M$ that this circuit's release race falls into.
- [[Transparent D Latch]] – extends: ties $R=\bar{S}$, deleting the forbidden code from the input space and turning $Q^{+}=S+\bar{R}Q$ into a clocked mux.
- [[Switch Debouncer]] – supports: the one application where the forbidden code is unreachable by physics rather than by promise.
- [[Shannon Expansion]] – depends-on: the expansion about $S$ and $R$ that turns two simultaneous loop equations into the characteristic equation.
- [[Boolean Algebra]] – depends-on: identity, annihilator and De Morgan, named at every rewriting step above.
- [[Mutual Exclusion Element]] – extends: the same cross-coupled pair plus a metastability filter, which is what the simultaneous-release race actually requires.
- [[Asynchronous Sequential Logic]] – compares: the SR latch is the smallest instance of the Huffman feedback model, and its race is the smallest instance of a critical race.
- [[JK Flip-Flop]] – extends: feeds $Q$ back to reuse the forbidden code as "toggle" instead of forbidding it.
- [[NAND-NAND Network]] – compares: the same NOR/NAND stack asymmetry that makes the active-low version the preferred CMOS implementation.
- [[Choosing a Storage Element]] – compares: where this sits against every sibling in the folder.

## References

- `0.3) Introduction to Flip-Flops & Latches`, §*Cross-coupled inverters and bistability* and §*SR latch* — loop equations, characteristic equation, race on simultaneous release, and the two surviving applications.
- Mano & Ciletti, *Digital Design*, ch. 5 (Synchronous Sequential Logic) — NOR and NAND latch forms, characteristic table, invalid state.
- Wakerly, *Digital Design: Principles and Practices*, ch. 7 — $\bar{S}\bar{R}$ active-low latch, minimum pulse width, debouncing.
- Weste & Harris, *CMOS VLSI Design*, ch. 10 — transistor counts and the role of the cross-coupled pair as the storage core of every sequential cell.

> [!warning] Printed page numbers not verified
> The three textbook citations above are chapter-level. No page numbers are given because no copy was consulted for this note; the material is standard and the chapter numbering is stable across editions, but the pages are not.
