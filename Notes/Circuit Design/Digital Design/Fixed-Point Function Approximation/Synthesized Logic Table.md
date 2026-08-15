---
title: Synthesized Logic Table
description: "Hand the table to standard-cell synthesis as a Boolean function instead of instantiating memory; area 2^(0.65min(k,n))·2^(0.19|k-n|), symmetric in inputs and outputs."
kind: circuit
source: "ASA §16.4.2, pp. 491-492"
status: seed
spade: simulated
tags: [digital, fixed-point-function-approximation, rom, synthesis, asic]
aliases:
  - Standard-Cell Table
  - Table as Random Logic
  - Synthesized Table
---

# Synthesized Logic Table

A tabulated function implemented as $n$ Boolean functions of $k$ variables and given to standard-cell synthesis, so that logic minimization and cross-output sub-expression sharing decide the area instead of the $2^k\cdot n$ bit count.

```tikz title="A k-input, n-output table realised as a shared gate graph"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[scale=0.95, transform shape]
\ctikzset{logic ports/scale=0.62}

% ---- input bus: k address bits, no decoder ----
\foreach \y/\lbl in {6.0/$x_{k-1}$, 5.6/$x_{k-2}$, 5.2/$x_{1}$, 4.8/$x_{0}$}
  \draw (1.0,\y) -- (3.4,\y) node[anchor=east] at (0.95,\y) {\lbl};
\node[anchor=south] at (2.2,6.2) {$X$, $k$ bits};

% ---- product terms (shared cubes) ----
\node[and port] (a1) at (4.6,4.4) {};
\node[and port] (a2) at (4.6,2.9) {};
\node[and port] (a3) at (4.6,1.4) {};

\draw (1.4,6.0) node[circ]{} |- (a1.in 1);
\draw (1.8,5.6) node[circ]{} |- (a1.in 2);
\draw (2.2,5.6) node[circ]{} |- (a2.in 1);
\draw (2.6,4.8) node[circ]{} |- (a2.in 2);
\draw (3.0,5.2) node[circ]{} |- (a3.in 1);
\draw (3.4,4.8) node[circ]{} |- (a3.in 2);

% ---- sum-of-products, one cube deliberately shared ----
\node[or port] (o1) at (7.8,4.4) {};
\node[or port] (o2) at (7.8,2.9) {};
\node[or port] (o3) at (7.8,1.4) {};

\draw (a1.out) -- (5.7,4.4) node[circ]{} |- (o1.in 1);
\draw (5.7,4.4) |- (o3.in 1);
\draw[very thick] (a2.out) -- (6.2,2.9) node[circ]{} |- (o1.in 2);
\draw[very thick] (6.2,2.9) |- (o2.in 1);
\draw (a3.out) -- (6.7,1.4) node[circ]{} |- (o2.in 2);
\draw (6.7,1.4) |- (o3.in 2);

\node[anchor=east] at (5.62,2.25) {\footnotesize shared cube};

% ---- outputs ----
\foreach \g/\lbl in {o1/$y_{n-1}$, o2/$y_{1}$, o3/$y_{0}$}
  \draw (\g.out) -- ++(1.1,0) node[anchor=west] {\lbl};
\node[anchor=south] at (9.1,6.2) {$\widetilde f(X)$, $n$ bits};
\draw[dashed] (8.9,0.9) -- (8.9,6.15);

\node[anchor=north] at (5.0,0.6)
  {\footnotesize $A \propto 2^{0.65\min(k,n)}\cdot 2^{0.19|k-n|}$};
\end{circuitikz}
\end{document}
```

**Refuse the memory abstraction and the cost model changes.** A table with $k$ address bits and $n$ output bits is conventionally written $2^k\times n$, and it does hold $2^k\cdot n$ bits — but that is the size of the *specification*, not of the circuit. Nothing forces the implementation to contain one storage element per bit. Read the same object as a Boolean map $\widetilde f:\{0,1\}^k\to\{0,1\}^n$: the address $X$ is a $k$-bit bus with no decoder in front of it, the result $\widetilde f(X)$ is an $n$-bit bus, and the $2^k$ rows of the truth table are $n$ separate single-output functions $y_j:\{0,1\}^k\to\{0,1\}$, $j=0,\dots,n-1$, all sharing the same $k$ input wires. On ASIC that is what you hand the tool, and [GJ08] found modern synthesis to be very good at it (ASA §16.4.2, p. 491).

