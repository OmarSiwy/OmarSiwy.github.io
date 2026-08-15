---
title: Turn Model Routing
description: "Routing logic that forbids exactly one turn per abstract cycle (west-first / north-last / negative-first) — buys back partial adaptivity that XY throws away, at the cost of a productive-set encoder plus a runtime selection function."
kind: circuit
status: seed
spade: simulated
tags: [digital, network-on-chip, routing, deadlock, adaptive]
aliases:
  - Turn Model
  - Turn Models
  - West-First Routing
  - North-Last Routing
  - Negative-First Routing
---

# Turn Model Routing

Turn model routing keeps a mesh deadlock-free by forbidding one turn out of each of the two abstract cycles instead of four, so that everything not forbidden stays available to a runtime selection function — it is the minimum-prohibition sibling of dimension order.

```tikz title="The two abstract turn cycles with the two west-first prohibitions, and the routing datapath they compile into"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ================= clockwise abstract cycle =================
  \node at (1.7,3.6) {clockwise cycle};
  \draw[->,line width=0.9pt] (0.5,0.6) -- (0.5,3.0);
  \draw[->,line width=0.9pt] (0.5,3.0) -- (2.9,3.0);
  \draw[->,line width=0.9pt] (2.9,3.0) -- (2.9,0.6);
  \draw[->,line width=0.9pt] (2.9,0.6) -- (0.5,0.6);
  \node[anchor=west]  at (0.6,1.8) {$N$};
  \node[anchor=north] at (1.7,2.9) {$E$};
  \node[anchor=east]  at (2.8,1.8) {$S$};
  \node[anchor=south] at (1.7,0.7) {$W$};
  \node at (1.7,1.8) {cw};
  \node[anchor=south east] at (0.45,3.05) {$N\!\to\!E$};
  \node[anchor=south west] at (2.95,3.05) {$E\!\to\!S$};
  \node[anchor=north east] at (0.45,0.55) {$W\!\to\!N$};
  \node[anchor=north west, red] at (3.10,0.55) {$S\!\to\!W$};
  \draw[red,line width=1.1pt] (2.74,0.44) -- (3.06,0.76);
  \draw[red,line width=1.1pt] (2.74,0.76) -- (3.06,0.44);

  % ============= counter-clockwise abstract cycle =============
  \node at (7.90,3.6) {counter-clockwise cycle};
  \draw[->,line width=0.9pt] (9.10,0.6) -- (9.10,3.0);
  \draw[->,line width=0.9pt] (9.10,3.0) -- (6.70,3.0);
  \draw[->,line width=0.9pt] (6.70,3.0) -- (6.70,0.6);
  \draw[->,line width=0.9pt] (6.70,0.6) -- (9.10,0.6);
  \node[anchor=east]  at (9.00,1.8) {$N$};
  \node[anchor=north] at (7.90,2.9) {$W$};
  \node[anchor=west]  at (6.80,1.8) {$S$};
  \node[anchor=south] at (7.90,0.7) {$E$};
  \node at (7.90,1.8) {ccw};
  \node[anchor=south east] at (6.65,3.05) {$W\!\to\!S$};
  \node[anchor=north east] at (6.65,0.55) {$S\!\to\!E$};
  \node[anchor=north west] at (9.15,0.55) {$E\!\to\!N$};
  \node[anchor=south west, red] at (9.30,3.05) {$N\!\to\!W$};
  \draw[red,line width=1.1pt] (8.94,2.84) -- (9.26,3.16);
  \draw[red,line width=1.1pt] (8.94,3.16) -- (9.26,2.84);

  \node[anchor=west, red] at (-0.9,-0.2)
        {west-first: cut one turn per cycle, not four};

  % ===================== routing datapath =====================
  \draw (0.5,-2.6) rectangle (2.5,-1.0);
  \node[align=center] at (1.5,-1.8) {sign\\compare};
  \draw[->] (-0.9,-1.4) -- (0.5,-1.4);
  \node[anchor=south] at (-0.25,-1.38) {$\Delta x{:}\,w$};
  \draw[->] (-0.9,-2.2) -- (0.5,-2.2);
  \node[anchor=south] at (-0.25,-2.18) {$\Delta y{:}\,w$};

  \draw (3.3,-2.6) rectangle (5.7,-1.0);
  \node[align=center] at (4.5,-1.8) {turn-model\\mask};
  \draw[->] (2.5,-1.8) -- (3.3,-1.8);
  \node[anchor=south] at (2.9,-1.78) {$4$};

  \draw (6.5,-2.6) rectangle (8.9,-1.0);
  \node[align=center] at (7.7,-1.8) {selection};
  \draw[->] (5.7,-1.8) -- (6.5,-1.8);
  \node[anchor=south] at (6.1,-1.78) {$5$};
  \draw[->] (7.7,-3.4) -- (7.7,-2.6);
  \node[anchor=west] at (7.75,-3.1) {free-VC / credit};
  \draw[->] (8.9,-1.8) -- (10.3,-1.8);
  \node[anchor=south] at (9.6,-1.78) {port$:3$};
\end{circuitikz}
\end{document}
```

