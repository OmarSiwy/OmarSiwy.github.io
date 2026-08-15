---
title: Wavefront Allocator
description: "A pV x p priority-wave matching array that finds a maximal matching in one pass — better crossbar utilisation than separable allocation, at a longer combinational wave through the array."
kind: circuit
source: "6.3) Network-On-Chip §Router microarchitecture — no book source"
status: seed
spade: simulated
tags: [digital, network-on-chip, allocator, arbiter, matching]
aliases:
  - Wavefront Arbiter
  - Wave-Front Allocator
  - Wavefront Allocators
  - Wavefront Arbitration
  - Wavefront Matching Array
---

# Wavefront Allocator

A switch allocator built as a two-dimensional array of one-bit cells that pass "this input is still free" and "this output is still free" tokens rightward and downward, so that the grant matrix it settles to is a *maximal* matching — the one property a [[Separable Input-First Allocator]] cannot promise at any price.

```tikz title="Wavefront allocator: a pV x p array of one-bit cells, row and column free-tokens, and the cell that consumes them"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % ================= the pV x p cell array =================
  \foreach \i in {0,1,2,3}{
    \foreach \j in {0,1,2}{
      \pgfmathsetmacro\cx{2.0*\j}
      \pgfmathsetmacro\cy{-1.35*\i}
      \draw (\cx-0.5,\cy-0.42) rectangle (\cx+0.5,\cy+0.42);
      \node at (\cx,\cy) {$c_{\i\j}$};
    }
  }

  % row (input) tokens: enter at column 0, ripple east
  \foreach \i in {0,1,2,3}{
    \pgfmathsetmacro\cy{-1.35*\i}
    \draw[->] (-1.7,\cy) -- (-0.5,\cy);
    \node[anchor=south] at (-1.1,\cy+0.03) {$1$};
    \foreach \j in {0,1}{
      \pgfmathsetmacro\cx{2.0*\j}
      \draw[->] (\cx+0.5,\cy) -- (\cx+1.5,\cy);
    }
    \draw[->] (4.5,\cy) -- (5.3,\cy);
    \node[ocirc] at (5.4,\cy) {};
  }
  \node[anchor=west,align=left] at (5.7,-2.02) {row tokens $x$\\ dropped:\\ no wrap $\Rightarrow$\\ acyclic};
  \node[anchor=east] at (-1.75,0.0) {$x_{i0}=1$};

  % column (output) tokens: enter at row 0, ripple south
  \foreach \j in {0,1,2}{
    \pgfmathsetmacro\cx{2.0*\j}
    \draw[->] (\cx,2.4) -- (\cx,0.42);
    \node[anchor=west] at (\cx+0.05,2.0) {$1$};
    \foreach \i in {0,1,2}{
      \pgfmathsetmacro\cy{-1.35*\i}
      \draw[->] (\cx,\cy-0.42) -- (\cx,\cy-0.93);
    }
    \draw[->] (\cx,-4.47) -- (\cx,-5.0);
    \node[ocirc] at (\cx,-5.1) {};
  }
  \node[anchor=south] at (2.0,2.55) {$y_{0j}=1$};

  % the wave: cells with i+j = d decide together
  \draw[dashed,gray] (-0.75,-0.9) -- (1.35,1.2);
  \draw[dashed,gray] (-0.75,-2.25) -- (3.35,1.2);
  \draw[dashed,gray] (0.6,-3.6)   -- (4.65,0.45);
  \node[anchor=south west,gray] at (1.2,1.15) {$d\!=\!1$};
  \node[anchor=south west,gray] at (3.2,1.15) {$d\!=\!2$};
  \node[anchor=south west,gray] at (4.5,0.4)  {$d\!=\!3$};
  \node[anchor=north,align=center] at (2.0,-5.6)
    {$pV$ rows $\times$ $p$ columns, one cell per (input VC, output port) pair;\\
     cells on one anti-diagonal $i+j=d$ decide together\\
     every drawn wire is $1$ bit; the grant matrix $g$ is $pV\!\cdot\!p$ bits};

  % ================= one cell, unrolled =================
  \begin{scope}[xshift=10.0cm,yshift=-1.4cm]
    \draw[dashed] (-1.7,-2.8) rectangle (5.8,2.9);
    \node[anchor=north west] at (-1.65,2.85) {cell $c_{ij}$};

    \node[and port,scale=0.8] (a1) at (0.6,1.55) {};
    \node[and port,scale=0.8] (a2) at (2.1,1.15) {};
    \node[not port,scale=0.8] (n1) at (3.1,0.2)  {};
    \node[and port,scale=0.8] (a3) at (4.6,0.9)  {};
    \node[and port,scale=0.8] (a4) at (4.6,-1.5) {};

    % primary inputs, staggered so the labels never touch
    \draw[->] (-1.7,2.0)  -- (-0.95,2.0)  |- (a1.in 1);
    \draw[->] (-1.7,1.35) -- (-0.75,1.35) |- (a1.in 2);
    \draw[->] (-1.7,0.55) -- (-0.45,0.55) |- (a2.in 2);
    \node[anchor=south] at (-1.3,2.06) {$x_{ij}$};
    \node[anchor=south] at (-1.3,1.41) {$y_{ij}$};
    \node[anchor=south] at (-1.3,0.61) {$r_{ij}$};
    \draw (a1.out) -- (a2.in 1);

    % grant leaves, and also kills both tokens
    \draw (a2.out) -- (2.8,1.15);
    \fill (2.7,1.15) circle (1.3pt);
    \draw[->] (2.7,1.15) -- (2.7,2.4) -- (5.8,2.4);
    \node[anchor=south east] at (5.75,2.43) {$g_{ij}$};
    \draw (2.8,1.15) -- (2.8,0.2) -- (n1.in);

    % not-g fans out to both token gates
    \draw (n1.out) -- (3.8,0.2);
    \fill (3.8,0.2) circle (1.3pt);
    \draw (3.8,0.2) |- (a3.in 2);
    \draw (3.8,0.2) -- (3.8,-1.9) |- (a4.in 2);

    % x passes through
    \fill (-1.5,2.0) circle (1.3pt);
    \draw (-1.5,2.0) -- (-1.5,-0.9) -- (3.55,-0.9) |- (a3.in 1);
    \draw[->] (a3.out) -- (5.8,0.9);
    \node[anchor=south east] at (5.75,0.93) {$x_{i,j+1}$};

    % y passes through
    \fill (-1.35,1.35) circle (1.3pt);
    \draw (-1.35,1.35) -- (-1.35,-2.5) -- (3.35,-2.5) |- (a4.in 1);
    \draw[->] (a4.out) -- (5.8,-1.5);
    \node[anchor=south east] at (5.75,-1.47) {$y_{i+1,j}$};
  \end{scope}

  \node[anchor=north west,align=left] at (8.3,-4.5)
    {$g_{ij}=r_{ij}\wedge x_{ij}\wedge y_{ij}$ --- a token is consumed only by a grant,\\
     so at most one cell per row and one per column ever fires};

\end{circuitikz}
\end{document}
```

