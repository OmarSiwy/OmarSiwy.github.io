---
title: Equality Comparator
description: "Decides X=Y with w XNORs and a balanced AND tree, log-depth and the only predicate that gets cheaper when you ask for less."
kind: circuit
source: "ASA §6.1.2, §6.2, §6.3.1, pp. 146-148"
status: seed
spade: simulated
tags: [digital, comparators, equality, reduction, fpga]
aliases:
  - Equality Comparators
  - Equality Comparison
  - Equality Checker
  - Equality Test
  - XNOR-AND Tree
---

# Equality Comparator

The comparison predicate whose operator is **commutative** as well as associative, so unlike every other comparison in this folder it is a reduction rather than a prefix scan — one bit per tree edge, no leaf ordering logic, and no carry chain anywhere.

```tikz title="8-bit equality: XNOR layer feeding a balanced AND tree, and the same function as three cascaded LUT6"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,scale=0.95,transform shape]

% ============ (a) gate level, w = 8 ============
\node[anchor=west] at (-1.6,1.5) {\textbf{(a)} ASIC: $8$ XNOR2 in parallel, then a balanced AND tree --- depth $1+\lceil\log_2 8\rceil=4$};

\foreach \k/\py/\dy in {0/0.0/0.36, 1/-1.4/-0.36, 2/-2.8/0.36, 3/-4.2/-0.36,
                        4/-5.6/0.36, 5/-7.0/-0.36, 6/-8.4/0.36, 7/-9.8/-0.36} {
  \node[xnor port] (e\k) at (1.3,\py) {};
  \draw (e\k.in 1) -- ++(-0.65,0) node[left,inner sep=2pt] {$x_{\k}$};
  \draw (e\k.in 2) -- ++(-0.65,0) node[left,inner sep=2pt] {$y_{\k}$};
  \node[anchor=west,gray!75,inner sep=1.5pt] at (2.15,\py+\dy) {$E_{\k}$};
}

\node[and port] (a0) at (4.3,-0.7) {};
\node[and port] (a1) at (4.3,-3.5) {};
\node[and port] (a2) at (4.3,-6.3) {};
\node[and port] (a3) at (4.3,-9.1) {};
\foreach \g/\p/\q in {a0/e0/e1, a1/e2/e3, a2/e4/e5, a3/e6/e7} {
  \draw (\p.out) -- ++(0.35,0) |- (\g.in 1);
  \draw (\q.out) -- ++(0.35,0) |- (\g.in 2);
}

\node[and port] (b0) at (7.0,-2.1) {};
\node[and port] (b1) at (7.0,-7.7) {};
\draw (a0.out) -- ++(0.35,0) |- (b0.in 1);
\draw (a1.out) -- ++(0.35,0) |- (b0.in 2);
\draw (a2.out) -- ++(0.35,0) |- (b1.in 1);
\draw (a3.out) -- ++(0.35,0) |- (b1.in 2);

\node[and port] (c0) at (9.7,-4.9) {};
\draw (b0.out) -- ++(0.35,0) |- (c0.in 1);
\draw (b1.out) -- ++(0.35,0) |- (c0.in 2);
\draw[->] (c0.out) -- ++(1.0,0) node[right,inner sep=2pt] {$X{=}Y$};

\draw[dashed,gray!55] (3.15,0.9) -- (3.15,-10.5);
\draw[dashed,gray!55] (5.85,0.9) -- (5.85,-10.5);
\draw[dashed,gray!55] (8.55,0.9) -- (8.55,-10.5);
\node[gray!75] at (1.3,1.05)  {XNOR layer};
\node[gray!75] at (4.5,1.05)  {AND lvl 1};
\node[gray!75] at (7.2,1.05)  {AND lvl 2};
\node[gray!75] at (9.9,1.05)  {AND lvl 3};

\node[anchor=west] at (-1.6,-11.1) {every $x_i,y_i,E_i$ and the output are $1$ bit; the operands $X,Y$ are $w=8$ bits, the result is $1$ bit --- no width growth};

% ============ (b) FPGA, w = 8 ============
\node[anchor=west] at (-1.6,-12.6) {\textbf{(b)} FPGA: one LUT6 per $3$-bit chunk, cascaded --- $\lceil w/3\rceil=3$ LUTs, no tree at all};

\node[draw,minimum width=2.3cm,minimum height=1.0cm] (l0) at (8.6,-15.6) {LUT6};
\node[draw,minimum width=2.3cm,minimum height=1.0cm] (l1) at (5.3,-15.6) {LUT6};
\node[draw,minimum width=2.3cm,minimum height=1.0cm] (l2) at (2.0,-15.6) {LUT6};
\node[anchor=north,inner sep=3pt,gray!75] at (l0.south) {$X_{2:0}{=}Y_{2:0}$};
\node[anchor=north,inner sep=3pt,gray!75] at (l1.south) {$X_{5:3}{=}Y_{5:3}$};
\node[anchor=north,inner sep=3pt,gray!75] at (l2.south) {$X_{7:6}{=}Y_{7:6}$};

\draw[<-] ([xshift=-7mm]l0.north) -- node[left,inner sep=1.5pt] {$3$} ++(0,0.95) node[above,inner sep=2pt] {$X_{2:0}$};
\draw[<-] ([xshift=7mm]l0.north)  -- node[right,inner sep=1.5pt] {$3$} ++(0,0.95) node[above,inner sep=2pt] {$Y_{2:0}$};
\draw[<-] ([xshift=-7mm]l1.north) -- node[left,inner sep=1.5pt] {$3$} ++(0,0.95) node[above,inner sep=2pt] {$X_{5:3}$};
\draw[<-] ([xshift=7mm]l1.north)  -- node[right,inner sep=1.5pt] {$3$} ++(0,0.95) node[above,inner sep=2pt] {$Y_{5:3}$};
\draw[<-] ([xshift=-7mm]l2.north) -- node[left,inner sep=1.5pt] {$2$} ++(0,0.95) node[above,inner sep=2pt] {$X_{7:6}$};
\draw[<-] ([xshift=7mm]l2.north)  -- node[right,inner sep=1.5pt] {$2$} ++(0,0.95) node[above,inner sep=2pt] {$Y_{7:6}$};

\draw[->] (11.4,-15.6) -- node[above,inner sep=2pt] {$1$} (l0.east);
\node[anchor=west,inner sep=2pt] at (11.45,-15.6) {seed $1$};
\draw[->] (l0.west) -- node[above,inner sep=2pt] {$1$} (l1.east);
\draw[->] (l1.west) -- node[above,inner sep=2pt] {$1$} (l2.east);
\draw[->] (l2.west) -- ++(-1.4,0) node[left,inner sep=2pt] {$X{=}Y$};

\node[anchor=west] at (-1.6,-17.2) {the cascade is the dedicated carry/AND chain: each LUT6 ANDs its own chunk verdict into the incoming bit};

\end{circuitikz}
\end{document}
```