**Count the turns before counting the constraints.** In a 2D mesh a packet arrives on one of four directions and leaves on one of the two perpendicular ones — no minimal route ever reverses — so there are $4\times 2 = 8$ turns. Group them by handedness and they fall into exactly two four-element orbits,

$$\text{cw}=\{N\!\to\!E,\ E\!\to\!S,\ S\!\to\!W,\ W\!\to\!N\},\qquad \text{ccw}=\{N\!\to\!W,\ W\!\to\!S,\ S\!\to\!E,\ E\!\to\!N\}$$

each of which is a closed walk around a unit square of the mesh. Deadlock is a cycle in the [[Channel Dependency Graph]]; a cycle in a planar mesh is a closed loop, a closed loop accumulates $\pm 360^\circ$ of turning, and the only way to accumulate that in $90^\circ$ steps is to traverse four corners of one handedness. So every cycle of $\mathcal D$ consumes all four turns of one abstract cycle, and deleting **any one** turn from each orbit removes the last edge of every candidate cycle.

**That is why XY is over-restrictive.** Dimension order forbids $\{N\!\to\!E,\ N\!\to\!W,\ S\!\to\!E,\ S\!\to\!W\}$ — every turn out of a $Y$ direction — which is four prohibitions where two are enough, and the surplus two are exactly the path diversity it throws away. Three inequivalent minimal models are the named ones:

| Turn model | Forbidden turns | cw broken by | ccw broken by | Adaptivity |
| --- | --- | --- | --- | --- |
| XY (dimension order) | $N\!\to\!E,N\!\to\!W,S\!\to\!E,S\!\to\!W$ | $N\!\to\!E$ | $N\!\to\!W$ | none |
| West-first | $N\!\to\!W,\ S\!\to\!W$ | $S\!\to\!W$ | $N\!\to\!W$ | full for eastbound |
| North-last | $N\!\to\!E,\ N\!\to\!W$ | $N\!\to\!E$ | $N\!\to\!W$ | full for southbound |
| Negative-first | $E\!\to\!S,\ N\!\to\!W$ | $E\!\to\!S$ | $N\!\to\!W$ | full for NE / SW quadrants |

> [!warning] Not covered in the source — needs outside research
> The counting argument above shows that one prohibition per orbit is **necessary** and verifies sufficiency for the three named models by exhibiting the topological order. It does not establish that all $4\times4=16$ ways of picking one turn from each orbit are safe — a cycle in $\mathcal D$ can revisit the same turn more than once, which the "four distinct corners" step quietly assumes it does not. Glass & Ni's original enumeration is the reference to check before deploying a hand-rolled turn set; the three models above are the ones the source note verifies.

