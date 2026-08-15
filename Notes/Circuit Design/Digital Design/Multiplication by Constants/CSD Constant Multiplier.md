---
title: CSD Constant Multiplier
description: "Collapses each run of ones in the coefficient into a single subtracter, capping the adder count at ceil((n+1)/2)-1 instead of n."
kind: circuit
source: "ASA §12.1.1, pp. 368-369"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, signed-digit, csd, shift-and-add]
aliases:
  - CSD
  - Canonical Signed Digit
  - Canonical Signed Digit Representation
  - CSD Recoding
---

# CSD Constant Multiplier

A shift-and-add constant multiplier built from the unique signed-digit expansion of $C$ in which no two nonzero digits are adjacent, which is also the expansion with the fewest nonzero digits.

```tikz title="CSD adder graph for 93X with an 8-bit input: two subtracters and one adder"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
\node (x) at (0,0) {$X$};
\draw[->] (0,-0.2) -- node[right,font=\tiny]{8} (0,-0.9);
\draw (-3.4,-0.9) -- (3.4,-0.9);
\node[draw,minimum width=1.9cm,minimum height=0.65cm] (a) at (-2.2,-2.4) {$96X$};
\node[draw,minimum width=1.9cm,minimum height=0.65cm] (b) at ( 2.2,-2.4) {$-3X$};
\node[draw,minimum width=1.9cm,minimum height=0.65cm] (c) at ( 0.0,-4.5) {$93X$};
\draw[->] (-3.0,-0.9) -- node[left,font=\tiny]{$+\,\ll 7$}  (-3.0,-2.075);
\draw[->] (-1.4,-0.9) -- node[right,font=\tiny]{$-\,\ll 5$} (-1.4,-2.075);
\draw[->] ( 1.4,-0.9) -- node[left,font=\tiny]{$+\,\ll 0$}  ( 1.4,-2.075);
\draw[->] ( 3.0,-0.9) -- node[right,font=\tiny]{$-\,\ll 2$} ( 3.0,-2.075);
\draw[->] (-2.2,-2.725) -- node[left,font=\tiny]{15 u} (-2.2,-3.8) -- (-0.7,-3.8) -- (-0.7,-4.175);
\draw[->] ( 2.2,-2.725) -- node[right,font=\tiny]{11 s} ( 2.2,-3.8) -- ( 0.7,-3.8) -- ( 0.7,-4.175);
\draw[->] (0,-4.825) -- node[right,font=\tiny]{15} (0,-5.5) node[below,font=\small]{$93X$};
\node[font=\tiny,align=center] at (0,-6.3)
  {$93 = 2^7-2^5-2^2+2^0 = 10\bar{1}00\bar{1}01_{\mathrm{CSD}}$\\[2pt]
   4 nonzero digits, no two adjacent $\Rightarrow$ 3 adder nodes};
\end{circuitikz}
\end{document}
```

*after Fig. 12.3b, p. 367*

**Buy the right to subtract, and a run of ones collapses to one operation.** In hardware a subtracter is nearly the same object as an adder — same area, same delay, same energy (p. 368) — because the two's-complement identity $-x=\bar{x}+1$ turns it into the same carry chain with one operand inverted and $c_{\mathrm{in}}=1$ (see [[Number Formats]]). Nothing therefore forbids *negative* partial products in the adder graph of [[Binary Shift-and-Add Constant Multiplier]], and once negative terms are allowed the finite geometric sum applies:

$$\sum_{i=p}^{p+k-1}2^i \;=\; 2^p\left(2^k-1\right) \;=\; 2^{p+k}-2^p$$

A run of $k$ consecutive ones in $C$ costs $k-1$ adders when read literally and *one* subtracter when read as a difference. For $k=4$: $15X = 2^4X - X$ instead of $2^3X+2^2X+2^1X+X$.

