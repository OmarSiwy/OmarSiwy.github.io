---
title: "Minimum-Adder FIR Filter"
description: "The adder graph an ILP returns when the frequency mask, the coefficient quantisation and the shift-and-add sharing are one problem: 23 adders instead of 37 for the same low-pass spec."
kind: circuit
source: "ASA §23.4.2–23.4.4, pp. 696–702"
status: seed
spade: simulated
tags: [digital, lti-filters, fir, ilp, mcm, optimization]
aliases:
  - Minimum-Adder FIR
  - Minimum Adder FIR Filter
  - FD+Q+I
---

# Minimum-Adder FIR Filter

A linear-phase FIR filter whose coefficients are chosen by the same integer program that chooses its adder graph, so that the only quantity minimised is hardware — adders — subject to the frequency mask, rather than coefficient error.

```tikz title="Minimum-adder FIR: a 4-adder multiplier block feeding a transposed structural chain"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[
  adder/.style={draw, circle, inner sep=0.6pt, minimum size=13pt, font=\small},
  reg/.style={draw, fill=blue!8, minimum width=15pt, minimum height=13pt, inner sep=1pt, font=\scriptsize},
  sig/.style={font=\scriptsize},
  >=latex]

% ---------------- multiplier block: 4 adders ----------------
\node[sig] at (-0.35,1.35) {$x$};
\node[sig] at (-0.35,0.95) {8\,b};
\draw[->] (0.05,1.2) -- (1.15,1.2);
\draw (1.15,-1.35) -- (1.15,3.4);
\fill (1.15,1.2) circle (1.3pt);

\node[adder] (a3)  at (2.9,3.4)  {$+$};
\node[adder] (a5)  at (2.9,2.0)  {$+$};
\node[adder] (a17) at (2.9,0.4)  {$+$};
\node[adder] (a13) at (2.9,-1.35){$+$};

\foreach \n/\yl/\yh in {a3/3.25/3.55, a5/1.85/2.15, a17/0.25/0.55}{
  \draw[->] (1.15,\yh) -- (\n.west |- 0,\yh) -- ([yshift=4pt]\n.west);
  \draw[->] (1.15,\yl) -- (\n.west |- 0,\yl) -- ([yshift=-4pt]\n.west);
}
\node[sig] at (2.1,3.72) {$\ll 0$};
\node[sig] at (2.1,3.05) {$\ll 1$};
\node[sig] at (2.1,2.32) {$\ll 0$};
\node[sig] at (2.1,1.65) {$\ll 2$};
\node[sig] at (2.1,0.72) {$\ll 0$};
\node[sig] at (2.1,0.05) {$\ll 4$};

% 13 = (x<<4) - 3x
\draw[->] (1.15,-1.2) -- ([yshift=4pt]a13.west);
\node[sig] at (2.1,-0.95) {$\ll 4$};
\draw[->] (a3.south) -- (2.9,2.75) -- (0.72,2.75) -- (0.72,-1.5)
          -- ([yshift=-4pt]a13.west);
\node[sig,anchor=west] at (1.3,-1.72) {$-3x$ (reused)};

\draw[->] (a3.east)  -- (4.7,3.4);   \node[sig,anchor=west] at (4.72,3.4)  {$3x$\ \ 10\,b};
\draw[->] (a5.east)  -- (4.7,2.0);   \node[sig,anchor=west] at (4.72,2.0)  {$5x$\ \ 11\,b};
\draw[->] (a17.east) -- (4.7,0.4);   \node[sig,anchor=west] at (4.72,0.4)  {$17x$\ 13\,b};
\draw[->] (a13.east) -- (4.7,-1.35); \node[sig,anchor=west] at (4.72,-1.35){$13x$\ 13\,b};

\draw[dashed] (0.45,-2.05) rectangle (4.65,4.05);
\node[sig,anchor=west] at (0.5,4.35) {multiplier block: 4 adders, odd fundamentals $\{3,5,13,17\}$};

% ---------------- transposed structural chain ----------------
\def\yc{-4.6}
\node[adder] (s1) at (0.9,\yc) {$+$};
\node[reg]   (d1) at (2.1,\yc) {$z^{-1}$};
\node[adder] (s2) at (3.3,\yc) {$+$};
\node[reg]   (d2) at (4.5,\yc) {$z^{-1}$};
\node[adder] (s3) at (5.7,\yc) {$+$};
\node[reg]   (d3) at (6.9,\yc) {$z^{-1}$};
\node[reg]   (d4) at (8.6,\yc) {$z^{-1}$};

\draw[->] (-0.3,\yc) -- (s1.west);
\node[sig,anchor=south] at (0.15,\yc+0.08) {$0$};
\draw[->] (s1) -- (d1); \draw[->] (d1) -- (s2); \draw[->] (s2) -- (d2);
\draw[->] (d2) -- (s3); \draw[->] (s3) -- (d3); \draw[->] (d3) -- (d4);
\draw (d4) -- (9.35,\yc);
\node[sig] at (9.6,\yc) {$\cdots$};
\draw[->] (9.85,\yc) -- (10.4,\yc);
\node[sig,anchor=west] at (10.42,\yc) {$y$\ \ 18\,b};
\node[sig,anchor=south] at (7.75,\yc+0.72) {$h_4=0$: bare wire};

\foreach \n/\lbl in {s1/{$3x\ll 0$}, s2/{$2x = x\ll 1$}, s3/{$-6x = -3x\ll 1$}}{
  \draw[->] ([yshift=0.85cm]\n.north) -- (\n.north);
  \node[sig,anchor=south] at ([yshift=0.87cm]\n.north) {\lbl};
}
\draw[dashed] (-0.35,\yc-0.5) rectangle (10.35,\yc+0.55);
\node[sig,anchor=west] at (-0.35,\yc-0.85) {structural chain: 19 adders, 23 registers, all 18\,b wide};
\end{circuitikz}
\end{document}
```