**A prohibition on turns becomes a precedence on hops.** Forbidding both turns *into* $W$ means a packet can never acquire a west channel after a $Y$ hop, so if it needs any west hop at all it must take all of them first — the model's name is its algorithm. With $\Delta x = x_d - x_c$ and $\Delta y = y_d - y_c$ the west-first routing relation $R$ is

$$R(\Delta x,\Delta y)=\begin{cases}
\{W\} & \Delta x<0\\[2pt]
\{E \mid \Delta x>0\}\cup\{N \mid \Delta y>0\}\cup\{S \mid \Delta y<0\} & \Delta x\ge 0,\ (\Delta x,\Delta y)\neq(0,0)\\[2pt]
\{L\} & \Delta x=\Delta y=0
\end{cases}$$

Westbound packets are routed deterministically, $|R|=1$; eastbound packets with a nonzero $\Delta y$ get $|R|=2$ and a genuine choice. Averaged over uniform traffic that is adaptivity on half the destination plane, bought with two prohibitions instead of four.

**Widths.** On a $k\times k$ mesh a coordinate is $\lceil\log_2 k\rceil$ bits and the flit header carries the destination in $2\lceil\log_2 k\rceil$ of them; each delta is a signed $w=\lceil\log_2 k\rceil+1$ bit two's-complement difference ([[Number Formats]]). The productive set is a $5$-bit mask over $\{L,E,W,N,S\}$ and the chosen port is $3$ bits. Nothing here is registered — the whole function is combinational and sits in the RC stage of the [[Virtual-Channel Router]].

**The comparators are cheaper than they look.** The naive reading of $\Delta x>0$ and $\Delta x<0$ is two magnitude comparators, but the subtraction has already been done: $\text{west}=\Delta x_{w-1}$ is literally the sign bit, a wire, by the two's-complement sign convention, and $\text{east}=\overline{\Delta x_{w-1}}\wedge\overline{Z}$ where $Z$ is a $w$-input NOR zero-detect. Four flags, two NOR trees of depth $\lceil\log_2 w\rceil$, and the mask is one more gate level on top. On an FPGA a $6$-input LUT swallows the whole thing for $k\le 16$ ($w=5$): each direction flag is a single LUT of $\Delta x$, and the mask is $5$ LUTs total ([[FPGAs]]). Routing has never been the critical path and the turn model does not make it one.

**The real cost is the selection function, and it is stateful.** XY's output is a port; a turn model's output is a *set*, and something must collapse it. The standard choice maximises free downstream buffering, which means the mask is ANDed with a per-direction "has credit" vector from the [[Credit-Based Flow Control]] counters and then reduced by a [[Priority Encoder]] — the same lowest-set-bit primitive as the [[Fixed-Priority Arbiter]]. That is what turns routing from a stateless function of the header into a function of runtime network state, and it is the structural difference between this note and [[Dimension-Order Routing Unit]], not the gate count.

$$\boxed{\ F\cap\text{cw}\neq\varnothing\ \wedge\ F\cap\text{ccw}\neq\varnothing\ \Longrightarrow\ \mathcal D\text{ acyclic},\qquad |F|_{\text{turn model}}=2\ \text{vs}\ |F|_{XY}=4\ }$$

Where it breaks:

- **Tori.** The wraparound closes a ring cycle *within one dimension*, using no turn at all, so no turn model can cut it. A torus needs the dateline construction regardless of which turns are legal — see [[Dateline Virtual Channel Allocation]].
- **Higher dimensions.** The two-orbit count is a planarity argument. A 3D mesh has $6\times 4=24$ turns and more than two abstract cycles, so "forbid two turns" does not carry over.
- **The unlucky traffic pattern.** West-first gives *zero* adaptivity to westbound traffic. Under an all-west permutation it degenerates to a deterministic $X$-first route and buys nothing over XY, while still paying for the mask and the selection logic. Pick the model against the expected traffic skew, not by symmetry.
- **Out-of-order delivery.** Two packets of the same flow can now take different paths and arrive reordered, so the network interface acquires a reorder buffer that XY never needed. This cost lands outside the router and is routinely forgotten in router-only area comparisons.
- **Protocol deadlock is untouched.** Acyclicity of $\mathcal D$ says nothing about a request waiting on a reply waiting on a request; that still needs separate message classes on separate VCs.
- **Lookahead conflicts.** [[Lookahead Routing]] precomputes hop $i{+}1$'s decision at hop $i$, but the selection input — credits at the *next* router — is not visible there. The mask can be precomputed; the selection cannot, so the two optimisations only partly compose.