**Two independent levers make the netlist smaller than the truth table.** The first is minimization *within* one output: by absorption $x \vee (x \wedge y) = x$ and distributivity of AND over OR, a sum of minterms collapses to a sum of much larger cubes, and multi-level factoring goes further than any two-level form ([[Boolean Algebra]], [[Combinational Logic]]). The second is sharing *across* outputs: because all $n$ functions read the same $k$ wires, a cube that appears in the cover of $y_1$ and of $y_{n-1}$ is synthesized once and fanned out — the bold wire in the diagram. Correlated outputs are the normal case for a tabulated numerical function, where neighbouring codes of $\widetilde f$ differ in a few low bits, so the second lever is not a marginal effect.

**The measured cost is an empirical area law, not a derivation.** Gustafsson and Johansson [GJ08] synthesized tabulated functions across a range of shapes and fitted the area $A$ of the resulting standard-cell netlist as

$$A \;\propto\; 2^{\,0.65\min(k,n)}\times 2^{\,0.19|k-n|} \tag{16.1}$$

The exponent to read is $0.65 < 1$. Per input bit added with $k=n$, area grows by $2^{0.65}\approx 1.57$ where the bit count grows by more than $2$ — logic optimization genuinely beats the raw bit count, and it does not remove the exponential. The second factor is a mild imbalance penalty at rate $0.19$ per bit of $|k-n|$.

> [!warning] The proportionality constant and the fitted range are not given
> Eq. (16.1) is stated as $\propto$, so it yields ratios between shapes and never an absolute area; the technology node, the cell library and the range of $k,n$ over which the fit was taken are not reported in ASA §16.4.2. Treat it as a shape-comparison tool inside the regime where tabulation is practical, and re-fit against your own library before trusting an absolute number.

**The symmetry in $k$ and $n$ is a consequence of the second lever, not a coincidence.** Eq. (16.1) is invariant under $k \leftrightarrow n$. The book's explanation is that the two levers are of comparable strength: minimizing each output's expression and maximizing sub-expression sharing across outputs are the same kind of work on the same gate graph, so a graph transforming $k$ inputs into $n$ outputs costs about what a graph transforming $n$ inputs into $k$ outputs costs (p. 491). This is exactly where the memory intuition misleads — under $2^k\cdot n$ the input side is exponential and the output side linear, an extreme asymmetry; under (16.1) the two sides are interchangeable.

> [!important] Trimming the output width buys more than the bit count suggests
> With $k=8$ fixed, going from $n=8$ to $n=4$ moves $\min(k,n)$ from $8$ to $4$ *and* opens $|k-n|=4$: $A$ falls by $2^{5.2}/2^{3.36} = 2^{1.84}\approx 3.6\times$, where the stored-bit count falls by only $2\times$. Every bit you can shave off the output format with [[Output Range Scaling]] or a tighter error budget is worth more on ASIC than the ROM arithmetic predicts.

**FPGA synthesis inherits the same technology, so the LUT formula is also an upper bound.** The nominal cost of a $2^k\times n$ table on a device with $\alpha$-input LUTs is $2^{\max(k-\alpha,0)}\times n$ LUTs ([[LUT-Array Function Table]]), and it is no more reliable than $2^k\cdot n$ was on ASIC for the same reason: FPGA tools run the ASIC logic-optimization flow before mapping. On an $\alpha=6$ device the $2^8\times 8$ table for $\sin(\tfrac{\pi}{2}x)$ on $[0,1)$ synthesizes into **25 LUTs, not the predicted $2^2\times 8 = 32$** (p. 492). Write the table as a case statement and let the mapper find the sharing; do not instantiate a memory primitive to "guarantee" the nominal cost, because that is the one way to forfeit it.

**Against a hard macro, the synthesized version won on the measured functions.** A ROM generator gives a transistor-level layout with a very low cost per bit — stored $0$s and $1$s become wiring to the power rails and essentially all the logic is address decoding — but it is fixed in shape and, decisively, it cannot benefit from logic optimization because it never sees the contents as a function. In the same study, ROM generators produced *larger* area than standard-cell implementations of the tabulated functions (p. 491). See [[Hard ROM Macro]].

$$\boxed{\ A \;\propto\; 2^{\,0.65\min(k,n)}\times 2^{\,0.19|k-n|}\ }$$

**Where it breaks.**