**Rewrite the constant, not the multiplicand, and rewrite it repeatedly.** This is the identity [[Booth's Algorithm]] exploits, but Booth applies it at run time to a multiplicand that is a signal, so it must recode every bit boundary it meets and it pays for the recoding logic. Here $C$ is a literal, so the rewriting happens once at synthesis time and leaves nothing behind but wiring. That freedom also lets us apply it *to its own output*. Algorithm 12.1 (p. 368): find any substring $0\underbrace{1\cdots1}_{k\ge2}$ and replace it with $1\underbrace{0\cdots0}_{k-1}\bar1$, of the same length; repeat until no such substring remains. Writing $\bar1$ for the digit $-1$,

$$93=1011101_2 \;\to\; 1100\bar101_{\mathrm{SD}} \;\to\; 10\bar100\bar101_{\mathrm{CSD}}$$

taking five nonzeros (four adders) down to four (three adders). The digit alphabet is now $\{-1,0,1\}$ over the usual weights $2^i$, i.e. a [[Redundant Number Systems|signed-digit]] representation of the constant only — the datapath itself stays two's complement throughout.

**Generate the digits directly, and both termination and uniqueness become one line each.** The rewriting rule is a fixed-point iteration, and its fixed point is the **canonical signed digit** (CSD) form. Rather than argue about the confluence of the rewriting, emit the digits from the LSB up. For $C>0$, choose $d$ by residue and recurse on a strictly smaller number:

$$d \;=\; \begin{cases}0 & C\equiv0 \pmod 2\\ +1 & C\equiv1\pmod 4\\ -1 & C\equiv3\pmod 4\end{cases}\qquad C\leftarrow\frac{C-d}{2}$$

Every case makes $C-d$ even, so the division is exact and the recursion is well defined; each step halves the magnitude, so it terminates in $O(\log C)$ steps; and each $d$ is forced, so the output is unique. It is a valid representation because $C = d + 2\cdot\frac{C-d}{2}$ is exactly the positional expansion unrolled. The choice at odd $C$ *is* the run-of-ones identity in disguise: $C\equiv3\pmod4$ means the two low bits are $11$, the foot of a run, and emitting $\bar1$ is what closes the run from below.

**Non-adjacency is a corollary of the recurrence, not an extra property to prove.** If $d\ne0$ then $C$ is odd, and $d$ was chosen precisely so that $C-d\equiv0\pmod4$; hence $(C-d)/2$ is **even**, and the next digit is forced to $0$. So a nonzero digit is always followed by a zero, and no two nonzero digits are adjacent.

**Non-adjacency is also what bounds the cost.** In a CSD string of $n$ digits the nonzero positions form an independent set in a path graph on $n$ vertices, of which the largest has $\lceil n/2\rceil$ elements. An $n$-bit unsigned constant expands to at most $n+1$ CSD digits — the extra digit is the carry-out case $2^n-1\to10\cdots0\bar1$ — so

$$\mathrm{nz}_{\mathrm{CSD}}(C)\le\left\lceil\frac{n+1}{2}\right\rceil,\qquad N_{\mathrm A}=\mathrm{nz}_{\mathrm{CSD}}(C)-1$$

against $\mathrm{nz}(C)=n$ nonzeros in the worst binary case. The bound is tight: $93=10\bar100\bar101$ has $8$ digits and $4$ nonzeros $=\lceil 8/2\rceil$. Asymptotically the average nonzero density drops from $n/2$ to $n/3$, so CSD halves the *worst-case* slope of adder count in $w_C$ and shaves a third off the average.

**Minimal in nonzeros does not mean unique among minimal forms, and the difference is not free.** Substituting $10\bar1\to011$ or $\bar101\to0\bar1\bar1$ preserves the nonzero count while trading a subtracter for an adder or moving a digit; iterating the substitution over $93$ yields four **minimum signed digit** (MSD) representations (eq. 12.2, p. 369). All four cost three adder nodes, but they do not cost the same number of full adders, which is the subject of [[Minimum Full-Adder Constant Multiplier]].

**Widths, and where the free bits go.** For $X$ unsigned on $w_X$ bits and $C$ on $n$ bits, the product needs $w_X+\lceil\log_2 C\rceil$ bits; intermediate nodes are as wide as the largest partial coefficient they hold, and a node whose coefficient is negative must be signed and sign-extended into its consumer. In the figure, $96X$ is $15$ bits unsigned, $-3X$ is $11$ bits signed, and $93X$ is $15$ bits. A node computing $P\pm2^sX$ with an $r$-bit result costs $r-s$ full-adder cells, because the low $s$ bits of $P$ have nothing to add to and pass through as wires. That saving belongs to whichever operand carries the *larger* shift: if the negated operand is the one at shift $0$, its complement plus the $+1$ makes every bit from position $0$ upward live, and the node costs the full $r$ cells. This is why CSD's adder-count win can evaporate at the bit level — see the failure list below.

**FPGA versus ASIC.** On an FPGA the subtracter and the adder are literally the same hard carry chain with one LUT output inverted and the chain's $c_{\mathrm{in}}$ tied high, so the CSD saving in adder *count* translates one-for-one into a saving in carry-chain length, and the free-LSB bookkeeping matters less because the LUT that feeds a pass-through bit is already paid for. On an ASIC every full adder is a real cell, so the free-LSB argument dominates and the graph must be costed at bit level. The FPGA caveat that actually bites is bigger than either: a [[KCM, Table-Based Constant Multiplication|KCM]] costs the same for every constant of a given width, so on FPGA fabric the entire question of how many ones $C$ contains usually stops mattering.

$$\boxed{\ \mathrm{nz}_{\mathrm{CSD}}(C)\le\left\lceil\frac{n+1}{2}\right\rceil\ \Longrightarrow\ N_{\mathrm A}\le\left\lceil\frac{n+1}{2}\right\rceil-1\ }$$

**Where it stops paying.**

- **CSD is greedy, and greedy is not optimal.** $93=3\times31$, and with $3=11_{\mathrm{MSD}}$, $31=1000\bar1_{\mathrm{MSD}}$, the cascade needs **two** adders (Fig. 12.3c, p. 367) where CSD needs three. Finding the true minimum is the NP-complete SCM problem — [[Minimum-Adder Constant Multiplier]].
- **The sharing CSD does expose is incomplete.** $10\bar1_{\mathrm{SD}}=-\bar101_{\mathrm{SD}}$ (eq. 12.3) is what common-subexpression elimination finds inside the CSD string, but for $25=10\bar1001_{\mathrm{CSD}}=101_2\cdot101_2$ the shared pattern $101_2$ is *invisible* in CSD, because its two ones overlap when squared (p. 369).
- **A constant with no runs of ones pays nothing.** $683=1010101011_2$ has six nonzeros; its CSD $10\bar10\bar10\bar10\bar10\bar1$ has eleven digits and still six nonzeros, exactly the $\lceil11/2\rceil$ bound. Worse at bit level: the single long subtraction $2^{10}X-341X$ negates the shift-$0$ operand, so it has no free low bits and costs roughly $18$ cells where the binary chain's adders cost $9$ each.
- **Adder count is not area.** Two graphs with the same $N_{\mathrm A}$ can differ by a third in full adders ($49X$: $25$ versus $16$ FA-equivalents, p. 382).
- **Naive Booth recoding is not CSD and can be strictly worse.** Radix-2 Booth sets $d_i=x_{i-1}-x_i$ at *every* boundary; on $0101_2$ that gives $1\bar11\bar1$, four nonzeros where binary had two. CSD rewrites only the boundaries that pay.
- **At $n>22$ bits with ternary adders available**, or on any FPGA where a table fits, the whole signed-digit question is moot — see [[Ternary-Adder Constant Multiplier]] and [[Choosing a Constant Multiplier]].

**The graph in RTL.** One entity, the constant baked in, three nodes:

```spade
// 93X in CSD: 93 = 2^7 - 2^5 - 2^2 + 2^0  ->  10-100-101_CSD
entity csd93(x: uint<8>) -> uint<15> {
    let xs: int<16> = sext(x.to_int());
    let hi: int<16> = (xs << 7) -. (xs << 5);   // +96X, one subtracter
    let lo: int<16> = xs -. (xs << 2);          //  -3X, one subtracter
    let r:  int<16> = hi +. lo;                 //  93X, one adder
    trunc(r.as_uint())
}
```

`hi` and `lo` are the two upper boxes of the diagram, `r` the lower one; the three `<<` are the edge labels and cost no logic. Everything is combinational — a constant multiplier has no state. The `int<16>` carrier is a *bound*, not a wire count: `lo` only ever holds $-765\dots0$ ($11$ bits signed) and `hi` only $0\dots24480$ ($15$ bits unsigned), and synthesis will prune each node down to those widths, which is exactly the pruning the free-LSB cost model counts. `-.` is the wrapping subtract, chosen because the widths are already provably sufficient; plain `-` would widen every node by one bit for a carry that cannot occur.

**Related notes.**

- [[Binary Shift-and-Add Constant Multiplier]] – extends: same adder graph, with the digit set widened from $\{0,1\}$ to $\{-1,0,1\}$.
- [[Booth's Algorithm]] – compares: the identical run-of-ones identity applied to a runtime multiplicand instead of a compile-time constant.
- [[Redundant Number Systems]] – depends-on: the signed-digit alphabet the recoding lands in.
- [[Minimum-Adder Constant Multiplier]] – counter-example: $93$ in two adders, one fewer than CSD's greedy three.
- [[Minimum Full-Adder Constant Multiplier]] – counter-example: equal adder counts, unequal area, so CSD's metric is the wrong one.
- [[Ternary-Adder Constant Multiplier]] – extends: three-input nodes make every constant up to $22$ bits reachable in $\le3$ adders regardless of digit count.
- [[Choosing a Constant Multiplier]] – compares: where CSD sits against tabulation and optimal graphs.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — Chapter 12, "Multiplication by Constants".

- §12.1, eq. 12.1 and Fig. 12.3 (binary, CSD and minimum-adder realizations of $93X$), pp. 366–367
- §12.1.1 signed digit representation, Algorithm 12.1, CSD and MSD, pp. 368–369
- §12.1.2 eq. 12.2, eq. 12.3, CSE and the $25=101_2\cdot101_2$ counter-example, NP-completeness of SCM, p. 369
- §12.1.6 bit-level cost, $49X$ at $25$ versus $16$ FA-equivalents, pp. 380–382
