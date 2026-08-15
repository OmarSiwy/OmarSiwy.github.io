---
title: Constant Matrix Multiplier
description: Several inputs and several outputs optimised as one graph — a complex multiply by 19+43j in six adders where two MCM blocks need eight.
kind: circuit
source: "ASA §12.5.4, pp. 410-411"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, mcm, cmm, adder-graph, fpga]
aliases:
  - CMM
  - Constant Matrix Multiplication
  - Constant Matrix-Vector Multiplication
  - CMM Adder Graph
---

# Constant Matrix Multiplier

A shift-and-add operator computing $\mathbf Y=\mathbf C\mathbf X$ for a constant $M\times N$ integer matrix $\mathbf C$, optimised as one adder graph so that a partial sum mixing *several inputs* can be shared between *several outputs* — the sharing that a per-output [[Multiple Constant Multiplication]] block cannot express.

```tikz title="Six-adder CMM graph for the complex constant 19+43j"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[
    add/.style={draw, circle, minimum size=5.5mm, inner sep=0pt, font=\small},
    dot/.style={circle, fill, inner sep=1pt},
    sg/.style={font=\footnotesize, inner sep=1.5pt},
    lb/.style={font=\footnotesize},
    >=latex]

  % --- inputs -----------------------------------------------------------
  \node[lb] (Xr) at (0,7.2) {$X_{\mathrm r}$};
  \node[lb] (Xi) at (5,7.2) {$X_{\mathrm i}$};
  \node[lb, anchor=east] at (-0.15,6.75) {$w$};
  \node[lb, anchor=west] at (5.15,6.75) {$w$};

  % --- adders -----------------------------------------------------------
  \node[add] (A1) at (0,5.6) {$+$};
  \node[add] (A2) at (5,5.6) {$+$};
  \node[add] (A3) at (0,3.4) {$+$};
  \node[add] (A4) at (5,3.4) {$+$};
  \node[add] (A5) at (0,1.2) {$+$};
  \node[add] (A6) at (5,1.2) {$+$};

  % --- level 1 ----------------------------------------------------------
  \node[dot] (t0l) at (0,6.6) {};
  \node[dot] (t0r) at (5,6.6) {};
  \draw[->] (Xr) -- (A1.north);
  \draw[->] (Xi) -- (A2.north);
  \draw[->] (t0r) -- (A1.east) node[sg, pos=0.88, above] {$-$};
  \draw[->] (t0l) -- (A2.west) node[sg, pos=0.88, above] {$+$};

  \node[lb, anchor=east] at (-0.2,5.05) {$(X_{\mathrm r}-X_{\mathrm i})\ \ w{+}1$};
  \node[lb, anchor=west] at (5.2,5.05) {$w{+}1\ \ (X_{\mathrm r}+X_{\mathrm i})$};

  % --- level 2 ----------------------------------------------------------
  \node[dot] (t1l) at (0,4.6) {};
  \node[dot] (t1r) at (5,4.6) {};
  \draw[->] (A1.south) -- (A3.north);
  \draw[->] (A2.south) -- (A4.north);
  \draw[->] (t1r) -- (A3.east) node[sg, pos=0.88, above] {$-$};
  \draw[->] (t1l) -- (A4.west) node[sg, pos=0.88, above] {$+$};
  \node[lb, anchor=east] at (-0.2,4.15) {$\ll 2$};
  \node[lb, anchor=west] at (5.2,4.15) {$\ll 2$};

  \node[lb, anchor=east] at (-0.2,2.85) {$(3X_{\mathrm r}-5X_{\mathrm i})\ \ w{+}3$};
  \node[lb, anchor=west] at (5.2,2.85) {$w{+}3\ \ (5X_{\mathrm r}+3X_{\mathrm i})$};

  % --- level 3 ----------------------------------------------------------
  \node[dot] (t2l) at (0,2.4) {};
  \node[dot] (t2r) at (5,2.4) {};
  \draw[->] (A3.south) -- (A5.north);
  \draw[->] (A4.south) -- (A6.north);
  \draw[->] (t2r) -- (A5.east) node[sg, pos=0.88, above] {$-$};
  \draw[->] (t2l) -- (A6.west) node[sg, pos=0.88, above] {$+$};
  \node[lb, anchor=east] at (-0.2,1.95) {$\ll 3$};
  \node[lb, anchor=west] at (5.2,1.95) {$\ll 3$};

  % --- outputs ----------------------------------------------------------
  \draw[->] (A5.south) -- (0,0.35);
  \draw[->] (A6.south) -- (5,0.35);
  \node[lb, anchor=east] at (-0.2,0.55) {$Y_{\mathrm r}=19X_{\mathrm r}-43X_{\mathrm i}$};
  \node[lb, anchor=west] at (5.2,0.55) {$Y_{\mathrm i}=43X_{\mathrm r}+19X_{\mathrm i}$};
  \node[lb, anchor=east] at (-0.2,0.1) {$w{+}6$};
  \node[lb, anchor=west] at (5.2,0.1) {$w{+}6$};

\end{circuitikz}
\end{document}
```

