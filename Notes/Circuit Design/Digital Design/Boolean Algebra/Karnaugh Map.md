---
title: Karnaugh Map
description: "Gray-coded truth table where adjacency is absorption; circling prime implicants yields a minimal two-level cover by eye up to four variables."
kind: concept
status: seed
spade: simulated
tags: [digital, boolean-algebra]
aliases:
  - Karnaugh Maps
  - K-map
  - K-maps
  - Karnaugh-map minimization
  - Quine-McCluskey
---

# Karnaugh Map

A truth table redrawn so that physically adjacent cells differ in exactly one variable, turning the absorption law into a geometric operation — circling a rectangle — and two-level minimization into pattern matching.

```tikz title="Karnaugh map of the running example with its prime implicants outlined"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % --- grid
  \draw[gray!60, step=1.2] (0,0) grid (4.8,4.8);
  % --- axis labels
  \node[anchor=south] at (0.6,4.92) {$00$};
  \node[anchor=south] at (1.8,4.92) {$01$};
  \node[anchor=south] at (3.0,4.92) {$11$};
  \node[anchor=south] at (4.2,4.92) {$10$};
  \node[anchor=east] at (-0.12,4.2) {$00$};
  \node[anchor=east] at (-0.12,3.0) {$01$};
  \node[anchor=east] at (-0.12,1.8) {$11$};
  \node[anchor=east] at (-0.12,0.6) {$10$};
  \node[anchor=south east] at (-0.12,4.92) {$ab\backslash cd$};
  % --- cells: value on top, minterm index below
  \foreach \cx/\cy/\idx/\val in {%
    0.6/4.2/0/1, 1.8/4.2/1/1, 3.0/4.2/3/0, 4.2/4.2/2/1,
    0.6/3.0/4/0, 1.8/3.0/5/1, 3.0/3.0/7/1, 4.2/3.0/6/1,
    0.6/1.8/12/0, 1.8/1.8/13/0, 3.0/1.8/15/0, 4.2/1.8/14/1,
    0.6/0.6/8/1, 1.8/0.6/9/1, 3.0/0.6/11/0, 4.2/0.6/10/1}
    \node[align=center, inner sep=0pt, font=\footnotesize] at (\cx,\cy)
      {$\val$\\[-4pt]{\tiny $m_{\idx}$}};
  % --- essential: c dbar, the whole cd=10 column
  \draw[blue!70!black, very thick, rounded corners=4pt] (3.69,0.09) rectangle (4.71,4.71);
  % --- essential: bbar cbar, wraps top to bottom
  \draw[orange!90!black, very thick, rounded corners=4pt] (0.09,3.69) rectangle (2.31,4.71);
  \draw[orange!90!black, very thick, rounded corners=4pt] (0.09,0.09) rectangle (2.31,1.11);
  % --- abar b d, covers what the essentials leave
  \draw[red!75!black, very thick, rounded corners=4pt] (1.29,2.49) rectangle (3.51,3.51);
  % --- bbar dbar: prime, four corners, in no minimal cover
  \draw[gray, dashed, thick, rounded corners=3pt] (0.22,3.82) rectangle (0.98,4.58);
  \draw[gray, dashed, thick, rounded corners=3pt] (3.82,3.82) rectangle (4.58,4.58);
  \draw[gray, dashed, thick, rounded corners=3pt] (0.22,0.22) rectangle (0.98,0.98);
  \draw[gray, dashed, thick, rounded corners=3pt] (3.82,0.22) rectangle (4.58,0.98);
  % --- legend
  \draw[blue!70!black, very thick] (0,-0.75) -- (0.55,-0.75);
  \node[anchor=west, font=\footnotesize] at (0.72,-0.75)
    {$c\bar d=\{2,6,10,14\}$ --- essential, sole cover of $m_{14}$};
  \draw[orange!90!black, very thick] (0,-1.35) -- (0.55,-1.35);
  \node[anchor=west, font=\footnotesize] at (0.72,-1.35)
    {$\bar b\bar c=\{0,1,8,9\}$ --- essential (sole cover of $m_9$), wraps top/bottom};
  \draw[red!75!black, very thick] (0,-1.95) -- (0.55,-1.95);
  \node[anchor=west, font=\footnotesize] at (0.72,-1.95)
    {$\bar abd=\{5,7\}$ --- covers the two minterms the essentials miss};
  \draw[gray, dashed, thick] (0,-2.55) -- (0.55,-2.55);
  \node[anchor=west, font=\footnotesize] at (0.72,-2.55)
    {$\bar b\bar d=\{0,2,8,10\}$ --- prime (the four corners), in no minimal cover};
  \node[anchor=west, font=\footnotesize] at (0,-3.2)
    {$f=c\bar d+\bar b\bar c+\bar abd$: 7 literals, 3 products, depth 2. All signals 1 bit.};
\end{circuitikz}
\end{document}
```