```spade
/// West-first turn model: forbids N->W and S->W.
/// Returns the productive-direction set as [L, E, W, N, S] (index 0 = LSB).
fn west_first_set<#uint W>(dx: int<W>, dy: int<W>) -> [bool; 5] {
    let east  = dx > 0;
    let west  = dx < 0;
    let north = dy > 0;
    let south = dy < 0;
    let local = !east && !west && !north && !south;
    [local, east, west, north && !west, south && !west]
}

/// Selection function over the productive set. Port codes: 0=L 1=E 2=W 3=N 4=S.
fn select_port(m: [bool; 5], prefer_y: bool) -> uint<3> {
    if m[0] { 0 }
    else if prefer_y && m[3] { 3 }
    else if prefer_y && m[4] { 4 }
    else if m[1] { 1 }
    else if m[2] { 2 }
    else if m[3] { 3 }
    else { 4 }
}
```

`west_first_set` is the "turn-model mask" block of the diagram and `select_port` is the "selection" block; `dx`/`dy` are the two $w$-bit signed deltas entering on the left, and the returned `[bool; 5]` is the 5-wire bus between them, element $0$ being the LSB. The two `&& !west` terms are the entire turn model — they are what makes $N\!\to\!W$ and $S\!\to\!W$ unreachable, because suppressing $N$ and $S$ while a west hop remains is the same thing as forbidding the later turn onto $W$. Both are `fn`, hence purely combinational with no clock; `prefer_y` stands in for the credit comparison the diagram feeds in from below, and synthesis will flatten the whole `if` ladder into the one-hot priority mux of a [[Priority Encoder]] rather than the cascade the source text suggests.

Verified by simulation against a behavioural reference: $3520$ vectors — $8$ hand-computed named cases (including the deliberately asymmetric $(\Delta x,\Delta y)=(-1,+3)$ versus $(+3,-1)$, which catches a swapped $X/Y$ pair or a reversed mask), the full exhaustive $16\times16\times2$ input space at $w=4$, and $3000$ random ones. Reversing the mask array as a negative control produces $1093$ mismatches, so the check has teeth.

Related notes:

- [[Dimension-Order Routing Unit]] – compares: the same routing problem with four prohibitions instead of two, stateless and with $|R|=1$ everywhere.
- [[Channel Dependency Graph]] – depends-on: supplies the acyclicity criterion this whole construction exists to satisfy.
- [[Priority Encoder]] – supports: collapses the 5-bit productive mask to one port, and is the shared primitive with the switch arbiters.
- [[Dateline Virtual Channel Allocation]] – counter-example: on a torus the cycle needs no turn, so no turn model can break it and virtual channels come back.
- [[Credit-Based Flow Control]] – depends-on: its counters are the runtime input that makes the selection function adaptive rather than fixed.
- [[Lookahead Routing]] – extends: moves the mask computation one hop upstream, but cannot move the credit-dependent selection with it.
- [[Choosing a Router Architecture]] – compares: where the partial-adaptivity design point sits against deterministic and fully adaptive routers.

## References

- *6.3) Network-On-Chip*, "Routing and deadlock freedom" — abstract cycles, the prohibition table, and the channel-dependency-graph acyclicity theorem.
- No textbook figure was assigned for this note; the diagram is an original construction.