*after Fig. 12.23b, p. 411.*

**Locate CMM at the top of the constant-multiplication lattice.** The four shift-and-add problems differ only in the shape of the constant. Single-constant multiplication is $1\times1$; [[Multiple Constant Multiplication]] is $M\times1$, one input fanning out to $M$ outputs; [[Sum of Constant Products]] is $1\times N$, $N$ inputs collapsing to one; CMM is the general $M\times N$ case with several inputs *and* several outputs. Each is a strict generalisation of the one before, so the optimal CMM adder count is never worse than the best decomposition into the special cases — the only question is whether it is strictly better, and how hard it is to find.

**Turn a complex multiplication into a real matrix.** The canonical CMM instance is multiplication by a fixed complex coefficient. Expanding $(X_{\mathrm r}+jX_{\mathrm i})(19+43j)$ by distributivity and collecting on $j^2=-1$,

$$(X_{\mathrm r}+jX_{\mathrm i})\cdot(19+43j)=\underbrace{19X_{\mathrm r}-43X_{\mathrm i}}_{=\,Y_{\mathrm r}}+j\underbrace{(43X_{\mathrm r}+19X_{\mathrm i})}_{=\,Y_{\mathrm i}} \tag{12.45}$$

which is a $2\times2$ real matrix-vector product:

$$\begin{pmatrix}Y_{\mathrm r}\\Y_{\mathrm i}\end{pmatrix}=\begin{pmatrix}19&-43\\43&19\end{pmatrix}\begin{pmatrix}X_{\mathrm r}\\X_{\mathrm i}\end{pmatrix} \tag{12.46}$$

Both inputs are $w$-bit two's-complement integers (`int<w>`, see [[Number Formats]]). Because every intermediate node of an adder graph is an exact integer linear combination $aX_{\mathrm r}+bX_{\mathrm i}$, its width follows from that node's $\ell_1$ norm alone: the value is bounded by $(|a|+|b|)\cdot 2^{w-1}$, so it needs $w+\lceil\log_2(|a|+|b|)\rceil$ bits. For the outputs $|19|+|-43|=62$ and $\lceil\log_2 62\rceil=6$, giving $w+6$ bits. **There is no rounding anywhere in this operator** — it is exact integer arithmetic, so [[Error Accuracy]] has nothing to contribute here.

**Count the cost of building it out of parts.** The obvious construction runs one MCM block per input column. Column 1 needs $\{19,43\}$, column 2 needs $\{43,19\}$ — the same coefficient set, and the optimal MCM solution for $\{19,43\}$ is three adders, exploiting $43=19\cdot2+5$ (Fig. 12.19, p. 403). Two such blocks produce $19X_{\mathrm r},43X_{\mathrm r},19X_{\mathrm i},43X_{\mathrm i}$ for six adders, and two final adders combine them into $Y_{\mathrm r}$ and $Y_{\mathrm i}$: **eight additions** (Fig. 12.23a, p. 411). Decomposing by rows instead — two SOPC blocks in the style of Fig. 12.22 — lands on a similar count, because it is the same decomposition read the other way round.

**Share a subexpression that mixes the two inputs.** Optimising the matrix as a unit finds six. The graph opens by forming both butterfly sums of the inputs,

$$a=X_{\mathrm r}-X_{\mathrm i},\qquad b=X_{\mathrm r}+X_{\mathrm i}\qquad(w{+}1\ \text{bits each}),$$

then applies one shift-and-add layer to each, crossing the results:

$$c=2^2a-b=3X_{\mathrm r}-5X_{\mathrm i},\qquad d=2^2b+a=5X_{\mathrm r}+3X_{\mathrm i}\qquad(w{+}3\ \text{bits}),$$