- **Asymptotically the law cannot hold.** Fix $n=1$ and let $k$ grow: (16.1) predicts $2^{0.19k}$, but Shannon's counting argument says almost every $k$-variable Boolean function needs $\Omega(2^k/k)$ gates. Even the balanced case $2^{0.65k}$ falls below that bound eventually. (16.1) is a fit over small tables and must be read as one.
- **Structureless contents.** The fit was taken on *tabulated functions*, whose outputs are strongly correlated across neighbouring addresses. A table of independent random words — an S-box, a calibration dump — has nothing to minimize and nothing to share, and you should expect to pay the full $2^k\cdot n$.
- **The specification is still exponential even when the netlist is not.** The tool is handed $2^k$ rows, so table generation, elaboration and synthesis runtime grow as $2^k$ regardless of how small the result is. Past $k\approx 16$ the flow becomes the bottleneck before the silicon does.
- **Contents are frozen at synthesis time.** No reload, no second function in the same gates. If the coefficients must change after configuration you need real memory — [[Block Memory]] on FPGA — and the whole argument above evaporates.
- **The same wall as plain tabulation.** $2^{0.65k}$ is still exponential: $k=n=16$ is $\approx 2^{10.4}$ units and $k=n=24$ is $\approx 2^{15.6}$. Somewhere around $k \approx 12$ a sibling takes over — [[Function Table ROM]] gives the crossover argument and [[Choosing a Function Approximation Method]] the full comparison.
- **Don't-cares are free area if you declare them.** Any input code the surrounding datapath cannot produce should be left unspecified rather than filled with zeros; the minimizer will use it to grow cubes. Filling it defeats the first lever on those rows.

**RTL.** The whole circuit is a `match` on the address — that *is* the "hand it to synthesis as a Boolean function" move, expressed in an HDL.

```spade
/// 4-bit -> 4-bit table for 15*sin(pi/2 * x), x = i/16.
/// Written as a Boolean function of the address: no memory primitive
/// is named anywhere, so synthesis is free to minimize and share.
fn sin_q4(x: uint<4>) -> uint<4> {
    match x {
        0  => 0,  1  => 1,  2  => 3,  3  => 4,
        4  => 6,  5  => 7,  6  => 8,  7  => 10,
        8  => 11, 9  => 12, 10 => 12, 11 => 13,
        12 => 14, 13 => 14, 14 => 15, _  => 15,
    }
}
```

`x` is the $k=4$-bit input bus of the diagram, the returned `uint<4>` is the $n=4$-bit output bus; the sixteen `match` arms are the $2^k$ truth-table rows, one per address, and the arm literals are ascribed to `uint<4>` so no width growth occurs anywhere. It is a `fn`, hence purely combinational — there is no clock and no register, which is what lets the whole thing collapse into the gate graph above. Synthesis will *not* build the two-level AND/OR of the drawing: it factors the cover into a multi-level network of whatever cells the library offers, and the "shared cube" becomes some shared internal node that has no name in the source. Here $k=n=4$, so (16.1) gives $2^{0.65\cdot 4} = 2^{2.6} \approx 6$ area units against $2^4\cdot 4 = 64$ stored bits.

Verified with `spade 0.19.0` and simulated against an independent behavioural reference computing $\mathrm{round}(15\sin(\tfrac{\pi}{2}\cdot\tfrac{i}{16}))$ in the testbench: all 16 addresses exhaustively, plus 3000 random and 4 named asymmetric vectors — $x=1 \mapsto 1$ against $x=8 \mapsto 11$ is the pair that fails if the address bit order is reversed.

**Related notes.**

- [[Function Table ROM]] – compares: the same table costed by its bit count $2^k\cdot n$; this note replaces that model with a measured area law.
- [[Hard ROM Macro]] – counter-example: the lowest cost *per bit*, and it still measured larger, because a macro never exposes its contents to optimization.
- [[LUT-Array Function Table]] – extends: the FPGA cost unit, where the same optimization technology makes $2^{\max(k-\alpha,0)}\times n$ an upper bound rather than a count.
- [[Boolean Algebra]] – depends-on: absorption, distributivity and cube covers are the minimization the area law is measuring.
- [[Combinational Logic]] – depends-on: multi-level factoring and technology mapping supply the second exponent.
- [[Output Range Scaling]] – supports: keeps the output inside $n$ bits, and by the symmetry every bit saved there is worth more than the bit count says.
- [[Choosing a Function Approximation Method]] – compares: where this sits against tables-plus-additions, polynomials and digit recurrence.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §16.4.2 "Actual Cost of a ROM", pp. 491-492 — eq. (16.1), the $k\leftrightarrow n$ symmetry argument, and the finding that ROM generators measured larger than standard cells.
- Ibid., §16.4-16.4.1, pp. 488-490 — plain tabulation, and the observation that the generated VHDL is exponential in the input size but only linear in the output size.
- Ibid., p. 492 and Fig. 16.11 — the FPGA LUT unit cost and the 25-LUT measurement for the $2^8\times 8$ sine table.
- Gustafsson & Johansson [GJ08], as cited by ASA §16.4.2, p. 491 — the empirical area study behind eq. (16.1).
- [[Fixed-Point Function Approximation]] — long-form treatment this note is cut from.