**Fix what switch allocation actually asks for, because it is a graph problem and not an arbitration problem.** In the [[Virtual-Channel Router]] the SA stage sees a request matrix $R\in\{0,1\}^{pV\times p}$, where $r_{ij}=1$ iff input virtual channel $i$ holds a flit, has already won an output VC on physical port $j$, and has a downstream credit. $R$ is $pV\!\cdot\!p$ bits — $100$ for the canonical $p=5$, $V=4$ router. A legal grant $G$ is a *matching*: at most one $1$ per row, because an input VC reads one flit per cycle out of its [[Virtual Channel Buffer]], and at most one $1$ per column, because a [[Crossbar Switch]] output can carry one flit per cycle. Throughput is $|G|$ flits that cycle, so the ideal is a *maximum* matching — and maximum bipartite matching is Hopcroft–Karp, $O(E\sqrt{|V|})$ *iterative* augmenting-path search, which is not a combinational circuit at any depth. Every shipped allocator therefore settles for a **maximal** matching: one where no request has both its row and its column still free. Maximal is within a factor $2$ of maximum, and that factor is the entire quality budget an allocator has to spend.

**The separable allocator does not even buy maximal, which is the gap this circuit closes.** Input-first separable allocation throws away information: the first rank of $V{:}1$ arbiters commits each input to one column *before* the second rank of $p{:}1$ arbiters knows whether that column is contested. Two rows and two columns are enough to see it fail. Take $R=\begin{smallmatrix}1&0\\1&1\end{smallmatrix}$. Row $0$ has only one request, so it asks for column $0$; row $1$'s input arbiter, whatever fixed or round-robin rule it uses, also picks exactly one column, and if it picks $0$ then column $0$'s output arbiter grants one of them and column $1$ goes idle while $r_{11}=1$ sits unserved. One grant where two were available, and the loss is structural, not a tie-break accident — see [[Separable Input-First Allocator]].