**Reduce the arithmetic statement to a bitwise one, and say why that step is legal.** The operands are two $w$-bit unsigned integers $X=\sum_{i=0}^{w-1}2^i x_i$ and $Y=\sum_{i=0}^{w-1}2^i y_i$; the output is a single bit. Positional binary representation at a fixed width is *unique* — the map from $\{0,1\}^w$ to $[0,2^w)$ is a bijection ([[Number Formats]]) — so equality of the two values is equality of the two bit vectors, with no carries and no borrows to reason about. Bit $i$ agrees exactly when $\overline{x_i\oplus y_i}=1$, since XOR is the difference indicator on $\mathbb{F}_2$ and XNOR its complement. Conjoining over all positions:

$$X=Y \;\Longleftrightarrow\; \bigwedge_{i=0}^{w-1}E_i,\qquad E_i=\overline{x_i\oplus y_i}$$

Every $E_i$ is $1$ bit and every one of them is computed in parallel from disjoint inputs — the leaf layer is $w$ independent XNOR2 gates with no interaction whatsoever. That absence of interaction is the whole note: it is what a magnitude comparison cannot have, because there the value of bit $i$ only matters *conditionally* on the bits above it.

**Name the algebra, because the tree shape is a consequence of it and not a design choice.** $(\{0,1\},\wedge)$ is a commutative monoid with identity $1$ ([[Boolean Algebra]]). Associativity means the conjunction may be bracketed any way at all, so the chain

$$(\cdots((E_0\wedge E_1)\wedge E_2)\cdots)\wedge E_{w-1}$$

