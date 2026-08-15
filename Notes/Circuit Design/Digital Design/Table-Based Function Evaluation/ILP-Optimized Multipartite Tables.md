---
title: "ILP-Optimized Multipartite Tables"
description: "One ILP variable per table entry and two rounding constraints per input value yields correctly rounded table architectures — 5x fewer LUTs than LDTC at 16 bits, and lower latency than a plain ROM."
kind: circuit
source: "ASA §17.2.11, p. 522"
status: seed
spade: simulated
tags: [digital, table-based-function-evaluation, ilp, rounding, multipartite]
aliases:
  - ILP Multipartite
  - ILP-optimized multipartite architecture
  - Correctly Rounded Multipartite
---

# ILP-Optimized Multipartite Tables

A multipartite architecture whose table *contents* are the solution of an integer program rather than the output of an error analysis — which is what lets it be correctly rounded, not merely faithful.

```tikz title="ILP formulation of a multipartite table: table entries as variables on the left, and the pair of inequalities each input code contributes on the right"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ================= panel (a): the constraint graph =================
\node[font=\small,anchor=west] at (-0.8,6.2) {(a) one variable per table entry};
\foreach \i/\y in {0/5.4, 1/4.7, 2/4.0, 3/3.3, 4/2.6}
  \node[draw,thick,minimum width=1.4cm,minimum height=0.42cm,font=\tiny] (t\i) at (0.3,\y) {$\mathrm{TIV}[\i]$};
\node[font=\tiny] at (0.3,2.15) {$\vdots$};
\node[font=\tiny,anchor=north,align=center] at (0.3,1.85) {$2^{\alpha}$ variables\\[-2pt]$w_R{+}g$ bits each};
\foreach \i/\y in {0/5.05, 1/4.35, 2/3.65, 3/2.95}
  \node[draw,thick,minimum width=1.6cm,minimum height=0.42cm,font=\tiny] (o\i) at (4.3,\y) {$\mathrm{TO}[C,B]$};
\node[font=\tiny] at (4.3,2.5) {$\vdots$};
\node[font=\tiny,anchor=north,align=center] at (4.3,2.2) {$2^{\gamma+\beta}$ variables};
\foreach \a/\b in {0/0, 0/1, 1/0, 1/2, 2/1, 2/2, 3/2, 3/3, 4/3}
  \draw[gray!60] (t\a) -- (o\b);
\draw[red!70!black,very thick] (t2) -- (o1);
\node[red!70!black,font=\tiny,anchor=south,align=center] at (2.3,4.55)
  {one input code $X$\\[-2pt]$\Rightarrow$ two inequalities};
\node[font=\tiny,anchor=north,align=center] at (2.3,1.05)
  {$2\cdot 2^{w_X}$ constraints in all --- exponential in $w_X$,\\[-2pt]
   which is why the method stops below 16 bits};
% ================= panel (b): the rounding window =================
\node[font=\small,anchor=west] at (7.4,6.2) {(b) two inequalities per input code};
\draw[->,thick] (8.6,2.3) -- (8.6,5.6);
\foreach \y in {2.7,3.5,4.3,5.1} \draw (8.5,\y) -- (8.7,\y);
\node[font=\tiny,anchor=east] at (8.45,2.7) {$(t{-}1)2^{g}$};
\node[font=\tiny,anchor=east] at (8.45,3.5) {$t\,2^{g}$};
\node[font=\tiny,anchor=east] at (8.45,4.3) {$(t{+}1)2^{g}$};
\fill[green!22] (8.75,3.5) rectangle (11.5,4.3);
\draw[green!50!black,thick] (8.75,3.5) -- (11.5,3.5);
\draw[green!50!black,thick,densely dashed] (8.75,4.3) -- (11.5,4.3);
\draw[blue,thick] (8.75,3.95) -- (11.5,3.95);
\fill[red!70!black] (10.1,3.72) circle (0.09);
\draw[gray] (11.5,3.95) -- (11.75,4.25);
\node[blue,font=\tiny,anchor=west] at (11.8,4.28) {$2^{-\ell_R+g}f(X)$, exact};
\node[green!50!black,font=\tiny,anchor=west] at (11.8,3.9) {legal window, width $2^{g}$};
\draw[gray] (10.1,3.72) -- (11.75,3.52);
\node[red!70!black,font=\tiny,anchor=west] at (11.8,3.5) {$\mathrm{TIV}[A]+\mathrm{TO}[C,B]$};
\draw[->,red!70!black,thick] (9.3,3.05) -- (9.3,3.44);
\node[red!70!black,font=\tiny,anchor=north west] at (9.15,3.02) {$\ \ge t\,2^{g}$};
\draw[->,red!70!black,thick] (9.3,4.75) -- (9.3,4.36);
\node[red!70!black,font=\tiny,anchor=south west] at (9.15,4.78) {$\ <(t{+}1)2^{g}$};
\node[font=\tiny,anchor=north,align=center] at (10.6,2.4)
  {$t=\left\lfloor 2^{-\ell_R}f(X)+\tfrac12\right\rfloor$ is the correctly rounded result,\\[-2pt]
   so the window is exactly the set of sums whose top $w_R$ bits are $t$:\\[-2pt]
   dropping the $g$ guard bits becomes a bare truncation, no rounding constant};
\end{circuitikz}
\end{document}
```