**Give every cell the two facts it needs and let them flow instead of being arbitrated.** Put one cell at each $(i,j)$. Feed it $r_{ij}$ plus two single-bit *tokens*: $x_{ij}$, meaning "input $i$ is still unmatched as of column $j$", and $y_{ij}$, meaning "output $j$ is still unmatched as of row $i$". The cell grants exactly when all three hold, and it consumes both tokens when it does:

$$g_{ij}=r_{ij}\wedge x_{ij}\wedge y_{ij},\qquad
x_{i,j+1}=x_{ij}\wedge\overline{g_{ij}},\qquad
y_{i+1,j}=y_{ij}\wedge\overline{g_{ij}}$$

with the boundary injection $x_{i0}=1$ for every row and $y_{0j}=1$ for every column. That is two AND2, one AND3 (or a third AND2, since $\wedge$ is associative) and one inverter per cell, $1$ bit on every wire, and $pV\!\cdot\!p$ cells in total. There is no arbiter anywhere in it — the mutual exclusion that an arbiter normally enforces is a *consequence* of the token algebra.

**Read the legality straight off the recurrence.** Unrolling $x_{i,j+1}=x_{ij}\wedge\overline{g_{ij}}$ from $x_{i0}=1$, and using the identity element $1\wedge z=z$ at each step, gives the closed form

$$x_{ij}=\bigwedge_{k<j}\overline{g_{ik}},\qquad y_{ij}=\bigwedge_{k<i}\overline{g_{kj}}$$

Since $g_{ij}\le x_{ij}$ by construction, any earlier grant in row $i$ forces $x_{ij}=0$ by $0\wedge z=0$ and hence $g_{ij}=0$; the same argument runs down the column. So $G$ is a matching *by construction*, with no checking logic. Maximality is the contrapositive of the same two closed forms: suppose $r_{ij}=1$ while row $i$ and column $j$ are both entirely ungranted. Then every $g_{ik}=0$ and every $g_{kj}=0$, so $x_{ij}=y_{ij}=1$ by the empty-conjunction identity, so $g_{ij}=1$ — contradicting that row $i$ is ungranted. No such $(i,j)$ exists, which is the definition of maximal.

**The name is the timing argument, not the topology.** Cell $(i,j)$ reads only $x_{i,j-1}$'s cell and $y_{i-1,j}$'s cell, so its inputs are ready after $d=i+j$ cell delays and no sooner. Every cell on the anti-diagonal $i+j=d$ has a distinct row *and* a distinct column, so those cells are mutually independent and all settle in the same gate delay — the array evaluates as a wave of $pV+p-1$ diagonal steps, not as $pV\!\cdot\!p$ sequential decisions. The critical path is

$$T_{\text{wf}}=\big(pV+p-1\big)\,t_{\text{cell}},\qquad t_{\text{cell}}\approx t_{\text{AND2}}$$

$24$ AND-delays for $p=5$, $V=4$, against $100$ cells of area. Set that against separable allocation, whose two arbiter ranks are prefix trees of $\lceil\log_2 V\rceil$ and $\lceil\log_2 p\rceil$ levels — about $5$ levels for the same router. The wavefront allocator is roughly five times deeper and buys a strictly better matching every cycle; whether that trade closes depends entirely on whether SA is the stage setting $T_{\text{clk}}$, and in a well-balanced router it usually is ([[Choosing a Router Architecture]]).