by distributivity of multiplication over addition — $4(X_{\mathrm r}-X_{\mathrm i})-(X_{\mathrm r}+X_{\mathrm i})=3X_{\mathrm r}-5X_{\mathrm i}$ — with commutativity of integer addition reordering the terms. A second crossing layer closes it:

$$Y_{\mathrm r}=2^3c-d=(24X_{\mathrm r}-40X_{\mathrm i})-(5X_{\mathrm r}+3X_{\mathrm i})=19X_{\mathrm r}-43X_{\mathrm i},$$

$$Y_{\mathrm i}=2^3d+c=(40X_{\mathrm r}+24X_{\mathrm i})+(3X_{\mathrm r}-5X_{\mathrm i})=43X_{\mathrm r}+19X_{\mathrm i}.$$

Six adders, three levels, and every shift is free — a hardwired reindexing of the bus, not a barrel shifter.

> [!important] The saving lives in a node no MCM block can name.
> $a=X_{\mathrm r}-X_{\mathrm i}$ is a linear combination of *both* inputs. An MCM operator is single-input by construction: its search space is $\{\lambda X:\lambda\in\mathbb Z\}$ for one fixed $X$, so no MCM solver — however optimal — can ever place that node. The two-adder gap is not slack in the MCM heuristic, it is outside the MCM problem statement. That is the entire reason CMM exists as a separate optimisation problem.

**Transposition is a free change of shape.** Reversing every edge of a signal-flow graph turns each branch (fanout) into an adder and each adder into a branch, so the graph of a CMM by $\mathbf C$ becomes a graph of a CMM by $\mathbf C^{\mathsf T}$. Fanout points that were free become adders and vice versa, and the bookkeeping gives an exact count: an $M\times N$ CMM with $N_A$ adders transposes into an $N\times M$ CMM with $N_A-N+M$ adders (Gustafsson, p. 411). For a square matrix $M=N$ and the cost is unchanged — the $2\times2$ complex multiplier above is its own transpose in cost, which is why its graph is symmetric under left-right mirroring. The degenerate case $N=M=1$ recovers the familiar fact that an SCM graph and its reverse cost the same.

**Solve the problem in whichever orientation searches faster.** Graph-based CMM algorithms scale better in rows than in columns: a row is one more target to reach, whereas a column is one more independent source that widens the state every node must be described in. When $N>M$ it is therefore faster to transpose, solve the $N\times M$ instance, and transpose the resulting SFG back — the adder count is corrected by the identity above and nothing else changes. The available solvers are all adaptations of MCM machinery: Hartley's original CSE observation, Dempster's extension of the Bull–Horrocks Modified algorithm, Gustafsson's minimum-spanning-tree reformulation (iterated on a reduced matrix until only $0$ and $\pm1$ remain), Macleod & Dempster's $i\times j\times k$ signed-digit tensor with two-term subexpression elimination, Kinane's genetic algorithm over SD representations, and RPAG extended to CMM.

**On FPGAs, judge the graph by more than its adder count.** Each node maps to a carry-chain adder costing roughly one LUT-FF pair per output bit, so the *wide* late-stage adders dominate area even though the graph counts them the same as the narrow ones: this graph spends two adders at $w{+}1$, two at $w{+}3$ and two at $w{+}6$, so nearly half the logic sits in the last level. Depth matters as much — three carry-propagate levels in series is the critical path, and any real throughput target requires pipelining, at which point registers rather than adders become the cost function, the saving grace being that a pipeline register is free in the flip-flop already sitting behind each LUT (see [[Pipelined Adder Graph]]). On ASICs neither holds: the internal levels can be kept in carry-save form so depth costs far less, and registers cost real area.

$$\boxed{\ N_A(\mathbf C^{\mathsf T})=N_A(\mathbf C)-N+M\ }$$

> [!warning] No cost model for CMM in the source
> The book gives the transposition identity and the $19+43j$ example, but no adder-count lower bound for CMM (as it does for MCM with $N_{\mathrm{A,lb,MCM}}$), no LUT or delay figures for the six-adder graph, and no bit-width discussion. The widths in this note are derived here from the $\ell_1$ norm of each graph node, not taken from the text.

**When it breaks.**