**Reorder the rows until adjacency carries algebraic meaning.** The row and column labels run in Gray-code order — $00,01,11,10$ — not binary order, so any two cells sharing an edge differ in exactly one variable. That is precisely the precondition of absorption, $ab+a\bar b=a(b+\bar b)=a\cdot 1=a$ by distributivity, complement (H5) and identity (H2): two adjacent ones merge into one product with one fewer literal. Because both label sequences are cyclic Gray codes, the map is a torus — the leftmost and rightmost columns are adjacent, the top and bottom rows are adjacent, and the four corners are mutually adjacent. Every input and output here is **1 bit wide**; the map's own address is the $n$-bit minterm index, $n=4$ in the drawing.

**Read a rectangle as a product term.** Repeating the merge $j$ times collapses a rectangular group of $2^j$ adjacent ones into a single product of $n-j$ literals — the $j$ variables that change across the group are exactly the ones absorption eliminated. A group that cannot be enlarged into a bigger power-of-two rectangle is a **prime implicant**; a prime implicant is **essential** if some minterm lies in it and in no other prime implicant, which forces it into every cover. The procedure follows from those two definitions and nothing else: circle every prime implicant, take all the essential ones for free, then cover whatever minterms remain with the cheapest subset of the rest.

**Work the running example.** Take $f=\sum m(0,1,2,5,6,7,8,9,10,14)$ over $a,b,c,d$, laid out as in the figure.

| $ab\backslash cd$ | 00 | 01 | 11 | 10 |
| --- | --- | --- | --- | --- |
| **00** | 1 | 1 | 0 | 1 |
| **01** | 0 | 1 | 1 | 1 |
| **11** | 0 | 0 | 0 | 1 |
| **10** | 1 | 1 | 0 | 1 |

The prime implicants are $\bar b\bar c\ \{0,1,8,9\}$, $\bar b\bar d\ \{0,2,8,10\}$, $c\bar d\ \{2,6,10,14\}$, $\bar a\bar cd\ \{1,5\}$, $\bar abd\ \{5,7\}$ and $\bar abc\ \{6,7\}$. Of these, $c\bar d$ is the sole cover of $m_{14}$ and $\bar b\bar c$ the sole cover of $m_9$, so both are essential. Deleting them and their minterms leaves $\{5,7\}$, which the single group $\bar abd$ takes. Note that $\bar b\bar c$ is only visible as a group because the map wraps top to bottom — in binary row order those four cells are not neighbours, which is the entire reason for the Gray code.

**Being maximal is necessary but not sufficient.** $\bar b\bar d$ — the four corners — is a genuine prime implicant, yet it appears in no minimal cover: every minterm it holds is already taken by an essential. Primality is a local property (cannot grow), minimality is a global one (cheapest cover), and confusing them is how a hand minimization ends up with a redundant fourth product. **Don't-cares**, written $\times$, cut the other way: they may be circled freely to enlarge a group but never need covering, so they only ever help. In practice most of the real savings on control logic come from don't-cares rather than from clever grouping.