**Fairness is where the textbook version stops being synthesizable.** Injecting the tokens at column $0$ and row $0$, as drawn, makes input VC $0$ and output port $0$ permanent winners: a persistently requesting row $0$ starves every row below it, exactly the pathology [[Fixed-Priority Arbiter]] has and [[Round-Robin Arbiter]] exists to fix. Tamir & Chi's original array fixes it by injecting both tokens on a *diagonal group* $\{(i,(i+k)\bmod n)\}$ — $n$ cells, one per row and one per column, all highest priority together — and letting the tokens **wrap**: $x$ leaving the last column re-enters column $0$, $y$ leaving the last row re-enters row $0$. Rotating $k$ each cycle then gives round-robin fairness over the whole matrix. The cost is that each row becomes a combinational ring, and the netlist has a genuine cycle in it. Spade will not let you write one: the loop must be expressed as a `let` that reads a name defined further down, which is a hard name-resolution error, not a latch inference.

```
error: Use of undeclared name x1
  ┌─ wrapped.spade:2:22
  │
2 │     let g0 = r[0] && x1 && y[0];
  │                      ^^ Undeclared name
```

The three standard repairs are: unroll the ring by instantiating $2n$ columns and taking the grants from the second copy (correct, acyclic, and double the area and roughly double the depth); keep the ring in the RTL and declare it a false path so static timing analysis stops trying to trace it (what most silicon actually does, and it means the array is timed by hand); or drop the wrap entirely and rotate priority *outside* the array, by cyclically permuting the rows and columns of $R$ on the way in and un-permuting $G$ on the way out. The last one is the only version that is portable RTL, and it is what the Spade block below assumes.

**On FPGA the wave loses, and for a routing reason rather than a logic reason.** The cell is three inputs and three outputs, so it fits in one fractured 6-LUT with room to spare, and area is not the problem — but each of the $pV+p-1$ diagonal steps is a LUT delay *plus a general-routing hop*, and general routing dominates ([[Lookup-Tables]]). The row chain $x_{i,j+1}=x_{ij}\wedge\overline{g_{ij}}$ is structurally an AND-run, i.e. a carry chain, and could ride the hard `CARRY4`/`CARRY8` primitive — but the array is coupled in *two* directions and only one of them can be mapped onto a hard chain, so the column direction stays in soft routing and sets the delay anyway. On ASIC the picture reverses: the cell is a handful of transistors, the wiring is a short regular mesh with no long nets, and the layout is a tile array — which is the environment the structure was designed for. Prefer separable on fabric, consider wavefront on silicon.

$$\boxed{\ g_{ij}=r_{ij}\wedge x_{ij}\wedge y_{ij},\quad x_{ij}=\bigwedge_{k<j}\overline{g_{ik}},\quad y_{ij}=\bigwedge_{k<i}\overline{g_{kj}}\ \Longrightarrow\ G \text{ maximal},\ T=(pV{+}p{-}1)\,t_{\text{cell}}\ }$$

**When it breaks**

- **Maximal is not maximum, and the gap is a factor of two.** With $R=\{(0,0),(0,1),(1,0)\}$ the wave grants $(0,0)$ at $d=0$ and then blocks both remaining requests, giving $|G|=1$ where $\{(0,1),(1,0)\}$ gives $2$. No single-pass allocator escapes this; only iterating the allocation (request–grant–accept, run two or three times) narrows it, and each iteration costs another wave.
- **Depth is linear in $pV+p$, so it collapses as $V$ grows.** At $V=8$ and $p=5$ the wave is $44$ cell delays while the separable allocator has grown only to $\lceil\log_2 8\rceil+\lceil\log_2 5\rceil=6$. The wavefront allocator is a low-$V$, low-radix structure; past that the [[Separable Input-First Allocator]] wins on the only axis that matters, and [[Speculative Switch Allocation]] is the cheaper way to buy back a stage.
- **Fairness is not free.** Without the wrap it starves; with the wrap it is a combinational cycle. Budget either $2\times$ the array or a hand-timed false path, and note that the false-path version cannot be trusted to a synthesis flow you did not write the constraints for.
- **VC allocation is the wrong place for it.** The VA matrix is $pV\times pV$ — $400$ cells and a $39$-step wave for $p=5$, $V=4$. That is why VA runs once per packet rather than once per flit, and why nobody builds VA as a wavefront array.
- **It allocates ports, not channels.** $G$ says which input drives which crossbar output; it says nothing about which output VC, which credit, or which flit type. All of that has to have been resolved upstream, or $r_{ij}$ is a lie and the granted flit stalls at the far end anyway ([[Credit-Based Flow Control]]).

**RTL (Spade)**