*after Fig. 23.22b, p. 701; the structural chain is drawn only as far as its first zero coefficient.*

**Name the three steps that a conventional flow runs in sequence.** Filter design decomposes into **FD** — pick real coefficients meeting a frequency mask, classically by [[Remez Minimax]]; **Q** — round those reals to a fixed-point format; and **I** — implement the resulting constants, which for FIR means an instance of [[Multiple Constant Multiplication]] solved by [[Shift-and-Add]]. Each step is a well-studied optimisation on its own, and each hands the next a frozen result. The trouble is that the cost of step I "depends strongly (and in a non-monotonous way) on the coefficient values" (p. 697), which FD and Q have already fixed without ever consulting an adder count.

> [!important]
> Non-monotonicity is the whole argument. If adder cost rose monotonically with coefficient error, a good FD+Q would imply a good I and the sequential flow would be near-optimal. It does not: $256$ costs zero adders and $255$ costs one, while $181$ costs two — so a *worse* approximation of the ideal response is routinely a *cheaper* circuit. Only a joint search can see that.

**Make the frequency constraint linear in the unknown coefficients.** Linear-phase FIR is the tractable case for exactly three reasons (p. 698): applications want it; its coefficients are symmetric, so barely half the multiplications are distinct; and its zero-phase frequency response is real-valued rather than complex, which is what allows it into a linear program at all. For an $n$-th order filter,

$$H_R(\omega)=\sum_{i=0}^{m-1}h_i\,c_i(\omega),\qquad \omega\in[0,\pi] \tag{23.38}$$

where $m$ and the trigonometric $c_i$ follow from the symmetry type (Table 23.1, p. 699): Type I is symmetric with $n$ even, $m=\tfrac{n}{2}+1$ and $c_i(\omega)=2\cos(\omega m)$ for $m>0$; Type II symmetric odd, $c_i=2\cos(\omega(m+\tfrac12))$; Types III and IV antisymmetric with sines. Because $|H(e^{j\omega})|=|H_R(\omega)|$ by (23.39), a mask given as a lower bound $\underline{D}$ and an upper bound $\overline{D}$ is simply

$$\underline{D}(\omega)\le H_R(\omega)\le\overline{D}(\omega)\qquad\forall\,\omega\in[0,\pi] \tag{23.40}$$

which is *linear in the $h_i$* — the $c_i(\omega)$ are constants once $\omega$ is fixed. That linearity is not a modelling convenience, it is the entire reason the mask can be a constraint rather than an objective.

**Discretise $\omega$, then integerise $h$.** Two obstacles remain: (23.40) is an infinite family of constraints, and the $h_i$ are reals. The first is dispatched by evaluating on a finite $\Omega_d\subset[0,\pi]$, for which a uniform grid of $16m$ points "typically proves sufficiently dense" (p. 699) — a heuristic, not a proof. The second by writing every coefficient as a scaled integer

$$h_m = 2^{\ell}C_m \tag{23.41}$$