**Swap the error budget for a constraint system.** The analytic construction in [[Multipartite Methods]] fills each table from a closed form and then *proves* the result faithful by bounding $\delta_{\text{approx}}$ and $\delta_{\text{round}}$ separately and adding them. Those two errors are not independent — the discretization of a table entry can cancel the approximation error of the segment it serves — so summing worst cases double-counts, and faithfulness ($<1$ ulp) is the strongest claim the sum will support. The ILP formulation deletes the intermediate quantities entirely: the $2^\alpha+\sum_i 2^{\gamma_i+\beta_i}$ table entries become integer decision variables, and the only thing asserted is the property you actually want, evaluated at every input code.

**Write the constraint down at guard precision.** Let $t(X)=\lfloor 2^{-\ell_R}f(X)+\tfrac12\rfloor$ be the correctly rounded result of the input code $X$, an integer at weight $\ell_R$. Tables are filled at $\ell_R-g$, so the architecture's pre-truncation sum $S(X)$ is an integer at weight $\ell_R-g$, and the hardware emits $\lfloor S(X)2^{-g}\rfloor$. Demanding $\lfloor S(X)2^{-g}\rfloor = t(X)$ is, **by the definition of floor division on non-negative integers**, exactly the pair of linear inequalities $t\,2^{g}\le S(X)<(t+1)2^{g}$ — panel (b). Two constraints per input value, $2\cdot2^{w_X}$ in total, each touching $m+1$ variables: one TIV entry addressed by the top $\alpha$ bits of $X$, and one entry of each $\mathrm{TO}_i$ addressed by $C_i\Vert B_i$. Replace $t$ by the pair $\lfloor\cdot\rfloor,\lceil\cdot\rceil$ of admissible faithful results and you get the faithful version of the same program, which the book reports gives "slightly smaller" architectures than the analytic search (p. 522).

**Notice what disappears from the datapath.** Because the window is *defined* as the set of sums whose top $w_R$ bits equal $t$, the final rounding is a bare truncation — no half-ulp constant, no incrementer. The analytic method reaches the same place by the [[HUB Table Filling|HUB]] accounting trick, folding one surviving half-ulp into the TIV at fill time; the ILP gets it for free because the constraint was written on the truncated output in the first place. The guard bits $g$ are no longer computed from a budget formula either — they are a free parameter of the program, and you solve for the smallest $g$ that is feasible.

**For $m=1$ the program is not really an ILP.** Each constraint of a bipartite ($m=1$) instance touches exactly two variables, so writing $w_j=-\mathrm{TO}[j]$ turns every row into $L\le u_A-w_j\le U$: a system of *difference constraints*, whose feasibility is decided in polynomial time by Bellman–Ford on the bipartite graph of panel (a), a negative cycle certifying infeasibility. That is a property of $m=1$ only. From $m=2$ upward each row has $m+1\ge3$ variables, the totally-unimodular structure is gone, and you are back to a genuine integer program. This is why the technique is presented as ILP rather than as a shortest-path algorithm, and it explains where the difficulty actually lives.

**Feasibility is a real constraint, not a formality.** Solving the $m=1$ system for $f(x)=\sin(\pi x/4)$, $w_X=w_R=8$, $\ell_X=\ell_R=-8$: the decomposition $\alpha=5,\beta=3,\gamma=3$ — the one the analytic search picks for *faithful* rounding, at 416 table bits and $0.9076$ ulp — has a negative cycle for every $g$ from $0$ to $5$. Correct rounding is simply unreachable with three slope bits there. Moving to $\alpha=6,\beta=2,\gamma=2,g=2$ is feasible, and yields

$$\mathrm{TIV}:\ 2^{6}\times8\ \text{bits}=512,\qquad \mathrm{TO}:\ 2^{2+2}\times10\ \text{bits}=160,\qquad \textbf{672 bits total}$$