**Mechanise the same procedure once four variables run out.** Human pattern matching gives out at $n=4$; five and six variables are drawn as stacked maps, and beyond that the map is useless. **Quine–McCluskey** is the tabular form of the identical algorithm. Phase 1 generates all prime implicants: group the minterms by popcount, repeatedly combine pairs from adjacent groups that differ in one bit (replacing that bit with `-`, which is one absorption step written down), and mark anything that never combines as prime. On the example this yields `-00-` $=\bar b\bar c$, `-0-0` $=\bar b\bar d$, `--10` $=c\bar d$, plus the uncombinable `0-01`, `01-1`, `011-` — the same six the map produced. Phase 2 builds the prime-implicant chart, rows primes and columns minterms, and selects a minimum-cost set of rows covering every column; sole-cover columns identify the essentials, and after removing them plus dominated rows and columns, what is left is the **cyclic core**.

**The cost is where exactness stops being worth it.** Phase 1 is polynomial in the number of minterms, but the number of prime implicants is not polynomial in $n$ — the maximum over $n$-variable functions grows as $\Theta(3^n/n)$ (Chandra & Markowsky, 1978), so a 16-variable function can have millions of them. Phase 2 is minimum unate covering, which is NP-hard; exact solvers branch-and-bound on the cyclic core, and when the chart is cyclic there is no shortcut. Espresso and every synthesis flow after it therefore abandon exactness: generate a heuristic subset of primes, then iterate expand / irredundant / reduce until the cover stops shrinking, accepting near-minimal in seconds over minimal never.

> [!important] The map minimizes literals at depth exactly 2, and nothing else
> A K-map fixes the structure to [[Two-Level SOP Network]] and then minimizes product-term count, then literals, within that structure. It cannot see factoring, it cannot see sharing between outputs, and it cannot see fan-in: a "depth 2" cover whose second level is a 64-input OR is not two gate delays. 4-input parity is the standing counter-example — all eight of its prime implicants are minterms, none combinable, so the map achieves *literally nothing*, while the XOR tree of [[Multi-Level Factored Network]] cuts 32 literals to 6 at the same depth.

**On an FPGA, do not run this at all.** A $k$-input lookup table implements every one of the $2^{2^k}$ functions of $k$ variables at a cost of one LUT and a depth of one, so literal count and product count are invisible to it. A 30-literal minimal SOP and a 64-literal canonical SOP over the same four variables map to the identical single 4-LUT. What matters is the **support size** of each logic cone, and with $k=6$ on current devices any six-variable cone is free — the real problem is decomposition into $\le k$-support pieces, not minimization. Two-level minimization keeps its value on ASIC standard-cell flows, where a static CMOS complex gate really does cost $2L$ transistors for $L$ literals. See [[FPGAs]].

$$\boxed{\ \text{a group of } 2^j \text{ adjacent ones} \;\Longrightarrow\; \text{a product of } n-j \text{ literals}\ }$$

$$\boxed{\ f=\sum m(0,1,2,5,6,7,8,9,10,14)=c\bar d+\bar b\bar c+\bar abd\ }$$

**Where it breaks.**

- **$n>4$.** Five and six variables need stacked maps and adjacency across sheets; past that, use Quine–McCluskey or Espresso. The map is a visualisation of a combinatorial problem, not a solution to it.
- **Cyclic charts.** No essentials and no dominance means the map gives you a choice, not an answer, and different equally-sized covers exist. Hand minimization silently picks one.
- **Hazards.** Two-level minimization deletes exactly the consensus terms a static-hazard-free implementation needs: with the redundant term gone, one product turns off before its neighbour turns on and the output glitches for a gate delay. Asynchronous designs ([[Asynchronous Sequential Logic]]) deliberately minimize *less*.
- **Multi-output functions.** The map minimizes one output at a time and therefore cannot find a product term worth sharing across two outputs, which is where most of the win lives in real decode logic.
- **The wrong cost.** Minimal literal count is an ASIC area proxy only. On an FPGA it is irrelevant; under a fan-in limit the depth-2 claim degrades to $D=\lceil\log_k p\rceil+\lceil\log_k n\rceil$.