with the LSB position $\ell$ **fixed in advance and explored outside the ILP**, and $C_m\in\mathbb{Z}$ an integer decision variable. Substituting (23.41) into (23.40) over $\Omega_d$ gives $2|\Omega_d|$ linear inequalities in the $C_m$, and those $C_m$ are precisely the constants the MCM formulation of [[ILP for Arithmetic Design]] takes as *given*. Setting them free is the joint FD+Q+I problem.

**Let the objective count adders, not error.** The cost is the number of additions in the whole filter, in two parts: the MCM adders inside the multiplier block, and the *structural* adders of the summation chain. Counting structural adders in the same objective is what makes a zero coefficient valuable — a tap with $h_k=0$ contributes no product and needs no adder, so it degenerates into a bare wire through the delay line (p. 699). A variable overall gain can also be admitted, since scaling the whole response is free in a mask specification and can move the coefficient set to a cheaper adder graph.

**Read the four adders off the optimal impulse response.** The book's low-pass example (pp. 699–700): $\omega_p=0.3\pi$, passband ripple $\delta_p=0.0157$ so $\overline{D},\underline{D}=1\pm0.0157$; stopband from $\omega_s=0.5\pi$ attenuated at least $-43.6$ dB, i.e. $\overline{D}=0.0066$. The ILP returns coefficients on 10 bits,

$$h_{\text{opt}}=2^{-10}\cdot(3,\,2,\,-6,\,-12,\,0,\,20,\,16,\,-24,\,-52,\,0,\,136,\,256,\,136,\,0,\,-52,\,-24,\,16,\,20,\,0,\,-12,\,-6,\,2,\,3)$$

Factor every nonzero magnitude into an odd part times a power of two, since a power-of-two factor is a wire: $2=2^1$, $16=2^4$, $256=2^8$ are free outright; $6=3\cdot2$, $12=3\cdot4$, $24=3\cdot8$ share one odd fundamental $3$; $20=5\cdot4$; $52=13\cdot4$; $136=17\cdot8$. The distinct odd fundamentals are therefore $\{3,5,13,17\}$, and each is one adder away from $x$:

$$3x=x+(x\!\ll\!1),\quad 5x=x+(x\!\ll\!2),\quad 17x=x+(x\!\ll\!4),\quad 13x=(x\!\ll\!4)-3x$$

The last reuses $3x$ — this is the sharing that makes MCM cheaper than four independent single-constant multipliers. Four odd fundamentals, four adders, matching the book's "just 4 additions". Four of the coefficients are zero, saving four structural adders, leaving 19; total $4+19=23$. The naive route — Remez, then quantise, then MCM — needs 25 coefficients on 12 bits, of which 13 are distinct and 11 nontrivial (the trivial two being $1$ and $4=2^2$); MCM reduces those 11 to 13 adders, and 24 structural adders bring the total to 37. Both filters meet the identical mask (Fig. 23.21, p. 700).

> [!warning] Arithmetic inconsistency in the source
> p. 700 states "24 coefficients on 10 bits", and 19 structural adders is consistent with 24 taps ($24-1-4=19$). The impulse response printed immediately after it carries only 23 values, for which the same count gives $23-1-4=18$. The 4 MCM adders and the $\{3,5,13,17\}$ derivation above are unaffected either way, since the extra tap would be a repeat of $256$.

**Widths, and where they come from.** With an 8-bit input $x$ and 10-bit coefficients the filter is *exact* — no rounding anywhere on the datapath — so the output is $8+10=18$ bits (p. 700), and every structural adder and every delay register in the chain is 18 bits wide. Inside the multiplier block the widths are smaller and unequal: $3x$ needs 10 bits, $5x$ 11, and $13x$ and $17x$ 13. The plain adder-count objective is blind to that spread; see [[Error Accuracy]] for why "exact" here means the circuit realises one specific LTI filter with zero implementation error, and [[Number Formats]] for the fixed-point conventions the $2^{\ell}$ scaling assumes.

> [!warning] No FPGA mapping in the source
> Ch. 23 gives no LUT, slice or DSP-block figures for this construction and defers all constant-multiplication mapping to Ch. 12. A pure adder count is a poor proxy on [[FPGAs]], where an $N$-bit adder costs $N$ LUTs plus carry chain regardless of how the operands were shifted, so the 18-bit structural adders dominate the four narrow MCM adders in area.

$$\boxed{\ \min_{C\in\mathbb{Z}^{m}}\ A_{\text{MCM}}(C)+A_{\text{struct}}(C)\quad\text{s.t.}\quad \underline{D}(\omega)\ \le\ 2^{\ell}\sum_{i=0}^{m-1}C_i\,c_i(\omega)\ \le\ \overline{D}(\omega),\ \ \forall\,\omega\in\Omega_d\ }$$