```spade
/// One row of the array: the free-token x ripples east while the column
/// tokens yin come down from the row above.  Returns (grants, tokens out).
fn wf_row<#uint N>(r: [bool; N], x: bool, yin: [bool; N]) -> ([bool; N], [bool; N]) {
    gen if N == 0 {
        ([], [])
    } else {
        let g = r[0] && x && yin[0];
        let (gt, yt) = wf_row(r[1..N], x && !g, yin[1..N]);
        ([g].concat(gt), [yin[0] && !g].concat(yt))
    }
}

/// M = pV rows, N = p columns.  Row tokens are injected as 1 at column 0;
/// column tokens enter the top row as `y` and thread down through the rows.
fn wf<#uint M, #uint N>(r: [[bool; N]; M], y: [bool; N]) -> [[bool; N]; M] {
    gen if M == 0 {
        []
    } else {
        let (g0, y1) = wf_row(r[0], true, y);
        [g0].concat(wf(r[1..M], y1))
    }
}
```

`r[0]` is the top row of the drawing and the `x` argument is the token entering its leftmost cell, so the `gen if` recursion in `wf_row` *is* the eastward chain and the recursion in `wf` *is* the southward one; `y1` is the row of column tokens crossing the boundary between two adjacent rows. Everything is `bool`, one bit per wire, and the whole thing is a `fn` — purely combinational, no `reg`, so the $pV+p-1$-deep wave lands entirely inside one clock period and the register boundary is wherever the router's SA stage puts it. The recursion is a compile-time unroll, not a loop: synthesis sees $pV\!\cdot\!p$ independent cells and will flatten and re-balance them, so the literal ripple in the source is a derivation aid — the one thing a real flow does differently is that it will *not* preserve the anti-diagonal structure that makes the depth $pV+p-1$ unless the array is floorplanned as a tile mesh.

Simulated as `wf::<6,3>`, i.e. $p=3$, $V=2$: the $18$-bit request word is chunked into six rows of three, and every vector is checked against a behavioural greedy matcher and against the three structural invariants directly — $g\subseteq r$, at most one grant per row and per column, and no request with both endpoints free.

**Related Notes**

- [[Separable Input-First Allocator]] – compares: the sibling this exists to beat, five times shallower and not even maximal.
- [[Crossbar Switch]] – depends-on: $G$ is the crossbar's select in one-hot form; column $j$ of $G$ encodes to the $\lceil\log_2 p\rceil$ select bits of output mux $j$.
- [[Virtual-Channel Router]] – supports: the SA stage this drops into, and where $pV\times p$ comes from.
- [[Fixed-Priority Arbiter]] – depends-on: hold every column token high and a single row of this array degenerates to exactly one.
- [[Round-Robin Arbiter]] – compares: the fairness the wrap-free array gives up, and the pointer trick it would need the wrap to imitate.
- [[Speculative Switch Allocation]] – compares: buys a pipeline stage instead of a better matching, and is the cheaper trade when SA is the critical path.
- [[Credit-Based Flow Control]] – depends-on: supplies the credit term that makes $r_{ij}$ true rather than merely requested.
- [[Choosing a Router Architecture]] – compares: where this sits against every sibling allocator.

## References

- [[6.3) Network-On-Chip]] — §Router microarchitecture: the four-stage pipeline, the $pV\times p$ shape of the SA problem, the separable input-first structure and the one-line statement that "a full $pV\times p$ wavefront allocator matches better but is slower", the arbiter-as-priority-encoder derivation, and the area table.
- No textbook source for this topic. Standard treatments: Dally & Towles, *Principles and Practices of Interconnection Networks*, ch. 18–19 (allocators and arbiters, separable vs. wavefront, maximal vs. maximum matching, the wrapped array and its loop); Tamir & Chi, "Symmetric Crossbar Arbiters for VLSI Communication Switches", *IEEE Trans. Parallel and Distributed Systems* 4(1), 1993 — the original diagonal-priority wavefront array; McKeown, "The iSLIP Scheduling Algorithm for Input-Queued Switches", *IEEE/ACM Trans. Networking* 7(2), 1999 — the iterative request–grant–accept alternative. Boolean rewriting from [[0.1) Boolean Algebra]], priority-encoder and prefix structure from [[0.2) Combinational Logic]]. Page numbers are deliberately omitted; no copy was consulted while writing.