may be reassociated into the balanced tree of panel (a) at **no cost in gates**: every AND2 consumes two live values and emits one, lowering the live count by exactly $1$, so going from $w$ values to $1$ takes exactly $w-1$ gates in any bracketing. Depth is the only free variable and balancing minimises it. Commutativity buys the second thing: the leaves may be *permuted* as well as rebracketed, so the pairing can follow physical adjacency rather than bit index.

$$\text{cost } = w \text{ XNOR2} + (w-1) \text{ AND2},\qquad \text{depth } = 1+\lceil\log_2 w\rceil$$

**Apply De Morgan to get the form that actually gets built.** Complementing both sides of the identity,

$$\bigwedge_i \overline{x_i\oplus y_i} \;=\; \overline{\bigvee_i (x_i\oplus y_i)}$$

by De Morgan's law, which reads: *the numbers are equal iff no bit differs*. This is the version that maps onto silicon, because the difference indicators $x_i \oplus y_i$ feed a wide OR whose complement is a single inverting gate — and static CMOS has NOR natively while it has no AND at all, only NAND followed by an inverter. Whether the netlist ends up alternating NAND/NOR levels or using one wide dynamic OR is a library question; the Boolean content is identical and neither form changes the $w-1$ node count.

**Derive the cheapness from the general comparator recurrence rather than asserting it.** The divide-and-conquer comparator of [[Binary Tree Comparator]] splits at $k=\lceil w/2\rceil$ and carries the pair $(G,E)$ with $G=[X>Y]$, $E=[X=Y]$ across every edge, recombining by

$$G_{H:L}=G_H\vee(E_H\wedge G_L),\qquad E_{H:L}=E_H\wedge E_L$$

Read the second equation on its own: **$E$ is closed** — it refers to no $G$ anywhere. So if only equality is wanted, delete $G$ from the whole tree; the recurrence that remains is the plain AND reduction above, one bit per edge instead of two, and the leaves collapse from $G_i=x_i\wedge\overline{y_i}$, $E_i=\overline{x_i\oplus y_i}$ to just the XNOR. The converse does not hold: $G_{H:L}$ needs $E_H$, so ordering can never shed a bit. The source states the asymmetry directly (p. 147) — with the sole exception of the root, every node of an ordering tree must still distinguish $X_H<Y_H$, $X_H=Y_H$ and $X_H>Y_H$, which is three cases and therefore two bits.

> [!important] Equality is a reduction; every other comparison is a prefix scan
> The comparator's combining operator $\circ$ on $(G,E)$ pairs is associative — that is what licenses any prefix topology — but it is emphatically **not commutative**, since $(G,E)$ tuples must stay in bit order for "the high half decides" to mean anything. That is precisely why ordering inherits the adder's carry chain: $\circ$ is the $(g,p)$ operator of [[Adders]] under a rename. Equality's operator is $\wedge$ on single bits, which *is* commutative, so the bit positions carry no order at all and there is nothing for a carry to propagate. This is the structural reason equality has no chain, no leftmost-path argument and no prefix-tree taxonomy: it is not a scan problem that happens to be cheap, it is a different problem.

**Recount the cost on an FPGA, where the unit is inputs consumed rather than gates.** A LUT-$\alpha$ evaluates *any* function of at most $\alpha$ inputs for one fixed price, so the gate-level count above is the wrong currency ([[Lookup-Tables]], [[FPGAs]]). Equality needs one output bit per chunk, so all six inputs of a LUT6 may be spent on data: three bits of $X$ and three of $Y$, giving the verdict $X_j=Y_j$ for a 3-bit chunk in one LUT. Chaining those chunk verdicts on the device's dedicated cascade — panel (b) — costs $\lceil w/3\rceil$ LUTs total (p. 148). Compare [[Fast Carry Chain Comparator]], which manages only 2-bit chunks and $\lceil w/2\rceil$ LUTs: an ordering chunk must emit **two** bits $x'_j,y'_j$ into the hard full adder, and in the BLE model $\mathrm{FA}(p(a,b,c,d),q(a,b,c,d),c_i)$ of Sect. 5.4 (p. 125) both functions see the same four inputs, hence 2-bit chunks. The $3$ versus $2$ is not a technology accident; it is the one-bit-per-edge result of the previous paragraph, cashed in.