against $2^8\times8=2048$ for the plain ROM (a factor $3.05$) and $992$ bits for the same function under [[LDTC, Lossless Differential Table Compression|LDTC]] (a factor $1.48$) — all three correctly rounded, so this is a like-for-like comparison. The last half ulp is not free: the faithful analytic bipartite needs only $416$ bits, so correct rounding costs about $1.6\times$ the table here. All numbers in this paragraph are computed here, not from the book; see [[Number Formats]] for the fixed-point conventions and [[Error Accuracy]] for what "correctly rounded" quantifies over.

**The solver does not respect the semantic roles of TIV and TO.** In that solution the TO holds $\{0,3,6,9\ \vert\ 192,196,199,201\ \vert\ 371,374,377,380\ \vert\ 527,529,532,534\}$ — the per-segment *base value* of $f$, in blocks of four — while the TIV carries the fine detail and spans only $8$ bits instead of the analytic $w_R+g=10$. Analytically the TIV holds $f$ and the TO holds the correction $s(C)\times B$; the ILP sees only a sum and will move an arbitrary constant across the two tables, because $\mathrm{TIV}[A]+k$ and $\mathrm{TO}[j]-k$ satisfy the same constraints. That degeneracy is also a lever: it is precisely what lets a cost function shrink one table's *width* at the other's expense, and it is why the objective, not the feasibility test, is the hard part.

> [!important] A correctly rounded multipartite operator is a lossless table compression scheme
> It reproduces the plain ROM's output bit for bit at every one of the $2^{w_X}$ input codes, so it can be dropped in wherever a ROM of $f$ was — the same status [[LDTC, Lossless Differential Table Compression|LDTC]] enjoys, but reached by approximation machinery rather than by differencing. On 16-bit functions with all tables in [[Lookup-Tables|LUTs]], the book reports LUT count falling by a **factor 5 against LDTC** (p. 522).

**And it is faster, which is the surprise.** More tables and more addends mean a larger [[Compressor Trees|compressor tree]], so the naive expectation is that compression is bought with latency. Measured on [[FPGAs]], the latency of the multipartite-compressed table comes out *below* that of the plain table — the book attributes this to routing: a more compact solution occupies fewer tiles and its wires are shorter (p. 523). Win-win compression is rare enough in this chapter to be worth remembering; everywhere else in [[Choosing a Table Method]] you are trading area against delay.

$$\boxed{\ \forall X:\quad t(X)\,2^{g}\ \le\ \mathrm{TIV}[A]+\sum_{i=0}^{m-1}\mathrm{TO}_i[C_i,B_i]\ <\ \bigl(t(X)+1\bigr)2^{g},\qquad t(X)=\left\lfloor 2^{-\ell_R}f(X)+\tfrac12\right\rfloor\ }$$

**Where it stops paying.**

- **$w_X\ge16$.** The program has $2\cdot2^{w_X}$ rows, so it grows exponentially in the input width; the book caps the approach "at less than 16 bits" and calls the work in progress (p. 522). Above that, the analytic search of [[Multipartite Methods]] is the only thing that runs, and above 24 bits you leave tables entirely for [[Polynomial Approximation]].
- **The objective, not the constraints.** Table *bits* are $\text{entries}\times\lceil\log_2(\max-\min+1)\rceil$ — a nonlinear function of the variables, and degenerate under the constant shift described above. The book says explicitly that expressing the cost function needs "some ILP engineering" and was unfinished at press time. Feasibility is easy; optimality is the open part.
- **Infeasible decompositions.** A parameter set that comfortably supports faithful rounding may admit no correctly rounded filling at all, at any $g$ — verified above for $\alpha=5,\beta=3,\gamma=3$ on $\sin(\pi x/4)$. The search must therefore re-enumerate $\mathcal{D}$, and each candidate now costs a solver call rather than a few floating-point operations.
- **Monotonicity is still not implied.** Correct rounding of a monotonic $f$ *does* give a monotonic operator, so this formulation happens to dissolve the problem of [[Monotonic Multipartite Tables]] — but only in the correctly rounded mode. Ask for faithful rounding and the two-legal-outputs-per-code freedom returns, and with it the possibility of a backwards step.
- **Nothing changes structurally.** The synthesised datapath is the same $m+1$ ROMs, compressor tree and final adder as the analytic version. If your bottleneck is the adder or the BRAM granularity rather than the table contents, this technique has nothing to offer.

**RTL.**

The $\alpha=6,\beta=2,\gamma=2,g=2$ solution above, as a combinational operator. The array literals *are* the solver output — this is the whole point: the architecture is ordinary, the contents are not.