- **Uncorrelated rows.** The gain comes entirely from linear combinations shared between output rows. A matrix whose rows are algebraically unrelated — large random coefficients, no near-common sums or differences — degenerates into $M$ independent SOPC problems, and the CMM solver buys nothing but search time.
- **Search cost.** CMM optimality is exponential in the coefficient magnitudes and in $MN$ together. A $2\times2$ is small enough to solve exactly; anything filter-sized is heuristic, and the heuristics inherit MCM's habit of minimising adders while ignoring registers.
- **Runtime-variable coefficients.** An adder graph is welded to one matrix. If the coefficients change, the whole structure is wrong and a [[Reconfigurable Constant Coefficient Multiplier]] or a DSP-block coefficient memory takes over.
- **Small input word size.** Below roughly a byte the table-based route wins on FPGAs — [[Table-Based Multiple Constant Multiplication]] and [[KCM-Based Sum of Products]] beat adder graphs on both area and delay in that regime (p. 407).
- **Plentiful DSP blocks.** A $2\times2$ complex multiply is three or four DSP48 instructions with zero LUTs. When DSPs are not the scarce resource the adder count is not the objective function at all; see [[DSP-Block Constant Multiplier]].

**RTL (Spade).**

```spade
entity cmm_19_43<#uint W>(xr: int<W>, xi: int<W>) -> (int<{W + 6}>, int<{W + 6}>) {
    let a: int<{W + 1}> = xr - xi;
    let b: int<{W + 1}> = xr + xi;

    let c: int<{W + 3}> = (sext::<{W + 1}, {W + 3}>(a) << 2) -. sext(b);
    let d: int<{W + 3}> = (sext::<{W + 1}, {W + 3}>(b) << 2) +. sext(a);

    let yr: int<{W + 6}> = (sext::<{W + 3}, {W + 6}>(c) << 3) -. sext(d);
    let yi: int<{W + 6}> = (sext::<{W + 3}, {W + 6}>(d) << 3) +. sext(c);
    (yr, yi)
}
```

`a`/`b` are the top pair of circles in the diagram, `c`/`d` the middle pair, `yr`/`yi` the bottom pair — six operators, one per circle, and the six `sext` calls plus the two `<<` are wires rather than logic. The widths follow the $\ell_1$-norm rule: sign-extend to the destination width *first*, then shift, then combine with the truncating `-.`/`+.` so the result stays at $w{+}k$ instead of growing the extra bit an ordinary `-` would add; that truncation is provably lossless because the sign-extended operand already spans the full range of the sum. Everything is combinational and three carry-propagate adders deep, so synthesis will lay down three carry chains in series — that depth, not the drawing, is what a `reg;` has to break if the clock cannot absorb it.

Verified with a concrete `cmm8` wrapper at $w=8$: exhaustive over all $2^{16}$ input pairs plus a 3000-vector random sweep and asymmetric named vectors, every result matching the behavioural reference $19x_{\mathrm r}-43x_{\mathrm i}$, $43x_{\mathrm r}+19x_{\mathrm i}$.

**Related Notes.**

- [[Multiple Constant Multiplication]] – extends: CMM is MCM with more than one input; the two-MCM-block construction is the eight-adder baseline this beats.
- [[Sum of Constant Products]] – extends: SOPC is the $M=1$ case, and supplies the SFG-transposition argument behind the $N_A-N+M$ identity.
- [[Fast Convolution Algorithms]] – compares: attacks the same complex product by restructuring the algebra (three multiplications instead of four) rather than by sharing nodes in an adder graph.
- [[Minimum-Adder Constant Multiplier]] – depends-on: the single-constant optima each entry would fall back to if no sharing existed at all.
- [[Pipelined Adder Graph]] – extends: once throughput is specified, registers rather than adders become the cost function on this graph.
- [[DSP-Block Constant Multiplier]] – counter-example: with DSP blocks available the adder count stops being the metric.
- [[Choosing a Constant Multiplier]] – compares: where CMM sits against every sibling technique.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §12.5.4 "Constant Matrix-Vector Multiplication", pp. 410-411 — eqs. (12.45), (12.46); Fig. 12.23 (a) two-MCM realisation, (b) six-adder optimised CMM, p. 411; transposition adder count and the row-vs-column scaling remark, p. 411.
- §12.5.1 "MCM using shift-and-add", p. 403 — the three-adder MCM solution for $\{19,43\}$ (Fig. 12.19).
- §12.5.3 "Sum of constant products", pp. 408-409 — SFG transposition (Fig. 12.22).
- §12.5.2 "Table-based MCM", p. 407 — table-based methods win at low input word size.