**Note when the chain beats the tree, which is most of the time.** The book's verdict (p. 148) is that this cascaded form also gives the best possible *latency* for widths up to 64 bits — a $\lceil\log_2 w\rceil$-deep tree loses to a $\lceil w/3\rceil$-long chain there because the tree's edges cross general routing while the cascade rides a dedicated path. The asymptotics say tree; the constants say chain, and they keep saying it until $w$ is large enough that $w/3$ chain stages finally exceed $\log_2 w$ hops of soft routing. On an ASIC the crossover never happens in that direction and the balanced tree of panel (a) is simply correct.

**Fix one operand and the leaf layer disappears entirely.** With $Y=C$ constant, substitute the known $c_i$ into $E_i$: by *complement of a constant* and *identity of AND*, $E_i=\overline{x_i}$ when $c_i=0$ and $E_i=x_i$ when $c_i=1$. Every XNOR becomes a wire or an inverter, so $X=C$ is one $w$-literal product term — a single AND of literals whose polarities are the bits of $C$. The gain on FPGA is again in packing rather than gate count, since a LUT-$\alpha$ freed from carrying $Y$ can see $\alpha$ bits of $X$ (p. 149); see [[Constant Comparator]].

> [!warning] The $\lceil w/6\rceil$ that follows from that is mine, not the book's
> The source gives $\lceil w/3\rceil$ for the variable equality comparator and states the constant-case chunk-widening argument only in general terms ("each LUT-$\alpha$ may now compare $\alpha$ bits of the input with the constant", p. 149). Doubling $3\to 6$ for constant equality on a LUT6 follows from those two statements but is not tabulated anywhere in Chapter 6, and it assumes the cascade input does not itself consume a LUT input. Confirm against a real device before quoting it.

> [!warning] Chapter 6 reports no measured numbers at all
> No synthesis table, no nanosecond delays, no slice or FF counts. Every figure above is a LUT-count formula or one of the chapter's two crossover statements ("best latency up to 64 bits", "several thousand bits"). Anything finer needs outside research.

$$\boxed{\;X=Y \iff \bigwedge_{i=0}^{w-1}\overline{x_i\oplus y_i} \;=\; \overline{\bigvee_{i=0}^{w-1}(x_i\oplus y_i)};\quad w\ \text{XNOR2}+(w{-}1)\ \text{AND2},\ \text{depth}\ 1+\lceil\log_2 w\rceil;\quad \lceil w/3\rceil\ \text{LUT6}\;}$$

**When it breaks**

- **A random testbench never exercises the interesting case.** Two independent uniform $w$-bit operands are equal with probability $2^{-w}$ — at $w=32$ a billion-vector sweep sees equality essentially never, so a sweep that does not *inject* equal pairs verifies only the constant function $0$. This is a live verification hazard, not a theoretical one; the simulation below forces equality on a third to a half of its vectors for exactly this reason.
- **Bit-order bugs are invisible.** Because $\wedge$ is commutative, permuting or reversing the bit indices computes the identical function. Simulation cannot catch a reversed bus here, in exact analogy with a parity tree and in exact contrast with an adder. Only a width or a *dropped* bit shows up.
- **Equality does not give you ordering.** Getting $X=Y$ cheaply buys nothing towards $X<Y$; the ordering tree keeps its two bits per edge regardless. Asking for less pays off in this one direction only — take [[Magnitude Comparator]] at full price if you need the sign of the difference.
- **Bit-pattern equality is not IEEE-754 equality.** $-0$ and $+0$ have different encodings but must compare equal, and a NaN must compare unequal to itself; both defeat a raw XNOR tree, which is a *representation* comparison. Only formats with a unique encoding per value — plain unsigned, and two's complement at a fixed width — let this circuit stand in for value equality ([[Number Formats]]).
- **The log stops paying long before the area does.** Depth grows as $\log_2 w$ and area as $w$, so doubling the width adds one level and $w$ gates. Past a few hundred bits the tree is an area and wire problem, and the answer is a chunked or pipelined structure, not further depth reduction — the same crossover [[Two-Level Fast Carry Comparator]] exploits for ordering.

**RTL (Spade)**

```spade
fn and_tree<#uint N>(e: [bool; N]) -> bool {
    gen if N == 1 {
        e[0]
    } else {
        let (lo, hi) = e.split_at::<{N / 2}>();
        and_tree(lo) && and_tree(hi)
    }
}

fn eq<#uint W>(x: uint<W>, y: uint<W>) -> bool {
    and_tree::<W>((~(x ^ y)).as_bits())
}
```