For the example above this returns $4+19=23$ adders against 37 for the sequential flow — **38 % fewer, from asking one question instead of three.**

**When it breaks.**

- **The output format is not part of the problem.** The result is an exact filter, so its output width is dictated by the coefficient width, not by what the interface of Fig. 23.20 (p. 696) asked for. Rounding it faithfully to 8 bits afterwards is a known, implementable recipe — but the rounded circuit can no longer claim optimality, because truncations would have to be *inside* the MCM problem, which means counting full adders rather than adders. That single global formulation "remains to be written" (p. 702).
- **$\ell$ is a parameter, not a variable.** The coefficient LSB position is fixed before the ILP runs and swept from outside, so "minimum-adder" means minimum given $\ell$ and given the order $n$.
- **The grid $\Omega_d$ is a heuristic.** $16m$ points is dense enough in practice; nothing forbids a mask violation between samples, and a rigorous answer needs the solution re-checked with safe arbitrary-precision arithmetic (p. 696) — which also guards against rounding errors in the FD+Q software itself.
- **Linear phase only.** The real-valued zero-phase response is what makes the mask linear. A general FIR with a complex response does not drop into an LP this way.
- **FIR only, and low order.** For IIR the joint FD+Q+I problem has been formalised but is limited to second-order filters with no bit-level cost model for the shift-and-add trees (p. 697). Higher-order recursive filters and structures like [[Biquad Cascade]] remain open (p. 702).
- **ILP is exponential.** The formulation is exact; the solve is not free, and it scales with $m$, the coefficient width and the adder-depth bound.

## RTL (Spade)

```spade
/// The 4-adder multiplier block the ILP returns for h_opt.
/// Odd fundamentals {3, 5, 13, 17}; every coefficient of the filter is one of
/// these (or x itself) shifted left, so the shifts cost no logic.
fn mult_block(x: int<8>) -> (int<13>, int<13>, int<13>, int<13>) {
    let xs: int<13> = sext(x);
    let x3:  int<13> = trunc(xs + (xs << 1));   // adder 1:  3 = 1 + 2
    let x5:  int<13> = trunc(xs + (xs << 2));   // adder 2:  5 = 1 + 4
    let x17: int<13> = trunc(xs + (xs << 4));   // adder 3: 17 = 1 + 16
    let x13: int<13> = trunc((xs << 4) - x3);   // adder 4: 13 = 16 - 3
    (x3, x5, x13, x17)
}
```

The four `+`/`-` are exactly the four circled adders in the upper dashed box; each `<<` is the wire relabelling drawn on the incoming edges and costs nothing. `x13` reads `x3`, which is the shared node that distinguishes MCM from four separate multipliers. Everything is combinational — the only registers in the filter are the 23 delays of the structural chain, which is the ordinary [[Transposed Direct-Form FIR Filter]] and carries no arithmetic of its own. The common `int<13>` is a convenience for one clean interface: synthesis will trim `x3` to 10 bits and `x5` to 11, so the four adders are unequal in the netlist even though the ILP's objective counted them as equal.

Verified by simulation: all 256 input values plus a 3000-vector random sweep, checked against behavioural `3*x`, `5*x`, `13*x`, `17*x`, 3263 checks with zero failures.

**Related Notes**

- [[ILP for Arithmetic Design]] – depends-on: supplies the MCM integer program that this note makes the coefficients variable in.
- [[Multiple Constant Multiplication]] – extends: MCM with the constants themselves as decision variables instead of inputs.
- [[Shift-and-Add]] – depends-on: the adder-graph primitive whose count is the objective function.
- [[Remez Minimax]] – compares: the classical FD step, and the 37-adder baseline the joint formulation beats.
- [[Linear-Phase FIR Filter]] – depends-on: the coefficient symmetry and real zero-phase response that make the mask linear.
- [[Transposed Direct-Form FIR Filter]] – supports: the structure the 19 structural adders and 23 registers live in.
- [[Choosing a Filter Structure]] – compares: where a minimum-adder FIR sits against the IIR and cascade options.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §23.4.2 "Filter Design as an Optimisation Problem", pp. 696–697.
- §23.4.3 "State of the Art in the Design of Filters Faithful to a Frequency Specification", p. 697.
- §23.4.4 "Frequency Constraints for Linear-Phase FIR Filters in ILP", pp. 698–702; Table 23.1, p. 699; Fig. 23.21, p. 700; Fig. 23.22, p. 701.