```spade
entity ilp_bipartite8(x: uint<8>) -> uint<8> {
    let tiv: [uint<8>; 64] = [
        2, 14, 27, 39, 52, 64, 77, 90, 102, 115, 127, 139, 152, 164, 177, 189,
        8, 22, 34, 46, 58, 71, 83, 95, 107, 119, 131, 143, 154, 166, 178, 189,
        22, 34, 45, 57, 68, 79, 91, 102, 113, 123, 135, 146, 157, 167, 178, 189,
        44, 54, 64, 75, 84, 95, 104, 115, 124, 134, 143, 153, 163, 171, 181, 189
    ];
    let to: [uint<10>; 16] = [
        0, 3, 6, 9, 192, 196, 199, 201,
        371, 374, 377, 380, 527, 529, 532, 534
    ];
    let bits = x.as_bits();
    let a = bits[2..8].as_uint();
    let c = bits[6..8].as_uint();
    let b = bits[0..2].as_uint();
    let s: uint<10> = zext::<8, 10>(tiv[a]) +. to[c.concat(b)];
    s.as_bits()[2..10].as_uint()
}
```

`a` is the TIV address (the $\alpha=6$ high bits), `c.concat(b)` the TO address ($\gamma=2$ high bits over $\beta=2$ low bits, `concat` placing `c` high). `s` is the pre-truncation sum $S(X)$ at weight $\ell_R-g=-10$; the truncating `+.` is safe because $\max\mathrm{TIV}+\max\mathrm{TO}=189+534=723<1024$, verified over the whole table rather than assumed. The final `bits[2..10]` is the guard-bit truncation — no rounding constant anywhere, exactly as the constraint promised. Synthesis will not build two ROMs: both arrays collapse into LUT logic and the adder merges with the second table's output logic, which is the effect that makes the measured LUT count fall below the bit count.

Simulated with `.zettel/sim.sh` against `256.0*$sin(pi*X/1024)` computed in Verilog reals: **3262 vectors, zero mismatches** — all 256 input codes exhaustively, plus 3000 random, plus the asymmetric named vectors $X=1,3,45,64,128,255$. Every output matched the correctly rounded reference, which is the only check that distinguishes this operator from the faithful one it replaces.

**Related notes.**

- [[Multipartite Methods]] – extends: same datapath, same decomposition $\mathcal{D}$; this replaces the analytic table-filling and error budget with a constraint system.
- [[ILP for Arithmetic Design]] – depends-on: the general framing of arithmetic operator design as an integer program, and the solver engineering that limits it.
- [[LDTC, Lossless Differential Table Compression]] – compares: the other lossless compression of a ROM, and the baseline the factor-5 LUT figure is measured against.
- [[Bipartite Table Method]] – compares: the $m=1$ instance, where the constraint system degenerates into a difference system and the ILP is not needed.
- [[Monotonic Multipartite Tables]] – supports: correct rounding of a monotonic function removes the non-monotonicity problem outright, at no extra constraint.
- [[HUB Table Filling]] – compares: the analytic route to the same zero-cost final truncation, via one surviving implicit half-ulp.
- [[Compressor Trees]] – depends-on: the larger addend count this method produces has to be summed somewhere, and that is where its area goes.
- [[Choosing a Table Method]] – compares: where a correctly rounded table architecture sits against a plain ROM and against polynomial evaluation.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 17 "Function Evaluation Using Tables and Additions".

- Sect. 17.2.11 "Toward ILP-Optimized Multipartite Architectures", p. 522 — the formulation (one variable per table entry, two constraints per input value), the sub-16-bit limit, the unfinished cost function, faithful-versus-correct rounding, and the factor-5 LUT figure against LDTC
- Sect. 17.2.11 continued, p. 523 — latency of the compressed table below that of the plain table, attributed to routing
- Sect. 17.2.10 "Non-monotonicity", pp. 521–522 — the two-legal-outputs freedom that correct rounding removes
- Sect. 17.2.7 "Filling the tables using HUB format", pp. 517–518 — the analytic route to a truncation-only final rounding
- Sect. 17.1.5, p. 502 — the LDTC size of the 8-bit $\sin(\pi x/4)$ table used as a baseline above

Cited work: [DD22] (ILP multipartite), [De+17] (ILP for other function-approximation techniques).

The $w_X=w_R=8$ instance, its infeasibility result, its table contents and its 672-bit figure are computed here by Bellman–Ford feasibility on the $m=1$ difference system, and verified exhaustively over all 256 input codes.