`~(x ^ y)` is the XNOR layer of panel (a) — `^` is the bitwise XOR on `uint<W>` and `~` the bitwise complement, so this one expression is all $w$ leaf gates; `.as_bits()` presents them as `[bool; W]` with element $0$ the LSB, though by the commutativity above that ordering is the one thing here that cannot be got wrong. `split_at::<{N/2}>()` *is* the bracketing: halving the leaf set at every step emits the balanced tree, depth $\lceil\log_2 W\rceil$ with $W-1$ AND2, one per `gen if` arm below the leaf. Both are `fn`, so the block is purely combinational — every level is logic depth, not a pipeline stage. There is no width growth anywhere: $W$ bits in, $1$ bit out. Synthesis will not preserve the shape: on FPGA the mapper rebuilds it as the $\lceil w/3\rceil$ cascade of panel (b), and on ASIC it will alternate NAND/NOR levels per the De Morgan form above.

Simulated against a behavioural `==` reference at $W=8$ and $W=32$: 8 named vectors (including the asymmetric $\mathtt{0x01}$ vs $\mathtt{0x80}$ and its transpose), 24 one-bit-difference vectors sweeping the flipped position across all 8 positions from three different bases, plus 8000 random vectors with equal pairs deliberately injected — 4000 at $W=8$ with $Y=X$ half the time, and 4000 at $W=32$ split between equal, equal-but-one-bit-flipped, and independent. All pass. A negative control with `&&` replaced by `||` fails 4668 of them, which is what makes the sweep worth running.

**Related Notes**

- [[Binary Tree Comparator]] – extends: carries the full $(G,E)$ pair per edge; this note is what remains when $G$ is deleted, which the recurrence permits and the reverse does not.
- [[Magnitude Comparator]] – compares: the predicate that cannot shed a bit, and therefore inherits the adder's carry chain instead of a plain reduction.
- [[Fast Carry Chain Comparator]] – compares: same device, same cascade, 2-bit chunks instead of 3 because ordering needs two bits out of each chunk.
- [[Constant Comparator]] – extends: freezing $Y$ deletes the XNOR layer outright and widens the chunk.
- [[Lookup-Tables]] – depends-on: supplies the "cost is inputs consumed, not gates" rule that turns $w-1$ AND2 into $\lceil w/3\rceil$ LUT6.
- [[Boolean Algebra]] – depends-on: associativity licenses the tree, commutativity licenses the permutation, De Morgan gives the NOR-of-XOR dual.
- [[XOR Parity Tree]] – compares: the same leaf-and-reduce skeleton with $\oplus$ in place of $\wedge$; both are permutation-invariant, but AND has a controlling value and XOR has none, so this tree self-mutes where that one toggles every level.
- [[Two's-Complement Comparator]] – counter-example: the MSB-exchange trick that ordering needs for signed operands is a no-op here, since equal bit patterns are equal values in any fixed format.
- [[Choosing a Comparator]] – compares: where this sits against every sibling in the folder.
- [[Combinational Logic]] – supports: the wider family of leaf-and-reduce blocks this belongs to.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 6 "Fixed-Point Comparison", pp. 145–150.
  - Sect. 6.1.2 Area and Delay Considerations, p. 146 — the AND-of-XNORs identity and the $\lceil\log_2 w\rceil$ tree.
  - Sect. 6.2 Basic Binary Tree Comparison and Table 6.1, p. 147 — the $(G,E)$ recurrence, the collapse to one bit for equality, and the explicit statement that ordering admits no such simplification.
  - Sect. 6.3.1 Exploiting Fast Carry Logic and Table 6.2, p. 148 — $\lceil w/3\rceil$ LUT6 for equality on recent AMD devices, $\lceil w/2\rceil$ for ordering, best latency to 64 bits.
  - Sect. 6.3.3 Comparing to a Constant, p. 149 — the LUT-$\alpha$ chunk-widening argument.
  - Sect. 5.4 (BLE structure $\mathrm{FA}(p,q,c_i)$), p. 125, cited from p. 148.
- [[2.2) Comparators]] — §Area and delay considerations, §The basic binary tree comparator, §FPGA-specific implementations / Exploiting the fast carry logic.