**The hardware the map produces is the cover, not the map.** The minimization itself runs at design time on a truth table; what gets instantiated is the three-product expression it selected.

```spade
// Minimal cover read off the K-map: f = c·d' + b'·c' + a'·b·d
// x is the minterm index: bit 3 = a (MSB) ... bit 0 = d (LSB).
fn kmap_cover(x: uint<4>) -> bool {
    let v = x.as_bits();
    let (a, b, c, d) = (v[3], v[2], v[1], v[0]);
    (c && !d) || (!b && !c) || (!a && b && d)
}
```

`x` is the map's cell address, so `x[3]`/`x[2]` select the row ($ab$) and `x[1]`/`x[0]` the column ($cd$); the returned `bool` is the value printed in that cell. Everything is 1 bit and purely combinational — no clock, no register, no width growth, since `&&`/`||`/`!` are all `bool -> bool`. Note that `!` is the bool-only negation here; `~` would be the bitwise one on the `uint<4>`. What synthesis emits will not be these three products: the mapper re-decomposes the cone into whatever the cell library or the LUT primitive wants, which is the whole point of the FPGA paragraph above.

Simulated against the truth table $\sum m(0,1,2,5,6,7,8,9,10,14)$ as behavioural reference: **3023 vectors pass, 0 fail** — 7 named, all 16 assignments exhaustively, and 3000 random. The named set includes $m_4=0$ against its bit-reversal $m_2=1$, which is the pair that fails if `as_bits()` indexing is read MSB-first instead of LSB-first; symmetric vectors like $m_1$ and $m_8$ (both 1) pass under that bug. Exhaustive coverage means this is a *proof* that the minimized cover equals the original function, which is the one claim a K-map has to make.

**Related notes.**

- [[Two-Level SOP Network]] – supports: the cover produced here is exactly that network's netlist; this note is how you choose its product terms.
- [[Two-Level POS Network]] – compares: circle the *zeros* instead and complement, and the same map yields the dual minimal form.
- [[Multi-Level Factored Network]] – counter-example: relaxing the fixed depth of 2 beats the minimal SOP by orders of magnitude on parity and other XOR-heavy functions.
- [[NAND-NAND Network]] – extends: the minimal cover transfers gate-for-gate into NAND-only form by De Morgan, at no cost.
- [[Shannon Expansion Multiplexer]] – compares: the other way to read a truth table, decomposing by cofactors instead of grouping ones.
- [[Choosing a Logic Realization]] – compares: where a minimized two-level cover wins and where it should never have been computed.
- [[Boolean Algebra]] – depends-on: absorption, consensus and De Morgan, which are what the geometry is standing in for.

## References

- [[0.1) Boolean Algebra#Karnaugh-map minimization]] — running example, prime implicants, the essential/minimal distinction.
- [[0.1) Boolean Algebra#Absorption]] — the law adjacency implements, with proofs.
- [[0.1) Boolean Algebra#Quine–McCluskey]] — tabular form, prime-implicant chart, $\Theta(3^n/n)$ and the NP-hardness of the covering step.
- [[0.1) Boolean Algebra#Cost metrics]], [[0.1) Boolean Algebra#FPGA mapping]] — literal/depth proxies and why LUTs make them moot.
- Canon: Mano & Ciletti, *Digital Design*, ch. 3; Wakerly, *Digital Design: Principles and Practices*, §3.3; Chandra & Markowsky (1978) for the prime-implicant bound.
